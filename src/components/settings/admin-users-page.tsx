import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Loader2 } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  email: string;
  display_name: string;
  roles: string[];
}

export function AdminUsersPage() {
  const { isAdmin } = useAuth();
  const { tenantId, currentTenant } = useTenant();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    loadUsers();
  }, [tenantId]);

  const loadUsers = async () => {
    if (!tenantId) return;
    setLoading(true);

    const { data: members } = await supabase
      .from('tenant_members')
      .select('user_id')
      .eq('tenant_id', tenantId);

    if (!members) { setLoading(false); return; }
    const userIds = members.map(m => m.user_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    // Fetch roles scoped to this tenant
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .in('user_id', userIds)
      .eq('tenant_id', tenantId);

    const userList: UserWithRole[] = (profiles ?? []).map(p => ({
      user_id: p.user_id,
      email: p.email ?? '',
      display_name: p.display_name ?? p.email ?? '',
      roles: (roles ?? []).filter(r => r.user_id === p.user_id).map(r => r.role),
    }));

    setUsers(userList);
    setLoading(false);
  };

  const changeRole = async (userId: string, newRole: string) => {
    if (!tenantId) return;

    // Remove existing roles for this user in this tenant
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    // Add new role with tenant_id
    const { error } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: newRole as 'admin' | 'sachbearbeiter' | 'leserecht',
      tenant_id: tenantId,
    });

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rolle geändert', description: `Rolle auf "${roleLabel(newRole)}" gesetzt.` });
      loadUsers();
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'sachbearbeiter': return 'default';
      default: return 'secondary';
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'sachbearbeiter': return 'Sachbearbeiter';
      case 'leserecht': return 'Nur Lesen';
      default: return role;
    }
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nur Administratoren können Benutzer verwalten.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Benutzerverwaltung"
        description={`Benutzer und Rollen für "${currentTenant?.name ?? ''}"`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Aktive Benutzer ({users.length})
          </CardTitle>
          <CardDescription>Rollen zuweisen und Berechtigungen verwalten (pro Mandant)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.user_id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{u.display_name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="flex gap-1 mt-1">
                      {u.roles.map(r => (
                        <Badge key={r} variant={roleBadgeColor(r) as any}>{roleLabel(r)}</Badge>
                      ))}
                    </div>
                  </div>
                  <Select
                    value={u.roles[0] ?? 'leserecht'}
                    onValueChange={(val) => changeRole(u.user_id, val)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="sachbearbeiter">Sachbearbeiter</SelectItem>
                      <SelectItem value="leserecht">Nur Lesen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
