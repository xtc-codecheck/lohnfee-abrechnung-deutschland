import { Check, CheckCircle2, Calculator, FileText, Download, Play, AlertTriangle, Info, Zap, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Employee } from '@/types/employee';
import { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import { TimeEntry as RealTimeEntry } from '@/types/time-tracking';
import { MONTHS, StepStatus } from './types';

// Hinweis: TimeEntry kommt aus time-tracking, alias um Doppel-Imports zu vermeiden.
type Time = RealTimeEntry;

interface CommonProps {
  status: StepStatus;
  selectedMonth: number;
  selectedYear: number;
  activeEmployees: Employee[];
}

export function StepTimeTracking({ status, selectedMonth, selectedYear, activeEmployees, timeEntries }: CommonProps & { timeEntries: Time[] }) {
  const monthEntries = timeEntries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });
  const totalHours = monthEntries.reduce((sum, e) => sum + (e.hoursWorked || 0), 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-foreground">{activeEmployees.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Aktive Mitarbeiter</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-foreground">{monthEntries.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Zeiteinträge</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-foreground">{totalHours.toFixed(1)}h</div>
          <div className="text-sm text-muted-foreground mt-1">Gesamtstunden</div>
        </CardContent></Card>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Automatische Prüfung</AlertTitle>
        <AlertDescription>
          Das System hat die Zeiterfassung für {MONTHS[selectedMonth - 1]} automatisch geprüft.
          {status.warnings.length === 0 ? ' Keine Auffälligkeiten gefunden.' : ' Bitte prüfen Sie die folgenden Hinweise:'}
        </AlertDescription>
      </Alert>

      {status.warnings.map((w, i) => (
        <Alert key={i} variant="destructive" className="bg-warning/10 border-warning/30 text-warning dark:bg-warning/30 dark:border-warning dark:text-warning/70">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{w}</AlertDescription>
        </Alert>
      ))}

      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <div className="font-medium mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Vision: Autark-Modus
        </div>
        <p className="text-muted-foreground">
          Im Vollbetrieb werden Zeiterfassungsdaten automatisch importiert und validiert.
          Sie müssen nur noch bestätigen, dass alles korrekt ist.
        </p>
      </div>
    </div>
  );
}

