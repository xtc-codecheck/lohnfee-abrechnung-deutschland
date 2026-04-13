import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-context';

interface Tenant {
  id: string;
  name: string;
  tax_number: string | null;
  betriebsnummer: string | null;
  is_active: boolean;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  tenantId: string | null;
  loading: boolean;
  switchTenant: (tenantId: string) => void;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenants = useCallback(async () => {
    if (!user) { setTenants([]); setCurrentTenant(null); setLoading(false); return; }
    
    setLoading(true);
    
    // Get tenant memberships
    const { data: memberships } = await supabase
      .from('tenant_members')
      .select('tenant_id, is_default')
      .eq('user_id', user.id);
    
    if (!memberships || memberships.length === 0) {
      // Auto-create tenant for existing user without one
      const { data: newTenant } = await supabase
        .from('tenants')
        .insert({ name: 'Mein Unternehmen' })
        .select()
        .single();
      
      if (newTenant) {
        await supabase.from('tenant_members').insert({
          tenant_id: newTenant.id,
          user_id: user.id,
          is_default: true,
        });
        setTenants([newTenant]);
        setCurrentTenant(newTenant);
      }
      setLoading(false);
      return;
    }

    const tenantIds = memberships.map(m => m.tenant_id);
    const { data: tenantRows } = await supabase
      .from('tenants')
      .select('*')
      .in('id', tenantIds);
    
    const list = tenantRows ?? [];
    setTenants(list);
    
    const defaultMembership = memberships.find(m => m.is_default);
    const defaultTenant = list.find(t => t.id === defaultMembership?.tenant_id) ?? list[0] ?? null;
    setCurrentTenant(defaultTenant);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const switchTenant = useCallback((tenantId: string) => {
    const t = tenants.find(t => t.id === tenantId);
    if (t) setCurrentTenant(t);
  }, [tenants]);

  return (
    <TenantContext.Provider value={{
      currentTenant,
      tenants,
      tenantId: currentTenant?.id ?? null,
      loading,
      switchTenant,
      refreshTenants: fetchTenants,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
