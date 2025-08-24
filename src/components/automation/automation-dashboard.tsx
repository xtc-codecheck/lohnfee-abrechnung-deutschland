import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  Settings, 
  Mail, 
  Calendar, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Send,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface AutomationDashboardProps {
  onBack: () => void;
}

export function AutomationDashboard({ onBack }: AutomationDashboardProps) {
  const [zapierWebhook, setZapierWebhook] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock-Daten für Jobs
  const mockJobs = [
    {
      id: '1',
      name: 'Monatliche Lohnabrechnung',
      schedule: 'Jeden 25. des Monats',
      isActive: true,
      lastRun: new Date(2024, 11, 25),
      nextRun: new Date(2025, 0, 25),
      employeeCount: 15,
      status: 'completed'
    },
    {
      id: '2', 
      name: 'Wöchentliche Zeiterfassung',
      schedule: 'Jeden Freitag',
      isActive: true,
      lastRun: new Date(2024, 11, 20),
      nextRun: new Date(2024, 11, 27),
      employeeCount: 15,
      status: 'running'
    },
    {
      id: '3',
      name: 'Quartalsmeldungen',
      schedule: 'Quartalsende',
      isActive: false,
      lastRun: new Date(2024, 8, 30),
      nextRun: new Date(2024, 11, 31),
      employeeCount: 15,
      status: 'pending'
    }
  ];

  const mockExecutions = [
    {
      id: '1',
      jobName: 'Monatliche Lohnabrechnung', 
      startedAt: new Date(2024, 11, 25, 9, 0),
      completedAt: new Date(2024, 11, 25, 9, 45),
      status: 'completed',
      processedEmployees: 15,
      totalEmployees: 15,
      emailsSent: 15
    },
    {
      id: '2',
      jobName: 'Wöchentliche Zeiterfassung',
      startedAt: new Date(2024, 11, 20, 17, 0),
      completedAt: new Date(2024, 11, 20, 17, 15),
      status: 'completed', 
      processedEmployees: 15,
      totalEmployees: 15,
      emailsSent: 0
    }
  ];

  const handleTriggerZapier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zapierWebhook) {
      alert("Bitte geben Sie Ihre Zapier Webhook-URL ein");
      return;
    }

    setIsLoading(true);
    console.log("Triggering Zapier webhook:", zapierWebhook);

    try {
      const response = await fetch(zapierWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
          event_type: "payroll_automation_test",
          data: {
            employees_processed: 15,
            total_amount: 45600,
            period: format(new Date(), 'MMMM yyyy', { locale: de })
          }
        }),
      });

      alert("Zapier-Webhook wurde ausgelöst. Prüfen Sie Ihre Zap-Historie für Bestätigung.");
    } catch (error) {
      console.error("Error triggering webhook:", error);
      alert("Fehler beim Auslösen des Zapier-Webhooks. Bitte prüfen Sie die URL.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'default',
      'running': 'secondary',
      'pending': 'outline',
      'error': 'destructive'
    } as const;
    
    const labels = {
      'completed': 'Abgeschlossen',
      'running': 'Läuft',
      'pending': 'Ausstehend',
      'error': 'Fehler'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">Automatisierung & Workflows</h1>
      </div>

      {/* Status-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockJobs.filter(j => j.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">von {mockJobs.length} Jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Letzte Ausführung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Heute</div>
            <p className="text-xs text-muted-foreground">Lohnabrechnung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">E-Mails gesendet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">142</div>
            <p className="text-xs text-muted-foreground">Letzter Monat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Erfolgsrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <Progress value={98.5} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="jobs">Recurring Jobs</TabsTrigger>
          <TabsTrigger value="email">E-Mail-System</TabsTrigger>
          <TabsTrigger value="integrations">Integrationen</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Automatische Lohnabrechnung</CardTitle>
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Neuen Job erstellen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Zeitplan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Letzte Ausführung</TableHead>
                    <TableHead>Nächste Ausführung</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell>{job.schedule}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {job.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Pause className="h-4 w-4 text-gray-500" />
                          )}
                          {getStatusBadge(job.status)}
                        </div>
                      </TableCell>
                      <TableCell>{job.employeeCount}</TableCell>
                      <TableCell>
                        {format(job.lastRun, 'dd.MM.yyyy HH:mm', { locale: de })}
                      </TableCell>
                      <TableCell>
                        {format(job.nextRun, 'dd.MM.yyyy HH:mm', { locale: de })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job-Konfiguration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Job-Name</Label>
                  <Input placeholder="z.B. Monatliche Lohnabrechnung" />
                </div>
                <div>
                  <Label>Zeitplan</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Zeitplan auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Abteilungen</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Abteilungen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Abteilungen</SelectItem>
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="verwaltung">Verwaltung</SelectItem>
                    <SelectItem value="vertrieb">Vertrieb</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Aktionen</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <label className="text-sm">Lohnabrechnung berechnen</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <label className="text-sm">PDF generieren</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <label className="text-sm">E-Mail versenden</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <label className="text-sm">DATEV-Export erstellen</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>E-Mail-Versand-System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <strong>SMTP konfiguriert:</strong> Ausgehende E-Mails werden über den 
                  konfigurierten SMTP-Server versendet. Letzter Test: Erfolgreich.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>E-Mail-Provider</Label>
                  <Select defaultValue="smtp">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="office365">Office 365</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Absender-E-Mail</Label>
                  <Input value="lohnabrechnung@unternehmen.de" readOnly />
                </div>
              </div>

              <div>
                <Label>Standard E-Mail-Vorlage für Lohnabrechnung</Label>
                <Textarea 
                  defaultValue="Sehr geehrte/r [VORNAME] [NACHNAME],

anbei erhalten Sie Ihre Lohnabrechnung für [MONAT] [JAHR].

Mit freundlichen Grüßen
Ihr HR-Team"
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">E-Mails heute</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">15</div>
                    <p className="text-xs text-muted-foreground">Lohnabrechnungen</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Warteschlange</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Ausstehend</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Fehlerrate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">0%</div>
                    <p className="text-xs text-muted-foreground">Letzte 30 Tage</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Zapier Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Verbinden Sie Ihr Lohnsystem mit über 5.000 Apps über Zapier. 
                  Erstellen Sie automatische Workflows für Buchhaltung, HR-Tools und mehr.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleTriggerZapier} className="space-y-4">
                <div>
                  <Label htmlFor="zapier-webhook">Zapier Webhook URL</Label>
                  <Input
                    id="zapier-webhook"
                    type="url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={zapierWebhook}
                    onChange={(e) => setZapierWebhook(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Erstellen Sie einen Zap mit einem Webhook-Trigger und fügen Sie die URL hier ein.
                  </p>
                </div>

                <Button type="submit" disabled={isLoading || !zapierWebhook}>
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Webhook wird ausgelöst...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Test-Webhook senden
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Beliebte Zapier-Integrationen:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>• Lohnabrechnungen → Google Drive</div>
                  <div>• Neue Mitarbeiter → Slack Benachrichtigung</div>
                  <div>• DATEV-Export → E-Mail an Steuerberater</div>
                  <div>• Compliance-Alerts → Microsoft Teams</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weitere Integrationen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Microsoft Office 365</h4>
                    <p className="text-sm text-muted-foreground">E-Mail, Calendar, Teams</p>
                  </div>
                  <Badge variant="outline">Verfügbar</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Slack</h4>
                    <p className="text-sm text-muted-foreground">Team-Benachrichtigungen</p>
                  </div>
                  <Badge variant="outline">Verfügbar</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Google Workspace</h4>
                    <p className="text-sm text-muted-foreground">Drive, Sheets, Calendar</p>
                  </div>
                  <Badge variant="outline">Verfügbar</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ausführungs-Verlauf</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Gestartet</TableHead>
                    <TableHead>Abgeschlossen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>E-Mails</TableHead>
                    <TableHead>Dauer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockExecutions.map(exec => (
                    <TableRow key={exec.id}>
                      <TableCell className="font-medium">{exec.jobName}</TableCell>
                      <TableCell>
                        {format(exec.startedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                      </TableCell>
                      <TableCell>
                        {exec.completedAt && format(exec.completedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                      </TableCell>
                      <TableCell>{getStatusBadge(exec.status)}</TableCell>
                      <TableCell>
                        {exec.processedEmployees}/{exec.totalEmployees}
                      </TableCell>
                      <TableCell>{exec.emailsSent}</TableCell>
                      <TableCell>
                        {exec.completedAt && 
                          `${Math.round((exec.completedAt.getTime() - exec.startedAt.getTime()) / 60000)} min`
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}