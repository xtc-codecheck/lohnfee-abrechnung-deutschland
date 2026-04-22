// Exakte deutsche Steuerberechnung nach § 32a EStG 2025/2026
// Programmablaufplan (PAP) des Bundesministeriums der Finanzen
//
// ALLGEMEINE LOHNSTEUERTABELLE - für sozialversicherungspflichtige Arbeitnehmer
// Formelbasierte Berechnung nach § 32a EStG (ersetzt die statische Lookup-Tabelle)
//
// HINWEIS: Es existiert auch eine BESONDERE LOHNSTEUERTABELLE für:
// - Beamte, Richter, Berufssoldaten
// - Arbeitnehmer, die komplett privat krankenversichert sind
//
// Die besondere Lohnsteuertabelle ist in src/utils/besondere-lohnsteuertabelle.ts implementiert

import { calculateBesondereLohnsteuer } from './besondere-lohnsteuertabelle';
import { 
  BBG_2025_YEARLY, 
  SOCIAL_INSURANCE_RATES_2025, 
  TAX_ALLOWANCES_2025, 
  TAX_RATES_2025,
  MINIJOB_2025,
  MIDIJOB_2025,
  getBBGForRegion,
  getCareInsuranceRate,
  getYearConfig,
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
  numberOfChildren?: number; // Für PV-Kinderabschläge (seit 07/2023)
  employmentType?: 'minijob' | 'midijob' | 'fulltime' | 'parttime'; // für spezielle Behandlung
  useBesondereLohnsteuertabelle?: boolean; // Besondere Tabelle für Beamte/PKV
  privateHealthInsuranceMonthly?: number; // PKV-Basisbeitrag (nur bei besonderer Tabelle)
  privateCareInsuranceMonthly?: number; // PPV-Beitrag (nur bei besonderer Tabelle)
  year?: number; // Veranlagungsjahr (Default: 2025)
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

// ============= Hilfsfunktion: Steuerklasse Roman → Zahl =============

const TAX_CLASS_MAP: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
};

/** Konvertiert Steuerklasse (römisch oder arabisch) in eine Zahl 1-6 */
function parseTaxClass(taxClass: string | number): number {
  if (typeof taxClass === 'number') return taxClass >= 1 && taxClass <= 6 ? taxClass : 1;
  return TAX_CLASS_MAP[taxClass.trim().toUpperCase()] ?? 1;
}

// ============= PAP: Tarifliche Einkommensteuer nach § 32a EStG =============

/**
 * Berechnet die tarifliche Einkommensteuer nach § 32a EStG
 * Exakte Formel aus dem Programmablaufplan (PAP) des BMF
 * Unterstützt 2025 und 2026 über den year-Parameter
 */
export function calculateTariflicheEStPAP2025(zvE: number, year: number = 2025): number {
  if (zvE <= 0) return 0;
  
  // Auf ganze Euro abrunden (§ 32a Abs. 1 S. 6 EStG)
  zvE = Math.floor(zvE);
  
  const config = getYearConfig(year);
  const { taxAllowances, taxRates } = config;

  if (zvE <= taxAllowances.basicAllowance) return 0;

  const { progressionZone1, progressionZone2, proportionalZone1, proportionalZone2 } = taxRates;

  if (zvE <= progressionZone1.to) {
    const y = (zvE - taxAllowances.basicAllowance) / 10000;
    return Math.floor((progressionZone1.coefficients[0] * y + progressionZone1.coefficients[1]) * y);
  }

  if (zvE <= progressionZone2.to) {
    const z = (zvE - progressionZone2.from + 1) / 10000;
    return Math.floor((progressionZone2.coefficients[0] * z + progressionZone2.coefficients[1]) * z + progressionZone2.constant);
  }

  if (zvE <= proportionalZone2.from - 1) {
    return Math.floor(zvE * proportionalZone1.rate - proportionalZone1.constant);
  }

  return Math.floor(zvE * proportionalZone2.rate - proportionalZone2.constant);
}

// ============= PAP 2025: Vorsorgepauschale nach § 39b Abs. 2 S. 5 EStG =============

/**
 * Berechnet die Vorsorgepauschale für die allgemeine Lohnsteuertabelle
 * nach § 39b Abs. 2 Satz 5 Nr. 3 EStG
 */
