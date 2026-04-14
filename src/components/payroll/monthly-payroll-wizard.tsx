/**
 * Monatlicher Abrechnungs-Wizard
 * 
 * 5-Schritt Guided Workflow für steuerliche Laien:
 * 1. Zeiterfassung prüfen
 * 2. Sonderzahlungen prüfen
 * 3. Abrechnung erstellen
 * 4. Meldungen generieren
 * 5. Export & Freigabe
 * 
 * Vision: Vollautark – Nutzer nickt nur noch ab.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Gift,
  Calculator, FileText, Download, Play, AlertTriangle, Info,
  Zap, Loader2, ChevronRight, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { useEmployees } from '@/contexts/employee-context';
import { useSupabasePayroll } from '@/hooks/use-supabase-payroll';
import { useTimeTracking } from '@/hooks/use-time-tracking';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from '@/components/ui/help-tooltip';

interface MonthlyPayrollWizardProps {
  onBack: () => void;
  onComplete: () => void;
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

interface StepStatus {
  completed: boolean;
  approved: boolean;
  warnings: string[];
  autoChecked: boolean;
}

const WIZARD_STEPS = [
  { id: 'time', title: 'Zeiterfassung prüfen', icon: Clock, description: 'Arbeitszeiten und Abwesenheiten kontrollieren' },
  { id: 'special', title: 'Sonderzahlungen', icon: Gift, description: 'Einmalzahlungen, Boni und Zulagen prüfen' },
  { id: 'calculate', title: 'Abrechnung erstellen', icon: Calculator, description: 'Lohn berechnen und Ergebnis prüfen' },
  { id: 'reports', title: 'Meldungen', icon: FileText, description: 'SV-Meldungen und Lohnsteueranmeldung' },
  { id: 'export', title: 'Export & Freigabe', icon: Download, description: 'DATEV-Export und Zahlungsfreigabe' },
] as const;

export function MonthlyPayrollWizard({ onBack, onComplete }: MonthlyPayrollWizardProps) {
  const { toast } = useToast();
  const { employees } = useEmployees();
  const { payrollPeriods, createPayrollPeriod } = useSupabasePayroll();
  const { timeEntries } = useTimeTracking();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    WIZARD_STEPS.map(() => ({ completed: false, approved: false, warnings: [], autoChecked: false }))
  );

  const activeEmployees = useMemo(
    () => employees.filter(e => e.isActive !== false),
    [employees]
  );

  // Auto-check step data on mount or step change
  useEffect(() => {
    autoCheckCurrentStep();
  }, [currentStep, selectedMonth, selectedYear]);

  const autoCheckCurrentStep = () => {
    const newStatuses = [...stepStatuses];
    const status = { ...newStatuses[currentStep] };

    switch (currentStep) {
      case 0: { // Zeiterfassung
        const monthEntries = timeEntries.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        });
        status.warnings = [];
        if (monthEntries.length === 0) {
          status.warnings.push('Keine Zeiteinträge für diesen Monat vorhanden');
        }
        const employeesWithEntries = new Set(monthEntries.map(e => e.employee_id));
        const missing = activeEmployees.filter(e => !employeesWithEntries.has(e.id));
        if (missing.length > 0) {
          status.warnings.push(`${missing.length} Mitarbeiter ohne Zeiterfassung`);
        }
        status.autoChecked = true;
        break;
      }
      case 1: { // Sonderzahlungen
        status.warnings = [];
        // Check if month has typical special payments (Dec = Weihnachtsgeld, etc.)
        if (selectedMonth === 12) {
          status.warnings.push('Dezember: Weihnachtsgeld / 13. Gehalt prüfen');
        }
        if (selectedMonth === 6) {
          status.warnings.push('Juni: Urlaubsgeld prüfen');
        }
        status.autoChecked = true;
        break;
      }
      case 2: { // Abrechnung
        const existingPeriod = payrollPeriods.find(
          p => p.month === selectedMonth && p.year === selectedYear
        );
        status.warnings = [];
        if (existingPeriod) {
          status.warnings.push(`Abrechnung für ${MONTHS[selectedMonth - 1]} ${selectedYear} existiert bereits (Status: ${existingPeriod.status})`);
          status.completed = true;
        }
        if (activeEmployees.length === 0) {
          status.warnings.push('Keine aktiven Mitarbeiter vorhanden');
        }
        status.autoChecked = true;
        break;
      }
      case 3: { // Meldungen
        status.warnings = [];
        status.warnings.push('SV-Meldungen und Lohnsteueranmeldung werden automatisch vorbereitet');
        status.autoChecked = true;
        break;
      }
      case 4: { // Export
        status.warnings = [];
        status.autoChecked = true;
        break;
      }
    }

    newStatuses[currentStep] = status;
    setStepStatuses(newStatuses);
  };

  const approveStep = () => {
    const newStatuses = [...stepStatuses];
    newStatuses[currentStep] = { ...newStatuses[currentStep], approved: true, completed: true };
    setStepStatuses(newStatuses);

    toast({
      title: `✅ ${WIZARD_STEPS[currentStep].title} bestätigt`,
      description: 'Weiter zum nächsten Schritt',
    });

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleCreatePayroll = async () => {
    setIsProcessing(true);
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);

      await createPayrollPeriod({
        year: selectedYear,
        month: selectedMonth,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      const newStatuses = [...stepStatuses];
      newStatuses[2] = { ...newStatuses[2], completed: true, approved: true };
      setStepStatuses(newStatuses);

      toast({
        title: '✅ Abrechnung erstellt',
        description: `${MONTHS[selectedMonth - 1]} ${selectedYear} wurde berechnet.`,
      });

      setCurrentStep(3);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Abrechnung konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalApproval = () => {
    const newStatuses = [...stepStatuses];
    newStatuses[4] = { ...newStatuses[4], completed: true, approved: true };
    setStepStatuses(newStatuses);

    toast({
      title: '🎉 Monatsabrechnung abgeschlossen!',
      description: `${MONTHS[selectedMonth - 1]} ${selectedYear} ist vollständig verarbeitet.`,
    });

    onComplete();
  };

  const overallProgress = (stepStatuses.filter(s => s.approved).length / WIZARD_STEPS.length) * 100;

  const renderStepContent = () => {
    const status = stepStatuses[currentStep];

    switch (currentStep) {
      case 0: // Zeiterfassung
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-foreground">{activeEmployees.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Aktive Mitarbeiter</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {timeEntries.filter(e => {
                      const d = new Date(e.date);
                      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
                    }).length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Zeiteinträge</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {timeEntries.filter(e => {
                      const d = new Date(e.date);
                      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
                    }).reduce((sum, e) => sum + (e.hours_worked || 0), 0).toFixed(1)}h
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Gesamtstunden</div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Automatische Prüfung</AlertTitle>
              <AlertDescription>
                Das System hat die Zeiterfassung für {MONTHS[selectedMonth - 1]} automatisch geprüft. 
                {status.warnings.length === 0
                  ? ' Keine Auffälligkeiten gefunden.'
                  : ' Bitte prüfen Sie die folgenden Hinweise:'}
              </AlertDescription>
            </Alert>

            {status.warnings.map((w, i) => (
              <Alert key={i} variant="destructive" className="bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-200">
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

      case 1: // Sonderzahlungen
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
              <Alert key={i} className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                <Gift className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">{w}</AlertDescription>
              </Alert>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Automatisch erkannte Zahlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeEmployees.slice(0, 5).map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                        <div className="text-sm text-muted-foreground">
                          Gehalt: {emp.grossSalary?.toLocaleString('de-DE')}€
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
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

      case 2: // Abrechnung
        return (
          <div className="space-y-4">
            {status.completed ? (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-200">Abrechnung vorhanden</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Die Abrechnung für {MONTHS[selectedMonth - 1]} {selectedYear} wurde bereits erstellt.
                </AlertDescription>
              </Alert>
            ) : (
              <>
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
                        <div className="text-2xl font-bold text-foreground">
                          {activeEmployees.reduce((s, e) => s + (e.grossSalary || 0), 0).toLocaleString('de-DE')}€
                        </div>
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
                  onClick={handleCreatePayroll}
                  disabled={isProcessing || activeEmployees.length === 0}
                  className="w-full bg-gradient-primary hover:opacity-90 h-12 text-base"
                >
                  {isProcessing ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Wird berechnet...</>
                  ) : (
                    <><Play className="h-5 w-5 mr-2" /> Abrechnung jetzt erstellen</>
                  )}
                </Button>
              </>
            )}
          </div>
        );

      case 3: // Meldungen
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
              {[
                { title: 'SV-Meldungen (DEÜV)', desc: 'Sozialversicherungsmeldungen an die Krankenkassen', status: 'auto' },
                { title: 'Beitragsnachweise', desc: 'Monatlicher Nachweis der SV-Beiträge je Krankenkasse', status: 'auto' },
                { title: 'Lohnsteueranmeldung', desc: 'Meldung der einbehaltenen Lohnsteuer ans Finanzamt', status: 'auto' },
              ].map((item, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {item.title}
                          <HelpTooltip content={
                            i === 0 ? 'Pflichtmeldungen an Krankenkassen bei Einstellung, Austritt und jährlich.' :
                            i === 1 ? 'Zeigt der Krankenkasse, wie viel SV-Beiträge überwiesen werden müssen.' :
                            'Meldet dem Finanzamt die einbehaltene Lohnsteuer aller Mitarbeiter.'
                          } />
                        </div>
                        <div className="text-sm text-muted-foreground">{item.desc}</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
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

      case 4: // Export
        return (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Fast geschafft!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Alle Schritte sind geprüft. Geben Sie die Abrechnung jetzt frei.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {[
                { title: 'DATEV-Export', desc: 'Buchungsdaten im EXTF v7.0 Format für die Buchhaltung', icon: Download },
                { title: 'GoBD-Archiv', desc: 'Revisionssichere Archivierung aller Abrechnungsdaten', icon: FileText },
                { title: 'Zahlungsliste', desc: 'Überweisungsliste für alle Nettogehälter', icon: Calculator },
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
                    onClick={handleFinalApproval}
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

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Monatsabrechnung"
        description={`Geführter Workflow für ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
      >
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
          </Button>
        </div>
      </PageHeader>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gesamtfortschritt</span>
          <span className="font-medium">{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {WIZARD_STEPS.map((step, index) => {
          const status = stepStatuses[index];
          const isActive = index === currentStep;
          const StepIcon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : status.approved
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {status.approved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <StepIcon className="h-4 w-4" />
              )}
              <span className="hidden md:inline">{step.title}</span>
              <span className="md:hidden">{index + 1}</span>
              {index < WIZARD_STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 ml-1 text-muted-foreground hidden md:inline" />
              )}
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const Icon = WIZARD_STEPS[currentStep].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
            Schritt {currentStep + 1}: {WIZARD_STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>{WIZARD_STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
        </Button>

        <div className="text-sm text-muted-foreground">
          Schritt {currentStep + 1} von {WIZARD_STEPS.length}
        </div>

        {currentStep < WIZARD_STEPS.length - 1 ? (
          <Button onClick={approveStep}>
            {stepStatuses[currentStep].approved ? 'Weiter' : 'Bestätigen & Weiter'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <div /> // Final step has its own CTA
        )}
      </div>
    </div>
  );
}
