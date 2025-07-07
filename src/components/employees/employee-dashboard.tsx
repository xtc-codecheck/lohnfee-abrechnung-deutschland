import { useState } from "react";
import { Plus, Users, Calculator, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Employee } from "@/types/employee";

// Mock-Daten für die Demo
const mockEmployees: Employee[] = [
  {
    id: "1",
    personalData: {
      firstName: "Max",
      lastName: "Mustermann",
      dateOfBirth: new Date("1985-05-15"),
      address: {
        street: "Musterstraße",
        houseNumber: "123",
        postalCode: "12345",
        city: "Berlin",
        country: "Deutschland"
      },
      taxId: "12345678901",
      taxClass: "I",
      churchTax: false,
      healthInsurance: { name: "AOK", additionalRate: 1.3 },
      socialSecurityNumber: "12345678901",
      childAllowances: 0
    },
    employmentData: {
      employmentType: "fulltime",
      startDate: new Date("2023-01-01"),
      isFixedTerm: false,
      weeklyHours: 40
    },
    salaryData: {
      grossSalary: 4500,
      salaryType: "fixed",
      additionalBenefits: {}
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

interface EmployeeDashboardProps {
  onAddEmployee: () => void;
  onCalculateSalary: () => void;
}

export function EmployeeDashboard({ onAddEmployee, onCalculateSalary }: EmployeeDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees] = useState<Employee[]>(mockEmployees);

  const filteredEmployees = employees.filter(employee =>
    `${employee.personalData.firstName} ${employee.personalData.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalEmployees: employees.length,
    avgGrossSalary: employees.reduce((sum, emp) => sum + emp.salaryData.grossSalary, 0) / employees.length,
    totalMonthlyCosts: employees.reduce((sum, emp) => sum + emp.salaryData.grossSalary * 1.2, 0) // inkl. AG-Anteil
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Mitarbeiter-Dashboard"
        description="Überblick über alle Mitarbeiter und deren Gehaltsabrechnungen"
      >
        <div className="flex gap-3">
          <Button 
            onClick={onCalculateSalary}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Gehaltsrechner
          </Button>
          <Button 
            onClick={onAddEmployee}
            className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Mitarbeiter hinzufügen
          </Button>
        </div>
      </PageHeader>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitarbeiter gesamt</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Aktive Beschäftigungsverhältnisse
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschnittliches Bruttogehalt</CardTitle>
            <FileText className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {stats.avgGrossSalary.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Pro Monat
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtpersonalkosten</CardTitle>
            <Calculator className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {stats.totalMonthlyCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Inkl. Arbeitgeberanteile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mitarbeitersuche und -liste */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Mitarbeiterübersicht</CardTitle>
          <CardDescription>Verwaltung aller Mitarbeiter und deren Stammdaten</CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Mitarbeiter suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "Keine Mitarbeiter gefunden" : "Noch keine Mitarbeiter"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Versuchen Sie einen anderen Suchbegriff." : "Fügen Sie den ersten Mitarbeiter hinzu, um zu beginnen."}
                </p>
                {!searchTerm && (
                  <Button onClick={onAddEmployee} className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Mitarbeiter hinzufügen
                  </Button>
                )}
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-medium">
                        {employee.personalData.firstName[0]}{employee.personalData.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {employee.personalData.firstName} {employee.personalData.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {employee.employmentData.employmentType === 'fulltime' ? 'Vollzeit' : 
                         employee.employmentData.employmentType === 'parttime' ? 'Teilzeit' : 
                         employee.employmentData.employmentType === 'minijob' ? 'Minijob' : 'Midijob'} • 
                        {employee.salaryData.grossSalary.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      Bearbeiten
                    </Button>
                    <Button variant="outline" size="sm">
                      Abrechnung
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}