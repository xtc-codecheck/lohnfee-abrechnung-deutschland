import { useState } from "react";
import { ArrowLeft, Plus, FileText, Calendar, DollarSign, Users, Eye, Trash2, BookOpen, User, Baby, Settings, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreatePayrollDialog } from "./create-payroll-dialog";
import { PayrollDetail } from "./payroll-detail";
import { PayrollJournal } from "./payroll-journal";
import { EmployeePayrollAccount } from "./employee-payroll-account";
import { ManualPayrollEntry } from "./manual-payroll-entry";
import { SystemEnhancementProposal } from "./system-enhancement-proposal";
import { TaxCalculationSettings } from "./tax-calculation-settings";
import { PayrollStatus } from "@/types/payroll";

interface PayrollDashboardProps {
  onBack: () => void;
  onShowSpecialPayments?: () => void;
  onShowAutomation?: () => void;
}

export function PayrollDashboard({ onBack, onShowSpecialPayments, onShowAutomation }: PayrollDashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'journal' | 'account' | 'manual' | 'settings' | 'enhancements'>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const { payrollPeriods, getPayrollReport, deletePayrollPeriod } = usePayrollStorage();
  const { employees } = useEmployeeStorage();

  const getStatusColor = (status: PayrollStatus) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'calculated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'approved': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'finalized': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: PayrollStatus) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'calculated': return 'Berechnet';
      case 'approved': return 'Genehmigt';
      case 'paid': return 'Ausgezahlt';
      case 'finalized': return 'Abgeschlossen';
      default: return status;
    }
  };

  const handleDeletePayroll = (periodId: string) => {
    deletePayrollPeriod(periodId);
  };

  const handleViewJournal = () => {
    setCurrentView('journal');
  };

  const handleViewAccount = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setCurrentView('account');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPayrollId(null);
    setSelectedEmployeeId(null);
  };

  const sortedPeriods = [...payrollPeriods].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  // Statistiken für das Dashboard
  const stats = {
    totalPeriods: payrollPeriods.length,
    activePeriods: payrollPeriods.filter(p => p.status !== 'finalized').length,
    totalEmployees: employees.length,
    lastProcessed: payrollPeriods
      .filter(p => p.processedAt)
      .sort((a, b) => (b.processedAt!.getTime() - a.processedAt!.getTime()))[0]
  };

  if (selectedPayrollId && currentView === 'detail') {
    return (
      <PayrollDetail 
        payrollId={selectedPayrollId} 
        onBack={handleBackToDashboard} 
      />
    );
  }

  if (currentView === 'journal') {
    return (
      <PayrollJournal 
        onBack={handleBackToDashboard}
        onViewAccount={handleViewAccount}
      />
    );
  }

  if (currentView === 'account' && selectedEmployeeId) {
    return (
      <EmployeePayrollAccount 
        employeeId={selectedEmployeeId} 
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'manual') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manuelle Lohnabrechnung</h1>
            <p className="text-muted-foreground">Manuelle Erfassung von Arbeitszeiten und Zuschlägen</p>
          </div>
          <Button onClick={() => setCurrentView('dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>
        </div>
        <ManualPayrollEntry />
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Steuerberechnungs-Einstellungen</h1>
            <p className="text-muted-foreground">Konfiguration der Lohnsteuer- und Sozialabgabenberechnung</p>
          </div>
          <Button onClick={() => setCurrentView('dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>
        </div>
        <TaxCalculationSettings onSettingsChange={() => {}} />
      </div>
    );
  }

  if (currentView === 'enhancements') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System-Erweiterungen</h1>
            <p className="text-muted-foreground">Vorschläge für zusätzliche Funktionen des Lohnverarbeitungssystems</p>
          </div>
          <Button onClick={() => setCurrentView('dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>
        </div>
        <SystemEnhancementProposal />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Lohnabrechnung"
        description="Monatliche Lohnabrechnung für alle Mitarbeiter"
      >
        <div className="flex gap-3">
          <Button 
            onClick={() => onShowSpecialPayments?.()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Baby className="h-4 w-4" />
            Spez. Lohnarten
          </Button>
          <Button 
            onClick={() => onShowAutomation?.()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Automatisierung
          </Button>
          <Button 
            onClick={handleViewJournal}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Lohnjournal
          </Button>
          <Button 
            onClick={() => setCurrentView('manual')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Manuelle Erfassung
          </Button>
          <Button 
            onClick={() => setCurrentView('settings')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Einstellungen
          </Button>
          <Button 
            onClick={() => setCurrentView('enhancements')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            System-Erweiterungen
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Neue Abrechnung
          </Button>
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        </div>
      </PageHeader>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abrechnungsperioden</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalPeriods}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePeriods} aktiv
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Zu berücksichtigen
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Letzte Abrechnung</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-accent">
              {stats.lastProcessed 
                ? `${stats.lastProcessed.month.toString().padStart(2, '0')}/${stats.lastProcessed.year}`
                : 'Keine'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastProcessed?.processedAt 
                ? stats.lastProcessed.processedAt.toLocaleDateString('de-DE')
                : 'Noch keine Abrechnung'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-warning">
              {stats.activePeriods > 0 ? 'Aktiv' : 'Bereit'}
            </div>
            <p className="text-xs text-muted-foreground">
              System bereit für neue Abrechnungen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abrechnungsperioden Liste */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Abrechnungsperioden</CardTitle>
          <CardDescription>Übersicht aller Lohnabrechnungen</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPeriods.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Noch keine Abrechnungen
              </h3>
              <p className="text-muted-foreground mb-4">
                Erstellen Sie die erste monatliche Lohnabrechnung.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Erste Abrechnung erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPeriods.map((period) => {
                const report = getPayrollReport(period.id);
                return (
                  <div
                    key={period.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {period.month.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {new Date(period.year, period.month - 1).toLocaleDateString('de-DE', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(period.status)}>
                            {getStatusLabel(period.status)}
                          </Badge>
                          {report && (
                            <span className="text-sm text-muted-foreground">
                              {report.entries.length} Mitarbeiter • {
                                report.summary.totalNetSalary.toLocaleString('de-DE', { 
                                  style: 'currency', 
                                  currency: 'EUR' 
                                })
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedPayrollId(period.id);
                          setCurrentView('detail');
                        }}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </Button>
                      {period.status === 'draft' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1 text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Abrechnung löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Möchten Sie die Abrechnung für {new Date(period.year, period.month - 1).toLocaleDateString('de-DE', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePayroll(period.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreatePayrollDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}