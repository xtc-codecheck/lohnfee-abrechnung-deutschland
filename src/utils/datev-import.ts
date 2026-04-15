/**
 * DATEV Lohn & Gehalt Import Parser
 * 
 * Unterstützt drei DATEV-Exportformate:
 * 1. ASCII Stammdaten (SD) — Semikolon-CSV mit ~200 Feldern
 * 2. ASCII Lohnarten (LA) — Semikolon-CSV mit Bewegungsdaten
 * 3. Personalstammdaten (Fließtext) — Schlüssel-Wert-Paare
 */

export interface DatevEmployee {
  personalNumber: string;
  lastName: string;
  firstName: string;
  dateOfBirth?: string; // ISO
  gender?: string;
  street?: string;
  zipCode?: string;
  city?: string;
  iban?: string;
  bic?: string;
  svNumber?: string;
  taxId?: string;
  taxClass?: number;
  churchTax?: boolean;
  churchTaxDenomination?: string;
  childrenAllowance?: number;
  healthInsurance?: string;
  grossSalary?: number;
  weeklyHours?: number;
  entryDate?: string; // ISO
  exitDate?: string; // ISO
  employmentType?: string;
  position?: string;
  department?: string;
  /** Quellformat */
  source: 'SD' | 'personalstamm';
}

export interface DatevLohnart {
  personalNumber: string;
  lastName: string;
  firstName: string;
  lohnartNr: number;
  bezeichnung: string;
  menge?: number;
  betrag: number;
  steuerpflichtig?: string;
  svPflichtig?: string;
}

export interface DatevImportResult {
  employees: DatevEmployee[];
  lohnarten: DatevLohnart[];
  warnings: string[];
  fileType: 'SD' | 'LA' | 'personalstamm' | 'unknown';
}

// ─── Helpers ──────────────────────────────────────────

function parseDecimal(val: string | undefined): number | undefined {
  if (!val || val.trim() === '') return undefined;
  const cleaned = val.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : n;
}

function parseDatevDate(val: string | undefined): string | undefined {
  if (!val || val.trim() === '') return undefined;
  // dd.mm.yyyy → yyyy-mm-dd
  const m = val.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return undefined;
}

function stripQuotes(val: string): string {
  if (val.startsWith('"') && val.endsWith('"')) {
    return val.slice(1, -1).replace(/""/g, '"');
  }
  return val;
}

