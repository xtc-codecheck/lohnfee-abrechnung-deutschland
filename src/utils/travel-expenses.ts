/**
 * Reisekosten-Modul (BMF-konform)
 * ─────────────────────────────────────────────────────────────
 * Berechnet Verpflegungspauschalen, km-Pauschalen,
 * Übernachtungs-Pauschale und Auslandstagegelder gemäß BMF.
 *
 * BMF-Schreiben Auslandsreisekosten 2025/2026.
 * Werte für Deutschland: § 9 Abs. 4a EStG.
 */

export type Country = 'DE' | string;
export type VehicleType = 'pkw' | 'motorrad' | 'other';

/** Verpflegungspauschalen Inland (BMF) */
export const VERPFLEGUNG_DE_2025 = {
  fullDay: 28, // > 24h Abwesenheit (Tagespauschale)
  partialDay: 14, // > 8h oder An-/Abreisetag
} as const;

/** Übernachtungspauschale Inland (wenn kein Beleg) */
export const UEBERNACHTUNG_DE_PAUSCHALE = 20;

/** km-Pauschalen § 9 Abs. 1 Nr. 4a EStG */
export const KM_PAUSCHALEN = {
  pkw: 0.30,
  motorrad: 0.20,
  other: 0.30,
} as const;

/** Auslandstagegelder Auszug (BMF 2025) – häufige Länder */
export const VERPFLEGUNG_AUSLAND_2025: Record<string, { fullDay: number; partialDay: number; lodging: number }> = {
  AT: { fullDay: 40, partialDay: 27, lodging: 108 },
  CH: { fullDay: 64, partialDay: 43, lodging: 169 },
  FR: { fullDay: 58, partialDay: 39, lodging: 135 },
  IT: { fullDay: 40, partialDay: 27, lodging: 135 },
  NL: { fullDay: 47, partialDay: 32, lodging: 119 },
  PL: { fullDay: 30, partialDay: 20, lodging: 90 },
  US: { fullDay: 64, partialDay: 43, lodging: 184 },
  GB: { fullDay: 58, partialDay: 39, lodging: 159 },
};

export interface TravelLegInput {
  legDate: Date;
  durationHours: number;
  isOvernight: boolean;
  isArrivalOrDeparture: boolean;
  countryCode: string;
  kmDistance: number;
  vehicleType: VehicleType;
  lodgingReceiptAmount?: number; // wenn Beleg vorhanden
}

export interface TravelLegResult {
  mealAllowance: number;
  lodgingAmount: number;
  mileageAmount: number;
  total: number;
  /** Steuerfrei lt. EStG */
  taxFree: number;
  /** Steuerpflichtig (Übersatz) */
  taxable: number;
}

function getMealAllowance(country: string, hours: number, isArrivalOrDeparture: boolean): number {
  const rates = country === 'DE'
    ? VERPFLEGUNG_DE_2025
    : VERPFLEGUNG_AUSLAND_2025[country] ?? VERPFLEGUNG_DE_2025;
  if (hours >= 24) return rates.fullDay;
  if (isArrivalOrDeparture) return rates.partialDay;
  if (hours > 8) return rates.partialDay;
  return 0;
}

function getLodgingPauschale(country: string): number {
  if (country === 'DE') return UEBERNACHTUNG_DE_PAUSCHALE;
  return VERPFLEGUNG_AUSLAND_2025[country]?.lodging ?? UEBERNACHTUNG_DE_PAUSCHALE;
}

function round2(n: number) { return Math.round(n * 100) / 100; }

export function calculateTravelLeg(input: TravelLegInput): TravelLegResult {
  const meal = getMealAllowance(input.countryCode, input.durationHours, input.isArrivalOrDeparture);
  const lodging = input.isOvernight
    ? (input.lodgingReceiptAmount ?? getLodgingPauschale(input.countryCode))
    : 0;
  const kmRate = KM_PAUSCHALEN[input.vehicleType] ?? KM_PAUSCHALEN.pkw;
  const mileage = round2(input.kmDistance * kmRate);

  // Lodging mit Beleg ist immer steuerfrei (bis Belegbetrag); Pauschale nur DE 20€.
  const lodgingTaxFree = lodging;

  const total = round2(meal + lodging + mileage);
  return {
    mealAllowance: meal,
    lodgingAmount: round2(lodging),
    mileageAmount: mileage,
    total,
    taxFree: round2(meal + lodgingTaxFree + mileage),
    taxable: 0,
  };
}

export function aggregateTrip(legs: TravelLegResult[]) {
  return legs.reduce((acc, l) => ({
    mealAllowance: round2(acc.mealAllowance + l.mealAllowance),
    lodgingAmount: round2(acc.lodgingAmount + l.lodgingAmount),
    mileageAmount: round2(acc.mileageAmount + l.mileageAmount),
    total: round2(acc.total + l.total),
    taxFree: round2(acc.taxFree + l.taxFree),
    taxable: round2(acc.taxable + l.taxable),
  }), { mealAllowance: 0, lodgingAmount: 0, mileageAmount: 0, total: 0, taxFree: 0, taxable: 0 });
}