import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileBarChart, Download } from "lucide-react";
import { useSupabasePayroll } from "@/hooks/use-supabase-payroll";
import { useCompanySettings } from "@/hooks/use-company-settings";
import { formatCurrency } from "@/lib/formatters";
import { generatePeriodClosePdf } from "@/utils/period-close-pdf";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function delta(current: number, previous: number): { text: string; positive: boolean } | null {
  if (!previous) return null;
  const diff = current - previous;
  const pct = (diff / previous) * 100;
  const sign = diff >= 0 ? "+" : "";
  return { text: `${sign}${formatCurrency(diff)} (${sign}${pct.toFixed(1)} %)`, positive: diff >= 0 };
}

export function PeriodCloseSummary() {
  const { payrollPeriods, getPayrollReport } = useSupabasePayroll();
  const { settings } = useCompanySettings();

  const sortedPeriods = useMemo(
    () => [...payrollPeriods].sort((a, b) =>
      a.year !== b.year ? b.year - a.year : b.month - a.month,
    ),
    [payrollPeriods],
  );

  const [selectedId, setSelectedId] = useState<string>(sortedPeriods[0]?.id ?? "");
  const current = selectedId ? getPayrollReport(selectedId) : null;

  // Vormonat suchen
  const previous = useMemo(() => {
    if (!current) return null;
    let pYear = current.period.year;
    let pMonth = current.period.month - 1;
    if (pMonth === 0) { pMonth = 12; pYear -= 1; }
    const prev = sortedPeriods.find(p => p.year === pYear && p.month === pMonth);
    return prev ? getPayrollReport(prev.id) : null;
  }, [current, sortedPeriods, getPayrollReport]);

  const downloadPdf = () => {
    if (!current) return;
    const pdf = generatePeriodClosePdf(current, previous, settings?.company_name);
    pdf.save(`periodenabschluss-${current.period.year}-${String(current.period.month).padStart(2, "0")}.pdf`);
  };

  if (sortedPeriods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" /> Periodenabschluss
          </CardTitle>
          <CardDescription>Noch keine Abrechnungen vorhanden.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const s = current?.summary;
  const prev = previous?.summary;

  const kpis = s ? [
    { label: "Bruttolohnsumme", value: s.totalGrossSalary, prev: prev?.totalGrossSalary },
    { label: "Lohnsteuer + Soli + KiSt", value: s.totalTaxes, prev: prev?.totalTaxes },
    { label: "SV-Beiträge AN", value: s.totalSocialSecurityEmployee, prev: prev?.totalSocialSecurityEmployee },
    { label: "SV-Beiträge AG", value: s.totalSocialSecurityEmployer, prev: prev?.totalSocialSecurityEmployer },
    { label: "Auszahlung Netto", value: s.totalNetSalary, prev: prev?.totalNetSalary },
    { label: "AG-Gesamtkosten", value: s.totalEmployerCosts, prev: prev?.totalEmployerCosts },
  ] : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-primary" /> Periodenabschluss
            </CardTitle>
            <CardDescription>
              Zusammenfassung aller Kennzahlen mit Vergleich zum Vormonat.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Periode wählen" />
              </SelectTrigger>
              <SelectContent>
                {sortedPeriods.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {MONTHS[p.month - 1]} {p.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={downloadPdf} disabled={!current}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {current ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {kpis.map((k) => {
              const d = k.prev != null ? delta(k.value, k.prev) : null;
              return (
                <div key={k.label} className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-semibold mt-1">{formatCurrency(k.value)}</p>
                  {d && (
                    <p className={`text-xs mt-1 ${d.positive ? "text-emerald-600" : "text-destructive"}`}>
                      {d.text} vs. Vormonat
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Periode auswählen, um Kennzahlen zu sehen.</p>
        )}
        {current && current.entries.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            Enthält {current.entries.length} Mitarbeiter. PDF enthält pro MA Brutto / Steuern / SV / Netto.
          </p>
        )}
      </CardContent>
    </Card>
  );
}