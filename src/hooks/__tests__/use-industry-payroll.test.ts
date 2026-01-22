import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIndustryPayroll, IndustryPayrollInput, INDUSTRY_LABELS } from '../use-industry-payroll';
import { Employee, IndustryType } from '@/types/employee';

// Mock-Employee Factory
function createMockEmployee(industry: IndustryType = 'standard'): Employee {
  return {
    id: 'test-123',
    personalData: {
      firstName: 'Max',
      lastName: 'Mustermann',
      dateOfBirth: new Date('1990-01-15'),
      address: {
        street: 'Teststraße',
        houseNumber: '1',
        postalCode: '12345',
        city: 'Berlin',
        state: 'berlin',
        country: 'Deutschland',
      },
      taxId: '12345678901',
      taxClass: 'I',
      churchTax: false,
      relationshipStatus: 'single',
      healthInsurance: { name: 'TK', additionalRate: 1.2 },
      socialSecurityNumber: '12345678A123',
      childAllowances: 0,
    },
    employmentData: {
      employmentType: 'fulltime',
      startDate: new Date('2020-01-01'),
      isFixedTerm: false,
      weeklyHours: 40,
      vacationDays: 30,
      workDays: [],
      department: 'Test',
      position: 'Tester',
      contractSigned: true,
      dataRetentionDate: new Date('2030-01-01'),
      industry,
      industryConfig: industry === 'construction' 
        ? { constructionRegion: 'west', constructionTradeGroup: 'skilled' }
        : industry === 'gastronomy'
        ? { mealsProvided: true, tipsFromEmployer: false }
        : industry === 'nursing'
        ? { careLevel: 'nurse' }
        : undefined,
    },
    salaryData: {
      grossSalary: 3500,
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
  };
}

describe('useIndustryPayroll Hook', () => {
  
  // ============= Branchen-Erkennung =============
  
  describe('getEmployeeIndustry', () => {
    it('sollte Standard zurückgeben wenn keine Branche gesetzt', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('standard');
      
      expect(result.current.getEmployeeIndustry(employee)).toBe('standard');
    });

    it('sollte Baulohn erkennen', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('construction');
      
      expect(result.current.getEmployeeIndustry(employee)).toBe('construction');
    });

    it('sollte Gastronomie erkennen', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('gastronomy');
      
      expect(result.current.getEmployeeIndustry(employee)).toBe('gastronomy');
    });

    it('sollte Pflege erkennen', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('nursing');
      
      expect(result.current.getEmployeeIndustry(employee)).toBe('nursing');
    });
  });

  // ============= Branchenspezifische Prüfung =============

  describe('hasIndustrySpecificPayroll', () => {
    it('sollte false für Standard-Mitarbeiter zurückgeben', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('standard');
      
      expect(result.current.hasIndustrySpecificPayroll(employee)).toBe(false);
    });

    it('sollte true für Baulohn-Mitarbeiter zurückgeben', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('construction');
      
      expect(result.current.hasIndustrySpecificPayroll(employee)).toBe(true);
    });

    it('sollte true für Gastro-Mitarbeiter zurückgeben', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('gastronomy');
      
      expect(result.current.hasIndustrySpecificPayroll(employee)).toBe(true);
    });

    it('sollte true für Pflege-Mitarbeiter zurückgeben', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('nursing');
      
      expect(result.current.hasIndustrySpecificPayroll(employee)).toBe(true);
    });
  });

  // ============= Branchenspezifische Berechnung =============

  describe('calculateIndustryPayroll', () => {
    const baseInput: IndustryPayrollInput = {
      grossMonthly: 3500,
      hoursWorked: 168,
      nightHours: 20,
      sundayHours: 8,
      holidayHours: 4,
    };

    it('sollte leeres Ergebnis für Standard-Mitarbeiter zurückgeben', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('standard');
      
      const payrollResult = result.current.calculateIndustryPayroll(
        employee, 
        baseInput, 
        6, 
        2025
      );
      
      expect(payrollResult.industryType).toBe('standard');
      expect(payrollResult.additionalGross).toBe(0);
      expect(payrollResult.taxFreeAdditions).toBe(0);
    });

    it('sollte Baulohn-Zulagen berechnen', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('construction');
      
      const input: IndustryPayrollInput = {
        ...baseInput,
        winterHours: 40,
        dirtyWorkHours: 20,
      };
      
      const payrollResult = result.current.calculateIndustryPayroll(
        employee, 
        input, 
        1, // Januar = Winterperiode
        2025
      );
      
      expect(payrollResult.industryType).toBe('construction');
      expect(payrollResult.constructionResult).toBeDefined();
      expect(payrollResult.additionalGross).toBeGreaterThan(0);
      expect(payrollResult.employerAdditionalCosts).toBeGreaterThan(0); // SOKA-BAU
    });

    it('sollte Gastronomie-Zulagen berechnen', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('gastronomy');
      
      const input: IndustryPayrollInput = {
        ...baseInput,
        breakfastsProvided: 10,
        lunchesProvided: 20,
        dinnersProvided: 15,
        monthlyTips: 400,
      };
      
      const payrollResult = result.current.calculateIndustryPayroll(
        employee, 
        input, 
        6, 
        2025
      );
      
      expect(payrollResult.industryType).toBe('gastronomy');
      expect(payrollResult.gastronomyResult).toBeDefined();
      expect(payrollResult.additionalGross).toBeGreaterThan(0);
      expect(payrollResult.taxFreeAdditions).toBeGreaterThan(0); // Trinkgeld
    });

    it('sollte Pflege-SFN-Zuschläge berechnen', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('nursing');
      
      const input: IndustryPayrollInput = {
        ...baseInput,
        onCallHours: 20,
      };
      
      const payrollResult = result.current.calculateIndustryPayroll(
        employee, 
        input, 
        6, 
        2025
      );
      
      expect(payrollResult.industryType).toBe('nursing');
      expect(payrollResult.nursingResult).toBeDefined();
      expect(payrollResult.taxFreeAdditions).toBeGreaterThan(0); // SFN steuerfrei
    });

    it('sollte Winterperiode automatisch erkennen (Dez-März)', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('construction');
      
      const input: IndustryPayrollInput = {
        ...baseInput,
        winterHours: 50,
      };
      
      // Januar sollte Winterperiode sein
      const winterResult = result.current.calculateIndustryPayroll(
        employee, input, 1, 2025
      );
      
      // Juni sollte keine Winterperiode sein (aber winterHours werden ignoriert)
      const summerResult = result.current.calculateIndustryPayroll(
        employee, input, 6, 2025
      );
      
      expect(winterResult.constructionResult?.winterAllowance).toBeGreaterThan(0);
      expect(summerResult.constructionResult?.winterAllowance).toBe(0);
    });

    it('sollte Warnungen bei relevanten Situationen generieren', () => {
      const { result } = renderHook(() => useIndustryPayroll());
      const employee = createMockEmployee('construction');
      
      const payrollResult = result.current.calculateIndustryPayroll(
        employee, 
        baseInput, 
        1, // Winterperiode
        2025
      );
      
      expect(payrollResult.warnings).toBeDefined();
      expect(payrollResult.warnings.length).toBeGreaterThan(0);
    });
  });

  // ============= Konstanten =============

  describe('INDUSTRY_LABELS', () => {
    it('sollte Labels für alle Branchen enthalten', () => {
      expect(INDUSTRY_LABELS.standard).toBe('Standard');
      expect(INDUSTRY_LABELS.construction).toBe('Baulohn');
      expect(INDUSTRY_LABELS.gastronomy).toBe('Gastronomie');
      expect(INDUSTRY_LABELS.nursing).toBe('Pflege / Schichtdienst');
    });
  });
});
