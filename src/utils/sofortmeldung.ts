/**
 * Sofortmeldung nach § 28a Abs. 1 SGB IV
 * ─────────────────────────────────────────────────────────────
 * Pflicht in folgenden Branchen (sog. "Sofortmeldebranchen"):
 *   - Baugewerbe
 *   - Gaststätten- und Beherbergungsgewerbe
 *   - Personenbeförderungsgewerbe
 *   - Speditions-, Transport- und damit verbundenes Logistikgewerbe
 *   - Schaustellergewerbe
 *   - Unternehmen der Forstwirtschaft
 *   - Gebäudereinigungsgewerbe
 *   - Unternehmen, die sich am Auf- und Abbau von Messen beteiligen
 *   - Fleischwirtschaft
 *   - Wach- und Sicherheitsgewerbe
 *   - Prostitutionsgewerbe
 *
 * Frist: SPÄTESTENS bei Beschäftigungsbeginn an die Datenstelle
 * der Rentenversicherung (DSRV). DEÜV-Datensatz DSME, Abgabegrund 20.
 */

import type { Employee, IndustryType } from '@/types/employee';

/**
 * Branchen, in denen die Sofortmeldepflicht greift.
 * Mappt unsere internen IndustryType-Werte auf die gesetzlichen Branchen.
 */
export const SOFORTMELDE_BRANCHEN: IndustryType[] = [
  'construction', // Bau
  'gastronomy',   // Gaststätten
];

/**
 * Zusätzliche Branchen, die wir aktuell nur als Free-Text auf
 * `position`/`department` erkennen können (heuristisch).
 */
const KEYWORD_BRANCHEN = [
  'spedition', 'transport', 'logistik',
  'gebäudereinigung', 'gebaeudereinigung', 'reinigung',
  'sicherheit', 'wachdienst',
  'fleisch', 'metzger', 'schlachter',
  'forst', 'forstwirtschaft',
  'messebau', 'schausteller',
  'taxi', 'personenbeförderung', 'personenbefoerderung',
];

/**
 * Prüft, ob für den Mitarbeiter eine Sofortmeldung erforderlich ist.
 */
export function isSofortmeldepflichtig(emp: Employee): boolean {
  const ind = emp.employmentData.industry;
  if (ind && SOFORTMELDE_BRANCHEN.includes(ind)) return true;

  const haystack = `${emp.employmentData.department ?? ''} ${emp.employmentData.position ?? ''}`.toLowerCase();
  return KEYWORD_BRANCHEN.some(k => haystack.includes(k));
}

export interface SofortmeldungPayload {
  abgabegrund: '20';
  satzart: 'DSME';
  versicherungsnummer: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string; // YYYY-MM-DD
  beschaeftigungsbeginn: string; // YYYY-MM-DD
  betriebsnummer_arbeitgeber?: string;
  meldedatum: string;
}

/**
 * Baut den fachlichen Datensatz einer Sofortmeldung.
 * (XML-Serialisierung erfolgt später durch den DEÜV-Provider.)
 */
export function buildSofortmeldungPayload(
  emp: Employee,
  betriebsnummerArbeitgeber?: string,
): SofortmeldungPayload {
  const startDate = emp.employmentData.startDate
    ? new Date(emp.employmentData.startDate)
    : new Date();

  return {
    abgabegrund: '20',
    satzart: 'DSME',
    versicherungsnummer: emp.personalData.socialSecurityNumber ?? '',
    vorname: emp.personalData.firstName,
    nachname: emp.personalData.lastName,
    geburtsdatum: new Date(emp.personalData.dateOfBirth).toISOString().split('T')[0],
    beschaeftigungsbeginn: startDate.toISOString().split('T')[0],
    betriebsnummer_arbeitgeber: betriebsnummerArbeitgeber,
    meldedatum: new Date().toISOString().split('T')[0],
  };
}