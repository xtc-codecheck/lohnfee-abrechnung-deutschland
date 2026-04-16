import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/contexts/auth-context";
import { TenantProvider } from "@/contexts/tenant-context";
import { EmployeeProvider } from "@/contexts/employee-context";
import { SystaxProvider } from "@/contexts/systax-context";
import { ProtectedRoute } from "@/components/auth/protected-route";

// Lazy-Loading aller geschützten Routen (identisch mit Standalone-App)
const Index = lazy(() => import("@/pages/Index"));
const Employees = lazy(() => import("@/pages/Employees"));
const Payroll = lazy(() => import("@/pages/Payroll"));
const Autolohn = lazy(() => import("@/pages/Autolohn"));
const TimeTracking = lazy(() => import("@/pages/TimeTracking"));
const Settings = lazy(() => import("@/pages/Settings"));
const Meldewesen = lazy(() => import("@/pages/Meldewesen"));
const Compliance = lazy(() => import("@/pages/Compliance"));
const Reports = lazy(() => import("@/pages/Reports"));
const Authorities = lazy(() => import("@/pages/Authorities"));
const ExtendedCalculationsPage = lazy(() => import("@/pages/ExtendedCalculations"));
const SalaryCalculatorPage = lazy(() => import("@/pages/SalaryCalculator"));

export interface StandaloneLohnProAppProps {
  /**
   * Optionaler Base-Path, unter dem die Sub-App gemountet wird.
   * Beispiel: "/lohn" → /lohn/dashboard, /lohn/employees, ...
   *
   * Im Standalone-Modus (eigene Domain) leer lassen.
   *
   * Hinweis: BrowserRouter muss vom Host-System bereitgestellt werden.
   */
  basePath?: string;

  /**
   * Wenn `true`, werden eigene Provider (Auth/Tenant/Employee/Systax)
   * NICHT gemountet — das Host-System (SYSTAX) stellt sie bereit.
   * Default: `false` (Standalone-Modus mit eigenen Providern).
   */
  useHostProviders?: boolean;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function LohnProRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
        <Route path="payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
        <Route path="autolohn" element={<ProtectedRoute><Autolohn /></ProtectedRoute>} />
        <Route path="time-tracking" element={<ProtectedRoute><TimeTracking /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="meldewesen" element={<ProtectedRoute><Meldewesen /></ProtectedRoute>} />
        <Route path="compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="authorities" element={<ProtectedRoute><Authorities /></ProtectedRoute>} />
        <Route path="extended-calculations" element={<ProtectedRoute><ExtendedCalculationsPage /></ProtectedRoute>} />
        <Route path="salary-calculator" element={<ProtectedRoute><SalaryCalculatorPage /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}

/**
 * Vollständige LohnPro Sub-App, mountbar im SYSTAX-Hauptsystem.
 *
 * @example Standalone:
 *   <StandaloneLohnProApp />
 *
 * @example In SYSTAX unter /lohn:
 *   <Route path="/lohn/*" element={
 *     <StandaloneLohnProApp basePath="/lohn" useHostProviders={true} />
 *   } />
 */
export function StandaloneLohnProApp({
  useHostProviders = false,
}: StandaloneLohnProAppProps) {
  if (useHostProviders) {
    // Host (SYSTAX) stellt Auth/Tenant/Theme/Query bereits bereit
    return (
      <ErrorBoundary>
        <LohnProRoutes />
      </ErrorBoundary>
    );
  }

  // Standalone: eigene Provider-Hierarchie
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <SystaxProvider>
            <EmployeeProvider>
              <LohnProRoutes />
            </EmployeeProvider>
          </SystaxProvider>
        </TenantProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
