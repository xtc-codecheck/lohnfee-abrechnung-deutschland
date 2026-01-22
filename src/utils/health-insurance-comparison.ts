// PKV vs. GKV Vergleichsrechner 2025
// Berechnung, Arbeitgeberzuschuss und Langzeit-Prognose

export type InsuranceType = 'gkv' | 'pkv';
export type FamilyStatus = 'single' | 'married' | 'married_children';

export interface HealthInsuranceParams {
  currentAge: number;
  grossMonthly: number;
  insuranceType: InsuranceType;
  // GKV-spezifisch
  gkvAdditionalRate?: number; // Kassenindividueller Zusatzbeitrag
  // PKV-spezifisch
  pkvMonthlyPremium?: number;
  pkvDeductible?: number; // Selbstbehalt pro Jahr
  // Familiensituation
  familyStatus: FamilyStatus;
  spouseIncome?: number; // Einkommen des Partners (für Familienversicherung)
  numberOfChildren?: number;
  // Prognose-Parameter
  expectedSalaryIncrease?: number; // Jährliche Gehaltserhöhung in %
  expectedPkvIncrease?: number; // Jährliche PKV-Beitragserhöhung in %
}

export interface HealthInsuranceResult {
  type: InsuranceType;
  typeName: string;
  monthlyPremium: number;
  employerContribution: number;
  employeeContribution: number;
  yearlyTotal: number;
  details: string[];
}

export interface InsuranceComparison {
  gkv: HealthInsuranceResult;
  pkv: HealthInsuranceResult;
  currentDifference: number; // Positiv = PKV günstiger
  recommendation: {
    type: InsuranceType;
    reason: string;
    warnings: string[];
  };
}

export interface LongTermProjection {
  age: number;
  year: number;
  gkvMonthly: number;
  pkvMonthly: number;
  gkvCumulative: number;
  pkvCumulative: number;
  difference: number;
}

// Konstanten 2025
const GKV_GENERAL_RATE = 14.6; // Allgemeiner Beitragssatz
const GKV_AVERAGE_ADDITIONAL = 1.7; // Durchschnittlicher Zusatzbeitrag
const GKV_BBG_MONTHLY = 5512.50; // Beitragsbemessungsgrenze 2025
const GKV_MAX_EMPLOYER_SUBSIDY = 421.77; // Maximaler AG-Zuschuss zur PKV (50% des GKV-Höchstbeitrags)
const RETIREMENT_AGE = 67;
const PKV_ANNUAL_INCREASE = 3.5; // Durchschnittliche PKV-Beitragssteigerung
const SALARY_ANNUAL_INCREASE = 2.5; // Durchschnittliche Gehaltssteigerung

/**
 * Berechnet den GKV-Beitrag
 */
export function calculateGKVContribution(params: HealthInsuranceParams): HealthInsuranceResult {
  const { grossMonthly, gkvAdditionalRate = GKV_AVERAGE_ADDITIONAL, familyStatus, numberOfChildren = 0 } = params;
  
  // Beitragspflichtiges Einkommen (max. BBG)
  const assessableIncome = Math.min(grossMonthly, GKV_BBG_MONTHLY);
  
  // Gesamtbeitragssatz inkl. Zusatzbeitrag
  const totalRate = GKV_GENERAL_RATE + gkvAdditionalRate;
  
  // Beitrag wird 50:50 geteilt
  const totalPremium = assessableIncome * (totalRate / 100);
  const employeeContribution = totalPremium / 2;
  const employerContribution = totalPremium / 2;
  
  const details: string[] = [
    `Beitragspflichtiges Einkommen: ${formatCurrency(assessableIncome)}`,
    `Allgemeiner Beitragssatz: ${GKV_GENERAL_RATE}%`,
    `Zusatzbeitrag: ${gkvAdditionalRate}%`,
    `Gesamtbeitragssatz: ${totalRate}%`,
  ];
  
  if (familyStatus !== 'single') {
    details.push(`✅ Familienversicherung: Ehepartner und Kinder beitragsfrei mitversichert`);
  }
  
  if (grossMonthly > GKV_BBG_MONTHLY) {
    details.push(`⚠️ Gehalt über BBG: Nur ${formatCurrency(GKV_BBG_MONTHLY)} beitragspflichtig`);
  }
  
  return {
    type: 'gkv',
    typeName: 'Gesetzliche Krankenversicherung',
    monthlyPremium: totalPremium,
    employerContribution,
    employeeContribution,
    yearlyTotal: employeeContribution * 12,
    details,
  };
}

