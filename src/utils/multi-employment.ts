// Mehrfachbeschäftigung - Lohnabrechnung 2025
// BBG-Verteilung, Hauptarbeitgeber-Ermittlung, Steuerklasse VI

export interface Employment {
  id: string;
  employerName: string;
  grossMonthly: number;
  hoursPerWeek: number;
  isMainEmployment: boolean;
  taxClass: string;
  startDate: Date;
}

export interface MultiEmploymentParams {
  employments: Employment[];
  currentAge: number;
  isChildless: boolean;
  isEastGermany: boolean;
}

export interface MultiEmploymentResult {
  totalGross: number;
  totalNet: number;
  mainEmployment: Employment | null;
  
  employmentDetails: EmploymentDetail[];
  
  socialSecurityDistribution: {
    totalAssessable: number;
    totalContributions: number;
    byEmployment: SocialSecurityShare[];
  };
  
  warnings: string[];
  details: string[];
}

export interface EmploymentDetail {
  employment: Employment;
  taxClass: string;
  grossMonthly: number;
  netMonthly: number;
  socialSecurityEmployee: number;
  socialSecurityEmployer: number;
  incomeTax: number;
}

export interface SocialSecurityShare {
  employmentId: string;
  employerName: string;
  gross: number;
  sharePercent: number;
  pensionEmployee: number;
  pensionEmployer: number;
  healthEmployee: number;
  healthEmployer: number;
  careEmployee: number;
  careEmployer: number;
  unemploymentEmployee: number;
  unemploymentEmployer: number;
}

// Beitragsbemessungsgrenzen 2025
const BBG_RV_WEST = 7550; // Renten-/Arbeitslosenversicherung West
const BBG_RV_EAST = 7450; // Renten-/Arbeitslosenversicherung Ost
const BBG_KV = 5512.50; // Kranken-/Pflegeversicherung

// Sozialversicherungssätze 2025
const SV_RATES = {
  pension: { employee: 9.3, employer: 9.3 },
  health: { employee: 7.3, employer: 7.3, additional: 1.7 }, // inkl. durchschn. Zusatzbeitrag
  care: { employee: 1.7, employer: 1.7, childlessSurcharge: 0.6 },
  unemployment: { employee: 1.3, employer: 1.3 },
};

/**
 * Ermittelt den Hauptarbeitgeber
 * Hauptarbeitgeber = höchstes Einkommen oder längste Beschäftigung
 */
export function identifyMainEmployer(employments: Employment[]): Employment | null {
  if (employments.length === 0) return null;
  if (employments.length === 1) return employments[0];
  
  // Sortieren nach Gehalt (absteigend), dann nach Startdatum (aufsteigend)
  const sorted = [...employments].sort((a, b) => {
    if (b.grossMonthly !== a.grossMonthly) {
      return b.grossMonthly - a.grossMonthly;
    }
    return a.startDate.getTime() - b.startDate.getTime();
  });
  
  return sorted[0];
}

/**
 * Verteilt die Beitragsbemessungsgrenze anteilig
 */
export function distributeBBG(
  employments: Employment[],
  bbg: number
): Map<string, { gross: number; assessable: number; sharePercent: number }> {
  const totalGross = employments.reduce((sum, e) => sum + e.grossMonthly, 0);
  const distribution = new Map<string, { gross: number; assessable: number; sharePercent: number }>();
  
  if (totalGross <= bbg) {
    // Unter BBG: Volle Beiträge auf alles
    employments.forEach(e => {
      distribution.set(e.id, {
        gross: e.grossMonthly,
        assessable: e.grossMonthly,
        sharePercent: (e.grossMonthly / totalGross) * 100,
      });
    });
  } else {
    // Über BBG: Anteilige Verteilung
    employments.forEach(e => {
      const share = e.grossMonthly / totalGross;
      const assessable = bbg * share;
      distribution.set(e.id, {
        gross: e.grossMonthly,
        assessable,
        sharePercent: share * 100,
      });
    });
  }
  
  return distribution;
}

/**
 * Berechnet Sozialversicherungsbeiträge für eine Beschäftigung
 */
