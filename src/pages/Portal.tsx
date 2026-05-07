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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plane, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";

export default function Portal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [link, setLink] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    if (!tenantId || !user) return;
    setLoading(true);
    const { data: l } = await supabase.from("employee_portal_users" as any)
      .select("*").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle();
    setLink(l);
    if (l && (l as any).employee_id) {
      const empId = (l as any).employee_id;
      const { data: ps } = await supabase.from("payroll_entries").select("*, payroll_periods!inner(month,year)")
        .eq("employee_id", empId).order("created_at", { ascending: false }).limit(24);
      setPayslips(ps ?? []);
      const { data: vac } = await supabase.from("vacation_requests" as any).select("*")
        .eq("employee_id", empId).order("created_at", { ascending: false });
      setVacations((vac as any[]) ?? []);
    }
    setLoading(false);
  }, [tenantId, user]);
  useEffect(() => { load(); }, [load]);

  const requestVacation = async () => {
    if (!tenantId || !link || !start || !end) return;
    const days = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
    const { error } = await supabase.from("vacation_requests" as any).insert({
      tenant_id: tenantId, employee_id: (link as any).employee_id,
      start_date: start, end_date: end, days, reason, status: "offen",
    });
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Urlaubsantrag gestellt" });
    setStart(""); setEnd(""); setReason("");
    load();
  };

  const fmt = (v: number) => Number(v ?? 0).toFixed(2).replace(".", ",") + " €";

  return (
    <MainLayout>
      <PageSeo title="Mein Portal" description="Eigene Lohnzettel einsehen und Urlaubsanträge stellen." path="/portal" />
      <AppBreadcrumb segments={[{ label: "Mein Portal" }]} />
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Mein Mitarbeiter-Portal" description="Lohnzettel & Urlaubsanträge" onBack={() => navigate("/dashboard")} />
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : !link ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Dein Account ist noch keinem Mitarbeiterstammsatz zugeordnet. Bitte wende dich an die Personalabteilung.</CardContent></Card>
        ) : (
          <>
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Meine Lohnzettel</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Periode</TableHead><TableHead className="text-right">Brutto</TableHead><TableHead className="text-right">Netto</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payslips.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{String(p.payroll_periods?.month).padStart(2,'0')}/{p.payroll_periods?.year}</TableCell>
                        <TableCell className="text-right">{fmt(Number(p.gross_salary))}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(Number(p.final_net_salary))}</TableCell>
                      </TableRow>
                    ))}
                    {!payslips.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Noch keine Lohnzettel.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5 text-primary" />Urlaubsanträge</CardTitle>
                <CardDescription>Neuen Antrag stellen oder Status einsehen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div><Label>Von</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
                  <div><Label>Bis</Label><Input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
                  <div className="md:col-span-2"><Label>Grund (optional)</Label><Textarea rows={1} value={reason} onChange={e => setReason(e.target.value)} /></div>
                  <div className="md:col-span-4"><Button onClick={requestVacation} disabled={!start || !end}>Antrag senden</Button></div>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Zeitraum</TableHead><TableHead>Tage</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {vacations.map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs">{v.start_date} – {v.end_date}</TableCell>
                        <TableCell>{v.days}</TableCell>
                        <TableCell><Badge variant={v.status === 'genehmigt' ? 'default' : v.status === 'abgelehnt' ? 'destructive' : 'outline'}>{v.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {!vacations.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Keine Anträge.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}