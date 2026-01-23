import { useState } from "react";
import { ArrowLeft, Calculator, FileText, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { PayrollEntry } from "@/types/payroll";
import { useToast } from "@/hooks/use-toast";
import { calculatePayrollEntry, createDefaultWorkingData } from "@/utils/payroll-calculator";
import { formatCurrency } from "@/lib/formatters";

interface PayrollDetailProps {
  payrollId: string;
  onBack: () => void;
}

export function PayrollDetail({ payrollId, onBack }: PayrollDetailProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { 
    getPayrollReport, 
    addPayrollEntry, 
    updatePayrollPeriodStatus,
    getPayrollEntriesForPeriod 
  } = usePayrollStorage();
  const { employees } = useEmployeeStorage();
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

  const handleCalculatePayroll = async () => {
    setIsCalculating(true);
    
    try {
      // Für jeden Mitarbeiter eine Abrechnung erstellen
      for (const employee of employees) {
        const payrollEntry = calculatePayrollForEmployee(employee.id);
        if (payrollEntry) {
          addPayrollEntry(payrollEntry);
        }
      }

      // Status auf "calculated" setzen
      updatePayrollPeriodStatus(payrollId, 'calculated');
      
      toast({
        title: "Abrechnung berechnet",
        description: `Lohnabrechnung für ${employees.length} Mitarbeiter wurde erfolgreich berechnet.`,
      });
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
              <Calculator className="h-4 w-4" />
              {isCalculating ? 'Berechne...' : 'Abrechnung berechnen'}
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
              <CardTitle className="text-sm font-medium">Bruttolohnsumme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(report.summary.totalGrossSalary)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nettolohnsumme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(report.summary.totalNetSalary)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Arbeitgeberkosten</CardTitle>
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
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                >
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}