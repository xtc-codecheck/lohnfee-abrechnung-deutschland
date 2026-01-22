// Betriebliche Altersvorsorge (bAV) Berechnungen 2025
// Entgeltumwandlung, Steuer- und SV-Ersparnis, Rentenprognose

export type BavType = 'direktversicherung' | 'pensionskasse' | 'pensionsfonds' | 'unterstuetzungskasse' | 'direktzusage';

export interface BavParams {
  grossMonthly: number;
  contributionMonthly: number; // Monatlicher Umwandlungsbetrag
  employerContribution?: number; // Arbeitgeberzuschuss (seit 2022: mind. 15%)
  bavType: BavType;
  taxClass: string;
  churchTax: boolean;
  age: number;
  retirementAge?: number;
  expectedReturn?: number; // Erwartete Rendite p.a.
}

export interface BavResult {
  contributionMonthly: number;
  contributionYearly: number;
  employerContribution: number;
  totalContribution: number;
  
  // Ersparnisse
  taxSavingsMonthly: number;
  socialSecuritySavingsMonthly: number;
  totalSavingsMonthly: number;
  
  // Netto-Effekt
  netReductionMonthly: number; // Was weniger Netto ankommt
  effectiveCost: number; // Echte Kosten (nach Ersparnissen)
  savingsRatio: number; // % der Ersparnis
  
  // Grenzen
  taxFreeLimit: number;
  socialSecurityFreeLimit: number;
  isWithinTaxLimit: boolean;
  isWithinSocialSecurityLimit: boolean;
  
  details: string[];
}

export interface PensionProjection {
  yearsToRetirement: number;
  totalContributions: number;
  projectedCapital: number;
  monthlyPension: number; // Geschätzte monatliche Rente
  details: string[];
}

// Konstanten 2025
const BAV_TAX_FREE_LIMIT = 604; // 8% der BBG RV (West) = 604€/Monat
const BAV_SV_FREE_LIMIT = 302; // 4% der BBG RV (West) = 302€/Monat
const BBG_RV_WEST_MONTHLY = 7550; // Beitragsbemessungsgrenze RV West 2025
const EMPLOYER_MIN_SUBSIDY = 0.15; // 15% Pflichtzuschuss seit 2022
const DEFAULT_RETURN_RATE = 0.03; // 3% konservative Rendite
const ANNUITY_FACTOR = 0.004; // Vereinfachter Rentenfaktor

// Sozialversicherungssätze (Arbeitnehmeranteil)
const SV_RATES = {
  pension: 9.3, // Rentenversicherung
  unemployment: 1.3, // Arbeitslosenversicherung
  health: 7.3, // Krankenversicherung + Zusatzbeitrag
  care: 1.875, // Pflegeversicherung (mit Zuschlag)
};

/**
 * Berechnet Steuerersparnis durch Entgeltumwandlung
 */
function estimateTaxSavings(
  contributionMonthly: number,
  grossMonthly: number,
  taxClass: string,
  churchTax: boolean
): number {
  // Vereinfachte Grenzsteuerberechnung
  const yearlyGross = grossMonthly * 12;
  let marginalRate = 0;
  
  // Grenzsteuersätze nach Einkommenshöhe (vereinfacht)
  if (yearlyGross <= 11604) {
    marginalRate = 0;
  } else if (yearlyGross <= 17005) {
    marginalRate = 0.14;
  } else if (yearlyGross <= 66760) {
    marginalRate = 0.24 + (yearlyGross - 17005) * 0.0001; // Progressiv bis 42%
  } else if (yearlyGross <= 277825) {
    marginalRate = 0.42;
  } else {
    marginalRate = 0.45;
  }
  
  // Soli (wenn anwendbar) und Kirchensteuer
  let effectiveRate = marginalRate;
  if (marginalRate > 0.35) {
    effectiveRate *= 1.055; // 5,5% Soli
  }
  if (churchTax) {
    effectiveRate *= 1.09; // ~9% Kirchensteuer
  }
  
  // Steuerfreier Anteil bis Grenze
  const taxFreeContribution = Math.min(contributionMonthly, BAV_TAX_FREE_LIMIT);
  
  return taxFreeContribution * effectiveRate;
}

