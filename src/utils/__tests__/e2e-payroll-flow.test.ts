/**
 * End-to-End Integrationstests für den kompletten Lohnabrechnungsflow
 * 
 * Testet den vollständigen Pfad:
 * Mitarbeiterdaten → Steuerberechnung → SV-Berechnung → 
 * Lohnsteueranmeldung → Beitragsnachweis → GoBD-Export
 */

import { describe, it, expect } from 'vitest';
import { calculateCompleteTax, TaxCalculationParams, calculateOvertimeAndBonuses } from '../tax-calculation';
import { buildTaxParamsFromEmployee } from '../tax-params-factory';
import { validateELStAM } from '../elstam-validation';
import { generateGDPdUIndexXml, generateEmployeeCSV, generatePayrollCSV, GoBDExportConfig, GoBDEmployeeRecord, GoBDPayrollRecord } from '../gobd-export';
import { calculateMaerzklausel, MaerzklauselInput } from '../maerzklausel';
import { Employee, TaxClass, EmploymentType } from '@/types/employee';

// ============= Test-Mitarbeiter =============

function createTestEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'test-001',
    personalData: {
      firstName: 'Anna',
      lastName: 'Schmidt',
      dateOfBirth: new Date('1990-05-15'),
      address: { street: 'Hauptstr.', houseNumber: '10', postalCode: '80331', city: 'München', state: 'bayern', country: 'DE' },
      taxId: '12345678911',
      taxClass: 'I' as TaxClass,
      churchTax: false,
      relationshipStatus: 'single',
      healthInsurance: { name: 'TK', additionalRate: 1.7 },
      socialSecurityNumber: '12150590A123',
      childAllowances: 0,
      numberOfChildren: 0,
    },
    employmentData: {
      employmentType: 'fulltime' as EmploymentType,
      startDate: new Date('2020-01-01'),
      isFixedTerm: false,
      weeklyHours: 40,
      vacationDays: 30,
      workDays: [],
      department: 'Entwicklung',
      position: 'Entwicklerin',
      contractSigned: true,
      dataRetentionDate: new Date('2030-01-01'),
    },
    salaryData: {
      grossSalary: 4000,
      salaryType: 'monthly',
      additionalBenefits: {},
      bankingData: { iban: 'DE89370400440532013000', bic: 'COBADEFFXXX', bankName: 'Commerzbank', accountHolder: 'Anna Schmidt' },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Employee;
}

// ============= Flow-Tests =============