function calculateVorsorgepauschaleAllgemein(
  grossYearly: number,
  taxClass: number,
  isEastGermany: boolean,
  healthInsuranceAdditionalRate: number,
  isChildless: boolean,
  age: number,
  numberOfChildren: number,
  year: number = 2025
): number {
  const config = getYearConfig(year);
  const bbg = getBBGForRegion(isEastGermany, 'yearly', year);
  
  // VSP1: Teilbetrag Rentenversicherung
  const rvBasis = Math.min(grossYearly, bbg.pension);
  const vsp1 = rvBasis * (config.svRates.pension.employee / 100);
  
  // VSP2: Pauschaler Ansatz (12% des Bruttos, max. 1.900/3.000 €)
  const hoechstbetrag = taxClass === 3 ? 3000 : 1900;
  const vsp2 = Math.min(grossYearly * 0.12, hoechstbetrag);
  
  // VSP3: Tatsächliche KV-Basisbeiträge + PV
  const kvBasis = Math.min(grossYearly, bbg.health);
  const kvAN = kvBasis * (config.svRates.health.employee / 100) * 0.96
    + kvBasis * (healthInsuranceAdditionalRate / 2 / 100) * 0.96;
  
  const careRate = getCareInsuranceRate(isChildless, age, numberOfChildren, year);
  const pvAN = kvBasis * (careRate.employee / 100);
  
  const vsp3 = kvAN + pvAN;
  
  return vsp1 + Math.max(vsp2, vsp3);
}

// ============= PAP: Lohnsteuer-Berechnung (Allgemeine Tabelle) =============

/**
 * Berechnet die monatliche Lohnsteuer nach PAP (Allgemeine Tabelle)
 * Unterstützt 2025 und 2026
 */
function calculateLohnsteuerPAP2025(
  grossMonthly: number,
  taxClass: number,
  childAllowances: number = 0,
  isEastGermany: boolean = false,
  healthInsuranceAdditionalRate: number = 1.7,
  isChildless: boolean = true,
  age: number = 30,
  numberOfChildren: number = 0,
  year: number = 2025
): number {
  if (grossMonthly <= 0) return 0;
  
  const config = getYearConfig(year);
  const grossYearly = grossMonthly * 12;
  
  const werbungskosten = config.taxAllowances.workRelatedExpenses;
  const sonderausgaben = config.taxAllowances.specialExpenses;
  const vorsorgepauschale = calculateVorsorgepauschaleAllgemein(
    grossYearly, taxClass, isEastGermany, 
    healthInsuranceAdditionalRate, isChildless, age, numberOfChildren, year
  );
  
  let zvE: number;
  let est: number;
  
  switch (taxClass) {
    case 1:
    case 4:
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
      est = calculateTariflicheEStPAP2025(Math.max(0, zvE), year);
      break;
    case 2: {
      const entlastung = 4260 + Math.max(0, childAllowances - 1) * 240;
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale - entlastung;
      est = calculateTariflicheEStPAP2025(Math.max(0, zvE), year);
      break;
    }
    case 3:
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
      est = calculateTariflicheEStPAP2025(Math.max(0, Math.floor(zvE / 2)), year) * 2;
      break;
    case 5:
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
      est = 2 * calculateTariflicheEStPAP2025(Math.max(0, zvE), year) 
          - 2 * calculateTariflicheEStPAP2025(Math.max(0, Math.floor(zvE / 2)), year);
      break;
    case 6:
      zvE = grossYearly - vorsorgepauschale;
      est = 2 * calculateTariflicheEStPAP2025(Math.max(0, zvE), year) 
          - 2 * calculateTariflicheEStPAP2025(Math.max(0, Math.floor(zvE / 2)), year);
      break;
    default:
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
      est = calculateTariflicheEStPAP2025(Math.max(0, zvE), year);
  }
  
  return Math.floor(est / 12 * 100) / 100;
}

/**
 * Berechnet die Lohnsteuer basierend auf Bruttolohn und Steuerklasse
 * Verwendet die formelbasierte PAP 2025 Berechnung nach § 32a EStG
 */
export function calculateIncomeTax(grossSalary: number, taxClass: number = 1): number {
  if (grossSalary <= 0) return 0;
  return calculateLohnsteuerPAP2025(grossSalary, taxClass);
}

