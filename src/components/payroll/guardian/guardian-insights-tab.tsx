import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SalaryForecast } from '@/types/payroll-guardian';

interface GuardianInsightsTabProps {
  forecasts: SalaryForecast[];
}

export function GuardianInsightsTab({ forecasts }: GuardianInsightsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
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
                    <Progress value={forecast.marketComparison.percentile} className="h-2 mt-1" />
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {forecast.marketComparison.percentile}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
              {(['low', 'medium', 'high'] as const).map(effort => (
                <div key={effort} className="flex justify-between text-sm">
                  <span>{effort === 'low' ? 'Sofort umsetzbar' : effort === 'medium' ? 'Mittelfristig' : 'Langfristig'}</span>
                  <span className="font-medium">
                    {forecasts
                      .reduce((sum, f) => sum + f.optimizationPotential
                        .filter(o => o.effort === effort)
                        .reduce((s, o) => s + o.potentialSaving, 0), 0)
                      .toLocaleString('de-DE')} €
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <Badge variant={opt.effort === 'low' ? 'default' : opt.effort === 'medium' ? 'secondary' : 'outline'}>
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
    </div>
  );
}
