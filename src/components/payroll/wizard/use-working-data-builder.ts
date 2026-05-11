import { useCallback } from 'react';
import { Employee } from '@/types/employee';
import { TimeEntry, WorkingTimeData } from '@/types/payroll';

/**
 * Baut WorkingTimeData aus echten Zeiteinträgen für einen Mitarbeiter und Monat.
 * Fällt auf Vertragsdaten zurück, wenn keine Einträge vorhanden sind.
 * Unverändert übernommen aus monthly-payroll-wizard.tsx.
 */
export function useWorkingDataBuilder(
  timeEntries: TimeEntry[],
  selectedMonth: number,
  selectedYear: number,
  activeEmployees: Employee[],
) {
  return useCallback((employeeId: string): WorkingTimeData => {
    const monthEntries = timeEntries.filter(e => {
      const d = new Date(e.date);
      return e.employeeId === employeeId &&
        d.getMonth() + 1 === selectedMonth &&
        d.getFullYear() === selectedYear;
    });

    if (monthEntries.length === 0) {
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
}
