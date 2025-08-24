// Integration von Zeiterfassung in Lohnabrechnung

import { TimeEntry, EmployeeTimeStatus } from '@/types/time-tracking';
import { WorkingTimeData } from '@/types/payroll';
import { Employee } from '@/types/employee';
import { 
  startOfMonth, 
  endOfMonth, 
  isWeekend, 
  differenceInHours,
  parseISO,
  format,
  eachDayOfInterval,
  getDay
} from 'date-fns';

export interface PayrollTimeIntegration {
  employeeId: string;
  employeeName: string;
  period: {
    year: number;
    month: number;
    startDate: Date;
    endDate: Date;
  };
  timeData: WorkingTimeData;
  timeEntries: TimeEntry[];
  discrepancies: TimeDiscrepancy[];
  status: 'complete' | 'incomplete' | 'discrepancies';
}

export interface TimeDiscrepancy {
  date: string;
  type: 'missing_entry' | 'excessive_hours' | 'weekend_work' | 'holiday_work' | 'overtime_limit';
  description: string;
  expectedHours?: number;
  actualHours?: number;
  severity: 'low' | 'medium' | 'high';
}

export interface TimeCalculationResult {
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  vacationDays: number;
  sickDays: number;
  actualWorkingDays: number;
  expectedWorkingDays: number;
}

/**
 * Deutsche Feiertage für ein Jahr (vereinfacht)
 */
export function getGermanHolidays(year: number): Date[] {
  // Feste Feiertage
  const holidays = [
    new Date(year, 0, 1),   // Neujahr
    new Date(year, 4, 1),   // Tag der Arbeit  
    new Date(year, 9, 3),   // Tag der Deutschen Einheit
    new Date(year, 11, 25), // 1. Weihnachtsfeiertag
    new Date(year, 11, 26), // 2. Weihnachtsfeiertag
  ];
  
  // Bewegliche Feiertage (vereinfacht - könnte erweitert werden)
  const easter = getEasterDate(year);
  holidays.push(
    new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000), // Karfreitag
    new Date(easter.getTime() + 1 * 24 * 60 * 60 * 1000), // Ostermontag
    new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000), // Christi Himmelfahrt
    new Date(easter.getTime() + 50 * 24 * 60 * 60 * 1000), // Pfingstmontag
  );
  
  return holidays;
}

/**
 * Berechnet Osterdatum (vereinfacht)
 */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Integriert Zeiterfassungsdaten in Lohnabrechnung
 */
export function integrateTimeTrackingToPayroll(
  employee: Employee,
  timeEntries: TimeEntry[],
  year: number,
  month: number // 1-12
): PayrollTimeIntegration {
  const periodStart = startOfMonth(new Date(year, month - 1, 1));
  const periodEnd = endOfMonth(new Date(year, month - 1, 1));
  
  // Filtere Zeiteinträge für den Zeitraum
  const periodEntries = timeEntries.filter(entry => {
    const entryDate = typeof entry.date === 'string' ? parseISO(entry.date) : entry.date;
    return entryDate >= periodStart && entryDate <= periodEnd && entry.employeeId === employee.id;
  });
  
  // Berechne Arbeitszeiten
  const timeData = calculateWorkingTimeFromEntries(employee, periodEntries, year, month);
  
  // Finde Diskrepanzen
  const discrepancies = findTimeDiscrepancies(employee, periodEntries, year, month);
  
  // Bestimme Status
  const status = discrepancies.filter(d => d.severity === 'high').length > 0 ? 'discrepancies' :
                 periodEntries.length === 0 ? 'incomplete' : 'complete';
  
  return {
    employeeId: employee.id,
    employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
    period: {
      year,
      month,
      startDate: periodStart,
      endDate: periodEnd
    },
    timeData,
    timeEntries: periodEntries,
    discrepancies,
    status
  };
}

/**
 * Berechnet Arbeitszeiten aus Zeiteinträgen
 */
