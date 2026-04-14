import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard";
import { SpecialPaymentsManager } from "@/components/payroll/special-payments-manager";
import { AutomationDashboard } from "@/components/automation/automation-dashboard";
import { PayrollGuardianDashboard } from "@/components/payroll/payroll-guardian-dashboard";
import { LohnkontoPage } from "@/components/payroll/lohnkonto-page";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";

type PayrollView = 'dashboard' | 'special-payments' | 'automation' | 'guardian' | 'lohnkonto';

const viewLabels: Record<Exclude<PayrollView, 'dashboard'>, string> = {
  'special-payments': 'Sonderzahlungen',
  'automation': 'Automatisierung',
  'guardian': 'Payroll Guardian',
  'lohnkonto': 'Lohnkonto',
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
    </MainLayout>
  );
}
