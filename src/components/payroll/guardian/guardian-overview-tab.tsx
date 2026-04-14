import { useMemo } from 'react';
import { CheckCircle, CheckCircle2, Target, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { PayrollAnomaly, SalaryForecast } from '@/types/payroll-guardian';
import { getSeverityColor, getSeverityBadge, getAnomalyIcon } from './guardian-helpers';

interface GuardianOverviewTabProps {
  anomalies: PayrollAnomaly[];
  unresolvedAnomalies: PayrollAnomaly[];
  forecasts: SalaryForecast[];
}

export function GuardianOverviewTab({ anomalies, unresolvedAnomalies, forecasts }: GuardianOverviewTabProps) {
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

  return (
    <div className="space-y-4">
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
    </div>
  );
}
