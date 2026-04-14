/**
 * Golden-Master Tests für Lohnabrechnungen 2026
 * 
 * Referenz-Validierung mit 2026er Parametern:
 * - BBG RV/AV: €96.600 (West=Ost vereinheitlicht)
 * - BBG KV/PV: €66.150
 * - Grundfreibetrag: €12.336
 * - PV-Satz: 3,6% (Kinderlose: 4,2%)
 */

import { describe, it, expect } from 'vitest';
import { calculateCompleteTax, TaxCalculationParams } from '../tax-calculation';

function params2026(overrides: Partial<TaxCalculationParams> = {}): TaxCalculationParams {
  return {
    grossSalaryYearly: 48000, taxClass: '1', childAllowances: 0, churchTax: false,
    churchTaxRate: 9, healthInsuranceRate: 1.7, isEastGermany: false, isChildless: true,
    age: 30, year: 2026, ...overrides,
  };
}

describe('Golden-Master 2026: Parameteränderungen gegenüber 2025', () => {
  it('2026 hat höheren Grundfreibetrag → weniger Lohnsteuer', () => {
    const r2025 = calculateCompleteTax(params2026({ year: 2025 }));
    const r2026 = calculateCompleteTax(params2026({ year: 2026 }));
    expect(r2026.incomeTax).toBeLessThanOrEqual(r2025.incomeTax);
  });

  it('2026 hat höhere BBG RV → höhere SV bei hohen Gehältern', () => {
    const r2025 = calculateCompleteTax(params2026({ grossSalaryYearly: 96000, year: 2025 }));
    const r2026 = calculateCompleteTax(params2026({ grossSalaryYearly: 96000, year: 2026 }));
    expect(r2026.pensionInsurance).toBeGreaterThanOrEqual(r2025.pensionInsurance);
  });

  it('2026 hat höheren PV-Satz → höhere Pflegeversicherung', () => {
    const r2025 = calculateCompleteTax(params2026({ year: 2025, isChildless: false }));
    const r2026 = calculateCompleteTax(params2026({ year: 2026, isChildless: false }));
    expect(r2026.careInsurance).toBeGreaterThanOrEqual(r2025.careInsurance);
  });

  it('2026: BBG West = BBG Ost (RV vereinheitlicht)', () => {
    const west = calculateCompleteTax(params2026({ isEastGermany: false, grossSalaryYearly: 96000 }));
    const east = calculateCompleteTax(params2026({ isEastGermany: true, grossSalaryYearly: 96000 }));
    expect(Math.abs(west.pensionInsurance - east.pensionInsurance)).toBeLessThan(1);
  });
});

