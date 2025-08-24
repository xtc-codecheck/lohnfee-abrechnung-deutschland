import { useState } from "react";
import { Calculator, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateCompleteTax, TaxCalculationParams, TaxCalculationResult } from "@/utils/tax-calculation";

interface QuickSalaryCalculatorProps {
  onBack: () => void;
}

export function QuickSalaryCalculator({ onBack }: QuickSalaryCalculatorProps) {
  const [grossSalary, setGrossSalary] = useState<string>("");
  const [taxClass, setTaxClass] = useState<string>("1");
  const [childAllowances, setChildAllowances] = useState<string>("0");
  const [churchTax, setChurchTax] = useState(false);
  const [churchTaxRate, setChurchTaxRate] = useState<string>("9");
  const [healthInsuranceRate, setHealthInsuranceRate] = useState<string>("1.7");
  const [isEastGermany, setIsEastGermany] = useState(false);
  const [isChildless, setIsChildless] = useState(false);
  const [age, setAge] = useState<string>("30");
  const [result, setResult] = useState<TaxCalculationResult | null>(null);

  const calculateSalary = () => {
    const gross = parseFloat(grossSalary) || 0;
    if (gross <= 0) return;

    const params: TaxCalculationParams = {
      grossSalaryYearly: gross * 12,
      taxClass,
      childAllowances: parseInt(childAllowances) || 0,
      churchTax,
      churchTaxRate: parseFloat(churchTaxRate) || 9,
      healthInsuranceRate: parseFloat(healthInsuranceRate) || 1.7,
      isEastGermany,
      isChildless,
      age: parseInt(age) || 30,
    };

    const calculation = calculateCompleteTax(params);
    setResult(calculation);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schnell-Gehaltsrechner</h1>
          <p className="text-muted-foreground mt-2">Präzise Brutto-Netto Berechnung nach § 32a EStG</p>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eingabe */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Eingabe
            </CardTitle>
            <CardDescription>Gehalts- und Steuerdaten eingeben</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grossSalary">Bruttolohn (monatlich)</Label>
                <Input
                  id="grossSalary"
                  type="number"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(e.target.value)}
                  placeholder="3000"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxClass">Steuerklasse</Label>
                <Select value={taxClass} onValueChange={setTaxClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Klasse I</SelectItem>
                    <SelectItem value="2">Klasse II</SelectItem>
                    <SelectItem value="3">Klasse III</SelectItem>
                    <SelectItem value="4">Klasse IV</SelectItem>
                    <SelectItem value="5">Klasse V</SelectItem>
                    <SelectItem value="6">Klasse VI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childAllowances">Kinderfreibeträge</Label>
                <Input
                  id="childAllowances"
                  type="number"
                  value={childAllowances}
                  onChange={(e) => setChildAllowances(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Alter</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                  min="18"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="churchTax">Kirchensteuer</Label>
                <Switch
                  id="churchTax"
                  checked={churchTax}
                  onCheckedChange={setChurchTax}
                />
              </div>

              {churchTax && (
                <div className="space-y-2">
                  <Label htmlFor="churchTaxRate">Kirchensteuersatz (%)</Label>
                  <Select value={churchTaxRate} onValueChange={setChurchTaxRate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8% (Bayern, BW)</SelectItem>
                      <SelectItem value="9">9% (andere Länder)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="healthInsuranceRate">KV-Zusatzbeitrag (%)</Label>
                <Input
                  id="healthInsuranceRate"
                  type="number"
                  value={healthInsuranceRate}
                  onChange={(e) => setHealthInsuranceRate(e.target.value)}
                  placeholder="1.7"
                  step="0.1"
                  min="0"
                  max="5"
                />
                <p className="text-xs text-muted-foreground">
                  Durchschnitt ca. 1,7%
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isEastGermany">Ostdeutschland</Label>
                <Switch
                  id="isEastGermany"
                  checked={isEastGermany}
                  onCheckedChange={setIsEastGermany}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isChildless">Kinderlos (&gt;23 Jahre)</Label>
                <Switch
                  id="isChildless"
                  checked={isChildless}
                  onCheckedChange={setIsChildless}
                />
              </div>
            </div>

            <Button onClick={calculateSalary} className="w-full bg-gradient-primary hover:opacity-90">
              Berechnen
            </Button>
          </CardContent>
        </Card>

        {/* Ergebnis */}
        {result && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Berechnungsergebnis</CardTitle>
              <CardDescription>Exakte Berechnung nach § 32a EStG 2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                  <span className="font-medium">Bruttolohn (monatlich)</span>
                  <span className="font-bold text-lg">
                    {result.grossMonthly.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Sozialversicherung (Arbeitnehmeranteil)
                  </div>
                  <div className="flex justify-between">
                    <span>Krankenversicherung</span>
                    <span>-{(result.healthInsurance / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rentenversicherung</span>
                    <span>-{(result.pensionInsurance / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arbeitslosenversicherung</span>
                    <span>-{(result.unemploymentInsurance / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pflegeversicherung</span>
                    <span>-{(result.careInsurance / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>SV-Beiträge gesamt</span>
                    <span>-{(result.totalSocialContributions / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>

                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-4 mb-2">
                    Steuern
                  </div>
                  <div className="flex justify-between">
                    <span>Einkommensteuer</span>
                    <span>-{(result.incomeTax / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Solidaritätszuschlag</span>
                    <span>-{(result.solidarityTax / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  {churchTax && result.churchTax > 0 && (
                    <div className="flex justify-between">
                      <span>Kirchensteuer</span>
                      <span>-{(result.churchTax / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Steuern gesamt</span>
                    <span>-{(result.totalTaxes / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="font-medium">Nettolohn (monatlich)</span>
                  <span className="font-bold text-lg text-primary">
                    {result.netMonthly.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                  <span className="font-medium">Arbeitgeberkosten (monatlich)</span>
                  <span className="font-bold text-lg text-secondary">
                    {(result.employerCosts / 12).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Zu versteuerndes Einkommen (jährlich):</span>
                      <span>{result.taxableIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}