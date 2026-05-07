/**
 * AAG – Erstattungsanträge U1 / U2
 * ────────────────────────────────────────────────────
 * U1: Erstattung der Entgeltfortzahlung im Krankheitsfall
 * U2: Erstattung Mutterschaftsleistungen
 *
 * Anlegen, anzeigen, übermitteln (Statuswechsel auf "gemeldet").
 */
import { useState, useEffect, useCallback } from 'react';
import { Plus, Send, Loader2, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/contexts/employee-context';
import { useTenant } from '@/contexts/tenant-context';
import {
  calculateAagErstattung,
  DEFAULT_U1_SATZ,
  DEFAULT_U2_SATZ,
  type AagAntragTyp,
} from '@/utils/aag-calculation';

const STATUS_COLORS: Record<string, string> = {
  entwurf: 'bg-muted text-muted-foreground',
  gemeldet: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  bestaetigt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  abgelehnt: 'bg-destructive/20 text-destructive',
};

interface AagPageProps {
  onBack: () => void;
}

export function AagPage({ onBack }: AagPageProps) {
  const { employees } = useEmployees();
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const [antraege, setAntraege] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'alle' | 'U1' | 'U2'>('alle');

  // Formular-State
  const [employeeId, setEmployeeId] = useState('');
  const [antragTyp, setAntragTyp] = useState<AagAntragTyp>('U1');
  const [zeitraumVon, setZeitraumVon] = useState('');
  const [zeitraumBis, setZeitraumBis] = useState('');
  const [bruttoEntgelt, setBruttoEntgelt] = useState('');
  const [fortzahlungstage, setFortzahlungstage] = useState('');
  const [svBeitraege, setSvBeitraege] = useState('');
  const [erstattungssatz, setErstattungssatz] = useState(String(DEFAULT_U1_SATZ * 100));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAntraege = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('aag_antraege')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    setAntraege(data ?? []);
    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchAntraege(); }, [fetchAntraege]);

  const fmt = (v: number | string) => Number(v ?? 0).toFixed(2).replace('.', ',') + ' €';

  const resetForm = () => {
    setEmployeeId('');
    setAntragTyp('U1');
    setZeitraumVon('');
    setZeitraumBis('');
    setBruttoEntgelt('');
    setFortzahlungstage('');
    setSvBeitraege('');
    setErstattungssatz(String(DEFAULT_U1_SATZ * 100));
    setNotes('');
  };

  const handleTypChange = (typ: AagAntragTyp) => {
    setAntragTyp(typ);
    setErstattungssatz(String((typ === 'U1' ? DEFAULT_U1_SATZ : DEFAULT_U2_SATZ) * 100));
  };

  const previewErgebnis = (() => {
    const brutto = Number(bruttoEntgelt) || 0;
    const sv = Number(svBeitraege) || 0;
    const tage = Number(fortzahlungstage) || 0;
    const satz = (Number(erstattungssatz) || 0) / 100;
    if (brutto === 0 && sv === 0) return null;
    return calculateAagErstattung({ antragTyp, bruttoEntgelt: brutto, fortzahlungstage: tage, svBeitraegeAg: sv, erstattungssatz: satz });
  })();

  const handleSave = async () => {
    if (!tenantId || !employeeId || !zeitraumVon || !zeitraumBis) {
      toast({ title: 'Bitte alle Pflichtfelder ausfüllen', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const employee = employees.find(e => e.id === employeeId);
    const ergebnis = calculateAagErstattung({
      antragTyp,
      bruttoEntgelt: Number(bruttoEntgelt) || 0,
      fortzahlungstage: Number(fortzahlungstage) || 0,
      svBeitraegeAg: Number(svBeitraege) || 0,
      erstattungssatz: (Number(erstattungssatz) || 0) / 100,
    });

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('aag_antraege').insert({
      tenant_id: tenantId,
      employee_id: employeeId,
      krankenkasse: employee?.healthInsurance?.name ?? 'Unbekannt',
      antrag_typ: antragTyp,
      zeitraum_von: zeitraumVon,
      zeitraum_bis: zeitraumBis,
      brutto_entgelt: ergebnis.bruttoEntgelt,
      fortzahlungstage: ergebnis.fortzahlungstage,
      erstattungssatz: ergebnis.erstattungssatz,
      erstattungsbetrag: ergebnis.erstattungGesamt,
      sv_beitraege: ergebnis.erstattungSv,
      status: 'entwurf',
      notes,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Antrag gespeichert' });
    setShowCreate(false);
    resetForm();
    fetchAntraege();
  };

  const handleSubmit = async (id: string) => {
    await supabase
      .from('aag_antraege')
      .update({ status: 'gemeldet', gemeldet_am: new Date().toISOString() })
      .eq('id', id);
    toast({ title: 'Antrag übermittelt' });
    fetchAntraege();
  };

  const filtered = filter === 'alle' ? antraege : antraege.filter(a => a.antrag_typ === filter);

  const employeeName = (id: string) => {
    const e = employees.find(x => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : '—';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AAG-Erstattungsanträge"
        description="U1 (Krankheit) und U2 (Mutterschaft) – Aufwendungsausgleichsgesetz"
        onBack={onBack}
      />

      <div className="flex flex-wrap gap-4 items-end justify-between">
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Anträge</SelectItem>
            <SelectItem value="U1">Nur U1 (Krankheit)</SelectItem>
            <SelectItem value="U2">Nur U2 (Mutterschaft)</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neuer Antrag</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuer AAG-Erstattungsantrag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Antrags-Typ *</Label>
                  <Select value={antragTyp} onValueChange={(v: any) => handleTypChange(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="U1">U1 – Krankheit (Entgeltfortzahlung)</SelectItem>
                      <SelectItem value="U2">U2 – Mutterschaft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mitarbeiter *</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger><SelectValue placeholder="Auswählen…" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Zeitraum von *</Label>
                  <Input type="date" value={zeitraumVon} onChange={(e) => setZeitraumVon(e.target.value)} />
                </div>
                <div>
                  <Label>Zeitraum bis *</Label>
                  <Input type="date" value={zeitraumBis} onChange={(e) => setZeitraumBis(e.target.value)} />
                </div>
                <div>
                  <Label>Fortzahlungstage</Label>
                  <Input type="number" value={fortzahlungstage} onChange={(e) => setFortzahlungstage(e.target.value)} />
                </div>
                <div>
                  <Label>Erstattungssatz (%)</Label>
                  <Input type="number" min="0" max="100" step="1" value={erstattungssatz} onChange={(e) => setErstattungssatz(e.target.value)} />
                </div>
                <div>
                  <Label>Brutto-Entgelt (€)</Label>
                  <Input type="number" step="0.01" value={bruttoEntgelt} onChange={(e) => setBruttoEntgelt(e.target.value)} />
                </div>
                <div>
                  <Label>SV-AG-Beiträge (€)</Label>
                  <Input type="number" step="0.01" value={svBeitraege} onChange={(e) => setSvBeitraege(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Notizen</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              {previewErgebnis && (
                <Card className="bg-muted/50">
                  <CardContent className="py-4 space-y-1 text-sm">
                    <div className="flex items-center gap-2 font-medium mb-2">
                      <Calculator className="h-4 w-4" /> Vorschau Erstattung
                    </div>
                    <div className="flex justify-between"><span>Erstattung Entgelt ({(previewErgebnis.erstattungssatz * 100).toFixed(0)} %):</span><span className="tabular-nums">{fmt(previewErgebnis.erstattungBrutto)}</span></div>
                    <div className="flex justify-between"><span>Erstattung SV-Anteile:</span><span className="tabular-nums">{fmt(previewErgebnis.erstattungSv)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Erstattung gesamt:</span><span className="tabular-nums">{fmt(previewErgebnis.erstattungGesamt)}</span></div>
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          Noch keine AAG-Anträge. Klicke auf „Neuer Antrag", um zu starten.
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Krankenkasse</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead className="text-right">Tage</TableHead>
                  <TableHead className="text-right">Satz</TableHead>
                  <TableHead className="text-right">Erstattung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell><Badge variant="outline">{a.antrag_typ}</Badge></TableCell>
                    <TableCell>{employeeName(a.employee_id)}</TableCell>
                    <TableCell>{a.krankenkasse}</TableCell>
                    <TableCell className="text-xs">{a.zeitraum_von} – {a.zeitraum_bis}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.fortzahlungstage}</TableCell>
                    <TableCell className="text-right tabular-nums">{(Number(a.erstattungssatz) * 100).toFixed(0)} %</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(a.erstattungsbetrag)}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[a.status] ?? STATUS_COLORS.entwurf}>{a.status}</Badge></TableCell>
                    <TableCell>
                      {a.status === 'entwurf' && (
                        <Button size="sm" variant="outline" onClick={() => handleSubmit(a.id)}>
                          <Send className="h-3 w-3 mr-1" />Übermitteln
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
