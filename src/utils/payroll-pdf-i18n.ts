/**
 * Übersetzungs-Wörterbuch für mehrsprachige Lohnzettel (DE/EN).
 *
 * Hinweis: Die Lohnzettel-PDF in englischer Sprache dient ausschließlich dem
 * besseren Verständnis durch internationale Mitarbeiter. Rechtsverbindlich
 * bleibt — wie nach deutschem Steuer- und Sozialversicherungsrecht
 * vorgeschrieben — die deutsche Fassung. Dieser Hinweis ist im Footer der
 * englischen Variante zu drucken.
 */

export type PayslipLocale = 'de' | 'en';

export interface PayslipLabels {
  // Header
  payslipTitle: string;
  betriebsNr: string;
  taxNr: string;
  // Sections
  employee: string;
  workingTime: string;
  grossPay: string;
  taxes: string;
  socialSecurityEmployee: string;
  otherDeductions: string;
  // Lohnarten-Sektion (P4)
  wageTypesSection: string;
  wageTypeEffectGrossTaxable: string;
  wageTypeEffectNetTaxFree: string;
  wageTypeEffectInKind: string;
  wageTypeEffectNetDeduction: string;
  wageTypeEffectPauschal: string;
  // Employee fields
  name: string;
  taxId: string;
  taxClass: string;
  svNumber: string;
  healthInsurance: string;
  children: string;
  // Working time
  regularHours: string;
  overtimeHours: string;
  vacationDays: string;
  sickDays: string;
  workingDaysActualExpected: string;
  // Gross
  baseSalary: string;
  overtimeSurcharge: string;
  nightShiftBonus: string;
  sundayBonus: string;
  holidayBonus: string;
  bonuses: string;
  totalGross: string;
  // Taxes
  incomeTax: string;
  solidarityTax: string;
  churchTax: string;
  totalTaxes: string;
  // Social security
  healthIns: string;
  pensionIns: string;
  unemploymentIns: string;
  careIns: string;
  totalSV: string;
  // Other deductions
  unpaidLeave: string;
  advancePayments: string;
  otherDeductionsLine: string;
  // Net
  netPayout: string;
  totalEmployerCost: string;
  // Footer
  machineGenerated: string;
  createdOn: string;
  legalDisclaimerEN: string;
  // Months (1..12)
  months: readonly string[];
  // Filename prefix
  filenamePrefix: string;
  // Date locale
  dateLocale: string;
  // Hours unit
  hoursUnit: string;
}

const DE: PayslipLabels = {
  payslipTitle: 'Entgeltabrechnung',
  betriebsNr: 'Betriebsnr.',
  taxNr: 'Steuernr.',
  employee: 'Mitarbeiter',
  workingTime: 'Arbeitszeit',
  grossPay: 'Bruttobezüge',
  taxes: 'Steuerliche Abzüge',
  socialSecurityEmployee: 'Sozialversicherung (AN-Anteil)',
  otherDeductions: 'Sonstige Abzüge',
  wageTypesSection: 'Lohnarten',
  wageTypeEffectGrossTaxable: 'Brutto (steuer-/SV-pflichtig)',
  wageTypeEffectNetTaxFree: 'Netto (steuer-/SV-frei)',
  wageTypeEffectInKind: 'Sachbezug',
  wageTypeEffectNetDeduction: 'Netto-Abzug',
  wageTypeEffectPauschal: 'Pauschalsteuer (AG)',
  name: 'Name',
  taxId: 'Steuer-ID',
  taxClass: 'Steuerklasse',
  svNumber: 'SV-Nummer',
  healthInsurance: 'KV',
  children: 'Kinder',
  regularHours: 'Reguläre Stunden',
  overtimeHours: 'Überstunden',
  vacationDays: 'Urlaubstage',
  sickDays: 'Krankheitstage',
  workingDaysActualExpected: 'Arbeitstage (Ist / Soll)',
  baseSalary: 'Grundgehalt',
  overtimeSurcharge: 'Überstundenzuschlag',
  nightShiftBonus: 'Nachtarbeitszuschlag',
  sundayBonus: 'Sonntagszuschlag',
  holidayBonus: 'Feiertagszuschlag',
  bonuses: 'Prämien / Boni',
  totalGross: 'Gesamtbrutto',
  incomeTax: 'Lohnsteuer',
  solidarityTax: 'Solidaritätszuschlag',
  churchTax: 'Kirchensteuer',
  totalTaxes: 'Steuern gesamt',
  healthIns: 'Krankenversicherung',
  pensionIns: 'Rentenversicherung',
  unemploymentIns: 'Arbeitslosenversicherung',
  careIns: 'Pflegeversicherung',
  totalSV: 'SV gesamt (AN)',
  unpaidLeave: 'Unbezahlter Urlaub',
  advancePayments: 'Vorschüsse',
  otherDeductionsLine: 'Sonstiges',
  netPayout: 'Auszahlungsbetrag (Netto)',
  totalEmployerCost: 'Arbeitgeberkosten gesamt',
  machineGenerated: 'Diese Entgeltabrechnung wurde maschinell erstellt und ist ohne Unterschrift gültig.',
  createdOn: 'Erstellt am',
  legalDisclaimerEN: '',
  months: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ],
  filenamePrefix: 'Entgeltabrechnung',
  dateLocale: 'de-DE',
  hoursUnit: 'h',
};

