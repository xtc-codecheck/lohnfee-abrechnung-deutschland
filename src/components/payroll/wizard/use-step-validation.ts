import { useCallback } from 'react';
import { Employee } from '@/types/employee';
import { TimeEntry } from '@/types/time-tracking';
import { PayrollPeriod } from '@/types/payroll';
import { StepStatus } from './types';

/**
 * Erzeugt für einen gegebenen Schritt-Index den autoChecked-StepStatus.
 * Pure Funktion (ohne Seiteneffekte). Logik 1:1 aus monthly-payroll-wizard.tsx.
 */
export function useStepValidation(
  timeEntries: TimeEntry[],
  selectedMonth: number,
  selectedYear: number,
  activeEmployees: Employee[],
  payrollPeriods: PayrollPeriod[],
) {
  return useCallback((stepIndex: number): StepStatus => {
    const status: StepStatus = {
      completed: false, approved: false, warnings: [], criticalWarnings: [], autoChecked: true,
    };

    switch (stepIndex) {
      case 0: {
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
        if (activeEmployees.length > 0 && missing.length === activeEmployees.length && monthEntries.length === 0) {
          status.criticalWarnings.push('Keine Zeiterfassung für alle Mitarbeiter – bitte prüfen');
        }
        break;
      }
      case 1: {
        if (selectedMonth === 12) status.criticalWarnings.push('Dezember: Weihnachtsgeld / 13. Gehalt prüfen');
        if (selectedMonth === 6)  status.criticalWarnings.push('Juni: Urlaubsgeld prüfen');
        break;
      }
      case 2: {
        const existingPeriod = payrollPeriods.find(
          p => p.month === selectedMonth && p.year === selectedYear
        );
        if (existingPeriod) {
          status.warnings.push(`Abrechnung existiert bereits (Status: ${existingPeriod.status})`);
          status.completed = true;
        }
        if (activeEmployees.length === 0) status.criticalWarnings.push('Keine aktiven Mitarbeiter vorhanden');
        break;
      }
      case 3: {
        status.warnings.push('SV-Meldungen und Lohnsteueranmeldung werden automatisch vorbereitet');
        break;
      }
      case 4: break;
    }
    return status;
  }, [timeEntries, selectedMonth, selectedYear, activeEmployees, payrollPeriods]);
}
