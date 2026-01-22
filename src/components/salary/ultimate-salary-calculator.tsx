import { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Calculator, ArrowLeft, ArrowRightLeft, TrendingUp, 
  Euro, Percent, Target, Sparkles, ChevronDown, ChevronUp,
  Sliders, BarChart3, Lightbulb, Car, Heart, PiggyBank, 
  HardHat, UtensilsCrossed, Stethoscope, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { calculateCompleteTax, TaxCalculationParams, TaxCalculationResult } from "@/utils/tax-calculation";
import { 
  calculateNetToGross, 
  calculateSalaryCurve, 
  calculateOptimizationTips,
  analyzeRaise,
  NetToGrossResult,
} from "@/utils/net-to-gross-calculation";
import { SalaryCurveChart, MarginalRateChart } from "./salary-curve-chart";
import { OptimizationTips } from "./optimization-tips";
import { CompanyCarConfigurator } from "./company-car-configurator";
import { HealthInsuranceComparison } from "./health-insurance-comparison";
import { SalaryInsights } from "./salary-insights";
import { BavOptimizer } from "./bav-optimizer";
import { ConstructionPayrollModule } from "./construction-payroll-module";
import { GastronomyModule } from "./gastronomy-module";
import { NursingShiftModule } from "./nursing-shift-module";

interface UltimateSalaryCalculatorProps {
  onBack: () => void;
}

type CalculationMode = 'brutto-netto' | 'netto-brutto' | 'slider';
type ModuleTab = 'calculator' | 'car' | 'insurance' | 'bav' | 'construction' | 'gastronomy' | 'nursing' | 'insights';

export function UltimateSalaryCalculator({ onBack }: UltimateSalaryCalculatorProps) {
  const [activeModule, setActiveModule] = useState<ModuleTab>('calculator');
  const [mode, setMode] = useState<CalculationMode>('brutto-netto');
  const [grossSalary, setGrossSalary] = useState<string>("3500");
  const [targetNetSalary, setTargetNetSalary] = useState<string>("2500");
  const [taxClass, setTaxClass] = useState<string>("1");
  const [childAllowances, setChildAllowances] = useState<string>("0");
  const [churchTax, setChurchTax] = useState(false);
  const [churchTaxRate, setChurchTaxRate] = useState<string>("9");
  const [healthInsuranceRate, setHealthInsuranceRate] = useState<string>("1.7");
  const [isEastGermany, setIsEastGermany] = useState(false);
  const [isChildless, setIsChildless] = useState(false);
  const [age, setAge] = useState<string>("30");
  
  const [bruttoNettoResult, setBruttoNettoResult] = useState<TaxCalculationResult | null>(null);
  const [nettoGrossResult, setNettoGrossResult] = useState<NetToGrossResult | null>(null);
  const [sliderValue, setSliderValue] = useState<number[]>([3500]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showOptimization, setShowOptimization] = useState(true);

  const baseParams = useMemo(() => ({
    taxClass,
    childAllowances: parseInt(childAllowances) || 0,
    churchTax,
    churchTaxRate: parseFloat(churchTaxRate) || 9,
    healthInsuranceRate: parseFloat(healthInsuranceRate) || 1.7,
    isEastGermany,
    isChildless,
    age: parseInt(age) || 30,
  }), [taxClass, childAllowances, churchTax, churchTaxRate, healthInsuranceRate, isEastGermany, isChildless, age]);

  const calculateBruttoNetto = useCallback(() => {
    const gross = parseFloat(grossSalary) || 0;
    if (gross <= 0) return;
    const params: TaxCalculationParams = { grossSalaryYearly: gross * 12, ...baseParams };
    const result = calculateCompleteTax(params);
    setBruttoNettoResult(result);
  }, [grossSalary, baseParams]);

  const calculateNettoBrutto = useCallback(() => {
    const targetNet = parseFloat(targetNetSalary) || 0;
    if (targetNet <= 0) return;
    const result = calculateNetToGross({ targetNetMonthly: targetNet, ...baseParams });
    setNettoGrossResult(result);
  }, [targetNetSalary, baseParams]);

  const sliderResult = useMemo(() => {
    const gross = sliderValue[0];
    if (gross <= 0) return null;
    const params: TaxCalculationParams = { grossSalaryYearly: gross * 12, ...baseParams };
    return calculateCompleteTax(params);
  }, [sliderValue, baseParams]);

  const salaryCurve = useMemo(() => {
    const currentGross = mode === 'slider' ? sliderValue[0] : (parseFloat(grossSalary) || 3500);
    const fromGross = Math.max(556, currentGross - 2000);
    const toGross = currentGross + 3000;
    return calculateSalaryCurve(baseParams, fromGross, toGross, 30);
  }, [baseParams, grossSalary, sliderValue, mode]);

  const optimizationTips = useMemo(() => {
    const currentGross = mode === 'slider' ? sliderValue[0] : (parseFloat(grossSalary) || 3500);
    return calculateOptimizationTips(currentGross, baseParams);
  }, [baseParams, grossSalary, sliderValue, mode]);

  const raiseAnalysis = useMemo(() => {
    const currentGross = mode === 'slider' ? sliderValue[0] : (parseFloat(grossSalary) || 3500);
    return analyzeRaise(currentGross, 500, baseParams);
  }, [baseParams, grossSalary, sliderValue, mode]);

  useEffect(() => {
    if (mode === 'brutto-netto') calculateBruttoNetto();
    else if (mode === 'netto-brutto') calculateNettoBrutto();
  }, [mode, calculateBruttoNetto, calculateNettoBrutto]);

  const formatCurrency = (value: number) => 
    value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

  const currentResult = mode === 'slider' ? sliderResult : 
                        mode === 'netto-brutto' ? nettoGrossResult?.calculation : 
                        bruttoNettoResult;

  const modules: { id: ModuleTab; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'calculator', label: 'Gehaltsrechner', icon: <Calculator className="h-4 w-4" />, description: 'Brutto-Netto' },
    { id: 'car', label: 'Dienstwagen', icon: <Car className="h-4 w-4" />, description: '1% / 0,25%' },
    { id: 'insurance', label: 'PKV vs. GKV', icon: <Heart className="h-4 w-4" />, description: 'Vergleich' },
    { id: 'bav', label: 'bAV-Rechner', icon: <PiggyBank className="h-4 w-4" />, description: 'Altersvorsorge' },
    { id: 'construction', label: 'Baulohn', icon: <HardHat className="h-4 w-4" />, description: 'SOKA-BAU' },
    { id: 'gastronomy', label: 'Gastronomie', icon: <UtensilsCrossed className="h-4 w-4" />, description: 'Sachbezüge' },
    { id: 'nursing', label: 'Pflege', icon: <Stethoscope className="h-4 w-4" />, description: 'SFN-Zuschläge' },
    { id: 'insights', label: 'Benchmarking', icon: <BarChart3 className="h-4 w-4" />, description: 'Vergleich' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ultimativer Gehaltsrechner</h1>
              <p className="text-sm text-muted-foreground">
                Alle Tools für Gehaltsoptimierung an einem Ort
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>
      </div>

      {/* Modul-Tabs */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {modules.map((module) => (
            <Button
              key={module.id}
              variant={activeModule === module.id ? 'default' : 'outline'}
              onClick={() => setActiveModule(module.id)}
              className="flex items-center gap-2 shrink-0"
            >
              {module.icon}
              <span className="hidden sm:inline">{module.label}</span>
              <Badge variant="secondary" className="text-xs hidden md:inline">
                {module.description}
              </Badge>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Modul-Inhalte */}
      {activeModule === 'calculator' && (
        <>
          {/* Mode Selector */}
          <div className="flex flex-wrap gap-2">
            <Button variant={mode === 'brutto-netto' ? 'default' : 'outline'} onClick={() => setMode('brutto-netto')} className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />Brutto → Netto
            </Button>
            <Button variant={mode === 'netto-brutto' ? 'default' : 'outline'} onClick={() => setMode('netto-brutto')} className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />Netto → Brutto
            </Button>
            <Button variant={mode === 'slider' ? 'default' : 'outline'} onClick={() => setMode('slider')} className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />Interaktiver Slider
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Linke Spalte: Eingabe */}
            <div className="xl:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    {mode === 'netto-brutto' ? 'Ziel-Netto' : 'Bruttolohn'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === 'slider' ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-primary">{formatCurrency(sliderValue[0])}</p>
                        <p className="text-sm text-muted-foreground">Brutto/Monat</p>
                      </div>
                      <Slider value={sliderValue} onValueChange={setSliderValue} min={556} max={15000} step={50} className="py-4" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>556€ (Minijob)</span>
                        <span>15.000€</span>
                      </div>
                    </div>
                  ) : mode === 'netto-brutto' ? (
                    <div className="space-y-2">
                      <Label htmlFor="targetNet">Gewünschtes Netto (monatlich)</Label>
                      <div className="relative">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="targetNet" type="number" value={targetNetSalary} onChange={(e) => setTargetNetSalary(e.target.value)} placeholder="2500" className="pl-10 text-lg font-medium" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="grossSalary">Bruttolohn (monatlich)</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="grossSalary" type="number" value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)} placeholder="3500" className="pl-10 text-lg font-medium" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="taxClass">Steuerklasse</Label>
                      <Select value={taxClass} onValueChange={setTaxClass}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">I - Ledig</SelectItem>
                          <SelectItem value="2">II - Alleinerziehend</SelectItem>
                          <SelectItem value="3">III - Verheiratet (Alleinv.)</SelectItem>
                          <SelectItem value="4">IV - Verheiratet</SelectItem>
                          <SelectItem value="5">V - Verheiratet (Partner III)</SelectItem>
                          <SelectItem value="6">VI - Zweitjob</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="childAllowances">Kinderfreibeträge</Label>
                      <Select value={childAllowances} onValueChange={setChildAllowances}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['0', '0.5', '1', '1.5', '2', '2.5', '3', '4', '5'].map(v => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        Erweiterte Optionen
                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-3">
                      <div className="space-y-2">
                        <Label htmlFor="age">Alter</Label>
                        <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} min="16" max="100" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="churchTax">Kirchensteuer</Label>
                        <Switch id="churchTax" checked={churchTax} onCheckedChange={setChurchTax} />
                      </div>
                      {churchTax && (
                        <Select value={churchTaxRate} onValueChange={setChurchTaxRate}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="8">8% (Bayern, BW)</SelectItem>
                            <SelectItem value="9">9% (andere Länder)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="healthRate">KV-Zusatzbeitrag (%)</Label>
                        <Input id="healthRate" type="number" value={healthInsuranceRate} onChange={(e) => setHealthInsuranceRate(e.target.value)} step="0.1" min="0" max="4" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isEast">Ostdeutschland</Label>
                        <Switch id="isEast" checked={isEastGermany} onCheckedChange={setIsEastGermany} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isChildless">Kinderlos (23+)</Label>
                        <Switch id="isChildless" checked={isChildless} onCheckedChange={setIsChildless} />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {mode !== 'slider' && (
                    <Button onClick={mode === 'netto-brutto' ? calculateNettoBrutto : calculateBruttoNetto} className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />Berechnen
                    </Button>
                  )}
                </CardContent>
              </Card>

              {currentResult && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />+500€ Gehaltserhöhung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Netto-Zuwachs:</span><span className="font-medium text-primary">+{formatCurrency(raiseAnalysis.netIncrease)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Davon gehen weg:</span><span>{formatCurrency(raiseAnalysis.taxOnRaise)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Du behältst:</span><span>{raiseAnalysis.percentageKept.toFixed(1)}%</span></div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Ergebnisse */}
            <div className="xl:col-span-2 space-y-4">
              {currentResult && (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          {mode === 'netto-brutto' ? 'Benötigtes Brutto' : 'Dein Nettogehalt'}
                        </CardTitle>
                        <CardDescription>
                          {mode === 'netto-brutto' ? `Für ${formatCurrency(parseFloat(targetNetSalary) || 0)} netto brauchst du:` : 'Nach Abzug aller Steuern und Sozialabgaben'}
                        </CardDescription>
                      </div>
                      {mode === 'netto-brutto' && nettoGrossResult && <Badge variant="outline" className="text-xs">{nettoGrossResult.iterations} Iterationen</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Brutto/Monat</p>
                        <p className="text-2xl font-bold">{mode === 'netto-brutto' && nettoGrossResult ? formatCurrency(nettoGrossResult.requiredGross) : formatCurrency(currentResult.grossMonthly)}</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground">Netto/Monat</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(currentResult.netMonthly)}</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Netto-Quote</p>
                        <p className="text-2xl font-bold">{((currentResult.netMonthly / currentResult.grossMonthly) * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">AG-Kosten</p>
                        <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(currentResult.employerCosts / 12)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sozialversicherung</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span>Krankenversicherung</span><span className="text-destructive">-{formatCurrency(currentResult.healthInsurance / 12)}</span></div>
                          <div className="flex justify-between"><span>Rentenversicherung</span><span className="text-destructive">-{formatCurrency(currentResult.pensionInsurance / 12)}</span></div>
                          <div className="flex justify-between"><span>Arbeitslosenversicherung</span><span className="text-destructive">-{formatCurrency(currentResult.unemploymentInsurance / 12)}</span></div>
                          <div className="flex justify-between"><span>Pflegeversicherung</span><span className="text-destructive">-{formatCurrency(currentResult.careInsurance / 12)}</span></div>
                          <div className="flex justify-between font-medium pt-1 border-t"><span>Summe SV</span><span className="text-destructive">-{formatCurrency(currentResult.totalSocialContributions / 12)}</span></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Steuern</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span>Lohnsteuer</span><span className="text-destructive">-{formatCurrency(currentResult.incomeTax / 12)}</span></div>
                          <div className="flex justify-between"><span>Solidaritätszuschlag</span><span className="text-destructive">-{formatCurrency(currentResult.solidarityTax / 12)}</span></div>
                          {churchTax && currentResult.churchTax > 0 && <div className="flex justify-between"><span>Kirchensteuer</span><span className="text-destructive">-{formatCurrency(currentResult.churchTax / 12)}</span></div>}
                          <div className="flex justify-between font-medium pt-1 border-t"><span>Summe Steuern</span><span className="text-destructive">-{formatCurrency(currentResult.totalTaxes / 12)}</span></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentResult && (
                <Tabs defaultValue="curve" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full max-w-md">
                    <TabsTrigger value="curve" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Gehaltskurve</TabsTrigger>
                    <TabsTrigger value="marginal" className="flex items-center gap-2"><Percent className="h-4 w-4" />Grenzbelastung</TabsTrigger>
                  </TabsList>
                  <TabsContent value="curve" className="mt-4">
                    <SalaryCurveChart data={salaryCurve} currentGross={mode === 'slider' ? sliderValue[0] : (parseFloat(grossSalary) || undefined)} height={280} />
                  </TabsContent>
                  <TabsContent value="marginal" className="mt-4">
                    <MarginalRateChart data={salaryCurve} currentGross={mode === 'slider' ? sliderValue[0] : (parseFloat(grossSalary) || undefined)} height={250} />
                  </TabsContent>
                </Tabs>
              )}

              {currentResult && showOptimization && <OptimizationTips tips={optimizationTips} />}
            </div>
          </div>
        </>
      )}

      {activeModule === 'car' && <CompanyCarConfigurator />}
      {activeModule === 'insurance' && <HealthInsuranceComparison />}
      {activeModule === 'bav' && <BavOptimizer />}
      {activeModule === 'construction' && <ConstructionPayrollModule />}
      {activeModule === 'gastronomy' && <GastronomyModule />}
      {activeModule === 'nursing' && <NursingShiftModule />}
      {activeModule === 'insights' && <SalaryInsights />}
    </div>
  );
}
