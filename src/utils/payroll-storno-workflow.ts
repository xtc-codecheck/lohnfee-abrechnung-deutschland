/**
 * Storno- und Korrektur-Workflow (§ 41c EStG, § 28a SGB IV)
 *
 * Vollständiger Ablauf:
 *   1. Storno-Buchung:    Original-Entry wird mit negierten Werten gegengebucht
 *   2. Korrektur-Buchung: Neue Berechnung mit korrigierten Stammdaten als
 *                         eigenständige Buchung (entry_type = 'correction')
 *   3. Meldungs-Regeneration:
 *        a) Lohnsteueranmeldung (LStA) für den Zeitraum wird neu erzeugt und
 *           als is_correction = true markiert, mit replaces_id = vorherige LStA
 *        b) Beitragsnachweise (BNW) je Krankenkasse werden neu erzeugt
 *        c) Audit-Log-Eintrag
 *
 * Die ursprünglichen Meldungen bleiben erhalten (Revisionssicherheit, GoBD).
 */

import { supabase } from '@/integrations/supabase/client';
import { calculatePayrollEntry, createDefaultWorkingData } from './payroll-calculator';
import type { Employee } from '@/types/employee';
import { roundCurrency } from '@/lib/formatters';
import { recordAuditProtocol } from './gobd-audit-protocol';

export interface StornoCorrectionInput {
  originalEntryId: string;
  tenantId: string;
  employee: Employee;
  correctedGross: number;
  reason: string;
  userId?: string;
}

export interface StornoCorrectionResult {
  stornoEntryId: string;
  correctionEntryId: string;
  newLstaId?: string;
  newBnwIds: string[];
  netDifference: number;
  taxDifference: number;
  svDifference: number;
}

/**
 * Führt den vollständigen Storno + Korrektur + Meldungs-Workflow aus.
 */
