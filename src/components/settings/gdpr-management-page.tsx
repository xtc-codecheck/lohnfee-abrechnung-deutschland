import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, FileDown, Trash2, Plus, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface GdprRequest {
  id: string;
  request_type: string;
  subject_type: string;
  subject_id: string;
  subject_name: string | null;
  status: string;
  reason: string | null;
  retention_end_date: string | null;
  created_at: string;
  processed_at: string | null;
}

export function GdprManagementPage() {
  const { isAdmin, user } = useAuth();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [requests, setRequests] = useState<GdprRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [newRequest, setNewRequest] = useState({
    request_type: 'export',
    subject_type: 'employee',
    subject_id: '',
    reason: '',
  });

  useEffect(() => {
    if (!tenantId) return;
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    const [reqRes, empRes] = await Promise.all([
      supabase.from('gdpr_requests').select('*').eq('tenant_id', tenantId!).order('created_at', { ascending: false }),
      supabase.from('employees').select('id, first_name, last_name').eq('tenant_id', tenantId!),
    ]);
    setRequests((reqRes.data ?? []) as GdprRequest[]);
    setEmployees((empRes.data ?? []).map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}` })));
    setLoading(false);
  };

  const createRequest = async () => {
    const emp = employees.find(e => e.id === newRequest.subject_id);
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + 10);

    const { error } = await supabase.from('gdpr_requests').insert({
      tenant_id: tenantId!,
      requested_by: user!.id,
      request_type: newRequest.request_type,
      subject_type: newRequest.subject_type,
      subject_id: newRequest.subject_id,
      subject_name: emp?.name ?? null,
      reason: newRequest.reason || null,
      retention_end_date: retentionDate.toISOString().split('T')[0],
    });

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Anfrage erstellt', description: 'DSGVO-Anfrage wurde angelegt.' });
      setShowNewDialog(false);
      setNewRequest({ request_type: 'export', subject_type: 'employee', subject_id: '', reason: '' });
      loadData();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: { status: string; processed_at?: string } = { status };
    if (status === 'completed') updates.processed_at = new Date().toISOString();
    
    const { error } = await supabase.from('gdpr_requests').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status aktualisiert' });
      loadData();
    }
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case 'deletion': return 'Löschung';
      case 'export': return 'Datenexport';
      case 'rectification': return 'Berichtigung';
      default: return t;
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Offen</Badge>;
      case 'approved': return <Badge className="bg-blue-500">Genehmigt</Badge>;
      case 'completed': return <Badge className="bg-green-600">Erledigt</Badge>;
      case 'rejected': return <Badge variant="destructive">Abgelehnt</Badge>;
      default: return <Badge variant="secondary">{s}</Badge>;
    }
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nur Administratoren können DSGVO-Anfragen verwalten.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="DSGVO-Verwaltung"
        description="Löschanfragen, Datenexport und Aufbewahrungsfristen gemäß DSGVO"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Datenschutz-Anfragen ({requests.length})
            </CardTitle>
            <CardDescription>Verwaltung nach Art. 15, 17, 16 DSGVO</CardDescription>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Neue Anfrage</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>DSGVO-Anfrage erstellen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Art der Anfrage</Label>
                  <Select value={newRequest.request_type} onValueChange={v => setNewRequest(p => ({ ...p, request_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="export">Datenexport (Art. 15)</SelectItem>
                      <SelectItem value="deletion">Löschung (Art. 17)</SelectItem>
                      <SelectItem value="rectification">Berichtigung (Art. 16)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Betroffener Mitarbeiter</Label>
                  <Select value={newRequest.subject_id} onValueChange={v => setNewRequest(p => ({ ...p, subject_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Mitarbeiter wählen" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Begründung</Label>
                  <Textarea value={newRequest.reason} onChange={e => setNewRequest(p => ({ ...p, reason: e.target.value }))} placeholder="Optional" />
                </div>
                <Button onClick={createRequest} disabled={!newRequest.subject_id} className="w-full">
                  Anfrage erstellen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Keine DSGVO-Anfragen vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {requests.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {r.request_type === 'deletion' ? <Trash2 className="h-4 w-4 text-destructive" /> : <FileDown className="h-4 w-4 text-primary" />}
                      <span className="font-medium">{typeLabel(r.request_type)}</span>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {r.subject_name ?? r.subject_id} — {new Date(r.created_at).toLocaleDateString('de-DE')}
                    </p>
                    {r.retention_end_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Aufbewahrungsfrist bis: {new Date(r.retention_end_date).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'approved')}>Genehmigen</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, 'rejected')}>Ablehnen</Button>
                    </div>
                  )}
                  {r.status === 'approved' && (
                    <Button size="sm" onClick={() => updateStatus(r.id, 'completed')}>Als erledigt markieren</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Aufbewahrungsfristen
          </CardTitle>
          <CardDescription>Gesetzliche Aufbewahrungspflichten nach AO/HGB</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span>Lohnabrechnungen & Lohnkonten</span>
              <Badge variant="outline">6 Jahre (§ 41 Abs. 1 EStG)</Badge>
            </div>
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span>Buchungsbelege (Lohnsteuer)</span>
              <Badge variant="outline">10 Jahre (§ 147 AO)</Badge>
            </div>
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span>SV-Meldungen & Beitragsnachweise</span>
              <Badge variant="outline">5 Jahre</Badge>
            </div>
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span>Personalakten nach Austritt</span>
              <Badge variant="outline">3 Jahre (Verjährungsfrist)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
