/**
 * L4 — Net-to-Gross Property-Tests
 *
 * Stellt drei Invarianten der Brutto↔Netto-Umkehrrechnung sicher:
 *   1. Konvergenz: das berechnete Brutto liefert ≈ das Ziel-Netto zurück.
 *   2. Monotonie: höheres Ziel-Netto → höheres benötigtes Brutto.
 *   3. Plausibilität: Brutto > Netto (in DE immer, da SV+Steuern > 0).
 *
 * Wir nutzen `fast-check` nicht zwingend (würde extra dep), sondern
 * deterministische Stützstellen über realistische Netto-Bereiche.
 */
import { describe, it, expect } from 'vitest';
import { calculateNetToGross } from '../net-to-gross-calculation';

const COMMON_PARAMS = {
  taxClass: 'I',
  childAllowances: 0,
  churchTax: false,
  churchTaxRate: 9,
  healthInsuranceRate: 1.7,
  isEastGermany: false,
  isChildless: true,
  age: 35,
};

const NET_TARGETS = [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

describe('Net-to-Gross — Konvergenz (≤ 1 € Diff)', () => {
  for (const target of NET_TARGETS) {
    it(`Ziel-Netto ${target} € → Brutto so, dass actualNet ≈ target`, () => {
      const r = calculateNetToGross({ targetNetMonthly: target, ...COMMON_PARAMS });
      expect(Math.abs(r.actualNet - target)).toBeLessThanOrEqual(1.0);
      expect(r.iterations).toBeLessThan(50);
    });
  }
});

describe('Net-to-Gross — Monotonie', () => {
  it('höheres Ziel-Netto erfordert höheres Brutto', () => {
    let prevGross = 0;
    for (const target of NET_TARGETS) {
      const r = calculateNetToGross({ targetNetMonthly: target, ...COMMON_PARAMS });
      expect(r.requiredGross).toBeGreaterThan(prevGross);
      prevGross = r.requiredGross;
    }
  });
});

describe('Net-to-Gross — Plausibilität', () => {
  it.each(NET_TARGETS)('Brutto > Netto bei Ziel %d €', (target) => {
    const r = calculateNetToGross({ targetNetMonthly: target, ...COMMON_PARAMS });
    expect(r.requiredGross).toBeGreaterThan(target);
  });

  it('StKl V (höhere Steuer) erfordert höheres Brutto als StKl I', () => {
    const target = 2500;
    const stklI = calculateNetToGross({ targetNetMonthly: target, ...COMMON_PARAMS, taxClass: 'I' });
    const stklV = calculateNetToGross({ targetNetMonthly: target, ...COMMON_PARAMS, taxClass: 'V' });
    expect(stklV.requiredGross).toBeGreaterThan(stklI.requiredGross);
  });
});