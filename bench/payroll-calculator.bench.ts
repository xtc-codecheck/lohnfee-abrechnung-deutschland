import { bench, describe } from 'vitest';
import { calculatePayrollEntry } from '@/utils/payroll-calculator';
import { makeEmployee, makeWorkingData } from './_fixtures';

const employees1000 = Array.from({ length: 1000 }, (_, i) => makeEmployee(i));
const wd = makeWorkingData();
const period = { year: 2026, month: 5 };

describe('calculatePayrollEntry', () => {
  bench('1 employee', () => {
    calculatePayrollEntry({ employee: employees1000[0], period, workingData: wd });
  });

  bench('100 employees (sequential)', () => {
    for (let i = 0; i < 100; i++) {
      calculatePayrollEntry({ employee: employees1000[i], period, workingData: wd });
    }
  });

  bench('1000 employees (sequential)', () => {
    for (let i = 0; i < 1000; i++) {
      calculatePayrollEntry({ employee: employees1000[i], period, workingData: wd });
    }
  }, { iterations: 5, time: 0 });
});