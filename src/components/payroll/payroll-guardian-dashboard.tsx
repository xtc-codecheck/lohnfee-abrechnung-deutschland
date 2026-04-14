import React, { useState, useMemo } from 'react';
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown,
  RefreshCw, Settings, Activity, AlertCircle, Clock, ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePayrollGuardian } from '@/hooks/use-payroll-guardian';
import { useEmployees } from '@/contexts/employee-context';
import { useSupabasePayroll } from '@/hooks/use-supabase-payroll';
import { GuardianOverviewTab } from './guardian/guardian-overview-tab';
import { GuardianAnomaliesTab } from './guardian/guardian-anomalies-tab';
import { GuardianForecastsTab } from './guardian/guardian-forecasts-tab';
import { GuardianInsightsTab } from './guardian/guardian-insights-tab';

interface PayrollGuardianDashboardProps {
  onBack: () => void;
}

export function PayrollGuardianDashboard({ onBack }: PayrollGuardianDashboardProps) {
  const { employees } = useEmployees();
  const { payrollEntries } = useSupabasePayroll();
  const {
    anomalies, unresolvedAnomalies, criticalAnomalies, stats,
    isScanning, lastScanAt, runScan, resolveAnomaly, dismissAnomaly, getAllForecasts
  } = usePayrollGuardian();

  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const forecasts = useMemo(() => getAllForecasts(employees), [employees, getAllForecasts]);

  const handleRunScan = () => runScan(employees, payrollEntries);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Payroll Guardian
            </h1>
            <p className="text-muted-foreground">
              Anomalie-Erkennung, Compliance-Prüfung & Gehalts-Prognosen
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRunScan} disabled={isScanning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanne...' : 'Scan starten'}
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Health Score Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.healthScore}%</div>
            <Progress value={stats.healthScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.healthScore >= 80 ? '✅ Exzellent' : stats.healthScore >= 60 ? '⚠️ Akzeptabel' : '🚨 Kritisch'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Anomalien</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.unresolvedAnomalies}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.criticalAnomalies > 0 ? (
                <span className="text-destructive font-medium">{stats.criticalAnomalies} kritisch</span>
              ) : 'Keine kritischen Probleme'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
            {stats.trendsPositive > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> :
             stats.trendsNegative > 0 ? <TrendingDown className="h-4 w-4 text-destructive" /> :
             <Activity className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.trendsPositive > 0 && <span className="text-green-500">+{stats.trendsPositive}</span>}
              {stats.trendsNegative > 0 && <span className="text-destructive">-{stats.trendsNegative}</span>}
              {stats.trendsPositive === 0 && stats.trendsNegative === 0 && '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">vs. letzter Monat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Letzter Scan</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {lastScanAt
                ? new Date(lastScanAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                : 'Noch nie'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{employees.length} Mitarbeiter geprüft</p>
          </CardContent>
        </Card>
      </div>

      {criticalAnomalies.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kritische Probleme erkannt</AlertTitle>
          <AlertDescription>
            {criticalAnomalies.length} kritische Anomalie(n) erfordern sofortige Aufmerksamkeit.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="anomalies">
            Anomalien
            {unresolvedAnomalies.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">{unresolvedAnomalies.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forecasts">Prognosen</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <GuardianOverviewTab anomalies={anomalies} unresolvedAnomalies={unresolvedAnomalies} forecasts={forecasts} />
        </TabsContent>
        <TabsContent value="anomalies">
          <GuardianAnomaliesTab unresolvedAnomalies={unresolvedAnomalies} resolveAnomaly={resolveAnomaly} dismissAnomaly={dismissAnomaly} />
        </TabsContent>
        <TabsContent value="forecasts">
          <GuardianForecastsTab employees={employees} forecasts={forecasts} selectedEmployee={selectedEmployee} onSelectEmployee={setSelectedEmployee} />
        </TabsContent>
        <TabsContent value="insights">
          <GuardianInsightsTab forecasts={forecasts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
