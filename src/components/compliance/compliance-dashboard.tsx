import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, FileText, Shield, TrendingUp, Users, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { useCompliance } from "@/hooks/use-compliance";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { ComplianceAlert, ComplianceCheck, ComplianceReport } from "@/types/compliance";
import { ComplianceAlerts } from "./compliance-alerts";

interface ComplianceDashboardProps {
  onBack: () => void;
}

export function ComplianceDashboard({ onBack }: ComplianceDashboardProps) {
  const [currentReport, setCurrentReport] = useState<ComplianceReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { employees } = useEmployeeStorage();
  const { payrollEntries } = usePayrollStorage();
  const { 
    reports, 
    activeAlerts, 
    unreadAlerts,
    generateComplianceReport,
    markAlertAsRead,
    resolveAlert
  } = useCompliance();

  // Generate initial report on mount
  useEffect(() => {
    if (employees.length > 0 && !currentReport) {
      handleGenerateReport();
    }
  }, [employees]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate some processing time
    setTimeout(() => {
      const report = generateComplianceReport(employees, payrollEntries);
      setCurrentReport(report);
      setIsGenerating(false);
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'non_compliant':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compliance-Übersicht"
        description="Rechtliche Compliance und Überwachung der Lohnabrechnung"
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            Zurück
          </Button>
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            {isGenerating ? 'Prüfung läuft...' : 'Compliance prüfen'}
          </Button>
        </div>
      </PageHeader>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktive Warnungen</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ungelesen</p>
                <p className="text-2xl font-bold">{unreadAlerts.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Geprüfte Mitarbeiter</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Berichte</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Aktuelle Prüfung</TabsTrigger>
          <TabsTrigger value="alerts">Warnungen</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {isGenerating && (
            <Card className="shadow-card">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                  <p className="text-lg font-medium">Compliance-Prüfung läuft...</p>
                  <p className="text-sm text-muted-foreground">
                    Überprüfe Mindestlohn, Sozialversicherung und Dokumentation
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentReport && !isGenerating && (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Compliance-Zusammenfassung</CardTitle>
                  <CardDescription>
                    Generiert am {currentReport.generatedAt.toLocaleDateString('de-DE')} um {currentReport.generatedAt.toLocaleTimeString('de-DE')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{currentReport.summary.compliant}</div>
                      <div className="text-sm text-muted-foreground">Konform</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{currentReport.summary.warnings}</div>
                      <div className="text-sm text-muted-foreground">Warnungen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">{currentReport.summary.nonCompliant}</div>
                      <div className="text-sm text-muted-foreground">Nicht konform</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">{currentReport.summary.critical}</div>
                      <div className="text-sm text-muted-foreground">Kritisch</div>
                    </div>
                  </div>

                  {currentReport.summary.critical > 0 && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Kritische Compliance-Verstöße gefunden!</strong> Bitte prüfen Sie die Details und nehmen Sie umgehend Korrekturen vor.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Checks */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Detaillierte Prüfungsergebnisse</CardTitle>
                  <CardDescription>
                    Alle durchgeführten Compliance-Checks im Überblick
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentReport.checks.map((check, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                        {getStatusIcon(check.status)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{check.message}</h4>
                            {getSeverityBadge(
                              // Find the rule to get severity
                              (() => {
                                // This is a simplified lookup - in real app you'd pass the rule data
                                const severityMap: Record<string, string> = {
                                  'minimum_wage_check': 'critical',
                                  'social_security_limits': 'warning',
                                  'employee_data_completeness': 'warning',
                                  'payroll_documentation': 'error'
                                };
                                return severityMap[check.ruleId] || 'info';
                              })()
                            )}
                          </div>
                          {check.details && (
                            <p className="text-sm text-muted-foreground">{check.details}</p>
                          )}
                          {check.recommendations && check.recommendations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Empfehlungen:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {check.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span>•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {check.checkedAt.toLocaleTimeString('de-DE')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!currentReport && !isGenerating && employees.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Mitarbeiterdaten</h3>
                <p className="text-sm text-muted-foreground">
                  Fügen Sie Mitarbeiter hinzu, um Compliance-Prüfungen durchzuführen.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          <ComplianceAlerts 
            alerts={activeAlerts}
            onMarkAsRead={markAlertAsRead}
            onResolve={resolveAlert}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {reports.length > 0 ? (
            reports.map((report) => (
              <Card key={report.id} className="shadow-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Compliance-Bericht
                      </CardTitle>
                      <CardDescription>
                        {report.generatedAt.toLocaleDateString('de-DE')} - {report.generatedAt.toLocaleTimeString('de-DE')}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentReport(report)}
                    >
                      Details anzeigen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-success">{report.summary.compliant}</div>
                      <div className="text-xs text-muted-foreground">Konform</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-warning">{report.summary.warnings}</div>
                      <div className="text-xs text-muted-foreground">Warnungen</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-destructive">{report.summary.nonCompliant}</div>
                      <div className="text-xs text-muted-foreground">Nicht konform</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-destructive">{report.summary.critical}</div>
                      <div className="text-xs text-muted-foreground">Kritisch</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Berichte</h3>
                <p className="text-sm text-muted-foreground">
                  Führen Sie eine Compliance-Prüfung durch, um Berichte zu generieren.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}