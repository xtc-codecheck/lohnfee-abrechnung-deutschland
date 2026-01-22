// Gastronomie-Lohnabrechnung 2025
// Sachbezugswerte, Trinkgeld, Nacht-/Feiertagszuschläge, Minijobs

export interface GastronomyPayrollParams {
  grossMonthly: number;
  hoursWorked: number;
  
  // Mahlzeiten/Sachbezug
  breakfastsProvided: number;
  lunchesProvided: number;
  dinnersProvided: number;
  
  // Trinkgeld
  monthlyTips: number;
  tipsFromEmployer: boolean; // Vom Arbeitgeber verteilt = steuerpflichtig
  
  // Zuschläge
  nightHours: number; // 20:00 - 6:00 Uhr
  sundayHours: number;
  holidayHours: number;
  
  // Beschäftigungsart
  isMinijob: boolean;
  isMidijob?: boolean;
}

export interface GastronomyPayrollResult {
  // Grundgehalt
  baseGross: number;
  hourlyRate: number;
  
  // Sachbezugswerte
  mealBenefitTotal: number;
  mealBenefitDetails: {
    breakfast: { count: number; value: number };
    lunch: { count: number; value: number };
    dinner: { count: number; value: number };
  };
  
  // Trinkgeld
  tipsTaxFree: number;
  tipsTaxable: number;
  
  // Zuschläge
  nightBonus: number;
  sundayBonus: number;
  holidayBonus: number;
  totalBonuses: number;
  taxFreeBonuses: number;
  
  // Gesamt
  totalGross: number;
  taxableIncome: number;
  taxFreeIncome: number;
  
  details: string[];
}

// Sachbezugswerte 2025
const MEAL_VALUES_2025 = {
  breakfast: 2.17,
  lunch: 4.13,
  dinner: 4.13,
};

// Zuschlagssätze (steuerfrei nach § 3b EStG)
const BONUS_RATES = {
  night_20_24: 0.25, // 25% für 20-24 Uhr
  night_0_4: 0.40, // 40% für 0-4 Uhr
  night_4_6: 0.25, // 25% für 4-6 Uhr
  sunday: 0.50, // 50% für Sonntagsarbeit
  holiday_normal: 1.25, // 125% für normale Feiertage
  holiday_special: 1.50, // 150% für 24.12., 25.12., 1.5., 31.12.
};

// Steuerfreie Grenze für Grundlohn bei SFN-Zuschlägen
const SFN_GRUNDLOHN_LIMIT = 50; // 50€/Stunde Obergrenze

/**
 * Berechnet Sachbezugswerte für Mahlzeiten
 */
export function calculateMealBenefits(
  breakfasts: number,
  lunches: number,
  dinners: number
): {
  breakfast: { count: number; value: number };
  lunch: { count: number; value: number };
  dinner: { count: number; value: number };
  total: number;
} {
  const breakfast = { count: breakfasts, value: breakfasts * MEAL_VALUES_2025.breakfast };
  const lunch = { count: lunches, value: lunches * MEAL_VALUES_2025.lunch };
  const dinner = { count: dinners, value: dinners * MEAL_VALUES_2025.dinner };
  
  return {
    breakfast,
    lunch,
    dinner,
    total: breakfast.value + lunch.value + dinner.value,
  };
}

/**
 * Berechnet Trinkgeld-Behandlung
 */
export function calculateTipsTreatment(
  monthlyTips: number,
  fromEmployer: boolean
): {
  taxFree: number;
  taxable: number;
  details: string[];
} {
  if (fromEmployer) {
    // Vom Arbeitgeber verteiltes Trinkgeld ist steuerpflichtig
    return {
      taxFree: 0,
      taxable: monthlyTips,
      details: [
        `Trinkgeld vom Arbeitgeber verteilt: ${formatCurrency(monthlyTips)}`,
        `⚠️ Steuerpflichtig, da nicht direkt vom Gast!`,
      ],
    };
  }
  
  // Direkt vom Gast = steuerfrei
  return {
    taxFree: monthlyTips,
    taxable: 0,
    details: [
      `Trinkgeld direkt vom Gast: ${formatCurrency(monthlyTips)}`,
      `✅ Komplett steuerfrei nach § 3 Nr. 51 EStG`,
    ],
  };
}

