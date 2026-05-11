import { describe, it, expect } from 'vitest';
import { calculateMultipleEmploymentSV } from '../multiple-employment';
import { BBG_2025_MONTHLY } from '@/constants/social-security';

/**
 * E2E-Test Mehrfachbeschäftigung BBG-Split (§ 22 Abs. 2 SGB IV)
 * Validiert die anteilige Verteilung der BBG auf mehrere Arbeitgeber.
 */
describe('Mehrfachbeschäftigung – BBG-Split E2E', () => {
  it('zwei AG unter BBG: jeder zahlt SV auf vollen Bruttolohn', () => {
    const r = calculateMultipleEmploymentSV({
      employments: [
        { employerId: 'A', employerName: 'AG A', monthlyGross: 2000, isPrimary: true },
        { employerId: 'B', employerName: 'AG B', monthlyGross: 1000, isPrimary: false },
      ],
    });
    expect(r.totalGross).toBe(3000);
    expect(r.employmentResults[0].svGross_RV).toBe(2000);
    expect(r.employmentResults[1].svGross_RV).toBe(1000);
    expect(r.warnings.find(w => w.includes('übersteigt'))).toBeUndefined();
  });

  it('Gesamt > BBG_RV: anteilige Kappung pro AG', () => {
    const bbg = BBG_2025_MONTHLY.pensionWest;
    const grossA = bbg * 0.7;
    const grossB = bbg * 0.6; // Summe = 1.3 * BBG → Kappung
    const r = calculateMultipleEmploymentSV({
      employments: [
        { employerId: 'A', employerName: 'AG A', monthlyGross: grossA, isPrimary: true },
        { employerId: 'B', employerName: 'AG B', monthlyGross: grossB, isPrimary: false },
      ],
    });

    // Anteile
    expect(r.employmentResults[0].bbgSharePercent).toBeCloseTo(53.85, 1);
    expect(r.employmentResults[1].bbgSharePercent).toBeCloseTo(46.15, 1);

    // Summe der gekappten SV-Brutti darf BBG nicht überschreiten (mit 1ct Toleranz)
    const sum = r.employmentResults.reduce((s, e) => s + e.svGross_RV, 0);
    expect(sum).toBeLessThanOrEqual(bbg + 0.01);

    // Warnung muss ausgegeben werden
    expect(r.warnings.some(w => w.includes('übersteigt BBG'))).toBe(true);
  });

  it('Steuerklasse VI Szenario: Nebenbeschäftigung mit kleinem Brutto', () => {
    const r = calculateMultipleEmploymentSV({
      employments: [
        { employerId: 'main', employerName: 'Haupt', monthlyGross: 5000, isPrimary: true },
        { employerId: 'side', employerName: 'Neben', monthlyGross: 800, isPrimary: false },
      ],
    });
    // Beide unter BBG → keine Kappung
    expect(r.employmentResults[0].svGross_KV).toBe(5000);
    expect(r.employmentResults[1].svGross_KV).toBe(800);
    // AN-Beiträge müssen positiv sein
    r.employmentResults.forEach(e => {
      expect(e.totalEmployee).toBeGreaterThan(0);
    });
  });

  it('weniger als 2 Beschäftigungen → Warnung', () => {
    const r = calculateMultipleEmploymentSV({
      employments: [{ employerId: 'A', employerName: 'AG A', monthlyGross: 3000, isPrimary: true }],
    });
    expect(r.warnings.some(w => w.includes('Weniger als 2'))).toBe(true);
  });
});
