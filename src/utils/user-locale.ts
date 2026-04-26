/**
 * Ermittelt die bevorzugte Lohnzettel-Sprache des aktuell angemeldeten Users.
 *
 * Priorität:
 *   1. Supabase user_metadata.payslip_language ('de' | 'en')
 *   2. Supabase user_metadata.locale / language (z. B. 'en-US', 'de-DE')
 *   3. navigator.language des Browsers
 *   4. Fallback: 'de'
 *
 * Es werden ausschließlich die unterstützten Werte 'de' und 'en' zurückgegeben –
 * jede andere Sprache wird auf 'de' gemappt, da der Lohnzettel rechtsverbindlich
 * auf Deutsch erstellt wird.
 */
import type { User } from '@supabase/supabase-js';

export type PayslipLanguage = 'de' | 'en';

function normalize(value: unknown): PayslipLanguage | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const lower = value.toLowerCase();
  if (lower === 'de' || lower.startsWith('de-') || lower.startsWith('de_')) return 'de';
  if (lower === 'en' || lower.startsWith('en-') || lower.startsWith('en_')) return 'en';
  return null;
}

export function detectUserPayslipLanguage(user: User | null | undefined): PayslipLanguage {
  // 1. Explizite Mitarbeiter-/User-Präferenz aus user_metadata
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  if (meta) {
    const fromPreference = normalize(meta.payslip_language);
    if (fromPreference) return fromPreference;

    const fromLocale = normalize(meta.locale) ?? normalize(meta.language);
    if (fromLocale) return fromLocale;
  }

  // 2. Browser-Sprache als Indikator
  if (typeof navigator !== 'undefined' && navigator.language) {
    const fromBrowser = normalize(navigator.language);
    if (fromBrowser) return fromBrowser;
  }

  // 3. Default
  return 'de';
}