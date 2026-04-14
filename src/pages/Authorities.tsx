import { useNavigate } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { AuthoritiesIntegration } from "@/components/integration/authorities-integration";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";

export default function Authorities() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageSeo title="Behörden-Schnittstellen" description="ELSTER, ELStAM und SV-Meldungen – Schnittstellen zu Behörden." path="/authorities" />
      <AppBreadcrumb segments={[
        { label: "Mitarbeiter", path: "/employees" },
        { label: "Behörden-Schnittstellen" },
      ]} />
      <AuthoritiesIntegration onBack={() => navigate("/employees")} />
    </MainLayout>
  );
}
