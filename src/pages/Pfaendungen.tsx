import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Plus, Loader2, Scale, CheckCircle2, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/contexts/employee-context";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";
import { calculateGarnishment } from "@/utils/garnishment-calculation";

const STATUS: Record<string,string> = { aktiv: "Aktiv", erledigt: "Erledigt", ruhend: "Ruhend", aufgehoben: "Aufgehoben" };

export default function Pfaendungen() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [glaeubiger, setGlaeubiger] = useState("");
  const [adresse, setAdresse] = useState("");
  const [aktenzeichen, setAktenzeichen] = useState("");
  const [typ, setTyp] = useState("normal");
  const [forderung, setForderung] = useState("0");
  const [rang, setRang] = useState("1");
  const [dependents, setDependents] = useState("0");
  const [zustellung, setZustellung] = useState("");
  const [beginn, setBeginn] = useState(new Date().toISOString().slice(0,10));
  const [iban, setIban] = useState("");
  const [notes, setNotes] = useState("");

  // Simulator
  const [simNetto, setSimNetto] = useState("3000");
  const [simDeps, setSimDeps] = useState("0");
  const simResult = useMemo(() => {
    try {
      return calculateGarnishment({ netIncome: Number(simNetto), numberOfDependents: Number(simDeps), year: 2026 });
    } catch { return null; }
  }, [simNetto, simDeps]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("employee_garnishments" as any).select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    setItems((data as any[]) ?? []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!tenantId || !employeeId || !glaeubiger || !beginn) return;
    const { error } = await supabase.from("employee_garnishments" as any).insert({
      tenant_id: tenantId, employee_id: employeeId, glaeubiger, glaeubiger_adresse: adresse,
      aktenzeichen, pfaendungs_typ: typ, forderungsbetrag: Number(forderung),
      resttbetrag: Number(forderung), rang: Number(rang),
      unterhaltsberechtigte: Number(dependents),
      zustellungsdatum: zustellung || null, beginn_datum: beginn,
      bank_iban: iban, notes,
    });
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Pfändung angelegt" });
    setOpen(false); setEmployeeId(""); setGlaeubiger(""); setAktenzeichen(""); setForderung("0"); setNotes("");
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await supabase.from("employee_garnishments" as any).update({ status, ende_datum: status === "erledigt" ? new Date().toISOString().slice(0,10) : null }).eq("id", id);
    load();
  };

  const empName = (id: string) => {
    const e = employees.find(x => x.id === id);
    return e ? `${e.personalData.firstName} ${e.personalData.lastName}` : "—";
  };

  const fmt = (v: number) => Number(v ?? 0).toFixed(2).replace(".", ",") + " €";

  return (
    <MainLayout>
      <PageSeo title="Pfändungsverwaltung" description="Lohn- und Gehaltspfändungen verwalten, Rangfolge und Resttbeträge nachhalten." path="/pfaendungen" />
      <AppBreadcrumb segments={[{ label: "Mitarbeiter", path: "/employees" }, { label: "Pfändungen" }]} />
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Pfändungsverwaltung" description="ZPO §§ 850 ff. – Pfändungstabelle 2026, Rangfolge, Unterhaltspfändungen" onBack={() => navigate("/employees")} />

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Pfändungs-Rechner</CardTitle>
            <CardDescription>Schnelle Berechnung nach aktueller Pfändungstabelle</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Netto-Einkommen</Label><Input type="number" value={simNetto} onChange={e => setSimNetto(e.target.value)} /></div>
            <div><Label>Unterhaltsberechtigte</Label><Input type="number" value={simDeps} onChange={e => setSimDeps(e.target.value)} /></div>
            <div className="bg-muted/40 rounded-md p-3">
              <div className="text-sm text-muted-foreground">Pfändbarer Betrag</div>
              <div className="text-2xl font-semibold">{simResult ? fmt(simResult.garnishableAmount) : "—"}</div>
              <div className="text-xs text-muted-foreground">Freibetrag: {simResult ? fmt(simResult.exemptAmount) : "—"}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /> Aktive Pfändungen</CardTitle>
              <CardDescription>Mitarbeiterbezogen, mit Rangfolge</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Neue Pfändung</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Pfändung erfassen</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Label>Mitarbeiter</Label>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger><SelectValue placeholder="Mitarbeiter wählen" /></SelectTrigger>
                      <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.personalData.firstName} {e.personalData.lastName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Typ</Label>
                    <Select value={typ} onValueChange={setTyp}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normale Pfändung</SelectItem>
                        <SelectItem value="unterhalt">Unterhaltspfändung</SelectItem>
                        <SelectItem value="insolvenz">Insolvenz / Abtretung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Rang</Label><Input type="number" value={rang} onChange={e => setRang(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Gläubiger</Label><Input value={glaeubiger} onChange={e => setGlaeubiger(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Gläubiger-Adresse</Label><Input value={adresse} onChange={e => setAdresse(e.target.value)} /></div>
                  <div><Label>Aktenzeichen</Label><Input value={aktenzeichen} onChange={e => setAktenzeichen(e.target.value)} /></div>
                  <div><Label>Forderungsbetrag</Label><Input type="number" value={forderung} onChange={e => setForderung(e.target.value)} /></div>
                  <div><Label>Unterhaltsberechtigte</Label><Input type="number" value={dependents} onChange={e => setDependents(e.target.value)} /></div>
                  <div><Label>Zustellung am</Label><Input type="date" value={zustellung} onChange={e => setZustellung(e.target.value)} /></div>
                  <div><Label>Beginn</Label><Input type="date" value={beginn} onChange={e => setBeginn(e.target.value)} /></div>
                  <div><Label>Empfänger-IBAN</Label><Input value={iban} onChange={e => setIban(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Notizen</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
                </div>
                <DialogFooter><Button onClick={create}>Anlegen</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Mitarbeiter</TableHead><TableHead>Gläubiger</TableHead><TableHead>Az.</TableHead><TableHead>Typ</TableHead><TableHead>Rang</TableHead><TableHead className="text-right">Forderung</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map(it => (
                    <TableRow key={it.id}>
                      <TableCell>{empName(it.employee_id)}</TableCell>
                      <TableCell className="text-xs">{it.glaeubiger}</TableCell>
                      <TableCell className="text-xs">{it.aktenzeichen || "—"}</TableCell>
                      <TableCell className="text-xs">{it.pfaendungs_typ}</TableCell>
                      <TableCell>{it.rang}</TableCell>
                      <TableCell className="text-right">{fmt(Number(it.forderungsbetrag))}</TableCell>
                      <TableCell><Badge variant={it.status === "aktiv" ? "default" : "outline"}>{STATUS[it.status] || it.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        {it.status === "aktiv" && <Button size="sm" variant="outline" onClick={() => setStatus(it.id, "erledigt")}><CheckCircle2 className="h-4 w-4 mr-1" />Erledigen</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Keine aktiven Pfändungen.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}