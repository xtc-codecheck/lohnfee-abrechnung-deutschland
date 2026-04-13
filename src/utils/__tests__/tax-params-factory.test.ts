import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTaxParams } from '../tax-params-factory';
import { Employee } from '@/types/employee';

function createTestEmployee(overrides: Partial<any> = {}): Employee {
  return {
    id: 'test-1',
    personalData: {
      firstName: 'Max',
      lastName: 'Mustermann',
      dateOfBirth: new Date('1990-01-15'),
      address: { street: 'Test', houseNumber: '1', postalCode: '12345', city: 'Berlin', state: 'berlin', country: 'DE' },
      taxId: '12345678901',
      taxClass: overrides.taxClass ?? 'I',
      churchTax: overrides.churchTax ?? false,
      churchTaxRate: overrides.churchTaxRate,
      relationshipStatus: 'single',
      healthInsurance: { name: 'TK', additionalRate: overrides.additionalRate ?? 1.7 },
      socialSecurityNumber: '12345678A123',
      childAllowances: overrides.childAllowances ?? 0,
    },
    employmentData: {
      entryDate: new Date('2020-01-01'),
      position: 'Entwickler',
      department: 'IT',
      employmentType: overrides.employmentType ?? 'fulltime',
      weeklyHours: 40,
      industry: 'standard',
    },
    salaryData: {
      grossSalary: overrides.grossSalary ?? 4000,
      hasCompanyCar: false,
      hasBav: false,
    },
    bankDetails: { iban: 'DE123', bic: 'BIC123' },
  } as Employee;
}

describe('tax-params-factory', () => {
  it('erstellt TaxParams aus Employee mit Steuerklasse I', () => {
    const emp = createTestEmployee({ taxClass: 'I', grossSalary: 4000 });
    const params = createTaxParams(emp);
    
    expect(params.grossSalary).toBe(4000);
    expect(params.taxClass).toBe('I');
    expect(params.churchTax).toBe(false);
  });

  it('berücksichtigt Kirchensteuer', () => {
    const emp = createTestEmployee({ churchTax: true, churchTaxRate: 9 });
    const params = createTaxParams(emp);
    
    expect(params.churchTax).toBe(true);
  });

  it('berücksichtigt Kinderfreibeträge', () => {
    const emp = createTestEmployee({ childAllowances: 2 });
    const params = createTaxParams(emp);
    
    expect(params.childAllowances).toBe(2);
  });

  it('setzt KV-Zusatzbeitrag korrekt', () => {
    const emp = createTestEmployee({ additionalRate: 1.7 });
    const params = createTaxParams(emp);
    
    expect(params.healthInsuranceAdditionalRate).toBe(1.7);
  });
});
