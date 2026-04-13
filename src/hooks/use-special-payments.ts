/**
 * Sonderzahlungen Hook – Supabase-basiert
 */
import { useState, useEffect, useCallback } from 'react';
import { SickPayCalculation, MaternityBenefits, ShortTimeWork, SpecialPaymentSummary } from '@/types/special-payments';
import { useTenant } from '@/contexts/tenant-context';
import { supabase } from '@/integrations/supabase/client';

type PaymentRow = {
  id: string;
  employee_id: string;
  payment_type: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
  details: Record<string, unknown>;
  created_at: string;
};

function rowToSickPay(row: PaymentRow): SickPayCalculation {
  const d = row.details as Record<string, number>;
  return {
    id: row.id,
    employeeId: row.employee_id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    dailyGrossSalary: d.dailyGrossSalary ?? 0,
    sickPayPerDay: d.sickPayPerDay ?? 0,
    totalSickPay: row.total_amount,
    daysOfSickness: d.daysOfSickness ?? 0,
    status: row.status as 'active' | 'completed',
    createdAt: new Date(row.created_at),
  };
}

function rowToMaternity(row: PaymentRow): MaternityBenefits {
  const d = row.details as Record<string, unknown>;
  return {
    id: row.id,
    employeeId: row.employee_id,
    type: (d.type as MaternityBenefits['type']) ?? 'maternity-protection',
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    grossSalaryBasis: (d.grossSalaryBasis as number) ?? 0,
    dailyBenefit: (d.dailyBenefit as number) ?? 0,
    totalBenefit: row.total_amount,
    paidByEmployer: (d.paidByEmployer as number) ?? 0,
    paidByInsurance: (d.paidByInsurance as number) ?? 0,
    status: row.status as 'active' | 'completed',
    createdAt: new Date(row.created_at),
  };
}

function rowToShortTime(row: PaymentRow): ShortTimeWork {
  const d = row.details as Record<string, unknown>;
  return {
    id: row.id,
    employeeId: row.employee_id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    originalWorkingHours: (d.originalWorkingHours as number) ?? 0,
    reducedWorkingHours: (d.reducedWorkingHours as number) ?? 0,
    reductionPercentage: (d.reductionPercentage as number) ?? 0,
    grossSalaryLoss: (d.grossSalaryLoss as number) ?? 0,
    shortTimeWorkBenefit: row.total_amount,
    hasChildren: (d.hasChildren as boolean) ?? false,
    status: row.status as 'active' | 'completed',
    createdAt: new Date(row.created_at),
  };
}

