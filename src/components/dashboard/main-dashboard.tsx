import { Users, Calculator, FileText, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";

export function MainDashboard() {
  const navigate = useNavigate();
  const { employees } = useEmployeeStorage();
  const { payrollPeriods } = usePayrollStorage();

  const stats = {
    totalEmployees: employees.length,
    avgGrossSalary: employees.length > 0 ? employees.reduce((sum, emp) => sum + emp.salaryData.grossSalary, 0) / employees.length : 0,
    totalMonthlyCosts: employees.reduce((sum, emp) => sum + emp.salaryData.grossSalary * 1.2, 0), // inkl. AG-Anteil
    totalPayrollPeriods: payrollPeriods.length
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Zentrierter Header */}
      <div className="text-center pb-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Willkommen bei LohnPro - Ihrer Lohnabrechnungssoftware</p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Aktive Mitarbeiter</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschnittsgehalt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.avgGrossSalary.toFixed(0)}€</div>
            <p className="text-xs text-muted-foreground">Brutto pro Monat</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtkosten</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalMonthlyCosts.toFixed(0)}€</div>
            <p className="text-xs text-muted-foreground">Monatlich (inkl. AG-Anteil)</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lohnabrechnungen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalPayrollPeriods}</div>
            <p className="text-xs text-muted-foreground">Erstellte Abrechnungen</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => navigate("/employees")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Mitarbeiter verwalten
            </CardTitle>
            <CardDescription>
              Mitarbeiter hinzufügen, bearbeiten und verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Zur Mitarbeiterverwaltung
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => navigate("/payroll")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Lohnabrechnung
            </CardTitle>
            <CardDescription>
              Lohnabrechnungen erstellen und verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Zur Lohnabrechnung
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Gehaltsrechner
            </CardTitle>
            <CardDescription>
              Brutto-Netto Berechnung durchführen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gehalt berechnen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Benachrichtigungen */}
      {employees.length === 0 && (
        <Card className="shadow-card border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Erste Schritte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Willkommen bei LohnPro! Fügen Sie Ihren ersten Mitarbeiter hinzu, um mit der Lohnabrechnung zu beginnen.
            </p>
            <Button onClick={() => navigate("/employees")} className="bg-gradient-primary hover:opacity-90">
              Ersten Mitarbeiter hinzufügen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}