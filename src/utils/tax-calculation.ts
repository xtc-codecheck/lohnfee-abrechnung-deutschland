// Exakte deutsche Steuerberechnung nach § 32a EStG 2025
// Einkommensteuergesetz (EStG) § 32a Einkommensteuertarif
//
// ALLGEMEINE LOHNSTEUERTABELLE - für sozialversicherungspflichtige Arbeitnehmer
// Diese Tabelle berücksichtigt Sozialversicherungsbeiträge bei der Lohnsteuerberechnung
// und gilt für alle Arbeitnehmer, die ganz normal sozialversicherungspflichtig beschäftigt sind.
//
// HINWEIS: Es existiert auch eine BESONDERE LOHNSTEUERTABELLE für:
// - Beamte
// - Richter  
// - Berufssoldaten
// - Arbeitnehmer, die komplett privat krankenversichert sind und keine Beiträge 
//   zur gesetzlichen Renten-/Arbeitslosenversicherung zahlen
//
// Die besondere Lohnsteuertabelle berechnet die Lohnsteuer OHNE Berücksichtigung von 
// Sozialversicherungsbeiträgen, wodurch die Steuerlast höher ausfällt.
// 
// ⚠️ AKTUELLER STATUS: Die besondere Lohnsteuertabelle ist derzeit NICHT implementiert
// und wird in diesem Lohnverarbeitungssystem noch NICHT verarbeitet.
// Eine Implementierung ist für einen späteren Zeitpunkt geplant.

import { 
  BBG_2025_YEARLY, 
  SOCIAL_INSURANCE_RATES_2025, 
  TAX_ALLOWANCES_2025, 
  TAX_RATES_2025,
  WAGE_TAX_TABLE_2025,
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
 * Hilfsfunktion: Lohnsteuer aus Tabelle interpolieren
 */
function getWageTaxFromTable(grossSalary: number, taxClass: number): number {
  // Steuerklassen-Mapping: StKl I/IV, StKl II, StKl III, StKl V, StKl VI
  const columnIndex = {
    1: 1, // StKl I
    2: 2, // StKl II  
    3: 3, // StKl III
    4: 1, // StKl IV (gleich wie I)
    5: 4, // StKl V
    6: 5, // StKl VI
  }[taxClass] || 1;

  // Finde passende Tabellenzeile oder interpoliere
  const table = WAGE_TAX_TABLE_2025;
  
  // Suche exakte Übereinstimmung oder nächste Zeile
  for (let i = 0; i < table.length; i++) {
    const [salary, ...taxes] = table[i];
    
    if (grossSalary <= salary) {
      return taxes[columnIndex - 1];
    }
  }
  
  // Für höhere Gehälter: Extrapolation basierend auf letzten beiden Einträgen
  if (table.length >= 2) {
    const lastEntry = table[table.length - 1];
    const secondLastEntry = table[table.length - 2];
    
    const salaryDiff = lastEntry[0] - secondLastEntry[0];
    const taxDiff = lastEntry[columnIndex] - secondLastEntry[columnIndex];
    const extrapolationFactor = (grossSalary - lastEntry[0]) / salaryDiff;
    
    return lastEntry[columnIndex] + (taxDiff * extrapolationFactor);
  }
  
  return 0;
}

/**
 * Berechnet die Lohnsteuer basierend auf Bruttolohn und Steuerklasse
 * Verwendet die offizielle Lohnsteuertabelle 2025
 */
export function calculateIncomeTax(grossSalary: number, taxClass: number = 1): number {
  return getWageTaxFromTable(grossSalary, taxClass);
}

/**
 * Berechnet den Solidaritätszuschlag
 */
export function calculateSolidarityTax(incomeTax: number): number {
  // Für 2025: Freigrenze von €19.950 Einkommensteuer jährlich
  const freibetragYearly = TAX_ALLOWANCES_2025.solidarityTaxFreeAmount;
  
  // Wenn die Einkommensteuer unter der Freigrenze liegt, kein Soli
  if (incomeTax <= freibetragYearly) {
    return 0;
  }
  
  // 5,5% der Einkommensteuer
  const soli = incomeTax * TAX_RATES_2025.solidarityTax;
  
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
  childAllowances: number,
  socialContributions: number = 0
): number {
  // Werbungskostenpauschale
  const werbungskostenpauschale = TAX_ALLOWANCES_2025.workRelatedExpenses;
  
  // Sonderausgabenpauschale
  const sonderausgabenpauschale = TAX_ALLOWANCES_2025.specialExpenses;
  
  // Vorsorgepauschale: Sozialversicherungsbeiträge sind als Sonderausgaben absetzbar
  const vorsorgepauschale = socialContributions;
  
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
  const healthInsurance = healthBase * (SOCIAL_INSURANCE_RATES_2025.health.employee / 100) + healthBase * (healthInsuranceRate / 2 / 100);

  const careBase = Math.min(grossSalaryYearly, bbg.health);
  const careRate = getCareInsuranceRate(isChildless, age);
  const careInsurance = careBase * (careRate.employee / 100);

  // Zuerst Sozialversicherung berechnen für korrekte Vorsorgepauschale
  const totalSocialContributions = pensionInsurance + unemploymentInsurance + healthInsurance + careInsurance;
  
  // Lohnsteuer direkt aus Tabelle basierend auf Brutto und Steuerklasse
  const grossMonthly = grossSalaryYearly / 12;
  const taxClassNumber = parseInt(taxClass) || 1;
  const incomeTaxMonthly = getWageTaxFromTable(grossMonthly, taxClassNumber);
  const incomeTax = incomeTaxMonthly * 12;
  
  const solidarityTax = calculateSolidarityTax(incomeTax);
  const churchTaxAmount = churchTax ? calculateChurchTax(incomeTax, churchTaxRate) : 0;
  
  // Für Informationszwecke: zu versteuerndes Einkommen
  const taxableIncome = calculateTaxableIncome(grossSalaryYearly, childAllowances, totalSocialContributions);

  // Summen
  const totalTaxes = incomeTax + solidarityTax + churchTaxAmount;
  const totalDeductions = totalSocialContributions + totalTaxes;
  
  const netYearly = grossSalaryYearly - totalDeductions;
  
  // Arbeitgeberkosten (Arbeitgeberanteile)
  const employerSocialContributions = pensionBase * (SOCIAL_INSURANCE_RATES_2025.pension.employer / 100) +
                                    unemploymentBase * (SOCIAL_INSURANCE_RATES_2025.unemployment.employer / 100) +
                                    healthBase * (SOCIAL_INSURANCE_RATES_2025.health.employer / 100) + healthBase * (healthInsuranceRate / 2 / 100) +
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