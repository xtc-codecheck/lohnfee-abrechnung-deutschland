import { MainLayout } from "@/components/layout/main-layout";
import { AutolohnDashboard } from "@/components/autolohn/autolohn-dashboard";
import { PageSeo } from "@/components/seo/page-seo";

export default function Autolohn() {
  return (
    <MainLayout>
      <PageSeo title="Autolohn" description="Automatische Lohnabrechnung – Regelmäßige Abrechnungen vollautomatisch erstellen und verwalten." path="/autolohn" />
      <AutolohnDashboard />
    </MainLayout>
  );
}