// Zentrale Konstanten für deutsche Sozialversicherung und Steuern 2025/2026
// Diese Datei ist die einzige Quelle für alle sozialversicherungsrechtlichen Konstanten

// ============= 2025 =============

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
 */
export const MINIJOB_2025 = {
  maxEarnings: 556, // €556 monatlich (Stand 2025)
  taxRate: 0.02, // 2% Pauschalsteuer
  employerRates: {
    health: 0.13, // 13% Krankenversicherung (AG zahlt)
    pension: 0.15, // 15% Rentenversicherung (AG zahlt)
    total: 0.28, // 28% Gesamtabgaben AG
  },
} as const;

/**
 * Midijob-Konstanten 2025 (Übergangsbereich)
 */
export const MIDIJOB_2025 = {
  minEarnings: 556.01, // Untergrenze (Stand 2025)
  maxEarnings: 2000,    // Obergrenze
  factor: 0.6683,       // Faktor F für 2025
  lowerThreshold: 556.01,
  upperThreshold: 2000,
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

// ============= 2026 =============

/**
 * Beitragsbemessungsgrenzen 2026 (jährlich)
 * Quelle: Sozialversicherungs-Rechengrößenverordnung 2026
 */
export const BBG_2026_YEARLY = {
  pensionWest: 96600, // €96.600 RV/AV West (vereinheitlicht)
  pensionEast: 96600, // €96.600 RV/AV Ost (ab 2026 einheitlich)
  healthCare: 66150,  // €66.150 KV/PV bundesweit
} as const;

/**
 * Beitragsbemessungsgrenzen 2026 (monatlich)
 */
export const BBG_2026_MONTHLY = {
  pensionWest: 8050, // €8.050 RV/AV West
  pensionEast: 8050, // €8.050 RV/AV Ost (vereinheitlicht)
  healthCare: 5512.50,  // €5.512,50 KV/PV bundesweit
} as const;

/**
 * Sozialversicherungsbeiträge 2026 (in Prozent)
 */
export const SOCIAL_INSURANCE_RATES_2026 = {
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
    total: 14.6,
    employee: 7.3,
    employer: 7.3,
    averageAdditional: 1.0, // Durchschnittlicher Zusatzbeitrag 2026 (leicht gestiegen)
  },
  care: {
    total: 3.6,     // Erhöhung ab 01.01.2026
    employee: 1.8,
    employer: 1.8,
  },
  careChildless: {
    total: 4.2,     // Kinderlose über 23
    employee: 2.4,  // 1,8% Basis + 0,6% Zuschlag
    employer: 1.8,
  },
} as const;

/**
 * PV-Kinderabschläge 2026 (angepasst an erhöhten Basissatz)
 */
export const PV_CHILD_DISCOUNTS_2026 = {
  baseEmployeeRate: 1.8,     // Basis AN-Beitrag (erhöht)
  childlessSurcharge: 0.6,   // Kinderlosenzuschlag
  discountPerChild: 0.25,    // Abschlag pro Kind ab dem 2. Kind
  maxDiscount: 1.0,          // Maximaler Abschlag (bei 5+ Kindern)
  employerRate: 1.8,         // AG-Anteil (erhöht)
} as const;

/**
 * Minijob-Konstanten 2026
 * Verdienstgrenze steigt mit Mindestlohn (12,82€ × 130h / 3 ≈ 556€)
 */
export const MINIJOB_2026 = {
  maxEarnings: 556, // €556 monatlich (vorerst unverändert)
  taxRate: 0.02,
  employerRates: {
    health: 0.13,
    pension: 0.15,
    total: 0.28,
  },
} as const;

/**
 * Midijob-Konstanten 2026
 */
export const MIDIJOB_2026 = {
  minEarnings: 556.01,
  maxEarnings: 2000,
  factor: 0.6683,
  lowerThreshold: 556.01,
  upperThreshold: 2000,
  formula: {
    factor: 0.6683,
    lowerBound: 556.01,
    upperBound: 2000,
  }
} as const;

/**
 * Steuerliche Freibeträge 2026
 * Grundfreibetrag angehoben nach Inflationsausgleich
 */
export const TAX_ALLOWANCES_2026 = {
  basicAllowance: 12336, // Grundfreibetrag 2026 (erhöht von 12.096)
  childAllowance: 6672, // Kinderfreibetrag 2026 (erhöht von 6.612)
  workRelatedExpenses: 1230, // Werbungskostenpauschale (unverändert)
  specialExpenses: 36, // Sonderausgabenpauschale (unverändert)
  retirementProvision: 3000, // Max. Vorsorgepauschale (unverändert)
  solidarityTaxFreeAmount: 19950, // Soli-Freibetrag (unverändert)
  solidarityReductionLimit: 73483, // Soli-Milderungsgrenze (unverändert)
} as const;

/**
 * Steuersätze und -grenzen 2026 (§ 32a EStG)
 * Tarif angepasst an erhöhten Grundfreibetrag
 */
