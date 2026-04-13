import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatCurrency, formatDate, formatPeriodName, formatPayrollStatus, 
  getPayrollStatusColor, getPayrollStatusLabel, getTrafficLightColor, 
  getTrafficLightLabel, getTrafficLightDot, getMeldwesenStatusColor,
  roundCurrency, sumCurrency, isValidPayrollAmount, assertSumEquals,
  formatNumber, formatPercent, formatEmploymentType, formatTaxClass,
  createPeriodId, parsePeriodId, getPayrollStatusVariant
} from '../formatters';

describe('formatters - Währung', () => {
  it('formatiert EUR korrekt', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1.234,56');
    expect(result).toContain('€');
  });

  it('formatiert 0 korrekt', () => {
    expect(formatCurrency(0)).toContain('0,00');
  });

  it('formatiert negative Beträge', () => {
    expect(formatCurrency(-500)).toContain('500');
  });

  it('zeigt Vorzeichen wenn gewünscht', () => {
    const result = formatCurrency(100, { showSign: true });
    expect(result).toContain('+');
  });
});

describe('formatters - Rundung', () => {
  it('rundet kaufmännisch korrekt', () => {
    expect(roundCurrency(1234.565)).toBe(1234.57);
    expect(roundCurrency(1234.564)).toBe(1234.56);
    expect(roundCurrency(1234.5, 0)).toBe(1235);
  });

  it('behandelt NaN/Infinity', () => {
    expect(roundCurrency(NaN)).toBe(0);
    expect(roundCurrency(Infinity)).toBe(0);
  });

  it('summiert ohne Floating-Point-Fehler', () => {
    expect(sumCurrency(10.1, 10.2, 10.3)).toBe(30.6);
  });

  it('validiert Beträge', () => {
    expect(isValidPayrollAmount(1234.56)).toBe(true);
    expect(isValidPayrollAmount(-100)).toBe(false);
    expect(isValidPayrollAmount(NaN)).toBe(false);
  });

  it('assertSumEquals wirft bei Differenz', () => {
    expect(() => assertSumEquals(100, [30, 40, 30], 'test')).not.toThrow();
    expect(() => assertSumEquals(100, [30, 40, 31], 'test')).toThrow();
  });
});

describe('formatters - Datum', () => {
  it('formatiert Datum kurz', () => {
    expect(formatDate('2025-01-15')).toBe('15.01.2025');
  });

  it('behandelt ungültige Daten', () => {
    expect(formatDate('invalid')).toBe('-');
  });

  it('formatiert Periodenname', () => {
    expect(formatPeriodName(1, 2025)).toBe('Januar 2025');
    expect(formatPeriodName(1, 2025, 'short')).toBe('Jan 2025');
    expect(formatPeriodName(1, 2025, 'compact')).toBe('01/2025');
  });

  it('erstellt und parst Perioden-IDs', () => {
    expect(createPeriodId(1, 2025)).toBe('2025-01');
    expect(parsePeriodId('2025-01')).toEqual({ month: 1, year: 2025 });
    expect(parsePeriodId('invalid')).toBeNull();
  });
});

describe('formatters - Zahlen & Prozent', () => {
  it('formatiert Zahlen', () => {
    expect(formatNumber(1234567.89)).toContain('1.234.567');
  });

  it('formatiert Prozent', () => {
    expect(formatPercent(0.425)).toContain('42,5');
  });
});

describe('formatters - Status-Labels', () => {
  it('gibt Payroll-Status-Labels zurück', () => {
    expect(formatPayrollStatus('draft')).toBe('Entwurf');
    expect(formatPayrollStatus('approved')).toBe('Freigegeben');
    expect(formatPayrollStatus('unknown')).toBe('unknown');
  });

  it('gibt Payroll-Status-Varianten zurück', () => {
    expect(getPayrollStatusVariant('draft')).toBe('secondary');
    expect(getPayrollStatusVariant('approved')).toBe('default');
    expect(getPayrollStatusVariant('unknown')).toBe('secondary');
  });
});

describe('formatters - Zentrale Status-Farben', () => {
  it('gibt Payroll-Status-Farben zurück', () => {
    expect(getPayrollStatusColor('draft')).toContain('bg-muted');
    expect(getPayrollStatusColor('paid')).toContain('bg-green');
    expect(getPayrollStatusColor('unknown')).toContain('bg-muted');
  });

  it('gibt Payroll-Status-Labels zurück', () => {
    expect(getPayrollStatusLabel('draft')).toBe('Entwurf');
    expect(getPayrollStatusLabel('paid')).toBe('Ausgezahlt');
  });

  it('gibt Meldewesen-Status-Farben zurück', () => {
    expect(getMeldwesenStatusColor('entwurf')).toContain('bg-muted');
    expect(getMeldwesenStatusColor('uebermittelt')).toContain('bg-green');
  });

  it('gibt Traffic-Light-Farben zurück', () => {
    expect(getTrafficLightColor('green')).toContain('bg-green');
    expect(getTrafficLightColor('yellow')).toContain('bg-yellow');
    expect(getTrafficLightColor('red')).toContain('bg-red');
  });

  it('gibt Traffic-Light-Dot-Farben zurück', () => {
    expect(getTrafficLightDot('green')).toBe('bg-green-500');
    expect(getTrafficLightDot('red')).toBe('bg-red-500');
  });

  it('gibt Traffic-Light-Labels zurück', () => {
    expect(getTrafficLightLabel('green')).toBe('Normal');
    expect(getTrafficLightLabel('yellow')).toBe('Warnung');
    expect(getTrafficLightLabel('red')).toBe('Kritisch');
  });
});

describe('formatters - Beschäftigung & Steuer', () => {
  it('formatiert Beschäftigungsart', () => {
    expect(formatEmploymentType('fulltime')).toBe('Vollzeit');
    expect(formatEmploymentType('minijob')).toBe('Minijob');
    expect(formatEmploymentType('unknown')).toBe('unknown');
  });

  it('formatiert Steuerklasse', () => {
    expect(formatTaxClass('III')).toContain('Verheiratet');
    expect(formatTaxClass('III', true)).toBe('III');
  });
});
