import { useNavigate } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { AdvancedReports } from "@/components/reports/advanced-reports";

export default function Reports() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageSeo title="Reports" description="Erweiterte Berichte und Analysen für Lohnabrechnung und Mitarbeiter." path="/reports" />
      <AdvancedReports onBack={() => navigate("/employees")} />
    </MainLayout>
  );
}
