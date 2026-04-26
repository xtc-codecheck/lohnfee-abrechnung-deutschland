/**
 * Lohnkonto-Komponente gemäß § 41 EStG
 * 
 * Das Lohnkonto ist ein gesetzlich vorgeschriebenes Dokument, das für jeden
 * Arbeitnehmer die laufenden Bezüge und Abzüge kumuliert über das Kalenderjahr
 * aufzeichnet. Es dient als Grundlage für:
 * - Die elektronische Lohnsteuerbescheinigung (§ 41b EStG)
 * - Betriebsprüfungen durch das Finanzamt
 * - Sozialversicherungsprüfungen
 * 
 * Pflichtinhalte nach § 41 Abs. 1 EStG:
 * - Steuerklasse, Kinderfreibeträge, Religion
 * - Bruttolohn, Lohnsteuer, Soli, KiSt
 * - SV-Beiträge (AN- und AG-Anteile)
 * - Nettolohn
 * - Kumulierte Jahreswerte
 */

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, FileText, Download, Loader2, ChevronRight, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { HELP } from '@/constants/help-glossary';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/contexts/employee-context';
import { Tables } from '@/integrations/supabase/types';
import type { WageTypeLineItem } from '@/utils/wage-types-integration';
import { CATEGORY_LABELS, type WageTypeCategory } from '@/types/wage-types';
import { cn } from '@/lib/utils';

type DbEntry = Tables<'payroll_entries'>;
type DbPeriod = Tables<'payroll_periods'>;

interface LohnkontoRow {
  month: number;
  monthName: string;
  grossSalary: number;
  incomeTax: number;
  solidarityTax: number;
  churchTax: number;
  totalTax: number;
  svHealthEmployee: number;
  svPensionEmployee: number;
  svUnemploymentEmployee: number;
  svCareEmployee: number;
  svTotalEmployee: number;
  svHealthEmployer: number;
  svPensionEmployer: number;
  svUnemploymentEmployer: number;
  svCareEmployer: number;
  svTotalEmployer: number;
  netSalary: number;
  bonus: number;
  deductions: number;
  finalNetSalary: number;
  wageTypeLineItems?: WageTypeLineItem[];
}

interface LohnkontoSummary {
  rows: LohnkontoRow[];
  cumulative: LohnkontoRow; // Jahressummen
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

interface LohnkontoPageProps {
  onBack: () => void;
}

export function LohnkontoPage({ onBack }: LohnkontoPageProps) {
  const { employees } = useEmployees();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [entries, setEntries] = useState<DbEntry[]>([]);
  const [periods, setPeriods] = useState<DbPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openMonths, setOpenMonths] = useState<Set<number>>(new Set());

