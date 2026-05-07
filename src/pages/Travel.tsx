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
import { Plus, Plane, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/contexts/employee-context";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";
import { calculateTravelLeg, aggregateTrip, type TravelLegInput, VERPFLEGUNG_AUSLAND_2025 } from "@/utils/travel-expenses";

const STATUS_LABEL: Record<string, string> = {
  entwurf: "Entwurf",
  eingereicht: "Eingereicht",
  genehmigt: "Genehmigt",
  abgelehnt: "Abgelehnt",
  abgerechnet: "Abgerechnet",
};

export default function Travel() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { employees } = useEmployees();
  const { toast } = useToast();

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

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
      })
      .select()
      .single();

    if (error || !trip) {
      toast({ title: "Fehler", description: error?.message, variant: "destructive" });
      setSaving(false); return;
    }

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

  const setStatus = async (id: string, status: string) => {
    await supabase.from("travel_trips").update({ status }).eq("id", id);
    fetchTrips();
  };

  const remove = async (id: string) => {
    await supabase.from("travel_trips").delete().eq("id", id);
    fetchTrips();
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
                          {t.status === 'entwurf' && <Button size="sm" variant="outline" onClick={() => setStatus(t.id, 'eingereicht')}>Einreichen</Button>}
                          {t.status === 'eingereicht' && <Button size="sm" variant="outline" onClick={() => setStatus(t.id, 'genehmigt')}><CheckCircle2 className="h-4 w-4 mr-1" /> Genehmigen</Button>}
                          {t.status === 'genehmigt' && <Button size="sm" variant="outline" onClick={() => setStatus(t.id, 'abgerechnet')}>Abrechnen</Button>}
                          <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
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
      </div>
    </MainLayout>
  );
}