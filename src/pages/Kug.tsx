import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageSeo } from "@/components/seo/page-seo";
import { PageHeader } from "@/components/ui/page-header";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, Zap, Send, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";

const STATUS: Record<string,string> = { entwurf: "Entwurf", beantragt: "Beantragt", bewilligt: "Bewilligt", abgelehnt: "Abgelehnt" };

export default function Kug() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [von, setVon] = useState("");
  const [bis, setBis] = useState("");
  const [agentur, setAgentur] = useState("");
  const [betriebsnr, setBetriebsnr] = useState("");
  const [typ, setTyp] = useState("anzeige");
  const [grund, setGrund] = useState("");
  const [betroffene, setBetroffene] = useState("0");
  const [prozent, setProzent] = useState("0");
  const [dauer, setDauer] = useState("3");
  const [betriebsrat, setBetriebsrat] = useState(false);
  const [einverstaendnis, setEinverstaendnis] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("kug_antraege" as any).select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    setItems((data as any[]) ?? []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!tenantId || !von || !bis) return;
    const { error } = await supabase.from("kug_antraege" as any).insert({
      tenant_id: tenantId, zeitraum_von: von, zeitraum_bis: bis,
      agentur_arbeit: agentur, betriebsnummer: betriebsnr,
      antrag_typ: typ, arbeitsausfall_grund: grund,
      anzahl_betroffene: Number(betroffene), arbeitsausfall_prozent: Number(prozent),
      voraussichtliche_dauer_monate: Number(dauer),
      ist_betriebsrat: betriebsrat, einverstaendnis_betriebsrat: einverstaendnis, notes,
    });
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return; }
    toast({ title: "KUG-Antrag angelegt" });
    setOpen(false); setVon(""); setBis(""); setGrund(""); setBetroffene("0"); setProzent("0"); setNotes("");
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "beantragt") patch.beantragt_am = new Date().toISOString();
    if (status === "bewilligt") patch.bewilligt_am = new Date().toISOString();
    await supabase.from("kug_antraege" as any).update(patch).eq("id", id);
    load();
  };

  return (
    <MainLayout>
      <PageSeo title="Kurzarbeitergeld (KUG)" description="Anzeige über Arbeitsausfall und Leistungsantrag KUG verwalten." path="/kug" />
      <AppBreadcrumb segments={[{ label: "Meldewesen", path: "/meldewesen" }, { label: "Kurzarbeitergeld" }]} />
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Kurzarbeitergeld (KUG)" description="§§ 95 ff. SGB III – Anzeige Arbeitsausfall & Leistungsantrag" onBack={() => navigate("/meldewesen")} />
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> KUG-Anträge</CardTitle>
              <CardDescription>Übermittlung an Bundesagentur für Arbeit (extern, Folgeschritt)</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Neuer KUG-Antrag</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>KUG-Antrag erfassen</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Antrag-Typ</Label>
                    <Select value={typ} onValueChange={setTyp}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anzeige">Anzeige Arbeitsausfall</SelectItem>
                        <SelectItem value="leistungsantrag">Leistungsantrag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Agentur für Arbeit</Label><Input value={agentur} onChange={e => setAgentur(e.target.value)} /></div>
                  <div><Label>Betriebsnummer</Label><Input value={betriebsnr} onChange={e => setBetriebsnr(e.target.value)} /></div>
                  <div><Label>Voraussichtliche Dauer (Monate)</Label><Input type="number" value={dauer} onChange={e => setDauer(e.target.value)} /></div>
                  <div><Label>Beginn</Label><Input type="date" value={von} onChange={e => setVon(e.target.value)} /></div>
                  <div><Label>Ende</Label><Input type="date" value={bis} onChange={e => setBis(e.target.value)} /></div>
                  <div><Label>Anzahl Betroffene</Label><Input type="number" value={betroffene} onChange={e => setBetroffene(e.target.value)} /></div>
                  <div><Label>Arbeitsausfall %</Label><Input type="number" value={prozent} onChange={e => setProzent(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Grund des Arbeitsausfalls</Label><Textarea value={grund} onChange={e => setGrund(e.target.value)} /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={betriebsrat} onChange={e => setBetriebsrat(e.target.checked)} /><Label>Betriebsrat vorhanden</Label></div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={einverstaendnis} onChange={e => setEinverstaendnis(e.target.checked)} /><Label>Einverständnis Betriebsrat</Label></div>
                  <div className="col-span-2"><Label>Notizen</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
                </div>
                <DialogFooter><Button onClick={create}>Anlegen</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Typ</TableHead><TableHead>Zeitraum</TableHead><TableHead>Betroffene</TableHead><TableHead>Ausfall</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map(it => (
                    <TableRow key={it.id}>
                      <TableCell className="text-xs">{it.antrag_typ}</TableCell>
                      <TableCell className="text-xs">{it.zeitraum_von} – {it.zeitraum_bis}</TableCell>
                      <TableCell>{it.anzahl_betroffene}</TableCell>
                      <TableCell>{Number(it.arbeitsausfall_prozent).toFixed(0)} %</TableCell>
                      <TableCell><Badge variant={it.status === "bewilligt" ? "default" : "outline"}>{STATUS[it.status] || it.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        {it.status === "entwurf" && <Button size="sm" variant="outline" onClick={() => setStatus(it.id, "beantragt")}><Send className="h-4 w-4 mr-1" />Beantragen</Button>}
                        {it.status === "beantragt" && <Button size="sm" onClick={() => setStatus(it.id, "bewilligt")}><CheckCircle2 className="h-4 w-4 mr-1" />Bewilligt</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Keine KUG-Anträge.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}