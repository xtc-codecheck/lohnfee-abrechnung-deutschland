/**
 * Hook für Autolohn-Einstellungen mit Supabase-Persistenz
 */
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { AutolohnSettings } from '@/types/autolohn';

const DEFAULT_SETTINGS: AutolohnSettings = {
  companyData: {
    name: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    state: 'nordrhein-westfalen',
    country: 'Deutschland',
    taxNumber: '',
    operationNumber: '',
  },
  socialSecurityReporting: { enabled: true, daysBefore: 10 },
  payrollTaxReporting: { enabled: true, dayOfNextMonth: 1 },
  employeeNotifications: { enabled: true, sendOnPayrollCreation: true },
  managerNotifications: { enabled: true, managerEmail: '', daysBefore: 12 },
};

export function useAutolohnSettings() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const queryKey = ['autolohn-settings', tenantId] as const;

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<AutolohnSettings> => {
      if (!tenantId) return DEFAULT_SETTINGS;
      const { data } = await supabase
        .from('autolohn_settings')
        .select('settings')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (!data?.settings) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...(data.settings as unknown as AutolohnSettings) };
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (newSettings: AutolohnSettings) => {
      if (!tenantId) throw new Error('Kein Mandant ausgewählt');
      // Check if row exists
      const { data: existing } = await supabase
        .from('autolohn_settings')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const settingsJson = newSettings as unknown as Record<string, unknown>;

      if (existing) {
        const { error } = await supabase
          .from('autolohn_settings')
          .update({ settings: settingsJson })
          .eq('tenant_id', tenantId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('autolohn_settings')
          .insert({ tenant_id: tenantId, settings: settingsJson });
        if (error) throw new Error(error.message);
      }
      return newSettings;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved);
    },
  });

  const saveSettings = useCallback(
    async (newSettings: AutolohnSettings) => {
      await saveMutation.mutateAsync(newSettings);
    },
    [saveMutation]
  );

  return { settings, isLoading, saveSettings, isSaving: saveMutation.isPending };
}
