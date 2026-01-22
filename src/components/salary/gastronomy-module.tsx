import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Moon, Coffee, Coins, AlertTriangle } from 'lucide-react';
import { calculateGastronomyPayroll, calculateMinijobGastronomy } from '@/utils/gastronomy-payroll';

export function GastronomyModule() {
  const [grossMonthly, setGrossMonthly] = useState(2800);
  const [hoursWorked, setHoursWorked] = useState(160);
  const [breakfastsProvided, setBreakfastsProvided] = useState(0);
  const [lunchesProvided, setLunchesProvided] = useState(20);
  const [dinnersProvided, setDinnersProvided] = useState(0);
  const [monthlyTips, setMonthlyTips] = useState(200);
  const [tipsFromEmployer, setTipsFromEmployer] = useState(false);
  const [nightHours, setNightHours] = useState(20);
  const [sundayHours, setSundayHours] = useState(16);
  const [holidayHours, setHolidayHours] = useState(0);
  const [isMinijob, setIsMinijob] = useState(false);

  const result = useMemo(() => calculateGastronomyPayroll({
    grossMonthly, hoursWorked, breakfastsProvided, lunchesProvided, dinnersProvided,
    monthlyTips, tipsFromEmployer, nightHours, sundayHours, holidayHours, isMinijob,
  }), [grossMonthly, hoursWorked, breakfastsProvided, lunchesProvided, dinnersProvided, monthlyTips, tipsFromEmployer, nightHours, sundayHours, holidayHours, isMinijob]);

  const minijobCheck = useMemo(() => {
    if (!isMinijob) return null;
    return calculateMinijobGastronomy(hoursWorked, grossMonthly / hoursWorked, lunchesProvided + dinnersProvided);
  }, [isMinijob, hoursWorked, grossMonthly, lunchesProvided, dinnersProvided]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Gastronomie-Lohnrechner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Grundgehalt (€)</Label>
              <Input type="number" value={grossMonthly} onChange={(e) => setGrossMonthly(Number(e.target.value))} />
            </div>
            <div>
              <Label>Arbeitsstunden</Label>
              <Input type="number" value={hoursWorked} onChange={(e) => setHoursWorked(Number(e.target.value))} />
            </div>
            <div>
              <Label>Trinkgeld (€/Monat)</Label>
              <Input type="number" value={monthlyTips} onChange={(e) => setMonthlyTips(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={isMinijob} onCheckedChange={setIsMinijob} />
              <Label>Minijob</Label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label className="flex items-center gap-1"><Coffee className="h-4 w-4" />Frühstück (Anzahl)</Label>
              <Input type="number" value={breakfastsProvided} onChange={(e) => setBreakfastsProvided(Number(e.target.value))} />
            </div>
            <div>
              <Label>Mittagessen (Anzahl)</Label>
              <Input type="number" value={lunchesProvided} onChange={(e) => setLunchesProvided(Number(e.target.value))} />
            </div>
            <div>
              <Label>Abendessen (Anzahl)</Label>
              <Input type="number" value={dinnersProvided} onChange={(e) => setDinnersProvided(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label className="flex items-center gap-1"><Moon className="h-4 w-4" />Nachtstunden (20-6 Uhr)</Label>
              <Input type="number" value={nightHours} onChange={(e) => setNightHours(Number(e.target.value))} />
            </div>
            <div>
              <Label>Sonntagsstunden</Label>
              <Input type="number" value={sundayHours} onChange={(e) => setSundayHours(Number(e.target.value))} />
            </div>
            <div>
              <Label>Feiertagsstunden</Label>
              <Input type="number" value={holidayHours} onChange={(e) => setHolidayHours(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch checked={tipsFromEmployer} onCheckedChange={setTipsFromEmployer} />
            <Label>Trinkgeld vom Arbeitgeber verteilt</Label>
            {tipsFromEmployer && <Badge variant="destructive">Steuerpflichtig!</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Minijob-Warnung */}
      {minijobCheck?.isOverLimit && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Minijob-Grenze überschritten!</h3>
              <p className="text-sm text-muted-foreground">
                Gesamt {formatCurrency(minijobCheck.totalBenefit)} übersteigt die 556€-Grenze.
                Die Beschäftigung wird sozialversicherungspflichtig.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ergebnisse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sachbezüge */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sachbezugswerte 2025</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Frühstück ({result.mealBenefitDetails.breakfast.count}x à 2,17€):</span>
              <span>{formatCurrency(result.mealBenefitDetails.breakfast.value)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mittagessen ({result.mealBenefitDetails.lunch.count}x à 4,13€):</span>
              <span>{formatCurrency(result.mealBenefitDetails.lunch.value)}</span>
            </div>
            <div className="flex justify-between">
              <span>Abendessen ({result.mealBenefitDetails.dinner.count}x à 4,13€):</span>
              <span>{formatCurrency(result.mealBenefitDetails.dinner.value)}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Sachbezug gesamt:</span>
              <span>{formatCurrency(result.mealBenefitTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Trinkgeld */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4" />
              Trinkgeld
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {result.tipsTaxFree > 0 && (
              <div className="flex justify-between">
                <span>Steuerfrei (direkt vom Gast):</span>
                <span className="text-primary font-medium">{formatCurrency(result.tipsTaxFree)}</span>
              </div>
            )}
            {result.tipsTaxable > 0 && (
              <div className="flex justify-between">
                <span>Steuerpflichtig (vom AG verteilt):</span>
                <span className="text-destructive">{formatCurrency(result.tipsTaxable)}</span>
              </div>
            )}
            <Badge variant={tipsFromEmployer ? 'destructive' : 'default'} className="mt-2">
              {tipsFromEmployer ? '⚠️ Trinkgeld ist steuerpflichtig' : '✅ Trinkgeld komplett steuerfrei'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* SFN-Zuschläge */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SFN-Zuschläge (Sonn-, Feier-, Nachtarbeit)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Nachtzuschlag (25%)</p>
              <p className="text-xl font-bold">{formatCurrency(result.nightBonus)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Sonntagszuschlag (50%)</p>
              <p className="text-xl font-bold">{formatCurrency(result.sundayBonus)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Feiertagszuschlag (125%)</p>
              <p className="text-xl font-bold">{formatCurrency(result.holidayBonus)}</p>
            </div>
          </div>
          {result.taxFreeBonuses > 0 && (
            <Badge variant="secondary" className="mt-3">✅ {formatCurrency(result.taxFreeBonuses)} steuerfrei (§ 3b EStG)</Badge>
          )}
        </CardContent>
      </Card>

      {/* Gesamt */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Steuerpflichtig</p>
              <p className="text-2xl font-bold">{formatCurrency(result.taxableIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Steuerfrei</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(result.taxFreeIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Brutto gesamt</p>
              <p className="text-2xl font-bold">{formatCurrency(result.totalGross)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
