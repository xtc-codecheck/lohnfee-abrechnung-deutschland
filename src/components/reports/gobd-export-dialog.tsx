/**
 * GoBD-konformer Datenexport für Betriebsprüfungen
 */
import { useState } from 'react';
import { Loader2, Shield, Download, FileArchive, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import {
  generateGDPdUIndexXml,
  generateEmployeeCSV,
  generatePayrollCSV,
  generateJournalCSV,
  generateExportProtocol,
  calculateChecksum,
  GoBDExportConfig,
  GoBDEmployeeRecord,
  GoBDPayrollRecord,
  GoBDJournalRecord,
} from '@/utils/gobd-export';

export function GoBDExportDialog() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthFrom, setMonthFrom] = useState(1);
  const [monthTo, setMonthTo] = useState(12);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');

  const handleExport = async () => {
    if (!tenantId) return;
    setLoading(true);
    setProgress(0);

    try {
      // 1. Firmendaten laden
      setStep('Firmendaten laden...');
      setProgress(10);
      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const config: GoBDExportConfig = {
        companyName: company?.company_name || 'Unbekannt',
        taxNumber: company?.tax_number || '',
        betriebsnummer: company?.betriebsnummer || '',
        exportYear: year,
        exportMonthFrom: monthFrom,
        exportMonthTo: monthTo,
        createdBy: 'LohnPro System',
      };

      // 2. Mitarbeiterdaten laden
      setStep('Mitarbeiterdaten exportieren...');
      setProgress(25);
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', tenantId);

      const employeeRecords: GoBDEmployeeRecord[] = (employees || []).map(e => ({
        personalNumber: e.personal_number || '',
        firstName: e.first_name,
        lastName: e.last_name,
        dateOfBirth: e.date_of_birth || '',
        taxId: e.tax_id || '',
        svNumber: e.sv_number || '',
        taxClass: e.tax_class || 1,
        healthInsurance: e.health_insurance || '',
        entryDate: e.entry_date || '',
        exitDate: e.exit_date || '',
        department: e.department || '',
        grossSalary: Number(e.gross_salary),
      }));

      // 3. Payroll-Daten laden
      setStep('Lohnabrechnungen exportieren...');
      setProgress(45);
      const { data: periods } = await supabase
        .from('payroll_periods')
        .select('id, month, year')
        .eq('tenant_id', tenantId)
        .eq('year', year)
        .gte('month', monthFrom)
        .lte('month', monthTo);

      const periodIds = (periods || []).map(p => p.id);
      const { data: entries } = periodIds.length > 0
        ? await supabase
            .from('payroll_entries')
            .select('*')
            .eq('tenant_id', tenantId)
            .in('payroll_period_id', periodIds)
        : { data: [] };

      const empMap = new Map((employees || []).map(e => [e.id, e]));
      const periodMap = new Map((periods || []).map(p => [p.id, p]));

      const payrollRecords: GoBDPayrollRecord[] = (entries || []).map(e => {
        const emp = empMap.get(e.employee_id);
        const period = periodMap.get(e.payroll_period_id);
        return {
          personalNumber: emp?.personal_number || '',
          employeeName: `${emp?.last_name || ''}, ${emp?.first_name || ''}`,
          year: period?.year || year,
          month: period?.month || 0,
          grossSalary: Number(e.gross_salary),
          incomeTax: Number(e.tax_income_tax || 0),
          solidarityTax: Number(e.tax_solidarity || 0),
          churchTax: Number(e.tax_church || 0),
          svHealthEmployee: Number(e.sv_health_employee || 0),
          svHealthEmployer: Number(e.sv_health_employer || 0),
          svPensionEmployee: Number(e.sv_pension_employee || 0),
          svPensionEmployer: Number(e.sv_pension_employer || 0),
          svUnemploymentEmployee: Number(e.sv_unemployment_employee || 0),
          svUnemploymentEmployer: Number(e.sv_unemployment_employer || 0),
          svCareEmployee: Number(e.sv_care_employee || 0),
          svCareEmployer: Number(e.sv_care_employer || 0),
          totalTax: Number(e.tax_total || 0),
          totalSVEmployee: Number(e.sv_total_employee || 0),
          totalSVEmployer: Number(e.sv_total_employer || 0),
          netSalary: Number(e.net_salary),
          employerCosts: Number(e.employer_costs || 0),
          bonus: Number(e.bonus || 0),
          overtimePay: Number(e.overtime_pay || 0),
          deductions: Number(e.deductions || 0),
          finalNetSalary: Number(e.final_net_salary),
        };
      });

      // 4. Audit-Log laden
      setStep('Änderungsprotokoll exportieren...');
      setProgress(65);
      const { data: auditLogs } = await supabase
        .from('audit_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true })
        .limit(10000);

      const journalRecords: GoBDJournalRecord[] = (auditLogs || []).map(a => ({
        timestamp: a.created_at,
        userId: a.user_id || '',
        action: a.action,
        tableName: a.table_name,
        recordId: a.record_id || '',
        oldValues: JSON.stringify(a.old_values || ''),
        newValues: JSON.stringify(a.new_values || ''),
      }));

      // 5. Dateien generieren
      setStep('GDPdU-Dateien erstellen...');
      setProgress(80);
      const indexXml = generateGDPdUIndexXml(config);
      const employeeCSV = generateEmployeeCSV(employeeRecords);
      const payrollCSV = generatePayrollCSV(payrollRecords);
      const journalCSV = generateJournalCSV(journalRecords);

      // 6. Prüfsummen berechnen
      setStep('Prüfsummen berechnen...');
      setProgress(90);
      const checksums: Record<string, string> = {
        'index.xml': await calculateChecksum(indexXml),
        'stammdaten_mitarbeiter.csv': await calculateChecksum(employeeCSV),
        'lohnabrechnungen.csv': await calculateChecksum(payrollCSV),
        'aenderungsprotokoll.csv': await calculateChecksum(journalCSV),
      };

      const protocol = generateExportProtocol(config, checksums);

      // 7. ZIP-Download (als einzelne Dateien simuliert)
      setStep('Export abschließen...');
      setProgress(100);

      const files = [
        { name: 'index.xml', content: indexXml, type: 'application/xml' },
        { name: 'stammdaten_mitarbeiter.csv', content: employeeCSV, type: 'text/csv' },
        { name: 'lohnabrechnungen.csv', content: payrollCSV, type: 'text/csv' },
        { name: 'aenderungsprotokoll.csv', content: journalCSV, type: 'text/csv' },
        { name: 'pruefprotokoll.txt', content: protocol, type: 'text/plain' },
      ];

      for (const file of files) {
        const blob = new Blob([file.content], { type: `${file.type};charset=utf-8` });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `GoBD_${year}_${file.name}`;
        link.click();
        URL.revokeObjectURL(link.href);
      }

      toast({ title: 'GoBD-Export abgeschlossen', description: `${files.length} Dateien mit Prüfsummen erstellt.` });
    } catch (error) {
      console.error('GoBD export error:', error);
      toast({ title: 'Exportfehler', description: 'Der GoBD-Export konnte nicht erstellt werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setProgress(0);
      setStep('');
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2025, i).toLocaleString('de-DE', { month: 'long' }),
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          GoBD-Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            GoBD-konformer Datenexport
          </DialogTitle>
          <DialogDescription>
            Export für Betriebsprüfungen gemäß §§ 146, 147 AO / GDPdU
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Jahr</Label>
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Von</Label>
              <Select value={String(monthFrom)} onValueChange={v => setMonthFrom(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bis</Label>
              <Select value={String(monthTo)} onValueChange={v => setMonthTo(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Exportumfang</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Stammdaten aller Mitarbeiter</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Lohnabrechnungen mit Steuer/SV-Details</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Vollständiges Änderungsprotokoll</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> GDPdU index.xml Beschreibungsdatei</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> SHA-256 Prüfsummen je Datei</div>
            </CardContent>
          </Card>

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{step}</p>
            </div>
          )}

          <Button className="w-full" onClick={handleExport} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            {loading ? 'Exportiere...' : 'GoBD-Export starten'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Aufbewahrungspflicht: 10 Jahre (§ 147 Abs. 3 AO)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
