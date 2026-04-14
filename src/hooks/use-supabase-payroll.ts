/**
 * Supabase-basierter Payroll-Hook
 * Ersetzt den localStorage-basierten usePayrollStorage
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { useEmployees } from '@/contexts/employee-context';
import { PayrollPeriod, PayrollEntry, PayrollReport, PayrollStatus } from '@/types/payroll';
import { Tables } from '@/integrations/supabase/types';
import { Employee } from '@/types/employee';

type DbPeriod = Tables<'payroll_periods'>;
type DbEntry = Tables<'payroll_entries'>;

function dbToPeriod(row: DbPeriod): PayrollPeriod {
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

/**
 * Konvertiert einen DB-Entry zu einem vereinfachten PayrollEntry.
 * Da die DB-Struktur flach ist, werden die verschachtelten Typen
 * aus den flachen Feldern rekonstruiert.
 */
function dbToPayrollEntry(row: DbEntry, employeeMap: Map<string, Employee>): PayrollEntry {
  const emp = employeeMap.get(row.employee_id);
  return {
    id: row.id,
    employeeId: row.employee_id,
    payrollPeriodId: row.payroll_period_id,
    employee: emp ?? ({} as Employee),
    workingData: {
      regularHours: 0,
      overtimeHours: Number(row.overtime_hours ?? 0),
      nightHours: 0,
      sundayHours: 0,
      holidayHours: 0,
      vacationDays: 0,
      sickDays: 0,
      actualWorkingDays: 0,
      expectedWorkingDays: 0,
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
      unpaidLeave: 0,
      advancePayments: 0,
      otherDeductions: Number(row.deductions ?? 0),
      total: Number(row.deductions ?? 0),
    },
    additions: {
      overtimePay: Number(row.overtime_pay ?? 0),
      nightShiftBonus: 0,
      sundayBonus: 0,
      holidayBonus: 0,
      bonuses: Number(row.bonus ?? 0),
      oneTimePayments: 0,
      expenseReimbursements: 0,
      total: Number(row.overtime_pay ?? 0) + Number(row.bonus ?? 0),
    },
    finalNetSalary: Number(row.final_net_salary),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function useSupabasePayroll() {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { employees } = useEmployees();
  const { tenantId } = useTenant();

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const fetchData = useCallback(async () => {
    if (!tenantId) { setPayrollPeriods([]); setPayrollEntries([]); setIsLoading(false); return; }
    setIsLoading(true);
    
    const [periodsRes, entriesRes] = await Promise.all([
      supabase.from('payroll_periods').select('*').eq('tenant_id', tenantId).order('year', { ascending: false }).order('month', { ascending: false }),
      supabase.from('payroll_entries').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(500),
    ]);
    
    if (periodsRes.error) setError(periodsRes.error.message);
    else setPayrollPeriods((periodsRes.data ?? []).map(dbToPeriod));
    
    if (entriesRes.error) setError(entriesRes.error.message);
    else setPayrollEntries((entriesRes.data ?? []).map(r => dbToPayrollEntry(r, employeeMap)));
    
    if (!periodsRes.error && !entriesRes.error) setError(null);
    setIsLoading(false);
  }, [employees.length, tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createPayrollPeriod = useCallback(async (year: number, month: number): Promise<PayrollPeriod | null> => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const { data, error: err } = await supabase
      .from('payroll_periods')
      .insert({
        year, month,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'draft',
        tenant_id: tenantId,
      })
      .select()
      .single();
    
    if (err) { setError(err.message); return null; }
    const period = dbToPeriod(data);
    setPayrollPeriods(prev => [period, ...prev]);
    return period;
  }, []);

  const updatePayrollPeriodStatus = useCallback(async (periodId: string, status: PayrollStatus) => {
    const updates: { status: string; processed_at?: string } = { status };
    if (status === 'finalized') updates.processed_at = new Date().toISOString();
    
    const { error: err } = await supabase.from('payroll_periods').update(updates).eq('id', periodId);
    if (err) { setError(err.message); return; }
    
    setPayrollPeriods(prev =>
      prev.map(p => p.id === periodId
        ? { ...p, status, processedAt: status === 'finalized' ? new Date() : p.processedAt }
        : p
      )
    );
  }, []);

  const addPayrollEntry = useCallback(async (entry: Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayrollEntry | null> => {
    const { data, error: err } = await supabase
      .from('payroll_entries')
      .insert({
        tenant_id: tenantId,
        employee_id: entry.employeeId,
        payroll_period_id: entry.payrollPeriodId,
        gross_salary: entry.salaryCalculation.grossSalary,
        net_salary: entry.salaryCalculation.netSalary,
        final_net_salary: entry.finalNetSalary,
        tax_income_tax: entry.salaryCalculation.taxes.incomeTax,
        tax_church: entry.salaryCalculation.taxes.churchTax,
        tax_solidarity: entry.salaryCalculation.taxes.solidarityTax,
        tax_total: entry.salaryCalculation.taxes.total,
        sv_health_employee: entry.salaryCalculation.socialSecurityContributions.healthInsurance.employee,
        sv_health_employer: entry.salaryCalculation.socialSecurityContributions.healthInsurance.employer,
        sv_pension_employee: entry.salaryCalculation.socialSecurityContributions.pensionInsurance.employee,
        sv_pension_employer: entry.salaryCalculation.socialSecurityContributions.pensionInsurance.employer,
        sv_unemployment_employee: entry.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employee,
        sv_unemployment_employer: entry.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employer,
        sv_care_employee: entry.salaryCalculation.socialSecurityContributions.careInsurance.employee,
        sv_care_employer: entry.salaryCalculation.socialSecurityContributions.careInsurance.employer,
        sv_total_employee: entry.salaryCalculation.socialSecurityContributions.total.employee,
        sv_total_employer: entry.salaryCalculation.socialSecurityContributions.total.employer,
        employer_costs: entry.salaryCalculation.employerCosts,
        bonus: entry.additions.bonuses,
        overtime_hours: entry.workingData.overtimeHours,
        overtime_pay: entry.additions.overtimePay,
        deductions: entry.deductions.total,
      })
      .select()
      .single();
    
    if (err) { setError(err.message); return null; }
    const newEntry = dbToPayrollEntry(data, employeeMap);
    setPayrollEntries(prev => [newEntry, ...prev]);
    return newEntry;
  }, [employeeMap]);

  const getPayrollEntriesForPeriod = useCallback((periodId: string): PayrollEntry[] => {
    return payrollEntries.filter(e => e.payrollPeriodId === periodId);
  }, [payrollEntries]);

  const getPayrollReport = useCallback((periodId: string): PayrollReport | null => {
    const period = payrollPeriods.find(p => p.id === periodId);
    if (!period) return null;
    const entries = getPayrollEntriesForPeriod(periodId);
    return {
      period,
      entries,
      summary: {
        payrollPeriodId: periodId,
        totalEmployees: entries.length,
        totalGrossSalary: entries.reduce((s, e) => s + e.salaryCalculation.grossSalary, 0),
        totalNetSalary: entries.reduce((s, e) => s + e.finalNetSalary, 0),
        totalTaxes: entries.reduce((s, e) => s + e.salaryCalculation.taxes.total, 0),
        totalSocialSecurityEmployee: entries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.total.employee, 0),
        totalSocialSecurityEmployer: entries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.total.employer, 0),
        totalEmployerCosts: entries.reduce((s, e) => s + e.salaryCalculation.employerCosts, 0),
      },
      generatedAt: new Date(),
    };
  }, [payrollPeriods, getPayrollEntriesForPeriod]);

  const deletePayrollPeriod = useCallback(async (periodId: string) => {
    await supabase.from('payroll_entries').delete().eq('payroll_period_id', periodId);
    const { error: err } = await supabase.from('payroll_periods').delete().eq('id', periodId);
    if (err) { setError(err.message); return; }
    setPayrollPeriods(prev => prev.filter(p => p.id !== periodId));
    setPayrollEntries(prev => prev.filter(e => e.payrollPeriodId !== periodId));
  }, []);

  const updatePayrollEntry = useCallback(async (entryId: string, updates: Partial<PayrollEntry>) => {
    // For now, just refresh
    await fetchData();
  }, [fetchData]);

  return {
    payrollPeriods,
    payrollEntries,
    isLoading,
    error,
    createPayrollPeriod,
    updatePayrollPeriodStatus,
    addPayrollEntry,
    updatePayrollEntry,
    getPayrollEntriesForPeriod,
    getPayrollReport,
    deletePayrollPeriod,
    refreshData: fetchData,
  };
}

export { useSupabasePayroll as usePayrollStorage };
