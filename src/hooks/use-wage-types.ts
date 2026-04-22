import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { WageType, EmployeeWageType, DEFAULT_WAGE_TYPES } from '@/types/wage-types';
import { toast } from 'sonner';

export function useWageTypes() {
  const { tenantId } = useTenant();
  const [wageTypes, setWageTypes] = useState<WageType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWageTypes = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('wage_types' as never)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (error) {
      toast.error('Lohnarten konnten nicht geladen werden');
    } else {
      setWageTypes((data as unknown as WageType[]) ?? []);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchWageTypes(); }, [fetchWageTypes]);

  const seedDefaults = useCallback(async () => {
    if (!tenantId) return;
    const rows = DEFAULT_WAGE_TYPES.map(w => ({ ...w, tenant_id: tenantId }));
    const { error } = await supabase.from('wage_types' as never).insert(rows as never);
    if (error) {
      toast.error('Standardkatalog konnte nicht angelegt werden: ' + error.message);
    } else {
      toast.success(`${rows.length} Standard-Lohnarten angelegt`);
      fetchWageTypes();
    }
  }, [tenantId, fetchWageTypes]);

  const createWageType = useCallback(async (wt: Partial<WageType>) => {
    if (!tenantId) return;
    const { error } = await supabase.from('wage_types' as never).insert({ ...wt, tenant_id: tenantId } as never);
    if (error) toast.error('Anlegen fehlgeschlagen: ' + error.message);
    else { toast.success('Lohnart angelegt'); fetchWageTypes(); }
  }, [tenantId, fetchWageTypes]);

  const updateWageType = useCallback(async (id: string, updates: Partial<WageType>) => {
    const { error } = await supabase.from('wage_types' as never).update(updates as never).eq('id', id);
    if (error) toast.error('Speichern fehlgeschlagen: ' + error.message);
    else { toast.success('Gespeichert'); fetchWageTypes(); }
  }, [fetchWageTypes]);

  const deleteWageType = useCallback(async (id: string) => {
    const { error } = await supabase.from('wage_types' as never).delete().eq('id', id);
    if (error) toast.error('Löschen fehlgeschlagen: ' + error.message);
    else { toast.success('Gelöscht'); fetchWageTypes(); }
  }, [fetchWageTypes]);

  return { wageTypes, loading, fetchWageTypes, seedDefaults, createWageType, updateWageType, deleteWageType };
}

export function useEmployeeWageTypes(employeeId: string | null) {
  const { tenantId } = useTenant();
  const [items, setItems] = useState<EmployeeWageType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!tenantId || !employeeId) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('employee_wage_types' as never)
      .select('*, wage_type:wage_types(*)')
      .eq('tenant_id', tenantId)
      .eq('employee_id', employeeId)
      .order('valid_from', { ascending: false });
    if (error) toast.error('Mitarbeiter-Lohnarten konnten nicht geladen werden');
    else setItems((data as unknown as EmployeeWageType[]) ?? []);
    setLoading(false);
  }, [tenantId, employeeId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (item: Partial<EmployeeWageType>) => {
    if (!tenantId || !employeeId) return;
    const { error } = await supabase.from('employee_wage_types' as never).insert({
      ...item, tenant_id: tenantId, employee_id: employeeId,
    } as never);
    if (error) toast.error('Zuordnung fehlgeschlagen: ' + error.message);
    else { toast.success('Lohnart zugeordnet'); fetch(); }
  }, [tenantId, employeeId, fetch]);

  const update = useCallback(async (id: string, updates: Partial<EmployeeWageType>) => {
    const { error } = await supabase.from('employee_wage_types' as never).update(updates as never).eq('id', id);
    if (error) toast.error('Speichern fehlgeschlagen: ' + error.message);
    else { toast.success('Gespeichert'); fetch(); }
  }, [fetch]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('employee_wage_types' as never).delete().eq('id', id);
    if (error) toast.error('Löschen fehlgeschlagen: ' + error.message);
    else { toast.success('Entfernt'); fetch(); }
  }, [fetch]);

  return { items, loading, add, update, remove, refresh: fetch };
}
