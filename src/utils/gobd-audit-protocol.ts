/**
 * GoBD-konformes Prüfprotokoll je Lohnabrechnung
 *
 * Speichert pro Abrechnung versionierte, manipulationssichere Snapshots:
 *   - Stammdaten-Stand (Mitarbeiter)
 *   - Vollständige Berechnungsergebnisse
 *   - Berechnungsschritte mit angewendeten Konstanten
 *   - Nachweise aller Exporte (DATEV, ELSTER, PDF)
 *
 * Jede Version hat einen SHA-256 Content-Hash. UPDATE/DELETE sind durch
 * RLS gesperrt → reine Append-Only-Historie (GoBD §§ 146, 147 AO).
 */

import { supabase } from '@/integrations/supabase/client';
import type { PayrollEntry } from '@/types/payroll';
import type { Employee } from '@/types/employee';

export type AuditEventType = 'created' | 'recalculated' | 'corrected' | 'storno' | 'export';

export interface ExportRecord {
  type: 'DATEV' | 'ELSTER_LSTA' | 'ELSTER_LSTB' | 'BNW' | 'PDF' | 'GOBD' | 'OTHER';
  format: string;
  filename?: string;
  fileHash?: string;
  recordCount?: number;
  ticketId?: string;
  exportedAt: string;
  exportedBy?: string;
}

export interface AuditProtocol {
  id: string;
  payrollEntryId: string;
  employeeId: string;
  periodYear: number;
  periodMonth: number;
  version: number;
  eventType: AuditEventType;
  contentHash: string;
  createdAt: string;
  createdBy?: string;
  snapshotEmployee: Record<string, unknown>;
  snapshotCalculation: Record<string, unknown>;
  calculationSteps: unknown[];
  exports: ExportRecord[];
  appliedConstants: Record<string, unknown>;
  warnings: string[];
  notes?: string;
}

/** SHA-256 über kanonisches JSON */
async function sha256(value: unknown): Promise<string> {
  const json = canonicalJson(value);
  const buf = new TextEncoder().encode(json);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Stable JSON: Schlüssel sortiert, damit Hash deterministisch ist. */
function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJson(obj[k])).join(',') + '}';
}

function pickEmployeeSnapshot(e: Employee): Record<string, unknown> {
  const pd = e.personalData;
  const ed = e.employmentData;
  return {
    id: e.id,
    personalNumber: (e as any).personalNumber ?? (pd as any)?.personalNumber,
    firstName: pd?.firstName,
    lastName: pd?.lastName,
    dateOfBirth: pd?.dateOfBirth,
    address: pd?.address,
    state: pd?.address?.state,
    taxClass: pd?.taxClass,
    churchTax: pd?.churchTax,
    churchTaxRate: pd?.churchTaxRate,
    childAllowances: pd?.childAllowances,
    numberOfChildren: pd?.numberOfChildren,
    taxId: pd?.taxId,
    healthInsurance: pd?.healthInsurance,
    svNumber: pd?.socialSecurityNumber,
    employmentType: ed?.employmentType,
    weeklyHours: ed?.weeklyHours,
    startDate: ed?.startDate,
    endDate: ed?.endDate,
    grossSalary: e.salaryData?.grossSalary,
  };
}

function pickCalculationSnapshot(p: PayrollEntry): Record<string, unknown> {
  return {
    grossSalary: p.salaryCalculation.grossSalary,
    netSalary: p.salaryCalculation.netSalary,
    finalNetSalary: p.finalNetSalary,
    taxes: p.salaryCalculation.taxes,
    socialSecurity: p.salaryCalculation.socialSecurityContributions,
    employerCosts: p.salaryCalculation.employerCosts,
    additions: p.additions,
    deductions: p.deductions,
    workingData: p.workingData,
  };
}

/**
 * Erzeugt eine neue Protokoll-Version für eine Abrechnung.
 * Wird beim Speichern, Neuberechnen oder Korrigieren aufgerufen.
 */
