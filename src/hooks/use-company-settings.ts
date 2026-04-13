/**
 * Hook für Firmenstammdaten aus der Datenbank
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useTenant } from '@/contexts/tenant-context';

export type CompanySettings = Tables<'company_settings'>;

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useTenant();

  const fetchSettings = useCallback(async () => {
    if (!tenantId) { setSettings(null); setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error: err } = await supabase
      .from('company_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle();
    
    if (err) {
      setError(err.message);
    } else {
      setSettings(data);
      setError(null);
    }
    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(async (values: Partial<CompanySettings>) => {
    if (!tenantId) return false;
    setError(null);
    
    if (settings?.id) {
      const { data, error: err } = await supabase
        .from('company_settings')
        .update(values)
        .eq('id', settings.id)
        .select()
        .single();
      
      if (err) { setError(err.message); return false; }
      setSettings(data);
    } else {
      const { data, error: err } = await supabase
        .from('company_settings')
        .insert({ company_name: values.company_name ?? 'Meine Firma', ...values, tenant_id: tenantId })
        .select()
        .single();
      
      if (err) { setError(err.message); return false; }
      setSettings(data);
    }
    return true;
  }, [settings, tenantId]);

  return { settings, isLoading, error, saveSettings, refreshData: fetchSettings };
}
