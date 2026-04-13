import { describe, it, expect } from 'vitest';
import { calculateCompleteTax, TaxCalculationParams } from '../tax-calculation';

function createDefaultParams(grossYearly: number, overrides: Partial<TaxCalculationParams> = {}): TaxCalculationParams {
  return {
    grossSalaryYearly: grossYearly,
    taxClass: 'I',
    churchTax: false,
    churchTaxRate: 0,
    childAllowances: 0,
    healthInsuranceRate: 1.7,
    isEastGermany: false,
    isChildless: true,
    age: 30,
    ...overrides,
  };
}

describe('Lohnabrechnung Integration: Steuer + SV', () => {
  it('berechnet eine vollständige Abrechnung für Steuerklasse I, 4000€/Monat', () => {
    const result = calculateCompleteTax(createDefaultParams(48000));
    
    expect(result.incomeTax).toBeGreaterThan(0);
    expect(result.solidarityTax).toBeGreaterThanOrEqual(0);
    expect(result.totalTaxes).toBeGreaterThan(0);
    expect(result.totalTaxes).toBeLessThan(48000);
  });

  it('Steuerklasse III zahlt weniger Lohnsteuer als SK I bei gleichem Gehalt', () => {
    const taxI = calculateCompleteTax(createDefaultParams(60000, { taxClass: 'I' }));
    const taxIII = calculateCompleteTax(createDefaultParams(60000, { taxClass: 'III' }));
    
    expect(taxIII.incomeTax).toBeLessThan(taxI.incomeTax);
  });

  it('Steuerklasse V zahlt mehr Lohnsteuer als SK I', () => {
    const taxI = calculateCompleteTax(createDefaultParams(36000, { taxClass: 'I' }));
    const taxV = calculateCompleteTax(createDefaultParams(36000, { taxClass: 'V' }));
    
    expect(taxV.incomeTax).toBeGreaterThan(taxI.incomeTax);
  });

  it('Kirchensteuer erhöht die Gesamtsteuer', () => {
    const ohne = calculateCompleteTax(createDefaultParams(48000));
    const mit = calculateCompleteTax(createDefaultParams(48000, { churchTax: true, churchTaxRate: 9 }));
    
    expect(mit.totalTaxes).toBeGreaterThan(ohne.totalTaxes);
  });

  it('Nettolohn ist immer positiv bei realistischen Gehältern', () => {
    const salaries = [24000, 36000, 48000, 60000, 72000, 96000, 120000];
    
    for (const gross of salaries) {
      const result = calculateCompleteTax(createDefaultParams(gross));
      expect(result.netYearly).toBeGreaterThan(0);
    }
  });

  it('Minijob (6672€/Jahr) wird pauschal besteuert', () => {
    const result = calculateCompleteTax(createDefaultParams(6672, { employmentType: 'minijob' }));
    // Minijob: Pauschalbesteuerung durch AG, daher geringe oder keine LSt für AN
    expect(result.incomeTax).toBeLessThanOrEqual(200);
  });

  it('Gesamtabzüge überschreiten nie das Bruttogehalt', () => {
    const testCases = [
      { gross: 12000, taxClass: 'I' as const },
      { gross: 36000, taxClass: 'V' as const },
      { gross: 60000, taxClass: 'VI' as const },
      { gross: 120000, taxClass: 'I' as const },
    ];

    for (const tc of testCases) {
      const result = calculateCompleteTax(createDefaultParams(tc.gross, { taxClass: tc.taxClass }));
      expect(result.totalDeductions).toBeLessThan(tc.gross);
    }
  });
});

describe('Steuerklassen-Konsistenz', () => {
  const taxClasses = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;
  
  it('alle Steuerklassen liefern valide Ergebnisse', () => {
    for (const tc of taxClasses) {
      const result = calculateCompleteTax(createDefaultParams(48000, { taxClass: tc }));
      expect(result.incomeTax).toBeGreaterThanOrEqual(0);
      expect(result.solidarityTax).toBeGreaterThanOrEqual(0);
      expect(result.totalTaxes).toBeGreaterThanOrEqual(0);
      expect(isFinite(result.totalTaxes)).toBe(true);
    }
  });

  it('SK II hat leicht geringere Steuer als SK I (Entlastungsbetrag)', () => {
    const taxI = calculateCompleteTax(createDefaultParams(48000, { taxClass: 'I' }));
    const taxII = calculateCompleteTax(createDefaultParams(48000, { taxClass: 'II' }));
    
    expect(taxII.totalTaxes).toBeLessThanOrEqual(taxI.totalTaxes);
  });
});
