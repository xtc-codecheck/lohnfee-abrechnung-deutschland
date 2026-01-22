import { describe, it, expect } from 'vitest';
import {
  personalDataSchema,
  employmentDataSchema,
  salaryDataSchema,
  validateEmployeeForm,
} from '../employee';

describe('Employee Validation Schemas', () => {
  describe('personalDataSchema', () => {
    const validPersonalData = {
      firstName: 'Max',
      lastName: 'Mustermann',
      gender: 'male',
      dateOfBirth: '1990-01-01',
      street: 'Musterstraße',
      houseNumber: '1',
      postalCode: '12345',
      city: 'Berlin',
      state: 'berlin',
      country: 'Deutschland',
      taxId: '12345678901',
      taxClass: 'I',
      religion: 'none',
      relationshipStatus: 'single',
      healthInsurance: 'TK',
      healthInsuranceRate: 1.7,
      childAllowances: 0,
    };

    it('should validate correct personal data', () => {
      const result = personalDataSchema.safeParse(validPersonalData);
      expect(result.success).toBe(true);
    });

    it('should reject empty firstName', () => {
      const result = personalDataSchema.safeParse({
        ...validPersonalData,
        firstName: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid postal code', () => {
      const result = personalDataSchema.safeParse({
        ...validPersonalData,
        postalCode: '1234', // zu kurz
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid tax ID', () => {
      const result = personalDataSchema.safeParse({
        ...validPersonalData,
        taxId: '123', // zu kurz
      });
      expect(result.success).toBe(false);
    });

    it('should validate 11-digit tax ID', () => {
      const result = personalDataSchema.safeParse({
        ...validPersonalData,
        taxId: '12345678901',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional email when empty', () => {
      const result = personalDataSchema.safeParse({
        ...validPersonalData,
        email: '',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = personalDataSchema.safeParse({
        ...validPersonalData,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });

    it('should validate correct email', () => {
      const result = personalDataSchema.safeParse({
        ...validPersonalData,
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('employmentDataSchema', () => {
    const validEmploymentData = {
      employmentType: 'fulltime',
      startDate: '2020-01-01',
      isFixedTerm: false,
      weeklyHours: 40,
      vacationDays: 30,
      contractSigned: true,
    };

    it('should validate correct employment data', () => {
      const result = employmentDataSchema.safeParse(validEmploymentData);
      expect(result.success).toBe(true);
    });

    it('should accept all employment types', () => {
      ['minijob', 'midijob', 'fulltime', 'parttime'].forEach(type => {
        const result = employmentDataSchema.safeParse({
          ...validEmploymentData,
          employmentType: type,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid employment type', () => {
      const result = employmentDataSchema.safeParse({
        ...validEmploymentData,
        employmentType: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing start date', () => {
      const result = employmentDataSchema.safeParse({
        ...validEmploymentData,
        startDate: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject excessive weekly hours', () => {
      const result = employmentDataSchema.safeParse({
        ...validEmploymentData,
        weeklyHours: 70,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('salaryDataSchema', () => {
    it('should validate positive gross salary', () => {
      const result = salaryDataSchema.safeParse({
        grossSalary: 4000,
        salaryType: 'fixed',
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative gross salary', () => {
      const result = salaryDataSchema.safeParse({
        grossSalary: -1000,
        salaryType: 'fixed',
      });
      expect(result.success).toBe(false);
    });

    it('should accept zero gross salary', () => {
      const result = salaryDataSchema.safeParse({
        grossSalary: 0,
        salaryType: 'fixed',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all salary types', () => {
      ['fixed', 'hourly', 'variable'].forEach(type => {
        const result = salaryDataSchema.safeParse({
          grossSalary: 4000,
          salaryType: type,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept Minijob salary (556€)', () => {
      const result = salaryDataSchema.safeParse({
        grossSalary: 556,
        salaryType: 'fixed',
      });
      expect(result.success).toBe(true);
    });

    it('should accept Midijob salary (556,01€ - 2000€)', () => {
      [556.01, 1000, 2000].forEach(salary => {
        const result = salaryDataSchema.safeParse({
          grossSalary: salary,
          salaryType: 'fixed',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept very high salary', () => {
      const result = salaryDataSchema.safeParse({
        grossSalary: 100000,
        salaryType: 'fixed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('validateEmployeeForm', () => {
    it('should validate complete employee form', () => {
      const result = validateEmployeeForm({
        firstName: 'Max',
        lastName: 'Mustermann',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        street: 'Musterstraße',
        houseNumber: '1',
        postalCode: '12345',
        city: 'Berlin',
        state: 'berlin',
        country: 'Deutschland',
        taxId: '12345678901',
        taxClass: 'I',
        religion: 'none',
        relationshipStatus: 'single',
        healthInsurance: 'TK',
        healthInsuranceRate: 1.7,
        childAllowances: 0,
        employmentType: 'fulltime',
        startDate: '2020-01-01',
        isFixedTerm: false,
        weeklyHours: 40,
        vacationDays: 30,
        contractSigned: true,
        grossSalary: 4000,
        salaryType: 'fixed',
      });

      expect(result.success).toBe(true);
    });

    it('should return errors for invalid data', () => {
      const result = validateEmployeeForm({
        firstName: '',
        lastName: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });
});
