import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, AlertTriangle, TrendingUp, Plus } from "lucide-react";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { EmployeeCalendar } from "./employee-calendar";
import { BulkEntryDialog } from "./bulk-entry-dialog";
import { EmployeeStatusIndicator } from "./employee-status-indicator";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface TimeTrackingDashboardProps {
  onBack: () => void;
}

export function TimeTrackingDashboard({ onBack }: TimeTrackingDashboardProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBulkEntry, setShowBulkEntry] = useState(false);
  const [view, setView] = useState<'overview' | 'calendar'>('overview');

  const { employees } = useEmployeeStorage();
  const { getTimeTrackingStats } = useTimeTracking();

  const startOfCurrentMonth = startOfMonth(currentDate);
  const endOfCurrentMonth = endOfMonth(currentDate);
  const stats = getTimeTrackingStats(startOfCurrentMonth, endOfCurrentMonth);

  const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'red': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setView('calendar');
  };

  if (view === 'calendar' && selectedEmployee) {
    const employee = employees.find(emp => emp.id === selectedEmployee);
    return (
      <EmployeeCalendar
        employee={employee!}
        onBack={() => setView('overview')}
        onBulkEntry={() => setShowBulkEntry(true)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zeiterfassung"
        onBack={onBack}
      />
      <p className="text-muted-foreground mb-4">Übersicht für {format(currentDate, 'MMMM yyyy')}</p>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mitarbeiter gesamt</p>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ø Arbeitsstunden</p>
              <p className="text-2xl font-bold">{stats.averageHoursWorked.toFixed(1)}h</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Krankheitstage</p>
              <p className="text-2xl font-bold">{stats.totalSickDays}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Urlaubstage</p>
              <p className="text-2xl font-bold">{stats.totalVacationDays}</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Status-Übersicht (Ampelsystem)</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkEntry(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Massenerfassung
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-green-600">{stats.greenStatus}</span>
              </div>
              <p className="text-sm font-medium">Grün (≤5% Abweichung)</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-yellow-600">{stats.yellowStatus}</span>
              </div>
              <p className="text-sm font-medium">Gelb (5-10% Abweichung)</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-red-600">{stats.redStatus}</span>
              </div>
              <p className="text-sm font-medium">Rot (&gt;10% Abweichung)</p>
            </div>
          </div>

          {/* Employee List with Status */}
          <div className="space-y-3">
            {employees.map((employee) => (
              <EmployeeStatusIndicator
                key={employee.id}
                employee={employee}
                startDate={startOfCurrentMonth}
                endDate={endOfCurrentMonth}
                onClick={() => handleEmployeeSelect(employee.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Entry Dialog */}
      {showBulkEntry && (
        <BulkEntryDialog
          open={showBulkEntry}
          onOpenChange={setShowBulkEntry}
          employees={employees}
        />
      )}
    </div>
  );
}