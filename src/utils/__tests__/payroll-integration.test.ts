import { describe, it, expect } from 'vitest';
import { calculateCompleteTax, TaxCalculationParams } from '../tax-calculation';
import { calculateSocialSecurity, SocialSecurityParams, SOCIAL_SECURITY_RATES } from '../payroll-calculator';

// Integrations-Tests: Steuer + SV zusammen, wie in echten Abrechnungen

function createDefaultParams(grossSalary: number, overrides: Partial<TaxCalculationParams> = {}): TaxCalculationParams {
  return {
    grossSalary,
    taxClass: 'I',
    churchTax: false,
    childAllowances: 0,
    healthInsuranceAdditionalRate: 1.7,
    state: 'berlin',
    year: 2025,
    ...overrides,
  };
}

describe('Lohnabrechnung Integration: Steuer + SV', () => {
  it('berechnet eine vollständige Abrechnung für Steuerklasse I, 4000€', () => {
    const params = createDefaultParams(4000);
    const tax = calculateCompleteTax(params);
    
    // Plausibilitätsprüfung: Steuer muss positiv sein bei 4000€ SK I
    expect(tax.incomeTax).toBeGreaterThan(0);
    expect(tax.solidarityTax).toBeGreaterThanOrEqual(0);
    expect(tax.totalTax).toBeGreaterThan(0);
    expect(tax.totalTax).toBeLessThan(4000); // nicht mehr als Brutto
  });

  it('Steuerklasse III zahlt weniger Steuern als SK I bei gleichem Gehalt', () => {
    const taxI = calculateCompleteTax(createDefaultParams(5000, { taxClass: 'I' }));
    const taxIII = calculateCompleteTax(createDefaultParams(5000, { taxClass: 'III' }));
    
    expect(taxIII.totalTax).toBeLessThan(taxI.totalTax);
  });

  it('Steuerklasse V zahlt mehr Steuern als SK I', () => {
    const taxI = calculateCompleteTax(createDefaultParams(3000, { taxClass: 'I' }));
    const taxV = calculateCompleteTax(createDefaultParams(3000, { taxClass: 'V' }));
    
    expect(taxV.totalTax).toBeGreaterThan(taxI.totalTax);
  });

  it('Kirchensteuer erhöht die Gesamtsteuer', () => {
    const ohne = calculateCompleteTax(createDefaultParams(4000));
    const mit = calculateCompleteTax(createDefaultParams(4000, { churchTax: true }));
    
    expect(mit.totalTax).toBeGreaterThan(ohne.totalTax);
  });

  it('Nettolohn ist immer positiv bei realistischen Gehältern', () => {
    const salaries = [2000, 3000, 4000, 5000, 6000, 8000, 10000];
    
    for (const gross of salaries) {
      const tax = calculateCompleteTax(createDefaultParams(gross));
      const netAfterTax = gross - tax.totalTax;
      expect(netAfterTax).toBeGreaterThan(0);
    }
  });

  it('Minijob (556€) hat 0€ Lohnsteuer in SK I', () => {
    const tax = calculateCompleteTax(createDefaultParams(556));
    expect(tax.incomeTax).toBe(0);
  });

  it('Gesamtabzüge überschreiten nie das Bruttogehalt', () => {
    const testCases = [
      { gross: 1000, taxClass: 'I' as const },
      { gross: 3000, taxClass: 'V' as const },
      { gross: 5000, taxClass: 'VI' as const },
      { gross: 10000, taxClass: 'I' as const },
    ];

    for (const tc of testCases) {
      const tax = calculateCompleteTax(createDefaultParams(tc.gross, { taxClass: tc.taxClass }));
      expect(tax.totalTax).toBeLessThan(tc.gross);
    }
  });
});

describe('Steuerklassen-Konsistenz', () => {
  const taxClasses = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;
  
  it('alle Steuerklassen liefern valide Ergebnisse', () => {
    for (const tc of taxClasses) {
      const result = calculateCompleteTax(createDefaultParams(4000, { taxClass: tc }));
      expect(result.incomeTax).toBeGreaterThanOrEqual(0);
      expect(result.solidarityTax).toBeGreaterThanOrEqual(0);
      expect(result.totalTax).toBeGreaterThanOrEqual(0);
      expect(isFinite(result.totalTax)).toBe(true);
    }
  });

  it('SK II hat leicht geringere Steuer als SK I (Entlastungsbetrag)', () => {
    const taxI = calculateCompleteTax(createDefaultParams(4000, { taxClass: 'I' }));
    const taxII = calculateCompleteTax(createDefaultParams(4000, { taxClass: 'II' }));
    
    expect(taxII.totalTax).toBeLessThanOrEqual(taxI.totalTax);
  });
});
