/**
 * Beitragsnachweis-Generierung
 * Monatliche Beitragsnachweise an Krankenkassen
 */
import { useState, useEffect, useCallback } from 'react';
import { Calculator, Loader2, Send, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface BeitragsnachweisPageProps {
  onBack: () => void;
}

export function BeitragsnachweisPage({ onBack }: BeitragsnachweisPageProps) {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [nachweise, setNachweise] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [generating, setGenerating] = useState(false);

  const fetchNachweise = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('beitragsnachweise')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('year', selectedYear)
      .order('month', { ascending: false });
    setNachweise(data ?? []);
    setIsLoading(false);
  }, [selectedYear, tenantId]);

  useEffect(() => { fetchNachweise(); }, [fetchNachweise]);

  const fmt = (v: number) => Number(v).toFixed(2).replace('.', ',') + ' €';

  const handleGenerate = async () => {
    if (!tenantId) return;
    setGenerating(true);

    const { data: periods } = await supabase
      .from('payroll_periods')
      .select('id')
      .eq('year', selectedYear)
      .eq('month', selectedMonth)
      .eq('tenant_id', tenantId);

    if (!periods?.length) {
      toast({ title: 'Keine Daten', description: `Keine Abrechnung für ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} vorhanden.`, variant: 'destructive' });
      setGenerating(false);
      return;
    }

    const periodIds = periods.map(p => p.id);

    const { data: entries } = await supabase
      .from('payroll_entries')
      .select('*')
      .in('payroll_period_id', periodIds)
      .eq('tenant_id', tenantId);

    const { data: employees } = await supabase
      .from('employees')
      .select('id, health_insurance')
      .eq('tenant_id', tenantId);

    if (!entries?.length) {
      toast({ title: 'Keine Einträge', description: 'Keine Abrechnungseinträge gefunden.', variant: 'destructive' });
      setGenerating(false);
      return;
    }

    // Gruppiere nach Krankenkasse
    const kkMap = new Map<string, typeof entries>();
    for (const entry of entries) {
      const emp = employees?.find(e => e.id === entry.employee_id);
      const kk = emp?.health_insurance ?? 'Unbekannt';
      if (!kkMap.has(kk)) kkMap.set(kk, []);
      kkMap.get(kk)!.push(entry);
    }

    for (const [kk, kkEntries] of kkMap) {
      const nachweis = {
        year: selectedYear,
        month: selectedMonth,
        krankenkasse: kk,
        tenant_id: tenantId,
        anzahl_versicherte: kkEntries.length,
        kv_an: kkEntries.reduce((s, e) => s + Number(e.sv_health_employee ?? 0), 0),
        kv_ag: kkEntries.reduce((s, e) => s + Number(e.sv_health_employer ?? 0), 0),
        rv_an: kkEntries.reduce((s, e) => s + Number(e.sv_pension_employee ?? 0), 0),
        rv_ag: kkEntries.reduce((s, e) => s + Number(e.sv_pension_employer ?? 0), 0),
        av_an: kkEntries.reduce((s, e) => s + Number(e.sv_unemployment_employee ?? 0), 0),
        av_ag: kkEntries.reduce((s, e) => s + Number(e.sv_unemployment_employer ?? 0), 0),
        pv_an: kkEntries.reduce((s, e) => s + Number(e.sv_care_employee ?? 0), 0),
        pv_ag: kkEntries.reduce((s, e) => s + Number(e.sv_care_employer ?? 0), 0),
        gesamtbetrag: 0 as number,
        faelligkeitsdatum: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-27`,
        status: 'entwurf',
      };
      nachweis.gesamtbetrag = nachweis.kv_an + nachweis.kv_ag + nachweis.rv_an + nachweis.rv_ag +
        nachweis.av_an + nachweis.av_ag + nachweis.pv_an + nachweis.pv_ag;

      await supabase.from('beitragsnachweise').upsert(nachweis, {
        onConflict: 'year,month,krankenkasse,tenant_id',
      });
    }

    toast({ title: 'Beitragsnachweise generiert', description: `${kkMap.size} Nachweis(e) für ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} erstellt.` });
    setGenerating(false);
    fetchNachweise();
  };

  const handleSubmit = async (id: string) => {
    await supabase.from('beitragsnachweise').update({
      status: 'uebermittelt',
      uebermittelt_am: new Date().toISOString(),
    }).eq('id', id);
    toast({ title: 'Beitragsnachweis übermittelt' });
    fetchNachweise();
  };

  const monthNachweise = nachweise.filter(n => n.month === selectedMonth);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Beitragsnachweise" description="Monatliche Beitragsnachweise an Krankenkassen" onBack={onBack} />

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, i) => (
                <SelectItem key={i} value={String(i + 1)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
          Nachweise generieren
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : monthNachweise.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          Keine Beitragsnachweise für {MONTH_NAMES[selectedMonth - 1]} {selectedYear}. Bitte erst generieren.
        </CardContent></Card>
      ) : (
        monthNachweise.map(n => (
          <Card key={n.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{n.krankenkasse}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={n.status === 'entwurf' ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-800'}>{n.status}</Badge>
                  {n.status === 'entwurf' && (
                    <Button size="sm" variant="outline" onClick={() => handleSubmit(n.id)}>
                      <Send className="h-3 w-3 mr-1" />Übermitteln
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription>{n.anzahl_versicherte} Versicherte • Fällig: {n.faelligkeitsdatum}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beitragsart</TableHead>
                    <TableHead className="text-right">AN-Anteil</TableHead>
                    <TableHead className="text-right">AG-Anteil</TableHead>
                    <TableHead className="text-right">Gesamt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Krankenversicherung</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(n.kv_an)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(n.kv_ag)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(Number(n.kv_an) + Number(n.kv_ag))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Rentenversicherung</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(n.rv_an)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(n.rv_ag)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(Number(n.rv_an) + Number(n.rv_ag))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Arbeitslosenversicherung</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(n.av_an)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(n.av_ag)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(Number(n.av_an) + Number(n.av_ag))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pflegeversicherung</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(n.pv_an)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(n.pv_ag)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(Number(n.pv_an) + Number(n.pv_ag))}</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>Gesamtbetrag</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(n.kv_an) + Number(n.rv_an) + Number(n.av_an) + Number(n.pv_an))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(n.kv_ag) + Number(n.rv_ag) + Number(n.av_ag) + Number(n.pv_ag))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(n.gesamtbetrag)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
