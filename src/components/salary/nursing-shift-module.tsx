import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Moon, Sun, Calendar, Clock } from 'lucide-react';
import { calculateNursingPayroll, CareLevel, ShiftEntry } from '@/utils/nursing-payroll';

export function NursingShiftModule() {
  const [grossMonthly, setGrossMonthly] = useState(3500);
  const [hoursWorked, setHoursWorked] = useState(160);
  const [careLevel, setCareLevel] = useState<CareLevel>('nurse');
  const [earlyShifts, setEarlyShifts] = useState(8);
  const [lateShifts, setLateShifts] = useState(6);
  const [nightShifts, setNightShifts] = useState(4);
  const [nightHours, setNightHours] = useState(32);
  const [sundayHours, setSundayHours] = useState(16);
  const [holidayHours, setHolidayHours] = useState(8);
  const [onCallHours, setOnCallHours] = useState(24);

  const shifts: ShiftEntry[] = useMemo(() => {
    const entries: ShiftEntry[] = [];
    for (let i = 0; i < earlyShifts; i++) {
      entries.push({ date: new Date(), type: 'early', hours: 8, nightHours: 0, sundayHours: 0, holidayHours: 0 });
    }
    for (let i = 0; i < lateShifts; i++) {
      entries.push({ date: new Date(), type: 'late', hours: 8, nightHours: 0, sundayHours: 0, holidayHours: 0 });
    }
    for (let i = 0; i < nightShifts; i++) {
      entries.push({ date: new Date(), type: 'night', hours: 8, nightHours: 8, sundayHours: 0, holidayHours: 0 });
    }
    return entries;
  }, [earlyShifts, lateShifts, nightShifts]);

  const result = useMemo(() => calculateNursingPayroll({
    grossMonthly,
    hoursWorked,
    careLevel,
    shifts,
    onCallHours,
    onCallRate: 25,
  }), [grossMonthly, hoursWorked, careLevel, shifts, onCallHours]);

  // Override with manual hours for flexibility
  const manualResult = useMemo(() => {
    const baseResult = calculateNursingPayroll({
      grossMonthly,
      hoursWorked,
      careLevel,
      shifts: [
        { date: new Date(), type: 'night', hours: nightHours, nightHours, sundayHours, holidayHours },
      ],
      onCallHours,
    });
    return baseResult;
  }, [grossMonthly, hoursWorked, careLevel, nightHours, sundayHours, holidayHours, onCallHours]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  const careLevelLabels: Record<CareLevel, string> = {
    assistant: 'Pflegehilfskraft',
    nurse: 'Pflegefachkraft',
    specialist: 'Fachkrankenpfleger/in',
    lead: 'Stationsleitung',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Pflege & Schichtdienst
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Grundgehalt (€)</Label>
              <Input type="number" value={grossMonthly} onChange={(e) => setGrossMonthly(Number(e.target.value))} />
            </div>
            <div>
              <Label>Qualifikation</Label>
              <Select value={careLevel} onValueChange={(v) => setCareLevel(v as CareLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(careLevelLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arbeitsstunden</Label>
              <Input type="number" value={hoursWorked} onChange={(e) => setHoursWorked(Number(e.target.value))} />
            </div>
            <div>
              <Label>Stundenlohn (TVöD-P)</Label>
              <Input value={formatCurrency(manualResult.hourlyRate)} disabled className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label className="flex items-center gap-1"><Sun className="h-4 w-4" />Frühschichten</Label>
              <Input type="number" value={earlyShifts} onChange={(e) => setEarlyShifts(Number(e.target.value))} />
            </div>
            <div>
              <Label>Spätschichten</Label>
              <Input type="number" value={lateShifts} onChange={(e) => setLateShifts(Number(e.target.value))} />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Moon className="h-4 w-4" />Nachtschichten</Label>
              <Input type="number" value={nightShifts} onChange={(e) => setNightShifts(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <Label>Nachtstunden (20-6 Uhr)</Label>
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
            <div>
              <Label className="flex items-center gap-1"><Clock className="h-4 w-4" />Bereitschaft (h)</Label>
              <Input type="number" value={onCallHours} onChange={(e) => setOnCallHours(Number(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SFN-Zuschläge */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SFN-Zuschläge (§ 3b EStG)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <Moon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Nacht (25-40%)</p>
              <p className="text-xl font-bold">{formatCurrency(manualResult.nightBonus)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <Sun className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Sonntag (50%)</p>
              <p className="text-xl font-bold">{formatCurrency(manualResult.sundayBonus)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Feiertag (125%)</p>
              <p className="text-xl font-bold">{formatCurrency(manualResult.holidayBonus)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">Gesamt SFN</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(manualResult.totalSfnBonuses)}</p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-3">✅ Alle SFN-Zuschläge bis 50€ Grundlohn steuerfrei</Badge>
        </CardContent>
      </Card>

      {/* Schicht- und Bereitschaftszulagen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Schichtzulagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Frühschicht ({earlyShifts}×):</span>
              <span>{formatCurrency(0)} (keine Zulage)</span>
            </div>
            <div className="flex justify-between">
              <span>Spätschicht ({lateShifts}× à 1,50€/h):</span>
              <span>{formatCurrency(lateShifts * 8 * 1.5)}</span>
            </div>
            <div className="flex justify-between">
              <span>Nachtschicht ({nightShifts}× à 3,00€/h):</span>
              <span>{formatCurrency(nightShifts * 8 * 3)}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Gesamt Schichtzulagen:</span>
              <span className="text-primary">{formatCurrency(result.shiftAllowance)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bereitschaftsdienst</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Bereitschaftsstunden:</span>
              <span>{onCallHours}h</span>
            </div>
            <div className="flex justify-between">
              <span>Vergütungssatz (25%):</span>
              <span>{formatCurrency(manualResult.hourlyRate * 0.25)}/h</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Bereitschaftsvergütung:</span>
              <span className="text-primary">{formatCurrency(manualResult.onCallPay)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gesamt */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Steuerpflichtig</p>
              <p className="text-2xl font-bold">{formatCurrency(manualResult.taxableAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Steuerfrei</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(manualResult.taxFreeAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Brutto gesamt</p>
              <p className="text-2xl font-bold">{formatCurrency(manualResult.totalGross)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