export async function executeStornoAndCorrection(
  input: StornoCorrectionInput
): Promise<StornoCorrectionResult> {
  const { originalEntryId, tenantId, employee, correctedGross, reason, userId } = input;

  if (!reason?.trim()) throw new Error('Korrekturgrund ist Pflicht (§ 41c EStG).');

  // 1) Original-Entry laden
  const { data: original, error: errOrig } = await supabase
    .from('payroll_entries')
    .select('*')
    .eq('id', originalEntryId)
    .single();
  if (errOrig || !original) throw new Error(`Original-Abrechnung nicht gefunden: ${errOrig?.message}`);

  if (original.entry_type === 'storno') {
    throw new Error('Diese Abrechnung wurde bereits storniert.');
  }

  // Periode bestimmen (für Re-Aggregation)
  const { data: period } = await supabase
    .from('payroll_periods')
    .select('id, year, month')
    .eq('id', original.payroll_period_id)
    .single();
  if (!period) throw new Error('Abrechnungsperiode nicht gefunden.');

  const now = new Date().toISOString();

  // 2) Storno-Eintrag = exakte Negation des Originals
  const stornoRow = {
    tenant_id: tenantId,
    employee_id: original.employee_id,
    payroll_period_id: original.payroll_period_id,
    entry_type: 'storno',
    corrects_entry_id: original.id,
    correction_reason: `Storno: ${reason}`,
    corrected_at: now,
    corrected_by: userId ?? null,
    gross_salary: -Number(original.gross_salary),
    net_salary: -Number(original.net_salary),
    final_net_salary: -Number(original.final_net_salary),
    tax_income_tax: -Number(original.tax_income_tax ?? 0),
    tax_church: -Number(original.tax_church ?? 0),
    tax_solidarity: -Number(original.tax_solidarity ?? 0),
    tax_total: -Number(original.tax_total ?? 0),
    sv_health_employee: -Number(original.sv_health_employee ?? 0),
    sv_health_employer: -Number(original.sv_health_employer ?? 0),
    sv_pension_employee: -Number(original.sv_pension_employee ?? 0),
    sv_pension_employer: -Number(original.sv_pension_employer ?? 0),
    sv_unemployment_employee: -Number(original.sv_unemployment_employee ?? 0),
    sv_unemployment_employer: -Number(original.sv_unemployment_employer ?? 0),
    sv_care_employee: -Number(original.sv_care_employee ?? 0),
    sv_care_employer: -Number(original.sv_care_employer ?? 0),
    sv_total_employee: -Number(original.sv_total_employee ?? 0),
    sv_total_employer: -Number(original.sv_total_employer ?? 0),
    employer_costs: -Number(original.employer_costs ?? 0),
    bonus: -Number(original.bonus ?? 0),
    overtime_hours: -Number(original.overtime_hours ?? 0),
    overtime_pay: -Number(original.overtime_pay ?? 0),
    deductions: -Number(original.deductions ?? 0),
    notes: `STORNO der Abrechnung ${original.id} – ${reason}`,
  };
  const { data: stornoData, error: errStorno } = await supabase
    .from('payroll_entries')
    .insert(stornoRow as any)
    .select('id')
    .single();
  if (errStorno || !stornoData) throw new Error(`Storno fehlgeschlagen: ${errStorno?.message}`);

  // 3) Korrektur-Berechnung mit neuem Brutto
  const correctedEmployee: Employee = {
    ...employee,
    salaryData: { ...employee.salaryData, grossSalary: correctedGross },
  };
  const calc = calculatePayrollEntry({
    employee: correctedEmployee,
    period: { year: period.year, month: period.month },
    workingData: createDefaultWorkingData(correctedEmployee),
  });
  const c = calc.entry;

  const correctionRow = {
    tenant_id: tenantId,
    employee_id: original.employee_id,
    payroll_period_id: original.payroll_period_id,
    entry_type: 'correction',
    corrects_entry_id: original.id,
    correction_reason: reason,
    corrected_at: now,
    corrected_by: userId ?? null,
    gross_salary: c.salaryCalculation.grossSalary,
    net_salary: c.salaryCalculation.netSalary,
    final_net_salary: c.finalNetSalary,
    tax_income_tax: c.salaryCalculation.taxes.incomeTax,
    tax_church: c.salaryCalculation.taxes.churchTax,
    tax_solidarity: c.salaryCalculation.taxes.solidarityTax,
    tax_total: c.salaryCalculation.taxes.total,
    sv_health_employee: c.salaryCalculation.socialSecurityContributions.healthInsurance.employee,
    sv_health_employer: c.salaryCalculation.socialSecurityContributions.healthInsurance.employer,
    sv_pension_employee: c.salaryCalculation.socialSecurityContributions.pensionInsurance.employee,
    sv_pension_employer: c.salaryCalculation.socialSecurityContributions.pensionInsurance.employer,
    sv_unemployment_employee: c.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employee,
    sv_unemployment_employer: c.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employer,
    sv_care_employee: c.salaryCalculation.socialSecurityContributions.careInsurance.employee,
    sv_care_employer: c.salaryCalculation.socialSecurityContributions.careInsurance.employer,
    sv_total_employee: c.salaryCalculation.socialSecurityContributions.total.employee,
    sv_total_employer: c.salaryCalculation.socialSecurityContributions.total.employer,
    employer_costs: c.salaryCalculation.employerCosts,
    bonus: c.additions.bonuses,
    overtime_hours: c.workingData.overtimeHours,
    overtime_pay: c.additions.overtimePay,
    deductions: c.deductions.total,
    notes: `KORREKTUR zu ${original.id} – ${reason}`,
  };
  const { data: corrData, error: errCorr } = await supabase
    .from('payroll_entries')
    .insert(correctionRow as any)
    .select('id')
    .single();
  if (errCorr || !corrData) throw new Error(`Korrektur fehlgeschlagen: ${errCorr?.message}`);

  // GoBD-Prüfprotokoll: Storno-Eintrag (am Original)
  try {
    await recordAuditProtocol({
      tenantId,
      payrollEntry: {
        ...(c as any),
        id: original.id,
        employeeId: original.employee_id,
      } as any,
      employee,
      eventType: 'storno',
      userId,
      notes: `Storno wegen: ${reason}`,
    });
    // GoBD-Prüfprotokoll: Korrektur-Eintrag (auf neuer Buchung)
    await recordAuditProtocol({
      tenantId,
      payrollEntry: {
        ...(c as any),
        id: corrData.id,
        employeeId: original.employee_id,
      } as any,
      employee: correctedEmployee,
      eventType: 'corrected',
      userId,
      notes: `Korrektur zu ${original.id}: ${reason}`,
    });
  } catch (e) {
    console.warn('Audit-Protokoll nach Storno/Korrektur fehlgeschlagen:', e);
  }

  // 4) Meldungen für die Periode regenerieren (LStA + BNW)
  const newLstaId = await regenerateLsta(tenantId, period.year, period.month, userId);
  const newBnwIds = await regenerateBeitragsnachweise(tenantId, period.year, period.month);

  return {
    stornoEntryId: stornoData.id,
    correctionEntryId: corrData.id,
    newLstaId,
    newBnwIds,
    netDifference: roundCurrency(c.finalNetSalary - Number(original.final_net_salary)),
    taxDifference: roundCurrency(c.salaryCalculation.taxes.total - Number(original.tax_total ?? 0)),
    svDifference: roundCurrency(
      c.salaryCalculation.socialSecurityContributions.total.employee - Number(original.sv_total_employee ?? 0)
    ),
  };
}

/**
 * Regeneriert die Lohnsteueranmeldung für Jahr/Monat aus allen aktiven
 * payroll_entries (regular + correction − storno = Saldo).
 */
