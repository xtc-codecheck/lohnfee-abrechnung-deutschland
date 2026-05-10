// TypeScript-Definitionen für die Zeiterfassung

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: Date;
  type: TimeEntryType;
  hoursWorked?: number;
  startTime?: string;
  endTime?: string;
  breakTime?: number; // in Minuten
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkTimeEntry {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  type: TimeEntryType;
  hoursPerDay?: number;
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
  notes?: string;
}

export interface EmployeeTimeStatus {
  employeeId: string;
  contractHours: number; // Wochenstunden laut Vertrag
  actualHours: number; // Tatsächlich gearbeitete Stunden
  deviation: number; // Abweichung in Prozent
  status: 'green' | 'yellow' | 'red';
  sickDays: number;
  vacationDays: number;
  overtimeHours: number;
}

export interface TimeTrackingStats {
  totalEmployees: number;
  greenStatus: number;
  yellowStatus: number;
  redStatus: number;
  averageHoursWorked: number;
  totalSickDays: number;
  totalVacationDays: number;
}

export type TimeEntryType = 
  | 'work' 
  | 'vacation' 
  | 'sick' 
  | 'parental-leave' 
  | 'unpaid-leave' 
  | 'training' 
  | 'holiday'
  | 'absence';

export const TIME_ENTRY_LABELS: Record<TimeEntryType, string> = {
  work: 'Arbeitszeit',
  vacation: 'Urlaub',
  sick: 'Krankheit',
  'parental-leave': 'Elternzeit',
  'unpaid-leave': 'Unbezahlter Urlaub',
  training: 'Schulung/Fortbildung',
  holiday: 'Feiertag',
  absence: 'Fehlzeit'
};

export const TIME_ENTRY_COLORS: Record<TimeEntryType, string> = {
  work: 'bg-success/10 text-success border-success/30',
  vacation: 'bg-info/10 text-info border-info/30',
  sick: 'bg-destructive/10 text-destructive border-destructive/30',
  'parental-leave': 'bg-primary/10 text-primary border-primary/30',
  'unpaid-leave': 'bg-muted text-muted-foreground border-border',
  training: 'bg-warning/10 text-warning border-warning/30',
  holiday: 'bg-info/10 text-info border-info/30',
  absence: 'bg-warning/10 text-warning border-warning/30'
};