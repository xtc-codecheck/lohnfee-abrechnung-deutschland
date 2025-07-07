import { useState, useEffect } from "react";
import { ArrowLeft, Calculator, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SalaryCalculation } from "@/types/employee";

interface SalaryCalculatorProps {
  onBack: () => void;
  employeeData?: any;
}

export function SalaryCalculator({ onBack, employeeData }: SalaryCalculatorProps) {
  const [calculation, setCalculation] = useState<SalaryCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Vereinfachte deutsche Gehaltsberechnung (Demo-Version)
  const calculateSalary = (grossSalary: number, taxClass: string, churchTax: boolean = false) => {
    setIsCalculating(true);
    
    // Sozialversicherungsbeiträge 2024 (vereinfacht)
    const healthInsuranceRate = 0.146; // 14,6% (7,3% AN + 7,3% AG + Zusatzbeitrag)
    const pensionInsuranceRate = 0.186; // 18,6% (9,3% AN + 9,3% AG)
    const unemploymentInsuranceRate = 0.026; // 2,6% (1,3% AN + 1,3% AG)
    const careInsuranceRate = 0.03; // 3,0% (1,5% AN + 1,5% AG)

    // Arbeitnehmeranteile
    const healthInsuranceEmployee = grossSalary * (healthInsuranceRate / 2);
    const pensionInsuranceEmployee = grossSalary * (pensionInsuranceRate / 2);
    const unemploymentInsuranceEmployee = grossSalary * (unemploymentInsuranceRate / 2);
    const careInsuranceEmployee = grossSalary * (careInsuranceRate / 2);

    // Arbeitgeberanteile
    const healthInsuranceEmployer = grossSalary * (healthInsuranceRate / 2);
    const pensionInsuranceEmployer = grossSalary * (pensionInsuranceRate / 2);
    const unemploymentInsuranceEmployer = grossSalary * (unemploymentInsuranceRate / 2);
    const careInsuranceEmployer = grossSalary * (careInsuranceRate / 2);

    const totalSocialSecurityEmployee = 
      healthInsuranceEmployee + pensionInsuranceEmployee + 
      unemploymentInsuranceEmployee + careInsuranceEmployee;

    const totalSocialSecurityEmployer = 
      healthInsuranceEmployer + pensionInsuranceEmployer + 
      unemploymentInsuranceEmployer + careInsuranceEmployer;

    // Vereinfachte Lohnsteuerberechnung (sehr grob)
    const taxableIncome = grossSalary - totalSocialSecurityEmployee;
    let incomeTax = 0;
    
    // Sehr vereinfachte Steuertabelle
    if (taxableIncome > 1000) {
      if (taxClass === 'I') {
        incomeTax = Math.max(0, (taxableIncome - 1000) * 0.14); // Vereinfacht: 14% auf alles über 1000€
      }
    }

    const solidarityTax = incomeTax * 0.055; // 5,5% Soli
    const churchTaxAmount = churchTax ? incomeTax * 0.08 : 0; // 8% Kirchensteuer

    const totalTax = incomeTax + solidarityTax + churchTaxAmount;
    const netSalary = grossSalary - totalSocialSecurityEmployee - totalTax;
    const employerCosts = grossSalary + totalSocialSecurityEmployer;

    setTimeout(() => {
      setCalculation({
        grossSalary,
        netSalary,
        socialSecurityContributions: {
          healthInsurance: {
            employee: healthInsuranceEmployee,
            employer: healthInsuranceEmployer,
            total: healthInsuranceEmployee + healthInsuranceEmployer
          },
          pensionInsurance: {
            employee: pensionInsuranceEmployee,
            employer: pensionInsuranceEmployer,
            total: pensionInsuranceEmployee + pensionInsuranceEmployer
          },
          unemploymentInsurance: {
            employee: unemploymentInsuranceEmployee,
            employer: unemploymentInsuranceEmployer,
            total: unemploymentInsuranceEmployee + unemploymentInsuranceEmployer
          },
          careInsurance: {
            employee: careInsuranceEmployee,
            employer: careInsuranceEmployer,
            total: careInsuranceEmployee + careInsuranceEmployer
          },
          total: {
            employee: totalSocialSecurityEmployee,
            employer: totalSocialSecurityEmployer,
            total: totalSocialSecurityEmployee + totalSocialSecurityEmployer
          }
        },
        taxes: {
          incomeTax,
          churchTax: churchTaxAmount,
          solidarityTax,
          total: totalTax
        },
        employerCosts
      });
      setIsCalculating(false);
    }, 1000);
  };

  useEffect(() => {
    if (employeeData && employeeData.grossSalary > 0) {
      calculateSalary(
        employeeData.grossSalary, 
        employeeData.taxClass || 'I',
        employeeData.churchTax || false
      );
    }
  }, [employeeData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gehaltsrechner"
        description="Brutto-Netto-Berechnung für deutsche Lohnabrechnung"
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          {calculation && (
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              PDF Export
            </Button>
          )}
        </div>
      </PageHeader>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Dies ist eine vereinfachte Demo-Berechnung. Für rechtssichere Lohnabrechnungen sind 
          die aktuellen Steuer- und Sozialversicherungsgesetze zu beachten.
        </AlertDescription>
      </Alert>

      {employeeData && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Mitarbeiterdaten</CardTitle>
            <CardDescription>Grundlage für die Berechnung</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{employeeData.firstName} {employeeData.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Steuerklasse</p>
                <p className="font-medium">{employeeData.taxClass}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bruttogehalt</p>
                <p className="font-medium">
                  {employeeData.grossSalary?.toLocaleString('de-DE', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isCalculating && (
        <Card className="shadow-card">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calculator className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-lg font-medium">Berechnung läuft...</p>
              <p className="text-sm text-muted-foreground">
                Steuer- und Sozialversicherungsabgaben werden ermittelt
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {calculation && !isCalculating && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hauptergebnis */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-xl">Berechnungsergebnis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-lg">Bruttogehalt</span>
                  <span className="text-lg font-bold text-primary">
                    {calculation.grossSalary.toLocaleString('de-DE', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-destructive">
                  <span>- Sozialversicherung (AN)</span>
                  <span>
                    -{calculation.socialSecurityContributions.total.employee.toLocaleString('de-DE', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-destructive">
                  <span>- Lohnsteuer & Abgaben</span>
                  <span>
                    -{calculation.taxes.total.toLocaleString('de-DE', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t text-xl">
                  <span className="font-bold">Nettogehalt</span>
                  <span className="font-bold text-2xl text-success">
                    {calculation.netSalary.toLocaleString('de-DE', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    })}
                  </span>
                </div>
              </div>

              <div className="bg-accent p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Arbeitgeber-Gesamtaufwand</span>
                  <span className="font-bold text-warning">
                    {calculation.employerCosts.toLocaleString('de-DE', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Inkl. Arbeitgeberanteile zur Sozialversicherung
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailaufschlüsselung */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Sozialversicherung</CardTitle>
                <CardDescription>Aufschlüsselung der Beiträge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <span>Versicherung</span>
                  <span className="text-center">Arbeitnehmer</span>
                  <span className="text-center">Arbeitgeber</span>
                </div>

                <div className="grid grid-cols-3 text-sm">
                  <span>Krankenversicherung</span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.healthInsurance.employee.toFixed(2)}€
                  </span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.healthInsurance.employer.toFixed(2)}€
                  </span>
                </div>

                <div className="grid grid-cols-3 text-sm">
                  <span>Rentenversicherung</span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.pensionInsurance.employee.toFixed(2)}€
                  </span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.pensionInsurance.employer.toFixed(2)}€
                  </span>
                </div>

                <div className="grid grid-cols-3 text-sm">
                  <span>Arbeitslosenversicherung</span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.unemploymentInsurance.employee.toFixed(2)}€
                  </span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.unemploymentInsurance.employer.toFixed(2)}€
                  </span>
                </div>

                <div className="grid grid-cols-3 text-sm">
                  <span>Pflegeversicherung</span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.careInsurance.employee.toFixed(2)}€
                  </span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.careInsurance.employer.toFixed(2)}€
                  </span>
                </div>

                <div className="grid grid-cols-3 text-sm font-medium pt-2 border-t">
                  <span>Gesamt</span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.total.employee.toFixed(2)}€
                  </span>
                  <span className="text-center">
                    {calculation.socialSecurityContributions.total.employer.toFixed(2)}€
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Steuern</CardTitle>
                <CardDescription>Lohnsteuer und Abgaben</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Lohnsteuer</span>
                  <span>{calculation.taxes.incomeTax.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Solidaritätszuschlag</span>
                  <span>{calculation.taxes.solidarityTax.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Kirchensteuer</span>
                  <span>{calculation.taxes.churchTax.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Gesamt</span>
                  <span>{calculation.taxes.total.toFixed(2)}€</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}