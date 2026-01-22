// Dienstwagen-Berechnung nach deutschem Steuerrecht 2025
// 1%-Regelung, 0,25%/0,5% für E-Autos, Fahrtenbuch-Methode

export type VehicleType = 'combustion' | 'hybrid' | 'electric';
export type CalculationMethod = '1-percent' | '0.25-percent' | '0.5-percent' | 'logbook';

export interface CompanyCarParams {
  listPrice: number; // Bruttolistenpreis inkl. Sonderausstattung
  vehicleType: VehicleType;
  distanceToWork: number; // Entfernung Wohnung-Arbeit in km
  workDaysPerMonth: number;
  privateUsagePercent?: number; // Für Fahrtenbuch
  yearlyPrivateKm?: number; // Für Fahrtenbuch
  yearlyBusinessKm?: number; // Für Fahrtenbuch
  monthlyVehicleCosts?: number; // Gesamtkosten inkl. Abschreibung, Versicherung, etc.
  hasHomeCharging?: boolean; // E-Auto Ladepauschale
}

export interface CompanyCarResult {
  method: CalculationMethod;
  methodName: string;
  monthlyBenefitValue: number; // Geldwerter Vorteil
  yearlyBenefitValue: number;
  commuteBenefit: number; // Zusätzlicher Vorteil Arbeitsweg
  totalMonthlyBenefit: number;
  taxImpact: number; // Geschätzte monatliche Steuerlast (bei 35% Grenzsteuersatz)
  netCostPerMonth: number; // Effektive Kosten nach Steuer
  details: string[];
  isRecommended?: boolean;
}

export interface CompanyCarComparison {
  vehicleInfo: {
    listPrice: number;
    vehicleType: VehicleType;
    vehicleTypeName: string;
  };
  methods: CompanyCarResult[];
  recommendation: {
    bestMethod: CalculationMethod;
    reason: string;
    yearlySavings: number;
  };
}

// Konstanten 2025
const ELECTRIC_THRESHOLD = 70000; // Grenze für 0,25% bei E-Autos
const HYBRID_MIN_RANGE = 80; // Mindest-Reichweite für 0,5% bei Hybriden (km)
const COMMUTE_RATE_COMBUSTION = 0.03; // 0,03% pro km für Verbrenner
const COMMUTE_RATE_ELECTRIC = 0.03; // Auch für E-Autos (aber auf reduzierten Wert)
const HOME_CHARGING_ALLOWANCE = 70; // Pauschale für Laden zu Hause (monatlich)
const ASSUMED_TAX_RATE = 0.35; // Angenommener Grenzsteuersatz

/**
 * Berechnet den geldwerten Vorteil nach der 1%-Regelung
 * Für alle Fahrzeuge anwendbar, aber meist nur für Verbrenner sinnvoll
 */
export function calculate1PercentRule(params: CompanyCarParams): CompanyCarResult {
  const { listPrice, distanceToWork, workDaysPerMonth } = params;
  
  // Listenpreis auf volle 100 Euro abrunden
  const roundedListPrice = Math.floor(listPrice / 100) * 100;
  
  // 1% des Listenpreises pro Monat
  const monthlyBenefitValue = roundedListPrice * 0.01;
  
  // Arbeitsweg: 0,03% pro Entfernungskilometer
  const commuteBenefit = roundedListPrice * COMMUTE_RATE_COMBUSTION * distanceToWork;
  
  const totalMonthlyBenefit = monthlyBenefitValue + commuteBenefit;
  const taxImpact = totalMonthlyBenefit * ASSUMED_TAX_RATE;
  
  return {
    method: '1-percent',
    methodName: '1%-Regelung (Standard)',
    monthlyBenefitValue,
    yearlyBenefitValue: monthlyBenefitValue * 12,
    commuteBenefit,
    totalMonthlyBenefit,
    taxImpact,
    netCostPerMonth: taxImpact,
    details: [
      `Listenpreis (gerundet): ${formatCurrency(roundedListPrice)}`,
      `1% pro Monat: ${formatCurrency(monthlyBenefitValue)}`,
      `Arbeitsweg (${distanceToWork} km × 0,03%): ${formatCurrency(commuteBenefit)}`,
      `Geschätzte Steuer (35%): ${formatCurrency(taxImpact)}/Monat`,
    ],
  };
}

/**
 * Berechnet den geldwerten Vorteil für reine Elektrofahrzeuge
 * 0,25% bei Listenpreis ≤ 70.000 Euro
 */
