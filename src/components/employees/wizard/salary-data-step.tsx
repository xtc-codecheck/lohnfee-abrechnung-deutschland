/**
 * Step 3: Gehaltsdaten
 */

import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SOCIAL_INSURANCE_RATES_2025 } from '@/constants/social-security';
import { WizardStepProps } from './types';

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {error}
    </p>
  );
}

export function SalaryDataStep({ formData, errors, onInputChange }: WizardStepProps) {
  const calculateNetSalary = () => {
    const grossSalary = formData.grossSalary || 0;
    if (grossSalary === 0) return null;

    const basicHealthInsuranceRate = 14.6;
    const totalHealthInsuranceRate = basicHealthInsuranceRate + formData.healthInsuranceRate;
    
    const hasChildlessSurcharge = formData.childAllowances === 0;
    const careRate = hasChildlessSurcharge ? SOCIAL_INSURANCE_RATES_2025.careChildless : SOCIAL_INSURANCE_RATES_2025.care;

    // Arbeitgeber-Anteile
    const employerHealthInsurance = (grossSalary * (basicHealthInsuranceRate / 2 + formData.healthInsuranceRate / 2)) / 100;
    const employerPension = (grossSalary * SOCIAL_INSURANCE_RATES_2025.pension.employer) / 100;
    const employerUnemployment = (grossSalary * SOCIAL_INSURANCE_RATES_2025.unemployment.employer) / 100;
    const employerCare = (grossSalary * careRate.employer) / 100;

    // Arbeitnehmer-Anteile
    const employeeHealthInsurance = (grossSalary * (basicHealthInsuranceRate / 2 + formData.healthInsuranceRate / 2)) / 100;
    const employeePension = (grossSalary * SOCIAL_INSURANCE_RATES_2025.pension.employee) / 100;
    const employeeUnemployment = (grossSalary * SOCIAL_INSURANCE_RATES_2025.unemployment.employee) / 100;
    const employeeCare = (grossSalary * careRate.employee) / 100;

    const employerGross = grossSalary + employerHealthInsurance + employerPension + employerUnemployment + employerCare;
    const totalSocialSecurityDeductions = employeeHealthInsurance + employeePension + employeeUnemployment + employeeCare;
    const netSalary = grossSalary - totalSocialSecurityDeductions;

    return {
      employerGross,
      employeeGross: grossSalary,
      deductions: {
        healthInsurance: employeeHealthInsurance,
        pension: employeePension,
        unemployment: employeeUnemployment,
        care: employeeCare,
        total: totalSocialSecurityDeductions
      },
      netSalary,
      hasChildlessSurcharge
    };
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Gehaltsdaten</CardTitle>
        <CardDescription>Grundvergütung und Lohnart</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lohnart */}
        <div className="space-y-2">
          <Label htmlFor="salaryType">Lohnart*</Label>
          <Select value={formData.salaryType} onValueChange={(value) => onInputChange('salaryType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Festgehalt</SelectItem>
              <SelectItem value="hourly">Stundenlohn</SelectItem>
              <SelectItem value="variable">Variabel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bruttogehalt */}
        {formData.salaryType === 'fixed' && (
          <div className="space-y-2">
            <Label htmlFor="grossSalary">Bruttogehalt pro Monat*</Label>
            <Input
              id="grossSalary"
              type="number"
              min="0"
              step="0.01"
              value={formData.grossSalary}
              onChange={(e) => onInputChange('grossSalary', parseFloat(e.target.value) || 0)}
              placeholder="4500.00"
              className={errors.grossSalary ? 'border-destructive' : ''}
            />
            <FieldError error={errors.grossSalary} />
          </div>
        )}

        {/* Stundenlohn */}
        {(formData.salaryType === 'hourly' || formData.employmentType === 'minijob') && (
          <div className="space-y-2">
            <Label htmlFor="hourlyWage">Stundenlohn*</Label>
            <Input
              id="hourlyWage"
              type="number"
              min="0"
              step="0.01"
              value={formData.hourlyWage}
              onChange={(e) => onInputChange('hourlyWage', parseFloat(e.target.value) || 0)}
              placeholder="15.00"
            />
          </div>
        )}

        {/* Zusatzbeitrag */}
        <div className="space-y-2">
          <Label htmlFor="healthInsuranceRate">KV-Zusatzbeitrag (%)*</Label>
          <Input
            id="healthInsuranceRate"
            type="number"
            min="0"
            max="5"
            step="0.01"
            value={formData.healthInsuranceRate}
            onChange={(e) => onInputChange('healthInsuranceRate', parseFloat(e.target.value) || 0)}
          />
          <div className="text-xs text-muted-foreground">
            Wird automatisch bei Krankenkassenwahl ausgefüllt
          </div>
        </div>

        {/* SV-Sätze Übersicht */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div className="font-medium text-sm">Sozialversicherungssätze 2025</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="font-medium">Krankenversicherung</div>
              <div className="text-muted-foreground">
                Basis: 14,6%<br />
                (AG: 7,3% | AN: 7,3%)<br />
                + Zusatzbeitrag: {formData.healthInsuranceRate}%
              </div>
            </div>
            <div>
              <div className="font-medium">Rentenversicherung</div>
              <div className="text-muted-foreground">
                Gesamt: {SOCIAL_INSURANCE_RATES_2025.pension.total}%<br />
                (AG: {SOCIAL_INSURANCE_RATES_2025.pension.employer}% | AN: {SOCIAL_INSURANCE_RATES_2025.pension.employee}%)
              </div>
            </div>
            <div>
              <div className="font-medium">Arbeitslosenvers.</div>
              <div className="text-muted-foreground">
                Gesamt: {SOCIAL_INSURANCE_RATES_2025.unemployment.total}%<br />
                (AG: {SOCIAL_INSURANCE_RATES_2025.unemployment.employer}% | AN: {SOCIAL_INSURANCE_RATES_2025.unemployment.employee}%)
              </div>
            </div>
            <div>
              <div className="font-medium">Pflegeversicherung</div>
              <div className="text-muted-foreground">
                Gesamt: {formData.childAllowances === 0 ? SOCIAL_INSURANCE_RATES_2025.careChildless.total : SOCIAL_INSURANCE_RATES_2025.care.total}%<br />
                {formData.childAllowances === 0 && <span className="text-xs text-orange-600">+ Kinderlosenzuschlag</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Nettolohnberechnung */}
        {formData.grossSalary > 0 && formData.healthInsurance && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <div className="font-medium text-sm text-blue-800">Voraussichtliche Nettolohnberechnung</div>
            {(() => {
              const calculation = calculateNetSalary();
              if (!calculation) return null;

              return (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 bg-blue-100 rounded">
                    <span className="font-medium">Arbeitgeberbrutto:</span>
                    <span className="font-bold">{calculation.employerGross.toFixed(2)}€</span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="font-medium">Arbeitnehmerbrutto:</span>
                    <span className="font-bold">{calculation.employeeGross.toFixed(2)}€</span>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-muted-foreground">Abzüge (AN-Anteil):</div>
                    <div className="pl-4 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>- Krankenversicherung:</span>
                        <span>{calculation.deductions.healthInsurance.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Rentenversicherung:</span>
                        <span>{calculation.deductions.pension.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Arbeitslosenversicherung:</span>
                        <span>{calculation.deductions.unemployment.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Pflegeversicherung{calculation.hasChildlessSurcharge ? ' (inkl. KL-Zuschlag)' : ''}:</span>
                        <span>{calculation.deductions.care.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Gesamt Sozialversicherung:</span>
                        <span>{calculation.deductions.total.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                    <span className="font-medium">Netto (vor Lohnsteuer):</span>
                    <span className="font-bold text-green-700">{calculation.netSalary.toFixed(2)}€</span>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    * Vereinfachte Berechnung ohne Lohnsteuer, Kirchensteuer und Solidaritätszuschlag
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
