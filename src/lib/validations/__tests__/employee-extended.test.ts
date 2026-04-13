import { describe, it, expect } from 'vitest';
import { validateEmployee, validatePersonalData, validateEmploymentData, validateSalaryData } from '../employee';

describe('employee validation - PersonalData', () => {
  it('validiert gültige Personaldaten', () => {
    const result = validatePersonalData({
      firstName: 'Max',
      lastName: 'Mustermann',
      dateOfBirth: new Date('1990-01-15'),
      address: { street: 'Test', houseNumber: '1', postalCode: '12345', city: 'Berlin', state: 'berlin', country: 'DE' },
      taxId: '12345678901',
      taxClass: 'I',
      churchTax: false,
      relationshipStatus: 'single',
      healthInsurance: { name: 'TK', additionalRate: 1.7 },
      socialSecurityNumber: '12345678A123',
      childAllowances: 0,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('erkennt leeren Vornamen', () => {
    const result = validatePersonalData({
      firstName: '',
      lastName: 'Mustermann',
      dateOfBirth: new Date('1990-01-15'),
      address: { street: 'Test', houseNumber: '1', postalCode: '12345', city: 'Berlin', state: 'berlin', country: 'DE' },
      taxId: '12345678901',
      taxClass: 'I',
      churchTax: false,
      relationshipStatus: 'single',
      healthInsurance: { name: 'TK', additionalRate: 1.7 },
      socialSecurityNumber: '12345678A123',
      childAllowances: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('employee validation - EmploymentData', () => {
  it('validiert gültige Beschäftigungsdaten', () => {
    const result = validateEmploymentData({
      entryDate: new Date('2020-01-01'),
      position: 'Entwickler',
      department: 'IT',
      employmentType: 'fulltime',
      weeklyHours: 40,
      industry: 'standard',
    });
    expect(result.valid).toBe(true);
  });

  it('erkennt negative Wochenstunden', () => {
    const result = validateEmploymentData({
      entryDate: new Date('2020-01-01'),
      position: 'Entwickler',
      department: 'IT',
      employmentType: 'fulltime',
      weeklyHours: -5,
      industry: 'standard',
    });
    expect(result.valid).toBe(false);
  });
});

describe('employee validation - SalaryData', () => {
  it('validiert gültige Gehaltsdaten', () => {
    const result = validateSalaryData({
      grossSalary: 4000,
      hasCompanyCar: false,
      hasBav: false,
    });
    expect(result.valid).toBe(true);
  });

  it('erkennt negatives Gehalt', () => {
    const result = validateSalaryData({
      grossSalary: -1000,
      hasCompanyCar: false,
      hasBav: false,
    });
    expect(result.valid).toBe(false);
  });
});
