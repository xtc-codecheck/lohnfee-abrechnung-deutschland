/**
 * DEÜV-Rückmeldungsverarbeitung
 * ─────────────────────────────────────────────────────────────
 * Importiert Krankenkassen-Rückmeldungen (XML/EDIFACT-light)
 * und ordnet sie ursprünglichen SV-Meldungen zu.
 */

export type RueckmeldungTyp = 'bestaetigung' | 'fehler' | 'korrektur';

export interface DeuevRueckmeldung {
  krankenkasse: string;
  betriebsnummerKK?: string;
  rueckmeldungTyp: RueckmeldungTyp;
  fehlerCode?: string;
  fehlerText?: string;
  /** Optionale Zuordnung über Datensatz-ID (DSME-Verkettung) */
  referenzId?: string;
  rawXml: string;
}

/**
 * Sehr einfacher XML-Parser (DOM-frei) – extrahiert die für
 * die Inbox notwendigen Felder. Die produktive ITSG-konforme
 * Variante folgt in Phase 4 (zertifizierter Empfangsdienst).
 */
export function parseDeuevRueckmeldungXml(xml: string): DeuevRueckmeldung {
  const get = (tag: string): string | undefined => {
    const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'));
    return m?.[1]?.trim() || undefined;
  };
  const typRaw = (get('Typ') || get('Rueckmeldungstyp') || 'bestaetigung').toLowerCase();
  const typ: RueckmeldungTyp = typRaw.includes('fehler')
    ? 'fehler'
    : typRaw.includes('korrektur')
      ? 'korrektur'
      : 'bestaetigung';
  return {
    krankenkasse: get('Krankenkasse') || get('KK') || 'unbekannt',
    betriebsnummerKK: get('BetriebsnummerKK') || get('BBNRKK'),
    rueckmeldungTyp: typ,
    fehlerCode: get('FehlerCode') || get('Code'),
    fehlerText: get('FehlerText') || get('Meldung'),
    referenzId: get('ReferenzId') || get('DatensatzId'),
    rawXml: xml,
  };
}

export function parseDeuevRueckmeldungBatch(xml: string): DeuevRueckmeldung[] {
  const blocks = xml.split(/<Rueckmeldung[^>]*>/i).slice(1);
  if (blocks.length === 0) return [parseDeuevRueckmeldungXml(xml)];
  return blocks.map(b => parseDeuevRueckmeldungXml('<Rueckmeldung>' + b));
}