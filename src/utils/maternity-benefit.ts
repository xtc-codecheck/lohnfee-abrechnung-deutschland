/**
 * Arbeitgeberzuschuss zum Mutterschaftsgeld (§ 20 MuSchG)
 * 
 * Während der Mutterschutzfrist (6 Wochen vor + 8 Wochen nach Geburt):
 * - Krankenkasse zahlt max. 13 €/Tag Mutterschaftsgeld
 * - Arbeitgeber zahlt die Differenz zum durchschnittlichen Nettoentgelt
 * 
 * Referenzzeitraum für Durchschnittsentgelt: letzte 3 Monate vor Beginn
 * der Schutzfrist (§ 20 Abs. 1 MuSchG).
 * 
 * AG-Zuschuss wird über U2-Umlage von der Krankenkasse erstattet.
 */

import { differenceInCalendarDays, addDays, addWeeks, subWeeks } from 'date-fns';
import { roundCurrency } from '@/lib/formatters';

// ============= Konstanten =============

export const MATERNITY_CONSTANTS = {
  /** Max. Mutterschaftsgeld der KK pro Tag */
  dailyInsuranceBenefit: 13.00,
  /** Schutzfrist vor Geburt (Wochen) */
  prebirthProtectionWeeks: 6,
  /** Schutzfrist nach Geburt (Wochen) - normal */
  postbirthProtectionWeeks: 8,
  /** Schutzfrist nach Geburt bei Früh-/Mehrlingsgeburt */
  postbirthProtectionWeeksExtended: 12,
} as const;

// ============= Typen =============

export interface MaternityBenefitInput {
  /** Voraussichtlicher/tatsächlicher Entbindungstermin */
  expectedDeliveryDate: Date;
  /** Tatsächlicher Entbindungstermin (falls abweichend) */
  actualDeliveryDate?: Date;
  /** Durchschnittliches Nettoentgelt der letzten 3 Monate (monatlich) */
  averageNetMonthly: number;
  /** Frühgeburt oder Mehrlingsgeburt? */
  isPrematureOrMultiple?: boolean;
  /** Behinderung des Kindes festgestellt? (→ 12 Wochen) */
  isChildDisabled?: boolean;
}

export interface MaternityBenefitResult {
  /** Beginn der Schutzfrist (6 Wochen vor ET) */
  protectionStartDate: Date;
  /** Ende der Schutzfrist (8/12 Wochen nach Geburt) */
  protectionEndDate: Date;
  /** Gesamttage der Schutzfrist */
  totalProtectionDays: number;
  /** Tägliches durchschnittliches Nettoentgelt */
  dailyNetSalary: number;
  /** Tägliches Mutterschaftsgeld der KK */
  dailyInsuranceBenefit: number;
  /** Täglicher AG-Zuschuss */
  dailyEmployerSupplement: number;
  /** Gesamt AG-Zuschuss für die gesamte Schutzfrist */
  totalEmployerSupplement: number;
  /** Gesamt Mutterschaftsgeld KK */
  totalInsuranceBenefit: number;
  /** Gesamtbetrag für Arbeitnehmerin */
  totalBenefit: number;
  /** Berechnungsdetails */
  details: string[];
}

// ============= Berechnung =============

/**
 * Berechnet den AG-Zuschuss zum Mutterschaftsgeld
 */
export function calculateMaternityBenefit(input: MaternityBenefitInput): MaternityBenefitResult {
  const {
    expectedDeliveryDate,
    actualDeliveryDate,
    averageNetMonthly,
    isPrematureOrMultiple = false,
    isChildDisabled = false,
  } = input;

  const details: string[] = [];
  const deliveryDate = actualDeliveryDate ?? expectedDeliveryDate;

  // 1. Schutzfrist berechnen
  const protectionStartDate = subWeeks(expectedDeliveryDate, MATERNITY_CONSTANTS.prebirthProtectionWeeks);
  
  const postWeeks = (isPrematureOrMultiple || isChildDisabled)
    ? MATERNITY_CONSTANTS.postbirthProtectionWeeksExtended
    : MATERNITY_CONSTANTS.postbirthProtectionWeeks;
  
  const protectionEndDate = addWeeks(deliveryDate, postWeeks);

  // Bei Frühgeburt: Verlorene Tage vor Geburt werden nach Geburt angehängt
  let extraDays = 0;
  if (actualDeliveryDate && actualDeliveryDate < expectedDeliveryDate) {
    extraDays = differenceInCalendarDays(expectedDeliveryDate, actualDeliveryDate);
    details.push(`Frühgeburt: ${extraDays} Tage werden nach der Geburt nachgeholt`);
  }
  
  const adjustedEndDate = extraDays > 0 ? addDays(protectionEndDate, extraDays) : protectionEndDate;
  const totalProtectionDays = differenceInCalendarDays(adjustedEndDate, protectionStartDate) + 1;

  // 2. Tägliches Nettoentgelt (Kalendertagsbasis: /30)
  const dailyNetSalary = roundCurrency(averageNetMonthly / 30);
  const dailyInsuranceBenefit = MATERNITY_CONSTANTS.dailyInsuranceBenefit;

  // 3. AG-Zuschuss = Differenz Netto - KK-Mutterschaftsgeld
  const dailyEmployerSupplement = roundCurrency(
    Math.max(0, dailyNetSalary - dailyInsuranceBenefit)
  );

  // 4. Gesamtbeträge
  const totalEmployerSupplement = roundCurrency(dailyEmployerSupplement * totalProtectionDays);
  const totalInsuranceBenefit = roundCurrency(dailyInsuranceBenefit * totalProtectionDays);
  const totalBenefit = roundCurrency(totalEmployerSupplement + totalInsuranceBenefit);

  details.push(`Schutzfrist: ${protectionStartDate.toISOString().split('T')[0]} bis ${adjustedEndDate.toISOString().split('T')[0]}`);
  details.push(`Gesamttage: ${totalProtectionDays}`);
  details.push(`Ø Netto/Tag: ${dailyNetSalary.toFixed(2)} €`);
  details.push(`KK-Mutterschaftsgeld/Tag: ${dailyInsuranceBenefit.toFixed(2)} €`);
  details.push(`AG-Zuschuss/Tag: ${dailyEmployerSupplement.toFixed(2)} €`);
  details.push(`AG-Zuschuss gesamt: ${totalEmployerSupplement.toFixed(2)} €`);
  if (isPrematureOrMultiple || isChildDisabled) {
    details.push(`Verlängerte Schutzfrist: ${postWeeks} Wochen nach Geburt`);
  }

  return {
    protectionStartDate,
    protectionEndDate: adjustedEndDate,
    totalProtectionDays,
    dailyNetSalary,
    dailyInsuranceBenefit,
    dailyEmployerSupplement,
    totalEmployerSupplement,
    totalInsuranceBenefit,
    totalBenefit,
    details,
  };
}
