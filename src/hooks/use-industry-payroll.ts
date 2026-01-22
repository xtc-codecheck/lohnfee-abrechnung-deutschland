/**
 * Hook für branchenspezifische Lohnabrechnungen
 * Integriert Baulohn, Gastronomie und Pflege-Module
 */

import { useMemo, useCallback } from 'react';
import { Employee, IndustryType, IndustryConfig } from '@/types/employee';
import { 
  calculateConstructionPayroll, 
  calculateVacationAccount,
  ConstructionPayrollParams,
  ConstructionPayrollResult,
  VacationAccountResult
} from '@/utils/construction-payroll';
import { 
  calculateGastronomyPayroll, 
  calculateMinijobGastronomy,
  GastronomyPayrollParams,
  GastronomyPayrollResult
} from '@/utils/gastronomy-payroll';
import { 
  calculateNursingPayroll,
  NursingPayrollParams,
  NursingPayrollResult,
  ShiftEntry
} from '@/utils/nursing-payroll';

// ============= Typen für branchenspezifische Payroll-Eingaben =============

export interface IndustryPayrollInput {
  // Gemeinsame Felder
  grossMonthly: number;
  hoursWorked: number;
  
  // Arbeitszeitdaten
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  
  // Baulohn-spezifisch
  winterHours?: number;
  dirtyWorkHours?: number;
  heightWorkHours?: number;
  dangerWorkHours?: number;
  vacationDaysTaken?: number;
  previousYearVacationDays?: number;
  
  // Gastronomie-spezifisch
  breakfastsProvided?: number;
  lunchesProvided?: number;
  dinnersProvided?: number;
  monthlyTips?: number;
  
  // Pflege-spezifisch
  shifts?: ShiftEntry[];
  onCallHours?: number;
  weekendDays?: number;
}

export interface IndustryPayrollResult {
  industryType: IndustryType;
  
  // Brutto-Anpassungen
  additionalGross: number;
  taxFreeAdditions: number;
  taxableAdditions: number;
  
  // Arbeitgeber-Zusatzkosten
  employerAdditionalCosts: number;
  
  // Branchenspezifische Details
  constructionResult?: ConstructionPayrollResult;
  vacationAccountResult?: VacationAccountResult;
  gastronomyResult?: GastronomyPayrollResult;
  nursingResult?: NursingPayrollResult;
  
  // Zusammenfassende Details
  details: string[];
  warnings: string[];
}

// ============= Haupt-Hook =============

export function useIndustryPayroll() {
  
  /**
   * Ermittelt die Branche eines Mitarbeiters
   */
  const getEmployeeIndustry = useCallback((employee: Employee): IndustryType => {
    return employee.employmentData.industry ?? 'standard';
  }, []);

  /**
   * Prüft ob ein Mitarbeiter branchenspezifische Abrechnungen benötigt
   */
  const hasIndustrySpecificPayroll = useCallback((employee: Employee): boolean => {
    const industry = getEmployeeIndustry(employee);
    return industry !== 'standard';
  }, [getEmployeeIndustry]);

  /**
   * Berechnet branchenspezifische Zuschläge und Abzüge
   */
  const calculateIndustryPayroll = useCallback((
    employee: Employee,
    input: IndustryPayrollInput,
    month: number,
    year: number
  ): IndustryPayrollResult => {
    const industry = getEmployeeIndustry(employee);
    const config = employee.employmentData.industryConfig;
    
    const baseResult: IndustryPayrollResult = {
      industryType: industry,
      additionalGross: 0,
      taxFreeAdditions: 0,
      taxableAdditions: 0,
      employerAdditionalCosts: 0,
      details: [],
      warnings: [],
    };
    
    if (industry === 'standard') {
      return baseResult;
    }
    
    // Winterperiode prüfen (Dezember bis März)
    const isWinterMonth = month >= 12 || month <= 3;
    
    switch (industry) {
      case 'construction':
        return calculateConstructionIndustryPayroll(
          employee, 
          input, 
          config, 
          isWinterMonth
        );
        
      case 'gastronomy':
        return calculateGastronomyIndustryPayroll(
          employee, 
          input, 
          config
        );
        
      case 'nursing':
        return calculateNursingIndustryPayroll(
          employee, 
          input, 
          config
        );
        
      default:
        return baseResult;
    }
  }, [getEmployeeIndustry]);

  return {
    getEmployeeIndustry,
    hasIndustrySpecificPayroll,
    calculateIndustryPayroll,
  };
}

