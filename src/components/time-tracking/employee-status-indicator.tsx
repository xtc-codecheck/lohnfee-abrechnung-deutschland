import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Employee } from "@/types/employee";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, Calendar, AlertTriangle } from "lucide-react";

interface EmployeeStatusIndicatorProps {
  employee: Employee;
  startDate: Date;
  endDate: Date;
  onClick: () => void;
}

export function EmployeeStatusIndicator({ 
  employee, 
  startDate, 
  endDate, 
  onClick 
}: EmployeeStatusIndicatorProps) {
  const { calculateEmployeeStatus } = useTimeTracking();
  const status = calculateEmployeeStatus(employee.id, startDate, endDate);

  const getStatusColor = (statusType: 'green' | 'yellow' | 'red') => {
    switch (statusType) {
      case 'green': return 'bg-green-50 border-green-200 text-green-800';
      case 'yellow': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'red': return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getStatusIcon = (statusType: 'green' | 'yellow' | 'red') => {
    switch (statusType) {
      case 'green': return <div className="w-3 h-3 rounded-full bg-green-500" />;
      case 'yellow': return <div className="w-3 h-3 rounded-full bg-yellow-500" />;
      case 'red': return <div className="w-3 h-3 rounded-full bg-red-500" />;
    }
  };

  const getStatusLabel = (statusType: 'green' | 'yellow' | 'red') => {
    switch (statusType) {
      case 'green': return 'Normal';
      case 'yellow': return 'Achtung';
      case 'red': return 'Kritisch';
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        getStatusColor(status.status)
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(status.status)}
            <div>
              <h4 className="font-medium">
                {employee.personalData.firstName} {employee.personalData.lastName}
              </h4>
              <p className="text-sm text-muted-foreground">
                {employee.employmentData.weeklyHours}h/Woche • {employee.employmentData.employmentType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Stats */}
            <div className="text-right text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{status.actualHours.toFixed(1)}h / {status.contractHours.toFixed(1)}h</span>
              </div>
              <div className={cn("font-medium", {
                "text-green-600": Math.abs(status.deviation) <= 5,
                "text-yellow-600": Math.abs(status.deviation) > 5 && Math.abs(status.deviation) <= 10,
                "text-red-600": Math.abs(status.deviation) > 10
              })}>
                {status.deviation > 0 ? '+' : ''}{status.deviation.toFixed(1)}%
              </div>
            </div>

            {/* Absence Stats */}
            {(status.sickDays > 0 || status.vacationDays > 0) && (
              <div className="text-right text-sm">
                {status.sickDays > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{status.sickDays} Krank</span>
                  </div>
                )}
                {status.vacationDays > 0 && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Calendar className="h-3 w-3" />
                    <span>{status.vacationDays} Urlaub</span>
                  </div>
                )}
              </div>
            )}

            {/* Status Badge */}
            <Badge 
              variant="outline" 
              className={cn("text-xs", getStatusColor(status.status))}
            >
              {getStatusLabel(status.status)}
            </Badge>

            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Overtime Warning */}
        {status.overtimeHours > 0 && (
          <div className="mt-2 pt-2 border-t border-current/20">
            <p className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              {status.overtimeHours.toFixed(1)}h Überstunden
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}