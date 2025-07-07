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

// Deutsche Feiertage (vereinfacht für Demo)
export const GERMAN_HOLIDAYS_2024 = [
  new Date('2024-01-01'), // Neujahr
  new Date('2024-03-29'), // Karfreitag
  new Date('2024-04-01'), // Ostermontag
  new Date('2024-05-01'), // Tag der Arbeit
  new Date('2024-05-09'), // Christi Himmelfahrt
  new Date('2024-05-20'), // Pfingstmontag
  new Date('2024-10-03'), // Tag der Deutschen Einheit
  new Date('2024-12-25'), // 1. Weihnachtsfeiertag
  new Date('2024-12-26'), // 2. Weihnachtsfeiertag
] as const;