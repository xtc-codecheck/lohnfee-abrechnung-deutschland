import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { EmployeeWageType } from '@/types/wage-types';

/**
 * Lädt alle aktiven Mitarbeiter-Lohnarten-Zuordnungen eines Mandanten in einem Schwung.
 * Wird vom Monatsabrechnungs-Wizard verwendet, um pro Mitarbeiter den
 * jeweiligen Subset effizient anzuwenden.
 */
export function useTenantEmployeeWageTypes() {
  const { tenantId } = useTenant();

  const query = useQuery({
    queryKey: ['employee-wage-types', tenantId],
    enabled: !!tenantId,
    staleTime: 30_000,
    queryFn: async (): Promise<EmployeeWageType[]> => {
      const { data, error } = await supabase
        .from('employee_wage_types')
        .select('*, wage_type:wage_types(*)')
        .eq('tenant_id', tenantId!)
        .eq('is_active', true);
      if (error) throw new Error(error.message);
      return (data as unknown as EmployeeWageType[]) ?? [];
    },
  });

  const byEmployee = new Map<string, EmployeeWageType[]>();
  for (const it of query.data ?? []) {
    const arr = byEmployee.get(it.employee_id) ?? [];
    arr.push(it);
    byEmployee.set(it.employee_id, arr);
  }

  return {
    items: query.data ?? [],
    byEmployee,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
