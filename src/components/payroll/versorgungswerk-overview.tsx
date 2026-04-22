import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, Info } from "lucide-react";
import { useEmployees } from "@/contexts/employee-context";
import { useSupabasePayroll } from "@/hooks/use-supabase-payroll";
import { formatCurrency } from "@/lib/formatters";

/**
 * Berufsständische Versorgungswerke (LNHN11):
 * Mitarbeiter mit RV-Befreiung (z. B. Ärzte, Apotheker, Architekten, Anwälte)
 * zahlen statt RV in ein Versorgungswerk. Beitrag wird wie RV behandelt
 * (paritätisch AG/AN), aber separat gemeldet.
 */
export function VersorgungswerkOverview() {
  const { employees } = useEmployees();
  const { payrollPeriods, payrollEntries } = useSupabasePayroll();

  const latestPeriod = useMemo(() => {
    return [...payrollPeriods].sort((a, b) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month
    )[0];
  }, [payrollPeriods]);

  const rows = useMemo(() => {
    if (!latestPeriod) return [];
    return employees
      .filter((emp) => (emp as any).rv_befreit && (emp as any).versorgungswerk_name)
      .map((emp) => {
        const entry = payrollEntries.find(
          (e) => e.employeeId === emp.id && e.payrollPeriodId === latestPeriod.id,
        );
        const beitragssatz = Number((emp as any).versorgungswerk_beitragssatz ?? 0);
        const svBrutto = entry?.grossSalary ?? emp.grossSalary ?? 0;
        const beitragGesamt = svBrutto * (beitragssatz / 100);
        const beitragAN = beitragGesamt / 2;
        const beitragAG = beitragGesamt / 2;
        return {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          personalNumber: emp.personalNumber,
          versorgungswerk: (emp as any).versorgungswerk_name,
          mitgliedsnr: (emp as any).versorgungswerk_mitgliedsnummer ?? "—",
          beitragssatz,
          svBrutto,
          beitragGesamt,
          beitragAN,
          beitragAG,
        };
      });
  }, [employees, payrollEntries, latestPeriod]);

  const summe = rows.reduce((acc, r) => acc + r.beitragGesamt, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Berufsständische Versorgung
            </CardTitle>
            <CardDescription>
              RV-befreite Mitarbeiter mit Versorgungswerk-Beiträgen (LNHN11)
            </CardDescription>
          </div>
          <Badge variant="outline">{rows.length} Mitarbeiter</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Keine Mitarbeiter mit Versorgungswerk-Zuordnung. Pflege „RV-befreit" und
              „Versorgungswerk" in den Mitarbeiter-Stammdaten (z. B. für Ärzte, Apotheker,
              Anwälte, Architekten).
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Versorgungswerk</TableHead>
                  <TableHead>Mitgliedsnr.</TableHead>
                  <TableHead className="text-right">SV-Brutto</TableHead>
                  <TableHead className="text-right">Satz</TableHead>
                  <TableHead className="text-right">AN-Anteil</TableHead>
                  <TableHead className="text-right">AG-Anteil</TableHead>
                  <TableHead className="text-right">Gesamt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">#{r.personalNumber}</div>
                    </TableCell>
                    <TableCell>{r.versorgungswerk}</TableCell>
                    <TableCell className="font-mono text-xs">{r.mitgliedsnr}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.svBrutto)}</TableCell>
                    <TableCell className="text-right">{r.beitragssatz.toFixed(2)} %</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.beitragAN)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.beitragAG)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(r.beitragGesamt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-between items-center pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Periode: {latestPeriod?.month}/{latestPeriod?.year}
              </span>
              <span className="text-lg font-bold">
                Summe: {formatCurrency(summe)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}