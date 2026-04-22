import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart } from "lucide-react";
import { useSupabasePayroll } from "@/hooks/use-supabase-payroll";
import { useEmployees } from "@/contexts/employee-context";
import { formatCurrency } from "@/lib/formatters";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

/**
 * U1/U2-Erstattungsübersicht (Aufwendungsausgleichsgesetz, AAG)
 * U1: Erstattung Arbeitgeberaufwendungen bei Krankheit (≤ 30 MA)
 * U2: Erstattung bei Mutterschaft (alle Arbeitgeber, Pflicht)
 * Insolvenzgeldumlage U3: Pflicht für alle Arbeitgeber
 */
const U_RATES_2026 = {
  u1: 1.1,    // Durchschnitt – kassenabhängig
  u2: 0.24,   // Durchschnitt
  insolvenz: 0.06,
} as const;

const U1_THRESHOLD = 30; // MA-Grenze für U1-Pflicht

export function U1U2Overview() {
  const { payrollPeriods, getPayrollReport } = useSupabasePayroll();
  const { employees } = useEmployees();

  const sortedPeriods = useMemo(
    () => [...payrollPeriods].sort((a, b) =>
      a.year !== b.year ? b.year - a.year : b.month - a.month,
    ),
    [payrollPeriods],
  );

  const [selectedId, setSelectedId] = useState<string>(sortedPeriods[0]?.id ?? "");
  const report = selectedId ? getPayrollReport(selectedId) : null;

  const activeEmployees = employees.filter((e) => e.employmentData?.endDate == null).length;
  const u1Required = activeEmployees <= U1_THRESHOLD;

  const totals = useMemo(() => {
    if (!report) return { brutto: 0, u1: 0, u2: 0, insolvenz: 0 };
    const brutto = report.entries.reduce((s, e) => s + e.salaryCalculation.grossSalary, 0);
    return {
      brutto,
      u1: u1Required ? brutto * (U_RATES_2026.u1 / 100) : 0,
      u2: brutto * (U_RATES_2026.u2 / 100),
      insolvenz: brutto * (U_RATES_2026.insolvenz / 100),
    };
  }, [report, u1Required]);

  const items = [
    { key: "u1", label: "U1 (Krankheit)", rate: U_RATES_2026.u1, value: totals.u1, required: u1Required, hint: "Pflicht nur bei ≤ 30 MA" },
    { key: "u2", label: "U2 (Mutterschaft)", rate: U_RATES_2026.u2, value: totals.u2, required: true, hint: "Pflicht für alle AG" },
    { key: "insolvenz", label: "U3 (Insolvenzgeld)", rate: U_RATES_2026.insolvenz, value: totals.insolvenz, required: true, hint: "Pflicht für alle AG" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" /> Umlagen U1 / U2 / U3
            </CardTitle>
            <CardDescription>
              Aufwendungsausgleichsgesetz (AAG) – Beitrags- und Erstattungsbasis pro Periode.
            </CardDescription>
          </div>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Periode wählen" />
            </SelectTrigger>
            <SelectContent>
              {sortedPeriods.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {MONTHS[p.month - 1]} {p.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Aktuelle Mitarbeiterzahl: <strong>{activeEmployees}</strong> ·
            U1-Pflicht: {u1Required ? <Badge variant="secondary">Ja</Badge> : <Badge variant="outline">Nein (&gt; 30 MA)</Badge>}
          </AlertDescription>
        </Alert>

        {!report ? (
          <p className="text-muted-foreground text-sm">Periode auswählen.</p>
        ) : (
          <>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SV-Brutto-Bemessung dieser Periode</span>
                <span className="font-semibold">{formatCurrency(totals.brutto)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {items.map((item) => (
                <div key={item.key} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.required ? (
                      <Badge variant="secondary">Pflicht</Badge>
                    ) : (
                      <Badge variant="outline">optional</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-semibold mt-2">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Satz {item.rate.toFixed(2)} % · {item.hint}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Hinweis: Die U-Sätze sind krankenkassen­abhängig und können hier nur als Richtwert angezeigt werden.
              Maßgeblich sind die Sätze laut Beitragsnachweis der jeweiligen Kasse.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}