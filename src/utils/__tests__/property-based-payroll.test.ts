/**
 * Property-Based Tests für Lohnabrechnungen
 * 
 * Phase 6.1: Property-Based Testing mit fast-check
 * 
 * Diese Tests generieren automatisch Hunderte von Testfällen mit zufälligen
 * Eingabewerten und validieren, dass mathematische Invarianten immer gelten.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateCompleteTax, calculateOvertimeAndBonuses, TaxCalculationParams } from '../tax-calculation';
import { calculateConstructionPayroll } from '../construction-payroll';
import { calculateGastronomyPayroll } from '../gastronomy-payroll';
import { calculateNursingPayroll, ShiftEntry } from '../nursing-payroll';
import { MINIJOB_2025, MIDIJOB_2025, BBG_2025_MONTHLY } from '@/constants/social-security';

// ============= Arbitraries (Zufallsgeneratoren) =============

/**
 * Generiert realistische Brutto-Monatsgehälter
 */
const grossMonthlyArbitrary = fc.double({ min: 500, max: 15000, noNaN: true })
  .map(v => Math.round(v * 100) / 100);

/**
 * Generiert realistische Jahresgehälter
 */
const grossYearlyArbitrary = fc.double({ min: 6000, max: 180000, noNaN: true })
  .map(v => Math.round(v * 100) / 100);

/**
 * Generiert gültige Steuerklassen
 */
const taxClassArbitrary = fc.constantFrom('1', '2', '3', '4', '5', '6');

/**
 * Generiert Kinderfreibeträge (0-10)
 */
const childAllowancesArbitrary = fc.integer({ min: 0, max: 10 });

/**
 * Generiert Alter (18-67)
 */
const ageArbitrary = fc.integer({ min: 18, max: 67 });

/**
 * Generiert realistische Stundenzahlen pro Monat
 */
const hoursArbitrary = fc.double({ min: 0, max: 250, noNaN: true })
  .map(v => Math.round(v * 10) / 10);

/**
 * Generiert vollständige TaxCalculationParams
 */
const taxParamsArbitrary: fc.Arbitrary<TaxCalculationParams> = fc.record({
  grossSalaryYearly: grossYearlyArbitrary,
  taxClass: taxClassArbitrary,
  childAllowances: childAllowancesArbitrary,
  churchTax: fc.boolean(),
  churchTaxRate: fc.constantFrom(8, 9),
  healthInsuranceRate: fc.double({ min: 0.9, max: 2.5, noNaN: true }),
  isEastGermany: fc.boolean(),
  isChildless: fc.boolean(),
  age: ageArbitrary,
});

// ============= Invarianten-Tests: Steuerberechnung =============

