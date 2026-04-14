import { useNavigate } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { ExtendedCalculations } from "@/components/calculations/extended-calculations";

export default function ExtendedCalculationsPage() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageSeo title="Erweiterte Berechnungen" description="Branchenspezifische Berechnungen und spezielle Lohnarten." path="/extended-calculations" />
      <ExtendedCalculations onBack={() => navigate("/employees")} />
    </MainLayout>
  );
}
