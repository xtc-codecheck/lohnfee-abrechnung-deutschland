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
import { Loader2, Plane, FileText, Upload, Inbox, Download, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";

export default function Portal() {
  const navigate = useNavigate();
  const { user, canEdit } = useAuth();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [link, setLink] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [eauUploading, setEauUploading] = useState(false);
  const [eauList, setEauList] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!tenantId || !user) return;
    setLoading(true);
    const { data: l } = await supabase.from("employee_portal_users" as any)
      .select("*").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle();
    setLink(l);
    if (l && (l as any).employee_id) {
      const empId = (l as any).employee_id;
      const { data: emp } = await supabase.from("employees").select("*").eq("id", empId).maybeSingle();
      setEmployee(emp);
      const { data: ps } = await supabase.from("payroll_entries").select("*, payroll_periods!inner(month,year)")
        .eq("employee_id", empId).order("created_at", { ascending: false }).limit(24);
      setPayslips(ps ?? []);
      const { data: vac } = await supabase.from("vacation_requests" as any).select("*")
        .eq("employee_id", empId).order("created_at", { ascending: false });
      setVacations((vac as any[]) ?? []);
      const { data: eau } = await supabase.from("eau_records").select("*")
        .eq("employee_id", empId).order("created_at", { ascending: false }).limit(20);
      setEauList(eau ?? []);
    }
    if (canEdit()) {
      const { data: inboxRows } = await supabase.from("vacation_requests" as any)
        .select("*, employees!inner(first_name,last_name,personal_number)")
        .eq("tenant_id", tenantId).eq("status", "offen").order("created_at", { ascending: false });
      setInbox((inboxRows as any[]) ?? []);
    }
    setLoading(false);
  }, [tenantId, user, canEdit]);
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

  const decideVacation = async (id: string, status: 'genehmigt' | 'abgelehnt') => {
    const { error } = await supabase.from("vacation_requests" as any).update({
      status, decided_at: new Date().toISOString(), decided_by: user?.id,
    }).eq("id", id);
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return; }
    toast({ title: status === 'genehmigt' ? 'Urlaub genehmigt' : 'Urlaub abgelehnt' });
    load();
  };

  const handleEauUpload = async (file: File) => {
    if (!tenantId || !link) return;
    setEauUploading(true);
    try {
      const empId = (link as any).employee_id;
      const ext = file.name.split('.').pop() || 'pdf';
      const path = `${tenantId}/${empId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('eau-attests').upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from('eau_records').insert({
        tenant_id: tenantId, employee_id: empId,
        au_von: new Date().toISOString().slice(0, 10),
        au_bis: new Date().toISOString().slice(0, 10),
        abruf_status: 'eingereicht',
        storage_path: path,
        submitted_by_employee: true,
        notes: `Selbst-Upload: ${file.name}`,
      });
      if (error) throw error;
      toast({ title: 'eAU hochgeladen' });
      load();
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    } finally { setEauUploading(false); }
  };

  const downloadPayslip = async (entry: any) => {
    if (!employee) return;
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const period = entry.payroll_periods;
      const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
      const eur = (v: number) => Number(v ?? 0).toFixed(2).replace('.', ',') + ' €';
      doc.setFillColor(24, 24, 38); doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('Entgeltabrechnung', 20, 18);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`${months[period.month - 1]} ${period.year}`, 190, 18, { align: 'right' });
      doc.setTextColor(40, 40, 40);
      let y = 40;
      doc.setFont('helvetica', 'bold'); doc.text('Mitarbeiter', 20, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`${employee.first_name} ${employee.last_name}`, 20, y); y += 5;
      doc.text(`Personalnr.: ${employee.personal_number ?? '—'}`, 20, y); y += 5;
      doc.text(`Steuerklasse: ${employee.tax_class ?? '—'}`, 20, y); y += 10;

      doc.setFont('helvetica', 'bold'); doc.text('Bezüge & Abzüge', 20, y); y += 6;
      doc.setFont('helvetica', 'normal');
      const rows: [string, number][] = [
        ['Bruttolohn', Number(entry.gross_salary)],
        ['Lohnsteuer', -Number(entry.tax_income_tax ?? 0)],
        ['Solidaritätszuschlag', -Number(entry.tax_solidarity ?? 0)],
        ['Kirchensteuer', -Number(entry.tax_church ?? 0)],
        ['KV (AN)', -Number(entry.sv_health_employee ?? 0)],
        ['RV (AN)', -Number(entry.sv_pension_employee ?? 0)],
        ['AV (AN)', -Number(entry.sv_unemployment_employee ?? 0)],
        ['PV (AN)', -Number(entry.sv_care_employee ?? 0)],
      ];
      for (const [label, val] of rows) {
        doc.text(label, 24, y);
        doc.text(eur(val), 186, y, { align: 'right' });
        y += 5;
      }
      y += 3; doc.setDrawColor(180); doc.line(20, y, 190, y); y += 6;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('Auszahlungsbetrag', 24, y);
      doc.text(eur(Number(entry.final_net_salary)), 186, y, { align: 'right' });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120);
      doc.text('Erstellt über Mitarbeiter-Portal · Selbstauskunft gem. §108 GewO', 20, 285);
      doc.save(`Lohnzettel_${employee.last_name}_${period.year}-${String(period.month).padStart(2, '0')}.pdf`);
    } catch (e: any) {
      toast({ title: 'PDF-Fehler', description: e.message, variant: 'destructive' });
    }
  };

  // Vacation balance
  const currentYear = new Date().getFullYear();
  const usedDays = vacations
    .filter(v => v.status !== 'abgelehnt' && new Date(v.start_date).getFullYear() === currentYear && v.request_type !== 'krank')
    .reduce((s, v) => s + Number(v.days || 0), 0);
  const totalDays = Number(employee?.vacation_days_per_year ?? 30);
  const remainingDays = Math.max(0, totalDays - usedDays);

  const fmt = (v: number) => Number(v ?? 0).toFixed(2).replace(".", ",") + " €";

  return (
    <MainLayout>
      <PageSeo title="Mein Portal" description="Eigene Lohnzettel einsehen und Urlaubsanträge stellen." path="/portal" />
      <AppBreadcrumb segments={[{ label: "Mein Portal" }]} />
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Mein Mitarbeiter-Portal" description="Lohnzettel & Urlaubsanträge" onBack={() => navigate("/dashboard")} />
        {canEdit() && inbox.length > 0 && (
          <Card className="shadow-card border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5 text-primary" />Posteingang: Offene Urlaubsanträge ({inbox.length})</CardTitle>
              <CardDescription>Als Vorgesetzter genehmigen oder ablehnen</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Mitarbeiter</TableHead><TableHead>Zeitraum</TableHead><TableHead>Tage</TableHead><TableHead>Grund</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
                <TableBody>
                  {inbox.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.employees?.first_name} {v.employees?.last_name}</TableCell>
                      <TableCell className="text-xs">{v.start_date} – {v.end_date}</TableCell>
                      <TableCell>{v.days}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{v.reason || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => decideVacation(v.id, 'genehmigt')}><CheckCircle2 className="h-4 w-4 mr-1" />Genehmigen</Button>
                        <Button size="sm" variant="ghost" onClick={() => decideVacation(v.id, 'abgelehnt')}><XCircle className="h-4 w-4 mr-1" />Ablehnen</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : !link ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Dein Account ist noch keinem Mitarbeiterstammsatz zugeordnet. Bitte wende dich an die Personalabteilung.</CardContent></Card>
        ) : (
          <>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Meine Lohnzettel</CardTitle>
                <CardDescription>PDF-Download verfügbar</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Periode</TableHead><TableHead className="text-right">Brutto</TableHead><TableHead className="text-right">Netto</TableHead><TableHead className="text-right">PDF</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payslips.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{String(p.payroll_periods?.month).padStart(2,'0')}/{p.payroll_periods?.year}</TableCell>
                        <TableCell className="text-right">{fmt(Number(p.gross_salary))}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(Number(p.final_net_salary))}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => downloadPayslip(p)}><Download className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!payslips.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Noch keine Lohnzettel.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5 text-primary" />Urlaubsanträge</CardTitle>
                <CardDescription>
                  Resturlaub {currentYear}: <strong>{remainingDays}</strong> von {totalDays} Tagen ({usedDays} verplant)
                </CardDescription>
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

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />Krankmeldung (eAU) hochladen</CardTitle>
                <CardDescription>Foto/PDF des Arzt-Attests einreichen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input type="file" accept="image/*,application/pdf" disabled={eauUploading}
                  onChange={e => e.target.files?.[0] && handleEauUpload(e.target.files[0])} />
                {eauUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Table>
                  <TableHeader><TableRow><TableHead>Eingereicht</TableHead><TableHead>Zeitraum</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {eauList.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">{new Date(e.created_at).toLocaleDateString('de-DE')}</TableCell>
                        <TableCell className="text-xs">{e.au_von} – {e.au_bis}</TableCell>
                        <TableCell><Badge variant="outline">{e.abruf_status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {!eauList.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Keine eAU-Einträge.</TableCell></TableRow>}
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