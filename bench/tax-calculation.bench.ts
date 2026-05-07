import { bench, describe } from 'vitest';
import { calculateCompleteTax } from '@/utils/tax-calculation';

const base = {
  grossSalaryYearly: 48000, taxClass: '1', childAllowances: 0,
  churchTax: false, churchTaxRate: 9, healthInsuranceRate: 1.7,
  isEastGermany: false, isChildless: true, age: 30, year: 2026,
};

describe('calculateCompleteTax', () => {
  bench('StKl I, 48k, 2026', () => { calculateCompleteTax(base); });
  bench('StKl III, 80k, church, 2026', () => {
    calculateCompleteTax({ ...base, taxClass: '3', grossSalaryYearly: 80000, churchTax: true });
  });
  bench('StKl VI, 30k, east, 2025', () => {
    calculateCompleteTax({ ...base, taxClass: '6', grossSalaryYearly: 30000, isEastGermany: true, year: 2025 });
  });
  bench('All 6 tax classes Ost/West', () => {
    for (const tc of ['1','2','3','4','5','6']) {
      for (const east of [false, true]) {
        calculateCompleteTax({ ...base, taxClass: tc, isEastGermany: east });
      }
    }
  });
});