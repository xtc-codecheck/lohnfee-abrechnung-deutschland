// Zentrale Konstanten für deutsche Sozialversicherung und Steuern 2025
// Diese Datei ist die einzige Quelle für alle sozialversicherungsrechtlichen Konstanten

/**
 * Beitragsbemessungsgrenzen 2025 (jährlich)
 */
export const BBG_2025_YEARLY = {
  pensionWest: 90600, // €90.600 Renten-/Arbeitslosenversicherung West
  pensionEast: 89400, // €89.400 Renten-/Arbeitslosenversicherung Ost  
  healthCare: 62100,  // €62.100 Kranken-/Pflegeversicherung bundesweit
} as const;

/**
 * Beitragsbemessungsgrenzen 2025 (monatlich)
 */
export const BBG_2025_MONTHLY = {
  pensionWest: 7550, // €7.550 Renten-/Arbeitslosenversicherung West
  pensionEast: 7450, // €7.450 Renten-/Arbeitslosenversicherung Ost
  healthCare: 5175,  // €5.175 Kranken-/Pflegeversicherung bundesweit
} as const;

/**
 * Sozialversicherungsbeiträge 2025 (in Prozent)
 */
export const SOCIAL_INSURANCE_RATES_2025 = {
  pension: {
    total: 18.6,
    employee: 9.3,
    employer: 9.3,
  },
  unemployment: {
    total: 2.6,
    employee: 1.3,
    employer: 1.3,
  },
  health: {
    total: 14.6, // Grundbeitrag ohne Zusatzbeitrag
    employee: 7.3,
    employer: 7.3,
    averageAdditional: 0.85, // Realistischer durchschnittlicher Zusatzbeitrag
  },
  care: {
    total: 3.4,
    employee: 1.7,
    employer: 1.7,
  },
  careChildless: {
    total: 4.0, // Für Kinderlose über 23
    employee: 2.3, // 1,7% Basis + 0,6% Kinderlosenzuschlag = 2,3%
    employer: 1.7, // AG-Anteil bleibt bei 1,7%
  },
} as const;

/**
 * PV-Kinderabschläge seit 01.07.2023 (PUEG)
 * Ab dem 2. Kind wird der AN-Beitrag um 0,25% je Kind reduziert (max. 1,0%).
 * Abschlag gilt nur für Kinder unter 25 Jahren.
 * 
 * Quelle: § 55 Abs. 3 SGB XI
 */
export const PV_CHILD_DISCOUNTS_2025 = {
  baseEmployeeRate: 1.7,     // Basis AN-Beitrag (1 Kind oder kinderlos ohne Zuschlag)
  childlessSurcharge: 0.6,   // Kinderlosenzuschlag für über 23-Jährige
  discountPerChild: 0.25,    // Abschlag pro Kind ab dem 2. Kind
  maxDiscount: 1.0,          // Maximaler Abschlag (bei 5+ Kindern)
  employerRate: 1.7,         // AG-Anteil bleibt immer 1,7%
} as const;

/**
 * Minijob-Konstanten 2025
 * Verdienstgrenze: bis 556 € pro Monat
 * Sozialversicherung: keine Beiträge zur Kranken-, Pflege- und Arbeitslosenversicherung
 * Rentenversicherungspflicht besteht (Befreiung möglich)
 * Steuer: Pauschalsteuer 2% (zahlt Arbeitgeber) oder individuelle Versteuerung
 */
export const MINIJOB_2025 = {
  maxEarnings: 556, // €556 monatlich (Stand 2025)
  taxRate: 0.02, // 2% Pauschalsteuer
  employerRates: {
    health: 0.13, // 13% Krankenversicherung (AG zahlt)
    pension: 0.15, // 15% Rentenversicherung (AG zahlt)
    total: 0.28, // 28% Gesamtabgaben AG
  },
  // Beispielrechnung: 556€ × 2% = 11,12€ Steuer (falls Pauschalsteuer)
} as const;

/**
 * Midijob-Konstanten 2025 (Übergangsbereich)
 * Verdienstgrenze: 556,01€ bis 2.000€ pro Monat
 * Sozialversicherung: volle Versicherungspflicht mit reduzierten AN-Beiträgen
 * Steuer: Steuerklasse I-IV meist keine Lohnsteuer, V/VI können Lohnsteuer haben
 * 
 * Berechnungsformel Übergangsbereich:
 * Gleitzonenentgelt = F × 556,01 + 
 * ([2000 / (2000 – 556,01)] – [556,01 / (2000 – 556,01)] × F) × (Brutto – 556,01)
 */
export const MIDIJOB_2025 = {
  minEarnings: 556.01, // Untergrenze (Stand 2025)
  maxEarnings: 2000,    // Obergrenze
  factor: 0.6683,       // Faktor F für 2025
  lowerThreshold: 556.01,
  upperThreshold: 2000,
  // Formel-Komponenten für Gleitzonenberechnung
  formula: {
    factor: 0.6683,
    lowerBound: 556.01,
    upperBound: 2000,
  }
} as const;

/**
 * Steuerliche Freibeträge 2025
 */
export const TAX_ALLOWANCES_2025 = {
  basicAllowance: 12096, // Grundfreibetrag
  childAllowance: 6612, // Kinderfreibetrag pro Kind
  workRelatedExpenses: 1230, // Werbungskostenpauschale
  specialExpenses: 36, // Sonderausgabenpauschale
  retirementProvision: 3000, // Max. Vorsorgepauschale
  solidarityTaxFreeAmount: 19950, // Soli-Freibetrag 2025 (Einkommensteuer)
  solidarityReductionLimit: 73483, // Soli-Milderungsgrenze 2025 (zvE)
} as const;

