/**
 * PDF-Generator für Entgeltabrechnungen
 * Erzeugt druckfertige Lohnzettel im deutschen Format (DIN A4).
 * Unterstützt zweisprachige Ausgabe (DE/EN) — siehe payroll-pdf-i18n.ts.
 * Hinweis: Englische Fassung ist eine Übersetzungshilfe; rechtsverbindlich
 * bleibt die deutsche Version (entsprechender Disclaimer wird im Footer gedruckt).
 */
import jsPDF from 'jspdf';
import { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import { getPayslipLabels, formatPayslipCurrency, type PayslipLocale } from './payroll-pdf-i18n';

interface CompanyInfo {
  companyName: string;
  street?: string;
  zipCode?: string;
  city?: string;
  taxNumber?: string;
  betriebsnummer?: string;
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
  locale: PayslipLocale = 'de',
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const emp = entry.employee;
  const calc = entry.salaryCalculation;
  const L = getPayslipLabels(locale);
  const fmt = (v: number) => formatPayslipCurrency(v, locale);
  const periodLabel = `${L.months[period.month - 1]} ${period.year}`;

  // ── Header ────────────────────────────────────────────────
  doc.setFillColor(24, 24, 38); // dark header
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.companyName || (locale === 'en' ? 'Company' : 'Unternehmen'), 20, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const addressParts = [company.street, `${company.zipCode ?? ''} ${company.city ?? ''}`].filter(Boolean);
  if (addressParts.length) doc.text(addressParts.join(', '), 20, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${L.payslipTitle} ${periodLabel}`, 186, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (company.betriebsnummer) doc.text(`${L.betriebsNr}: ${company.betriebsnummer}`, 186, 22, { align: 'right' });
  if (company.taxNumber) doc.text(`${L.taxNr}: ${company.taxNumber}`, 186, 27, { align: 'right' });

  // ── Mitarbeiter-Daten ─────────────────────────────────────
  let y = 42;
  y = sectionTitle(doc, L.employee, y);

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
  leftCol(L.name, fullName, y);
  rightCol(L.taxId, emp.personalData.taxId || '–', y);
  y += 5;
  leftCol(L.taxClass, String(emp.personalData.taxClass), y);
  rightCol(L.svNumber, emp.personalData.socialSecurityNumber || '–', y);
  y += 5;
  leftCol(L.healthInsurance, emp.personalData.healthInsurance?.name || '–', y);
  rightCol(L.children, String(emp.personalData.numberOfChildren ?? 0), y);
  y += 8;

  // ── Arbeitszeit ───────────────────────────────────────────
  y = sectionTitle(doc, L.workingTime, y);
  const wd = entry.workingData;
  y = row(doc, L.regularHours, `${wd.regularHours.toFixed(1)} ${L.hoursUnit}`, y);
  if (wd.overtimeHours > 0) y = row(doc, L.overtimeHours, `${wd.overtimeHours.toFixed(1)} ${L.hoursUnit}`, y);
  if (wd.vacationDays > 0) y = row(doc, L.vacationDays, `${wd.vacationDays}`, y);
  if (wd.sickDays > 0) y = row(doc, L.sickDays, `${wd.sickDays}`, y);
  y = row(doc, L.workingDaysActualExpected, `${wd.actualWorkingDays} / ${wd.expectedWorkingDays}`, y);
  y += 3;

  // ── Brutto ────────────────────────────────────────────────
  y = sectionTitle(doc, L.grossPay, y);
  y = row(doc, L.baseSalary, fmt(emp.salaryData.grossSalary), y);
  if (entry.additions.overtimePay > 0)
    y = row(doc, L.overtimeSurcharge, fmt(entry.additions.overtimePay), y);
  if (entry.additions.nightShiftBonus > 0)
    y = row(doc, L.nightShiftBonus, fmt(entry.additions.nightShiftBonus), y);
  if (entry.additions.sundayBonus > 0)
    y = row(doc, L.sundayBonus, fmt(entry.additions.sundayBonus), y);
  if (entry.additions.holidayBonus > 0)
    y = row(doc, L.holidayBonus, fmt(entry.additions.holidayBonus), y);
  if (entry.additions.bonuses > 0)
    y = row(doc, L.bonuses, fmt(entry.additions.bonuses), y);
  line(doc, y);
  y += 2;
  y = row(doc, L.totalGross, fmt(calc.grossSalary), y, true);
  y += 3;

  // ── Steuern ───────────────────────────────────────────────
  y = sectionTitle(doc, L.taxes, y);
  y = row(doc, L.incomeTax, `– ${fmt(calc.taxes.incomeTax)}`, y);
  y = row(doc, L.solidarityTax, `– ${fmt(calc.taxes.solidarityTax)}`, y);
  if (calc.taxes.churchTax > 0)
    y = row(doc, L.churchTax, `– ${fmt(calc.taxes.churchTax)}`, y);
  line(doc, y);
  y += 2;
  y = row(doc, L.totalTaxes, `– ${fmt(calc.taxes.total)}`, y, true);
  y += 3;

  // ── Sozialversicherung ────────────────────────────────────
  y = sectionTitle(doc, L.socialSecurityEmployee, y);
  const sv = calc.socialSecurityContributions;
  y = row(doc, L.healthIns, `– ${fmt(sv.healthInsurance.employee)}`, y);
  y = row(doc, L.pensionIns, `– ${fmt(sv.pensionInsurance.employee)}`, y);
  y = row(doc, L.unemploymentIns, `– ${fmt(sv.unemploymentInsurance.employee)}`, y);
  y = row(doc, L.careIns, `– ${fmt(sv.careInsurance.employee)}`, y);
  line(doc, y);
  y += 2;
  y = row(doc, L.totalSV, `– ${fmt(sv.total.employee)}`, y, true);
  y += 3;

  // ── Sonstige Abzüge ──────────────────────────────────────
  if (entry.deductions.total > 0) {
    y = sectionTitle(doc, L.otherDeductions, y);
    if (entry.deductions.unpaidLeave > 0)
      y = row(doc, L.unpaidLeave, `– ${fmt(entry.deductions.unpaidLeave)}`, y);
    if (entry.deductions.advancePayments > 0)
      y = row(doc, L.advancePayments, `– ${fmt(entry.deductions.advancePayments)}`, y);
    if (entry.deductions.otherDeductions > 0)
      y = row(doc, L.otherDeductionsLine, `– ${fmt(entry.deductions.otherDeductions)}`, y);
    y += 3;
  }

  // ── Lohnarten (P4) ───────────────────────────────────────
  // Aufschlüsselung der angewandten Lohnarten je Effekt – wichtig für
  // Transparenz gegenüber Mitarbeiter UND für steuerliche Nachvollziehbarkeit.
  if (entry.wageTypeLineItems && entry.wageTypeLineItems.length > 0) {
    y = sectionTitle(doc, L.wageTypesSection, y);
    const effectLabel: Record<string, string> = {
      gross_taxable: L.wageTypeEffectGrossTaxable,
      net_taxfree: L.wageTypeEffectNetTaxFree,
      in_kind: L.wageTypeEffectInKind,
      net_deduction: L.wageTypeEffectNetDeduction,
      pauschal: L.wageTypeEffectPauschal,
    };
    for (const li of entry.wageTypeLineItems) {
      // Nur Items mit Betrag > 0 anzeigen (steuerfreie Sachbezugsfreigrenze hat amount=0)
      if (li.amount === 0) continue;
      const sign = (li.effect === 'net_deduction' || li.effect === 'in_kind') ? '– ' : '';
      const label = `${li.code} ${li.name} (${effectLabel[li.effect] ?? li.effect})`;
      y = row(doc, label, `${sign}${fmt(li.amount)}`, y);
      // Pauschalsteuer-Hinweis als Sub-Zeile
      if (li.pauschalTaxAmount && li.pauschalTaxAmount > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(`   ${L.wageTypeEffectPauschal} ${li.pauschalTaxRate}%: ${fmt(li.pauschalTaxAmount)}`, 24, y);
        y += 4;
      }
    }
    y += 3;
  }

  // ── Netto ─────────────────────────────────────────────────
  doc.setFillColor(34, 197, 94); // green accent
  doc.roundedRect(19, y - 1, 172, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(L.netPayout, 24, y + 6);
  doc.text(fmt(entry.finalNetSalary), 186, y + 6, { align: 'right' });
  y += 16;

  // ── AG-Kosten (Info) ──────────────────────────────────────
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text(`${L.totalEmployerCost}: ${fmt(calc.employerCosts)}`, 24, y);
  y += 10;

  // ── Footer ────────────────────────────────────────────────
  doc.setDrawColor(200);
  doc.line(20, 275, 190, 275);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(L.machineGenerated, 105, 280, { align: 'center' });
  doc.text(`${L.createdOn}: ${new Date().toLocaleDateString(L.dateLocale)}`, 105, 284, { align: 'center' });
  doc.text(`LohnPro – ${company.companyName}`, 105, 288, { align: 'center' });
  if (locale === 'en' && L.legalDisclaimerEN) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(170);
    doc.text(L.legalDisclaimerEN, 105, 292, { align: 'center', maxWidth: 180 });
  }

  return doc;
}

/**
 * Generates and triggers download of a payroll PDF.
 */
export function downloadPayrollPdf(
  entry: PayrollEntry,
  period: PayrollPeriod,
  company: CompanyInfo,
  locale: PayslipLocale = 'de',
) {
  const doc = generatePayrollPdf(entry, period, company, locale);
  const emp = entry.employee;
  const L = getPayslipLabels(locale);
  const fileName = `${L.filenamePrefix}_${emp.personalData.lastName}_${emp.personalData.firstName}_${period.year}-${String(period.month).padStart(2, '0')}.pdf`;
  doc.save(fileName);
}

