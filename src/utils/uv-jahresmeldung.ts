/**
 * UV-Jahresmeldung / Digitaler Lohnnachweis (DSLN)
 * ─────────────────────────────────────────────────────────────
 * Jährliche Meldung an die zuständige Berufsgenossenschaft (BG)
 * gem. § 99 SGB IV bzw. § 165 Abs. 1 SGB VII.
 *
 * Frist: bis 16.02. des Folgejahres.
 *
 * Aggregation: Bruttoarbeitsentgelte und geleistete Arbeitsstunden
 * je Gefahrtarifstelle (PGS = Personengruppenschlüssel pro BG).
 *
 * Hinweis: Die Übermittlung erfolgt elektronisch über sv.net /
 * dakota.le – hier wird der Datensatz nur fachlich aggregiert
 * und als Entwurf gespeichert. XML/Provider-Anbindung folgt in
 * Phase 4.
 */

import type { Employee } from '@/types/employee';

export interface UvJahresmeldungAggregat {
  bgMitgliedsnummer: string;
  gefahrtarifstelle: string;
  anzahlVersicherte: number;
  bruttoSumme: number;
  geleisteteArbeitsstunden: number;
  details: UvMitarbeiterAnteil[];
}

export interface UvMitarbeiterAnteil {
  employeeId: string;
  name: string;
  brutto: number;
  arbeitsstunden: number;
}

export interface UvBerechnungInput {
  employees: Employee[];
  jahresBruttos: Record<string, number>;     // employee_id -> Brutto-Summe Jahr
  jahresArbeitsstunden: Record<string, number>; // employee_id -> Stunden Jahr
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Aggregiert die Jahres-Bruttos je Gefahrtarifstelle.
 * Mitarbeiter ohne BG-Stammdaten werden übersprungen.
 */
export function aggregateUvJahresmeldung(
  input: UvBerechnungInput,
): UvJahresmeldungAggregat[] {
  const buckets = new Map<string, UvJahresmeldungAggregat>();

  for (const emp of input.employees) {
    const anyEmp = emp as any;
    const bgNr: string | undefined =
      anyEmp.bgMitgliedsnummer ?? anyEmp.employmentData?.bgMitgliedsnummer;
    const gts: string | undefined =
      anyEmp.gefahrtarifstelle ?? anyEmp.employmentData?.gefahrtarifstelle;

    if (!bgNr || !gts) continue;

    const key = `${bgNr}__${gts}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        bgMitgliedsnummer: bgNr,
        gefahrtarifstelle: gts,
        anzahlVersicherte: 0,
        bruttoSumme: 0,
        geleisteteArbeitsstunden: 0,
        details: [],
      };
      buckets.set(key, bucket);
    }

    const brutto = round2(input.jahresBruttos[emp.id] ?? 0);
    const stunden = round2(input.jahresArbeitsstunden[emp.id] ?? 0);

    bucket.anzahlVersicherte += 1;
    bucket.bruttoSumme = round2(bucket.bruttoSumme + brutto);
    bucket.geleisteteArbeitsstunden = round2(
      bucket.geleisteteArbeitsstunden + stunden,
    );
    bucket.details.push({
      employeeId: emp.id,
      name: `${emp.personalData.lastName}, ${emp.personalData.firstName}`,
      brutto,
      arbeitsstunden: stunden,
    });
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.bgMitgliedsnummer.localeCompare(b.bgMitgliedsnummer) ||
    a.gefahrtarifstelle.localeCompare(b.gefahrtarifstelle),
  );
}

/**
 * Schätzt Jahres-Arbeitsstunden anhand der wöchentlichen Arbeitszeit
 * (Fallback, wenn keine echten Zeiterfassungsdaten vorliegen).
 */
export function estimateAnnualHours(weeklyHours: number, weeksPerYear = 47): number {
  return Math.round((weeklyHours ?? 0) * weeksPerYear);
}