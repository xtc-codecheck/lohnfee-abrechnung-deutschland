import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { useAuth } from '@/contexts/auth-context';
import { DatevEmployee, DatevEmployeeDbRow, mapToDbRow } from '@/utils/datev-import';
import { toast } from 'sonner';

export type ConflictStrategy = 'skip' | 'overwrite' | 'merge';

interface ImportProgress {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export function useDatevImport() {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const importEmployees = async (
    employees: DatevEmployee[],
    conflictStrategy: ConflictStrategy = 'skip'
  ): Promise<ImportProgress> => {
    if (!currentTenant || !user) {
      toast.error('Kein Mandant oder Benutzer aktiv');
      return { total: 0, imported: 0, skipped: 0, errors: ['Nicht authentifiziert'] };
    }

    setIsImporting(true);
    const result: ImportProgress = { total: employees.length, imported: 0, skipped: 0, errors: [] };
    setProgress(result);

    try {
      // Load existing employees for conflict detection
      const { data: existing } = await supabase
        .from('employees')
        .select('id, personal_number, sv_number, first_name, last_name')
        .eq('tenant_id', currentTenant);

      const existingByPnr = new Map(
        (existing || []).filter(e => e.personal_number).map(e => [e.personal_number!, e])
      );
      const existingBySv = new Map(
        (existing || []).filter(e => e.sv_number).map(e => [e.sv_number!, e])
      );

      for (const emp of employees) {
        try {
          const dbRow = mapToDbRow(emp);
          const existingByPnrMatch = existingByPnr.get(emp.personalNumber);
          const existingBySvMatch = emp.svNumber ? existingBySv.get(emp.svNumber) : undefined;
          const conflict = existingByPnrMatch || existingBySvMatch;

          if (conflict) {
            if (conflictStrategy === 'skip') {
              result.skipped++;
              continue;
            }

            if (conflictStrategy === 'overwrite' || conflictStrategy === 'merge') {
              const updateData: Record<string, unknown> = {};
              const entries = Object.entries(dbRow) as [string, unknown][];
              
              for (const [key, value] of entries) {
                if (conflictStrategy === 'overwrite' || (value !== undefined && value !== null && value !== '')) {
                  updateData[key] = value;
                }
              }

              const { error } = await supabase
                .from('employees')
                .update(updateData)
                .eq('id', conflict.id);

              if (error) {
                result.errors.push(`${emp.firstName} ${emp.lastName}: ${error.message}`);
              } else {
                result.imported++;
              }
              continue;
            }
          }

          // New employee — insert
          const { error } = await supabase
            .from('employees')
            .insert({
              ...dbRow,
              tenant_id: currentTenant,
              created_by: user.id,
            });

          if (error) {
            result.errors.push(`${emp.firstName} ${emp.lastName}: ${error.message}`);
          } else {
            result.imported++;
          }
        } catch (e) {
          result.errors.push(`${emp.firstName} ${emp.lastName}: ${e instanceof Error ? e.message : 'Unbekannter Fehler'}`);
        }

        setProgress({ ...result });
      }
    } finally {
      setIsImporting(false);
      setProgress(result);
    }

    return result;
  };

  return { importEmployees, isImporting, progress };
}
