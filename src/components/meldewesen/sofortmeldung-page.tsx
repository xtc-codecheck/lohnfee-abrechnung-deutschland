/**
 * Sofortmeldung § 28a SGB IV
 * ─────────────────────────────────────────────────────────────
 * Übersicht über sofortmeldepflichtige Mitarbeiter (Branchen),
 * One-Click-Anlage einer DEÜV-Sofortmeldung (Abgabegrund 20).
 *
 * Speicherung erfolgt in `sv_meldungen` mit
 *   meldegrund = 'sofortmeldung'
 *   meldegrund_schluessel = '20'
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Send, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/contexts/employee-context';
import { useTenant } from '@/contexts/tenant-context';
import { isSofortmeldepflichtig, buildSofortmeldungPayload } from '@/utils/sofortmeldung';

interface SofortmeldungPageProps {
  onBack: () => void;
}

export function SofortmeldungPage({ onBack }: SofortmeldungPageProps) {
  const { employees } = useEmployees();
  const { tenantId, currentTenant } = useTenant();
  const { toast } = useToast();

  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchMeldungen = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('sv_meldungen')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('meldegrund', 'sofortmeldung')
      .order('created_at', { ascending: false });
    setMeldungen(data ?? []);
    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchMeldungen(); }, [fetchMeldungen]);

  const pflichtigeEmployees = useMemo(
    () => employees.filter(isSofortmeldepflichtig),
    [employees],
  );

  const hatBereitsSofortmeldung = (employeeId: string) =>
    meldungen.some(m => m.employee_id === employeeId && m.status !== 'storniert');

  const handleCreate = async (employeeId: string) => {
    if (!tenantId) return;
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    setSubmittingId(employeeId);
    try {
      const payload = buildSofortmeldungPayload(emp, currentTenant?.betriebsnummer ?? undefined);
      const startDate = payload.beschaeftigungsbeginn;

      const { error } = await supabase.from('sv_meldungen').insert([{
        employee_id: employeeId,
        meldegrund: 'sofortmeldung',
        meldegrund_schluessel: '20',
        zeitraum_von: startDate,
        zeitraum_bis: startDate,
        krankenkasse: 'DSRV (Datenstelle der Rentenversicherung)',
        beitragsgruppe: '0000',
        sv_brutto: 0,
        personengruppe: '101',
        status: 'entwurf',
        tenant_id: tenantId,
        notes: `Sofortmeldung § 28a SGB IV — DSME Abgabegrund 20\nVersNr: ${payload.versicherungsnummer || '(fehlt)'}\nBeschäftigungsbeginn: ${startDate}`,
      }]);

      if (error) throw error;
      toast({
        title: 'Sofortmeldung angelegt',
        description: `${emp.personalData.lastName}, ${emp.personalData.firstName} – als Entwurf erstellt.`,
      });
      fetchMeldungen();
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSubmitMeldung = async (id: string) => {
    await supabase.from('sv_meldungen').update({
      status: 'gemeldet',
      meldedatum: new Date().toISOString().split('T')[0],
    }).eq('id', id);
    toast({ title: 'Sofortmeldung übermittelt', description: 'Status auf "gemeldet" gesetzt.' });
    fetchMeldungen();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sofortmeldung § 28a SGB IV"
        description="Pflichtmeldung an die DSRV bei Beschäftigungsbeginn (Bau, Gastro, Spedition, Reinigung u. a.)"
        onBack={onBack}
      />

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Wichtig: Frist beachten</AlertTitle>
        <AlertDescription>
          Die Sofortmeldung muss <b>spätestens bei Aufnahme der Beschäftigung</b> erfolgen.
          Sie ersetzt nicht die reguläre DEÜV-Anmeldung.
        </AlertDescription>
      </Alert>

      {/* Pflichtige Mitarbeiter */}
      <Card>
        <CardHeader>
          <CardTitle>Sofortmeldepflichtige Mitarbeiter ({pflichtigeEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pflichtigeEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Mitarbeiter in sofortmeldepflichtigen Branchen.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Branche</TableHead>
                  <TableHead>Beschäftigungsbeginn</TableHead>
                  <TableHead>SV-Nr.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pflichtigeEmployees.map(emp => {
                  const done = hatBereitsSofortmeldung(emp.id);
                  const start = emp.employmentData.startDate
                    ? new Date(emp.employmentData.startDate).toISOString().split('T')[0]
                    : '—';
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        {emp.personalData.lastName}, {emp.personalData.firstName}
                      </TableCell>
                      <TableCell>{emp.employmentData.industry ?? emp.employmentData.position ?? '—'}</TableCell>
                      <TableCell className="tabular-nums">{start}</TableCell>
                      <TableCell className="tabular-nums">
                        {emp.personalData.socialSecurityNumber || (
                          <span className="text-destructive">fehlt</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {done ? (
                          <Badge className="bg-success/10 text-success dark:bg-success dark:text-success/70">
                            <CheckCircle2 className="h-3 w-3 mr-1" />gemeldet
                          </Badge>
                        ) : (
                          <Badge variant="outline">offen</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!done && (
                          <Button
                            size="sm"
                            disabled={submittingId === emp.id}
                            onClick={() => handleCreate(emp.id)}
                          >
                            {submittingId === emp.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3 mr-1" />
                            )}
                            Sofortmeldung anlegen
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

      {/* Bestehende Sofortmeldungen */}
      <Card>
        <CardHeader>
          <CardTitle>Erstellte Sofortmeldungen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : meldungen.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Keine Sofortmeldungen vorhanden.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Beschäftigungsbeginn</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Meldedatum</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meldungen.map(m => {
                  const emp = employees.find(e => e.id === m.employee_id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {emp ? `${emp.personalData.lastName}, ${emp.personalData.firstName}` : m.employee_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="tabular-nums">{m.zeitraum_von}</TableCell>
                      <TableCell><Badge variant="outline">{m.status}</Badge></TableCell>
                      <TableCell className="tabular-nums">{m.meldedatum ?? '—'}</TableCell>
                      <TableCell>
                        {m.status === 'entwurf' && (
                          <Button size="sm" variant="outline" onClick={() => handleSubmitMeldung(m.id)}>
                            <Send className="h-3 w-3 mr-1" />Übermitteln
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
    </div>
  );
}