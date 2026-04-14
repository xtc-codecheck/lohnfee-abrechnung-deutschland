/**
 * ELStAM-Validierung (Elektronische LohnSteuerAbzugsMerkmale)
 * 
 * Validiert die steuerlichen Abzugsmerkmale eines Mitarbeiters gemäß:
 * - § 39 EStG (Lohnsteuerabzugsmerkmale)
 * - § 39e EStG (Verfahren zur ELStAM-Bereitstellung)
 * - § 39b EStG (Einbehaltung der Lohnsteuer)
 */

export type ELStAMSeverity = 'error' | 'warning' | 'info';

export interface ELStAMValidationResult {
  isValid: boolean;
  errors: ELStAMIssue[];
  warnings: ELStAMIssue[];
  infos: ELStAMIssue[];
  score: number; // 0-100
  lastValidated: Date;
}

export interface ELStAMIssue {
  code: string;
  field: string;
  message: string;
  severity: ELStAMSeverity;
  legalBasis?: string;
}

export interface ELStAMInput {
  taxId: string;
  taxClass: number;
  churchTax: boolean;
  churchTaxRate?: number;
  childAllowances: number;
  numberOfChildren: number;
  dateOfBirth: string; // ISO
  entryDate: string; // ISO
  exitDate?: string;
  svNumber: string;
  healthInsurance: string;
  grossSalary: number;
  isActive: boolean;
}

/**
 * Vollständige ELStAM-Validierung
 */
export function validateELStAM(input: ELStAMInput): ELStAMValidationResult {
  const issues: ELStAMIssue[] = [];

  // 1. Steuer-ID Validierung (11-stellig, Prüfziffer)
  validateTaxId(input.taxId, issues);

  // 2. Steuerklasse
  validateTaxClass(input.taxClass, issues);

  // 3. Kirchensteuer
  validateChurchTax(input.churchTax, input.churchTaxRate, issues);

  // 4. Kinderfreibeträge
  validateChildAllowances(input.childAllowances, input.numberOfChildren, issues);

  // 5. Geburtsdatum / Alter
  validateAge(input.dateOfBirth, issues);

  // 6. SV-Nummer
  validateSVNumber(input.svNumber, input.dateOfBirth, issues);

  // 7. Krankenkasse
  validateHealthInsurance(input.healthInsurance, issues);

  // 8. Beschäftigungszeitraum
  validateEmploymentPeriod(input.entryDate, input.exitDate, input.isActive, issues);

  // 9. Gehalt + Steuerklasse Plausibilität
  validateSalaryPlausibility(input.grossSalary, input.taxClass, issues);

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  // Score: 100 - (errors * 15) - (warnings * 5)
  const score = Math.max(0, Math.min(100, 100 - errors.length * 15 - warnings.length * 5));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    infos,
    score,
    lastValidated: new Date(),
  };
}

function validateTaxId(taxId: string, issues: ELStAMIssue[]) {
  if (!taxId || taxId.trim() === '') {
    issues.push({ code: 'ELSTAM_001', field: 'taxId', message: 'Steuerliche Identifikationsnummer fehlt.', severity: 'error', legalBasis: '§ 139b AO' });
    return;
  }
  const cleaned = taxId.replace(/\s/g, '');
  if (!/^\d{11}$/.test(cleaned)) {
    issues.push({ code: 'ELSTAM_002', field: 'taxId', message: 'Steuer-ID muss exakt 11 Ziffern haben.', severity: 'error', legalBasis: '§ 139b AO' });
    return;
  }
  // Erste Ziffer darf nicht 0 sein
  if (cleaned[0] === '0') {
    issues.push({ code: 'ELSTAM_003', field: 'taxId', message: 'Steuer-ID darf nicht mit 0 beginnen.', severity: 'error' });
  }
  // Prüfziffer (vereinfacht: Mod-11 Verfahren)
  if (!validateTaxIdCheckDigit(cleaned)) {
    issues.push({ code: 'ELSTAM_004', field: 'taxId', message: 'Steuer-ID Prüfziffer ungültig.', severity: 'warning', legalBasis: '§ 139b AO' });
  }
}

