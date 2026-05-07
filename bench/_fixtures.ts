import { Employee, TaxClass, EmploymentType } from '@/types/employee';

export function makeEmployee(i: number, overrides: Partial<Employee> = {}): Employee {
  return {
    id: `emp-${i}`,
    personalData: {
      firstName: `Anna${i}`, lastName: 'Schmidt', dateOfBirth: new Date('1990-05-15'),
      address: { street: 'Hauptstr.', houseNumber: '10', postalCode: '80331', city: 'München', state: 'bayern', country: 'DE' },
      taxId: '12345678911', taxClass: 'I' as TaxClass, churchTax: false, relationshipStatus: 'single',
      healthInsurance: { name: 'TK', additionalRate: 1.7 } as any, socialSecurityNumber: '12150590A123',
      childAllowances: 0, numberOfChildren: 0,
    },
    employmentData: {
      employmentType: 'fulltime' as EmploymentType, startDate: new Date('2020-01-01'), isFixedTerm: false,
      weeklyHours: 40, vacationDays: 30, workDays: [], department: 'Dev', position: 'Dev',
      contractSigned: true, dataRetentionDate: new Date('2030-01-01'),
    },
    salaryData: {
      grossSalary: 3000 + (i % 50) * 100, salaryType: 'fixed' as any, additionalBenefits: {} as any,
      bankingData: { iban: 'DE89370400440532013000', bic: 'COBADEFFXXX', bankName: 'X', accountHolder: 'X' },
    },
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as Employee;
}

export function makeWorkingData() {
  return {
    regularHours: 173, overtimeHours: 5, nightHours: 2, sundayHours: 0, holidayHours: 0,
    vacationDays: 0, sickDays: 0, actualWorkingDays: 21, expectedWorkingDays: 21,
  };
}