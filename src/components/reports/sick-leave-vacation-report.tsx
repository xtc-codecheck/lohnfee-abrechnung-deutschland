import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Calendar, TrendingDown, Users } from "lucide-react";
import { Employee } from "@/types/employee";
import { PayrollPeriod, PayrollEntry } from "@/types/payroll";

interface SickLeaveVacationReportProps {
  employees: Employee[];
  payrollPeriods: PayrollPeriod[];
  payrollEntries: PayrollEntry[];
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
}

export function SickLeaveVacationReport({
  employees,
  payrollPeriods,
  payrollEntries,
  dateRange,
  selectedDepartment
}: SickLeaveVacationReportProps) {
  
  const reportData = useMemo(() => {
    // Generate mock data for demonstration
    const employeeStats = employees.map(employee => {
      const sickDays = Math.floor(Math.random() * 15) + 1; // 1-15 sick days
      const vacationDays = Math.floor(Math.random() * 25) + 5; // 5-30 vacation days
      const expectedWorkingDays = 220; // Typical working days per year
      
      return {
        employee,
        sickDays,
        vacationDays,
        totalAbsenceDays: sickDays + vacationDays,
        sickRate: (sickDays / expectedWorkingDays) * 100,
        vacationRate: (vacationDays / expectedWorkingDays) * 100,
        department: ['Personal', 'IT', 'Vertrieb', 'Marketing'][Math.floor(Math.random() * 4)]
      };
    });

    // Calculate averages
    const avgSickDays = employeeStats.reduce((sum, emp) => sum + emp.sickDays, 0) / employeeStats.length;
    const avgVacationDays = employeeStats.reduce((sum, emp) => sum + emp.vacationDays, 0) / employeeStats.length;
    const totalSickDays = employeeStats.reduce((sum, emp) => sum + emp.sickDays, 0);
    const totalVacationDays = employeeStats.reduce((sum, emp) => sum + emp.vacationDays, 0);

    // Monthly trends (mock data)
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('de-DE', { month: 'long' }),
      sickDays: Math.floor(Math.random() * 30) + 10,
      vacationDays: Math.floor(Math.random() * 50) + 20,
      employeeCount: employees.length
    }));

    // Department breakdown
    const departmentStats = ['Personal', 'IT', 'Vertrieb', 'Marketing'].map(dept => {
      const deptEmployees = employeeStats.filter(emp => emp.department === dept);
      return {
        department: dept,
        employeeCount: deptEmployees.length,
        avgSickDays: deptEmployees.reduce((sum, emp) => sum + emp.sickDays, 0) / (deptEmployees.length || 1),
        avgVacationDays: deptEmployees.reduce((sum, emp) => sum + emp.vacationDays, 0) / (deptEmployees.length || 1),
        totalAbsenceDays: deptEmployees.reduce((sum, emp) => sum + emp.totalAbsenceDays, 0)
      };
    }).filter(dept => dept.employeeCount > 0);

    return {
      employeeStats,
      avgSickDays,
      avgVacationDays,
      totalSickDays,
      totalVacationDays,
      monthlyTrends,
      departmentStats
    };
  }, [employees, payrollPeriods, payrollEntries, dateRange, selectedDepartment]);

  const getSickDaysStatus = (days: number) => {
    if (days <= 5) return { status: 'Niedrig', color: 'bg-green-500' };
    if (days <= 10) return { status: 'Normal', color: 'bg-yellow-500' };
    return { status: 'Hoch', color: 'bg-red-500' };
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamte Krankheitstage</p>
                <p className="text-2xl font-bold">{reportData.totalSickDays}</p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durchschn. Krankheitstage</p>
                <p className="text-2xl font-bold">{reportData.avgSickDays.toFixed(1)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamte Urlaubstage</p>
                <p className="text-2xl font-bold">{reportData.totalVacationDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durchschn. Urlaubstage</p>
                <p className="text-2xl font-bold">{reportData.avgVacationDays.toFixed(1)}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Details */}
      <Card>
        <CardHeader>
          <CardTitle>Fehlzeiten nach Mitarbeiter</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Abteilung</TableHead>
                <TableHead>Krankheitstage</TableHead>
                <TableHead>Urlaubstage</TableHead>
                <TableHead>Gesamt Fehlzeiten</TableHead>
                <TableHead>Krankenstand</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.employeeStats.map((emp) => {
                const sickStatus = getSickDaysStatus(emp.sickDays);
                return (
                  <TableRow key={emp.employee.id}>
                    <TableCell>
                      {emp.employee.personalData.firstName} {emp.employee.personalData.lastName}
                    </TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.sickDays}</TableCell>
                    <TableCell>{emp.vacationDays}</TableCell>
                    <TableCell>{emp.totalAbsenceDays}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={emp.sickRate} className="w-16" />
                        <span className="text-sm">{emp.sickRate.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`text-white ${sickStatus.color}`}
                      >
                        {sickStatus.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monatliche Fehlzeiten-Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monat</TableHead>
                <TableHead>Krankheitstage</TableHead>
                <TableHead>Urlaubstage</TableHead>
                <TableHead>Gesamte Fehlzeiten</TableHead>
                <TableHead>Mitarbeiter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.monthlyTrends.map((month, index) => (
                <TableRow key={index}>
                  <TableCell>{month.month}</TableCell>
                  <TableCell>{month.sickDays}</TableCell>
                  <TableCell>{month.vacationDays}</TableCell>
                  <TableCell>{month.sickDays + month.vacationDays}</TableCell>
                  <TableCell>{month.employeeCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Fehlzeiten nach Abteilung</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abteilung</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Ø Krankheitstage</TableHead>
                <TableHead>Ø Urlaubstage</TableHead>
                <TableHead>Gesamte Fehlzeiten</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.departmentStats.map((dept) => (
                <TableRow key={dept.department}>
                  <TableCell>{dept.department}</TableCell>
                  <TableCell>{dept.employeeCount}</TableCell>
                  <TableCell>{dept.avgSickDays.toFixed(1)}</TableCell>
                  <TableCell>{dept.avgVacationDays.toFixed(1)}</TableCell>
                  <TableCell>{dept.totalAbsenceDays}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}