/**
 * Berechnet den PKV-Beitrag mit Arbeitgeberzuschuss
 */
export function calculatePKVContribution(params: HealthInsuranceParams): HealthInsuranceResult {
  const { 
    grossMonthly, 
    pkvMonthlyPremium = 500, 
    pkvDeductible = 600,
    familyStatus,
    numberOfChildren = 0,
    spouseIncome = 0 
  } = params;
  
  // Arbeitgeberzuschuss: 50% des PKV-Beitrags, max. 50% des GKV-Höchstbeitrags
  const maxEmployerSubsidy = GKV_MAX_EMPLOYER_SUBSIDY;
  const employerContribution = Math.min(pkvMonthlyPremium / 2, maxEmployerSubsidy);
  const employeeContribution = pkvMonthlyPremium - employerContribution;
  
  const details: string[] = [
    `PKV-Monatsbeitrag: ${formatCurrency(pkvMonthlyPremium)}`,
    `Selbstbehalt: ${formatCurrency(pkvDeductible)}/Jahr`,
    `AG-Zuschuss (max. ${formatCurrency(maxEmployerSubsidy)}): ${formatCurrency(employerContribution)}`,
  ];
  
  // Zusatzkosten für Familie
  let familyAdditionalCost = 0;
  if (familyStatus === 'married' && spouseIncome < 520) {
    // Ehepartner müsste separat versichert werden
    familyAdditionalCost += pkvMonthlyPremium * 0.8; // Geschätzt 80% des eigenen Tarifs
    details.push(`⚠️ Ehepartner ohne eigenes Einkommen: Eigener PKV-Vertrag nötig (~${formatCurrency(pkvMonthlyPremium * 0.8)}/Monat)`);
  }
  
  if (numberOfChildren > 0) {
    const childCost = 150 * numberOfChildren; // Geschätzt 150€ pro Kind
    familyAdditionalCost += childCost;
    details.push(`⚠️ ${numberOfChildren} Kind(er): Zusatzkosten ~${formatCurrency(childCost)}/Monat`);
  }
  
  if (familyAdditionalCost > 0) {
    details.push(`❌ Keine Familienversicherung in PKV!`);
  }
  
  const totalEmployeeCost = employeeContribution + familyAdditionalCost;
  
  return {
    type: 'pkv',
    typeName: 'Private Krankenversicherung',
    monthlyPremium: pkvMonthlyPremium + familyAdditionalCost,
    employerContribution,
    employeeContribution: totalEmployeeCost,
    yearlyTotal: totalEmployeeCost * 12 + pkvDeductible,
    details,
  };
}

/**
 * Vergleicht GKV und PKV
 */
export function compareInsurance(params: HealthInsuranceParams): InsuranceComparison {
  const gkv = calculateGKVContribution(params);
  const pkv = calculatePKVContribution(params);
  
  const currentDifference = gkv.employeeContribution - pkv.employeeContribution;
  
  const warnings: string[] = [];
  let recommendationType: InsuranceType = 'gkv';
  let reason = '';
  
  // Warnungen
  if (params.currentAge > 45) {
    warnings.push('Ab 45 wird Rückkehr in GKV sehr schwierig!');
  }
  
  if (params.currentAge > 55) {
    warnings.push('Ab 55 ist Rückkehr in GKV praktisch unmöglich!');
  }
  
  if (params.familyStatus !== 'single') {
    warnings.push('Familienversicherung nur in GKV - PKV erfordert separate Verträge für jeden.');
  }
  
  // Empfehlung
  if (currentDifference > 100 && params.currentAge < 35 && params.familyStatus === 'single') {
    recommendationType = 'pkv';
    reason = 'PKV bietet aktuell besseres Preis-Leistungs-Verhältnis. Als junger Single profitieren Sie von niedrigen Einstiegstarifen.';
  } else if (params.familyStatus !== 'single') {
    recommendationType = 'gkv';
    reason = 'Die beitragsfreie Familienversicherung der GKV ist bei Familien meist günstiger.';
  } else if (params.currentAge > 45) {
    recommendationType = 'gkv';
    reason = 'Ab Mitte 40 steigen PKV-Beiträge stark. Bleiben Sie bei der GKV für mehr Planungssicherheit.';
  } else {
    recommendationType = 'gkv';
    reason = 'Die GKV bietet mehr Flexibilität und kalkulierbare Beiträge im Alter.';
  }
  
  return {
    gkv,
    pkv,
    currentDifference,
    recommendation: {
      type: recommendationType,
      reason,
      warnings,
    },
  };
}

