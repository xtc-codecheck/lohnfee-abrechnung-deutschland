/**
 * Pre-Export-Validation-Dialog
 * ─────────────────────────────────────────────────────────────
 * Zeigt vor dem ZIP-Download alle Plausibilitäts- und
 * Konsistenzprobleme an, gruppiert nach Schweregrad und Kategorie.
 * Errors blockieren den Export; Warnungen können bestätigt werden.
 */
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldCheck } from "lucide-react";
import { runPreExportValidation, type ValidationReport, type ValidationIssue } from "@/utils/pre-export-validation";

interface Props {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
  tenantId: string;
  year: number;
  month: number;
}

const sevIcon = (s: ValidationIssue["severity"]) =>
  s === "error" ? <AlertCircle className="h-4 w-4 text-destructive" />
  : s === "warning" ? <AlertTriangle className="h-4 w-4 text-warning" />
  : <Info className="h-4 w-4 text-info" />;

const sevBadge = (s: ValidationIssue["severity"]) =>
  s === "error" ? <Badge variant="destructive">Fehler</Badge>
  : s === "warning" ? <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">Warnung</Badge>
  : <Badge variant="secondary">Info</Badge>;

export function PreExportValidationDialog({ open, onClose, onProceed, tenantId, year, month }: Props) {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setReport(null);
    runPreExportValidation(tenantId, year, month)
      .then(r => { if (!cancelled) setReport(r); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, tenantId, year, month]);

  const grouped = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    (report?.issues ?? []).forEach(i => {
      const k = i.category;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(i);
    });
    return Array.from(map.entries());
  }, [report]);

  const blocked = (report?.summary.errors ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Plausibilitäts- und Konsistenzprüfung
          </DialogTitle>
          <DialogDescription>
            Zeitraum {String(month).padStart(2, "0")}/{year} — alle Stammdaten, Lohnabrechnungen und
            Meldungs-Datensätze werden vor dem Export geprüft.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Prüfe Stammdaten, Abrechnungen und Meldungen…
          </div>
        )}

        {!loading && report && (
          <div className="space-y-4 overflow-hidden">
            {/* Zusammenfassung */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border border-border p-3 text-center">
                <div className="text-2xl font-semibold text-destructive">{report.summary.errors}</div>
                <div className="text-xs text-muted-foreground">Fehler (blockieren)</div>
              </div>
              <div className="rounded-md border border-border p-3 text-center">
                <div className="text-2xl font-semibold text-warning">{report.summary.warnings}</div>
                <div className="text-xs text-muted-foreground">Warnungen</div>
              </div>
              <div className="rounded-md border border-border p-3 text-center">
                <div className="text-2xl font-semibold text-info">{report.summary.infos}</div>
                <div className="text-xs text-muted-foreground">Hinweise</div>
              </div>
            </div>

            {Object.keys(report.metrics).length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(report.metrics).map(([k, v]) => (
                  <Badge key={k} variant="outline" className="font-normal">
                    {k}: <span className="ml-1 font-medium">{v}</span>
                  </Badge>
                ))}
              </div>
            )}

            {report.issues.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertTitle>Alle Prüfungen bestanden</AlertTitle>
                <AlertDescription>
                  Stammdaten, Lohnabrechnungen und Meldungs-Datensätze sind plausibel und konsistent.
                  Bundle kann erzeugt werden.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[42vh] pr-3">
                <div className="space-y-4">
                  {grouped.map(([cat, items]) => (
                    <div key={cat}>
                      <div className="text-sm font-semibold mb-2 text-foreground">{cat}</div>
                      <div className="space-y-2">
                        {items
                          .sort((a, b) => sevWeight(a.severity) - sevWeight(b.severity))
                          .map((i, idx) => (
                          <div key={idx} className="rounded-md border border-border p-3">
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">{sevIcon(i.severity)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="font-medium text-sm">{i.title}</div>
                                  {sevBadge(i.severity)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">{i.detail}</div>
                                {i.ref && (
                                  <div className="text-xs text-muted-foreground mt-1 italic">→ {i.ref}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {blocked && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Export blockiert</AlertTitle>
                <AlertDescription>
                  Es liegen {report.summary.errors} Fehler vor. Bitte beheben Sie diese, bevor Sie das
                  Bundle für Finanzamt und Krankenkassen erzeugen.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Schließen</Button>
          <Button
            onClick={onProceed}
            disabled={loading || blocked}
            variant={report?.summary.warnings ? "default" : "default"}
          >
            {report?.summary.warnings
              ? `Trotz ${report.summary.warnings} Warnungen exportieren`
              : "Bundle erzeugen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function sevWeight(s: ValidationIssue["severity"]) {
  return s === "error" ? 0 : s === "warning" ? 1 : 2;
}