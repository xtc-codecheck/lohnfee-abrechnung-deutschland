/**
 * Periodenabschluss-PDF
 * Erzeugt ein zusammenfassendes PDF mit allen Kennzahlen einer Lohnperiode
 * inkl. optionalem Vergleich zum Vormonat.
 */
import jsPDF from 'jspdf';
import { PayrollReport } from '@/types/payroll';
import { formatCurrency } from '@/lib/formatters';

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function fmt(value: number): string {
  return formatCurrency(value);
}

function delta(current: number, previous: number): string {
  if (!previous) return '–';
  const diff = current - previous;
  const pct = (diff / previous) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${fmt(diff)} (${sign}${pct.toFixed(1)}%)`;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(title, 20, y);
  doc.setDrawColor(180);
  doc.line(20, y + 1, 190, y + 1);
  return y + 7;
}

function row(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  options: { bold?: boolean; compare?: string } = {},
): number {
  doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(label, 24, y);
  doc.text(value, options.compare ? 150 : 186, y, { align: 'right' });
  if (options.compare) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.text(options.compare, 186, y, { align: 'right' });
  }
  return y + 5;
}

export function generatePeriodClosePdf(
  current: PayrollReport,
  previous?: PayrollReport | null,
  companyName?: string,
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const periodLabel = `${MONTHS[current.period.month - 1]} ${current.period.year}`;
  const prev = previous?.summary;

  // ── Header ────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Periodenabschluss', 20, 20);
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(periodLabel, 20, 27);
  if (companyName) {
    doc.setFontSize(10);
    doc.text(companyName, 190, 20, { align: 'right' });
  }
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')}`, 190, 27, { align: 'right' });

  // ── Kennzahlen ───────────────────────────────────────────
  let y = sectionTitle(doc, 'Kennzahlen der Periode', 40);

  if (prev) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Wert', 150, y - 1, { align: 'right' });
    doc.text('Δ Vormonat', 186, y - 1, { align: 'right' });
    y += 2;
  }

  const s = current.summary;

  y = row(doc, 'Anzahl Mitarbeiter', String(s.totalEmployees), y,
    { compare: prev ? String(s.totalEmployees - prev.totalEmployees) : undefined });
  y = row(doc, 'Bruttolohnsumme', fmt(s.totalGrossSalary), y,
    { compare: prev ? delta(s.totalGrossSalary, prev.totalGrossSalary) : undefined });
  y = row(doc, 'Lohnsteuer & Soli & KiSt', fmt(s.totalTaxes), y,
    { compare: prev ? delta(s.totalTaxes, prev.totalTaxes) : undefined });
  y = row(doc, 'SV-Beiträge AN-Anteil', fmt(s.totalSocialSecurityEmployee), y,
    { compare: prev ? delta(s.totalSocialSecurityEmployee, prev.totalSocialSecurityEmployee) : undefined });
  y = row(doc, 'SV-Beiträge AG-Anteil', fmt(s.totalSocialSecurityEmployer), y,
    { compare: prev ? delta(s.totalSocialSecurityEmployer, prev.totalSocialSecurityEmployer) : undefined });
  y = row(doc, 'Auszahlungssumme (Netto)', fmt(s.totalNetSalary), y,
    { bold: true, compare: prev ? delta(s.totalNetSalary, prev.totalNetSalary) : undefined });
  y = row(doc, 'Arbeitgeber-Gesamtkosten', fmt(s.totalEmployerCosts), y,
    { bold: true, compare: prev ? delta(s.totalEmployerCosts, prev.totalEmployerCosts) : undefined });

  // ── MA-Übersicht ─────────────────────────────────────────
  y = sectionTitle(doc, 'Mitarbeiter-Übersicht', y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Mitarbeiter', 24, y);
  doc.text('Brutto', 110, y, { align: 'right' });
  doc.text('Steuern', 140, y, { align: 'right' });
  doc.text('SV (AN)', 165, y, { align: 'right' });
  doc.text('Netto', 186, y, { align: 'right' });
  y += 4;
  doc.setDrawColor(220);
  doc.line(20, y - 2, 190, y - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  for (const e of current.entries) {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    const name = `${e.employee.personalData?.lastName ?? ''}, ${e.employee.personalData?.firstName ?? ''}`.slice(0, 40);
    doc.text(name, 24, y);
    doc.text(fmt(e.salaryCalculation.grossSalary), 110, y, { align: 'right' });
    doc.text(fmt(e.salaryCalculation.taxes.total), 140, y, { align: 'right' });
    doc.text(fmt(e.salaryCalculation.socialSecurityContributions.total.employee), 165, y, { align: 'right' });
    doc.text(fmt(e.finalNetSalary), 186, y, { align: 'right' });
    y += 4.5;
  }

  // ── Footer ──────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Periodenabschluss ${periodLabel} · Seite ${i} / ${pageCount}`, 105, 290, { align: 'center' });
  }

  return doc;
}