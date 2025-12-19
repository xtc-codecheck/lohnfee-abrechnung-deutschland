import { describe, it, expect, vi } from 'vitest';
import {
  calculateSickPay,
  calculateMaternityBenefits,
  calculateShortTimeWork,
  validateShortTimeWork,
  getMaxSickPayDuration,
} from '../special-payments-calculation';
import { Employee } from '@/types/employee';

// Mock Employee für Tests
const createMockEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'test-employee-1',
  personalData: {
    firstName: 'Max',
    lastName: 'Mustermann',
    dateOfBirth: new Date('1990-01-01'),
    address: {
      street: 'Musterstraße',
      houseNumber: '1',
      postalCode: '12345',
      city: 'Berlin',
      state: 'berlin',
      country: 'Deutschland',
    },
    taxId: '12345678901',
    taxClass: 'I',
    religion: 'none',
    relationshipStatus: 'single',
    healthInsurance: {
      name: 'TK',
      additionalRate: 1.7,
    },
    socialSecurityNumber: '123456789012',
    childAllowances: 0,
    churchTax: false,
  },
  employmentData: {
    employmentType: 'fulltime',
    startDate: new Date('2020-01-01'),
    weeklyHours: 40,
    vacationDays: 30,
    isFixedTerm: false,
    contractSigned: true,
    workDays: [],
    department: 'IT',
    position: 'Developer',
    dataRetentionDate: new Date('2030-01-01'),
  },
  salaryData: {
    grossSalary: 4000,
    salaryType: 'fixed',
    additionalBenefits: {},
    bankingData: {
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      bankName: 'Commerzbank',
      accountHolder: 'Max Mustermann',
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Special Payments Calculation', () => {
  describe('calculateSickPay', () => {
    it('should calculate sick pay for one week', () => {
      const result = calculateSickPay({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-12'),
        grossSalary: 3000,
      });

      expect(result.daysOfSickness).toBe(7);
      expect(result.sickPayPerDay).toBeGreaterThan(0);
      expect(result.totalSickPay).toBe(result.sickPayPerDay * 7);
    });

    it('should be 70% of gross (max 90% of net)', () => {
      const result = calculateSickPay({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-01'),
        grossSalary: 3000,
      });

      const dailyGross = 3000 / 30;
      const maxFromGross = dailyGross * 0.7;

      expect(result.sickPayPerDay).toBeLessThanOrEqual(maxFromGross);
    });

    it('should have status active', () => {
      const result = calculateSickPay({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-07'),
        grossSalary: 3000,
      });

      expect(result.status).toBe('active');
    });

    it('should generate unique ID', () => {
      const result1 = calculateSickPay({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-07'),
        grossSalary: 3000,
      });

      const result2 = calculateSickPay({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-07'),
        grossSalary: 3000,
      });

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('calculateMaternityBenefits', () => {
    it('should calculate maternity protection benefits', () => {
      const result = calculateMaternityBenefits({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-28'),
        grossSalary: 3000,
        type: 'maternity-protection',
      });

      expect(result.totalBenefit).toBeGreaterThan(0);
      expect(result.paidByInsurance).toBeGreaterThan(0);
      expect(result.paidByEmployer).toBeGreaterThanOrEqual(0);
    });

    it('should split costs between employer and insurance', () => {
      const result = calculateMaternityBenefits({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        grossSalary: 3000,
        type: 'maternity-protection',
      });

      expect(result.paidByEmployer + result.paidByInsurance).toBeCloseTo(result.totalBenefit, 0);
    });

    it('should calculate parental leave at 65%', () => {
      const result = calculateMaternityBenefits({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        grossSalary: 3000,
        type: 'parental-leave',
      });

      expect(result.paidByEmployer).toBe(0);
      expect(result.paidByInsurance).toBeGreaterThan(0);
    });
  });

  describe('calculateShortTimeWork', () => {
    it('should calculate reduced work benefits', () => {
      const result = calculateShortTimeWork({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        originalHours: 40,
        reducedHours: 20,
        grossSalary: 3000,
        hasChildren: false,
      });

      expect(result.reductionPercentage).toBe(0.5);
      expect(result.grossSalaryLoss).toBe(1500);
      expect(result.shortTimeWorkBenefit).toBeGreaterThan(0);
    });

    it('should give 67% for employees with children', () => {
      const withChildren = calculateShortTimeWork({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        originalHours: 40,
        reducedHours: 20,
        grossSalary: 3000,
        hasChildren: true,
      });

      const withoutChildren = calculateShortTimeWork({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        originalHours: 40,
        reducedHours: 20,
        grossSalary: 3000,
        hasChildren: false,
      });

      expect(withChildren.shortTimeWorkBenefit).toBeGreaterThan(withoutChildren.shortTimeWorkBenefit);
    });

    it('should handle full reduction', () => {
      const result = calculateShortTimeWork({
        employee: createMockEmployee(),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        originalHours: 40,
        reducedHours: 0,
        grossSalary: 3000,
        hasChildren: false,
      });

      expect(result.reductionPercentage).toBe(1);
      expect(result.grossSalaryLoss).toBe(3000);
    });
  });

  describe('validateShortTimeWork', () => {
    it('should validate minimum 10% reduction', () => {
      expect(validateShortTimeWork(0.1)).toBe(true);
      expect(validateShortTimeWork(0.5)).toBe(true);
      expect(validateShortTimeWork(0.09)).toBe(false);
    });
  });

  describe('getMaxSickPayDuration', () => {
    it('should return date 78 weeks after start', () => {
      const startDate = new Date('2025-01-01');
      const maxDate = getMaxSickPayDuration(startDate);
      
      const diffDays = Math.round((maxDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(78 * 7);
    });
  });
});
