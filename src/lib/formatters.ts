/**
 * Zentrale Formatierungs-Utilities
 * 
 * Stellt konsistente Formatierung für Währungen, Datumsangaben und 
 * Abrechnungsperioden bereit. Verwendet deutsches Locale.
 */

import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// ============= Währungs-Formatierung =============

/**
 * Formatiert einen Betrag als Euro-Währung
 * 
 * @param amount - Der zu formatierende Betrag
 * @param options - Optionale Konfiguration
 * @returns Formatierter String (z.B. "1.234,56 €")
 * 
 * @example
 * formatCurrency(1234.56) // "1.234,56 €"
 * formatCurrency(1234.56, { showSign: true }) // "+1.234,56 €"
 * formatCurrency(1234.56, { compact: true }) // "1,2K €"
 */
export function formatCurrency(
  amount: number,
  options?: {
    showSign?: boolean;
    compact?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    showSign = false,
    compact = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options ?? {};

  const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: compact ? 0 : minimumFractionDigits,
    maximumFractionDigits: compact ? 1 : maximumFractionDigits,
    notation: compact ? 'compact' : 'standard',
    signDisplay: showSign ? 'always' : 'auto',
  });

  return formatter.format(amount);
}

/**
 * Formatiert einen Betrag als reine Zahl mit Tausendertrennzeichen
 * 
 * @example
 * formatNumber(1234567.89) // "1.234.567,89"
 */
export function formatNumber(
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options ?? {};

  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Formatiert einen Prozentsatz
 * 
 * @example
 * formatPercent(0.425) // "42,5 %"
 * formatPercent(42.5, { isAlreadyPercent: true }) // "42,5 %"
 */
export function formatPercent(
  value: number,
  options?: {
    isAlreadyPercent?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    isAlreadyPercent = false,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options ?? {};

  const percentValue = isAlreadyPercent ? value / 100 : value;

  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(percentValue);
}

// ============= Datums-Formatierung =============

/**
 * Formatiert ein Datum nach deutschem Standard
 * 
 * @example
 * formatDate(new Date()) // "15.01.2025"
 * formatDate(new Date(), 'full') // "Mittwoch, 15. Januar 2025"
 */
export function formatDate(
  date: Date | string,
  variant: 'short' | 'medium' | 'full' = 'short'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  switch (variant) {
    case 'short':
      return format(dateObj, 'dd.MM.yyyy', { locale: de });
    case 'medium':
      return format(dateObj, 'd. MMM yyyy', { locale: de });
    case 'full':
      return format(dateObj, 'EEEE, d. MMMM yyyy', { locale: de });
    default:
      return format(dateObj, 'dd.MM.yyyy', { locale: de });
  }
}

/**
 * Formatiert Datum und Uhrzeit
 * 
 * @example
 * formatDateTime(new Date()) // "15.01.2025, 14:30"
 */
export function formatDateTime(
  date: Date | string,
  includeSeconds = false
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const pattern = includeSeconds ? 'dd.MM.yyyy, HH:mm:ss' : 'dd.MM.yyyy, HH:mm';
  return format(dateObj, pattern, { locale: de });
}

/**
 * Formatiert nur die Uhrzeit
 * 
 * @example
 * formatTime(new Date()) // "14:30"
 */
export function formatTime(date: Date | string, includeSeconds = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const pattern = includeSeconds ? 'HH:mm:ss' : 'HH:mm';
  return format(dateObj, pattern, { locale: de });
}

// ============= Perioden-Formatierung =============

/**
 * Deutsche Monatsnamen
 */
export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
] as const;

/**
 * Kurze deutsche Monatsnamen
 */
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
] as const;

/**
 * Formatiert eine Abrechnungsperiode
 * 
 * @param month - Monat (1-12)
 * @param year - Jahr (z.B. 2025)
 * @param variant - Format-Variante
 * @returns Formatierter Periodenname
 * 
 * @example
 * formatPeriodName(1, 2025) // "Januar 2025"
 * formatPeriodName(1, 2025, 'short') // "Jan 2025"
 * formatPeriodName(1, 2025, 'compact') // "01/2025"
 */
export function formatPeriodName(
  month: number,
  year: number,
  variant: 'full' | 'short' | 'compact' = 'full'
): string {
  // Validierung
  if (month < 1 || month > 12) {
    return `${month}/${year}`;
  }

  switch (variant) {
    case 'full':
      return `${MONTH_NAMES[month - 1]} ${year}`;
    case 'short':
      return `${MONTH_NAMES_SHORT[month - 1]} ${year}`;
    case 'compact':
      return `${String(month).padStart(2, '0')}/${year}`;
    default:
      return `${MONTH_NAMES[month - 1]} ${year}`;
  }
}

/**
 * Erstellt einen Perioden-ID-String
 * 
 * @example
 * createPeriodId(1, 2025) // "2025-01"
 */
export function createPeriodId(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Parst eine Perioden-ID zurück in Monat und Jahr
 * 
 * @example
 * parsePeriodId("2025-01") // { month: 1, year: 2025 }
 */
export function parsePeriodId(periodId: string): { month: number; year: number } | null {
  const match = periodId.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
  };
}

// ============= Beschäftigungs-Labels =============

/**
 * Labels für Beschäftigungsarten
 */
export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  minijob: 'Minijob',
  midijob: 'Midijob',
  fulltime: 'Vollzeit',
  parttime: 'Teilzeit',
} as const;

/**
 * Formatiert eine Beschäftigungsart
 * 
 * @example
 * formatEmploymentType('fulltime') // "Vollzeit"
 */
export function formatEmploymentType(type: string): string {
  return EMPLOYMENT_TYPE_LABELS[type] ?? type;
}

/**
 * Labels für Steuerklassen
 */
export const TAX_CLASS_LABELS: Record<string, string> = {
  I: 'Steuerklasse I - Ledig',
  II: 'Steuerklasse II - Alleinerziehend',
  III: 'Steuerklasse III - Verheiratet (Hauptverdiener)',
  IV: 'Steuerklasse IV - Verheiratet (gleiches Einkommen)',
  V: 'Steuerklasse V - Verheiratet (Geringverdiener)',
  VI: 'Steuerklasse VI - Zweitjob',
} as const;

/**
 * Formatiert eine Steuerklasse
 * 
 * @example
 * formatTaxClass('III') // "Steuerklasse III - Verheiratet (Hauptverdiener)"
 * formatTaxClass('III', true) // "III"
 */
export function formatTaxClass(taxClass: string, shortForm = false): string {
  if (shortForm) return taxClass;
  return TAX_CLASS_LABELS[taxClass] ?? `Steuerklasse ${taxClass}`;
}

// ============= Status-Labels =============

/**
 * Labels für Abrechnungsstatus
 */
export const PAYROLL_STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  calculated: 'Berechnet',
  approved: 'Freigegeben',
  paid: 'Ausgezahlt',
  archived: 'Archiviert',
} as const;

/**
 * Formatiert einen Abrechnungsstatus
 * 
 * @example
 * formatPayrollStatus('approved') // "Freigegeben"
 */
export function formatPayrollStatus(status: string): string {
  return PAYROLL_STATUS_LABELS[status] ?? status;
}

/**
 * Status-Farben für Badge-Varianten
 */
export const PAYROLL_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  calculated: 'outline',
  approved: 'default',
  paid: 'default',
  archived: 'secondary',
} as const;

/**
 * Gibt die Badge-Variante für einen Status zurück
 */
export function getPayrollStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  return PAYROLL_STATUS_VARIANTS[status] ?? 'secondary';
}
