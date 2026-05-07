/**
 * Bescheinigungswesen – EEL & BEA
 * ─────────────────────────────────────────────────────────────
 * EEL (Entgeltersatzleistungen, §§ 107 SGB IV):
 *   - Krankengeld (KK)
 *   - Mutterschaftsgeld (KK)
 *   - Kinderkrankengeld (KK)
 *   - Verletztengeld (Unfallversicherung)
 *
 * BEA (Bescheinigung Arbeitsentgelt, § 312 SGB III):
 *   - Arbeitslosengeld (Bundesagentur für Arbeit)
 *
 * Diese Bescheinigungen sind elektronisch zu übermitteln
 * (rvBEA / EEL-Verfahren). Hier wird der fachliche Datensatz
 * erzeugt; die Übermittlungs-Anbindung erfolgt in Phase 4.
 */

import type { Employee } from '@/types/employee';

export type BescheinigungTyp =
  | 'eel_krankengeld'
  | 'eel_mutterschaft'
  | 'eel_kinderkrankengeld'
  | 'eel_verletztengeld'
  | 'bea_arbeitslosengeld';

export type EmpfaengerTyp = 'krankenkasse' | 'arbeitsagentur' | 'unfallversicherung';

export const BESCHEINIGUNG_LABELS: Record<BescheinigungTyp, string> = {
  eel_krankengeld: 'EEL – Krankengeld',
  eel_mutterschaft: 'EEL – Mutterschaftsgeld',
  eel_kinderkrankengeld: 'EEL – Kinderkrankengeld',
  eel_verletztengeld: 'EEL – Verletztengeld',
  bea_arbeitslosengeld: 'BEA – Arbeitslosengeld',
};

export function getEmpfaengerTyp(typ: BescheinigungTyp): EmpfaengerTyp {
  if (typ === 'bea_arbeitslosengeld') return 'arbeitsagentur';
  if (typ === 'eel_verletztengeld') return 'unfallversicherung';
  return 'krankenkasse';
}

export interface BescheinigungInput {
  typ: BescheinigungTyp;
  employee: Employee;
  zeitraumVon: Date;
  zeitraumBis: Date;
  bruttoEntgelt: number;
  nettoEntgelt: number;
  svBrutto: number;
  arbeitsstunden: number;
  letzterArbeitstag?: Date;
  empfaengerName: string;
  empfaengerBetriebsnummer?: string;
  notes?: string;
}

export interface BescheinigungDatensatz extends BescheinigungInput {
  empfaengerTyp: EmpfaengerTyp;
  erstelltAm: Date;
  /** Kalendertage im Bescheinigungszeitraum */
  kalendertage: number;
  /** Tagesentgelt (Brutto / Kalendertage) */
  tagesentgelt: number;
}

function diffDaysInclusive(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(1, Math.floor(ms / 86400000) + 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Baut einen vollständigen Bescheinigungs-Datensatz.
 */
export function buildBescheinigung(input: BescheinigungInput): BescheinigungDatensatz {
  const tage = diffDaysInclusive(input.zeitraumVon, input.zeitraumBis);
  return {
    ...input,
    empfaengerTyp: getEmpfaengerTyp(input.typ),
    erstelltAm: new Date(),
    kalendertage: tage,
    tagesentgelt: round2(input.bruttoEntgelt / tage),
  };
}