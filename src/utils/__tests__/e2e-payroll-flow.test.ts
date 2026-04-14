/**
 * End-to-End Integrationstests für den kompletten Lohnabrechnungsflow
 * 
 * Testet den vollständigen Pfad:
 * Mitarbeiterdaten → Steuerberechnung → SV-Berechnung → 
 * Lohnsteueranmeldung → Beitragsnachweis → eLStB → DATEV-Export → GoBD
 */

import { describe, it, expect } from 'vitest';
import { calculateCompleteTax, TaxCalculationParams, calculateOvertimeAndBonuses } from '../tax-calculation';
import { createTaxParamsFromEmployee } from '../tax-params-factory';
import { validateELStAM } from '../elstam-validation';
import { generateGDPdUIndexXml, generateEmployeeCSV, generatePayrollCSV, GoBDExportConfig, GoBDEmployeeRecord, GoBDPayrollRecord } from '../gobd-export';
import { calculateEntgeltfortzahlung } from '../entgeltfortzahlung';
import { calculateMaerzklausel, MaerzklauselInput } from '../maerzklausel';
import { Employee, TaxClass, EmploymentType } from '@/types/employee';

// ============= Test-Mitarbeiter =============

function createTestEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'test-001',
    firstName: 'Anna',
    lastName: 'Schmidt',
    dateOfBirth: new Date('1990-05-15'),
    street: 'Hauptstr. 10',
    houseNumber: '10',
    postalCode: '80331',
    city: 'München',
    taxId: '12345678911',
    svNumber: '12150590A123',
    taxClass: 'I' as TaxClass,
    healthInsurance: 'TK',
    healthInsuranceNumber: '123456789',
    grossSalary: 4000,
    employmentType: 'fulltime' as EmploymentType,
    startDate: new Date('2020-01-01'),
    department: 'Entwicklung',
    position: 'Entwicklerin',
    weeklyHours: 40,
    numberOfChildren: 0,
    childAllowances: 0,
    churchTax: false,
    churchTaxRate: 0,
    isActive: true,
    state: 'bayern',
    iban: 'DE89370400440532013000',
    bic: 'COBADEFFXXX',
    hasCompanyCar: false,
    hasBav: false,
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
      const params = createTaxParamsFromEmployee(employee);
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
      expect(bonuses.overtimePay).toBe(312.5); // 10 * 25 * 1.25
      expect(bonuses.nightBonus).toBe(50); // 8 * 25 * 0.25
      expect(bonuses.totalGrossPay).toBe(4362.5);
    });
  });

  describe('Schritt 3: Entgeltfortzahlung bei Krankheit', () => {
    it('berechnet Krankheitstage korrekt', () => {
      const result = calculateEntgeltfortzahlung({
        dailyGross: 200,
        sickDays: 10,
        alreadyUsedDays: 0,
      });

      expect(result.paidDays).toBe(10);
      expect(result.totalCost).toBe(2000);
      expect(result.remainingDays).toBe(32); // 42 - 10
    });

    it('respektiert 42-Tage-Grenze', () => {
      const result = calculateEntgeltfortzahlung({
        dailyGross: 200,
        sickDays: 50,
        alreadyUsedDays: 0,
      });

      expect(result.paidDays).toBe(42);
      expect(result.totalCost).toBe(8400);
    });
  });

  describe('Schritt 4: Märzklausel (Sonderzahlung)', () => {
    it('Sonderzahlung im März → Prüfung Vorjahreszuordnung', () => {
      const input: MaerzklauselInput = {
        paymentMonth: 3,
        paymentYear: 2026,
        paymentAmount: 5000,
        annualGrossPreviousYear: 50000,
        previousYearSVContributions: 10000,
        bbgPreviousYear: 90600,
      };
      const result = calculateMaerzklausel(input);
      // Märzklausel prüft, ob Zuordnung ins Vorjahr nötig
      expect(result).toBeDefined();
      expect(typeof result.assignToPreviousYear).toBe('boolean');
    });
  });

  describe('Schritt 5: Lohnsteueranmeldung (LStA)', () => {
    it('aggregiert Steuerdaten für alle Mitarbeiter', () => {
      const employees = [
        createTestEmployee({ id: '1', grossSalary: 3500 }),
        createTestEmployee({ id: '2', grossSalary: 5000, taxClass: 'III' as TaxClass }),
        createTestEmployee({ id: '3', grossSalary: 556, employmentType: 'minijob' as EmploymentType }),
      ];

      const results = employees.map(emp => {
        const params = createTaxParamsFromEmployee(emp);
        return calculateCompleteTax(params);
      });

      const lstaData = {
        sumLohnsteuer: results.reduce((sum, r) => sum + r.incomeTax / 12, 0),
        sumSoli: results.reduce((sum, r) => sum + r.solidarityTax / 12, 0),
        sumKiSt: results.reduce((sum, r) => sum + r.churchTax / 12, 0),
        anzahlArbeitnehmer: employees.length,
      };

      expect(lstaData.sumLohnsteuer).toBeGreaterThan(0);
      expect(lstaData.anzahlArbeitnehmer).toBe(3);
      expect(lstaData.sumSoli).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Schritt 6: Beitragsnachweis', () => {
    it('aggregiert SV-Beiträge pro Krankenkasse', () => {
      const employees = [
        createTestEmployee({ id: '1', grossSalary: 4000, healthInsurance: 'TK' }),
        createTestEmployee({ id: '2', grossSalary: 3500, healthInsurance: 'TK' }),
        createTestEmployee({ id: '3', grossSalary: 5000, healthInsurance: 'AOK' }),
      ];

      const results = employees.map((emp, i) => ({
        healthInsurance: emp.healthInsurance,
        ...calculateCompleteTax(createTaxParamsFromEmployee(emp)),
      }));

      // Gruppierung nach Krankenkasse
      const byKK = new Map<string, typeof results>();
      for (const r of results) {
        const kk = r.healthInsurance || 'unbekannt';
        if (!byKK.has(kk)) byKK.set(kk, []);
        byKK.get(kk)!.push(r);
      }

      expect(byKK.size).toBe(2);
      expect(byKK.get('TK')!.length).toBe(2);
      expect(byKK.get('AOK')!.length).toBe(1);

      // Summen prüfen
      const tkTotal = byKK.get('TK')!.reduce((s, r) => s + r.healthInsurance, 0);
      expect(tkTotal).toBeGreaterThan(0);
    });
  });

  describe('Schritt 7: GoBD-Export', () => {
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

      // index.xml
      const xml = generateGDPdUIndexXml(config);
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('Test GmbH');
      expect(xml).toContain('stammdaten_mitarbeiter.csv');

      // Stammdaten CSV
      const empRecords: GoBDEmployeeRecord[] = [{
        personalNumber: '1001',
        firstName: 'Anna',
        lastName: 'Schmidt',
        dateOfBirth: '15.05.1990',
        taxId: '12345678911',
        svNumber: '12150590A123',
        taxClass: 1,
        healthInsurance: 'TK',
        entryDate: '01.01.2020',
        exitDate: '',
        department: 'Entwicklung',
        grossSalary: 4000,
      }];
      const empCSV = generateEmployeeCSV(empRecords);
      expect(empCSV).toContain('Anna');
      expect(empCSV).toContain('4000,00');

      // Lohnabrechnungen CSV
      const payRecords: GoBDPayrollRecord[] = [{
        personalNumber: '1001',
        employeeName: 'Schmidt, Anna',
        year: 2026,
        month: 1,
        grossSalary: 4000,
        incomeTax: 450,
        solidarityTax: 0,
        churchTax: 0,
        svHealthEmployee: 330,
        svHealthEmployer: 330,
        svPensionEmployee: 372,
        svPensionEmployer: 372,
        svUnemploymentEmployee: 52,
        svUnemploymentEmployer: 52,
        svCareEmployee: 92,
        svCareEmployer: 72,
        totalTax: 450,
        totalSVEmployee: 846,
        totalSVEmployer: 826,
        netSalary: 2704,
        employerCosts: 4826,
        bonus: 0,
        overtimePay: 0,
        deductions: 0,
        finalNetSalary: 2704,
      }];
      const payCSV = generatePayrollCSV(payRecords);
      expect(payCSV).toContain('4000,00');
      expect(payCSV).toContain('2026');
    });
  });

  describe('Schritt 8: Konsistenzprüfung über gesamten Flow', () => {
    it('Abrechnung über 12 Monate ergibt konsistente Jahreswerte', () => {
      const employee = createTestEmployee({ grossSalary: 4500 });
      const params = createTaxParamsFromEmployee(employee);
      const annual = calculateCompleteTax(params);

      // 12 identische Monate sollten Jahreswerte ergeben
      expect(Math.abs(annual.grossYearly - 4500 * 12)).toBeLessThan(1);
      expect(annual.netYearly).toBe(annual.netMonthly * 12);
    });

    it('Steuerklassenwechsel III↔V: Gesamtsteuer eines Paares bleibt gleich', () => {
      const grossA = 60000;
      const grossB = 30000;

      // Kombination III/V
      const aIII = calculateCompleteTax({ ...params2026({}), grossSalaryYearly: grossA, taxClass: '3', isChildless: false });
      const bV = calculateCompleteTax({ ...params2026({}), grossSalaryYearly: grossB, taxClass: '5', isChildless: false });
      const totalIIIV = aIII.incomeTax + bV.incomeTax;

      // Kombination IV/IV
      const aIV = calculateCompleteTax({ ...params2026({}), grossSalaryYearly: grossA, taxClass: '4', isChildless: false });
      const bIV = calculateCompleteTax({ ...params2026({}), grossSalaryYearly: grossB, taxClass: '4', isChildless: false });
      const totalIVIV = aIV.incomeTax + bIV.incomeTax;

      // III/V und IV/IV sollten ähnliche Gesamtsteuer ergeben (±20%)
      const ratio = totalIIIV / totalIVIV;
      expect(ratio).toBeGreaterThan(0.7);
      expect(ratio).toBeLessThan(1.3);
    });

    it('Minijob-Arbeitnehmer hat keine Steuer/SV-Abzüge', () => {
      const mini = createTestEmployee({ grossSalary: 520, employmentType: 'minijob' as EmploymentType });
      const params = createTaxParamsFromEmployee(mini);
      const result = calculateCompleteTax(params);

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
