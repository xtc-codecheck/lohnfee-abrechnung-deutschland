/**
 * PreFlightCheckDialog
 * ─────────────────────
 * Wird vor dem Speichern eines Lohnlaufs aufgerufen. Führt den
 * Payroll-Guardian inline aus (detectAnomalies) und zeigt
 * gefundene Auffälligkeiten als Bestätigungs-Dialog.
 *
 * Nutzer kann dann:
 *  - Trotzdem speichern (mit Warn-Bestätigung bei kritischen Funden)
 *  - Abbrechen und korrigieren
 *
 * Keine Auffälligkeit → Dialog wird automatisch übersprungen
 * und onConfirm() direkt aufgerufen.
 */

import { useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Employee } from "@/types/employee";
import { PayrollEntry } from "@/types/payroll";
import {
  PayrollAnomaly,
  DEFAULT_ANOMALY_CONFIG,
  HistoricalPayrollData,
} from "@/types/payroll-guardian";
import { detectAnomalies } from "@/utils/anomaly-detection";

interface PreFlightCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  entries: PayrollEntry[];
  history: HistoricalPayrollData[];
  /** Aktion-Label für den Bestätigungs-Button */
  confirmLabel?: string;
  /** Wird aufgerufen wenn der Nutzer trotz Auffälligkeiten bestätigt */
  onConfirm: () => void;
}

const SEVERITY_COLORS: Record<PayrollAnomaly["severity"], string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-muted text-muted-foreground",
};

const SEVERITY_LABELS: Record<PayrollAnomaly["severity"], string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
};

export function PreFlightCheckDialog({
  open,
  onOpenChange,
  employees,
  entries,
  history,
  confirmLabel = "Trotzdem speichern",
  onConfirm,
}: PreFlightCheckDialogProps) {
  const anomalies = useMemo(() => {
    if (!open) return [];
    return detectAnomalies(employees, entries, history, DEFAULT_ANOMALY_CONFIG);
  }, [open, employees, entries, history]);

  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const highCount = anomalies.filter((a) => a.severity === "high").length;
  const hasBlockingFindings = criticalCount > 0;

  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {anomalies.length === 0 ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-600" />
                Pre-Flight-Check bestanden
              </>
            ) : hasBlockingFindings ? (
              <>
                <ShieldAlert className="h-5 w-5 text-destructive" />
                Kritische Auffälligkeiten gefunden
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Hinweise vor dem Speichern
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {anomalies.length === 0 ? (
                <p>
                  Der Payroll Guardian hat keine Auffälligkeiten in diesem
                  Lohnlauf gefunden. Sie können den Lauf bedenkenlos speichern.
                </p>
              ) : (
                <p>
                  Der Payroll Guardian hat <strong>{anomalies.length}</strong>{" "}
                  potenzielle Auffälligkeit(en) erkannt
                  {criticalCount > 0 && (
                    <>
                      , davon <strong className="text-destructive">{criticalCount} kritisch</strong>
                    </>
                  )}
                  {highCount > 0 && (
                    <>
                      {" "}und <strong className="text-orange-600">{highCount} mit hoher Priorität</strong>
                    </>
                  )}
                  . Bitte prüfen Sie diese vor dem Speichern.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {anomalies.length > 0 && (
          <ScrollArea className="max-h-[320px] pr-4">
            <ul className="space-y-2">
              {anomalies.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-border p-3 bg-card"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.employeeName}
                      </p>
                    </div>
                    <Badge className={SEVERITY_COLORS[a.severity]}>
                      {SEVERITY_LABELS[a.severity]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {a.description}
                  </p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen & korrigieren</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              hasBlockingFindings
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {anomalies.length === 0 ? "Speichern" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
