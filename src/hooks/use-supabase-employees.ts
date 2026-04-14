/**
 * Supabase-basierter Mitarbeiter-Hook – React Query Version
 */
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { Employee } from '@/types/employee';
import { queryKeys } from '@/lib/query-keys';
import { dbToEmployee, employeeToInsert, employeeToUpdate } from './use-supabase-employees-mappers';

// ============= Fetch function =============

async function fetchEmployees(tenantId: string | null): Promise<Employee[]> {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('last_name');
  
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToEmployee);
}

// ============= Hook =============

export function useSupabaseEmployees() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.employees.all(tenantId);

  const { data: employees = [], isLoading, error: queryError } = useQuery({
    queryKey,
    queryFn: () => fetchEmployees(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  const error = queryError?.message ?? null;

  const addMutation = useMutation({
    mutationFn: async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
      const insert = { ...employeeToInsert(employeeData), tenant_id: tenantId };
      const { data, error: err } = await supabase
        .from('employees')
        .insert(insert)
        .select()
        .single();
      if (err) throw new Error(err.message);
      return dbToEmployee(data);
    },
    onSuccess: (newEmp) => {
      queryClient.setQueryData<Employee[]>(queryKey, (old = []) => [...old, newEmp]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Employee> }) => {
      const dbUpdates = employeeToUpdate(updates);
      const { error: err } = await supabase.from('employees').update(dbUpdates).eq('id', id);
      if (err) throw new Error(err.message);
      return { id, updates };
    },
    onSuccess: ({ id, updates }) => {
      queryClient.setQueryData<Employee[]>(queryKey, (old = []) =>
        old.map(emp => emp.id === id ? { ...emp, ...updates, updatedAt: new Date() } : emp)
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: err } = await supabase.from('employees').delete().eq('id', id);
      if (err) throw new Error(err.message);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Employee[]>(queryKey, (old = []) => old.filter(emp => emp.id !== id));
    },
  });

  const addEmployee = useCallback(async (
    employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Employee | null> => {
    try {
      return await addMutation.mutateAsync(employeeData);
    } catch {
      return null;
    }
  }, [addMutation]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      await updateMutation.mutateAsync({ id, updates });
    } catch {
      // error handled by mutation
    }
  }, [updateMutation]);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // error handled by mutation
    }
  }, [deleteMutation]);

  const getEmployee = useCallback((id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    employees,
    isLoading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    refreshData,
  };
}
