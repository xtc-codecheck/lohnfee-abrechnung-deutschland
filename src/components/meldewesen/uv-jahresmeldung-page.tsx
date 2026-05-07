/**
 * UV-Jahresmeldung (Digitaler Lohnnachweis DSLN)
 * ─────────────────────────────────────────────────────────────
 * Aggregiert Brutto und Arbeitsstunden je Gefahrtarifstelle und
 * speichert Datensätze in `uv_jahresmeldungen`.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Send, Calculator, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/contexts/employee-context';
import { useTenant } from '@/contexts/tenant-context';
import { aggregateUvJahresmeldung, estimateAnnualHours } from '@/utils/uv-jahresmeldung';

interface UvPageProps {
  onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  entwurf: 'bg-muted text-muted-foreground',
  gemeldet: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  bestaetigt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

export function UvJahresmeldungPage({ onBack }: UvPageProps) {
  const { employees } = useEmployees();
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear - 1);
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchMeldungen = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('uv_jahresmeldungen')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('year', { ascending: false });
    setMeldungen(data ?? []);
    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchMeldungen(); }, [fetchMeldungen]);

  /**
   * Holt Brutto-Summen je Mitarbeiter aus `payroll_entries` für das Jahr.
   */
  const loadJahresBruttos = useCallback(async (): Promise<Record<string, number>> => {
    if (!tenantId) return {};
    const { data } = await supabase
      .from('payroll_entries')
      .select('employee_id, gross_salary, payroll_periods!inner(year, tenant_id)')
      .eq('tenant_id', tenantId)
      .eq('payroll_periods.year', year)
      .limit(500);

    const out: Record<string, number> = {};
    (data ?? []).forEach((row: any) => {
      out[row.employee_id] = (out[row.employee_id] ?? 0) + Number(row.gross_salary ?? 0);
    });
    return out;
  }, [tenantId, year]);

  const aggregat = useMemo(() => {
    // synchron grobe Vorschau ohne Bruttos – echtes Aggregat wird beim Erzeugen geladen
    return aggregateUvJahresmeldung({
      employees,
      jahresBruttos: {},
      jahresArbeitsstunden: {},
    });
  }, [employees]);

  const ohneBgStammdaten = useMemo(
    () => employees.filter(e => !(e as any).bgMitgliedsnummer || !(e as any).gefahrtarifstelle),
    [employees],
  );

  const handleErzeugen = async () => {
    if (!tenantId) return;
    setBusy(true);
    try {
      const bruttos = await loadJahresBruttos();
      const stunden: Record<string, number> = {};
      employees.forEach(e => {
        stunden[e.id] = estimateAnnualHours(e.employmentData.weeklyHours ?? 40);
      });

      const buckets = aggregateUvJahresmeldung({
        employees,
        jahresBruttos: bruttos,
        jahresArbeitsstunden: stunden,
      });

      if (buckets.length === 0) {
        toast({
          title: 'Keine Mitarbeiter mit BG-Stammdaten',
          description: 'Hinterlege BG-Mitgliedsnummer und Gefahrtarifstelle in den Mitarbeiter-Stammdaten.',
          variant: 'destructive',
        });
        return;
      }

      // bestehende Entwurfs-Meldungen für das Jahr ersetzen
      await supabase
        .from('uv_jahresmeldungen')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('year', year)
        .eq('status', 'entwurf');

      const rows = buckets.map(b => ({
        tenant_id: tenantId,
        year,
        bg_mitgliedsnummer: b.bgMitgliedsnummer,
        gefahrtarifstelle: b.gefahrtarifstelle,
        anzahl_versicherte: b.anzahlVersicherte,
        brutto_summe: b.bruttoSumme,
        geleistete_arbeitsstunden: b.geleisteteArbeitsstunden,
        details: b.details as any,
        status: 'entwurf',
      }));

      const { error } = await supabase.from('uv_jahresmeldungen').insert(rows);
      if (error) throw error;

      toast({
        title: 'UV-Jahresmeldung erzeugt',
        description: `${rows.length} Datensätze für ${year} als Entwurf angelegt.`,
      });
      fetchMeldungen();
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (id: string) => {
    await supabase.from('uv_jahresmeldungen').update({
      status: 'gemeldet',
      uebermittelt_am: new Date().toISOString(),
    }).eq('id', id);
    toast({ title: 'Übermittelt', description: 'Datensatz auf "gemeldet" gesetzt.' });
    fetchMeldungen();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="UV-Jahresmeldung (Lohnnachweis digital)"
        description="Jährlicher digitaler Lohnnachweis (DSLN) an die Berufsgenossenschaft – Frist 16.02. des Folgejahres"
        onBack={onBack}
      />

      {ohneBgStammdaten.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{ohneBgStammdaten.length} Mitarbeiter ohne BG-Stammdaten</AlertTitle>
          <AlertDescription>
            Hinterlege <b>BG-Mitgliedsnummer</b> und <b>Gefahrtarifstelle</b> in den
            Mitarbeiter-Stammdaten, sonst werden sie nicht in der Jahresmeldung berücksichtigt.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Jahresmeldung erzeugen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="w-32">
              <Label>Meldejahr</Label>
              <Input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                min={2020}
                max={currentYear}
              />
            </div>
            <Button onClick={handleErzeugen} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
              Aggregieren & speichern
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Aggregiert Bruttos aus den abgerechneten Perioden und schätzt Arbeitsstunden
            anhand der wöchentlichen Arbeitszeit. Vorhandene Entwürfe für {year} werden ersetzt.
          </p>
          {aggregat.length > 0 && (
            <p className="text-sm">
              Vorschau Buckets: <b>{aggregat.length}</b> Gefahrtarifstellen
              ({aggregat.reduce((s, b) => s + b.anzahlVersicherte, 0)} Mitarbeiter)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Erzeugte Meldungen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : meldungen.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Keine UV-Meldungen vorhanden.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jahr</TableHead>
                  <TableHead>BG-Mitgliedsnr.</TableHead>
                  <TableHead>Gefahrtarifstelle</TableHead>
                  <TableHead className="text-right">Versicherte</TableHead>
                  <TableHead className="text-right">Brutto</TableHead>
                  <TableHead className="text-right">Arbeitsstunden</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meldungen.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="tabular-nums">{m.year}</TableCell>
                    <TableCell className="font-mono text-xs">{m.bg_mitgliedsnummer}</TableCell>
                    <TableCell className="font-mono text-xs">{m.gefahrtarifstelle}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.anzahl_versicherte}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtEur(Number(m.brutto_summe))}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(m.geleistete_arbeitsstunden).toLocaleString('de-DE')}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[m.status] ?? ''}>{m.status}</Badge></TableCell>
                    <TableCell>
                      {m.status === 'entwurf' && (
                        <Button size="sm" variant="outline" onClick={() => handleSubmit(m.id)}>
                          <Send className="h-3 w-3 mr-1" />Melden
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}