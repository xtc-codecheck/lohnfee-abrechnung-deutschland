/**
 * Deutsche Prüfziffern-Validierungen
 * 
 * - IBAN (ISO 13616, DE-Format)
 * - Steuerliche Identifikationsnummer (§ 139b AO, 11 Ziffern + Prüfziffer)
 * - Sozialversicherungsnummer (12 Stellen, Format: DDMMJJXNNNP)
 * - PLZ (5 Ziffern, gültige Bereiche)
 * - BIC (SWIFT-Code, 8 oder 11 Zeichen)
 */

// ============= IBAN-Validierung (ISO 13616) =============

/**
 * Validiert eine deutsche IBAN mit Prüfsumme (Modulo 97)
 * Format: DE + 2 Prüfziffern + 18 Ziffern = 22 Zeichen
 */
export function validateIBAN(iban: string): { valid: boolean; error?: string } {
  if (!iban || iban.trim() === '') {
    return { valid: true }; // Optional field
  }

  // Whitespace und Bindestriche entfernen
  const cleaned = iban.replace(/[\s-]/g, '').toUpperCase();

  if (cleaned.length !== 22) {
    return { valid: false, error: 'Deutsche IBAN muss 22 Zeichen lang sein' };
  }

  if (!cleaned.startsWith('DE')) {
    return { valid: false, error: 'Deutsche IBAN muss mit DE beginnen' };
  }

  if (!/^DE\d{20}$/.test(cleaned)) {
    return { valid: false, error: 'IBAN darf nach DE nur Ziffern enthalten' };
  }

  // Modulo-97-Prüfung (ISO 7064)
  // 1. DE an das Ende verschieben
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  
  // 2. Buchstaben in Zahlen umwandeln (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (const char of rearranged) {
    if (char >= '0' && char <= '9') {
      numericString += char;
    } else {
      numericString += (char.charCodeAt(0) - 55).toString();
    }
  }

  // 3. Modulo 97 berechnen (BigInt für große Zahlen)
  const remainder = mod97(numericString);
  
  if (remainder !== 1) {
    return { valid: false, error: 'IBAN-Prüfsumme ungültig' };
  }

  return { valid: true };
}

/** Modulo 97 für sehr lange Zahlenstrings */
function mod97(numStr: string): number {
  let remainder = 0;
  for (let i = 0; i < numStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numStr[i], 10)) % 97;
  }
  return remainder;
}

// ============= Steuer-ID Validierung (§ 139b AO) =============

/**
 * Validiert die steuerliche Identifikationsnummer (11 Ziffern)
 * 
 * Regeln:
 * - Genau 11 Ziffern
 * - Erste Ziffer ≠ 0
 * - Unter den ersten 10 Ziffern kommt genau eine Ziffer doppelt vor,
 *   eine Ziffer kommt gar nicht vor (0-9)
 * - Die 11. Ziffer ist eine Prüfziffer (Verfahren nach BMF)
 */
export function validateTaxId(taxId: string): { valid: boolean; error?: string } {
  if (!taxId || taxId.trim() === '') {
    return { valid: false, error: 'Steuer-ID ist erforderlich' };
  }

  const cleaned = taxId.replace(/[\s-]/g, '');

  if (!/^\d{11}$/.test(cleaned)) {
    return { valid: false, error: 'Steuer-ID muss genau 11 Ziffern haben' };
  }

  if (cleaned[0] === '0') {
    return { valid: false, error: 'Steuer-ID darf nicht mit 0 beginnen' };
  }

  // Ziffernhäufigkeit der ersten 10 Ziffern prüfen
  const first10 = cleaned.slice(0, 10);
  const digitCounts = new Array(10).fill(0);
  for (const d of first10) {
    digitCounts[parseInt(d, 10)]++;
  }

  const doubles = digitCounts.filter(c => c === 2).length;
  const zeros = digitCounts.filter(c => c === 0).length;
  const triples = digitCounts.filter(c => c >= 3).length;

  // Genau eine Ziffer doppelt, eine fehlt (oder eine Ziffer dreifach, zwei fehlen)
  if (!(doubles === 1 && zeros === 1 && triples === 0) && 
      !(triples === 1 && zeros === 2 && doubles === 0)) {
    return { valid: false, error: 'Steuer-ID: Ungültige Ziffernverteilung' };
  }

  // Prüfziffer nach BMF-Verfahren (modifiziertes ISO/IEC 7064, MOD 11,10)
  const checkDigit = calculateTaxIdCheckDigit(first10);
  if (checkDigit !== parseInt(cleaned[10], 10)) {
    return { valid: false, error: 'Steuer-ID: Prüfziffer ungültig' };
  }

  return { valid: true };
}

