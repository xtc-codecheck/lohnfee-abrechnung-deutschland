import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { EmployeeDashboard } from "@/components/employees/employee-dashboard";
import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { SalaryCalculator } from "@/components/salary/salary-calculator";

type EmployeeView = 'dashboard' | 'add-employee' | 'salary-calculator';

export default function Employees() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<EmployeeView>('dashboard');
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

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  const handleSaveEmployee = (data: any) => {
    console.log('Mitarbeiter speichern:', data);
    setCurrentView('dashboard');
  };

  return (
    <MainLayout>
      {currentView === 'dashboard' && (
        <EmployeeDashboard 
          onAddEmployee={handleAddEmployee}
          onCalculateSalary={handleCalculateSalary}
          onShowPayroll={() => navigate("/payroll")}
          onShowCompliance={() => {/* TODO: Implement compliance view */}}
          onShowReports={() => {/* TODO: Implement reports view */}}
          onShowTimeTracking={() => {/* TODO: Implement time tracking view */}}
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
    </MainLayout>
  );
}