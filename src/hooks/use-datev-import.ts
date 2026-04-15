import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { useAuth } from '@/contexts/auth-context';
import { DatevEmployee, mapToDbRow } from '@/utils/datev-import';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';

export type ConflictStrategy = 'skip' | 'overwrite' | 'merge';

interface ImportProgress {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export function useDatevImport() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const importEmployees = async (
    employees: DatevEmployee[],
    conflictStrategy: ConflictStrategy = 'skip'
  ): Promise<ImportProgress> => {
    if (!tenantId || !user) {
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
        .eq('tenant_id', tenantId);

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
              const { error } = await supabase
                .from('employees')
                .update({
                  first_name: dbRow.first_name,
                  last_name: dbRow.last_name,
                  date_of_birth: dbRow.date_of_birth ?? null,
                  gender: dbRow.gender ?? null,
                  street: dbRow.street ?? null,
                  zip_code: dbRow.zip_code ?? null,
                  city: dbRow.city ?? null,
                  iban: dbRow.iban ?? null,
                  bic: dbRow.bic ?? null,
                  sv_number: dbRow.sv_number ?? null,
                  tax_id: dbRow.tax_id ?? null,
                  tax_class: dbRow.tax_class ?? null,
                  church_tax: dbRow.church_tax,
                  church_tax_rate: dbRow.church_tax_rate ?? null,
                  children_allowance: dbRow.children_allowance ?? null,
                  health_insurance: dbRow.health_insurance ?? null,
                  gross_salary: dbRow.gross_salary,
                  weekly_hours: dbRow.weekly_hours ?? null,
                  entry_date: dbRow.entry_date ?? null,
                  exit_date: dbRow.exit_date ?? null,
                  position: dbRow.position ?? null,
                  employment_type: dbRow.employment_type,
                  is_active: dbRow.is_active,
                  personal_number: dbRow.personal_number,
                })
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
              first_name: dbRow.first_name,
              last_name: dbRow.last_name,
              date_of_birth: dbRow.date_of_birth ?? null,
              gender: dbRow.gender ?? null,
              street: dbRow.street ?? null,
              zip_code: dbRow.zip_code ?? null,
              city: dbRow.city ?? null,
              iban: dbRow.iban ?? null,
              bic: dbRow.bic ?? null,
              sv_number: dbRow.sv_number ?? null,
              tax_id: dbRow.tax_id ?? null,
              tax_class: dbRow.tax_class ?? null,
              church_tax: dbRow.church_tax,
              church_tax_rate: dbRow.church_tax_rate ?? null,
              children_allowance: dbRow.children_allowance ?? null,
              health_insurance: dbRow.health_insurance ?? null,
              gross_salary: dbRow.gross_salary,
              weekly_hours: dbRow.weekly_hours ?? null,
              entry_date: dbRow.entry_date ?? null,
              exit_date: dbRow.exit_date ?? null,
              position: dbRow.position ?? null,
              employment_type: dbRow.employment_type,
              is_active: dbRow.is_active,
              personal_number: dbRow.personal_number,
              tenant_id: tenantId,
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
      // Invalidate employee cache so the list refreshes
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.all(tenantId) });
    }

    return result;
  };

  return { importEmployees, isImporting, progress };
}
