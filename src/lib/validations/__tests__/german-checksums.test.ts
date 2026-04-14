import { describe, it, expect } from 'vitest';
import {
  validateIBAN,
  validateTaxId,
  validateSVNumber,
  validatePLZ,
  validateBIC,
  validateEmployeeChecksums,
} from '../german-checksums';

describe('validateIBAN', () => {
  it('akzeptiert leere IBAN (optional)', () => {
    expect(validateIBAN('')).toEqual({ valid: true });
  });

  it('erkennt falsche Länge', () => {
    expect(validateIBAN('DE1234').valid).toBe(false);
  });

  it('erkennt nicht-DE-IBAN', () => {
    expect(validateIBAN('FR7630006000011234567890189').valid).toBe(false);
  });

  it('validiert korrekte IBAN (DE89 3704 0044 0532 0130 00)', () => {
    const result = validateIBAN('DE89370400440532013000');
    expect(result.valid).toBe(true);
  });

  it('validiert IBAN mit Leerzeichen', () => {
    const result = validateIBAN('DE89 3704 0044 0532 0130 00');
    expect(result.valid).toBe(true);
  });

  it('erkennt falsche Prüfziffer', () => {
    const result = validateIBAN('DE00370400440532013000');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Prüfsumme');
  });
});

describe('validateTaxId', () => {
  it('erkennt leere Steuer-ID als ungültig', () => {
    expect(validateTaxId('').valid).toBe(false);
  });

  it('erkennt falsche Länge', () => {
    expect(validateTaxId('1234').valid).toBe(false);
  });

  it('erkennt führende Null', () => {
    expect(validateTaxId('01234567890').valid).toBe(false);
  });

  it('prüft Ziffernverteilung (eine doppelt, eine fehlt)', () => {
    // Alle unterschiedlich = ungültig
    expect(validateTaxId('12345678901').valid).toBe(false);
  });

  it('validiert korrekte Steuer-ID mit Prüfziffer', () => {
    // Test-ID: 65929970489 (bekanntes Testmuster)
    const result = validateTaxId('65929970489');
    expect(result.valid).toBe(true);
  });
});

describe('validateSVNumber', () => {
  it('akzeptiert leere SV-Nummer (optional)', () => {
    expect(validateSVNumber('')).toEqual({ valid: true });
  });

  it('erkennt falsche Länge', () => {
    expect(validateSVNumber('123').valid).toBe(false);
  });

  it('erkennt falsches Format (kein Buchstabe an Pos 3)', () => {
    expect(validateSVNumber('123456789012').valid).toBe(false);
  });

  it('erkennt ungültigen Monat im Geburtsdatum', () => {
    expect(validateSVNumber('12A011399001').valid).toBe(false);
  });
});

describe('validatePLZ', () => {
  it('erkennt leere PLZ als ungültig', () => {
    expect(validatePLZ('').valid).toBe(false);
  });

  it('erkennt zu kurze PLZ', () => {
    expect(validatePLZ('123').valid).toBe(false);
  });

  it('erkennt 00000 als ungültig', () => {
    expect(validatePLZ('00000').valid).toBe(false);
  });

  it('validiert gültige PLZ', () => {
    expect(validatePLZ('10115').valid).toBe(true); // Berlin
    expect(validatePLZ('80331').valid).toBe(true); // München
    expect(validatePLZ('01067').valid).toBe(true); // Dresden
  });

  it('erkennt PLZ unter 01001', () => {
    expect(validatePLZ('00100').valid).toBe(false);
  });
});

describe('validateBIC', () => {
  it('akzeptiert leeren BIC (optional)', () => {
    expect(validateBIC('')).toEqual({ valid: true });
  });

  it('validiert 8-stelligen BIC', () => {
    expect(validateBIC('COBADEFF').valid).toBe(true); // Commerzbank
  });

  it('validiert 11-stelligen BIC', () => {
    expect(validateBIC('COBADEFF100').valid).toBe(true); // Commerzbank Berlin
  });

  it('erkennt ungültige Länge', () => {
    expect(validateBIC('COBA').valid).toBe(false);
  });

  it('erkennt nicht-DE-BIC', () => {
    expect(validateBIC('BNPAFRPP').valid).toBe(false);
  });
});

describe('validateEmployeeChecksums', () => {
  it('validiert alle Felder gleichzeitig', () => {
    const result = validateEmployeeChecksums({
      iban: 'DE89370400440532013000',
      plz: '10115',
      bic: 'COBADEFF',
    });
    expect(result.allValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('sammelt alle Fehler', () => {
    const result = validateEmployeeChecksums({
      iban: 'DE00000000000000000000',
      plz: '00000',
      bic: 'XX',
    });
    expect(result.allValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
