import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { NetworkErrorAlert } from "@/components/ui/network-error-alert";
import { Button } from "@/components/ui/button";
import { useSupabasePayroll } from "@/hooks/use-supabase-payroll";
import { useEmployees } from "@/contexts/employee-context";
import { CreatePayrollDialog } from "./create-payroll-dialog";
import { PayrollDetail } from "./payroll-detail";
import { PayrollJournal } from "./payroll-journal";
import { EmployeePayrollAccount } from "./employee-payroll-account";
import { ManualPayrollEntry } from "./manual-payroll-entry";
import { SystemEnhancementProposal } from "./system-enhancement-proposal";
import { TaxCalculationSettings } from "./tax-calculation-settings";
import { TimePayrollSync } from "./time-payroll-sync";
import { PayrollQuickActions } from "./payroll-quick-actions";
import { PayrollStatsCards } from "./payroll-stats-cards";
import { PayrollPeriodsList } from "./payroll-periods-list";
import { PayrollSubViewWrapper } from "./payroll-sub-view-wrapper";
import { MonthlyCloseChecklist } from "./monthly-close-checklist";
import { PeriodCloseSummary } from "./period-close-summary";
import { PauschalsteuerOverview } from "./pauschalsteuer-overview";
import { U1U2Overview } from "./u1-u2-overview";

interface PayrollDashboardProps {
  onBack: () => void;
  onShowSpecialPayments?: () => void;
  onShowAutomation?: () => void;
  onShowGuardian?: () => void;
  onShowLohnkonto?: () => void;
  onShowMonthlyWizard?: () => void;
  onShowFibu?: () => void;
}

export function PayrollDashboard({ onBack, onShowSpecialPayments, onShowAutomation, onShowGuardian, onShowLohnkonto, onShowMonthlyWizard, onShowFibu }: PayrollDashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'journal' | 'account' | 'manual' | 'settings' | 'enhancements' | 'time-sync'>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const { payrollPeriods, payrollEntries, getPayrollReport, deletePayrollPeriod, error: payrollError } = useSupabasePayroll();
  const { employees } = useEmployees();

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPayrollId(null);
    setSelectedEmployeeId(null);
  };

  const sortedPeriods = [...payrollPeriods].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  // Sub-view routing
  if (selectedPayrollId && currentView === 'detail') {
    return <PayrollDetail payrollId={selectedPayrollId} onBack={handleBackToDashboard} />;
  }

  if (currentView === 'journal') {
    return (
      <PayrollJournal
        onBack={handleBackToDashboard}
        onViewAccount={(employeeId) => {
          setSelectedEmployeeId(employeeId);
          setCurrentView('account');
        }}
      />
    );
  }

  if (currentView === 'account' && selectedEmployeeId) {
    return <EmployeePayrollAccount employeeId={selectedEmployeeId} onBack={handleBackToDashboard} />;
  }

  if (currentView === 'manual') {
    return (
      <PayrollSubViewWrapper title="Manuelle Lohnabrechnung" description="Manuelle Erfassung von Arbeitszeiten und Zuschlägen" onBack={handleBackToDashboard}>
        <ManualPayrollEntry />
      </PayrollSubViewWrapper>
    );
  }

  if (currentView === 'settings') {
    return (
      <PayrollSubViewWrapper title="Steuerberechnungs-Einstellungen" description="Konfiguration der Lohnsteuer- und Sozialabgabenberechnung" onBack={handleBackToDashboard}>
        <TaxCalculationSettings onSettingsChange={() => {}} />
      </PayrollSubViewWrapper>
    );
  }

  if (currentView === 'enhancements') {
    return (
      <PayrollSubViewWrapper title="System-Erweiterungen" description="Vorschläge für zusätzliche Funktionen des Lohnverarbeitungssystems" onBack={handleBackToDashboard}>
        <SystemEnhancementProposal />
      </PayrollSubViewWrapper>
    );
  }

  if (currentView === 'time-sync') {
    return (
      <PayrollSubViewWrapper title="Zeiterfassung synchronisieren" description="Arbeitszeiten aus Zeiterfassung in Lohnabrechnung übernehmen" onBack={handleBackToDashboard}>
        <TimePayrollSync onSyncComplete={handleBackToDashboard} />
      </PayrollSubViewWrapper>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {payrollError && (
        <NetworkErrorAlert
          error={payrollError}
          onRetry={() => window.location.reload()}
          context="Abrechnungsdaten konnten nicht geladen werden"
        />
      )}
      <div className="text-center pb-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Lohnabrechnung</h1>
        <p className="text-muted-foreground mt-2">Monatliche Lohnabrechnung für alle Mitarbeiter</p>
      </div>

      <PayrollQuickActions
        onShowSpecialPayments={onShowSpecialPayments}
        onShowAutomation={onShowAutomation}
        onShowGuardian={onShowGuardian}
        onShowLohnkonto={onShowLohnkonto}
        onShowMonthlyWizard={onShowMonthlyWizard}
        onShowFibu={onShowFibu}
        onShowJournal={() => setCurrentView('journal')}
        onShowManual={() => setCurrentView('manual')}
        onShowTimeSync={() => setCurrentView('time-sync')}
        onShowSettings={() => setCurrentView('settings')}
        onCreatePayroll={() => setShowCreateDialog(true)}
        sortedPeriods={sortedPeriods}
        payrollEntries={payrollEntries}
      />

      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </Button>
      </div>

      <PayrollStatsCards payrollPeriods={payrollPeriods} totalEmployees={employees.length} />

      <PayrollPeriodsList
        sortedPeriods={sortedPeriods}
        getPayrollReport={getPayrollReport}
        onViewDetail={(id) => {
          setSelectedPayrollId(id);
          setCurrentView('detail');
        }}
        onDeletePeriod={deletePayrollPeriod}
        onCreatePayroll={() => setShowCreateDialog(true)}
      />

      <PeriodCloseSummary />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PauschalsteuerOverview />
        <U1U2Overview />
      </div>

      <MonthlyCloseChecklist />

      <CreatePayrollDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
