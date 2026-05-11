import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employee';
import {
  PayrollEntry, PayrollPeriod, WorkingTimeData,
} from '@/types/payroll';
import {
  calculatePayrollEntry, PayrollCalculationInput,
} from '@/utils/payroll-calculator';
import { EmployeeWageType } from '@/types/wage-types';

interface RunnerDeps {
  activeEmployees: Employee[];
  selectedYear: number;
  selectedMonth: number;
  payrollPeriods: PayrollPeriod[];
  wageTypesByEmployee: Map<string, EmployeeWageType[]>;
  buildWorkingDataFromTimeEntries: (employeeId: string) => WorkingTimeData;
  createPayrollPeriod: (year: number, month: number) => Promise<PayrollPeriod | null>;
  addPayrollEntries: (
    entries: Array<Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<{ saved: PayrollEntry[]; failed: Array<{ employeeId: string; error: string }> }>;
  addToHistory: (entry: PayrollEntry) => Promise<unknown>;
}

/**
 * Persistenz-Logik für den Wizard.
 *
 * Hardening (Bug-Fix Wizard-Persistenz):
 * - Skip-Detection liest existierende Entries SERVERSEITIG (kein stale Cache).
 * - Bulk-Insert in 1 Roundtrip via addPayrollEntries (statt N x addPayrollEntry).
 * - addToHistory parallel via Promise.allSettled (Fehler werden geloggt, nicht geschluckt).
 * - Rückgabe enthält failed-Liste mit Mitarbeiter-Namen für UI/Toast.
 */
export function usePayrollRunner(deps: RunnerDeps) {
  const {
    activeEmployees, selectedYear, selectedMonth,
    payrollPeriods, wageTypesByEmployee,
    buildWorkingDataFromTimeEntries,
    createPayrollPeriod, addPayrollEntries, addToHistory,
  } = deps;

  const ensurePayrollPeriod = useCallback(async (): Promise<PayrollPeriod | null> => {
    const existing = payrollPeriods.find(
      p => p.month === selectedMonth && p.year === selectedYear
    );
    if (existing) return existing;
    return await createPayrollPeriod(selectedYear, selectedMonth);
  }, [payrollPeriods, selectedYear, selectedMonth, createPayrollPeriod]);

  const calculateAndPersistEntries = useCallback(async (periodId: string) => {
    const failed: string[] = [];
    const nameOf = (id: string) => {
      const e = activeEmployees.find(x => x.id === id);
      return e ? `${e.personalData.firstName} ${e.personalData.lastName}` : id;
    };

    // 1) SERVERSEITIGE Skip-Detection (kein stale Cache mehr).
    const { data: existingRows, error: readErr } = await supabase
      .from('payroll_entries')
      .select('employee_id')
      .eq('payroll_period_id', periodId);
    if (readErr) {
      logger.error('monthly-payroll-wizard', '[payroll-persist] Read existing entries failed:', readErr);
      throw new Error(`Existierende Abrechnungen konnten nicht geladen werden: ${readErr.message}`);
    }
    const existingEmployeeIds = new Set((existingRows ?? []).map(r => r.employee_id as string));

    // 2) Berechnen für alle noch nicht persistierten Mitarbeiter.
    const toInsert: Array<Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>> = [];
    let skipped = 0;
    for (const emp of activeEmployees) {
      if (existingEmployeeIds.has(emp.id)) { skipped++; continue; }
      try {
        const workingData = buildWorkingDataFromTimeEntries(emp.id);
        const input: PayrollCalculationInput = {
          employee: emp,
          period: { year: selectedYear, month: selectedMonth },
          workingData,
          employeeWageTypes: wageTypesByEmployee.get(emp.id),
        };
        const result = calculatePayrollEntry(input);
        toInsert.push({ ...result.entry, payrollPeriodId: periodId });
      } catch (err) {
        const name = nameOf(emp.id);
        failed.push(name);
        logger.error('monthly-payroll-wizard', `[payroll-persist] Berechnung fehlgeschlagen für ${name}:`, err);
      }
    }

    // 3) Bulk-Insert in 1 Roundtrip (Fallback chunked, siehe addPayrollEntries).
    const { saved: savedEntries, failed: insertFailed } = await addPayrollEntries(toInsert);
    insertFailed.forEach(f => {
      failed.push(nameOf(f.employeeId));
      logger.error('monthly-payroll-wizard', `[payroll-persist] Insert fehlgeschlagen für ${nameOf(f.employeeId)}:`, f.error);
    });

    // 4) Guardian-History parallel (Fehler nicht blockierend, aber geloggt).
    const histResults = await Promise.allSettled(savedEntries.map(p => addToHistory(p)));
    histResults.forEach(r => {
      if (r.status === 'rejected') {
        logger.warn('monthly-payroll-wizard', '[payroll-persist] Guardian-Historie fehlgeschlagen:', r.reason);
      }
    });

    return { saved: savedEntries.length, skipped, failed };
  }, [
    activeEmployees, selectedYear, selectedMonth, addPayrollEntries, addToHistory,
    buildWorkingDataFromTimeEntries, wageTypesByEmployee,
  ]);

  return { ensurePayrollPeriod, calculateAndPersistEntries };
}
