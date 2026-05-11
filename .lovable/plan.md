## Ziel

`src/components/payroll/monthly-payroll-wizard.tsx` (1288 Zeilen) in fokussierte Hooks (Logik) und kleine Step-Komponenten (UI) aufteilen. Verhalten bleibt 1:1 identisch — nur Struktur ändert sich. Öffentliche API der Komponente (`MonthlyPayrollWizard({ onBack, onComplete })`) bleibt unverändert, damit `Payroll.tsx` nicht angefasst werden muss.

## Zielstruktur

```text
src/components/payroll/wizard/
  monthly-payroll-wizard.tsx        (Container, ~150 Z., orchestriert Hooks + Steps)
  types.ts                          (StepStatus, WIZARD_STEPS, MONTHS, Props)
  hooks/
    use-wizard-state.ts             (Monat/Jahr, currentStep, stepStatuses, autoCheck)
    use-step-validation.ts          (checkStep-Logik je Step)
    use-working-data-builder.ts     (buildWorkingDataFromTimeEntries)
    use-payroll-runner.ts           (calculateAndPersistEntries, PreFlight, addToHistory, Audit)
    use-auto-run.ts                 (Auto-Run-Loop, Pause/Resume, Log)
  steps/
    step-time-tracking.tsx          (Step 0)
    step-special-payments.tsx       (Step 1)
    step-payroll.tsx                (Step 2)
    step-meldungen.tsx              (Step 3)
    step-export.tsx                 (Step 4)
    step-shell.tsx                  (gemeinsamer Header/Warnings/Footer-Buttons)
  components/
    wizard-progress.tsx             (Stepper oben)
    auto-run-panel.tsx              (Auto-Run-Status + Log)
    period-picker.tsx               (Monat/Jahr-Auswahl)
```

Die alte Datei `src/components/payroll/monthly-payroll-wizard.tsx` wird zur dünnen Re-Export-Hülle:
```ts
export { MonthlyPayrollWizard } from './wizard/monthly-payroll-wizard';
```

## Vorgehen (Reihenfolge der PRs in einer Session)

1. **types.ts** anlegen — `StepStatus`, `WIZARD_STEPS`, `MONTHS`, `MonthlyPayrollWizardProps` aus dem Original kopieren.
2. **Hooks extrahieren** — pure Logik 1:1 übernehmen, klare Inputs/Outputs, keine Verhaltensänderung. Reihenfolge: `use-step-validation` → `use-working-data-builder` → `use-payroll-runner` → `use-auto-run` → `use-wizard-state`.
3. **Step-Komponenten** — JSX je Step in eigene Datei verschieben; Props nur das, was der Step braucht (`status`, Callbacks, Period).
4. **Container neu schreiben** — `<WizardProgress />`, `<PeriodPicker />`, `<AutoRunPanel />`, dynamisch der aktuelle Step. Hooks zusammenführen.
5. **Re-Export-Shim** an alter Pfadstelle.
6. **Smoke-Check** — `bunx vitest run` für betroffene Tests; Preview öffnen, Wizard-Flow durchklicken (Schritt 0 → 4, Auto-Run start/pause).

## Technische Details

- Keine Logik-Änderung, kein State-Schema-Change, keine DB-Migration. Nur Datei-Splitting + Hook-Extraktion.
- `useRef` für `autoRunRef` bleibt im `use-auto-run`-Hook.
- `usePayrollGuardian`, `useSupabasePayroll`, `useTimeTracking`, `useEmployees`, `useTenantEmployeeWageTypes` werden im Container instanziiert und an Hooks per Argument übergeben — kein versteckter Context, einfacher zu testen.
- `PreFlightCheckDialog` bleibt im Container, da modal-übergreifend.
- Keine Änderung an `payroll-calculator`, Audit-Trail, GoBD, ELStAM.
- Logger-Imports werden mitgenommen.

## Risiken & Gegenmaßnahmen

- **Re-Render-Verhalten** könnte sich durch Hook-Splitting minimal ändern → `useCallback`/`useMemo`-Dependencies sorgfältig spiegeln, identische Deps wie im Original.
- **Auto-Run-Loop** ist zustandsabhängig (Ref + State) → in einem Hook bündeln, nicht aufteilen.
- **Tests**: Bestehende Wizard-Tests (falls vorhanden) müssen weiter grün sein; ggf. Imports auf neuen Pfad anpassen (durch Shim sollte das nicht nötig sein).

## Nicht im Scope

- Refactor der unterliegenden Hooks (`use-supabase-payroll` etc.)
- Bugfix für „Critical Bug: Wizard persistiert nicht beim Abschluss" — separate Task.
- Visuelle Änderungen / neues UI.
