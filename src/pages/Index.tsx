import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { EmployeeDashboard } from "@/components/employees/employee-dashboard";
import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { SalaryCalculator } from "@/components/salary/salary-calculator";

type View = 'dashboard' | 'add-employee' | 'salary-calculator';

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
};

export default Index;
