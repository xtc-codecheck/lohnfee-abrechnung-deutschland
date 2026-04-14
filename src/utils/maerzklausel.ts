/**
 * Märzklausel (§ 23a Abs. 4 SGB IV)
 * 
 * Einmalzahlungen (z.B. Urlaubsgeld, Weihnachtsgeld, Boni), die im
 * ersten Quartal (Januar–März) ausgezahlt werden, können dem Vorjahr
 * zugeordnet werden, wenn:
 * 
 * 1. Die Einmalzahlung zusammen mit dem lfd. Entgelt die anteilige
 *    Beitragsbemessungsgrenze des laufenden Jahres überschreitet
 * 2. Aber im Vorjahr noch SV-Luft (= Differenz BBG - tatsächliches Entgelt)
 *    vorhanden war
 * 
 * Zweck: Vermeidung einer höheren SV-Belastung durch Zuordnung zum Vorjahr.
 */

import { roundCurrency } from '@/lib/formatters';
import { BBG_2025_MONTHLY } from '@/constants/social-security';

// ============= Typen =============

export interface MaerzklauselInput {
  /** Monat der Einmalzahlung (1 = Januar, 2 = Februar, 3 = März) */
  paymentMonth: 1 | 2 | 3;
  /** Höhe der Einmalzahlung */
  oneTimePaymentAmount: number;
  /** Laufendes monatliches Bruttoentgelt im aktuellen Jahr */
  currentMonthlyGross: number;
  /** SV-pflichtiges Bruttoentgelt des Vorjahres (gesamt) */
  previousYearTotalGross: number;
  /** Jährliche BBG RV des Vorjahres */
  previousYearBBG_RV: number;
  /** Jährliche BBG KV des Vorjahres */
  previousYearBBG_KV: number;
  /** Ist der MA in Ostdeutschland beschäftigt? */
  isEastGermany?: boolean;
}

export interface MaerzklauselResult {
  /** Ob die Märzklausel anwendbar ist */
  isApplicable: boolean;
  /** Betrag, der dem Vorjahr zugeordnet wird (SV-pflichtig im Vorjahr) */
  amountAttributedToPreviousYear: number;
  /** Betrag, der im laufenden Jahr SV-pflichtig bleibt */
  amountInCurrentYear: number;
  /** SV-Luft im Vorjahr (verfügbarer Spielraum) */
  previousYearSVRoom: number;
  /** Begründung */
  explanation: string[];
}

// ============= Berechnung =============

/**
 * Prüft und berechnet die Märzklausel-Anwendung
 */
export function calculateMaerzklausel(input: MaerzklauselInput): MaerzklauselResult {
  const {
    paymentMonth,
    oneTimePaymentAmount,
    currentMonthlyGross,
    previousYearTotalGross,
    previousYearBBG_RV,
    previousYearBBG_KV,
    isEastGermany = false,
  } = input;

  const explanation: string[] = [];

  // 1. Nur Januar–März
  if (paymentMonth < 1 || paymentMonth > 3) {
    return {
      isApplicable: false,
      amountAttributedToPreviousYear: 0,
      amountInCurrentYear: oneTimePaymentAmount,
      previousYearSVRoom: 0,
      explanation: ['Märzklausel nur für Zahlungen in Januar–März anwendbar.'],
    };
  }

  // 2. Anteilige BBG des laufenden Jahres bis zum Zahlungsmonat
  const currentYearBBG_RV_monthly = isEastGermany ? BBG_2025_MONTHLY.pensionEast : BBG_2025_MONTHLY.pensionWest;
  const partialBBG = roundCurrency(currentYearBBG_RV_monthly * paymentMonth);
  const partialGross = roundCurrency(currentMonthlyGross * paymentMonth);
  const totalWithPayment = roundCurrency(partialGross + oneTimePaymentAmount);

  explanation.push(`Zahlungsmonat: ${paymentMonth}/2025`);
  explanation.push(`Anteilige BBG (RV) bis Monat ${paymentMonth}: ${partialBBG.toFixed(2)} €`);
  explanation.push(`Lfd. Entgelt bis Monat ${paymentMonth}: ${partialGross.toFixed(2)} €`);
  explanation.push(`+ Einmalzahlung: ${oneTimePaymentAmount.toFixed(2)} €`);
  explanation.push(`= Gesamt: ${totalWithPayment.toFixed(2)} €`);

  // 3. Prüfung: Überschreitet die Summe die anteilige BBG?
  if (totalWithPayment <= partialBBG) {
    explanation.push('→ Keine Überschreitung der anteiligen BBG → Märzklausel nicht anwendbar.');
    return {
      isApplicable: false,
      amountAttributedToPreviousYear: 0,
      amountInCurrentYear: oneTimePaymentAmount,
      previousYearSVRoom: 0,
      explanation,
    };
  }

  // 4. SV-Luft im Vorjahr berechnen
  const previousYearSVRoom = roundCurrency(
    Math.max(0, previousYearBBG_RV - previousYearTotalGross)
  );

  explanation.push(`SV-Luft Vorjahr (BBG ${previousYearBBG_RV.toFixed(2)} € - Brutto ${previousYearTotalGross.toFixed(2)} €): ${previousYearSVRoom.toFixed(2)} €`);

  if (previousYearSVRoom <= 0) {
    explanation.push('→ Keine SV-Luft im Vorjahr → Märzklausel nicht anwendbar.');
    return {
      isApplicable: false,
      amountAttributedToPreviousYear: 0,
      amountInCurrentYear: oneTimePaymentAmount,
      previousYearSVRoom: 0,
      explanation,
    };
  }

  // 5. Betrag dem Vorjahr zuordnen (max. SV-Luft, max. Einmalzahlung)
  const amountAttributedToPreviousYear = roundCurrency(
    Math.min(oneTimePaymentAmount, previousYearSVRoom)
  );
  const amountInCurrentYear = roundCurrency(oneTimePaymentAmount - amountAttributedToPreviousYear);

  explanation.push(`→ Märzklausel anwendbar!`);
  explanation.push(`  Dem Vorjahr zugeordnet: ${amountAttributedToPreviousYear.toFixed(2)} €`);
  explanation.push(`  Im laufenden Jahr: ${amountInCurrentYear.toFixed(2)} €`);

  return {
    isApplicable: true,
    amountAttributedToPreviousYear,
    amountInCurrentYear,
    previousYearSVRoom,
    explanation,
  };
}