// ============= Branchenspezifische Berechnungen =============

function calculateConstructionIndustryPayroll(
  employee: Employee,
  input: IndustryPayrollInput,
  config?: IndustryConfig,
  isWinterMonth?: boolean
): IndustryPayrollResult {
  const params: ConstructionPayrollParams = {
    grossMonthly: input.grossMonthly,
    region: config?.constructionRegion ?? 'west',
    tradeGroup: config?.constructionTradeGroup ?? 'skilled',
    hoursWorked: input.hoursWorked,
    isWinterPeriod: isWinterMonth ?? config?.isWinterPeriod ?? false,
    winterHours: input.winterHours,
    dirtyWorkHours: input.dirtyWorkHours,
    heightWorkHours: input.heightWorkHours,
    dangerWorkHours: input.dangerWorkHours,
    vacationDaysTaken: input.vacationDaysTaken,
    previousYearVacationDays: input.previousYearVacationDays,
  };
  
  const constructionResult = calculateConstructionPayroll(params);
  const vacationAccountResult = calculateVacationAccount(params);
  
  const warnings: string[] = [];
  
  // Winterbeschäftigung Hinweis
  if (isWinterMonth && !input.winterHours) {
    warnings.push('Winterperiode aktiv - Wintergeld-Stunden können erfasst werden');
  }
  
  // SOKA-BAU Hinweis
  if (constructionResult.sokaEmployerContribution > 0) {
    warnings.push(`SOKA-BAU Arbeitgeberbeitrag: ${formatCurrency(constructionResult.sokaEmployerContribution)}/Monat`);
  }
  
  return {
    industryType: 'construction',
    additionalGross: constructionResult.totalBonuses + constructionResult.winterAllowance,
    taxFreeAdditions: 0, // Zulagen sind steuerpflichtig
    taxableAdditions: constructionResult.totalBonuses + constructionResult.winterAllowance,
    employerAdditionalCosts: constructionResult.sokaEmployerContribution,
    constructionResult,
    vacationAccountResult,
    details: constructionResult.details,
    warnings,
  };
}

function calculateGastronomyIndustryPayroll(
  employee: Employee,
  input: IndustryPayrollInput,
  config?: IndustryConfig
): IndustryPayrollResult {
  const isMinijob = employee.employmentData.employmentType === 'minijob';
  const isMidijob = employee.employmentData.employmentType === 'midijob';
  
  const params: GastronomyPayrollParams = {
    grossMonthly: input.grossMonthly,
    hoursWorked: input.hoursWorked,
    breakfastsProvided: input.breakfastsProvided ?? 0,
    lunchesProvided: input.lunchesProvided ?? 0,
    dinnersProvided: input.dinnersProvided ?? 0,
    monthlyTips: input.monthlyTips ?? 0,
    tipsFromEmployer: config?.tipsFromEmployer ?? false,
    nightHours: input.nightHours,
    sundayHours: input.sundayHours,
    holidayHours: input.holidayHours,
    isMinijob,
    isMidijob,
  };
  
  const gastronomyResult = calculateGastronomyPayroll(params);
  
  const warnings: string[] = [];
  
  // Minijob-Grenzprüfung
  if (isMinijob) {
    const minijobCheck = calculateMinijobGastronomy(
      input.hoursWorked,
      input.grossMonthly / input.hoursWorked,
      (input.breakfastsProvided ?? 0) + (input.lunchesProvided ?? 0) + (input.dinnersProvided ?? 0)
    );
    
    if (minijobCheck.isOverLimit) {
      warnings.push(`⚠️ Minijob-Grenze überschritten! Gesamtleistungen: ${formatCurrency(minijobCheck.totalBenefit)}`);
    }
  }
  
  // Trinkgeld vom Arbeitgeber Warnung
  if (config?.tipsFromEmployer && (input.monthlyTips ?? 0) > 0) {
    warnings.push('Trinkgeld vom Arbeitgeber ist voll steuerpflichtig');
  }
  
  return {
    industryType: 'gastronomy',
    additionalGross: gastronomyResult.totalGross - gastronomyResult.baseGross,
    taxFreeAdditions: gastronomyResult.taxFreeIncome,
    taxableAdditions: gastronomyResult.taxableIncome - gastronomyResult.baseGross,
    employerAdditionalCosts: gastronomyResult.mealBenefitTotal, // Sachbezüge
    gastronomyResult,
    details: gastronomyResult.details,
    warnings,
  };
}

