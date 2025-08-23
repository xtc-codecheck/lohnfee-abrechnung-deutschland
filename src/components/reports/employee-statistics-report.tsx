import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, Calendar, Building2, Euro } from "lucide-react";
import { Employee } from "@/types/employee";
import { PayrollPeriod, PayrollEntry } from "@/types/payroll";

interface EmployeeStatisticsReportProps {
  employees: Employee[];
  payrollPeriods: PayrollPeriod[];
  payrollEntries: PayrollEntry[];
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
}

export function EmployeeStatisticsReport({
  employees,
  payrollPeriods,
  payrollEntries,
  dateRange,
  selectedDepartment
}: EmployeeStatisticsReportProps) {
  
  const reportData = useMemo(() => {
    const currentDate = new Date();
    
    // Age structure analysis
    const ageGroups = employees.reduce((groups, employee) => {
      const age = currentDate.getFullYear() - employee.personalData.dateOfBirth.getFullYear();
      let ageGroup = '';
      
      if (age < 25) ageGroup = 'Unter 25';
      else if (age < 35) ageGroup = '25-34';
      else if (age < 45) ageGroup = '35-44';
      else if (age < 55) ageGroup = '45-54';
      else ageGroup = '55+';
      
      groups[ageGroup] = (groups[ageGroup] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);

    // Employment type breakdown
    const employmentTypes = employees.reduce((types, employee) => {
      const type = employee.employmentData.employmentType;
      types[type] = (types[type] || 0) + 1;
      return types;
    }, {} as Record<string, number>);

    // Contract type analysis
    const contractTypes = employees.reduce((contracts, employee) => {
      const hours = employee.employmentData.weeklyHours;
      let contractType = '';
      
      if (hours <= 20) contractType = 'Teilzeit (≤20h)';
      else if (hours <= 30) contractType = 'Teilzeit (21-30h)';
      else if (hours < 40) contractType = 'Teilzeit (31-39h)';
      else contractType = 'Vollzeit (≥40h)';
      
      contracts[contractType] = (contracts[contractType] || 0) + 1;
      return contracts;
    }, {} as Record<string, number>);

    // Generate mock turnover data
    const turnoverData = {
      joinedThisYear: Math.floor(employees.length * 0.15),
      leftThisYear: Math.floor(employees.length * 0.12),
      turnoverRate: 12, // 12%
      averageTenure: 3.2 // years
    };

    // Generate mock salary increase data
    const salaryIncreases = employees.map(employee => {
      const currentSalary = employee.salaryData.grossSalary;
      const lastYearSalary = currentSalary * (0.95 + Math.random() * 0.1); // -5% to +5%
      const increase = ((currentSalary - lastYearSalary) / lastYearSalary) * 100;
      
      return {
        employee,
        currentSalary,
        lastYearSalary,
        increase,
        increaseAmount: currentSalary - lastYearSalary
      };
    }).sort((a, b) => b.increase - a.increase);

    // Department statistics
    const departmentStats = ['Personal', 'IT', 'Vertrieb', 'Marketing'].map(dept => {
      const deptEmployees = Math.floor(employees.length * (0.15 + Math.random() * 0.35));
      const avgSalary = 3500 + Math.random() * 2000;
      
      return {
        department: dept,
        employeeCount: deptEmployees,
        avgSalary,
        avgAge: 30 + Math.random() * 15,
        turnoverRate: 5 + Math.random() * 15
      };
    });

    // Performance metrics
    const performanceMetrics = {
      avgSalary: employees.reduce((sum, emp) => sum + emp.salaryData.grossSalary, 0) / employees.length,
      medianSalary: employees.sort((a, b) => a.salaryData.grossSalary - b.salaryData.grossSalary)[Math.floor(employees.length / 2)]?.salaryData.grossSalary || 0,
      salaryRange: {
        min: Math.min(...employees.map(emp => emp.salaryData.grossSalary)),
        max: Math.max(...employees.map(emp => emp.salaryData.grossSalary))
      },
      avgWeeklyHours: employees.reduce((sum, emp) => sum + emp.employmentData.weeklyHours, 0) / employees.length
    };

    return {
      ageGroups,
      employmentTypes,
      contractTypes,
      turnoverData,
      salaryIncreases,
      departmentStats,
      performanceMetrics
    };
  }, [employees, payrollPeriods, payrollEntries, dateRange, selectedDepartment]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);

  const getEmploymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'minijob': 'Minijob',
      'midijob': 'Midijob',
      'parttime': 'Teilzeit',
      'fulltime': 'Vollzeit'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fluktuation</p>
                <p className="text-2xl font-bold text-red-600">{reportData.turnoverData.turnoverRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durchschn. Gehalt</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.performanceMetrics.avgSalary)}</p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durchschn. Betriebszugehörigkeit</p>
                <p className="text-2xl font-bold">{reportData.turnoverData.averageTenure} Jahre</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Neue Mitarbeiter</p>
                <p className="text-2xl font-bold text-green-600">+{reportData.turnoverData.joinedThisYear}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Age Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Altersstruktur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(reportData.ageGroups).map(([ageGroup, count]) => {
              const percentage = (count / employees.length) * 100;
              return (
                <div key={ageGroup} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{ageGroup} Jahre</span>
                  <div className="flex items-center space-x-4 flex-1 max-w-sm">
                    <Progress value={percentage} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-16">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Employment and Contract Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Beschäftigungsarten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.employmentTypes).map(([type, count]) => {
                const percentage = (count / employees.length) * 100;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{getEmploymentTypeLabel(type)}</span>
                    <Badge variant="secondary">{count} ({percentage.toFixed(1)}%)</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arbeitszeit-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.contractTypes).map(([type, count]) => {
                const percentage = (count / employees.length) * 100;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{type}</span>
                    <Badge variant="secondary">{count} ({percentage.toFixed(1)}%)</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Increases */}
      <Card>
        <CardHeader>
          <CardTitle>Lohnerhöhungen im Zeitverlauf</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Vorjahr</TableHead>
                <TableHead>Aktuell</TableHead>
                <TableHead>Erhöhung</TableHead>
                <TableHead>Prozent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.salaryIncreases.slice(0, 10).map((item) => {
                const isPositive = item.increase > 0;
                return (
                  <TableRow key={item.employee.id}>
                    <TableCell>
                      {item.employee.personalData.firstName} {item.employee.personalData.lastName}
                    </TableCell>
                    <TableCell>{formatCurrency(item.lastYearSalary)}</TableCell>
                    <TableCell>{formatCurrency(item.currentSalary)}</TableCell>
                    <TableCell className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {isPositive ? '+' : ''}{formatCurrency(item.increaseAmount)}
                    </TableCell>
                    <TableCell className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {isPositive ? '+' : ''}{item.increase.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {isPositive ? 'Erhöht' : 'Reduziert'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Department Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Abteilungsstatistiken</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abteilung</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Durchschnittsalter</TableHead>
                <TableHead>Durchschnittsgehalt</TableHead>
                <TableHead>Fluktuationsrate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.departmentStats.map((dept) => (
                <TableRow key={dept.department}>
                  <TableCell className="font-medium">{dept.department}</TableCell>
                  <TableCell>{dept.employeeCount}</TableCell>
                  <TableCell>{dept.avgAge.toFixed(1)} Jahre</TableCell>
                  <TableCell>{formatCurrency(dept.avgSalary)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={dept.turnoverRate} className="w-16" />
                      <span className="text-sm">{dept.turnoverRate.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Leistungskennzahlen Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Median-Gehalt</p>
              <p className="text-xl font-bold">{formatCurrency(reportData.performanceMetrics.medianSalary)}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Gehalts-Range</p>
              <p className="text-sm font-medium">
                {formatCurrency(reportData.performanceMetrics.salaryRange.min)} - {formatCurrency(reportData.performanceMetrics.salaryRange.max)}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Ø Wochenstunden</p>
              <p className="text-xl font-bold">{reportData.performanceMetrics.avgWeeklyHours.toFixed(1)}h</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Abgänge dieses Jahr</p>
              <p className="text-xl font-bold text-red-600">-{reportData.turnoverData.leftThisYear}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}