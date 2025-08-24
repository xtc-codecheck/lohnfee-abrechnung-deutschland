import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { startOfYear, endOfYear, startOfMonth, endOfMonth, format, differenceInHours } from "date-fns";

interface WorkingTimeAccountsProps {
  onBack: () => void;
}

export function WorkingTimeAccounts({ onBack }: WorkingTimeAccountsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { employees } = useEmployeeStorage();
  const { calculateEmployeeStatus, getTimeEntriesForEmployee } = useTimeTracking();

  const startDate = selectedPeriod === 'month' 
    ? startOfMonth(selectedDate) 
    : startOfYear(selectedDate);
  const endDate = selectedPeriod === 'month' 
    ? endOfMonth(selectedDate) 
    : endOfYear(selectedDate);

  const getOvertimeColor = (hours: number) => {
    if (hours > 0) return "text-orange-600";
    if (hours < 0) return "text-red-600";
    return "text-green-600";
  };

  const getOvertimeIcon = (hours: number) => {
    if (hours > 0) return <TrendingUp className="h-4 w-4" />;
    if (hours < 0) return <TrendingDown className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const calculateVacationBalance = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return { total: 0, used: 0, remaining: 0 };

    const totalVacationDays = employee.employmentData.vacationDays || 30;
    const entries = getTimeEntriesForEmployee(employeeId, startOfYear(selectedDate), endOfYear(selectedDate));
    const usedVacationDays = entries.filter(entry => entry.type === 'vacation').length;
    
    return {
      total: totalVacationDays,
      used: usedVacationDays,
      remaining: totalVacationDays - usedVacationDays
    };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Arbeitszeitkonten"
        onBack={onBack}
      />

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('month')}
          size="sm"
        >
          Monat
        </Button>
        <Button
          variant={selectedPeriod === 'year' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('year')}
          size="sm"
        >
          Jahr
        </Button>
      </div>

      <p className="text-muted-foreground mb-4">
        Zeitraum: {format(startDate, 'dd.MM.yyyy')} - {format(endDate, 'dd.MM.yyyy')}
      </p>

      {/* Employee Accounts */}
      <div className="grid gap-6">
        {employees.map((employee) => {
          const status = calculateEmployeeStatus(employee.id, startDate, endDate);
          const vacationBalance = calculateVacationBalance(employee.id);
          const overtimeHours = status.actualHours - status.contractHours;
          const progressPercentage = status.contractHours > 0 ? (status.actualHours / status.contractHours) * 100 : 0;

          return (
            <Card key={employee.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {employee.personalData.firstName} {employee.personalData.lastName}
                  </CardTitle>
                  <Badge 
                    variant={status.status === 'green' ? 'default' : status.status === 'yellow' ? 'secondary' : 'destructive'}
                  >
                    {status.status === 'green' ? 'Normal' : status.status === 'yellow' ? 'Achtung' : 'Kritisch'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mitarbeiter • {employee.employmentData.weeklyHours}h/Woche
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Working Hours Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Arbeitsstunden</span>
                    <span>{status.actualHours.toFixed(1)}h / {status.contractHours.toFixed(1)}h</span>
                  </div>
                  <Progress 
                    value={Math.min(progressPercentage, 100)} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{progressPercentage.toFixed(1)}% erreicht</span>
                    <span className={getOvertimeColor(overtimeHours)}>
                      {overtimeHours > 0 ? '+' : ''}{overtimeHours.toFixed(1)}h
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {getOvertimeIcon(overtimeHours)}
                      <span className="text-xs font-medium">Überstunden</span>
                    </div>
                    <p className={`text-lg font-bold ${getOvertimeColor(overtimeHours)}`}>
                      {overtimeHours > 0 ? '+' : ''}{overtimeHours.toFixed(1)}h
                    </p>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Krankheit</span>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      {status.sickDays} Tage
                    </p>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium">Urlaub</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {status.vacationDays} Tage
                    </p>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium">Urlaubssaldo</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {vacationBalance.remaining} Tage
                    </p>
                  </div>
                </div>

                {/* Vacation Balance Detail */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Urlaubskonto {selectedDate.getFullYear()}</span>
                    <span>{vacationBalance.used} / {vacationBalance.total} Tage genommen</span>
                  </div>
                  <Progress 
                    value={(vacationBalance.used / vacationBalance.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Verbleibend: {vacationBalance.remaining} Tage
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}