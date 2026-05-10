/**
 * GoBD-Prüfprotokoll-Dialog
 * Zeigt versionierte Snapshots, Berechnungsschritte und Export-Nachweise
 * je Lohnabrechnung. Hash-Verifikation erkennt Manipulationen.
 */
import { useEffect, useState } from 'react';
import { ScrollText, ShieldCheck, ShieldAlert, Loader2, FileDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AuditProtocol,
  getAuditProtocolHistory,
  verifyProtocolHash,
} from '@/utils/gobd-audit-protocol';

interface Props {
  payrollEntryId: string;
  employeeName: string;
  periodLabel: string;
}

const eventBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  created: { label: 'Erstellung', variant: 'default' },
  recalculated: { label: 'Neuberechnung', variant: 'secondary' },
  corrected: { label: 'Korrektur', variant: 'secondary' },
  storno: { label: 'Storno', variant: 'destructive' },
  export: { label: 'Export', variant: 'outline' },
};

export function AuditProtocolDialog({ payrollEntryId, employeeName, periodLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [protocols, setProtocols] = useState<AuditProtocol[]>([]);
  const [verified, setVerified] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getAuditProtocolHistory(payrollEntryId).then(async (list) => {
      setProtocols(list);
      const v: Record<string, boolean> = {};
      for (const p of list) v[p.id] = await verifyProtocolHash(p);
      setVerified(v);
      setLoading(false);
    });
  }, [open, payrollEntryId]);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(protocols, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pruefprotokoll-${payrollEntryId.slice(0, 8)}-${periodLabel.replace('/', '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ScrollText className="h-3 w-3 mr-1" /> Prüfprotokoll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" /> GoBD-Prüfprotokoll
          </DialogTitle>
          <DialogDescription>
            {employeeName} – {periodLabel} · Append-Only Audit-Trail nach §§ 146, 147 AO
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : protocols.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Noch kein Protokoll vorhanden. Wird beim nächsten Speichern automatisch erstellt.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {protocols.length} Version{protocols.length === 1 ? '' : 'en'}
              </div>
              <Button variant="outline" size="sm" onClick={downloadJson}>
                <Download className="h-3 w-3 mr-1" /> JSON exportieren
              </Button>
            </div>

            <Accordion type="single" collapsible defaultValue={protocols[0]?.id}>
              {protocols.map((p) => {
                const ok = verified[p.id];
                const badge = eventBadge[p.eventType] ?? eventBadge.created;
                return (
                  <AccordionItem key={p.id} value={p.id}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Badge variant={badge.variant}>v{p.version}</Badge>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(p.createdAt).toLocaleString('de-DE')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          {ok ? (
                            <><ShieldCheck className="h-3 w-3 text-success" /><span className="text-success">Hash gültig</span></>
                          ) : (
                            <><ShieldAlert className="h-3 w-3 text-destructive" /><span className="text-destructive">Hash ungültig</span></>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="text-xs font-mono break-all bg-muted p-2 rounded">
                        SHA-256: {p.contentHash}
                      </div>

                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Mitarbeiter-Snapshot</CardTitle></CardHeader>
                        <CardContent>
                          <KeyValueGrid data={p.snapshotEmployee} />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Berechnungsergebnis</CardTitle></CardHeader>
                        <CardContent>
                          <KeyValueGrid data={flattenCalc(p.snapshotCalculation)} />
                        </CardContent>
                      </Card>

                      {p.exports.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
                            <FileDown className="h-4 w-4" /> Export-Nachweise ({p.exports.length})
                          </CardTitle></CardHeader>
                          <CardContent className="space-y-2">
                            {p.exports.map((ex, i) => (
                              <div key={i} className="text-xs border rounded p-2">
                                <div className="flex justify-between">
                                  <Badge variant="outline">{ex.type}</Badge>
                                  <span className="text-muted-foreground">
                                    {new Date(ex.exportedAt).toLocaleString('de-DE')}
                                  </span>
                                </div>
                                <div className="mt-1 grid grid-cols-2 gap-1">
                                  <span>Format: <span className="font-mono">{ex.format}</span></span>
                                  {ex.filename && <span>Datei: <span className="font-mono">{ex.filename}</span></span>}
                                  {ex.recordCount !== undefined && <span>Datensätze: {ex.recordCount}</span>}
                                  {ex.ticketId && <span>Ticket: <span className="font-mono">{ex.ticketId}</span></span>}
                                  {ex.fileHash && <span className="col-span-2 break-all">Hash: <span className="font-mono">{ex.fileHash}</span></span>}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {Object.keys(p.appliedConstants).length > 0 && (
                        <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm">Angewendete Konstanten</CardTitle></CardHeader>
                          <CardContent><KeyValueGrid data={p.appliedConstants} /></CardContent>
                        </Card>
                      )}

                      {p.warnings.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm">Warnungen</CardTitle></CardHeader>
                          <CardContent>
                            <ul className="text-sm list-disc pl-4">
                              {p.warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {p.notes && (
                        <div className="text-sm text-muted-foreground italic">Notiz: {p.notes}</div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function KeyValueGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return <div className="text-xs text-muted-foreground">Keine Daten</div>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {entries.map(([k, v]) => (
        <div key={k} className="flex justify-between border-b border-border/30 py-0.5">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-mono text-right break-all">{formatValue(v)}</span>
        </div>
      ))}
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '–';
  if (typeof v === 'number') return v.toLocaleString('de-DE');
  if (typeof v === 'boolean') return v ? 'ja' : 'nein';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function flattenCalc(c: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const numericKeys = ['grossSalary', 'netSalary', 'finalNetSalary', 'employerCosts'];
  for (const k of numericKeys) if (c[k] !== undefined) out[k] = c[k];
  const t = c.taxes as any;
  if (t) {
    out['Lohnsteuer'] = t.incomeTax;
    out['Soli'] = t.solidarityTax;
    out['KiSt'] = t.churchTax;
    out['Steuern gesamt'] = t.total;
  }
  const ss = c.socialSecurity as any;
  if (ss?.total) {
    out['SV AN gesamt'] = ss.total.employee;
    out['SV AG gesamt'] = ss.total.employer;
  }
  return out;
}