export async function recordAuditProtocol(params: {
  tenantId: string;
  payrollEntry: PayrollEntry;
  employee: Employee;
  eventType?: AuditEventType;
  appliedConstants?: Record<string, unknown>;
  calculationSteps?: unknown[];
  warnings?: string[];
  userId?: string;
  notes?: string;
}): Promise<AuditProtocol | null> {
  const {
    tenantId, payrollEntry, employee,
    eventType = 'created',
    appliedConstants = {},
    calculationSteps = [],
    warnings = [],
    userId, notes,
  } = params;

  if (!payrollEntry.id) return null;

  // Nächste Version bestimmen
  const { data: prev } = await supabase
    .from('payroll_audit_protocols' as any)
    .select('version, exports')
    .eq('payroll_entry_id', payrollEntry.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((prev as any)?.version ?? 0) + 1;
  const carriedExports = (prev as any)?.exports ?? [];

  const snapshotEmployee = pickEmployeeSnapshot(employee);
  const snapshotCalculation = pickCalculationSnapshot(payrollEntry);

  const payload = {
    tenant_id: tenantId,
    payroll_entry_id: payrollEntry.id,
    employee_id: payrollEntry.employeeId,
    period_year: (payrollEntry as any).year ?? new Date().getFullYear(),
    period_month: (payrollEntry as any).month ?? new Date().getMonth() + 1,
    version: nextVersion,
    event_type: eventType,
    snapshot_employee: snapshotEmployee,
    snapshot_calculation: snapshotCalculation,
    calculation_steps: calculationSteps,
    exports: carriedExports,
    applied_constants: appliedConstants,
    warnings,
    created_by: userId ?? null,
    notes: notes ?? null,
  };

  const contentHash = await sha256({
    snapshotEmployee,
    snapshotCalculation,
    calculationSteps,
    appliedConstants,
    version: nextVersion,
    eventType,
  });

  const { data, error } = await supabase
    .from('payroll_audit_protocols' as any)
    .insert({ ...payload, content_hash: contentHash } as any)
    .select('*')
    .single();

  if (error) {
    console.warn('Audit-Protokoll konnte nicht gespeichert werden:', error.message);
    return null;
  }
  return mapRow(data);
}

/**
 * Hängt einen Export-Nachweis an die jüngste Version an, indem eine neue
 * Version mit Event-Type 'export' erzeugt wird (Append-Only).
 */
export async function recordExportProof(params: {
  tenantId: string;
  payrollEntryId: string;
  exportRecord: ExportRecord;
  userId?: string;
}): Promise<AuditProtocol | null> {
  const { tenantId, payrollEntryId, exportRecord, userId } = params;

  const { data: prev } = await supabase
    .from('payroll_audit_protocols' as any)
    .select('*')
    .eq('payroll_entry_id', payrollEntryId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prev) return null;
  const p: any = prev;
  const nextVersion = (p.version ?? 0) + 1;
  const newExports: ExportRecord[] = [...(p.exports ?? []), exportRecord];

  const contentHash = await sha256({
    snapshotEmployee: p.snapshot_employee,
    snapshotCalculation: p.snapshot_calculation,
    calculationSteps: p.calculation_steps,
    appliedConstants: p.applied_constants,
    exports: newExports,
    version: nextVersion,
    eventType: 'export',
  });

  const { data, error } = await supabase
    .from('payroll_audit_protocols' as any)
    .insert({
      tenant_id: tenantId,
      payroll_entry_id: payrollEntryId,
      employee_id: p.employee_id,
      period_year: p.period_year,
      period_month: p.period_month,
      version: nextVersion,
      event_type: 'export',
      snapshot_employee: p.snapshot_employee,
      snapshot_calculation: p.snapshot_calculation,
      calculation_steps: p.calculation_steps,
      exports: newExports,
      applied_constants: p.applied_constants,
      warnings: p.warnings ?? [],
      content_hash: contentHash,
      created_by: userId ?? null,
      notes: `Export: ${exportRecord.type} (${exportRecord.format})`,
    } as any)
    .select('*')
    .single();

  if (error) {
    console.warn('Export-Nachweis konnte nicht gespeichert werden:', error.message);
    return null;
  }
  return mapRow(data);
}

/** Liefert alle Versionen einer Abrechnung, neueste zuerst. */
export async function getAuditProtocolHistory(payrollEntryId: string): Promise<AuditProtocol[]> {
  const { data, error } = await supabase
    .from('payroll_audit_protocols' as any)
    .select('*')
    .eq('payroll_entry_id', payrollEntryId)
    .order('version', { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapRow);
}

/** Verifiziert, dass der gespeicherte Hash zum Inhalt passt. */
export async function verifyProtocolHash(p: AuditProtocol): Promise<boolean> {
  const recomputed = await sha256({
    snapshotEmployee: p.snapshotEmployee,
    snapshotCalculation: p.snapshotCalculation,
    calculationSteps: p.calculationSteps,
    appliedConstants: p.appliedConstants,
    ...(p.eventType === 'export' ? { exports: p.exports } : {}),
    version: p.version,
    eventType: p.eventType,
  });
  return recomputed === p.contentHash;
}

function mapRow(row: any): AuditProtocol {
  return {
    id: row.id,
    payrollEntryId: row.payroll_entry_id,
    employeeId: row.employee_id,
    periodYear: row.period_year,
    periodMonth: row.period_month,
    version: row.version,
    eventType: row.event_type,
    contentHash: row.content_hash,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
    snapshotEmployee: row.snapshot_employee ?? {},
    snapshotCalculation: row.snapshot_calculation ?? {},
    calculationSteps: row.calculation_steps ?? [],
    exports: row.exports ?? [],
    appliedConstants: row.applied_constants ?? {},
    warnings: row.warnings ?? [],
    notes: row.notes ?? undefined,
  };
}