import { useState } from "react";
import { Calculator, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BBG_2025_MONTHLY, SOCIAL_INSURANCE_RATES_2025 } from "@/constants/social-security";

interface QuickSalaryCalculatorProps {
  onBack: () => void;
}

interface QuickCalculationResult {
  grossSalary: number;
  healthInsurance: number;
  pensionInsurance: number;
  unemploymentInsurance: number;
  careInsurance: number;
  totalSocialSecurity: number;
  employerGross: number;
  taxAmount: number;
  netSalary: number;
}

export function QuickSalaryCalculator({ onBack }: QuickSalaryCalculatorProps) {
  const [grossSalary, setGrossSalary] = useState<string>("");
  const [taxRate, setTaxRate] = useState<string>("20");
  const [result, setResult] = useState<QuickCalculationResult | null>(null);

  const calculateSalary = () => {
    const gross = parseFloat(grossSalary) || 0;
    const tax = parseFloat(taxRate) || 0;

    if (gross <= 0) return;

    // Beitragsbemessungsgrenzen 2025 (monatlich) - zentral verwaltet
    const bbgPensionWest = BBG_2025_MONTHLY.pensionWest;
    const bbgHealth = BBG_2025_MONTHLY.healthCare;

    // Sozialversicherungsbeiträge berechnen mit BBG-Begrenzung
    const pensionBase = Math.min(gross, bbgPensionWest);
    const healthBase = Math.min(gross, bbgHealth);

    const healthInsurance = healthBase * (SOCIAL_INSURANCE_RATES_2025.health.total / 100);
    const pensionInsurance = pensionBase * (SOCIAL_INSURANCE_RATES_2025.pension.total / 100);
    const unemploymentInsurance = pensionBase * (SOCIAL_INSURANCE_RATES_2025.unemployment.total / 100);
    const careInsurance = healthBase * (SOCIAL_INSURANCE_RATES_2025.care.total / 100);
    
    const totalSocialSecurity = healthInsurance + pensionInsurance + unemploymentInsurance + careInsurance;
    
    // Arbeitgeber-Brutto (mit Arbeitgeberanteilen)
    const employerHealthInsurance = healthBase * (SOCIAL_INSURANCE_RATES_2025.health.employer / 100);
    const employerPensionInsurance = pensionBase * (SOCIAL_INSURANCE_RATES_2025.pension.employer / 100);
    const employerUnemploymentInsurance = pensionBase * (SOCIAL_INSURANCE_RATES_2025.unemployment.employer / 100);
    const employerCareInsurance = healthBase * (SOCIAL_INSURANCE_RATES_2025.care.employer / 100);
    
    const employerGross = gross + employerHealthInsurance + employerPensionInsurance + employerUnemploymentInsurance + employerCareInsurance;
    
    // Steuer berechnen (pauschal auf Bruttolohn)
    const taxAmount = gross * (tax / 100);
    
    // Netto berechnen
    const employeeSocialSecurity = totalSocialSecurity / 2; // Arbeitnehmeranteil
    const netSalary = gross - employeeSocialSecurity - taxAmount;

    setResult({
      grossSalary: gross,
      healthInsurance,
      pensionInsurance,
      unemploymentInsurance,
      careInsurance,
      totalSocialSecurity,
      employerGross,
      taxAmount,
      netSalary
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schnell-Gehaltsrechner</h1>
          <p className="text-muted-foreground mt-2">Schnelle Brutto-Netto Berechnung mit pauschalen Steuersätzen</p>
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
            <CardDescription>Bruttolohn und Steuersatz eingeben</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="taxRate">Pauschaler Steuersatz (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="20"
                step="0.1"
                min="0"
                max="50"
              />
              <p className="text-xs text-muted-foreground">
                Durchschnittlich 15-25% je nach Steuerklasse
              </p>
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
              <CardDescription>Übersicht der Lohnkosten und Abzüge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                  <span className="font-medium">Bruttolohn</span>
                  <span className="font-bold text-lg">
                    {result.grossSalary.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Krankenversicherung (14,6%)</span>
                    <span>-{result.healthInsurance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rentenversicherung ({SOCIAL_INSURANCE_RATES_2025.pension.total}%)</span>
                    <span>-{result.pensionInsurance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arbeitslosenversicherung ({SOCIAL_INSURANCE_RATES_2025.unemployment.total}%)</span>
                    <span>-{result.unemploymentInsurance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pflegeversicherung ({SOCIAL_INSURANCE_RATES_2025.care.total}%)</span>
                    <span>-{result.careInsurance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Sozialversicherung gesamt</span>
                    <span>-{result.totalSocialSecurity.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Steuern ({taxRate}%)</span>
                    <span>-{result.taxAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="font-medium">Nettolohn</span>
                  <span className="font-bold text-lg text-primary">
                    {result.netSalary.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                  <span className="font-medium">Arbeitgeber-Brutto</span>
                  <span className="font-bold text-lg text-secondary">
                    {result.employerGross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}