// Netto-zu-Brutto-Umkehrrechnung (Ziel-Netto-Rechner)
// Iterative Berechnung zur Ermittlung des benötigten Bruttogehalts für ein gewünschtes Netto

import { calculateCompleteTax, TaxCalculationParams, TaxCalculationResult } from './tax-calculation';

export interface NetToGrossParams {
  targetNetMonthly: number;
  taxClass: string;
  childAllowances: number;
  churchTax: boolean;
  churchTaxRate: number;
  healthInsuranceRate: number;
  isEastGermany: boolean;
  isChildless: boolean;
  age: number;
}

export interface NetToGrossResult {
  targetNet: number;
  requiredGross: number;
  actualNet: number;
  difference: number;
  iterations: number;
  calculation: TaxCalculationResult;
}

/**
 * Berechnet das benötigte Bruttogehalt für ein gewünschtes Nettogehalt
 * Verwendet binäre Suche für schnelle und präzise Ergebnisse
 */
export function calculateNetToGross(params: NetToGrossParams): NetToGrossResult {
  const { targetNetMonthly, taxClass, childAllowances, churchTax, churchTaxRate,
          healthInsuranceRate, isEastGermany, isChildless, age } = params;

  // Startgrenzen für binäre Suche
  let lowerBound = targetNetMonthly; // Mindestens das Netto
  let upperBound = targetNetMonthly * 3; // Grob geschätzt: Brutto max. 3x Netto
  const tolerance = 0.01; // Cent-genau
  const maxIterations = 50;
  
  let iterations = 0;
  let bestResult: TaxCalculationResult | null = null;
  let bestGross = 0;

  while (iterations < maxIterations) {
    iterations++;
    
    const midGross = (lowerBound + upperBound) / 2;
    
    const taxParams: TaxCalculationParams = {
      grossSalaryYearly: midGross * 12,
      taxClass,
      childAllowances,
      churchTax,
      churchTaxRate,
      healthInsuranceRate,
      isEastGermany,
      isChildless,
      age,
    };
    
    const result = calculateCompleteTax(taxParams);
    const calculatedNet = result.netMonthly;
    
    bestResult = result;
    bestGross = midGross;
    
    // Prüfe ob wir nah genug am Ziel sind
    if (Math.abs(calculatedNet - targetNetMonthly) <= tolerance) {
      break;
    }
    
    // Binäre Suche: Anpassen der Grenzen
    if (calculatedNet < targetNetMonthly) {
      lowerBound = midGross;
    } else {
      upperBound = midGross;
    }
    
    // Abbruch wenn Suchbereich zu klein
    if (upperBound - lowerBound < 0.01) {
      break;
    }
  }

  return {
    targetNet: targetNetMonthly,
    requiredGross: Math.round(bestGross * 100) / 100,
    actualNet: bestResult?.netMonthly || 0,
    difference: Math.abs((bestResult?.netMonthly || 0) - targetNetMonthly),
    iterations,
    calculation: bestResult!,
  };
}

/**
 * Berechnet eine Gehaltskurve für verschiedene Brutto-Werte
 * Für interaktive Visualisierungen
 */
export interface SalaryCurvePoint {
  gross: number;
  net: number;
  taxes: number;
  socialContributions: number;
  employerCosts: number;
  netPercentage: number;
  marginalTaxRate: number;
}