function validateTaxIdCheckDigit(taxId: string): boolean {
  // Vereinfachte Prüfziffernvalidierung nach dem 2-aus-1-Verfahren
  const digits = taxId.split('').map(Number);
  // Mindestens eine Ziffer muss doppelt vorkommen, eine muss fehlen (11 Ziffern, 10 mögliche)
  const counts = new Array(10).fill(0);
  for (let i = 0; i < 10; i++) {
    counts[digits[i]]++;
  }
  const hasDouble = counts.some(c => c >= 2);
  const hasMissing = counts.some(c => c === 0);
  return hasDouble && hasMissing;
}

function validateTaxClass(taxClass: number, issues: ELStAMIssue[]) {
  if (!taxClass || taxClass < 1 || taxClass > 6) {
    issues.push({ code: 'ELSTAM_010', field: 'taxClass', message: `Steuerklasse ${taxClass} ist ungültig (erlaubt: I–VI).`, severity: 'error', legalBasis: '§ 38b EStG' });
  }
}

function validateChurchTax(churchTax: boolean, churchTaxRate: number | undefined, issues: ELStAMIssue[]) {
  if (churchTax && (!churchTaxRate || churchTaxRate <= 0)) {
    issues.push({ code: 'ELSTAM_020', field: 'churchTaxRate', message: 'Kirchensteuerpflicht aktiv, aber kein Satz hinterlegt.', severity: 'error', legalBasis: '§ 51a EStG' });
  }
  if (churchTax && churchTaxRate && ![8, 9].includes(churchTaxRate)) {
    issues.push({ code: 'ELSTAM_021', field: 'churchTaxRate', message: `Kirchensteuersatz ${churchTaxRate}% ungewöhnlich (üblich: 8% oder 9%).`, severity: 'warning' });
  }
  if (!churchTax && churchTaxRate && churchTaxRate > 0) {
    issues.push({ code: 'ELSTAM_022', field: 'churchTax', message: 'Kirchensteuersatz hinterlegt, aber KiSt-Pflicht deaktiviert.', severity: 'warning' });
  }
}

function validateChildAllowances(childAllowances: number, numberOfChildren: number, issues: ELStAMIssue[]) {
  if (childAllowances < 0 || childAllowances > 10) {
    issues.push({ code: 'ELSTAM_030', field: 'childAllowances', message: `Kinderfreibetrag ${childAllowances} außerhalb des Normbereichs (0–10).`, severity: 'warning', legalBasis: '§ 32 EStG' });
  }
  if (childAllowances > 0 && numberOfChildren === 0) {
    issues.push({ code: 'ELSTAM_031', field: 'numberOfChildren', message: 'Kinderfreibeträge vorhanden, aber Kinderzahl = 0.', severity: 'warning' });
  }
  // Halbe Freibeträge prüfen
  if (childAllowances % 0.5 !== 0) {
    issues.push({ code: 'ELSTAM_032', field: 'childAllowances', message: 'Kinderfreibeträge müssen in 0,5er-Schritten angegeben werden.', severity: 'error', legalBasis: '§ 32 Abs. 6 EStG' });
  }
}

function validateAge(dateOfBirth: string, issues: ELStAMIssue[]) {
  if (!dateOfBirth) {
    issues.push({ code: 'ELSTAM_040', field: 'dateOfBirth', message: 'Geburtsdatum fehlt.', severity: 'error' });
    return;
  }
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const age = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (age < 15) {
    issues.push({ code: 'ELSTAM_041', field: 'dateOfBirth', message: `Alter ${Math.floor(age)} Jahre – unter Mindestbeschäftigungsalter.`, severity: 'error', legalBasis: '§ 5 JArbSchG' });
  }
  if (age >= 67) {
    issues.push({ code: 'ELSTAM_042', field: 'dateOfBirth', message: `Alter ${Math.floor(age)} Jahre – Regelaltersgrenze überschritten. Prüfen Sie den Rentenstatus.`, severity: 'info', legalBasis: '§ 35 SGB VI' });
  }
  if (age > 100) {
    issues.push({ code: 'ELSTAM_043', field: 'dateOfBirth', message: 'Geburtsdatum ergibt Alter über 100 – bitte prüfen.', severity: 'error' });
  }
}

