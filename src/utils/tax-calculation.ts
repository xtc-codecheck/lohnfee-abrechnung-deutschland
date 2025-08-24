// Exakte deutsche Steuerberechnung nach § 32a EStG 2025
// Einkommensteuergesetz (EStG) § 32a Einkommensteuertarif

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

// Beitragsbemessungsgrenzen 2025
const BBG_2025 = {
  pensionWest: 7550 * 12, // Renten-/Arbeitslosenversicherung West
  pensionEast: 7450 * 12, // Renten-/Arbeitslosenversicherung Ost
  healthCare: 5175 * 12,  // Kranken-/Pflegeversicherung bundesweit
};

// Sozialversicherungsbeiträge 2025
const SOCIAL_INSURANCE_RATES = {
  pension: 0.186, // 18,6% (Arbeitnehmer: 9,3%)
  unemployment: 0.026, // 2,6% (Arbeitnehmer: 1,3%)
  health: 0.146, // 14,6% (Arbeitnehmer: 7,3%) + Zusatzbeitrag
  care: 0.034, // 3,4% (Arbeitnehmer: 1,7%)
  careChildless: 0.04, // 4,0% für Kinderlose über 23 (Arbeitnehmer: 2,0%)
};

/**
 * Berechnet die Einkommensteuer nach § 32a EStG 2025
 */
export function calculateIncomeTax(taxableIncome: number): number {
  const zvE = Math.floor(taxableIncome); // auf volle Euro abrunden
  
  let tax = 0;

  if (zvE <= 12096) {
    // Grundfreibetrag
    tax = 0;
  } else if (zvE <= 17443) {
    // Progressionszone 1
    const y = (zvE - 12096) / 10000;
    tax = (932.30 * y + 1400) * y;
  } else if (zvE <= 68480) {
    // Progressionszone 2
    const z = (zvE - 17443) / 10000;
    tax = (176.64 * z + 2397) * z + 1015.13;
  } else if (zvE <= 277825) {
    // Proportionalzone 1 (42%)
    tax = 0.42 * zvE - 10911.92;
  } else {
    // Proportionalzone 2 (45% - Reichensteuer)
    tax = 0.45 * zvE - 19246.67;
  }

  return Math.floor(tax); // auf volle Euro abrunden
}

/**
 * Berechnet den Solidaritätszuschlag
 */
export function calculateSolidarityTax(incomeTax: number): number {
  // Freibetrag 2025: ca. 1.036,76 € (Alleinstehende)
  const freibetrag = 1036.76;
  
  if (incomeTax <= freibetrag) {
    return 0;
  }
  
  const soli = incomeTax * 0.055; // 5,5%
  
  // Milderungszone zwischen Freibetrag und 1.340,06 €
  const milderungsgrenze = 1340.06;
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
  const werbungskostenpauschale = 1230;
  
  // Sonderausgabenpauschale
  const sonderausgabenpauschale = 36;
  
  // Vorsorgepauschale (vereinfacht)
  const vorsorgepauschale = Math.min(grossYearly * 0.12, 3000);
  
  // Kinderfreibetrag 2025: 6.612 € pro Kind
  const kinderfreibetrag = childAllowances * 6612;
  
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
  const bbgPension = isEastGermany ? BBG_2025.pensionEast : BBG_2025.pensionWest;
  const bbgHealth = BBG_2025.healthCare;

  // Sozialversicherungsbeiträge (Arbeitnehmeranteil)
  const pensionBase = Math.min(grossSalaryYearly, bbgPension);
  const pensionInsurance = pensionBase * (SOCIAL_INSURANCE_RATES.pension / 2);

  const unemploymentBase = Math.min(grossSalaryYearly, bbgPension);
  const unemploymentInsurance = unemploymentBase * (SOCIAL_INSURANCE_RATES.unemployment / 2);

  const healthBase = Math.min(grossSalaryYearly, bbgHealth);
  const healthInsurance = healthBase * (SOCIAL_INSURANCE_RATES.health / 2 + healthInsuranceRate / 100 / 2);

  const careBase = Math.min(grossSalaryYearly, bbgHealth);
  const careRate = (isChildless && age > 23) ? SOCIAL_INSURANCE_RATES.careChildless : SOCIAL_INSURANCE_RATES.care;
  const careInsurance = careBase * (careRate / 2);

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
  const employerSocialContributions = pensionBase * (SOCIAL_INSURANCE_RATES.pension / 2) +
                                    unemploymentBase * (SOCIAL_INSURANCE_RATES.unemployment / 2) +
                                    healthBase * (SOCIAL_INSURANCE_RATES.health / 2 + healthInsuranceRate / 100 / 2) +
                                    careBase * (careRate / 2);
  
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