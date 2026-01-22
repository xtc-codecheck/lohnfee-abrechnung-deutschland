import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { EmployeeDashboard } from "@/components/employees/employee-dashboard";
import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { SalaryCalculator } from "@/components/salary/salary-calculator";
import { UltimateSalaryCalculator } from "@/components/salary/ultimate-salary-calculator";
import { QuickSalaryCalculator } from "@/components/salary/quick-salary-calculator";
import { TimeTrackingDashboard } from "@/components/time-tracking/time-tracking-dashboard";
import { WorkingTimeAccounts } from "@/components/time-tracking/working-time-accounts";
import { ComplianceDashboard } from "@/components/compliance/compliance-dashboard";
import { AdvancedReports } from "@/components/reports/advanced-reports";
import { SpecialPaymentsManager } from "@/components/payroll/special-payments-manager";
import { AdvancedPayrollDashboard } from "@/components/payroll/advanced-payroll-dashboard";
import { AuthoritiesIntegration } from "@/components/integration/authorities-integration";
import { AutomationDashboard } from "@/components/automation/automation-dashboard";
import { ExtendedCalculations } from "@/components/calculations/extended-calculations";

type EmployeeView = 'dashboard' | 'add-employee' | 'salary-calculator' | 'quick-salary-calculator' | 'ultimate-calculator' | 'time-tracking' | 'working-time-accounts' | 'compliance' | 'reports' | 'advanced-payroll' | 'authorities' | 'extended-calc';

export default function Employees() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<EmployeeView>('dashboard');
  const [employeeData, setEmployeeData] = useState<any>(null);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'salary-calculator') {
      setCurrentView('quick-salary-calculator');
    }
  }, [searchParams]);

  const handleAddEmployee = () => {
    setCurrentView('add-employee');
  };

  const handleCalculateSalary = (data?: any) => {
    if (data) {
      setEmployeeData(data);
      setCurrentView('salary-calculator');
    } else {
      setCurrentView('quick-salary-calculator');
    }
  };

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  const handleSaveEmployee = (data: any) => {
    // Mitarbeiter wird über useEmployeeStorage gespeichert
    setCurrentView('dashboard');
  };

  return (
    <MainLayout>
      {currentView === 'dashboard' && (
        <EmployeeDashboard 
          onAddEmployee={handleAddEmployee}
          onCalculateSalary={handleCalculateSalary}
          onShowCompliance={() => setCurrentView('compliance')}
          onShowReports={() => setCurrentView('reports')}
          onShowTimeTracking={() => setCurrentView('time-tracking')}
          onShowAdvancedPayroll={() => setCurrentView('advanced-payroll')}
          onShowAuthorities={() => setCurrentView('authorities')}
          onShowExtendedCalc={() => setCurrentView('extended-calc')}
        />
      )}
      {currentView === 'add-employee' && (
        <AddEmployeeForm 
          onBack={handleBack}
          onSave={handleSaveEmployee}
          onCalculate={handleCalculateSalary}
        />
      )}
      {currentView === 'salary-calculator' && (
        <SalaryCalculator 
          onBack={handleBack}
          employeeData={employeeData}
        />
      )}
      {currentView === 'quick-salary-calculator' && (
        <UltimateSalaryCalculator 
          onBack={handleBack}
        />
      )}
      {currentView === 'ultimate-calculator' && (
        <UltimateSalaryCalculator 
          onBack={handleBack}
        />
      )}
      {currentView === 'time-tracking' && (
        <TimeTrackingDashboard 
          onBack={handleBack}
        />
      )}
      {currentView === 'working-time-accounts' && (
        <WorkingTimeAccounts 
          onBack={handleBack}
        />
      )}
      {currentView === 'compliance' && (
        <ComplianceDashboard onBack={handleBack} />
      )}
      {currentView === 'reports' && (
        <AdvancedReports onBack={handleBack} />
      )}
      {currentView === 'advanced-payroll' && (
        <AdvancedPayrollDashboard onBack={handleBack} />
      )}
      {currentView === 'authorities' && (
        <AuthoritiesIntegration onBack={handleBack} />
      )}
      {currentView === 'extended-calc' && (
        <ExtendedCalculations onBack={handleBack} />
      )}
    </MainLayout>
  );
}