export function calculate025PercentRule(params: CompanyCarParams): CompanyCarResult {
  const { listPrice, distanceToWork } = params;
  
  const roundedListPrice = Math.floor(listPrice / 100) * 100;
  const isEligible = listPrice <= ELECTRIC_THRESHOLD;
  
  // 0,25% des Listenpreises pro Monat
  const rate = isEligible ? 0.0025 : 0.005; // Fallback auf 0,5% wenn über 70k
  const monthlyBenefitValue = roundedListPrice * rate;
  
  // Arbeitsweg: Auch 0,03%, aber auf den reduzierten Wert
  const effectiveListPrice = roundedListPrice * (isEligible ? 0.25 : 0.5);
  const commuteBenefit = effectiveListPrice * COMMUTE_RATE_ELECTRIC * distanceToWork / (isEligible ? 0.25 : 0.5);
  
  // Vereinfachte Berechnung: 0,03% vom tatsächlichen Listenpreis × Entfernung
  const actualCommuteBenefit = roundedListPrice * 0.0003 * distanceToWork;
  
  const totalMonthlyBenefit = monthlyBenefitValue + actualCommuteBenefit;
  const taxImpact = totalMonthlyBenefit * ASSUMED_TAX_RATE;
  
  return {
    method: '0.25-percent',
    methodName: isEligible ? '0,25%-Regelung (E-Auto)' : '0,5%-Regelung (E-Auto > 70k)',
    monthlyBenefitValue,
    yearlyBenefitValue: monthlyBenefitValue * 12,
    commuteBenefit: actualCommuteBenefit,
    totalMonthlyBenefit,
    taxImpact,
    netCostPerMonth: taxImpact,
    details: [
      `Listenpreis (gerundet): ${formatCurrency(roundedListPrice)}`,
      isEligible 
        ? `E-Auto ≤ 70.000€: 0,25% Regelung anwendbar`
        : `E-Auto > 70.000€: 0,5% Regelung`,
      `${isEligible ? '0,25%' : '0,5%'} pro Monat: ${formatCurrency(monthlyBenefitValue)}`,
      `Arbeitsweg (${distanceToWork} km): ${formatCurrency(actualCommuteBenefit)}`,
      `Geschätzte Steuer (35%): ${formatCurrency(taxImpact)}/Monat`,
    ],
  };
}

/**
 * Berechnet den geldwerten Vorteil für Plug-in-Hybride
 * 0,5% bei Mindestreichweite von 80 km elektrisch
 */
export function calculate05PercentRule(params: CompanyCarParams): CompanyCarResult {
  const { listPrice, distanceToWork } = params;
  
  const roundedListPrice = Math.floor(listPrice / 100) * 100;
  
  // 0,5% des Listenpreises pro Monat
  const monthlyBenefitValue = roundedListPrice * 0.005;
  
  // Arbeitsweg
  const commuteBenefit = roundedListPrice * 0.0003 * distanceToWork;
  
  const totalMonthlyBenefit = monthlyBenefitValue + commuteBenefit;
  const taxImpact = totalMonthlyBenefit * ASSUMED_TAX_RATE;
  
  return {
    method: '0.5-percent',
    methodName: '0,5%-Regelung (Plug-in-Hybrid)',
    monthlyBenefitValue,
    yearlyBenefitValue: monthlyBenefitValue * 12,
    commuteBenefit,
    totalMonthlyBenefit,
    taxImpact,
    netCostPerMonth: taxImpact,
    details: [
      `Listenpreis (gerundet): ${formatCurrency(roundedListPrice)}`,
      `Plug-in-Hybrid mit ≥ ${HYBRID_MIN_RANGE} km Reichweite: 0,5% Regelung`,
      `0,5% pro Monat: ${formatCurrency(monthlyBenefitValue)}`,
      `Arbeitsweg (${distanceToWork} km): ${formatCurrency(commuteBenefit)}`,
      `Geschätzte Steuer (35%): ${formatCurrency(taxImpact)}/Monat`,
    ],
  };
}

/**
 * Berechnet den geldwerten Vorteil nach Fahrtenbuch-Methode
 * Basiert auf tatsächlichen Kosten und Privatnutzungsanteil
 */
