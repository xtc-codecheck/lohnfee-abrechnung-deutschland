import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Plus, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";

interface Props { onBack: () => void }

export function ZvkPage({ onBack }: Props) {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [kassen, setKassen] = useState<any[]>([]);
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [typ, setTyp] = useState("pensionskasse");
  const [agSatz, setAgSatz] = useState("3");
  const [anSatz, setAnSatz] = useState("3");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: k }, { data: m }] = await Promise.all([
      supabase.from("zvk_kassen").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("zvk_meldungen").select("*").eq("tenant_id", tenantId).order("year", { ascending: false }),
    ]);
    setKassen(k ?? []); setMeldungen(m ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const createKasse = async () => {
    if (!tenantId || !name) return;
    const { error } = await supabase.from("zvk_kassen").insert({
      tenant_id: tenantId, name, kassen_typ: typ,
      beitragssatz_arbeitgeber: Number(agSatz),
      beitragssatz_arbeitnehmer: Number(anSatz),
    });
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else { toast({ title: "Kasse angelegt" }); setShowCreate(false); setName(""); load(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="ZVK / Pensionskassen" description="Beitrags- und Jahresmeldungen außerhalb SOKA-BAU" onBack={onBack} />
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Kassen-Stammdaten</CardTitle>
            <CardDescription>z. B. ZVK Gerüstbau, Maler-/Lackierer-ZVK, betriebliche Pensionskassen</CardDescription>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Kasse anlegen</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neue Kasse</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                <div>
                  <Label>Typ</Label>
                  <Select value={typ} onValueChange={setTyp}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zvk_geruestbau">ZVK Gerüstbau</SelectItem>
                      <SelectItem value="zvk_maler">ZVK Maler/Lackierer</SelectItem>
                      <SelectItem value="pensionskasse">Pensionskasse</SelectItem>
                      <SelectItem value="other">Sonstige</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Satz AG (%)</Label><Input type="number" value={agSatz} onChange={e => setAgSatz(e.target.value)} /></div>
                  <div><Label>Satz AN (%)</Label><Input type="number" value={anSatz} onChange={e => setAnSatz(e.target.value)} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={createKasse} disabled={!name}>Anlegen</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Typ</TableHead><TableHead>Satz AG</TableHead><TableHead>Satz AN</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {kassen.map(k => (
                  <TableRow key={k.id}>
                    <TableCell>{k.name}</TableCell><TableCell>{k.kassen_typ}</TableCell>
                    <TableCell>{Number(k.beitragssatz_arbeitgeber).toFixed(2)}%</TableCell>
                    <TableCell>{Number(k.beitragssatz_arbeitnehmer).toFixed(2)}%</TableCell>
                    <TableCell><Badge variant={k.is_active ? "outline" : "secondary"}>{k.is_active ? "aktiv" : "inaktiv"}</Badge></TableCell>
                  </TableRow>
                ))}
                {!kassen.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Noch keine Kassen.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle>Meldungen</CardTitle><CardDescription>Beitrags- und Jahresmeldungen je Kasse</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Jahr/Monat</TableHead><TableHead>Typ</TableHead><TableHead>Versicherte</TableHead><TableHead>Bemessung</TableHead><TableHead>AG-Beitrag</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {meldungen.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{m.year}{m.month ? `/${String(m.month).padStart(2, '0')}` : ''}</TableCell>
                  <TableCell>{m.meldungs_typ}</TableCell>
                  <TableCell>{m.anzahl_versicherte}</TableCell>
                  <TableCell>{Number(m.bemessungssumme).toFixed(2)} €</TableCell>
                  <TableCell>{Number(m.beitrag_arbeitgeber).toFixed(2)} €</TableCell>
                  <TableCell><Badge variant="outline">{m.status}</Badge></TableCell>
                </TableRow>
              ))}
              {!meldungen.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Keine Meldungen.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}