export function useSpecialPayments() {
  const [sickPayments, setSickPayments] = useState<SickPayCalculation[]>([]);
  const [maternityBenefits, setMaternityBenefits] = useState<MaternityBenefits[]>([]);
  const [shortTimeWork, setShortTimeWork] = useState<ShortTimeWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (!currentTenant) return;

    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('special_payments')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (error) {
        console.error('Error loading special payments:', error);
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as PaymentRow[];
      setSickPayments(rows.filter(r => r.payment_type === 'sick_pay').map(rowToSickPay));
      setMaternityBenefits(rows.filter(r => r.payment_type === 'maternity').map(rowToMaternity));
      setShortTimeWork(rows.filter(r => r.payment_type === 'short_time_work').map(rowToShortTime));
      setIsLoading(false);
    };

    load();
  }, [currentTenant]);

  // --- Krankengeld ---
  const addSickPayment = useCallback(async (payment: SickPayCalculation) => {
    if (!currentTenant) return;
    const { data, error } = await supabase
      .from('special_payments')
      .insert({
        tenant_id: currentTenant.id,
        employee_id: payment.employeeId,
        payment_type: 'sick_pay',
        start_date: payment.startDate.toISOString().split('T')[0],
        end_date: payment.endDate.toISOString().split('T')[0],
        status: payment.status,
        total_amount: payment.totalSickPay,
        details: { dailyGrossSalary: payment.dailyGrossSalary, sickPayPerDay: payment.sickPayPerDay, daysOfSickness: payment.daysOfSickness },
      })
      .select()
      .single();

    if (!error && data) {
      setSickPayments(prev => [...prev, rowToSickPay(data as unknown as PaymentRow)]);
    }
  }, [currentTenant]);

  const updateSickPayment = useCallback(async (id: string, updates: Partial<SickPayCalculation>) => {
    const dbUpdates: { status?: string; total_amount?: number } = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.totalSickPay !== undefined) dbUpdates.total_amount = updates.totalSickPay;

    const { error } = await supabase.from('special_payments').update(dbUpdates).eq('id', id);
    if (!error) {
      setSickPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  }, []);

  const deleteSickPayment = useCallback(async (id: string) => {
    const { error } = await supabase.from('special_payments').delete().eq('id', id);
    if (!error) setSickPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  const getSickPaymentsForEmployee = useCallback((employeeId: string) => {
    return sickPayments.filter(p => p.employeeId === employeeId);
  }, [sickPayments]);

  // --- Mutterschaftsleistungen ---
  const addMaternityBenefit = useCallback(async (benefit: MaternityBenefits) => {
    if (!currentTenant) return;
    const { data, error } = await supabase
      .from('special_payments')
      .insert({
        tenant_id: currentTenant.id,
        employee_id: benefit.employeeId,
        payment_type: 'maternity',
        start_date: benefit.startDate.toISOString().split('T')[0],
        end_date: benefit.endDate.toISOString().split('T')[0],
        status: benefit.status,
        total_amount: benefit.totalBenefit,
        details: { type: benefit.type, grossSalaryBasis: benefit.grossSalaryBasis, dailyBenefit: benefit.dailyBenefit, paidByEmployer: benefit.paidByEmployer, paidByInsurance: benefit.paidByInsurance },
      })
      .select()
      .single();

    if (!error && data) {
      setMaternityBenefits(prev => [...prev, rowToMaternity(data as unknown as PaymentRow)]);
    }
  }, [currentTenant]);

  const updateMaternityBenefit = useCallback(async (id: string, updates: Partial<MaternityBenefits>) => {
    const dbUpdates: { status?: string; total_amount?: number } = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.totalBenefit !== undefined) dbUpdates.total_amount = updates.totalBenefit;

    const { error } = await supabase.from('special_payments').update(dbUpdates).eq('id', id);
    if (!error) {
      setMaternityBenefits(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    }
  }, []);

  const deleteMaternityBenefit = useCallback(async (id: string) => {
    const { error } = await supabase.from('special_payments').delete().eq('id', id);
    if (!error) setMaternityBenefits(prev => prev.filter(b => b.id !== id));
  }, []);

  const getMaternityBenefitsForEmployee = useCallback((employeeId: string) => {
    return maternityBenefits.filter(b => b.employeeId === employeeId);
  }, [maternityBenefits]);

  // --- Kurzarbeit ---
  const addShortTimeWork = useCallback(async (work: ShortTimeWork) => {
    if (!currentTenant) return;
    const { data, error } = await supabase
      .from('special_payments')
      .insert({
        tenant_id: currentTenant.id,
        employee_id: work.employeeId,
        payment_type: 'short_time_work',
        start_date: work.startDate.toISOString().split('T')[0],
        end_date: work.endDate.toISOString().split('T')[0],
        status: work.status,
        total_amount: work.shortTimeWorkBenefit,
        details: { originalWorkingHours: work.originalWorkingHours, reducedWorkingHours: work.reducedWorkingHours, reductionPercentage: work.reductionPercentage, grossSalaryLoss: work.grossSalaryLoss, hasChildren: work.hasChildren },
      })
      .select()
      .single();

    if (!error && data) {
      setShortTimeWork(prev => [...prev, rowToShortTime(data as unknown as PaymentRow)]);
    }
  }, [currentTenant]);

  const updateShortTimeWork = useCallback(async (id: string, updates: Partial<ShortTimeWork>) => {
    const dbUpdates: { status?: string; total_amount?: number } = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.shortTimeWorkBenefit !== undefined) dbUpdates.total_amount = updates.shortTimeWorkBenefit;

    const { error } = await supabase.from('special_payments').update(dbUpdates).eq('id', id);
    if (!error) {
      setShortTimeWork(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    }
  }, []);

  const deleteShortTimeWork = useCallback(async (id: string) => {
    const { error } = await supabase.from('special_payments').delete().eq('id', id);
    if (!error) setShortTimeWork(prev => prev.filter(w => w.id !== id));
  }, []);

  const getShortTimeWorkForEmployee = useCallback((employeeId: string) => {
    return shortTimeWork.filter(w => w.employeeId === employeeId);
  }, [shortTimeWork]);

  // --- Zusammenfassung ---
  const getSpecialPaymentSummary = useCallback((employeeId: string, year: number, month: number): SpecialPaymentSummary => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const sickPayInPeriod = sickPayments
      .filter(p => p.employeeId === employeeId && p.startDate <= endDate && p.endDate >= startDate)
      .reduce((sum, p) => sum + p.totalSickPay, 0);

    const maternityInPeriod = maternityBenefits
      .filter(b => b.employeeId === employeeId && b.startDate <= endDate && b.endDate >= startDate)
      .reduce((sum, b) => sum + b.totalBenefit, 0);

    const shortTimeInPeriod = shortTimeWork
      .filter(w => w.employeeId === employeeId && w.startDate <= endDate && w.endDate >= startDate)
      .reduce((sum, w) => sum + w.shortTimeWorkBenefit, 0);

    return {
      employeeId,
      month,
      year,
      sickPay: sickPayInPeriod,
      maternityBenefits: maternityInPeriod,
      shortTimeWorkBenefit: shortTimeInPeriod,
      totalSpecialPayments: sickPayInPeriod + maternityInPeriod + shortTimeInPeriod,
    };
  }, [sickPayments, maternityBenefits, shortTimeWork]);

  return {
    sickPayments,
    maternityBenefits,
    shortTimeWork,
    isLoading,
    addSickPayment,
    updateSickPayment,
    deleteSickPayment,
    getSickPaymentsForEmployee,
    addMaternityBenefit,
    updateMaternityBenefit,
    deleteMaternityBenefit,
    getMaternityBenefitsForEmployee,
    addShortTimeWork,
    updateShortTimeWork,
    deleteShortTimeWork,
    getShortTimeWorkForEmployee,
    getSpecialPaymentSummary,
  };
}
