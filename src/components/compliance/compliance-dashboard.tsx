import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, Clock, FileX, Shield, Users, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { useCompliance } from "@/hooks/use-compliance";
import { ComplianceAlerts } from "./compliance-alerts";
import { MINIMUM_WAGES } from "@/types/compliance";

interface ComplianceDashboardProps {
  onBack: () => void;
}

export function ComplianceDashboard({ onBack }: ComplianceDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { employees } = useEmployeeStorage();
  const { payrollEntries } = usePayrollStorage();
  const { 
    generateComplianceReport, 
    activeAlerts, 
    unreadAlerts,
    markAlertAsRead,
    resolveAlert
  } = useCompliance();

  // Generate current compliance report (memoized to prevent infinite loops)
  const currentReport = useMemo(() => {
    return generateComplianceReport(employees, payrollEntries);
  }, [employees, payrollEntries, generateComplianceReport]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Kritisch</Badge>;
      case 'high':
        return <Badge variant="destructive">Hoch</Badge>;
      case 'medium':
        return <Badge variant="secondary">Mittel</Badge>;
      case 'low':
        return <Badge variant="outline">Niedrig</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate compliance metrics
  const complianceScore = currentReport.summary.totalChecks > 0 
    ? Math.round((currentReport.summary.passed / currentReport.summary.totalChecks) * 100)
    : 100;

  const criticalIssues = currentReport.checks.filter(c => c.severity === 'critical' && c.status === 'failed');
  const upcomingRetentions = employees.filter(emp => {
    const retentionDate = new Date(emp.employmentData.dataRetentionDate);
    const daysUntil = Math.ceil((retentionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 365;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
          <p className="text-muted-foreground">Überwachung rechtlicher Anforderungen und Compliance-Status</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Zurück
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceScore}%</div>
            <p className="text-xs text-muted-foreground">
              {currentReport.summary.passed} von {currentReport.summary.totalChecks} Prüfungen bestanden
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {unreadAlerts.length} ungelesen
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritische Probleme</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalIssues.length}</div>
            <p className="text-xs text-muted-foreground">
              Sofortige Aufmerksamkeit erforderlich
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aufbewahrungsfristen</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingRetentions.length}</div>
            <p className="text-xs text-muted-foreground">
              Ablauf innerhalb 12 Monaten
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="checks">Prüfungen</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="wages">Mindestlöhne</TabsTrigger>
          <TabsTrigger value="retention">Aufbewahrung</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Compliance Summary</CardTitle>
                <CardDescription>Aktueller Status aller Compliance-Prüfungen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Bestanden
                  </span>
                  <span className="font-semibold">{currentReport.summary.passed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Warnungen
                  </span>
                  <span className="font-semibold">{currentReport.summary.warnings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Fehlgeschlagen
                  </span>
                  <span className="font-semibold">{currentReport.summary.failed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileX className="h-4 w-4 text-red-800" />
                    Kritisch
                  </span>
                  <span className="font-semibold text-red-600">{currentReport.summary.critical}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Letzte Aktivitäten</CardTitle>
                <CardDescription>Neueste Compliance-Ereignisse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentReport.checks
                    .filter(check => check.status !== 'passed')
                    .slice(0, 5)
                    .map((check, index) => (
                      <div key={index} className="flex items-start gap-3">
                        {getStatusIcon(check.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{check.title}</p>
                          <p className="text-xs text-muted-foreground">{check.message}</p>
                        </div>
                        {getSeverityBadge(check.severity)}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Alle Compliance-Prüfungen</CardTitle>
              <CardDescription>
                Detaillierte Übersicht aller durchgeführten Prüfungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Prüfung</TableHead>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Schwere</TableHead>
                    <TableHead>Nachricht</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentReport.checks.map((check, index) => {
                    const employee = check.employeeId ? employees.find(e => e.id === check.employeeId) : null;
                    return (
                      <TableRow key={index}>
                        <TableCell>{getStatusIcon(check.status)}</TableCell>
                        <TableCell className="font-medium">{check.title}</TableCell>
                        <TableCell>
                          {employee ? `${employee.personalData.firstName} ${employee.personalData.lastName}` : '-'}
                        </TableCell>
                        <TableCell>{getSeverityBadge(check.severity)}</TableCell>
                        <TableCell className="max-w-xs truncate">{check.message}</TableCell>
                        <TableCell>{formatDate(check.checkDate)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <ComplianceAlerts
            alerts={activeAlerts}
            onMarkAsRead={markAlertAsRead}
            onResolve={resolveAlert}
          />
        </TabsContent>

        <TabsContent value="wages" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Mindestlohn-Überwachung</CardTitle>
              <CardDescription>Historische Mindestlöhne und aktuelle Compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {Object.entries(MINIMUM_WAGES).map(([year, wage]) => (
                    <Card key={year} className={year === '2025' ? 'border-primary bg-primary/5' : ''}>
                      <CardContent className="p-3 text-center">
                        <p className="text-sm font-medium">{year}</p>
                        <p className="text-lg font-bold">{wage.toFixed(2)}€</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Mitarbeiter unter Mindestlohn:</h4>
                  {employees.filter(emp => {
                    const hourlyWage = emp.salaryData.hourlyWage || (emp.salaryData.grossSalary / (emp.employmentData.weeklyHours * 4.33));
                    return hourlyWage < MINIMUM_WAGES[2025];
                  }).map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span>{emp.personalData.firstName} {emp.personalData.lastName}</span>
                      <span className="text-red-600 font-semibold">
                        {(emp.salaryData.hourlyWage || (emp.salaryData.grossSalary / (emp.employmentData.weeklyHours * 4.33))).toFixed(2)}€/h
                      </span>
                    </div>
                  ))}
                  {employees.filter(emp => {
                    const hourlyWage = emp.salaryData.hourlyWage || (emp.salaryData.grossSalary / (emp.employmentData.weeklyHours * 4.33));
                    return hourlyWage < MINIMUM_WAGES[2025];
                  }).length === 0 && (
                    <p className="text-green-600 p-3 bg-green-50 rounded-lg">
                      ✓ Alle Mitarbeiter erhalten mindestens den gesetzlichen Mindestlohn
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Aufbewahrungsfristen-Management</CardTitle>
              <CardDescription>Übersicht der Aufbewahrungsfristen für Mitarbeiterdaten</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Abteilung</TableHead>
                    <TableHead>Anstellungsende</TableHead>
                    <TableHead>Löschung möglich ab</TableHead>
                    <TableHead>Tage verbleibend</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(emp => {
                    const retentionDate = new Date(emp.employmentData.dataRetentionDate);
                    const daysUntil = Math.ceil((retentionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const endDate = emp.employmentData.endDate ? new Date(emp.employmentData.endDate) : null;
                    
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">
                          {emp.personalData.firstName} {emp.personalData.lastName}
                        </TableCell>
                        <TableCell>{emp.employmentData.department || '-'}</TableCell>
                        <TableCell>
                          {endDate ? endDate.toLocaleDateString('de-DE') : 'Aktiv'}
                        </TableCell>
                        <TableCell>{retentionDate.toLocaleDateString('de-DE')}</TableCell>
                        <TableCell>
                          {daysUntil < 0 ? '0' : daysUntil}
                        </TableCell>
                        <TableCell>
                          {daysUntil < 0 ? (
                            <Badge variant="destructive">Löschbar</Badge>
                          ) : daysUntil <= 365 ? (
                            <Badge variant="secondary">Bald fällig</Badge>
                          ) : (
                            <Badge variant="outline">Aktiv</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}