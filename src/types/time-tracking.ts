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
  work: 'bg-green-100 text-green-800 border-green-200',
  vacation: 'bg-blue-100 text-blue-800 border-blue-200',
  sick: 'bg-red-100 text-red-800 border-red-200',
  'parental-leave': 'bg-purple-100 text-purple-800 border-purple-200',
  'unpaid-leave': 'bg-gray-100 text-gray-800 border-gray-200',
  training: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  holiday: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  absence: 'bg-orange-100 text-orange-800 border-orange-200'
};