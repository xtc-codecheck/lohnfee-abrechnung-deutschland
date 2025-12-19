import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Download,
  Euro,
  Clock,
  Calendar
} from 'lucide-react';
import { PayrollPDFGenerator } from './payroll-pdf-generator';
import { Employee } from '@/types/employee';
import { 
  calculateCompleteTax, 
  calculateOvertimeAndBonuses,
  TaxCalculationParams,
  OvertimeCalculation 
} from '@/utils/tax-calculation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DetailedPayrollCalculationProps {
  employee?: Employee;
  onBack: () => void;
  onSave?: (calculation: PayrollCalculationResult) => void;
}

export interface PayrollCalculationResult {
  employeeId: string;
  period: {
    year: number;
    month: number;
  };
  workingTime: {
    regularHours: number;
    overtimeHours: number;
    nightHours: number;
    sundayHours: number;
    holidayHours: number;
    vacationDays: number;
    sickDays: number;
  };
  salary: {
    baseSalary: number;
    hourlyRate: number;
    overtimePay: number;
    bonuses: {
      night: number;
      sunday: number;
      holiday: number;
      vacation: number;
      christmas: number;
      other: number;
    };
  };
  specialPayments: {
    vacationPay: number;
    christmasBonus: number;
    oneTimePayments: number;
    sickPay: number;
  };
  deductions: {
    unpaidLeave: number;
    advances: number;
    other: number;
  };
  taxes: {
    incomeTax: number;
    solidarityTax: number;
    churchTax: number;
  };
  socialInsurance: {
    pension: number;
    unemployment: number;
    health: number;
    care: number;
  };
  totals: {
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    employerCosts: number;
  };
  calculation: any;
}

