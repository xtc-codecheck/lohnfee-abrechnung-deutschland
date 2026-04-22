/**
 * L2 — BMF-PAP-Verification (0¢-Diff-Test)
 * 
 * Prüft, dass die Engine cent-genau mit den BMF-PAP-Stützstellen
 * übereinstimmt. Schlägt der Test fehl: STOP, kein Silent-Fix.
 */
import { describe, it, expect } from 'vitest';
import { calculateTariflicheEStPAP2025, calculateChurchTax } from '../tax-calculation';
import { TARIFF_FIXTURES_2025, CHURCH_TAX_FIXTURES_2025 } from './fixtures/bmf-pap-2025';
import { TARIFF_FIXTURES_2026, TARIFF_FIXTURES_2026_DYNAMIC_ZVE } from './fixtures/bmf-pap-2026';

describe('BMF-PAP 2025 — Lohnsteuer-Tarif (0 ¢ Diff)', () => {
  for (const fx of TARIFF_FIXTURES_2025) {
    it(`zvE ${fx.zvE} € → ESt ${fx.expectedESt} € (${fx.desc})`, () => {
      const actual = calculateTariflicheEStPAP2025(fx.zvE, 2025);
      expect(actual).toBe(fx.expectedESt);
    });
  }
});

describe('BMF — Kirchensteuer 2025 (0 ¢ Diff)', () => {
  for (const fx of CHURCH_TAX_FIXTURES_2025) {
    it(`ESt ${fx.estJahr} € × ${fx.rate * 100}% = ${fx.expected} € (${fx.desc})`, () => {
      const actual = calculateChurchTax(fx.estJahr, fx.rate);
      expect(actual).toBeCloseTo(fx.expected, 2);
    });
  }
});

describe('BMF-PAP 2026 — Tarif (Snapshot bis offizieller PAP)', () => {
  for (const fx of TARIFF_FIXTURES_2026) {
    it(`zvE ${fx.zvE} € → ESt ${fx.expectedESt} € (${fx.desc})`, () => {
      const actual = calculateTariflicheEStPAP2025(fx.zvE, 2026);
      expect(actual).toBe(fx.expectedESt);
    });
  }

  it('2026 Tarif ist monoton steigend', () => {
    let prev = -1;
    for (const zvE of TARIFF_FIXTURES_2026_DYNAMIC_ZVE) {
      const est = calculateTariflicheEStPAP2025(zvE, 2026);
      expect(est).toBeGreaterThanOrEqual(prev);
      prev = est;
    }
  });

  it('2026 Grundfreibetrag wirkt (12.348 € → 0, 12.349 € → > 0)', () => {
    expect(calculateTariflicheEStPAP2025(12_348, 2026)).toBe(0);
    expect(calculateTariflicheEStPAP2025(12_349, 2026)).toBeGreaterThan(0);
  });
});
