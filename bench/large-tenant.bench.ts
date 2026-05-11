/**
 * Großmandanten-Benchmark
 * ─────────────────────────────────────────────────────────────
 * Misst die Berechnungs-Pipeline und den DATEV-Export für einen
 * Mandanten mit 500 / 1.000 Mitarbeitern (in-memory, ohne DB-IO).
 *
 * Ziel-SLAs (Standalone-Hardware, M-Kategorie):
 *   • 500 MA Berechnung   < 800 ms
 *   • 1.000 MA Berechnung < 1.600 ms
 *   • DATEV-Export 500    < 300 ms
 *
 * Wird in CI nicht hard-failed, sondern als Trend-Bench mitgeloggt.
 */
import { bench, describe } from 'vitest';
import { calculatePayrollEntry } from '@/utils/payroll-calculator';
import { generateDatevExport, getDefaultDatevConfig } from '@/utils/datev-export';
import { makeEmployee, makeWorkingData } from './_fixtures';
import type { PayrollEntry, PayrollPeriod } from '@/types/payroll';

const wd = makeWorkingData();
const period = { year: 2026, month: 5 };
const employees500 = Array.from({ length: 500 }, (_, i) => makeEmployee(i));
const employees1000 = Array.from({ length: 1000 }, (_, i) => makeEmployee(i));

const entries500: PayrollEntry[] = employees500.map((emp, i) => {
  const r = calculatePayrollEntry({ employee: emp, period, workingData: wd });
  return { ...r.entry, id: `e-${i}`, payrollPeriodId: 'p1', createdAt: new Date(), updatedAt: new Date() } as PayrollEntry;
});

const periode500: PayrollPeriod = {
  id: 'p1', year: 2026, month: 5,
  startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'),
  status: 'calculated', createdAt: new Date(),
};
const datevConfig = getDefaultDatevConfig();

describe('Large-Tenant — Calculation Pipeline', () => {
  bench('500 MA · vollständige Brutto→Netto-Berechnung', () => {
    for (let i = 0; i < employees500.length; i++) {
      calculatePayrollEntry({ employee: employees500[i], period, workingData: wd });
    }
  }, { iterations: 10, time: 0 });

  bench('1000 MA · vollständige Brutto→Netto-Berechnung', () => {
    for (let i = 0; i < employees1000.length; i++) {
      calculatePayrollEntry({ employee: employees1000[i], period, workingData: wd });
    }
  }, { iterations: 5, time: 0 });
});

describe('Large-Tenant — DATEV-Export', () => {
  bench('DATEV-Export · 500 Lohnabrechnungen', () => {
    generateDatevExport(entries500, periode500, datevConfig);
  }, { iterations: 20, time: 0 });
});