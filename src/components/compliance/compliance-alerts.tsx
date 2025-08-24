import { AlertTriangle, CheckCircle, Clock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComplianceAlert } from "@/types/compliance";

interface ComplianceAlertsProps {
  alerts: ComplianceAlert[];
  onMarkAsRead: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

export function ComplianceAlerts({ alerts, onMarkAsRead, onResolve }: ComplianceAlertsProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      'info': 'default',
      'warning': 'secondary',
      'error': 'destructive',
      'critical': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'minimum_wage': 'Mindestlohn',
      'social_security': 'Sozialversicherung',
      'employee_data': 'Mitarbeiterdaten',
      'payroll_documentation': 'Lohnabrechnung',
      'working_time': 'Arbeitszeit',
      'tax_calculation': 'Steuerberechnung',
      'legal_requirements': 'Rechtliche Anforderungen'
    };
    return labels[type] || type;
  };

  if (alerts.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Keine aktiven Warnungen</h3>
          <p className="text-sm text-muted-foreground">
            Alle Compliance-Checks sind erfolgreich. Weiter so!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Aktive Compliance-Warnungen ({alerts.length})
        </h3>
      </div>

      {alerts.map((alert) => (
        <Card key={alert.id} className={`shadow-card transition-colors ${
          !alert.isRead ? 'border-l-4 border-l-primary' : ''
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{alert.title}</CardTitle>
                    {getSeverityBadge(alert.severity)}
                    <Badge variant="outline">{getTypeLabel(alert.type)}</Badge>
                    {!alert.isRead && (
                      <Badge variant="default" className="text-xs">
                        NEU
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {alert.message}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!alert.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(alert.id)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Gelesen
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResolve(alert.id)}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Lösen
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Erstellt:</span>
                <span>{alert.createdAt.toLocaleDateString('de-DE')} um {alert.createdAt.toLocaleTimeString('de-DE')}</span>
              </div>
              
              {alert.employeeId && (
                <div className="flex justify-between">
                  <span>Betroffener Mitarbeiter:</span>
                  <span>ID: {alert.employeeId}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}