/**
 * Berechnet die Prüfziffer der Steuer-ID (MOD 11,10 Verfahren)
 */
function calculateTaxIdCheckDigit(first10: string): number {
  let product = 10;

  for (let i = 0; i < 10; i++) {
    let sum = (parseInt(first10[i], 10) + product) % 10;
    if (sum === 0) sum = 10;
    product = (sum * 2) % 11;
  }

  let checkDigit = 11 - product;
  if (checkDigit === 10) checkDigit = 0;

  return checkDigit;
}

// ============= Sozialversicherungsnummer =============

/**
 * Validiert die deutsche Sozialversicherungsnummer (12 Zeichen)
 * Format: BBNRDDMMJJXP
 * - BB: Bereichsnummer (2 Ziffern)
 * - NR: Anfangsbuchstabe des Geburtsnamens (als Zahl kodiert)
 * - DDMMJJ: Geburtsdatum
 * - X: Geschlecht + Seriennummer (00-49 männlich, 50-99 weiblich)
 * - P: Prüfziffer
 */
export function validateSVNumber(svNumber: string): { valid: boolean; error?: string } {
  if (!svNumber || svNumber.trim() === '') {
    return { valid: true }; // Optional
  }

  const cleaned = svNumber.replace(/[\s-]/g, '').toUpperCase();

  if (cleaned.length !== 12) {
    return { valid: false, error: 'SV-Nummer muss 12 Zeichen lang sein' };
  }

  // Format: 2 Ziffern + 1 Buchstabe + 6 Ziffern + 1 Buchstabe/Ziffer + 1 Ziffer + 1 Ziffer
  // Vereinfachte Prüfung: Position 3 ist ein Buchstabe (Anfangsbuchstabe Geburtsname)
  if (!/^\d{2}[A-Z]\d{6}\d{3}$/.test(cleaned)) {
    return { valid: false, error: 'SV-Nummer: Ungültiges Format (erwartet: 2 Ziffern, 1 Buchstabe, 9 Ziffern)' };
  }

  // Geburtsdatum prüfen (Positionen 4-9: DDMMJJ)
  const day = parseInt(cleaned.slice(3, 5), 10);
  const month = parseInt(cleaned.slice(5, 7), 10);
  // const year = parseInt(cleaned.slice(7, 9), 10); // 2-stellig, nicht eindeutig

  if (day < 1 || day > 31) {
    return { valid: false, error: 'SV-Nummer: Ungültiger Tag im Geburtsdatum' };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'SV-Nummer: Ungültiger Monat im Geburtsdatum' };
  }

  // Prüfziffer validieren (letzte Ziffer)
  const checkDigit = calculateSVCheckDigit(cleaned.slice(0, 11));
  if (checkDigit !== parseInt(cleaned[11], 10)) {
    return { valid: false, error: 'SV-Nummer: Prüfziffer ungültig' };
  }

  return { valid: true };
}

/**
 * Berechnet die Prüfziffer der SV-Nummer
 * Quersummenverfahren mit Gewichtung
 */
function calculateSVCheckDigit(first11: string): number {
  // Buchstabe an Position 3 in Zahlenwert umwandeln (A=01, B=02, ...)
  const weights = [2, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 11; i++) {
    let value: number;
    const char = first11[i];
    
    if (char >= 'A' && char <= 'Z') {
      // Buchstabe: Buchstabenwert (A=01, B=02, ...)
      value = char.charCodeAt(0) - 64;
      // Zweistellige Werte: Quersumme der gewichteten Teile
      const tens = Math.floor(value / 10);
      const ones = value % 10;
      sum += crossSum(tens * weights[i]) + crossSum(ones * weights[i]);
    } else {
      value = parseInt(char, 10);
      sum += crossSum(value * weights[i]);
    }
  }

  return sum % 10;
}