async function regenerateLsta(
  tenantId: string,
  year: number,
  month: number,
  userId?: string
): Promise<string | undefined> {
  // Periode finden
  const { data: per } = await supabase
    .from('payroll_periods')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();
  if (!per) return undefined;

  const { data: entries } = await supabase
    .from('payroll_entries')
    .select('employee_id, tax_income_tax, tax_church, tax_solidarity')
    .eq('payroll_period_id', per.id);

  const sumLst = roundCurrency((entries ?? []).reduce((s, e) => s + Number(e.tax_income_tax ?? 0), 0));
  const sumKist = roundCurrency((entries ?? []).reduce((s, e) => s + Number(e.tax_church ?? 0), 0));
  const sumSoli = roundCurrency((entries ?? []).reduce((s, e) => s + Number(e.tax_solidarity ?? 0), 0));
  const total = roundCurrency(sumLst + sumKist + sumSoli);
  const employeeCount = new Set((entries ?? []).map(e => e.employee_id)).size;

  // Vorherige LStA als zu ersetzende Meldung markieren
  const { data: prev } = await supabase
    .from('lohnsteueranmeldungen')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('year', year)
    .eq('month', month)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: ins, error } = await supabase
    .from('lohnsteueranmeldungen')
    .insert({
      tenant_id: tenantId,
      year,
      month,
      anmeldezeitraum: 'monatlich',
      summe_lohnsteuer: sumLst,
      summe_kirchensteuer_rk: sumKist,
      summe_kirchensteuer_ev: 0,
      summe_solidaritaetszuschlag: sumSoli,
      summe_pauschale_lohnsteuer: 0,
      gesamtbetrag: total,
      anzahl_arbeitnehmer: employeeCount,
      status: 'entwurf',
      is_correction: true,
      replaces_id: prev?.id ?? null,
      korrektur_von: prev?.id ?? null,
      created_by: userId ?? null,
    } as any)
    .select('id')
    .single();
  if (error) {
    console.warn('LStA-Regeneration fehlgeschlagen:', error.message);
    return undefined;
  }
  return ins?.id;
}

/**
 * Regeneriert Beitragsnachweise je Krankenkasse aus den aktuellen Salden.
 * Vereinfachte Aggregation pro KK – produktiv wird je BBNR/Beitragsgruppe gesplittet.
 */
async function regenerateBeitragsnachweise(
  tenantId: string,
  year: number,
  month: number
): Promise<string[]> {
  const { data: per } = await supabase
    .from('payroll_periods')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();
  if (!per) return [];

  const { data: entries } = await supabase
    .from('payroll_entries')
    .select('employee_id, sv_health_employee, sv_health_employer, sv_pension_employee, sv_pension_employer, sv_unemployment_employee, sv_unemployment_employer, sv_care_employee, sv_care_employer')
    .eq('payroll_period_id', per.id);

  // Mitarbeiter→Krankenkasse-Mapping
  const empIds = Array.from(new Set((entries ?? []).map(e => e.employee_id)));
  if (empIds.length === 0) return [];
  const { data: emps } = await supabase
    .from('employees')
    .select('id, health_insurance')
    .in('id', empIds);
  const kkByEmp = new Map((emps ?? []).map(e => [e.id, e.health_insurance ?? 'Unbekannt']));

  // Aggregation pro KK
  const byKk = new Map<string, any>();
  for (const e of entries ?? []) {
    const kk = kkByEmp.get(e.employee_id) ?? 'Unbekannt';
    const cur = byKk.get(kk) ?? {
      kv_an: 0, kv_ag: 0, rv_an: 0, rv_ag: 0, av_an: 0, av_ag: 0, pv_an: 0, pv_ag: 0, count: new Set<string>(),
    };
    cur.kv_an += Number(e.sv_health_employee ?? 0);
    cur.kv_ag += Number(e.sv_health_employer ?? 0);
    cur.rv_an += Number(e.sv_pension_employee ?? 0);
    cur.rv_ag += Number(e.sv_pension_employer ?? 0);
    cur.av_an += Number(e.sv_unemployment_employee ?? 0);
    cur.av_ag += Number(e.sv_unemployment_employer ?? 0);
    cur.pv_an += Number(e.sv_care_employee ?? 0);
    cur.pv_ag += Number(e.sv_care_employer ?? 0);
    cur.count.add(e.employee_id);
    byKk.set(kk, cur);
  }

  const newIds: string[] = [];
  for (const [kk, agg] of byKk.entries()) {
    const total = roundCurrency(
      agg.kv_an + agg.kv_ag + agg.rv_an + agg.rv_ag + agg.av_an + agg.av_ag + agg.pv_an + agg.pv_ag
    );
    const { data: prev } = await supabase
      .from('beitragsnachweise')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('year', year)
      .eq('month', month)
      .eq('krankenkasse', kk)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: ins, error } = await supabase
      .from('beitragsnachweise')
      .insert({
        tenant_id: tenantId,
        year, month,
        krankenkasse: kk,
        anzahl_versicherte: agg.count.size,
        kv_an: roundCurrency(agg.kv_an), kv_ag: roundCurrency(agg.kv_ag),
        rv_an: roundCurrency(agg.rv_an), rv_ag: roundCurrency(agg.rv_ag),
        av_an: roundCurrency(agg.av_an), av_ag: roundCurrency(agg.av_ag),
        pv_an: roundCurrency(agg.pv_an), pv_ag: roundCurrency(agg.pv_ag),
        gesamtbetrag: total,
        status: 'entwurf',
        is_correction: true,
        replaces_id: prev?.id ?? null,
      } as any)
      .select('id')
      .single();
    if (!error && ins) newIds.push(ins.id);
  }
  return newIds;
}