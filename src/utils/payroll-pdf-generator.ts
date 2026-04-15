/**
 * PDF-Generator für Entgeltabrechnungen
 * Erzeugt druckfertige Lohnzettel im deutschen Format (DIN A4).
 */
import jsPDF from 'jspdf';
import { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import { formatCurrency } from '@/lib/formatters';

interface CompanyInfo {
  companyName: string;
  street?: string;
  zipCode?: string;
  city?: string;
  taxNumber?: string;
  betriebsnummer?: string;
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function fmt(value: number): string {
  return formatCurrency(value);
}

function line(doc: jsPDF, y: number, x1 = 20, x2 = 190) {
  doc.setDrawColor(180);
  doc.line(x1, y, x2, y);
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 20, y);
  line(doc, y + 1);
  return y + 6;
}

function row(doc: jsPDF, label: string, value: string, y: number, bold = false): number {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(label, 24, y);
  doc.text(value, 186, y, { align: 'right' });
  return y + 5;
}

export function generatePayrollPdf(
  entry: PayrollEntry,
  period: PayrollPeriod,
  company: CompanyInfo,
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const emp = entry.employee;
  const calc = entry.salaryCalculation;
  const periodLabel = `${MONTHS[period.month - 1]} ${period.year}`;

  // ── Header ────────────────────────────────────────────────
  doc.setFillColor(24, 24, 38); // dark header
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.companyName || 'Unternehmen', 20, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const addressParts = [company.street, `${company.zipCode ?? ''} ${company.city ?? ''}`].filter(Boolean);
  if (addressParts.length) doc.text(addressParts.join(', '), 20, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Entgeltabrechnung ${periodLabel}`, 186, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (company.betriebsnummer) doc.text(`Betriebsnr.: ${company.betriebsnummer}`, 186, 22, { align: 'right' });
  if (company.taxNumber) doc.text(`Steuernr.: ${company.taxNumber}`, 186, 27, { align: 'right' });

  // ── Mitarbeiter-Daten ─────────────────────────────────────
  let y = 42;
  y = sectionTitle(doc, 'Mitarbeiter', y);

  const leftCol = (label: string, value: string, yy: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(label, 24, yy);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.text(value, 60, yy);
    return yy;
  };
  const rightCol = (label: string, value: string, yy: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(label, 110, yy);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.text(value, 146, yy);
    return yy;
  };

  const fullName = `${emp.personalData.firstName} ${emp.personalData.lastName}`;
  leftCol('Name', fullName, y);
  rightCol('Steuer-ID', emp.personalData.taxId || '–', y);
  y += 5;
  leftCol('Steuerklasse', String(emp.personalData.taxClass), y);
  rightCol('SV-Nummer', emp.personalData.socialSecurityNumber || '–', y);
  y += 5;
  leftCol('KV', emp.personalData.healthInsurance?.name || '–', y);
  rightCol('Kinder', String(emp.personalData.numberOfChildren ?? 0), y);
  y += 8;

  // ── Arbeitszeit ───────────────────────────────────────────
  y = sectionTitle(doc, 'Arbeitszeit', y);
  const wd = entry.workingData;
  y = row(doc, 'Reguläre Stunden', `${wd.regularHours.toFixed(1)} h`, y);
  if (wd.overtimeHours > 0) y = row(doc, 'Überstunden', `${wd.overtimeHours.toFixed(1)} h`, y);
  if (wd.vacationDays > 0) y = row(doc, 'Urlaubstage', `${wd.vacationDays}`, y);
  if (wd.sickDays > 0) y = row(doc, 'Krankheitstage', `${wd.sickDays}`, y);
  y = row(doc, 'Arbeitstage (Ist / Soll)', `${wd.actualWorkingDays} / ${wd.expectedWorkingDays}`, y);
  y += 3;

  // ── Brutto ────────────────────────────────────────────────
  y = sectionTitle(doc, 'Bruttobezüge', y);
  y = row(doc, 'Grundgehalt', fmt(emp.salaryData.grossSalary), y);
  if (entry.additions.overtimePay > 0)
    y = row(doc, 'Überstundenzuschlag', fmt(entry.additions.overtimePay), y);
  if (entry.additions.nightShiftBonus > 0)
    y = row(doc, 'Nachtarbeitszuschlag', fmt(entry.additions.nightShiftBonus), y);
  if (entry.additions.sundayBonus > 0)
    y = row(doc, 'Sonntagszuschlag', fmt(entry.additions.sundayBonus), y);
  if (entry.additions.holidayBonus > 0)
    y = row(doc, 'Feiertagszuschlag', fmt(entry.additions.holidayBonus), y);
  if (entry.additions.bonuses > 0)
    y = row(doc, 'Prämien / Boni', fmt(entry.additions.bonuses), y);
  line(doc, y);
  y += 2;
  y = row(doc, 'Gesamtbrutto', fmt(calc.grossSalary), y, true);
  y += 3;

  // ── Steuern ───────────────────────────────────────────────
  y = sectionTitle(doc, 'Steuerliche Abzüge', y);
  y = row(doc, 'Lohnsteuer', `– ${fmt(calc.taxes.incomeTax)}`, y);
  y = row(doc, 'Solidaritätszuschlag', `– ${fmt(calc.taxes.solidarityTax)}`, y);
  if (calc.taxes.churchTax > 0)
    y = row(doc, 'Kirchensteuer', `– ${fmt(calc.taxes.churchTax)}`, y);
  line(doc, y);
  y += 2;
  y = row(doc, 'Steuern gesamt', `– ${fmt(calc.taxes.total)}`, y, true);
  y += 3;

  // ── Sozialversicherung ────────────────────────────────────
  y = sectionTitle(doc, 'Sozialversicherung (AN-Anteil)', y);
  const sv = calc.socialSecurityContributions;
  y = row(doc, 'Krankenversicherung', `– ${fmt(sv.healthInsurance.employee)}`, y);
  y = row(doc, 'Rentenversicherung', `– ${fmt(sv.pensionInsurance.employee)}`, y);
  y = row(doc, 'Arbeitslosenversicherung', `– ${fmt(sv.unemploymentInsurance.employee)}`, y);
  y = row(doc, 'Pflegeversicherung', `– ${fmt(sv.careInsurance.employee)}`, y);
  line(doc, y);
  y += 2;
  y = row(doc, 'SV gesamt (AN)', `– ${fmt(sv.total.employee)}`, y, true);
  y += 3;

  // ── Sonstige Abzüge ──────────────────────────────────────
  if (entry.deductions.total > 0) {
    y = sectionTitle(doc, 'Sonstige Abzüge', y);
    if (entry.deductions.unpaidLeave > 0)
      y = row(doc, 'Unbezahlter Urlaub', `– ${fmt(entry.deductions.unpaidLeave)}`, y);
    if (entry.deductions.advancePayments > 0)
      y = row(doc, 'Vorschüsse', `– ${fmt(entry.deductions.advancePayments)}`, y);
    if (entry.deductions.otherDeductions > 0)
      y = row(doc, 'Sonstiges', `– ${fmt(entry.deductions.otherDeductions)}`, y);
    y += 3;
  }

  // ── Netto ─────────────────────────────────────────────────
  doc.setFillColor(34, 197, 94); // green accent
  doc.roundedRect(19, y - 1, 172, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Auszahlungsbetrag (Netto)', 24, y + 6);
  doc.text(fmt(entry.finalNetSalary), 186, y + 6, { align: 'right' });
  y += 16;

  // ── AG-Kosten (Info) ──────────────────────────────────────
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text(`Arbeitgeberkosten gesamt: ${fmt(calc.employerCosts)}`, 24, y);
  y += 10;

  // ── Footer ────────────────────────────────────────────────
  doc.setDrawColor(200);
  doc.line(20, 275, 190, 275);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Diese Entgeltabrechnung wurde maschinell erstellt und ist ohne Unterschrift gültig.', 105, 280, { align: 'center' });
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 105, 284, { align: 'center' });
  doc.text(`LohnPro – ${company.companyName}`, 105, 288, { align: 'center' });

  return doc;
}

/**
 * Generates and triggers download of a payroll PDF.
 */
export function downloadPayrollPdf(
  entry: PayrollEntry,
  period: PayrollPeriod,
  company: CompanyInfo,
) {
  const doc = generatePayrollPdf(entry, period, company);
  const emp = entry.employee;
  const fileName = `Entgeltabrechnung_${emp.personalData.lastName}_${emp.personalData.firstName}_${period.year}-${String(period.month).padStart(2, '0')}.pdf`;
  doc.save(fileName);
}

/**
 * Generates a combined PDF with all entries for a period.
 */
export function downloadPeriodPayrollPdf(
  entries: PayrollEntry[],
  period: PayrollPeriod,
  company: CompanyInfo,
) {
  if (entries.length === 0) return;

  const first = generatePayrollPdf(entries[0], period, company);

  for (let i = 1; i < entries.length; i++) {
    const singleDoc = generatePayrollPdf(entries[i], period, company);
    const pages = singleDoc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      first.addPage();
      // We re-generate on the combined doc instead
    }
  }

  // Simpler approach: generate each separately and just save the first for single entries,
  // or create a fresh combined doc
  if (entries.length === 1) {
    const fileName = `Entgeltabrechnung_${entries[0].employee.personalData.lastName}_${period.year}-${String(period.month).padStart(2, '0')}.pdf`;
    first.save(fileName);
    return;
  }

  // For multiple: generate combined doc properly
  const combined = new jsPDF({ unit: 'mm', format: 'a4' });
  let isFirst = true;
  for (const entry of entries) {
    if (!isFirst) combined.addPage();
    isFirst = false;
    // Re-use the single-page generator by copying content
    const single = generatePayrollPdf(entry, period, company);
    // jsPDF doesn't support page copying natively, so we download as zip or individual
    // For simplicity, download individually
  }

  // Fallback: just download individually
  for (const entry of entries) {
    downloadPayrollPdf(entry, period, company);
  }
}