const EN: PayslipLabels = {
  payslipTitle: 'Payslip',
  betriebsNr: 'Employer No.',
  taxNr: 'Tax No.',
  employee: 'Employee',
  workingTime: 'Working Time',
  grossPay: 'Gross Earnings',
  taxes: 'Tax Deductions',
  socialSecurityEmployee: 'Social Security (Employee Share)',
  otherDeductions: 'Other Deductions',
  wageTypesSection: 'Wage Items',
  wageTypeEffectGrossTaxable: 'Gross (taxable / SS-relevant)',
  wageTypeEffectNetTaxFree: 'Net (tax-free / SS-free)',
  wageTypeEffectInKind: 'In-kind benefit',
  wageTypeEffectNetDeduction: 'Net deduction',
  wageTypeEffectPauschal: 'Flat-rate tax (employer)',
  name: 'Name',
  taxId: 'Tax ID',
  taxClass: 'Tax Class',
  svNumber: 'Social Security No.',
  healthInsurance: 'Health Ins.',
  children: 'Children',
  regularHours: 'Regular Hours',
  overtimeHours: 'Overtime Hours',
  vacationDays: 'Vacation Days',
  sickDays: 'Sick Days',
  workingDaysActualExpected: 'Working Days (Actual / Expected)',
  baseSalary: 'Base Salary',
  overtimeSurcharge: 'Overtime Pay',
  nightShiftBonus: 'Night Shift Bonus',
  sundayBonus: 'Sunday Bonus',
  holidayBonus: 'Public Holiday Bonus',
  bonuses: 'Bonuses / Premiums',
  totalGross: 'Total Gross',
  incomeTax: 'Income Tax (Lohnsteuer)',
  solidarityTax: 'Solidarity Surcharge',
  churchTax: 'Church Tax',
  totalTaxes: 'Total Taxes',
  healthIns: 'Health Insurance',
  pensionIns: 'Pension Insurance',
  unemploymentIns: 'Unemployment Insurance',
  careIns: 'Long-Term Care Insurance',
  totalSV: 'Total SS (Employee)',
  unpaidLeave: 'Unpaid Leave',
  advancePayments: 'Advance Payments',
  otherDeductionsLine: 'Other',
  netPayout: 'Net Pay (Payout Amount)',
  totalEmployerCost: 'Total Employer Cost',
  machineGenerated: 'This payslip was generated automatically and is valid without signature.',
  createdOn: 'Created on',
  legalDisclaimerEN: 'Translation for information only — the German version is the legally binding document under German tax and social security law.',
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  filenamePrefix: 'Payslip',
  dateLocale: 'en-US',
  hoursUnit: 'hrs',
};

export function getPayslipLabels(locale: PayslipLocale): PayslipLabels {
  return locale === 'en' ? EN : DE;
}

/**
 * Number formatter that produces a localized currency string (EUR).
 * Uses native Intl to get the right thousand/decimal separators per locale.
 */
export function formatPayslipCurrency(value: number, locale: PayslipLocale): string {
  const loc = locale === 'en' ? 'en-US' : 'de-DE';
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
