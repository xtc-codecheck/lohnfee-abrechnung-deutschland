/**
 * Zod-Validierungsschemas für Lohnabrechnungen
 * 
 * Phase 3: Schema-Validierung vor Speicherung
 * Stellt sicher, dass alle Lohnabrechnungsdaten plausibel und konsistent sind.
 */

import { z } from 'zod';
import { MINIJOB_2025, MIDIJOB_2025, BBG_2025_MONTHLY } from '@/constants/social-security';

// ============= Basis-Validatoren =============

/**
 * Validiert einen Geldbetrag (nicht-negativ, maximal 2 Dezimalstellen)
 */
const currencyAmount = z.number()
  .min(0, 'Betrag darf nicht negativ sein')
  .refine(
    (val) => Number.isFinite(val),
    'Betrag muss eine gültige Zahl sein'
  )
  .refine(
    (val) => Math.round(val * 100) === val * 100 || Math.abs(Math.round(val * 100) - val * 100) < 0.001,
    'Betrag darf maximal 2 Dezimalstellen haben'
  );

/**
 * Validiert Stunden (nicht-negativ, max 744 Stunden pro Monat)
 */
const hoursAmount = z.number()
  .min(0, 'Stunden dürfen nicht negativ sein')
  .max(744, 'Maximale Stunden pro Monat überschritten (744h)');

/**
 * Validiert Arbeitstage (0-31)
 */
const daysAmount = z.number()
  .int('Tage müssen ganzzahlig sein')
  .min(0, 'Tage dürfen nicht negativ sein')
  .max(31, 'Maximale Tage pro Monat überschritten');

// ============= Komplexe Schemas =============

/**
 * Arbeitszeitdaten-Schema
 */
export const workingTimeDataSchema = z.object({
  regularHours: hoursAmount,
  overtimeHours: hoursAmount,
  nightHours: hoursAmount,
  sundayHours: hoursAmount,
  holidayHours: hoursAmount,
  vacationDays: daysAmount,
  sickDays: daysAmount,
  actualWorkingDays: daysAmount,
  expectedWorkingDays: daysAmount,
}).refine(
  (data) => data.actualWorkingDays <= data.expectedWorkingDays + data.vacationDays,
  {
    message: 'Tatsächliche Arbeitstage können nicht mehr als erwartete Arbeitstage + Urlaub sein',
    path: ['actualWorkingDays'],
  }
);

/**
 * Abzüge-Schema
 */
export const deductionsSchema = z.object({
  unpaidLeave: currencyAmount,
  advancePayments: currencyAmount,
  otherDeductions: currencyAmount,
  total: currencyAmount,
}).refine(
  (data) => {
    const calculatedTotal = data.unpaidLeave + data.advancePayments + data.otherDeductions;
    return Math.abs(calculatedTotal - data.total) < 0.01;
  },
  {
    message: 'Summe der Abzüge stimmt nicht überein',
    path: ['total'],
  }
);

/**
 * Zuschläge-Schema
 */
export const additionsSchema = z.object({
  overtimePay: currencyAmount,
  nightShiftBonus: currencyAmount,
  sundayBonus: currencyAmount,
  holidayBonus: currencyAmount,
  bonuses: currencyAmount,
  oneTimePayments: currencyAmount,
  expenseReimbursements: currencyAmount,
  total: currencyAmount,
}).refine(
  (data) => {
    const calculatedTotal = 
      data.overtimePay + 
      data.nightShiftBonus + 
      data.sundayBonus + 
      data.holidayBonus + 
      data.bonuses + 
      data.oneTimePayments + 
      data.expenseReimbursements;
    return Math.abs(calculatedTotal - data.total) < 0.01;
  },
  {
    message: 'Summe der Zuschläge stimmt nicht überein',
    path: ['total'],
  }
);

/**
 * Sozialversicherungsbeiträge-Schema (einzelne Versicherung)
 */
export const insuranceContributionSchema = z.object({
  employee: currencyAmount,
  employer: currencyAmount,
  total: currencyAmount,
}).refine(
  (data) => Math.abs((data.employee + data.employer) - data.total) < 0.01,
  {
    message: 'AN + AG Anteil muss Gesamt ergeben',
    path: ['total'],
  }
);

/**
 * Gesamte Sozialversicherungsbeiträge-Schema
 */
export const socialSecurityContributionsSchema = z.object({
  healthInsurance: insuranceContributionSchema,
  pensionInsurance: insuranceContributionSchema,
  unemploymentInsurance: insuranceContributionSchema,
  careInsurance: insuranceContributionSchema,
  total: insuranceContributionSchema,
});

/**
 * Steuern-Schema
 */
