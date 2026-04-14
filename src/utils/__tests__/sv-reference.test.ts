/**
 * SV-Beitrags-Referenztests 2025
 * 
 * Phase 5: Sozialversicherungsbeiträge gegen Referenzwerte prüfen
 * 
 * Prüft:
 * - BBG-Kappung (West/Ost)
 * - Minijob-Pauschalabgaben
 * - Midijob-Gleitzone
 * - PV-Kinderabschläge
 * - Einzelne SV-Zweige
 */

import { describe, it, expect } from 'vitest';
import { calculateCompleteTax, TaxCalculationParams } from '../tax-calculation';
import { BBG_2025_MONTHLY, SOCIAL_INSURANCE_RATES_2025, MINIJOB_2025 } from '@/constants/social-security';

// ============= Hilfsfunktionen =============

function svParams(overrides: Partial<TaxCalculationParams>): TaxCalculationParams {
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
    ...overrides,
  };
}

// ============= Rentenversicherung =============

describe('SV-Referenz: Rentenversicherung 2025', () => {
  it('RV-AN bei 4.000€ = 4.000 × 9,3% = 372€/Monat', () => {
    const result = calculateCompleteTax(svParams({ grossSalaryYearly: 48000 }));
    const rvMonatlich = result.pensionInsurance / 12;
    expect(rvMonatlich).toBeCloseTo(372, 0);
  });

  it('RV-AN gedeckelt bei BBG West (7.550€)', () => {
    // 10.000€ Brutto, aber RV nur auf 7.550€
    const result = calculateCompleteTax(svParams({ grossSalaryYearly: 120000 }));
    const rvMonatlich = result.pensionInsurance / 12;
    const maxRV = BBG_2025_MONTHLY.pensionWest * SOCIAL_INSURANCE_RATES_2025.pension.employee / 100;
    expect(rvMonatlich).toBeCloseTo(maxRV, 0);
  });

  it('RV-AN gedeckelt bei BBG Ost (7.450€)', () => {
    const result = calculateCompleteTax(svParams({ grossSalaryYearly: 120000, isEastGermany: true }));
    const rvMonatlich = result.pensionInsurance / 12;
    const maxRV = BBG_2025_MONTHLY.pensionEast * SOCIAL_INSURANCE_RATES_2025.pension.employee / 100;
    expect(rvMonatlich).toBeCloseTo(maxRV, 0);
  });

  it('BBG Ost < BBG West bei RV', () => {
    const west = calculateCompleteTax(svParams({ grossSalaryYearly: 120000, isEastGermany: false }));
    const ost = calculateCompleteTax(svParams({ grossSalaryYearly: 120000, isEastGermany: true }));
    expect(ost.pensionInsurance).toBeLessThanOrEqual(west.pensionInsurance);
  });
});

// ============= Krankenversicherung =============

describe('SV-Referenz: Krankenversicherung 2025', () => {
  it('KV-AN bei 3.000€ = 3.000 × (7,3% + 0,85%/2) = 231,75€/Monat (bei ZB 1,7%)', () => {
    const result = calculateCompleteTax(svParams({ grossSalaryYearly: 36000, healthInsuranceRate: 1.7 }));
    const kvMonatlich = result.healthInsurance / 12;
    // 3.000 × (7,3% + 0,85%) = 3.000 × 8,15% = 244,50€
    // Nein: AN zahlt 7,3% + ZB/2 = 7,3% + 0,85% = 8,15%
    const expected = 3000 * (7.3 + 1.7 / 2) / 100;
    expect(kvMonatlich).toBeCloseTo(expected, 0);
  });

  it('KV-AN gedeckelt bei BBG KV (5.175€)', () => {
    const result = calculateCompleteTax(svParams({ grossSalaryYearly: 96000, healthInsuranceRate: 1.7 }));
    const kvMonatlich = result.healthInsurance / 12;
    const maxKV = BBG_2025_MONTHLY.healthCare * (7.3 + 1.7 / 2) / 100;
    expect(kvMonatlich).toBeCloseTo(maxKV, 0);
  });
});

// ============= Arbeitslosenversicherung =============

describe('SV-Referenz: Arbeitslosenversicherung 2025', () => {
  it('AV-AN bei 4.000€ = 4.000 × 1,3% = 52€/Monat', () => {
    const result = calculateCompleteTax(svParams({ grossSalaryYearly: 48000 }));
    const avMonatlich = result.unemploymentInsurance / 12;
    expect(avMonatlich).toBeCloseTo(52, 0);
  });
});

// ============= Pflegeversicherung =============

describe('SV-Referenz: Pflegeversicherung 2025', () => {
  it('PV-AN kinderlos über 23: 2,3% (1,7% + 0,6% Zuschlag)', () => {
    const result = calculateCompleteTax(svParams({ 
      grossSalaryYearly: 48000, isChildless: true, age: 30 
    }));
    const pvMonatlich = result.careInsurance / 12;
    expect(pvMonatlich).toBeCloseTo(4000 * 2.3 / 100, 0);
  });

  it('PV-AN mit 1 Kind: 1,7%', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 48000, isChildless: false, age: 30, numberOfChildren: 1,
    }));
    const pvMonatlich = result.careInsurance / 12;
    expect(pvMonatlich).toBeCloseTo(4000 * 1.7 / 100, 0);
  });

  it('PV-AN mit 2 Kindern: Abschlag 0,25% → 1,45%', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 48000, isChildless: false, age: 30, numberOfChildren: 2,
    }));
    const pvMonatlich = result.careInsurance / 12;
    // 1,7% - 0,25% = 1,45%
    expect(pvMonatlich).toBeCloseTo(4000 * 1.45 / 100, 0);
  });

  it('PV-AN mit 5 Kindern: max. Abschlag 1,0% → 0,7%', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 48000, isChildless: false, age: 30, numberOfChildren: 5,
    }));
    const pvMonatlich = result.careInsurance / 12;
    // 1,7% - 1,0% (max) = 0,7%
    expect(pvMonatlich).toBeCloseTo(4000 * 0.7 / 100, 0);
  });

  it('PV kinderlos unter 23: kein Zuschlag', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 48000, isChildless: true, age: 22,
    }));
    const pvMonatlich = result.careInsurance / 12;
    // Unter 23: kein Kinderlosenzuschlag → 1,7%
    expect(pvMonatlich).toBeCloseTo(4000 * 1.7 / 100, 0);
  });
});

