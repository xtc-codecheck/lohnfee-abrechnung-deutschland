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
    averageAdditional: 1.7, // Durchschnittlicher Zusatzbeitrag
  },
  care: {
    total: 3.4,
    employee: 1.7,
    employer: 1.7,
  },
  careChildless: {
    total: 4.0, // Für Kinderlose über 23
    employee: 2.0,
    employer: 1.7, // AG-Anteil bleibt gleich
  },
} as const;

/**
 * Minijob-Konstanten
 */
export const MINIJOB_2025 = {
  maxEarnings: 538, // €538 monatlich
  taxRate: 0.02, // 2% Pauschalsteuer
  employerRates: {
    health: 0.13, // 13% Krankenversicherung
    pension: 0.15, // 15% Rentenversicherung  
    total: 0.28, // 28% Gesamtabgaben AG
  },
} as const;

/**
 * Midijob-Konstanten (Übergangsbereich)
 */
export const MIDIJOB_2025 = {
  minEarnings: 538.01,
  maxEarnings: 2000,
  reductionFactor: 0.7, // Vereinfachter Gleitzonenfaktor
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
  solidarityTaxFreeAmount: 1036.76, // Soli-Freibetrag
  solidarityReductionLimit: 1340.06, // Soli-Milderungsgrenze
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
 */
export const getCareInsuranceRate = (isChildless: boolean, age: number) => {
  return (isChildless && age > 23) ? SOCIAL_INSURANCE_RATES_2025.careChildless : SOCIAL_INSURANCE_RATES_2025.care;
};