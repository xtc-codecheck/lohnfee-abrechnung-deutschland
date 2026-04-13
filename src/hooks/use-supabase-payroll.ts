/**
 * Supabase-basierter Payroll-Hook
 * Ersetzt den localStorage-basierten usePayrollStorage
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PayrollPeriod, PayrollStatus } from '@/types/payroll';
import { Tables } from '@/integrations/supabase/types';

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

export function useSupabasePayroll() {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    setIsLoading(true);
    const { data, error: err } = await supabase
      .from('payroll_periods')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (err) {
      setError(err.message);
    } else {
      setPayrollPeriods((data ?? []).map(dbToPeriod));
      setError(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const createPayrollPeriod = useCallback(async (year: number, month: number): Promise<PayrollPeriod | null> => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const { data, error: err } = await supabase
      .from('payroll_periods')
      .insert({
        year,
        month,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'draft',
      })
      .select()
      .single();
    
    if (err) {
      setError(err.message);
      return null;
    }
    
    const period = dbToPeriod(data);
    setPayrollPeriods(prev => [period, ...prev]);
    return period;
  }, []);

  const updatePayrollPeriodStatus = useCallback(async (periodId: string, status: PayrollStatus) => {
    const updates: any = { status };
    if (status === 'finalized') {
      updates.processed_at = new Date().toISOString();
    }
    
    const { error: err } = await supabase
      .from('payroll_periods')
      .update(updates)
      .eq('id', periodId);
    
    if (err) {
      setError(err.message);
      return;
    }
    
    setPayrollPeriods(prev =>
      prev.map(p => p.id === periodId
        ? { ...p, status, processedAt: status === 'finalized' ? new Date() : p.processedAt }
        : p
      )
    );
  }, []);

  const deletePayrollPeriod = useCallback(async (periodId: string) => {
    // Delete entries first
    await supabase.from('payroll_entries').delete().eq('payroll_period_id', periodId);
    const { error: err } = await supabase.from('payroll_periods').delete().eq('id', periodId);
    
    if (err) {
      setError(err.message);
      return;
    }
    
    setPayrollPeriods(prev => prev.filter(p => p.id !== periodId));
  }, []);

  return {
    payrollPeriods,
    isLoading,
    error,
    createPayrollPeriod,
    updatePayrollPeriodStatus,
    deletePayrollPeriod,
    refreshData: fetchPeriods,
  };
}

export { useSupabasePayroll as usePayrollStorage };
