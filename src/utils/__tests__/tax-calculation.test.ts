import { describe, it, expect } from 'vitest';
import {
  calculateIncomeTax,
  calculateSolidarityTax,
  calculateChurchTax,
  calculateTaxableIncome,
  calculateCompleteTax,
  calculateOvertimeAndBonuses,
} from '../tax-calculation';

describe('Tax Calculation Functions', () => {
  describe('calculateIncomeTax', () => {
    it('should calculate income tax for tax class 1', () => {
      const tax = calculateIncomeTax(4000, 1);
      expect(tax).toBeGreaterThanOrEqual(0);
      expect(typeof tax).toBe('number');
    });

    it('should return 0 for very low income', () => {
      const tax = calculateIncomeTax(500, 1);
      expect(tax).toBe(0);
    });

    it('should calculate higher tax for tax class 5', () => {
      const taxClass1 = calculateIncomeTax(4000, 1);
      const taxClass5 = calculateIncomeTax(4000, 5);
      expect(taxClass5).toBeGreaterThan(taxClass1);
    });

    it('should calculate lower tax for tax class 3', () => {
      const taxClass1 = calculateIncomeTax(4000, 1);
      const taxClass3 = calculateIncomeTax(4000, 3);
      expect(taxClass3).toBeLessThan(taxClass1);
    });
  });

  describe('calculateSolidarityTax', () => {
    it('should return 0 for low income tax', () => {
      const soli = calculateSolidarityTax(1000);
      expect(soli).toBe(0);
    });

    it('should calculate 5.5% for high income tax', () => {
      const incomeTax = 50000;
      const soli = calculateSolidarityTax(incomeTax);
      expect(soli).toBeGreaterThan(0);
      expect(soli).toBeLessThanOrEqual(incomeTax * 0.055);
    });

    it('should be integer (floor)', () => {
      const soli = calculateSolidarityTax(30000);
      expect(Number.isInteger(soli)).toBe(true);
    });
  });

  describe('calculateChurchTax', () => {
    it('should calculate 8% for Bayern/BW', () => {
      const churchTax = calculateChurchTax(10000, 8);
      expect(churchTax).toBe(800);
    });

    it('should calculate 9% for other states', () => {
      const churchTax = calculateChurchTax(10000, 9);
      expect(churchTax).toBe(900);
    });

    it('should return 0 for 0% rate', () => {
      const churchTax = calculateChurchTax(10000, 0);
      expect(churchTax).toBe(0);
    });
  });

  describe('calculateTaxableIncome', () => {
    it('should reduce gross by allowances', () => {
      const taxableIncome = calculateTaxableIncome(60000, 0, 10000);
      expect(taxableIncome).toBeLessThan(60000);
    });

    it('should consider child allowances', () => {
      const withoutChildren = calculateTaxableIncome(60000, 0, 10000);
      const withChildren = calculateTaxableIncome(60000, 2, 10000);
      expect(withChildren).toBeLessThan(withoutChildren);
    });

    it('should not return negative values', () => {
      const taxableIncome = calculateTaxableIncome(5000, 5, 50000);
      expect(taxableIncome).toBe(0);
    });
  });

  describe('calculateCompleteTax', () => {
    const baseParams = {
      grossSalaryYearly: 48000,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 0,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 30,
    };

    it('should calculate all tax components', () => {
      const result = calculateCompleteTax(baseParams);

      expect(result.grossYearly).toBe(48000);
      expect(result.grossMonthly).toBe(4000);
      expect(result.netYearly).toBeLessThan(48000);
      expect(result.netMonthly).toBeLessThan(4000);
      expect(result.totalDeductions).toBeGreaterThan(0);
    });

    it('should calculate social contributions', () => {
      const result = calculateCompleteTax(baseParams);

      expect(result.pensionInsurance).toBeGreaterThan(0);
      expect(result.healthInsurance).toBeGreaterThan(0);
      expect(result.unemploymentInsurance).toBeGreaterThan(0);
      expect(result.careInsurance).toBeGreaterThan(0);
    });

    it('should calculate employer costs higher than gross', () => {
      const result = calculateCompleteTax(baseParams);
      expect(result.employerCosts).toBeGreaterThan(result.grossYearly);
    });

    it('should calculate minijob correctly', () => {
      const minijobParams = {
        ...baseParams,
        grossSalaryYearly: 556 * 12,
        employmentType: 'minijob' as const,
      };
      const result = calculateCompleteTax(minijobParams);

      expect(result.pensionInsurance).toBe(0);
      expect(result.healthInsurance).toBe(0);
      expect(result.netMonthly).toBe(556);
    });

    it('should include church tax when enabled', () => {
      const withChurchTax = calculateCompleteTax({
        ...baseParams,
        churchTax: true,
        churchTaxRate: 9,
      });
      const withoutChurchTax = calculateCompleteTax(baseParams);

      expect(withChurchTax.churchTax).toBeGreaterThan(0);
      expect(withoutChurchTax.churchTax).toBe(0);
    });

    it('should handle midijob reduced contributions', () => {
      const midijobParams = {
        ...baseParams,
        grossSalaryYearly: 1500 * 12,
        employmentType: 'midijob' as const,
      };
      const result = calculateCompleteTax(midijobParams);

      expect(result.netMonthly).toBeGreaterThan(0);
      expect(result.totalSocialContributions).toBeGreaterThan(0);
    });
  });

  describe('calculateOvertimeAndBonuses', () => {
    it('should calculate regular pay', () => {
      const result = calculateOvertimeAndBonuses({
        regularHours: 160,
        overtimeHours: 0,
        nightHours: 0,
        sundayHours: 0,
        holidayHours: 0,
        hourlyRate: 20,
      });

      expect(result.regularPay).toBe(3200);
      expect(result.totalGrossPay).toBe(3200);
    });

    it('should add 25% overtime bonus', () => {
      const result = calculateOvertimeAndBonuses({
        regularHours: 160,
        overtimeHours: 10,
        nightHours: 0,
        sundayHours: 0,
        holidayHours: 0,
        hourlyRate: 20,
      });

      expect(result.overtimePay).toBe(250); // 10 * 20 * 1.25
    });

    it('should add night bonus (25%)', () => {
      const result = calculateOvertimeAndBonuses({
        regularHours: 160,
        overtimeHours: 0,
        nightHours: 8,
        sundayHours: 0,
        holidayHours: 0,
        hourlyRate: 20,
      });

      expect(result.nightBonus).toBe(40); // 8 * 20 * 0.25
    });

    it('should add sunday bonus (50%)', () => {
      const result = calculateOvertimeAndBonuses({
        regularHours: 160,
        overtimeHours: 0,
        nightHours: 0,
        sundayHours: 8,
        holidayHours: 0,
        hourlyRate: 20,
      });

      expect(result.sundayBonus).toBe(80); // 8 * 20 * 0.50
    });

    it('should add holiday bonus (100%)', () => {
      const result = calculateOvertimeAndBonuses({
        regularHours: 160,
        overtimeHours: 0,
        nightHours: 0,
        sundayHours: 0,
        holidayHours: 8,
        hourlyRate: 20,
      });

      expect(result.holidayBonus).toBe(160); // 8 * 20 * 1.0
    });

    it('should sum all bonuses correctly', () => {
      const result = calculateOvertimeAndBonuses({
        regularHours: 160,
        overtimeHours: 10,
        nightHours: 8,
        sundayHours: 4,
        holidayHours: 2,
        hourlyRate: 20,
      });

      const expectedTotal = 
        160 * 20 + // regular
        10 * 20 * 1.25 + // overtime
        8 * 20 * 0.25 + // night
        4 * 20 * 0.50 + // sunday
        2 * 20 * 1.0; // holiday

      expect(result.totalGrossPay).toBe(expectedTotal);
    });
  });
});
