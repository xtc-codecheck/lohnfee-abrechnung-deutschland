/**
 * Fibu-Buchungslogik
 * 
 * Generiert automatische Buchungssätze (Soll/Haben) aus Lohnabrechnungen
 * nach SKR03 oder SKR04.
 * 
 * Buchungsschema Lohnabrechnung:
 *   Aufwand (Soll):
 *     - Löhne & Gehälter
 *     - AG-Anteil Sozialversicherung
 *   Verbindlichkeiten (Haben):
 *     - Nettolohn an MA
 *     - Lohnsteuer an Finanzamt
 *     - SV-Beiträge an Krankenkasse
 */

import { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import { SKR03_KONTEN, SKR04_KONTEN, Kontenrahmen } from './datev-export';
import type { WageTypeLineItem } from './wage-types-integration';

// ─── Types ──────────────────────────────────────────────────

export interface FibuBuchung {
  id: string;
  /** Fortlaufende Nummer im Journal */
  lfdNr: number;
  /** Buchungsdatum */
  datum: string;
  /** Soll-Konto */
  sollKonto: string;
  /** Soll-Konto Bezeichnung */
  sollKontoName: string;
  /** Haben-Konto */
  habenKonto: string;
  /** Haben-Konto Bezeichnung */
  habenKontoName: string;
  /** Betrag in Euro (immer positiv) */
  betrag: number;
  /** Buchungstext */
  text: string;
  /** Referenz (z.B. Abrechnungsperiode) */
  referenz: string;
  /** Kategorie */
  kategorie: BuchungsKategorie;
  /** Belegnummer */
  belegNr: string;
  /** Mitarbeiter-ID (optional) */
  employeeId?: string;
  /** Mitarbeiter-Name */
  employeeName?: string;
}

export type BuchungsKategorie =
  | 'gehalt'
  | 'lohnsteuer'
  | 'solidaritaet'
  | 'kirchensteuer'
  | 'krankenversicherung'
  | 'rentenversicherung'
  | 'arbeitslosenversicherung'
  | 'pflegeversicherung'
  | 'ag-sv'
  | 'nettolohn'
  | 'sonderzahlung'
  | 'lohnart'
  | 'pauschalsteuer';

export interface FibuJournal {
  periode: string;
  kontenrahmen: Kontenrahmen;
  buchungen: FibuBuchung[];
  summen: FibuSummen;
  erstelltAm: string;
}

export interface FibuSummen {
  sollGesamt: number;
  habenGesamt: number;
  differenz: number;
  anzahlBuchungen: number;
}

// ─── Kontenbezeichnungen ────────────────────────────────────

const KONTO_NAMEN_SKR03: Record<string, string> = {
  '4100': 'Löhne und Gehälter',
  '4110': 'Gehälter Geschäftsführung',
  '4120': 'Aushilfslöhne',
  '4125': 'Überstunden',
  '4130': 'Prämien/AG-SV',
  '4138': 'KV Arbeitgeberanteil',
  '4139': 'RV Arbeitgeberanteil',
  '4140': 'Urlaubsgeld',
  '4141': 'AV Arbeitgeberanteil',
  '4142': 'PV Arbeitgeberanteil',
  '4145': 'Weihnachtsgeld',
  '4165': 'Betriebliche Altersvorsorge',
  '4170': 'Vermögenswirksame Leistungen',
  '4945': 'Sachbezüge',
  '1200': 'Bank',
  '1740': 'Verbindlichkeiten Löhne/Gehälter',
  '1741': 'Verbindlichkeiten Finanzamt',
  '1742': 'Verbindlichkeiten Sozialversicherung',
  '1743': 'Verbindlichkeiten Krankenkasse',
};

const KONTO_NAMEN_SKR04: Record<string, string> = {
  '6000': 'Löhne und Gehälter',
  '6010': 'Gehälter Geschäftsführung',
  '6020': 'Aushilfslöhne',
  '6025': 'Überstunden',
  '6030': 'Prämien/AG-SV',
  '6040': 'Urlaubsgeld',
  '6045': 'Weihnachtsgeld',
  '6110': 'AG-Anteil Sozialversicherung',
  '6120': 'KV Arbeitgeberanteil',
  '6130': 'RV Arbeitgeberanteil',
  '6140': 'AV Arbeitgeberanteil',
  '6150': 'PV Arbeitgeberanteil',
  '6200': 'Vermögenswirksame Leistungen',
  '6210': 'Betriebliche Altersvorsorge',
  '6800': 'Sachbezüge',
  '1800': 'Bank',
  '3720': 'Verbindlichkeiten Löhne/Gehälter',
  '3730': 'Verbindlichkeiten Finanzamt',
  '3740': 'Verbindlichkeiten Sozialversicherung',
  '3741': 'Verbindlichkeiten Krankenkasse',
};

function getKontoName(konto: string, kontenrahmen: Kontenrahmen): string {
  const map = kontenrahmen === 'SKR03' ? KONTO_NAMEN_SKR03 : KONTO_NAMEN_SKR04;
  return map[konto] || `Konto ${konto}`;
}

function getKonten(kontenrahmen: Kontenrahmen) {
  return kontenrahmen === 'SKR03' ? SKR03_KONTEN : SKR04_KONTEN;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── Buchungssatz-Generator ─────────────────────────────────

/**
 * Generiert alle Buchungssätze für eine Lohnabrechnung.
 * 
 * Schema:
 *   SOLL Löhne & Gehälter (Aufwand)     an  HABEN Verb. Löhne (Netto)
 *   SOLL Löhne & Gehälter                an  HABEN Verb. Finanzamt (LSt+Soli+KiSt)
 *   SOLL Löhne & Gehälter                an  HABEN Verb. SV (AN-Anteil)
 *   SOLL AG-SV (KV/RV/AV/PV)             an  HABEN Verb. SV (AG-Anteil)
 */
export function generateBuchungenForEntry(
  entry: PayrollEntry,
  kontenrahmen: Kontenrahmen,
  periode: string,
  startLfdNr: number
): FibuBuchung[] {
  const konten = getKonten(kontenrahmen);
  const buchungen: FibuBuchung[] = [];
  let lfdNr = startLfdNr;

  const empName = `${entry.employee.personalData.firstName} ${entry.employee.personalData.lastName}`;
  const belegNr = `LA-${periode.replace('/', '')}-${entry.employeeId.slice(0, 6)}`;

  const makeBuchung = (
    sollKonto: string,
    habenKonto: string,
    betrag: number,
    text: string,
    kategorie: BuchungsKategorie
  ): FibuBuchung | null => {
    const rounded = roundCurrency(betrag);
    if (rounded <= 0) return null;
    return {
      id: `${belegNr}-${lfdNr}`,
      lfdNr: lfdNr++,
      datum: `${periode.split('/')[1]}-${periode.split('/')[0]}-01`,
      sollKonto,
      sollKontoName: getKontoName(sollKonto, kontenrahmen),
      habenKonto,
      habenKontoName: getKontoName(habenKonto, kontenrahmen),
      betrag: rounded,
      text: `${text} – ${empName}`,
      referenz: periode,
      kategorie,
      belegNr,
      employeeId: entry.employeeId,
      employeeName: empName,
    };
  };

  const calc = entry.salaryCalculation;
  const taxes = calc.taxes;
  const sv = calc.socialSecurityContributions;

  // 1. Bruttolohn → Nettolohn (Verbindlichkeit an MA)
  const netBuchung = makeBuchung(
    konten.loehneGehalt,
    konten.verbindlichkeitenLoehne,
    calc.netSalary,
    'Nettolohn',
    'nettolohn'
  );
  if (netBuchung) buchungen.push(netBuchung);

  // 2. Lohnsteuer (AN → Finanzamt)
  const lstBuchung = makeBuchung(
    konten.loehneGehalt,
    konten.lohnsteuerAbfuehrung,
    taxes.incomeTax,
    'Lohnsteuer',
    'lohnsteuer'
  );
  if (lstBuchung) buchungen.push(lstBuchung);

  // 3. Solidaritätszuschlag
  const soliBuchung = makeBuchung(
    konten.loehneGehalt,
    konten.solidaritaetszuschlag,
    taxes.solidarityTax,
    'Solidaritätszuschlag',
    'solidaritaet'
  );
  if (soliBuchung) buchungen.push(soliBuchung);

  // 4. Kirchensteuer
  const kistBuchung = makeBuchung(
    konten.loehneGehalt,
    konten.kirchensteuerAbfuehrung,
    taxes.churchTax,
    'Kirchensteuer',
    'kirchensteuer'
  );
  if (kistBuchung) buchungen.push(kistBuchung);

  // 5. KV AN-Anteil
  const kvAnBuchung = makeBuchung(
    konten.loehneGehalt,
    konten.verbindlichkeitenSv,
    sv.healthInsurance.employee,
    'KV Arbeitnehmeranteil',
    'krankenversicherung'
  );
  if (kvAnBuchung) buchungen.push(kvAnBuchung);

  // 6. RV AN-Anteil
  const rvAnBuchung = makeBuchung(
    konten.loehneGehalt,
    konten.verbindlichkeitenSv,
    sv.pensionInsurance.employee,
    'RV Arbeitnehmeranteil',
    'rentenversicherung'
  );
  if (rvAnBuchung) buchungen.push(rvAnBuchung);

  // 7. AV AN-Anteil
  const avAnBuchung = makeBuchung(
    konten.loehneGehalt,
    konten.verbindlichkeitenSv,
    sv.unemploymentInsurance.employee,
    'AV Arbeitnehmeranteil',
    'arbeitslosenversicherung'
  );
  if (avAnBuchung) buchungen.push(avAnBuchung);

  // 8. PV AN-Anteil
  const pvAnBuchung = makeBuchung(
    konten.loehneGehalt,
    konten.verbindlichkeitenSv,
    sv.careInsurance.employee,
    'PV Arbeitnehmeranteil',
    'pflegeversicherung'
  );
  if (pvAnBuchung) buchungen.push(pvAnBuchung);

  // 9–12. AG-Anteile Sozialversicherung
  const agBuchungen: [string, number, string, BuchungsKategorie][] = [
    [konten.krankenversicherungAg, sv.healthInsurance.employer, 'KV Arbeitgeberanteil', 'ag-sv'],
    [konten.rentenversicherungAg, sv.pensionInsurance.employer, 'RV Arbeitgeberanteil', 'ag-sv'],
    [konten.arbeitslosenversicherungAg, sv.unemploymentInsurance.employer, 'AV Arbeitgeberanteil', 'ag-sv'],
    [konten.pflegeversicherungAg, sv.careInsurance.employer, 'PV Arbeitgeberanteil', 'ag-sv'],
  ];

  for (const [konto, betrag, text, kat] of agBuchungen) {
    const b = makeBuchung(konto, konten.verbindlichkeitenSv, betrag, text, kat);
    if (b) buchungen.push(b);
  }

  // 13. LOHNARTEN — separate Buchungssätze pro Wage Type (P4)
  if (entry.wageTypeLineItems && entry.wageTypeLineItems.length > 0) {
    for (const li of entry.wageTypeLineItems) {
      const account = li.account || pickWageTypeFallbackAccount(li, kontenrahmen);

      if (li.amount > 0) {
        switch (li.effect) {
          case 'gross_taxable':
          case 'net_taxfree':
          case 'pauschal': {
            const b = makeBuchung(
              account,
              konten.verbindlichkeitenLoehne,
              li.amount,
              `${li.code} ${li.name}`,
              'lohnart'
            );
            if (b) buchungen.push(b);
            break;
          }
          case 'in_kind': {
            const b1 = makeBuchung(
              account,
              konten.verbindlichkeitenLoehne,
              li.amount,
              `${li.code} ${li.name} (Sachbezug)`,
              'lohnart'
            );
            if (b1) buchungen.push(b1);
            const b2 = makeBuchung(
              konten.verbindlichkeitenLoehne,
              account,
              li.amount,
              `${li.code} ${li.name} (Netto-Abzug)`,
              'lohnart'
            );
            if (b2) buchungen.push(b2);
            break;
          }
          case 'net_deduction': {
            const b = makeBuchung(
              konten.verbindlichkeitenLoehne,
              account,
              li.amount,
              `${li.code} ${li.name}`,
              'lohnart'
            );
            if (b) buchungen.push(b);
            break;
          }
        }
      }

      // Pauschalsteuer — separate Buchung an Finanzamt
      if (li.pauschalTaxAmount && li.pauschalTaxAmount > 0) {
        const pBuchung = makeBuchung(
          account,
          konten.lohnsteuerAbfuehrung,
          li.pauschalTaxAmount,
          `Pausch.LSt ${li.pauschalTaxRate ?? ''}% ${li.code}`.trim(),
          'pauschalsteuer'
        );
        if (pBuchung) buchungen.push(pBuchung);
      }
    }
  }

  return buchungen;
}

/** Fallback-Konto, falls Lohnart kein eigenes SKR03/04-Konto hinterlegt hat. */
function pickWageTypeFallbackAccount(li: WageTypeLineItem, kontenrahmen: Kontenrahmen): string {
  const k = getKonten(kontenrahmen);
  switch (li.category) {
    case 'sachbezug':
      return k.sachbezuege;
    case 'vwl':
      return k.vermoegenswirksameLeistungen;
    case 'pauschalsteuer':
    case 'zuschuss':
      return k.sachbezuege;
    case 'pfaendung':
    case 'abzug':
      return k.verbindlichkeitenLoehne;
    case 'bezug':
    default:
      return k.loehneGehalt;
  }
}

// ─── Journal-Generator ──────────────────────────────────────

/**
 * Generiert ein vollständiges Fibu-Journal für eine Abrechnungsperiode.
 */
export function generateFibuJournal(
  entries: PayrollEntry[],
  kontenrahmen: Kontenrahmen,
  month: number,
  year: number
): FibuJournal {
  const periode = `${String(month).padStart(2, '0')}/${year}`;
  let lfdNr = 1;
  const alleBuchungen: FibuBuchung[] = [];

  for (const entry of entries) {
    const buchungen = generateBuchungenForEntry(entry, kontenrahmen, periode, lfdNr);
    alleBuchungen.push(...buchungen);
    lfdNr += buchungen.length;
  }

  const sollGesamt = roundCurrency(
    alleBuchungen.reduce((sum, b) => sum + b.betrag, 0)
  );
  // In doppelter Buchführung: Soll = Haben (gleicher Betrag, verschiedene Konten)
  const habenGesamt = sollGesamt;

  return {
    periode,
    kontenrahmen,
    buchungen: alleBuchungen,
    summen: {
      sollGesamt,
      habenGesamt,
      differenz: roundCurrency(sollGesamt - habenGesamt),
      anzahlBuchungen: alleBuchungen.length,
    },
    erstelltAm: new Date().toISOString(),
  };
}

// ─── Konten-Saldenliste ─────────────────────────────────────

export interface KontoSaldo {
  konto: string;
  name: string;
  soll: number;
  haben: number;
  saldo: number;
}

/**
 * Erstellt eine Saldenliste (Summen pro Konto) aus Buchungen.
 */
export function generateSaldenliste(buchungen: FibuBuchung[]): KontoSaldo[] {
  const kontoMap = new Map<string, { name: string; soll: number; haben: number }>();

  for (const b of buchungen) {
    // Soll-Seite
    if (!kontoMap.has(b.sollKonto)) {
      kontoMap.set(b.sollKonto, { name: b.sollKontoName, soll: 0, haben: 0 });
    }
    kontoMap.get(b.sollKonto)!.soll += b.betrag;

    // Haben-Seite
    if (!kontoMap.has(b.habenKonto)) {
      kontoMap.set(b.habenKonto, { name: b.habenKontoName, soll: 0, haben: 0 });
    }
    kontoMap.get(b.habenKonto)!.haben += b.betrag;
  }

  return Array.from(kontoMap.entries())
    .map(([konto, data]) => ({
      konto,
      name: data.name,
      soll: roundCurrency(data.soll),
      haben: roundCurrency(data.haben),
      saldo: roundCurrency(data.soll - data.haben),
    }))
    .sort((a, b) => a.konto.localeCompare(b.konto));
}