function calculateNursingIndustryPayroll(
  employee: Employee,
  input: IndustryPayrollInput,
  config?: IndustryConfig
): IndustryPayrollResult {
  // Shifts aus Input oder generieren
  const shifts: ShiftEntry[] = input.shifts ?? generateDefaultShifts(
    input.nightHours,
    input.sundayHours,
    input.holidayHours
  );
  
  const params: NursingPayrollParams = {
    grossMonthly: input.grossMonthly,
    hoursWorked: input.hoursWorked,
    careLevel: config?.careLevel ?? 'nurse',
    shifts,
    onCallHours: input.onCallHours,
    weekendDays: input.weekendDays,
    holidayDays: Math.ceil(input.holidayHours / 8),
  };
  
  const nursingResult = calculateNursingPayroll(params);
  
  const warnings: string[] = [];
  
  // SFN-Steuerfreiheit Hinweis
  if (nursingResult.taxFreeAmount > 0) {
    warnings.push(`SFN-Zuschläge (steuerfrei): ${formatCurrency(nursingResult.taxFreeAmount)}`);
  }
  
  // Bereitschaftsdienst Hinweis
  if (input.onCallHours && input.onCallHours > 0) {
    warnings.push(`Bereitschaftsdienst: ${input.onCallHours}h vergütet`);
  }
  
  return {
    industryType: 'nursing',
    additionalGross: nursingResult.totalGross - nursingResult.baseGross,
    taxFreeAdditions: nursingResult.taxFreeAmount,
    taxableAdditions: nursingResult.taxableAmount - nursingResult.baseGross,
    employerAdditionalCosts: nursingResult.shiftAllowance, // Schichtzulagen
    nursingResult,
    details: nursingResult.details,
    warnings,
  };
}

// ============= Hilfsfunktionen =============

function generateDefaultShifts(
  nightHours: number,
  sundayHours: number,
  holidayHours: number
): ShiftEntry[] {
  // Einfache Schicht-Generierung basierend auf Stundeneingaben
  const shifts: ShiftEntry[] = [];
  
  if (nightHours > 0) {
    shifts.push({
      date: new Date(),
      type: 'night',
      hours: nightHours,
      nightHours,
      sundayHours: 0,
      holidayHours: 0,
    });
  }
  
  if (sundayHours > 0) {
    shifts.push({
      date: new Date(),
      type: 'early',
      hours: sundayHours,
      nightHours: 0,
      sundayHours,
      holidayHours: 0,
    });
  }
  
  if (holidayHours > 0) {
    shifts.push({
      date: new Date(),
      type: 'early',
      hours: holidayHours,
      nightHours: 0,
      sundayHours: 0,
      holidayHours,
    });
  }
  
  return shifts;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

// ============= Konstanten für UI =============

export const INDUSTRY_LABELS: Record<IndustryType, string> = {
  standard: 'Standard',
  construction: 'Baulohn',
  gastronomy: 'Gastronomie',
  nursing: 'Pflege / Schichtdienst',
};

export const CONSTRUCTION_TRADE_GROUP_LABELS = {
  worker: 'Bauhelfer/Werker',
  skilled: 'Facharbeiter',
  foreman: 'Vorarbeiter/Polier',
  master: 'Baumeister',
} as const;

export const CARE_LEVEL_LABELS = {
  assistant: 'Pflegehilfskraft',
  nurse: 'Pflegefachkraft',
  specialist: 'Fachpfleger/in',
  lead: 'Stationsleitung',
} as const;
