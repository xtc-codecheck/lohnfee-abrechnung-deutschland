import { useNavigate } from "react-router-dom";
import { PageSeo } from "@/components/seo/page-seo";
import { MainLayout } from "@/components/layout/main-layout";
import { AuthoritiesIntegration } from "@/components/integration/authorities-integration";

export default function Authorities() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageSeo title="Behörden-Schnittstellen" description="ELSTER, ELStAM und SV-Meldungen – Schnittstellen zu Behörden." path="/authorities" />
      <AuthoritiesIntegration onBack={() => navigate("/employees")} />
    </MainLayout>
  );
}
