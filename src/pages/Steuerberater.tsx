import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageSeo } from "@/components/seo/page-seo";
import { PageHeader } from "@/components/ui/page-header";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Send, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";

export default function Steuerberater() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("payroll_periods").select("*")
      .eq("tenant_id", tenantId).order("year", { ascending: false }).order("month", { ascending: false });
    setPeriods(data ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const loadMessages = async (periodId: string) => {
    const { data } = await supabase.from("payroll_run_messages").select("*")
      .eq("payroll_period_id", periodId).order("created_at", { ascending: true });
    setMessages(data ?? []);
  };

  const submitForReview = async (id: string) => {
    if (!user) return;
    await supabase.from("payroll_periods").update({
      review_status: "in_review",
      submitted_for_review_at: new Date().toISOString(),
      submitted_for_review_by: user.id,
    }).eq("id", id);
    toast({ title: "Zur Freigabe gesendet" });
    load();
  };

  const release = async (id: string) => {
    if (!user) return;
    await supabase.from("payroll_periods").update({
      review_status: "released",
      released_at: new Date().toISOString(),
      released_by: user.id,
    }).eq("id", id);
    toast({ title: "Lauf freigegeben" });
    load();
  };

  const reject = async (id: string) => {
    await supabase.from("payroll_periods").update({ review_status: "rejected" }).eq("id", id);
    toast({ title: "Lauf zurückgewiesen" });
    load();
  };

  const postMessage = async () => {
    if (!user || !selectedPeriod || !tenantId || !newMessage.trim()) return;
    await supabase.from("payroll_run_messages").insert({
      tenant_id: tenantId,
      payroll_period_id: selectedPeriod.id,
      author_user_id: user.id,
      author_role: "mandant",
      message: newMessage.trim(),
    });
    setNewMessage("");
    loadMessages(selectedPeriod.id);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      open: "Entwurf", in_review: "Zur Freigabe", released: "Freigegeben", rejected: "Abgelehnt",
    };
    return <Badge variant={s === 'released' ? 'default' : s === 'rejected' ? 'destructive' : 'outline'}>{map[s] || s}</Badge>;
  };

  return (
    <MainLayout>
      <PageSeo title="Steuerberater-Workflow" description="Lohn-Läufe zur Freigabe einreichen, Mandantenkommunikation und Versand." path="/steuerberater" />
      <AppBreadcrumb segments={[{ label: "Steuerberater" }]} />
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Steuerberater-Workflow" description="Freigabe, Mandantenkommunikation à la DATEV Unternehmen online" onBack={() => navigate("/dashboard")} />

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Lohnläufe</CardTitle>
            <CardDescription>Status-Workflow: Entwurf → Zur Freigabe → Freigegeben</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Periode</TableHead><TableHead>Status</TableHead><TableHead>Eingereicht</TableHead><TableHead>Freigegeben</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
                <TableBody>
                  {periods.map(p => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => { setSelectedPeriod(p); loadMessages(p.id); }}>
                      <TableCell>{String(p.month).padStart(2,'0')}/{p.year}</TableCell>
                      <TableCell>{statusBadge(p.review_status || 'open')}</TableCell>
                      <TableCell className="text-xs">{p.submitted_for_review_at ? new Date(p.submitted_for_review_at).toLocaleString('de-DE') : '—'}</TableCell>
                      <TableCell className="text-xs">{p.released_at ? new Date(p.released_at).toLocaleString('de-DE') : '—'}</TableCell>
                      <TableCell className="text-right space-x-1" onClick={e => e.stopPropagation()}>
                        {p.review_status !== 'in_review' && p.review_status !== 'released' && (
                          <Button size="sm" variant="outline" onClick={() => submitForReview(p.id)}><Send className="h-4 w-4 mr-1" />Freigeben</Button>
                        )}
                        {p.review_status === 'in_review' && (<>
                          <Button size="sm" onClick={() => release(p.id)}><CheckCircle2 className="h-4 w-4 mr-1" />Genehmigen</Button>
                          <Button size="sm" variant="destructive" onClick={() => reject(p.id)}><XCircle className="h-4 w-4 mr-1" />Ablehnen</Button>
                        </>)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!periods.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Keine Lohnläufe.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {selectedPeriod && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Kommunikation – {String(selectedPeriod.month).padStart(2,'0')}/{selectedPeriod.year}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {messages.map(m => (
                  <div key={m.id} className="text-sm border rounded-md p-2 bg-muted/30">
                    <div className="text-xs text-muted-foreground">{m.author_role} · {new Date(m.created_at).toLocaleString('de-DE')}</div>
                    <div>{m.message}</div>
                  </div>
                ))}
                {!messages.length && <div className="text-sm text-muted-foreground">Noch keine Nachrichten.</div>}
              </div>
              <div className="flex gap-2">
                <Textarea rows={2} value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Nachricht an Steuerberater…" />
                <Button onClick={postMessage} disabled={!newMessage.trim()}>Senden</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}