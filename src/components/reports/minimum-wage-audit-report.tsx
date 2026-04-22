import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, ShieldCheck, Download } from "lucide-react";
import { useEmployees } from "@/contexts/employee-context";
import { MINIMUM_WAGES } from "@/types/compliance";
import { formatCurrency } from "@/lib/formatters";

/**
 * Mindestlohn-Prüfprotokoll (entspricht ProCheck-Punkt "Mindestlohn 13,90 € ab 2026")
 * - Effektiver Stundenlohn = Bruttogehalt / (Wochenstunden * 4,33)
 * - Vergleich gegen aktuell gültigen gesetzlichen Mindestlohn
 */
export function MinimumWageAuditReport({ year = new Date().getFullYear() }: { year?: number }) {
  const { employees } = useEmployees();

  const minWage = (MINIMUM_WAGES as Record<number, number>)[year]
    ?? (MINIMUM_WAGES as Record<number, number>)[2026]
    ?? 13.9;

  const rows = useMemo(() => {
    return employees
      .filter((e) => e.employmentData?.endDate == null)
      .map((emp) => {
        const weeklyHours = emp.employmentData?.weeklyHours ?? 40;
        const gross = emp.salaryData?.grossSalary ?? 0;
        const explicitHourly = emp.salaryData?.hourlyWage;
        const monthlyHours = weeklyHours * 4.33;
        const effectiveHourly = explicitHourly ?? (monthlyHours > 0 ? gross / monthlyHours : 0);
        const diff = effectiveHourly - minWage;
        const status: "ok" | "warn" | "fail" =
          effectiveHourly >= minWage ? "ok" : effectiveHourly >= minWage - 0.5 ? "warn" : "fail";
        return {
          id: emp.id,
          name: `${emp.personalData.firstName} ${emp.personalData.lastName}`,
          weeklyHours,
          gross,
          effectiveHourly,
          diff,
          status,
        };
      })
      .sort((a, b) => a.effectiveHourly - b.effectiveHourly);
  }, [employees, minWage]);

  const violations = rows.filter((r) => r.status === "fail").length;
  const warnings = rows.filter((r) => r.status === "warn").length;

  const exportCsv = () => {
    const header = ["Name", "Wochenstunden", "Brutto", "Stundenlohn", "Differenz", "Status"].join(";");
    const lines = rows.map((r) =>
      [r.name, r.weeklyHours, r.gross.toFixed(2), r.effectiveHourly.toFixed(2), r.diff.toFixed(2), r.status]
        .join(";"),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindestlohn-pruefung-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Mindestlohn-Prüfprotokoll {year}
              </CardTitle>
              <CardDescription>
                Gesetzlicher Mindestlohn: <strong>{formatCurrency(minWage)} / Std.</strong> ·
                {" "}geprüft: {rows.length} Mitarbeiter
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {violations > 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{violations} Verstoß/Verstöße gegen den Mindestlohn</AlertTitle>
              <AlertDescription>
                Diese Mitarbeiter müssen vor Monatsabschluss geprüft und korrigiert werden.
              </AlertDescription>
            </Alert>
          ) : warnings > 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{warnings} Mitarbeiter knapp über Mindestlohn</AlertTitle>
              <AlertDescription>
                Bitte Sonderzahlungen / Abzüge im Auge behalten – Puffer &lt; 0,50 €.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Alle Mitarbeiter über Mindestlohn</AlertTitle>
              <AlertDescription>Keine Beanstandungen.</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead className="text-right">Std./Woche</TableHead>
                  <TableHead className="text-right">Brutto/Monat</TableHead>
                  <TableHead className="text-right">Eff. Stundenlohn</TableHead>
                  <TableHead className="text-right">Δ zum Mindestlohn</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Keine aktiven Mitarbeiter vorhanden.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-right">{r.weeklyHours}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.gross)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.effectiveHourly)}</TableCell>
                      <TableCell className={`text-right ${r.diff < 0 ? "text-destructive" : ""}`}>
                        {r.diff >= 0 ? "+" : ""}
                        {formatCurrency(r.diff)}
                      </TableCell>
                      <TableCell>
                        {r.status === "ok" && <Badge variant="secondary">Konform</Badge>}
                        {r.status === "warn" && <Badge variant="outline">Knapp</Badge>}
                        {r.status === "fail" && <Badge variant="destructive">Verstoß</Badge>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            Berechnung: Effektiver Stundenlohn = explizit hinterlegter Stundenlohn oder
            Bruttogehalt / (Wochenstunden × 4,33). Maßgeblich ist § 1 MiLoG.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}