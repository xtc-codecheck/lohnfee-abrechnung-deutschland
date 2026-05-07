/**
 * Pfändungstabellen — Jahres-Loader
 * ─────────────────────────────────────────────────────────────
 * Lokaler Fallback (Stand: BMJ-Bekanntmachung 2024 / 2025).
 * Primärquelle ist die DB-Tabelle `pfaendung_tabellen`; diese
 * Konstanten dienen als Default für synchrone Berechnungen
 * und Tests (z. B. in der Calculation-Engine).
 *
 * Jahres-Update-Pflicht: siehe ANNUAL_UPDATE_CHECKLIST.md
 */

export interface PfaendungstabelleParams {
  year: number;
  baseExemption: number;
  perDependentIncrease: number;
  maxDependents: number;
  basePfaendungsRate: number;
  rateReductionPerDependent: number;
  fullGarnishmentThreshold: number;
  validFrom: string;
  source: string;
}

export const PFAENDUNG_TABELLE_2025: PfaendungstabelleParams = {
  year: 2025,
  baseExemption: 1491.75,
  perDependentIncrease: 561.43,
  maxDependents: 5,
  basePfaendungsRate: 0.3,
  rateReductionPerDependent: 0.1,
  fullGarnishmentThreshold: 4298.81,
  validFrom: '2024-07-01',
  source: 'Pfändungsfreigrenzenbekanntmachung 2024',
};

export const PFAENDUNG_TABELLE_2026: PfaendungstabelleParams = {
  year: 2026,
  baseExemption: 1559.99,
  perDependentIncrease: 587.97,
  maxDependents: 5,
  basePfaendungsRate: 0.3,
  rateReductionPerDependent: 0.1,
  fullGarnishmentThreshold: 4500.0,
  validFrom: '2025-07-01',
  source: 'Pfändungsfreigrenzenbekanntmachung 2025 (vorläufig)',
};

const TABLES: Record<number, PfaendungstabelleParams> = {
  2025: PFAENDUNG_TABELLE_2025,
  2026: PFAENDUNG_TABELLE_2026,
};

/**
 * Lädt Pfändungstabelle für ein Jahr (synchron, lokal).
 * Fallback: nächstältere bekannte Tabelle.
 */
export function getPfaendungstabelle(year: number): PfaendungstabelleParams {
  if (TABLES[year]) return TABLES[year];
  const known = Object.keys(TABLES).map(Number).sort((a, b) => b - a);
  const fallback = known.find(y => y <= year) ?? known[known.length - 1];
  return TABLES[fallback];
}