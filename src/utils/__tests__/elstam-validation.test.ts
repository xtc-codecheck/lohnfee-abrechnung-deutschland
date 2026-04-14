import { describe, it, expect } from 'vitest';
import { validateELStAM, ELStAMInput } from '../elstam-validation';

const validInput: ELStAMInput = {
  taxId: '12345678911',
  taxClass: 1,
  churchTax: false,
  childAllowances: 0,
  numberOfChildren: 0,
  dateOfBirth: '1990-01-01',
  entryDate: '2020-01-01',
  svNumber: '12010190A123',
  healthInsurance: 'TK',
  grossSalary: 4000,
  isActive: true,
};

describe('ELStAM-Validierung', () => {
  it('sollte gültige Daten akzeptieren', () => {
    const result = validateELStAM(validInput);
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('sollte fehlende Steuer-ID als Fehler melden', () => {
    const result = validateELStAM({ ...validInput, taxId: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'ELSTAM_001')).toBe(true);
  });

  it('sollte ungültige Steuer-ID Länge erkennen', () => {
    const result = validateELStAM({ ...validInput, taxId: '12345' });
    expect(result.errors.some(e => e.code === 'ELSTAM_002')).toBe(true);
  });

  it('sollte Steuer-ID mit führender 0 ablehnen', () => {
    const result = validateELStAM({ ...validInput, taxId: '02345678911' });
    expect(result.errors.some(e => e.code === 'ELSTAM_003')).toBe(true);
  });

  it('sollte ungültige Steuerklasse erkennen', () => {
    const result = validateELStAM({ ...validInput, taxClass: 7 });
    expect(result.errors.some(e => e.code === 'ELSTAM_010')).toBe(true);
  });

  it('sollte fehlenden KiSt-Satz bei KiSt-Pflicht melden', () => {
    const result = validateELStAM({ ...validInput, churchTax: true, churchTaxRate: 0 });
    expect(result.errors.some(e => e.code === 'ELSTAM_020')).toBe(true);
  });

  it('sollte ungewöhnlichen KiSt-Satz warnen', () => {
    const result = validateELStAM({ ...validInput, churchTax: true, churchTaxRate: 7 });
    expect(result.warnings.some(e => e.code === 'ELSTAM_021')).toBe(true);
  });

  it('sollte Kinderfreibeträge ohne Kinder warnen', () => {
    const result = validateELStAM({ ...validInput, childAllowances: 1, numberOfChildren: 0 });
    expect(result.warnings.some(e => e.code === 'ELSTAM_031')).toBe(true);
  });

  it('sollte fehlendes Geburtsdatum als Fehler melden', () => {
    const result = validateELStAM({ ...validInput, dateOfBirth: '' });
    expect(result.errors.some(e => e.code === 'ELSTAM_040')).toBe(true);
  });

  it('sollte Alter über Regelaltersgrenze als Info melden', () => {
    const result = validateELStAM({ ...validInput, dateOfBirth: '1950-01-01' });
    expect(result.infos.some(e => e.code === 'ELSTAM_042')).toBe(true);
  });

  it('sollte fehlende SV-Nummer als Fehler melden', () => {
    const result = validateELStAM({ ...validInput, svNumber: '' });
    expect(result.errors.some(e => e.code === 'ELSTAM_050')).toBe(true);
  });

  it('sollte falsche SV-Nummer Länge erkennen', () => {
    const result = validateELStAM({ ...validInput, svNumber: '123' });
    expect(result.errors.some(e => e.code === 'ELSTAM_051')).toBe(true);
  });

  it('sollte fehlende Krankenkasse melden', () => {
    const result = validateELStAM({ ...validInput, healthInsurance: '' });
    expect(result.errors.some(e => e.code === 'ELSTAM_060')).toBe(true);
  });

  it('sollte Minijob-Bereich erkennen', () => {
    const result = validateELStAM({ ...validInput, grossSalary: 450 });
    expect(result.infos.some(e => e.code === 'ELSTAM_081')).toBe(true);
  });

  it('sollte Steuerklasse VI bei hohem Gehalt warnen', () => {
    const result = validateELStAM({ ...validInput, taxClass: 6, grossSalary: 6000 });
    expect(result.warnings.some(e => e.code === 'ELSTAM_082')).toBe(true);
  });

  it('sollte Score korrekt berechnen', () => {
    const perfect = validateELStAM(validInput);
    expect(perfect.score).toBeLessThanOrEqual(100);
    expect(perfect.score).toBeGreaterThanOrEqual(0);

    const bad = validateELStAM({ ...validInput, taxId: '', svNumber: '', healthInsurance: '' });
    expect(bad.score).toBeLessThan(perfect.score);
  });

  it('sollte Austrittsdatum vor Eintrittsdatum erkennen', () => {
    const result = validateELStAM({ ...validInput, entryDate: '2025-01-01', exitDate: '2024-01-01' });
    expect(result.errors.some(e => e.code === 'ELSTAM_072')).toBe(true);
  });
});
