import { describe, it, expect } from 'vitest';
import {
  BBG_2025_YEARLY,
  BBG_2025_MONTHLY,
  SOCIAL_INSURANCE_RATES_2025,
  MINIJOB_2025,
  MIDIJOB_2025,
  TAX_ALLOWANCES_2025,
  getBBGForRegion,
  getCareInsuranceRate,
} from '@/constants/social-security';

describe('Social Security Constants', () => {
  describe('BBG_2025_YEARLY', () => {
    it('should have correct pension limits', () => {
      expect(BBG_2025_YEARLY.pensionWest).toBe(90600);
      expect(BBG_2025_YEARLY.pensionEast).toBe(89400);
    });

    it('should have health insurance limit', () => {
      expect(BBG_2025_YEARLY.healthCare).toBe(62100);
    });

    it('should be consistent with monthly values', () => {
      expect(BBG_2025_YEARLY.pensionWest).toBe(BBG_2025_MONTHLY.pensionWest * 12);
      expect(BBG_2025_YEARLY.pensionEast).toBe(BBG_2025_MONTHLY.pensionEast * 12);
      expect(BBG_2025_YEARLY.healthCare).toBe(BBG_2025_MONTHLY.healthCare * 12);
    });
  });

  describe('SOCIAL_INSURANCE_RATES_2025', () => {
    it('should have balanced employee/employer rates for pension', () => {
      expect(SOCIAL_INSURANCE_RATES_2025.pension.employee).toBe(9.3);
      expect(SOCIAL_INSURANCE_RATES_2025.pension.employer).toBe(9.3);
      expect(SOCIAL_INSURANCE_RATES_2025.pension.total).toBe(18.6);
    });

    it('should have correct unemployment rates', () => {
      expect(SOCIAL_INSURANCE_RATES_2025.unemployment.total).toBe(2.6);
      expect(SOCIAL_INSURANCE_RATES_2025.unemployment.employee).toBe(1.3);
      expect(SOCIAL_INSURANCE_RATES_2025.unemployment.employer).toBe(1.3);
    });

    it('should have correct health insurance rates', () => {
      expect(SOCIAL_INSURANCE_RATES_2025.health.total).toBe(14.6);
      expect(SOCIAL_INSURANCE_RATES_2025.health.employee).toBe(7.3);
      expect(SOCIAL_INSURANCE_RATES_2025.health.employer).toBe(7.3);
    });

    it('should have higher care rate for childless', () => {
      expect(SOCIAL_INSURANCE_RATES_2025.careChildless.employee)
        .toBeGreaterThan(SOCIAL_INSURANCE_RATES_2025.care.employee);
    });
  });

  describe('MINIJOB_2025', () => {
    it('should have correct earnings limit', () => {
      expect(MINIJOB_2025.maxEarnings).toBe(556);
    });

    it('should have 2% tax rate', () => {
      expect(MINIJOB_2025.taxRate).toBe(0.02);
    });

    it('should have 28% total employer contributions', () => {
      expect(MINIJOB_2025.employerRates.total).toBe(0.28);
    });
  });

  describe('MIDIJOB_2025', () => {
    it('should have correct range', () => {
      expect(MIDIJOB_2025.minEarnings).toBe(556.01);
      expect(MIDIJOB_2025.maxEarnings).toBe(2000);
    });

    it('should have factor less than 1', () => {
      expect(MIDIJOB_2025.factor).toBeLessThan(1);
      expect(MIDIJOB_2025.factor).toBeGreaterThan(0);
    });
  });

  describe('TAX_ALLOWANCES_2025', () => {
    it('should have basic allowance > 10000', () => {
      expect(TAX_ALLOWANCES_2025.basicAllowance).toBeGreaterThan(10000);
    });

    it('should have work-related expenses allowance', () => {
      expect(TAX_ALLOWANCES_2025.workRelatedExpenses).toBeGreaterThan(0);
    });

    it('should have child allowance', () => {
      expect(TAX_ALLOWANCES_2025.childAllowance).toBeGreaterThan(0);
    });
  });

  describe('getBBGForRegion', () => {
    it('should return West values for West Germany', () => {
      const bbg = getBBGForRegion(false, 'yearly');
      expect(bbg.pension).toBe(BBG_2025_YEARLY.pensionWest);
    });

    it('should return East values for East Germany', () => {
      const bbg = getBBGForRegion(true, 'yearly');
      expect(bbg.pension).toBe(BBG_2025_YEARLY.pensionEast);
    });

    it('should return monthly values when specified', () => {
      const bbg = getBBGForRegion(false, 'monthly');
      expect(bbg.pension).toBe(BBG_2025_MONTHLY.pensionWest);
    });
  });

  describe('getCareInsuranceRate', () => {
    it('should return higher rate for childless over 23', () => {
      const withChildren = getCareInsuranceRate(false, 30);
      const childless = getCareInsuranceRate(true, 30);
      
      expect(childless.employee).toBeGreaterThan(withChildren.employee);
    });

    it('should return normal rate for childless under 23', () => {
      const childless = getCareInsuranceRate(true, 22);
      expect(childless.employee).toBe(SOCIAL_INSURANCE_RATES_2025.care.employee);
    });

    it('should return normal rate for parents', () => {
      const parent = getCareInsuranceRate(false, 30);
      expect(parent.employee).toBe(SOCIAL_INSURANCE_RATES_2025.care.employee);
    });
  });
});
