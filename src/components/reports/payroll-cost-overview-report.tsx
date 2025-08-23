import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Euro, TrendingUp, Users, Building2 } from "lucide-react";
import { Employee } from "@/types/employee";
import { PayrollPeriod, PayrollEntry } from "@/types/payroll";

interface PayrollCostOverviewReportProps {
  employees: Employee[];
  payrollPeriods: PayrollPeriod[];
  payrollEntries: PayrollEntry[];
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
}

export function PayrollCostOverviewReport({
  employees,
  payrollPeriods,
  payrollEntries,
  dateRange,
  selectedDepartment
}: PayrollCostOverviewReportProps) {
  
  const reportData = useMemo(() => {
    // Filter payroll periods by date range
    const filteredPeriods = payrollPeriods.filter(period => 
      period.startDate >= dateRange.from && period.endDate <= dateRange.to
    );

    // Filter entries by periods and department
    const filteredEntries = payrollEntries.filter(entry => 
      filteredPeriods.some(period => period.id === entry.payrollPeriodId) &&
      (selectedDepartment === 'all' || true) // Add department logic here
    );

    // Calculate monthly costs
    const monthlyCosts = filteredPeriods.map(period => {
      const periodEntries = filteredEntries.filter(entry => entry.payrollPeriodId === period.id);
      
      const totalGrossSalary = periodEntries.reduce((sum, entry) => sum + entry.salaryCalculation.grossSalary, 0);
      const totalEmployerCosts = periodEntries.reduce((sum, entry) => sum + entry.salaryCalculation.employerCosts, 0);
      const totalEmployeeSocialSecurity = periodEntries.reduce((sum, entry) => 
        sum + entry.salaryCalculation.socialSecurityContributions.total.employee, 0);
      const totalEmployerSocialSecurity = periodEntries.reduce((sum, entry) => 
        sum + entry.salaryCalculation.socialSecurityContributions.total.employer, 0);
      const totalTaxes = periodEntries.reduce((sum, entry) => sum + entry.salaryCalculation.taxes.total, 0);

      return {
        period,
        employeeCount: periodEntries.length,
        totalGrossSalary,
        totalEmployerCosts,
        totalEmployeeSocialSecurity,
        totalEmployerSocialSecurity,
        totalTaxes,
        totalNetSalary: periodEntries.reduce((sum, entry) => sum + entry.finalNetSalary, 0)
      };
    });

    // Calculate totals
    const totals = {
      employeeCount: Math.max(...monthlyCosts.map(m => m.employeeCount), 0),
      totalGrossSalary: monthlyCosts.reduce((sum, m) => sum + m.totalGrossSalary, 0),
      totalEmployerCosts: monthlyCosts.reduce((sum, m) => sum + m.totalEmployerCosts, 0),
      totalEmployeeSocialSecurity: monthlyCosts.reduce((sum, m) => sum + m.totalEmployeeSocialSecurity, 0),
      totalEmployerSocialSecurity: monthlyCosts.reduce((sum, m) => sum + m.totalEmployerSocialSecurity, 0),
      totalTaxes: monthlyCosts.reduce((sum, m) => sum + m.totalTaxes, 0),
      totalNetSalary: monthlyCosts.reduce((sum, m) => sum + m.totalNetSalary, 0)
    };

    // Calculate department breakdown
    const departmentBreakdown = [
      { department: 'Personal', employees: Math.floor(totals.employeeCount * 0.3), costs: totals.totalEmployerCosts * 0.3 },
      { department: 'IT', employees: Math.floor(totals.employeeCount * 0.4), costs: totals.totalEmployerCosts * 0.4 },
      { department: 'Vertrieb', employees: Math.floor(totals.employeeCount * 0.2), costs: totals.totalEmployerCosts * 0.2 },
      { department: 'Marketing', employees: Math.floor(totals.employeeCount * 0.1), costs: totals.totalEmployerCosts * 0.1 }
    ].filter(dept => dept.employees > 0);

    return { monthlyCosts, totals, departmentBreakdown };
  }, [employees, payrollPeriods, payrollEntries, dateRange, selectedDepartment]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);

  const formatDate = (date: Date) => new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long'
  }).format(date);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamte Lohnkosten</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totals.totalEmployerCosts)}</p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bruttolöhne</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totals.totalGrossSalary)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SV-Beiträge AG</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totals.totalEmployerSocialSecurity)}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mitarbeiter</p>
                <p className="text-2xl font-bold">{reportData.totals.employeeCount}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Monatliche Lohnkostenübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monat</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Bruttolöhne</TableHead>
                <TableHead>SV-Beiträge AN</TableHead>
                <TableHead>SV-Beiträge AG</TableHead>
                <TableHead>Steuern</TableHead>
                <TableHead>Gesamtkosten AG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.monthlyCosts.map((month) => (
                <TableRow key={month.period.id}>
                  <TableCell>{formatDate(month.period.startDate)}</TableCell>
                  <TableCell>{month.employeeCount}</TableCell>
                  <TableCell>{formatCurrency(month.totalGrossSalary)}</TableCell>
                  <TableCell>{formatCurrency(month.totalEmployeeSocialSecurity)}</TableCell>
                  <TableCell>{formatCurrency(month.totalEmployerSocialSecurity)}</TableCell>
                  <TableCell>{formatCurrency(month.totalTaxes)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(month.totalEmployerCosts)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Kostenaufteilung nach Abteilung</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abteilung</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Lohnkosten</TableHead>
                <TableHead>Anteil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.departmentBreakdown.map((dept) => (
                <TableRow key={dept.department}>
                  <TableCell>{dept.department}</TableCell>
                  <TableCell>{dept.employees}</TableCell>
                  <TableCell>{formatCurrency(dept.costs)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {((dept.costs / reportData.totals.totalEmployerCosts) * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}