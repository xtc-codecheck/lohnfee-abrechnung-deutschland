import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { EmployeeDashboard } from "@/components/employees/employee-dashboard";

export default function Employees() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <EmployeeDashboard 
        onAddEmployee={() => {/* TODO: Implement add employee functionality */}}
        onCalculateSalary={(data) => {/* TODO: Implement salary calculation */}}
        onShowPayroll={() => navigate("/payroll")}
        onShowCompliance={() => {/* TODO: Implement compliance view */}}
        onShowReports={() => {/* TODO: Implement reports view */}}
        onShowTimeTracking={() => {/* TODO: Implement time tracking view */}}
      />
    </MainLayout>
  );
}