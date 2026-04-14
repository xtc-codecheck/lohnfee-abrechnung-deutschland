/**
 * DATEV-Export Utilities
 * 
 * Implementiert den Export von Lohnabrechnungsdaten im DATEV-ASCII-Format (CSV)
 * gemäß der offiziellen DATEV-Schnittstellenbeschreibung.
 * 
 * Header: 31 Felder, Versionsnummer 700
 * Buchungsstapel: Formatkategorie 21, Formatversion 13
 */

import { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import { Employee } from '@/types/employee';
import { format } from 'date-fns';

// ============= Kontenrahmen Definitionen =============

export type Kontenrahmen = 'SKR03' | 'SKR04';

/**
 * SKR03 Kontenrahmen - Prozessgliederungsprinzip
 */
export const SKR03_KONTEN = {
  loehneGehalt: '4100',
  gehaltGeschaeftsfuehrung: '4110',
  aushilfsloehne: '4120',
  ueberstunden: '4125',
  praemien: '4130',
  urlaubsgeld: '4140',
  weihnachtsgeld: '4145',
  svAnteilAg: '4130',
  krankenversicherungAg: '4138',
  rentenversicherungAg: '4139',
  arbeitslosenversicherungAg: '4141',
  pflegeversicherungAg: '4142',
  berufsgenossenschaft: '4150',
  sokaBau: '4155',
  // Umlagen
  umlageU1: '4143',
  umlageU2: '4144',
  insolvenzgeldumlage: '4146',
  vermoegenswirksameLeistungen: '4170',
  betrieblicheAltersvorsorge: '4165',
  sachbezuege: '4945',
  verbindlichkeitenLoehne: '1740',
  verbindlichkeitenFinanzamt: '1741',
  verbindlichkeitenSv: '1742',
  verbindlichkeitenKrankenkasse: '1743',
  verbindlichkeitenUmlagen: '1744',
  lohnsteuerAbfuehrung: '1741',
  kirchensteuerAbfuehrung: '1741',
  solidaritaetszuschlag: '1741',
  bank: '1200',
} as const;

/**
 * SKR04 Kontenrahmen - Abschlussgliederungsprinzip
 */
export const SKR04_KONTEN = {
  loehneGehalt: '6000',
  gehaltGeschaeftsfuehrung: '6010',
  aushilfsloehne: '6020',
  ueberstunden: '6025',
  praemien: '6030',
  urlaubsgeld: '6040',
  weihnachtsgeld: '6045',
  svAnteilAg: '6110',
  krankenversicherungAg: '6120',
  rentenversicherungAg: '6130',
  arbeitslosenversicherungAg: '6140',
  pflegeversicherungAg: '6150',
  berufsgenossenschaft: '6160',
  sokaBau: '6165',
  // Umlagen
  umlageU1: '6145',
  umlageU2: '6146',
  insolvenzgeldumlage: '6148',
  vermoegenswirksameLeistungen: '6200',
  betrieblicheAltersvorsorge: '6210',
  sachbezuege: '6800',
  verbindlichkeitenLoehne: '3720',
  verbindlichkeitenFinanzamt: '3730',
  verbindlichkeitenSv: '3740',
  verbindlichkeitenKrankenkasse: '3741',
  verbindlichkeitenUmlagen: '3742',
  lohnsteuerAbfuehrung: '3730',
  kirchensteuerAbfuehrung: '3730',
  solidaritaetszuschlag: '3730',
  bank: '1800',
} as const;

export type KontenrahmenKonten = typeof SKR03_KONTEN | typeof SKR04_KONTEN;

// ============= DATEV Header (31 Felder gemäß Spezifikation) =============

export interface DatevHeader {
  formatkennung: 'EXTF' | 'DTVF';  // Feld 1
  versionsnummer: 700;               // Feld 2
  formatkategorie: number;           // Feld 3: 21 = Buchungsstapel
  formatname: string;                // Feld 4
  formatversion: number;             // Feld 5: 13 für Buchungsstapel
  erzeugtAm: string;                // Feld 6: YYYYMMDDHHMMSSFFFXXX
  importiert: '';                    // Feld 7: leer
  herkunft: string;                  // Feld 8: max 2 Zeichen
  exportiertVon: string;            // Feld 9: max 25 Zeichen
  importiertVon: '';                // Feld 10: leer
  beraterNr: number;                // Feld 11: 1001-9999999
  mandantenNr: number;              // Feld 12: 1-99999
  wirtschaftsjahrBeginn: string;    // Feld 13: YYYYMMDD
  sachkontenlaenge: number;          // Feld 14: 4-8
  datumVon: string;                  // Feld 15: YYYYMMDD (nur Bewegungsdaten)
  datumBis: string;                  // Feld 16: YYYYMMDD (nur Bewegungsdaten)
  bezeichnung: string;               // Feld 17: max 30 Zeichen
  diktatKuerzel: string;             // Feld 18: 2 Großbuchstaben
  buchungstyp: 1 | 2;               // Feld 19: 1=FiBu, 2=JA
  rechnungslegungszweck: number;     // Feld 20: 0,30,40,50,64
  festschreibung: 0 | 1;            // Feld 21
  waehrung: string;                  // Feld 22: ISO 4217 z.B. EUR
  // Feld 23: reserviert (leer)
  // Feld 24: Derivatskennzeichen (leer)
  // Feld 25: reserviert (leer)
  // Feld 26: reserviert (leer)
  sachkontenrahmen: string;          // Feld 27: z.B. "03" oder "04"
  branchenloesung: string;           // Feld 28: max 4 Ziffern
  // Feld 29: reserviert (leer)
  // Feld 30: reserviert (leer)
  anwendungsinformation: string;     // Feld 31: max 16 Zeichen
}

// ============= DATEV Buchungssatz =============

export interface DatevBuchung {
  umsatz: number;
  sollHaben: 'S' | 'H';
  waehrung: string;
  kurs: string;
  basisUmsatz: string;
  konto: string;
  gegenKonto: string;
  buSchluessel: string;
  belegDatum: string;
  belegfeld1: string;
  belegfeld2: string;
  skonto: string;
  buchungstext: string;
  postensperre: string;
  diverseAdressnummer: string;
  diverseAdressart: string;
  kostenmenge: string;
  kostenstelleNr: string;
  kostentraegerNr: string;
  buWert: string;
  euLand: string;
  euUstId: string;
  euSteuersatz: string;
}

// ============= Export-Konfiguration =============

export interface DatevExportConfig {
  kontenrahmen: Kontenrahmen;
  beraterNr: string;
  mandantenNr: string;
  wirtschaftsjahrBeginn: Date;
  sachkontenlaenge: 4 | 5 | 6 | 7 | 8;
  exportName: string;
  /** Umlagen-Konfiguration (optional) */
  umlagen?: UmlagenConfig;
}

/**
 * Umlagen-Konfiguration für den DATEV-Export
 * U1: Entgeltfortzahlung, U2: Mutterschaft, Insolvenzgeldumlage
 */
export interface UmlagenConfig {
  /** U1-Umlagesatz in % (z.B. 2.5 für 2,5%) */
  u1Rate?: number;
  /** U2-Umlagesatz in % (z.B. 0.44 für 0,44%) */
  u2Rate?: number;
  /** Insolvenzgeldumlagesatz in % (2025: 0,06%) */
  insolvenzgeldRate?: number;
}

/** Standard-Umlagesätze 2025 */
export const DEFAULT_UMLAGEN_2025: Required<UmlagenConfig> = {
  u1Rate: 2.5,    // Variiert je nach KK und Erstattungssatz
  u2Rate: 0.44,   // Variiert je nach KK
  insolvenzgeldRate: 0.06, // Bundeseinheitlich 2025
} as const;

// ============= Quoting Helpers =============

/** Wraps a string value in double quotes for DATEV CSV */
function q(val: string): string {
  return `"${val}"`;
}

/** Formats a timestamp as DATEV Feld 6: YYYYMMDDHHMMSSfff */
function datevTimestamp(d: Date): string {
  const yyyy = d.getFullYear().toString();
  const MM = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const HH = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  const fff = d.getMilliseconds().toString().padStart(3, '0');
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}${fff}`;
}

// ============= Haupt-Export-Funktionen =============

/**
 * Erstellt den DATEV-Header (31 Felder) gemäß offizieller Spezifikation.
 * Gibt ein Array mit korrekt formatierten und gequoteten Feldern zurück.
 */
export function createDatevHeader(
  config: DatevExportConfig,
  periode: PayrollPeriod
): string[] {
  const now = new Date();
  const skr = config.kontenrahmen === 'SKR03' ? '03' : '04';
  const bezeichnung = `Lohnbuchungen ${format(periode.startDate, 'MM/yyyy')}`.substring(0, 30);
  const anwendungsinfo = format(periode.startDate, 'MM/yyyy');

  // Berater-/Mandantennummer als Zahl (ohne Padding)
  const beraterNr = parseInt(config.beraterNr, 10) || 1001;
  const mandantenNr = parseInt(config.mandantenNr, 10) || 1;

  // 31 Felder in exakter Reihenfolge gemäß DATEV-Spezifikation
  return [
    q('EXTF'),                                          // 1  Kennzeichen
    '700',                                              // 2  Versionsnummer
    '21',                                               // 3  Formatkategorie (Buchungsstapel)
    q('Buchungsstapel'),                                // 4  Formatname
    '13',                                               // 5  Formatversion
    datevTimestamp(now),                                 // 6  Erzeugt am
    '',                                                 // 7  Importiert (leer)
    q('RE'),                                            // 8  Herkunft
    q('LohnPro'),                                       // 9  Exportiert von
    q(''),                                              // 10 Importiert von
    beraterNr.toString(),                               // 11 Beraternummer
    mandantenNr.toString(),                             // 12 Mandantennummer
    format(config.wirtschaftsjahrBeginn, 'yyyyMMdd'),   // 13 WJ-Beginn
    config.sachkontenlaenge.toString(),                  // 14 Sachkontenlänge
    format(periode.startDate, 'yyyyMMdd'),               // 15 Datum von
    format(periode.endDate, 'yyyyMMdd'),                 // 16 Datum bis
    q(bezeichnung),                                     // 17 Bezeichnung
    q(''),                                              // 18 Diktatkürzel
    '1',                                                // 19 Buchungstyp (FiBu)
    '0',                                                // 20 Rechnungslegungszweck
    '0',                                                // 21 Festschreibung
    q('EUR'),                                           // 22 WKZ
    '',                                                 // 23 Reserviert
    q(''),                                              // 24 Derivatskennzeichen
    '',                                                 // 25 Reserviert
    '',                                                 // 26 Reserviert
    q(skr),                                             // 27 Sachkontenrahmen
    '',                                                 // 28 ID Branchenlösung
    '',                                                 // 29 Reserviert
    q(''),                                              // 30 Reserviert
    q(anwendungsinfo),                                  // 31 Anwendungsinformation
  ];
}

/**
 * Erstellt die Spaltenüberschriften für die Buchungszeilen
 */
export function createDatevColumnHeaders(): string[] {
  return [
    'Umsatz (ohne Soll/Haben-Kz)',
    'Soll/Haben-Kennzeichen',
    'WKZ Umsatz',
    'Kurs',
    'Basis-Umsatz',
    'WKZ Basis-Umsatz',
    'Konto',
    'Gegenkonto (ohne BU-Schlüssel)',
    'BU-Schlüssel',
    'Belegdatum',
    'Belegfeld 1',
    'Belegfeld 2',
    'Skonto',
    'Buchungstext',
    'Postensperre',
    'Diverse Adressnummer',
    'Geschäftspartnerbank',
    'Sachverhalt',
    'Zinssperre',
    'Beleglink',
    'Beleginfo - Art 1',
    'Beleginfo - Inhalt 1',
    'KOST1 - Kostenstelle',
    'KOST2 - Kostenträger',
    'KOST-Menge',
    'EU-Land u. UStID',
    'EU-Steuersatz',
    'Abw. Versteuerungsart',
  ];
}

/**
 * Generiert alle Buchungssätze für eine Lohnabrechnung
 */
export function generatePayrollBookings(
  entry: PayrollEntry,
  config: DatevExportConfig,
  periode: PayrollPeriod
): string[][] {
  const konten = config.kontenrahmen === 'SKR03' ? SKR03_KONTEN : SKR04_KONTEN;
  const belegDatum = format(periode.endDate, 'ddMM');
  const belegNr = `LG${format(periode.startDate, 'yyMM')}${entry.employeeId.slice(-4)}`;
  const employeeName = `${entry.employee.personalData.lastName}, ${entry.employee.personalData.firstName}`;
  
  const buchungen: string[][] = [];
  
  // 1. BRUTTOLOHN: Soll Löhne | Haben Verb. Löhne
  buchungen.push(createBookingLine({
    umsatz: entry.salaryCalculation.grossSalary,
    sollHaben: 'S',
    konto: konten.loehneGehalt,
    gegenKonto: konten.verbindlichkeitenLoehne,
    belegDatum,
    belegNr,
    buchungstext: `Gehalt ${employeeName}`,
    kostenstelle: entry.employee.employmentData.department,
  }));
  
  // 2. ÜBERSTUNDEN
  if (entry.additions.overtimePay > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.additions.overtimePay,
      sollHaben: 'S',
      konto: konten.ueberstunden,
      gegenKonto: konten.verbindlichkeitenLoehne,
      belegDatum,
      belegNr,
      buchungstext: `Überstunden ${employeeName}`,
      kostenstelle: entry.employee.employmentData.department,
    }));
  }
  
  // 3. LOHNSTEUER: Soll Verb. Löhne | Haben Verb. Finanzamt
  if (entry.salaryCalculation.taxes.incomeTax > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.taxes.incomeTax,
      sollHaben: 'S',
      konto: konten.verbindlichkeitenLoehne,
      gegenKonto: konten.lohnsteuerAbfuehrung,
      belegDatum,
      belegNr,
      buchungstext: `LSt ${employeeName}`,
    }));
  }
  
  // 4. SOLIDARITÄTSZUSCHLAG
  if (entry.salaryCalculation.taxes.solidarityTax > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.taxes.solidarityTax,
      sollHaben: 'S',
      konto: konten.verbindlichkeitenLoehne,
      gegenKonto: konten.solidaritaetszuschlag,
      belegDatum,
      belegNr,
      buchungstext: `SolZ ${employeeName}`,
    }));
  }
  
  // 5. KIRCHENSTEUER
  if (entry.salaryCalculation.taxes.churchTax > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.taxes.churchTax,
      sollHaben: 'S',
      konto: konten.verbindlichkeitenLoehne,
      gegenKonto: konten.kirchensteuerAbfuehrung,
      belegDatum,
      belegNr,
      buchungstext: `KiSt ${employeeName}`,
    }));
  }
  
  // 6. SV ARBEITNEHMER
  if (entry.salaryCalculation.socialSecurityContributions.healthInsurance.employee > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.socialSecurityContributions.healthInsurance.employee,
      sollHaben: 'S',
      konto: konten.verbindlichkeitenLoehne,
      gegenKonto: konten.verbindlichkeitenKrankenkasse,
      belegDatum,
      belegNr,
      buchungstext: `KV-AN ${employeeName}`,
    }));
  }
  
  if (entry.salaryCalculation.socialSecurityContributions.pensionInsurance.employee > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.socialSecurityContributions.pensionInsurance.employee,
      sollHaben: 'S',
      konto: konten.verbindlichkeitenLoehne,
      gegenKonto: konten.verbindlichkeitenSv,
      belegDatum,
      belegNr,
      buchungstext: `RV-AN ${employeeName}`,
    }));
  }
  
  if (entry.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employee > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employee,
      sollHaben: 'S',
      konto: konten.verbindlichkeitenLoehne,
      gegenKonto: konten.verbindlichkeitenSv,
      belegDatum,
      belegNr,
      buchungstext: `ALV-AN ${employeeName}`,
    }));
  }
  
  if (entry.salaryCalculation.socialSecurityContributions.careInsurance.employee > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.socialSecurityContributions.careInsurance.employee,
      sollHaben: 'S',
      konto: konten.verbindlichkeitenLoehne,
      gegenKonto: konten.verbindlichkeitenKrankenkasse,
      belegDatum,
      belegNr,
      buchungstext: `PV-AN ${employeeName}`,
    }));
  }
  
  // 7. SV ARBEITGEBER
  if (entry.salaryCalculation.socialSecurityContributions.healthInsurance.employer > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.socialSecurityContributions.healthInsurance.employer,
      sollHaben: 'S',
      konto: konten.krankenversicherungAg,
      gegenKonto: konten.verbindlichkeitenKrankenkasse,
      belegDatum,
      belegNr,
      buchungstext: `KV-AG ${employeeName}`,
      kostenstelle: entry.employee.employmentData.department,
    }));
  }
  
  if (entry.salaryCalculation.socialSecurityContributions.pensionInsurance.employer > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.socialSecurityContributions.pensionInsurance.employer,
      sollHaben: 'S',
      konto: konten.rentenversicherungAg,
      gegenKonto: konten.verbindlichkeitenSv,
      belegDatum,
      belegNr,
      buchungstext: `RV-AG ${employeeName}`,
      kostenstelle: entry.employee.employmentData.department,
    }));
  }
  
  if (entry.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employer > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employer,
      sollHaben: 'S',
      konto: konten.arbeitslosenversicherungAg,
      gegenKonto: konten.verbindlichkeitenSv,
      belegDatum,
      belegNr,
      buchungstext: `ALV-AG ${employeeName}`,
      kostenstelle: entry.employee.employmentData.department,
    }));
  }
  
  if (entry.salaryCalculation.socialSecurityContributions.careInsurance.employer > 0) {
    buchungen.push(createBookingLine({
      umsatz: entry.salaryCalculation.socialSecurityContributions.careInsurance.employer,
      sollHaben: 'S',
      konto: konten.pflegeversicherungAg,
      gegenKonto: konten.verbindlichkeitenKrankenkasse,
      belegDatum,
      belegNr,
      buchungstext: `PV-AG ${employeeName}`,
      kostenstelle: entry.employee.employmentData.department,
    }));
  }
  
  // 8. NETTOLOHN: Soll Verb. Löhne | Haben Bank
  buchungen.push(createBookingLine({
    umsatz: entry.finalNetSalary,
    sollHaben: 'S',
    konto: konten.verbindlichkeitenLoehne,
    gegenKonto: konten.bank,
    belegDatum,
    belegNr,
    buchungstext: `Netto ${employeeName}`,
  }));
  
  return buchungen;
}

/**
 * Hilfsfunktion zum Erstellen einer Buchungszeile
 */
function createBookingLine(params: {
  umsatz: number;
  sollHaben: 'S' | 'H';
  konto: string;
  gegenKonto: string;
  belegDatum: string;
  belegNr: string;
  buchungstext: string;
  kostenstelle?: string;
}): string[] {
  const {
    umsatz,
    sollHaben,
    konto,
    gegenKonto,
    belegDatum,
    belegNr,
    buchungstext,
    kostenstelle = '',
  } = params;
  
  // DATEV: Beträge mit Komma als Dezimaltrennzeichen, keine Tausendertrenner
  const formattedUmsatz = umsatz.toFixed(2).replace('.', ',');
  
  return [
    formattedUmsatz,          // Umsatz
    sollHaben,                // Soll/Haben
    'EUR',                    // WKZ
    '',                       // Kurs
    '',                       // Basis-Umsatz
    '',                       // WKZ Basis
    konto,                    // Konto
    gegenKonto,              // Gegenkonto
    '',                       // BU-Schlüssel
    belegDatum,              // Belegdatum
    belegNr,                 // Belegfeld 1
    '',                       // Belegfeld 2
    '',                       // Skonto
    buchungstext.substring(0, 60), // Buchungstext (max 60 Zeichen)
    '',                       // Postensperre
    '',                       // Diverse Adressnummer
    '',                       // Geschäftspartnerbank
    '',                       // Sachverhalt
    '',                       // Zinssperre
    '',                       // Beleglink
    '',                       // Beleginfo Art 1
    '',                       // Beleginfo Inhalt 1
    kostenstelle,            // KOST1
    '',                       // KOST2
    '',                       // KOST-Menge
    '',                       // EU-Land
    '',                       // EU-Steuersatz
    '',                       // Abw. Versteuerungsart
  ];
}

/**
 * Generiert den kompletten DATEV-Export als CSV-String
 */
export function generateDatevExport(
  entries: PayrollEntry[],
  periode: PayrollPeriod,
  config: DatevExportConfig
): string {
  const lines: string[] = [];
  
  // 1. Header-Zeile (31 Felder, semicolon-getrennt)
  const header = createDatevHeader(config, periode);
  lines.push(header.join(';'));
  
  // 2. Spaltenüberschriften
  const columnHeaders = createDatevColumnHeaders();
  lines.push(columnHeaders.join(';'));
  
  // 3. Buchungssätze für jeden Mitarbeiter
  for (const entry of entries) {
    const bookings = generatePayrollBookings(entry, config, periode);
    for (const booking of bookings) {
      lines.push(booking.join(';'));
    }
  }
  
  // 4. Windows-Zeilenumbruch (DATEV-Standard)
  return lines.join('\r\n');
}

/**
 * Generiert Summen-Buchungssätze für die Sammelüberweisung
 */
export function generateSummaryBookings(
  entries: PayrollEntry[],
  config: DatevExportConfig,
  periode: PayrollPeriod
): string[][] {
  const konten = config.kontenrahmen === 'SKR03' ? SKR03_KONTEN : SKR04_KONTEN;
  const belegDatum = format(periode.endDate, 'ddMM');
  const belegNr = `LG${format(periode.startDate, 'yyMM')}SUM`;
  
  const totals = entries.reduce(
    (acc, entry) => ({
      lohnsteuer: acc.lohnsteuer + entry.salaryCalculation.taxes.incomeTax,
      soli: acc.soli + entry.salaryCalculation.taxes.solidarityTax,
      kirchensteuer: acc.kirchensteuer + entry.salaryCalculation.taxes.churchTax,
      svGesamt: acc.svGesamt + 
        entry.salaryCalculation.socialSecurityContributions.total.employee +
        entry.salaryCalculation.socialSecurityContributions.total.employer,
      kvGesamt: acc.kvGesamt + 
        entry.salaryCalculation.socialSecurityContributions.healthInsurance.employee +
        entry.salaryCalculation.socialSecurityContributions.healthInsurance.employer +
        entry.salaryCalculation.socialSecurityContributions.careInsurance.employee +
        entry.salaryCalculation.socialSecurityContributions.careInsurance.employer,
    }),
    { lohnsteuer: 0, soli: 0, kirchensteuer: 0, svGesamt: 0, kvGesamt: 0 }
  );
  
  const buchungen: string[][] = [];
  const monat = format(periode.startDate, 'MM/yyyy');
  
  if (totals.lohnsteuer + totals.soli + totals.kirchensteuer > 0) {
    buchungen.push(createBookingLine({
      umsatz: totals.lohnsteuer + totals.soli + totals.kirchensteuer,
      sollHaben: 'S',
      konto: konten.lohnsteuerAbfuehrung,
      gegenKonto: konten.bank,
      belegDatum,
      belegNr,
      buchungstext: `Lohnsteuer ${monat} an Finanzamt`,
    }));
  }
  
  const rvAlvGesamt = entries.reduce(
    (sum, e) => sum + 
      e.salaryCalculation.socialSecurityContributions.pensionInsurance.total +
      e.salaryCalculation.socialSecurityContributions.unemploymentInsurance.total,
    0
  );
  
  if (rvAlvGesamt > 0) {
    buchungen.push(createBookingLine({
      umsatz: rvAlvGesamt,
      sollHaben: 'S',
      konto: konten.verbindlichkeitenSv,
      gegenKonto: konten.bank,
      belegDatum,
      belegNr,
      buchungstext: `RV+ALV ${monat} an Sozialversicherung`,
    }));
  }
  
  if (totals.kvGesamt > 0) {
    buchungen.push(createBookingLine({
      umsatz: totals.kvGesamt,
      sollHaben: 'S',
      konto: konten.verbindlichkeitenKrankenkasse,
      gegenKonto: konten.bank,
      belegDatum,
      belegNr,
      buchungstext: `KV+PV ${monat} an Krankenkassen`,
    }));
  }
  
  return buchungen;
}

/**
 * Validiert die Export-Konfiguration gemäß DATEV-Spezifikation
 */
export function validateDatevConfig(config: DatevExportConfig): string[] {
  const errors: string[] = [];
  
  const beraterNr = parseInt(config.beraterNr, 10);
  if (isNaN(beraterNr) || beraterNr < 1001 || beraterNr > 9999999) {
    errors.push('Beraternummer muss zwischen 1001 und 9999999 liegen');
  }
  
  const mandantenNr = parseInt(config.mandantenNr, 10);
  if (isNaN(mandantenNr) || mandantenNr < 1 || mandantenNr > 99999) {
    errors.push('Mandantennummer muss zwischen 1 und 99999 liegen');
  }
  
  if (config.sachkontenlaenge < 4 || config.sachkontenlaenge > 8) {
    errors.push('Sachkontenlänge muss zwischen 4 und 8 liegen');
  }
  
  return errors;
}

/**
 * Erstellt Default-Konfiguration für DATEV-Export
 */
export function getDefaultDatevConfig(): DatevExportConfig {
  return {
    kontenrahmen: 'SKR03',
    beraterNr: '1234567',
    mandantenNr: '12345',
    wirtschaftsjahrBeginn: new Date(new Date().getFullYear(), 0, 1),
    sachkontenlaenge: 4,
    exportName: 'Lohnbuchungen',
  };
}
