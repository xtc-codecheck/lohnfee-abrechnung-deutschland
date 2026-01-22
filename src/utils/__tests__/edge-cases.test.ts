/**
 * Edge-Case Tests für Lohnabrechnung
 * 
 * Testet kritische Grenzwerte und Sonderfälle:
 * - Minijob-Grenzen (556€)
 * - Midijob-Übergangsbereich (556,01€ - 2.000€)
 * - Negative Werte und Nullwerte
 * - Beitragsbemessungsgrenzen
 * - Extreme Werte
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCompleteTax,
  calculateIncomeTax,
  calculateSolidarityTax,
  calculateChurchTax,
  calculateTaxableIncome,
  calculateOvertimeAndBonuses,
} from '../tax-calculation';
import {
  calculateConstructionPayroll,
  calculateSokaContributions,
  calculateWinterAllowances,
  calculateConstructionBonuses,
  ConstructionPayrollParams,
} from '../construction-payroll';
import {
  calculateGastronomyPayroll,
  calculateMealBenefits,
  calculateTipsTreatment,
  calculateMinijobGastronomy,
  GastronomyPayrollParams,
} from '../gastronomy-payroll';
import {
  calculateNursingPayroll,
  calculateSfnBonuses,
  calculateOnCallPay,
  NursingPayrollParams,
} from '../nursing-payroll';
import {
  BBG_2025_YEARLY,
  MINIJOB_2025,
  MIDIJOB_2025,
} from '@/constants/social-security';

// ============= MINIJOB GRENZWERTE (556€) =============

describe('Minijob Edge Cases (556€ Grenze)', () => {
  const baseParams = {
    taxClass: '1',
    childAllowances: 0,
    churchTax: false,
    churchTaxRate: 0,
    healthInsuranceRate: 1.7,
    isEastGermany: false,
    isChildless: true,
    age: 30,
    employmentType: 'minijob' as const,
  };

  it('sollte exakt 556€ als Minijob behandeln', () => {
    const result = calculateCompleteTax({
      ...baseParams,
      grossSalaryYearly: 556 * 12,
    });

    expect(result.netMonthly).toBe(556);
    expect(result.pensionInsurance).toBe(0);
    expect(result.healthInsurance).toBe(0);
  });

  it('sollte 556,01€ NICHT als Minijob behandeln', () => {
    const result = calculateCompleteTax({
      ...baseParams,
      grossSalaryYearly: 556.01 * 12,
      employmentType: 'midijob',
    });

    // Midijob hat reduzierte, aber vorhandene SV-Beiträge
    expect(result.pensionInsurance).toBeGreaterThan(0);
    expect(result.netMonthly).toBeLessThan(556.01);
  });

  it('sollte 0€ korrekt verarbeiten', () => {
    const result = calculateCompleteTax({
      ...baseParams,
      grossSalaryYearly: 0,
    });

    expect(result.netMonthly).toBe(0);
    expect(result.totalDeductions).toBe(0);
  });

  it('sollte Minijob-Grenze als Konstante haben', () => {
    expect(MINIJOB_2025.maxEarnings).toBe(556);
    expect(MINIJOB_2025.taxRate).toBe(0.02);
  });

  describe('Gastro Minijob-Prüfung', () => {
    it('sollte unter Grenze bleiben (exakt 556€)', () => {
      const result = calculateMinijobGastronomy(46, 12, 0);
      // 46h * 12€ = 552€ < 556€
      expect(result.isOverLimit).toBe(false);
      expect(result.remainingMinijobLimit).toBeGreaterThan(0);
    });

    it('sollte Überschreitung erkennen (556,01€+)', () => {
      const result = calculateMinijobGastronomy(47, 12, 0);
      // 47h * 12€ = 564€ > 556€
      expect(result.isOverLimit).toBe(true);
    });

    it('sollte Sachbezüge einrechnen', () => {
      // 40h * 12€ = 480€ + Mahlzeiten
      const result = calculateMinijobGastronomy(40, 12, 20);
      // 20 Mahlzeiten à ~4,13€ = 82,60€
      // Gesamt: 480 + 82,60 = 562,60€ > 556€
      expect(result.totalBenefit).toBeGreaterThan(556);
      expect(result.isOverLimit).toBe(true);
    });
  });
});

// ============= MIDIJOB ÜBERGANGSBEREICH (556,01€ - 2.000€) =============

describe('Midijob Edge Cases (Übergangsbereich)', () => {
  const baseParams = {
    taxClass: '1',
    childAllowances: 0,
    churchTax: false,
    churchTaxRate: 0,
    healthInsuranceRate: 1.7,
    isEastGermany: false,
    isChildless: true,
    age: 30,
    employmentType: 'midijob' as const,
  };

  it('sollte Midijob-Grenzen als Konstanten haben', () => {
    expect(MIDIJOB_2025.minEarnings).toBe(556.01);
    expect(MIDIJOB_2025.maxEarnings).toBe(2000);
    expect(MIDIJOB_2025.factor).toBeCloseTo(0.6683, 4);
  });

  it('sollte untere Grenze (556,01€) korrekt berechnen', () => {
    const result = calculateCompleteTax({
      ...baseParams,
      grossSalaryYearly: 556.01 * 12,
    });

    expect(result.grossMonthly).toBeCloseTo(556.01, 2);
    expect(result.totalSocialContributions).toBeGreaterThan(0);
    // Reduzierte Beiträge im Vergleich zu Normalberechnung
    expect(result.netMonthly).toBeGreaterThan(0);
  });

  it('sollte obere Grenze (2.000€) korrekt berechnen', () => {
    const result = calculateCompleteTax({
      ...baseParams,
      grossSalaryYearly: 2000 * 12,
    });

    expect(result.grossMonthly).toBe(2000);
    expect(result.totalSocialContributions).toBeGreaterThan(0);
  });

  it('sollte Mitte des Übergangsbereichs (1.278€) korrekt berechnen', () => {
    const midpoint = (556.01 + 2000) / 2;
    const result = calculateCompleteTax({
      ...baseParams,
      grossSalaryYearly: midpoint * 12,
    });

    expect(result.netMonthly).toBeGreaterThan(0);
    expect(result.netMonthly).toBeLessThan(midpoint);
  });

  it('sollte über 2.000€ als normale Beschäftigung behandeln', () => {
    const result = calculateCompleteTax({
      ...baseParams,
      grossSalaryYearly: 2001 * 12,
      employmentType: 'fulltime',
    });

    // Normale SV-Beiträge
    expect(result.pensionInsurance).toBeGreaterThan(0);
    expect(result.healthInsurance).toBeGreaterThan(0);
  });
});

// ============= NEGATIVE WERTE UND NULLWERTE =============

describe('Negative Werte und Nullwerte', () => {
  describe('Steuerberechnung', () => {
    it('sollte 0 bei negativem Einkommen zurückgeben', () => {
      const tax = calculateIncomeTax(-1000, 1);
      expect(tax).toBe(0);
    });

    it('sollte 0 bei Einkommen von 0 zurückgeben', () => {
      const tax = calculateIncomeTax(0, 1);
      expect(tax).toBe(0);
    });

    it('sollte Soli bei negativer Steuer ablehnen', () => {
      const soli = calculateSolidarityTax(-100);
      expect(soli).toBe(0);
    });

    it('sollte Kirchensteuer bei negativer Steuer ablehnen', () => {
      const churchTax = calculateChurchTax(-100, 9);
      expect(churchTax).toBe(0);
    });

    it('sollte zu versteuerndes Einkommen nicht negativ werden lassen', () => {
      const taxableIncome = calculateTaxableIncome(1000, 10, 50000);
      expect(taxableIncome).toBe(0);
    });
  });

  describe('Überstunden-Berechnung', () => {
    it('sollte 0 Stunden korrekt verarbeiten', () => {
      const result = calculateOvertimeAndBonuses({
        regularHours: 0,
        overtimeHours: 0,
        nightHours: 0,
        sundayHours: 0,
        holidayHours: 0,
        hourlyRate: 20,
      });

      expect(result.regularPay).toBe(0);
      expect(result.totalGrossPay).toBe(0);
    });

    it('sollte 0€ Stundenlohn korrekt verarbeiten', () => {
      const result = calculateOvertimeAndBonuses({
        regularHours: 160,
        overtimeHours: 10,
        nightHours: 8,
        sundayHours: 4,
        holidayHours: 2,
        hourlyRate: 0,
      });

      expect(result.regularPay).toBe(0);
      expect(result.totalGrossPay).toBe(0);
    });
  });

  describe('Baulohn', () => {
    it('sollte 0 Stunden korrekt verarbeiten', () => {
      const result = calculateConstructionBonuses({
        grossMonthly: 3500,
        region: 'west',
        tradeGroup: 'skilled',
        hoursWorked: 0,
        isWinterPeriod: false,
      });

      expect(result.total).toBe(0);
    });

    it('sollte 0€ Brutto ablehnen', () => {
      const result = calculateSokaContributions(0, 'west');
      expect(result.employer).toBe(0);
    });

    it('sollte Wintergeld bei 0 Stunden = 0 sein', () => {
      const result = calculateWinterAllowances(0, true);
      expect(result.allowance).toBe(0);
    });
  });

  describe('Gastronomie', () => {
    it('sollte 0 Mahlzeiten korrekt verarbeiten', () => {
      const result = calculateMealBenefits(0, 0, 0);
      expect(result.total).toBe(0);
    });

    it('sollte 0€ Trinkgeld korrekt verarbeiten', () => {
      const result = calculateTipsTreatment(0, false);
      expect(result.taxFree).toBe(0);
      expect(result.taxable).toBe(0);
    });
  });

  describe('Pflege', () => {
    it('sollte 0 Stunden korrekt verarbeiten', () => {
      const result = calculateSfnBonuses(20, 0, 0, 0, 0);
      expect(result.total).toBe(0);
    });

    it('sollte 0€ Stundenlohn korrekt verarbeiten', () => {
      const result = calculateSfnBonuses(0, 40, 8, 4, 0);
      expect(result.total).toBe(0);
    });

    it('sollte 0 Bereitschaftsstunden korrekt verarbeiten', () => {
      const result = calculateOnCallPay(20, 0);
      expect(result.amount).toBe(0);
    });
  });
});

// ============= BEITRAGSBEMESSUNGSGRENZEN =============

describe('Beitragsbemessungsgrenzen (BBG)', () => {
  it('sollte BBG 2025 Werte haben', () => {
    expect(BBG_2025_YEARLY.pensionWest).toBe(90600);
    expect(BBG_2025_YEARLY.pensionEast).toBe(89400);
    expect(BBG_2025_YEARLY.healthCare).toBe(62100);
  });

  it('sollte Gehalt über BBG kappen', () => {
    const highSalary = 120000; // Über BBG
    const atBBG = BBG_2025_YEARLY.pensionWest;

    const resultHigh = calculateCompleteTax({
      grossSalaryYearly: highSalary,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 0,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 30,
    });

    const resultBBG = calculateCompleteTax({
      grossSalaryYearly: atBBG,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 0,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 30,
    });

    // Rentenversicherungsbeiträge sollten gleich sein (beide gekappt)
    expect(resultHigh.pensionInsurance).toBeCloseTo(resultBBG.pensionInsurance, 0);
  });

  it('sollte unterschiedliche BBG für Ost/West anwenden', () => {
    const salary = 95000;

    const westResult = calculateCompleteTax({
      grossSalaryYearly: salary,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 0,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 30,
    });

    const eastResult = calculateCompleteTax({
      grossSalaryYearly: salary,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 0,
      healthInsuranceRate: 1.7,
      isEastGermany: true,
      isChildless: true,
      age: 30,
    });

    // Ost hat niedrigere BBG, daher leicht niedrigere RV-Beiträge
    expect(eastResult.pensionInsurance).toBeLessThanOrEqual(westResult.pensionInsurance);
  });
});

// ============= EXTREME WERTE =============

describe('Extreme Werte', () => {
  it('sollte sehr hohe Gehälter (1.000.000€) verarbeiten', () => {
    const result = calculateCompleteTax({
      grossSalaryYearly: 1000000,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 0,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 30,
    });

    expect(result.netYearly).toBeGreaterThan(0);
    expect(result.netYearly).toBeLessThan(1000000);
    expect(result.incomeTax).toBeGreaterThan(0);
  });

  it('sollte sehr niedrige Gehälter (1€) verarbeiten', () => {
    const result = calculateCompleteTax({
      grossSalaryYearly: 12, // 1€/Monat
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 0,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 30,
    });

    expect(result.grossMonthly).toBe(1);
    expect(result.netMonthly).toBeGreaterThanOrEqual(0);
  });

  it('sollte sehr viele Kinderfreibeträge (10) verarbeiten', () => {
    const result = calculateCompleteTax({
      grossSalaryYearly: 60000,
      taxClass: '3',
      childAllowances: 10,
      churchTax: false,
      churchTaxRate: 0,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: false,
      age: 35,
    });

    expect(result.netYearly).toBeGreaterThan(0);
    expect(result.taxableIncome).toBe(0); // Stark reduziert durch Kinderfreibeträge
  });

  it('sollte maximalen Stundenlohn für SFN-Zuschläge (50€) anwenden', () => {
    const resultHigh = calculateSfnBonuses(100, 10, 8, 4, 0);
    const resultAt50 = calculateSfnBonuses(50, 10, 8, 4, 0);

    // Bei 100€/h wird auf 50€/h gekappt
    expect(resultHigh.night).toBe(resultAt50.night);
    expect(resultHigh.sunday).toBe(resultAt50.sunday);
  });
});

// ============= STEUERKLASSEN =============

describe('Steuerklassen Edge Cases', () => {
  const baseParams = {
    grossSalaryYearly: 48000,
    childAllowances: 0,
    churchTax: false,
    churchTaxRate: 0,
    healthInsuranceRate: 1.7,
    isEastGermany: false,
    isChildless: true,
    age: 30,
  };

  it('sollte alle Steuerklassen (1-6) akzeptieren', () => {
    const taxClasses = ['1', '2', '3', '4', '5', '6'];

    taxClasses.forEach(taxClass => {
      const result = calculateCompleteTax({ ...baseParams, taxClass });
      expect(result.netYearly).toBeGreaterThan(0);
    });
  });

  it('sollte Steuerklasse 3 niedrigste Steuer haben', () => {
    const results = ['1', '3', '5'].map(taxClass => ({
      taxClass,
      result: calculateCompleteTax({ ...baseParams, taxClass }),
    }));

    const class3 = results.find(r => r.taxClass === '3')!.result;
    const class1 = results.find(r => r.taxClass === '1')!.result;
    const class5 = results.find(r => r.taxClass === '5')!.result;

    expect(class3.incomeTax).toBeLessThan(class1.incomeTax);
    expect(class5.incomeTax).toBeGreaterThan(class1.incomeTax);
  });

  it('sollte Steuerklasse 6 höchste Steuer haben', () => {
    const results = ['1', '6'].map(taxClass => ({
      taxClass,
      result: calculateCompleteTax({ ...baseParams, taxClass }),
    }));

    const class1 = results.find(r => r.taxClass === '1')!.result;
    const class6 = results.find(r => r.taxClass === '6')!.result;

    expect(class6.incomeTax).toBeGreaterThan(class1.incomeTax);
  });
});

// ============= PFLEGEVERSICHERUNG =============

describe('Pflegeversicherung Edge Cases', () => {
  const baseParams = {
    grossSalaryYearly: 48000,
    taxClass: '1',
    childAllowances: 0,
    churchTax: false,
    churchTaxRate: 0,
    healthInsuranceRate: 1.7,
    isEastGermany: false,
  };

  it('sollte höheren Beitrag für Kinderlose über 23 berechnen', () => {
    const withChildren = calculateCompleteTax({
      ...baseParams,
      isChildless: false,
      age: 30,
    });

    const childlessOver23 = calculateCompleteTax({
      ...baseParams,
      isChildless: true,
      age: 30,
    });

    expect(childlessOver23.careInsurance).toBeGreaterThan(withChildren.careInsurance);
  });

  it('sollte normalen Beitrag für Kinderlose unter 23 berechnen', () => {
    const childlessUnder23 = calculateCompleteTax({
      ...baseParams,
      isChildless: true,
      age: 22,
    });

    const withChildren = calculateCompleteTax({
      ...baseParams,
      isChildless: false,
      age: 30,
    });

    expect(childlessUnder23.careInsurance).toBe(withChildren.careInsurance);
  });

  it('sollte Grenzalter 23 korrekt anwenden', () => {
    const age22 = calculateCompleteTax({
      ...baseParams,
      isChildless: true,
      age: 22,
    });

    const age23 = calculateCompleteTax({
      ...baseParams,
      isChildless: true,
      age: 23,
    });

    expect(age23.careInsurance).toBeGreaterThan(age22.careInsurance);
  });
});

// ============= BAULOHN SPEZIFISCHE EDGE CASES =============

describe('Baulohn Edge Cases', () => {
  it('sollte SOKA-BAU 15,20% korrekt berechnen', () => {
    const result = calculateSokaContributions(10000, 'west');
    expect(result.employer).toBeCloseTo(1520, 0);
    expect(result.employee).toBe(0);
  });

  it('sollte Wintergeld nur in Winterperiode gewähren', () => {
    const winter = calculateWinterAllowances(100, true);
    const summer = calculateWinterAllowances(100, false);

    expect(winter.allowance).toBe(100); // 100h * 1€
    expect(summer.allowance).toBe(0);
  });

  it('sollte alle Zulagen kumulativ berechnen', () => {
    const params: ConstructionPayrollParams = {
      grossMonthly: 4000,
      region: 'west',
      tradeGroup: 'skilled',
      hoursWorked: 168,
      isWinterPeriod: true,
      winterHours: 40,
      dirtyWorkHours: 20,
      heightWorkHours: 10,
      dangerWorkHours: 5,
    };

    const result = calculateConstructionPayroll(params);

    expect(result.winterAllowance).toBeGreaterThan(0);
    expect(result.dirtyWorkBonus).toBeGreaterThan(0);
    expect(result.heightWorkBonus).toBeGreaterThan(0);
    expect(result.dangerWorkBonus).toBeGreaterThan(0);
    expect(result.totalGross).toBeGreaterThan(params.grossMonthly);
  });
});

// ============= GASTRONOMIE SPEZIFISCHE EDGE CASES =============

describe('Gastronomie Edge Cases', () => {
  it('sollte Sachbezugswerte 2025 korrekt anwenden', () => {
    const result = calculateMealBenefits(1, 1, 1);
    // Frühstück: 2,17€, Mittag: 4,13€, Abend: 4,13€
    expect(result.breakfast.value).toBeCloseTo(2.17, 2);
    expect(result.lunch.value).toBeCloseTo(4.13, 2);
    expect(result.dinner.value).toBeCloseTo(4.13, 2);
  });

  it('sollte Trinkgeld vom Gast als steuerfrei behandeln', () => {
    const fromGuest = calculateTipsTreatment(500, false);
    expect(fromGuest.taxFree).toBe(500);
    expect(fromGuest.taxable).toBe(0);
  });

  it('sollte Trinkgeld vom AG als steuerpflichtig behandeln', () => {
    const fromEmployer = calculateTipsTreatment(500, true);
    expect(fromEmployer.taxFree).toBe(0);
    expect(fromEmployer.taxable).toBe(500);
  });

  it('sollte Vollständige Gastro-Abrechnung berechnen', () => {
    const params: GastronomyPayrollParams = {
      grossMonthly: 2500,
      hoursWorked: 160,
      breakfastsProvided: 20,
      lunchesProvided: 20,
      dinnersProvided: 20,
      monthlyTips: 300,
      tipsFromEmployer: false,
      nightHours: 40,
      sundayHours: 16,
      holidayHours: 8,
      isMinijob: false,
    };

    const result = calculateGastronomyPayroll(params);

    expect(result.mealBenefitTotal).toBeGreaterThan(0);
    expect(result.tipsTaxFree).toBe(300);
    expect(result.nightBonus).toBeGreaterThan(0);
    expect(result.sundayBonus).toBeGreaterThan(0);
    expect(result.holidayBonus).toBeGreaterThan(0);
    expect(result.totalGross).toBeGreaterThan(params.grossMonthly);
  });
});

// ============= PFLEGE SPEZIFISCHE EDGE CASES =============

describe('Pflege Edge Cases', () => {
  it('sollte 50€/h Cap für SFN-Zuschläge anwenden', () => {
    const under50 = calculateSfnBonuses(40, 10, 0, 0, 0);
    const over50 = calculateSfnBonuses(60, 10, 0, 0, 0);
    const at50 = calculateSfnBonuses(50, 10, 0, 0, 0);

    // Alle sollten auf Basis von max. 50€/h berechnet werden
    expect(over50.night).toBe(at50.night);
    expect(under50.night).toBeLessThan(at50.night);
  });

  it('sollte Weihnachtszuschlag (150%) höher als Feiertagszuschlag (125%) sein', () => {
    const result = calculateSfnBonuses(20, 0, 0, 8, 8);
    expect(result.christmas).toBeGreaterThan(result.holiday);
  });

  it('sollte Bereitschaftsdienst mit 25% vergüten', () => {
    const result = calculateOnCallPay(20, 100, 25);
    expect(result.amount).toBe(500); // 100h * 20€ * 25%
    expect(result.effectiveHourlyRate).toBe(5); // 20€ * 25%
  });

  it('sollte vollständige Pflege-Abrechnung berechnen', () => {
    const params: NursingPayrollParams = {
      grossMonthly: 3500,
      hoursWorked: 168,
      careLevel: 'nurse',
      shifts: [
        { date: new Date(), type: 'night', hours: 10, nightHours: 10, sundayHours: 0, holidayHours: 0 },
        { date: new Date(), type: 'night', hours: 10, nightHours: 10, sundayHours: 8, holidayHours: 0 },
      ],
      onCallHours: 20,
    };

    const result = calculateNursingPayroll(params);

    expect(result.totalSfnBonuses).toBeGreaterThan(0);
    expect(result.shiftAllowance).toBeGreaterThan(0);
    expect(result.onCallPay).toBeGreaterThan(0);
    expect(result.taxFreeAmount).toBeGreaterThan(0);
    expect(result.totalGross).toBeGreaterThan(params.grossMonthly);
  });
});
