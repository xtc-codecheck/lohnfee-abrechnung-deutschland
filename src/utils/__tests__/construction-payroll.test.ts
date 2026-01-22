import { describe, it, expect } from 'vitest';
import {
  calculateConstructionPayroll,
  calculateSokaContributions,
  calculateVacationAccount,
  calculateWinterAllowances,
  calculateConstructionBonuses,
  getTariffHourlyRate,
  ConstructionPayrollParams,
} from '../construction-payroll';

describe('Baulohn-Berechnungen (Construction Payroll)', () => {
  
  // ============= SOKA-BAU Beiträge =============
  
  describe('calculateSokaContributions', () => {
    it('sollte korrekten AG-Beitrag für West berechnen (15,20%)', () => {
      const result = calculateSokaContributions(3500, 'west');
      
      expect(result.employer).toBeCloseTo(532, 0); // 3500 * 0.152
      expect(result.employee).toBe(0); // AN zahlt nichts
    });

    it('sollte korrekten AG-Beitrag für Ost berechnen (15,20%)', () => {
      const result = calculateSokaContributions(3000, 'east');
      
      expect(result.employer).toBeCloseTo(456, 0); // 3000 * 0.152
      expect(result.employee).toBe(0);
    });

    it('sollte Details-Array mit Erklärungen enthalten', () => {
      const result = calculateSokaContributions(4000, 'west');
      
      expect(result.details).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
      expect(result.details.some(d => d.includes('SOKA-BAU'))).toBe(true);
    });
  });

  // ============= Wintergeld =============

  describe('calculateWinterAllowances', () => {
    it('sollte Wintergeld nur in Winterperiode berechnen', () => {
      const winterResult = calculateWinterAllowances(160, true);
      const summerResult = calculateWinterAllowances(160, false);
      
      expect(winterResult.allowance).toBeGreaterThan(0);
      expect(summerResult.allowance).toBe(0);
    });

    it('sollte 1,00€ pro Stunde Wintergeld berechnen', () => {
      const result = calculateWinterAllowances(100, true);
      
      expect(result.allowance).toBe(100); // 100h * 1,00€
    });

    it('sollte 0 bei 0 Stunden zurückgeben', () => {
      const result = calculateWinterAllowances(0, true);
      
      expect(result.allowance).toBe(0);
    });
  });

  // ============= Zulagen =============

  describe('calculateConstructionBonuses', () => {
    it('sollte Schmutzzulage berechnen', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 3500,
        region: 'west',
        tradeGroup: 'skilled',
        hoursWorked: 160,
        isWinterPeriod: false,
        dirtyWorkHours: 40,
      };
      
      const result = calculateConstructionBonuses(params);
      
      expect(result.dirtyWork).toBeGreaterThan(0);
    });

    it('sollte Höhenzulage berechnen', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 3500,
        region: 'west',
        tradeGroup: 'foreman',
        hoursWorked: 160,
        isWinterPeriod: false,
        heightWorkHours: 20,
      };
      
      const result = calculateConstructionBonuses(params);
      
      expect(result.heightWork).toBeGreaterThan(0);
    });

    it('sollte Gefahrenzulage berechnen', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 4000,
        region: 'east',
        tradeGroup: 'master',
        hoursWorked: 160,
        isWinterPeriod: false,
        dangerWorkHours: 10,
      };
      
      const result = calculateConstructionBonuses(params);
      
      expect(result.dangerWork).toBeGreaterThan(0);
    });

    it('sollte Gesamt aller Zulagen korrekt summieren', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 3500,
        region: 'west',
        tradeGroup: 'skilled',
        hoursWorked: 160,
        isWinterPeriod: false,
        dirtyWorkHours: 20,
        heightWorkHours: 10,
        dangerWorkHours: 5,
      };
      
      const result = calculateConstructionBonuses(params);
      
      expect(result.total).toBe(
        result.dirtyWork + result.heightWork + result.dangerWork
      );
    });

    it('sollte 0 zurückgeben wenn keine Zulagen-Stunden', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 3500,
        region: 'west',
        tradeGroup: 'worker',
        hoursWorked: 160,
        isWinterPeriod: false,
      };
      
      const result = calculateConstructionBonuses(params);
      
      expect(result.total).toBe(0);
    });
  });

  // ============= Urlaubskasse =============

  describe('calculateVacationAccount', () => {
    it('sollte Urlaubsanspruch berechnen', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 3500,
        region: 'west',
        tradeGroup: 'skilled',
        hoursWorked: 160,
        isWinterPeriod: false,
        vacationDaysTaken: 5,
        previousYearVacationDays: 10,
      };
      
      const result = calculateVacationAccount(params);
      
      expect(result.currentYearEntitlement).toBeGreaterThan(0);
      expect(result.remainingDays).toBeDefined();
      expect(result.monetaryValue).toBeGreaterThan(0);
    });

    it('sollte Verfallsdatum setzen', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 3500,
        region: 'west',
        tradeGroup: 'skilled',
        hoursWorked: 160,
        isWinterPeriod: false,
      };
      
      const result = calculateVacationAccount(params);
      
      expect(result.expirationDate).toBeInstanceOf(Date);
    });

    it('sollte genommene Urlaubstage abziehen', () => {
      const paramsWithoutVacation: ConstructionPayrollParams = {
        grossMonthly: 3500,
        region: 'west',
        tradeGroup: 'skilled',
        hoursWorked: 160,
        isWinterPeriod: false,
        vacationDaysTaken: 0,
      };
      
      const paramsWithVacation: ConstructionPayrollParams = {
        ...paramsWithoutVacation,
        vacationDaysTaken: 10,
      };
      
      const resultWithout = calculateVacationAccount(paramsWithoutVacation);
      const resultWith = calculateVacationAccount(paramsWithVacation);
      
      expect(resultWith.remainingDays).toBeLessThan(resultWithout.remainingDays);
    });
  });

  // ============= Tariflicher Stundenlohn =============

  describe('getTariffHourlyRate', () => {
    it('sollte höheren Stundenlohn für West zurückgeben', () => {
      const westRate = getTariffHourlyRate('west', 'skilled');
      const eastRate = getTariffHourlyRate('east', 'skilled');
      
      expect(westRate).toBeGreaterThan(eastRate);
    });

    it('sollte steigenden Stundenlohn nach Lohngruppe haben', () => {
      const workerRate = getTariffHourlyRate('west', 'worker');
      const skilledRate = getTariffHourlyRate('west', 'skilled');
      const foremanRate = getTariffHourlyRate('west', 'foreman');
      const masterRate = getTariffHourlyRate('west', 'master');
      
      expect(skilledRate).toBeGreaterThan(workerRate);
      expect(foremanRate).toBeGreaterThan(skilledRate);
      expect(masterRate).toBeGreaterThan(foremanRate);
    });
  });

  // ============= Gesamt-Berechnung =============

  describe('calculateConstructionPayroll', () => {
    it('sollte vollständige Baulohn-Abrechnung erstellen', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 3500,
        region: 'west',
        tradeGroup: 'skilled',
        hoursWorked: 168,
        isWinterPeriod: true,
        winterHours: 40,
        dirtyWorkHours: 20,
      };
      
      const result = calculateConstructionPayroll(params);
      
      expect(result.sokaEmployerContribution).toBeGreaterThan(0);
      expect(result.sokaEmployeeContribution).toBe(0);
      expect(result.winterAllowance).toBeGreaterThan(0);
      expect(result.dirtyWorkBonus).toBeGreaterThan(0);
      expect(result.totalGross).toBeGreaterThan(params.grossMonthly);
      expect(result.details.length).toBeGreaterThan(0);
    });

    it('sollte netAdditions korrekt berechnen', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 4000,
        region: 'east',
        tradeGroup: 'foreman',
        hoursWorked: 160,
        isWinterPeriod: false,
        heightWorkHours: 30,
      };
      
      const result = calculateConstructionPayroll(params);
      
      expect(result.netAdditions).toBe(result.totalBonuses + result.winterAllowance);
    });

    it('sollte Urlaubsansprüche enthalten', () => {
      const params: ConstructionPayrollParams = {
        grossMonthly: 3800,
        region: 'west',
        tradeGroup: 'skilled',
        hoursWorked: 160,
        isWinterPeriod: false,
      };
      
      const result = calculateConstructionPayroll(params);
      
      expect(result.vacationPayEntitlement).toBeGreaterThanOrEqual(0);
      expect(result.vacationBonusEntitlement).toBeGreaterThanOrEqual(0);
    });
  });
});