export function calculateWorkingTimeFromEntries(
  employee: Employee,
  timeEntries: TimeEntry[],
  year: number,
  month: number
): WorkingTimeData {
  const holidays = getGermanHolidays(year);
  const holidayDates = holidays.map(h => format(h, 'yyyy-MM-dd'));
  
  let regularHours = 0;
  let overtimeHours = 0;
  let nightHours = 0;
  let sundayHours = 0;
  let holidayHours = 0;
  let vacationDays = 0;
  let sickDays = 0;
  
  const dailyContractHours = employee.employmentData.weeklyHours / 5; // Annahme: 5 Arbeitstage
  
  // Gruppiere Einträge nach Datum
  const entriesByDate = timeEntries.reduce((acc, entry) => {
    const date = format(typeof entry.date === 'string' ? parseISO(entry.date) : entry.date, 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);
  
  // Verarbeite jeden Tag
  Object.entries(entriesByDate).forEach(([dateStr, dayEntries]) => {
    const date = parseISO(dateStr);
    const isHoliday = holidayDates.includes(dateStr);
    const isSunday = getDay(date) === 0;
    
    // Berechne Tagesstunden
    const dailyHours = dayEntries.reduce((total, entry) => {
      if (entry.type === 'work') {
        return total + (entry.hoursWorked || 8); // Fallback auf 8h wenn nicht gesetzt
      } else if (entry.type === 'vacation') {
        vacationDays++;
        return total + dailyContractHours; // Urlaub zählt als bezahlte Zeit
      } else if (entry.type === 'sick') {
        sickDays++;
        return total + dailyContractHours; // Krankheit zählt als bezahlte Zeit
      }
      return total;
    }, 0);
    
    if (dailyHours > 0) {
      // Kategorisiere Stunden
      if (isHoliday) {
        holidayHours += dailyHours;
      } else if (isSunday) {
        sundayHours += dailyHours;
      } else {
        // Reguläre Arbeitszeit vs. Überstunden
        const regularDailyHours = Math.min(dailyHours, dailyContractHours);
        const overtimeDailyHours = Math.max(0, dailyHours - dailyContractHours);
        
        regularHours += regularDailyHours;
        overtimeHours += overtimeDailyHours;
      }
      
      // Nachtarbeit (22:00 - 06:00) - vereinfacht
      dayEntries.forEach(entry => {
        if (entry.type === 'work') {
          const entryDate = typeof entry.date === 'string' ? parseISO(entry.date) : entry.date;
          const startHour = entryDate.getHours();
          
          // Vereinfachte Nachtarbeitsberechnung (wenn Start zwischen 22-6 Uhr)
          if (startHour >= 22 || startHour <= 6) {
            nightHours += Math.min(entry.hoursWorked || 8, dailyHours) * 0.3; // 30% der Zeit als Nachtarbeit
          }
        }
      });
    }
  });
  
  // Berechne erwartete vs. tatsächliche Arbeitstage
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(new Date(year, month - 1, 1));
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const expectedWorkingDays = allDays.filter(day => 
    !isWeekend(day) && 
    !holidayDates.includes(format(day, 'yyyy-MM-dd')) &&
    employee.employmentData.workDays.find(wd => 
      wd.day === ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][getDay(day)] && 
      wd.isWorkDay
    )
  ).length;
  
  const actualWorkingDays = Object.keys(entriesByDate).filter(dateStr => {
    const date = parseISO(dateStr);
    return !isWeekend(date) && !holidayDates.includes(dateStr);
  }).length;
  
  return {
    regularHours,
    overtimeHours,
    nightHours,
    sundayHours,
    holidayHours,
    vacationDays,
    sickDays,
    actualWorkingDays,
    expectedWorkingDays
  };
}

/**
 * Findet Diskrepanzen in der Zeiterfassung
 */
export function findTimeDiscrepancies(
  employee: Employee,
  timeEntries: TimeEntry[],
  year: number,
  month: number
): TimeDiscrepancy[] {
  const discrepancies: TimeDiscrepancy[] = [];
  const holidays = getGermanHolidays(year);
  const holidayDates = holidays.map(h => format(h, 'yyyy-MM-dd'));
  
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(new Date(year, month - 1, 1));
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const dailyContractHours = employee.employmentData.weeklyHours / 5;
  
  // Gruppiere Einträge nach Datum
  const entriesByDate = timeEntries.reduce((acc, entry) => {
    const date = format(typeof entry.date === 'string' ? parseISO(entry.date) : entry.date, 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);
  
  // Prüfe jeden Arbeitstag
  allDays.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isHoliday = holidayDates.includes(dateStr);
    const isWeekendDay = isWeekend(day);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][getDay(day)] as any;
    
    const shouldWork = employee.employmentData.workDays.find(wd => wd.day === dayOfWeek)?.isWorkDay && !isHoliday;
    const hasEntries = entriesByDate[dateStr]?.length > 0;
    
    if (shouldWork && !hasEntries) {
      discrepancies.push({
        date: dateStr,
        type: 'missing_entry',
        description: `Fehlende Zeiterfassung für Arbeitstag`,
        expectedHours: dailyContractHours,
        actualHours: 0,
        severity: 'high'
      });
    }
    
    if (hasEntries) {
      const dayEntries = entriesByDate[dateStr];
      const dailyHours = dayEntries.reduce((total, entry) => {
        if (entry.type === 'work') {
          return total + (entry.hoursWorked || 8);
        }
        return total;
      }, 0);
      
      // Übermäßige Arbeitszeit
      if (dailyHours > 10) {
        discrepancies.push({
          date: dateStr,
          type: 'excessive_hours',
          description: `Übermäßige Arbeitszeit: ${dailyHours}h > 10h erlaubt`,
          expectedHours: 10,
          actualHours: dailyHours,
          severity: 'high'
        });
      }
      
      // Wochenendarbeit
      if (isWeekendDay && dailyHours > 0) {
        discrepancies.push({
          date: dateStr,
          type: 'weekend_work',
          description: `Wochenendarbeit: ${dailyHours}h`,
          actualHours: dailyHours,
          severity: 'medium'
        });
      }
      
      // Feiertagsarbeit
      if (isHoliday && dailyHours > 0) {
        discrepancies.push({
          date: dateStr,
          type: 'holiday_work',
          description: `Feiertagsarbeit: ${dailyHours}h`,
          actualHours: dailyHours,
          severity: 'medium'
        });
      }
    }
  });
  
  return discrepancies;
}

/**
 * Erstellt automatische Lohnabrechnung basierend auf Zeiterfassung
 */
export function createPayrollFromTimeTracking(
  employees: Employee[],
  timeEntries: TimeEntry[],
  year: number,
  month: number
): PayrollTimeIntegration[] {
  return employees.map(employee => 
    integrateTimeTrackingToPayroll(employee, timeEntries, year, month)
  );
}