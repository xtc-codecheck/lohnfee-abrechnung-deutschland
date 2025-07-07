import { useState } from "react";
import { ArrowLeft, Download, FileText, TrendingUp, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Employee, EmploymentType } from "@/types/employee";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmployeeReportsProps {
  employees: Employee[];
  onBack: () => void;
}

export function EmployeeReports({ employees, onBack }: EmployeeReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  // Berechnungen für Statistiken
  const stats = {
    totalEmployees: employees.length,
    fullTimeEmployees: employees.filter(emp => emp.employmentData.employmentType === 'fulltime').length,
    partTimeEmployees: employees.filter(emp => emp.employmentData.employmentType === 'parttime').length,
    minijobEmployees: employees.filter(emp => emp.employmentData.employmentType === 'minijob').length,
    midijobEmployees: employees.filter(emp => emp.employmentData.employmentType === 'midijob').length,
    
    totalGrossSalary: employees.reduce((sum, emp) => sum + emp.salaryData.grossSalary, 0),
    avgGrossSalary: employees.length > 0 ? employees.reduce((sum, emp) => sum + emp.salaryData.grossSalary, 0) / employees.length : 0,
    
    totalEmployerCosts: employees.reduce((sum, emp) => {
      // Vereinfachte AG-Kosten: Brutto + 20% AG-Anteile
      return sum + (emp.salaryData.grossSalary * 1.2);
    }, 0),

    avgWeeklyHours: employees.length > 0 ? employees.reduce((sum, emp) => sum + emp.employmentData.weeklyHours, 0) / employees.length : 0
  };

  const employmentTypeStats = [
    { type: 'Vollzeit', count: stats.fullTimeEmployees, percentage: (stats.fullTimeEmployees / stats.totalEmployees * 100).toFixed(1) },
    { type: 'Teilzeit', count: stats.partTimeEmployees, percentage: (stats.partTimeEmployees / stats.totalEmployees * 100).toFixed(1) },
    { type: 'Minijob', count: stats.minijobEmployees, percentage: (stats.minijobEmployees / stats.totalEmployees * 100).toFixed(1) },
    { type: 'Midijob', count: stats.midijobEmployees, percentage: (stats.midijobEmployees / stats.totalEmployees * 100).toFixed(1) }
  ];

  const handleExportCSV = () => {
    const csvHeaders = [
      'Vorname',
      'Nachname', 
      'Beschäftigungsart',
      'Bruttogehalt',
      'Wochenstunden',
      'Steuerklasse',
      'Eintrittsdatum'
    ];
    
    const csvData = employees.map(emp => [
      emp.personalData.firstName,
      emp.personalData.lastName,
      emp.employmentData.employmentType,
      emp.salaryData.grossSalary,
      emp.employmentData.weeklyHours,
      emp.personalData.taxClass,
      emp.employmentData.startDate.toLocaleDateString('de-DE')
    ]);

    const csvContent = [
      csvHeaders.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mitarbeiter_bericht_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mitarbeiter-Berichte"
        description="Detaillierte Auswertungen und Statistiken"
      >
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Aktuell</SelectItem>
              <SelectItem value="monthly">Monatlich</SelectItem>
              <SelectItem value="yearly">Jährlich</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSV Export
          </Button>
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        </div>
      </PageHeader>

      {/* Hauptstatistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Gesamte Bruttolohnsumme</CardTitle>
            <FileText className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {stats.totalGrossSalary.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Pro Monat
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschnittliches Gehalt</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats.avgGrossSalary.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Brutto pro Mitarbeiter
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arbeitgeber-Gesamtkosten</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {stats.totalEmployerCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Inkl. AG-Anteile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Beschäftigungsarten */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Beschäftigungsarten</CardTitle>
            <CardDescription>Verteilung der Mitarbeiter nach Beschäftigungsart</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employmentTypeStats.map((stat, index) => (
                <div key={stat.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-primary' : 
                      index === 1 ? 'bg-secondary' : 
                      index === 2 ? 'bg-accent' : 'bg-warning'
                    }`} />
                    <span className="font-medium">{stat.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{stat.count}</div>
                    <div className="text-sm text-muted-foreground">{stat.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Weitere Kennzahlen</CardTitle>
            <CardDescription>Zusätzliche Auswertungen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span>Durchschnittliche Wochenstunden</span>
              <span className="font-bold">{stats.avgWeeklyHours.toFixed(1)} Std.</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span>Kosten pro Mitarbeiter (AG)</span>
              <span className="font-bold">
                {(stats.totalEmployerCosts / Math.max(stats.totalEmployees, 1)).toLocaleString('de-DE', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span>Vollzeit-Äquivalente</span>
              <span className="font-bold">
                {(employees.reduce((sum, emp) => sum + emp.employmentData.weeklyHours, 0) / 40).toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detaillierte Mitarbeiterliste */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Detaillierte Mitarbeiterübersicht</CardTitle>
          <CardDescription>Alle Mitarbeiter mit wichtigen Kennzahlen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Beschäftigungsart</th>
                  <th className="text-right p-2">Bruttogehalt</th>
                  <th className="text-right p-2">Wochenstunden</th>
                  <th className="text-left p-2">Steuerklasse</th>
                  <th className="text-left p-2">Eintrittsdatum</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-accent/10">
                    <td className="p-2 font-medium">
                      {employee.personalData.firstName} {employee.personalData.lastName}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.employmentData.employmentType === 'fulltime' ? 'bg-primary/20 text-primary' :
                        employee.employmentData.employmentType === 'parttime' ? 'bg-secondary/20 text-secondary' :
                        employee.employmentData.employmentType === 'minijob' ? 'bg-accent/20 text-accent' :
                        'bg-warning/20 text-warning'
                      }`}>
                        {employee.employmentData.employmentType === 'fulltime' ? 'Vollzeit' :
                         employee.employmentData.employmentType === 'parttime' ? 'Teilzeit' :
                         employee.employmentData.employmentType === 'minijob' ? 'Minijob' : 'Midijob'}
                      </span>
                    </td>
                    <td className="p-2 text-right font-medium">
                      {employee.salaryData.grossSalary.toLocaleString('de-DE', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </td>
                    <td className="p-2 text-right">{employee.employmentData.weeklyHours} Std.</td>
                    <td className="p-2">{employee.personalData.taxClass}</td>
                    <td className="p-2">
                      {employee.employmentData.startDate.toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}