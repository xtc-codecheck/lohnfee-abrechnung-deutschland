import { bench, describe } from 'vitest';
import { calculateGarnishment } from '@/utils/garnishment-calculation';

describe('calculateGarnishment', () => {
  bench('netto 2500, 0 Unterhalt, 2026', () => {
    calculateGarnishment({ netIncome: 2500, numberOfDependents: 0, year: 2026 });
  });
  bench('netto 4500, 3 Unterhalt, 2025', () => {
    calculateGarnishment({ netIncome: 4500, numberOfDependents: 3, year: 2025 });
  });
  bench('1000 berechnungen mixed', () => {
    for (let i = 0; i < 1000; i++) {
      calculateGarnishment({ netIncome: 1500 + i, numberOfDependents: i % 6, year: 2026 });
    }
  });
});