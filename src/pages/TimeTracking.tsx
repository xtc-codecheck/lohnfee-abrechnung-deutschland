import { MainLayout } from "@/components/layout/main-layout";
import { TimeTrackingDashboard } from "@/components/time-tracking/time-tracking-dashboard";
import { PageSeo } from "@/components/seo/page-seo";
import { useNavigate } from "react-router-dom";

export default function TimeTracking() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/employees");
  };

  return (
    <MainLayout>
      <PageSeo title="Zeiterfassung" description="Arbeitszeiten erfassen, Überstunden verwalten und Abwesenheiten dokumentieren." path="/time-tracking" />
      <TimeTrackingDashboard onBack={handleBack} />
    </MainLayout>
  );
}