export const TAX_RATES_2026 = {
  progressionZone1: {
    from: 12337,
    to: 17687,
    formula: 'y',
    coefficients: [922.98, 1400],
  },
  progressionZone2: {
    from: 17688,
    to: 68480,
    formula: 'z',
    coefficients: [176.64, 2397],
    constant: 1015.13,
  },
  proportionalZone1: {
    from: 68481,
    to: 277825,
    rate: 0.42,
    constant: 10911.92,
  },
  proportionalZone2: {
    from: 277826,
    rate: 0.45,
    constant: 19246.67,
  },
  solidarityTax: 0.055,
} as const;

// ============= Typ-Definitionen für jahresübergreifenden Zugriff =============

type BBGYearly = typeof BBG_2025_YEARLY;
type BBGMonthly = typeof BBG_2025_MONTHLY;
type SocialInsuranceRates = typeof SOCIAL_INSURANCE_RATES_2025;
type TaxAllowances = typeof TAX_ALLOWANCES_2025;
type TaxRates = typeof TAX_RATES_2025;
type MinijobConstants = typeof MINIJOB_2025;
type MidijobConstants = typeof MIDIJOB_2025;
type PVChildDiscounts = typeof PV_CHILD_DISCOUNTS_2025;

const YEAR_CONFIG: Record<number, {
  bbgYearly: BBGYearly;
  bbgMonthly: BBGMonthly;
  svRates: SocialInsuranceRates;
  taxAllowances: TaxAllowances;
  taxRates: TaxRates;
  minijob: MinijobConstants;
  midijob: MidijobConstants;
  pvDiscounts: PVChildDiscounts;
}> = {
  2025: {
    bbgYearly: BBG_2025_YEARLY,
    bbgMonthly: BBG_2025_MONTHLY,
    svRates: SOCIAL_INSURANCE_RATES_2025,
    taxAllowances: TAX_ALLOWANCES_2025,
    taxRates: TAX_RATES_2025,
    minijob: MINIJOB_2025,
    midijob: MIDIJOB_2025,
    pvDiscounts: PV_CHILD_DISCOUNTS_2025,
  },
  2026: {
    bbgYearly: BBG_2026_YEARLY,
    bbgMonthly: BBG_2026_MONTHLY,
    svRates: SOCIAL_INSURANCE_RATES_2026,
    taxAllowances: TAX_ALLOWANCES_2026,
    taxRates: TAX_RATES_2026,
    minijob: MINIJOB_2026,
    midijob: MIDIJOB_2026,
    pvDiscounts: PV_CHILD_DISCOUNTS_2026,
  },
};

/**
 * Gibt die Konfiguration für ein bestimmtes Jahr zurück.
 * Fallback auf das neueste verfügbare Jahr.
 */
export function getYearConfig(year: number) {
  return YEAR_CONFIG[year] ?? YEAR_CONFIG[2026];
}

/**
 * Gibt die unterstützten Jahre zurück
 */
export function getSupportedYears(): number[] {
  return Object.keys(YEAR_CONFIG).map(Number).sort();
}

/**
 * HINWEIS: Die statische WAGE_TAX_TABLE_2025 wurde durch eine formelbasierte
 * Berechnung nach § 32a EStG (PAP 2025) ersetzt.
 * Siehe: src/utils/tax-calculation.ts → calculateTariflicheEStPAP2025()
 */

/**
 * Kirchensteuersätze nach Bundesländern (unverändert 2025/2026)
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
 * @param year - Optional: Veranlagungsjahr (Default: 2025 für Rückwärtskompatibilität)
 */
export const getBBGForRegion = (isEastGermany: boolean, type: 'yearly' | 'monthly' = 'monthly', year: number = 2025) => {
  const config = getYearConfig(year);
  const bbg = type === 'yearly' ? config.bbgYearly : config.bbgMonthly;
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
 * @param year - Optional: Veranlagungsjahr (Default: 2025)
 */
export const getCareInsuranceRate = (
  isChildless: boolean, 
  age: number, 
  numberOfChildren: number = 0,
  year: number = 2025
): { total: number; employee: number; employer: number } => {
  const config = getYearConfig(year);
  const { baseEmployeeRate, childlessSurcharge, discountPerChild, maxDiscount, employerRate } = config.pvDiscounts;
  
  let employeeRate: number;
  
  if (isChildless && age > 23) {
    employeeRate = baseEmployeeRate + childlessSurcharge;
  } else if (numberOfChildren <= 1) {
    employeeRate = baseEmployeeRate;
  } else {
    const discount = Math.min((numberOfChildren - 1) * discountPerChild, maxDiscount);
    employeeRate = Math.max(baseEmployeeRate - discount, baseEmployeeRate - maxDiscount);
  }
  
  employeeRate = Math.round(employeeRate * 100) / 100;
  
  return {
    total: Math.round((employeeRate + employerRate) * 100) / 100,
    employee: employeeRate,
    employer: employerRate,
  };
};