/**
 * Berechnet den Solidaritätszuschlag
 *
 * § 3 + § 4 SolzG (Stand 2025/2026):
 *   1. Freigrenze: ESt ≤ 19.950 € → kein Soli
 *   2. Milderungszone (§ 4 SolzG): Soli = min(5,5 % × ESt; 11,9 % × (ESt − Freigrenze))
 *   3. Vollsatz: 5,5 % × ESt (greift, sobald die Milderungs-Linie 5,5 % übersteigt,
 *      Schnittpunkt bei ESt ≈ 33.911,76 €)
 *
 * Die Berechnung erfolgt cent-genau durch Auswahl des Minimums – damit ist
 * die Kappung in der Milderungszone ohne Sonderfall-Code abgebildet.
 */
export function calculateSolidarityTax(incomeTax: number): number {
  // Negative Steuern ablehnen
  if (incomeTax <= 0) return 0;
  
  // Freigrenze (Jahres-ESt)
  const freibetragYearly = TAX_ALLOWANCES_2025.solidarityTaxFreeAmount; // 19.950 €
  if (incomeTax <= freibetragYearly) return 0;

  // Vollsatz (5,5 %) und Milderungs-Obergrenze (11,9 % × Übersteigender Betrag)
  const fullRate = incomeTax * TAX_RATES_2025.solidarityTax;        // 5,5 %
  const reducedCap = (incomeTax - freibetragYearly) * 0.119;        // § 4 SolzG
  return Math.floor(Math.min(fullRate, reducedCap));
}

/**
 * Berechnet die Kirchensteuer
 *
 * Standard: rate (8 % BY/BW, 9 % sonst) × Lohn-/Einkommensteuer.
 * Optional: Kappung der Kirchensteuer auf einen Prozentsatz des zvE
 *           (Bundesländer mit Kappung: typ. 2,75 %–4 % des zu versteuernden
 *           Einkommens, je nach Land/Konfession – wird auf Antrag gewährt,
 *           für die Lohnabrechnung relevant nur, wenn aktiv konfiguriert).
 *
 * @param incomeTax Lohn-/Einkommensteuer (Jahresbetrag)
 * @param rate      Kirchensteuersatz in Prozent (8 oder 9)
 * @param options   Optional: Kappung auf Prozent des zvE
 */
