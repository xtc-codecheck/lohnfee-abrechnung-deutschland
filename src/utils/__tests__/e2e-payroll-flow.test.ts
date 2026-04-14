/**
 * End-to-End Integrationstests für den kompletten Lohnabrechnungsflow
 */

import { describe, it, expect } from 'vitest';
import { calculateCompleteTax, TaxCalculationParams, calculateOvertimeAndBonuses } from '../tax-calculation';
import { buildTaxParamsFromEmployee } from '../tax-params-factory';
import { validateELStAM } from '../elstam-validation';
import { generateGDPdUIndexXml, generateEmployeeCSV, generatePayrollCSV, GoBDExportConfig, GoBDEmployeeRecord, GoBDPayrollRecord } from '../gobd-export';
import { calculateMaerzklausel, MaerzklauselInput } from '../maerzklausel';
import { Employee, TaxClass, EmploymentType } from '@/types/employee';

function createTestEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'test-001',
    personalData: {
      firstName: 'Anna', lastName: 'Schmidt', dateOfBirth: new Date('1990-05-15'),
      address: { street: 'Hauptstr.', houseNumber: '10', postalCode: '80331', city: 'München', state: 'bayern', country: 'DE' },
      taxId: '12345678911', taxClass: 'I' as TaxClass, churchTax: false, relationshipStatus: 'single',
      healthInsurance: { name: 'TK', additionalRate: 1.7 }, socialSecurityNumber: '12150590A123',
      childAllowances: 0, numberOfChildren: 0,
    },
    employmentData: {
      employmentType: 'fulltime' as EmploymentType, startDate: new Date('2020-01-01'), isFixedTerm: false,
      weeklyHours: 40, vacationDays: 30, workDays: [], department: 'Entwicklung', position: 'Entwicklerin',
      contractSigned: true, dataRetentionDate: new Date('2030-01-01'),
    },
    salaryData: {
      grossSalary: 4000, salaryType: 'fixed', additionalBenefits: {},
      bankingData: { iban: 'DE89370400440532013000', bic: 'COBADEFFXXX', bankName: 'Commerzbank', accountHolder: 'Anna Schmidt' },
    },
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as Employee;
}

function p2026(o: Partial<TaxCalculationParams> = {}): TaxCalculationParams {
  return { grossSalaryYearly: 48000, taxClass: '1', childAllowances: 0, churchTax: false, churchTaxRate: 9, healthInsuranceRate: 1.7, isEastGermany: false, isChildless: true, age: 30, year: 2026, ...o };
}

