/**
 * ITSG-Testdatensätze (Golden Master für Zertifizierung)
 * ─────────────────────────────────────────────────────────────
 * Stub-Implementierung: enthält die Standard-Prüffälle, die im
 * ITSG-Prüfprotokoll für DEÜV/BNW/EEL durchlaufen werden müssen.
 * Wird bei Phase-4-Zertifizierung mit echten Referenzwerten
 * aus dem ITSG-Prüfkatalog gefüllt.
 */

export interface ItsgTestCase {
  id: string;
  category: 'DEUEV' | 'BNW' | 'EEL' | 'BEA' | 'AAG' | 'UV';
  description: string;
  expectedSegments: string[];
}

export const ITSG_TEST_CASES: ItsgTestCase[] = [
  { id: 'DEUEV-01', category: 'DEUEV', description: 'Anmeldung Vollzeit-AN', expectedSegments: ['DSME', 'DBME'] },
  { id: 'DEUEV-10', category: 'DEUEV', description: 'Abmeldung mit Entgeltmeldung', expectedSegments: ['DSME', 'DBME', 'DBEM'] },
  { id: 'DEUEV-30', category: 'DEUEV', description: 'Jahresmeldung 50', expectedSegments: ['DSME', 'DBME'] },
  { id: 'BNW-01', category: 'BNW', description: 'Beitragsnachweis Standard-KK', expectedSegments: ['DSBD', 'DBBN'] },
  { id: 'EEL-01', category: 'EEL', description: 'Krankengeld-Bescheinigung', expectedSegments: ['DSKO', 'DBKE'] },
  { id: 'BEA-01', category: 'BEA', description: 'Arbeitslosengeld-Bescheinigung', expectedSegments: ['DSAB', 'DBAE'] },
  { id: 'AAG-01', category: 'AAG', description: 'U1-Erstattungsantrag', expectedSegments: ['DSER', 'DBAU'] },
  { id: 'UV-01', category: 'UV', description: 'UV-Jahresmeldung DSLN', expectedSegments: ['DSLN', 'DBUV'] },
];