/**
 * Steuersätze und -grenzen 2025
 */
export const TAX_RATES_2025 = {
  progressionZone1: {
    from: 12097,
    to: 17443,
    formula: 'y', // (zvE - 12096) / 10000
    coefficients: [932.30, 1400],
  },
  progressionZone2: {
    from: 17444,
    to: 68480,
    formula: 'z', // (zvE - 17443) / 10000
    coefficients: [176.64, 2397],
    constant: 1015.13,
  },
  proportionalZone1: {
    from: 68481,
    to: 277825,
    rate: 0.42, // 42%
    constant: 10911.92,
  },
  proportionalZone2: {
    from: 277826,
    rate: 0.45, // 45% Reichensteuer
    constant: 19246.67,
  },
  solidarityTax: 0.055, // 5,5%
} as const;

/**
 * HINWEIS: Die statische WAGE_TAX_TABLE_2025 wurde durch eine formelbasierte
 * Berechnung nach § 32a EStG (PAP 2025) ersetzt.
 * Siehe: src/utils/tax-calculation.ts → calculateTariflicheEStPAP2025()
 * 
 * Dies eliminiert:
 * - ~7.700 Zeilen statische Tabellendaten
 * - Jährliche manuelle Tabellenaktualisierung
 * - Interpolationsfehler bei Gehältern zwischen Tabellenstufen
 * - Extrapolationsprobleme bei Gehältern über 100.000€
 */

/**
 * Kirchensteuersätze nach Bundesländern
 */
export const CHURCH_TAX_RATES_2025 = {
  'BW': { catholic: 8, protestant: 8 }, // Baden-Württemberg
  'BY': { catholic: 8, protestant: 8 }, // Bayern
  'BE': { catholic: 9, protestant: 9 }, // Berlin
  'BB': { catholic: 9, protestant: 9 }, // Brandenburg
  'HB': { catholic: 9, protestant: 9 }, // Bremen
  'HH': { catholic: 9, protestant: 9 }, // Hamburg
  'HE': { catholic: 9, protestant: 9 }, // Hessen
  'MV': { catholic: 9, protestant: 9 }, // Mecklenburg-Vorpommern
  'NI': { catholic: 9, protestant: 9 }, // Niedersachsen
  'NW': { catholic: 9, protestant: 9 }, // Nordrhein-Westfalen
  'RP': { catholic: 9, protestant: 9 }, // Rheinland-Pfalz
  'SL': { catholic: 9, protestant: 9 }, // Saarland
  'SN': { catholic: 9, protestant: 9 }, // Sachsen
  'ST': { catholic: 9, protestant: 9 }, // Sachsen-Anhalt
  'SH': { catholic: 9, protestant: 9 }, // Schleswig-Holstein
  'TH': { catholic: 9, protestant: 9 }, // Thüringen
} as const;

/**
 * Hilfsfunktionen für BBG-Berechnungen
 */
export const getBBGForRegion = (isEastGermany: boolean, type: 'yearly' | 'monthly' = 'monthly') => {
  const bbg = type === 'yearly' ? BBG_2025_YEARLY : BBG_2025_MONTHLY;
  return {
    pension: isEastGermany ? bbg.pensionEast : bbg.pensionWest,
    health: bbg.healthCare,
  };
};

/**
 * Hilfsfunktion für Kirchensteuersatz
 */
export const getChurchTaxRate = (state: string, religion: 'catholic' | 'protestant'): number => {
  return CHURCH_TAX_RATES_2025[state as keyof typeof CHURCH_TAX_RATES_2025]?.[religion] || 9;
};

/**
 * Hilfsfunktion für Pflegeversicherungssatz
 * 
 * Gestaffelte Berechnung seit 01.07.2023 (PUEG):
 * - Kinderlos über 23: 2,3% AN (Basis 1,7% + 0,6% Zuschlag)
 * - 1 Kind: 1,7% AN
 * - 2 Kinder: 1,45% AN (Abschlag 0,25%)
 * - 3 Kinder: 1,2% AN (Abschlag 0,50%)
 * - 4 Kinder: 0,95% AN (Abschlag 0,75%)
 * - 5+ Kinder: 0,7% AN (Abschlag 1,0%)
 * - AG-Anteil immer 1,7%
 * 
 * @param isChildless - Ob der AN kinderlos ist
 * @param age - Alter des AN
 * @param numberOfChildren - Anzahl der Kinder (für gestaffelte Abschläge)
 */
export const getCareInsuranceRate = (
  isChildless: boolean, 
  age: number, 
  numberOfChildren: number = 0
): { total: number; employee: number; employer: number } => {
  const { baseEmployeeRate, childlessSurcharge, discountPerChild, maxDiscount, employerRate } = PV_CHILD_DISCOUNTS_2025;
  
  let employeeRate: number;
  
  if (isChildless && age > 23) {
    // Kinderlos über 23: Basis + Zuschlag
    employeeRate = baseEmployeeRate + childlessSurcharge;
  } else if (numberOfChildren <= 1) {
    // 0 oder 1 Kind (unter 23 oder mit Kind): Basissatz
    employeeRate = baseEmployeeRate;
  } else {
    // Ab 2 Kindern: Abschlag
    const discount = Math.min((numberOfChildren - 1) * discountPerChild, maxDiscount);
    employeeRate = Math.max(baseEmployeeRate - discount, baseEmployeeRate - maxDiscount);
  }
  
  // Auf 2 Dezimalstellen runden
  employeeRate = Math.round(employeeRate * 100) / 100;
  
  return {
    total: Math.round((employeeRate + employerRate) * 100) / 100,
    employee: employeeRate,
    employer: employerRate,
  };
};