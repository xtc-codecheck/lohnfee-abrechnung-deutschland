/**
 * Korrekturabrechnung / Rückrechnung
 * 
 * Ermöglicht die Korrektur vergangener Abrechnungsperioden.
 * Die Differenzen zwischen alter und neuer Berechnung werden
 * in die aktuelle Periode als Nachzahlung/Erstattung übernommen.
 */

import { PayrollEntry } from '@/types/payroll';
import { Employee } from '@/types/employee';
import { calculatePayroll, PayrollCalculationInput, PayrollCalculationOutput } from './payroll-calculator';
import { roundCurrency } from '@/lib/formatters';

export interface CorrectionInput {
  /** Die originale (fehlerhafte) Abrechnung */
  originalEntry: PayrollEntry;
  /** Korrigierte Mitarbeiterdaten */
  correctedEmployee: Employee;
  /** Korrigierte Arbeitszeitdaten (optional, sonst Original) */
  correctedWorkingData?: PayrollCalculationInput['workingData'];
}

export interface CorrectionResult {
  /** Neue (korrigierte) Berechnung */
  correctedCalculation: PayrollCalculationOutput;
  /** Differenzen */
  differences: CorrectionDifferences;
  /** Audit-Information */
  correctionReason: string;
  correctionDate: Date;
  originalPeriod: { year: number; month: number };
}

export interface CorrectionDifferences {
  grossDifference: number;
  netDifference: number;
  taxDifference: number;
  svDifference: number;
  /** Positiv = Nachzahlung an MA, Negativ = Erstattung an AG */
  totalDifference: number;
}

/**
 * Berechnet eine Korrekturabrechnung
 */
export function calculateCorrectionPayroll(
  input: CorrectionInput,
  period: { year: number; month: number }
): CorrectionResult {
  const { originalEntry, correctedEmployee, correctedWorkingData } = input;

  // Neue Berechnung mit korrigierten Daten
  const correctedInput: PayrollCalculationInput = {
    employee: correctedEmployee,
    period,
    workingData: correctedWorkingData ?? originalEntry.workingData,
  };

  const correctedCalculation = calculatePayroll(correctedInput);

  // Differenzen berechnen
  const original = originalEntry;
  const corrected = correctedCalculation.entry;

  const grossDifference = roundCurrency(
    corrected.salaryCalculation.grossSalary - original.salaryCalculation.grossSalary
  );

  const taxDifference = roundCurrency(
    corrected.salaryCalculation.taxes.total - original.salaryCalculation.taxes.total
  );

  const svDifference = roundCurrency(
    corrected.salaryCalculation.socialSecurityContributions.total.employee -
    original.salaryCalculation.socialSecurityContributions.total.employee
  );

  const netDifference = roundCurrency(
    corrected.finalNetSalary - original.finalNetSalary
  );

  // Positiv = MA bekommt Nachzahlung, Negativ = MA muss zurückzahlen
  const totalDifference = netDifference;

  return {
    correctedCalculation,
    differences: {
      grossDifference,
      netDifference,
      taxDifference,
      svDifference,
      totalDifference,
    },
    correctionReason: '',
    correctionDate: new Date(),
    originalPeriod: period,
  };
}

/**
 * Formatiert die Korrekturdifferenzen als Audit-Text
 */
export function formatCorrectionAudit(result: CorrectionResult): string {
  const { differences, originalPeriod, correctionDate } = result;
  const lines = [
    `═══ KORREKTURABRECHNUNG ═══`,
    `Periode: ${originalPeriod.month}/${originalPeriod.year}`,
    `Korrekturdatum: ${correctionDate.toISOString().split('T')[0]}`,
    ``,
    `Differenzen:`,
    `  Brutto:     ${differences.grossDifference >= 0 ? '+' : ''}${differences.grossDifference.toFixed(2)} €`,
    `  Steuern:    ${differences.taxDifference >= 0 ? '+' : ''}${differences.taxDifference.toFixed(2)} €`,
    `  SV-Beitr.:  ${differences.svDifference >= 0 ? '+' : ''}${differences.svDifference.toFixed(2)} €`,
    `  Netto:      ${differences.netDifference >= 0 ? '+' : ''}${differences.netDifference.toFixed(2)} €`,
    ``,
    differences.totalDifference > 0
      ? `→ Nachzahlung an Mitarbeiter: ${differences.totalDifference.toFixed(2)} €`
      : differences.totalDifference < 0
        ? `→ Rückforderung vom Mitarbeiter: ${Math.abs(differences.totalDifference).toFixed(2)} €`
        : `→ Keine Differenz`,
  ];
  return lines.join('\n');
}
