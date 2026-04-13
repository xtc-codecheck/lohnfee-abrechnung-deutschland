/**
 * Zeiterfassung Hook – Supabase-basiert
 */
import { useState, useEffect, useCallback } from 'react';
import { TimeEntry, BulkTimeEntry, EmployeeTimeStatus, TimeTrackingStats, TimeEntryType } from '@/types/time-tracking';
import { useEmployeeStorage } from '@/hooks/use-employee-storage';
import { useTenant } from '@/contexts/tenant-context';
import { supabase } from '@/integrations/supabase/client';
import { addDays, isSameDay, isWeekend, differenceInDays } from 'date-fns';

export function useTimeTracking() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { employees } = useEmployeeStorage();
  const { currentTenant } = useTenant();

  // Load from Supabase
  useEffect(() => {
    if (!currentTenant) return;
    
    const loadEntries = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (error) {
        console.error('Error loading time entries:', error);
      } else if (data) {
        setTimeEntries(data.map(row => ({
          id: row.id,
          employeeId: row.employee_id,
          date: new Date(row.date),
          type: row.type as TimeEntryType,
          hoursWorked: row.hours_worked ?? undefined,
          startTime: row.start_time ?? undefined,
          endTime: row.end_time ?? undefined,
          breakTime: row.break_time ?? undefined,
          notes: row.notes ?? undefined,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        })));
      }
      setIsLoading(false);
    };

    loadEntries();
  }, [currentTenant]);

  const addTimeEntry = useCallback(async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentTenant) return null;

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        tenant_id: currentTenant.id,
        employee_id: entry.employeeId,
        date: entry.date.toISOString().split('T')[0],
        type: entry.type,
        hours_worked: entry.hoursWorked ?? null,
        start_time: entry.startTime ?? null,
        end_time: entry.endTime ?? null,
        break_time: entry.breakTime ?? null,
        notes: entry.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding time entry:', error);
      return null;
    }

    const newEntry: TimeEntry = {
      id: data.id,
      employeeId: data.employee_id,
      date: new Date(data.date),
      type: data.type as TimeEntryType,
      hoursWorked: data.hours_worked ?? undefined,
      startTime: data.start_time ?? undefined,
      endTime: data.end_time ?? undefined,
      breakTime: data.break_time ?? undefined,
      notes: data.notes ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
    setTimeEntries(prev => [...prev, newEntry]);
    return newEntry;
  }, [currentTenant]);

  const updateTimeEntry = useCallback(async (id: string, updates: Partial<Omit<TimeEntry, 'id' | 'createdAt'>>) => {
    const dbUpdates: { hours_worked?: number; type?: string; notes?: string | null; start_time?: string | null; end_time?: string | null; break_time?: number | null } = {};
    if (updates.hoursWorked !== undefined) dbUpdates.hours_worked = updates.hoursWorked;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes ?? null;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime ?? null;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime ?? null;
    if (updates.breakTime !== undefined) dbUpdates.break_time = updates.breakTime ?? null;

    const { error } = await supabase
      .from('time_entries')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating time entry:', error);
      return;
    }

    setTimeEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, ...updates, updatedAt: new Date() } : entry
      )
    );
  }, []);

  const deleteTimeEntry = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting time entry:', error);
      return;
    }

    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const addBulkTimeEntries = useCallback(async (bulkEntry: BulkTimeEntry) => {
    if (!currentTenant) return [];

    const { startDate, endDate, employeeId, type, hoursPerDay, excludeWeekends, notes } = bulkEntry;
    const rows: Array<Record<string, unknown>> = [];

    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      if (excludeWeekends && isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      const existingEntry = timeEntries.find(entry =>
        entry.employeeId === employeeId && isSameDay(entry.date, currentDate)
      );

      if (!existingEntry) {
        rows.push({
          tenant_id: currentTenant.id,
          employee_id: employeeId,
          date: currentDate.toISOString().split('T')[0],
          type,
          hours_worked: type === 'work' ? hoursPerDay : null,
          notes: notes ?? null,
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    if (rows.length === 0) return [];

    const { data, error } = await supabase
      .from('time_entries')
      .insert(rows)
      .select();

    if (error) {
      console.error('Error adding bulk time entries:', error);
      return [];
    }

    const newEntries: TimeEntry[] = (data ?? []).map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      date: new Date(row.date),
      type: row.type as TimeEntryType,
      hoursWorked: row.hours_worked ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    setTimeEntries(prev => [...prev, ...newEntries]);
    return newEntries;
  }, [currentTenant, timeEntries]);

  const getTimeEntriesForEmployee = useCallback((employeeId: string, startDate?: Date, endDate?: Date) => {
    return timeEntries.filter(entry => {
      if (entry.employeeId !== employeeId) return false;
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      return true;
    });
  }, [timeEntries]);

  const getTimeEntryForDate = useCallback((employeeId: string, date: Date) => {
    return timeEntries.find(entry =>
      entry.employeeId === employeeId && isSameDay(entry.date, date)
    );
  }, [timeEntries]);

  const calculateEmployeeStatus = useCallback((employeeId: string, startDate: Date, endDate: Date): EmployeeTimeStatus => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
      return { employeeId, contractHours: 0, actualHours: 0, deviation: 0, status: 'red', sickDays: 0, vacationDays: 0, overtimeHours: 0 };
    }

    const entries = getTimeEntriesForEmployee(employeeId, startDate, endDate);
    const actualHours = entries.filter(e => e.type === 'work').reduce((sum, e) => sum + (e.hoursWorked || 0), 0);
    const sickDays = entries.filter(e => e.type === 'sick').length;
    const vacationDays = entries.filter(e => e.type === 'vacation').length;

    const weeklyHours = employee.employmentData.weeklyHours;
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const expectedHours = weeklyHours * (totalDays / 7);

    const deviation = expectedHours > 0 ? ((actualHours - expectedHours) / expectedHours) * 100 : 0;
    const absDeviation = Math.abs(deviation);

    let status: 'green' | 'yellow' | 'red' = 'green';
    if (absDeviation > 10) status = 'red';
    else if (absDeviation > 5) status = 'yellow';

    return { employeeId, contractHours: expectedHours, actualHours, deviation, status, sickDays, vacationDays, overtimeHours: Math.max(0, actualHours - expectedHours) };
  }, [employees, getTimeEntriesForEmployee]);

  const getTimeTrackingStats = useCallback((startDate: Date, endDate: Date): TimeTrackingStats => {
    const statuses = employees.map(emp => calculateEmployeeStatus(emp.id, startDate, endDate));
    return {
      totalEmployees: employees.length,
      greenStatus: statuses.filter(s => s.status === 'green').length,
      yellowStatus: statuses.filter(s => s.status === 'yellow').length,
      redStatus: statuses.filter(s => s.status === 'red').length,
      averageHoursWorked: employees.length > 0 ? statuses.reduce((sum, s) => sum + s.actualHours, 0) / employees.length : 0,
      totalSickDays: statuses.reduce((sum, s) => sum + s.sickDays, 0),
      totalVacationDays: statuses.reduce((sum, s) => sum + s.vacationDays, 0),
    };
  }, [employees, calculateEmployeeStatus]);

  return {
    timeEntries,
    isLoading,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    addBulkTimeEntries,
    getTimeEntriesForEmployee,
    getTimeEntryForDate,
    calculateEmployeeStatus,
    getTimeTrackingStats,
  };
}
