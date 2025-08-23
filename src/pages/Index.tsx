import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { EmployeeDashboard } from "@/components/employees/employee-dashboard";
import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { SalaryCalculator } from "@/components/salary/salary-calculator";
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard";
import { ComplianceDashboard } from "@/components/compliance/compliance-dashboard";
import { AdvancedReports } from "@/components/reports/advanced-reports";

type View = 'dashboard' | 'add-employee' | 'salary-calculator' | 'payroll' | 'compliance' | 'reports';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [employeeData, setEmployeeData] = useState<any>(null);

  const handleAddEmployee = () => {
    setCurrentView('add-employee');
  };

  const handleCalculateSalary = (data?: any) => {
    if (data) {
      setEmployeeData(data);
    }
    setCurrentView('salary-calculator');
  };

  const handleShowPayroll = () => {
    setCurrentView('payroll');
  };

  const handleShowCompliance = () => {
    setCurrentView('compliance');
  };

  const handleShowReports = () => {
    setCurrentView('reports');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  const handleSaveEmployee = (data: any) => {
    // TODO: Hier würde die Speicherung in die Datenbank erfolgen
    console.log('Mitarbeiter speichern:', data);
    setCurrentView('dashboard');
  };

  return (
    <MainLayout>
      {currentView === 'dashboard' && (
        <EmployeeDashboard 
          onAddEmployee={handleAddEmployee}
          onCalculateSalary={handleCalculateSalary}
          onShowPayroll={handleShowPayroll}
          onShowCompliance={handleShowCompliance}
          onShowReports={handleShowReports}
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
      {currentView === 'payroll' && (
        <PayrollDashboard 
          onBack={handleBack}
        />
      )}
      {currentView === 'compliance' && (
        <ComplianceDashboard 
          onBack={handleBack}
        />
      )}
      {currentView === 'reports' && (
        <AdvancedReports 
          onBack={handleBack}
        />
      )}
    </MainLayout>
  );
};

export default Index;