describe('Property-Based: Steuerberechnung Invarianten', () => {
  
  it('Netto ist immer positiv bei positivem Brutto', () => {
    fc.assert(
      fc.property(taxParamsArbitrary, (params) => {
        const result = calculateCompleteTax(params);
        return result.netYearly > 0 && result.netMonthly > 0;
      }),
      { numRuns: 200 }
    );
  });

  it('Netto ist immer kleiner als Brutto (außer Minijob)', () => {
    fc.assert(
      fc.property(taxParamsArbitrary, (params) => {
        // Minijobs ausnehmen, da dort Netto = Brutto sein kann
        if (params.grossSalaryYearly / 12 <= MINIJOB_2025.maxEarnings) {
          return true;
        }
        const result = calculateCompleteTax(params);
        return result.netYearly < result.grossYearly;
      }),
      { numRuns: 200 }
    );
  });

  it('Arbeitgeberkosten sind immer >= Brutto', () => {
    fc.assert(
      fc.property(taxParamsArbitrary, (params) => {
        const result = calculateCompleteTax(params);
        return result.employerCosts >= result.grossYearly;
      }),
      { numRuns: 200 }
    );
  });

  it('Summe aus Netto + Steuern + SV = Brutto', () => {
    fc.assert(
      fc.property(taxParamsArbitrary, (params) => {
        const result = calculateCompleteTax(params);
        const calculatedGross = result.netYearly + result.totalTaxes + result.totalSocialContributions;
        const diff = Math.abs(calculatedGross - result.grossYearly);
        return diff < 1; // 1€ Toleranz wegen Rundung
      }),
      { numRuns: 200 }
    );
  });

  it('Alle Einzelwerte sind nicht negativ', () => {
    fc.assert(
      fc.property(taxParamsArbitrary, (params) => {
        const result = calculateCompleteTax(params);
        return (
          result.incomeTax >= 0 &&
          result.solidarityTax >= 0 &&
          result.churchTax >= 0 &&
          result.pensionInsurance >= 0 &&
          result.healthInsurance >= 0 &&
          result.unemploymentInsurance >= 0 &&
          result.careInsurance >= 0
        );
      }),
      { numRuns: 200 }
    );
  });

  it('Kirchensteuer ist 0 wenn churchTax = false', () => {
    fc.assert(
      fc.property(
        taxParamsArbitrary.map(p => ({ ...p, churchTax: false })),
        (params) => {
          const result = calculateCompleteTax(params);
          return result.churchTax === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Höheres Brutto führt zu höherem Netto (monoton steigend)', () => {
    fc.assert(
      fc.property(
        taxParamsArbitrary,
        fc.double({ min: 100, max: 5000, noNaN: true }),
        (params, increase) => {
          const result1 = calculateCompleteTax(params);
          const result2 = calculateCompleteTax({
            ...params,
            grossSalaryYearly: params.grossSalaryYearly + increase,
          });
          // Netto sollte bei höherem Brutto nicht sinken
          return result2.netYearly >= result1.netYearly;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Steuerklasse III ist günstiger als Steuerklasse V (bei gleichem Brutto)', () => {
    fc.assert(
      fc.property(grossYearlyArbitrary, (grossYearly) => {
        const baseParams: Omit<TaxCalculationParams, 'taxClass'> = {
          grossSalaryYearly: grossYearly,
          childAllowances: 0,
          churchTax: false,
          churchTaxRate: 9,
          healthInsuranceRate: 1.7,
          isEastGermany: false,
          isChildless: false,
          age: 35,
        };

        const resultIII = calculateCompleteTax({ ...baseParams, taxClass: '3' });
        const resultV = calculateCompleteTax({ ...baseParams, taxClass: '5' });

        return resultIII.netYearly >= resultV.netYearly;
      }),
      { numRuns: 100 }
    );
  });
});

// ============= Invarianten-Tests: Überstunden =============

describe('Property-Based: Überstunden-Berechnung Invarianten', () => {
  
  const overtimeInputArbitrary = fc.record({
    regularHours: hoursArbitrary,
    overtimeHours: hoursArbitrary,
    nightHours: hoursArbitrary,
    sundayHours: hoursArbitrary,
    holidayHours: hoursArbitrary,
    hourlyRate: fc.double({ min: 10, max: 100, noNaN: true }),
  });

  it('Gesamtvergütung ist immer >= Basis-Regulärstunden', () => {
    fc.assert(
      fc.property(overtimeInputArbitrary, (input) => {
        const result = calculateOvertimeAndBonuses(input);
        const minExpected = input.regularHours * input.hourlyRate;
        return result.totalGrossPay >= minExpected - 0.01; // Rundungstoleranz
      }),
      { numRuns: 200 }
    );
  });

  it('Alle Bonus-Werte sind nicht negativ', () => {
    fc.assert(
      fc.property(overtimeInputArbitrary, (input) => {
        const result = calculateOvertimeAndBonuses(input);
        return (
          result.regularPay >= 0 &&
          result.overtimePay >= 0 &&
          result.nightBonus >= 0 &&
          result.sundayBonus >= 0 &&
          result.holidayBonus >= 0 &&
          result.totalBonuses >= 0
        );
      }),
      { numRuns: 200 }
    );
  });

  it('Feiertagszuschlag ist höher als Sonntagszuschlag', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 50, noNaN: true }),
        fc.double({ min: 15, max: 100, noNaN: true }),
        (hours, hourlyRate) => {
          const result = calculateOvertimeAndBonuses({
            regularHours: 0,
            overtimeHours: 0,
            nightHours: 0,
            sundayHours: hours,
            holidayHours: hours,
            hourlyRate,
          });
          // Bei gleichen Stunden: Feiertag (100%) > Sonntag (50%)
          return result.holidayBonus >= result.sundayBonus;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============= Invarianten-Tests: Branchen =============

describe('Property-Based: Baulohn Invarianten', () => {
  
  it('SOKA-BAU AG-Beiträge sind proportional zum Brutto', () => {
    fc.assert(
      fc.property(grossMonthlyArbitrary, (grossMonthly) => {
        const result = calculateConstructionPayroll({
          grossMonthly,
          hoursWorked: 173,
          region: 'west',
          tradeGroup: 'worker',
          isWinterPeriod: false,
        });
        
        // AG-SOKA-Beitrag sollte ~15.2% des Brutto sein
        const expectedSoka = grossMonthly * 0.152;
        const diff = Math.abs(result.sokaEmployerContribution - expectedSoka);
        return diff < grossMonthly * 0.01; // 1% Toleranz
      }),
      { numRuns: 100 }
    );
  });

  it('Wintergeld nur im Winterzeitraum', () => {
    fc.assert(
      fc.property(grossMonthlyArbitrary, (grossMonthly) => {
        const resultSummer = calculateConstructionPayroll({
          grossMonthly,
          hoursWorked: 173,
          region: 'west',
          tradeGroup: 'worker',
          isWinterPeriod: false,
        });
        
        const resultWinter = calculateConstructionPayroll({
          grossMonthly,
          hoursWorked: 173,
          region: 'west',
          tradeGroup: 'worker',
          isWinterPeriod: true,
          winterHours: 50,
        });
        
        // Winterzulagen sollten im Winter >= Sommer sein
        return resultWinter.winterAllowance >= resultSummer.winterAllowance;
      }),
      { numRuns: 50 }
    );
  });
});

describe('Property-Based: Gastronomie Invarianten', () => {
  
  it('Trinkgeld von Gästen ist immer steuerfrei', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true }),
        (tips) => {
          const result = calculateGastronomyPayroll({
            grossMonthly: 2500,
            hoursWorked: 173,
            breakfastsProvided: 0,
            lunchesProvided: 0,
            dinnersProvided: 0,
            monthlyTips: tips,
            tipsFromEmployer: false,
            nightHours: 0,
            sundayHours: 0,
            holidayHours: 0,
            isMinijob: false,
          });
          
          // Trinkgeld von Gästen = steuerfrei
          return result.tipsTaxFree === tips;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Sachbezugswerte sind pro Mahlzeit konstant', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 25 }),
        fc.integer({ min: 0, max: 25 }),
        fc.integer({ min: 0, max: 25 }),
        (breakfasts, lunches, dinners) => {
          const result = calculateGastronomyPayroll({
            grossMonthly: 2500,
            hoursWorked: 173,
            breakfastsProvided: breakfasts,
            lunchesProvided: lunches,
            dinnersProvided: dinners,
            monthlyTips: 0,
            tipsFromEmployer: false,
            nightHours: 0,
            sundayHours: 0,
            holidayHours: 0,
            isMinijob: false,
          });
          
          // Sachbezugswerte 2025: Frühstück 2,17€, Mittag/Abend 4,13€
          const expectedBreakfast = breakfasts * 2.17;
          const expectedMain = (lunches + dinners) * 4.13;
          const expectedTotal = expectedBreakfast + expectedMain;
          
          const diff = Math.abs(result.mealBenefitTotal - expectedTotal);
          return diff < 0.02; // Rundungstoleranz
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property-Based: Pflege Invarianten', () => {
  
  it('SFN-Zuschläge respektieren 50€/h Cap', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 40, max: 80, noNaN: true }), // Hohe Stundenlöhne
        fc.double({ min: 10, max: 50, noNaN: true }),
        (hourlyRate, nightHours) => {
          const shifts: ShiftEntry[] = [{
            date: new Date(),
            type: 'night',
            hours: 8,
            nightHours,
            sundayHours: 0,
            holidayHours: 0,
          }];
          
          const result = calculateNursingPayroll({
            grossMonthly: hourlyRate * 173,
            hoursWorked: 173,
            careLevel: 'nurse',
            shifts,
          });
          
          // Bei Stundenlohn > 50€ sollte der Bonus gedeckelt sein
          // 30% Nachtbonus auf max. 50€ = max. 15€ pro Nachtstunde
          const maxNightBonus = nightHours * 50 * 0.30;
          return result.nightBonus <= maxNightBonus + 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Steuerfreie Zuschläge <= Gesamtzuschläge', () => {
    fc.assert(
      fc.property(grossMonthlyArbitrary, (grossMonthly) => {
        const shifts: ShiftEntry[] = [{
          date: new Date(),
          type: 'night',
          hours: 8,
          nightHours: 20,
          sundayHours: 8,
          holidayHours: 4,
        }];
        
        const result = calculateNursingPayroll({
          grossMonthly,
          hoursWorked: 173,
          careLevel: 'nurse',
          shifts,
        });
        
        return result.taxFreeAmount <= result.totalSfnBonuses + result.onCallPay + 0.01;
      }),
      { numRuns: 100 }
    );
  });
});

// ============= Grenzwert-Tests =============

describe('Property-Based: Grenzwerte', () => {
  
  it('Minijob-Grenze wird korrekt erkannt', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 550, max: 560, noNaN: true }),
        (grossMonthly) => {
          const result = calculateCompleteTax({
            grossSalaryYearly: grossMonthly * 12,
            taxClass: '1',
            childAllowances: 0,
            churchTax: false,
            churchTaxRate: 9,
            healthInsuranceRate: 1.7,
            isEastGermany: false,
            isChildless: true,
            age: 25,
            employmentType: grossMonthly <= MINIJOB_2025.maxEarnings ? 'minijob' : 'midijob',
          });
          
          if (grossMonthly <= MINIJOB_2025.maxEarnings) {
            // Minijob: Keine SV-Beiträge für AN
            return result.totalSocialContributions === 0;
          } else {
            // Midijob: Hat SV-Beiträge
            return result.totalSocialContributions > 0;
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('BBG-Kappung wirkt bei hohen Gehältern', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 8000, max: 20000, noNaN: true }),
        (grossMonthly) => {
          const result = calculateCompleteTax({
            grossSalaryYearly: grossMonthly * 12,
            taxClass: '1',
            childAllowances: 0,
            churchTax: false,
            churchTaxRate: 9,
            healthInsuranceRate: 1.7,
            isEastGermany: false,
            isChildless: false,
            age: 40,
          });
          
          // RV-Beitrag sollte auf BBG gedeckelt sein
          // Max: 7.550€ * 9,3% = 702,15€ pro Monat
          const maxPensionMonthly = BBG_2025_MONTHLY.pensionWest * 0.093;
          return result.pensionInsurance / 12 <= maxPensionMonthly + 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });
});