function parseSemicolonCSV(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ';' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

// ─── Format Detection ─────────────────────────────────

export function detectDatevFormat(content: string): 'SD' | 'LA' | 'personalstamm' | 'unknown' {
  const firstLine = content.split('\n')[0] || '';
  if (firstLine.includes('"Beraternummer"') && firstLine.includes('"Personalnummer"')) {
    if (firstLine.includes('"Lohnart"')) return 'LA';
    if (firstLine.includes('"Familienname"') && firstLine.includes('"Standardentlohnung"')) return 'SD';
    // Fallback for SD-like
    if (firstLine.includes('"Familienname"')) return 'SD';
  }
  if (content.trimStart().startsWith('Adresse / Name') || /^\s*Mitarbeiternummer\s+\d+/m.test(content)) {
    return 'personalstamm';
  }
  return 'unknown';
}

// ─── SD Parser ────────────────────────────────────────

export function parseDatevStammdatenASCII(content: string): DatevImportResult {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { employees: [], lohnarten: [], warnings: ['Keine Datenzeilen gefunden'], fileType: 'SD' };

  const headerFields = parseSemicolonCSV(lines[0]);
  const headerMap = new Map<string, number>();
  headerFields.forEach((h, i) => headerMap.set(stripQuotes(h).trim(), i));

  const col = (row: string[], name: string): string => {
    const idx = headerMap.get(name);
    if (idx === undefined || idx >= row.length) return '';
    return stripQuotes(row[idx]).trim();
  };

  const employees: DatevEmployee[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseSemicolonCSV(lines[i]);
    const pnr = col(fields, 'Personalnummer');
    if (!pnr) continue;

    const lastName = col(fields, 'Familienname');
    const firstName = col(fields, 'Vorname');
    if (!lastName && !firstName) {
      warnings.push(`Zeile ${i + 1}: Kein Name für Personal-Nr ${pnr}`);
      continue;
    }

    // Map tax class from Steuerklasse field or embedded value
    let taxClass: number | undefined;

    const grossStr = col(fields, 'Standardentlohnung');
    const grossSalary = parseDecimal(grossStr);

    // Map gender
    const genderRaw = col(fields, 'Geschlecht');
    let gender: string | undefined;
    if (genderRaw.toLowerCase().includes('weiblich') || genderRaw === 'W') gender = 'weiblich';
    else if (genderRaw.toLowerCase().includes('männlich') || genderRaw.toLowerCase().includes('m') || genderRaw === 'M') gender = 'männlich';

    // Health insurance from Krankenkasse column or nearby
    const kk = col(fields, 'Krankenkasse') || col(fields, 'KK-Zusatzinformation');

    // Extract weekly hours
    const weeklyHoursRaw = col(fields, 'Wöchentliche Arbeitszeit');
    const weeklyHours = parseDecimal(weeklyHoursRaw);

    const employee: DatevEmployee = {
      personalNumber: pnr.replace(/^0+/, ''),
      lastName,
      firstName,
      dateOfBirth: parseDatevDate(col(fields, 'Geburtsdatum')),
      gender,
      street: col(fields, 'Straße/Postfach') || col(fields, 'Straße/Postfach'),
      zipCode: col(fields, 'PLZ'),
      city: col(fields, 'Ort'),
      iban: col(fields, 'IBAN'),
      bic: col(fields, 'BIC'),
      svNumber: col(fields, 'Versicherungsnummer'),
      entryDate: parseDatevDate(col(fields, 'Eintrittsdatum')) || parseDatevDate(col(fields, 'Datum erster Eintritt')),
      exitDate: parseDatevDate(col(fields, 'Austrittsdatum')),
      grossSalary,
      healthInsurance: kk || undefined,
      weeklyHours,
      position: col(fields, 'Berufsbezeichnung') || undefined,
      taxClass,
      source: 'SD',
    };

    // Try to find Lohnarten embedded in SD (columns like 2000, 2480, etc.)
    if (!employee.grossSalary) {
      // Search for field patterns like lohnart nr = 2000 followed by amount
      for (let fi = 0; fi < fields.length - 1; fi++) {
        const fv = stripQuotes(fields[fi]).trim();
        if (fv === '2000') {
          const amount = parseDecimal(stripQuotes(fields[fi + 1]).trim());
          if (amount && amount > 0) {
            employee.grossSalary = amount;
            break;
          }
        }
      }
    }

    employees.push(employee);
  }

  return { employees, lohnarten: [], warnings, fileType: 'SD' };
}

// ─── LA Parser ────────────────────────────────────────

export function parseDatevLohnarten(content: string): DatevImportResult {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { employees: [], lohnarten: [], warnings: ['Keine Lohnarten gefunden'], fileType: 'LA' };

  const headerFields = parseSemicolonCSV(lines[0]);
  const headerMap = new Map<string, number>();
  headerFields.forEach((h, i) => headerMap.set(stripQuotes(h).trim(), i));

  const col = (row: string[], name: string): string => {
    const idx = headerMap.get(name);
    if (idx === undefined || idx >= row.length) return '';
    return stripQuotes(row[idx]).trim();
  };

  const lohnarten: DatevLohnart[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseSemicolonCSV(lines[i]);
    const pnr = col(fields, 'Personalnummer');
    if (!pnr) continue;

    const lohnartNr = parseInt(col(fields, 'Lohnart'), 10);
    if (isNaN(lohnartNr)) continue;

    lohnarten.push({
      personalNumber: pnr.replace(/^0+/, ''),
      lastName: col(fields, 'Familienname'),
      firstName: col(fields, 'Vorname'),
      lohnartNr,
      bezeichnung: col(fields, 'Bezeichnung'),
      menge: parseDecimal(col(fields, 'Menge')),
      betrag: parseDecimal(col(fields, 'Betrag')) ?? 0,
      steuerpflichtig: col(fields, 'ST') || undefined,
      svPflichtig: col(fields, 'SV') || undefined,
    });
  }

  // Derive employees from LA (unique by personalNumber)
  const empMap = new Map<string, DatevEmployee>();
  for (const la of lohnarten) {
    if (!empMap.has(la.personalNumber)) {
      empMap.set(la.personalNumber, {
        personalNumber: la.personalNumber,
        lastName: la.lastName,
        firstName: la.firstName,
        source: 'SD',
      });
    }
    // Set gross salary from Lohnart 2000 (Gehalt)
    if (la.lohnartNr === 2000 && la.betrag > 0) {
      const emp = empMap.get(la.personalNumber)!;
      emp.grossSalary = la.betrag;
    }
  }

  return { employees: Array.from(empMap.values()), lohnarten, warnings, fileType: 'LA' };
}

// ─── Personalstamm Parser (Fließtext) ─────────────────

export function parseDatevPersonalstamm(content: string): DatevImportResult {
  const warnings: string[] = [];

  // Extract key-value pairs
  const extract = (key: string): string | undefined => {
    // Match "  Key                    Value" pattern, handling multi-word keys
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^\\s*${escaped}\\s{2,}(.+?)$`, 'm');
    const m = content.match(regex);
    return m ? m[1].trim() : undefined;
  };

  const extractWithDate = (key: string): string | undefined => {
    // For fields like "Steuerklasse / gültig ab  5 / 08/2019"
    // Get the LAST occurrence (most recent)
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^\\s*${escaped}[^\n]*?\\s{2,}(.+?)$`, 'gm');
    let last: string | undefined;
    let m2;
    while ((m2 = regex.exec(content)) !== null) {
      last = m2[1].trim();
    }
    return last;
  };

  const personalNumber = extract('Mitarbeiternummer');
  if (!personalNumber) {
    return { employees: [], lohnarten: [], warnings: ['Keine Mitarbeiternummer gefunden'], fileType: 'personalstamm' };
  }

  const lastName = extract('Familienname') || '';
  const firstName = extract('Vorname') || '';

  // Tax class — get latest value
  const taxClassRaw = extractWithDate('Steuerklasse / g');
  let taxClass: number | undefined;
  if (taxClassRaw) {
    const tcMatch = taxClassRaw.match(/^(\d)/);
    if (tcMatch) taxClass = parseInt(tcMatch[1], 10);
  }

  // Church tax
  const konfession = extractWithDate('Konfession AN / g');
  let churchTax = false;
  let churchTaxDenomination: string | undefined;
  if (konfession && !konfession.toLowerCase().includes('keine') && konfession.trim() !== '') {
    churchTax = true;
    if (konfession.includes('rk') || konfession.toLowerCase().includes('katholisch')) {
      churchTaxDenomination = 'rk';
    } else if (konfession.includes('ev') || konfession.toLowerCase().includes('evangelisch')) {
      churchTaxDenomination = 'ev';
    }
  }

  // Children
  const childrenRaw = extractWithDate('Kinderfreibetrag / g');
  let childrenAllowance: number | undefined;
  if (childrenRaw) {
    const childMatch = childrenRaw.match(/([\d,]+)/);
    if (childMatch) childrenAllowance = parseDecimal(childMatch[1]);
  }

  // Weekly hours
  const hoursRaw = extractWithDate('Arbeitszeit / g');
  let weeklyHours: number | undefined;
  if (hoursRaw) {
    const hMatch = hoursRaw.match(/([\d,]+)/);
    if (hMatch) weeklyHours = parseDecimal(hMatch[1]);
  }

  // Health insurance
  const kkName = extractWithDate('Krankenkassenbezeichnung / g');
  let healthInsurance: string | undefined;
  if (kkName) {
    const kkMatch = kkName.match(/^(.+?)\s*\//);
    healthInsurance = kkMatch ? kkMatch[1].trim() : kkName;
  }

  // Gender
  const genderRaw = extract('Geschlecht');
  let gender: string | undefined;
  if (genderRaw) {
    if (genderRaw.toLowerCase().includes('weiblich')) gender = 'weiblich';
    else if (genderRaw.toLowerCase().includes('nnlich')) gender = 'männlich';
  }

  const employee: DatevEmployee = {
    personalNumber: personalNumber.replace(/^0+/, ''),
    lastName,
    firstName,
    dateOfBirth: parseDatevDate(extract('Geburtsdatum')),
    gender,
    street: [extract('Straße') || extract('Straße'), extract('Hausnummer')].filter(Boolean).join(' ') || undefined,
    zipCode: extract('Postleitzahl'),
    city: extract('Ort'),
    iban: extract('IBAN'),
    bic: extract('BIC'),
    svNumber: (() => {
      const sv = extract('Versicherungsnummer / g');
      if (sv) {
        const svMatch = sv.match(/^(\S+)/);
        return svMatch ? svMatch[1] : sv;
      }
      return undefined;
    })(),
    taxId: extract('IdNr'),
    taxClass,
    churchTax,
    churchTaxDenomination,
    childrenAllowance,
    healthInsurance,
    weeklyHours,
    entryDate: parseDatevDate(extract('Eintrittsdatum')),
    exitDate: parseDatevDate(extract('Austrittsdatum')),
    position: (() => {
      const raw = extractWithDate('Berufsbezeichnung / g');
      if (raw) {
        const m2 = raw.match(/^(.+?)\s*\//);
        return m2 ? m2[1].trim() : raw;
      }
      return undefined;
    })(),
    source: 'personalstamm',
  };

  // Validate required fields
  if (!employee.lastName) warnings.push('Familienname fehlt');
  if (!employee.firstName) warnings.push('Vorname fehlt');

  return { employees: [employee], lohnarten: [], warnings, fileType: 'personalstamm' };
}

// ─── Master Parse Function ────────────────────────────

export function parseDatevFile(content: string): DatevImportResult {
  const format = detectDatevFormat(content);
  switch (format) {
    case 'SD': return parseDatevStammdatenASCII(content);
    case 'LA': return parseDatevLohnarten(content);
    case 'personalstamm': return parseDatevPersonalstamm(content);
    default:
      return { employees: [], lohnarten: [], warnings: ['Unbekanntes Dateiformat'], fileType: 'unknown' };
  }
}

// ─── Merge Results ────────────────────────────────────

export function mergeDatevResults(results: DatevImportResult[]): DatevImportResult {
  const empMap = new Map<string, DatevEmployee>();
  const allLohnarten: DatevLohnart[] = [];
  const allWarnings: string[] = [];

  for (const result of results) {
    allWarnings.push(...result.warnings);
    allLohnarten.push(...result.lohnarten);

    for (const emp of result.employees) {
      const existing = empMap.get(emp.personalNumber);
      if (existing) {
        // Merge: prefer personalstamm data over SD/LA (more detailed)
        const merged: DatevEmployee = {
          ...existing,
          ...Object.fromEntries(
            Object.entries(emp).filter(([, v]) => v !== undefined && v !== '')
          ),
          // Keep the more detailed source
          source: emp.source === 'personalstamm' ? 'personalstamm' : existing.source,
        };
        empMap.set(emp.personalNumber, merged);
      } else {
        empMap.set(emp.personalNumber, { ...emp });
      }
    }
  }

  return {
    employees: Array.from(empMap.values()),
    lohnarten: allLohnarten,
    warnings: allWarnings,
    fileType: results[0]?.fileType ?? 'unknown',
  };
}

// ─── Map to DB format ─────────────────────────────────

export interface DatevEmployeeDbRow {
  personal_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  street?: string;
  zip_code?: string;
  city?: string;
  iban?: string;
  bic?: string;
  sv_number?: string;
  tax_id?: string;
  tax_class?: number;
  church_tax: boolean;
  church_tax_rate?: number;
  children_allowance?: number;
  health_insurance?: string;
  gross_salary: number;
  weekly_hours?: number;
  entry_date?: string;
  exit_date?: string;
  position?: string;
  employment_type: string;
  is_active: boolean;
}

export function mapToDbRow(emp: DatevEmployee): DatevEmployeeDbRow {
  // Determine church tax rate from denomination
  let churchTaxRate = 0;
  if (emp.churchTax) {
    churchTaxRate = 9; // Default for most states
  }

  // Determine employment type
  let employmentType = 'vollzeit';
  if (emp.weeklyHours !== undefined) {
    if (emp.weeklyHours < 10) employmentType = 'minijob';
    else if (emp.weeklyHours < 35) employmentType = 'teilzeit';
  }
  if (emp.grossSalary !== undefined && emp.grossSalary <= 556) {
    employmentType = 'minijob';
  }

  // Determine if active
  const isActive = !emp.exitDate || new Date(emp.exitDate) > new Date();

  return {
    personal_number: emp.personalNumber,
    first_name: emp.firstName,
    last_name: emp.lastName,
    date_of_birth: emp.dateOfBirth,
    gender: emp.gender,
    street: emp.street,
    zip_code: emp.zipCode,
    city: emp.city,
    iban: emp.iban,
    bic: emp.bic,
    sv_number: emp.svNumber,
    tax_id: emp.taxId,
    tax_class: emp.taxClass,
    church_tax: emp.churchTax ?? false,
    church_tax_rate: churchTaxRate,
    children_allowance: emp.childrenAllowance,
    health_insurance: emp.healthInsurance,
    gross_salary: emp.grossSalary ?? 0,
    weekly_hours: emp.weeklyHours,
    entry_date: emp.entryDate,
    exit_date: emp.exitDate,
    position: emp.position,
    employment_type: employmentType,
    is_active: isActive,
  };
}
