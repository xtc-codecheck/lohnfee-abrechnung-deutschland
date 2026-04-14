import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { EmployeeDashboard } from "@/components/employees/employee-dashboard";
import { EmployeeWizard } from "@/components/employees/wizard";

interface EmployeeCalcData {
  grossSalary?: number;
  taxClass?: string;
  churchTax?: boolean;
  state?: string;
}

export default function Employees() {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);

  const handleCalculateSalary = (data?: EmployeeCalcData) => {
    if (data) {
      navigate(`/salary-calculator?mode=simple`);
    } else {
      navigate('/salary-calculator');
    }
  };

  return (
    <MainLayout>
      <PageSeo title="Mitarbeiter" description="Mitarbeiter verwalten, Stammdaten pflegen und Gehaltsdaten einsehen." path="/employees" />
      {showWizard ? (
        <EmployeeWizard 
          onBack={() => setShowWizard(false)}
          onSave={() => setShowWizard(false)}
          onCalculate={handleCalculateSalary}
        />
      ) : (
        <EmployeeDashboard 
          onAddEmployee={() => setShowWizard(true)}
          onCalculateSalary={handleCalculateSalary}
          onShowCompliance={() => navigate('/compliance')}
          onShowReports={() => navigate('/reports')}
          onShowTimeTracking={() => navigate('/time-tracking')}
          onShowAdvancedPayroll={() => navigate('/payroll')}
          onShowAuthorities={() => navigate('/authorities')}
          onShowExtendedCalc={() => navigate('/extended-calculations')}
        />
      )}
    </MainLayout>
  );
}
