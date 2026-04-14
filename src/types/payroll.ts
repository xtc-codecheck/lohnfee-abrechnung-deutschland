// TypeScript-Definitionen für die Lohnabrechnung

import { Employee, SalaryCalculation } from './employee';

export interface PayrollPeriod {
  id: string;
  year: number;
  month: number; // 1-12
  startDate: Date;
  endDate: Date;
  status: PayrollStatus;
  createdAt: Date;
  processedAt?: Date;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  payrollPeriodId: string;
  employee: Employee;
  workingData: WorkingTimeData;
  salaryCalculation: SalaryCalculation;
  deductions: Deductions;
  additions: Additions;
  finalNetSalary: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingTimeData {
  regularHours: number; // Reguläre Arbeitsstunden
  overtimeHours: number; // Überstunden
  nightHours: number; // Nachtarbeit
  sundayHours: number; // Sonntagsarbeit
  holidayHours: number; // Feiertagsarbeit
  vacationDays: number; // Urlaubstage
  sickDays: number; // Krankheitstage
  actualWorkingDays: number; // Tatsächliche Arbeitstage
  expectedWorkingDays: number; // Erwartete Arbeitstage
}

export interface Deductions {
  unpaidLeave: number; // Unbezahlter Urlaub
  advancePayments: number; // Vorschüsse
  otherDeductions: number; // Sonstige Abzüge
  total: number;
}

export interface Additions {
  overtimePay: number; // Überstundenzuschlag
  nightShiftBonus: number; // Nachtschichtzuschlag  
  sundayBonus: number; // Sonntagszuschlag
  holidayBonus: number; // Feiertagszuschlag
  bonuses: number; // Prämien/Boni
  oneTimePayments: number; // Einmalzahlungen
  expenseReimbursements: number; // Spesenerstattung
  total: number;
}

export interface PayrollSummary {
  payrollPeriodId: string;
  totalEmployees: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalTaxes: number;
  totalSocialSecurityEmployee: number;
  totalSocialSecurityEmployer: number;
  totalEmployerCosts: number;
}

export interface PayrollReport {
  period: PayrollPeriod;
  entries: PayrollEntry[];
  summary: PayrollSummary;
  generatedAt: Date;
}

export type PayrollStatus = 'draft' | 'calculated' | 'approved' | 'paid' | 'finalized';

// Zuschlagssätze (können konfigurierbar gemacht werden)
export const BONUS_RATES = {
  overtime: 0.25, // 25% Überstundenzuschlag
  nightShift: 0.25, // 25% Nachtschichtzuschlag
  sunday: 0.50, // 50% Sonntagszuschlag
  holiday: 1.0, // 100% Feiertagszuschlag
} as const;

// Deutsche Feiertage 2025 (bundesweit gültig)
export const GERMAN_HOLIDAYS_2025 = [
  new Date('2025-01-01'), // Neujahr
  new Date('2025-04-18'), // Karfreitag
  new Date('2025-04-21'), // Ostermontag
  new Date('2025-05-01'), // Tag der Arbeit
  new Date('2025-05-29'), // Christi Himmelfahrt
  new Date('2025-06-09'), // Pfingstmontag
  new Date('2025-10-03'), // Tag der Deutschen Einheit
  new Date('2025-12-25'), // 1. Weihnachtsfeiertag
  new Date('2025-12-26'), // 2. Weihnachtsfeiertag
] as const;

/** @deprecated Verwende GERMAN_HOLIDAYS_2025 */
export const GERMAN_HOLIDAYS_2024 = GERMAN_HOLIDAYS_2025;