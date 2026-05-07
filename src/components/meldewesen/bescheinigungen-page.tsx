/**
 * Bescheinigungswesen – EEL & BEA
 * ─────────────────────────────────────────────────────────────
 * Anlegen, anzeigen und übermitteln (Status) von:
 *   - Entgeltbescheinigungen an Krankenkassen (EEL)
 *   - Arbeitsbescheinigungen an die Bundesagentur (BEA)
 */
import { useState, useEffect, useCallback } from 'react';
import { Plus, Send, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/contexts/employee-context';
import { useTenant } from '@/contexts/tenant-context';
import {
  BESCHEINIGUNG_LABELS,
  buildBescheinigung,
  getEmpfaengerTyp,
  type BescheinigungTyp,
} from '@/utils/bescheinigungen';

const STATUS_COLORS: Record<string, string> = {
  entwurf: 'bg-muted text-muted-foreground',
  gemeldet: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  bestaetigt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  abgelehnt: 'bg-destructive/20 text-destructive',
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);

interface BescheinigungenPageProps {
  onBack: () => void;
}

export function BescheinigungenPage({ onBack }: BescheinigungenPageProps) {
  const { employees } = useEmployees();
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form
  const [typ, setTyp] = useState<BescheinigungTyp>('eel_krankengeld');
  const [employeeId, setEmployeeId] = useState('');
  const [empfaenger, setEmpfaenger] = useState('');
  const [empfaengerBN, setEmpfaengerBN] = useState('');
  const [von, setVon] = useState('');
  const [bis, setBis] = useState('');
  const [letzterTag, setLetzterTag] = useState('');
  const [brutto, setBrutto] = useState('');
  const [netto, setNetto] = useState('');
  const [svBrutto, setSvBrutto] = useState('');
  const [stunden, setStunden] = useState('');
  const [notes, setNotes] = useState('');

  const fetch = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('bescheinigungen')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => { fetch(); }, [fetch]);

  const reset = () => {
    setTyp('eel_krankengeld');
    setEmployeeId('');
    setEmpfaenger('');
    setEmpfaengerBN('');
    setVon('');
    setBis('');
    setLetzterTag('');
    setBrutto('');
    setNetto('');
    setSvBrutto('');
    setStunden('');
    setNotes('');
  };

  const handleCreate = async () => {
    if (!tenantId) return;
    const emp = employees.find(e => e.id === employeeId);
    if (!emp || !von || !bis || !empfaenger) return;

    const datensatz = buildBescheinigung({
      typ,
      employee: emp,
      zeitraumVon: new Date(von),
      zeitraumBis: new Date(bis),
      bruttoEntgelt: Number(brutto) || 0,
      nettoEntgelt: Number(netto) || 0,
      svBrutto: Number(svBrutto) || 0,
      arbeitsstunden: Number(stunden) || 0,
      letzterArbeitstag: letzterTag ? new Date(letzterTag) : undefined,
      empfaengerName: empfaenger,
      empfaengerBetriebsnummer: empfaengerBN || undefined,
      notes,
    });

    const { error } = await supabase.from('bescheinigungen').insert([{
      tenant_id: tenantId,
      employee_id: employeeId,
      bescheinigung_typ: typ,
      empfaenger_typ: getEmpfaengerTyp(typ),
      empfaenger_name: empfaenger,
      empfaenger_betriebsnummer: empfaengerBN || null,
      zeitraum_von: von,
      zeitraum_bis: bis,
      letzter_arbeitstag: letzterTag || null,
      brutto_entgelt: datensatz.bruttoEntgelt,
      netto_entgelt: datensatz.nettoEntgelt,
      sv_brutto: datensatz.svBrutto,
      arbeitsstunden: datensatz.arbeitsstunden,
      details: {
        kalendertage: datensatz.kalendertage,
        tagesentgelt: datensatz.tagesentgelt,
      } as any,
      status: 'entwurf',
      notes: notes || null,
    }]);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Bescheinigung angelegt',
        description: `${BESCHEINIGUNG_LABELS[typ]} für ${emp.personalData.lastName}.`,
      });
      setShowCreate(false);
      reset();
      fetch();
    }
  };

  const handleSubmit = async (id: string) => {
    await supabase.from('bescheinigungen').update({
      status: 'gemeldet',
      uebermittelt_am: new Date().toISOString(),
    }).eq('id', id);
    toast({ title: 'Bescheinigung übermittelt' });
    fetch();
  };

  const empName = (id: string) => {
    const e = employees.find(x => x.id === id);
    return e ? `${e.personalData.lastName}, ${e.personalData.firstName}` : id.slice(0, 8);
  };

  // Beim Mitarbeiter-Pick KK vorbelegen
  const onPickEmployee = (id: string) => {
    setEmployeeId(id);
    const e = employees.find(x => x.id === id);
    if (e?.personalData.healthInsurance?.name && getEmpfaengerTyp(typ) === 'krankenkasse') {
      setEmpfaenger(e.personalData.healthInsurance.name);
    }
    if (getEmpfaengerTyp(typ) === 'arbeitsagentur') {
      setEmpfaenger('Bundesagentur für Arbeit');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bescheinigungen (EEL & BEA)"
        description="Entgeltbescheinigungen an Krankenkassen und Arbeitsbescheinigungen an die Bundesagentur"
        onBack={onBack}
      >
        <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neue Bescheinigung</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Neue Bescheinigung</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Art</Label>
                  <Select value={typ} onValueChange={v => setTyp(v as BescheinigungTyp)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(BESCHEINIGUNG_LABELS) as BescheinigungTyp[]).map(t => (
                        <SelectItem key={t} value={t}>{BESCHEINIGUNG_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mitarbeiter</Label>
                  <Select value={employeeId} onValueChange={onPickEmployee}>
                    <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.personalData.lastName}, {e.personalData.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Empfänger ({getEmpfaengerTyp(typ)})</Label>
                  <Input value={empfaenger} onChange={e => setEmpfaenger(e.target.value)} placeholder="z. B. Techniker Krankenkasse" />
                </div>
                <div>
                  <Label>Betriebsnr. Empfänger</Label>
                  <Input value={empfaengerBN} onChange={e => setEmpfaengerBN(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><Label>Zeitraum von</Label><Input type="date" value={von} onChange={e => setVon(e.target.value)} /></div>
                <div><Label>Zeitraum bis</Label><Input type="date" value={bis} onChange={e => setBis(e.target.value)} /></div>
                <div><Label>Letzter Arbeitstag</Label><Input type="date" value={letzterTag} onChange={e => setLetzterTag(e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div><Label>Brutto (€)</Label><Input type="number" value={brutto} onChange={e => setBrutto(e.target.value)} /></div>
                <div><Label>Netto (€)</Label><Input type="number" value={netto} onChange={e => setNetto(e.target.value)} /></div>
                <div><Label>SV-Brutto (€)</Label><Input type="number" value={svBrutto} onChange={e => setSvBrutto(e.target.value)} /></div>
                <div><Label>Stunden</Label><Input type="number" value={stunden} onChange={e => setStunden(e.target.value)} /></div>
              </div>

              <div>
                <Label>Notizen</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>

              <Button
                onClick={handleCreate}
                disabled={!employeeId || !von || !bis || !empfaenger}
                className="w-full"
              >
                Bescheinigung anlegen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Übersicht */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['entwurf', 'gemeldet', 'bestaetigt', 'abgelehnt'].map(s => (
          <Card key={s}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{items.filter(i => i.status === s).length}</div>
              <div className="text-sm text-muted-foreground capitalize">{s}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Keine Bescheinigungen vorhanden.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Art</TableHead>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Empfänger</TableHead>
                  <TableHead className="text-right">Brutto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(i => (
                  <TableRow key={i.id}>
                    <TableCell>{BESCHEINIGUNG_LABELS[i.bescheinigung_typ as BescheinigungTyp] ?? i.bescheinigung_typ}</TableCell>
                    <TableCell className="font-medium">{empName(i.employee_id)}</TableCell>
                    <TableCell className="tabular-nums">{i.zeitraum_von} — {i.zeitraum_bis}</TableCell>
                    <TableCell>{i.empfaenger_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtEur(i.brutto_entgelt)}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[i.status] ?? ''}>{i.status}</Badge></TableCell>
                    <TableCell>
                      {i.status === 'entwurf' && (
                        <Button size="sm" variant="outline" onClick={() => handleSubmit(i.id)}>
                          <Send className="h-3 w-3 mr-1" />Übermitteln
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