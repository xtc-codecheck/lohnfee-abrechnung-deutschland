import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { compareInsurance, projectLongTermCosts, findBreakEvenPoint, FamilyStatus } from '@/utils/health-insurance-comparison';

export function HealthInsuranceComparison() {
  const [currentAge, setCurrentAge] = useState(35);
  const [grossMonthly, setGrossMonthly] = useState(5000);
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus>('single');
  const [numberOfChildren, setNumberOfChildren] = useState(0);
  const [pkvMonthlyPremium, setPkvMonthlyPremium] = useState(450);
  const [gkvAdditionalRate, setGkvAdditionalRate] = useState(1.7);

  const comparison = useMemo(() => compareInsurance({
    currentAge, grossMonthly, insuranceType: 'gkv', gkvAdditionalRate,
    pkvMonthlyPremium, familyStatus, numberOfChildren,
  }), [currentAge, grossMonthly, familyStatus, numberOfChildren, pkvMonthlyPremium, gkvAdditionalRate]);

  const projection = useMemo(() => projectLongTermCosts({
    currentAge, grossMonthly, insuranceType: 'gkv', pkvMonthlyPremium, familyStatus, numberOfChildren,
  }, 30), [currentAge, grossMonthly, familyStatus, numberOfChildren, pkvMonthlyPremium]);

  const breakEven = useMemo(() => findBreakEvenPoint(projection), [projection]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  const chartData = projection.filter((_, i) => i % 5 === 0 || i === projection.length - 1).map(p => ({
    alter: p.age,
    GKV: Math.round(p.gkvMonthly),
    PKV: Math.round(p.pkvMonthly),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" />PKV vs. GKV Vergleichsrechner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><Label>Alter</Label><Input type="number" value={currentAge} onChange={(e) => setCurrentAge(Number(e.target.value))} /></div>
            <div><Label>Bruttogehalt (€/Monat)</Label><Input type="number" value={grossMonthly} onChange={(e) => setGrossMonthly(Number(e.target.value))} /></div>
            <div>
              <Label>Familienstatus</Label>
              <Select value={familyStatus} onValueChange={(v) => setFamilyStatus(v as FamilyStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Ledig</SelectItem>
                  <SelectItem value="married">Verheiratet</SelectItem>
                  <SelectItem value="married_children">Verheiratet mit Kindern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>PKV-Beitrag (€/Monat)</Label><Input type="number" value={pkvMonthlyPremium} onChange={(e) => setPkvMonthlyPremium(Number(e.target.value))} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Warnungen */}
      {comparison.recommendation.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">{comparison.recommendation.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Vergleich */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={comparison.recommendation.type === 'gkv' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">GKV</CardTitle>
              {comparison.recommendation.type === 'gkv' && <Badge>Empfohlen</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(comparison.gkv.employeeContribution)}<span className="text-sm font-normal text-muted-foreground">/Monat</span></div>
            <p className="text-sm text-muted-foreground mt-2">+ {formatCurrency(comparison.gkv.employerContribution)} Arbeitgeber</p>
            {familyStatus !== 'single' && <Badge variant="secondary" className="mt-2"><Users className="h-3 w-3 mr-1" />Familienversicherung inklusive</Badge>}
          </CardContent>
        </Card>

        <Card className={comparison.recommendation.type === 'pkv' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">PKV</CardTitle>
              {comparison.recommendation.type === 'pkv' && <Badge>Empfohlen</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(comparison.pkv.employeeContribution)}<span className="text-sm font-normal text-muted-foreground">/Monat</span></div>
            <p className="text-sm text-muted-foreground mt-2">AG-Zuschuss: {formatCurrency(comparison.pkv.employerContribution)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Langzeit-Prognose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />30-Jahres-Prognose</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="alter" label={{ value: 'Alter', position: 'bottom' }} />
                <YAxis tickFormatter={(v) => `${v}€`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="GKV" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="PKV" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">{breakEven.message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
