/**
 * Mapper-Funktionen für useSupabasePayroll
 * Extrahiert für bessere Testbarkeit
 */

import { PayrollPeriod, PayrollEntry, PayrollStatus } from '@/types/payroll';
import { Tables } from '@/integrations/supabase/types';
import { Employee } from '@/types/employee';

type DbPeriod = Tables<'payroll_periods'>;
type DbEntry = Tables<'payroll_entries'>;

export function dbToPeriod(row: DbPeriod): PayrollPeriod {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    status: row.status as PayrollStatus,
    createdAt: new Date(row.created_at),
    processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
  };
}

export function dbToPayrollEntry(row: DbEntry, employeeMap: Map<string, Employee>): PayrollEntry {
  const emp = employeeMap.get(row.employee_id);
  return {
    id: row.id,
    employeeId: row.employee_id,
    payrollPeriodId: row.payroll_period_id,
    employee: emp ?? ({} as Employee),
    workingData: {
      regularHours: 0,
      overtimeHours: Number(row.overtime_hours ?? 0),
      nightHours: 0, sundayHours: 0, holidayHours: 0,
      vacationDays: 0, sickDays: 0, actualWorkingDays: 0, expectedWorkingDays: 0,
    },
    salaryCalculation: {
      grossSalary: Number(row.gross_salary),
      netSalary: Number(row.net_salary),
      taxes: {
        incomeTax: Number(row.tax_income_tax ?? 0),
        churchTax: Number(row.tax_church ?? 0),
        solidarityTax: Number(row.tax_solidarity ?? 0),
        total: Number(row.tax_total ?? 0),
      },
      socialSecurityContributions: {
        healthInsurance: { employee: Number(row.sv_health_employee ?? 0), employer: Number(row.sv_health_employer ?? 0), total: Number(row.sv_health_employee ?? 0) + Number(row.sv_health_employer ?? 0) },
        pensionInsurance: { employee: Number(row.sv_pension_employee ?? 0), employer: Number(row.sv_pension_employer ?? 0), total: Number(row.sv_pension_employee ?? 0) + Number(row.sv_pension_employer ?? 0) },
        unemploymentInsurance: { employee: Number(row.sv_unemployment_employee ?? 0), employer: Number(row.sv_unemployment_employer ?? 0), total: Number(row.sv_unemployment_employee ?? 0) + Number(row.sv_unemployment_employer ?? 0) },
        careInsurance: { employee: Number(row.sv_care_employee ?? 0), employer: Number(row.sv_care_employer ?? 0), total: Number(row.sv_care_employee ?? 0) + Number(row.sv_care_employer ?? 0) },
        total: { employee: Number(row.sv_total_employee ?? 0), employer: Number(row.sv_total_employer ?? 0), total: Number(row.sv_total_employee ?? 0) + Number(row.sv_total_employer ?? 0) },
      },
      employerCosts: Number(row.employer_costs ?? 0),
    },
    deductions: {
      unpaidLeave: 0, advancePayments: 0,
      otherDeductions: Number(row.deductions ?? 0),
      total: Number(row.deductions ?? 0),
    },
    additions: {
      overtimePay: Number(row.overtime_pay ?? 0),
      nightShiftBonus: 0, sundayBonus: 0, holidayBonus: 0,
      bonuses: Number(row.bonus ?? 0),
      oneTimePayments: 0, expenseReimbursements: 0,
      total: Number(row.overtime_pay ?? 0) + Number(row.bonus ?? 0),
    },
    finalNetSalary: Number(row.final_net_salary),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
