/**
 * Tests für Entgeltfortzahlung (§ 3 EFZG)
 */
import { describe, it, expect } from 'vitest';
import { calculateEFZG, EFZG_DURATION_DAYS, EFZGParams } from '../entgeltfortzahlung';
import { Employee } from '@/types/employee';

const mockEmployee: Employee = {
  id: 'test-emp',
  personalData: {
    firstName: 'Max',
    lastName: 'Mustermann',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    nationality: 'deutsch',
    taxId: '12345678901',
    socialSecurityNumber: '12345678A123',
    taxClass: 'I' as const,
    childAllowances: 0,
    churchTax: false,
    numberOfChildren: 0,
    address: {
      street: 'Musterstr.',
      houseNumber: '1',
      postalCode: '10115',
      city: 'Berlin',
      state: 'berlin',
      country: 'DE',
    },
    healthInsurance: {
      name: 'TK',
      additionalRate: 1.7,
    },
  },
  salaryData: {
    grossSalary: 3000,
    salaryType: 'monthly' as any,
    additionalBenefits: {},
    bankingData: { iban: '', bic: '', bankName: '', accountHolder: '' },
  },
  employmentData: {
    entryDate: new Date('2020-01-01'),
    position: 'Test',
    department: 'IT',
    employmentType: 'fulltime' as const,
    weeklyHours: 40,
  },
};

describe('Entgeltfortzahlung (§ 3 EFZG)', () => {
  it('sollte volle EFZG für kurze Krankheit berechnen', () => {
    const result = calculateEFZG({
      employee: mockEmployee,
      sickStartDate: new Date('2025-03-01'),
      sickEndDate: new Date('2025-03-07'),
      grossMonthlySalary: 3000,
    });

    expect(result.totalDays).toBe(7);
    expect(result.employerPaymentDays).toBe(7);
    expect(result.sickPayDays).toBe(0);
    expect(result.dailyGrossSalary).toBe(100); // 3000/30
    expect(result.employerPaymentAmount).toBe(700);
    expect(result.sickPayAmount).toBe(0);
    expect(result.sickPayStartDate).toBeNull();
  });

  it('sollte exakt 42 Tage EFZG gewähren', () => {
    const result = calculateEFZG({
      employee: mockEmployee,
      sickStartDate: new Date('2025-01-01'),
      sickEndDate: new Date('2025-02-11'), // 42 Tage
      grossMonthlySalary: 3000,
    });

    expect(result.totalDays).toBe(42);
    expect(result.employerPaymentDays).toBe(42);
    expect(result.sickPayDays).toBe(0);
  });

  it('sollte Krankengeld nach 42 Tagen berechnen', () => {
    const result = calculateEFZG({
      employee: mockEmployee,
      sickStartDate: new Date('2025-01-01'),
      sickEndDate: new Date('2025-03-01'), // 60 Tage
      grossMonthlySalary: 3000,
    });

    expect(result.totalDays).toBe(60);
    expect(result.employerPaymentDays).toBe(42);
    expect(result.sickPayDays).toBe(18);
    expect(result.sickPayAmount).toBeGreaterThan(0);
    expect(result.dailySickPay).toBeGreaterThan(0);
    expect(result.dailySickPay).toBeLessThan(result.dailyGrossSalary);
    expect(result.sickPayStartDate).not.toBeNull();
  });

  it('sollte bereits verbrauchte EFZG-Tage berücksichtigen', () => {
    const result = calculateEFZG({
      employee: mockEmployee,
      sickStartDate: new Date('2025-06-01'),
      sickEndDate: new Date('2025-06-20'), // 20 Tage
      grossMonthlySalary: 3000,
      previousEfzgDaysUsed: 30, // 30 Tage bereits verbraucht
    });

    expect(result.totalDays).toBe(20);
    expect(result.employerPaymentDays).toBe(12); // 42 - 30 = 12 verbleibend
    expect(result.sickPayDays).toBe(8); // 20 - 12
  });

  it('sollte bei vollständig verbrauchten EFZG nur Krankengeld zahlen', () => {
    const result = calculateEFZG({
      employee: mockEmployee,
      sickStartDate: new Date('2025-06-01'),
      sickEndDate: new Date('2025-06-10'),
      grossMonthlySalary: 3000,
      previousEfzgDaysUsed: 42,
    });

    expect(result.employerPaymentDays).toBe(0);
    expect(result.employerPaymentAmount).toBe(0);
    expect(result.sickPayDays).toBe(10);
    expect(result.sickPayAmount).toBeGreaterThan(0);
  });

  it('sollte Krankengeld ≤ 70% Brutto berechnen', () => {
    const result = calculateEFZG({
      employee: mockEmployee,
      sickStartDate: new Date('2025-01-01'),
      sickEndDate: new Date('2025-03-01'),
      grossMonthlySalary: 3000,
    });

    const dailyGross = 3000 / 30;
    const maxSickPay = dailyGross * 0.7;
    expect(result.dailySickPay).toBeLessThanOrEqual(maxSickPay + 0.01);
  });

  it('sollte EFZG_DURATION_DAYS auf 42 gesetzt sein', () => {
    expect(EFZG_DURATION_DAYS).toBe(42);
  });
});
