import React from 'react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { PayrollCalculationResult } from './detailed-payroll-calculation';
import { Employee, IndustryType } from '@/types/employee';
import { IndustryPayrollResult } from '@/hooks/use-industry-payroll';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PayrollPDFGeneratorProps {
  employee: Employee;
  calculation: PayrollCalculationResult;
  industryResult?: IndustryPayrollResult;
  onGenerate?: () => void;
}

export function PayrollPDFGenerator({ 
  employee, 
  calculation, 
  industryResult,
  onGenerate 
}: PayrollPDFGeneratorProps) {
  
  const formatCurrency = (value: number) => `${value.toFixed(2)} €`;
  
  const getIndustryLabel = (type: IndustryType): string => {
    switch (type) {
      case 'construction': return 'BAULOHN';
      case 'gastronomy': return 'GASTRONOMIE';
      case 'nursing': return 'PFLEGE/SCHICHTDIENST';
      default: return '';
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const industry = employee.employmentData.industry ?? 'standard';
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('LOHNABRECHNUNG', pageWidth / 2, 20, { align: 'center' });
    
    // Branchen-Badge
    if (industry !== 'standard') {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`[${getIndustryLabel(industry)}]`, pageWidth / 2, 27, { align: 'center' });
    }
    
    // Periode
    const periodText = format(new Date(calculation.period.year, calculation.period.month - 1), 'MMMM yyyy', { locale: de });
    doc.setFontSize(14);
    doc.text(periodText, pageWidth / 2, 35, { align: 'center' });
    
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
    
    // Branchenspezifische Info
    if (industry === 'construction') {
      const config = employee.employmentData.industryConfig;
      doc.text(`Tarifgebiet: ${config?.constructionRegion === 'east' ? 'Ost' : 'West'}`, pageWidth - 20, 65, { align: 'right' });
    }
    
    // Linie
    doc.line(20, 72, pageWidth - 20, 72);
    
    let yPos = 85;
    
    // Überschriften
    doc.setFont(undefined, 'bold');
    doc.text('Bezeichnung', 20, yPos);
    doc.text('Betrag', 120, yPos, { align: 'right' });
    doc.text('S/K', 145, yPos, { align: 'right' });
    doc.text('SF', pageWidth - 25, yPos, { align: 'right' });
    
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
    doc.text(formatCurrency(calculation.salary.baseSalary), 120, yPos, { align: 'right' });
    doc.text('●/●', 145, yPos, { align: 'right' });
    yPos += 6;
    
    // Überstunden
    if (calculation.workingTime.overtimeHours > 0) {
      doc.text(`Überstunden (${calculation.workingTime.overtimeHours}h à 25%)`, 20, yPos);
      doc.text(formatCurrency(calculation.salary.overtimePay - calculation.workingTime.overtimeHours * calculation.salary.hourlyRate), 120, yPos, { align: 'right' });
      doc.text('●/●', 145, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // Standard SFN-Zuschläge (steuerpflichtig bei Standard, steuerfrei bei Pflege)
    const isSfnTaxFree = industry === 'nursing';
    
    if (calculation.salary.bonuses.night > 0) {
      doc.text('Nachtschichtzuschlag (25%)', 20, yPos);
      doc.text(formatCurrency(calculation.salary.bonuses.night), 120, yPos, { align: 'right' });
      doc.text(isSfnTaxFree ? '○/○' : '●/●', 145, yPos, { align: 'right' });
      if (isSfnTaxFree) doc.text('SF', pageWidth - 25, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (calculation.salary.bonuses.sunday > 0) {
      doc.text('Sonntagszuschlag (50%)', 20, yPos);
      doc.text(formatCurrency(calculation.salary.bonuses.sunday), 120, yPos, { align: 'right' });
      doc.text(isSfnTaxFree ? '○/○' : '●/●', 145, yPos, { align: 'right' });
      if (isSfnTaxFree) doc.text('SF', pageWidth - 25, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (calculation.salary.bonuses.holiday > 0) {
      doc.text('Feiertagszuschlag (125%)', 20, yPos);
      doc.text(formatCurrency(calculation.salary.bonuses.holiday), 120, yPos, { align: 'right' });
      doc.text(isSfnTaxFree ? '○/○' : '●/●', 145, yPos, { align: 'right' });
      if (isSfnTaxFree) doc.text('SF', pageWidth - 25, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // ============= BRANCHENSPEZIFISCHE ZULAGEN =============
    
    if (industryResult && industry !== 'standard') {
      yPos += 4;
      doc.setFont(undefined, 'bold');
      doc.text(`BRANCHENZULAGEN (${getIndustryLabel(industry)})`, 20, yPos);
      yPos += 8;
      doc.setFont(undefined, 'normal');
      
      // BAULOHN
      if (industry === 'construction' && industryResult.constructionResult) {
        const cr = industryResult.constructionResult;
        
        if (cr.winterAllowance > 0) {
          doc.text('Mehraufwands-Wintergeld (1,00€/Std.)', 20, yPos);
          doc.text(formatCurrency(cr.winterAllowance), 120, yPos, { align: 'right' });
          doc.text('●/●', 145, yPos, { align: 'right' });
          yPos += 6;
        }
        
        if (cr.dirtyWorkBonus > 0) {
          doc.text('Schmutzzulage', 20, yPos);
          doc.text(formatCurrency(cr.dirtyWorkBonus), 120, yPos, { align: 'right' });
          doc.text('●/●', 145, yPos, { align: 'right' });
          yPos += 6;
        }
        
        if (cr.heightWorkBonus > 0) {
          doc.text('Höhenzulage (>7m)', 20, yPos);
          doc.text(formatCurrency(cr.heightWorkBonus), 120, yPos, { align: 'right' });
          doc.text('●/●', 145, yPos, { align: 'right' });
          yPos += 6;
        }
        
        if (cr.dangerWorkBonus > 0) {
          doc.text('Gefahrenzulage', 20, yPos);
          doc.text(formatCurrency(cr.dangerWorkBonus), 120, yPos, { align: 'right' });
          doc.text('●/●', 145, yPos, { align: 'right' });
          yPos += 6;
        }
      }
      
      // GASTRONOMIE
      if (industry === 'gastronomy' && industryResult.gastronomyResult) {
        const gr = industryResult.gastronomyResult;
        
        if (gr.mealBenefitTotal > 0) {
          doc.text('Sachbezug Mahlzeiten', 20, yPos);
          doc.text(formatCurrency(gr.mealBenefitTotal), 120, yPos, { align: 'right' });
          doc.text('●/●', 145, yPos, { align: 'right' });
          yPos += 5;
          
          // Details
          doc.setFontSize(8);
          if (gr.mealBenefitDetails.breakfast.count > 0) {
            doc.text(`   ${gr.mealBenefitDetails.breakfast.count}x Frühstück à 2,17€`, 25, yPos);
            yPos += 4;
          }
          if (gr.mealBenefitDetails.lunch.count > 0) {
            doc.text(`   ${gr.mealBenefitDetails.lunch.count}x Mittagessen à 4,13€`, 25, yPos);
            yPos += 4;
          }
          if (gr.mealBenefitDetails.dinner.count > 0) {
            doc.text(`   ${gr.mealBenefitDetails.dinner.count}x Abendessen à 4,13€`, 25, yPos);
            yPos += 4;
          }
          doc.setFontSize(10);
        }
        
        if (gr.tipsTaxFree > 0) {
          doc.text('Trinkgeld (steuerfrei)', 20, yPos);
          doc.text(formatCurrency(gr.tipsTaxFree), 120, yPos, { align: 'right' });
          doc.text('○/○', 145, yPos, { align: 'right' });
          doc.text('SF', pageWidth - 25, yPos, { align: 'right' });
          yPos += 6;
        }
        
        if (gr.tipsTaxable > 0) {
          doc.text('Trinkgeld (steuerpflichtig)', 20, yPos);
          doc.text(formatCurrency(gr.tipsTaxable), 120, yPos, { align: 'right' });
          doc.text('●/●', 145, yPos, { align: 'right' });
          yPos += 6;
        }
      }
      
      // PFLEGE
      if (industry === 'nursing' && industryResult.nursingResult) {
        const nr = industryResult.nursingResult;
        
        if (nr.shiftAllowance > 0) {
          doc.text('Schichtzulage (TVöD-P)', 20, yPos);
          doc.text(formatCurrency(nr.shiftAllowance), 120, yPos, { align: 'right' });
          doc.text('●/●', 145, yPos, { align: 'right' });
          yPos += 6;
        }
        
        if (nr.onCallPay > 0) {
          doc.text('Bereitschaftsdienst (25%)', 20, yPos);
          doc.text(formatCurrency(nr.onCallPay), 120, yPos, { align: 'right' });
          doc.text('●/●', 145, yPos, { align: 'right' });
          yPos += 6;
        }
        
        // Steuerfreie SFN-Zuschläge Zusammenfassung
        if (nr.taxFreeAmount > 0) {
          yPos += 2;
          doc.setFont(undefined, 'italic');
          doc.text(`Davon steuerfrei (SFN): ${formatCurrency(nr.taxFreeAmount)}`, 25, yPos);
          doc.setFont(undefined, 'normal');
          yPos += 6;
        }
      }
    }
    
    // Sonderzahlungen
    if (calculation.specialPayments.vacationPay > 0) {
      doc.text('Urlaubsgeld', 20, yPos);
      doc.text(formatCurrency(calculation.specialPayments.vacationPay), 120, yPos, { align: 'right' });
      doc.text('●/●', 145, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (calculation.specialPayments.christmasBonus > 0) {
      doc.text('Weihnachtsgeld', 20, yPos);
      doc.text(formatCurrency(calculation.specialPayments.christmasBonus), 120, yPos, { align: 'right' });
      doc.text('●/●', 145, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // Linie vor Gesamtbrutto
    yPos += 3;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    // Gesamtbrutto
    doc.setFont(undefined, 'bold');
    doc.text('GESAMTBRUTTO', 20, yPos);
    doc.text(formatCurrency(calculation.totals.grossSalary), 120, yPos, { align: 'right' });
    
    // Steuerfreier Anteil anzeigen
    if (industryResult && industryResult.taxFreeAdditions > 0) {
      yPos += 5;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(`(davon steuerfrei: ${formatCurrency(industryResult.taxFreeAdditions)})`, 20, yPos);
      doc.setFontSize(10);
    }
    yPos += 12;
    
    // ============= ABZÜGE =============
    
    doc.setFont(undefined, 'bold');
    doc.text('ABZÜGE', 20, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'normal');
    
    // Lohnsteuer
    doc.text(`Lohnsteuer (Klasse ${employee.personalData.taxClass})`, 20, yPos);
    doc.text(formatCurrency(calculation.taxes.incomeTax), 120, yPos, { align: 'right' });
    yPos += 6;
    
    // Solidaritätszuschlag
    if (calculation.taxes.solidarityTax > 0) {
      doc.text('Solidaritätszuschlag', 20, yPos);
      doc.text(formatCurrency(calculation.taxes.solidarityTax), 120, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // Kirchensteuer
    if (calculation.taxes.churchTax > 0) {
      doc.text('Kirchensteuer', 20, yPos);
      doc.text(formatCurrency(calculation.taxes.churchTax), 120, yPos, { align: 'right' });
      yPos += 6;
    }
    
    // Sozialversicherung
    doc.text('Rentenversicherung AN (9,3%)', 20, yPos);
    doc.text(formatCurrency(calculation.socialInsurance.pension), 120, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text('Arbeitslosenversicherung AN (1,3%)', 20, yPos);
    doc.text(formatCurrency(calculation.socialInsurance.unemployment), 120, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text('Krankenversicherung AN (7,3% + ZB)', 20, yPos);
    doc.text(formatCurrency(calculation.socialInsurance.health), 120, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text('Pflegeversicherung AN', 20, yPos);
    doc.text(formatCurrency(calculation.socialInsurance.care), 120, yPos, { align: 'right' });
    yPos += 6;
    
    // Linie vor Gesamtabzüge
    yPos += 3;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    // Gesamtabzüge
    doc.setFont(undefined, 'bold');
    doc.text('GESAMTABZÜGE', 20, yPos);
    doc.text(formatCurrency(calculation.totals.totalDeductions), 120, yPos, { align: 'right' });
    yPos += 12;
    
    // Doppelte Linie vor Nettolohn
    doc.line(20, yPos, pageWidth - 20, yPos);
    doc.line(20, yPos + 1, pageWidth - 20, yPos + 1);
    yPos += 10;
    
    // Nettolohn/Auszahlungsbetrag
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('AUSZAHLUNGSBETRAG', 20, yPos);
    doc.text(formatCurrency(calculation.totals.netSalary), 120, yPos, { align: 'right' });
    yPos += 15;
    
    // ============= BRANCHENSPEZIFISCHE ARBEITGEBERKOSTEN =============
    
    if (industryResult && industry !== 'standard') {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('ARBEITGEBER-ZUSATZKOSTEN', 20, yPos);
      yPos += 8;
      
      doc.setFont(undefined, 'normal');
      
      if (industry === 'construction' && industryResult.constructionResult) {
        const cr = industryResult.constructionResult;
        
        doc.text('SOKA-BAU Arbeitgeberbeitrag (15,20%)', 20, yPos);
        doc.text(formatCurrency(cr.sokaEmployerContribution), 120, yPos, { align: 'right' });
        yPos += 6;
        
        // Urlaubskasse Info
        if (industryResult.vacationAccountResult) {
          const va = industryResult.vacationAccountResult;
          doc.setFontSize(8);
          doc.text(`Urlaubskasse: ${va.remainingDays} Tage (Wert: ${formatCurrency(va.monetaryValue)})`, 25, yPos);
          yPos += 4;
          doc.text(`Verfall: ${format(va.expirationDate, 'dd.MM.yyyy')}`, 25, yPos);
          doc.setFontSize(10);
          yPos += 6;
        }
      }
      
      if (industry === 'gastronomy' && industryResult.employerAdditionalCosts > 0) {
        doc.text('Sachbezüge (AG-Anteil)', 20, yPos);
        doc.text(formatCurrency(industryResult.employerAdditionalCosts), 120, yPos, { align: 'right' });
        yPos += 6;
      }
      
      if (industry === 'nursing' && industryResult.employerAdditionalCosts > 0) {
        doc.text('Schichtzulagen (AG-Kosten)', 20, yPos);
        doc.text(formatCurrency(industryResult.employerAdditionalCosts), 120, yPos, { align: 'right' });
        yPos += 6;
      }
      
      yPos += 4;
    }
    
    // Zusätzliche Informationen
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    yPos += 6;
    doc.text('Mitarbeiterinformationen:', 20, yPos);
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
    yPos += 12;
    doc.setFont(undefined, 'bold');
    doc.text(`Arbeitgeberkosten gesamt: ${formatCurrency(calculation.totals.employerCosts + (industryResult?.employerAdditionalCosts ?? 0))}`, 20, yPos);
    
    // Legende
    yPos += 10;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Legende: ●/● = steuer-/sv-pflichtig | ○/○ = steuer-/sv-frei | SF = steuerfrei', 20, yPos);
    
    // Footer
    doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    
    // PDF speichern
    const industryPrefix = industry !== 'standard' ? `${industry.toUpperCase()}_` : '';
    const fileName = `Lohnabrechnung_${industryPrefix}${employee.personalData.lastName}_${calculation.period.month.toString().padStart(2, '0')}_${calculation.period.year}.pdf`;
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
  const generatePayrollPDF = (
    employee: Employee, 
    calculation: PayrollCalculationResult,
    industryResult?: IndustryPayrollResult
  ) => {
    const generator = { generatePDF: () => {} };
    return generator;
  };

  return { generatePayrollPDF };
};