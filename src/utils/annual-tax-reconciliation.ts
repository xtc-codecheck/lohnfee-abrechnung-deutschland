/**
 * Lohnsteuer-Jahresausgleich (§ 42b EStG)
 * 
 * Der Arbeitgeber kann im Dezember einen internen Lohnsteuer-Jahresausgleich
 * durchführen. Dabei wird die Differenz zwischen der Summe der monatlichen
 * Lohnsteuern und der Jahreslohnsteuer auf das Jahresbrutto ermittelt.
 * 
 * Voraussetzungen (§ 42b Abs. 1 EStG):
 * - MA war das ganze Jahr beschäftigt (oder Eintritt ist bekannt)
 * - Steuerklasse hat sich nicht geändert
 * - Kein Faktorverfahren (StKl IV mit Faktor)
 */

import { TaxCalculationParams, calculateCompleteTax } from './tax-calculation';
import { roundCurrency } from '@/lib/formatters';

export interface AnnualReconciliationInput {
  /** Monatliche Bruttolöhne (Index 0 = Januar) */
  monthlyGrossSalaries: number[];
  /** Monatlich bereits einbehaltene Lohnsteuer */
  monthlyTaxesWithheld: number[];
  /** Monatlich bereits einbehaltener Soli */
  monthlySoliWithheld: number[];
  /** Monatlich bereits einbehaltene KiSt */
  monthlyChurchTaxWithheld: number[];
  /** Steuerparameter des Mitarbeiters */
  taxParams: Omit<TaxCalculationParams, 'grossSalaryYearly'>;
}

export interface AnnualReconciliationResult {
  /** Jahresbrutto */
  annualGross: number;
  /** Summe der monatlich einbehaltenen Steuern */
  totalMonthlyTaxWithheld: number;
  totalMonthlySoliWithheld: number;
  totalMonthlyChurchTaxWithheld: number;
  /** Korrekte Jahressteuer */
  correctAnnualTax: number;
  correctAnnualSoli: number;
  correctAnnualChurchTax: number;
  /** Differenz (negativ = Erstattung an MA, positiv = Nachzahlung) */
  taxDifference: number;
  soliDifference: number;
  churchTaxDifference: number;
  totalDifference: number;
  /** Ob ein Ausgleich stattfindet */
  hasReconciliation: boolean;
}

/**
 * Führt den Lohnsteuer-Jahresausgleich durch
 */
export function calculateAnnualTaxReconciliation(
  input: AnnualReconciliationInput
): AnnualReconciliationResult {
  const {
    monthlyGrossSalaries,
    monthlyTaxesWithheld,
    monthlySoliWithheld,
    monthlyChurchTaxWithheld,
    taxParams,
  } = input;

  // Jahresbrutto
  const annualGross = roundCurrency(monthlyGrossSalaries.reduce((sum, g) => sum + g, 0));

  // Summe der monatlich einbehaltenen Steuern
  const totalMonthlyTaxWithheld = roundCurrency(monthlyTaxesWithheld.reduce((s, t) => s + t, 0));
  const totalMonthlySoliWithheld = roundCurrency(monthlySoliWithheld.reduce((s, t) => s + t, 0));
  const totalMonthlyChurchTaxWithheld = roundCurrency(monthlyChurchTaxWithheld.reduce((s, t) => s + t, 0));

  // Korrekte Jahressteuer berechnen
  const yearlyResult = calculateCompleteTax({
    ...taxParams,
    grossSalaryYearly: annualGross,
  });

  const correctAnnualTax = roundCurrency(yearlyResult.incomeTax);
  const correctAnnualSoli = roundCurrency(yearlyResult.solidarityTax);
  const correctAnnualChurchTax = roundCurrency(yearlyResult.churchTax);

  // Differenz (negativ = Erstattung)
  const taxDifference = roundCurrency(correctAnnualTax - totalMonthlyTaxWithheld);
  const soliDifference = roundCurrency(correctAnnualSoli - totalMonthlySoliWithheld);
  const churchTaxDifference = roundCurrency(correctAnnualChurchTax - totalMonthlyChurchTaxWithheld);
  const totalDifference = roundCurrency(taxDifference + soliDifference + churchTaxDifference);

  // Nur relevant wenn es eine Abweichung > 1 Cent gibt
  const hasReconciliation = Math.abs(totalDifference) > 0.01;

  return {
    annualGross,
    totalMonthlyTaxWithheld,
    totalMonthlySoliWithheld,
    totalMonthlyChurchTaxWithheld,
    correctAnnualTax,
    correctAnnualSoli,
    correctAnnualChurchTax,
    taxDifference,
    soliDifference,
    churchTaxDifference,
    totalDifference,
    hasReconciliation,
  };
}
