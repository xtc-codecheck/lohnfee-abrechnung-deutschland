// Berechnungslogik für spezielle Lohnarten

import { differenceInDays, differenceInCalendarDays, startOfDay, endOfDay } from 'date-fns';
import { Employee } from '@/types/employee';
import { SickPayCalculation, MaternityBenefits, ShortTimeWork, SICK_PAY_RATES, MATERNITY_RATES, SHORT_TIME_WORK_RATES } from '@/types/special-payments';
import { calculateCompleteTax } from './tax-calculation';

export interface SickPayParams {
  employee: Employee;
  startDate: Date;
  endDate: Date;
  grossSalary: number;
}

export interface MaternityParams {
  employee: Employee;
  startDate: Date;
  endDate: Date;
  grossSalary: number;
  type: 'maternity-protection' | 'parental-leave';
}

export interface ShortTimeWorkParams {
  employee: Employee;
  startDate: Date;
  endDate: Date;
  originalHours: number;
  reducedHours: number;
  grossSalary: number;
  hasChildren: boolean;
}

/**
 * Berechnet Krankengeld (70% Brutto, max. 90% Netto)
 */
export function calculateSickPay(params: SickPayParams): SickPayCalculation {
  const { employee, startDate, endDate, grossSalary } = params;
  
  // Tägliches Bruttogehalt (Monat / 30 Tage)
  const dailyGrossSalary = grossSalary / 30;
  
  // Berechne Nettogehalt für 90%-Grenze
  const taxResult = calculateCompleteTax({
    grossSalaryYearly: grossSalary * 12,
    taxClass: employee.personalData.taxClass,
    childAllowances: employee.personalData.childAllowances || 0,
    churchTax: employee.personalData.churchTax,
    churchTaxRate: employee.personalData.churchTax ? 9 : 0,
    healthInsuranceRate: 2.45, // Standard TK-Satz
    isEastGermany: false,
    isChildless: (employee.personalData.childAllowances || 0) === 0,
    age: 30, // Vereinfacht
  });
  
  const dailyNetSalary = taxResult.netMonthly / 30;
  
  // Krankengeld: 70% vom Brutto, aber max. 90% vom Netto
  const sickPayFromGross = dailyGrossSalary * SICK_PAY_RATES.percentage;
  const maxSickPayFromNet = dailyNetSalary * SICK_PAY_RATES.maxPercentageOfNet;
  const sickPayPerDay = Math.min(sickPayFromGross, maxSickPayFromNet);
  
  // Anzahl Krankheitstage
  const daysOfSickness = differenceInCalendarDays(endOfDay(endDate), startOfDay(startDate)) + 1;
  
  // Gesamtes Krankengeld
  const totalSickPay = sickPayPerDay * daysOfSickness;
  
  return {
    id: crypto.randomUUID(),
    employeeId: employee.id,
    startDate,
    endDate,
    dailyGrossSalary,
    sickPayPerDay,
    totalSickPay,
    daysOfSickness,
    status: 'active',
    createdAt: new Date(),
  };
}

/**
 * Berechnet Mutterschaftsgeld und Arbeitgeberzuschuss
 */
