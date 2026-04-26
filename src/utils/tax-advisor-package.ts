/**
 * Steuerberater-Paket Generator
 *
 * Erstellt ein ZIP-Bundle mit allen Unterlagen, die ein Steuerberater
 * für die monatliche Lohnabrechnung benötigt:
 *   1. DATEV EXTF CSV (SKR03 oder SKR04)
 *   2. FiBu-Journal CSV (Soll/Haben)
 *   3. Lohnarten-Excel (Aufschlüsselung pro Mitarbeiter)
 *   4. Begleit-PDF (Deckblatt mit Summen, Übergabeprotokoll)
 *   5. README.txt (Inhaltsverzeichnis)
 */

import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  generateDatevExport,
  getDefaultDatevConfig,
  type DatevExportConfig,
  type Kontenrahmen,
} from './datev-export';
import { generateFibuJournal, generateSaldenliste } from './fibu-booking';
import type { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import type { WageTypeLineItem } from './wage-types-integration';

export interface TaxAdvisorPackageOptions {
  kontenrahmen: Kontenrahmen;
  datevConfig?: Partial<DatevExportConfig>;
  companyName?: string;
  companyAddress?: string;
  taxNumber?: string;
  betriebsnummer?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}

const EFFECT_LABEL_DE: Record<WageTypeLineItem['effect'], string> = {
  gross_taxable: 'Brutto (st./sv.-pflichtig)',
  net_taxfree: 'Netto (st.-/sv.-frei)',
  in_kind: 'Sachbezug',
  net_deduction: 'Netto-Abzug',
  pauschal: 'Pauschalversteuert',
};

const fmtEUR = (v: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

const fmtNum = (v: number): string =>
  v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Hauptfunktion: Erzeugt das vollständige Steuerberater-Paket als Blob (ZIP).
 */
export async function generateTaxAdvisorPackage(
  entries: PayrollEntry[],
  periode: PayrollPeriod,
  options: TaxAdvisorPackageOptions,
): Promise<{ blob: Blob; fileName: string }> {
  const zip = new JSZip();

  const datevConfig: DatevExportConfig = {
    ...getDefaultDatevConfig(),
    kontenrahmen: options.kontenrahmen,
    ...(options.datevConfig ?? {}),
  };

  const monthLabel = format(periode.startDate, 'yyyy-MM');
  const monthLabelHuman = format(periode.startDate, 'MMMM yyyy', { locale: de });

  // 1) DATEV CSV
  const datevCsv = generateDatevExport(entries, periode, datevConfig);
  const datevName = `01_DATEV/EXTF_Lohnbuchungen_${datevConfig.kontenrahmen}_${monthLabel}.csv`;
  zip.file(datevName, '\uFEFF' + datevCsv);

  // 2) FiBu-Journal CSV + Saldenliste CSV
  const journal = generateFibuJournal(entries, datevConfig.kontenrahmen, periode.month, periode.year);
  const fibuCsv = buildFibuJournalCsv(journal.buchungen);
  zip.file(`02_FiBu/Buchungsjournal_${datevConfig.kontenrahmen}_${monthLabel}.csv`, '\uFEFF' + fibuCsv);

  const saldenliste = generateSaldenliste(journal.buchungen);
  const saldenCsv = buildSaldenlisteCsv(saldenliste);
  zip.file(`02_FiBu/Saldenliste_${datevConfig.kontenrahmen}_${monthLabel}.csv`, '\uFEFF' + saldenCsv);

  // 3) Lohnarten-Excel (mehrere Sheets)
  const xlsxBuffer = buildWageTypesWorkbook(entries, periode);
  zip.file(`03_Lohnarten/Lohnarten_${monthLabel}.xlsx`, xlsxBuffer);

  // 4) Begleit-PDF
  const pdfBytes = buildCoverPdf(entries, periode, journal, options);
  zip.file(`00_Begleitschreiben_${monthLabel}.pdf`, pdfBytes);

  // 5) Import-Anleitung PDF (DATEV ENTF/EXTF, FiBu-Spalten, Importbereiche)
  const importGuideBytes = buildImportGuidePdf(periode, datevConfig, monthLabel);
  zip.file(`00_So-importieren-Sie-die-Daten_${monthLabel}.pdf`, importGuideBytes);

  // 6) README
  const readme = buildReadme(entries, periode, datevConfig, options, monthLabelHuman);
  zip.file('README.txt', readme);

  const blob = await zip.generateAsync({ type: 'blob' });
  const fileName = `Steuerberater-Paket_${(options.companyName || 'Mandant').replace(/[^\w-]+/g, '_')}_${monthLabel}.zip`;
  return { blob, fileName };
}

// ─────────────────────────────────────────────────────────────────────────────
// FiBu CSV
// ─────────────────────────────────────────────────────────────────────────────

function buildFibuJournalCsv(buchungen: ReturnType<typeof generateFibuJournal>['buchungen']): string {
  const header = [
    'Lfd.Nr',
    'Datum',
    'Periode',
    'Belegnummer',
    'Soll-Konto',
    'Soll-Konto Bezeichnung',
    'Haben-Konto',
    'Haben-Konto Bezeichnung',
    'Betrag (EUR)',
    'Buchungstext',
    'Mitarbeiter',
    'Kategorie',
  ].join(';');

  const lines = buchungen.map((b) =>
    [
      b.lfdNr,
      b.datum,
      csvEsc(b.referenz),
      csvEsc(b.belegNr),
      b.sollKonto,
      csvEsc(b.sollKontoName),
      b.habenKonto,
      csvEsc(b.habenKontoName),
      fmtNum(b.betrag),
      csvEsc(b.text),
      csvEsc(b.employeeName ?? ''),
      b.kategorie,
    ].join(';'),
  );

  return [header, ...lines].join('\r\n');
}

function buildSaldenlisteCsv(salden: ReturnType<typeof generateSaldenliste>): string {
  const header = ['Konto', 'Bezeichnung', 'Soll (EUR)', 'Haben (EUR)', 'Saldo (EUR)'].join(';');
  const lines = salden.map((s) =>
    [s.konto, csvEsc(s.name), fmtNum(s.soll), fmtNum(s.haben), fmtNum(s.saldo)].join(';'),
  );
  return [header, ...lines].join('\r\n');
}

function csvEsc(v: string): string {
  if (v == null) return '';
  const needsQuote = /[;"\r\n]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lohnarten-Excel
// ─────────────────────────────────────────────────────────────────────────────

function buildWageTypesWorkbook(entries: PayrollEntry[], periode: PayrollPeriod): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Zusammenfassung pro Mitarbeiter
  const summaryRows = entries.map((e) => {
    const items = e.wageTypeLineItems ?? [];
    const pauschalSum = items.reduce((s, li) => s + (li.pauschalTaxAmount ?? 0), 0);
    return {
      Mitarbeiter: `${e.employee.personalData.lastName}, ${e.employee.personalData.firstName}`,
      'Mitarbeiter-ID': e.employee.id,
      Brutto: round2(e.salaryCalculation.grossSalary),
      Lohnsteuer: round2(e.salaryCalculation.taxes.incomeTax),
      Soli: round2(e.salaryCalculation.taxes.solidarityTax),
      Kirchensteuer: round2(e.salaryCalculation.taxes.churchTax),
      'SV-AN': round2(e.salaryCalculation.socialSecurityContributions.total.employee),
      'SV-AG': round2(e.salaryCalculation.socialSecurityContributions.total.employer),
      Netto: round2(e.finalNetSalary),
      'Anzahl Lohnarten': items.length,
      'Pauschalsteuer (EUR)': round2(pauschalSum),
    };
  });
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Zusammenfassung');

  // Sheet 2: Lohnarten-Aufschlüsselung pro Mitarbeiter
  const detailRows: Array<Record<string, string | number>> = [];
  for (const entry of entries) {
    const items = entry.wageTypeLineItems ?? [];
    for (const li of items) {
      detailRows.push({
        Periode: `${String(periode.month).padStart(2, '0')}/${periode.year}`,
        Mitarbeiter: `${entry.employee.personalData.lastName}, ${entry.employee.personalData.firstName}`,
        'Mitarbeiter-ID': entry.employee.id,
        'Lohnart-Code': li.code,
        Bezeichnung: li.name,
        Kategorie: li.category,
        Effekt: EFFECT_LABEL_DE[li.effect] ?? li.effect,
        'Betrag (EUR)': round2(li.amount),
        'Pausch.LSt-Satz (%)': li.pauschalTaxRate ?? '',
        'Pausch.LSt (EUR)': round2(li.pauschalTaxAmount ?? 0),
        Konto: li.account ?? '',
      });
    }
  }
  if (detailRows.length === 0) {
    detailRows.push({ Hinweis: 'Keine Lohnarten-Daten vorhanden' });
  }
  const detailSheet = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Lohnarten');

  // Sheet 3: Lohnarten-Summen pro Code
  const sumByCode = new Map<string, { name: string; effect: string; sum: number; count: number }>();
  for (const entry of entries) {
    for (const li of entry.wageTypeLineItems ?? []) {
      const key = li.code;
      const existing = sumByCode.get(key);
      if (existing) {
        existing.sum += li.amount;
        existing.count += 1;
      } else {
        sumByCode.set(key, {
          name: li.name,
          effect: EFFECT_LABEL_DE[li.effect] ?? li.effect,
          sum: li.amount,
          count: 1,
        });
      }
    }
  }
  const sumRows = Array.from(sumByCode.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, v]) => ({
      'Lohnart-Code': code,
      Bezeichnung: v.name,
      Effekt: v.effect,
      'Anzahl Buchungen': v.count,
      'Summe (EUR)': round2(v.sum),
    }));
  if (sumRows.length === 0) {
    sumRows.push({ 'Lohnart-Code': '', Bezeichnung: 'Keine Daten', Effekt: '', 'Anzahl Buchungen': 0, 'Summe (EUR)': 0 });
  }
  const sumSheet = XLSX.utils.json_to_sheet(sumRows);
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Summen je Lohnart');

  const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return ab;
}

// ─────────────────────────────────────────────────────────────────────────────
// Begleit-PDF
// ─────────────────────────────────────────────────────────────────────────────

function buildCoverPdf(
  entries: PayrollEntry[],
  periode: PayrollPeriod,
  journal: ReturnType<typeof generateFibuJournal>,
  options: TaxAdvisorPackageOptions,
): ArrayBuffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  const monthLabel = format(periode.startDate, 'MMMM yyyy', { locale: de });

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Lohndaten – Übergabe an Steuerberater', margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Abrechnungsperiode: ${monthLabel}`, margin, y);
  y += 5;
  doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}`, margin, y);
  y += 10;

  // Mandant
  doc.setFont('helvetica', 'bold');
  doc.text('Mandant', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  if (options.companyName) {
    doc.text(options.companyName, margin, y);
    y += 5;
  }
  if (options.companyAddress) {
    doc.text(options.companyAddress, margin, y);
    y += 5;
  }
  if (options.taxNumber) {
    doc.text(`Steuernummer: ${options.taxNumber}`, margin, y);
    y += 5;
  }
  if (options.betriebsnummer) {
    doc.text(`Betriebsnummer: ${options.betriebsnummer}`, margin, y);
    y += 5;
  }
  y += 5;

  // Summen
  const totals = entries.reduce(
    (acc, e) => {
      acc.brutto += e.salaryCalculation.grossSalary;
      acc.netto += e.finalNetSalary;
      acc.lst += e.salaryCalculation.taxes.incomeTax;
      acc.soli += e.salaryCalculation.taxes.solidarityTax;
      acc.kist += e.salaryCalculation.taxes.churchTax;
      acc.svAn += e.salaryCalculation.socialSecurityContributions.total.employee;
      acc.svAg += e.salaryCalculation.socialSecurityContributions.total.employer;
      acc.pauschal += (e.wageTypeLineItems ?? []).reduce((s, li) => s + (li.pauschalTaxAmount ?? 0), 0);
      return acc;
    },
    { brutto: 0, netto: 0, lst: 0, soli: 0, kist: 0, svAn: 0, svAg: 0, pauschal: 0 },
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Abrechnungssummen', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  const rows: Array<[string, string]> = [
    ['Anzahl Mitarbeiter', String(entries.length)],
    ['Bruttolöhne gesamt', fmtEUR(totals.brutto)],
    ['Lohnsteuer', fmtEUR(totals.lst)],
    ['Solidaritätszuschlag', fmtEUR(totals.soli)],
    ['Kirchensteuer', fmtEUR(totals.kist)],
    ['Pauschalsteuer', fmtEUR(totals.pauschal)],
    ['SV-Beiträge (AN)', fmtEUR(totals.svAn)],
    ['SV-Beiträge (AG)', fmtEUR(totals.svAg)],
    ['Nettoauszahlung gesamt', fmtEUR(totals.netto)],
    ['AG-Gesamtkosten (Brutto + SV-AG)', fmtEUR(totals.brutto + totals.svAg)],
  ];
  for (const [label, value] of rows) {
    doc.text(label, margin, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += 5.5;
  }
  y += 4;

  // FiBu-Summen
  doc.setFont('helvetica', 'bold');
  doc.text('Buchhaltung', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Kontenrahmen: ${journal.kontenrahmen}`, margin, y);
  y += 5;
  doc.text(`Anzahl Buchungssätze: ${journal.summen.anzahlBuchungen}`, margin, y);
  y += 5;
  doc.text(`Soll-Summe: ${fmtEUR(journal.summen.sollGesamt)}`, margin, y);
  y += 5;
  doc.text(`Haben-Summe: ${fmtEUR(journal.summen.habenGesamt)}`, margin, y);
  y += 5;
  doc.text(`Differenz: ${fmtEUR(journal.summen.differenz)}`, margin, y);
  y += 8;

  // Inhalt des Pakets
  doc.setFont('helvetica', 'bold');
  doc.text('Inhalt dieses Pakets', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const inhalt = [
    '1. 00_Begleitschreiben_<Periode>.pdf — dieses Dokument',
    '2. 00_So-importieren-Sie-die-Daten_<Periode>.pdf — Schritt-für-Schritt Import-Anleitung',
    '3. 01_DATEV/EXTF_Lohnbuchungen_<SKR>_<Periode>.csv — DATEV-Importdatei (EXTF 7.0)',
    '4. 02_FiBu/Buchungsjournal_<SKR>_<Periode>.csv — Soll/Haben-Journal',
    '5. 02_FiBu/Saldenliste_<SKR>_<Periode>.csv — Saldenliste pro Konto',
    '6. 03_Lohnarten/Lohnarten_<Periode>.xlsx — Lohnarten-Aufschlüsselung pro Mitarbeiter',
    '7. README.txt — Inhaltsverzeichnis und Hinweise',
  ];
  for (const line of inhalt) {
    const wrapped = doc.splitTextToSize(line, pageWidth - 2 * margin);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5;
  }
  y += 4;

  // Kontakt
  if (options.contactName || options.contactEmail) {
    doc.setFont('helvetica', 'bold');
    doc.text('Ansprechpartner', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    if (options.contactName) {
      doc.text(options.contactName, margin, y);
      y += 5;
    }
    if (options.contactEmail) {
      doc.text(options.contactEmail, margin, y);
      y += 5;
    }
    y += 4;
  }

  // Hinweise
  if (options.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Hinweise', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(options.notes, pageWidth - 2 * margin);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    'Erstellt mit LohnPro – Cent-genaue Lohnabrechnung nach BMF-Standard',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' },
  );

  return doc.output('arraybuffer');
}

