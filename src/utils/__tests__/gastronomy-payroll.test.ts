import { describe, it, expect } from 'vitest';
import {
  calculateGastronomyPayroll,
  calculateMealBenefits,
  calculateTipsTreatment,
  calculateSfnBonuses,
  calculateMinijobGastronomy,
  GastronomyPayrollParams,
} from '../gastronomy-payroll';

describe('Gastronomie-Berechnungen (Gastronomy Payroll)', () => {
  
  // ============= Sachbezug Mahlzeiten =============
  
  describe('calculateMealBenefits', () => {
    it('sollte Frühstück mit 2,17€ bewerten', () => {
      const result = calculateMealBenefits(10, 0, 0);
      
      expect(result.breakfast.count).toBe(10);
      expect(result.breakfast.value).toBeCloseTo(21.70, 2);
      expect(result.total).toBeCloseTo(21.70, 2);
    });

    it('sollte Mittag-/Abendessen mit 4,13€ bewerten', () => {
      const result = calculateMealBenefits(0, 15, 10);
      
      expect(result.lunch.count).toBe(15);
      expect(result.lunch.value).toBeCloseTo(61.95, 2); // 15 * 4,13
      expect(result.dinner.count).toBe(10);
      expect(result.dinner.value).toBeCloseTo(41.30, 2); // 10 * 4,13
    });

    it('sollte Gesamt aller Mahlzeiten korrekt summieren', () => {
      const result = calculateMealBenefits(5, 20, 20);
      
      const expectedTotal = (5 * 2.17) + (20 * 4.13) + (20 * 4.13);
      expect(result.total).toBeCloseTo(expectedTotal, 2);
    });

    it('sollte 0 bei keinen Mahlzeiten zurückgeben', () => {
      const result = calculateMealBenefits(0, 0, 0);
      
      expect(result.total).toBe(0);
    });
  });

  // ============= Trinkgeld-Behandlung =============

  describe('calculateTipsTreatment', () => {
    it('sollte Trinkgeld von Gästen als steuerfrei behandeln', () => {
      const result = calculateTipsTreatment(500, false);
      
      expect(result.taxFree).toBe(500);
      expect(result.taxable).toBe(0);
    });

    it('sollte Trinkgeld vom Arbeitgeber als steuerpflichtig behandeln', () => {
      const result = calculateTipsTreatment(300, true);
      
      expect(result.taxFree).toBe(0);
      expect(result.taxable).toBe(300);
    });

    it('sollte Details-Array mit Erklärungen enthalten', () => {
      const result = calculateTipsTreatment(200, false);
      
      expect(result.details).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
    });

    it('sollte 0 bei keinem Trinkgeld zurückgeben', () => {
      const result = calculateTipsTreatment(0, false);
      
      expect(result.taxFree).toBe(0);
      expect(result.taxable).toBe(0);
    });
  });

  // ============= SFN-Zuschläge =============

  describe('calculateSfnBonuses (Gastro)', () => {
    it('sollte Nachtzuschlag berechnen (25%)', () => {
      const hourlyRate = 15;
      const result = calculateSfnBonuses(hourlyRate, 20, 0, 0);
      
      expect(result.night).toBeCloseTo(20 * hourlyRate * 0.25, 2);
    });

    it('sollte Sonntagszuschlag berechnen (50%)', () => {
      const hourlyRate = 14;
      const result = calculateSfnBonuses(hourlyRate, 0, 8, 0);
      
      expect(result.sunday).toBeCloseTo(8 * hourlyRate * 0.50, 2);
    });

    it('sollte Feiertagszuschlag berechnen (125%)', () => {
      const hourlyRate = 16;
      const result = calculateSfnBonuses(hourlyRate, 0, 0, 10);
      
      expect(result.holiday).toBeCloseTo(10 * hourlyRate * 1.25, 2);
    });

    it('sollte Gesamt und steuerfreien Anteil berechnen', () => {
      const hourlyRate = 15;
      const result = calculateSfnBonuses(hourlyRate, 10, 8, 4);
      
      expect(result.total).toBe(result.night + result.sunday + result.holiday);
      expect(result.taxFree).toBeGreaterThan(0);
    });

    it('sollte 50€/h Cap für SFN-Zuschläge berücksichtigen', () => {
      const highHourlyRate = 60; // Über 50€-Grenze
      const result = calculateSfnBonuses(highHourlyRate, 10, 0, 0);
      
      // Zuschlag sollte auf Basis von max. 50€/h berechnet werden
      const expectedMax = 10 * 50 * 0.25;
      expect(result.night).toBeLessThanOrEqual(expectedMax);
    });
  });

  // ============= Minijob-Prüfung =============

  describe('calculateMinijobGastronomy', () => {
    it('sollte unter Minijob-Grenze korrekt berechnen', () => {
      const result = calculateMinijobGastronomy(40, 12, 10);
      
      expect(result.grossWage).toBe(480); // 40h * 12€
      expect(result.mealBenefit).toBeGreaterThan(0);
      expect(result.isOverLimit).toBe(false);
    });

    it('sollte Überschreitung der Minijob-Grenze erkennen', () => {
      const result = calculateMinijobGastronomy(50, 12, 20);
      
      // 50h * 12€ = 600€ + Mahlzeiten > 556€
      expect(result.isOverLimit).toBe(true);
    });

    it('sollte verbleibenden Minijob-Spielraum anzeigen', () => {
      const result = calculateMinijobGastronomy(30, 10, 5);
      
      expect(result.remainingMinijobLimit).toBeDefined();
      expect(result.totalBenefit).toBe(result.grossWage + result.mealBenefit);
    });

    it('sollte Details-Array mit Warnungen enthalten', () => {
      const result = calculateMinijobGastronomy(45, 13, 15);
      
      expect(result.details).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
    });
  });

  // ============= Gesamt-Berechnung =============

  describe('calculateGastronomyPayroll', () => {
    it('sollte vollständige Gastro-Abrechnung erstellen', () => {
      const params: GastronomyPayrollParams = {
        grossMonthly: 2500,
        hoursWorked: 160,
        breakfastsProvided: 10,
        lunchesProvided: 20,
        dinnersProvided: 15,
        monthlyTips: 400,
        tipsFromEmployer: false,
        nightHours: 20,
        sundayHours: 8,
        holidayHours: 0,
        isMinijob: false,
      };
      
      const result = calculateGastronomyPayroll(params);
      
      expect(result.baseGross).toBe(2500);
      expect(result.hourlyRate).toBeCloseTo(2500 / 160, 2);
      expect(result.mealBenefitTotal).toBeGreaterThan(0);
      expect(result.tipsTaxFree).toBe(400);
      expect(result.tipsTaxable).toBe(0);
      expect(result.nightBonus).toBeGreaterThan(0);
      expect(result.sundayBonus).toBeGreaterThan(0);
      expect(result.totalGross).toBeGreaterThan(params.grossMonthly);
    });

    it('sollte steuerpflichtiges vs steuerfreies Einkommen trennen', () => {
      const params: GastronomyPayrollParams = {
        grossMonthly: 3000,
        hoursWorked: 170,
        breakfastsProvided: 0,
        lunchesProvided: 0,
        dinnersProvided: 0,
        monthlyTips: 500,
        tipsFromEmployer: false,
        nightHours: 30,
        sundayHours: 16,
        holidayHours: 8,
        isMinijob: false,
      };
      
      const result = calculateGastronomyPayroll(params);
      
      expect(result.taxableIncome).toBeDefined();
      expect(result.taxFreeIncome).toBeDefined();
      expect(result.taxFreeIncome).toBeGreaterThan(0); // Trinkgeld + SFN
    });

    it('sollte Midijob-Status berücksichtigen', () => {
      const params: GastronomyPayrollParams = {
        grossMonthly: 1200,
        hoursWorked: 80,
        breakfastsProvided: 5,
        lunchesProvided: 10,
        dinnersProvided: 10,
        monthlyTips: 200,
        tipsFromEmployer: false,
        nightHours: 10,
        sundayHours: 4,
        holidayHours: 0,
        isMinijob: false,
        isMidijob: true,
      };
      
      const result = calculateGastronomyPayroll(params);
      
      expect(result.totalGross).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
    });

    it('sollte Trinkgeld vom AG als steuerpflichtig behandeln', () => {
      const paramsFromGuests: GastronomyPayrollParams = {
        grossMonthly: 2000,
        hoursWorked: 120,
        breakfastsProvided: 0,
        lunchesProvided: 0,
        dinnersProvided: 0,
        monthlyTips: 300,
        tipsFromEmployer: false,
        nightHours: 0,
        sundayHours: 0,
        holidayHours: 0,
        isMinijob: false,
      };
      
      const paramsFromEmployer: GastronomyPayrollParams = {
        ...paramsFromGuests,
        tipsFromEmployer: true,
      };
      
      const resultGuests = calculateGastronomyPayroll(paramsFromGuests);
      const resultEmployer = calculateGastronomyPayroll(paramsFromEmployer);
      
      expect(resultGuests.tipsTaxFree).toBe(300);
      expect(resultGuests.tipsTaxable).toBe(0);
      expect(resultEmployer.tipsTaxFree).toBe(0);
      expect(resultEmployer.tipsTaxable).toBe(300);
    });
  });
});
