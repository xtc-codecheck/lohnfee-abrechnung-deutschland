import { useState, useMemo } from "react";
import { ArrowLeft, Calendar, Download, TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { Employee } from "@/types/employee";

interface EmployeePayrollAccountProps {
  employeeId: string;
  onBack: () => void;
}

export function EmployeePayrollAccount({ employeeId, onBack }: EmployeePayrollAccountProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  
  const { payrollPeriods, payrollEntries } = usePayrollStorage();
  const { employees } = useEmployeeStorage();

  const employee = employees.find(emp => emp.id === employeeId);
  
  if (!employee) {
    return (
      <div className="text-center py-12">
        <p>Mitarbeiter nicht gefunden</p>
        <Button onClick={onBack} className="mt-4">
          Zurück
        </Button>
      </div>
    );
  }

  // Get payroll entries for this employee
  const employeeEntries = useMemo(() => {
    let entries = payrollEntries.filter(entry => entry.employeeId === employeeId);

    // Filter by year
    if (selectedYear !== "all") {
      entries = entries.filter(entry => {
        const period = payrollPeriods.find(p => p.id === entry.payrollPeriodId);
        return period?.year.toString() === selectedYear;
      });
    }

    // Sort by date (newest first)
    return entries.sort((a, b) => {
      const periodA = payrollPeriods.find(p => p.id === a.payrollPeriodId);
      const periodB = payrollPeriods.find(p => p.id === b.payrollPeriodId);
      
      if (!periodA || !periodB) return 0;
      
      if (periodA.year !== periodB.year) {
        return periodB.year - periodA.year;
      }
      return periodB.month - periodA.month;
    });
  }, [payrollEntries, employeeId, selectedYear, payrollPeriods]);

  // Calculate totals
  const totalGross = employeeEntries.reduce((sum, entry) => sum + entry.salaryCalculation.grossSalary, 0);
  const totalNet = employeeEntries.reduce((sum, entry) => sum + entry.finalNetSalary, 0);
  const totalTax = employeeEntries.reduce((sum, entry) => sum + entry.salaryCalculation.taxes.total, 0);
  const totalSocialSecurity = employeeEntries.reduce((sum, entry) => sum + entry.salaryCalculation.socialSecurityContributions.total.employee, 0);

  // Get available years
  const availableYears = Array.from(new Set(
    payrollPeriods.map(period => period.year.toString())
  )).sort((a, b) => parseInt(b) - parseInt(a));

  const getPeriodName = (periodId: string) => {
    const period = payrollPeriods.find(p => p.id === periodId);
    if (!period) return "Unbekannt";
    
    const monthNames = [
      "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
      "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"
    ];
    
    return `${monthNames[period.month - 1]} ${period.year}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Lohnkonto"
        description={`${employee.personalData.firstName} ${employee.personalData.lastName} - Lohnabrechnungshistorie`}
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </PageHeader>

      {/* Employee Info */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Mitarbeiterinformationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">
                {employee.personalData.firstName} {employee.personalData.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Steuerklasse</p>
              <p className="font-medium">{employee.personalData.taxClass}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bruttogehalt</p>
              <p className="font-medium">
                {employee.salaryData.grossSalary.toLocaleString('de-DE', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Brutto gesamt</p>
                <p className="text-2xl font-bold">
                  {totalGross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-success/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Netto gesamt</p>
                <p className="text-2xl font-bold">
                  {totalNet.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-destructive/10 rounded-full">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Steuern gesamt</p>
                <p className="text-2xl font-bold">
                  {totalTax.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-warning/10 rounded-full">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sozialversicherung</p>
                <p className="text-2xl font-bold">
                  {totalSocialSecurity.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year Filter */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jahr</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Jahr wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Jahre</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lohnabrechnungshistorie</CardTitle>
          <CardDescription>
            {employeeEntries.length} Abrechnungen gefunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employeeEntries.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Brutto</TableHead>
                    <TableHead className="text-right">Netto</TableHead>
                    <TableHead className="text-right">Steuern</TableHead>
                    <TableHead className="text-right">Sozialversicherung</TableHead>
                    <TableHead className="text-right">Überstunden</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeEntries.map((entry) => {
                    const period = payrollPeriods.find(p => p.id === entry.payrollPeriodId);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {getPeriodName(entry.payrollPeriodId)}
                        </TableCell>
                        <TableCell>
                          {entry.createdAt.toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {entry.salaryCalculation.grossSalary.toLocaleString('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR' 
                          })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {entry.finalNetSalary.toLocaleString('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR' 
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.salaryCalculation.taxes.total.toLocaleString('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR' 
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.salaryCalculation.socialSecurityContributions.total.employee.toLocaleString('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR' 
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.workingData.overtimeHours}h
                        </TableCell>
                        <TableCell>
                          <Badge variant={period?.status === 'finalized' ? 'default' : 'secondary'}>
                            {period?.status === 'finalized' ? 'Abgeschlossen' : 'Offen'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Abrechnungen</h3>
              <p className="text-sm text-muted-foreground">
                Für diesen Mitarbeiter wurden noch keine Lohnabrechnungen erstellt.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}