// ─────────────────────────────────────────────────────────────────────────────
// README
// ─────────────────────────────────────────────────────────────────────────────

function buildReadme(
  entries: PayrollEntry[],
  periode: PayrollPeriod,
  datevConfig: DatevExportConfig,
  options: TaxAdvisorPackageOptions,
  monthLabelHuman: string,
): string {
  return [
    '════════════════════════════════════════════════════════════',
    '  STEUERBERATER-PAKET – Lohnabrechnung',
    '════════════════════════════════════════════════════════════',
    '',
    `Mandant:           ${options.companyName ?? '-'}`,
    `Periode:           ${monthLabelHuman}`,
    `Erstellt am:       ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}`,
    `Anzahl Mitarbeiter: ${entries.length}`,
    `Kontenrahmen:      ${datevConfig.kontenrahmen}`,
    '',
    'INHALT',
    '------',
    '00_Begleitschreiben_<Periode>.pdf',
    '    Übergabeprotokoll mit Summen, Kontakt und Inhaltsverzeichnis.',
    '',
    '01_DATEV/',
    '    EXTF_Lohnbuchungen_<SKR>_<Periode>.csv',
    '    DATEV-Importdatei nach EXTF 7.0 Spezifikation.',
    '    Direkt importierbar in DATEV Rechnungswesen.',
    '',
    '02_FiBu/',
    '    Buchungsjournal_<SKR>_<Periode>.csv',
    '    Vollständiges Soll/Haben-Journal mit Buchungstexten.',
    '    Saldenliste_<SKR>_<Periode>.csv',
    '    Saldenliste pro Konto.',
    '',
    '03_Lohnarten/',
    '    Lohnarten_<Periode>.xlsx',
    '    Sheet 1: Zusammenfassung pro Mitarbeiter',
    '    Sheet 2: Lohnarten-Detailaufschlüsselung',
    '    Sheet 3: Summen pro Lohnart',
    '',
    'HINWEISE',
    '--------',
    '- Alle Beträge in EUR, deutsche Notation (Komma als Dezimaltrenner).',
    '- CSV-Dateien sind mit UTF-8-BOM kodiert (Excel-kompatibel).',
    '- Trennzeichen: Semikolon (;).',
    '- Berechnungen erfolgen nach BMF-PAP für das jeweilige Kalenderjahr.',
    '',
    'Bei Rückfragen wenden Sie sich bitte an den im Begleitschreiben',
    'genannten Ansprechpartner.',
    '',
  ].join('\r\n');
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Hilfsfunktion: Browser-Download des Pakets.
 */
export function downloadTaxAdvisorPackage(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}