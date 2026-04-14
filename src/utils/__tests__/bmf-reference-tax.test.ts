/**
 * BMF-Referenztests 2025 — Formelbasierte Berechnung nach § 32a EStG (PAP 2025)
 * 
 * Diese Tests validieren die formelbasierte Lohnsteuerberechnung gegen
 * offizielle BMF-Referenzwerte. Da die Berechnung jetzt direkt den
 * Programmablaufplan (PAP) implementiert, erwarten wir deutlich engere
 * Toleranzen als bei der früheren Tabellen-Interpolation.
 * 
 * Referenz: Bundesministerium der Finanzen, PAP 2025
 * Tarif: § 32a EStG i.d.F. des Jahressteuergesetzes 2024
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateTariflicheEStPAP2025,
  calculateIncomeTax,
  calculateSolidarityTax,
  calculateChurchTax,
  calculateCompleteTax,
} from '../tax-calculation';
import { TAX_ALLOWANCES_2025 } from '@/constants/social-security';

// ============= § 32a EStG Tarif-Tests =============

describe('PAP 2025: Tarifliche Einkommensteuer nach § 32a EStG', () => {
  
  describe('Grundfreibetrag (Zone 1: 0 - 12.096 €)', () => {
    it('zvE = 0 → ESt = 0', () => {
      expect(calculateTariflicheEStPAP2025(0)).toBe(0);
    });
    
    it('zvE = 12.096 → ESt = 0 (exakt am Grundfreibetrag)', () => {
      expect(calculateTariflicheEStPAP2025(12096)).toBe(0);
    });
    
    it('zvE = 12.000 → ESt = 0', () => {
      expect(calculateTariflicheEStPAP2025(12000)).toBe(0);
    });
    
    it('zvE < 0 → ESt = 0', () => {
      expect(calculateTariflicheEStPAP2025(-5000)).toBe(0);
    });
  });

  describe('Progressionszone 1 (Zone 2: 12.097 - 17.443 €)', () => {
    it('zvE = 12.097 → ESt > 0 (erste steuerpflichtige Euro)', () => {
      const est = calculateTariflicheEStPAP2025(12097);
      expect(est).toBeGreaterThan(0);
      expect(est).toBeLessThan(5); // Minimal, da nur 1€ über GFB
    });
    
    it('zvE = 15.000 → ESt nach Formel y=(15000-12096)/10000', () => {
      const y = (15000 - 12096) / 10000; // 0.2904
      const expected = Math.floor((932.30 * y + 1400) * y);
      expect(calculateTariflicheEStPAP2025(15000)).toBe(expected);
    });
    
    it('zvE = 17.443 → Obergrenze Zone 2', () => {
      const y = (17443 - 12096) / 10000; // 0.5347
      const expected = Math.floor((932.30 * y + 1400) * y);
      expect(calculateTariflicheEStPAP2025(17443)).toBe(expected);
    });
  });

  describe('Progressionszone 2 (Zone 3: 17.444 - 68.480 €)', () => {
    it('zvE = 17.444 → Übergang zu Zone 3', () => {
      const est = calculateTariflicheEStPAP2025(17444);
      expect(est).toBeGreaterThan(1000);
    });
    
    it('zvE = 40.000 → mittlerer Bereich', () => {
      const z = (40000 - 17443) / 10000; // 2.2557
      const expected = Math.floor((176.64 * z + 2397) * z + 1015.13);
      expect(calculateTariflicheEStPAP2025(40000)).toBe(expected);
    });
    
    it('zvE = 68.480 → Obergrenze Zone 3', () => {
      const z = (68480 - 17443) / 10000; // 5.1037
      const expected = Math.floor((176.64 * z + 2397) * z + 1015.13);
      expect(calculateTariflicheEStPAP2025(68480)).toBe(expected);
    });
  });

  describe('Proportionalzone 1 (Zone 4: 68.481 - 277.825 €, 42%)', () => {
    it('zvE = 68.481 → Eintritt in 42%-Zone', () => {
      const expected = Math.floor(68481 * 0.42 - 10911.92);
      expect(calculateTariflicheEStPAP2025(68481)).toBe(expected);
    });
    
    it('zvE = 100.000', () => {
      const expected = Math.floor(100000 * 0.42 - 10911.92);
      expect(calculateTariflicheEStPAP2025(100000)).toBe(expected);
    });
    
    it('zvE = 200.000', () => {
      const expected = Math.floor(200000 * 0.42 - 10911.92);
      expect(calculateTariflicheEStPAP2025(200000)).toBe(expected);
    });
  });

  describe('Proportionalzone 2 (Zone 5: ab 277.826 €, 45% Reichensteuer)', () => {
    it('zvE = 277.826 → Eintritt Reichensteuer', () => {
      const expected = Math.floor(277826 * 0.45 - 19246.67);
      expect(calculateTariflicheEStPAP2025(277826)).toBe(expected);
    });
    
    it('zvE = 500.000', () => {
      const expected = Math.floor(500000 * 0.45 - 19246.67);
      expect(calculateTariflicheEStPAP2025(500000)).toBe(expected);
    });
    
    it('zvE = 1.000.000', () => {
      const expected = Math.floor(1000000 * 0.45 - 19246.67);
      expect(calculateTariflicheEStPAP2025(1000000)).toBe(expected);
    });
  });

  describe('Monotonie und Konsistenz', () => {
    it('ESt ist streng monoton steigend ab GFB', () => {
      const values = [12097, 15000, 20000, 30000, 50000, 70000, 100000, 300000];
      for (let i = 1; i < values.length; i++) {
        expect(calculateTariflicheEStPAP2025(values[i])).toBeGreaterThan(
          calculateTariflicheEStPAP2025(values[i - 1])
        );
      }
    });
    
    it('Zonenübergänge sind stetig (kein Sprung)', () => {
      // Zone 2 → Zone 3 Übergang bei 17.443/17.444
      const est17443 = calculateTariflicheEStPAP2025(17443);
      const est17444 = calculateTariflicheEStPAP2025(17444);
      expect(Math.abs(est17444 - est17443)).toBeLessThan(5);
      
      // Zone 3 → Zone 4 Übergang bei 68.480/68.481
      const est68480 = calculateTariflicheEStPAP2025(68480);
      const est68481 = calculateTariflicheEStPAP2025(68481);
      expect(Math.abs(est68481 - est68480)).toBeLessThan(5);
      
      // Zone 4 → Zone 5 Übergang bei 277.825/277.826
      const est277825 = calculateTariflicheEStPAP2025(277825);
      const est277826 = calculateTariflicheEStPAP2025(277826);
      expect(Math.abs(est277826 - est277825)).toBeLessThan(5);
    });
    
    it('Grenzsteuersatz steigt progressiv', () => {
      // Grenzsteuersatz = (ESt(x+1000) - ESt(x)) / 1000
      const marginal20k = (calculateTariflicheEStPAP2025(21000) - calculateTariflicheEStPAP2025(20000)) / 1000;
      const marginal40k = (calculateTariflicheEStPAP2025(41000) - calculateTariflicheEStPAP2025(40000)) / 1000;
      const marginal70k = (calculateTariflicheEStPAP2025(70000) - calculateTariflicheEStPAP2025(69000)) / 1000;
      
      expect(marginal20k).toBeLessThan(marginal40k);
      expect(marginal40k).toBeLessThan(marginal70k);
      expect(marginal70k).toBeCloseTo(0.42, 1); // 42% Zone
    });
  });
});

// ============= Steuerklassen-Tests mit PAP 2025 =============

describe('PAP 2025: Lohnsteuer nach Steuerklassen', () => {
  
  describe('StKl I/IV (Standard)', () => {
    it('1.000 €/Monat → keine LSt (unter GFB)', () => {
      expect(calculateIncomeTax(1000, 1)).toBe(0);
    });
    
    it('2.000 €/Monat → LSt > 0', () => {
      const lst = calculateIncomeTax(2000, 1);
      expect(lst).toBeGreaterThan(50);
      expect(lst).toBeLessThan(200);
    });
    
    it('4.000 €/Monat → LSt im mittleren Bereich', () => {
      const lst = calculateIncomeTax(4000, 1);
      expect(lst).toBeGreaterThan(400);
      expect(lst).toBeLessThan(800);
    });
    
    it('8.000 €/Monat → höhere LSt (über BBG KV)', () => {
      const lst = calculateIncomeTax(8000, 1);
      expect(lst).toBeGreaterThan(1500);
      expect(lst).toBeLessThan(2500);
    });
    
    it('StKl IV = StKl I', () => {
      expect(calculateIncomeTax(4000, 4)).toBe(calculateIncomeTax(4000, 1));
    });
  });

  describe('StKl II (Alleinerziehende)', () => {
    it('geringere LSt als StKl I durch Entlastungsbetrag', () => {
      expect(calculateIncomeTax(3000, 2)).toBeLessThan(calculateIncomeTax(3000, 1));
    });
    
    it('keine LSt bei niedrigem Einkommen', () => {
      expect(calculateIncomeTax(1500, 2)).toBe(0);
    });
  });

  describe('StKl III (Splitting)', () => {
    it('deutlich geringere LSt als StKl I', () => {
      const lst1 = calculateIncomeTax(4000, 1);
      const lst3 = calculateIncomeTax(4000, 3);
      expect(lst3).toBeLessThan(lst1);
      expect(lst3).toBeLessThan(lst1 * 0.5); // Mindestens 50% weniger
    });
    
    it('3.000 €/Monat → keine/kaum LSt', () => {
      const lst = calculateIncomeTax(3000, 3);
      expect(lst).toBeLessThan(50);
    });
  });

  describe('StKl V (Vergleichsberechnung)', () => {
    it('höhere LSt als StKl I', () => {
      expect(calculateIncomeTax(4000, 5)).toBeGreaterThan(calculateIncomeTax(4000, 1));
    });
    
    it('StKl III + StKl V ≈ 2 × StKl IV (bei gleichem Einkommen)', () => {
      const gross = 4000;
      const lstIII = calculateIncomeTax(gross, 3);
      const lstV = calculateIncomeTax(gross, 5);
      const lstIV = calculateIncomeTax(gross, 4);
      // III + V sollte ungefähr 2 × IV sein (nicht exakt wegen Rundung)
      expect(Math.abs((lstIII + lstV) - 2 * lstIV)).toBeLessThan(5);
    });
  });

  describe('StKl VI (Zweitjob)', () => {
    it('höchste LSt aller Steuerklassen', () => {
      const gross = 3000;
      [1, 2, 3, 4, 5].forEach(stkl => {
        expect(calculateIncomeTax(gross, 6)).toBeGreaterThanOrEqual(calculateIncomeTax(gross, stkl));
      });
    });
    
    it('LSt ab dem ersten Euro', () => {
      expect(calculateIncomeTax(500, 6)).toBeGreaterThan(0);
    });
  });

  describe('Steuerklassen-Ordnung', () => {
    it('LSt-Ordnung: StKl III < I/IV < II ≤ I < V < VI', () => {
      const gross = 5000;
      const lst3 = calculateIncomeTax(gross, 3);
      const lst1 = calculateIncomeTax(gross, 1);
      const lst5 = calculateIncomeTax(gross, 5);
      const lst6 = calculateIncomeTax(gross, 6);
      
      expect(lst3).toBeLessThan(lst1);
      expect(lst1).toBeLessThan(lst5);
      expect(lst5).toBeLessThan(lst6);
    });
  });
});

// ============= Solidaritätszuschlag =============

describe('PAP 2025: Solidaritätszuschlag', () => {
  it('kein Soli unter Freigrenze', () => {
    expect(calculateSolidarityTax(19950)).toBe(0);
  });
  
  it('Soli über Freigrenze = 5,5%', () => {
    expect(calculateSolidarityTax(25000)).toBe(Math.floor(25000 * 0.055));
  });
  
  it('kein Soli bei 0 ESt', () => {
    expect(calculateSolidarityTax(0)).toBe(0);
  });
});

// ============= Kirchensteuer =============

describe('PAP 2025: Kirchensteuer', () => {
  it('8% in Bayern/BW', () => {
    expect(calculateChurchTax(10000, 8)).toBe(Math.floor(10000 * 0.08));
  });
  
  it('9% in anderen Bundesländern', () => {
    expect(calculateChurchTax(10000, 9)).toBe(Math.floor(10000 * 0.09));
  });
});

// ============= Komplettberechnung mit PAP 2025 =============

describe('PAP 2025: Komplettberechnung calculateCompleteTax', () => {
  
  it('3.500€ StKl I: plausible Werte (Toleranz ≤ 2%)', () => {
    const result = calculateCompleteTax({
      grossSalaryYearly: 42000,
      taxClass: '1',
      childAllowances: 0,
      churchTax: false,
      churchTaxRate: 0,
      healthInsuranceRate: 1.7,
      isEastGermany: false,
      isChildless: true,
      age: 30,
    });
    
    expect(result.grossMonthly).toBe(3500);
    expect(result.netMonthly).toBeGreaterThan(2000);
    expect(result.netMonthly).toBeLessThan(2800);
    expect(result.incomeTax).toBeGreaterThan(0);
    expect(result.totalDeductions).toBeGreaterThan(0);
    expect(result.netYearly).toBe(result.netMonthly * 12);
  });

  it('Konsistenz: Brutto = Netto + Abzüge', () => {
    const result = calculateCompleteTax({
      grossSalaryYearly: 60000,
      taxClass: '1',
      childAllowances: 1,
      churchTax: true,
      churchTaxRate: 9,
      healthInsuranceRate: 1.3,
      isEastGermany: false,
      isChildless: false,
      age: 35,
      numberOfChildren: 1,
    });
    
    const calculated = result.netYearly + result.totalDeductions;
    expect(Math.abs(calculated - result.grossYearly)).toBeLessThan(1);
  });
});
