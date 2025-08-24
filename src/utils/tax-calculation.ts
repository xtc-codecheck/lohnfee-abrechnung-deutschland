// Exakte deutsche Steuerberechnung nach § 32a EStG 2025
// Einkommensteuergesetz (EStG) § 32a Einkommensteuertarif

import { 
  BBG_2025_YEARLY, 
  SOCIAL_INSURANCE_RATES_2025, 
  TAX_ALLOWANCES_2025, 
  TAX_RATES_2025,
  getBBGForRegion,
  getCareInsuranceRate 
} from '@/constants/social-security';

export interface TaxCalculationParams {
  grossSalaryYearly: number;
  taxClass: string;
  childAllowances: number;
  churchTax: boolean;
  churchTaxRate: number; // 8% (Bayern, BW) oder 9% (andere Länder)
  healthInsuranceRate: number; // Zusatzbeitrag der Krankenkasse
  isEastGermany: boolean; // für BBG Unterschiede
  isChildless: boolean; // für Pflegeversicherung
  age: number; // für Pflegeversicherung
}

export interface TaxCalculationResult {
  grossYearly: number;
  grossMonthly: number;
  taxableIncome: number; // zu versteuerndes Einkommen
  incomeTax: number;
  solidarityTax: number;
  churchTax: number;
  pensionInsurance: number;
  unemploymentInsurance: number;
  healthInsurance: number;
  careInsurance: number;
  totalTaxes: number;
  totalSocialContributions: number;
  totalDeductions: number;
  netYearly: number;
  netMonthly: number;
  employerCosts: number;
}

/**
 * Berechnet die Einkommensteuer nach § 32a EStG 2025
 */
export function calculateIncomeTax(taxableIncome: number): number {
  const zvE = Math.floor(taxableIncome); // auf volle Euro abrunden
  
  let tax = 0;

  if (zvE <= TAX_ALLOWANCES_2025.basicAllowance) {
    // Grundfreibetrag
    tax = 0;
  } else if (zvE <= TAX_RATES_2025.progressionZone1.to) {
    // Progressionszone 1
    const y = (zvE - TAX_ALLOWANCES_2025.basicAllowance) / 10000;
    tax = (TAX_RATES_2025.progressionZone1.coefficients[0] * y + TAX_RATES_2025.progressionZone1.coefficients[1]) * y;
  } else if (zvE <= TAX_RATES_2025.progressionZone2.to) {
    // Progressionszone 2
    const z = (zvE - TAX_RATES_2025.progressionZone1.to - 1) / 10000;
    tax = (TAX_RATES_2025.progressionZone2.coefficients[0] * z + TAX_RATES_2025.progressionZone2.coefficients[1]) * z + TAX_RATES_2025.progressionZone2.constant;
  } else if (zvE <= TAX_RATES_2025.proportionalZone1.to) {
    // Proportionalzone 1 (42%)
    tax = TAX_RATES_2025.proportionalZone1.rate * zvE - TAX_RATES_2025.proportionalZone1.constant;
  } else {
    // Proportionalzone 2 (45% - Reichensteuer)
    tax = TAX_RATES_2025.proportionalZone2.rate * zvE - TAX_RATES_2025.proportionalZone2.constant;
  }

  return Math.floor(tax); // auf volle Euro abrunden
}

/**
 * Berechnet den Solidaritätszuschlag
 */
export function calculateSolidarityTax(incomeTax: number): number {
  const freibetrag = TAX_ALLOWANCES_2025.solidarityTaxFreeAmount;
  
  if (incomeTax <= freibetrag) {
    return 0;
  }
  
  const soli = incomeTax * TAX_RATES_2025.solidarityTax;
  
  // Milderungszone
  const milderungsgrenze = TAX_ALLOWANCES_2025.solidarityReductionLimit;
  if (incomeTax <= milderungsgrenze) {
    const milderung = (incomeTax - freibetrag) * 0.2;
    return Math.min(soli, milderung);
  }
  
  return Math.floor(soli);
}

/**
 * Berechnet die Kirchensteuer
 */
export function calculateChurchTax(incomeTax: number, rate: number): number {
  return Math.floor(incomeTax * (rate / 100));
}

/**
 * Berechnet das zu versteuernde Einkommen
 */
export function calculateTaxableIncome(
  grossYearly: number,
  childAllowances: number
): number {
  // Werbungskostenpauschale
  const werbungskostenpauschale = TAX_ALLOWANCES_2025.workRelatedExpenses;
  
  // Sonderausgabenpauschale
  const sonderausgabenpauschale = TAX_ALLOWANCES_2025.specialExpenses;
  
  // Vorsorgepauschale (vereinfacht)
  const vorsorgepauschale = Math.min(grossYearly * 0.12, TAX_ALLOWANCES_2025.retirementProvision);
  
  // Kinderfreibetrag
  const kinderfreibetrag = childAllowances * TAX_ALLOWANCES_2025.childAllowance;
  
  let taxableIncome = grossYearly 
    - werbungskostenpauschale 
    - sonderausgabenpauschale 
    - vorsorgepauschale
    - kinderfreibetrag;
  
  return Math.max(0, Math.floor(taxableIncome));
}

