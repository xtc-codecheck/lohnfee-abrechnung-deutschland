import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { AutomationJobsTab } from "./automation-jobs-tab";
import { AutomationEmailTab } from "./automation-email-tab";
import { AutomationIntegrationsTab } from "./automation-integrations-tab";
import { AutomationHistoryTab } from "./automation-history-tab";

interface AutomationDashboardProps {
  onBack: () => void;
}

export function AutomationDashboard({ onBack }: AutomationDashboardProps) {
  const mockJobs = [
    { id: '1', name: 'Monatliche Lohnabrechnung', schedule: 'Jeden 25. des Monats', isActive: true, lastRun: new Date(2024, 11, 25), nextRun: new Date(2025, 0, 25), employeeCount: 15, status: 'completed' },
    { id: '2', name: 'Wöchentliche Zeiterfassung', schedule: 'Jeden Freitag', isActive: true, lastRun: new Date(2024, 11, 20), nextRun: new Date(2024, 11, 27), employeeCount: 15, status: 'running' },
    { id: '3', name: 'Quartalsmeldungen', schedule: 'Quartalsende', isActive: false, lastRun: new Date(2024, 8, 30), nextRun: new Date(2024, 11, 31), employeeCount: 15, status: 'pending' }
  ];

  const mockExecutions = [
    { id: '1', jobName: 'Monatliche Lohnabrechnung', startedAt: new Date(2024, 11, 25, 9, 0), completedAt: new Date(2024, 11, 25, 9, 45), status: 'completed', processedEmployees: 15, totalEmployees: 15, emailsSent: 15 },
    { id: '2', jobName: 'Wöchentliche Zeiterfassung', startedAt: new Date(2024, 11, 20, 17, 0), completedAt: new Date(2024, 11, 20, 17, 15), status: 'completed', processedEmployees: 15, totalEmployees: 15, emailsSent: 0 }
  ];

  const getStatusBadge = (status: string) => {
    const variants = { 'completed': 'default', 'running': 'secondary', 'pending': 'outline', 'error': 'destructive' } as const;
    const labels = { 'completed': 'Abgeschlossen', 'running': 'Läuft', 'pending': 'Ausstehend', 'error': 'Fehler' };
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{labels[status as keyof typeof labels] || status}</Badge>;
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Aktive Jobs</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockJobs.filter(j => j.isActive).length}</div>
            <p className="text-xs text-muted-foreground">von {mockJobs.length} Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Letzte Ausführung</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Heute</div>
            <p className="text-xs text-muted-foreground">Lohnabrechnung</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">E-Mails gesendet</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">142</div>
            <p className="text-xs text-muted-foreground">Letzter Monat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Erfolgsrate</CardTitle></CardHeader>
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
        <TabsContent value="jobs"><AutomationJobsTab jobs={mockJobs} getStatusBadge={getStatusBadge} /></TabsContent>
        <TabsContent value="email"><AutomationEmailTab /></TabsContent>
        <TabsContent value="integrations"><AutomationIntegrationsTab /></TabsContent>
        <TabsContent value="history"><AutomationHistoryTab executions={mockExecutions} getStatusBadge={getStatusBadge} /></TabsContent>
      </Tabs>
    </div>
  );
}
