import { MainLayout } from "@/components/layout/main-layout";
import { TimeTrackingDashboard } from "@/components/time-tracking/time-tracking-dashboard";
import { useNavigate } from "react-router-dom";

export default function TimeTracking() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/employees");
  };

  return (
    <MainLayout>
      <TimeTrackingDashboard onBack={handleBack} />
    </MainLayout>
  );
}