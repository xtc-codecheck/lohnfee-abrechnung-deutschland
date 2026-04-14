import { useNavigate } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { ComplianceDashboard } from "@/components/compliance/compliance-dashboard";

export default function Compliance() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageSeo title="Compliance" description="Compliance-Übersicht, Mindestlohn-Prüfung und Fristenüberwachung." path="/compliance" />
      <ComplianceDashboard onBack={() => navigate("/employees")} />
    </MainLayout>
  );
}
