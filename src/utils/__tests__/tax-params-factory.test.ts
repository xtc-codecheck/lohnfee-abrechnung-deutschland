import { describe, it, expect } from 'vitest';
import { buildTaxParamsFromEmployee, calculateAge, isEastGermanState } from '../tax-params-factory';
import { Employee } from '@/types/employee';

describe('tax-params-factory', () => {
  describe('calculateAge', () => {
    it('berechnet Alter korrekt', () => {
      const dob = new Date('1990-01-15');
      const age = calculateAge(dob);
      expect(age).toBeGreaterThanOrEqual(35);
      expect(age).toBeLessThanOrEqual(37);
    });
  });

  describe('isEastGermanState', () => {
    it('erkennt Ostdeutsche Bundesländer', () => {
      expect(isEastGermanState('sachsen')).toBe(true);
      expect(isEastGermanState('brandenburg')).toBe(true);
      expect(isEastGermanState('thueringen')).toBe(true);
    });

    it('erkennt Westdeutsche Bundesländer', () => {
      expect(isEastGermanState('bayern')).toBe(false);
      expect(isEastGermanState('berlin')).toBe(false);
      expect(isEastGermanState('hessen')).toBe(false);
    });
  });
});
