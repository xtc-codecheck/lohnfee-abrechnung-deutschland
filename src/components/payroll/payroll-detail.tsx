import { useState } from "react";
import { ArrowLeft, Calculator, FileText, Download, Check, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { HELP } from "@/constants/help-glossary";
import { useSupabasePayroll } from "@/hooks/use-supabase-payroll";
import { useEmployees } from "@/contexts/employee-context";
import { usePayrollGuardian } from "@/hooks/use-payroll-guardian";
import { useTenantEmployeeWageTypes } from "@/hooks/use-tenant-employee-wage-types";
import { PayrollEntry } from "@/types/payroll";
import { useToast } from "@/hooks/use-toast";
import { calculatePayrollEntry, createDefaultWorkingData } from "@/utils/payroll-calculator";
import { formatCurrency } from "@/lib/formatters";
import { buildTaxParamsFromEmployee } from "@/utils/tax-params-factory";
import { AnnualReconciliationDialog } from "./annual-reconciliation-dialog";
import { PayrollCorrectionDialog } from "./payroll-correction-dialog";
import { PreFlightCheckDialog } from "./preflight-check-dialog";
import { TaxBreakdownCard } from "./tax-breakdown-card";
import { AppliedWageTypesCard } from "./applied-wage-types-card";

interface PayrollDetailProps {
  payrollId: string;
  onBack: () => void;
}

export function PayrollDetail({ payrollId, onBack }: PayrollDetailProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [pendingEntries, setPendingEntries] = useState<PayrollEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const {
    getPayrollReport,
    addPayrollEntry,
    updatePayrollPeriodStatus,
    getPayrollEntriesForPeriod
  } = useSupabasePayroll();
  const { employees } = useEmployees();
  const { historicalData, addToHistory } = usePayrollGuardian();
  const { byEmployee: wageTypesByEmployee } = useTenantEmployeeWageTypes();
  const { toast } = useToast();


  const report = getPayrollReport(payrollId);
  
  if (!report) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Abrechnung nicht gefunden</p>
      </div>
    );
  }

  const calculatePayrollForEmployee = (employeeId: string): PayrollEntry | null => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return null;

    try {
      // KORREKTE Berechnung via zentralem Payroll-Calculator
      const result = calculatePayrollEntry({
        employee,
        period: {
          year: report.period.year,
          month: report.period.month,
        },
        workingData: createDefaultWorkingData(employee),
        employeeWageTypes: wageTypesByEmployee.get(employeeId),
      });

      return {
        ...result.entry,
        id: '', // Wird beim Speichern gesetzt
        payrollPeriodId: payrollId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PayrollEntry;
    } catch (error) {
      console.error(`Fehler bei Berechnung für ${employeeId}:`, error);
      return null;
    }
  };

  // Schritt 1: Berechnen + Pre-Flight-Check öffnen (noch NICHT speichern)
  const handleCalculatePayroll = () => {
    setIsCalculating(true);
    try {
      const calculated: PayrollEntry[] = [];
      for (const employee of employees) {
        const payrollEntry = calculatePayrollForEmployee(employee.id);
        if (payrollEntry) calculated.push(payrollEntry);
      }
      if (calculated.length === 0) {
        toast({
          title: "Keine Abrechnungen erzeugt",
          description: "Es konnten keine Abrechnungen berechnet werden. Prüfen Sie die Mitarbeiter-Stammdaten.",
          variant: "destructive",
        });
        return;
      }
      setPendingEntries(calculated);
      setPreflightOpen(true);
    } catch (error) {
      toast({
        title: "Fehler bei der Berechnung",
        description: "Die Lohnabrechnung konnte nicht berechnet werden.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Schritt 2: Nach Pre-Flight-Bestätigung → tatsächlich speichern
  const handleConfirmSave = async () => {
    try {
      for (const entry of pendingEntries) {
        addPayrollEntry(entry);
        // Nach Speichern in Guardian-Historie aufnehmen
        await addToHistory(entry);
      }
      updatePayrollPeriodStatus(payrollId, 'calculated');
      toast({
        title: "Abrechnung gespeichert",
        description: `Lohnabrechnung für ${pendingEntries.length} Mitarbeiter wurde gespeichert.`,
      });
      setPendingEntries([]);
    } catch (error) {
      toast({
        title: "Fehler beim Speichern",
        description: "Die Lohnabrechnungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleApprovePayroll = () => {
    updatePayrollPeriodStatus(payrollId, 'approved');
    toast({
      title: "Abrechnung genehmigt",
      description: "Die Lohnabrechnung wurde zur Auszahlung freigegeben.",
    });
  };

  const entries = getPayrollEntriesForPeriod(payrollId);
  const hasEntries = entries.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Lohnabrechnung ${new Date(report.period.year, report.period.month - 1).toLocaleDateString('de-DE', { 
          month: 'long', 
          year: 'numeric' 
        })}`}
        description={`Status: ${report.period.status === 'draft' ? 'Entwurf' : 
                              report.period.status === 'calculated' ? 'Berechnet' : 
                              report.period.status === 'approved' ? 'Genehmigt' : 
                              report.period.status === 'paid' ? 'Ausgezahlt' : 'Abgeschlossen'}`}
      >
        <div className="flex gap-3">
          {!hasEntries && report.period.status === 'draft' && (
            <Button 
              onClick={handleCalculatePayroll}
              disabled={isCalculating}
              className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
            >
              <ShieldCheck className="h-4 w-4" />
              {isCalculating ? 'Prüfe...' : 'Berechnen & prüfen'}
            </Button>
          )}
          {hasEntries && report.period.status === 'calculated' && (
            <Button 
              onClick={handleApprovePayroll}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              Genehmigen
            </Button>
          )}
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        </div>
      </PageHeader>

      {/* Zusammenfassung */}
      {hasEntries && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{report.summary.totalEmployees}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                Bruttolohnsumme
                <HelpTooltip content={HELP.grossSalary.help} example={HELP.grossSalary.example} hint={HELP.grossSalary.hint} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(report.summary.totalGrossSalary)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                Nettolohnsumme
                <HelpTooltip content="Summe aller Auszahlungsbeträge nach Abzug von Lohnsteuer, Soli, Kirchensteuer und SV-Beiträgen." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(report.summary.totalNetSalary)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                Arbeitgeberkosten
                <HelpTooltip
                  content="Bruttolohn + AG-Anteile zur Sozialversicherung + Umlagen U1/U2/U3. Die tatsächlichen Gesamtkosten pro Lohnlauf."
                  example="Brutto 3.500€ → AG-Kosten ca. 4.200€"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(report.summary.totalEmployerCosts)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mitarbeiter-Abrechnungen */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Mitarbeiter-Abrechnungen</CardTitle>
          <CardDescription>
            {hasEntries ? 'Detailansicht der berechneten Lohnabrechnungen' : 'Noch keine Abrechnungen berechnet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasEntries ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Abrechnung noch nicht berechnet
              </h3>
              <p className="text-muted-foreground mb-4">
                Klicken Sie auf "Abrechnung berechnen", um die Lohnabrechnungen für alle Mitarbeiter zu erstellen.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {entry.employee.personalData.firstName[0]}{entry.employee.personalData.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {entry.employee.personalData.firstName} {entry.employee.personalData.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Brutto: {formatCurrency(entry.salaryCalculation.grossSalary)} • 
                          Netto: {formatCurrency(entry.finalNetSalary)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedId(expandedId === entry.id ? null : entry.id)
                        }
                        className="flex items-center gap-1"
                        aria-expanded={expandedId === entry.id}
                        aria-label="Steuerberechnung anzeigen"
                      >
                        {expandedId === entry.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        Steuer-Details
                      </Button>
                      <AnnualReconciliationDialog
                        employeeId={entry.employeeId}
                        employeeName={`${entry.employee.personalData.firstName} ${entry.employee.personalData.lastName}`}
                        taxParams={buildTaxParamsFromEmployee(entry.employee)}
                      />
                      <PayrollCorrectionDialog
                        periodLabel={`${report.period.month}/${report.period.year}`}
                        originalGross={entry.salaryCalculation.grossSalary}
                        originalNet={entry.finalNetSalary}
                        originalTax={entry.salaryCalculation.taxes.total}
                        originalSV={entry.salaryCalculation.socialSecurityContributions.total.employee}
                      />
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    </div>
                  </div>
                  {expandedId === entry.id && (
                    <div className="p-4 bg-muted/20 border-t border-border animate-fade-in">
                      <TaxBreakdownCard entry={entry} year={report.period.year} />
                      <div className="mt-4">
                        <AppliedWageTypesCard
                          items={wageTypesByEmployee.get(entry.employeeId)}
                          reference={new Date(report.period.year, report.period.month - 1, 15)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PreFlightCheckDialog
        open={preflightOpen}
        onOpenChange={setPreflightOpen}
        employees={employees}
        entries={pendingEntries}
        history={historicalData}
        confirmLabel="Trotzdem speichern"
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}
