import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Inbox, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";
import { parseDeuevRueckmeldungBatch } from "@/utils/deuev-rueckmeldung-import";

interface Props { onBack: () => void }

export function DeuevRueckmeldungenPage({ onBack }: Props) {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [xml, setXml] = useState("");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("deuev_rueckmeldungen").select("*")
      .eq("tenant_id", tenantId).order("empfangen_am", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const importXml = async () => {
    if (!tenantId || !xml.trim()) return;
    const parsed = parseDeuevRueckmeldungBatch(xml);
    const rows = parsed.map(p => ({
      tenant_id: tenantId,
      krankenkasse: p.krankenkasse,
      betriebsnummer_kk: p.betriebsnummerKK,
      rueckmeldung_typ: p.rueckmeldungTyp,
      fehler_code: p.fehlerCode,
      fehler_text: p.fehlerText,
      raw_xml: p.rawXml,
    }));
    const { error } = await supabase.from("deuev_rueckmeldungen").insert(rows);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else { toast({ title: `${rows.length} Rückmeldung(en) importiert` }); setShowImport(false); setXml(""); load(); }
  };

  const setStatus = async (id: string, status: string) => {
    await supabase.from("deuev_rueckmeldungen").update({ status }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="DEÜV-Rückmeldungen" description="Antworten der Krankenkassen importieren und verarbeiten" onBack={onBack} />
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5 text-primary" /> Inbox</CardTitle>
            <CardDescription>Bestätigungen, Fehler-Codes und Korrekturen</CardDescription>
          </div>
          <Dialog open={showImport} onOpenChange={setShowImport}>
            <DialogTrigger asChild><Button><Upload className="h-4 w-4 mr-2" />XML importieren</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Rückmeldungs-XML importieren</DialogTitle></DialogHeader>
              <Textarea value={xml} onChange={e => setXml(e.target.value)} rows={12} placeholder="<Rueckmeldung>...</Rueckmeldung>" />
              <DialogFooter><Button onClick={importXml} disabled={!xml.trim()}>Importieren</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empfangen</TableHead><TableHead>KK</TableHead><TableHead>Typ</TableHead>
                  <TableHead>Fehler</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.empfangen_am).toLocaleString('de-DE')}</TableCell>
                    <TableCell>{r.krankenkasse}</TableCell>
                    <TableCell><Badge variant={r.rueckmeldung_typ === 'fehler' ? 'destructive' : 'outline'}>{r.rueckmeldung_typ}</Badge></TableCell>
                    <TableCell className="text-xs">{r.fehler_code ? `${r.fehler_code}: ${r.fehler_text ?? ''}` : '—'}</TableCell>
                    <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {r.status === 'neu' && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'bearbeitet')}>Erledigt</Button>}
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Keine Rückmeldungen.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}