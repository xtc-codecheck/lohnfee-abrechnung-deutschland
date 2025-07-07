import { useState, useEffect } from 'react';
import { PayrollPeriod, PayrollEntry, PayrollReport, PayrollStatus } from '@/types/payroll';

const PAYROLL_PERIODS_KEY = 'lohnpro_payroll_periods';
const PAYROLL_ENTRIES_KEY = 'lohnpro_payroll_entries';

export function usePayrollStorage() {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedPeriods = localStorage.getItem(PAYROLL_PERIODS_KEY);
    const storedEntries = localStorage.getItem(PAYROLL_ENTRIES_KEY);

    if (storedPeriods) {
      try {
        const parsed = JSON.parse(storedPeriods);
        const periodsWithDates = parsed.map((period: any) => ({
          ...period,
          startDate: new Date(period.startDate),
          endDate: new Date(period.endDate),
          createdAt: new Date(period.createdAt),
          processedAt: period.processedAt ? new Date(period.processedAt) : undefined
        }));
        setPayrollPeriods(periodsWithDates);
      } catch (error) {
        console.error('Error loading payroll periods:', error);
      }
    }

    if (storedEntries) {
      try {
        const parsed = JSON.parse(storedEntries);
        const entriesWithDates = parsed.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }));
        setPayrollEntries(entriesWithDates);
      } catch (error) {
        console.error('Error loading payroll entries:', error);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(PAYROLL_PERIODS_KEY, JSON.stringify(payrollPeriods));
  }, [payrollPeriods]);

  useEffect(() => {
    localStorage.setItem(PAYROLL_ENTRIES_KEY, JSON.stringify(payrollEntries));
  }, [payrollEntries]);

  const createPayrollPeriod = (year: number, month: number): PayrollPeriod => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Letzter Tag des Monats

    const newPeriod: PayrollPeriod = {
      id: crypto.randomUUID(),
      year,
      month,
      startDate,
      endDate,
      status: 'draft',
      createdAt: new Date()
    };

    setPayrollPeriods(prev => [...prev, newPeriod]);
    return newPeriod;
  };

  const updatePayrollPeriodStatus = (periodId: string, status: PayrollStatus) => {
    setPayrollPeriods(prev =>
      prev.map(period =>
        period.id === periodId
          ? { 
              ...period, 
              status, 
              processedAt: status === 'finalized' ? new Date() : period.processedAt 
            }
          : period
      )
    );
  };

  const addPayrollEntry = (entry: Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: PayrollEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setPayrollEntries(prev => [...prev, newEntry]);
    return newEntry;
  };

  const updatePayrollEntry = (entryId: string, updates: Partial<PayrollEntry>) => {
    setPayrollEntries(prev =>
      prev.map(entry =>
        entry.id === entryId
          ? { ...entry, ...updates, updatedAt: new Date() }
          : entry
      )
    );
  };

  const getPayrollEntriesForPeriod = (periodId: string): PayrollEntry[] => {
    return payrollEntries.filter(entry => entry.payrollPeriodId === periodId);
  };

  const getPayrollReport = (periodId: string): PayrollReport | null => {
    const period = payrollPeriods.find(p => p.id === periodId);
    if (!period) return null;

    const entries = getPayrollEntriesForPeriod(periodId);
    
    const summary = {
      payrollPeriodId: periodId,
      totalEmployees: entries.length,
      totalGrossSalary: entries.reduce((sum, entry) => sum + entry.salaryCalculation.grossSalary, 0),
      totalNetSalary: entries.reduce((sum, entry) => sum + entry.finalNetSalary, 0),
      totalTaxes: entries.reduce((sum, entry) => sum + entry.salaryCalculation.taxes.total, 0),
      totalSocialSecurityEmployee: entries.reduce((sum, entry) => sum + entry.salaryCalculation.socialSecurityContributions.total.employee, 0),
      totalSocialSecurityEmployer: entries.reduce((sum, entry) => sum + entry.salaryCalculation.socialSecurityContributions.total.employer, 0),
      totalEmployerCosts: entries.reduce((sum, entry) => sum + entry.salaryCalculation.employerCosts, 0)
    };

    return {
      period,
      entries,
      summary,
      generatedAt: new Date()
    };
  };

  const deletePayrollPeriod = (periodId: string) => {
    // Delete all entries for this period first
    setPayrollEntries(prev => prev.filter(entry => entry.payrollPeriodId !== periodId));
    // Then delete the period
    setPayrollPeriods(prev => prev.filter(period => period.id !== periodId));
  };

  return {
    payrollPeriods,
    payrollEntries,
    createPayrollPeriod,
    updatePayrollPeriodStatus,
    addPayrollEntry,
    updatePayrollEntry,
    getPayrollEntriesForPeriod,
    getPayrollReport,
    deletePayrollPeriod
  };
}