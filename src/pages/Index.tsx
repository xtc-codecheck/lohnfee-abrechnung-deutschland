import { MainLayout } from "@/components/layout/main-layout";
import { MainDashboard } from "@/components/dashboard/main-dashboard";
import { PageSeo } from "@/components/seo/page-seo";

const Index = () => {
  return (
    <MainLayout>
      <PageSeo title="Dashboard" description="Ihr LohnPro Dashboard – Übersicht über Mitarbeiter, Gehaltskosten und Lohnabrechnungen." path="/dashboard" />
      <MainDashboard />
    </MainLayout>
  );
};

export default Index;