/**
 * Berechnet Langzeit-Prognose über Jahre hinweg
 */
export function projectLongTermCosts(
  params: HealthInsuranceParams,
  yearsToProject: number = 30
): LongTermProjection[] {
  const { 
    currentAge, 
    grossMonthly,
    pkvMonthlyPremium = 500,
    expectedSalaryIncrease = SALARY_ANNUAL_INCREASE,
    expectedPkvIncrease = PKV_ANNUAL_INCREASE,
  } = params;
  
  const projections: LongTermProjection[] = [];
  
  let currentSalary = grossMonthly;
  let currentPkvPremium = pkvMonthlyPremium;
  let gkvCumulative = 0;
  let pkvCumulative = 0;
  
  const currentYear = new Date().getFullYear();
  
  for (let year = 0; year <= yearsToProject; year++) {
    const age = currentAge + year;
    
    // GKV-Beitrag basierend auf Gehalt (max. BBG)
    const assessableIncome = Math.min(currentSalary, GKV_BBG_MONTHLY * (1 + expectedSalaryIncrease / 100) ** year);
    const gkvMonthly = (assessableIncome * (GKV_GENERAL_RATE + GKV_AVERAGE_ADDITIONAL) / 100) / 2;
    
    // PKV-Beitrag steigt unabhängig vom Gehalt
    const pkvMonthly = currentPkvPremium * (1 + expectedPkvIncrease / 100) ** year;
    
    // AG-Zuschuss bei PKV
    const pkvEmployeeShare = Math.max(pkvMonthly - GKV_MAX_EMPLOYER_SUBSIDY, pkvMonthly / 2);
    
    gkvCumulative += gkvMonthly * 12;
    pkvCumulative += pkvEmployeeShare * 12;
    
    projections.push({
      age,
      year: currentYear + year,
      gkvMonthly,
      pkvMonthly: pkvEmployeeShare,
      gkvCumulative,
      pkvCumulative,
      difference: gkvCumulative - pkvCumulative,
    });
    
    // Gehalt erhöhen für nächstes Jahr
    currentSalary *= (1 + expectedSalaryIncrease / 100);
  }
  
  return projections;
}

/**
 * Berechnet den Break-Even-Punkt (wann PKV teurer wird als GKV)
 */
export function findBreakEvenPoint(projections: LongTermProjection[]): {
  age: number | null;
  year: number | null;
  message: string;
} {
  // Suche den Punkt, wo PKV kumulativ teurer wird
  for (let i = 1; i < projections.length; i++) {
    const prev = projections[i - 1];
    const curr = projections[i];
    
    // Wenn Differenz von positiv zu negativ wechselt (GKV war günstiger, jetzt PKV)
    // oder umgekehrt
    if (prev.difference > 0 && curr.difference <= 0) {
      return {
        age: curr.age,
        year: curr.year,
        message: `Ab Alter ${curr.age} (Jahr ${curr.year}) wird die GKV kumulativ günstiger als die PKV.`,
      };
    }
  }
  
  const lastProjection = projections[projections.length - 1];
  if (lastProjection.difference > 0) {
    return {
      age: null,
      year: null,
      message: 'Die PKV bleibt im gesamten Prognosezeitraum günstiger als die GKV.',
    };
  } else {
    return {
      age: null,
      year: null,
      message: 'Die GKV ist bereits jetzt günstiger als die PKV.',
    };
  }
}

// Hilfsfunktion
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
