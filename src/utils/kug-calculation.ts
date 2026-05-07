/**
 * Kurzarbeitergeld (KUG) – Berechnung nach §§ 105 ff. SGB III
 * ───────────────────────────────────────────────────────────
 * KUG = (pauschaliertes Nettoentgelt aus Soll) − (pauschaliertes Nettoentgelt aus Ist)
 * × Leistungssatz (60 % bzw. 67 % mit Kind).
 *
 * Vereinfachung: Wir nutzen ein lineares pauschaliertes Netto auf Basis
 * eines durchschnittlichen Abzugssatzes (Tabelle 2026 ca. 25 %).
 * Für die exakte BA-Tabelle wäre ein vollständiger Tabellenlookup
 * erforderlich – die Funktion liefert ein für die Praxis ausreichendes
 * Näherungsergebnis und ist über einen Tabellen-Adapter ersetzbar.
 */

export interface KugInput {
  /** Bruttoarbeitsentgelt OHNE Arbeitsausfall (Soll) */
  sollEntgelt: number;
  /** Tatsächlich erzieltes Bruttoarbeitsentgelt (Ist) */
  istEntgelt: number;
  /** Leistungssatz: 0.60 ohne Kind, 0.67 mit Kind */
  hasChild: boolean;
  /** Optional: pauschalierter Abzugssatz (Default 0.245 nach BA-Tabelle 2026) */
  pauschalAbzug?: number;
}

export interface KugResult {
  sollNetto: number;
  istNetto: number;
  nettoEntgeltdifferenz: number;
  leistungssatz: number;
  kugBetrag: number;
}

function round2(n: number) { return Math.round(n * 100) / 100; }

export function calculateKug(input: KugInput): KugResult {
  const abzug = input.pauschalAbzug ?? 0.245;
  const sollNetto = round2(input.sollEntgelt * (1 - abzug));
  const istNetto = round2(input.istEntgelt * (1 - abzug));
  const diff = Math.max(0, round2(sollNetto - istNetto));
  const satz = input.hasChild ? 0.67 : 0.60;
  return {
    sollNetto, istNetto,
    nettoEntgeltdifferenz: diff,
    leistungssatz: satz,
    kugBetrag: round2(diff * satz),
  };
}