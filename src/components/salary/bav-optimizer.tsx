import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PiggyBank, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { calculateBav, calculateOptimalContribution, projectPension, BavType } from '@/utils/bav-calculation';

export function BavOptimizer() {
  const [grossMonthly, setGrossMonthly] = useState(4500);
  const [contribution, setContribution] = useState([200]);
  const [employerContribution, setEmployerContribution] = useState(30);
  const [bavType, setBavType] = useState<BavType>('direktversicherung');
  const [taxClass, setTaxClass] = useState('1');
  const [churchTax, setChurchTax] = useState(false);
  const [age, setAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(67);

  const bavResult = useMemo(() => calculateBav({
    grossMonthly,
    contributionMonthly: contribution[0],
    employerContribution,
    bavType,
    taxClass,
    churchTax,
    age,
    retirementAge,
  }), [grossMonthly, contribution, employerContribution, bavType, taxClass, churchTax, age, retirementAge]);

  const optimal = useMemo(() => calculateOptimalContribution(grossMonthly), [grossMonthly]);

  const pension = useMemo(() => projectPension({
    grossMonthly,
    contributionMonthly: contribution[0],
    employerContribution,
    bavType,
    taxClass,
    churchTax,
    age,
    retirementAge,
    expectedReturn: 0.03,
  }), [grossMonthly, contribution, employerContribution, bavType, taxClass, churchTax, age, retirementAge]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            bAV-Optimierer (Betriebliche Altersvorsorge)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Bruttogehalt (€/Monat)</Label>
              <Input type="number" value={grossMonthly} onChange={(e) => setGrossMonthly(Number(e.target.value))} />
            </div>
            <div>
              <Label>AG-Zuschuss (€)</Label>
              <Input type="number" value={employerContribution} onChange={(e) => setEmployerContribution(Number(e.target.value))} />
            </div>
            <div>
              <Label>Alter</Label>
              <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
            </div>
            <div>
              <Label>bAV-Typ</Label>
              <Select value={bavType} onValueChange={(v) => setBavType(v as BavType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direktversicherung">Direktversicherung</SelectItem>
                  <SelectItem value="pensionskasse">Pensionskasse</SelectItem>
                  <SelectItem value="pensionsfonds">Pensionsfonds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label>Monatliche Entgeltumwandlung</Label>
              <span className="text-2xl font-bold text-primary">{formatCurrency(contribution[0])}</span>
            </div>
            <Slider value={contribution} onValueChange={setContribution} min={50} max={604} step={10} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50€</span>
              <span className="text-primary">SV-frei: {formatCurrency(bavResult.socialSecurityFreeLimit)}</span>
              <span>Steuerfrei: {formatCurrency(bavResult.taxFreeLimit)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ergebnis-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 text-center">
            <Lightbulb className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Netto-Kosten</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(bavResult.effectiveCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">statt {formatCurrency(contribution[0])} brutto</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Monatliche Ersparnis</p>
            <p className="text-3xl font-bold">{formatCurrency(bavResult.totalSavingsMonthly)}</p>
            <p className="text-xs text-muted-foreground mt-1">{bavResult.savingsRatio.toFixed(0)}% vom Beitrag</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Gesamtbeitrag (mit AG)</p>
            <p className="text-3xl font-bold">{formatCurrency(bavResult.totalContribution)}</p>
            <p className="text-xs text-muted-foreground mt-1">AG: +{formatCurrency(bavResult.employerContribution)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ersparnis-Aufschlüsselung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ersparnis-Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Steuerersparnis</span>
              <span className="font-medium">{formatCurrency(bavResult.taxSavingsMonthly)}/Monat</span>
            </div>
            <Progress value={(bavResult.taxSavingsMonthly / contribution[0]) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>SV-Ersparnis</span>
              <span className="font-medium">{formatCurrency(bavResult.socialSecuritySavingsMonthly)}/Monat</span>
            </div>
            <Progress value={(bavResult.socialSecuritySavingsMonthly / contribution[0]) * 100} className="h-2" />
          </div>

          <div className="pt-3 border-t space-y-1 text-sm">
            {!bavResult.isWithinSocialSecurityLimit && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                ⚠️ Beitrag über SV-freier Grenze ({formatCurrency(bavResult.socialSecurityFreeLimit)})
              </Badge>
            )}
            {!bavResult.isWithinTaxLimit && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                ⚠️ Beitrag über steuerfreier Grenze ({formatCurrency(bavResult.taxFreeLimit)})
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rentenprognose */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rentenprognose (bei 3% Rendite)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Jahre bis Rente</p>
              <p className="text-xl font-bold">{pension.yearsToRetirement}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Einzahlungen gesamt</p>
              <p className="text-xl font-bold">{formatCurrency(pension.totalContributions)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kapital bei Rente</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(pension.projectedCapital)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Geschätzte Rente</p>
              <p className="text-xl font-bold">{formatCurrency(pension.monthlyPension)}/Monat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empfehlung */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Empfehlung</h3>
              <p className="text-muted-foreground">{optimal.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
