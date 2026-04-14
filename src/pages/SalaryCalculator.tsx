import { useNavigate, useSearchParams } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { UltimateSalaryCalculator } from "@/components/salary/ultimate-salary-calculator";
import { SalaryCalculator as SalaryCalc } from "@/components/salary/salary-calculator";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";

export default function SalaryCalculatorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  return (
    <MainLayout>
      <PageSeo title="Gehaltsrechner" description="Brutto-Netto-Berechnung, Gehaltsvergleich und Optimierungstipps." path="/salary-calculator" />
      <AppBreadcrumb segments={[
        { label: "Mitarbeiter", path: "/employees" },
        { label: "Gehaltsrechner" },
      ]} />
      {mode === 'simple' ? (
        <SalaryCalc onBack={() => navigate("/employees")} employeeData={null} />
      ) : (
        <UltimateSalaryCalculator onBack={() => navigate("/employees")} />
      )}
    </MainLayout>
  );
}