export function calculateSocialSecurityShare(
  employment: Employment,
  assessable: number,
  isChildless: boolean
): SocialSecurityShare {
  // Berechnung der Beiträge
  const pensionEmployee = assessable * (SV_RATES.pension.employee / 100);
  const pensionEmployer = assessable * (SV_RATES.pension.employer / 100);
  
  const healthRate = SV_RATES.health.employee + (SV_RATES.health.additional / 2);
  const healthEmployee = Math.min(assessable, BBG_KV) * (healthRate / 100);
  const healthEmployer = Math.min(assessable, BBG_KV) * ((SV_RATES.health.employer + SV_RATES.health.additional / 2) / 100);
  
  const careRate = SV_RATES.care.employee + (isChildless ? SV_RATES.care.childlessSurcharge : 0);
  const careEmployee = Math.min(assessable, BBG_KV) * (careRate / 100);
  const careEmployer = Math.min(assessable, BBG_KV) * (SV_RATES.care.employer / 100);
  
  const unemploymentEmployee = assessable * (SV_RATES.unemployment.employee / 100);
  const unemploymentEmployer = assessable * (SV_RATES.unemployment.employer / 100);
  
  return {
    employmentId: employment.id,
    employerName: employment.employerName,
    gross: employment.grossMonthly,
    sharePercent: 0, // Wird später gesetzt
    pensionEmployee,
    pensionEmployer,
    healthEmployee,
    healthEmployer,
    careEmployee,
    careEmployer,
    unemploymentEmployee,
    unemploymentEmployer,
  };
}

/**
 * Berechnet Steuerklasse für Nebenbeschäftigung
 * Nebenjobs müssen mit Steuerklasse VI abgerechnet werden
 */
export function assignTaxClasses(
  employments: Employment[],
  mainEmployment: Employment | null
): Map<string, string> {
  const taxClasses = new Map<string, string>();
  
  employments.forEach(e => {
    if (e.id === mainEmployment?.id) {
      // Hauptarbeitgeber behält reguläre Steuerklasse
      taxClasses.set(e.id, e.taxClass);
    } else {
      // Nebenjobs werden mit Steuerklasse VI besteuert
      taxClasses.set(e.id, '6');
    }
  });
  
  return taxClasses;
}

/**
 * Vereinfachte Lohnsteuerberechnung
 */
function estimateIncomeTax(gross: number, taxClass: string): number {
  const yearlyGross = gross * 12;
  let taxRate = 0;
  
  // Vereinfachte progressive Steuersätze
  if (taxClass === '6') {
    // Steuerklasse VI: Höchster Steuersatz ohne Freibeträge
    if (yearlyGross <= 11604) taxRate = 0;
    else if (yearlyGross <= 30000) taxRate = 0.25;
    else if (yearlyGross <= 60000) taxRate = 0.35;
    else taxRate = 0.42;
  } else {
    // Andere Steuerklassen
    if (yearlyGross <= 11604) taxRate = 0;
    else if (yearlyGross <= 17005) taxRate = 0.14;
    else if (yearlyGross <= 66760) taxRate = 0.24 + (yearlyGross - 17005) * 0.0001;
    else taxRate = 0.42;
    
    // Steuerklassen-Modifikator
    if (taxClass === '3') taxRate *= 0.75;
    else if (taxClass === '5') taxRate *= 1.15;
  }
  
  return (yearlyGross * taxRate) / 12;
}

/**
 * Hauptberechnung für Mehrfachbeschäftigung
 */
