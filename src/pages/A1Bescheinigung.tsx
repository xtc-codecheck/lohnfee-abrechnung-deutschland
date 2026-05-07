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
import { Plus, Loader2, FileSignature, Send, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/contexts/employee-context";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";

const EU_LAENDER = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","CH","NO","IS","LI","UK"];
const STATUS: Record<string,string> = { entwurf: "Entwurf", beantragt: "Beantragt", ausgestellt: "Ausgestellt", abgelehnt: "Abgelehnt" };

export default function A1Bescheinigung() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [land, setLand] = useState("AT");
  const [von, setVon] = useState("");
  const [bis, setBis] = useState("");
  const [taetigkeit, setTaetigkeit] = useState("");
  const [auftraggeber, setAuftraggeber] = useState("");
  const [art, setArt] = useState("entsendung");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("a1_bescheinigungen" as any).select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    setItems((data as any[]) ?? []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!tenantId || !employeeId || !von || !bis) return;
    const { error } = await supabase.from("a1_bescheinigungen" as any).insert({
      tenant_id: tenantId, employee_id: employeeId, entsendeland: land,
      zeitraum_von: von, zeitraum_bis: bis, taetigkeit, auftraggeber, art, notes,
    });
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return; }
    toast({ title: "A1-Antrag angelegt" });
    setOpen(false); setEmployeeId(""); setVon(""); setBis(""); setTaetigkeit(""); setAuftraggeber(""); setNotes("");
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "beantragt") patch.beantragt_am = new Date().toISOString();
    if (status === "ausgestellt") patch.ausgestellt_am = new Date().toISOString();
    await supabase.from("a1_bescheinigungen" as any).update(patch).eq("id", id);
    load();
  };

  const empName = (id: string) => {
    const e = employees.find(x => x.id === id);
    return e ? `${e.personalData.firstName} ${e.personalData.lastName}` : "—";
  };

  return (
    <MainLayout>
      <PageSeo title="A1-Bescheinigung" description="Entsendebescheinigungen A1 für EU/EWR/Schweiz beantragen und verwalten." path="/a1" />
      <AppBreadcrumb segments={[{ label: "Meldewesen", path: "/meldewesen" }, { label: "A1-Bescheinigung" }]} />
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="A1-Bescheinigung" description="Entsendung in EU / EWR / Schweiz nach VO (EG) 883/2004" onBack={() => navigate("/meldewesen")} />
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary" /> A1-Anträge</CardTitle>
              <CardDescription>Antragsverwaltung – Übermittlung an DSRV folgt mit ITSG-Zertifikat</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Neuer A1-Antrag</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Neuen A1-Antrag erfassen</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Label>Mitarbeiter</Label>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger><SelectValue placeholder="Mitarbeiter wählen" /></SelectTrigger>
                      <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.personalData.firstName} {e.personalData.lastName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Entsendeland</Label>
                    <Select value={land} onValueChange={setLand}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EU_LAENDER.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Art</Label>
                    <Select value={art} onValueChange={setArt}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entsendung">Entsendung</SelectItem>
                        <SelectItem value="mehrfachbeschaeftigung">Mehrfachbeschäftigung</SelectItem>
                        <SelectItem value="ausnahmevereinbarung">Ausnahmevereinbarung Art. 16</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Beginn</Label><Input type="date" value={von} onChange={e => setVon(e.target.value)} /></div>
                  <div><Label>Ende</Label><Input type="date" value={bis} onChange={e => setBis(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Tätigkeit</Label><Input value={taetigkeit} onChange={e => setTaetigkeit(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Auftraggeber im Ausland</Label><Input value={auftraggeber} onChange={e => setAuftraggeber(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Notizen</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
                </div>
                <DialogFooter><Button onClick={create}>Anlegen</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Mitarbeiter</TableHead><TableHead>Land</TableHead><TableHead>Zeitraum</TableHead><TableHead>Art</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map(it => (
                    <TableRow key={it.id}>
                      <TableCell>{empName(it.employee_id)}</TableCell>
                      <TableCell>{it.entsendeland}</TableCell>
                      <TableCell className="text-xs">{it.zeitraum_von} – {it.zeitraum_bis}</TableCell>
                      <TableCell className="text-xs">{it.art}</TableCell>
                      <TableCell><Badge variant={it.status === "ausgestellt" ? "default" : "outline"}>{STATUS[it.status] || it.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        {it.status === "entwurf" && <Button size="sm" variant="outline" onClick={() => setStatus(it.id, "beantragt")}><Send className="h-4 w-4 mr-1" />Beantragen</Button>}
                        {it.status === "beantragt" && <Button size="sm" onClick={() => setStatus(it.id, "ausgestellt")}><CheckCircle2 className="h-4 w-4 mr-1" />Ausgestellt</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Keine A1-Anträge.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}