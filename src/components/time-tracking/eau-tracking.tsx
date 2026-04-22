import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Stethoscope, Plus, RefreshCw, Info, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useEauRecords, type EauRecord } from "@/hooks/use-eau-records";
import { useEmployees } from "@/contexts/employee-context";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const STATUS_BADGE: Record<EauRecord["abruf_status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  offen: { label: "Offen", variant: "outline", icon: Clock },
  abgerufen: { label: "Abgerufen", variant: "default", icon: CheckCircle },
  fehler: { label: "Fehler", variant: "destructive", icon: AlertCircle },
  manuell: { label: "Manuell", variant: "secondary", icon: Info },
};

export function EauTracking() {
  const { records, isLoading, createRecord, updateRecord, refresh } = useEauRecords();
  const { employees } = useEmployees();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    au_von: "",
    au_bis: "",
    arzt_name: "",
    ist_folge_au: false,
    notes: "",
  });

  const openCount = useMemo(
    () => records.filter((r) => r.abruf_status === "offen").length,
    [records],
  );
  const errorCount = useMemo(
    () => records.filter((r) => r.abruf_status === "fehler").length,
    [records],
  );

  const employeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return "Unbekannt";
    return `${emp.personalData?.firstName ?? ""} ${emp.personalData?.lastName ?? ""}`.trim();
  };

  const handleCreate = async () => {
    if (!form.employee_id || !form.au_von || !form.au_bis) {
      toast({ title: "Pflichtfelder fehlen", variant: "destructive" });
      return;
    }
    const ok = await createRecord({
      employee_id: form.employee_id,
      au_von: form.au_von,
      au_bis: form.au_bis,
      arzt_name: form.arzt_name || null,
      ist_folge_au: form.ist_folge_au,
      notes: form.notes || null,
      abruf_status: "offen",
      arbeitgeber_kenntnis_datum: new Date().toISOString().slice(0, 10),
    });
    if (ok) {
      toast({ title: "eAU-Eintrag angelegt", description: "Bereit zum Abruf bei der Krankenkasse." });
      setDialogOpen(false);
      setForm({ employee_id: "", au_von: "", au_bis: "", arzt_name: "", ist_folge_au: false, notes: "" });
    } else {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
  };

  const markAsRetrieved = async (id: string) => {
    const ok = await updateRecord(id, {
      abruf_status: "abgerufen",
      abruf_datum: new Date().toISOString(),
      diagnose_vorhanden: true,
    });
    if (ok) toast({ title: "Als abgerufen markiert" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              eAU-Tracking
            </CardTitle>
            <CardDescription>
              Elektronische Arbeitsunfähigkeitsbescheinigungen — Abruf-Workflow bei Krankenkassen
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Krankmeldung erfassen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Krankmeldung erfassen</DialogTitle>
                  <DialogDescription>
                    Hinterlegt Arbeitnehmer-Kenntnis. eAU wird anschließend bei der Krankenkasse abgerufen.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Mitarbeiter *</Label>
                    <Select value={form.employee_id} onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mitarbeiter wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.personalData?.firstName} {e.personalData?.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>AU von *</Label>
                      <Input type="date" value={form.au_von} onChange={(e) => setForm((p) => ({ ...p, au_von: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>AU bis *</Label>
                      <Input type="date" value={form.au_bis} onChange={(e) => setForm((p) => ({ ...p, au_bis: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Arzt / Praxis</Label>
                    <Input value={form.arzt_name} onChange={(e) => setForm((p) => ({ ...p, arzt_name: e.target.value }))} placeholder="Dr. Müller, Köln" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="folge"
                      type="checkbox"
                      checked={form.ist_folge_au}
                      onChange={(e) => setForm((p) => ({ ...p, ist_folge_au: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="folge" className="cursor-pointer">Folge-AU (Anschluss-Krankschreibung)</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Notizen</Label>
                    <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                  <Button onClick={handleCreate}>Speichern</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg border border-border p-3">
            <div className="text-sm text-muted-foreground">Offene Abrufe</div>
            <div className="text-2xl font-bold">{openCount}</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-sm text-muted-foreground">Fehler</div>
            <div className="text-2xl font-bold text-destructive">{errorCount}</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-sm text-muted-foreground">Gesamt (letzte 200)</div>
            <div className="text-2xl font-bold">{records.length}</div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-6">Lade...</p>
        ) : records.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Noch keine eAU-Meldungen erfasst. Sobald ein Mitarbeiter krank gemeldet wird,
              hier den Eintrag anlegen — der Abruf erfolgt dann elektronisch bei der Krankenkasse.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>AU-Zeitraum</TableHead>
                <TableHead>Arzt</TableHead>
                <TableHead>Folge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => {
                const badge = STATUS_BADGE[r.abruf_status];
                const Icon = badge.icon;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{employeeName(r.employee_id)}</TableCell>
                    <TableCell>
                      {format(new Date(r.au_von), "dd.MM.yyyy", { locale: de })} –{" "}
                      {format(new Date(r.au_bis), "dd.MM.yyyy", { locale: de })}
                    </TableCell>
                    <TableCell>{r.arzt_name ?? "—"}</TableCell>
                    <TableCell>{r.ist_folge_au ? <Badge variant="secondary">Folge</Badge> : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.abruf_status === "offen" && (
                        <Button size="sm" variant="outline" onClick={() => markAsRetrieved(r.id)}>
                          Als abgerufen markieren
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}