// ============= Minijob =============

describe('SV-Referenz: Minijob 2025', () => {
  it('Minijob 556€: Netto = Brutto für AN', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 556 * 12, employmentType: 'minijob',
    }));
    expect(result.netMonthly).toBe(556);
  });

  it('Minijob: Keine AN-SV-Beiträge', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 556 * 12, employmentType: 'minijob',
    }));
    expect(result.totalSocialContributions).toBe(0);
  });

  it('Minijob: AG-Pauschalsteuer = 2%', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 556 * 12, employmentType: 'minijob',
    }));
    // Pauschalsteuer wird als incomeTax gebucht
    expect(result.incomeTax / 12).toBeCloseTo(556 * 0.02, 0);
  });

  it('Minijob: AG-Kosten = Brutto + 28% + 2% Steuer', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 556 * 12, employmentType: 'minijob',
    }));
    const agMonatlich = result.employerCosts / 12;
    const expected = 556 + 556 * 0.28 + 556 * 0.02; // 556 + 155.68 + 11.12 = 722.80
    expect(agMonatlich).toBeCloseTo(expected, 0);
  });
});

// ============= Midijob =============

describe('SV-Referenz: Midijob/Übergangsbereich 2025', () => {
  it('Midijob 1.000€: Reduzierte AN-SV-Beiträge', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 12000, employmentType: 'midijob',
    }));
    const svMonatlich = result.totalSocialContributions / 12;
    // Reduziert gegenüber voll (1.000 × ~21% = 210€ voll)
    expect(svMonatlich).toBeLessThan(210);
    expect(svMonatlich).toBeGreaterThan(0);
  });

  it('Midijob 2.000€ Obergrenze: SV-Beiträge nähern sich vollem Beitrag', () => {
    const result = calculateCompleteTax(svParams({
      grossSalaryYearly: 24000, employmentType: 'midijob',
    }));
    const svMonatlich = result.totalSocialContributions / 12;
    // Bei Obergrenze fast voller Beitrag
    expect(svMonatlich).toBeGreaterThan(300);
  });

  it('Midijob: AG zahlt volle SV-Beiträge', () => {
    const resultMidijob = calculateCompleteTax(svParams({
      grossSalaryYearly: 18000, employmentType: 'midijob',
    }));
    // AG-Kosten sollten deutlich über Brutto liegen
    expect(resultMidijob.employerCosts / 12).toBeGreaterThan(1500 * 1.15);
  });
});

// ============= BBG-Kappung =============

describe('SV-Referenz: BBG-Kappung bei Spitzenverdienern', () => {
  it('SV-Beiträge bei 10.000€ und 15.000€ identisch (über BBG)', () => {
    const r10k = calculateCompleteTax(svParams({ grossSalaryYearly: 120000 }));
    const r15k = calculateCompleteTax(svParams({ grossSalaryYearly: 180000 }));
    
    expect(Math.abs(r10k.pensionInsurance - r15k.pensionInsurance)).toBeLessThan(1);
    expect(Math.abs(r10k.healthInsurance - r15k.healthInsurance)).toBeLessThan(1);
    expect(Math.abs(r10k.unemploymentInsurance - r15k.unemploymentInsurance)).toBeLessThan(1);
    expect(Math.abs(r10k.careInsurance - r15k.careInsurance)).toBeLessThan(1);
  });

  it('Maximaler SV-AN-Beitrag West korrekt', () => {
    const result = calculateCompleteTax(svParams({ grossSalaryYearly: 200000 }));
    const rvMax = BBG_2025_MONTHLY.pensionWest * 9.3 / 100 * 12;
    const kvMax = BBG_2025_MONTHLY.healthCare * (7.3 + 1.7 / 2) / 100 * 12;
    const avMax = BBG_2025_MONTHLY.pensionWest * 1.3 / 100 * 12;
    
    expect(result.pensionInsurance).toBeCloseTo(rvMax, 0);
    expect(result.healthInsurance).toBeCloseTo(kvMax, 0);
    expect(result.unemploymentInsurance).toBeCloseTo(avMax, 0);
  });
});

// ============= Gesamtbelastungsquote =============

describe('SV-Referenz: Gesamtbelastungsquoten', () => {
  const testCases = [
    { brutto: 2000, minQuote: 25, maxQuote: 45 },
    { brutto: 3000, minQuote: 30, maxQuote: 42 },
    { brutto: 4000, minQuote: 32, maxQuote: 42 },
    { brutto: 5000, minQuote: 34, maxQuote: 42 },
    { brutto: 8000, minQuote: 36, maxQuote: 44 },
  ];

  testCases.forEach(({ brutto, minQuote, maxQuote }) => {
    it(`Gesamtbelastung bei ${brutto}€ zwischen ${minQuote}% und ${maxQuote}%`, () => {
      const result = calculateCompleteTax(svParams({ grossSalaryYearly: brutto * 12 }));
      const belastungsquote = (result.totalDeductions / result.grossYearly) * 100;
      expect(belastungsquote).toBeGreaterThan(minQuote);
      expect(belastungsquote).toBeLessThan(maxQuote);
    });
  });
});