export const taxesSchema = z.object({
  incomeTax: currencyAmount,
  churchTax: currencyAmount,
  solidarityTax: currencyAmount,
  total: currencyAmount,
}).refine(
  (data) => {
    const calculatedTotal = data.incomeTax + data.churchTax + data.solidarityTax;
    return Math.abs(calculatedTotal - data.total) < 0.01;
  },
  {
    message: 'Summe der Steuern stimmt nicht überein',
    path: ['total'],
  }
);

/**
 * Gehaltsberechnung-Schema mit Plausibilitätsprüfungen
 */
export const salaryCalculationSchema = z.object({
  grossSalary: currencyAmount,
  netSalary: currencyAmount,
  socialSecurityContributions: socialSecurityContributionsSchema,
  taxes: taxesSchema,
  employerCosts: currencyAmount,
}).refine(
  (data) => data.netSalary < data.grossSalary,
  {
    message: 'Nettolohn muss kleiner als Bruttolohn sein (außer bei Minijobs)',
    path: ['netSalary'],
  }
).refine(
  (data) => data.employerCosts >= data.grossSalary,
  {
    message: 'Arbeitgeberkosten müssen mindestens Bruttolohn sein',
    path: ['employerCosts'],
  }
);

/**
 * Vollständiges PayrollEntry-Schema
 */
export const payrollEntrySchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1),
  payrollPeriodId: z.string().min(1),
  workingData: workingTimeDataSchema,
  salaryCalculation: salaryCalculationSchema,
  deductions: deductionsSchema,
  additions: additionsSchema,
  finalNetSalary: currencyAmount,
  createdAt: z.date(),
  updatedAt: z.date(),
}).refine(
  (data) => {
    // Finale Netto = Berechnetes Netto - Abzüge + steuerfreie Zuschläge
    // (vereinfachte Prüfung)
    return data.finalNetSalary >= 0;
  },
  {
    message: 'Finale Nettoauszahlung darf nicht negativ sein',
    path: ['finalNetSalary'],
  }
);

// ============= Spezial-Validierungen =============

/**
 * Validiert Minijob-Grenzen
 */
export const minijobValidation = z.object({
  grossMonthly: currencyAmount,
}).refine(
  (data) => data.grossMonthly <= MINIJOB_2025.maxEarnings,
  {
    message: `Minijob-Grenze überschritten (max. ${MINIJOB_2025.maxEarnings}€)`,
    path: ['grossMonthly'],
  }
);

/**
 * Validiert Midijob-Grenzen
 */
export const midijobValidation = z.object({
  grossMonthly: currencyAmount,
}).refine(
  (data) => data.grossMonthly > MIDIJOB_2025.minEarnings && data.grossMonthly <= MIDIJOB_2025.maxEarnings,
  {
    message: `Midijob muss zwischen ${MIDIJOB_2025.minEarnings}€ und ${MIDIJOB_2025.maxEarnings}€ liegen`,
    path: ['grossMonthly'],
  }
);

/**
 * Validiert BBG-Kappung für Rentenversicherung
 */
export function validateBBGCapping(
  grossMonthly: number, 
  contributionBase: number, 
  isEastGermany: boolean
): { isValid: boolean; message?: string } {
  const maxBase = isEastGermany ? BBG_2025_MONTHLY.pensionEast : BBG_2025_MONTHLY.pensionWest;
  
  if (grossMonthly > maxBase && contributionBase > maxBase) {
    return {
      isValid: false,
      message: `Beitragsbemessungsgrenze (${maxBase}€) nicht korrekt angewendet`,
    };
  }
  
  return { isValid: true };
}

// ============= Typen exportieren =============

export type WorkingTimeData = z.infer<typeof workingTimeDataSchema>;
export type Deductions = z.infer<typeof deductionsSchema>;
export type Additions = z.infer<typeof additionsSchema>;
export type SalaryCalculation = z.infer<typeof salaryCalculationSchema>;
export type PayrollEntry = z.infer<typeof payrollEntrySchema>;

// ============= Validierungs-Hilfsfunktionen =============

/**
 * Validiert und bereinigt einen PayrollEntry
 * Wirft einen Fehler bei ungültigen Daten
 */
export function validatePayrollEntry(data: unknown): PayrollEntry {
  return payrollEntrySchema.parse(data);
}

/**
 * Prüft ob ein PayrollEntry gültig ist ohne Exception zu werfen
 */
export function isValidPayrollEntry(data: unknown): data is PayrollEntry {
  return payrollEntrySchema.safeParse(data).success;
}

/**
 * Gibt detaillierte Validierungsfehler zurück
 */
export function getPayrollValidationErrors(data: unknown): string[] {
  const result = payrollEntrySchema.safeParse(data);
  
  if (result.success) return [];
  
  return result.error.errors.map(err => 
    `${err.path.join('.')}: ${err.message}`
  );
}
