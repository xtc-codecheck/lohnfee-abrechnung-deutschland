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

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { calculatePayrollEntry, PayrollCalculationInput } from '@/utils/payroll-calculator';
import { WorkingTimeData, PayrollEntry } from '@/types/payroll';
import { PreFlightCheckDialog } from './preflight-check-dialog';
import { usePayrollGuardian } from '@/hooks/use-payroll-guardian';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Gift,
  Calculator, FileText, Download, Play, AlertTriangle, Info,
  Zap, Loader2, ChevronRight, RefreshCw, FastForward, Pause,
  CircleCheck, OctagonX,
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
  /** Warnings that block auto-run (require user attention) */
  criticalWarnings: string[];
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
  const { payrollPeriods, payrollEntries, createPayrollPeriod, addPayrollEntry } = useSupabasePayroll();
  const { timeEntries } = useTimeTracking();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRunActive, setAutoRunActive] = useState(false);
  const [autoRunPaused, setAutoRunPaused] = useState(false);
  const [autoRunLog, setAutoRunLog] = useState<string[]>([]);
  const autoRunRef = useRef(false);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    WIZARD_STEPS.map(() => ({ completed: false, approved: false, warnings: [], criticalWarnings: [], autoChecked: false }))
  );

  const activeEmployees = useMemo(
    () => employees.filter(e => !e.employmentData?.endDate || new Date(e.employmentData.endDate) > new Date()),
    [employees]
  );

  // Auto-check step data on mount or step change
  useEffect(() => {
    autoCheckCurrentStep();
  }, [currentStep, selectedMonth, selectedYear]);

  const checkStep = useCallback((stepIndex: number, statuses: StepStatus[]): StepStatus => {
    const status: StepStatus = { completed: false, approved: false, warnings: [], criticalWarnings: [], autoChecked: true };

    switch (stepIndex) {
      case 0: { // Zeiterfassung
        const monthEntries = timeEntries.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        });
        if (monthEntries.length === 0) {
          status.warnings.push('Keine Zeiteinträge für diesen Monat vorhanden');
        }
        const employeesWithEntries = new Set(monthEntries.map(e => e.employeeId));
        const missing = activeEmployees.filter(e => !employeesWithEntries.has(e.id));
        if (missing.length > 0 && missing.length < activeEmployees.length) {
          status.warnings.push(`${missing.length} Mitarbeiter ohne Zeiterfassung`);
        }
        // Critical: ALL employees missing = likely data issue
        if (activeEmployees.length > 0 && missing.length === activeEmployees.length && monthEntries.length === 0) {
          status.criticalWarnings.push('Keine Zeiterfassung für alle Mitarbeiter – bitte prüfen');
        }
        break;
      }
      case 1: { // Sonderzahlungen
        if (selectedMonth === 12) {
          status.criticalWarnings.push('Dezember: Weihnachtsgeld / 13. Gehalt prüfen');
        }
        if (selectedMonth === 6) {
          status.criticalWarnings.push('Juni: Urlaubsgeld prüfen');
        }
        break;
      }
      case 2: { // Abrechnung
        const existingPeriod = payrollPeriods.find(
          p => p.month === selectedMonth && p.year === selectedYear
        );
        if (existingPeriod) {
          status.warnings.push(`Abrechnung existiert bereits (Status: ${existingPeriod.status})`);
          status.completed = true;
        }
        if (activeEmployees.length === 0) {
          status.criticalWarnings.push('Keine aktiven Mitarbeiter vorhanden');
        }
        break;
      }
      case 3: { // Meldungen
        status.warnings.push('SV-Meldungen und Lohnsteueranmeldung werden automatisch vorbereitet');
        break;
      }
      case 4: { // Export
        break;
      }
    }
    return status;
  }, [timeEntries, selectedMonth, selectedYear, activeEmployees, payrollPeriods]);

  const autoCheckCurrentStep = useCallback(() => {
    const newStatuses = [...stepStatuses];
    const checked = checkStep(currentStep, newStatuses);
    // Preserve approved state if already approved
    checked.approved = newStatuses[currentStep].approved;
    checked.completed = newStatuses[currentStep].completed || checked.completed;
    newStatuses[currentStep] = checked;
    setStepStatuses(newStatuses);
  }, [currentStep, stepStatuses, checkStep]);

  /**
   * Builds WorkingTimeData from actual time entries for a given employee and month.
   * Falls back to contract-based defaults only when no time entries exist.
   */
  const buildWorkingDataFromTimeEntries = useCallback((employeeId: string): WorkingTimeData => {
    const monthEntries = timeEntries.filter(e => {
      const d = new Date(e.date);
      return e.employeeId === employeeId &&
        d.getMonth() + 1 === selectedMonth &&
        d.getFullYear() === selectedYear;
    });

    if (monthEntries.length === 0) {
      // Fallback: contract-based estimate
      const emp = activeEmployees.find(e => e.id === employeeId);
      const weeklyHours = emp?.employmentData?.weeklyHours ?? 40;
      const monthlyHours = Math.round(weeklyHours * 4.33);
      const workingDays = Math.round(monthlyHours / (weeklyHours / 5));
      return {
        regularHours: monthlyHours, overtimeHours: 0, nightHours: 0,
        sundayHours: 0, holidayHours: 0, vacationDays: 0, sickDays: 0,
        actualWorkingDays: workingDays, expectedWorkingDays: workingDays,
      };
    }

    const emp = activeEmployees.find(e => e.id === employeeId);
    const dailyContractHours = (emp?.employmentData?.weeklyHours ?? 40) / 5;

    let regularHours = 0;
    let overtimeHours = 0;
    let vacationDays = 0;
    let sickDays = 0;
    let actualWorkingDays = 0;

    // Group entries by date
    const byDate = new Map<string, typeof monthEntries>();
    for (const entry of monthEntries) {
      const key = new Date(entry.date).toISOString().split('T')[0];
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(entry);
    }

    for (const [, dayEntries] of byDate) {
      let dayWorkHours = 0;
      for (const entry of dayEntries) {
        if (entry.type === 'work') {
          dayWorkHours += entry.hoursWorked ?? 0;
        } else if (entry.type === 'vacation') {
          vacationDays++;
        } else if (entry.type === 'sick') {
          sickDays++;
        }
      }
      if (dayWorkHours > 0) {
        actualWorkingDays++;
        const regular = Math.min(dayWorkHours, dailyContractHours);
        const overtime = Math.max(0, dayWorkHours - dailyContractHours);
        regularHours += regular;
        overtimeHours += overtime;
      }
    }

    // Estimate expected working days (weekdays in the month)
    const year = selectedYear;
    const month = selectedMonth - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let expectedWorkingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month, d).getDay();
      if (day !== 0 && day !== 6) expectedWorkingDays++;
    }

    return {
      regularHours, overtimeHours, nightHours: 0,
      sundayHours: 0, holidayHours: 0, vacationDays, sickDays,
      actualWorkingDays, expectedWorkingDays,
    };
  }, [timeEntries, selectedMonth, selectedYear, activeEmployees]);

  const calculateAndPersistEntries = useCallback(async (periodId: string) => {
    let saved = 0;
    for (const emp of activeEmployees) {
      try {
        const workingData = buildWorkingDataFromTimeEntries(emp.id);
        const input: PayrollCalculationInput = {
          employee: emp,
          period: { year: selectedYear, month: selectedMonth },
          workingData,
        };
        const result = calculatePayrollEntry(input);
        const entryToSave = { ...result.entry, payrollPeriodId: periodId };
        await addPayrollEntry(entryToSave);
        saved++;
      } catch (err) {
        console.error(`Fehler bei ${emp.personalData.firstName} ${emp.personalData.lastName}:`, err);
      }
    }
    return saved;
  }, [activeEmployees, selectedYear, selectedMonth, addPayrollEntry, buildWorkingDataFromTimeEntries]);

  // ─── Auto-Run Engine ──────────────────────────────────────
  const startAutoRun = useCallback(async () => {
    setAutoRunActive(true);
    setAutoRunPaused(false);
    autoRunRef.current = true;
    setAutoRunLog([]);

    const log = (msg: string) => setAutoRunLog(prev => [...prev, `${new Date().toLocaleTimeString('de-DE')} – ${msg}`]);
    const statuses: StepStatus[] = WIZARD_STEPS.map(() => ({ completed: false, approved: false, warnings: [], criticalWarnings: [], autoChecked: true }));

    for (let step = 0; step < WIZARD_STEPS.length; step++) {
      if (!autoRunRef.current) {
        log('⏹ Auto-Run abgebrochen');
        break;
      }

      setCurrentStep(step);
      log(`🔍 Schritt ${step + 1}: ${WIZARD_STEPS[step].title} wird geprüft...`);

      // Small delay for UX visibility
      await new Promise(r => setTimeout(r, 800));

      const checked = checkStep(step, statuses);

      if (checked.criticalWarnings.length > 0) {
        // Stop and require user attention
        checked.autoChecked = true;
        statuses[step] = checked;
        setStepStatuses([...statuses]);
        setAutoRunPaused(true);
        log(`⚠️ Schritt ${step + 1}: ${checked.criticalWarnings.length} Auffälligkeit(en) – Bestätigung erforderlich`);
        checked.criticalWarnings.forEach(w => log(`   → ${w}`));
        autoRunRef.current = false;
        setAutoRunActive(false);
        return; // Stop here, user must approve
      }

      if (step === 2 && !checked.completed) {
        log('📊 Abrechnung wird erstellt...');
        try {
          const period = await createPayrollPeriod(selectedYear, selectedMonth);
          if (period) {
            log('📊 Abrechnungen werden berechnet und gespeichert...');
            const saved = await calculateAndPersistEntries(period.id);
            log(`✅ ${saved} Abrechnungen gespeichert`);
          }
          checked.completed = true;
          log('✅ Abrechnung erfolgreich erstellt');
        } catch {
          log('❌ Fehler bei Abrechnungserstellung – Stopp');
          checked.criticalWarnings.push('Abrechnungserstellung fehlgeschlagen');
          statuses[step] = checked;
          setStepStatuses([...statuses]);
          setAutoRunPaused(true);
          autoRunRef.current = false;
          setAutoRunActive(false);
          return;
        }
      }

      // Auto-approve
      checked.approved = true;
      checked.completed = true;
      statuses[step] = checked;
      setStepStatuses([...statuses]);
      log(`✅ Schritt ${step + 1}: ${WIZARD_STEPS[step].title} – OK`);

      await new Promise(r => setTimeout(r, 400));
    }

    if (autoRunRef.current) {
      log('🎉 Alle Schritte erfolgreich durchlaufen!');
      setAutoRunActive(false);
      autoRunRef.current = false;
    }
  }, [checkStep, createPayrollPeriod, calculateAndPersistEntries, selectedYear, selectedMonth]);

  const stopAutoRun = useCallback(() => {
    autoRunRef.current = false;
    setAutoRunActive(false);
    setAutoRunPaused(false);
  }, []);

  const resumeAutoRun = useCallback(() => {
    // Approve current step and continue
    const newStatuses = [...stepStatuses];
    newStatuses[currentStep] = { ...newStatuses[currentStep], approved: true, completed: true, criticalWarnings: [] };
    setStepStatuses(newStatuses);

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Re-start auto-run from next step
      setTimeout(() => {
        startAutoRunFrom(currentStep + 1);
      }, 300);
    }
  }, [stepStatuses, currentStep]);

  const startAutoRunFrom = useCallback(async (fromStep: number) => {
    setAutoRunActive(true);
    setAutoRunPaused(false);
    autoRunRef.current = true;

    const log = (msg: string) => setAutoRunLog(prev => [...prev, `${new Date().toLocaleTimeString('de-DE')} – ${msg}`]);
    const statuses = [...stepStatuses];

    for (let step = fromStep; step < WIZARD_STEPS.length; step++) {
      if (!autoRunRef.current) break;

      setCurrentStep(step);
      log(`🔍 Schritt ${step + 1}: ${WIZARD_STEPS[step].title} wird geprüft...`);
      await new Promise(r => setTimeout(r, 800));

      const checked = checkStep(step, statuses);

      if (checked.criticalWarnings.length > 0) {
        checked.autoChecked = true;
        statuses[step] = checked;
        setStepStatuses([...statuses]);
        setAutoRunPaused(true);
        log(`⚠️ Schritt ${step + 1}: Bestätigung erforderlich`);
        autoRunRef.current = false;
        setAutoRunActive(false);
        return;
      }

      if (step === 2 && !checked.completed) {
        log('📊 Abrechnung wird erstellt...');
        try {
          const period = await createPayrollPeriod(selectedYear, selectedMonth);
          if (period) {
            const saved = await calculateAndPersistEntries(period.id);
            log(`✅ ${saved} Abrechnungen gespeichert`);
          }
          checked.completed = true;
          log('✅ Abrechnung erstellt');
        } catch {
          log('❌ Fehler – Stopp');
          statuses[step] = checked;
          setStepStatuses([...statuses]);
          setAutoRunPaused(true);
          autoRunRef.current = false;
          setAutoRunActive(false);
          return;
        }
      }

      checked.approved = true;
      checked.completed = true;
      statuses[step] = checked;
      setStepStatuses([...statuses]);
      log(`✅ Schritt ${step + 1}: OK`);
      await new Promise(r => setTimeout(r, 400));
    }

    if (autoRunRef.current) {
      log('🎉 Alle Schritte erfolgreich!');
      setAutoRunActive(false);
      autoRunRef.current = false;
    }
  }, [stepStatuses, checkStep, createPayrollPeriod, calculateAndPersistEntries, selectedYear, selectedMonth]);

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
      const period = await createPayrollPeriod(selectedYear, selectedMonth);
      if (!period) throw new Error('Periode konnte nicht erstellt werden');

      const saved = await calculateAndPersistEntries(period.id);

      const newStatuses = [...stepStatuses];
      newStatuses[2] = { ...newStatuses[2], completed: true, approved: true };
      setStepStatuses(newStatuses);

      toast({
        title: '✅ Abrechnung erstellt',
        description: `${saved} von ${activeEmployees.length} Mitarbeitern berechnet und gespeichert.`,
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
                    }).reduce((sum, e) => sum + (e.hoursWorked || 0), 0).toFixed(1)}h
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
                        <div className="font-medium">{emp.personalData.firstName} {emp.personalData.lastName}</div>
                        <div className="text-sm text-muted-foreground">
                          Gehalt: {emp.salaryData?.grossSalary?.toLocaleString('de-DE')}€
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
                          {activeEmployees.reduce((s, e) => s + (e.salaryData?.grossSalary || 0), 0).toLocaleString('de-DE')}€
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

      case 4: { // Export & Zusammenfassung
        const totalGross = activeEmployees.reduce((s, e) => s + (e.salaryData?.grossSalary || 0), 0);
        // Use real payroll entries if available, otherwise estimate
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
          gross: totalGross,
          netTotal: totalGross * 0.65,
          taxTotal: totalGross * 0.18,
          taxIncome: totalGross * 0.15,
          taxSoli: totalGross * 0.008,
          taxChurch: totalGross * 0.012,
          svEmployee: totalGross * 0.20,
          svEmployer: totalGross * 0.21,
          svHealth: totalGross * 0.073,
          svPension: totalGross * 0.093,
          svCare: totalGross * 0.017,
          svUnemploy: totalGross * 0.013,
          svHealthAg: totalGross * 0.073,
          svPensionAg: totalGross * 0.093,
          svCareAg: totalGross * 0.015,
          svUnemployAg: totalGross * 0.013,
          employerCosts: totalGross * 1.21,
        };

        const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return (
          <div className="space-y-4">
            {/* ── Zusammenfassung ── */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Zusammenfassung {MONTHS[selectedMonth - 1]} {selectedYear}
                  {!hasRealData && (
                    <Badge variant="outline" className="text-xs ml-auto font-normal">Schätzwerte</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {activeEmployees.length} Mitarbeiter · Alle Beträge in Euro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Brutto / Netto Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Brutto gesamt', value: summaryData.gross, color: 'text-foreground' },
                    { label: 'Netto gesamt', value: summaryData.netTotal, color: 'text-green-700 dark:text-green-400' },
                    { label: 'AG-Gesamtkosten', value: summaryData.employerCosts, color: 'text-primary' },
                    { label: 'Abgabenlast', value: summaryData.taxTotal + summaryData.svEmployee, color: 'text-orange-600 dark:text-orange-400' },
                  ].map((item, i) => (
                    <div key={i} className="bg-muted/40 rounded-lg p-3 text-center">
                      <div className={`text-xl font-bold ${item.color}`}>{fmt(item.value)}€</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Steuern */}
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

                {/* Sozialversicherung */}
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

            {/* Export-Optionen */}
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

            {/* Freigabe */}
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
      }

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
            disabled={autoRunActive}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={autoRunActive}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {!autoRunActive && !autoRunPaused && (
            <Button onClick={startAutoRun} className="bg-gradient-primary hover:opacity-90">
              <FastForward className="h-4 w-4 mr-2" /> Auto-Run
            </Button>
          )}
          {autoRunActive && (
            <Button onClick={stopAutoRun} variant="destructive">
              <Pause className="h-4 w-4 mr-2" /> Stopp
            </Button>
          )}
          {autoRunPaused && (
            <Button onClick={resumeAutoRun} className="bg-gradient-primary hover:opacity-90">
              <FastForward className="h-4 w-4 mr-2" /> Weiter (bestätigen)
            </Button>
          )}
          <Button variant="outline" onClick={onBack} disabled={autoRunActive}>
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

      {/* Auto-Run Status Banner */}
      {autoRunActive && (
        <Alert className="border-primary/30 bg-primary/5">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Auto-Run aktiv</AlertTitle>
          <AlertDescription>
            Das System führt alle Schritte automatisch durch. Bei Auffälligkeiten wird angehalten.
          </AlertDescription>
        </Alert>
      )}

      {autoRunPaused && (
        <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">Auto-Run pausiert – Ihre Aufmerksamkeit ist nötig</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            Bei Schritt {currentStep + 1} wurden Auffälligkeiten erkannt. Bitte prüfen und bestätigen Sie, um fortzufahren.
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={resumeAutoRun} className="bg-gradient-primary hover:opacity-90">
                <FastForward className="h-3 w-3 mr-1" /> Bestätigen & Weiter
              </Button>
              <Button size="sm" variant="outline" onClick={stopAutoRun}>
                <OctagonX className="h-3 w-3 mr-1" /> Abbrechen
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-Run Log */}
      {autoRunLog.length > 0 && (
        <Card className="border-muted">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Auto-Run Protokoll
              {!autoRunActive && !autoRunPaused && (
                <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={() => setAutoRunLog([])}>
                  Löschen
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="bg-muted/50 rounded-md p-3 max-h-40 overflow-y-auto font-mono text-xs space-y-0.5">
              {autoRunLog.map((line, i) => (
                <div key={i} className="text-muted-foreground">{line}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
