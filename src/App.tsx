import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/contexts/auth-context";
import { TenantProvider } from "@/contexts/tenant-context";
import { EmployeeProvider } from "@/contexts/employee-context";
import { SystaxProvider } from "@/contexts/systax-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Loader2 } from "lucide-react";

// Eager: Landing, Auth, NotFound (sofort benötigt)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy: Alle geschützten Routen
const Index = lazy(() => import("./pages/Index"));
const Employees = lazy(() => import("./pages/Employees"));
const Payroll = lazy(() => import("./pages/Payroll"));
const Autolohn = lazy(() => import("./pages/Autolohn"));
const TimeTracking = lazy(() => import("./pages/TimeTracking"));
const Settings = lazy(() => import("./pages/Settings"));
const Meldewesen = lazy(() => import("./pages/Meldewesen"));
const Compliance = lazy(() => import("./pages/Compliance"));
const Reports = lazy(() => import("./pages/Reports"));
const Authorities = lazy(() => import("./pages/Authorities"));
const ExtendedCalculationsPage = lazy(() => import("./pages/ExtendedCalculations"));
const SalaryCalculatorPage = lazy(() => import("./pages/SalaryCalculator"));

// Lazy: Rechtliche Seiten (selten aufgerufen)
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const AGB = lazy(() => import("./pages/AGB"));
const Kontakt = lazy(() => import("./pages/Kontakt"));
const HilfeCenter = lazy(() => import("./pages/HilfeCenter"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TenantProvider>
              <EmployeeProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                    <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
                    <Route path="/autolohn" element={<ProtectedRoute><Autolohn /></ProtectedRoute>} />
                    <Route path="/time-tracking" element={<ProtectedRoute><TimeTracking /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/meldewesen" element={<ProtectedRoute><Meldewesen /></ProtectedRoute>} />
                    <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/authorities" element={<ProtectedRoute><Authorities /></ProtectedRoute>} />
                    <Route path="/extended-calculations" element={<ProtectedRoute><ExtendedCalculationsPage /></ProtectedRoute>} />
                    <Route path="/salary-calculator" element={<ProtectedRoute><SalaryCalculatorPage /></ProtectedRoute>} />
                    <Route path="/impressum" element={<Impressum />} />
                    <Route path="/datenschutz" element={<Datenschutz />} />
                    <Route path="/agb" element={<AGB />} />
                    <Route path="/kontakt" element={<Kontakt />} />
                    <Route path="/hilfe" element={<HilfeCenter />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </EmployeeProvider>
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
