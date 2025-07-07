import { useState } from "react";
import { Plus, Users, Calculator, FileText, Search, Edit, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Employee } from "@/types/employee";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { EmployeeReports } from "@/components/reports/employee-reports";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface EmployeeDashboardProps {
  onAddEmployee: () => void;
  onCalculateSalary: (data?: any) => void;
  onShowPayroll: () => void;
}

export function EmployeeDashboard({ onAddEmployee, onCalculateSalary, onShowPayroll }: EmployeeDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showReports, setShowReports] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { employees, updateEmployee, deleteEmployee } = useEmployeeStorage();
  const { toast } = useToast();

  const filteredEmployees = employees.filter(employee =>
    `${employee.personalData.firstName} ${employee.personalData.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleSaveEmployee = (updates: Partial<Employee>) => {
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, updates);
      toast({
        title: "Mitarbeiter aktualisiert",
        description: "Die Änderungen wurden erfolgreich gespeichert.",
      });
    }
  };

  const handleDeleteEmployee = (employee: Employee) => {
    deleteEmployee(employee.id);
    toast({
      title: "Mitarbeiter gelöscht",
      description: `${employee.personalData.firstName} ${employee.personalData.lastName} wurde entfernt.`,
      variant: "destructive",
    });
  };

  const handleCalculateForEmployee = (employee: Employee) => {
    const employeeCalculationData = {
      firstName: employee.personalData.firstName,
      lastName: employee.personalData.lastName,
      grossSalary: employee.salaryData.grossSalary,
      taxClass: employee.personalData.taxClass,
      churchTax: employee.personalData.churchTax,
      employmentType: employee.employmentData.employmentType
    };
    onCalculateSalary(employeeCalculationData);
  };

  const stats = {
    totalEmployees: employees.length,
    avgGrossSalary: employees.length > 0 ? employees.reduce((sum, emp) => sum + emp.salaryData.grossSalary, 0) / employees.length : 0,
    totalMonthlyCosts: employees.reduce((sum, emp) => sum + emp.salaryData.grossSalary * 1.2, 0) // inkl. AG-Anteil
  };

  if (showReports) {
    return <EmployeeReports employees={employees} onBack={() => setShowReports(false)} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Mitarbeiter-Dashboard"
        description="Überblick über alle Mitarbeiter und deren Gehaltsabrechnungen"
      >
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowReports(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Berichte
          </Button>
          <Button 
            onClick={onShowPayroll}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Lohnabrechnung
          </Button>
          <Button 
            onClick={() => onCalculateSalary()}
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditEmployee(employee)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Bearbeiten
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCalculateForEmployee(employee)}
                      className="flex items-center gap-1"
                    >
                      <Calculator className="h-3 w-3" />
                      Abrechnung
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Mitarbeiter löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchten Sie {employee.personalData.firstName} {employee.personalData.lastName} wirklich löschen? 
                            Diese Aktion kann nicht rückgängig gemacht werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEmployee(employee)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <EditEmployeeDialog
        employee={editingEmployee}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEmployee}
      />
    </div>
  );
}