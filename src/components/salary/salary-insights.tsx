import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { BarChart3, TrendingUp, MapPin, Lightbulb, Target } from 'lucide-react';
import { calculateBenchmark, generateNegotiationRecommendation, Industry, Region, ExperienceLevel, INDUSTRY_NAMES, REGION_NAMES } from '@/utils/salary-benchmarking';

export function SalaryInsights() {
  const [grossMonthly, setGrossMonthly] = useState(5000);
  const [industry, setIndustry] = useState<Industry>('it_software');
  const [region, setRegion] = useState<Region>('berlin');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid');
  const [yearsOfExperience, setYearsOfExperience] = useState(5);
  const [hasLeadershipRole, setHasLeadershipRole] = useState(false);

  const benchmark = useMemo(() => calculateBenchmark({
    grossMonthly, industry, region, experienceLevel, yearsOfExperience, hasLeadershipRole,
  }), [grossMonthly, industry, region, experienceLevel, yearsOfExperience, hasLeadershipRole]);

  const negotiation = useMemo(() => generateNegotiationRecommendation(grossMonthly, benchmark), [grossMonthly, benchmark]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Gehalts-Benchmarking</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><Label>Bruttogehalt (€/Monat)</Label><Input type="number" value={grossMonthly} onChange={(e) => setGrossMonthly(Number(e.target.value))} /></div>
            <div>
              <Label>Branche</Label>
              <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(INDUSTRY_NAMES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Region</Label>
              <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(REGION_NAMES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Erfahrungsstufe</Label>
              <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as ExperienceLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior (0-2 Jahre)</SelectItem>
                  <SelectItem value="mid">Mid-Level (3-5 Jahre)</SelectItem>
                  <SelectItem value="senior">Senior (6-10 Jahre)</SelectItem>
                  <SelectItem value="lead">Lead/Manager</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Berufserfahrung (Jahre)</Label><Input type="number" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(Number(e.target.value))} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={hasLeadershipRole} onCheckedChange={setHasLeadershipRole} /><Label>Führungsverantwortung</Label></div>
          </div>
        </CardContent>
      </Card>

      {/* Perzentil-Ranking */}
      <Card>
        <CardHeader><CardTitle>Ihr Ranking in der Branche</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-primary">Top {100 - benchmark.percentileRank}%</span>
            <Badge variant={benchmark.percentileRank >= 75 ? 'default' : benchmark.percentileRank >= 50 ? 'secondary' : 'outline'}>
              {benchmark.percentileRank >= 75 ? 'Überdurchschnittlich' : benchmark.percentileRank >= 50 ? 'Durchschnitt' : 'Unter Durchschnitt'}
            </Badge>
          </div>
          <Progress value={benchmark.percentileRank} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>25%: {formatCurrency(benchmark.industry25thPercentile)}</span>
            <span>Median: {formatCurrency(benchmark.industryMedian)}</span>
            <span>75%: {formatCurrency(benchmark.industry75thPercentile)}</span>
          </div>
          <p className="text-muted-foreground">{benchmark.percentileMessage}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kaufkraft */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" />Regionale Kaufkraft</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Lebenshaltungskosten-Index:</span><span className="font-medium">{benchmark.purchasingPower.localIndex}%</span></div>
            <div className="flex justify-between"><span>Kaufkraftbereinigt:</span><span className="font-medium">{formatCurrency(benchmark.purchasingPower.adjustedSalary)}</span></div>
            <p className="text-sm text-muted-foreground">In {benchmark.purchasingPower.comparisonCity} entspricht das {formatCurrency(benchmark.purchasingPower.comparisonSalary)}.</p>
          </CardContent>
        </Card>

        {/* Potenzial */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Karriere-Potenzial</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Aktuelle Stufe:</span><span className="font-medium">{benchmark.salaryPotential.currentLevel}</span></div>
            <div className="flex justify-between"><span>Nächste Stufe:</span><span className="font-medium">{benchmark.salaryPotential.nextLevel}</span></div>
            <div className="flex justify-between text-primary"><span>Potenzial:</span><span className="font-bold">+{formatCurrency(benchmark.salaryPotential.potentialIncrease)}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {benchmark.insights.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4" />Personalisierte Insights</CardTitle></CardHeader>
          <CardContent><ul className="space-y-2">{benchmark.insights.map((insight, i) => <li key={i} className="text-sm">{insight}</li>)}</ul></CardContent>
        </Card>
      )}

      {/* Verhandlungs-Empfehlung */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" />Verhandlungs-Empfehlung</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div><span className="text-sm text-muted-foreground">Zielgehalt</span><div className="text-2xl font-bold text-primary">{formatCurrency(negotiation.targetSalary)}</div></div>
            <div className="text-sm text-muted-foreground">Spanne: {formatCurrency(negotiation.recommendedRange.min)} - {formatCurrency(negotiation.recommendedRange.max)}</div>
          </div>
          <div className="text-sm"><strong>Argumente:</strong><ul className="list-disc list-inside mt-1">{negotiation.arguments.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
        </CardContent>
      </Card>
    </div>
  );
}
