/**
 * Elektronische Lohnsteuerbescheinigung (eLStB)
 * Jährliche Bescheinigung gem. § 41b EStG
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader2, FileText, Download, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/contexts/employee-context';
import { useTenant } from '@/contexts/tenant-context';

interface LohnsteuerbescheinigungPageProps {
  onBack: () => void;
}

export function LohnsteuerbescheinigungPage({ onBack }: LohnsteuerbescheinigungPageProps) {
  const { employees } = useEmployees();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [bescheinigungen, setBescheinigungen] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const fetchBescheinigungen = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('lohnsteuerbescheinigungen')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('year', selectedYear)
      .order('created_at', { ascending: false });
    setBescheinigungen(data ?? []);
    setIsLoading(false);
  }, [selectedYear, tenantId]);

  useEffect(() => { fetchBescheinigungen(); }, [fetchBescheinigungen]);

  const fmt = (v: number) => Number(v).toFixed(2).replace('.', ',') + ' €';

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.personalData.lastName}, ${emp.personalData.firstName}` : empId.slice(0, 8);
  };

  const handleGenerateAll = async () => {
    if (!tenantId) return;
    setGenerating(true);

    const { data: periods } = await supabase
      .from('payroll_periods')
      .select('id')
      .eq('year', selectedYear)
      .eq('tenant_id', tenantId);

    if (!periods?.length) {
      toast({ title: 'Keine Daten', description: `Keine Abrechnungen für ${selectedYear}.`, variant: 'destructive' });
      setGenerating(false);
      return;
    }

    const periodIds = periods.map(p => p.id);

    const { data: entries } = await supabase
      .from('payroll_entries')
      .select('*')
      .in('payroll_period_id', periodIds)
      .eq('tenant_id', tenantId);

    if (!entries?.length) {
      toast({ title: 'Keine Einträge', description: 'Keine Abrechnungseinträge vorhanden.', variant: 'destructive' });
      setGenerating(false);
      return;
    }

    // Gruppiere nach Mitarbeiter
    const empMap = new Map<string, typeof entries>();
    for (const entry of entries) {
      if (!empMap.has(entry.employee_id)) empMap.set(entry.employee_id, []);
      empMap.get(entry.employee_id)!.push(entry);
    }

    let created = 0;
    for (const [empId, empEntries] of empMap) {
      const emp = employees.find(e => e.id === empId);

      const bescheinigung = {
        employee_id: empId,
        year: selectedYear,
        tenant_id: tenantId,
        zeile_3_bruttolohn: empEntries.reduce((s, e) => s + Number(e.gross_salary), 0),
        zeile_4_lst: empEntries.reduce((s, e) => s + Number(e.tax_income_tax ?? 0), 0),
        zeile_5_soli: empEntries.reduce((s, e) => s + Number(e.tax_solidarity ?? 0), 0),
        zeile_6_kist: empEntries.reduce((s, e) => s + Number(e.tax_church ?? 0), 0),
        zeile_22a_arbeitnehmeranteil_rv: empEntries.reduce((s, e) => s + Number(e.sv_pension_employee ?? 0), 0),
        zeile_22b_arbeitgeberanteil_rv: empEntries.reduce((s, e) => s + Number(e.sv_pension_employer ?? 0), 0),
        zeile_23a_arbeitnehmeranteil_kv: empEntries.reduce((s, e) => s + Number(e.sv_health_employee ?? 0), 0),
        zeile_23b_arbeitgeberanteil_kv: empEntries.reduce((s, e) => s + Number(e.sv_health_employer ?? 0), 0),
        zeile_24a_arbeitnehmeranteil_av: empEntries.reduce((s, e) => s + Number(e.sv_unemployment_employee ?? 0), 0),
        zeile_24b_arbeitgeberanteil_av: empEntries.reduce((s, e) => s + Number(e.sv_unemployment_employer ?? 0), 0),
        zeile_25_arbeitnehmeranteil_pv: empEntries.reduce((s, e) => s + Number(e.sv_care_employee ?? 0), 0),
        zeile_26_arbeitgeberanteil_pv: empEntries.reduce((s, e) => s + Number(e.sv_care_employer ?? 0), 0),
        steuerklasse: String(emp?.personalData.taxClass ?? 'I'),
        kinderfreibetraege: emp?.personalData.childAllowances ?? 0,
        zeitraum_von: `${selectedYear}-01-01`,
        zeitraum_bis: `${selectedYear}-12-31`,
        status: 'entwurf',
      };

      const { error } = await supabase
        .from('lohnsteuerbescheinigungen')
        .upsert(bescheinigung, { onConflict: 'employee_id,year' });

      if (!error) created++;
    }

    toast({ title: 'Bescheinigungen generiert', description: `${created} eLStB für ${selectedYear} erstellt.` });
    setGenerating(false);
    fetchBescheinigungen();
  };

  const handleSubmit = async (id: string) => {
    await supabase.from('lohnsteuerbescheinigungen').update({
      status: 'uebermittelt',
      uebermittelt_am: new Date().toISOString(),
      transfer_ticket: `TT-${Date.now().toString(36).toUpperCase()}`,
    }).eq('id', id);
    toast({ title: 'eLStB übermittelt', description: 'Transfer-Ticket wurde generiert.' });
    fetchBescheinigungen();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Lohnsteuerbescheinigung (eLStB)" description="Elektronische Lohnsteuerbescheinigung gem. § 41b EStG" onBack={onBack} />

      <div className="flex flex-wrap gap-4 items-end">
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerateAll} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          Alle eLStB generieren
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bescheinigungen.length}</div>
            <div className="text-sm text-muted-foreground">Gesamt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bescheinigungen.filter(b => b.status === 'entwurf').length}</div>
            <div className="text-sm text-muted-foreground">Entwurf</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bescheinigungen.filter(b => b.status === 'uebermittelt').length}</div>
            <div className="text-sm text-muted-foreground">Übermittelt</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : bescheinigungen.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          Keine Lohnsteuerbescheinigungen für {selectedYear}. Bitte erst generieren.
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {bescheinigungen.map(b => (
            <Card key={b.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{getEmployeeName(b.employee_id)}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={b.status === 'entwurf' ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-800'}>{b.status}</Badge>
                    {b.status === 'entwurf' && (
                      <Button size="sm" variant="outline" onClick={() => handleSubmit(b.id)}>
                        <Send className="h-3 w-3 mr-1" />Übermitteln
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Zeitraum: {b.zeitraum_von} bis {b.zeitraum_bis} • StKl: {b.steuerklasse} • Kinder: {Number(b.kinderfreibetraege)}
                  {b.transfer_ticket && <> • Ticket: {b.transfer_ticket}</>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Zeile 3 – Bruttolohn</span>
                    <div className="font-bold tabular-nums">{fmt(b.zeile_3_bruttolohn)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zeile 4 – Lohnsteuer</span>
                    <div className="font-bold tabular-nums">{fmt(b.zeile_4_lst)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zeile 5 – Soli</span>
                    <div className="font-bold tabular-nums">{fmt(b.zeile_5_soli)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zeile 6 – Kirchensteuer</span>
                    <div className="font-bold tabular-nums">{fmt(b.zeile_6_kist)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zeile 22a/b – RV</span>
                    <div className="tabular-nums">AN: {fmt(b.zeile_22a_arbeitnehmeranteil_rv)} / AG: {fmt(b.zeile_22b_arbeitgeberanteil_rv)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zeile 23a/b – KV</span>
                    <div className="tabular-nums">AN: {fmt(b.zeile_23a_arbeitnehmeranteil_kv)} / AG: {fmt(b.zeile_23b_arbeitgeberanteil_kv)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zeile 24a/b – AV</span>
                    <div className="tabular-nums">AN: {fmt(b.zeile_24a_arbeitnehmeranteil_av)} / AG: {fmt(b.zeile_24b_arbeitgeberanteil_av)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zeile 25/26 – PV</span>
                    <div className="tabular-nums">AN: {fmt(b.zeile_25_arbeitnehmeranteil_pv)} / AG: {fmt(b.zeile_26_arbeitgeberanteil_pv)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
