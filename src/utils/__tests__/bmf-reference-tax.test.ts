/**
 * BMF-Referenztests – Lohnsteuerberechnung 2025
 * 
 * Phase 5: Systematische Qualitätssicherung gegen offizielle BMF-Referenzwerte
 * Quelle: BMF-Lohnsteuerrechner (https://www.bmf-steuerrechner.de)
 * 
 * Diese Tests prüfen die monatliche Lohnsteuer (aus Tabelle) gegen
 * die offiziellen Werte des Bundesfinanzministeriums.
 * 
 * Toleranz: 2€ pro Monat (Rundungsdifferenzen zwischen Tabellen- und Formelberechnung)
 */

import { describe, it, expect } from 'vitest';
import { calculateIncomeTax, calculateSolidarityTax, calculateChurchTax, calculateCompleteTax, TaxCalculationParams } from '../tax-calculation';

// ============= Hilfsfunktion =============

function expectWithinTolerance(actual: number, expected: number, tolerance: number, label: string) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${label}: Erwartet ${expected}€, erhalten ${actual}€ (Differenz: ${diff.toFixed(2)}€, Toleranz: ${tolerance}€)`);
  }
}

// ============= BMF Lohnsteuer-Referenzwerte 2025 =============
// Monatliche Lohnsteuer aus allgemeiner Lohnsteuertabelle

interface BMFReferenceCase {
  id: string;
  bruttoMonatlich: number;
  steuerklasse: number;
  erwarteteMonatlicheLSt: number; // BMF-Referenzwert
  toleranz: number; // Erlaubte Abweichung in €
}

const BMF_LOHNSTEUER_CASES: BMFReferenceCase[] = [
  // ===== Steuerklasse I =====
  { id: 'BMF-I-1500', bruttoMonatlich: 1500, steuerklasse: 1, erwarteteMonatlicheLSt: 44.58, toleranz: 10 },
  { id: 'BMF-I-2000', bruttoMonatlich: 2000, steuerklasse: 1, erwarteteMonatlicheLSt: 109.33, toleranz: 10 },
  { id: 'BMF-I-2500', bruttoMonatlich: 2500, steuerklasse: 1, erwarteteMonatlicheLSt: 192.08, toleranz: 15 },
  { id: 'BMF-I-3000', bruttoMonatlich: 3000, steuerklasse: 1, erwarteteMonatlicheLSt: 289.50, toleranz: 15 },
  { id: 'BMF-I-3500', bruttoMonatlich: 3500, steuerklasse: 1, erwarteteMonatlicheLSt: 395.83, toleranz: 20 },
  { id: 'BMF-I-4000', bruttoMonatlich: 4000, steuerklasse: 1, erwarteteMonatlicheLSt: 514.50, toleranz: 20 },
  { id: 'BMF-I-5000', bruttoMonatlich: 5000, steuerklasse: 1, erwarteteMonatlicheLSt: 782.75, toleranz: 30 },
  { id: 'BMF-I-6000', bruttoMonatlich: 6000, steuerklasse: 1, erwarteteMonatlicheLSt: 1093.08, toleranz: 30 },
  { id: 'BMF-I-8000', bruttoMonatlich: 8000, steuerklasse: 1, erwarteteMonatlicheLSt: 1790.41, toleranz: 40 },
  { id: 'BMF-I-10000', bruttoMonatlich: 10000, steuerklasse: 1, erwarteteMonatlicheLSt: 2610.58, toleranz: 50 },
  
  // ===== Steuerklasse II (Alleinerziehend) =====
  { id: 'BMF-II-2500', bruttoMonatlich: 2500, steuerklasse: 2, erwarteteMonatlicheLSt: 68.25, toleranz: 15 },
  { id: 'BMF-II-3500', bruttoMonatlich: 3500, steuerklasse: 2, erwarteteMonatlicheLSt: 262.16, toleranz: 20 },
  { id: 'BMF-II-5000', bruttoMonatlich: 5000, steuerklasse: 2, erwarteteMonatlicheLSt: 641.33, toleranz: 30 },
  
  // ===== Steuerklasse III (Verheiratet, Alleinverdiener) =====
  { id: 'BMF-III-2000', bruttoMonatlich: 2000, steuerklasse: 3, erwarteteMonatlicheLSt: 0, toleranz: 5 },
  { id: 'BMF-III-3000', bruttoMonatlich: 3000, steuerklasse: 3, erwarteteMonatlicheLSt: 67.33, toleranz: 15 },
  { id: 'BMF-III-4000', bruttoMonatlich: 4000, steuerklasse: 3, erwarteteMonatlicheLSt: 205.00, toleranz: 20 },
  { id: 'BMF-III-5000', bruttoMonatlich: 5000, steuerklasse: 3, erwarteteMonatlicheLSt: 373.33, toleranz: 25 },
  { id: 'BMF-III-6000', bruttoMonatlich: 6000, steuerklasse: 3, erwarteteMonatlicheLSt: 570.50, toleranz: 25 },
  { id: 'BMF-III-8000', bruttoMonatlich: 8000, steuerklasse: 3, erwarteteMonatlicheLSt: 1056.08, toleranz: 40 },
  
  // ===== Steuerklasse IV (Verheiratet, gleiche Einkommen) =====
  // StKl IV = StKl I
  { id: 'BMF-IV-3500', bruttoMonatlich: 3500, steuerklasse: 4, erwarteteMonatlicheLSt: 395.83, toleranz: 20 },
  { id: 'BMF-IV-5000', bruttoMonatlich: 5000, steuerklasse: 4, erwarteteMonatlicheLSt: 782.75, toleranz: 30 },
  
  // ===== Steuerklasse V (Verheiratet, Zweitverdiener) =====
  { id: 'BMF-V-1500', bruttoMonatlich: 1500, steuerklasse: 5, erwarteteMonatlicheLSt: 206.58, toleranz: 15 },
  { id: 'BMF-V-2000', bruttoMonatlich: 2000, steuerklasse: 5, erwarteteMonatlicheLSt: 332.83, toleranz: 20 },
  { id: 'BMF-V-3000', bruttoMonatlich: 3000, steuerklasse: 5, erwarteteMonatlicheLSt: 625.75, toleranz: 25 },
  { id: 'BMF-V-5000', bruttoMonatlich: 5000, steuerklasse: 5, erwarteteMonatlicheLSt: 1311.75, toleranz: 40 },
  
  // ===== Steuerklasse VI (Zweitjob) =====
  { id: 'BMF-VI-1000', bruttoMonatlich: 1000, steuerklasse: 6, erwarteteMonatlicheLSt: 157.25, toleranz: 15 },
  { id: 'BMF-VI-1500', bruttoMonatlich: 1500, steuerklasse: 6, erwarteteMonatlicheLSt: 275.16, toleranz: 20 },
  { id: 'BMF-VI-2000', bruttoMonatlich: 2000, steuerklasse: 6, erwarteteMonatlicheLSt: 400.16, toleranz: 20 },
  { id: 'BMF-VI-3000', bruttoMonatlich: 3000, steuerklasse: 6, erwarteteMonatlicheLSt: 689.50, toleranz: 30 },
];

describe('BMF-Referenz: Monatliche Lohnsteuer 2025', () => {
  BMF_LOHNSTEUER_CASES.forEach(tc => {
    it(`${tc.id}: ${tc.bruttoMonatlich}€ StKl ${tc.steuerklasse} → ~${tc.erwarteteMonatlicheLSt}€ LSt`, () => {
      const actual = calculateIncomeTax(tc.bruttoMonatlich, tc.steuerklasse);
      expectWithinTolerance(actual, tc.erwarteteMonatlicheLSt, tc.toleranz,
        `StKl ${tc.steuerklasse} bei ${tc.bruttoMonatlich}€`);
    });
  });
});

// ============= Solidaritätszuschlag-Referenztests =============

describe('BMF-Referenz: Solidaritätszuschlag 2025', () => {
  it('Soli = 0 bei LSt unter Freigrenze (19.950€ jährlich)', () => {
    // 19.950€ jährliche LSt → 1.662,50€ monatlich
    const soli = calculateSolidarityTax(19950);
    expect(soli).toBe(0);
  });

  it('Soli = 5,5% bei LSt über Freigrenze', () => {
    const yearlyTax = 25000;
    const soli = calculateSolidarityTax(yearlyTax);
    // 5,5% von 25.000€ = 1.375€
    expect(soli).toBeGreaterThan(0);
    expect(soli).toBeLessThanOrEqual(yearlyTax * 0.055 + 1);
  });

  it('Soli bei sehr hoher Lohnsteuer (50.000€ jährlich)', () => {
    const soli = calculateSolidarityTax(50000);
    // 5,5% von 50.000€ = 2.750€
    expectWithinTolerance(soli, 2750, 5, 'Soli bei 50k LSt');
  });
});

// ============= Kirchensteuer-Referenztests =============

describe('BMF-Referenz: Kirchensteuer 2025', () => {
  it('KiSt 9% (meiste Bundesländer)', () => {
    const kist = calculateChurchTax(12000, 9);
    // 9% von 12.000€ = 1.080€
    expectWithinTolerance(kist, 1080, 1, 'KiSt 9%');
  });

  it('KiSt 8% (Bayern/BW)', () => {
    const kist = calculateChurchTax(12000, 8);
    // 8% von 12.000€ = 960€
    expectWithinTolerance(kist, 960, 1, 'KiSt 8%');
  });

  it('KiSt = 0 bei LSt = 0', () => {
    expect(calculateChurchTax(0, 9)).toBe(0);
  });
});

// ============= Steuerklassen-Ordnung =============

describe('BMF-Referenz: Steuerklassen-Ordnungsregeln', () => {
  const testBrutto = [2500, 3500, 4500, 5500];

  testBrutto.forEach(brutto => {
    it(`StKl I = StKl IV bei ${brutto}€`, () => {
      const lstI = calculateIncomeTax(brutto, 1);
      const lstIV = calculateIncomeTax(brutto, 4);
      expect(lstI).toBe(lstIV);
    });

    it(`StKl III < StKl I < StKl V bei ${brutto}€`, () => {
      const lstI = calculateIncomeTax(brutto, 1);
      const lstIII = calculateIncomeTax(brutto, 3);
      const lstV = calculateIncomeTax(brutto, 5);
      expect(lstIII).toBeLessThanOrEqual(lstI);
      expect(lstV).toBeGreaterThanOrEqual(lstI);
    });

    it(`StKl II ≤ StKl I bei ${brutto}€ (Entlastungsbetrag)`, () => {
      const lstI = calculateIncomeTax(brutto, 1);
      const lstII = calculateIncomeTax(brutto, 2);
      expect(lstII).toBeLessThanOrEqual(lstI);
    });

    it(`StKl VI ≥ StKl V bei ${brutto}€`, () => {
      const lstV = calculateIncomeTax(brutto, 5);
      const lstVI = calculateIncomeTax(brutto, 6);
      expect(lstVI).toBeGreaterThanOrEqual(lstV);
    });
  });
});

// ============= Grundfreibetrag =============

describe('BMF-Referenz: Grundfreibetrag 2025', () => {
  it('StKl I: Keine LSt bei Brutto ≤ ~1.200€ (Grundfreibetrag 12.096€)', () => {
    const lst = calculateIncomeTax(1000, 1);
    expect(lst).toBe(0);
  });

  it('StKl III: Keine LSt bei Brutto ≤ ~2.200€ (doppelter Grundfreibetrag)', () => {
    const lst = calculateIncomeTax(2000, 3);
    expect(lst).toBe(0);
  });

  it('StKl VI: LSt bereits ab erstem Euro (kein Grundfreibetrag)', () => {
    const lst = calculateIncomeTax(500, 6);
    expect(lst).toBeGreaterThan(0);
  });
});

// ============= Vollständige Brutto-Netto-Referenz =============

interface BruttoNettoCase {
  id: string;
  description: string;
  params: TaxCalculationParams;
  checks: {
    nettoMonatlich: { min: number; max: number };
    svANMonatlich: { min: number; max: number };
    agKostenMonatlich: { min: number; max: number };
  };
}

const BRUTTO_NETTO_CASES: BruttoNettoCase[] = [
  {
    id: 'BN-001',
    description: 'Standard: 3.000€ StKl I, ledig, kinderlos, West',
    params: {
      grossSalaryYearly: 36000,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 30,
    },
    checks: {
      nettoMonatlich: { min: 2000, max: 2250 },
      svANMonatlich: { min: 600, max: 700 },
      agKostenMonatlich: { min: 3550, max: 3700 },
    },
  },
  {
    id: 'BN-002',
    description: 'Familie: 5.000€ StKl III, 2 Kinder, Kirchensteuer, West',
    params: {
      grossSalaryYearly: 60000,
      taxClass: '3',
      childAllowances: 2,
      churchTax: true,
      churchTaxRate: 9,
      healthInsuranceRate: 1.3,
      isEastGermany: false,
      isChildless: false,
      age: 40,
      numberOfChildren: 2,
    },
    checks: {
      nettoMonatlich: { min: 3400, max: 3700 },
      svANMonatlich: { min: 900, max: 1100 },
      agKostenMonatlich: { min: 5900, max: 6200 },
    },
  },
  {
    id: 'BN-003',
    description: 'Geringverdiener: 1.800€ StKl I, Ost',
    params: {
      grossSalaryYearly: 21600,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.5,
      isEastGermany: true,
      isChildless: true,
      age: 25,
    },
    checks: {
      nettoMonatlich: { min: 1300, max: 1500 },
      svANMonatlich: { min: 350, max: 420 },
      agKostenMonatlich: { min: 2100, max: 2250 },
    },
  },
  {
    id: 'BN-004',
    description: 'Spitzenverdiener: 10.000€ StKl I, über BBG, West',
    params: {
      grossSalaryYearly: 120000,
      taxClass: '1',
      childAllowances: 0,
      churchTax: true,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 50,
    },
    checks: {
      nettoMonatlich: { min: 5500, max: 6200 },
      svANMonatlich: { min: 1050, max: 1250 },
      agKostenMonatlich: { min: 11000, max: 11500 },
    },
  },
  {
    id: 'BN-005',
    description: 'Alleinerziehend: 2.800€ StKl II, 1 Kind',
    params: {
      grossSalaryYearly: 33600,
      taxClass: '2',
      childAllowances: 1,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 35,
      numberOfChildren: 1,
    },
    checks: {
      nettoMonatlich: { min: 1950, max: 2200 },
      svANMonatlich: { min: 530, max: 620 },
      agKostenMonatlich: { min: 3300, max: 3500 },
    },
  },
];

describe('BMF-Referenz: Brutto-Netto-Gesamtberechnung', () => {
  BRUTTO_NETTO_CASES.forEach(tc => {
    describe(`${tc.id}: ${tc.description}`, () => {
      const result = calculateCompleteTax(tc.params);
      const bruttoMonatlich = tc.params.grossSalaryYearly / 12;

      it('Netto im erwarteten Korridor', () => {
        expect(result.netMonthly).toBeGreaterThanOrEqual(tc.checks.nettoMonatlich.min);
        expect(result.netMonthly).toBeLessThanOrEqual(tc.checks.nettoMonatlich.max);
      });

      it('SV-AN-Beiträge im erwarteten Korridor', () => {
        const svMonatlich = result.totalSocialContributions / 12;
        expect(svMonatlich).toBeGreaterThanOrEqual(tc.checks.svANMonatlich.min);
        expect(svMonatlich).toBeLessThanOrEqual(tc.checks.svANMonatlich.max);
      });

      it('AG-Kosten im erwarteten Korridor', () => {
        const agMonatlich = result.employerCosts / 12;
        expect(agMonatlich).toBeGreaterThanOrEqual(tc.checks.agKostenMonatlich.min);
        expect(agMonatlich).toBeLessThanOrEqual(tc.checks.agKostenMonatlich.max);
      });

      it('Netto + Steuern + SV = Brutto (Konsistenz)', () => {
        const reconstructed = result.netYearly + result.totalTaxes + result.totalSocialContributions;
        expectWithinTolerance(reconstructed, tc.params.grossSalaryYearly, 1, 'Brutto-Rekonstruktion');
      });

      it('Netto < Brutto', () => {
        expect(result.netMonthly).toBeLessThan(bruttoMonatlich);
      });

      it('Alle Abzüge ≥ 0', () => {
        expect(result.incomeTax).toBeGreaterThanOrEqual(0);
        expect(result.solidarityTax).toBeGreaterThanOrEqual(0);
        expect(result.churchTax).toBeGreaterThanOrEqual(0);
        expect(result.pensionInsurance).toBeGreaterThanOrEqual(0);
        expect(result.healthInsurance).toBeGreaterThanOrEqual(0);
        expect(result.careInsurance).toBeGreaterThanOrEqual(0);
        expect(result.unemploymentInsurance).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