/** Quersumme einer Zahl */
function crossSum(n: number): number {
  let sum = 0;
  let val = Math.abs(n);
  while (val > 0) {
    sum += val % 10;
    val = Math.floor(val / 10);
  }
  return sum;
}

// ============= PLZ-Validierung =============

/**
 * Gültige PLZ-Bereiche in Deutschland
 * Nicht alle 5-stelligen Zahlen sind gültige PLZ
 */
const VALID_PLZ_RANGES: [number, number][] = [
  [1001, 99998], // Alle PLZ von 01001 bis 99998
];

/**
 * Validiert eine deutsche Postleitzahl
 */
export function validatePLZ(plz: string): { valid: boolean; error?: string } {
  if (!plz || plz.trim() === '') {
    return { valid: false, error: 'PLZ ist erforderlich' };
  }

  const cleaned = plz.trim();

  if (!/^\d{5}$/.test(cleaned)) {
    return { valid: false, error: 'PLZ muss genau 5 Ziffern haben' };
  }

  const plzNum = parseInt(cleaned, 10);

  // 00000 ist ungültig
  if (plzNum === 0) {
    return { valid: false, error: 'PLZ 00000 ist ungültig' };
  }

  // Bereiche ohne PLZ (z.B. 00xxx)
  if (plzNum < 1001) {
    return { valid: false, error: `PLZ ${cleaned} existiert nicht` };
  }

  return { valid: true };
}

// ============= BIC-Validierung =============

/**
 * Validiert einen BIC/SWIFT-Code
 * Format: 4 Buchstaben (Bank) + 2 Buchstaben (Land) + 2 Zeichen (Ort) + optional 3 Zeichen (Filiale)
 */
export function validateBIC(bic: string): { valid: boolean; error?: string } {
  if (!bic || bic.trim() === '') {
    return { valid: true }; // Optional
  }

  const cleaned = bic.replace(/\s/g, '').toUpperCase();

  if (cleaned.length !== 8 && cleaned.length !== 11) {
    return { valid: false, error: 'BIC muss 8 oder 11 Zeichen lang sein' };
  }

  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
    return { valid: false, error: 'BIC: Ungültiges Format' };
  }

  // Für deutsche Banken: Ländercode muss DE sein
  const countryCode = cleaned.slice(4, 6);
  if (countryCode !== 'DE') {
    return { valid: false, error: 'BIC: Nur deutsche BICs (Ländercode DE) werden unterstützt' };
  }

  return { valid: true };
}

// ============= Sammelfunktion =============

export interface ValidationResults {
  iban?: { valid: boolean; error?: string };
  taxId?: { valid: boolean; error?: string };
  svNumber?: { valid: boolean; error?: string };
  plz?: { valid: boolean; error?: string };
  bic?: { valid: boolean; error?: string };
  allValid: boolean;
  errors: string[];
}

/**
 * Validiert alle prüfziffernrelevanten Felder eines Mitarbeiters
 */
export function validateEmployeeChecksums(data: {
  iban?: string;
  taxId?: string;
  svNumber?: string;
  plz?: string;
  bic?: string;
}): ValidationResults {
  const ibanResult = data.iban !== undefined ? validateIBAN(data.iban) : undefined;
  const taxIdResult = data.taxId !== undefined ? validateTaxId(data.taxId) : undefined;
  const svResult = data.svNumber !== undefined ? validateSVNumber(data.svNumber) : undefined;
  const plzResult = data.plz !== undefined ? validatePLZ(data.plz) : undefined;
  const bicResult = data.bic !== undefined ? validateBIC(data.bic) : undefined;

  const errors: string[] = [];
  if (ibanResult && !ibanResult.valid) errors.push(`IBAN: ${ibanResult.error}`);
  if (taxIdResult && !taxIdResult.valid) errors.push(`Steuer-ID: ${taxIdResult.error}`);
  if (svResult && !svResult.valid) errors.push(`SV-Nr: ${svResult.error}`);
  if (plzResult && !plzResult.valid) errors.push(`PLZ: ${plzResult.error}`);
  if (bicResult && !bicResult.valid) errors.push(`BIC: ${bicResult.error}`);

  return {
    iban: ibanResult,
    taxId: taxIdResult,
    svNumber: svResult,
    plz: plzResult,
    bic: bicResult,
    allValid: errors.length === 0,
    errors,
  };
}