/**
 * Berechnet SV-Ersparnis durch Entgeltumwandlung
 */
function calculateSocialSecuritySavings(
  contributionMonthly: number,
  grossMonthly: number
): number {
  // SV-freier Anteil bis Grenze
  const svFreeContribution = Math.min(contributionMonthly, BAV_SV_FREE_LIMIT);
  
  // Gesamter SV-Satz (Arbeitnehmeranteil)
  const totalSvRate = (SV_RATES.pension + SV_RATES.unemployment + SV_RATES.health + SV_RATES.care) / 100;
  
  return svFreeContribution * totalSvRate;
}

/**
 * Hauptberechnung bAV
 */
export function calculateBav(params: BavParams): BavResult {
  const {
    grossMonthly,
    contributionMonthly,
    employerContribution = contributionMonthly * EMPLOYER_MIN_SUBSIDY,
    bavType,
    taxClass,
    churchTax,
  } = params;
  
  const totalContribution = contributionMonthly + employerContribution;
  
  // Ersparnisse berechnen
  const taxSavingsMonthly = estimateTaxSavings(contributionMonthly, grossMonthly, taxClass, churchTax);
  const socialSecuritySavingsMonthly = calculateSocialSecuritySavings(contributionMonthly, grossMonthly);
  const totalSavingsMonthly = taxSavingsMonthly + socialSecuritySavingsMonthly;
  
  // Netto-Reduktion = Brutto-Umwandlung - Ersparnisse
  const netReductionMonthly = contributionMonthly - totalSavingsMonthly;
  const effectiveCost = netReductionMonthly;
  const savingsRatio = (totalSavingsMonthly / contributionMonthly) * 100;
  
  // Grenzen prüfen
  const isWithinTaxLimit = contributionMonthly <= BAV_TAX_FREE_LIMIT;
  const isWithinSocialSecurityLimit = contributionMonthly <= BAV_SV_FREE_LIMIT;
  
  const bavTypeNames: Record<BavType, string> = {
    direktversicherung: 'Direktversicherung',
    pensionskasse: 'Pensionskasse',
    pensionsfonds: 'Pensionsfonds',
    unterstuetzungskasse: 'Unterstützungskasse',
    direktzusage: 'Direktzusage',
  };
  
  const details: string[] = [
    `bAV-Art: ${bavTypeNames[bavType]}`,
    `Eigenbeitrag: ${formatCurrency(contributionMonthly)}/Monat`,
    `AG-Zuschuss (mind. 15%): ${formatCurrency(employerContribution)}/Monat`,
    `Gesamtbeitrag: ${formatCurrency(totalContribution)}/Monat`,
    ``,
    `Steuerersparnis: ${formatCurrency(taxSavingsMonthly)}/Monat`,
    `SV-Ersparnis: ${formatCurrency(socialSecuritySavingsMonthly)}/Monat`,
    `Gesamtersparnis: ${formatCurrency(totalSavingsMonthly)}/Monat (${savingsRatio.toFixed(0)}%)`,
    ``,
    `Netto-Reduktion: nur ${formatCurrency(netReductionMonthly)}/Monat`,
    `Effektiver Beitrag: ${formatCurrency(totalContribution)} für nur ${formatCurrency(effectiveCost)} Netto-Kosten`,
  ];
  
  if (!isWithinTaxLimit) {
    details.push(`⚠️ Beitrag über steuerfreier Grenze (${formatCurrency(BAV_TAX_FREE_LIMIT)})`);
  }
  
  if (!isWithinSocialSecurityLimit) {
    details.push(`⚠️ Beitrag über SV-freier Grenze (${formatCurrency(BAV_SV_FREE_LIMIT)})`);
  }
  
  return {
    contributionMonthly,
    contributionYearly: contributionMonthly * 12,
    employerContribution,
    totalContribution,
    
    taxSavingsMonthly,
    socialSecuritySavingsMonthly,
    totalSavingsMonthly,
    
    netReductionMonthly,
    effectiveCost,
    savingsRatio,
    
    taxFreeLimit: BAV_TAX_FREE_LIMIT,
    socialSecurityFreeLimit: BAV_SV_FREE_LIMIT,
    isWithinTaxLimit,
    isWithinSocialSecurityLimit,
    
    details,
  };
}