describe('E2E: Kompletter Lohnabrechnungsflow', () => {
  describe('Schritt 1: ELStAM-Validierung', () => {
    it('validiert vollständige Daten', () => {
      const r = validateELStAM({ taxId: '12345678911', taxClass: 1, churchTax: false, childAllowances: 0, numberOfChildren: 0, dateOfBirth: '1990-05-15', entryDate: '2020-01-01', svNumber: '12150590A123', healthInsurance: 'TK', grossSalary: 4000, isActive: true });
      expect(r.isValid).toBe(true);
      expect(r.score).toBeGreaterThanOrEqual(80);
    });
    it('erkennt fehlende Daten', () => {
      const r = validateELStAM({ taxId: '', taxClass: 1, churchTax: false, childAllowances: 0, numberOfChildren: 0, dateOfBirth: '', entryDate: '2020-01-01', svNumber: '', healthInsurance: '', grossSalary: 4000, isActive: true });
      expect(r.isValid).toBe(false);
    });
  });

  describe('Schritt 2: Steuer/SV-Berechnung', () => {
    it('berechnet vollständige Abrechnung', () => {
      const params = buildTaxParamsFromEmployee(createTestEmployee());
      const r = calculateCompleteTax(params);
      expect(r.grossMonthly).toBe(4000);
      expect(r.netMonthly).toBeGreaterThan(0);
      expect(r.netMonthly).toBeLessThan(4000);
      expect(r.employerCosts).toBeGreaterThan(48000);
    });
    it('Überstunden/Zuschläge', () => {
      const b = calculateOvertimeAndBonuses({ regularHours: 160, overtimeHours: 10, nightHours: 8, sundayHours: 0, holidayHours: 0, hourlyRate: 25 });
      expect(b.regularPay).toBe(4000);
      expect(b.overtimePay).toBe(312.5);
      expect(b.totalGrossPay).toBe(4362.5);
    });
  });

  describe('Schritt 3: Märzklausel', () => {
    it('prüft Vorjahreszuordnung', () => {
      const r = calculateMaerzklausel({ paymentMonth: 3, oneTimePaymentAmount: 5000, currentMonthlyGross: 4000, previousYearTotalGross: 48000, previousYearBBG_RV: 90600, previousYearBBG_KV: 62100 });
      expect(r).toBeDefined();
      expect(typeof r.isApplicable).toBe('boolean');
    });
  });

  describe('Schritt 4: LStA-Aggregation', () => {
    it('aggregiert Steuern für mehrere MA', () => {
      const emp1 = createTestEmployee();
      const emp2 = createTestEmployee({
        personalData: { firstName: 'Max', lastName: 'Müller', dateOfBirth: new Date('1985-03-10'), address: { street: 'Berliner Str.', houseNumber: '5', postalCode: '10115', city: 'Berlin', state: 'berlin', country: 'DE' }, taxId: '98765432101', taxClass: 'III' as TaxClass, churchTax: false, relationshipStatus: 'married', healthInsurance: { name: 'TK', additionalRate: 1.7 }, socialSecurityNumber: '12100385B456', childAllowances: 2, numberOfChildren: 2 },
        salaryData: { grossSalary: 5000, salaryType: 'fixed' as const, additionalBenefits: {}, bankingData: { iban: 'DE12345678901234567890', bic: 'DEUTDEDB', bankName: 'Deutsche Bank', accountHolder: 'Max Müller' } },
      } as Partial<Employee>);
      const results = [emp1, emp2].map(e => calculateCompleteTax(buildTaxParamsFromEmployee(e)));
      const sum = results.reduce((s, r) => s + r.incomeTax / 12, 0);
      expect(sum).toBeGreaterThan(0);
    });
  });

  describe('Schritt 5: GoBD-Export', () => {
    it('generiert vollständigen Datensatz', () => {
      const cfg: GoBDExportConfig = { companyName: 'Test GmbH', taxNumber: '123/456/78901', betriebsnummer: '12345678', exportYear: 2026, exportMonthFrom: 1, exportMonthTo: 12, createdBy: 'System' };
      expect(generateGDPdUIndexXml(cfg)).toContain('Test GmbH');
      const empCSV = generateEmployeeCSV([{ personalNumber: '1001', firstName: 'Anna', lastName: 'Schmidt', dateOfBirth: '15.05.1990', taxId: '12345678911', svNumber: '12150590A123', taxClass: 1, healthInsurance: 'TK', entryDate: '01.01.2020', exitDate: '', department: 'IT', grossSalary: 4000 }]);
      expect(empCSV).toContain('4000,00');
    });
  });

  describe('Schritt 6: Konsistenz', () => {
    it('12 Monate ergeben Jahreswerte', () => {
      const r = calculateCompleteTax(buildTaxParamsFromEmployee(createTestEmployee()));
      expect(Math.abs(r.grossYearly - 4000 * 12)).toBeLessThan(1);
      expect(r.netYearly).toBe(r.netMonthly * 12);
    });
    it('III/V vs IV/IV ähnliche Gesamtsteuer', () => {
      const a3 = calculateCompleteTax(p2026({ grossSalaryYearly: 60000, taxClass: '3', isChildless: false }));
      const b5 = calculateCompleteTax(p2026({ grossSalaryYearly: 30000, taxClass: '5', isChildless: false }));
      const a4 = calculateCompleteTax(p2026({ grossSalaryYearly: 60000, taxClass: '4', isChildless: false }));
      const b4 = calculateCompleteTax(p2026({ grossSalaryYearly: 30000, taxClass: '4', isChildless: false }));
      const ratio = (a3.incomeTax + b5.incomeTax) / (a4.incomeTax + b4.incomeTax);
      expect(ratio).toBeGreaterThan(0.7);
      expect(ratio).toBeLessThan(1.3);
    });
    it('Minijob: Netto = Brutto', () => {
      const r = calculateCompleteTax(p2026({ grossSalaryYearly: 520 * 12, employmentType: 'minijob' }));
      expect(r.netMonthly).toBe(r.grossMonthly);
    });
  });
});
