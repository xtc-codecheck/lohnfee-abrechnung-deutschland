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
  churchTaxRate?: number;
  childrenAllowance?: number;
  healthInsurance?: string;
  healthInsuranceNumber?: string;
  grossSalary?: number;
  weeklyHours?: number;
  entryDate?: string; // ISO
  exitDate?: string; // ISO
  employmentType?: string;
  position?: string;
  department?: string;
  state?: string;
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
  // Also handle ddmmyyyy
  const m2 = val.trim().match(/^(\d{2})(\d{2})(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
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

/**
 * Normalize a string for fuzzy header matching:
 * lowercase, remove umlauts, ß, and extra whitespace
 */
function normalizeHeader(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── PLZ → Bundesland Mapping ─────────────────────────

const PLZ_BUNDESLAND_MAP: [number, number, string][] = [
  [1, 9, 'Sachsen'], // 01-09 Ost
  [10, 12, 'Berlin'],
  [13, 16, 'Brandenburg'],
  [17, 19, 'Mecklenburg-Vorpommern'],
  [20, 22, 'Hamburg'],
  [23, 24, 'Schleswig-Holstein'],
  [25, 25, 'Schleswig-Holstein'],
  [26, 27, 'Niedersachsen'],
  [28, 28, 'Bremen'],
  [29, 29, 'Niedersachsen'],
  [30, 31, 'Niedersachsen'],
  [32, 33, 'Nordrhein-Westfalen'],
  [34, 34, 'Hessen'],
  [35, 36, 'Hessen'],
  [37, 37, 'Niedersachsen'],
  [38, 39, 'Niedersachsen'],
  [40, 42, 'Nordrhein-Westfalen'],
  [44, 48, 'Nordrhein-Westfalen'],
  [49, 49, 'Niedersachsen'],
  [50, 53, 'Nordrhein-Westfalen'],
  [54, 56, 'Rheinland-Pfalz'],
  [57, 57, 'Nordrhein-Westfalen'],
  [58, 59, 'Nordrhein-Westfalen'],
  [60, 63, 'Hessen'],
  [64, 65, 'Hessen'],
  [66, 66, 'Saarland'],
  [67, 67, 'Rheinland-Pfalz'],
  [68, 69, 'Baden-Württemberg'],
  [70, 76, 'Baden-Württemberg'],
  [77, 79, 'Baden-Württemberg'],
  [80, 83, 'Bayern'],
  [84, 87, 'Bayern'],
  [88, 88, 'Baden-Württemberg'],
  [89, 89, 'Baden-Württemberg'],
  [90, 96, 'Bayern'],
  [97, 97, 'Bayern'],
  [98, 99, 'Thüringen'],
  [43, 43, 'Nordrhein-Westfalen'],
];

export function plzToBundesland(plz: string | undefined): string | undefined {
  if (!plz || plz.length < 2) return undefined;
  const prefix = parseInt(plz.substring(0, 2), 10);
  if (isNaN(prefix)) return undefined;
  for (const [from, to, state] of PLZ_BUNDESLAND_MAP) {
    if (prefix >= from && prefix <= to) return state;
  }
  return undefined;
}

// ─── Church tax denomination → rate mapping ───────────

function churchTaxRateForState(state?: string): number {
  // Bayern and Baden-Württemberg: 8%, all others: 9%
  if (state === 'Bayern' || state === 'Baden-Württemberg') return 8;
  return 9;
}

// ─── Konfession mapping ──────────────────────────────

function parseKonfession(val: string | undefined): { churchTax: boolean; denomination?: string } {
  if (!val || val.trim() === '' || val.trim() === '0') return { churchTax: false };
  const v = val.trim().toLowerCase();
  if (v === 'keine' || v === 'kein' || v === 'vd' || v === '--' || v === '-') return { churchTax: false };
  if (v.includes('rk') || v.includes('katholisch') || v.includes('röm')) return { churchTax: true, denomination: 'rk' };
  if (v.includes('ev') || v.includes('evangelisch') || v.includes('lt')) return { churchTax: true, denomination: 'ev' };
  // Any other value means church tax applies
  return { churchTax: true, denomination: v };
}

// ─── Format Detection ─────────────────────────────────

export function detectDatevFormat(content: string): 'SD' | 'LA' | 'personalstamm' | 'unknown' {
  const firstLine = content.split('\n')[0] || '';
  const normalizedFirst = normalizeHeader(firstLine);
  
  if (normalizedFirst.includes('beraternummer') && normalizedFirst.includes('personalnummer')) {
    if (normalizedFirst.includes('lohnart')) return 'LA';
    if (normalizedFirst.includes('familienname')) return 'SD';
  }
  if (content.trimStart().startsWith('Adresse / Name') || /^\s*Mitarbeiternummer\s+\d+/m.test(content)) {
    return 'personalstamm';
  }
  return 'unknown';
}

// ─── SD Parser (with fuzzy column matching) ───────────

export function parseDatevStammdatenASCII(content: string): DatevImportResult {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { employees: [], lohnarten: [], warnings: ['Keine Datenzeilen gefunden'], fileType: 'SD' };

  const headerFields = parseSemicolonCSV(lines[0]);
  
  // Build TWO maps: exact and normalized for fuzzy matching
  const headerMapExact = new Map<string, number>();
  const headerMapNorm = new Map<string, number>();
  headerFields.forEach((h, i) => {
    const exact = stripQuotes(h).trim();
    headerMapExact.set(exact, i);
    headerMapNorm.set(normalizeHeader(exact), i);
  });

  const col = (row: string[], ...names: string[]): string => {
    for (const name of names) {
      // Try exact match first
      let idx = headerMapExact.get(name);
      if (idx !== undefined && idx < row.length) return stripQuotes(row[idx]).trim();
      // Try normalized/fuzzy match
      idx = headerMapNorm.get(normalizeHeader(name));
      if (idx !== undefined && idx < row.length) return stripQuotes(row[idx]).trim();
    }
    return '';
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

    // Tax class
    const taxClassRaw = col(fields, 'Steuerklasse', 'Steuerklasse (aus Steuerkarte)', 'StKl');
    let taxClass: number | undefined;
    if (taxClassRaw) {
      const tc = parseInt(taxClassRaw, 10);
      if (tc >= 1 && tc <= 6) taxClass = tc;
    }

    // Tax ID
    const taxId = col(fields, 'IdNr', 'IdNr.', 'Identifikationsnummer', 'Steuer-IdNr') || undefined;

    // Gross salary
    const grossStr = col(fields, 'Standardentlohnung', 'Gehalt', 'Bruttogehalt');
    const grossSalary = parseDecimal(grossStr);

    // Gender
    const genderRaw = col(fields, 'Geschlecht');
    let gender: string | undefined;
    if (genderRaw.toLowerCase().includes('weiblich') || genderRaw === 'W' || genderRaw === '2') gender = 'weiblich';
    else if (genderRaw.toLowerCase().includes('männlich') || genderRaw.toLowerCase().includes('maennlich') || genderRaw === 'M' || genderRaw === '1') gender = 'männlich';

    // Health insurance: try name first, fall back to number
    const kkName = col(fields, 'KK-Zusatzinformation', 'Krankenkassenbezeichnung', 'KK-Name') || undefined;
    const kkNumber = col(fields, 'Krankenkasse', 'Betriebsnummer KK', 'Krankenkassen-Betriebsnummer') || undefined;

    // Weekly hours
    const weeklyHoursRaw = col(fields, 'Wöchentliche Arbeitszeit', 'Woechentliche Arbeitszeit', 'Wochenstunden', 'WAZ');
    const weeklyHours = parseDecimal(weeklyHoursRaw);

    // Konfession / church tax
    const konfessionRaw = col(fields, 'Konfession', 'Konfession AN', 'Religion');
    const { churchTax, denomination } = parseKonfession(konfessionRaw);

    // Children allowance
    const childrenRaw = col(fields, 'Kinderfreibetrag', 'Kinderfreibeträge', 'Kinder');
    const childrenAllowance = parseDecimal(childrenRaw);

    // Street – may be split across "Straße/Postfach" + "Hausnummer" or combined
    const streetPart = col(fields, 'Straße/Postfach', 'Strasse/Postfach', 'Straße', 'Strasse');
    const houseNr = col(fields, 'Hausnummer', 'HausNr', 'Haus-Nr.');
    let street: string | undefined;
    if (streetPart && houseNr) {
      street = `${streetPart} ${houseNr}`;
    } else if (streetPart) {
      street = streetPart;
    } else if (houseNr) {
      street = houseNr;
    }

    const zipCode = col(fields, 'PLZ', 'Postleitzahl') || undefined;
    const city = col(fields, 'Ort', 'Wohnort') || undefined;
    
    // Derive state from PLZ
    const state = plzToBundesland(zipCode);

    const employee: DatevEmployee = {
      personalNumber: pnr.replace(/^0+/, ''),
      lastName,
      firstName,
      dateOfBirth: parseDatevDate(col(fields, 'Geburtsdatum')),
      gender,
      street,
      zipCode,
      city,
      iban: col(fields, 'IBAN') || undefined,
      bic: col(fields, 'BIC') || undefined,
      svNumber: col(fields, 'Versicherungsnummer', 'SV-Nummer', 'Sozialversicherungsnummer') || undefined,
      entryDate: parseDatevDate(col(fields, 'Eintrittsdatum')) || parseDatevDate(col(fields, 'Datum erster Eintritt')),
      exitDate: parseDatevDate(col(fields, 'Austrittsdatum')),
      grossSalary,
      healthInsurance: kkName || undefined,
      healthInsuranceNumber: kkNumber,
      weeklyHours,
      position: col(fields, 'Berufsbezeichnung', 'Tätigkeit', 'Position') || undefined,
      taxClass,
      taxId,
      churchTax,
      churchTaxDenomination: denomination,
      churchTaxRate: churchTax ? churchTaxRateForState(state) : undefined,
      childrenAllowance,
      state,
      source: 'SD',
    };

    // Try to find gross salary from Lohnart 2000 if not found
    if (!employee.grossSalary) {
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
  const headerMapExact = new Map<string, number>();
  const headerMapNorm = new Map<string, number>();
  headerFields.forEach((h, i) => {
    const exact = stripQuotes(h).trim();
    headerMapExact.set(exact, i);
    headerMapNorm.set(normalizeHeader(exact), i);
  });

  const col = (row: string[], ...names: string[]): string => {
    for (const name of names) {
      let idx = headerMapExact.get(name);
      if (idx !== undefined && idx < row.length) return stripQuotes(row[idx]).trim();
      idx = headerMapNorm.get(normalizeHeader(name));
      if (idx !== undefined && idx < row.length) return stripQuotes(row[idx]).trim();
    }
    return '';
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

  const extract = (key: string): string | undefined => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^\\s*${escaped}\\s{2,}(.+?)$`, 'm');
    const m = content.match(regex);
    return m ? m[1].trim() : undefined;
  };

  const extractWithDate = (key: string): string | undefined => {
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

  // Tax class
  const taxClassRaw = extractWithDate('Steuerklasse / g');
  let taxClass: number | undefined;
  if (taxClassRaw) {
    const tcMatch = taxClassRaw.match(/^(\d)/);
    if (tcMatch) taxClass = parseInt(tcMatch[1], 10);
  }

  // Church tax
  const konfession = extractWithDate('Konfession AN / g');
  const churchResult = parseKonfession(konfession);

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

  // Address
  const streetName = extract('Straße') || extract('Strasse');
  const houseNr = extract('Hausnummer');
  const street = [streetName, houseNr].filter(Boolean).join(' ') || undefined;
  const zipCode = extract('Postleitzahl');
  const state = plzToBundesland(zipCode);

  // Tax ID
  const taxId = extract('IdNr') || extract('Identifikationsnummer');

  // SV number
  const svRaw = extract('Versicherungsnummer / g') || extractWithDate('Versicherungsnummer / g');
  let svNumber: string | undefined;
  if (svRaw) {
    const svMatch = svRaw.match(/^(\S+)/);
    svNumber = svMatch ? svMatch[1] : svRaw;
  }

  // Gross salary from Lohnart 2000
  let grossSalary: number | undefined;
  const lohnartMatch = content.match(/Lohnart\s+2000\b[^\n]*?\n[^\n]*?(\d[\d.,]*)/);
  if (lohnartMatch) {
    grossSalary = parseDecimal(lohnartMatch[1]);
  }

  const employee: DatevEmployee = {
    personalNumber: personalNumber.replace(/^0+/, ''),
    lastName,
    firstName,
    dateOfBirth: parseDatevDate(extract('Geburtsdatum')),
    gender,
    street,
    zipCode,
    city: extract('Ort'),
    iban: extract('IBAN'),
    bic: extract('BIC'),
    svNumber,
    taxId,
    taxClass,
    churchTax: churchResult.churchTax,
    churchTaxDenomination: churchResult.denomination,
    churchTaxRate: churchResult.churchTax ? churchTaxRateForState(state) : undefined,
    childrenAllowance,
    healthInsurance,
    weeklyHours,
    grossSalary,
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
    state,
    source: 'personalstamm',
  };

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
        // Merge: prefer personalstamm data, only fill empty fields
        const merged: DatevEmployee = { ...existing };
        for (const [key, value] of Object.entries(emp)) {
          if (value !== undefined && value !== '' && value !== null) {
            const existingVal = (existing as unknown as Record<string, unknown>)[key];
            if (emp.source === 'personalstamm' || existingVal === undefined || existingVal === '' || existingVal === null) {
              (merged as unknown as Record<string, unknown>)[key] = value;
            }
          }
        }
        if (emp.source === 'personalstamm') merged.source = 'personalstamm';
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
  health_insurance_number?: string;
  gross_salary: number;
  weekly_hours?: number;
  entry_date?: string;
  exit_date?: string;
  position?: string;
  employment_type: string;
  is_active: boolean;
  state?: string;
}

export function mapToDbRow(emp: DatevEmployee): DatevEmployeeDbRow {
  // Church tax rate
  let churchTaxRate = 0;
  if (emp.churchTax) {
    churchTaxRate = emp.churchTaxRate ?? churchTaxRateForState(emp.state);
  }

  // Employment type
  let employmentType = 'vollzeit';
  if (emp.weeklyHours !== undefined) {
    if (emp.weeklyHours < 10) employmentType = 'minijob';
    else if (emp.weeklyHours < 35) employmentType = 'teilzeit';
  }
  if (emp.grossSalary !== undefined && emp.grossSalary <= 556) {
    employmentType = 'minijob';
  }

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
    health_insurance_number: emp.healthInsuranceNumber,
    gross_salary: emp.grossSalary ?? 0,
    weekly_hours: emp.weeklyHours,
    entry_date: emp.entryDate,
    exit_date: emp.exitDate,
    position: emp.position,
    employment_type: employmentType,
    is_active: isActive,
    state: emp.state,
  };
}
