/**
 * ZVK / Pensionskassen-Meldewesen (außerhalb SOKA-BAU)
 * ─────────────────────────────────────────────────────────────
 * Generischer Adapter für Zusatzversorgungskassen
 * (z. B. ZVK Gerüstbau, Maler-/Lackierer-ZVK, Pensionskasse XY).
 */

export type KassenTyp = 'zvk_geruestbau' | 'zvk_maler' | 'pensionskasse' | 'other';
export type Bemessung = 'brutto' | 'sv_brutto' | 'other';

export interface ZvkKasseConfig {
  id: string;
  name: string;
  kassenTyp: KassenTyp;
  beitragssatzArbeitgeber: number; // %
  beitragssatzArbeitnehmer: number; // %
  bemessungsgrundlage: Bemessung;
}

export interface ZvkBeitragInput {
  kasse: ZvkKasseConfig;
  bruttos: { employeeId: string; brutto: number; svBrutto: number }[];
}

export interface ZvkBeitragErgebnis {
  anzahlVersicherte: number;
  bemessungssumme: number;
  beitragArbeitgeber: number;
  beitragArbeitnehmer: number;
  details: { employeeId: string; bemessung: number; ag: number; an: number }[];
}

function round2(n: number) { return Math.round(n * 100) / 100; }

export function calculateZvkBeitrag(input: ZvkBeitragInput): ZvkBeitragErgebnis {
  const details = input.bruttos.map(b => {
    const bemessung = input.kasse.bemessungsgrundlage === 'sv_brutto' ? b.svBrutto : b.brutto;
    return {
      employeeId: b.employeeId,
      bemessung,
      ag: round2(bemessung * input.kasse.beitragssatzArbeitgeber / 100),
      an: round2(bemessung * input.kasse.beitragssatzArbeitnehmer / 100),
    };
  });
  return {
    anzahlVersicherte: details.length,
    bemessungssumme: round2(details.reduce((s, d) => s + d.bemessung, 0)),
    beitragArbeitgeber: round2(details.reduce((s, d) => s + d.ag, 0)),
    beitragArbeitnehmer: round2(details.reduce((s, d) => s + d.an, 0)),
    details,
  };
}