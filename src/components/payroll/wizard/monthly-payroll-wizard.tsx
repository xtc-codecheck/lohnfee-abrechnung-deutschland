/**
 * Monatlicher Abrechnungs-Wizard – Container
 *
 * Logik in Hooks: useStepValidation, useWorkingDataBuilder, usePayrollRunner.
 * UI je Schritt in wizard-steps.tsx.
 * Auto-Run-Engine bleibt im Container (Ref + State sind eng gekoppelt).
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, FastForward,
  Loader2, AlertTriangle, OctagonX, Pause, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { useEmployees } from '@/contexts/employee-context';
import { useSupabasePayroll } from '@/hooks/use-supabase-payroll';
import { useTenantEmployeeWageTypes } from '@/hooks/use-tenant-employee-wage-types';
import { useTimeTracking } from '@/hooks/use-time-tracking';
import { usePayrollGuardian } from '@/hooks/use-payroll-guardian';
import { calculatePayrollEntry, PayrollCalculationInput } from '@/utils/payroll-calculator';
import { PayrollEntry } from '@/types/payroll';
import { logger } from '@/lib/logger';
import { PreFlightCheckDialog } from '../preflight-check-dialog';

import {
  MONTHS, WIZARD_STEPS, StepStatus, MonthlyPayrollWizardProps, newStepStatus,
} from './types';
import { useStepValidation } from './use-step-validation';
import { useWorkingDataBuilder } from './use-working-data-builder';
import { usePayrollRunner } from './use-payroll-runner';
import {
  StepTimeTracking, StepSpecialPayments, StepPayroll, StepReports, StepExport,
} from './wizard-steps';

export function MonthlyPayrollWizard({ onBack, onComplete }: MonthlyPayrollWizardProps) {
  const { toast } = useToast();
  const { employees } = useEmployees();
  const {
    payrollPeriods, payrollEntries, createPayrollPeriod,
    addPayrollEntries, updatePayrollPeriodStatus,
  } = useSupabasePayroll();
  const { byEmployee: wageTypesByEmployee } = useTenantEmployeeWageTypes();
  const { timeEntries } = useTimeTracking();
  const { historicalData, addToHistory } = usePayrollGuardian();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRunActive, setAutoRunActive] = useState(false);
  const [autoRunPaused, setAutoRunPaused] = useState(false);
  const [autoRunLog, setAutoRunLog] = useState<string[]>([]);
  const autoRunRef = useRef(false);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [pendingEntries, setPendingEntries] = useState<PayrollEntry[]>([]);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    WIZARD_STEPS.map(() => newStepStatus())
  );

  const activeEmployees = useMemo(
    () => employees.filter(e => !e.employmentData?.endDate || new Date(e.employmentData.endDate) > new Date()),
    [employees]
  );

  const checkStep = useStepValidation(timeEntries, selectedMonth, selectedYear, activeEmployees, payrollPeriods);
  const buildWorkingDataFromTimeEntries = useWorkingDataBuilder(timeEntries, selectedMonth, selectedYear, activeEmployees);
  const { ensurePayrollPeriod, calculateAndPersistEntries } = usePayrollRunner({
    activeEmployees, selectedYear, selectedMonth,
    payrollPeriods, wageTypesByEmployee,
    buildWorkingDataFromTimeEntries,
    createPayrollPeriod, addPayrollEntries, addToHistory,
  });

  const autoCheckCurrentStep = useCallback(() => {
    setStepStatuses(prev => {
      const next = [...prev];
      const checked = checkStep(currentStep);
      checked.approved = next[currentStep].approved;
      checked.completed = next[currentStep].completed || checked.completed;
      next[currentStep] = checked;
      return next;
    });
  }, [currentStep, checkStep]);

  useEffect(() => {
    autoCheckCurrentStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedMonth, selectedYear]);

  // ─── Auto-Run Engine (Container-intern, Ref-basiert) ──────────────
  const runAuto = useCallback(async (fromStep: number) => {
    setAutoRunActive(true);
    setAutoRunPaused(false);
    autoRunRef.current = true;
    if (fromStep === 0) setAutoRunLog([]);

    const log = (msg: string) => setAutoRunLog(prev => [...prev, `${new Date().toLocaleTimeString('de-DE')} – ${msg}`]);
    const statuses: StepStatus[] = fromStep === 0
      ? WIZARD_STEPS.map(() => ({ ...newStepStatus(), autoChecked: true }))
      : [...stepStatuses];

    for (let step = fromStep; step < WIZARD_STEPS.length; step++) {
      if (!autoRunRef.current) {
        log('⏹ Auto-Run abgebrochen');
        break;
      }

      setCurrentStep(step);
      log(`🔍 Schritt ${step + 1}: ${WIZARD_STEPS[step].title} wird geprüft...`);
      await new Promise(r => setTimeout(r, 800));

      const checked = checkStep(step);

      if (checked.criticalWarnings.length > 0) {
        statuses[step] = checked;
        setStepStatuses([...statuses]);
        setAutoRunPaused(true);
        log(`⚠️ Schritt ${step + 1}: ${checked.criticalWarnings.length} Auffälligkeit(en) – Bestätigung erforderlich`);
        checked.criticalWarnings.forEach(w => log(`   → ${w}`));
        autoRunRef.current = false;
        setAutoRunActive(false);
        return;
      }

      if (step === 2 && !checked.completed) {
        log('📊 Abrechnung wird erstellt...');
        try {
          if (activeEmployees.length === 0) {
            log('⏹ Keine aktiven Mitarbeiter – Abrechnung übersprungen');
            checked.criticalWarnings.push('Keine aktiven Mitarbeiter vorhanden');
            statuses[step] = checked;
            setStepStatuses([...statuses]);
            setAutoRunPaused(true);
            autoRunRef.current = false;
            setAutoRunActive(false);
            return;
          }
          const period = await ensurePayrollPeriod();
          if (period) {
            log('📊 Abrechnungen werden berechnet und gespeichert...');
            const { saved, skipped, failed } = await calculateAndPersistEntries(period.id);
            log(`✅ ${saved}/${activeEmployees.length} Abrechnungen gespeichert${skipped ? ` (${skipped} bereits vorhanden – übersprungen)` : ''}`);
            if (failed.length > 0) {
              log(`❌ ${failed.length} Abrechnungen fehlgeschlagen: ${failed.join(', ')}`);
              checked.criticalWarnings.push(`${failed.length} Lohnabrechnungen wurden NICHT gespeichert. Bitte prüfen!`);
              statuses[step] = checked;
              setStepStatuses([...statuses]);
              setAutoRunPaused(true);
              autoRunRef.current = false;
              setAutoRunActive(false);
              return;
            }
            try {
              await updatePayrollPeriodStatus(period.id, 'calculated');
              log('✅ Periode als "calculated" markiert');
            } catch (statusErr) {
              logger.error('monthly-payroll-wizard', '[payroll-persist] Status-Update fehlgeschlagen:', statusErr);
              log('⚠️ Periodenstatus konnte nicht aktualisiert werden (Daten sind aber gespeichert)');
            }
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
  }, [checkStep, ensurePayrollPeriod, calculateAndPersistEntries, updatePayrollPeriodStatus, activeEmployees.length, stepStatuses]);

  const startAutoRun = useCallback(() => { void runAuto(0); }, [runAuto]);
  const stopAutoRun = useCallback(() => {
    autoRunRef.current = false;
    setAutoRunActive(false);
    setAutoRunPaused(false);
  }, []);
  const resumeAutoRun = useCallback(() => {
    setStepStatuses(prev => {
      const next = [...prev];
      next[currentStep] = { ...next[currentStep], approved: true, completed: true, criticalWarnings: [] };
      return next;
    });
    if (currentStep < WIZARD_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeout(() => { void runAuto(nextStep); }, 300);
    }
  }, [currentStep, runAuto]);

  // ─── Manueller Pfad ──────────────────────────────────────────────
  const approveStep = () => {
    setStepStatuses(prev => {
      const next = [...prev];
      next[currentStep] = { ...next[currentStep], approved: true, completed: true };
      return next;
    });
    toast({ title: `✅ ${WIZARD_STEPS[currentStep].title} bestätigt`, description: 'Weiter zum nächsten Schritt' });
    if (currentStep < WIZARD_STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handleCreatePayroll = async () => {
    setIsProcessing(true);
    try {
      if (activeEmployees.length === 0) {
        toast({ title: 'Keine aktiven Mitarbeiter', description: 'Es gibt keine Mitarbeiter, für die eine Abrechnung erstellt werden könnte.', variant: 'destructive' });
        return;
      }

      const calculated: PayrollEntry[] = [];
      for (const emp of activeEmployees) {
        try {
          const workingData = buildWorkingDataFromTimeEntries(emp.id);
          const input: PayrollCalculationInput = {
            employee: emp,
            period: { year: selectedYear, month: selectedMonth },
            workingData,
            employeeWageTypes: wageTypesByEmployee.get(emp.id),
          };
          const result = calculatePayrollEntry(input);
          calculated.push({
            ...result.entry, id: '', payrollPeriodId: '',
            createdAt: new Date(), updatedAt: new Date(),
          } as PayrollEntry);
        } catch (err) {
          logger.error('monthly-payroll-wizard', `Fehler bei ${emp.personalData.firstName} ${emp.personalData.lastName}:`, err);
        }
      }

      if (calculated.length === 0) {
        toast({ title: 'Keine Abrechnungen erzeugt', description: 'Es konnten keine Abrechnungen berechnet werden. Prüfen Sie die Mitarbeiter-Stammdaten.', variant: 'destructive' });
        return;
      }

      setPendingEntries(calculated);
      setPreflightOpen(true);
    } catch {
      toast({ title: 'Fehler', description: 'Abrechnung konnte nicht vorbereitet werden.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (pendingEntries.length === 0) return;
    try {
      const period = await ensurePayrollPeriod();
      if (!period) {
        toast({ title: 'Periode konnte nicht angelegt werden', description: 'Bitte erneut versuchen.', variant: 'destructive' });
        return;
      }

      const entriesWithPeriod = pendingEntries.map(e => ({ ...e, payrollPeriodId: period.id }));
      const { saved: savedEntries, failed: failedRows } = await addPayrollEntries(entriesWithPeriod);
      const saved = savedEntries.length;
      const failed = failedRows.map(f => {
        const emp = activeEmployees.find(e => e.id === f.employeeId);
        return emp ? `${emp.personalData.firstName} ${emp.personalData.lastName}` : f.employeeId;
      });
      void Promise.allSettled(savedEntries.map(p => addToHistory(p)));

      if (failed.length > 0) {
        toast({
          title: `⚠️ Nur ${saved} von ${pendingEntries.length} gespeichert`,
          description: `Fehlgeschlagen: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '…' : ''}. Bitte erneut versuchen.`,
          variant: 'destructive',
        });
        return;
      }

      await updatePayrollPeriodStatus(period.id, 'calculated');

      setStepStatuses(prev => {
        const next = [...prev];
        next[2] = { ...next[2], completed: true, approved: true };
        return next;
      });

      toast({
        title: '✅ Abrechnung gespeichert',
        description: `${saved} von ${activeEmployees.length} Mitarbeitern berechnet und gespeichert.`,
      });

      setPendingEntries([]);
      setCurrentStep(3);
    } catch {
      toast({ title: 'Fehler beim Speichern', description: 'Die Lohnabrechnungen konnten nicht gespeichert werden.', variant: 'destructive' });
    }
  };

  const handleFinalApproval = () => {
    setStepStatuses(prev => {
      const next = [...prev];
      next[4] = { ...next[4], completed: true, approved: true };
      return next;
    });
    toast({
      title: '🎉 Monatsabrechnung abgeschlossen!',
      description: `${MONTHS[selectedMonth - 1]} ${selectedYear} ist vollständig verarbeitet.`,
    });
    onComplete();
  };

  const overallProgress = (stepStatuses.filter(s => s.approved).length / WIZARD_STEPS.length) * 100;

  const renderStepContent = () => {
    const status = stepStatuses[currentStep];
    const common = { status, selectedMonth, selectedYear, activeEmployees };
    switch (currentStep) {
      case 0: return <StepTimeTracking {...common} timeEntries={timeEntries} />;
      case 1: return <StepSpecialPayments {...common} />;
      case 2: return <StepPayroll {...common} isProcessing={isProcessing} onCreate={handleCreatePayroll} />;
      case 3: return <StepReports selectedMonth={selectedMonth} selectedYear={selectedYear} />;
      case 4: return (
        <StepExport
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          activeEmployees={activeEmployees}
          payrollEntries={payrollEntries}
          payrollPeriods={payrollPeriods}
          onFinalApproval={handleFinalApproval}
        />
      );
      default: return null;
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
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={autoRunActive}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
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

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gesamtfortschritt</span>
          <span className="font-medium">{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

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
        <Alert className="border-warning/30 bg-warning/10 dark:bg-warning/20 dark:border-warning">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning dark:text-warning/70">Auto-Run pausiert – Ihre Aufmerksamkeit ist nötig</AlertTitle>
          <AlertDescription className="text-warning dark:text-warning/70">
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
                  ? 'bg-success/10 text-success dark:bg-success/30 dark:text-success/70'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {status.approved ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              <span className="hidden md:inline">{step.title}</span>
              <span className="md:hidden">{index + 1}</span>
              {index < WIZARD_STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 ml-1 text-muted-foreground hidden md:inline" />
              )}
            </button>
          );
        })}
      </div>

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
          <div />
        )}
      </div>

      <PreFlightCheckDialog
        open={preflightOpen}
        onOpenChange={setPreflightOpen}
        employees={activeEmployees}
        entries={pendingEntries}
        history={historicalData}
        confirmLabel="Trotzdem speichern"
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}
