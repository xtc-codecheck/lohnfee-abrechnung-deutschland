/**
 * Golden-Master Tests für Lohnabrechnungen 2026
 * 
 * Referenz-Validierung mit 2026er Parametern:
 * - BBG RV/AV: €96.600 (West=Ost vereinheitlicht)
 * - BBG KV/PV: €66.150
 * - Grundfreibetrag: €12.336
 * - Kinderfreibetrag: €6.672
 * - PV-Satz: 3,6% (Kinderlose: 4,2%)
 * 
 * Toleranz: 0.01 EUR (1 Cent) für exakte Werte, plausible Bandbreiten für Referenzwerte
 */

import { describe, it, expect } from 'vitest';
import { calculateCompleteTax, TaxCalculationParams } from '../tax-calculation';

function params2026(overrides: Partial<TaxCalculationParams> = {}): TaxCalculationParams {
  return {
    grossSalaryYearly: 48000,
    taxClass: '1',
    childAllowances: 0,
    churchTax: false,
    churchTaxRate: 9,
    healthInsuranceRate: 1.7,
    isEastGermany: false,
    isChildless: true,
    age: 30,
    year: 2026,
    ...overrides,
  };
}

// ============= 2026 vs 2025 Vergleichstests =============

describe('Golden-Master 2026: Parameteränderungen gegenüber 2025', () => {
  it('2026 hat höheren Grundfreibetrag → weniger Lohnsteuer', () => {
    const r2025 = calculateCompleteTax(params2026({ year: 2025 }));
    const r2026 = calculateCompleteTax(params2026({ year: 2026 }));
    
    // Grundfreibetrag steigt von 12.096 auf 12.336 → weniger Steuer
    expect(r2026.incomeTax).toBeLessThanOrEqual(r2025.incomeTax);
  });

  it('2026 hat höhere BBG RV → höhere SV bei hohen Gehältern', () => {
    // 8.000€/Monat – knapp über 2025 BBG (7.550) aber unter 2026 BBG (8.050)
    const r2025 = calculateCompleteTax(params2026({ grossSalaryYearly: 96000, year: 2025 }));
    const r2026 = calculateCompleteTax(params2026({ grossSalaryYearly: 96000, year: 2026 }));
    
    // 2026: BBG höher → mehr RV-Beiträge bei 8.000€
    expect(r2026.pensionInsurance).toBeGreaterThanOrEqual(r2025.pensionInsurance);
  });

  it('2026 hat höheren PV-Satz → höhere Pflegeversicherung', () => {
    const r2025 = calculateCompleteTax(params2026({ year: 2025, isChildless: false }));
    const r2026 = calculateCompleteTax(params2026({ year: 2026, isChildless: false }));
    
    // PV steigt von 3,4% auf 3,6%
    expect(r2026.careInsurance).toBeGreaterThanOrEqual(r2025.careInsurance);
  });

  it('2026: BBG West = BBG Ost (RV vereinheitlicht)', () => {
    const west = calculateCompleteTax(params2026({ isEastGermany: false, grossSalaryYearly: 96000 }));
    const east = calculateCompleteTax(params2026({ isEastGermany: true, grossSalaryYearly: 96000 }));
    
    // Ab 2026: Gleiche BBG → gleiche RV-Beiträge
    expect(Math.abs(west.pensionInsurance - east.pensionInsurance)).toBeLessThan(1);
  });
});

// ============= Golden-Master Referenzfälle 2026 =============

