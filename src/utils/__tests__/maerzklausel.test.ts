/**
 * Tests für die Märzklausel (§ 23a Abs. 4 SGB IV)
 */
import { describe, it, expect } from 'vitest';
import { calculateMaerzklausel, MaerzklauselInput } from '../maerzklausel';
import { BBG_2025_MONTHLY } from '@/constants/social-security';

const baseInput: MaerzklauselInput = {
  paymentMonth: 3,
  oneTimePaymentAmount: 5000,
  currentMonthlyGross: 4000,
  previousYearTotalGross: 48000,
  previousYearBBG_RV: 90600, // 2024/2025
  previousYearBBG_KV: 62100,
  isEastGermany: false,
};

describe('Märzklausel (§ 23a Abs. 4 SGB IV)', () => {
  it('sollte nicht anwendbar sein bei Monat > 3', () => {
    const result = calculateMaerzklausel({
      ...baseInput,
      paymentMonth: 3, // gültig, aber testen wir ungültig
    } as any);
    // Monat 3 ist gültig; testen wir mit einem Input wo paymentMonth 4 wäre
    // Die Funktion akzeptiert nur 1|2|3 als Typ, daher erzwingen:
    const r = calculateMaerzklausel({ ...baseInput, paymentMonth: 4 as any });
    expect(r.isApplicable).toBe(false);
    expect(r.explanation[0]).toContain('Januar–März');
  });

  it('sollte nicht anwendbar sein wenn Summe ≤ anteilige BBG', () => {
    // Niedriges Gehalt + kleine Einmalzahlung
    const result = calculateMaerzklausel({
      ...baseInput,
      currentMonthlyGross: 1000,
      oneTimePaymentAmount: 500,
      paymentMonth: 1,
    });
    expect(result.isApplicable).toBe(false);
    expect(result.amountAttributedToPreviousYear).toBe(0);
    expect(result.amountInCurrentYear).toBe(500);
  });

  it('sollte nicht anwendbar sein wenn keine SV-Luft im Vorjahr', () => {
    // Vorjahres-Brutto >= Vorjahres-BBG → keine Luft
    const result = calculateMaerzklausel({
      ...baseInput,
      previousYearTotalGross: 95000, // über BBG
      previousYearBBG_RV: 90600,
    });
    expect(result.isApplicable).toBe(false);
    expect(result.previousYearSVRoom).toBe(0);
  });

  it('sollte anwendbar sein bei BBG-Überschreitung + SV-Luft', () => {
    // Monat 3, 4000 × 3 + 5000 = 17000 > BBG monatlich 7550 × 3 = 22650 → unter BBG
    // Wir brauchen ein höheres Gehalt:
    const result = calculateMaerzklausel({
      ...baseInput,
      currentMonthlyGross: 7000,
      oneTimePaymentAmount: 10000,
      paymentMonth: 1,
      // 7000 × 1 + 10000 = 17000 > 7550 × 1 = 7550 → überschreitet!
      previousYearTotalGross: 70000,
      previousYearBBG_RV: 90600,
    });
    expect(result.isApplicable).toBe(true);
    expect(result.previousYearSVRoom).toBe(90600 - 70000); // 20600
    expect(result.amountAttributedToPreviousYear).toBe(10000); // min(10000, 20600)
    expect(result.amountInCurrentYear).toBe(0);
  });

  it('sollte nur SV-Luft-Betrag dem Vorjahr zuordnen', () => {
    const result = calculateMaerzklausel({
      ...baseInput,
      currentMonthlyGross: 7000,
      oneTimePaymentAmount: 30000,
      paymentMonth: 1,
      previousYearTotalGross: 85000,
      previousYearBBG_RV: 90600,
    });
    expect(result.isApplicable).toBe(true);
    expect(result.previousYearSVRoom).toBe(5600); // 90600 - 85000
    expect(result.amountAttributedToPreviousYear).toBe(5600);
    expect(result.amountInCurrentYear).toBe(24400); // 30000 - 5600
  });

  it('sollte für Februar korrekt rechnen', () => {
    const result = calculateMaerzklausel({
      ...baseInput,
      paymentMonth: 2,
      currentMonthlyGross: 7000,
      oneTimePaymentAmount: 8000,
      // 7000 × 2 + 8000 = 22000 > 7550 × 2 = 15100 → überschreitet
      previousYearTotalGross: 80000,
      previousYearBBG_RV: 90600,
    });
    expect(result.isApplicable).toBe(true);
    expect(result.previousYearSVRoom).toBe(10600);
    expect(result.amountAttributedToPreviousYear).toBe(8000);
  });

  it('sollte Ostdeutschland-BBG berücksichtigen', () => {
    const result = calculateMaerzklausel({
      ...baseInput,
      isEastGermany: true,
      currentMonthlyGross: 7000,
      oneTimePaymentAmount: 8000,
      paymentMonth: 1,
      previousYearTotalGross: 80000,
      previousYearBBG_RV: 89400,
    });
    expect(result.isApplicable).toBe(true);
    expect(result.previousYearSVRoom).toBe(9400);
  });

  it('sollte korrekte Erklärungen liefern', () => {
    const result = calculateMaerzklausel({
      ...baseInput,
      currentMonthlyGross: 7000,
      oneTimePaymentAmount: 10000,
      paymentMonth: 1,
      previousYearTotalGross: 70000,
      previousYearBBG_RV: 90600,
    });
    expect(result.explanation.length).toBeGreaterThan(3);
    expect(result.explanation.some(e => e.includes('anwendbar'))).toBe(true);
  });
});