export function calculateChurchTax(
  incomeTax: number,
  rate: number,
  options?: { zvE?: number; capRatePercent?: number },
): number {
  if (incomeTax <= 0) return 0;
  const standard = incomeTax * (rate / 100);
  if (!options || options.zvE == null || options.capRatePercent == null) {
    return Math.floor(standard);
  }
  const cap = options.zvE * (options.capRatePercent / 100);
  return Math.floor(Math.min(standard, cap));
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
 * Berechnet Gleitzonenentgelt für Midijobs (Übergangsbereich)
 * Formel: F × 556,01 + ([2000 / (2000 – 556,01)] – [556,01 / (2000 – 556,01)] × F) × (Brutto – 556,01)
 */
function calculateMidijobGleitzone(grossMonthly: number): number {
  const { factor, lowerBound, upperBound } = MIDIJOB_2025.formula;
  
  if (grossMonthly <= lowerBound) {
    return grossMonthly;
  }
  
  if (grossMonthly >= upperBound) {
    return grossMonthly;
  }
  
  // Gleitzonenformel anwenden
  const firstTerm = factor * lowerBound;
  const secondTermFactor = (upperBound / (upperBound - lowerBound)) - ((lowerBound / (upperBound - lowerBound)) * factor);
  const secondTerm = secondTermFactor * (grossMonthly - lowerBound);
  
  return firstTerm + secondTerm;
}

/**
 * Berechnet Minijob-Abgaben (nur für Arbeitgeber)
 */
function calculateMinijobContributions(grossMonthly: number): { 
  employeeTax: number; 
  employerContributions: number; 
  netSalary: number;
} {
  // Pauschalsteuer (2% - zahlt normalerweise AG)
  const employeeTax = grossMonthly * MINIJOB_2025.taxRate;
  
  // Arbeitgeber-Beiträge (28% gesamt)
  const employerContributions = grossMonthly * MINIJOB_2025.employerRates.total;
  
  // Arbeitnehmer zahlt normalerweise keine Abgaben (außer opt. RV-Beitrag)
  const netSalary = grossMonthly - (employeeTax); // Falls individual versteuert
  
  return {
    employeeTax,
    employerContributions,
    netSalary: grossMonthly, // Minijobber behält normalerweise das volle Gehalt
  };
}

/**
 * Vollständige Steuer- und Sozialabgabenberechnung
 * ⚠️ HINWEIS: Minijob/Midijob-Berechnung als Auswahloption verfügbar,
 * wird jedoch unter Vorbehalt implementiert, da nicht immer anwendbar
 */
export function calculateCompleteTax(params: TaxCalculationParams): TaxCalculationResult {
  const { grossSalaryYearly, taxClass, childAllowances, churchTax, churchTaxRate, 
          healthInsuranceRate, isEastGermany, isChildless, age, numberOfChildren, employmentType,
          useBesondereLohnsteuertabelle, privateHealthInsuranceMonthly, privateCareInsuranceMonthly,
          year = 2025 } = params;

  const config = getYearConfig(year);
  const grossMonthly = grossSalaryYearly / 12;

  // BESONDERE LOHNSTEUERTABELLE für Beamte / PKV
  if (useBesondereLohnsteuertabelle) {
    const besResult = calculateBesondereLohnsteuer({
      grossMonthly,
      taxClass: parseTaxClass(taxClass),
      childAllowances,
      churchTax,
      churchTaxRate,
      privateHealthInsuranceMonthly,
      privateCareInsuranceMonthly,
    });
    
    return {
      grossYearly: grossSalaryYearly,
      grossMonthly,
      taxableIncome: 0,
      incomeTax: besResult.incomeTax * 12,
      solidarityTax: besResult.solidarityTax * 12,
      churchTax: besResult.churchTax * 12,
      pensionInsurance: 0,
      unemploymentInsurance: 0,
      healthInsurance: (privateHealthInsuranceMonthly ?? 300) * 12,
      careInsurance: (privateCareInsuranceMonthly ?? 50) * 12,
      totalTaxes: besResult.totalTax * 12,
      totalSocialContributions: 0,
      totalDeductions: besResult.totalTax * 12 + ((privateHealthInsuranceMonthly ?? 300) + (privateCareInsuranceMonthly ?? 50)) * 12,
      netYearly: grossSalaryYearly - besResult.totalTax * 12 - ((privateHealthInsuranceMonthly ?? 300) + (privateCareInsuranceMonthly ?? 50)) * 12,
      netMonthly: grossMonthly - besResult.totalTax - (privateHealthInsuranceMonthly ?? 300) - (privateCareInsuranceMonthly ?? 50),
      employerCosts: grossSalaryYearly,
    };
  }

  // ⚠️ SPEZIALBEHANDLUNG: Minijob
  if (employmentType === 'minijob' && grossMonthly <= config.minijob.maxEarnings) {
    const minijobCalc = calculateMinijobContributions(grossMonthly);
    
    return {
      grossYearly: grossSalaryYearly,
      grossMonthly,
      taxableIncome: 0,
      incomeTax: minijobCalc.employeeTax * 12,
      solidarityTax: 0,
      churchTax: 0,
      pensionInsurance: 0,
      unemploymentInsurance: 0,
      healthInsurance: 0,
      careInsurance: 0,
      totalTaxes: minijobCalc.employeeTax * 12,
      totalSocialContributions: 0,
      totalDeductions: minijobCalc.employeeTax * 12,
      netYearly: minijobCalc.netSalary * 12,
      netMonthly: minijobCalc.netSalary,
      employerCosts: (grossMonthly + minijobCalc.employerContributions + minijobCalc.employeeTax) * 12,
    };
  }

  // ⚠️ SPEZIALBEHANDLUNG: Midijob
  if (employmentType === 'midijob' && grossMonthly > config.midijob.minEarnings && grossMonthly <= config.midijob.maxEarnings) {
    const gleitzonenEntgelt = calculateMidijobGleitzone(grossMonthly);
    const gleitzonenEntgeltYearly = gleitzonenEntgelt * 12;
    
    const bbg = getBBGForRegion(isEastGermany, 'yearly', year);

    const pensionBase = Math.min(gleitzonenEntgeltYearly, bbg.pension);
    const pensionInsurance = pensionBase * (config.svRates.pension.employee / 100);

    const unemploymentBase = Math.min(gleitzonenEntgeltYearly, bbg.pension);
    const unemploymentInsurance = unemploymentBase * (config.svRates.unemployment.employee / 100);

    const healthBase = Math.min(gleitzonenEntgeltYearly, bbg.health);
    const healthInsurance = healthBase * (config.svRates.health.employee / 100) + healthBase * (healthInsuranceRate / 2 / 100);

    const careBase = Math.min(gleitzonenEntgeltYearly, bbg.health);
    const careRate = getCareInsuranceRate(isChildless, age, numberOfChildren ?? 0, year);
    const careInsurance = careBase * (careRate.employee / 100);

    const totalSocialContributions = pensionInsurance + unemploymentInsurance + healthInsurance + careInsurance;
    
    const taxClassNumber = parseTaxClass(taxClass);
    const incomeTaxMonthly = calculateLohnsteuerPAP2025(
      grossMonthly, taxClassNumber, childAllowances, isEastGermany,
      healthInsuranceRate, isChildless, age, numberOfChildren ?? 0, year
    );
    const incomeTax = incomeTaxMonthly * 12;
    
    const solidarityTax = calculateSolidarityTax(incomeTax);
    const churchTaxAmount = churchTax ? calculateChurchTax(incomeTax, churchTaxRate) : 0;
    
    const taxableIncome = calculateTaxableIncome(grossSalaryYearly, childAllowances, totalSocialContributions);

    const totalTaxes = incomeTax + solidarityTax + churchTaxAmount;
    const totalDeductions = totalSocialContributions + totalTaxes;
    const netYearly = grossSalaryYearly - totalDeductions;
    
    const employerSocialContributions = Math.min(grossSalaryYearly, bbg.pension) * (config.svRates.pension.employer / 100) +
                                      Math.min(grossSalaryYearly, bbg.pension) * (config.svRates.unemployment.employer / 100) +
                                      Math.min(grossSalaryYearly, bbg.health) * (config.svRates.health.employer / 100) + 
                                      Math.min(grossSalaryYearly, bbg.health) * (healthInsuranceRate / 2 / 100) +
                                      Math.min(grossSalaryYearly, bbg.health) * (careRate.employer / 100);
    
    const employerCosts = grossSalaryYearly + employerSocialContributions;

    return {
      grossYearly: grossSalaryYearly,
      grossMonthly,
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

  // STANDARD-BERECHNUNG für normale sozialversicherungspflichtige Beschäftigung

  const bbg = getBBGForRegion(isEastGermany, 'yearly', year);

  const pensionBase = Math.min(grossSalaryYearly, bbg.pension);
  const pensionInsurance = pensionBase * (config.svRates.pension.employee / 100);

  const unemploymentBase = Math.min(grossSalaryYearly, bbg.pension);
  const unemploymentInsurance = unemploymentBase * (config.svRates.unemployment.employee / 100);

  const healthBase = Math.min(grossSalaryYearly, bbg.health);
  const healthInsurance = healthBase * (config.svRates.health.employee / 100) + healthBase * (healthInsuranceRate / 2 / 100);

  const careBase = Math.min(grossSalaryYearly, bbg.health);
  const careRate = getCareInsuranceRate(isChildless, age, numberOfChildren ?? 0, year);
  const careInsurance = careBase * (careRate.employee / 100);

  const totalSocialContributions = pensionInsurance + unemploymentInsurance + healthInsurance + careInsurance;
  
  const monthlyGross = grossSalaryYearly / 12;
  const taxClassNumber = parseTaxClass(taxClass);
  const incomeTaxMonthly = calculateLohnsteuerPAP2025(
    monthlyGross, taxClassNumber, childAllowances, isEastGermany,
    healthInsuranceRate, isChildless, age, numberOfChildren ?? 0, year
  );
  const incomeTax = incomeTaxMonthly * 12;
  
  const solidarityTax = calculateSolidarityTax(incomeTax);
  const churchTaxAmount = churchTax ? calculateChurchTax(incomeTax, churchTaxRate) : 0;
  
  const taxableIncome = calculateTaxableIncome(grossSalaryYearly, childAllowances, totalSocialContributions);

  const totalTaxes = incomeTax + solidarityTax + churchTaxAmount;
  const totalDeductions = totalSocialContributions + totalTaxes;
  
  const netYearly = grossSalaryYearly - totalDeductions;
  
  const employerSocialContributions = pensionBase * (config.svRates.pension.employer / 100) +
                                    unemploymentBase * (config.svRates.unemployment.employer / 100) +
                                    healthBase * (config.svRates.health.employer / 100) + healthBase * (healthInsuranceRate / 2 / 100) +
                                    careBase * (careRate.employer / 100);
  
  const employerCosts = grossSalaryYearly + employerSocialContributions;

  return {
    grossYearly: grossSalaryYearly,
    grossMonthly: monthlyGross,
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