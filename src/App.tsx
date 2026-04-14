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
import { ProtectedRoute } from "@/components/auth/protected-route";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Autolohn from "./pages/Autolohn";
import TimeTracking from "./pages/TimeTracking";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import Meldewesen from "./pages/Meldewesen";
import Compliance from "./pages/Compliance";
import Reports from "./pages/Reports";
import Authorities from "./pages/Authorities";
import ExtendedCalculationsPage from "./pages/ExtendedCalculations";
import SalaryCalculatorPage from "./pages/SalaryCalculator";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import AGB from "./pages/AGB";
import Kontakt from "./pages/Kontakt";
import HilfeCenter from "./pages/HilfeCenter";
import NotFound from "./pages/NotFound";

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