export function calculateMaternityBenefits(params: MaternityParams): MaternityBenefits {
  const { employee, startDate, endDate, grossSalary, type } = params;
  
  const daysInPeriod = differenceInCalendarDays(endOfDay(endDate), startOfDay(startDate)) + 1;
  const dailyGrossSalary = grossSalary / 30;
  
  let dailyBenefit = 0;
  let paidByEmployer = 0;
  let paidByInsurance = 0;
  
  if (type === 'maternity-protection') {
    // Mutterschutz: Krankenkasse zahlt max. 13€/Tag, Arbeitgeber den Rest
    const dailyInsuranceBenefit = Math.min(MATERNITY_RATES.dailyMaxBenefit, dailyGrossSalary);
    const dailyEmployerSupplement = Math.max(0, dailyGrossSalary - dailyInsuranceBenefit);
    
    dailyBenefit = dailyGrossSalary; // Voller Lohnausgleich
    paidByInsurance = dailyInsuranceBenefit * daysInPeriod;
    paidByEmployer = dailyEmployerSupplement * daysInPeriod;
  } else if (type === 'parental-leave') {
    // Elterngeld: 65% des Nettogehalts (vereinfacht)
    const taxResult = calculateCompleteTax({
      grossSalaryYearly: grossSalary * 12,
      taxClass: employee.personalData.taxClass,
      childAllowances: employee.personalData.childAllowances || 0,
      churchTax: employee.personalData.churchTax,
      churchTaxRate: employee.personalData.churchTax ? 9 : 0,
      healthInsuranceRate: 2.45,
      isEastGermany: false,
      isChildless: (employee.personalData.childAllowances || 0) === 0,
      age: 30,
    });
    
    dailyBenefit = (taxResult.netMonthly * 0.65) / 30;
    paidByInsurance = dailyBenefit * daysInPeriod;
    paidByEmployer = 0;
  }
  
  const totalBenefit = dailyBenefit * daysInPeriod;
  
  return {
    id: crypto.randomUUID(),
    employeeId: employee.id,
    type,
    startDate,
    endDate,
    grossSalaryBasis: grossSalary,
    dailyBenefit,
    totalBenefit,
    paidByEmployer,
    paidByInsurance,
    status: 'active',
    createdAt: new Date(),
  };
}

/**
 * Berechnet Kurzarbeitergeld
 */
export function calculateShortTimeWork(params: ShortTimeWorkParams): ShortTimeWork {
  const { employee, startDate, endDate, originalHours, reducedHours, grossSalary, hasChildren } = params;
  
  // Reduzierung in Prozent
  const reductionPercentage = (originalHours - reducedHours) / originalHours;
  
  // Gehaltsverlust durch reduzierte Arbeitszeit
  const grossSalaryLoss = grossSalary * reductionPercentage;
  
  // Kurzarbeitergeld: 60% oder 67% des Netto-Entgeltausfalls
  const taxResult = calculateCompleteTax({
    grossSalaryYearly: grossSalaryLoss * 12,
    taxClass: employee.personalData.taxClass,
    childAllowances: employee.personalData.childAllowances || 0,
    churchTax: employee.personalData.churchTax,
    churchTaxRate: employee.personalData.churchTax ? 9 : 0,
    healthInsuranceRate: 2.45,
    isEastGermany: false,
    isChildless: (employee.personalData.childAllowances || 0) === 0,
    age: 30,
  });
  
  const netLoss = grossSalaryLoss - (grossSalaryLoss - taxResult.netMonthly); // Vereinfachte Berechnung
  const rate = hasChildren ? SHORT_TIME_WORK_RATES.withChildrenPercentage : SHORT_TIME_WORK_RATES.basePercentage;
  const shortTimeWorkBenefit = netLoss * rate;
  
  return {
    id: crypto.randomUUID(),
    employeeId: employee.id,
    startDate,
    endDate,
    originalWorkingHours: originalHours,
    reducedWorkingHours: reducedHours,
    reductionPercentage,
    grossSalaryLoss,
    shortTimeWorkBenefit,
    hasChildren,
    status: 'active',
    createdAt: new Date(),
  };
}

/**
 * Hilfsfunktion: Prüft ob Kurzarbeit-Kriterien erfüllt sind
 */
export function validateShortTimeWork(reductionPercentage: number): boolean {
  return reductionPercentage >= SHORT_TIME_WORK_RATES.minReductionPercentage;
}

/**
 * Hilfsfunktion: Berechnet maximale Krankengeld-Dauer
 */
export function getMaxSickPayDuration(startDate: Date): Date {
  const maxDate = new Date(startDate);
  maxDate.setDate(maxDate.getDate() + (SICK_PAY_RATES.maxDurationWeeks * 7));
  return maxDate;
}