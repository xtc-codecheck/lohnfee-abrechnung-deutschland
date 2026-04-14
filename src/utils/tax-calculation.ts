// Exakte deutsche Steuerberechnung nach § 32a EStG 2025
// Programmablaufplan (PAP) 2025 des Bundesministeriums der Finanzen
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
  numberOfChildren?: number; // Für PV-Kinderabschläge (seit 07/2023)
  employmentType?: 'minijob' | 'midijob' | 'fulltime' | 'parttime'; // für spezielle Behandlung
  useBesondereLohnsteuertabelle?: boolean; // Besondere Tabelle für Beamte/PKV
  privateHealthInsuranceMonthly?: number; // PKV-Basisbeitrag (nur bei besonderer Tabelle)
  privateCareInsuranceMonthly?: number; // PPV-Beitrag (nur bei besonderer Tabelle)
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

// ============= PAP 2025: Tarifliche Einkommensteuer nach § 32a EStG =============

/**
 * Berechnet die tarifliche Einkommensteuer nach § 32a EStG 2025
 * Exakte Formel aus dem Programmablaufplan (PAP) des BMF
 * 
 * Tarif 2025:
 * Zone 1: 0 € bis 12.096 € → 0 €
 * Zone 2: 12.097 € bis 17.443 € → (932,30 × y + 1.400) × y mit y = (zvE − 12.096) / 10.000
 * Zone 3: 17.444 € bis 68.480 € → (176,64 × z + 2.397) × z + 1.015,13 mit z = (zvE − 17.443) / 10.000
 * Zone 4: 68.481 € bis 277.825 € → 0,42 × zvE − 10.911,92
 * Zone 5: ab 277.826 € → 0,45 × zvE − 19.246,67
 */