export function calculateMultiEmployment(params: MultiEmploymentParams): MultiEmploymentResult {
  const { employments, currentAge, isChildless, isEastGermany } = params;
  
  const warnings: string[] = [];
  const details: string[] = [];
  
  // Hauptarbeitgeber ermitteln
  const mainEmployment = identifyMainEmployer(employments);
  
  // Steuerklassen zuweisen
  const taxClasses = assignTaxClasses(employments, mainEmployment);
  
  // BBG für RV (abhängig von Region)
  const bbgRv = isEastGermany ? BBG_RV_EAST : BBG_RV_WEST;
  
  // BBG-Verteilung
  const rvDistribution = distributeBBG(employments, bbgRv);
  const kvDistribution = distributeBBG(employments, BBG_KV);
  
  // Berechnung pro Beschäftigung
  const employmentDetails: EmploymentDetail[] = [];
  const socialSecurityShares: SocialSecurityShare[] = [];
  let totalGross = 0;
  let totalNet = 0;
  
  employments.forEach(employment => {
    const taxClass = taxClasses.get(employment.id) || '6';
    const rvAssessable = rvDistribution.get(employment.id)?.assessable || 0;
    const kvAssessable = kvDistribution.get(employment.id)?.assessable || 0;
    
    // SV-Beiträge
    const ssShare = calculateSocialSecurityShare(employment, rvAssessable, isChildless);
    ssShare.sharePercent = rvDistribution.get(employment.id)?.sharePercent || 0;
    socialSecurityShares.push(ssShare);
    
    const totalSsEmployee = ssShare.pensionEmployee + ssShare.healthEmployee + 
                           ssShare.careEmployee + ssShare.unemploymentEmployee;
    const totalSsEmployer = ssShare.pensionEmployer + ssShare.healthEmployer + 
                           ssShare.careEmployer + ssShare.unemploymentEmployer;
    
    // Steuer
    const incomeTax = estimateIncomeTax(employment.grossMonthly, taxClass);
    
    // Netto
    const netMonthly = employment.grossMonthly - totalSsEmployee - incomeTax;
    
    employmentDetails.push({
      employment,
      taxClass,
      grossMonthly: employment.grossMonthly,
      netMonthly,
      socialSecurityEmployee: totalSsEmployee,
      socialSecurityEmployer: totalSsEmployer,
      incomeTax,
    });
    
    totalGross += employment.grossMonthly;
    totalNet += netMonthly;
  });
  
  // Warnungen generieren
  if (employments.length > 1) {
    warnings.push('Bei Mehrfachbeschäftigung müssen Sie alle Arbeitgeber über die anderen Beschäftigungen informieren!');
  }
  
  const totalSsContributions = socialSecurityShares.reduce((sum, s) => 
    sum + s.pensionEmployee + s.healthEmployee + s.careEmployee + s.unemploymentEmployee, 0);
  
  if (totalGross > bbgRv) {
    warnings.push(`Gesamtbrutto (${formatCurrency(totalGross)}) übersteigt BBG RV (${formatCurrency(bbgRv)}). Anteilige SV-Berechnung erfolgt.`);
  }
  
  // Details generieren
  details.push(
    `=== Mehrfachbeschäftigung Übersicht ===`,
    ``,
    `Anzahl Beschäftigungen: ${employments.length}`,
    `Hauptarbeitgeber: ${mainEmployment?.employerName || 'Keiner'}`,
    ``,
    `=== Gesamtübersicht ===`,
    `Gesamtbrutto: ${formatCurrency(totalGross)}`,
    `Gesamt-SV (AN): ${formatCurrency(totalSsContributions)}`,
    `Gesamtnetto: ${formatCurrency(totalNet)}`,
    ``,
    `=== BBG-Verteilung ===`,
    `BBG RV ${isEastGermany ? '(Ost)' : '(West)'}: ${formatCurrency(bbgRv)}`,
    `BBG KV: ${formatCurrency(BBG_KV)}`,
  );
  
  employmentDetails.forEach(ed => {
    details.push(
      ``,
      `--- ${ed.employment.employerName} ---`,
      `Steuerklasse: ${ed.taxClass}${ed.taxClass === '6' ? ' (Nebenjob)' : ' (Hauptjob)'}`,
      `Brutto: ${formatCurrency(ed.grossMonthly)}`,
      `SV-Anteil: ${socialSecurityShares.find(s => s.employmentId === ed.employment.id)?.sharePercent.toFixed(1)}%`,
      `SV (AN): ${formatCurrency(ed.socialSecurityEmployee)}`,
      `Lohnsteuer: ${formatCurrency(ed.incomeTax)}`,
      `Netto: ${formatCurrency(ed.netMonthly)}`,
    );
  });
  
  return {
    totalGross,
    totalNet,
    mainEmployment,
    employmentDetails,
    socialSecurityDistribution: {
      totalAssessable: Math.min(totalGross, bbgRv),
      totalContributions: totalSsContributions,
      byEmployment: socialSecurityShares,
    },
    warnings,
    details,
  };
}

/**
 * Prüft ob Minijob-Grenze bei mehreren Minijobs überschritten wird
 */
export function checkMinijobLimit(
  minijobIncomes: number[]
): {
  totalIncome: number;
  isOverLimit: boolean;
  excessAmount: number;
  message: string;
} {
  const MINIJOB_LIMIT = 556;
  const totalIncome = minijobIncomes.reduce((sum, inc) => sum + inc, 0);
  const isOverLimit = totalIncome > MINIJOB_LIMIT;
  const excessAmount = Math.max(0, totalIncome - MINIJOB_LIMIT);
  
  let message = '';
  if (isOverLimit) {
    message = `⚠️ Mehrere Minijobs überschreiten zusammen die ${formatCurrency(MINIJOB_LIMIT)}-Grenze! Alle werden sozialversicherungspflichtig.`;
  } else {
    message = `✅ Minijobs liegen unter der Grenze. Verbleibend: ${formatCurrency(MINIJOB_LIMIT - totalIncome)}`;
  }
  
  return {
    totalIncome,
    isOverLimit,
    excessAmount,
    message,
  };
}

// Hilfsfunktion
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
