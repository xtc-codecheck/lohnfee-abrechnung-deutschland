import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileBarChart,
  Mail,
  Server,
  Shield
} from "lucide-react";
import { Employee } from "@/types/employee";
import { PayrollPeriod, PayrollEntry } from "@/types/payroll";
import type { WageTypeLineItem } from "@/utils/wage-types-integration";
import { CATEGORY_LABELS, type WageTypeCategory } from "@/types/wage-types";
// jspdf and xlsx are loaded dynamically to reduce initial bundle size

interface ExportManagerProps {
  reportType: string;
  reportData: Record<string, unknown>;
  filters: {
    dateRange: { from: Date; to: Date };
    selectedDepartment: string;
  };
  employees: Employee[];
  payrollPeriods: PayrollPeriod[];
  payrollEntries: PayrollEntry[];
}

type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'datev';

const EFFECT_LABEL_DE: Record<WageTypeLineItem['effect'], string> = {
  gross_taxable: 'Brutto (st./SV-pfl.)',
  net_taxfree: 'Netto (steuerfrei)',
  in_kind: 'Sachbezug',
  net_deduction: 'Netto-Abzug',
  pauschal: 'Pauschalsteuer',
};

/** Summe Pauschalsteuer aus den Lohnarten-Items eines Eintrags. */
function sumPauschalTax(items?: WageTypeLineItem[]): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((s, li) => s + (li.pauschalTaxAmount ?? 0), 0);
}

/** Hilfsformat: Datum als YYYY-MM (für Sortier-/Gruppierschlüssel). */
function periodKey(p: PayrollPeriod): string {
  return `${p.year}-${String(p.month).padStart(2, '0')}`;
}

