/**
 * L2 — BMF-PAP-Verification (0¢-Diff-Test)
 * 
 * Prüft, dass die Engine cent-genau mit den BMF-PAP-Stützstellen
 * übereinstimmt. Schlägt der Test fehl: STOP, kein Silent-Fix.
 */
import { describe, it, expect } from 'vitest';
import { calculateTariflicheEStPAP2025, calculateChurchTax, calculateSolidarityTax } from '../tax-calculation';
import { TARIFF_FIXTURES_2025, CHURCH_TAX_FIXTURES_2025, SOLI_FIXTURES_2025 } from './fixtures/bmf-pap-2025';
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

  it('Kirchensteuer-Kappung: 2,75 % zvE wird angewandt, wenn niedriger als 9 % ESt', () => {
    // ESt = 50.000 €, zvE = 200.000 €, Kappung 2,75 %
    // Standard: 4500 €  vs Cap: 5500 €  → keine Kappung
    expect(calculateChurchTax(50_000, 9, { zvE: 200_000, capRatePercent: 2.75 })).toBe(4500);
    // ESt = 50.000 €, zvE = 100.000 €, Kappung 2,75 % → Cap: 2750 € < 4500 € → Kappung greift
    expect(calculateChurchTax(50_000, 9, { zvE: 100_000, capRatePercent: 2.75 })).toBe(2750);
  });
});

describe('BMF — Solidaritätszuschlag 2025 (Freigrenze + Milderungszone)', () => {
  for (const fx of SOLI_FIXTURES_2025) {
    it(`ESt ${fx.estJahr} € → Soli ${fx.expectedSoli} € (${fx.desc})`, () => {
      expect(calculateSolidarityTax(fx.estJahr)).toBe(fx.expectedSoli);
    });
  }

  it('Milderungs-Schnittpunkt liegt bei ESt ≈ 33.911,76 € (Übergang zu Vollsatz)', () => {
    // Knapp unter Schnittpunkt: Milderung greift (11,9 % × Diff < 5,5 % × ESt)
    const just_below = calculateSolidarityTax(33_900);
    expect(just_below).toBe(Math.floor(0.119 * (33_900 - 19_950)));
    // Knapp über Schnittpunkt: Vollsatz greift
    const just_above = calculateSolidarityTax(34_000);
    expect(just_above).toBe(Math.floor(0.055 * 34_000));
  });
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

  it('2026 Grundfreibetrag wirkt (12.348 € → 0, 13.000 € → > 0)', () => {
    expect(calculateTariflicheEStPAP2025(12_348, 2026)).toBe(0);
    expect(calculateTariflicheEStPAP2025(13_000, 2026)).toBeGreaterThan(0);
  });
});
