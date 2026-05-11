/**
 * E2E-Test für usePayrollRunner — Wizard-Persistenz-Bug-Fix
 *
 * Sichert ab:
 *  - Skip-Detection liest serverseitig (kein stale Cache).
 *  - Bulk-Insert via addPayrollEntries wird benutzt.
 *  - Teil-Fehler werden gemeldet (failed-Liste mit MA-Namen).
 *  - addToHistory-Fehler werden NICHT propagiert, aber geloggt.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Employee } from '@/types/employee';
import type { PayrollEntry, PayrollPeriod, WorkingTimeData } from '@/types/payroll';

// ── Mocks ───────────────────────────────────────────────────────────
const selectExistingMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: (..._args: unknown[]) => selectExistingMock() }),
    }),
  },
}));

vi.mock('@/utils/payroll-calculator', () => ({
  calculatePayrollEntry: ({ employee }: { employee: Employee }) => ({
    entry: {
      id: '',
      employeeId: employee.id,
      payrollPeriodId: '',
      employee,
      workingData: {} as WorkingTimeData,
      salaryCalculation: {} as never,
      deductions: { total: 0 } as never,
      additions: {} as never,
      finalNetSalary: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PayrollEntry,
  }),
}));

import { usePayrollRunner } from '../use-payroll-runner';

// ── Helpers ─────────────────────────────────────────────────────────
const mkEmp = (id: string, first: string, last: string): Employee => ({
  id,
  personalData: { firstName: first, lastName: last } as never,
} as unknown as Employee);

const PERIOD: PayrollPeriod = {
  id: 'period-1', year: 2025, month: 6,
  startDate: new Date('2025-06-01'), endDate: new Date('2025-06-30'),
  status: 'draft', createdAt: new Date(),
};

beforeEach(() => {
  selectExistingMock.mockReset();
});

describe('usePayrollRunner — Wizard-Persistenz', () => {
  it('persistiert alle aktiven Mitarbeiter via Bulk-Insert', async () => {
    selectExistingMock.mockResolvedValue({ data: [], error: null });
    const employees = [mkEmp('e1', 'Anna', 'Test'), mkEmp('e2', 'Bert', 'Test')];
    const addPayrollEntries = vi.fn(async (rows: Array<Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>>) => ({
      saved: rows.map((r, i) => ({ ...r, id: `id-${i}`, createdAt: new Date(), updatedAt: new Date() } as PayrollEntry)),
      failed: [],
    }));
    const addToHistory = vi.fn(async () => undefined);

    const { result } = renderHook(() => usePayrollRunner({
      activeEmployees: employees, selectedYear: 2025, selectedMonth: 6,
      payrollPeriods: [PERIOD],
      wageTypesByEmployee: new Map(),
      buildWorkingDataFromTimeEntries: () => ({} as WorkingTimeData),
      createPayrollPeriod: async () => PERIOD,
      addPayrollEntries,
      addToHistory,
    }));

    const res = await result.current.calculateAndPersistEntries('period-1');
    expect(res.saved).toBe(2);
    expect(res.skipped).toBe(0);
    expect(res.failed).toEqual([]);
    expect(addPayrollEntries).toHaveBeenCalledTimes(1);
    expect(addPayrollEntries.mock.calls[0][0]).toHaveLength(2);
    expect(addToHistory).toHaveBeenCalledTimes(2);
  });

  it('überspringt serverseitig vorhandene Mitarbeiter (kein stale Cache)', async () => {
    selectExistingMock.mockResolvedValue({ data: [{ employee_id: 'e1' }], error: null });
    const employees = [mkEmp('e1', 'Anna', 'Test'), mkEmp('e2', 'Bert', 'Test')];
    const addPayrollEntries = vi.fn(async (rows: Array<Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>>) => ({
      saved: rows.map((r, i) => ({ ...r, id: `id-${i}`, createdAt: new Date(), updatedAt: new Date() } as PayrollEntry)),
      failed: [],
    }));

    const { result } = renderHook(() => usePayrollRunner({
      activeEmployees: employees, selectedYear: 2025, selectedMonth: 6,
      payrollPeriods: [PERIOD],
      wageTypesByEmployee: new Map(),
      buildWorkingDataFromTimeEntries: () => ({} as WorkingTimeData),
      createPayrollPeriod: async () => PERIOD,
      addPayrollEntries,
      addToHistory: async () => undefined,
    }));

    const res = await result.current.calculateAndPersistEntries('period-1');
    expect(res.saved).toBe(1);
    expect(res.skipped).toBe(1);
    expect(addPayrollEntries.mock.calls[0][0]).toHaveLength(1);
    expect(addPayrollEntries.mock.calls[0][0][0].employeeId).toBe('e2');
  });

  it('meldet Insert-Fehler mit Mitarbeiter-Name', async () => {
    selectExistingMock.mockResolvedValue({ data: [], error: null });
    const employees = [mkEmp('e1', 'Anna', 'Test'), mkEmp('e2', 'Bert', 'Fail')];
    const addPayrollEntries = vi.fn(async () => ({
      saved: [{ id: 'id-0', employeeId: 'e1' } as PayrollEntry],
      failed: [{ employeeId: 'e2', error: 'unique constraint' }],
    }));

    const { result } = renderHook(() => usePayrollRunner({
      activeEmployees: employees, selectedYear: 2025, selectedMonth: 6,
      payrollPeriods: [PERIOD],
      wageTypesByEmployee: new Map(),
      buildWorkingDataFromTimeEntries: () => ({} as WorkingTimeData),
      createPayrollPeriod: async () => PERIOD,
      addPayrollEntries,
      addToHistory: async () => undefined,
    }));

    const res = await result.current.calculateAndPersistEntries('period-1');
    expect(res.saved).toBe(1);
    expect(res.failed).toEqual(['Bert Fail']);
  });

  it('Guardian-Fehler werden geschluckt (nicht blockierend)', async () => {
    selectExistingMock.mockResolvedValue({ data: [], error: null });
    const employees = [mkEmp('e1', 'Anna', 'Test')];
    const addPayrollEntries = vi.fn(async (rows: Array<Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>>) => ({
      saved: rows.map(r => ({ ...r, id: 'id-0', createdAt: new Date(), updatedAt: new Date() } as PayrollEntry)),
      failed: [],
    }));
    const addToHistory = vi.fn(async () => { throw new Error('guardian down'); });

    const { result } = renderHook(() => usePayrollRunner({
      activeEmployees: employees, selectedYear: 2025, selectedMonth: 6,
      payrollPeriods: [PERIOD],
      wageTypesByEmployee: new Map(),
      buildWorkingDataFromTimeEntries: () => ({} as WorkingTimeData),
      createPayrollPeriod: async () => PERIOD,
      addPayrollEntries,
      addToHistory,
    }));

    const res = await result.current.calculateAndPersistEntries('period-1');
    expect(res.saved).toBe(1);
    expect(res.failed).toEqual([]);
  });
});