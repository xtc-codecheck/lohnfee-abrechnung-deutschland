import React from 'react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { PayrollCalculationResult } from './detailed-payroll-calculation';
import { Employee } from '@/types/employee';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PayrollPDFGeneratorProps {
  employee: Employee;
  calculation: PayrollCalculationResult;
  onGenerate?: () => void;
}

export function PayrollPDFGenerator({ employee, calculation, onGenerate }: PayrollPDFGeneratorProps) {
  
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('LOHNABRECHNUNG', pageWidth / 2, 20, { align: 'center' });
    
    // Periode
    const periodText = format(new Date(calculation.period.year, calculation.period.month - 1), 'MMMM yyyy', { locale: de });
    doc.setFontSize(14);
    doc.text(periodText, pageWidth / 2, 30, { align: 'center' });
    
    // Firmendaten (Beispiel)
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Muster GmbH', 20, 50);
    doc.text('Musterstraße 123', 20, 55);
    doc.text('12345 Musterstadt', 20, 60);
    
    // Mitarbeiterdaten
    doc.text(`${employee.personalData.firstName} ${employee.personalData.lastName}`, pageWidth - 20, 50, { align: 'right' });
    doc.text(`Personalnummer: ${employee.id.slice(-6)}`, pageWidth - 20, 55, { align: 'right' });
    doc.text(`Steuerklasse: ${employee.personalData.taxClass}`, pageWidth - 20, 60, { align: 'right' });
    
    // Linie
    doc.line(20, 70, pageWidth - 20, 70);
    
    let yPos = 85;
    
    // Überschriften
    doc.setFont(undefined, 'bold');
    doc.text('Bezeichnung', 20, yPos);
    doc.text('Betrag', 120, yPos, { align: 'right' });
    doc.text('S/K', pageWidth - 30, yPos, { align: 'right' });
    
    yPos += 5;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
    
    // Bezüge
    doc.setFont(undefined, 'bold');
    doc.text('BEZÜGE', 20, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'normal');
    
    // Grundgehalt
    doc.text('Grundgehalt', 20, yPos);
    doc.text(`${calculation.salary.baseSalary.toFixed(2)} €`, 120, yPos, { align: 'right' });
    doc.text('●/●', pageWidth - 30, yPos, { align: 'right' });
    yPos += 6;
    
    // Überstunden
    if (calculation.workingTime.overtimeHours > 0) {
      doc.text(`Überstunden (${calculation.workingTime.overtimeHours}h à 25%)`, 20, yPos);
      doc.text(`${(calculation.salary.overtimePay - calculation.workingTime.overtimeHours * calculation.salary.hourlyRate).toFixed(2)} €`, 120, yPos, { align: 'right' });
      doc.text('●/●', pageWidth - 30, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // Zuschläge
    if (calculation.salary.bonuses.night > 0) {
      doc.text('Nachtschichtzuschlag (25%)', 20, yPos);
      doc.text(`${calculation.salary.bonuses.night.toFixed(2)} €`, 120, yPos, { align: 'right' });
      doc.text('●/●', pageWidth - 30, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (calculation.salary.bonuses.sunday > 0) {
      doc.text('Sonntagszuschlag (50%)', 20, yPos);
      doc.text(`${calculation.salary.bonuses.sunday.toFixed(2)} €`, 120, yPos, { align: 'right' });
      doc.text('●/●', pageWidth - 30, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (calculation.salary.bonuses.holiday > 0) {
      doc.text('Feiertagszuschlag (100%)', 20, yPos);
      doc.text(`${calculation.salary.bonuses.holiday.toFixed(2)} €`, 120, yPos, { align: 'right' });
      doc.text('●/●', pageWidth - 30, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // Sonderzahlungen
    if (calculation.specialPayments.vacationPay > 0) {
      doc.text('Urlaubsgeld', 20, yPos);
      doc.text(`${calculation.specialPayments.vacationPay.toFixed(2)} €`, 120, yPos, { align: 'right' });
      doc.text('●/●', pageWidth - 30, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (calculation.specialPayments.christmasBonus > 0) {
      doc.text('Weihnachtsgeld', 20, yPos);
      doc.text(`${calculation.specialPayments.christmasBonus.toFixed(2)} €`, 120, yPos, { align: 'right' });
      doc.text('●/●', pageWidth - 30, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // Linie vor Gesamtbrutto
    yPos += 3;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    // Gesamtbrutto
    doc.setFont(undefined, 'bold');
    doc.text('GESAMTBRUTTO', 20, yPos);
    doc.text(`${calculation.totals.grossSalary.toFixed(2)} €`, 120, yPos, { align: 'right' });
    yPos += 12;
    
    // Abzüge
    doc.text('ABZÜGE', 20, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'normal');
    
    // Lohnsteuer
    doc.text(`Lohnsteuer (Klasse ${employee.personalData.taxClass})`, 20, yPos);
    doc.text(`${calculation.taxes.incomeTax.toFixed(2)} €`, 120, yPos, { align: 'right' });
    yPos += 6;
    
    // Solidaritätszuschlag
    if (calculation.taxes.solidarityTax > 0) {
      doc.text('Solidaritätszuschlag', 20, yPos);
      doc.text(`${calculation.taxes.solidarityTax.toFixed(2)} €`, 120, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // Kirchensteuer
    if (calculation.taxes.churchTax > 0) {
      doc.text('Kirchensteuer', 20, yPos);
      doc.text(`${calculation.taxes.churchTax.toFixed(2)} €`, 120, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // Sozialversicherung
    doc.text('Rentenversicherung AN (9,3%)', 20, yPos);
    doc.text(`${calculation.socialInsurance.pension.toFixed(2)} €`, 120, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text('Arbeitslosenversicherung AN (1,3%)', 20, yPos);
    doc.text(`${calculation.socialInsurance.unemployment.toFixed(2)} €`, 120, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text('Krankenversicherung AN (7,3% + ZB)', 20, yPos);
    doc.text(`${calculation.socialInsurance.health.toFixed(2)} €`, 120, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text('Pflegeversicherung AN', 20, yPos);
    doc.text(`${calculation.socialInsurance.care.toFixed(2)} €`, 120, yPos, { align: 'right' });
    yPos += 6;
    
    // Linie vor Gesamtabzüge
    yPos += 3;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    // Gesamtabzüge
    doc.setFont(undefined, 'bold');
    doc.text('GESAMTABZÜGE', 20, yPos);
    doc.text(`${calculation.totals.totalDeductions.toFixed(2)} €`, 120, yPos, { align: 'right' });
    yPos += 12;
    
    // Doppelte Linie vor Nettolohn
    doc.line(20, yPos, pageWidth - 20, yPos);
    doc.line(20, yPos + 1, pageWidth - 20, yPos + 1);
    yPos += 10;
    
    // Nettolohn/Auszahlungsbetrag
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('AUSZAHLUNGSBETRAG', 20, yPos);
    doc.text(`${calculation.totals.netSalary.toFixed(2)} €`, 120, yPos, { align: 'right' });
    yPos += 15;
    
    // Zusätzliche Informationen
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    yPos += 10;
    doc.text('Zusätzliche Informationen:', 20, yPos);
    yPos += 8;
    
    doc.text(`Sozialversicherungsnummer: ${employee.personalData.socialSecurityNumber}`, 20, yPos);
    yPos += 6;
    doc.text(`Krankenkasse: ${employee.personalData.healthInsurance.name}`, 20, yPos);
    yPos += 6;
    doc.text(`Zusatzbeitrag: ${employee.personalData.healthInsurance.additionalRate}%`, 20, yPos);
    yPos += 6;
    doc.text(`Kinderfreibeträge: ${employee.personalData.childAllowances}`, 20, yPos);
    yPos += 6;
    doc.text(`Kirchensteuerpflichtig: ${employee.personalData.churchTax ? 'Ja' : 'Nein'}`, 20, yPos);
    
    // Arbeitgeberkosten am Ende
    yPos += 15;
    doc.text(`Arbeitgeberkosten gesamt: ${calculation.totals.employerCosts.toFixed(2)} €`, 20, yPos);
    
    // Footer
    doc.setFontSize(8);
    doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    
    // PDF speichern
    const fileName = `Lohnabrechnung_${employee.personalData.lastName}_${calculation.period.month.toString().padStart(2, '0')}_${calculation.period.year}.pdf`;
    doc.save(fileName);
    
    onGenerate?.();
  };

  return (
    <Button onClick={generatePDF} variant="outline">
      <Download className="w-4 h-4 mr-2" />
      PDF erstellen
    </Button>
  );
}

// Hook für die PDF-Generierung
export const usePayrollPDF = () => {
  const generatePayrollPDF = (employee: Employee, calculation: PayrollCalculationResult) => {
    const generator = { generatePDF: () => {} };
    return generator;
  };

  return { generatePayrollPDF };
};