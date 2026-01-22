/**
 * Zentrale Factory für TaxCalculationParams
 * 
 * Eliminiert Code-Duplikation bei der Erstellung von Steuerberechnungsparametern
 * aus Employee-Objekten. Wird in mehreren Komponenten und Hooks verwendet.
 */

import { Employee, CHURCH_TAX_RATES, GERMAN_STATE_NAMES } from '@/types/employee';
import { TaxCalculationParams } from '@/utils/tax-calculation';

/**
 * Standard-Werte für fehlende Daten
 */
const DEFAULTS = {
  healthInsuranceRate: 1.7, // TK-Standard
  churchTaxRate: 9, // Standard für die meisten Bundesländer
  age: 30,
} as const;

/**
 * Ost-Deutsche Bundesländer für isEastGermany-Flag
 */
const EAST_GERMAN_STATES = [
  'brandenburg',
  'mecklenburg-vorpommern',
  'sachsen',
  'sachsen-anhalt',
  'thueringen',
] as const;

/**
 * Berechnet das Alter aus einem Geburtsdatum
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Prüft ob ein Bundesland in Ostdeutschland liegt
 */
export function isEastGermanState(state: string): boolean {
  return EAST_GERMAN_STATES.includes(state.toLowerCase() as typeof EAST_GERMAN_STATES[number]);
}

/**
 * Ermittelt den Kirchensteuersatz basierend auf Bundesland und Religion
 */
export function getChurchTaxRate(state?: string, religion?: string, hasChurchTax?: boolean): number {
  if (!hasChurchTax || !religion || !state) return 0;
  
  const stateKey = state.toLowerCase().replace(/\s+/g, '-');
  const religionKey = religion as keyof typeof CHURCH_TAX_RATES[string];
  
  return CHURCH_TAX_RATES[stateKey]?.[religionKey] ?? DEFAULTS.churchTaxRate;
}

/**
 * Erstellt TaxCalculationParams aus einem Employee-Objekt
 * 
 * @param employee - Das Employee-Objekt
 * @param overrides - Optionale Überschreibungen (z.B. anderes Bruttogehalt)
 * @returns TaxCalculationParams für calculateCompleteTax()
 * 
 * @example
 * ```typescript
 * const employee = getEmployee(id);
 * const params = buildTaxParamsFromEmployee(employee);
 * const result = calculateCompleteTax(params);
 * ```
 */
export function buildTaxParamsFromEmployee(
  employee: Employee,
  overrides?: Partial<TaxCalculationParams>
): TaxCalculationParams {
  const { personalData, salaryData, employmentData } = employee;
  
  // Alter berechnen
  const age = personalData.dateOfBirth 
    ? calculateAge(new Date(personalData.dateOfBirth))
    : DEFAULTS.age;
  
  // Kinderlos-Status bestimmen
  const isChildless = (personalData.childAllowances ?? 0) === 0;
  
  // Ost-/West-Status
  const isEastGermany = isEastGermanState(personalData.address?.state ?? '');
  
  // Kirchensteuersatz ermitteln
  const churchTaxRate = getChurchTaxRate(
    personalData.address?.state,
    personalData.religion,
    personalData.churchTax
  );
  
  // Krankenversicherungs-Zusatzbeitrag
  const healthInsuranceRate = personalData.healthInsurance?.additionalRate 
    ?? DEFAULTS.healthInsuranceRate;
  
  // Basis-Parameter erstellen
  const baseParams: TaxCalculationParams = {
    grossSalaryYearly: salaryData.grossSalary * 12,
    taxClass: personalData.taxClass,
    childAllowances: personalData.childAllowances ?? 0,
    churchTax: personalData.churchTax ?? false,
    churchTaxRate,
    healthInsuranceRate,
    isEastGermany,
    isChildless,
    age,
    employmentType: employmentData.employmentType,
  };
  
  // Überschreibungen anwenden
  return {
    ...baseParams,
    ...overrides,
  };
}

/**
 * Erstellt TaxCalculationParams für einen Monatswert
 * Convenience-Funktion für monatliche Berechnungen
 */
export function buildTaxParamsFromEmployeeMonthly(
  employee: Employee,
  monthlyGross: number,
  overrides?: Partial<TaxCalculationParams>
): TaxCalculationParams {
  return buildTaxParamsFromEmployee(employee, {
    grossSalaryYearly: monthlyGross * 12,
    ...overrides,
  });
}

/**
 * Erstellt minimale TaxCalculationParams ohne Employee
 * Für Quick-Calculator und ähnliche Anwendungsfälle
 */
export function buildQuickTaxParams(options: {
  grossMonthly: number;
  taxClass: string;
  childAllowances?: number;
  churchTax?: boolean;
  healthInsuranceRate?: number;
  isEastGermany?: boolean;
}): TaxCalculationParams {
  const isChildless = (options.childAllowances ?? 0) === 0;
  
  return {
    grossSalaryYearly: options.grossMonthly * 12,
    taxClass: options.taxClass,
    childAllowances: options.childAllowances ?? 0,
    churchTax: options.churchTax ?? false,
    churchTaxRate: options.churchTax ? DEFAULTS.churchTaxRate : 0,
    healthInsuranceRate: options.healthInsuranceRate ?? DEFAULTS.healthInsuranceRate,
    isEastGermany: options.isEastGermany ?? false,
    isChildless,
    age: DEFAULTS.age,
  };
}
