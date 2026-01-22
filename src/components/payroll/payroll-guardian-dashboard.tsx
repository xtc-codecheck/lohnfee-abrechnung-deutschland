import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Settings,
  Activity,
  Eye,
  ChevronRight,
  ArrowLeft,
  BarChart3,
  AlertCircle,
  Clock,
  Users,
  XCircle,
  CheckCircle2,
  Lightbulb,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePayrollGuardian } from '@/hooks/use-payroll-guardian';
import { useEmployeeStorage } from '@/hooks/use-employee-storage';
import { usePayrollStorage } from '@/hooks/use-payroll-storage';
import { PayrollAnomaly, SalaryForecast } from '@/types/payroll-guardian';
import { Employee } from '@/types/employee';
import { 
  ChartContainer, 
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

interface PayrollGuardianDashboardProps {
  onBack: () => void;
}

export function PayrollGuardianDashboard({ onBack }: PayrollGuardianDashboardProps) {
  const { employees } = useEmployeeStorage();
  const { payrollEntries, payrollPeriods } = usePayrollStorage();
  const {
    anomalies,
    unresolvedAnomalies,
    criticalAnomalies,
    stats,
    isScanning,
    lastScanAt,
    runScan,
    resolveAnomaly,
    dismissAnomaly,
    getForecast,
    getAllForecasts
  } = usePayrollGuardian();

  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showForecast, setShowForecast] = useState(false);

  // Forecasts berechnen
  const forecasts = useMemo(() => {
    return getAllForecasts(employees);
  }, [employees, getAllForecasts]);

  // Scan ausführen
  const handleRunScan = () => {
    runScan(employees, payrollEntries);
  };

  // Anomalie-Farben
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Kritisch</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">Hoch</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">Mittel</Badge>;
      case 'low': return <Badge variant="secondary">Niedrig</Badge>;
      default: return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'salary-spike':
      case 'salary-drop':
        return <TrendingUp className="h-4 w-4" />;
      case 'overtime-excessive':
        return <Clock className="h-4 w-4" />;
      case 'minimum-wage-violation':
        return <AlertCircle className="h-4 w-4" />;
      case 'working-time-violation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'duplicate-entry':
      case 'missing-entry':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Chart-Daten für Health Score
  const healthScoreData = [
    { name: 'Gesund', value: stats.healthScore, fill: 'hsl(var(--primary))' },
    { name: 'Risiko', value: 100 - stats.healthScore, fill: 'hsl(var(--muted))' }
  ];

  // Anomalie-Verteilung nach Typ
  const anomalyDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    unresolvedAnomalies.forEach(a => {
      distribution[a.type] = (distribution[a.type] || 0) + 1;
    });
    return Object.entries(distribution).map(([type, count]) => ({
      type: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count
    }));
  }, [unresolvedAnomalies]);

  const selectedForecast = selectedEmployee 
    ? forecasts.find(f => f.employeeId === selectedEmployee)
    : null;

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
          <Button
            variant="outline"
            onClick={handleRunScan}
            disabled={isScanning}
          >
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
              {stats.healthScore >= 80 ? '✅ Exzellent' : 
               stats.healthScore >= 60 ? '⚠️ Akzeptabel' : 
               '🚨 Kritisch'}
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
              {stats.criticalAnomalies > 0 && (
                <span className="text-red-500 font-medium">
                  {stats.criticalAnomalies} kritisch
                </span>
              )}
              {stats.criticalAnomalies === 0 && 'Keine kritischen Probleme'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
            {stats.trendsPositive > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : stats.trendsNegative > 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Activity className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.trendsPositive > 0 && (
                <span className="text-green-500">+{stats.trendsPositive}</span>
              )}
              {stats.trendsNegative > 0 && (
                <span className="text-red-500">-{stats.trendsNegative}</span>
              )}
              {stats.trendsPositive === 0 && stats.trendsNegative === 0 && '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs. letzter Monat
            </p>
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
                ? new Date(lastScanAt).toLocaleString('de-DE', { 
                    day: '2-digit', 
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Noch nie'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {employees.length} Mitarbeiter geprüft
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAnomalies.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kritische Probleme erkannt</AlertTitle>
          <AlertDescription>
            {criticalAnomalies.length} kritische Anomalie(n) erfordern sofortige Aufmerksamkeit.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="anomalies">
            Anomalien
            {unresolvedAnomalies.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {unresolvedAnomalies.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forecasts">Prognosen</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Anomalie-Verteilung */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anomalie-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                {anomalyDistribution.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={anomalyDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="type" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Keine Anomalien erkannt</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Letzte Anomalien */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Letzte Anomalien</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  {unresolvedAnomalies.slice(0, 5).map(anomaly => (
                    <div 
                      key={anomaly.id}
                      className="flex items-center justify-between p-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getSeverityColor(anomaly.severity)} text-white`}>
                          {getAnomalyIcon(anomaly.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{anomaly.title}</p>
                          <p className="text-xs text-muted-foreground">{anomaly.employeeName}</p>
                        </div>
                      </div>
                      {getSeverityBadge(anomaly.severity)}
                    </div>
                  ))}
                  {unresolvedAnomalies.length === 0 && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Keine offenen Anomalien</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {anomalies.filter(a => a.isResolved).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Gelöste Anomalien</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                    <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{forecasts.length}</p>
                    <p className="text-sm text-muted-foreground">Gehalts-Prognosen</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                    <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {forecasts.reduce((sum, f) => sum + f.optimizationPotential.length, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Optimierungstipps</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alle Anomalien</CardTitle>
              <CardDescription>
                Erkannte Unregelmäßigkeiten in der Lohnabrechnung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Schwere</TableHead>
                    <TableHead>Erkannt</TableHead>
                    <TableHead>Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unresolvedAnomalies.map(anomaly => (
                    <TableRow key={anomaly.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAnomalyIcon(anomaly.type)}
                          <span className="text-sm">{anomaly.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{anomaly.employeeName}</TableCell>
                      <TableCell className="max-w-xs truncate">{anomaly.description}</TableCell>
                      <TableCell>{getSeverityBadge(anomaly.severity)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(anomaly.detectedAt).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => resolveAnomaly(anomaly.id, 'Manuell geprüft')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => dismissAnomaly(anomaly.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {unresolvedAnomalies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Keine offenen Anomalien. Führen Sie einen Scan durch.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Employee List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Mitarbeiter</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {employees.map(employee => (
                    <div
                      key={employee.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                        selectedEmployee === employee.id 
                          ? 'bg-primary/10 border border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedEmployee(employee.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {employee.personalData.firstName} {employee.personalData.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.employmentData.position}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Forecast Detail */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedForecast ? `Prognose: ${selectedForecast.employeeName}` : 'Wählen Sie einen Mitarbeiter'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedForecast ? (
                  <div className="space-y-6">
                    {/* Current Salary */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Aktuelles Gehalt</p>
                        <p className="text-2xl font-bold">
                          {selectedForecast.currentSalary.toLocaleString('de-DE')} €
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Marktposition</p>
                        <p className="text-lg font-semibold">
                          {selectedForecast.marketComparison.percentile}. Perzentil
                        </p>
                      </div>
                    </div>

                    {/* Projection Chart */}
                    <div>
                      <h4 className="font-medium mb-3">5-Jahres-Prognose</h4>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedForecast.projections.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis 
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              formatter={(value: number) => [`${value.toLocaleString('de-DE')} €`, 'Prognose']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="projectedSalary" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={{ fill: 'hsl(var(--primary))' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Career Milestones */}
                    <div>
                      <h4 className="font-medium mb-3">Karriere-Meilensteine</h4>
                      <div className="space-y-2">
                        {selectedForecast.careerPath.slice(0, 3).map((milestone, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{milestone.event}</p>
                              <p className="text-sm text-muted-foreground">Jahr {milestone.year}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-600 font-medium">
                                +{milestone.salaryImpact.toLocaleString('de-DE')} €
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(milestone.probability * 100).toFixed(0)}% Wahrscheinlichkeit
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optimization Suggestions */}
                    <div>
                      <h4 className="font-medium mb-3">Optimierungspotenzial</h4>
                      <div className="space-y-2">
                        {selectedForecast.optimizationPotential.slice(0, 3).map((opt, idx) => (
                          <div 
                            key={idx}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium">{opt.title}</p>
                              <Badge variant="outline">
                                +{opt.potentialSaving.toLocaleString('de-DE')} €/Jahr
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{opt.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                      <p>Wählen Sie einen Mitarbeiter aus der Liste,</p>
                      <p>um dessen Gehaltsprognose zu sehen.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Market Comparison Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Marktvergleich</CardTitle>
                <CardDescription>Gehälter im Branchenvergleich</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecasts.slice(0, 5).map(forecast => (
                    <div key={forecast.employeeId} className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{forecast.employeeName}</p>
                        <Progress 
                          value={forecast.marketComparison.percentile} 
                          className="h-2 mt-1"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {forecast.marketComparison.percentile}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Total Optimization Potential */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gesamtes Optimierungspotenzial</CardTitle>
                <CardDescription>Mögliche Einsparungen pro Jahr</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-4xl font-bold text-primary">
                    {forecasts
                      .reduce((sum, f) => sum + f.optimizationPotential.reduce((s, o) => s + o.potentialSaving, 0), 0)
                      .toLocaleString('de-DE')} €
                  </p>
                  <p className="text-muted-foreground mt-2">
                    bei Umsetzung aller Optimierungsvorschläge
                  </p>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sofort umsetzbar</span>
                    <span className="font-medium">
                      {forecasts
                        .reduce((sum, f) => sum + f.optimizationPotential
                          .filter(o => o.effort === 'low')
                          .reduce((s, o) => s + o.potentialSaving, 0), 0)
                        .toLocaleString('de-DE')} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mittelfristig</span>
                    <span className="font-medium">
                      {forecasts
                        .reduce((sum, f) => sum + f.optimizationPotential
                          .filter(o => o.effort === 'medium')
                          .reduce((s, o) => s + o.potentialSaving, 0), 0)
                        .toLocaleString('de-DE')} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Langfristig</span>
                    <span className="font-medium">
                      {forecasts
                        .reduce((sum, f) => sum + f.optimizationPotential
                          .filter(o => o.effort === 'high')
                          .reduce((s, o) => s + o.potentialSaving, 0), 0)
                        .toLocaleString('de-DE')} €
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Empfehlungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {forecasts
                  .flatMap(f => f.optimizationPotential.map(o => ({ ...o, employee: f.employeeName })))
                  .sort((a, b) => b.potentialSaving - a.potentialSaving)
                  .slice(0, 6)
                  .map((opt, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge 
                          variant={opt.effort === 'low' ? 'default' : opt.effort === 'medium' ? 'secondary' : 'outline'}
                        >
                          {opt.effort === 'low' ? 'Einfach' : opt.effort === 'medium' ? 'Mittel' : 'Komplex'}
                        </Badge>
                        <span className="text-green-600 font-semibold text-sm">
                          +{opt.potentialSaving.toLocaleString('de-DE')} €
                        </span>
                      </div>
                      <h4 className="font-medium">{opt.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{opt.employee}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
