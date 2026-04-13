import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard";
import { SpecialPaymentsManager } from "@/components/payroll/special-payments-manager";
import { AutomationDashboard } from "@/components/automation/automation-dashboard";
import { PayrollGuardianDashboard } from "@/components/payroll/payroll-guardian-dashboard";
import { LohnkontoPage } from "@/components/payroll/lohnkonto-page";

type PayrollView = 'dashboard' | 'special-payments' | 'automation' | 'guardian' | 'lohnkonto';

export default function Payroll() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<PayrollView>('dashboard');

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  return (
    <MainLayout>
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
