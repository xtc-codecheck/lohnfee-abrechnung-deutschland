import { describe, it, expect } from 'vitest';
import { validatePersonalData, validateEmploymentData, validateSalaryData } from '../employee';

describe('employee validation - PersonalData', () => {
  it('validiert gültige Personaldaten', () => {
    const result = validatePersonalData({
      firstName: 'Max',
      lastName: 'Mustermann',
      gender: 'male',
      dateOfBirth: '1990-01-15',
      street: 'Teststraße',
      houseNumber: '1',
      postalCode: '12345',
      city: 'Berlin',
      state: 'berlin',
      country: 'Deutschland',
      taxId: '65929970489',
      taxClass: 'I',
      religion: 'none',
      relationshipStatus: 'single',
      healthInsurance: 'TK',
      healthInsuranceRate: 1.7,
      socialSecurityNumber: '',
      childAllowances: 0,
    });
    expect(result.success).toBe(true);
  });

  it('erkennt leeren Vornamen', () => {
    const result = validatePersonalData({
      firstName: '',
      lastName: 'Mustermann',
      gender: 'male',
      dateOfBirth: '1990-01-15',
      street: 'Teststraße',
      houseNumber: '1',
      postalCode: '12345',
      city: 'Berlin',
      state: 'berlin',
      taxId: '12345678901',
      taxClass: 'I',
      religion: 'none',
      relationshipStatus: 'single',
      healthInsurance: 'TK',
      healthInsuranceRate: 1.7,
      childAllowances: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('employee validation - EmploymentData', () => {
  it('validiert gültige Beschäftigungsdaten', () => {
    const result = validateEmploymentData({
      employmentType: 'fulltime',
      startDate: '2020-01-01',
      isFixedTerm: false,
      weeklyHours: 40,
      vacationDays: 30,
      contractSigned: true,
    });
    expect(result.success).toBe(true);
  });

  it('erkennt negative Wochenstunden', () => {
    const result = validateEmploymentData({
      employmentType: 'fulltime',
      startDate: '2020-01-01',
      isFixedTerm: false,
      weeklyHours: -5,
      vacationDays: 30,
      contractSigned: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('employee validation - SalaryData', () => {
  it('validiert gültige Gehaltsdaten', () => {
    const result = validateSalaryData({
      grossSalary: 4000,
      salaryType: 'fixed',
    });
    expect(result.success).toBe(true);
  });

  it('erkennt negatives Gehalt', () => {
    const result = validateSalaryData({
      grossSalary: -1000,
      salaryType: 'fixed',
    });
    expect(result.success).toBe(false);
  });
});
