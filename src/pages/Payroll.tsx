import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { Loader2 } from "lucide-react";

// Heavy sub-views – lazy-loaded um den initialen Payroll-Chunk klein zu halten.
const SpecialPaymentsManager = lazy(() =>
  import("@/components/payroll/special-payments-manager").then(m => ({ default: m.SpecialPaymentsManager }))
);
const AutomationDashboard = lazy(() =>
  import("@/components/automation/automation-dashboard").then(m => ({ default: m.AutomationDashboard }))
);
const PayrollGuardianDashboard = lazy(() =>
  import("@/components/payroll/payroll-guardian-dashboard").then(m => ({ default: m.PayrollGuardianDashboard }))
);
const LohnkontoPage = lazy(() =>
  import("@/components/payroll/lohnkonto-page").then(m => ({ default: m.LohnkontoPage }))
);
const MonthlyPayrollWizard = lazy(() =>
  import("@/components/payroll/monthly-payroll-wizard").then(m => ({ default: m.MonthlyPayrollWizard }))
);
const FibuJournalPage = lazy(() =>
  import("@/components/payroll/fibu-journal").then(m => ({ default: m.FibuJournalPage }))
);

function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

type PayrollView = 'dashboard' | 'special-payments' | 'automation' | 'guardian' | 'lohnkonto' | 'monthly-wizard' | 'fibu';

const viewLabels: Record<Exclude<PayrollView, 'dashboard'>, string> = {
  'special-payments': 'Sonderzahlungen',
  'automation': 'Automatisierung',
  'guardian': 'Payroll Guardian',
  'lohnkonto': 'Lohnkonto',
  'monthly-wizard': 'Monatsabrechnung',
  'fibu': 'Finanzbuchhaltung',
};

export default function Payroll() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<PayrollView>('dashboard');

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  const breadcrumbSegments = currentView === 'dashboard'
    ? []
    : [
        { label: "Abrechnung", path: "/payroll" },
        { label: viewLabels[currentView] },
      ];

  return (
    <MainLayout>
      <PageSeo title="Lohnabrechnung" description="Lohnabrechnungen erstellen, Sonderzahlungen verwalten und DATEV-Export durchführen." path="/payroll" />
      {breadcrumbSegments.length > 0 && <AppBreadcrumb segments={breadcrumbSegments} />}
      {currentView === 'dashboard' && (
        <PayrollDashboard 
          onBack={() => navigate("/dashboard")}
          onShowSpecialPayments={() => setCurrentView('special-payments')}
          onShowAutomation={() => setCurrentView('automation')}
          onShowGuardian={() => setCurrentView('guardian')}
          onShowLohnkonto={() => setCurrentView('lohnkonto')}
          onShowMonthlyWizard={() => setCurrentView('monthly-wizard')}
          onShowFibu={() => setCurrentView('fibu')}
        />
      )}
      {currentView === 'special-payments' && (
        <SpecialPaymentsManager onBack={handleBack} />
      )}
      {currentView === 'automation' && (
        <AutomationDashboard onBack={handleBack} />
      )}
      {currentView === 'guardian' && (
        <PayrollGuardianDashboard onBack={handleBack} />
      )}
      {currentView === 'lohnkonto' && (
        <LohnkontoPage onBack={handleBack} />
      )}
      {currentView === 'monthly-wizard' && (
        <MonthlyPayrollWizard onBack={handleBack} onComplete={handleBack} />
      )}
      {currentView === 'fibu' && (
        <FibuJournalPage onBack={handleBack} />
      )}
    </MainLayout>
  );
}