describe('Golden-Master 2026: Referenzabrechnungen', () => {
  describe('GM2026-001: StKl I, ledig, 4.000€, West', () => {
    const result = calculateCompleteTax(params2026({ grossSalaryYearly: 48000 }));

    it('Brutto korrekt', () => expect(result.grossMonthly).toBe(4000));
    it('Netto plausibel (2.400–2.800€)', () => {
      expect(result.netMonthly).toBeGreaterThan(2400);
      expect(result.netMonthly).toBeLessThan(2800);
    });
    it('Lohnsteuer plausibel', () => {
      expect(result.incomeTax / 12).toBeGreaterThan(300);
      expect(result.incomeTax / 12).toBeLessThan(700);
    });
    it('SV-Beiträge AN plausibel (~20-22%)', () => {
      const svRate = result.totalSocialContributions / result.grossYearly;
      expect(svRate).toBeGreaterThan(0.19);
      expect(svRate).toBeLessThan(0.23);
    });
    it('AG-Kosten > Brutto', () => expect(result.employerCosts).toBeGreaterThan(48000));
  });

  describe('GM2026-002: StKl III, 2 Kinder, KiSt, 5.500€, West', () => {
    const result = calculateCompleteTax(params2026({
      grossSalaryYearly: 66000,
      taxClass: '3',
      childAllowances: 2,
      churchTax: true,
      churchTaxRate: 9,
      isChildless: false,
      numberOfChildren: 2,
      age: 40,
    }));

    it('Brutto korrekt', () => expect(result.grossMonthly).toBe(5500));
    it('Netto deutlich höher als StKl I', () => {
      const stk1 = calculateCompleteTax(params2026({ grossSalaryYearly: 66000 }));
      expect(result.netMonthly).toBeGreaterThan(stk1.netMonthly);
    });
    it('Kirchensteuer vorhanden', () => expect(result.churchTax).toBeGreaterThan(0));
    it('PV-Beitrag mit Kinderabschlag reduziert', () => {
      const ohneKinder = calculateCompleteTax(params2026({
        grossSalaryYearly: 66000, isChildless: true, numberOfChildren: 0,
      }));
      expect(result.careInsurance).toBeLessThan(ohneKinder.careInsurance);
    });
  });

  describe('GM2026-003: Minijob 556€', () => {
    const result = calculateCompleteTax(params2026({
      grossSalaryYearly: 556 * 12,
      employmentType: 'minijob',
      age: 20,
    }));

    it('Netto = Brutto für AN', () => expect(result.netMonthly).toBe(556));
    it('Keine AN-SV-Beiträge', () => expect(result.totalSocialContributions).toBe(0));
    it('AG-Kosten > Brutto (AG-Pauschalabgaben)', () => {
      expect(result.employerCosts).toBeGreaterThan(556 * 12);
    });
  });

  describe('GM2026-004: Midijob 1.200€', () => {
    const result = calculateCompleteTax(params2026({
      grossSalaryYearly: 1200 * 12,
      employmentType: 'midijob',
      age: 25,
    }));

    it('Netto > 0', () => expect(result.netMonthly).toBeGreaterThan(0));
    it('SV-Beiträge reduziert (< voller Satz)', () => {
      const full = calculateCompleteTax(params2026({ grossSalaryYearly: 1200 * 12 }));
      expect(result.totalSocialContributions).toBeLessThanOrEqual(full.totalSocialContributions);
    });
  });

  describe('GM2026-005: Hochverdiener über BBG, 10.000€/Monat', () => {
    const result = calculateCompleteTax(params2026({
      grossSalaryYearly: 120000,
      churchTax: true,
      churchTaxRate: 9,
      isChildless: false,
      age: 50,
    }));

    it('RV gedeckelt bei BBG 2026 (96.600€ Jahresbasis)', () => {
      // Max RV AN: 96.600 * 9,3% = 8.983,80
      expect(result.pensionInsurance).toBeLessThanOrEqual(96600 * 0.093 + 1);
    });
    it('KV gedeckelt bei BBG 2026 (66.150€)', () => {
      // Max KV AN: 66.150 * (7,3% + Zusatzbeitrag/2)
      const maxKV = 66150 * (0.073 + 0.017 / 2);
      expect(result.healthInsurance).toBeLessThanOrEqual(maxKV + 50);
    });
    it('Soli vorhanden bei hohem Einkommen', () => {
      expect(result.solidarityTax).toBeGreaterThan(0);
    });
    it('Netto plausibel', () => {
      expect(result.netMonthly).toBeGreaterThan(4500);
      expect(result.netMonthly).toBeLessThan(7000);
    });
  });

  describe('GM2026-006: StKl V, 2.500€, ohne Kinder', () => {
    const result = calculateCompleteTax(params2026({
      grossSalaryYearly: 30000,
      taxClass: '5',
      isChildless: true,
      age: 35,
    }));

    it('Hohe Steuer durch StKl V', () => {
      const stk1 = calculateCompleteTax(params2026({ grossSalaryYearly: 30000 }));
      expect(result.incomeTax).toBeGreaterThan(stk1.incomeTax);
    });
    it('Kinderlosenzuschlag PV aktiv', () => {
      const mitKindern = calculateCompleteTax(params2026({
        grossSalaryYearly: 30000, taxClass: '5', isChildless: false,
      }));
      expect(result.careInsurance).toBeGreaterThan(mitKindern.careInsurance);
    });
  });

  describe('GM2026-007: StKl VI (Zweitjob), 2.000€', () => {
    const result = calculateCompleteTax(params2026({
      grossSalaryYearly: 24000,
      taxClass: '6',
    }));

    it('StKl VI: höchste Steuerbelastung', () => {
      const stk1 = calculateCompleteTax(params2026({ grossSalaryYearly: 24000 }));
      expect(result.incomeTax).toBeGreaterThan(stk1.incomeTax);
    });
    it('Netto > 0', () => expect(result.netMonthly).toBeGreaterThan(0));
  });
});

// ============= 2026 Invarianten =============

describe('Invarianten 2026', () => {
  const salaries = [12000, 24000, 36000, 48000, 60000, 84000, 120000, 180000];

  it('Netto immer positiv', () => {
    for (const gross of salaries) {
      const r = calculateCompleteTax(params2026({ grossSalaryYearly: gross }));
      expect(r.netMonthly).toBeGreaterThan(0);
    }
  });

  it('Netto < Brutto (reguläre Beschäftigung)', () => {
    for (const gross of salaries) {
      const r = calculateCompleteTax(params2026({ grossSalaryYearly: gross }));
      expect(r.netYearly).toBeLessThan(gross);
    }
  });

  it('AG-Kosten > Brutto', () => {
    for (const gross of salaries) {
      const r = calculateCompleteTax(params2026({ grossSalaryYearly: gross }));
      expect(r.employerCosts).toBeGreaterThan(gross);
    }
  });

  it('Summenidentität: Brutto = Netto + Steuern + SV', () => {
    for (const gross of salaries) {
      const r = calculateCompleteTax(params2026({ grossSalaryYearly: gross }));
      const reconstructed = r.netYearly + r.totalTaxes + r.totalSocialContributions;
      expect(Math.abs(reconstructed - gross)).toBeLessThan(200);
    }
  });

  it('Progressiver Steuersatz steigt mit Einkommen', () => {
    let prevRate = 0;
    for (const gross of [24000, 48000, 96000, 180000]) {
      const r = calculateCompleteTax(params2026({ grossSalaryYearly: gross }));
      const rate = r.incomeTax / gross;
      expect(rate).toBeGreaterThanOrEqual(prevRate - 0.001);
      prevRate = rate;
    }
  });
});