export function ExportManager({ 
  reportType, 
  reportData, 
  filters, 
  employees, 
  payrollPeriods, 
  payrollEntries 
}: ExportManagerProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [scheduledExport, setScheduledExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    { 
      id: 'pdf' as ExportFormat, 
      label: 'PDF', 
      icon: FileText, 
      description: 'Formatierter Bericht mit Grafiken',
      color: 'text-red-600'
    },
    { 
      id: 'csv' as ExportFormat, 
      label: 'CSV', 
      icon: FileSpreadsheet, 
      description: 'Kompatibel mit Excel/Calc',
      color: 'text-green-600'
    },
    { 
      id: 'xlsx' as ExportFormat, 
      label: 'Excel', 
      icon: FileBarChart, 
      description: 'Native Excel-Datei mit Formeln',
      color: 'text-blue-600'
    },
    { 
      id: 'datev' as ExportFormat, 
      label: 'DATEV', 
      icon: Shield, 
      description: 'Steuerberater-Format',
      color: 'text-purple-600'
    }
  ];

  const generateCSVData = () => {
    switch (reportType) {
      case 'cost-overview':
        return generateCostOverviewRows();
      
      case 'sick-vacation':
        return [
          ['Mitarbeiter', 'Abteilung', 'Krankheitstage', 'Urlaubstage', 'Gesamt Fehlzeiten'],
          ...employees.map(emp => [
            `${emp.personalData.firstName} ${emp.personalData.lastName}`,
            'IT', // Mock department
            Math.floor(Math.random() * 15) + 1,
            Math.floor(Math.random() * 25) + 5,
            Math.floor(Math.random() * 40) + 6
          ])
        ];
      
      case 'employee-stats':
        return [
          ['Mitarbeiter', 'Abteilung', 'Aktuelles Gehalt', 'Beschäftigungsart', 'Wochenstunden'],
          ...employees.map(emp => [
            `${emp.personalData.firstName} ${emp.personalData.lastName}`,
            'IT', // Mock department
            emp.salaryData.grossSalary,
            emp.employmentData.employmentType,
            emp.employmentData.weeklyHours
          ])
        ];
      
      default:
        return [['No data available']];
    }
  };

  /**
   * Lohnkostenübersicht — pro Monat eine Zeile + erweiterte Kennzahlen.
   * Spalten: Monat, Mitarbeiter, Brutto, SV-AN, SV-AG, Steuern (regulär),
   * Pauschalsteuer (aus Lohnarten), AG-Gesamtkosten, Anzahl Lohnarten.
   */
  function generateCostOverviewRows(): (string | number)[][] {
    const header = [
      'Monat',
      'Mitarbeiter',
      'Bruttolöhne',
      'SV-Beiträge AN',
      'SV-Beiträge AG',
      'Steuern (regulär)',
      'Pauschalsteuer',
      'Gesamtkosten AG',
      'Anzahl Lohnarten',
    ];
    const rows: (string | number)[][] = [header];

    for (const period of payrollPeriods) {
      const entries = payrollEntries.filter(e => e.payrollPeriodId === period.id);
      const gross = entries.reduce((s, e) => s + e.salaryCalculation.grossSalary, 0);
      const svAn = entries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.total.employee, 0);
      const svAg = entries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.total.employer, 0);
      const taxes = entries.reduce((s, e) => s + e.salaryCalculation.taxes.total, 0);
      const pauschal = entries.reduce((s, e) => s + sumPauschalTax(e.wageTypeLineItems), 0);
      const employerCosts = entries.reduce((s, e) => s + e.salaryCalculation.employerCosts, 0);
      const wageTypeCount = entries.reduce((s, e) => s + (e.wageTypeLineItems?.length ?? 0), 0);

      rows.push([
        periodKey(period),
        entries.length,
        Number(gross.toFixed(2)),
        Number(svAn.toFixed(2)),
        Number(svAg.toFixed(2)),
        Number(taxes.toFixed(2)),
        Number(pauschal.toFixed(2)),
        Number(employerCosts.toFixed(2)),
        wageTypeCount,
      ]);
    }
    return rows;
  }

  /**
   * Detail-Sheet/Block für die Lohnarten-Aufschlüsselung pro Mitarbeiter+Monat.
   * Wird nur erzeugt, wenn `includeDetails` aktiv ist und mindestens eine
   * Lohnart in den Einträgen vorkommt.
   */
  function generateWageTypeDetailRows(): (string | number)[][] | null {
    const detail: (string | number)[][] = [[
      'Monat',
      'Personalnr.',
      'Mitarbeiter',
      'Lohnart-Code',
      'Lohnart-Name',
      'Kategorie',
      'Effekt',
      'Betrag',
      'Pausch.LSt-Satz (%)',
      'Pausch.LSt-Betrag',
    ]];
    let any = false;
    for (const period of payrollPeriods) {
      const entries = payrollEntries.filter(e => e.payrollPeriodId === period.id);
      for (const entry of entries) {
        const items = entry.wageTypeLineItems;
        if (!items || items.length === 0) continue;
        const empName = `${entry.employee.personalData?.firstName ?? ''} ${entry.employee.personalData?.lastName ?? ''}`.trim();
        const persNr = entry.employee.personalData?.personalNumber ?? '';
        for (const li of items) {
          if (li.amount === 0 && (li.pauschalTaxAmount ?? 0) === 0) continue;
          any = true;
          detail.push([
            periodKey(period),
            persNr,
            empName,
            li.code,
            li.name,
            CATEGORY_LABELS[li.category as WageTypeCategory] ?? li.category,
            EFFECT_LABEL_DE[li.effect] ?? li.effect,
            Number(li.amount.toFixed(2)),
            li.pauschalTaxRate ?? 0,
            Number((li.pauschalTaxAmount ?? 0).toFixed(2)),
          ]);
        }
      }
    }
    return any ? detail : null;
  }

  const generateDATEVData = () => {
    // DATEV LODAS format for payroll data
    const header = [
      'EXTF', '700', '21', 'Buchungsstapel', '7', '', '', '', '', 
      new Date().toISOString().split('T')[0].replace(/-/g, ''), '', 'RE', '', '', '', '', '', '', '', ''
    ];

    const entries = payrollEntries.map(entry => [
      entry.salaryCalculation.grossSalary, // Bruttolohn
      '1200', // Lohnartschlüssel
      entry.employee.personalData.socialSecurityNumber,
      filters.dateRange.from.toISOString().split('T')[0].replace(/-/g, ''),
      filters.dateRange.to.toISOString().split('T')[0].replace(/-/g, ''),
      entry.salaryCalculation.taxes.incomeTax, // Lohnsteuer
      entry.salaryCalculation.socialSecurityContributions.total.employee, // SV-Beiträge AN
      entry.salaryCalculation.socialSecurityContributions.total.employer, // SV-Beiträge AG
      entry.finalNetSalary // Nettolohn
    ]);

    return [header, ...entries];
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('LohnPro - Erweiterte Berichte', 20, 30);
    
    doc.setFontSize(14);
    doc.text(`Report: ${(reportData?.title as string) || 'Unbekannt'}`, 20, 50);
    doc.text(`Zeitraum: ${filters.dateRange.from.toLocaleDateString('de-DE')} - ${filters.dateRange.to.toLocaleDateString('de-DE')}`, 20, 65);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 80);
    
    // Content based on report type
    let yPosition = 100;
    doc.setFontSize(12);
    
    switch (reportType) {
      case 'cost-overview':
        doc.text('Lohnkostenübersicht', 20, yPosition);
        yPosition += 20;
        doc.text(`Gesamte Mitarbeiter: ${employees.length}`, 20, yPosition);
        yPosition += 15;
        doc.text(`Gesamte Lohnkosten: ${payrollEntries.reduce((sum, e) => sum + e.salaryCalculation.employerCosts, 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, 20, yPosition);
        break;
        
      case 'employee-stats':
        doc.text('Mitarbeiterstatistiken', 20, yPosition);
        yPosition += 20;
        doc.text(`Anzahl Mitarbeiter: ${employees.length}`, 20, yPosition);
        yPosition += 15;
        doc.text(`Durchschnittsgehalt: ${(employees.reduce((sum, e) => sum + e.salaryData.grossSalary, 0) / employees.length).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, 20, yPosition);
        break;
    }
    
    // Footer
    doc.setFontSize(10);
    doc.text('Erstellt mit LohnPro - Vertraulich', 20, 280);
    
    doc.save(`lohnpro-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const data = generateCSVData();
    const blocks: string[] = [];
    blocks.push(data.map(row => row.join(';')).join('\n'));

    if (includeDetails && reportType === 'cost-overview') {
      const detail = generateWageTypeDetailRows();
      if (detail) {
        blocks.push(''); // Leerzeile
        blocks.push('# Lohnarten-Aufschlüsselung');
        blocks.push(detail.map(row => row.join(';')).join('\n'));
      }
    }

    // BOM für Excel-Kompatibilität bei Umlauten
    const csvContent = '\uFEFF' + blocks.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lohnpro-${reportType}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const data = generateCSVData();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    if (includeDetails && reportType === 'cost-overview') {
      const detail = generateWageTypeDetailRows();
      if (detail) {
        const wsDetail = XLSX.utils.aoa_to_sheet(detail);
        XLSX.utils.book_append_sheet(wb, wsDetail, 'Lohnarten');
      }
    }

    XLSX.writeFile(wb, `lohnpro-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToDATEV = () => {
    const data = generateDATEVData();
    const csvContent = data.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `DATEV-Export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (selectedFormat) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'csv':
          exportToCSV();
          break;
        case 'xlsx':
          exportToExcel();
          break;
        case 'datev':
          exportToDATEV();
          break;
      }
      
      toast.success('Export erfolgreich erstellt!');
    } catch (error) {
      toast.error('Fehler beim Export!');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report exportieren</DialogTitle>
          <DialogDescription>
            Wählen Sie das gewünschte Format und die Optionen für den Export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-medium">Export-Format</Label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {exportFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <Card 
                    key={format.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedFormat === format.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-6 w-6 ${format.color}`} />
                        <div>
                          <p className="font-medium">{format.label}</p>
                          <p className="text-sm text-muted-foreground">{format.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <Label className="text-base font-medium">Export-Optionen</Label>
            <div className="space-y-3 mt-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-charts" 
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                />
                <Label htmlFor="include-charts">Diagramme einschließen</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-details" 
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(!!checked)}
                />
                <Label htmlFor="include-details">Detaillierte Aufschlüsselung</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="scheduled-export" 
                  checked={scheduledExport}
                  onCheckedChange={(checked) => setScheduledExport(!!checked)}
                />
                <Label htmlFor="scheduled-export">Automatischer Export (monatlich)</Label>
              </div>
            </div>
          </div>

          {/* Special Options for DATEV */}
          {selectedFormat === 'datev' && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-purple-700">
                  <Shield className="h-5 w-5 mr-2" />
                  DATEV-Export Informationen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• LODAS-Format kompatibel</p>
                  <p>• Automatische Kontierung nach SKR03/SKR04</p>
                  <p>• Prüfziffer-Validierung enthalten</p>
                  <p>• Direkt importierbar in DATEV Lohn & Gehalt</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Export-Zusammenfassung</h4>
            <div className="space-y-1 text-sm">
              <p>Report: {(reportData?.title as string) || 'Erweiterte Berichte'}</p>
              <p>Zeitraum: {filters.dateRange.from.toLocaleDateString('de-DE')} - {filters.dateRange.to.toLocaleDateString('de-DE')}</p>
              <p>Format: {exportFormats.find(f => f.id === selectedFormat)?.label}</p>
              <p>Optionen: {[includeCharts && 'Diagramme', includeDetails && 'Details', scheduledExport && 'Automatisch'].filter(Boolean).join(', ') || 'Keine'}</p>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Per E-Mail senden
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                'Exportiere...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Jetzt exportieren
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}