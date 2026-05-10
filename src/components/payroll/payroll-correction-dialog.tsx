/**
 * Lohn-Korrektur Dialog (§ 41c EStG)
 * Zeigt die Differenzen zwischen alter und neuer Berechnung an.
 */
import { useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/tenant-context';
import { executeStornoAndCorrection, type StornoCorrectionResult } from '@/utils/payroll-storno-workflow';
import type { Employee } from '@/types/employee';
import { useQueryClient } from '@tanstack/react-query';

interface PayrollCorrectionDialogProps {
  periodLabel: string;
  entryId: string;
  employee: Employee;
  originalGross: number;
  originalNet: number;
  originalTax: number;
  originalSV: number;
  onDone?: () => void;
}

const fmt = (v: number) => v.toFixed(2).replace('.', ',') + ' €';
const sign = (v: number) => (v >= 0 ? '+' : '') + fmt(v);

export function PayrollCorrectionDialog({
  periodLabel,
  entryId,
  employee,
  originalGross,
  originalNet,
  originalTax,
  originalSV,
  onDone,
}: PayrollCorrectionDialogProps) {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [correctedGross, setCorrectedGross] = useState(originalGross);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<StornoCorrectionResult | null>(null);
  const [preview, setPreview] = useState<null | {
    grossDiff: number;
    taxDiff: number;
    svDiff: number;
    netDiff: number;
  }>(null);

  const handlePreview = () => {
    // Vereinfachte Schätzung: proportionale Änderung
    const ratio = correctedGross / originalGross;
    const newTax = originalTax * ratio;
    const newSV = originalSV * ratio;
    const newNet = correctedGross - newTax - newSV;

    setPreview({
      grossDiff: correctedGross - originalGross,
      taxDiff: newTax - originalTax,
      svDiff: newSV - originalSV,
      netDiff: newNet - originalNet,
    });
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({ title: 'Begründung erforderlich', description: 'Bitte geben Sie einen Korrekturgrund an (§ 41c EStG).', variant: 'destructive' });
      return;
    }
    if (!tenantId) {
      toast({ title: 'Mandant fehlt', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const res = await executeStornoAndCorrection({
        originalEntryId: entryId,
        tenantId,
        employee,
        correctedGross,
        reason,
      });
      setResult(res);
      await queryClient.invalidateQueries();
      toast({
        title: 'Storno + Korrektur durchgeführt',
        description: `Neue LStA und ${res.newBnwIds.length} Beitragsnachweis(e) erzeugt.`,
      });
      onDone?.();
    } catch (e: any) {
      toast({ title: 'Korrektur fehlgeschlagen', description: e?.message ?? String(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setPreview(null); setResult(null); setReason(''); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Storno / § 41c
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Storno- und Korrekturabrechnung</DialogTitle>
          <DialogDescription>
            {periodLabel} – § 41c EStG / § 28a SGB IV. Originalbuchung wird storniert,
            Korrekturbuchung erzeugt, LStA und Beitragsnachweise neu generiert.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Originalwerte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Row label="Brutto" value={fmt(originalGross)} />
              <Row label="Steuern" value={fmt(originalTax)} />
              <Row label="SV-Beiträge" value={fmt(originalSV)} />
              <Row label="Netto" value={fmt(originalNet)} bold />
            </CardContent>
          </Card>

          {!result && (<>
          <div className="space-y-2">
            <Label>Korrigiertes Bruttogehalt</Label>
            <Input
              type="number"
              step="0.01"
              value={correctedGross}
              onChange={e => { setCorrectedGross(Number(e.target.value)); setPreview(null); }}
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <Label>Korrekturgrund (Pflicht)</Label>
            <Textarea
              placeholder="z.B. Überstunden nachträglich korrigiert, Steuerklasse geändert..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={busy}
            />
          </div>

          <Button variant="secondary" className="w-full" onClick={handlePreview} disabled={busy}>
            Vorschau berechnen
          </Button>

          {preview && (
            <>
              <Separator />
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Differenzen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <DiffRow label="Brutto" value={preview.grossDiff} />
                  <DiffRow label="Steuern" value={preview.taxDiff} />
                  <DiffRow label="SV" value={preview.svDiff} />
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Netto-Differenz</span>
                    <Badge variant={preview.netDiff > 0 ? 'default' : preview.netDiff < 0 ? 'destructive' : 'secondary'}>
                      {sign(preview.netDiff)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {preview.netDiff > 0
                      ? '→ Nachzahlung an Mitarbeiter'
                      : preview.netDiff < 0
                      ? '→ Rückforderung vom Mitarbeiter'
                      : '→ Keine Differenz'}
                  </p>
                </CardContent>
              </Card>

              <Button className="w-full" onClick={handleSubmit} disabled={!reason.trim() || busy}>
                {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Storniere & korrigiere...</> : 'Storno + Korrektur ausführen'}
              </Button>
            </>
          )}
          </>)}

          {result && (
            <Card className="border-success">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" /> Erfolgreich verarbeitet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Row label="Storno-Buchung" value={result.stornoEntryId.slice(0, 8)} />
                <Row label="Korrektur-Buchung" value={result.correctionEntryId.slice(0, 8)} />
                <Row label="Neue LStA" value={result.newLstaId ? result.newLstaId.slice(0, 8) : '–'} />
                <Row label="Neue Beitragsnachweise" value={String(result.newBnwIds.length)} />
                <Separator />
                <DiffRow label="Netto-Diff." value={result.netDifference} />
                <DiffRow label="Steuer-Diff." value={result.taxDifference} />
                <DiffRow label="SV-Diff." value={result.svDifference} />
                <p className="text-xs text-muted-foreground pt-2">
                  Die neuen Meldungen liegen im Status „Entwurf" und können im Meldewesen geprüft und exportiert werden.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function DiffRow({ label, value }: { label: string; value: number }) {
  const color = value > 0.01 ? 'text-success' : value < -0.01 ? 'text-destructive' : '';
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={`tabular-nums ${color}`}>{sign(value)}</span>
    </div>
  );
}
