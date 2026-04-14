/**
 * Supabase-basierter Payroll-Hook – React Query Version
 */
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { useEmployees } from '@/contexts/employee-context';
import { PayrollPeriod, PayrollEntry, PayrollReport, PayrollStatus } from '@/types/payroll';
import { Employee } from '@/types/employee';
import { queryKeys } from '@/lib/query-keys';
import { dbToPeriod, dbToPayrollEntry } from './use-supabase-payroll-mappers';

export function useSupabasePayroll() {
  const { employees } = useEmployees();
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const periodsKey = queryKeys.payroll.periods(tenantId);
  const entriesKey = queryKeys.payroll.entries(tenantId);

  const { data: payrollPeriods = [], isLoading: periodsLoading } = useQuery({
    queryKey: periodsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_periods').select('*')
        .eq('tenant_id', tenantId!)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(dbToPeriod);
    },
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  const { data: rawEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: entriesKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_entries').select('*')
        .eq('tenant_id', tenantId!)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  const payrollEntries = useMemo(
    () => rawEntries.map(r => dbToPayrollEntry(r, employeeMap)),
    [rawEntries, employeeMap]
  );

  const isLoading = periodsLoading || entriesLoading;
  const error = null;

  const createPeriodMutation = useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
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
        .select().single();
      if (err) throw new Error(err.message);
      return dbToPeriod(data);
    },
    onSuccess: (period) => {
      queryClient.setQueryData<PayrollPeriod[]>(periodsKey, (old = []) => [period, ...old]);
    },
  });

  const createPayrollPeriod = useCallback(async (year: number, month: number): Promise<PayrollPeriod | null> => {
    try { return await createPeriodMutation.mutateAsync({ year, month }); }
    catch { return null; }
  }, [createPeriodMutation]);

  const updatePayrollPeriodStatus = useCallback(async (periodId: string, status: PayrollStatus) => {
    const updates: { status: string; processed_at?: string } = { status };
    if (status === 'finalized') updates.processed_at = new Date().toISOString();
    const { error: err } = await supabase.from('payroll_periods').update(updates).eq('id', periodId);
    if (err) return;
    queryClient.setQueryData<PayrollPeriod[]>(periodsKey, (old = []) =>
      old.map(p => p.id === periodId
        ? { ...p, status, processedAt: status === 'finalized' ? new Date() : p.processedAt }
        : p
      )
    );
  }, [queryClient, periodsKey]);

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
      .select().single();
    if (err) return null;
    await queryClient.invalidateQueries({ queryKey: entriesKey });
    return dbToPayrollEntry(data, employeeMap);
  }, [tenantId, employeeMap, queryClient, entriesKey]);

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
    if (err) return;
    queryClient.setQueryData<PayrollPeriod[]>(periodsKey, (old = []) => old.filter(p => p.id !== periodId));
    await queryClient.invalidateQueries({ queryKey: entriesKey });
  }, [queryClient, periodsKey, entriesKey]);

  const updatePayrollEntry = useCallback(async (entryId: string, updates: Partial<PayrollEntry>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.salaryCalculation) {
      const sc = updates.salaryCalculation;
      dbUpdates.gross_salary = sc.grossSalary;
      dbUpdates.net_salary = sc.netSalary;
      dbUpdates.tax_income_tax = sc.taxes.incomeTax;
      dbUpdates.tax_church = sc.taxes.churchTax;
      dbUpdates.tax_solidarity = sc.taxes.solidarityTax;
      dbUpdates.tax_total = sc.taxes.total;
      dbUpdates.sv_health_employee = sc.socialSecurityContributions.healthInsurance.employee;
      dbUpdates.sv_health_employer = sc.socialSecurityContributions.healthInsurance.employer;
      dbUpdates.sv_pension_employee = sc.socialSecurityContributions.pensionInsurance.employee;
      dbUpdates.sv_pension_employer = sc.socialSecurityContributions.pensionInsurance.employer;
      dbUpdates.sv_unemployment_employee = sc.socialSecurityContributions.unemploymentInsurance.employee;
      dbUpdates.sv_unemployment_employer = sc.socialSecurityContributions.unemploymentInsurance.employer;
      dbUpdates.sv_care_employee = sc.socialSecurityContributions.careInsurance.employee;
      dbUpdates.sv_care_employer = sc.socialSecurityContributions.careInsurance.employer;
      dbUpdates.sv_total_employee = sc.socialSecurityContributions.total.employee;
      dbUpdates.sv_total_employer = sc.socialSecurityContributions.total.employer;
      dbUpdates.employer_costs = sc.employerCosts;
    }
    if (updates.finalNetSalary !== undefined) dbUpdates.final_net_salary = updates.finalNetSalary;
    if (updates.additions) {
      dbUpdates.bonus = updates.additions.bonuses;
      dbUpdates.overtime_pay = updates.additions.overtimePay;
    }
    if (updates.workingData) {
      dbUpdates.overtime_hours = updates.workingData.overtimeHours;
    }
    if (updates.deductions) {
      dbUpdates.deductions = updates.deductions.total;
    }

    const { error: err } = await supabase
      .from('payroll_entries')
      .update(dbUpdates as any)
      .eq('id', entryId);
    if (err) throw new Error(err.message);
    await queryClient.invalidateQueries({ queryKey: entriesKey });
  }, [queryClient, entriesKey]);

  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: periodsKey }),
      queryClient.invalidateQueries({ queryKey: entriesKey }),
    ]);
  }, [queryClient, periodsKey, entriesKey]);

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
    refreshData,
  };
}
