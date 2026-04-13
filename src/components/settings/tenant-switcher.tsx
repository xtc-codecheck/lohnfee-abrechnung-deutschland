import { useTenant } from '@/contexts/tenant-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function TenantSwitcher() {
  const { tenants, currentTenant, switchTenant } = useTenant();

  if (tenants.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={currentTenant?.id ?? ''} onValueChange={switchTenant}>
        <SelectTrigger className="w-[200px] h-8 text-sm">
          <SelectValue placeholder="Mandant wählen" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map(t => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