  const toggleMonth = (month: number) => {
    setOpenMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month); else next.add(month);
      return next;
    });
  };

  // Lade Daten wenn Mitarbeiter oder Jahr sich ändern
  useEffect(() => {
    if (!selectedEmployeeId) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Lade Abrechnungsperioden für das Jahr
      const { data: periodData } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('year', selectedYear)
        .order('month');

      const yearPeriods = periodData ?? [];
      setPeriods(yearPeriods);

      if (yearPeriods.length > 0) {
        const periodIds = yearPeriods.map(p => p.id);
        const { data: entryData } = await supabase
          .from('payroll_entries')
          .select('*')
          .eq('employee_id', selectedEmployeeId)
          .in('payroll_period_id', periodIds);

        setEntries(entryData ?? []);
      } else {
        setEntries([]);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [selectedEmployeeId, selectedYear]);

  // Berechne Lohnkonto-Daten
  const lohnkonto = useMemo((): LohnkontoSummary => {
    const rows: LohnkontoRow[] = [];
    const cumulative: LohnkontoRow = {
      month: 0, monthName: 'JAHRESSUMME',
      grossSalary: 0, incomeTax: 0, solidarityTax: 0, churchTax: 0, totalTax: 0,
      svHealthEmployee: 0, svPensionEmployee: 0, svUnemploymentEmployee: 0, svCareEmployee: 0, svTotalEmployee: 0,
      svHealthEmployer: 0, svPensionEmployer: 0, svUnemploymentEmployer: 0, svCareEmployer: 0, svTotalEmployer: 0,
      netSalary: 0, bonus: 0, deductions: 0, finalNetSalary: 0,
    };

    for (let month = 1; month <= 12; month++) {
      const period = periods.find(p => p.month === month);
      const entry = period ? entries.find(e => e.payroll_period_id === period.id) : null;

      if (entry) {
        // Lohnarten aus audit_data extrahieren (P4-Persistierung)
        let wageTypeLineItems: WageTypeLineItem[] | undefined;
        const auditData = entry.audit_data;
        if (auditData && typeof auditData === 'object' && !Array.isArray(auditData)) {
          const items = (auditData as { wageTypeLineItems?: unknown }).wageTypeLineItems;
          if (Array.isArray(items) && items.length > 0) {
            wageTypeLineItems = items as WageTypeLineItem[];
          }
        }

        const row: LohnkontoRow = {
          month,
          monthName: MONTH_NAMES[month - 1],
          grossSalary: Number(entry.gross_salary),
          incomeTax: Number(entry.tax_income_tax ?? 0),
          solidarityTax: Number(entry.tax_solidarity ?? 0),
          churchTax: Number(entry.tax_church ?? 0),
          totalTax: Number(entry.tax_total ?? 0),
          svHealthEmployee: Number(entry.sv_health_employee ?? 0),
          svPensionEmployee: Number(entry.sv_pension_employee ?? 0),
          svUnemploymentEmployee: Number(entry.sv_unemployment_employee ?? 0),
          svCareEmployee: Number(entry.sv_care_employee ?? 0),
          svTotalEmployee: Number(entry.sv_total_employee ?? 0),
          svHealthEmployer: Number(entry.sv_health_employer ?? 0),
          svPensionEmployer: Number(entry.sv_pension_employer ?? 0),
          svUnemploymentEmployer: Number(entry.sv_unemployment_employer ?? 0),
          svCareEmployer: Number(entry.sv_care_employer ?? 0),
          svTotalEmployer: Number(entry.sv_total_employer ?? 0),
          netSalary: Number(entry.net_salary),
          bonus: Number(entry.bonus ?? 0),
          deductions: Number(entry.deductions ?? 0),
          finalNetSalary: Number(entry.final_net_salary),
          wageTypeLineItems,
        };
        rows.push(row);

        // Kumulieren
        Object.keys(cumulative).forEach(key => {
          if (key !== 'month' && key !== 'monthName') {
            (cumulative as any)[key] += (row as any)[key];
          }
        });
      } else {
        rows.push({
          month, monthName: MONTH_NAMES[month - 1],
          grossSalary: 0, incomeTax: 0, solidarityTax: 0, churchTax: 0, totalTax: 0,
          svHealthEmployee: 0, svPensionEmployee: 0, svUnemploymentEmployee: 0, svCareEmployee: 0, svTotalEmployee: 0,
          svHealthEmployer: 0, svPensionEmployer: 0, svUnemploymentEmployer: 0, svCareEmployer: 0, svTotalEmployer: 0,
          netSalary: 0, bonus: 0, deductions: 0, finalNetSalary: 0,
        });
      }
    }

    return { rows, cumulative };
  }, [entries, periods]);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const fmt = (v: number) => v.toFixed(2).replace('.', ',') + ' €';
  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Lohnkonto (§ 41 EStG)" description="Fortlaufendes Lohnkonto pro Mitarbeiter und Jahr" onBack={onBack} />

      {/* Filter */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Mitarbeiter auswählen" />
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.personalData.lastName}, {emp.personalData.firstName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedEmployeeId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Bitte wählen Sie einen Mitarbeiter aus, um das Lohnkonto anzuzeigen.</p>
          </CardContent>
        </Card>
      )}

      {selectedEmployeeId && isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {selectedEmployeeId && !isLoading && (
        <>
          {/* Mitarbeiter-Stammdaten */}
          {selectedEmployee && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Lohnkonto {selectedYear} — {selectedEmployee.personalData.lastName}, {selectedEmployee.personalData.firstName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Steuerklasse:</span> <strong>{selectedEmployee.personalData.taxClass}</strong></div>
                  <div><span className="text-muted-foreground">Kinderfreibeträge:</span> <strong>{selectedEmployee.personalData.childAllowances}</strong></div>
                  <div><span className="text-muted-foreground">Kirchensteuer:</span> <strong>{selectedEmployee.personalData.churchTax ? 'Ja' : 'Nein'}</strong></div>
                  <div><span className="text-muted-foreground">SV-Nummer:</span> <strong>{selectedEmployee.personalData.socialSecurityNumber || '—'}</strong></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Haupttabelle */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card z-10 w-8 p-0" />
                      <TableHead className="sticky left-0 bg-card z-10">Monat</TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          Brutto
                          <HelpTooltip content={HELP.grossSalary.help} example={HELP.grossSalary.example} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          LSt
                          <HelpTooltip content={HELP.lohnsteuer.help} example={HELP.lohnsteuer.example} hint={HELP.lohnsteuer.hint} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          Soli
                          <HelpTooltip content={HELP.solidaritaetszuschlag.help} example={HELP.solidaritaetszuschlag.example} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          KiSt
                          <HelpTooltip content={HELP.kirchensteuer.help} example={HELP.kirchensteuer.example} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">∑ Steuer</TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          KV-AN
                          <HelpTooltip content={HELP.kvBeitrag.help} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          RV-AN
                          <HelpTooltip content={HELP.rvBeitrag.help} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          AV-AN
                          <HelpTooltip content={HELP.avBeitrag.help} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          PV-AN
                          <HelpTooltip content={HELP.pvBeitrag.help} example={HELP.pvBeitrag.example} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          ∑ SV-AN
                          <HelpTooltip content={HELP.beitragsbemessungsgrenze.help} example={HELP.beitragsbemessungsgrenze.example} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">Netto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lohnkonto.rows.map(row => {
                      const hasItems = !!row.wageTypeLineItems && row.wageTypeLineItems.length > 0;
                      const isOpen = openMonths.has(row.month);
                      return (
                        <>
                          <TableRow
                            key={`m-${row.month}`}
                            className={cn(row.grossSalary === 0 ? 'opacity-40' : '', hasItems && 'cursor-pointer hover:bg-muted/30')}
                            onClick={() => hasItems && toggleMonth(row.month)}
                          >
                            <TableCell className="sticky left-0 bg-card z-10 w-8 p-0 align-middle">
                              {hasItems ? (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleMonth(row.month); }}
                                  className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
                                  aria-label={isOpen ? `Lohnarten ${row.monthName} zuklappen` : `Lohnarten ${row.monthName} aufklappen`}
                                  aria-expanded={isOpen}
                                >
                                  <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
                                </button>
                              ) : null}
                            </TableCell>
                            <TableCell className="sticky left-0 bg-card z-10 font-medium">
                              <span className="inline-flex items-center gap-2">
                                {row.monthName}
                                {hasItems && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                    {row.wageTypeLineItems!.length} LA
                                  </Badge>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(row.grossSalary)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(row.incomeTax)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(row.solidarityTax)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(row.churchTax)}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium">{fmt(row.totalTax)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(row.svHealthEmployee)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(row.svPensionEmployee)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(row.svUnemploymentEmployee)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(row.svCareEmployee)}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium">{fmt(row.svTotalEmployee)}</TableCell>
                            <TableCell className="text-right tabular-nums font-bold">{fmt(row.finalNetSalary)}</TableCell>
                          </TableRow>
                          {hasItems && isOpen && (
                            <TableRow key={`m-${row.month}-items`} className="bg-muted/20 hover:bg-muted/20">
                              <TableCell colSpan={13} className="p-0">
                                <WageTypeBreakdown items={row.wageTypeLineItems!} fmt={fmt} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                    {/* Jahressumme */}
                    <TableRow className="border-t-2 border-foreground bg-muted/50 font-bold">
                      <TableCell className="sticky left-0 bg-muted/50 z-10 w-8 p-0" />
                      <TableCell className="sticky left-0 bg-muted/50 z-10">JAHRESSUMME</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.grossSalary)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.incomeTax)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.solidarityTax)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.churchTax)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.totalTax)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svHealthEmployee)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svPensionEmployee)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svUnemploymentEmployee)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svCareEmployee)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svTotalEmployee)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.finalNetSalary)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* AG-Anteile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arbeitgeberanteile Sozialversicherung</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card z-10">Monat</TableHead>
                      <TableHead className="text-right">KV-AG</TableHead>
                      <TableHead className="text-right">RV-AG</TableHead>
                      <TableHead className="text-right">AV-AG</TableHead>
                      <TableHead className="text-right">PV-AG</TableHead>
                      <TableHead className="text-right">∑ SV-AG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lohnkonto.rows.filter(r => r.grossSalary > 0).map(row => (
                      <TableRow key={row.month}>
                        <TableCell className="sticky left-0 bg-card z-10 font-medium">{row.monthName}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(row.svHealthEmployer)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(row.svPensionEmployer)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(row.svUnemploymentEmployer)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(row.svCareEmployer)}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{fmt(row.svTotalEmployer)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 border-foreground bg-muted/50 font-bold">
                      <TableCell className="sticky left-0 bg-muted/50 z-10">JAHRESSUMME</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svHealthEmployer)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svPensionEmployer)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svUnemploymentEmployer)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svCareEmployer)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(lohnkonto.cumulative.svTotalEmployer)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aufklappbare Lohnarten-Übersicht je Monat