/**
 * Vollständige Steuer- und Sozialabgabenberechnung
 */
export function calculateCompleteTax(params: TaxCalculationParams): TaxCalculationResult {
  const { grossSalaryYearly, taxClass, childAllowances, churchTax, churchTaxRate, 
          healthInsuranceRate, isEastGermany, isChildless, age } = params;

  // Beitragsbemessungsgrenzen
  const bbg = getBBGForRegion(isEastGermany, 'yearly');

  // Sozialversicherungsbeiträge (Arbeitnehmeranteil)
  const pensionBase = Math.min(grossSalaryYearly, bbg.pension);
  const pensionInsurance = pensionBase * (SOCIAL_INSURANCE_RATES_2025.pension.employee / 100);

  const unemploymentBase = Math.min(grossSalaryYearly, bbg.pension);
  const unemploymentInsurance = unemploymentBase * (SOCIAL_INSURANCE_RATES_2025.unemployment.employee / 100);

  const healthBase = Math.min(grossSalaryYearly, bbg.health);
  const healthInsurance = healthBase * ((SOCIAL_INSURANCE_RATES_2025.health.employee + healthInsuranceRate) / 100);

  const careBase = Math.min(grossSalaryYearly, bbg.health);
  const careRate = getCareInsuranceRate(isChildless, age);
  const careInsurance = careBase * (careRate.employee / 100);

  // Steuern
  const taxableIncome = calculateTaxableIncome(grossSalaryYearly, childAllowances);
  const incomeTax = calculateIncomeTax(taxableIncome);
  const solidarityTax = calculateSolidarityTax(incomeTax);
  const churchTaxAmount = churchTax ? calculateChurchTax(incomeTax, churchTaxRate) : 0;

  // Summen
  const totalSocialContributions = pensionInsurance + unemploymentInsurance + healthInsurance + careInsurance;
  const totalTaxes = incomeTax + solidarityTax + churchTaxAmount;
  const totalDeductions = totalSocialContributions + totalTaxes;
  
  const netYearly = grossSalaryYearly - totalDeductions;
  
  // Arbeitgeberkosten (Arbeitgeberanteile)
  const employerSocialContributions = pensionBase * (SOCIAL_INSURANCE_RATES_2025.pension.employer / 100) +
                                    unemploymentBase * (SOCIAL_INSURANCE_RATES_2025.unemployment.employer / 100) +
                                    healthBase * ((SOCIAL_INSURANCE_RATES_2025.health.employer + healthInsuranceRate) / 100) +
                                    careBase * (careRate.employer / 100);
  
  const employerCosts = grossSalaryYearly + employerSocialContributions;

  return {
    grossYearly: grossSalaryYearly,
    grossMonthly: grossSalaryYearly / 12,
    taxableIncome,
    incomeTax,
    solidarityTax,
    churchTax: churchTaxAmount,
    pensionInsurance,
    unemploymentInsurance,
    healthInsurance,
    careInsurance,
    totalTaxes,
    totalSocialContributions,
    totalDeductions,
    netYearly,
    netMonthly: netYearly / 12,
    employerCosts,
  };
}

/**
 * Berechnet Zuschläge für Überstunden, Nacht-, Sonntags- und Feiertagsarbeit
 */
export interface OvertimeCalculation {
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  hourlyRate: number;
}

export interface OvertimeResult {
  regularPay: number;
  overtimePay: number;
  nightBonus: number;
  sundayBonus: number;
  holidayBonus: number;
  totalBonuses: number;
  totalGrossPay: number;
}

export function calculateOvertimeAndBonuses(calc: OvertimeCalculation): OvertimeResult {
  const regularPay = calc.regularHours * calc.hourlyRate;
  const overtimePay = calc.overtimeHours * calc.hourlyRate * 1.25; // 25% Zuschlag
  const nightBonus = calc.nightHours * calc.hourlyRate * 0.25; // 25% Zuschlag
  const sundayBonus = calc.sundayHours * calc.hourlyRate * 0.50; // 50% Zuschlag
  const holidayBonus = calc.holidayHours * calc.hourlyRate * 1.0; // 100% Zuschlag

  const totalBonuses = overtimePay - (calc.overtimeHours * calc.hourlyRate) + 
                      nightBonus + sundayBonus + holidayBonus;
  
  const totalGrossPay = regularPay + overtimePay + nightBonus + sundayBonus + holidayBonus;

  return {
    regularPay,
    overtimePay,
    nightBonus,
    sundayBonus,
    holidayBonus,
    totalBonuses,
    totalGrossPay,
  };
}