describe('E2E: Kompletter Lohnabrechnungsflow', () => {
  describe('Schritt 1: Mitarbeiterdaten → ELStAM-Validierung', () => {
    it('validiert vollständige Mitarbeiterdaten erfolgreich', () => {
      const result = validateELStAM({
        taxId: '12345678911',
        taxClass: 1,
        churchTax: false,
        childAllowances: 0,
        numberOfChildren: 0,
        dateOfBirth: '1990-05-15',
        entryDate: '2020-01-01',
        svNumber: '12150590A123',
        healthInsurance: 'TK',
        grossSalary: 4000,
        isActive: true,
      });
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it('erkennt unvollständige Daten vor Berechnung', () => {
      const result = validateELStAM({
        taxId: '',
        taxClass: 1,
        churchTax: false,
        childAllowances: 0,
        numberOfChildren: 0,
        dateOfBirth: '',
        entryDate: '2020-01-01',
        svNumber: '',
        healthInsurance: '',
        grossSalary: 4000,
        isActive: true,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Schritt 2: Steuer- und SV-Berechnung', () => {
    const employee = createTestEmployee();

    it('berechnet vollständige Abrechnung aus Mitarbeiterdaten', () => {
      const params = buildTaxParamsFromEmployee(employee);
      const result = calculateCompleteTax(params);

      expect(result.grossMonthly).toBe(4000);
      expect(result.netMonthly).toBeGreaterThan(0);
      expect(result.netMonthly).toBeLessThan(4000);
      expect(result.incomeTax).toBeGreaterThan(0);
      expect(result.pensionInsurance).toBeGreaterThan(0);
      expect(result.healthInsurance).toBeGreaterThan(0);
      expect(result.careInsurance).toBeGreaterThan(0);
      expect(result.unemploymentInsurance).toBeGreaterThan(0);
      expect(result.employerCosts).toBeGreaterThan(48000);
    });

    it('berücksichtigt Überstunden und Zuschläge', () => {
      const bonuses = calculateOvertimeAndBonuses({
        regularHours: 160,
        overtimeHours: 10,
        nightHours: 8,
        sundayHours: 0,
        holidayHours: 0,
        hourlyRate: 25,
      });

      expect(bonuses.regularPay).toBe(4000);
      expect(bonuses.overtimePay).toBe(312.5);
      expect(bonuses.nightBonus).toBe(50);
      expect(bonuses.totalGrossPay).toBe(4362.5);
    });
  });

  describe('Schritt 3: Märzklausel (Sonderzahlung)', () => {
    it('Sonderzahlung im März → Prüfung Vorjahreszuordnung', () => {
      const input: MaerzklauselInput = {
        paymentMonth: 3,
        oneTimePaymentAmount: 5000,
        currentMonthlyGross: 4000,
        previousYearTotalGross: 48000,
        previousYearBBG_RV: 90600,
        previousYearBBG_KV: 62100,
      };
      const result = calculateMaerzklausel(input);
      expect(result).toBeDefined();
      expect(typeof result.isApplicable).toBe('boolean');
      expect(typeof result.amountAttributedToPreviousYear).toBe('number');
    });
  });

  describe('Schritt 4: Lohnsteueranmeldung (LStA)', () => {
    it('aggregiert Steuerdaten für alle Mitarbeiter', () => {
      const employees = [
        createTestEmployee(),
        createTestEmployee({
          personalData: {
            firstName: 'Max', lastName: 'Müller', dateOfBirth: new Date('1985-03-10'),
            address: { street: 'Berliner Str.', houseNumber: '5', postalCode: '10115', city: 'Berlin', state: 'berlin', country: 'DE' },
            taxId: '98765432101', taxClass: 'III' as TaxClass, churchTax: false,
            relationshipStatus: 'married',
            healthInsurance: { name: 'TK', additionalRate: 1.7 },
            socialSecurityNumber: '12100385B456', childAllowances: 2, numberOfChildren: 2,
          },
          salaryData: {
            grossSalary: 5000, salaryType: 'fixed' as const, additionalBenefits: {},
            bankingData: { iban: 'DE12345678901234567890', bic: 'DEUTDEDB', bankName: 'Deutsche Bank', accountHolder: 'Max Müller' },
          },
        } as Partial<Employee>),
      ];

      const results = employees.map(emp => {
        const params = buildTaxParamsFromEmployee(emp);
        return calculateCompleteTax(params);
      });

      const lstaData = {
        sumLohnsteuer: results.reduce((sum, r) => sum + r.incomeTax / 12, 0),
        sumSoli: results.reduce((sum, r) => sum + r.solidarityTax / 12, 0),
        sumKiSt: results.reduce((sum, r) => sum + r.churchTax / 12, 0),
        anzahlArbeitnehmer: employees.length,
      };

      expect(lstaData.sumLohnsteuer).toBeGreaterThan(0);
      expect(lstaData.anzahlArbeitnehmer).toBe(2);
      expect(lstaData.sumSoli).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Schritt 5: GoBD-Export', () => {
    it('generiert vollständigen GoBD-Exportdatensatz', () => {
      const config: GoBDExportConfig = {
        companyName: 'Test GmbH',
        taxNumber: '123/456/78901',
        betriebsnummer: '12345678',
        exportYear: 2026,
        exportMonthFrom: 1,
        exportMonthTo: 12,
        createdBy: 'System',
      };

      const xml = generateGDPdUIndexXml(config);
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('Test GmbH');

      const empRecords: GoBDEmployeeRecord[] = [{
        personalNumber: '1001', firstName: 'Anna', lastName: 'Schmidt',
        dateOfBirth: '15.05.1990', taxId: '12345678911', svNumber: '12150590A123',
        taxClass: 1, healthInsurance: 'TK', entryDate: '01.01.2020',
        exitDate: '', department: 'Entwicklung', grossSalary: 4000,
      }];
      const empCSV = generateEmployeeCSV(empRecords);
      expect(empCSV).toContain('Anna');
      expect(empCSV).toContain('4000,00');

      const payRecords: GoBDPayrollRecord[] = [{
        personalNumber: '1001', employeeName: 'Schmidt, Anna', year: 2026, month: 1,
        grossSalary: 4000, incomeTax: 450, solidarityTax: 0, churchTax: 0,
        svHealthEmployee: 330, svHealthEmployer: 330, svPensionEmployee: 372, svPensionEmployer: 372,
        svUnemploymentEmployee: 52, svUnemploymentEmployer: 52, svCareEmployee: 92, svCareEmployer: 72,
        totalTax: 450, totalSVEmployee: 846, totalSVEmployer: 826, netSalary: 2704,
        employerCosts: 4826, bonus: 0, overtimePay: 0, deductions: 0, finalNetSalary: 2704,
      }];
      const payCSV = generatePayrollCSV(payRecords);
      expect(payCSV).toContain('4000,00');
    });
  });

  describe('Schritt 6: Konsistenzprüfung über gesamten Flow', () => {
    it('Abrechnung über 12 Monate ergibt konsistente Jahreswerte', () => {
      const employee = createTestEmployee();
      const params = buildTaxParamsFromEmployee(employee);
      const annual = calculateCompleteTax(params);

      expect(Math.abs(annual.grossYearly - 4000 * 12)).toBeLessThan(1);
      expect(annual.netYearly).toBe(annual.netMonthly * 12);
    });

    it('Steuerklassenwechsel III↔V: Gesamtsteuer eines Paares bleibt ähnlich', () => {
      const aIII = calculateCompleteTax(params2026({ grossSalaryYearly: 60000, taxClass: '3', isChildless: false }));
      const bV = calculateCompleteTax(params2026({ grossSalaryYearly: 30000, taxClass: '5', isChildless: false }));
      const totalIIIV = aIII.incomeTax + bV.incomeTax;

      const aIV = calculateCompleteTax(params2026({ grossSalaryYearly: 60000, taxClass: '4', isChildless: false }));
      const bIV = calculateCompleteTax(params2026({ grossSalaryYearly: 30000, taxClass: '4', isChildless: false }));
      const totalIVIV = aIV.incomeTax + bIV.incomeTax;

      const ratio = totalIIIV / totalIVIV;
      expect(ratio).toBeGreaterThan(0.7);
      expect(ratio).toBeLessThan(1.3);
    });

    it('Minijob-Arbeitnehmer hat keine SV-Abzüge', () => {
      const result = calculateCompleteTax(params2026({
        grossSalaryYearly: 520 * 12,
        employmentType: 'minijob',
      }));
      expect(result.netMonthly).toBe(result.grossMonthly);
      expect(result.totalSocialContributions).toBe(0);
    });
  });
});

function params2026(overrides: Partial<TaxCalculationParams>): TaxCalculationParams {
  return {
    grossSalaryYearly: 48000,
    taxClass: '1',
    childAllowances: 0,
    churchTax: false,
    churchTaxRate: 9,
    healthInsuranceRate: 1.7,
    isEastGermany: false,
    isChildless: true,
    age: 30,
    year: 2026,
    ...overrides,
  };
}