export function calculateLogbook(params: CompanyCarParams): CompanyCarResult {
  const { 
    yearlyPrivateKm = 5000, 
    yearlyBusinessKm = 15000,
    monthlyVehicleCosts = 800,
    listPrice,
    distanceToWork 
  } = params;
  
  const totalKm = yearlyPrivateKm + yearlyBusinessKm;
  const privateUsagePercent = (yearlyPrivateKm / totalKm) * 100;
  
  // Gesamtkosten pro Jahr
  const yearlyCosts = monthlyVehicleCosts * 12;
  
  // Privatanteil = geldwerter Vorteil
  const yearlyBenefitValue = yearlyCosts * (privateUsagePercent / 100);
  const monthlyBenefitValue = yearlyBenefitValue / 12;
  
  // Arbeitsweg wird separat über Entfernungspauschale abgerechnet
  // Hier vereinfacht: Zusätzlicher Vorteil für Pendelstrecke
  const workDaysPerYear = 220;
  const commuteKm = distanceToWork * 2 * workDaysPerYear; // Hin und zurück
  const commuteCostPerKm = yearlyCosts / totalKm;
  const yearlyCommuteCost = commuteKm * commuteCostPerKm;
  const commuteBenefit = yearlyCommuteCost / 12;
  
  const totalMonthlyBenefit = monthlyBenefitValue;
  const taxImpact = totalMonthlyBenefit * ASSUMED_TAX_RATE;
  
  return {
    method: 'logbook',
    methodName: 'Fahrtenbuch-Methode',
    monthlyBenefitValue,
    yearlyBenefitValue,
    commuteBenefit: 0, // Bei Fahrtenbuch anders berechnet
    totalMonthlyBenefit,
    taxImpact,
    netCostPerMonth: taxImpact,
    details: [
      `Monatliche Fahrzeugkosten: ${formatCurrency(monthlyVehicleCosts)}`,
      `Jährliche Gesamtkosten: ${formatCurrency(yearlyCosts)}`,
      `Privatnutzung: ${privateUsagePercent.toFixed(1)}% (${yearlyPrivateKm.toLocaleString('de-DE')} km)`,
      `Geldwerter Vorteil: ${formatCurrency(yearlyBenefitValue)}/Jahr`,
      `Geschätzte Steuer (35%): ${formatCurrency(taxImpact)}/Monat`,
      `⚠️ Erfordert lückenloses Fahrtenbuch!`,
    ],
  };
}

/**
 * Vergleicht alle verfügbaren Methoden und gibt Empfehlung
 */
export function compareCarMethods(params: CompanyCarParams): CompanyCarComparison {
  const { vehicleType, listPrice } = params;
  
  const methods: CompanyCarResult[] = [];
  
  // 1%-Regelung ist immer verfügbar
  methods.push(calculate1PercentRule(params));
  
  // E-Auto spezifische Regelungen
  if (vehicleType === 'electric') {
    methods.push(calculate025PercentRule(params));
  }
  
  // Hybrid-Regelung
  if (vehicleType === 'hybrid') {
    methods.push(calculate05PercentRule(params));
  }
  
  // Fahrtenbuch ist immer eine Option
  methods.push(calculateLogbook(params));
  
  // Finde günstigste Methode
  const sortedMethods = [...methods].sort((a, b) => a.netCostPerMonth - b.netCostPerMonth);
  const bestMethod = sortedMethods[0];
  const worstMethod = sortedMethods[sortedMethods.length - 1];
  
  // Markiere beste Methode
  methods.forEach(m => {
    m.isRecommended = m.method === bestMethod.method;
  });
  
  const yearlySavings = (worstMethod.netCostPerMonth - bestMethod.netCostPerMonth) * 12;
  
  let reason = '';
  if (bestMethod.method === '0.25-percent') {
    reason = 'Die 0,25%-Regelung für Elektrofahrzeuge bietet den größten Steuervorteil.';
  } else if (bestMethod.method === '0.5-percent') {
    reason = 'Die 0,5%-Regelung für Plug-in-Hybride ist günstiger als die Standard-1%-Regelung.';
  } else if (bestMethod.method === 'logbook') {
    reason = 'Bei geringer Privatnutzung ist das Fahrtenbuch am günstigsten. Achtung: Hoher Dokumentationsaufwand!';
  } else {
    reason = 'Die 1%-Regelung ist die einfachste Methode und in Ihrem Fall am günstigsten.';
  }
  
  const vehicleTypeNames: Record<VehicleType, string> = {
    combustion: 'Verbrenner',
    hybrid: 'Plug-in-Hybrid',
    electric: 'Elektrofahrzeug',
  };
  
  return {
    vehicleInfo: {
      listPrice,
      vehicleType,
      vehicleTypeName: vehicleTypeNames[vehicleType],
    },
    methods,
    recommendation: {
      bestMethod: bestMethod.method,
      reason,
      yearlySavings,
    },
  };
}

/**
 * Berechnet die Auswirkung auf das Nettogehalt
 */
export function calculateNetSalaryImpact(
  monthlyGross: number,
  carBenefit: number,
  taxRate: number = 0.35
): {
  effectiveGross: number;
  additionalTax: number;
  netReduction: number;
} {
  return {
    effectiveGross: monthlyGross + carBenefit,
    additionalTax: carBenefit * taxRate,
    netReduction: carBenefit * taxRate,
  };
}

// Hilfsfunktion
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