export function DetailedPayrollCalculation({ employee, onBack, onSave }: DetailedPayrollCalculationProps) {
  const [period, setPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const [workingTime, setWorkingTime] = useState({
    regularHours: 160, // Standard-Monatsarbeitszeit
    overtimeHours: 0,
    nightHours: 0,
    sundayHours: 0,
    holidayHours: 0,
    vacationDays: 0,
    sickDays: 0,
  });

  const [specialPayments, setSpecialPayments] = useState({
    vacationPay: 0,
    christmasBonus: 0,
    oneTimePayments: 0,
    sickPay: 0,
  });

  const [deductions, setDeductions] = useState({
    unpaidLeave: 0,
    advances: 0,
    other: 0,
  });

  const [taxParams, setTaxParams] = useState<TaxCalculationParams>({
    grossSalaryYearly: employee?.salaryData.grossSalary * 12 || 50000,
    taxClass: employee?.personalData.taxClass || 'I',
    childAllowances: employee?.personalData.childAllowances || 0,
    churchTax: employee?.personalData.churchTax || false,
    churchTaxRate: 9, // Default 9% (andere Länder)
    healthInsuranceRate: employee?.personalData.healthInsurance.additionalRate || 1.7,
    isEastGermany: false,
    isChildless: true,
    age: 30,
  });

  const [calculation, setCalculation] = useState<any>(null);
  const [overtimeResult, setOvertimeResult] = useState<any>(null);

  // Berechnung der Lohnabrechnung
  useEffect(() => {
    if (!employee) return;

    // Basis-Stundenlohn berechnen
    const monthlyHours = 173.33; // Durchschnittliche Monatsarbeitszeit
    const hourlyRate = employee.salaryData.grossSalary / monthlyHours;

    // Überstunden und Zuschläge berechnen
    const overtimeCalc: OvertimeCalculation = {
      regularHours: workingTime.regularHours,
      overtimeHours: workingTime.overtimeHours,
      nightHours: workingTime.nightHours,
      sundayHours: workingTime.sundayHours,
      holidayHours: workingTime.holidayHours,
      hourlyRate,
    };

    const overtimeRes = calculateOvertimeAndBonuses(overtimeCalc);
    setOvertimeResult(overtimeRes);

    // Bruttolohn einschließlich Zuschläge und Sonderzahlungen
    const totalGross = overtimeRes.totalGrossPay + 
                      specialPayments.vacationPay + 
                      specialPayments.christmasBonus + 
                      specialPayments.oneTimePayments + 
                      specialPayments.sickPay -
                      deductions.unpaidLeave - 
                      deductions.advances - 
                      deductions.other;

    // Steuern und Sozialabgaben berechnen
    const updatedTaxParams = {
      ...taxParams,
      grossSalaryYearly: totalGross * 12,
    };

    const taxResult = calculateCompleteTax(updatedTaxParams);
    setCalculation(taxResult);
  }, [employee, workingTime, specialPayments, deductions, taxParams]);

  const handleSaveCalculation = () => {
    if (!employee || !calculation || !overtimeResult) return;

    const result: PayrollCalculationResult = {
      employeeId: employee.id,
      period,
      workingTime,
      salary: {
        baseSalary: employee.salaryData.grossSalary,
        hourlyRate: employee.salaryData.grossSalary / 173.33,
        overtimePay: overtimeResult.overtimePay,
        bonuses: {
          night: overtimeResult.nightBonus,
          sunday: overtimeResult.sundayBonus,
          holiday: overtimeResult.holidayBonus,
          vacation: specialPayments.vacationPay,
          christmas: specialPayments.christmasBonus,
          other: specialPayments.oneTimePayments,
        },
      },
      specialPayments,
      deductions,
      taxes: {
        incomeTax: calculation.incomeTax / 12,
        solidarityTax: calculation.solidarityTax / 12,
        churchTax: calculation.churchTax / 12,
      },
      socialInsurance: {
        pension: calculation.pensionInsurance / 12,
        unemployment: calculation.unemploymentInsurance / 12,
        health: calculation.healthInsurance / 12,
        care: calculation.careInsurance / 12,
      },
      totals: {
        grossSalary: calculation.grossMonthly,
        totalDeductions: calculation.totalDeductions / 12,
        netSalary: calculation.netMonthly,
        employerCosts: calculation.employerCosts / 12,
      },
      calculation,
    };

    onSave?.(result);
  };

  const generatePDF = () => {
    // TODO: PDF-Generierung implementieren
  };

  if (!employee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kein Mitarbeiter ausgewählt</CardTitle>
          <CardDescription>
            Bitte wählen Sie einen Mitarbeiter für die Lohnabrechnung aus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack}>Zurück</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Detaillierte Lohnabrechnung</h1>
          <p className="text-muted-foreground">
            {employee.personalData.firstName} {employee.personalData.lastName} - 
            {format(new Date(period.year, period.month - 1), 'MMMM yyyy', { locale: de })}
          </p>
        </div>
        <div className="flex gap-2">
          {calculation && (
            <PayrollPDFGenerator 
              employee={employee} 
              calculation={{
                employeeId: employee.id,
                period,
                workingTime,
                salary: {
                  baseSalary: employee.salaryData.grossSalary,
                  hourlyRate: employee.salaryData.grossSalary / 173.33,
                  overtimePay: overtimeResult?.overtimePay || 0,
                  bonuses: {
                    night: overtimeResult?.nightBonus || 0,
                    sunday: overtimeResult?.sundayBonus || 0,
                    holiday: overtimeResult?.holidayBonus || 0,
                    vacation: specialPayments.vacationPay,
                    christmas: specialPayments.christmasBonus,
                    other: specialPayments.oneTimePayments,
                  },
                },
                specialPayments,
                deductions,
                taxes: {
                  incomeTax: calculation.incomeTax / 12,
                  solidarityTax: calculation.solidarityTax / 12,
                  churchTax: calculation.churchTax / 12,
                },
                socialInsurance: {
                  pension: calculation.pensionInsurance / 12,
                  unemployment: calculation.unemploymentInsurance / 12,
                  health: calculation.healthInsurance / 12,
                  care: calculation.careInsurance / 12,
                },
                totals: {
                  grossSalary: calculation.grossMonthly,
                  totalDeductions: calculation.totalDeductions / 12,
                  netSalary: calculation.netMonthly,
                  employerCosts: calculation.employerCosts / 12,
                },
                calculation,
              }}
            />
          )}
          <Button onClick={handleSaveCalculation}>
            Speichern
          </Button>
          <Button variant="outline" onClick={onBack}>
            Zurück
          </Button>
        </div>
      </div>

      <Tabs defaultValue="eingabe" className="space-y-4">
        <TabsList>
          <TabsTrigger value="eingabe">Eingabe</TabsTrigger>
          <TabsTrigger value="berechnung">Berechnung</TabsTrigger>
          <TabsTrigger value="abrechnung">Abrechnung</TabsTrigger>
        </TabsList>

        <TabsContent value="eingabe" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Abrechnungszeitraum */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Abrechnungszeitraum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Jahr</Label>
                    <Input
                      id="year"
                      type="number"
                      value={period.year}
                      onChange={(e) => setPeriod({ ...period, year: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="month">Monat</Label>
                    <Select 
                      value={period.month.toString()} 
                      onValueChange={(value) => setPeriod({ ...period, month: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {format(new Date(2024, i), 'MMMM', { locale: de })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Arbeitszeit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Arbeitszeit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="regularHours">Reguläre Stunden</Label>
                    <Input
                      id="regularHours"
                      type="number"
                      value={workingTime.regularHours}
                      onChange={(e) => setWorkingTime({ 
                        ...workingTime, 
                        regularHours: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtimeHours">Überstunden</Label>
                    <Input
                      id="overtimeHours"
                      type="number"
                      value={workingTime.overtimeHours}
                      onChange={(e) => setWorkingTime({ 
                        ...workingTime, 
                        overtimeHours: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nightHours">Nachtstunden</Label>
                    <Input
                      id="nightHours"
                      type="number"
                      value={workingTime.nightHours}
                      onChange={(e) => setWorkingTime({ 
                        ...workingTime, 
                        nightHours: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sundayHours">Sonntagsstunden</Label>
                    <Input
                      id="sundayHours"
                      type="number"
                      value={workingTime.sundayHours}
                      onChange={(e) => setWorkingTime({ 
                        ...workingTime, 
                        sundayHours: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="holidayHours">Feiertagsstunden</Label>
                    <Input
                      id="holidayHours"
                      type="number"
                      value={workingTime.holidayHours}
                      onChange={(e) => setWorkingTime({ 
                        ...workingTime, 
                        holidayHours: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vacationDays">Urlaubstage</Label>
                    <Input
                      id="vacationDays"
                      type="number"
                      value={workingTime.vacationDays}
                      onChange={(e) => setWorkingTime({ 
                        ...workingTime, 
                        vacationDays: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sonderzahlungen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  Sonderzahlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vacationPay">Urlaubsgeld</Label>
                    <Input
                      id="vacationPay"
                      type="number"
                      value={specialPayments.vacationPay}
                      onChange={(e) => setSpecialPayments({ 
                        ...specialPayments, 
                        vacationPay: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="christmasBonus">Weihnachtsgeld</Label>
                    <Input
                      id="christmasBonus"
                      type="number"
                      value={specialPayments.christmasBonus}
                      onChange={(e) => setSpecialPayments({ 
                        ...specialPayments, 
                        christmasBonus: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oneTimePayments">Einmalzahlungen</Label>
                    <Input
                      id="oneTimePayments"
                      type="number"
                      value={specialPayments.oneTimePayments}
                      onChange={(e) => setSpecialPayments({ 
                        ...specialPayments, 
                        oneTimePayments: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sickPay">Krankengeld</Label>
                    <Input
                      id="sickPay"
                      type="number"
                      value={specialPayments.sickPay}
                      onChange={(e) => setSpecialPayments({ 
                        ...specialPayments, 
                        sickPay: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Abzüge */}
            <Card>
              <CardHeader>
                <CardTitle>Abzüge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unpaidLeave">Unbezahlter Urlaub</Label>
                    <Input
                      id="unpaidLeave"
                      type="number"
                      value={deductions.unpaidLeave}
                      onChange={(e) => setDeductions({ 
                        ...deductions, 
                        unpaidLeave: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advances">Vorschüsse</Label>
                    <Input
                      id="advances"
                      type="number"
                      value={deductions.advances}
                      onChange={(e) => setDeductions({ 
                        ...deductions, 
                        advances: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherDeductions">Sonstige Abzüge</Label>
                    <Input
                      id="otherDeductions"
                      type="number"
                      value={deductions.other}
                      onChange={(e) => setDeductions({ 
                        ...deductions, 
                        other: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="berechnung" className="space-y-6">
          {calculation && overtimeResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bruttolohn Aufschlüsselung */}
              <Card>
                <CardHeader>
                  <CardTitle>Bruttolohn Aufschlüsselung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Grundlohn:</span>
                    <span>{overtimeResult.regularPay.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Überstundenzuschlag (25%):</span>
                    <span>{(overtimeResult.overtimePay - workingTime.overtimeHours * (employee.salaryData.grossSalary / 173.33)).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nachtschichtzuschlag (25%):</span>
                    <span>{overtimeResult.nightBonus.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sonntagszuschlag (50%):</span>
                    <span>{overtimeResult.sundayBonus.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Feiertagszuschlag (100%):</span>
                    <span>{overtimeResult.holidayBonus.toFixed(2)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Gesamt Brutto:</span>
                    <span>{calculation.grossMonthly.toFixed(2)} €</span>
                  </div>
                </CardContent>
              </Card>

              {/* Sozialversicherung */}
              <Card>
                <CardHeader>
                  <CardTitle>Sozialversicherung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Rentenversicherung (9,3%):</span>
                    <span>{(calculation.pensionInsurance / 12).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arbeitslosenversicherung (1,3%):</span>
                    <span>{(calculation.unemploymentInsurance / 12).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Krankenversicherung (7,3% + ZB):</span>
                    <span>{(calculation.healthInsurance / 12).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pflegeversicherung:</span>
                    <span>{(calculation.careInsurance / 12).toFixed(2)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Gesamt SV:</span>
                    <span>{(calculation.totalSocialContributions / 12).toFixed(2)} €</span>
                  </div>
                </CardContent>
              </Card>

              {/* Steuern */}
              <Card>
                <CardHeader>
                  <CardTitle>Steuern</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Lohnsteuer (Klasse {taxParams.taxClass}):</span>
                    <span>{(calculation.incomeTax / 12).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Solidaritätszuschlag (5,5%):</span>
                    <span>{(calculation.solidarityTax / 12).toFixed(2)} €</span>
                  </div>
                  {taxParams.churchTax && (
                    <div className="flex justify-between">
                      <span>Kirchensteuer ({taxParams.churchTaxRate}%):</span>
                      <span>{(calculation.churchTax / 12).toFixed(2)} €</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Gesamt Steuern:</span>
                    <span>{(calculation.totalTaxes / 12).toFixed(2)} €</span>
                  </div>
                </CardContent>
              </Card>

              {/* Zusammenfassung */}
              <Card>
                <CardHeader>
                  <CardTitle>Zusammenfassung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Bruttolohn:</span>
                    <span>{calculation.grossMonthly.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>- Abzüge gesamt:</span>
                    <span>{(calculation.totalDeductions / 12).toFixed(2)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Nettolohn:</span>
                    <span className="text-primary">{calculation.netMonthly.toFixed(2)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Arbeitgeberkosten:</span>
                    <span>{(calculation.employerCosts / 12).toFixed(2)} €</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="abrechnung" className="space-y-6">
          {calculation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Lohnabrechnung - {format(new Date(period.year, period.month - 1), 'MMMM yyyy', { locale: de })}
                </CardTitle>
                <CardDescription>
                  {employee.personalData.firstName} {employee.personalData.lastName} - Personalnummer: {employee.id.slice(-6)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mitarbeiterdaten */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Steuerklasse:</strong> {employee.personalData.taxClass}<br/>
                    <strong>Kinderfreibeträge:</strong> {employee.personalData.childAllowances}<br/>
                    <strong>Kirchensteuer:</strong> {employee.personalData.churchTax ? 'Ja' : 'Nein'}
                  </div>
                  <div>
                    <strong>Sozialversicherungsnummer:</strong> {employee.personalData.socialSecurityNumber}<br/>
                    <strong>Krankenkasse:</strong> {employee.personalData.healthInsurance.name}<br/>
                    <strong>Zusatzbeitrag:</strong> {employee.personalData.healthInsurance.additionalRate}%
                  </div>
                </div>

                <Separator />

                {/* Abrechnung */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Bezüge</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium">Bezeichnung</div>
                    <div className="font-medium text-right">Betrag</div>
                    <div className="font-medium text-right">Steuer/SV</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Grundgehalt</div>
                    <div className="text-right">{employee.salaryData.grossSalary.toFixed(2)} €</div>
                    <div className="text-right">●/●</div>
                  </div>
                  
                  {workingTime.overtimeHours > 0 && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Überstunden ({workingTime.overtimeHours}h à 25%)</div>
                    <div className="text-right">{(overtimeResult.overtimePay - workingTime.overtimeHours * (employee.salaryData.grossSalary / 173.33)).toFixed(2)} €</div>
                    <div className="text-right">●/●</div>
                  </div>
                  )}
                  
                  {specialPayments.vacationPay > 0 && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>Urlaubsgeld</div>
                      <div className="text-right">{specialPayments.vacationPay.toFixed(2)} €</div>
                      <div className="text-right">●/●</div>
                    </div>
                  )}
                  
                  {specialPayments.christmasBonus > 0 && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>Weihnachtsgeld</div>
                      <div className="text-right">{specialPayments.christmasBonus.toFixed(2)} €</div>
                      <div className="text-right">●/●</div>
                    </div>
                  )}

                  <Separator />
                  
                  <div className="grid grid-cols-3 gap-4 text-sm font-semibold">
                    <div>Gesamtbrutto</div>
                    <div className="text-right">{calculation.grossMonthly.toFixed(2)} €</div>
                    <div></div>
                  </div>

                  <Separator />

                  <h3 className="font-semibold">Abzüge</h3>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Lohnsteuer</div>
                    <div className="text-right">{(calculation.incomeTax / 12).toFixed(2)} €</div>
                    <div></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Solidaritätszuschlag</div>
                    <div className="text-right">{(calculation.solidarityTax / 12).toFixed(2)} €</div>
                    <div></div>
                  </div>
                  
                  {taxParams.churchTax && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>Kirchensteuer</div>
                      <div className="text-right">{(calculation.churchTax / 12).toFixed(2)} €</div>
                      <div></div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Rentenversicherung AN</div>
                    <div className="text-right">{(calculation.pensionInsurance / 12).toFixed(2)} €</div>
                    <div></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Arbeitslosenversicherung AN</div>
                    <div className="text-right">{(calculation.unemploymentInsurance / 12).toFixed(2)} €</div>
                    <div></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Krankenversicherung AN</div>
                    <div className="text-right">{(calculation.healthInsurance / 12).toFixed(2)} €</div>
                    <div></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Pflegeversicherung AN</div>
                    <div className="text-right">{(calculation.careInsurance / 12).toFixed(2)} €</div>
                    <div></div>
                  </div>

                  <Separator />
                  
                  <div className="grid grid-cols-3 gap-4 text-sm font-semibold">
                    <div>Gesamtabzüge</div>
                    <div className="text-right">{(calculation.totalDeductions / 12).toFixed(2)} €</div>
                    <div></div>
                  </div>

                  <Separator />
                  
                  <div className="grid grid-cols-3 gap-4 text-lg font-bold">
                    <div>Auszahlungsbetrag</div>
                    <div className="text-right text-primary">{calculation.netMonthly.toFixed(2)} €</div>
                    <div></div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={generatePDF}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF erstellen
                  </Button>
                  <Button onClick={handleSaveCalculation}>
                    Abrechnung speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}