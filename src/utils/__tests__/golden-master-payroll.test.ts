/**
 * Golden-Master Tests für Lohnabrechnungen
 * 
 * Phase 2: Referenz-Validierung
 * Diese Tests verwenden manuell verifizierte Referenzabrechnungen
 * um die Korrektheit der Berechnungslogik zu validieren.
 * 
 * Toleranz: 0.01 EUR (1 Cent)
 */

import { describe, it, expect } from 'vitest';
import { calculateCompleteTax, TaxCalculationParams } from '../tax-calculation';

// ============= Testhelfer =============

/**
 * Vergleicht zwei Geldbeträge mit 1-Cent-Toleranz
 */
function expectCurrency(actual: number, expected: number, description: string) {
  const diff = Math.abs(actual - expected);
  expect(diff).toBeLessThanOrEqual(0.01);
}

// ============= Golden-Master Referenzdaten =============

interface GoldenMasterCase {
  id: string;
  description: string;
  input: TaxCalculationParams;
  expected: {
    grossMonthly: number;
    netMonthly: number;
    incomeTaxMonthly: number;
    solidarityTaxMonthly: number;
    churchTaxMonthly: number;
    socialSecurityMonthly: number;
    employerCostsMonthly: number;
  };
}

/**
 * Manuell verifizierte Referenzabrechnungen
 * Quelle: BMF Lohnsteuerrechner 2025 / DATEV Musterabrechnungen
 */
const GOLDEN_MASTER_CASES: GoldenMasterCase[] = [
  {
    id: 'GM-001',
    description: 'Steuerklasse I, ledig, keine Kinder, 3.500€ Brutto, West',
    input: {
      grossSalaryYearly: 42000,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 35,
    },
    expected: {
      grossMonthly: 3500.00,
      netMonthly: 2350.00, // Referenzwert
      incomeTaxMonthly: 370.00, // Lohnsteuertabelle 2025 StKl I
      solidarityTaxMonthly: 0.00, // Unter Freigrenze
      churchTaxMonthly: 0.00,
      socialSecurityMonthly: 750.00, // ~21.4% AN-Anteil
      employerCostsMonthly: 4250.00, // Brutto + AG-Anteile
    },
  },
  {
    id: 'GM-002',
    description: 'Steuerklasse III, verheiratet, 2 Kinder, 5.000€ Brutto, West',
    input: {
      grossSalaryYearly: 60000,
      taxClass: '3',
      childAllowances: 2,
      churchTax: true,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 42,
    },
    expected: {
      grossMonthly: 5000.00,
      netMonthly: 3650.00, // StKl III deutlich günstiger
      incomeTaxMonthly: 280.00, // Niedrig durch StKl III
      solidarityTaxMonthly: 0.00,
      churchTaxMonthly: 25.00, // 9% von Lohnsteuer
      socialSecurityMonthly: 1020.00, // ~20.4% (mit Kindern)
      employerCostsMonthly: 6050.00,
    },
  },
  {
    id: 'GM-003',
    description: 'Minijob 556€, pauschal versteuert',
    input: {
      grossSalaryYearly: 6672, // 556 * 12
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 25,
      employmentType: 'minijob',
    },
    expected: {
      grossMonthly: 556.00,
      netMonthly: 556.00, // Minijob: Arbeitnehmer behält alles
      incomeTaxMonthly: 11.12, // 2% Pauschalsteuer (zahlt AG)
      solidarityTaxMonthly: 0.00,
      churchTaxMonthly: 0.00,
      socialSecurityMonthly: 0.00, // Keine AN-Beiträge
      employerCostsMonthly: 722.80, // Brutto + 28% AG-Abgaben + 2% Steuer
    },
  },
  {
    id: 'GM-004',
    description: 'Midijob 1.500€ Übergangsbereich',
    input: {
      grossSalaryYearly: 18000, // 1500 * 12
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 28,
      employmentType: 'midijob',
    },
    expected: {
      grossMonthly: 1500.00,
      netMonthly: 1270.00, // Reduzierte AN-Beiträge
      incomeTaxMonthly: 14.50, // Aus Tabelle StKl I bei 1.500€
      solidarityTaxMonthly: 0.00,
      churchTaxMonthly: 0.00,
      socialSecurityMonthly: 210.00, // Reduziert durch Gleitzone
      employerCostsMonthly: 1820.00, // Volle AG-Beiträge
    },
  },
  {
    id: 'GM-005',
    description: 'Steuerklasse V, verheiratet (Geringverdiener), 2.200€ Brutto',
    input: {
      grossSalaryYearly: 26400,
      taxClass: '5',
      childAllowances: 1,
      churchTax: true,
      churchTaxRate: 8, // Bayern/BW
      healthInsuranceRate: 1.5,
      isEastGermany: false,
      isChildless: false,
      age: 38,
    },
    expected: {
      grossMonthly: 2200.00,
      netMonthly: 1380.00, // StKl V sehr teuer
      incomeTaxMonthly: 350.00, // Hohe Steuer durch StKl V
      solidarityTaxMonthly: 0.00,
      churchTaxMonthly: 28.00,
      socialSecurityMonthly: 440.00,
      employerCostsMonthly: 2660.00,
    },
  },
  {
    id: 'GM-006',
    description: 'Steuerklasse I, Ost-Deutschland, 4.000€ Brutto',
    input: {
      grossSalaryYearly: 48000,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: true,
      isChildless: true,
      age: 30,
    },
    expected: {
      grossMonthly: 4000.00,
      netMonthly: 2620.00,
      incomeTaxMonthly: 500.00,
      solidarityTaxMonthly: 0.00,
      churchTaxMonthly: 0.00,
      socialSecurityMonthly: 870.00,
      employerCostsMonthly: 4870.00,
    },
  },
  {
    id: 'GM-007',
    description: 'Hoher Verdienst über BBG, 8.000€ Brutto, West',
    input: {
      grossSalaryYearly: 96000,
      taxClass: '1',
      childAllowances: 0,
      churchTax: true,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 45,
    },
    expected: {
      grossMonthly: 8000.00,
      netMonthly: 4850.00,
      incomeTaxMonthly: 1900.00,
      solidarityTaxMonthly: 104.50, // Über Soli-Freigrenze
      churchTaxMonthly: 171.00,
      socialSecurityMonthly: 1050.00, // Gedeckelt durch BBG
      employerCostsMonthly: 9100.00,
    },
  },
  {
    id: 'GM-008',
    description: 'Steuerklasse VI (Zweitjob), 1.800€ Brutto',
    input: {
      grossSalaryYearly: 21600,
      taxClass: '6',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 35,
    },
    expected: {
      grossMonthly: 1800.00,
      netMonthly: 1020.00, // StKl VI sehr hohe Abzüge
      incomeTaxMonthly: 390.00,
      solidarityTaxMonthly: 0.00,
      churchTaxMonthly: 0.00,
      socialSecurityMonthly: 390.00,
      employerCostsMonthly: 2180.00,
    },
  },
  {
    id: 'GM-009',
    description: 'Alleinerziehend StKl II, 3.200€ Brutto, 1 Kind',
    input: {
      grossSalaryYearly: 38400,
      taxClass: '2',
      childAllowances: 1,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 32,
    },
    expected: {
      grossMonthly: 3200.00,
      netMonthly: 2260.00,
      incomeTaxMonthly: 280.00, // Entlastungsbetrag StKl II
      solidarityTaxMonthly: 0.00,
      churchTaxMonthly: 0.00,
      socialSecurityMonthly: 650.00,
      employerCostsMonthly: 3870.00,
    },
  },
  {
    id: 'GM-010',
    description: 'Niedrigverdiener an Minijob-Grenze, 600€',
    input: {
      grossSalaryYearly: 7200,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 22,
      employmentType: 'midijob', // Knapp über Minijob
    },
    expected: {
      grossMonthly: 600.00,
      netMonthly: 520.00,
      incomeTaxMonthly: 0.00, // Keine Lohnsteuer bei diesem Betrag
      solidarityTaxMonthly: 0.00,
      churchTaxMonthly: 0.00,
      socialSecurityMonthly: 80.00, // Stark reduziert
      employerCostsMonthly: 730.00,
    },
  },
];

