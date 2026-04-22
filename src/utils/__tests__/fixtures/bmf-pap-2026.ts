/**
 * BMF-PAP-Stützstellen 2026 — Lohnsteuer
 * 
 * Quelle: § 32a EStG (erwartete Anpassung Grundfreibetrag 2026: 12.348 €).
 * Hinweis: Die finalen 2026-Tarifwerte werden vom BMF im Nov./Dez. 2025
 * publiziert. Diese Datei MUSS dann gegen die offizielle Veröffentlichung
 * verifiziert werden.
 * 
 * Aktueller Stand: Werte berechnet mit Grundfreibetrag 12.348 € und sonst
 * unveränderter Formel-Struktur (§ 32a EStG 2025-Formel als Basis).
 */
import type { BmfTariffFixture } from './bmf-pap-2025';

const GFB_2026 = 12_348; // Grundfreibetrag 2026 (offiziell per JStG 2024)

/**
 * § 32a Tarifstützstellen 2026 — VORLÄUFIG bis offizielle BMF-PAP-Veröffentlichung.
 * Diese Werte werden mit calculateTariflicheEStPAP2025(year=2026) erzeugt.
 * Test prüft, dass Engine und diese Vorab-Werte konsistent bleiben (Regression).
 */
export const TARIFF_FIXTURES_2026: readonly BmfTariffFixture[] = [
  { zvE: 0,            expectedESt: 0, desc: 'Grundfreibetrag 2026 – 0 €' },
  { zvE: GFB_2026 - 1, expectedESt: 0, desc: 'Grundfreibetrag 2026 – 1 € drunter (12.347 €)' },
  { zvE: GFB_2026,     expectedESt: 0, desc: 'Grundfreibetrag 2026 – exakt (12.348 €)' },
  // Zone 4 (proportional 42 %): floor(0.42 * zvE - 11135.63)
  { zvE: 100_000, expectedESt: Math.floor(0.42 * 100_000 - 11_135.63), desc: 'Zone 4 mitte 2026' },
  { zvE: 200_000, expectedESt: Math.floor(0.42 * 200_000 - 11_135.63), desc: 'Zone 4 hoch 2026' },
  { zvE: 277_825, expectedESt: Math.floor(0.42 * 277_825 - 11_135.63), desc: 'Zone 4 Obergrenze 2026' },
  // Zone 5 (Reichensteuer 45 %): floor(0.45 * zvE - 19470.38)
  { zvE: 300_000, expectedESt: Math.floor(0.45 * 300_000 - 19_470.38), desc: 'Zone 5 Reichensteuer 2026' },
  { zvE: 500_000, expectedESt: Math.floor(0.45 * 500_000 - 19_470.38), desc: 'Zone 5 sehr hoch 2026' },
] as const;

export const TARIFF_FIXTURES_2026_DYNAMIC_ZVE = [
  15_000, 30_000, 50_000, 80_000, 200_000, 500_000,
] as const;

/**
 * Wichtig:
 * - Sobald BMF-PAP 2026 erschienen ist (typisch Mitte/Ende Q4 2025),
 *   die obigen Stützstellen mit den amtlichen Werten ergänzen.
 * - Verantwortlich: siehe ANNUAL_UPDATE_CHECKLIST.md
 */
