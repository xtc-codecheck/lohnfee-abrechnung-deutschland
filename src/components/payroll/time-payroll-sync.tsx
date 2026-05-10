import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowRight,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTimePayrollIntegration } from "@/hooks/use-time-payroll-integration";
import { PayrollTimeIntegration } from "@/utils/time-payroll-integration";

interface TimePayrollSyncProps {
  onSyncComplete?: () => void;
}

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

export function TimePayrollSync({ onSyncComplete }: TimePayrollSyncProps) {
  const { toast } = useToast();
  const { 
    isProcessing, 
    getTimeIntegrationForPeriod, 
    syncTimeToPayroll,
    checkTimeDataCompleteness 
  } = useTimePayrollIntegration();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [integrations, setIntegrations] = useState<PayrollTimeIntegration[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadIntegrationData = () => {
    const data = getTimeIntegrationForPeriod(selectedYear, selectedMonth);
    setIntegrations(data);
    setSelectedEmployees(new Set(data.map(i => i.employeeId)));
    setHasLoaded(true);
  };

  const handleSync = async () => {
    const result = await syncTimeToPayroll(
      selectedYear, 
      selectedMonth,
      Array.from(selectedEmployees)
    );

    if (result.success) {
      toast({
        title: "Synchronisation erfolgreich",
        description: `${result.entriesCreated} Lohnabrechnungen erstellt`
      });
      onSyncComplete?.();
    } else {
      toast({
        title: "Fehler bei der Synchronisation",
        description: result.errors.join(", "),
        variant: "destructive"
      });
    }
  };

  const toggleEmployee = (employeeId: string) => {
    const newSet = new Set(selectedEmployees);
    if (newSet.has(employeeId)) {
      newSet.delete(employeeId);
    } else {
      newSet.add(employeeId);
    }
    setSelectedEmployees(newSet);
  };

  const toggleAll = () => {
    if (selectedEmployees.size === integrations.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(integrations.map(i => i.employeeId)));
    }
  };

  const completeness = hasLoaded ? checkTimeDataCompleteness(selectedYear, selectedMonth) : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'incomplete':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'discrepancies':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="bg-success/10 text-success">Vollständig</Badge>;
      case 'incomplete':
        return <Badge variant="destructive">Unvollständig</Badge>;
      case 'discrepancies':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Diskrepanzen</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Zeiterfassung → Lohnabrechnung
        </CardTitle>
        <CardDescription>
          Übernehmen Sie Arbeitszeiten aus der Zeiterfassung in die Lohnabrechnung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Periodenauswahl */}
        <div className="flex gap-4 items-end">
          <div className="space-y-2">
            <Label>Jahr</Label>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(v) => { setSelectedYear(parseInt(v)); setHasLoaded(false); }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Monat</Label>
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(v) => { setSelectedMonth(parseInt(v)); setHasLoaded(false); }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadIntegrationData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Daten laden
          </Button>
        </div>

        {/* Status-Übersicht */}
        {completeness && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-success/10 border-success/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold text-success">{completeness.complete}</p>
                  <p className="text-sm text-success">Vollständig</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-warning/10 border-warning/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-2xl font-bold text-warning">{completeness.withDiscrepancies}</p>
                  <p className="text-sm text-warning">Mit Hinweisen</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-destructive/10 border-destructive/30">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-destructive">{completeness.incomplete}</p>
                  <p className="text-sm text-destructive">Unvollständig</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mitarbeiterliste */}
        {hasLoaded && integrations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedEmployees.size === integrations.length}
                  onCheckedChange={toggleAll}
                />
                <Label>Alle auswählen ({selectedEmployees.size}/{integrations.length})</Label>
              </div>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {integrations.length} Mitarbeiter
              </Badge>
            </div>

            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {integrations.map((integration) => (
                <div 
                  key={integration.employeeId} 
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedEmployees.has(integration.employeeId)}
                        onCheckedChange={() => toggleEmployee(integration.employeeId)}
                      />
                      <div>
                        <p className="font-medium">{integration.employeeName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{integration.timeData.actualWorkingDays}/{integration.timeData.expectedWorkingDays} Arbeitstage</span>
                          <span>•</span>
                          <span>{integration.timeData.regularHours.toFixed(1)}h regulär</span>
                          {integration.timeData.overtimeHours > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-warning">
                                +{integration.timeData.overtimeHours.toFixed(1)}h Überstunden
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.discrepancies.length > 0 && (
                        <Badge variant="outline" className="text-warning">
                          {integration.discrepancies.length} Hinweise
                        </Badge>
                      )}
                      {getStatusBadge(integration.status)}
                    </div>
                  </div>

                  {/* Zeitdetails */}
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                    {integration.timeData.vacationDays > 0 && (
                      <div className="bg-info/10 text-info px-2 py-1 rounded">
                        {integration.timeData.vacationDays} Urlaubstage
                      </div>
                    )}
                    {integration.timeData.sickDays > 0 && (
                      <div className="bg-destructive/10 text-destructive px-2 py-1 rounded">
                        {integration.timeData.sickDays} Krankheitstage
                      </div>
                    )}
                    {integration.timeData.nightHours > 0 && (
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded">
                        {integration.timeData.nightHours.toFixed(1)}h Nachtarbeit
                      </div>
                    )}
                    {integration.timeData.sundayHours > 0 && (
                      <div className="bg-warning/10 text-warning px-2 py-1 rounded">
                        {integration.timeData.sundayHours.toFixed(1)}h Sonntagsarbeit
                      </div>
                    )}
                  </div>

                  {/* Diskrepanzen anzeigen */}
                  {integration.discrepancies.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {integration.discrepancies.slice(0, 3).map((disc, idx) => (
                        <div 
                          key={idx} 
                          className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                            disc.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                            disc.severity === 'medium' ? 'bg-warning/10 text-warning' :
                            'bg-muted text-foreground'
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {disc.date}: {disc.description}
                        </div>
                      ))}
                      {integration.discrepancies.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{integration.discrepancies.length - 3} weitere Hinweise
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasLoaded && integrations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Keine Zeiterfassungsdaten für diesen Zeitraum vorhanden</p>
          </div>
        )}

        {/* Sync Button */}
        {hasLoaded && integrations.length > 0 && (
          <div className="flex justify-end">
            <Button 
              onClick={handleSync} 
              disabled={isProcessing || selectedEmployees.size === 0}
              className="bg-gradient-primary"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Synchronisiere...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {selectedEmployees.size} Abrechnungen erstellen
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
