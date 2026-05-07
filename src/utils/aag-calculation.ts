/**
 * AAG – Aufwendungsausgleichsgesetz
 * ────────────────────────────────────────────────────────
 * Berechnung der Erstattungsanträge U1 (Krankheit) und U2
 * (Mutterschaft) gegenüber den Krankenkassen.
 *
 * U1: Erstattung der Entgeltfortzahlung im Krankheitsfall.
 *     Pflicht für Arbeitgeber mit ≤ 30 Beschäftigten.
 *     Erstattungssatz wählbar (40 % – 80 %, je Krankenkasse).
 *
 * U2: Erstattung des Arbeitgeberzuschusses zum
 *     Mutterschaftsgeld + Beiträge. Pflicht für ALLE
 *     Arbeitgeber, unabhängig von der Größe.
 *     Erstattungssatz idR 100 %.
 *
 * Hinweis: Die genauen Erstattungssätze sind je Krankenkasse
 * unterschiedlich (Satzungsleistung). Default-Werte stehen unten,
 * können aber pro Antrag überschrieben werden.
 */

export type AagAntragTyp = 'U1' | 'U2';

export interface AagAntragInput {
  antragTyp: AagAntragTyp;
  bruttoEntgelt: number;        // im Erstattungszeitraum fortgezahltes Brutto
  fortzahlungstage: number;     // Kalendertage der Entgeltfortzahlung
  svBeitraegeAg: number;        // AG-Anteile zur SV (für Pauschal-Erstattung)
  erstattungssatz?: number;     // 0..1, optional – Default je Antrag-Typ
}

export interface AagAntragErgebnis {
  bruttoEntgelt: number;
  fortzahlungstage: number;
  erstattungssatz: number;
  erstattungBrutto: number;
  erstattungSv: number;
  erstattungGesamt: number;
}

export const DEFAULT_U1_SATZ = 0.7;   // 70 % – häufigster Wahlsatz
export const DEFAULT_U2_SATZ = 1.0;   // 100 % – Standard

/**
 * Rundet auf 2 Nachkommastellen (Cent-genau, kaufmännisch).
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateAagErstattung(input: AagAntragInput): AagAntragErgebnis {
  const satz =
    input.erstattungssatz ??
    (input.antragTyp === 'U1' ? DEFAULT_U1_SATZ : DEFAULT_U2_SATZ);

  const erstattungBrutto = round2(input.bruttoEntgelt * satz);
  const erstattungSv = round2(input.svBeitraegeAg * satz);

  return {
    bruttoEntgelt: round2(input.bruttoEntgelt),
    fortzahlungstage: Math.max(0, Math.floor(input.fortzahlungstage)),
    erstattungssatz: satz,
    erstattungBrutto,
    erstattungSv,
    erstattungGesamt: round2(erstattungBrutto + erstattungSv),
  };
}

/**
 * Prüft, ob ein Arbeitgeber U1-pflichtig ist.
 * Stichtag-Regel: > 30 Mitarbeiter (umgerechnet auf Vollzeit) sind befreit.
 * Auszubildende, GF, Schwerbehinderte zählen reduziert/gar nicht.
 * Hier vereinfachte Headcount-Prüfung – Detaillogik kann später
 * verfeinert werden.
 */
export function isU1Pflichtig(activeEmployeeCount: number): boolean {
  return activeEmployeeCount <= 30;
}

/**
 * U2 ist immer pflichtig, unabhängig von der Betriebsgröße.
 */
export function isU2Pflichtig(): boolean {
  return true;
}