export function calculateSalaryCurve(
  baseParams: Omit<NetToGrossParams, 'targetNetMonthly'>,
  fromGross: number,
  toGross: number,
  steps: number = 20
): SalaryCurvePoint[] {
  const points: SalaryCurvePoint[] = [];
  const stepSize = (toGross - fromGross) / steps;
  
  let previousNet = 0;
  let previousGross = 0;
  
  for (let i = 0; i <= steps; i++) {
    const gross = fromGross + (stepSize * i);
    
    const taxParams: TaxCalculationParams = {
      grossSalaryYearly: gross * 12,
      taxClass: baseParams.taxClass,
      childAllowances: baseParams.childAllowances,
      churchTax: baseParams.churchTax,
      churchTaxRate: baseParams.churchTaxRate,
      healthInsuranceRate: baseParams.healthInsuranceRate,
      isEastGermany: baseParams.isEastGermany,
      isChildless: baseParams.isChildless,
      age: baseParams.age,
    };
    
    const result = calculateCompleteTax(taxParams);
    
    // Grenzsteuersatz berechnen (wie viel vom nächsten Euro bleibt)
    let marginalTaxRate = 0;
    if (previousGross > 0) {
      const grossIncrease = gross - previousGross;
      const netIncrease = result.netMonthly - previousNet;
      marginalTaxRate = grossIncrease > 0 ? (1 - (netIncrease / grossIncrease)) * 100 : 0;
    }
    
    points.push({
      gross,
      net: result.netMonthly,
      taxes: result.totalTaxes / 12,
      socialContributions: result.totalSocialContributions / 12,
      employerCosts: result.employerCosts / 12,
      netPercentage: (result.netMonthly / gross) * 100,
      marginalTaxRate,
    });
    
    previousNet = result.netMonthly;
    previousGross = gross;
  }
  
  return points;
}

/**
 * Steueroptimierungs-Empfehlungen berechnen
 */
