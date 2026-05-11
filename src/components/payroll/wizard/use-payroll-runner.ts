import { useCallback } from 'react';
import { logger } from '@/lib/logger';
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
  payrollEntries: PayrollEntry[];
  wageTypesByEmployee: Map<string, EmployeeWageType[]>;
  buildWorkingDataFromTimeEntries: (employeeId: string) => WorkingTimeData;
  createPayrollPeriod: (year: number, month: number) => Promise<PayrollPeriod | null>;
  addPayrollEntry: (entry: Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PayrollEntry>;
  addToHistory: (entry: PayrollEntry) => Promise<unknown>;
}

/**
 * Persistenz-Logik für den Wizard. Extrahiert 1:1 aus monthly-payroll-wizard.tsx
 * (calculateAndPersistEntries + ensurePayrollPeriod).
 */
export function usePayrollRunner(deps: RunnerDeps) {
  const {
    activeEmployees, selectedYear, selectedMonth,
    payrollPeriods, payrollEntries, wageTypesByEmployee,
    buildWorkingDataFromTimeEntries,
    createPayrollPeriod, addPayrollEntry, addToHistory,
  } = deps;

  const ensurePayrollPeriod = useCallback(async (): Promise<PayrollPeriod | null> => {
    const existing = payrollPeriods.find(
      p => p.month === selectedMonth && p.year === selectedYear
    );
    if (existing) return existing;
    return await createPayrollPeriod(selectedYear, selectedMonth);
  }, [payrollPeriods, selectedYear, selectedMonth, createPayrollPeriod]);

  const calculateAndPersistEntries = useCallback(async (periodId: string) => {
    let saved = 0;
    let skipped = 0;
    const failed: string[] = [];
    const existingEmployeeIds = new Set(
      payrollEntries
        .filter(pe => pe.payrollPeriodId === periodId)
        .map(pe => pe.employeeId)
    );
    for (const emp of activeEmployees) {
      if (existingEmployeeIds.has(emp.id)) {
        skipped++;
        continue;
      }
      try {
        const workingData = buildWorkingDataFromTimeEntries(emp.id);
        const input: PayrollCalculationInput = {
          employee: emp,
          period: { year: selectedYear, month: selectedMonth },
          workingData,
          employeeWageTypes: wageTypesByEmployee.get(emp.id),
        };
        const result = calculatePayrollEntry(input);
        const entryToSave = { ...result.entry, payrollPeriodId: periodId };
        const persisted = await addPayrollEntry(entryToSave);
        try {
          await addToHistory(persisted);
        } catch (histErr) {
          logger.warn('monthly-payroll-wizard', '[payroll-persist] Guardian-Historie fehlgeschlagen:', histErr);
        }
        saved++;
      } catch (err) {
        const name = `${emp.personalData.firstName} ${emp.personalData.lastName}`;
        failed.push(name);
        logger.error('monthly-payroll-wizard', `[payroll-persist] Insert fehlgeschlagen für ${name}:`, err);
      }
    }
    return { saved, skipped, failed };
  }, [
    activeEmployees, selectedYear, selectedMonth, addPayrollEntry, addToHistory,
    buildWorkingDataFromTimeEntries, wageTypesByEmployee, payrollEntries,
  ]);

  return { ensurePayrollPeriod, calculateAndPersistEntries };
}
