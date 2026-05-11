/**
 * ELStAM-Änderungs-Handler
 * ─────────────────────────────────────────────────────────────
 * Verarbeitet einen offenen Eintrag aus public.elstam_changes:
 *   1. Lädt den Change-Datensatz
 *   2. Identifiziert betroffene payroll_entries (Zeitraum >= effective_date,
 *      noch nicht storniert/ersetzt)
 *   3. Markiert den Change als 'processed' (oder 'open' wenn nichts betroffen)
 *      und speichert die affected_entry_ids
 *
 * Die eigentliche Korrektur-Berechnung erfolgt anschließend gezielt über
 * `executeStornoAndCorrection` aus payroll-storno-workflow.ts.
 *
 * Rechtsgrundlage: § 39 / § 41c EStG (Lohnsteuer-Korrektur bei rückwirkender
 * ELStAM-Änderung), § 28a SGB IV (SV-Korrekturmeldung).
 */

import { supabase } from '@/integrations/supabase/client';

export interface ElstamChangeImpact {
  changeId: string;
  employeeId: string;
  fieldName: string;
  effectiveDate: string;
  affectedEntryIds: string[];
  /** True, wenn das Feld lohnsteuerlich relevant ist (löst Korrektur aus). */
  requiresPayrollCorrection: boolean;
}

const TAX_RELEVANT_FIELDS = new Set([
  'tax_class',
  'tax_id',
  'church_tax',
  'church_tax_rate',
  'children_allowance',
  'number_of_children',
]);

/**
 * Verarbeitet eine ELStAM-Änderung und liefert die betroffenen Abrechnungen.
 * Idempotent: erneuter Aufruf liefert dasselbe Ergebnis.
 */
export async function processElstamChange(changeId: string): Promise<ElstamChangeImpact> {
  const { data: change, error } = await supabase
    .from('elstam_changes')
    .select('*')
    .eq('id', changeId)
    .single();

  if (error || !change) {
    throw new Error(`ELStAM-Änderung nicht gefunden: ${error?.message ?? changeId}`);
  }

  const requiresPayrollCorrection = TAX_RELEVANT_FIELDS.has(change.field_name);
  const effectiveDate = change.effective_date as string;

  // Betroffene payroll_entries: Periode endet am/ nach effective_date,
  // status in ('approved','exported','closed') – Drafts werden vor Lauf neu berechnet.
  const { data: entries } = await supabase
    .from('payroll_entries')
    .select('id, period_end, status, entry_type')
    .eq('tenant_id', change.tenant_id)
    .eq('employee_id', change.employee_id)
    .gte('period_end', effectiveDate)
    .neq('entry_type', 'storno');

  const affectedEntryIds = (entries ?? [])
    .filter(e => e.status !== 'draft')
    .map(e => e.id as string);

  // Status-Update nur wenn relevant ODER bereits Effekt erkannt
  const newStatus = requiresPayrollCorrection ? 'processed' : 'ignored';
  await supabase
    .from('elstam_changes')
    .update({
      status: newStatus,
      processed_at: new Date().toISOString(),
      affected_entry_ids: affectedEntryIds,
    })
    .eq('id', changeId);

  return {
    changeId,
    employeeId: change.employee_id as string,
    fieldName: change.field_name as string,
    effectiveDate,
    affectedEntryIds,
    requiresPayrollCorrection,
  };
}

/**
 * Listet alle offenen ELStAM-Änderungen für einen Tenant.
 */
export async function listOpenElstamChanges(tenantId: string) {
  const { data, error } = await supabase
    .from('elstam_changes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'open')
    .order('effective_date', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}
