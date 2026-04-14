import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'sachbearbeiter' | 'leserecht';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  canEdit: () => boolean;
  isAdmin: () => boolean;
  signOut: () => Promise<void>;
  refreshRolesForTenant: (tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async (userId: string, tenantId?: string) => {
    let query = supabase
      .from('user_roles')
      .select('role, tenant_id')
      .eq('user_id', userId);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data } = await query;

    if (data) {
      setRoles(data.map(r => r.role as AppRole));
    }
  }, []);

  const refreshRolesForTenant = useCallback(async (tenantId: string) => {
    if (user) {
      await fetchRoles(user.id, tenantId);
    }
  }, [user, fetchRoles]);

  useEffect(() => {
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => fetchRoles(session.user.id), 0);
        } else {
          setRoles([]);
        }
        setLoading(false);
        initialSessionHandled = true;
      }
    );

    // Only fetch initial session if onAuthStateChange hasn't fired yet
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initialSessionHandled) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchRoles(session.user.id);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchRoles]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const canEdit = () => hasRole('admin') || hasRole('sachbearbeiter');
  const isAdmin = () => hasRole('admin');

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ session, user, roles, loading, hasRole, canEdit, isAdmin, signOut, refreshRolesForTenant }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
