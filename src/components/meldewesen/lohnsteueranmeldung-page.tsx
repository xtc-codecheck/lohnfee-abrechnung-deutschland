/**
 * Lohnsteueranmeldung (§ 41a EStG)
 * Monatliche/vierteljährliche/jährliche Anmeldung der einbehaltenen
 * Lohnsteuer, SolZ und KiSt beim Finanzamt
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader2, FileText, Send, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';

interface LohnsteueranmeldungPageProps {
  onBack: () => void;
}

const MONTH_NAMES = [
  '', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const STATUS_COLORS: Record<string, string> = {
  entwurf: 'bg-muted text-muted-foreground',
  geprueft: 'bg-blue-100 text-blue-800',
  uebermittelt: 'bg-green-100 text-green-800',
  korrigiert: 'bg-orange-100 text-orange-800',
};

export function LohnsteueranmeldungPage({ onBack }: LohnsteueranmeldungPageProps) {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [anmeldungen, setAnmeldungen] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const fmt = (v: number) => Number(v).toFixed(2).replace('.', ',') + ' €';

  const fetchAnmeldungen = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('lohnsteueranmeldungen')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('year', selectedYear)
      .order('month', { ascending: true });
    setAnmeldungen(data ?? []);
    setIsLoading(false);
  }, [selectedYear, tenantId]);

  useEffect(() => { fetchAnmeldungen(); }, [fetchAnmeldungen]);

  const handleGenerateMonth = async (month: number) => {
    if (!tenantId) return;
    setGenerating(true);

    // Finde die passende payroll_period
    const { data: periods } = await supabase
      .from('payroll_periods')
      .select('id')
      .eq('year', selectedYear)
      .eq('month', month)
      .eq('tenant_id', tenantId);

    if (!periods?.length) {
      toast({ title: 'Keine Daten', description: `Keine Abrechnungsperiode für ${MONTH_NAMES[month]} ${selectedYear}.`, variant: 'destructive' });
      setGenerating(false);
      return;
    }

    const periodIds = periods.map(p => p.id);

    const { data: entries } = await supabase
      .from('payroll_entries')
      .select('tax_income_tax, tax_solidarity, tax_church, gross_salary')
      .in('payroll_period_id', periodIds)
      .eq('tenant_id', tenantId);

    if (!entries?.length) {
      toast({ title: 'Keine Einträge', description: 'Keine Abrechnungseinträge für diesen Monat.', variant: 'destructive' });
      setGenerating(false);
      return;
    }

    const summeLst = entries.reduce((s, e) => s + Number(e.tax_income_tax ?? 0), 0);
    const summeSoli = entries.reduce((s, e) => s + Number(e.tax_solidarity ?? 0), 0);
    const summeKist = entries.reduce((s, e) => s + Number(e.tax_church ?? 0), 0);
    const gesamt = summeLst + summeSoli + summeKist;

    // Company settings für Finanzamt-Daten
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('tax_office, tax_number')
      .eq('tenant_id', tenantId)
      .limit(1)
      .single();

    const anmeldung = {
      tenant_id: tenantId,
      year: selectedYear,
      month,
      anmeldezeitraum: 'monatlich',
      summe_lohnsteuer: summeLst,
      summe_solidaritaetszuschlag: summeSoli,
      summe_kirchensteuer_ev: summeKist, // Vereinfachung: Gesamt-KiSt
      summe_kirchensteuer_rk: 0,
      summe_pauschale_lohnsteuer: 0,
      gesamtbetrag: gesamt,
      anzahl_arbeitnehmer: entries.length,
      finanzamt: companySettings?.tax_office ?? null,
      steuernummer: companySettings?.tax_number ?? null,
      status: 'entwurf',
    };

    const { error } = await supabase
      .from('lohnsteueranmeldungen')
      .upsert(anmeldung, { onConflict: 'tenant_id,year,month' });

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Anmeldung generiert', description: `LSt-Anmeldung für ${MONTH_NAMES[month]} ${selectedYear} erstellt.` });
    }

    setGenerating(false);
    fetchAnmeldungen();
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    for (let m = 1; m <= 12; m++) {
      await handleGenerateMonth(m);
    }
    setGenerating(false);
  };

  const handleSubmit = async (id: string) => {
    await supabase.from('lohnsteueranmeldungen').update({
      status: 'uebermittelt',
      uebermittelt_am: new Date().toISOString(),
      transfer_ticket: `ELSTER-${Date.now().toString(36).toUpperCase()}`,
    }).eq('id', id);
    toast({ title: 'Übermittelt', description: 'LSt-Anmeldung an Finanzamt übermittelt (simuliert).' });
    fetchAnmeldungen();
  };

  const totalLst = anmeldungen.reduce((s, a) => s + Number(a.summe_lohnsteuer), 0);
  const totalSoli = anmeldungen.reduce((s, a) => s + Number(a.summe_solidaritaetszuschlag), 0);
  const totalGesamt = anmeldungen.reduce((s, a) => s + Number(a.gesamtbetrag), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Lohnsteueranmeldung (§ 41a EStG)"
        description="Monatliche Anmeldung der einbehaltenen Lohnsteuer beim Finanzamt"
        onBack={onBack}
      />

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
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
          Alle Monate generieren
        </Button>
      </div>

      {/* Jahresübersicht */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{anmeldungen.length}</div>
            <div className="text-sm text-muted-foreground">Anmeldungen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold tabular-nums">{fmt(totalLst)}</div>
            <div className="text-sm text-muted-foreground">Lohnsteuer gesamt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold tabular-nums">{fmt(totalSoli)}</div>
            <div className="text-sm text-muted-foreground">Soli gesamt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold tabular-nums">{fmt(totalGesamt)}</div>
            <div className="text-sm text-muted-foreground">Gesamtabführung</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : anmeldungen.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            Keine Lohnsteueranmeldungen für {selectedYear}. Bitte generieren oder einzelne Monate berechnen.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {anmeldungen.map(a => (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {MONTH_NAMES[a.month]} {a.year}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[a.status] ?? ''}>{a.status}</Badge>
                    {a.status === 'entwurf' && (
                      <Button size="sm" variant="outline" onClick={() => handleSubmit(a.id)}>
                        <Send className="h-3 w-3 mr-1" />ELSTER
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {a.anzahl_arbeitnehmer} Arbeitnehmer
                  {a.finanzamt && <> • FA: {a.finanzamt}</>}
                  {a.steuernummer && <> • StNr: {a.steuernummer}</>}
                  {a.transfer_ticket && <> • Ticket: {a.transfer_ticket}</>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Lohnsteuer</span>
                    <div className="font-bold tabular-nums">{fmt(a.summe_lohnsteuer)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Soli</span>
                    <div className="font-bold tabular-nums">{fmt(a.summe_solidaritaetszuschlag)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">KiSt ev.</span>
                    <div className="tabular-nums">{fmt(a.summe_kirchensteuer_ev)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">KiSt rk.</span>
                    <div className="tabular-nums">{fmt(a.summe_kirchensteuer_rk)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Gesamt</span>
                    <div className="font-bold tabular-nums text-primary">{fmt(a.gesamtbetrag)}</div>
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
