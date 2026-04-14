/**
 * SV-Meldungen (DEÜV) Verwaltung
 * Anmeldung, Abmeldung, Jahresmeldung an Krankenkassen
 */
import { useState, useEffect, useCallback } from 'react';
import { Plus, Send, Loader2, XCircle } from 'lucide-react';
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

const MELDEGRUENDE = [
  { value: 'anmeldung', label: 'Anmeldung', schluessel: '10' },
  { value: 'abmeldung', label: 'Abmeldung', schluessel: '30' },
  { value: 'jahresmeldung', label: 'Jahresmeldung', schluessel: '50' },
  { value: 'unterbrechung', label: 'Unterbrechungsmeldung', schluessel: '51' },
  { value: 'sonstige', label: 'Sonstige Meldung', schluessel: '57' },
];

const STATUS_COLORS: Record<string, string> = {
  entwurf: 'bg-muted text-muted-foreground',
  gemeldet: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  bestaetigt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  storniert: 'bg-destructive/20 text-destructive',
};

interface SVMeldungenPageProps {
  onBack: () => void;
}

export function SVMeldungenPage({ onBack }: SVMeldungenPageProps) {
  const { employees } = useSupabaseEmployees();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showStorno, setShowStorno] = useState<string | null>(null);
  const [stornoGrund, setStornoGrund] = useState('');

  // Form state
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formMeldegrund, setFormMeldegrund] = useState('anmeldung');
  const [formVon, setFormVon] = useState('');
  const [formBis, setFormBis] = useState('');
  const [formKK, setFormKK] = useState('');
  const [formSVBrutto, setFormSVBrutto] = useState('');

  const fetchMeldungen = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('sv_meldungen')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    setMeldungen(data ?? []);
    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchMeldungen(); }, [fetchMeldungen]);

  const resetForm = () => {
    setFormEmployeeId('');
    setFormMeldegrund('anmeldung');
    setFormVon('');
    setFormBis('');
    setFormKK('');
    setFormSVBrutto('');
  };

  const handleCreate = async () => {
    if (!tenantId) return;
    const grund = MELDEGRUENDE.find(m => m.value === formMeldegrund);
    const emp = employees.find(e => e.id === formEmployeeId);

    const { error } = await supabase.from('sv_meldungen').insert([{
      employee_id: formEmployeeId,
      meldegrund: formMeldegrund,
      meldegrund_schluessel: grund?.schluessel,
      zeitraum_von: formVon,
      zeitraum_bis: formBis,
      krankenkasse: formKK || emp?.personalData.healthInsurance?.name || 'Unbekannt',
      beitragsgruppe: '1111',
      sv_brutto: formSVBrutto ? Number(formSVBrutto) : (emp?.salaryData.grossSalary ?? 0),
      personengruppe: '101',
      status: 'entwurf',
      tenant_id: tenantId,
    }]);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'SV-Meldung erstellt', description: `${grund?.label} für ${emp?.personalData.lastName ?? 'Mitarbeiter'} als Entwurf angelegt.` });
      setShowCreate(false);
      resetForm();
      fetchMeldungen();
    }
  };

  const handleSubmit = async (id: string) => {
    await supabase.from('sv_meldungen').update({
      status: 'gemeldet',
      meldedatum: new Date().toISOString().split('T')[0],
    }).eq('id', id);
    toast({ title: 'Meldung übermittelt', description: 'Status auf "gemeldet" gesetzt.' });
    fetchMeldungen();
  };

  const handleStorno = async () => {
    if (!showStorno) return;
    await supabase.from('sv_meldungen').update({
      status: 'storniert',
      storniert_am: new Date().toISOString().split('T')[0],
      storno_grund: stornoGrund || 'Stornierung durch Benutzer',
    }).eq('id', showStorno);
    toast({ title: 'Meldung storniert' });
    setShowStorno(null);
    setStornoGrund('');
    fetchMeldungen();
  };

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.personalData.lastName}, ${emp.personalData.firstName}` : empId.slice(0, 8);
  };

  const activeEmployees = employees.filter(e => !e.employmentData.endDate || new Date(e.employmentData.endDate) > new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="SV-Meldungen (DEÜV)" description="Sozialversicherungsmeldungen an Krankenkassen" onBack={onBack}>
        <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neue Meldung</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Neue SV-Meldung</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Mitarbeiter</Label>
                <Select value={formEmployeeId} onValueChange={v => {
                  setFormEmployeeId(v);
                  const emp = employees.find(e => e.id === v);
                  if (emp?.personalData.healthInsurance?.name) setFormKK(emp.personalData.healthInsurance.name);
                }}>
                  <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.personalData.lastName}, {e.personalData.firstName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Meldegrund</Label>
                <Select value={formMeldegrund} onValueChange={setFormMeldegrund}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MELDEGRUENDE.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label} (Schlüssel {m.schluessel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Zeitraum von</Label><Input type="date" value={formVon} onChange={e => setFormVon(e.target.value)} /></div>
                <div><Label>Zeitraum bis</Label><Input type="date" value={formBis} onChange={e => setFormBis(e.target.value)} /></div>
              </div>
              <div><Label>Krankenkasse</Label><Input value={formKK} onChange={e => setFormKK(e.target.value)} placeholder="z.B. Techniker Krankenkasse" /></div>
              <div><Label>SV-Brutto (optional)</Label><Input type="number" value={formSVBrutto} onChange={e => setFormSVBrutto(e.target.value)} placeholder="Wird vom Gehalt übernommen" /></div>
              <Button onClick={handleCreate} disabled={!formEmployeeId || !formVon || !formBis || !formKK} className="w-full">
                Meldung erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Übersichtskarten */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['entwurf', 'gemeldet', 'bestaetigt', 'storniert'].map(status => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{meldungen.filter(m => m.status === status).length}</div>
              <div className="text-sm text-muted-foreground capitalize">{status}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storno-Dialog */}
      <Dialog open={!!showStorno} onOpenChange={v => { if (!v) { setShowStorno(null); setStornoGrund(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Meldung stornieren</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Stornogrund</Label><Textarea value={stornoGrund} onChange={e => setStornoGrund(e.target.value)} placeholder="Grund für die Stornierung" /></div>
            <Button variant="destructive" onClick={handleStorno} className="w-full">Stornierung bestätigen</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabelle */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : meldungen.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Keine SV-Meldungen vorhanden.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Meldegrund</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Krankenkasse</TableHead>
                  <TableHead className="text-right">SV-Brutto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Meldedatum</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meldungen.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{getEmployeeName(m.employee_id)}</TableCell>
                    <TableCell>
                      {MELDEGRUENDE.find(mg => mg.value === m.meldegrund)?.label ?? m.meldegrund}
                      <span className="text-xs text-muted-foreground ml-1">({m.meldegrund_schluessel})</span>
                    </TableCell>
                    <TableCell className="tabular-nums">{m.zeitraum_von} — {m.zeitraum_bis}</TableCell>
                    <TableCell>{m.krankenkasse}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(m.sv_brutto ?? 0).toFixed(2).replace('.', ',')} €</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[m.status] ?? ''}>{m.status}</Badge></TableCell>
                    <TableCell className="tabular-nums">{m.meldedatum ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {m.status === 'entwurf' && (
                          <Button size="sm" variant="outline" onClick={() => handleSubmit(m.id)}>
                            <Send className="h-3 w-3 mr-1" />Melden
                          </Button>
                        )}
                        {(m.status === 'entwurf' || m.status === 'gemeldet') && (
                          <Button size="sm" variant="ghost" onClick={() => setShowStorno(m.id)}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
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
