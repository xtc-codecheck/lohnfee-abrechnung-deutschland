import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { EmployeeDashboard } from "@/components/employees/employee-dashboard";
import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { SalaryCalculator } from "@/components/salary/salary-calculator";
import { QuickSalaryCalculator } from "@/components/salary/quick-salary-calculator";
import { TimeTrackingDashboard } from "@/components/time-tracking/time-tracking-dashboard";
import { WorkingTimeAccounts } from "@/components/time-tracking/working-time-accounts";

type EmployeeView = 'dashboard' | 'add-employee' | 'salary-calculator' | 'quick-salary-calculator' | 'time-tracking' | 'working-time-accounts' | 'compliance' | 'reports';

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
          onShowCompliance={() => setCurrentView('compliance')}
          onShowReports={() => setCurrentView('reports')}
          onShowTimeTracking={() => setCurrentView('time-tracking')}
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
        <QuickSalaryCalculator 
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
        <div className="space-y-6 animate-fade-in">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Compliance</h2>
            <p className="text-muted-foreground">Compliance-Modul wird hier implementiert.</p>
            <button onClick={handleBack} className="mt-4 text-primary hover:underline">Zurück zum Dashboard</button>
          </div>
        </div>
      )}
      {currentView === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Erweiterte Berichte</h2>
            <p className="text-muted-foreground">Erweiterte Berichte werden hier implementiert.</p>
            <button onClick={handleBack} className="mt-4 text-primary hover:underline">Zurück zum Dashboard</button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}