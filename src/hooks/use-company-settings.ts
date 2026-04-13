/**
 * Hook für Firmenstammdaten aus der Datenbank
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type CompanySettings = Tables<'company_settings'>;

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const { data, error: err } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (err) {
      setError(err.message);
    } else {
      setSettings(data);
      setError(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(async (values: Partial<CompanySettings>) => {
    setError(null);
    
    if (settings?.id) {
      // Update
      const { data, error: err } = await supabase
        .from('company_settings')
        .update(values)
        .eq('id', settings.id)
        .select()
        .single();
      
      if (err) { setError(err.message); return false; }
      setSettings(data);
    } else {
      // Insert
      const { data, error: err } = await supabase
        .from('company_settings')
        .insert({ company_name: values.company_name ?? 'Meine Firma', ...values })
        .select()
        .single();
      
      if (err) { setError(err.message); return false; }
      setSettings(data);
    }
    return true;
  }, [settings]);

  return { settings, isLoading, error, saveSettings, refreshData: fetchSettings };
}
