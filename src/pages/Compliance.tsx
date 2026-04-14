import { useNavigate } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { ComplianceDashboard } from "@/components/compliance/compliance-dashboard";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";

export default function Compliance() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageSeo title="Compliance" description="Compliance-Übersicht, Mindestlohn-Prüfung und Fristenüberwachung." path="/compliance" />
      <AppBreadcrumb segments={[
        { label: "Mitarbeiter", path: "/employees" },
        { label: "Compliance" },
      ]} />
      <ComplianceDashboard onBack={() => navigate("/employees")} />
    </MainLayout>
  );
}