// ---------------------------------------------------------------------------

const EFFECT_LABEL: Record<WageTypeLineItem['effect'], string> = {
  gross_taxable: 'Brutto (st./SV-pfl.)',
  net_taxfree: 'Netto (steuerfrei)',
  in_kind: 'Sachbezug',
  net_deduction: 'Netto-Abzug',
  pauschal: 'Pauschalsteuer',
};

const EFFECT_VARIANT: Record<WageTypeLineItem['effect'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  gross_taxable: 'default',
  net_taxfree: 'secondary',
  in_kind: 'outline',
  net_deduction: 'destructive',
  pauschal: 'outline',
};

interface WageTypeBreakdownProps {
  items: WageTypeLineItem[];
  fmt: (v: number) => string;
}

function WageTypeBreakdown({ items, fmt }: WageTypeBreakdownProps) {
  const visible = items.filter(li => li.amount !== 0 || (li.pauschalTaxAmount ?? 0) > 0);
  if (visible.length === 0) {
    return (
      <div className="px-6 py-3 text-xs text-muted-foreground inline-flex items-center gap-2">
        <Receipt className="h-3.5 w-3.5" />
        Keine wirksamen Lohnarten in diesem Monat.
      </div>
    );
  }
  return (
    <div className="px-6 py-3">
      <div className="text-xs font-semibold text-muted-foreground mb-2 inline-flex items-center gap-1.5">
        <Receipt className="h-3.5 w-3.5" />
        Angewandte Lohnarten ({visible.length})
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-xs">Code</TableHead>
              <TableHead className="h-8 text-xs">Name</TableHead>
              <TableHead className="h-8 text-xs">Kategorie</TableHead>
              <TableHead className="h-8 text-xs">Effekt</TableHead>
              <TableHead className="h-8 text-xs text-right">Betrag</TableHead>
              <TableHead className="h-8 text-xs text-right">Pausch.LSt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((li, i) => {
              const sign = (li.effect === 'net_deduction' || li.effect === 'in_kind') ? '−' : '';
              return (
                <TableRow key={`${li.code}-${i}`} className="hover:bg-muted/30">
                  <TableCell className="py-1.5 font-mono text-xs">{li.code}</TableCell>
                  <TableCell className="py-1.5 text-xs">{li.name}</TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {CATEGORY_LABELS[li.category as WageTypeCategory] ?? li.category}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Badge variant={EFFECT_VARIANT[li.effect]} className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      {EFFECT_LABEL[li.effect] ?? li.effect}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1.5 text-right tabular-nums text-xs font-medium">
                    {sign}{fmt(li.amount)}
                  </TableCell>
                  <TableCell className="py-1.5 text-right tabular-nums text-xs text-muted-foreground">
                    {li.pauschalTaxAmount && li.pauschalTaxAmount > 0
                      ? `${li.pauschalTaxRate ?? ''}% · ${fmt(li.pauschalTaxAmount)}`
                      : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