/**
 * Berechnet optimalen bAV-Beitrag
 */
export function calculateOptimalContribution(
  grossMonthly: number,
  targetSavingsRatio: number = 0.5 // Ziel: 50% Ersparnis
): {
  optimalContribution: number;
  maxTaxFree: number;
  maxSvFree: number;
  recommendation: string;
} {
  // Optimal ist meist bis zur SV-Grenze, da hier beide Ersparnisse greifen
  const maxSvFree = BAV_SV_FREE_LIMIT;
  const maxTaxFree = BAV_TAX_FREE_LIMIT;
  
  // Empfehlung basiert auf Gehaltshöhe
  let optimalContribution = maxSvFree;
  let recommendation = '';
  
  if (grossMonthly < 3000) {
    optimalContribution = Math.min(grossMonthly * 0.04, maxSvFree);
    recommendation = `Bei Ihrem Gehalt empfehlen wir max. 4% Umwandlung (${formatCurrency(optimalContribution)}) für optimale Ersparnis.`;
  } else if (grossMonthly < 5000) {
    optimalContribution = maxSvFree;
    recommendation = `Optimal: ${formatCurrency(maxSvFree)}/Monat – volle SV-Ersparnis bei moderater Netto-Reduktion.`;
  } else {
    optimalContribution = maxTaxFree;
    recommendation = `Bei höherem Einkommen lohnt sich die volle Ausschöpfung bis ${formatCurrency(maxTaxFree)}/Monat.`;
  }
  
  return {
    optimalContribution,
    maxTaxFree,
    maxSvFree,
    recommendation,
  };
}

/**
 * Berechnet Rentenprognose
 */
export function projectPension(params: BavParams): PensionProjection {
  const {
    contributionMonthly,
    employerContribution = contributionMonthly * EMPLOYER_MIN_SUBSIDY,
    age,
    retirementAge = 67,
    expectedReturn = DEFAULT_RETURN_RATE,
  } = params;
  
  const yearsToRetirement = retirementAge - age;
  const monthsToRetirement = yearsToRetirement * 12;
  const totalContribution = contributionMonthly + employerContribution;
  
  // Berechnung mit Zinseszins
  // FV = PMT × ((1 + r)^n - 1) / r
  const monthlyReturn = expectedReturn / 12;
  let projectedCapital = 0;
  
  if (monthlyReturn > 0) {
    projectedCapital = totalContribution * 
      ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
  } else {
    projectedCapital = totalContribution * monthsToRetirement;
  }
  
  const totalContributions = totalContribution * monthsToRetirement;
  
  // Geschätzte monatliche Rente (vereinfachter Rentenfaktor)
  const monthlyPension = projectedCapital * ANNUITY_FACTOR;
  
  const details: string[] = [
    `Jahre bis Rente: ${yearsToRetirement}`,
    `Monatliche Einzahlung: ${formatCurrency(totalContribution)}`,
    `Gesamteinzahlungen: ${formatCurrency(totalContributions)}`,
    `Erwartete Rendite: ${(expectedReturn * 100).toFixed(1)}% p.a.`,
    `Prognostiziertes Kapital: ${formatCurrency(projectedCapital)}`,
    `Geschätzte Monatsrente: ${formatCurrency(monthlyPension)}`,
    ``,
    `⚠️ Vereinfachte Prognose ohne Garantie`,
  ];
  
  return {
    yearsToRetirement,
    totalContributions,
    projectedCapital,
    monthlyPension,
    details,
  };
}

// Hilfsfunktion
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
