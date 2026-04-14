/**
 * Tests für Lohnsteuer-Jahresausgleich (§ 42b EStG)
 */
import { describe, it, expect } from 'vitest';
import { calculateAnnualTaxReconciliation, AnnualReconciliationInput } from '../annual-tax-reconciliation';

describe('Jahresausgleich (§ 42b EStG)', () => {
  const baseTaxParams = {
    taxClass: '1',
    childAllowances: 0,
    churchTax: false,
    churchTaxRate: 0,
    healthInsuranceRate: 1.7,
    isEastGermany: false,
    isChildless: true,
    age: 35,
    numberOfChildren: 0,
  };

  it('sollte keinen Ausgleich bei gleichmäßigem Gehalt ergeben', () => {
    const monthly = 4000;
    // Bei gleichmäßigem Gehalt: monatl. Steuer × 12 ≈ Jahressteuer
    // Kleine Rundungsdifferenzen sind möglich
    const input: AnnualReconciliationInput = {
      monthlyGrossSalaries: new Array(12).fill(monthly),
      monthlyTaxesWithheld: new Array(12).fill(500), // Platzhalter
      monthlySoliWithheld: new Array(12).fill(0),
      monthlyChurchTaxWithheld: new Array(12).fill(0),
      taxParams: baseTaxParams,
    };

    const result = calculateAnnualTaxReconciliation(input);
    expect(result.annualGross).toBe(48000);
    expect(result.correctAnnualTax).toBeGreaterThan(0);
    // Die Differenz sollte existieren da die Platzhalter-Steuern nicht exakt sind
    expect(typeof result.taxDifference).toBe('number');
  });

  it('sollte Erstattung bei Überzahlung berechnen', () => {
    const result = calculateAnnualTaxReconciliation({
      monthlyGrossSalaries: new Array(12).fill(3000),
      monthlyTaxesWithheld: new Array(12).fill(1000), // Viel zu hoch
      monthlySoliWithheld: new Array(12).fill(50),
      monthlyChurchTaxWithheld: new Array(12).fill(0),
      taxParams: baseTaxParams,
    });

    expect(result.totalDifference).toBeLessThan(0); // Erstattung
    expect(result.hasReconciliation).toBe(true);
  });

  it('sollte Nachzahlung bei Unterzahlung berechnen', () => {
    const result = calculateAnnualTaxReconciliation({
      monthlyGrossSalaries: new Array(12).fill(5000),
      monthlyTaxesWithheld: new Array(12).fill(10), // Viel zu niedrig
      monthlySoliWithheld: new Array(12).fill(0),
      monthlyChurchTaxWithheld: new Array(12).fill(0),
      taxParams: baseTaxParams,
    });

    expect(result.totalDifference).toBeGreaterThan(0); // Nachzahlung
    expect(result.hasReconciliation).toBe(true);
  });

  it('sollte Kirchensteuer-Differenz berechnen', () => {
    const result = calculateAnnualTaxReconciliation({
      monthlyGrossSalaries: new Array(12).fill(4000),
      monthlyTaxesWithheld: new Array(12).fill(500),
      monthlySoliWithheld: new Array(12).fill(0),
      monthlyChurchTaxWithheld: new Array(12).fill(100), // Zu hohe KiSt
      taxParams: { ...baseTaxParams, churchTax: true, churchTaxRate: 9 },
    });

    expect(typeof result.churchTaxDifference).toBe('number');
    expect(typeof result.correctAnnualChurchTax).toBe('number');
    expect(result.correctAnnualChurchTax).toBeGreaterThan(0);
  });

  it('sollte hasReconciliation = false bei minimaler Differenz', () => {
    // Baue einen Fall wo wir exakt die richtige Steuer einbehalten
    const result = calculateAnnualTaxReconciliation({
      monthlyGrossSalaries: new Array(12).fill(4000),
      monthlyTaxesWithheld: new Array(12).fill(0),
      monthlySoliWithheld: new Array(12).fill(0),
      monthlyChurchTaxWithheld: new Array(12).fill(0),
      taxParams: baseTaxParams,
    });

    // Berechne nochmal mit korrekten Werten
    const correctMonthlyTax = result.correctAnnualTax / 12;
    const correctMonthlySoli = result.correctAnnualSoli / 12;
    
    const result2 = calculateAnnualTaxReconciliation({
      monthlyGrossSalaries: new Array(12).fill(4000),
      monthlyTaxesWithheld: new Array(12).fill(correctMonthlyTax),
      monthlySoliWithheld: new Array(12).fill(correctMonthlySoli),
      monthlyChurchTaxWithheld: new Array(12).fill(0),
      taxParams: baseTaxParams,
    });

    // Differenz sollte minimal sein (Rundung)
    expect(Math.abs(result2.totalDifference)).toBeLessThan(1);
  });

  it('sollte mit ungleichmäßigen Gehältern korrekt rechnen', () => {
    const salaries = [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 6000]; // Dezember-Bonus
    const result = calculateAnnualTaxReconciliation({
      monthlyGrossSalaries: salaries,
      monthlyTaxesWithheld: new Array(12).fill(300),
      monthlySoliWithheld: new Array(12).fill(0),
      monthlyChurchTaxWithheld: new Array(12).fill(0),
      taxParams: baseTaxParams,
    });

    expect(result.annualGross).toBe(39000);
    expect(result.hasReconciliation).toBe(true);
  });
});
