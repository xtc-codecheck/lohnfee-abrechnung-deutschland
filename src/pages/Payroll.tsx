import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard";
import { DetailedPayrollCalculation } from "@/components/payroll/detailed-payroll-calculation";
import { SpecialPaymentsManager } from "@/components/payroll/special-payments-manager";
import { AutomationDashboard } from "@/components/automation/automation-dashboard";

type PayrollView = 'dashboard' | 'special-payments' | 'automation';

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
          onBack={() => navigate("/")}
          onShowSpecialPayments={() => setCurrentView('special-payments')}
          onShowAutomation={() => setCurrentView('automation')}
        />
      )}
      {currentView === 'special-payments' && (
        <SpecialPaymentsManager onBack={handleBack} />
      )}
      {currentView === 'automation' && (
        <AutomationDashboard onBack={handleBack} />
      )}
    </MainLayout>
  );
}