/**
 * L1.3 — Vitest für Persistenz-Pfad
 * 
 * Sichert ab, dass addPayrollEntry und updatePayrollPeriodStatus
 * Fehler aus Supabase NICHT mehr still verschlucken (war Live-Blocker).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// ── Mocks ───────────────────────────────────────────────────────────
const insertMock = vi.fn();
const updateMock = vi.fn();
const selectAfterInsertMock = vi.fn();
const singleMock = vi.fn();
const eqUpdateMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'payroll_entries') {
        return {
          insert: insertMock,
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        };
      }
      if (table === 'payroll_periods') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          update: updateMock,
        };
      }
      return {} as never;
    }),
  },
}));

vi.mock('@/contexts/tenant-context', () => ({
  useTenant: () => ({ tenantId: 'tenant-test-1' }),
}));

vi.mock('@/contexts/employee-context', () => ({
  useEmployees: () => ({ employees: [] }),
}));

// ── Imports nach Mocks ──────────────────────────────────────────────
import { useSupabasePayroll } from '../use-supabase-payroll';
import type { PayrollEntry } from '@/types/payroll';

// ── Helpers ─────────────────────────────────────────────────────────
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const SAMPLE_ENTRY = {
  employeeId: 'emp-1',
  payrollPeriodId: 'period-1',
  employee: {} as never,
  workingData: {
    regularHours: 160, overtimeHours: 0, nightHours: 0, sundayHours: 0,
    holidayHours: 0, vacationDays: 0, sickDays: 0,
    actualWorkingDays: 20, expectedWorkingDays: 20,
  },
  salaryCalculation: {
    grossSalary: 3000, netSalary: 2100,
    taxes: { incomeTax: 400, churchTax: 30, solidarityTax: 0, total: 430 },
    socialSecurityContributions: {
      healthInsurance: { employee: 250, employer: 250, total: 500 },
      pensionInsurance: { employee: 280, employer: 280, total: 560 },
      unemploymentInsurance: { employee: 40, employer: 40, total: 80 },
      careInsurance: { employee: 50, employer: 50, total: 100 },
      total: { employee: 620, employer: 620, total: 1240 },
    },
    employerCosts: 3620,
  },
  deductions: { unpaidLeave: 0, advancePayments: 0, otherDeductions: 0, total: 0 },
  additions: {
    overtimePay: 0, nightShiftBonus: 0, sundayBonus: 0, holidayBonus: 0,
    bonuses: 0, oneTimePayments: 0, expenseReimbursements: 0, total: 0,
  },
  finalNetSalary: 2100,
} as Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>;

// ── Tests ───────────────────────────────────────────────────────────
describe('useSupabasePayroll – Persistenz-Pfad (L1.1/L1.2)', () => {
  beforeEach(() => {
    insertMock.mockReset();
    updateMock.mockReset();
    selectAfterInsertMock.mockReset();
    singleMock.mockReset();
    eqUpdateMock.mockReset();
  });

  it('addPayrollEntry: wirft Fehler bei Insert-Error (kein Silent-Fail)', async () => {
    insertMock.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: null, error: { message: 'RLS denied' } })
        ),
      })),
    });

    const { result } = renderHook(() => useSupabasePayroll(), { wrapper });
    await waitFor(() => expect(result.current).toBeTruthy());

    await expect(result.current.addPayrollEntry(SAMPLE_ENTRY)).rejects.toThrow(
      /konnte nicht gespeichert werden|RLS denied/
    );
  });

  it('addPayrollEntry: gibt Entry zurück bei Erfolg', async () => {
    insertMock.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: {
              id: 'entry-1', employee_id: 'emp-1', payroll_period_id: 'period-1',
              gross_salary: 3000, net_salary: 2100, final_net_salary: 2100,
              tax_income_tax: 400, tax_church: 30, tax_solidarity: 0, tax_total: 430,
              sv_health_employee: 250, sv_health_employer: 250,
              sv_pension_employee: 280, sv_pension_employer: 280,
              sv_unemployment_employee: 40, sv_unemployment_employer: 40,
              sv_care_employee: 50, sv_care_employer: 50,
              sv_total_employee: 620, sv_total_employer: 620,
              employer_costs: 3620, bonus: 0, overtime_hours: 0, overtime_pay: 0,
              deductions: 0, created_at: '2026-01-01', updated_at: '2026-01-01',
              tenant_id: 'tenant-test-1', audit_data: null, deduction_description: null,
              notes: null,
            },
            error: null,
          })
        ),
      })),
    });

    const { result } = renderHook(() => useSupabasePayroll(), { wrapper });
    await waitFor(() => expect(result.current).toBeTruthy());

    const saved = await result.current.addPayrollEntry(SAMPLE_ENTRY);
    expect(saved).toBeDefined();
    expect(saved.id).toBe('entry-1');
    expect(saved.salaryCalculation.grossSalary).toBe(3000);
  });

  it('updatePayrollPeriodStatus: wirft Fehler bei Update-Error', async () => {
    updateMock.mockReturnValue({
      eq: vi.fn(() => Promise.resolve({ error: { message: 'permission denied' } })),
    });

    const { result } = renderHook(() => useSupabasePayroll(), { wrapper });
    await waitFor(() => expect(result.current).toBeTruthy());

    await expect(
      result.current.updatePayrollPeriodStatus('period-1', 'calculated')
    ).rejects.toThrow(/Status-Update fehlgeschlagen|permission denied/);
  });
});
