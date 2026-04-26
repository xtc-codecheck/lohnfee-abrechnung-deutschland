/**
 * Exportplan-Karte: konfiguriert den monatlichen Auto-Export des
 * Steuerberater-Pakets und zeigt bereitliegende Downloads an.
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarClock,
  Download,
  Trash2,
  Settings2,
  PackageCheck,
  Building2,
  Calculator,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  useExportSchedule,
  useExportScheduleRunner,
  type ExportSchedulePlan,
} from '@/hooks/use-export-schedule';
import type { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import type { Kontenrahmen } from '@/utils/datev-export';

interface ExportScheduleCardProps {
  periods: PayrollPeriod[];
  entries: PayrollEntry[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number);
  if (!y || !m) return period;
  return format(new Date(y, m - 1, 1), 'MMMM yyyy', { locale: de });
}

export function ExportScheduleCard({ periods, entries }: ExportScheduleCardProps) {
  const { plan, updatePlan, packages, removePackage, downloadPackage } = useExportSchedule();
  const { targetPeriodLabel, eligiblePeriod, eligibleEntries } = useExportScheduleRunner({
    periods,
    entries,
  });

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ExportSchedulePlan>(plan);

  // Wenn Dialog geöffnet wird, Draft mit aktuellem Plan synchronisieren
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(plan);
    setOpen(next);
  };

  const handleSave = () => {
    updatePlan({
      enabled: draft.enabled,
      dayOfMonth: Math.max(1, Math.min(28, Number(draft.dayOfMonth) || 5)),
      kontenrahmen: draft.kontenrahmen,
      notes: draft.notes ?? '',
      contactName: draft.contactName ?? '',
      contactEmail: draft.contactEmail ?? '',
    });
    setOpen(false);
  };

  const statusLine = useMemo(() => {
    if (!plan.enabled) return 'Plan derzeit deaktiviert.';
    const dayTxt = `am ${plan.dayOfMonth}. eines Monats`;
    const last = plan.lastRunPeriod
      ? ` · zuletzt: ${formatPeriod(plan.lastRunPeriod)}`
      : '';
    return `Aktiv ${dayTxt} · Kontenrahmen ${plan.kontenrahmen}${last}`;
  }, [plan]);

  const targetReady = !!eligiblePeriod && eligibleEntries.length > 0;

  return (
    <Card className="shadow-card hover:shadow-elegant transition-shadow border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Monatlicher Exportplan
          {plan.enabled ? (
            <Badge variant="default" className="ml-2">Aktiv</Badge>
          ) : (
            <Badge variant="outline" className="ml-2">Inaktiv</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Erstellt das Steuerberater-Paket des Vormonats automatisch und legt es hier zum Download
          ab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background/60 p-3">
          <div className="text-sm">
            <p className="font-medium">{statusLine}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Zielperiode: {formatPeriod(targetPeriodLabel)}{' '}
              {targetReady ? (
                <span className="text-primary font-medium">· Daten verfügbar</span>
              ) : (
                <span className="text-muted-foreground">· wartet auf Abrechnung</span>
              )}
            </p>
          </div>

          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Plan konfigurieren
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  Exportplan
                </DialogTitle>
                <DialogDescription>
                  Definieren Sie, wann und mit welchen Optionen das Berater-Paket erzeugt wird.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                  <div>
                    <Label htmlFor="plan-enabled" className="text-sm font-medium">
                      Automatik aktivieren
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Beim Öffnen der App wird geprüft, ob für den Vormonat ein Paket fällig ist.
                    </p>
                  </div>
                  <Switch
                    id="plan-enabled"
                    checked={draft.enabled}
                    onCheckedChange={(checked) => setDraft((d) => ({ ...d, enabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-day">Stichtag (Tag im Monat)</Label>
                  <Input
                    id="plan-day"
                    type="number"
                    min={1}
                    max={28}
                    value={draft.dayOfMonth}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, dayOfMonth: Number(e.target.value) || 1 }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Empfehlung: 5–10. Tag, sobald der Vormonat abgeschlossen ist.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Kontenrahmen</Label>
                  <RadioGroup
                    value={draft.kontenrahmen}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, kontenrahmen: v as Kontenrahmen }))
                    }
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="plan-skr03"
                      className={`flex flex-col items-center rounded-md border-2 p-3 cursor-pointer hover:bg-accent ${
                        draft.kontenrahmen === 'SKR03'
                          ? 'border-primary bg-accent/40'
                          : 'border-muted'
                      }`}
                    >
                      <RadioGroupItem value="SKR03" id="plan-skr03" className="sr-only" />
                      <Building2 className="h-5 w-5 mb-1" />
                      <span className="text-sm font-medium">SKR 03</span>
                    </Label>
                    <Label
                      htmlFor="plan-skr04"
                      className={`flex flex-col items-center rounded-md border-2 p-3 cursor-pointer hover:bg-accent ${
                        draft.kontenrahmen === 'SKR04'
                          ? 'border-primary bg-accent/40'
                          : 'border-muted'
                      }`}
                    >
                      <RadioGroupItem value="SKR04" id="plan-skr04" className="sr-only" />
                      <Calculator className="h-5 w-5 mb-1" />
                      <span className="text-sm font-medium">SKR 04</span>
                    </Label>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="plan-contact">Ansprechpartner</Label>
                    <Input
                      id="plan-contact"
                      value={draft.contactName ?? ''}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, contactName: e.target.value }))
                      }
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="plan-email">E-Mail</Label>
                    <Input
                      id="plan-email"
                      type="email"
                      value={draft.contactEmail ?? ''}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, contactEmail: e.target.value }))
                      }
                      placeholder="lohn@firma.de"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="plan-notes">Standard-Hinweise an den Steuerberater</Label>
                  <Textarea
                    id="plan-notes"
                    value={draft.notes ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                    rows={3}
                    placeholder="z.B. Bitte Pauschalsteuer separat verbuchen…"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSave}>Plan speichern</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bereitliegende Downloads */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Bereitliegende Pakete</p>
            <Badge variant="secondary" className="text-xs">
              {packages.length}
            </Badge>
          </div>

          {packages.length === 0 ? (
            <p className="text-xs text-muted-foreground border rounded-md p-3 bg-background/40">
              Noch keine automatisch erzeugten Pakete. Sobald der Stichtag erreicht ist und der
              Vormonat abgeschlossen wurde, erscheinen sie hier.
            </p>
          ) : (
            <ul className="space-y-2">
              {packages.map((pkg) => (
                <li
                  key={pkg.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{pkg.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPeriod(pkg.period)} · {pkg.employeeCount} Mitarbeiter ·{' '}
                      {pkg.kontenrahmen} · {formatBytes(pkg.sizeBytes)} · erstellt{' '}
                      {format(new Date(pkg.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => downloadPackage(pkg)}
                      className="gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePackage(pkg.id)}
                      aria-label="Paket entfernen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
