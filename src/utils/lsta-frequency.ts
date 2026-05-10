/**
 * Lohnsteueranmeldungs-Zeitraum nach § 41a Abs. 2 EStG
 * ─────────────────────────────────────────────────────────────
 *   Vorjahressteuer  ≤ 1.080 €      → jährlich
 *   1.080 €  < x  ≤ 5.000 €         → vierteljährlich
 *           x  > 5.000 €            → monatlich
 */
export type LstaFrequency = "monthly" | "quarterly" | "yearly";

export const LSTA_THRESHOLDS = {
  yearlyMax: 1080, // ≤ → jährlich
  quarterlyMax: 5000, // ≤ → vierteljährlich, > → monatlich
} as const;

export function getLstaFrequency(previousYearTotalTax: number): LstaFrequency {
  if (previousYearTotalTax <= LSTA_THRESHOLDS.yearlyMax) return "yearly";
  if (previousYearTotalTax <= LSTA_THRESHOLDS.quarterlyMax) return "quarterly";
  return "monthly";
}

/** Liefert die Fälligkeit (10. des Folgemonats / Folgequartals / Folgejahres) */
export function getLstaDueDate(year: number, period: number, frequency: LstaFrequency): Date {
  if (frequency === "monthly") return new Date(year, period, 10); // period = month (1-12)
  if (frequency === "quarterly") return new Date(year, period * 3, 10); // period = 1..4
  return new Date(year + 1, 0, 10); // 10.01. Folgejahr
}