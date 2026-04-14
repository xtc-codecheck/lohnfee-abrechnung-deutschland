/**
 * Pfändungsberechnung nach § 850c ZPO
 * 
 * Berechnet den pfändbaren und unpfändbaren Anteil des Nettoeinkommens.
 * Basiert auf der Pfändungstabelle 2025 (gültig ab 01.07.2024).
 * 
 * Quelle: Pfändungsfreigrenzenbekanntmachung 2024/2025
 */

import { roundCurrency } from '@/lib/formatters';

// ============= Pfändungsfreigrenzen 2025 =============

/**
 * Pfändungstabelle 2025 (ab 01.07.2024)
 * Monatliche Beträge in Euro
 */
export const GARNISHMENT_TABLE_2025 = {
  /** Grundfreibetrag (ohne Unterhaltspflichten) */
  baseExemption: 1491.75,
  /** Erhöhung je unterhaltspflichtiger Person */
  perDependentIncrease: 561.43,
  /** Maximale Anzahl berücksichtigter Unterhaltspflichten */
  maxDependents: 5,
  /** Pfändungsquote über dem Freibetrag: 
   * Bis zu einem bestimmten Betrag werden 3/10 gepfändet,
   * für jede unterhaltspflichtige Person reduziert sich der pfändbare Anteil */
  basePfaendungsRate: 0.3, // 30% des übersteigenden Betrags (0 Unterhaltsberechtigte)
  /** Reduktion der Rate pro Unterhaltsberechtigten */
  rateReductionPerDependent: 0.1, // -10% pro Person
  /** Obergrenze, ab der alles pfändbar ist */
  fullGarnishmentThreshold: 4298.81,
} as const;

// ============= Typen =============

export interface GarnishmentInput {
  /** Monatliches Nettoeinkommen */
  netIncome: number;
  /** Anzahl der Personen, denen der Schuldner Unterhalt zahlt */
  numberOfDependents: number;
  /** Mehrere Pfändungen? Rangfolge beachten */
  garnishmentRank?: number;
}

export interface GarnishmentResult {
  /** Monatliches Nettoeinkommen */
  netIncome: number;
  /** Unpfändbarer Betrag (verbleibt beim Schuldner) */
  exemptAmount: number;
  /** Pfändbarer Betrag (wird abgeführt) */
  garnishableAmount: number;
  /** Berechneter Freibetrag */
  freeAllowance: number;
  /** Anzahl Unterhaltspflichten */
  numberOfDependents: number;
  /** Berechnungsdetails */
  calculationDetails: string[];
}

// ============= Berechnung =============

/**
 * Berechnet den pfändbaren Betrag nach § 850c ZPO
 */
export function calculateGarnishment(input: GarnishmentInput): GarnishmentResult {
  const { netIncome, numberOfDependents } = input;
  const details: string[] = [];
  const table = GARNISHMENT_TABLE_2025;

  // Anzahl auf Maximum begrenzen
  const effectiveDependents = Math.min(Math.max(0, numberOfDependents), table.maxDependents);

  // Freibetrag berechnen
  const freeAllowance = roundCurrency(
    table.baseExemption + (effectiveDependents * table.perDependentIncrease)
  );

  details.push(`Grundfreibetrag: ${table.baseExemption.toFixed(2)} €`);
  if (effectiveDependents > 0) {
    details.push(
      `+ ${effectiveDependents} Unterhaltspflichtige × ${table.perDependentIncrease.toFixed(2)} € = ${(effectiveDependents * table.perDependentIncrease).toFixed(2)} €`
    );
  }
  details.push(`Pfändungsfreibetrag: ${freeAllowance.toFixed(2)} €`);

  // Wenn Netto unter Freibetrag → nichts pfändbar
  if (netIncome <= freeAllowance) {
    details.push('Nettoeinkommen liegt unter dem Freibetrag → nichts pfändbar');
    return {
      netIncome,
      exemptAmount: netIncome,
      garnishableAmount: 0,
      freeAllowance,
      numberOfDependents: effectiveDependents,
      calculationDetails: details,
    };
  }

  // Wenn über Obergrenze → alles über Freibetrag pfändbar
  if (netIncome >= table.fullGarnishmentThreshold) {
    const garnishableAmount = roundCurrency(netIncome - freeAllowance);
    details.push(`Nettoeinkommen über Obergrenze (${table.fullGarnishmentThreshold.toFixed(2)} €)`);
    details.push(`Vollständig pfändbar: ${garnishableAmount.toFixed(2)} €`);
    return {
      netIncome,
      exemptAmount: freeAllowance,
      garnishableAmount,
      freeAllowance,
      numberOfDependents: effectiveDependents,
      calculationDetails: details,
    };
  }

  // Normaler Fall: Pfändungsrate anwenden
  const exceeding = roundCurrency(netIncome - freeAllowance);
  const rate = Math.max(0, table.basePfaendungsRate - (effectiveDependents * table.rateReductionPerDependent));
  const garnishableAmount = roundCurrency(exceeding * rate);

  details.push(`Übersteigender Betrag: ${exceeding.toFixed(2)} €`);
  details.push(`Pfändungsrate: ${(rate * 100).toFixed(0)}% (Basis 30% - ${effectiveDependents} × 10%)`);
  details.push(`Pfändbarer Betrag: ${garnishableAmount.toFixed(2)} €`);

  return {
    netIncome,
    exemptAmount: roundCurrency(netIncome - garnishableAmount),
    garnishableAmount,
    freeAllowance,
    numberOfDependents: effectiveDependents,
    calculationDetails: details,
  };
}

/**
 * Berechnet den pfändbaren Betrag für Unterhalts-Pfändungen (§ 850d ZPO)
 * Bei Unterhaltspfändungen gelten niedrigere Freibeträge.
 */
export function calculateMaintenanceGarnishment(
  netIncome: number,
  existenceMimimum: number = 1200 // Kulturelles Existenzminimum
): GarnishmentResult {
  const details: string[] = [];
  
  const freeAllowance = existenceMimimum;
  details.push(`Existenzminimum (§ 850d ZPO): ${freeAllowance.toFixed(2)} €`);

  if (netIncome <= freeAllowance) {
    details.push('Nettoeinkommen liegt unter Existenzminimum → nichts pfändbar');
    return {
      netIncome,
      exemptAmount: netIncome,
      garnishableAmount: 0,
      freeAllowance,
      numberOfDependents: 0,
      calculationDetails: details,
    };
  }

  const garnishableAmount = roundCurrency(netIncome - freeAllowance);
  details.push(`Pfändbarer Betrag (Unterhalt): ${garnishableAmount.toFixed(2)} €`);

  return {
    netIncome,
    exemptAmount: freeAllowance,
    garnishableAmount,
    freeAllowance,
    numberOfDependents: 0,
    calculationDetails: details,
  };
}
