import { useState, useEffect } from 'react';
import { TimeEntry, BulkTimeEntry, EmployeeTimeStatus, TimeTrackingStats } from '@/types/time-tracking';
import { useEmployeeStorage } from '@/hooks/use-employee-storage';
import { addDays, isSameDay, isWeekend, format, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';

const STORAGE_KEY = 'lohnpro_time_entries';

export function useTimeTracking() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const { employees } = useEmployeeStorage();

  // Load time entries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const entriesWithDates = parsed.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }));
        setTimeEntries(entriesWithDates);
      } catch (error) {
        console.error('Error loading time entries from storage:', error);
      }
    }
  }, []);

  // Save time entries to localStorage whenever the array changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timeEntries));
  }, [timeEntries]);

  const addTimeEntry = (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTimeEntries(prev => [...prev, newEntry]);
    return newEntry;
  };

  const updateTimeEntry = (id: string, updates: Partial<Omit<TimeEntry, 'id' | 'createdAt'>>) => {
    setTimeEntries(prev => 
      prev.map(entry => 
        entry.id === id 
          ? { ...entry, ...updates, updatedAt: new Date() }
          : entry
      )
    );
  };

  const deleteTimeEntry = (id: string) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const addBulkTimeEntries = (bulkEntry: BulkTimeEntry) => {
    const { startDate, endDate, employeeId, type, hoursPerDay, excludeWeekends, excludeHolidays, notes } = bulkEntry;
    const newEntries: TimeEntry[] = [];
    
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      // Skip weekends if requested
      if (excludeWeekends && isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Check if entry already exists for this date
      const existingEntry = timeEntries.find(entry => 
        entry.employeeId === employeeId && isSameDay(entry.date, currentDate)
      );

      if (!existingEntry) {
        const newEntry: TimeEntry = {
          id: crypto.randomUUID(),
          employeeId,
          date: new Date(currentDate),
          type,
          hoursWorked: type === 'work' ? hoursPerDay : undefined,
          notes,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        newEntries.push(newEntry);
      }

      currentDate = addDays(currentDate, 1);
    }

    setTimeEntries(prev => [...prev, ...newEntries]);
    return newEntries;
  };

  const getTimeEntriesForEmployee = (employeeId: string, startDate?: Date, endDate?: Date) => {
    return timeEntries.filter(entry => {
      if (entry.employeeId !== employeeId) return false;
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      return true;
    });
  };

  const getTimeEntryForDate = (employeeId: string, date: Date) => {
    return timeEntries.find(entry => 
      entry.employeeId === employeeId && isSameDay(entry.date, date)
    );
  };

  const calculateEmployeeStatus = (employeeId: string, startDate: Date, endDate: Date): EmployeeTimeStatus => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
      return {
        employeeId,
        contractHours: 0,
        actualHours: 0,
        deviation: 0,
        status: 'red',
        sickDays: 0,
        vacationDays: 0,
        overtimeHours: 0
      };
    }

    const entries = getTimeEntriesForEmployee(employeeId, startDate, endDate);
    const workEntries = entries.filter(e => e.type === 'work');
    const sickEntries = entries.filter(e => e.type === 'sick');
    const vacationEntries = entries.filter(e => e.type === 'vacation');

    const actualHours = workEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0);
    const sickDays = sickEntries.length;
    const vacationDays = vacationEntries.length;

    // Calculate expected hours based on contract
    const weeklyHours = employee.employmentData.weeklyHours;
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const totalWeeks = totalDays / 7;
    const expectedHours = weeklyHours * totalWeeks;

    const deviation = expectedHours > 0 ? ((actualHours - expectedHours) / expectedHours) * 100 : 0;
    const absDeviation = Math.abs(deviation);

    let status: 'green' | 'yellow' | 'red' = 'green';
    if (absDeviation > 10) status = 'red';
    else if (absDeviation > 5) status = 'yellow';

    return {
      employeeId,
      contractHours: expectedHours,
      actualHours,
      deviation,
      status,
      sickDays,
      vacationDays,
      overtimeHours: Math.max(0, actualHours - expectedHours)
    };
  };

  const getTimeTrackingStats = (startDate: Date, endDate: Date): TimeTrackingStats => {
    const employeeStatuses = employees.map(emp => 
      calculateEmployeeStatus(emp.id, startDate, endDate)
    );

    return {
      totalEmployees: employees.length,
      greenStatus: employeeStatuses.filter(s => s.status === 'green').length,
      yellowStatus: employeeStatuses.filter(s => s.status === 'yellow').length,
      redStatus: employeeStatuses.filter(s => s.status === 'red').length,
      averageHoursWorked: employeeStatuses.reduce((sum, s) => sum + s.actualHours, 0) / employees.length,
      totalSickDays: employeeStatuses.reduce((sum, s) => sum + s.sickDays, 0),
      totalVacationDays: employeeStatuses.reduce((sum, s) => sum + s.vacationDays, 0)
    };
  };

  return {
    timeEntries,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    addBulkTimeEntries,
    getTimeEntriesForEmployee,
    getTimeEntryForDate,
    calculateEmployeeStatus,
    getTimeTrackingStats
  };
}