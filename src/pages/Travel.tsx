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
import { Plus, Plane, Loader2, Trash2, CheckCircle2, Upload, FileScan } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/contexts/employee-context";
import { useTenant } from "@/contexts/tenant-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { calculateTravelLeg, aggregateTrip, type TravelLegInput, VERPFLEGUNG_AUSLAND_2025 } from "@/utils/travel-expenses";
import { parseCreditCardCsv } from "@/utils/credit-card-import";

const STATUS_LABEL: Record<string, string> = {
  entwurf: "Entwurf",
  eingereicht: "Eingereicht",
  erste_freigabe: "1. Freigabe (2. fehlt)",
  genehmigt: "Genehmigt",
  abgelehnt: "Abgelehnt",
  abgerechnet: "Abgerechnet",
};

const SECOND_APPROVAL_THRESHOLD = 1000;

export default function Travel() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { employees } = useEmployees();
  const { user, isAdmin, canEdit } = useAuth();
  const { toast } = useToast();

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<Record<string, any[]>>({});
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  // Form
  const [employeeId, setEmployeeId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [country, setCountry] = useState("DE");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [kmDistance, setKmDistance] = useState("0");
  const [lodgingReceipt, setLodgingReceipt] = useState("0");
  const [notes, setNotes] = useState("");

  const fetchTrips = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase
      .from("travel_trips")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("start_at", { ascending: false });
    setTrips(data ?? []);
    if (data?.length) {
      const { data: logRows } = await supabase
        .from("travel_approval_log" as any)
        .select("*")
        .in("trip_id", data.map((t: any) => t.id))
        .order("created_at", { ascending: false });
      const grouped: Record<string, any[]> = {};
      (logRows as any[] | null)?.forEach((r) => {
        (grouped[r.trip_id] ||= []).push(r);
      });
      setLogs(grouped);
    } else {
      setLogs({});
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const buildLegs = (): TravelLegInput[] => {
    if (!startAt || !endAt) return [];
    const start = new Date(startAt);
    const end = new Date(endAt);
    const ms = end.getTime() - start.getTime();
    const totalH = ms / 3_600_000;
    const days = Math.max(1, Math.ceil(totalH / 24));
    const legs: TravelLegInput[] = [];
    for (let i = 0; i < days; i++) {
      const isFirst = i === 0;
      const isLast = i === days - 1;
      const legDate = new Date(start.getTime() + i * 86400000);
      const dayHours = (isFirst || isLast) ? Math.min(totalH, 12) : 24;
      legs.push({
        legDate,
        durationHours: dayHours,
        isOvernight: !isLast,
        isArrivalOrDeparture: isFirst || isLast,
        countryCode: country,
        kmDistance: isFirst ? Number(kmDistance || 0) : 0,
        vehicleType: "pkw",
        lodgingReceiptAmount: !isLast && Number(lodgingReceipt) > 0 ? Number(lodgingReceipt) : undefined,
      });
    }
    return legs;
  };

  const previewTotals = aggregateTrip(buildLegs().map(calculateTravelLeg));

  const handleCreate = async () => {
    if (!tenantId || !employeeId || !startAt || !endAt) return;
    setSaving(true);
    const legs = buildLegs();
    const calced = legs.map(calculateTravelLeg);
    const totals = aggregateTrip(calced);
    const total = Number((totals.taxFree + totals.taxable).toFixed(2));
    const requiresSecond = total >= SECOND_APPROVAL_THRESHOLD;

    const { data: trip, error } = await supabase
      .from("travel_trips")
      .insert({
        tenant_id: tenantId,
        employee_id: employeeId,
        purpose,
        destination,
        country_code: country,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        status: "entwurf",
        notes,
        total_meal_allowance: totals.mealAllowance,
        total_lodging: totals.lodgingAmount,
        total_mileage: totals.mileageAmount,
        total_taxable: totals.taxable,
        total_tax_free: totals.taxFree,
        total_amount: total,
        requires_second_approval: requiresSecond,
      })
      .select()
      .single();

    if (error || !trip) {
      toast({ title: "Fehler", description: error?.message, variant: "destructive" });
      setSaving(false); return;
    }

    await supabase.from("travel_approval_log" as any).insert({
      tenant_id: tenantId, trip_id: trip.id, action: "erstellt",
      actor_user_id: user?.id, actor_role: isAdmin() ? "admin" : "sachbearbeiter",
    });

    if (legs.length) {
      await supabase.from("travel_legs").insert(
        legs.map((l, i) => ({
          trip_id: trip.id,
          tenant_id: tenantId,
          leg_date: l.legDate.toISOString().slice(0, 10),
          duration_hours: l.durationHours,
          is_overnight: l.isOvernight,
          is_arrival_or_departure: l.isArrivalOrDeparture,
          country_code: l.countryCode,
          km_distance: l.kmDistance,
          vehicle_type: l.vehicleType,
          meal_allowance: calced[i].mealAllowance,
          lodging_amount: calced[i].lodgingAmount,
          mileage_amount: calced[i].mileageAmount,
        })),
      );
    }

    toast({ title: "Reise angelegt" });
    setSaving(false);
    setShowCreate(false);
    setEmployeeId(""); setPurpose(""); setDestination(""); setStartAt(""); setEndAt("");
    fetchTrips();
  };

  const logAction = async (tripId: string, action: string, comment?: string) => {
    if (!tenantId) return;
    await supabase.from("travel_approval_log" as any).insert({
      tenant_id: tenantId, trip_id: tripId, action,
      actor_user_id: user?.id,
      actor_role: isAdmin() ? "admin" : (canEdit() ? "sachbearbeiter" : "leserecht"),
      comment: comment ?? null,
    });
  };

  const submitTrip = async (t: any) => {
    await supabase.from("travel_trips").update({
      status: "eingereicht",
      submitted_at: new Date().toISOString(),
      submitted_by: user?.id,
    }).eq("id", t.id);
    await logAction(t.id, "eingereicht");
    fetchTrips();
  };

  const approveTrip = async (t: any) => {
    if (t.requires_second_approval && !t.approved_by) {
      // First approval
      await supabase.from("travel_trips").update({
        status: "erste_freigabe",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      }).eq("id", t.id);
      await logAction(t.id, "erste_freigabe");
    } else if (t.requires_second_approval && t.approved_by && t.approved_by !== user?.id) {
      // Second approval (must be different user)
      await supabase.from("travel_trips").update({
        status: "genehmigt",
        second_approved_by: user?.id,
        second_approved_at: new Date().toISOString(),
      }).eq("id", t.id);
      await logAction(t.id, "zweite_freigabe");
    } else if (t.requires_second_approval && t.approved_by === user?.id) {
      toast({ title: "Vier-Augen-Prinzip", description: "Zweite Freigabe muss durch eine andere Person erfolgen.", variant: "destructive" });
      return;
    } else {
      await supabase.from("travel_trips").update({
        status: "genehmigt",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      }).eq("id", t.id);
      await logAction(t.id, "genehmigt");
    }
    fetchTrips();
  };

  const rejectTrip = async () => {
    if (!rejectFor) return;
    await supabase.from("travel_trips").update({ status: "abgelehnt" }).eq("id", rejectFor);
    await logAction(rejectFor, "abgelehnt", rejectComment);
    setRejectFor(null); setRejectComment("");
    fetchTrips();
  };

  const settleTrip = async (t: any) => {
    await supabase.from("travel_trips").update({ status: "abgerechnet" }).eq("id", t.id);
    await logAction(t.id, "abgerechnet");
    fetchTrips();
  };

  const remove = async (id: string) => {
    await supabase.from("travel_trips").delete().eq("id", id);
    fetchTrips();
  };

  // ── Kreditkarten-Import ───────────────────────────────────────
  const [importTripId, setImportTripId] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const handleCardCsv = async (file: File) => {
    if (!tenantId || !importTripId) {
      toast({ title: "Bitte zuerst Reise wählen", variant: "destructive" }); return;
    }
    setImportBusy(true);
    try {
      const text = await file.text();
      const txs = parseCreditCardCsv(text);
      if (!txs.length) {
        toast({ title: "Keine Transaktionen erkannt", variant: "destructive" });
        return;
      }
      const rows = txs.map(t => ({
        tenant_id: tenantId, trip_id: importTripId,
        receipt_date: t.date, amount: t.amount, vat_amount: 0,
        category: t.category ?? "other", description: t.description,
        source: "creditcard", ocr_status: "skipped",
      }));
      const { error } = await supabase.from("travel_receipts").insert(rows);
      if (error) throw error;
      toast({ title: `${rows.length} Belege importiert` });
    } catch (e: any) {
      toast({ title: "Import-Fehler", description: e.message, variant: "destructive" });
    } finally { setImportBusy(false); }
  };

  // ── Beleg-Upload mit OCR ──────────────────────────────────────
  const [ocrTripId, setOcrTripId] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const handleReceiptOcr = async (file: File) => {
    if (!tenantId || !ocrTripId) {
      toast({ title: "Bitte zuerst Reise wählen", variant: "destructive" }); return;
    }
    setOcrBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${tenantId}/${ocrTripId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receipts").upload(path, file);
      if (upErr) throw upErr;
      const { data: rec, error: recErr } = await supabase.from("travel_receipts").insert({
        tenant_id: tenantId, trip_id: ocrTripId, receipt_date: new Date().toISOString().slice(0,10),
        amount: 0, category: "other", source: "upload", ocr_status: "pending", storage_path: path,
      }).select().single();
      if (recErr) throw recErr;
      const { data: job, error: jobErr } = await supabase.from("receipt_ocr_jobs" as any).insert({
        tenant_id: tenantId, receipt_id: rec.id, storage_path: path, status: "pending",
      }).select().single();
      if (jobErr) throw jobErr;
      const { error: fnErr } = await supabase.functions.invoke("receipt-ocr", { body: { jobId: (job as any).id } });
      if (fnErr) throw fnErr;
      toast({ title: "Beleg hochgeladen & OCR gestartet" });
    } catch (e: any) {
      toast({ title: "Upload-Fehler", description: e.message, variant: "destructive" });
    } finally { setOcrBusy(false); }
  };

  const fmt = (v: number) => Number(v ?? 0).toFixed(2).replace(".", ",") + " €";

  const countryOptions = ["DE", ...Object.keys(VERPFLEGUNG_AUSLAND_2025)];

  return (
    <MainLayout>
      <PageSeo title="Reisekosten" description="Reisekostenabrechnung mit BMF-Pauschalen, Belegen und Genehmigungs-Workflow." path="/travel" />
      <AppBreadcrumb segments={[{ label: "Reisekosten" }]} />
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Reisekosten"
          description="Verpflegungspauschalen (DE/Ausland), km-Pauschale, Übernachtung, Belege"
          onBack={() => navigate("/dashboard")}
        />

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5 text-primary" /> Reisen</CardTitle>
              <CardDescription>BMF-konforme Berechnung 2025/2026</CardDescription>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Neue Reise</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Neue Reise erfassen</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Mitarbeiter</Label>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger><SelectValue placeholder="Mitarbeiter wählen" /></SelectTrigger>
                      <SelectContent>
                        {employees.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.personalData.firstName} {e.personalData.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Anlass</Label><Input value={purpose} onChange={e => setPurpose(e.target.value)} /></div>
                  <div><Label>Reiseziel</Label><Input value={destination} onChange={e => setDestination(e.target.value)} /></div>
                  <div>
                    <Label>Land</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {countryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>km gesamt</Label><Input type="number" value={kmDistance} onChange={e => setKmDistance(e.target.value)} /></div>
                  <div><Label>Beginn</Label><Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} /></div>
                  <div><Label>Ende</Label><Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Übernachtungs-Beleg (gesamt, optional)</Label><Input type="number" value={lodgingReceipt} onChange={e => setLodgingReceipt(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Notizen</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
                </div>
                <Card className="bg-muted/40">
                  <CardContent className="pt-4 grid grid-cols-3 gap-2 text-sm">
                    <div>Verpflegung: <strong>{fmt(previewTotals.mealAllowance)}</strong></div>
                    <div>Übernachtung: <strong>{fmt(previewTotals.lodgingAmount)}</strong></div>
                    <div>km-Pauschale: <strong>{fmt(previewTotals.mileageAmount)}</strong></div>
                    <div className="col-span-3 border-t pt-2">Gesamt steuerfrei: <strong>{fmt(previewTotals.taxFree)}</strong></div>
                  </CardContent>
                </Card>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={saving || !employeeId}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Anlegen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Reise</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead>Land</TableHead>
                    <TableHead className="text-right">Gesamt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map(t => {
                    const emp = employees.find(e => e.id === t.employee_id);
                    return (
                      <TableRow key={t.id}>
                        <TableCell>{emp ? `${emp.personalData.firstName} ${emp.personalData.lastName}` : '—'}</TableCell>
                        <TableCell><div className="font-medium">{t.purpose}</div><div className="text-xs text-muted-foreground">{t.destination}</div></TableCell>
                        <TableCell className="text-xs">{new Date(t.start_at).toLocaleDateString('de-DE')} – {new Date(t.end_at).toLocaleDateString('de-DE')}</TableCell>
                        <TableCell>{t.country_code}</TableCell>
                        <TableCell className="text-right">{fmt(Number(t.total_tax_free))}</TableCell>
                        <TableCell><Badge variant="outline">{STATUS_LABEL[t.status] || t.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end flex-wrap">
                            {t.status === 'entwurf' && <Button size="sm" variant="outline" onClick={() => submitTrip(t)}>Einreichen</Button>}
                            {(t.status === 'eingereicht' || t.status === 'erste_freigabe') && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => approveTrip(t)}>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  {t.requires_second_approval && t.status === 'eingereicht' ? '1. Freigabe' :
                                   t.requires_second_approval ? '2. Freigabe' : 'Genehmigen'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setRejectFor(t.id)}>Ablehnen</Button>
                              </>
                            )}
                            {t.status === 'genehmigt' && <Button size="sm" variant="outline" onClick={() => settleTrip(t)}>Abrechnen</Button>}
                            <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                          {logs[t.id]?.length > 0 && (
                            <details className="mt-1 text-xs text-left text-muted-foreground">
                              <summary className="cursor-pointer">Audit ({logs[t.id].length})</summary>
                              <ul className="mt-1 space-y-0.5">
                                {logs[t.id].map(l => (
                                  <li key={l.id}>
                                    {new Date(l.created_at).toLocaleString('de-DE')} – <strong>{l.action}</strong>
                                    {l.comment ? ` – ${l.comment}` : ''}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!trips.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Noch keine Reisen.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />Kreditkarten-CSV-Import</CardTitle>
              <CardDescription>Amex / Visa Business / Mastercard / DKB – automatische Kategorisierung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Reise auswählen</Label>
                <Select value={importTripId} onValueChange={setImportTripId}>
                  <SelectTrigger><SelectValue placeholder="Reise wählen" /></SelectTrigger>
                  <SelectContent>
                    {trips.map(t => <SelectItem key={t.id} value={t.id}>{t.purpose || t.destination || t.id.slice(0,8)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input type="file" accept=".csv,text/csv" disabled={importBusy || !importTripId}
                onChange={e => e.target.files?.[0] && handleCardCsv(e.target.files[0])} />
              {importBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileScan className="h-5 w-5 text-primary" />Beleg hochladen (OCR)</CardTitle>
              <CardDescription>Foto/PDF – Datum, Händler, Betrag werden per KI extrahiert</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Reise auswählen</Label>
                <Select value={ocrTripId} onValueChange={setOcrTripId}>
                  <SelectTrigger><SelectValue placeholder="Reise wählen" /></SelectTrigger>
                  <SelectContent>
                    {trips.map(t => <SelectItem key={t.id} value={t.id}>{t.purpose || t.destination || t.id.slice(0,8)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input type="file" accept="image/*,application/pdf" disabled={ocrBusy || !ocrTripId}
                onChange={e => e.target.files?.[0] && handleReceiptOcr(e.target.files[0])} />
              {ocrBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}