/**
 * Berechnet steuerfreie SFN-Zuschläge (Sonntag/Feiertag/Nacht)
 */
export function calculateSfnBonuses(
  hourlyRate: number,
  nightHours: number,
  sundayHours: number,
  holidayHours: number
): {
  night: number;
  sunday: number;
  holiday: number;
  total: number;
  taxFree: number;
  details: string[];
} {
  // Grundlohn für Zuschläge ist auf 50€/h begrenzt
  const cappedHourlyRate = Math.min(hourlyRate, SFN_GRUNDLOHN_LIMIT);
  
  // Berechnung der Zuschläge
  const nightBonus = nightHours * cappedHourlyRate * BONUS_RATES.night_20_24;
  const sundayBonus = sundayHours * cappedHourlyRate * BONUS_RATES.sunday;
  const holidayBonus = holidayHours * cappedHourlyRate * BONUS_RATES.holiday_normal;
  
  const total = nightBonus + sundayBonus + holidayBonus;
  
  // Prüfen ob alles steuerfrei (wenn Grundlohn ≤ 50€)
  const taxFree = hourlyRate <= SFN_GRUNDLOHN_LIMIT ? total : 0;
  
  const details: string[] = [
    `Stundenlohn für Zuschläge: ${formatCurrency(cappedHourlyRate)} (max. ${formatCurrency(SFN_GRUNDLOHN_LIMIT)})`,
  ];
  
  if (nightHours > 0) {
    details.push(`Nachtarbeit: ${nightHours}h × ${(BONUS_RATES.night_20_24 * 100)}% = ${formatCurrency(nightBonus)}`);
  }
  if (sundayHours > 0) {
    details.push(`Sonntagsarbeit: ${sundayHours}h × ${(BONUS_RATES.sunday * 100)}% = ${formatCurrency(sundayBonus)}`);
  }
  if (holidayHours > 0) {
    details.push(`Feiertagsarbeit: ${holidayHours}h × ${(BONUS_RATES.holiday_normal * 100)}% = ${formatCurrency(holidayBonus)}`);
  }
  
  if (taxFree > 0) {
    details.push(`✅ Alle Zuschläge steuerfrei (§ 3b EStG)`);
  } else if (hourlyRate > SFN_GRUNDLOHN_LIMIT) {
    details.push(`⚠️ Zuschläge teilweise steuerpflichtig (Stundenlohn > ${formatCurrency(SFN_GRUNDLOHN_LIMIT)})`);
  }
  
  return {
    night: nightBonus,
    sunday: sundayBonus,
    holiday: holidayBonus,
    total,
    taxFree,
    details,
  };
}

/**
 * Minijob-Berechnung für Gastronomie
 */
export function calculateMinijobGastronomy(
  hoursWorked: number,
  hourlyRate: number,
  mealsProvided: number
): {
  grossWage: number;
  mealBenefit: number;
  totalBenefit: number;
  remainingMinijobLimit: number;
  isOverLimit: boolean;
  details: string[];
} {
  const MINIJOB_LIMIT = 556; // 2025
  
  const grossWage = hoursWorked * hourlyRate;
  const mealBenefit = mealsProvided * MEAL_VALUES_2025.lunch; // Vereinfacht alle als Mittagessen
  const totalBenefit = grossWage + mealBenefit;
  
  const remainingLimit = MINIJOB_LIMIT - totalBenefit;
  const isOverLimit = totalBenefit > MINIJOB_LIMIT;
  
  return {
    grossWage,
    mealBenefit,
    totalBenefit,
    remainingMinijobLimit: Math.max(0, remainingLimit),
    isOverLimit,
    details: [
      `Stundenlohn: ${formatCurrency(hourlyRate)}`,
      `Arbeitsstunden: ${hoursWorked}h`,
      `Lohn: ${formatCurrency(grossWage)}`,
      `Sachbezug Mahlzeiten: ${formatCurrency(mealBenefit)}`,
      `Gesamt: ${formatCurrency(totalBenefit)}`,
      isOverLimit 
        ? `❌ Minijob-Grenze (${formatCurrency(MINIJOB_LIMIT)}) überschritten!`
        : `✅ Verbleibend bis Grenze: ${formatCurrency(remainingLimit)}`,
    ],
  };
}