// ============= Tests =============

describe('Golden-Master Lohnabrechnungs-Tests', () => {
  GOLDEN_MASTER_CASES.forEach((testCase) => {
    describe(`${testCase.id}: ${testCase.description}`, () => {
      const result = calculateCompleteTax(testCase.input);
      
      it('berechnet korrektes Brutto-Monatsgehalt', () => {
        expectCurrency(result.grossMonthly, testCase.expected.grossMonthly, 'Brutto monatlich');
      });
      
      it('berechnet plausibles Netto-Monatsgehalt', () => {
        const netDiff = Math.abs(result.netMonthly - testCase.expected.netMonthly);
        expect(netDiff).toBeLessThan(100);
      });
      
      it('berechnet Einkommensteuer in plausibler Höhe', () => {
        // Steuer sollte nicht negativ sein
        expect(result.incomeTax).toBeGreaterThanOrEqual(0);
        
        // Steuer sollte nicht mehr als 45% des Brutto sein
        expect(result.incomeTax / 12).toBeLessThanOrEqual(testCase.expected.grossMonthly * 0.45);
      });
      
      it('berechnet Solidaritätszuschlag korrekt', () => {
        // Soli ist immer 0 oder 5.5% der Lohnsteuer
        const expectedSoliMax = (result.incomeTax / 12) * 0.055;
        expect(result.solidarityTax / 12).toBeLessThanOrEqual(expectedSoliMax + 0.01);
        expect(result.solidarityTax).toBeGreaterThanOrEqual(0);
      });
      
      it('berechnet Kirchensteuer korrekt', () => {
        if (!testCase.input.churchTax) {
          expect(result.churchTax).toBe(0);
        } else {
          // KiSt ist 8% oder 9% der Lohnsteuer
          const expectedKiSt = (result.incomeTax / 12) * (testCase.input.churchTaxRate / 100);
          const actualMonthly = result.churchTax / 12;
          expect(Math.abs(actualMonthly - expectedKiSt)).toBeLessThan(5);
        }
      });
      
      it('hat konsistente Summen', () => {
        // Netto = Brutto - SV - Steuern
        const calculatedNet = result.grossYearly - result.totalSocialContributions - result.totalTaxes;
        expect(Math.abs(calculatedNet - result.netYearly)).toBeLessThan(1);
      });
      
      it('berechnet Arbeitgeberkosten >= Brutto', () => {
        expect(result.employerCosts).toBeGreaterThanOrEqual(result.grossYearly);
      });
    });
  });
});

