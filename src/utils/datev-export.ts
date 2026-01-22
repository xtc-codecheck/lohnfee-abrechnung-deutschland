/**
 * DATEV-Export Utilities
 * 
 * Implementiert den Export von Lohnabrechnungsdaten im DATEV-ASCII-Format
 * mit Unterstützung für SKR03 und SKR04 Kontenrahmen.
 * 
 * Basiert auf DATEV-Format Version 7.0 für Buchungsstapel
 */

import { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import { Employee } from '@/types/employee';
import { format } from 'date-fns';

// ============= Kontenrahmen Definitionen =============

export type Kontenrahmen = 'SKR03' | 'SKR04';

/**
 * SKR03 Kontenrahmen - Prozessgliederungsprinzip
 * Häufig verwendet von kleineren und mittleren Unternehmen
 */
export const SKR03_KONTEN = {
  // Klasse 4: Personalaufwand
  loehneGehalt: '4100',              // Löhne und Gehälter
  gehaltGeschaeftsfuehrung: '4110',  // Geschäftsführergehälter
  aushilfsloehne: '4120',            // Löhne für Aushilfen
  ueberstunden: '4125',              // Überstundenzuschläge
  praemien: '4130',                  // Prämien und Gratifikationen
  urlaubsgeld: '4140',               // Urlaubsgeld
  weihnachtsgeld: '4145',            // Weihnachtsgeld
  
  // Sozialversicherung Arbeitgeber
  svAnteilAg: '4130',                // Gesetzliche Sozialaufwendungen
  krankenversicherungAg: '4138',     // Arbeitgeberanteil KV
  rentenversicherungAg: '4139',      // Arbeitgeberanteil RV
  arbeitslosenversicherungAg: '4141',// Arbeitgeberanteil ALV
  pflegeversicherungAg: '4142',      // Arbeitgeberanteil PV
  berufsgenossenschaft: '4150',      // BG-Beiträge
  sokaBau: '4155',                   // SOKA-BAU
  
  // Sonstige Personalkosten
  vermoegenswirksameLeistungen: '4170', // VL
  betrieblicheAltersvorsorge: '4165',   // bAV Arbeitgeberanteil
  sachbezuege: '4945',                  // Sachbezüge
  
  // Verbindlichkeiten
  verbindlichkeitenLoehne: '1740',      // Verb. aus Lohn/Gehalt
  verbindlichkeitenFinanzamt: '1741',   // Verb. an Finanzamt (Lohnsteuer)
  verbindlichkeitenSv: '1742',          // Verb. an SV-Träger
  verbindlichkeitenKrankenkasse: '1743',// Verb. an Krankenkassen
  
  // Steuern (Aufwand)
  lohnsteuerAbfuehrung: '1741',         // Lohnsteuerabführung
  kirchensteuerAbfuehrung: '1741',      // Kirchensteuerabführung
  solidaritaetszuschlag: '1741',        // Solidaritätszuschlag
  
  // Bank
  bank: '1200',                         // Bank
} as const;

/**
 * SKR04 Kontenrahmen - Abschlussgliederungsprinzip
 * Orientiert sich an der Bilanzgliederung
 */
export const SKR04_KONTEN = {
  // Klasse 6: Personalaufwand
  loehneGehalt: '6000',              // Löhne und Gehälter
  gehaltGeschaeftsfuehrung: '6010',  // Geschäftsführergehälter
  aushilfsloehne: '6020',            // Löhne für Aushilfen
  ueberstunden: '6025',              // Überstundenzuschläge
  praemien: '6030',                  // Prämien und Gratifikationen
  urlaubsgeld: '6040',               // Urlaubsgeld
  weihnachtsgeld: '6045',            // Weihnachtsgeld
  
  // Sozialversicherung Arbeitgeber
  svAnteilAg: '6110',                // Gesetzliche Sozialaufwendungen
  krankenversicherungAg: '6120',     // Arbeitgeberanteil KV
  rentenversicherungAg: '6130',      // Arbeitgeberanteil RV
  arbeitslosenversicherungAg: '6140',// Arbeitgeberanteil ALV
  pflegeversicherungAg: '6150',      // Arbeitgeberanteil PV
  berufsgenossenschaft: '6160',      // BG-Beiträge
  sokaBau: '6165',                   // SOKA-BAU
  
  // Sonstige Personalkosten
  vermoegenswirksameLeistungen: '6200', // VL
  betrieblicheAltersvorsorge: '6210',   // bAV Arbeitgeberanteil
  sachbezuege: '6800',                  // Sachbezüge
  
  // Verbindlichkeiten
  verbindlichkeitenLoehne: '3720',      // Verb. aus Lohn/Gehalt
  verbindlichkeitenFinanzamt: '3730',   // Verb. an Finanzamt
  verbindlichkeitenSv: '3740',          // Verb. an SV-Träger
  verbindlichkeitenKrankenkasse: '3741',// Verb. an Krankenkassen
  
  // Steuern (Aufwand)
  lohnsteuerAbfuehrung: '3730',         // Lohnsteuerabführung
  kirchensteuerAbfuehrung: '3730',      // Kirchensteuerabführung
  solidaritaetszuschlag: '3730',        // Solidaritätszuschlag
  
  // Bank
  bank: '1800',                         // Bank
} as const;

export type KontenrahmenKonten = typeof SKR03_KONTEN | typeof SKR04_KONTEN;

// ============= DATEV Header Format =============

export interface DatevHeader {
  formatkennung: 'EXTF';         // Externes Format
  versionsnummer: number;        // Format-Version (700 = 7.0)
  datenkategorie: number;        // 21 = Buchungsstapel
  formatname: string;            // z.B. "Buchungsstapel"
  formatversion: number;         // Format-Unterversion
  erzeugtAm: string;            // YYYYMMDDHHMMSS
  importiert: string;           // Leer bei Export
  herkunft: string;             // RE = Rechnungswesen
  exportiertVon: string;        // z.B. "LohnPro"
  importiertVon: string;        // Leer
  beraterNr: string;            // 7-stellig
  mandantenNr: string;          // 5-stellig
  wirtschaftsjahrBeginn: string;// YYYYMMDD
  sachkontenlaenge: number;     // 4-8
  datumVon: string;             // YYYYMMDD
  datumBis: string;             // YYYYMMDD
  bezeichnung: string;          // Stapelbezeichnung
  diktatKuerzel: string;        // Optional
  buchungstyp: number;          // 1 = Fibu, 2 = Jahresabschluss
  rechnungslegungszweck: number;// 0 = unbekannt
  festschreibung: number;       // 0 = nicht festgeschrieben
  waehrungskennzeichen: string; // EUR
}

// ============= DATEV Buchungssatz =============

export interface DatevBuchung {
  umsatz: number;               // Betrag (positiv = Soll, negativ = Haben)
  sollHaben: 'S' | 'H';        // Soll oder Haben
  waehrung: string;            // EUR
  kurs: string;                // Wechselkurs (leer bei EUR)
  basisUmsatz: string;         // Basisumsatz (leer bei EUR)
  konto: string;               // Kontierungskonto
  gegenKonto: string;          // Gegenkonto
  buSchluessel: string;        // Buchungsschlüssel
  belegDatum: string;          // DDMM
  belegfeld1: string;          // Belegnummer
  belegfeld2: string;          // Belegfeld 2
  skonto: string;              // Skonto
  buchungstext: string;        // Buchungstext (max. 60 Zeichen)
  postensperre: string;        // 0 oder 1
  diverseAdressnummer: string; // KOST1
  diverseAdressart: string;    // Art
  kostenmenge: string;         // Kostenmenge
  kostenstelleNr: string;      // KOST1
  kostentraegerNr: string;     // KOST2
  buWert: string;              // Buchungswert
  euLand: string;              // EU-Land
  euUstId: string;             // EU-USt-ID
  euSteuersatz: string;        // EU-Steuersatz
}

// ============= Export-Konfiguration =============

export interface DatevExportConfig {
  kontenrahmen: Kontenrahmen;
  beraterNr: string;
  mandantenNr: string;
  wirtschaftsjahrBeginn: Date;
  sachkontenlaenge: 4 | 5 | 6 | 7 | 8;
  exportName: string;
}

// ============= Haupt-Export-Funktionen =============

/**
 * Erstellt den DATEV-Header für den Buchungsstapel
 */
export function createDatevHeader(
  config: DatevExportConfig,
  periode: PayrollPeriod
): string[] {
  const now = new Date();
  const header: DatevHeader = {
    formatkennung: 'EXTF',
    versionsnummer: 700,
    datenkategorie: 21,
    formatname: 'Buchungsstapel',
    formatversion: 12,
    erzeugtAm: format(now, 'yyyyMMddHHmmss'),
    importiert: '',
    herkunft: 'RE',
    exportiertVon: 'LohnPro',
    importiertVon: '',
    beraterNr: config.beraterNr.padStart(7, '0'),
    mandantenNr: config.mandantenNr.padStart(5, '0'),
    wirtschaftsjahrBeginn: format(config.wirtschaftsjahrBeginn, 'yyyyMMdd'),
    sachkontenlaenge: config.sachkontenlaenge,
    datumVon: format(periode.startDate, 'yyyyMMdd'),
    datumBis: format(periode.endDate, 'yyyyMMdd'),
    bezeichnung: `Lohnbuchungen ${format(periode.startDate, 'MM/yyyy')}`,
    diktatKuerzel: '',
    buchungstyp: 1,
    rechnungslegungszweck: 0,
    festschreibung: 0,
    waehrungskennzeichen: 'EUR',
  };

  return [
    header.formatkennung,
    header.versionsnummer.toString(),
    header.datenkategorie.toString(),
    header.formatname,
    header.formatversion.toString(),
    header.erzeugtAm,
    header.importiert,
    header.herkunft,
    header.exportiertVon,
    header.importiertVon,
    header.beraterNr,
    header.mandantenNr,
    header.wirtschaftsjahrBeginn,
    header.sachkontenlaenge.toString(),
    header.datumVon,
    header.datumBis,
    header.bezeichnung,
    header.diktatKuerzel,
    header.buchungstyp.toString(),
    header.rechnungslegungszweck.toString(),
    header.festschreibung.toString(),
    header.waehrungskennzeichen,
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
  
  // ========== 1. BRUTTOLOHN BUCHUNG ==========
  // Soll: Löhne und Gehälter | Haben: Verbindlichkeiten Löhne
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
  
  // ========== 2. ÜBERSTUNDEN (wenn vorhanden) ==========
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
  
  // ========== 3. LOHNSTEUER EINBEHALTUNG ==========
  // Soll: Verbindlichkeiten Löhne | Haben: Verbindlichkeiten Finanzamt
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
  
  // ========== 4. SOLIDARITÄTSZUSCHLAG ==========
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
  
  // ========== 5. KIRCHENSTEUER ==========
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
  
  // ========== 6. SOZIALVERSICHERUNG ARBEITNEHMER ==========
  
  // Krankenversicherung AN
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
  
  // Rentenversicherung AN
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
  
  // Arbeitslosenversicherung AN
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
  
  // Pflegeversicherung AN
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
  
  // ========== 7. SOZIALVERSICHERUNG ARBEITGEBER ==========
  
  // Krankenversicherung AG
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
  
  // Rentenversicherung AG
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
  
  // Arbeitslosenversicherung AG
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
  
  // Pflegeversicherung AG
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
  
  // ========== 8. NETTOLOHN AUSZAHLUNG ==========
  // Soll: Verbindlichkeiten Löhne | Haben: Bank
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
  
  // DATEV erwartet Beträge ohne Tausendertrennzeichen und mit Komma als Dezimaltrennzeichen
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
  
  // 1. Header-Zeile
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
  
  // 4. Mit Windows-Zeilenumbruch und ISO-8859-1 Encoding-kompatibel
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
  
  // Summen berechnen
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
  
  // Überweisung Lohnsteuer an Finanzamt
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
  
  // Überweisung SV an Träger (DRV, BA)
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
  
  // Überweisung an Krankenkassen
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
 * Validiert die Export-Konfiguration
 */
export function validateDatevConfig(config: DatevExportConfig): string[] {
  const errors: string[] = [];
  
  if (!config.beraterNr || config.beraterNr.length < 1) {
    errors.push('Beraternummer ist erforderlich');
  }
  
  if (!config.mandantenNr || config.mandantenNr.length < 1) {
    errors.push('Mandantennummer ist erforderlich');
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