/**
 * Hauptberechnung Gastronomie-Lohn
 */
export function calculateGastronomyPayroll(params: GastronomyPayrollParams): GastronomyPayrollResult {
  const {
    grossMonthly,
    hoursWorked,
    breakfastsProvided,
    lunchesProvided,
    dinnersProvided,
    monthlyTips,
    tipsFromEmployer,
    nightHours,
    sundayHours,
    holidayHours,
    isMinijob,
  } = params;
  
  const hourlyRate = hoursWorked > 0 ? grossMonthly / hoursWorked : 0;
  
  // Sachbezüge
  const meals = calculateMealBenefits(breakfastsProvided, lunchesProvided, dinnersProvided);
  
  // Trinkgeld
  const tips = calculateTipsTreatment(monthlyTips, tipsFromEmployer);
  
  // SFN-Zuschläge
  const bonuses = calculateSfnBonuses(hourlyRate, nightHours, sundayHours, holidayHours);
  
  // Gesamtberechnung
  const totalGross = grossMonthly + meals.total + tips.taxable + bonuses.total;
  const taxableIncome = grossMonthly + meals.total + tips.taxable + (bonuses.total - bonuses.taxFree);
  const taxFreeIncome = tips.taxFree + bonuses.taxFree;
  
  const details: string[] = [
    `=== Gastronomie-Abrechnung ===`,
    ``,
    `Grundgehalt: ${formatCurrency(grossMonthly)}`,
    `Stundenlohn: ${formatCurrency(hourlyRate)}/h`,
    ``,
    `=== Sachbezugswerte 2025 ===`,
    `Frühstück: ${meals.breakfast.count}x × ${formatCurrency(MEAL_VALUES_2025.breakfast)} = ${formatCurrency(meals.breakfast.value)}`,
    `Mittagessen: ${meals.lunch.count}x × ${formatCurrency(MEAL_VALUES_2025.lunch)} = ${formatCurrency(meals.lunch.value)}`,
    `Abendessen: ${meals.dinner.count}x × ${formatCurrency(MEAL_VALUES_2025.dinner)} = ${formatCurrency(meals.dinner.value)}`,
    `Sachbezug gesamt: ${formatCurrency(meals.total)}`,
    ``,
    `=== Trinkgeld ===`,
    ...tips.details,
    ``,
    `=== SFN-Zuschläge ===`,
    ...bonuses.details,
    ``,
    `=== Zusammenfassung ===`,
    `Steuerpflichtiges Einkommen: ${formatCurrency(taxableIncome)}`,
    `Steuerfreie Bezüge: ${formatCurrency(taxFreeIncome)}`,
    `Brutto gesamt: ${formatCurrency(totalGross)}`,
  ];
  
  if (isMinijob) {
    details.push(``, `⚠️ Minijob: Prüfen Sie die ${formatCurrency(556)}-Grenze!`);
  }
  
  return {
    baseGross: grossMonthly,
    hourlyRate,
    
    mealBenefitTotal: meals.total,
    mealBenefitDetails: {
      breakfast: meals.breakfast,
      lunch: meals.lunch,
      dinner: meals.dinner,
    },
    
    tipsTaxFree: tips.taxFree,
    tipsTaxable: tips.taxable,
    
    nightBonus: bonuses.night,
    sundayBonus: bonuses.sunday,
    holidayBonus: bonuses.holiday,
    totalBonuses: bonuses.total,
    taxFreeBonuses: bonuses.taxFree,
    
    totalGross,
    taxableIncome,
    taxFreeIncome,
    
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
