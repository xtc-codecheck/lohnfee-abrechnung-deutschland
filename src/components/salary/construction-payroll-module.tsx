import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { HardHat, Snowflake, Umbrella, AlertTriangle } from 'lucide-react';
import { calculateConstructionPayroll, calculateVacationAccount, ConstructionRegion, ConstructionTradeGroup } from '@/utils/construction-payroll';

export function ConstructionPayrollModule() {
  const [grossMonthly, setGrossMonthly] = useState(3800);
  const [region, setRegion] = useState<ConstructionRegion>('west');
  const [tradeGroup, setTradeGroup] = useState<ConstructionTradeGroup>('skilled');
  const [hoursWorked, setHoursWorked] = useState(168);
  const [isWinterPeriod, setIsWinterPeriod] = useState(false);
  const [winterHours, setWinterHours] = useState(0);
  const [dirtyWorkHours, setDirtyWorkHours] = useState(0);
  const [heightWorkHours, setHeightWorkHours] = useState(0);
  const [dangerWorkHours, setDangerWorkHours] = useState(0);
  const [vacationDaysTaken, setVacationDaysTaken] = useState(0);
  const [previousYearVacationDays, setPreviousYearVacationDays] = useState(5);

  const result = useMemo(() => calculateConstructionPayroll({
    grossMonthly, region, tradeGroup, hoursWorked, isWinterPeriod, winterHours,
    dirtyWorkHours, heightWorkHours, dangerWorkHours, vacationDaysTaken, previousYearVacationDays,
  }), [grossMonthly, region, tradeGroup, hoursWorked, isWinterPeriod, winterHours, dirtyWorkHours, heightWorkHours, dangerWorkHours, vacationDaysTaken, previousYearVacationDays]);

  const vacation = useMemo(() => calculateVacationAccount({
    grossMonthly, region, tradeGroup, hoursWorked, isWinterPeriod, vacationDaysTaken, previousYearVacationDays,
  }), [grossMonthly, region, tradeGroup, hoursWorked, isWinterPeriod, vacationDaysTaken, previousYearVacationDays]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  const tradeGroupLabels: Record<ConstructionTradeGroup, string> = {
    worker: 'Bauhelfer/Werker',
    skilled: 'Facharbeiter',
    foreman: 'Vorarbeiter/Polier',
    master: 'Baumeister',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardHat className="h-5 w-5" />
            Baulohn-Modul (SOKA-BAU)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Bruttogehalt (€)</Label>
              <Input type="number" value={grossMonthly} onChange={(e) => setGrossMonthly(Number(e.target.value))} />
            </div>
            <div>
              <Label>Tarifgebiet</Label>
              <Select value={region} onValueChange={(v) => setRegion(v as ConstructionRegion)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="east">Ost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lohngruppe</Label>
              <Select value={tradeGroup} onValueChange={(v) => setTradeGroup(v as ConstructionTradeGroup)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tradeGroupLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arbeitsstunden</Label>
              <Input type="number" value={hoursWorked} onChange={(e) => setHoursWorked(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Switch checked={isWinterPeriod} onCheckedChange={setIsWinterPeriod} />
              <Label className="flex items-center gap-1"><Snowflake className="h-4 w-4" />Winterperiode</Label>
            </div>
            {isWinterPeriod && (
              <div>
                <Label>Winterstunden</Label>
                <Input type="number" value={winterHours} onChange={(e) => setWinterHours(Number(e.target.value))} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label>Schmutzzulage (Stunden)</Label>
              <Input type="number" value={dirtyWorkHours} onChange={(e) => setDirtyWorkHours(Number(e.target.value))} />
            </div>
            <div>
              <Label>Höhenzulage (Stunden)</Label>
              <Input type="number" value={heightWorkHours} onChange={(e) => setHeightWorkHours(Number(e.target.value))} />
            </div>
            <div>
              <Label>Gefahrenzulage (Stunden)</Label>
              <Input type="number" value={dangerWorkHours} onChange={(e) => setDangerWorkHours(Number(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ergebnisse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SOKA-BAU */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">SOKA-BAU Beiträge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Arbeitgeber (15,2%):</span>
              <span className="font-medium">{formatCurrency(result.sokaEmployerContribution)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Arbeitnehmer:</span>
              <span>{formatCurrency(0)} (kein Beitrag)</span>
            </div>
            <Badge variant="secondary" className="mt-2">✅ AN zahlt nichts bei SOKA-BAU</Badge>
          </CardContent>
        </Card>

        {/* Zulagen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Zulagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {result.dirtyWorkBonus > 0 && (
              <div className="flex justify-between">
                <span>Schmutzzulage:</span>
                <span className="text-primary">+{formatCurrency(result.dirtyWorkBonus)}</span>
              </div>
            )}
            {result.heightWorkBonus > 0 && (
              <div className="flex justify-between">
                <span>Höhenzulage:</span>
                <span className="text-primary">+{formatCurrency(result.heightWorkBonus)}</span>
              </div>
            )}
            {result.dangerWorkBonus > 0 && (
              <div className="flex justify-between">
                <span>Gefahrenzulage:</span>
                <span className="text-primary">+{formatCurrency(result.dangerWorkBonus)}</span>
              </div>
            )}
            {result.winterAllowance > 0 && (
              <div className="flex justify-between">
                <span>Wintergeld:</span>
                <span className="text-primary">+{formatCurrency(result.winterAllowance)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Gesamt Zulagen:</span>
              <span className="text-primary">+{formatCurrency(result.totalBonuses + result.winterAllowance)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urlaubskasse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Umbrella className="h-4 w-4" />
            Urlaubskasse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Vorjahresrest (Tage)</Label>
              <Input type="number" value={previousYearVacationDays} onChange={(e) => setPreviousYearVacationDays(Number(e.target.value))} />
            </div>
            <div>
              <Label>Genommen (Tage)</Label>
              <Input type="number" value={vacationDaysTaken} onChange={(e) => setVacationDaysTaken(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Jahresanspruch</p>
              <p className="text-xl font-bold">{vacation.currentYearEntitlement} Tage</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Resturlaub</p>
              <p className="text-xl font-bold text-primary">{vacation.remainingDays} Tage</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Geldwert</p>
              <p className="text-xl font-bold">{formatCurrency(vacation.monetaryValue)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Verfall bis</p>
              <p className="text-lg font-medium">{vacation.expirationDate.toLocaleDateString('de-DE')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gesamt */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Brutto gesamt (inkl. Zulagen)</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(result.totalGross)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Grundgehalt</p>
              <p className="text-xl">{formatCurrency(grossMonthly)}</p>
              <p className="text-sm text-primary">+{formatCurrency(result.netAdditions)} Zulagen</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
