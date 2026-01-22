import { describe, it, expect } from 'vitest';
import {
  calculateNursingPayroll,
  calculateSfnBonuses,
  calculateShiftAllowances,
  calculateOnCallPay,
  generateMonthlyShiftPlan,
  NursingPayrollParams,
  ShiftEntry,
  CareLevel,
} from '../nursing-payroll';

describe('Pflege-Berechnungen (Nursing Payroll)', () => {
  
  // ============= SFN-Zuschläge (steuerfrei) =============
  
  describe('calculateSfnBonuses (Nursing)', () => {
    it('sollte Nachtzuschlag mit 30% berechnen (Mischkalkulation)', () => {
      const result = calculateSfnBonuses(20, 40, 0, 0, 0);
      
      // 40h * 20€ * 30% = 240€ (Mischkalkulation 25%/40%)
      expect(result.night).toBeCloseTo(240, 0);
    });

    it('sollte Sonntagszuschlag mit 50% berechnen', () => {
      const result = calculateSfnBonuses(18, 0, 16, 0, 0);
      
      // 16h * 18€ * 50% = 144€
      expect(result.sunday).toBeCloseTo(144, 0);
    });

    it('sollte Feiertagszuschlag mit 125% berechnen', () => {
      const result = calculateSfnBonuses(22, 0, 0, 8, 0);
      
      // 8h * 22€ * 125% = 220€
      expect(result.holiday).toBeCloseTo(220, 0);
    });

    it('sollte Weihnachtszuschlag berechnen (150%)', () => {
      const result = calculateSfnBonuses(20, 0, 0, 0, 8);
      
      // 8h * 20€ * 150% = 240€
      expect(result.christmas).toBeCloseTo(240, 0);
    });

    it('sollte steuerfreien Anteil korrekt berechnen', () => {
      const result = calculateSfnBonuses(20, 20, 8, 4, 0);
      
      expect(result.taxFree).toBeGreaterThan(0);
      expect(result.taxFree).toBeLessThanOrEqual(result.total);
    });

    it('sollte 50€/h Cap anwenden', () => {
      const result = calculateSfnBonuses(60, 10, 0, 0, 0); // 60€/h > Cap
      
      // Sollte auf Basis von 50€/h und 30% berechnet werden
      const expectedMax = 10 * 50 * 0.30;
      expect(result.night).toBeLessThanOrEqual(expectedMax);
    });

    it('sollte Details-Array mit Aufschlüsselung enthalten', () => {
      const result = calculateSfnBonuses(18, 30, 16, 8, 0);
      
      expect(result.details).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
    });
  });

  // ============= Schichtzulagen =============

  describe('calculateShiftAllowances', () => {
    it('sollte Zulagen für Nachtschichten berechnen', () => {
      const shifts: ShiftEntry[] = [
        { date: new Date(), type: 'night', hours: 8, nightHours: 8, sundayHours: 0, holidayHours: 0 },
        { date: new Date(), type: 'night', hours: 8, nightHours: 8, sundayHours: 0, holidayHours: 0 },
      ];
      
      const result = calculateShiftAllowances(shifts);
      
      expect(result.byType.night.hours).toBe(16);
      expect(result.byType.night.amount).toBeGreaterThan(0);
    });

    it('sollte verschiedene Schichttypen unterscheiden', () => {
      const shifts: ShiftEntry[] = [
        { date: new Date(), type: 'early', hours: 8, nightHours: 0, sundayHours: 0, holidayHours: 0 },
        { date: new Date(), type: 'late', hours: 8, nightHours: 2, sundayHours: 0, holidayHours: 0 },
        { date: new Date(), type: 'night', hours: 10, nightHours: 10, sundayHours: 0, holidayHours: 0 },
      ];
      
      const result = calculateShiftAllowances(shifts);
      
      expect(result.byType.early).toBeDefined();
      expect(result.byType.late).toBeDefined();
      expect(result.byType.night).toBeDefined();
    });

    it('sollte Gesamt korrekt summieren', () => {
      const shifts: ShiftEntry[] = [
        { date: new Date(), type: 'night', hours: 8, nightHours: 8, sundayHours: 0, holidayHours: 0 },
        { date: new Date(), type: 'late', hours: 8, nightHours: 2, sundayHours: 0, holidayHours: 0 },
      ];
      
      const result = calculateShiftAllowances(shifts);
      
      const sumByType = Object.values(result.byType).reduce(
        (sum, type) => sum + type.amount, 
        0
      );
      expect(result.total).toBeCloseTo(sumByType, 2);
    });

    it('sollte leeres Array bei keinen Schichten behandeln', () => {
      const result = calculateShiftAllowances([]);
      
      expect(result.total).toBe(0);
    });
  });

  // ============= Bereitschaftsdienst =============

  describe('calculateOnCallPay', () => {
    it('sollte Bereitschaft mit 25% vergüten', () => {
      const result = calculateOnCallPay(20, 40, 25);
      
      // 40h * 20€ * 25% = 200€
      expect(result.amount).toBeCloseTo(200, 0);
    });

    it('sollte effektiven Stundenlohn berechnen', () => {
      const result = calculateOnCallPay(24, 20, 25);
      
      expect(result.effectiveHourlyRate).toBeCloseTo(24 * 0.25, 2);
    });

    it('sollte 0 bei keinen Bereitschaftsstunden zurückgeben', () => {
      const result = calculateOnCallPay(20, 0);
      
      expect(result.amount).toBe(0);
    });

    it('sollte Details-Array enthalten', () => {
      const result = calculateOnCallPay(18, 30);
      
      expect(result.details).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
    });
  });

  // ============= Schichtplan-Generierung =============

  describe('generateMonthlyShiftPlan', () => {
    it('sollte Schichtplan für einen Monat generieren', () => {
      const pattern: ('early' | 'late' | 'night' | 'split')[] = ['early', 'late', 'night'];
      const shifts = generateMonthlyShiftPlan(1, 2025, pattern);
      
      expect(shifts.length).toBeGreaterThan(0);
      expect(shifts.length).toBeLessThanOrEqual(31);
    });

    it('sollte Schichttypen aus Pattern rotieren', () => {
      const pattern: ('early' | 'late' | 'night' | 'split')[] = ['early', 'late'];
      const shifts = generateMonthlyShiftPlan(3, 2025, pattern);
      
      const types = shifts.map(s => s.type);
      expect(types.includes('early')).toBe(true);
      expect(types.includes('late')).toBe(true);
    });

    it('sollte korrekte Datumswerte setzen', () => {
      const shifts = generateMonthlyShiftPlan(6, 2025, ['early']);
      
      shifts.forEach(shift => {
        expect(shift.date).toBeInstanceOf(Date);
        expect(shift.date.getMonth()).toBe(5); // Juni = 5
        expect(shift.date.getFullYear()).toBe(2025);
      });
    });
  });

  // ============= Gesamt-Berechnung =============

  describe('calculateNursingPayroll', () => {
    const baseShifts: ShiftEntry[] = [
      { date: new Date(), type: 'early', hours: 8, nightHours: 0, sundayHours: 0, holidayHours: 0 },
      { date: new Date(), type: 'late', hours: 8, nightHours: 2, sundayHours: 0, holidayHours: 0 },
      { date: new Date(), type: 'night', hours: 10, nightHours: 10, sundayHours: 4, holidayHours: 0 },
    ];

    it('sollte vollständige Pflege-Abrechnung erstellen', () => {
      const params: NursingPayrollParams = {
        grossMonthly: 3500,
        hoursWorked: 168,
        careLevel: 'nurse',
        shifts: baseShifts,
        onCallHours: 20,
      };
      
      const result = calculateNursingPayroll(params);
      
      expect(result.baseGross).toBe(3500);
      expect(result.hourlyRate).toBeCloseTo(3500 / 168, 2);
      expect(result.totalSfnBonuses).toBeGreaterThan(0);
      expect(result.shiftAllowance).toBeGreaterThan(0);
      expect(result.onCallPay).toBeGreaterThan(0);
      expect(result.totalGross).toBeGreaterThan(3500);
    });

    it('sollte steuerfreie SFN-Zuschläge korrekt ausweisen', () => {
      const params: NursingPayrollParams = {
        grossMonthly: 3200,
        hoursWorked: 160,
        careLevel: 'specialist',
        shifts: [
          { date: new Date(), type: 'night', hours: 8, nightHours: 8, sundayHours: 8, holidayHours: 0 },
        ],
      };
      
      const result = calculateNursingPayroll(params);
      
      expect(result.taxFreeAmount).toBeGreaterThan(0);
      expect(result.taxableAmount).toBeGreaterThan(0);
      expect(result.taxFreeAmount + result.taxableAmount).toBeCloseTo(result.totalGross, 0);
    });

    it('sollte Qualifikationsstufe (careLevel) berücksichtigen', () => {
      const baseParams = {
        grossMonthly: 3000,
        hoursWorked: 160,
        shifts: baseShifts,
      };

      const careLevels: CareLevel[] = ['assistant', 'nurse', 'specialist', 'lead'];
      const results = careLevels.map(careLevel => 
        calculateNursingPayroll({ ...baseParams, careLevel })
      );
      
      // Alle sollten gültige Ergebnisse liefern
      results.forEach(result => {
        expect(result.totalGross).toBeGreaterThan(0);
        expect(result.details.length).toBeGreaterThan(0);
      });
    });

    it('sollte Schichtzusammenfassung enthalten', () => {
      const params: NursingPayrollParams = {
        grossMonthly: 3800,
        hoursWorked: 176,
        careLevel: 'lead',
        shifts: [
          { date: new Date(), type: 'early', hours: 8, nightHours: 0, sundayHours: 0, holidayHours: 0 },
          { date: new Date(), type: 'early', hours: 8, nightHours: 0, sundayHours: 0, holidayHours: 0 },
          { date: new Date(), type: 'late', hours: 8, nightHours: 2, sundayHours: 0, holidayHours: 0 },
          { date: new Date(), type: 'night', hours: 10, nightHours: 10, sundayHours: 0, holidayHours: 0 },
          { date: new Date(), type: 'night', hours: 10, nightHours: 10, sundayHours: 8, holidayHours: 0 },
        ],
        weekendDays: 4,
        holidayDays: 1,
      };
      
      const result = calculateNursingPayroll(params);
      
      expect(result.shiftSummary).toBeDefined();
      expect(result.shiftSummary.earlyShifts).toBe(2);
      expect(result.shiftSummary.lateShifts).toBe(1);
      expect(result.shiftSummary.nightShifts).toBe(2);
      expect(result.shiftSummary.totalNightHours).toBe(22);
      expect(result.shiftSummary.totalSundayHours).toBe(8);
    });

    it('sollte ohne Schichten funktionieren (nur Grundgehalt)', () => {
      const params: NursingPayrollParams = {
        grossMonthly: 3000,
        hoursWorked: 160,
        careLevel: 'nurse',
        shifts: [],
      };
      
      const result = calculateNursingPayroll(params);
      
      expect(result.baseGross).toBe(3000);
      expect(result.totalSfnBonuses).toBe(0);
      expect(result.totalGross).toBe(3000);
    });

    it('sollte Details-Array mit vollständiger Aufschlüsselung enthalten', () => {
      const params: NursingPayrollParams = {
        grossMonthly: 3600,
        hoursWorked: 168,
        careLevel: 'nurse',
        shifts: baseShifts,
        onCallHours: 10,
      };
      
      const result = calculateNursingPayroll(params);
      
      expect(result.details).toBeDefined();
      expect(result.details.length).toBeGreaterThan(5);
      expect(result.details.some(d => d.includes('Stundenlohn') || d.includes('hourly'))).toBe(true);
    });
  });
});