function validateSVNumber(svNumber: string, dateOfBirth: string, issues: ELStAMIssue[]) {
  if (!svNumber || svNumber.trim() === '') {
    issues.push({ code: 'ELSTAM_050', field: 'svNumber', message: 'Sozialversicherungsnummer fehlt.', severity: 'error', legalBasis: '§ 147 SGB VI' });
    return;
  }
  // Format: 12DDMMYYA123 (12 Zeichen, Geburtsdatum eingebettet)
  const cleaned = svNumber.replace(/\s/g, '');
  if (cleaned.length !== 12) {
    issues.push({ code: 'ELSTAM_051', field: 'svNumber', message: `SV-Nummer muss 12 Zeichen haben (aktuell: ${cleaned.length}).`, severity: 'error' });
    return;
  }
  // Geburtsdatum in SV-Nummer prüfen (Stellen 3-8: DDMMYY)
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const expectedDD = String(dob.getDate()).padStart(2, '0');
    const expectedMM = String(dob.getMonth() + 1).padStart(2, '0');
    const expectedYY = String(dob.getFullYear()).slice(-2);
    const svDob = cleaned.substring(2, 8);
    if (svDob !== `${expectedDD}${expectedMM}${expectedYY}`) {
      issues.push({ code: 'ELSTAM_052', field: 'svNumber', message: 'Geburtsdatum in SV-Nummer stimmt nicht mit hinterlegtem Geburtsdatum überein.', severity: 'warning' });
    }
  }
}

function validateHealthInsurance(healthInsurance: string, issues: ELStAMIssue[]) {
  if (!healthInsurance || healthInsurance.trim() === '') {
    issues.push({ code: 'ELSTAM_060', field: 'healthInsurance', message: 'Krankenkasse fehlt.', severity: 'error', legalBasis: '§ 5 SGB V' });
  }
}

function validateEmploymentPeriod(entryDate: string, exitDate: string | undefined, isActive: boolean, issues: ELStAMIssue[]) {
  if (!entryDate) {
    issues.push({ code: 'ELSTAM_070', field: 'entryDate', message: 'Eintrittsdatum fehlt.', severity: 'error' });
    return;
  }
  const entry = new Date(entryDate);
  if (entry > new Date()) {
    issues.push({ code: 'ELSTAM_071', field: 'entryDate', message: 'Eintrittsdatum liegt in der Zukunft.', severity: 'info' });
  }
  if (exitDate) {
    const exit = new Date(exitDate);
    if (exit < entry) {
      issues.push({ code: 'ELSTAM_072', field: 'exitDate', message: 'Austrittsdatum liegt vor dem Eintrittsdatum.', severity: 'error' });
    }
    if (isActive) {
      issues.push({ code: 'ELSTAM_073', field: 'exitDate', message: 'Mitarbeiter als aktiv markiert, aber Austrittsdatum hinterlegt.', severity: 'warning' });
    }
  }
}

function validateSalaryPlausibility(grossSalary: number, taxClass: number, issues: ELStAMIssue[]) {
  if (grossSalary <= 0) {
    issues.push({ code: 'ELSTAM_080', field: 'grossSalary', message: 'Bruttogehalt ist 0 oder negativ.', severity: 'error' });
  }
  // Minijob-Grenze 2025: 556 €
  if (grossSalary <= 556 && taxClass !== 6) {
    issues.push({ code: 'ELSTAM_081', field: 'grossSalary', message: `Gehalt ${grossSalary}€ liegt im Minijob-Bereich. Prüfen Sie die Abgabenpflicht.`, severity: 'info', legalBasis: '§ 8 Abs. 1 SGB IV' });
  }
  // Steuerklasse VI = Nebenarbeitsverhältnis
  if (taxClass === 6 && grossSalary > 5000) {
    issues.push({ code: 'ELSTAM_082', field: 'taxClass', message: 'Steuerklasse VI bei Gehalt >5.000€ – ist dies ein Hauptarbeitsverhältnis?', severity: 'warning', legalBasis: '§ 39c EStG' });
  }
}
