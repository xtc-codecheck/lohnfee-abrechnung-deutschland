import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard";
import { DetailedPayrollCalculation } from "@/components/payroll/detailed-payroll-calculation";

export default function Payroll() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PayrollDashboard onBack={() => navigate("/")} />
    </MainLayout>
  );
}