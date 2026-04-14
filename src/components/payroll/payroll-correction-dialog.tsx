/**
 * Lohn-Korrektur Dialog (§ 41c EStG)
 * Zeigt die Differenzen zwischen alter und neuer Berechnung an.
 */
import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface PayrollCorrectionDialogProps {
  periodLabel: string;
  originalGross: number;
  originalNet: number;
  originalTax: number;
  originalSV: number;
  onCorrection?: (correctedGross: number, reason: string) => void;
}

const fmt = (v: number) => v.toFixed(2).replace('.', ',') + ' €';
const sign = (v: number) => (v >= 0 ? '+' : '') + fmt(v);

export function PayrollCorrectionDialog({
  periodLabel,
  originalGross,
  originalNet,
  originalTax,
  originalSV,
  onCorrection,
}: PayrollCorrectionDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [correctedGross, setCorrectedGross] = useState(originalGross);
  const [reason, setReason] = useState('');
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

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast({ title: 'Begründung erforderlich', description: 'Bitte geben Sie einen Korrekturgrund an.', variant: 'destructive' });
      return;
    }
    onCorrection?.(correctedGross, reason);
    toast({ title: 'Korrektur vorgemerkt', description: `Korrektur für ${periodLabel} wird mit der nächsten Abrechnung verrechnet.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setPreview(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="h-3 w-3 mr-1" />
          § 41c Korrektur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Korrekturabrechnung</DialogTitle>
          <DialogDescription>{periodLabel} – § 41c EStG</DialogDescription>
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

          <div className="space-y-2">
            <Label>Korrigiertes Bruttogehalt</Label>
            <Input
              type="number"
              step="0.01"
              value={correctedGross}
              onChange={e => { setCorrectedGross(Number(e.target.value)); setPreview(null); }}
            />
          </div>

          <div className="space-y-2">
            <Label>Korrekturgrund (Pflicht)</Label>
            <Textarea
              placeholder="z.B. Überstunden nachträglich korrigiert, Steuerklasse geändert..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          <Button variant="secondary" className="w-full" onClick={handlePreview}>
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

              <Button className="w-full" onClick={handleSubmit} disabled={!reason.trim()}>
                Korrektur durchführen
              </Button>
            </>
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
  const color = value > 0.01 ? 'text-green-600' : value < -0.01 ? 'text-red-600' : '';
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={`tabular-nums ${color}`}>{sign(value)}</span>
    </div>
  );
}