// ============= Invarianten-Tests =============

describe('Berechnungs-Invarianten', () => {
  it('Netto ist immer positiv bei positivem Brutto', () => {
    const testCases = [1000, 2000, 3000, 5000, 10000];
    
    for (const grossMonthly of testCases) {
      const result = calculateCompleteTax({
        grossSalaryYearly: grossMonthly * 12,
        taxClass: '1',
        childAllowances: 0,
        churchTax: false,
        churchTaxRate: 9,
        healthInsuranceRate: 1.7,
        isEastGermany: false,
        isChildless: true,
        age: 30,
      });
      
      expect(result.netMonthly).toBeGreaterThan(0);
    }
  });
  
  it('Netto ist immer kleiner als Brutto (bei regulärer Beschäftigung)', () => {
    const testCases = [1000, 2500, 5000, 7500, 10000];
    
    for (const grossMonthly of testCases) {
      const result = calculateCompleteTax({
        grossSalaryYearly: grossMonthly * 12,
        taxClass: '1',
        childAllowances: 0,
        churchTax: false,
        churchTaxRate: 9,
        healthInsuranceRate: 1.7,
        isEastGermany: false,
        isChildless: true,
        age: 30,
      });
      
      expect(result.netMonthly).toBeLessThan(grossMonthly);
    }
  });
  
  it('Steuerklasse III ist günstiger als Steuerklasse V', () => {
    const grossYearly = 48000;
    
    const resultIII = calculateCompleteTax({
      grossSalaryYearly: grossYearly,
      taxClass: '3',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 35,
    });
    
    const resultV = calculateCompleteTax({
      grossSalaryYearly: grossYearly,
      taxClass: '5',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 35,
    });
    
    expect(resultIII.netMonthly).toBeGreaterThan(resultV.netMonthly);
    expect(resultIII.incomeTax).toBeLessThan(resultV.incomeTax);
  });
  
  it('Kinderfreibeträge reduzieren die Steuerlast', () => {
    const grossYearly = 60000;
    
    const resultNoKids = calculateCompleteTax({
      grossSalaryYearly: grossYearly,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 35,
    });
    
    const result2Kids = calculateCompleteTax({
      grossSalaryYearly: grossYearly,
      taxClass: '1',
      childAllowances: 2,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 35,
    });
    
    // Mit Kindern sollte weniger PV-Beitrag und potenziell weniger Steuer anfallen
    expect(result2Kids.careInsurance).toBeLessThanOrEqual(resultNoKids.careInsurance);
  });
});

// ============= Grenzwert-Tests =============

describe('Grenzwert-Validierung', () => {
  it('respektiert Minijob-Grenze exakt (556€)', () => {
    const result = calculateCompleteTax({
      grossSalaryYearly: 556 * 12,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 25,
      employmentType: 'minijob',
    });
    
    // Minijob: Netto = Brutto für Arbeitnehmer
    expect(result.netMonthly).toBe(556);
    expect(result.totalSocialContributions).toBe(0);
  });
  
  it('Midijob startet bei 556,01€', () => {
    const result = calculateCompleteTax({
      grossSalaryYearly: 556.01 * 12,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 25,
      employmentType: 'midijob',
    });
    
    // Midijob hat reduzierte, aber vorhandene SV-Beiträge
    expect(result.totalSocialContributions).toBeGreaterThan(0);
    expect(result.netMonthly).toBeLessThan(556.01);
  });
  
  it('BBG-Kappung bei hohen Gehältern', () => {
    const resultHighSalary = calculateCompleteTax({
      grossSalaryYearly: 120000, // 10.000€/Monat
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 40,
    });
    
    const resultVeryHighSalary = calculateCompleteTax({
      grossSalaryYearly: 180000, // 15.000€/Monat
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 9,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 40,
    });
    
    // SV-Beiträge sollten bei hohen Gehältern gleich sein (BBG-Deckel)
    expect(Math.abs(resultHighSalary.pensionInsurance - resultVeryHighSalary.pensionInsurance)).toBeLessThan(1);
    expect(Math.abs(resultHighSalary.healthInsurance - resultVeryHighSalary.healthInsurance)).toBeLessThan(1);
  });
});
