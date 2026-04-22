import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt } from "lucide-react";
import { useSupabasePayroll } from "@/hooks/use-supabase-payroll";
import { formatCurrency } from "@/lib/formatters";
import { MINIJOB_2026, MINIJOB_2025 } from "@/constants/social-security";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

/**
 * Pauschalsteuer-Nachweis (§ 40 / § 40a EStG)
 * - Minijob: 2 % Pauschalsteuer auf Bruttolohn (bis Verdienstgrenze)
 * - Sachbezüge können mit 25 % oder 30 % pauschaliert werden (manuell hinterlegt)
 */
export function PauschalsteuerOverview() {
  const { payrollPeriods, getPayrollReport } = useSupabasePayroll();

  const sortedPeriods = useMemo(
    () => [...payrollPeriods].sort((a, b) =>
      a.year !== b.year ? b.year - a.year : b.month - a.month,
    ),
    [payrollPeriods],
  );

  const [selectedId, setSelectedId] = useState<string>(sortedPeriods[0]?.id ?? "");
  const report = selectedId ? getPayrollReport(selectedId) : null;

  const minijobLimit = report && report.period.year >= 2026
    ? MINIJOB_2026.maxEarnings
    : MINIJOB_2025.maxEarnings;
  const minijobRate = MINIJOB_2026.taxRate;

  const minijobRows = useMemo(() => {
    if (!report) return [];
    return report.entries
      .filter((e) => {
        const type = e.employee.employmentData?.employmentType;
        const gross = e.salaryCalculation.grossSalary;
        return type === "minijob" || gross <= minijobLimit;
      })
      .map((e) => {
        const gross = e.salaryCalculation.grossSalary;
        return {
          id: e.id,
          name: `${e.employee.personalData?.firstName ?? ""} ${e.employee.personalData?.lastName ?? ""}`.trim(),
          gross,
          pauschal: gross * minijobRate,
        };
      });
  }, [report, minijobLimit, minijobRate]);

  const minijobTotal = minijobRows.reduce((s, r) => s + r.pauschal, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> Pauschalsteuer-Nachweis
            </CardTitle>
            <CardDescription>
              Übersicht der pauschal versteuerten Arbeitsentgelte nach § 40 / § 40a EStG.
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
      <CardContent className="space-y-6">
        {!report ? (
          <p className="text-muted-foreground text-sm">Periode auswählen.</p>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">
                  Minijob-Pauschalsteuer (2 %) – Grenze {formatCurrency(minijobLimit)}
                </h4>
                <Badge variant="secondary">
                  Summe: {formatCurrency(minijobTotal)}
                </Badge>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mitarbeiter</TableHead>
                      <TableHead className="text-right">Bruttolohn</TableHead>
                      <TableHead className="text-right">Pauschalsteuer 2 %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {minijobRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                          Keine Minijob-Beschäftigten in dieser Periode.
                        </TableCell>
                      </TableRow>
                    ) : (
                      minijobRows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(r.gross)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(r.pauschal)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
              <p className="font-semibold">Hinweise zu weiteren Pauschalierungen</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Sachbezüge bis 50 € / Monat sind nach § 8 Abs. 2 S. 11 EStG steuerfrei.</li>
                <li>Übersteigende Sachbezüge können mit 25 % (§ 40 Abs. 2 EStG) oder 30 % (§ 37b EStG) pauschaliert werden.</li>
                <li>Erholungsbeihilfen können mit 25 % pauschal versteuert werden.</li>
                <li>Fahrtkostenzuschüsse (Wohnung-Arbeit) mit 15 %.</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}