describe('Golden-Master 2026: Referenzabrechnungen', () => {
  describe('GM2026-001: StKl I, ledig, 4.000€, West', () => {
    const result = calculateCompleteTax(params2026({ grossSalaryYearly: 48000 }));
    it('Brutto korrekt', () => expect(result.grossMonthly).toBe(4000));
    it('Netto plausibel', () => { expect(result.netMonthly).toBeGreaterThan(2400); expect(result.netMonthly).toBeLessThan(2800); });
    it('Lohnsteuer plausibel', () => { expect(result.incomeTax / 12).toBeGreaterThan(300); expect(result.incomeTax / 12).toBeLessThan(700); });
    it('SV-Beiträge AN plausibel', () => { const r = result.totalSocialContributions / result.grossYearly; expect(r).toBeGreaterThan(0.19); expect(r).toBeLessThan(0.23); });
    it('AG-Kosten > Brutto', () => expect(result.employerCosts).toBeGreaterThan(48000));
  });

  describe('GM2026-002: StKl III, 2 Kinder, KiSt, 5.500€', () => {
    const result = calculateCompleteTax(params2026({ grossSalaryYearly: 66000, taxClass: '3', childAllowances: 2, churchTax: true, churchTaxRate: 9, isChildless: false, numberOfChildren: 2, age: 40 }));
    it('Brutto korrekt', () => expect(result.grossMonthly).toBe(5500));
    it('Netto höher als StKl I', () => { const stk1 = calculateCompleteTax(params2026({ grossSalaryYearly: 66000 })); expect(result.netMonthly).toBeGreaterThan(stk1.netMonthly); });
    it('Kirchensteuer vorhanden', () => expect(result.churchTax).toBeGreaterThan(0));
    it('PV mit Kinderabschlag', () => { const o = calculateCompleteTax(params2026({ grossSalaryYearly: 66000, isChildless: true })); expect(result.careInsurance).toBeLessThan(o.careInsurance); });
  });

  describe('GM2026-003: Minijob 556€', () => {
    const result = calculateCompleteTax(params2026({ grossSalaryYearly: 556 * 12, employmentType: 'minijob', age: 20 }));
    it('Netto = Brutto', () => expect(result.netMonthly).toBe(556));
    it('Keine AN-SV', () => expect(result.totalSocialContributions).toBe(0));
    it('AG-Kosten > Brutto', () => expect(result.employerCosts).toBeGreaterThan(556 * 12));
  });

  describe('GM2026-004: Midijob 1.200€', () => {
    const result = calculateCompleteTax(params2026({ grossSalaryYearly: 1200 * 12, employmentType: 'midijob', age: 25 }));
    it('Netto > 0', () => expect(result.netMonthly).toBeGreaterThan(0));
    it('SV reduziert', () => { const f = calculateCompleteTax(params2026({ grossSalaryYearly: 1200 * 12 })); expect(result.totalSocialContributions).toBeLessThanOrEqual(f.totalSocialContributions); });
  });

  describe('GM2026-005: Hochverdiener 10.000€', () => {
    const result = calculateCompleteTax(params2026({ grossSalaryYearly: 120000, churchTax: true, churchTaxRate: 9, isChildless: false, age: 50 }));
    it('RV gedeckelt', () => expect(result.pensionInsurance).toBeLessThanOrEqual(96600 * 0.093 + 1));
    it('Soli vorhanden', () => expect(result.solidarityTax).toBeGreaterThan(0));
    it('Netto plausibel', () => { expect(result.netMonthly).toBeGreaterThan(4500); expect(result.netMonthly).toBeLessThan(7000); });
  });

  describe('GM2026-006: StKl V, 2.500€', () => {
    const result = calculateCompleteTax(params2026({ grossSalaryYearly: 30000, taxClass: '5', isChildless: true, age: 35 }));
    it('Hohe Steuer', () => { const s1 = calculateCompleteTax(params2026({ grossSalaryYearly: 30000 })); expect(result.incomeTax).toBeGreaterThan(s1.incomeTax); });
    it('PV-Kinderlosenzuschlag', () => { const mk = calculateCompleteTax(params2026({ grossSalaryYearly: 30000, taxClass: '5', isChildless: false })); expect(result.careInsurance).toBeGreaterThan(mk.careInsurance); });
  });

  describe('GM2026-007: StKl VI, 2.000€', () => {
    const result = calculateCompleteTax(params2026({ grossSalaryYearly: 24000, taxClass: '6' }));
    it('Höchste Steuer', () => { const s1 = calculateCompleteTax(params2026({ grossSalaryYearly: 24000 })); expect(result.incomeTax).toBeGreaterThan(s1.incomeTax); });
    it('Netto > 0', () => expect(result.netMonthly).toBeGreaterThan(0));
  });
});

describe('Invarianten 2026', () => {
  const salaries = [12000, 24000, 36000, 48000, 60000, 84000, 120000, 180000];
  it('Netto immer positiv', () => { for (const g of salaries) expect(calculateCompleteTax(params2026({ grossSalaryYearly: g })).netMonthly).toBeGreaterThan(0); });
  it('Netto < Brutto', () => { for (const g of salaries) expect(calculateCompleteTax(params2026({ grossSalaryYearly: g })).netYearly).toBeLessThan(g); });
  it('AG-Kosten > Brutto', () => { for (const g of salaries) expect(calculateCompleteTax(params2026({ grossSalaryYearly: g })).employerCosts).toBeGreaterThan(g); });
  it('Summenidentität', () => { for (const g of salaries) { const r = calculateCompleteTax(params2026({ grossSalaryYearly: g })); expect(Math.abs(r.netYearly + r.totalTaxes + r.totalSocialContributions - g)).toBeLessThan(200); } });
  it('Progressiver Steuersatz', () => { let prev = 0; for (const g of [24000, 48000, 96000, 180000]) { const r = calculateCompleteTax(params2026({ grossSalaryYearly: g })).incomeTax / g; expect(r).toBeGreaterThanOrEqual(prev - 0.001); prev = r; } });
});