export function calculateTariflicheEStPAP2025(zvE: number): number {
  if (zvE <= 0) return 0;
  
  // Auf ganze Euro abrunden (§ 32a Abs. 1 S. 6 EStG)
  zvE = Math.floor(zvE);
  
  if (zvE <= TAX_ALLOWANCES_2025.basicAllowance) return 0;

  const { progressionZone1, progressionZone2, proportionalZone1, proportionalZone2 } = TAX_RATES_2025;

  if (zvE <= progressionZone1.to) {
    const y = (zvE - TAX_ALLOWANCES_2025.basicAllowance) / 10000;
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
 * nach § 39b Abs. 2 Satz 5 Nr. 3 EStG (PAP 2025)
 * 
 * Bestandteile:
 * 1. VSP1: Teilbetrag Rentenversicherung (AN-Anteil, begrenzt auf BBG)
 * 2. VSP2: Pauschaler Ansatz = min(12% × Brutto, Höchstbetrag 1.900/3.000 €)
 * 3. VSP3: Tatsächliche KV-Basis + PV (AN-Anteil)
 * 4. VSPN = VSP1 + max(VSP2, VSP3) — der höhere der beiden Teilbeträge wird genommen
 */
function calculateVorsorgepauschaleAllgemein(
  grossYearly: number,
  taxClass: number,
  isEastGermany: boolean,
  healthInsuranceAdditionalRate: number,
  isChildless: boolean,
  age: number,
  numberOfChildren: number
): number {
  const bbg = getBBGForRegion(isEastGermany, 'yearly');
  
  // VSP1: Teilbetrag Rentenversicherung (voller AN-Anteil, 2025: 100% absetzbar)
  const rvBasis = Math.min(grossYearly, bbg.pension);
  const vsp1 = rvBasis * (SOCIAL_INSURANCE_RATES_2025.pension.employee / 100);
  
  // VSP2: Pauschaler Ansatz (12% des Bruttos, max. 1.900/3.000 €)
  const hoechstbetrag = taxClass === 3 ? 3000 : 1900;
  const vsp2 = Math.min(grossYearly * 0.12, hoechstbetrag);
  
  // VSP3: Tatsächliche KV-Basisbeiträge + PV
  const kvBasis = Math.min(grossYearly, bbg.health);
  
  // KV: Grundbeitrag AN + halber Zusatzbeitrag (ohne Krankengeldanteil: Faktor 0.96)
  const kvAN = kvBasis * (SOCIAL_INSURANCE_RATES_2025.health.employee / 100) * 0.96
    + kvBasis * (healthInsuranceAdditionalRate / 2 / 100) * 0.96;
  
  // PV: AN-Anteil (inkl. Kinderlosenzuschlag/Kinderabschläge)
  const careRate = getCareInsuranceRate(isChildless, age, numberOfChildren);
  const pvAN = kvBasis * (careRate.employee / 100);
  
  const vsp3 = kvAN + pvAN;
  
  // PAP 2025: Der HÖHERE der beiden Teilbeträge wird genommen
  return vsp1 + Math.max(vsp2, vsp3);
}

// ============= PAP 2025: Lohnsteuer-Berechnung (Allgemeine Tabelle) =============

/**
 * Berechnet die monatliche Lohnsteuer nach PAP 2025 (Allgemeine Tabelle)
 * 
 * Ablauf:
 * 1. Jahres-Brutto hochrechnen
 * 2. Werbungskostenpauschale abziehen  
 * 3. Sonderausgabenpauschale abziehen
 * 4. Vorsorgepauschale (SV-basiert) abziehen
 * 5. → zu versteuerndes Einkommen (zvE)
 * 6. Steuerklassenanpassung (Splitting, Entlastung, etc.)
 * 7. Tarifliche ESt nach § 32a
 * 8. Auf Monat umrechnen
 */
function calculateLohnsteuerPAP2025(
  grossMonthly: number,
  taxClass: number,
  childAllowances: number = 0,
  isEastGermany: boolean = false,
  healthInsuranceAdditionalRate: number = 1.7,
  isChildless: boolean = true,
  age: number = 30,
  numberOfChildren: number = 0
): number {
  if (grossMonthly <= 0) return 0;
  
  const grossYearly = grossMonthly * 12;
  
  // Abzüge für zvE
  const werbungskosten = TAX_ALLOWANCES_2025.workRelatedExpenses;
  const sonderausgaben = TAX_ALLOWANCES_2025.specialExpenses;
  const vorsorgepauschale = calculateVorsorgepauschaleAllgemein(
    grossYearly, taxClass, isEastGermany, 
    healthInsuranceAdditionalRate, isChildless, age, numberOfChildren
  );
  
  let zvE: number;
  let est: number;
  
  switch (taxClass) {
    case 1:
    case 4:
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
      est = calculateTariflicheEStPAP2025(Math.max(0, zvE));
      break;
    case 2: {
      // Entlastungsbetrag Alleinerziehende: 4.260 € + 240 € je weiteres Kind
      const entlastung = 4260 + Math.max(0, childAllowances - 1) * 240;
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale - entlastung;
      est = calculateTariflicheEStPAP2025(Math.max(0, zvE));
      break;
    }
    case 3:
      // Splittingverfahren: zvE halbieren, ESt berechnen, verdoppeln
      // StKl III: doppelte Pauschalen
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
      est = calculateTariflicheEStPAP2025(Math.max(0, Math.floor(zvE / 2))) * 2;
      break;
    case 5:
      // StKl V: Vergleichsberechnung nach PAP 2025
      // Der Grundfreibetrag wird beim StKl III-Partner verbraucht
      // Formel: EST_V = 2 * EST(zvE) - 2 * EST(zvE/2)
      // Dies ergibt: StKl III + StKl V ≈ 2 × StKl IV (bei gleichem Einkommen)
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
      est = 2 * calculateTariflicheEStPAP2025(Math.max(0, zvE)) 
          - 2 * calculateTariflicheEStPAP2025(Math.max(0, Math.floor(zvE / 2)));
      break;
    case 6:
      // StKl VI: keine Werbungskosten/Sonderausgaben, nur Vorsorgepauschale
      // Vergleichsberechnung wie StKl V, aber ohne WK/SA
      zvE = grossYearly - vorsorgepauschale;
      est = 2 * calculateTariflicheEStPAP2025(Math.max(0, zvE)) 
          - 2 * calculateTariflicheEStPAP2025(Math.max(0, Math.floor(zvE / 2)));
      break;
    default:
      zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
      est = calculateTariflicheEStPAP2025(Math.max(0, zvE));
  }
  
  // Monatliche Lohnsteuer: auf Cent abrunden
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
 */
export function calculateSolidarityTax(incomeTax: number): number {
  // Negative Steuern ablehnen
  if (incomeTax <= 0) return 0;
  
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
  if (incomeTax <= 0) return 0;
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
          useBesondereLohnsteuertabelle, privateHealthInsuranceMonthly, privateCareInsuranceMonthly } = params;

  const grossMonthly = grossSalaryYearly / 12;

  // BESONDERE LOHNSTEUERTABELLE für Beamte / PKV
  if (useBesondereLohnsteuertabelle) {
    const besResult = calculateBesondereLohnsteuer({
      grossMonthly,
      taxClass: parseInt(taxClass) || 1,
      childAllowances,
      churchTax,
      churchTaxRate,
      privateHealthInsuranceMonthly,
      privateCareInsuranceMonthly,
    });
    
    // Keine SV-Beiträge für Beamte/PKV-Versicherte
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
      totalSocialContributions: 0, // Keine GKV-Beiträge
      totalDeductions: besResult.totalTax * 12 + ((privateHealthInsuranceMonthly ?? 300) + (privateCareInsuranceMonthly ?? 50)) * 12,
      netYearly: grossSalaryYearly - besResult.totalTax * 12 - ((privateHealthInsuranceMonthly ?? 300) + (privateCareInsuranceMonthly ?? 50)) * 12,
      netMonthly: grossMonthly - besResult.totalTax - (privateHealthInsuranceMonthly ?? 300) - (privateCareInsuranceMonthly ?? 50),
      employerCosts: grossSalaryYearly, // Keine AG-SV-Anteile bei Beamten
    };
  }

  // ⚠️ SPEZIALBEHANDLUNG: Minijob (unter Vorbehalt)
  if (employmentType === 'minijob' && grossMonthly <= MINIJOB_2025.maxEarnings) {
    const minijobCalc = calculateMinijobContributions(grossMonthly);
    
    return {
      grossYearly: grossSalaryYearly,
      grossMonthly,
      taxableIncome: 0, // Pauschal versteuert
      incomeTax: minijobCalc.employeeTax * 12,
      solidarityTax: 0,
      churchTax: 0,
      pensionInsurance: 0, // Optional für AN
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

  // ⚠️ SPEZIALBEHANDLUNG: Midijob (unter Vorbehalt)  
  if (employmentType === 'midijob' && grossMonthly > MIDIJOB_2025.minEarnings && grossMonthly <= MIDIJOB_2025.maxEarnings) {
    // Reduzierte Sozialabgaben durch Gleitzonenformel
    const gleitzonenEntgelt = calculateMidijobGleitzone(grossMonthly);
    const gleitzonenEntgeltYearly = gleitzonenEntgelt * 12;
    
    // Beitragsbemessungsgrenzen
    const bbg = getBBGForRegion(isEastGermany, 'yearly');

    // Reduzierte Sozialversicherungsbeiträge basierend auf Gleitzonenentgelt
    const pensionBase = Math.min(gleitzonenEntgeltYearly, bbg.pension);
    const pensionInsurance = pensionBase * (SOCIAL_INSURANCE_RATES_2025.pension.employee / 100);

    const unemploymentBase = Math.min(gleitzonenEntgeltYearly, bbg.pension);
    const unemploymentInsurance = unemploymentBase * (SOCIAL_INSURANCE_RATES_2025.unemployment.employee / 100);

    const healthBase = Math.min(gleitzonenEntgeltYearly, bbg.health);
    const healthInsurance = healthBase * (SOCIAL_INSURANCE_RATES_2025.health.employee / 100) + healthBase * (healthInsuranceRate / 2 / 100);

    const careBase = Math.min(gleitzonenEntgeltYearly, bbg.health);
    const careRate = getCareInsuranceRate(isChildless, age, numberOfChildren ?? 0);
    const careInsurance = careBase * (careRate.employee / 100);

    const totalSocialContributions = pensionInsurance + unemploymentInsurance + healthInsurance + careInsurance;
    
    // Lohnsteuer nach PAP 2025
    const taxClassNumber = parseInt(taxClass) || 1;
    const incomeTaxMonthly = calculateLohnsteuerPAP2025(
      grossMonthly, taxClassNumber, childAllowances, isEastGermany,
      healthInsuranceRate, isChildless, age, numberOfChildren ?? 0
    );
    const incomeTax = incomeTaxMonthly * 12;
    
    const solidarityTax = calculateSolidarityTax(incomeTax);
    const churchTaxAmount = churchTax ? calculateChurchTax(incomeTax, churchTaxRate) : 0;
    
    const taxableIncome = calculateTaxableIncome(grossSalaryYearly, childAllowances, totalSocialContributions);

    const totalTaxes = incomeTax + solidarityTax + churchTaxAmount;
    const totalDeductions = totalSocialContributions + totalTaxes;
    const netYearly = grossSalaryYearly - totalDeductions;
    
    // Arbeitgeberkosten (normale Beiträge auf volles Gehalt)
    const employerSocialContributions = Math.min(grossSalaryYearly, bbg.pension) * (SOCIAL_INSURANCE_RATES_2025.pension.employer / 100) +
                                      Math.min(grossSalaryYearly, bbg.pension) * (SOCIAL_INSURANCE_RATES_2025.unemployment.employer / 100) +
                                      Math.min(grossSalaryYearly, bbg.health) * (SOCIAL_INSURANCE_RATES_2025.health.employer / 100) + 
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
  const careRate = getCareInsuranceRate(isChildless, age, numberOfChildren ?? 0);
  const careInsurance = careBase * (careRate.employee / 100);

  // Zuerst Sozialversicherung berechnen für korrekte Vorsorgepauschale
  const totalSocialContributions = pensionInsurance + unemploymentInsurance + healthInsurance + careInsurance;
  
  // Lohnsteuer nach PAP 2025 (formelbasiert)
  const monthlyGross = grossSalaryYearly / 12;
  const taxClassNumber = parseInt(taxClass) || 1;
  const incomeTaxMonthly = calculateLohnsteuerPAP2025(
    monthlyGross, taxClassNumber, childAllowances, isEastGermany,
    healthInsuranceRate, isChildless, age, numberOfChildren ?? 0
  );
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