export interface OptimizationTip {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  category: 'tax-free' | 'social-security' | 'deductible' | 'benefit';
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function calculateOptimizationTips(
  grossMonthly: number,
  currentParams: Omit<NetToGrossParams, 'targetNetMonthly'>
): OptimizationTip[] {
  const tips: OptimizationTip[] = [];
  
  // 50€ Sachbezug (§ 8 Abs. 2 Satz 11 EStG)
  tips.push({
    id: 'sachbezug-50',
    title: '50€ Sachbezugsgrenze nutzen',
    description: 'Monatlich bis zu 50€ steuer- und sozialversicherungsfreie Sachbezüge (z.B. Tankgutschein, Einkaufsgutschein).',
    potentialSavings: 50 * 12 * 0.40, // ca. 40% Ersparnis
    category: 'tax-free',
    icon: 'Gift',
    difficulty: 'easy',
  });
  
  // Jobticket (§ 3 Nr. 15 EStG)
  tips.push({
    id: 'jobticket',
    title: 'Jobticket steuerfrei',
    description: 'ÖPNV-Tickets vom Arbeitgeber sind seit 2024 komplett steuerfrei, auch für Privatfahrten.',
    potentialSavings: 60 * 12, // Durchschnittliches Monatsticket
    category: 'tax-free',
    icon: 'Train',
    difficulty: 'easy',
  });
  
  // Internetpauschale
  tips.push({
    id: 'internet-pauschale',
    title: 'Internetpauschale 20€/Monat',
    description: 'Arbeitgeber kann 20€/Monat pauschal versteuert (25%) für private Internetnutzung zahlen.',
    potentialSavings: 20 * 12 * 0.75, // 75% Ersparnis vs. Lohn
    category: 'tax-free',
    icon: 'Wifi',
    difficulty: 'easy',
  });
  
  // Kindergartenzuschuss
  tips.push({
    id: 'kindergarten',
    title: 'Kindergartenzuschuss',
    description: 'Zuschüsse für Kinderbetreuung sind unbegrenzt steuer- und sozialversicherungsfrei (§ 3 Nr. 33 EStG).',
    potentialSavings: 300 * 12, // Durchschnittliche Kitakosten
    category: 'tax-free',
    icon: 'Baby',
    difficulty: 'medium',
  });
  
  // bAV - Betriebliche Altersvorsorge
  const bavMax = 302 * 12; // 2025: 302€/Monat bzw. 3.624€/Jahr SV-frei
  if (grossMonthly > 2500) {
    tips.push({
      id: 'bav',
      title: 'Betriebliche Altersvorsorge (bAV)',
      description: `Bis zu 302€/Monat SV-frei und 604€ steuerfrei in die bAV einzahlen. Doppelter Vorteil: Steuer sparen UND Altersvorsorge aufbauen.`,
      potentialSavings: bavMax * 0.30, // ca. 30% SV-Ersparnis
      category: 'social-security',
      icon: 'PiggyBank',
      difficulty: 'medium',
    });
  }
  
  // Fahrrad-Leasing
  tips.push({
    id: 'fahrrad-leasing',
    title: 'Fahrrad-Leasing (Dienstrad)',
    description: 'Dienstfahrrad mit 0,25% Versteuerung - deutlich günstiger als Privatfahrrad. Auch E-Bikes möglich.',
    potentialSavings: 100 * 12 * 0.50, // Geschätzter Vorteil
    category: 'benefit',
    icon: 'Bike',
    difficulty: 'easy',
  });
  
  // Essenszuschuss
  tips.push({
    id: 'essenszuschuss',
    title: 'Essenszuschuss/Verpflegung',
    description: 'Arbeitgeber kann pro Arbeitstag 7,23€ (2025) für Mahlzeiten steuervergünstigt bezuschussen.',
    potentialSavings: 7.23 * 220 * 0.35, // ca. 220 Arbeitstage, 35% Ersparnis
    category: 'tax-free',
    icon: 'UtensilsCrossed',
    difficulty: 'medium',
  });
  
  // Homeoffice-Pauschale
  tips.push({
    id: 'homeoffice',
    title: 'Homeoffice-Pauschale',
    description: '6€ pro Homeoffice-Tag als Werbungskosten, max. 1.260€/Jahr. Zusätzlich: Arbeitgeber kann Arbeitsmittel stellen.',
    potentialSavings: 1260 * 0.35, // Bei 35% Grenzsteuersatz
    category: 'deductible',
    icon: 'Home',
    difficulty: 'easy',
  });
  
  // VWL - Vermögenswirksame Leistungen
  tips.push({
    id: 'vwl',
    title: 'Vermögenswirksame Leistungen (VWL)',
    description: 'Arbeitgeber zahlt bis zu 40€/Monat zusätzlich. Bei niedrigem Einkommen: staatliche Arbeitnehmersparzulage.',
    potentialSavings: 40 * 12,
    category: 'benefit',
    icon: 'Coins',
    difficulty: 'easy',
  });

  // Steuerklassenwechsel für Verheiratete
  if (currentParams.taxClass === '4' || currentParams.taxClass === '5') {
    tips.push({
      id: 'steuerklasse',
      title: 'Steuerklassenkombination prüfen',
      description: 'Bei unterschiedlich verdienenden Ehepartnern kann III/V oder IV/IV mit Faktor günstiger sein.',
      potentialSavings: grossMonthly * 0.05 * 12, // Geschätzt 5% Optimierungspotential
      category: 'tax-free',
      icon: 'Heart',
      difficulty: 'medium',
    });
  }
  
  return tips.sort((a, b) => b.potentialSavings - a.potentialSavings);
}

/**
 * Berechnet den Mehrwert eines Gehaltserhöhungsszenarios
 */
export interface RaiseAnalysis {
  currentGross: number;
  newGross: number;
  raiseAmount: number;
  currentNet: number;
  newNet: number;
  netIncrease: number;
  taxOnRaise: number;
  percentageKept: number;
  marginalRate: number;
}

export function analyzeRaise(
  currentGross: number,
  raiseAmount: number,
  params: Omit<NetToGrossParams, 'targetNetMonthly'>
): RaiseAnalysis {
  const currentParams: TaxCalculationParams = {
    grossSalaryYearly: currentGross * 12,
    ...params,
  };
  
  const newGross = currentGross + raiseAmount;
  const newParams: TaxCalculationParams = {
    grossSalaryYearly: newGross * 12,
    ...params,
  };
  
  const currentResult = calculateCompleteTax(currentParams);
  const newResult = calculateCompleteTax(newParams);
  
  const netIncrease = newResult.netMonthly - currentResult.netMonthly;
  const taxOnRaise = raiseAmount - netIncrease;
  
  return {
    currentGross,
    newGross,
    raiseAmount,
    currentNet: currentResult.netMonthly,
    newNet: newResult.netMonthly,
    netIncrease,
    taxOnRaise,
    percentageKept: (netIncrease / raiseAmount) * 100,
    marginalRate: (taxOnRaise / raiseAmount) * 100,
  };
}