export function StepSpecialPayments({ status, selectedMonth, activeEmployees }: CommonProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Sonderzahlungen für {MONTHS[selectedMonth - 1]}</AlertTitle>
        <AlertDescription>
          Das System prüft automatisch, ob für diesen Monat Sonderzahlungen fällig sind
          (Weihnachtsgeld, Urlaubsgeld, Boni, Jubiläen etc.)
        </AlertDescription>
      </Alert>

      {status.warnings.map((w, i) => (
        <Alert key={i} className="bg-warning/10 border-warning/30 dark:bg-warning/30 dark:border-warning">
          <Gift className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning dark:text-warning/70">{w}</AlertDescription>
        </Alert>
      ))}

      <Card>
        <CardHeader><CardTitle className="text-base">Automatisch erkannte Zahlungen</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeEmployees.slice(0, 5).map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">{emp.personalData.firstName} {emp.personalData.lastName}</div>
                  <div className="text-sm text-muted-foreground">
                    Gehalt: {emp.salaryData?.grossSalary?.toLocaleString('de-DE')}€
                  </div>
                </div>
                <Badge variant="outline" className="text-success border-success/30">
                  <Check className="h-3 w-3 mr-1" /> Regulär
                </Badge>
              </div>
            ))}
            {activeEmployees.length > 5 && (
              <div className="text-sm text-muted-foreground text-center">
                ... und {activeEmployees.length - 5} weitere Mitarbeiter
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StepPayroll({
  status, selectedMonth, selectedYear, activeEmployees, isProcessing, onCreate,
}: CommonProps & { isProcessing: boolean; onCreate: () => void }) {
  if (status.completed) {
    return (
      <div className="space-y-4">
        <Alert className="bg-success/10 border-success/30 dark:bg-success/30 dark:border-success">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success dark:text-success/70">Abrechnung vorhanden</AlertTitle>
          <AlertDescription className="text-success dark:text-success/70">
            Die Abrechnung für {MONTHS[selectedMonth - 1]} {selectedYear} wurde bereits erstellt.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  const totalGross = activeEmployees.reduce((s, e) => s + (e.salaryData?.grossSalary || 0), 0);
  return (
    <div className="space-y-4">
      <Alert>
        <Calculator className="h-4 w-4" />
        <AlertTitle>Abrechnung berechnen</AlertTitle>
        <AlertDescription>
          Für {activeEmployees.length} Mitarbeiter wird die Lohnabrechnung {MONTHS[selectedMonth - 1]} {selectedYear} erstellt.
          Steuern und Sozialversicherung werden automatisch nach PAP 2025/2026 berechnet.
        </AlertDescription>
      </Alert>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{activeEmployees.length}</div>
              <div className="text-xs text-muted-foreground">Mitarbeiter</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{totalGross.toLocaleString('de-DE')}€</div>
              <div className="text-xs text-muted-foreground">Brutto gesamt</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">PAP 2025</div>
              <div className="text-xs text-muted-foreground">Steuer-Algo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">BBG 2025</div>
              <div className="text-xs text-muted-foreground">SV-Grenzen</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onCreate}
        disabled={isProcessing || activeEmployees.length === 0}
        className="w-full bg-gradient-primary hover:opacity-90 h-12 text-base"
      >
        {isProcessing ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Wird berechnet...</>
        ) : (
          <><Play className="h-5 w-5 mr-2" /> Berechnen & prüfen</>
        )}
      </Button>
    </div>
  );
}

export function StepReports({ selectedMonth, selectedYear }: { selectedMonth: number; selectedYear: number }) {
  const items = [
    { title: 'SV-Meldungen (DEÜV)', desc: 'Sozialversicherungsmeldungen an die Krankenkassen' },
    { title: 'Beitragsnachweise', desc: 'Monatlicher Nachweis der SV-Beiträge je Krankenkasse' },
    { title: 'Lohnsteueranmeldung', desc: 'Meldung der einbehaltenen Lohnsteuer ans Finanzamt' },
  ];
  const tooltips = [
    'Pflichtmeldungen an Krankenkassen bei Einstellung, Austritt und jährlich.',
    'Zeigt der Krankenkasse, wie viel SV-Beiträge überwiesen werden müssen.',
    'Meldet dem Finanzamt die einbehaltene Lohnsteuer aller Mitarbeiter.',
  ];
  return (
    <div className="space-y-4">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Gesetzliche Meldungen</AlertTitle>
        <AlertDescription>
          Folgende Meldungen werden für {MONTHS[selectedMonth - 1]} {selectedYear} automatisch vorbereitet:
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {items.map((item, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {item.title}
                    <HelpTooltip content={tooltips[i]} />
                  </div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
                <Badge className="bg-success/10 text-success dark:bg-success/30 dark:text-success/70">
                  <Zap className="h-3 w-3 mr-1" /> Automatisch
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <div className="font-medium mb-1">💡 Hinweis für Laien</div>
        <p className="text-muted-foreground">
          Diese Meldungen sind gesetzlich vorgeschrieben. Das System erstellt sie automatisch
          aus Ihren Abrechnungsdaten. Im SYSTAX-Vollsystem werden sie direkt elektronisch
          an die Behörden übermittelt.
        </p>
      </div>
    </div>
  );
}

interface ExportProps {
  selectedMonth: number;
  selectedYear: number;
  activeEmployees: Employee[];
  payrollEntries: PayrollEntry[];
  payrollPeriods: PayrollPeriod[];
  onFinalApproval: () => void;
}

export function StepExport({
  selectedMonth, selectedYear, activeEmployees, payrollEntries, payrollPeriods, onFinalApproval,
}: ExportProps) {
  const totalGross = activeEmployees.reduce((s, e) => s + (e.salaryData?.grossSalary || 0), 0);
  const periodEntries = payrollEntries.filter(pe => {
    const period = payrollPeriods.find(p => p.id === pe.payrollPeriodId);
    return period && period.month === selectedMonth && period.year === selectedYear;
  });
  const hasRealData = periodEntries.length > 0;

  const summaryData = hasRealData ? {
    gross: periodEntries.reduce((s, e) => s + e.salaryCalculation.grossSalary, 0),
    netTotal: periodEntries.reduce((s, e) => s + e.salaryCalculation.netSalary, 0),
    taxTotal: periodEntries.reduce((s, e) => s + e.salaryCalculation.taxes.total, 0),
    taxIncome: periodEntries.reduce((s, e) => s + e.salaryCalculation.taxes.incomeTax, 0),
    taxSoli: periodEntries.reduce((s, e) => s + e.salaryCalculation.taxes.solidarityTax, 0),
    taxChurch: periodEntries.reduce((s, e) => s + e.salaryCalculation.taxes.churchTax, 0),
    svEmployee: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.total.employee, 0),
    svEmployer: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.total.employer, 0),
    svHealth: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.healthInsurance.employee, 0),
    svPension: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.pensionInsurance.employee, 0),
    svCare: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.careInsurance.employee, 0),
    svUnemploy: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employee, 0),
    svHealthAg: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.healthInsurance.employer, 0),
    svPensionAg: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.pensionInsurance.employer, 0),
    svCareAg: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.careInsurance.employer, 0),
    svUnemployAg: periodEntries.reduce((s, e) => s + e.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employer, 0),
    employerCosts: periodEntries.reduce((s, e) => s + e.salaryCalculation.employerCosts, 0),
  } : {
    gross: totalGross, netTotal: totalGross * 0.65, taxTotal: totalGross * 0.18,
    taxIncome: totalGross * 0.15, taxSoli: totalGross * 0.008, taxChurch: totalGross * 0.012,
    svEmployee: totalGross * 0.20, svEmployer: totalGross * 0.21,
    svHealth: totalGross * 0.073, svPension: totalGross * 0.093, svCare: totalGross * 0.017, svUnemploy: totalGross * 0.013,
    svHealthAg: totalGross * 0.073, svPensionAg: totalGross * 0.093, svCareAg: totalGross * 0.015, svUnemployAg: totalGross * 0.013,
    employerCosts: totalGross * 1.21,
  };

  const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Zusammenfassung {MONTHS[selectedMonth - 1]} {selectedYear}
            {!hasRealData && <Badge variant="outline" className="text-xs ml-auto font-normal">Schätzwerte</Badge>}
          </CardTitle>
          <CardDescription>{activeEmployees.length} Mitarbeiter · Alle Beträge in Euro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Brutto gesamt', value: summaryData.gross, color: 'text-foreground' },
              { label: 'Netto gesamt', value: summaryData.netTotal, color: 'text-success dark:text-success/70' },
              { label: 'AG-Gesamtkosten', value: summaryData.employerCosts, color: 'text-primary' },
              { label: 'Abgabenlast', value: summaryData.taxTotal + summaryData.svEmployee, color: 'text-warning dark:text-warning/70' },
            ].map((item, i) => (
              <div key={i} className="bg-muted/40 rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${item.color}`}>{fmt(item.value)}€</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="font-medium text-sm flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" /> Steuern (AN-Anteil)
            </div>
            {[
              { label: 'Lohnsteuer', value: summaryData.taxIncome },
              { label: 'Solidaritätszuschlag', value: summaryData.taxSoli },
              { label: 'Kirchensteuer', value: summaryData.taxChurch },
            ].map((row, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{fmt(row.value)}€</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2 border-t mt-2">
              <span>Steuern gesamt</span>
              <span>{fmt(summaryData.taxTotal)}€</span>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="font-medium text-sm flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Sozialversicherung
            </div>
            <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium mb-1">
              <span></span><span className="text-right">AN-Anteil</span><span className="text-right">AG-Anteil</span>
            </div>
            {[
              { label: 'Krankenversicherung', an: summaryData.svHealth, ag: summaryData.svHealthAg },
              { label: 'Rentenversicherung', an: summaryData.svPension, ag: summaryData.svPensionAg },
              { label: 'Pflegeversicherung', an: summaryData.svCare, ag: summaryData.svCareAg },
              { label: 'Arbeitslosenvers.', an: summaryData.svUnemploy, ag: summaryData.svUnemployAg },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-right font-medium">{fmt(row.an)}€</span>
                <span className="text-right font-medium">{fmt(row.ag)}€</span>
              </div>
            ))}
            <div className="grid grid-cols-3 text-sm font-bold pt-2 border-t mt-2">
              <span>SV gesamt</span>
              <span className="text-right">{fmt(summaryData.svEmployee)}€</span>
              <span className="text-right">{fmt(summaryData.svEmployer)}€</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {[
          { title: 'DATEV-Export', desc: 'Buchungsdaten im EXTF v7.0 Format', icon: Download },
          { title: 'GoBD-Archiv', desc: 'Revisionssichere Archivierung', icon: FileText },
          { title: 'Zahlungsliste', desc: 'Überweisungsliste Nettogehälter', icon: Calculator },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm">Exportieren</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="text-lg font-bold">Abrechnung {MONTHS[selectedMonth - 1]} {selectedYear} freigeben</div>
            <p className="text-sm text-muted-foreground">
              Nach der Freigabe werden die Daten festgeschrieben und können nicht mehr geändert werden.
            </p>
            <Button
              onClick={onFinalApproval}
              className="w-full bg-gradient-primary hover:opacity-90 h-12 text-base"
            >
              <Check className="h-5 w-5 mr-2" />
              Monatsabrechnung freigeben ✓
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
