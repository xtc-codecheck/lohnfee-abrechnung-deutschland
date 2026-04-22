import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { PayrollEntry } from "@/types/payroll";
import { getYearConfig } from "@/constants/social-security";

interface TaxBreakdownCardProps {
  entry: PayrollEntry;
  year: number;
}

/**
 * Transparente Aufschlüsselung der Soli- und Kirchensteuer-Berechnung
 * inkl. Milderungszone (§ 4 SolzG) und optionaler Kirchensteuer-Kappung.
 * Alle Werte werden auf Jahresbasis dargestellt – wie in der PAP-Berechnung.
 */
export function TaxBreakdownCard({ entry, year }: TaxBreakdownCardProps) {
  const calc = entry.salaryCalculation;
  const employee = entry.employee;
  const config = getYearConfig(year);

  // Jahreswerte (PAP rechnet jährlich, Monatswerte = / 12)
  const incomeTaxYearly = calc.taxes.incomeTax * 12;
  const soliYearly = calc.taxes.solidarityTax * 12;
  const churchYearly = calc.taxes.churchTax * 12;

  const soliFreigrenze = config.taxAllowances.solidarityTaxFreeAmount; // 19.950 €
  const soliFullRate = config.taxRates.solidarityTax; // 0,055

  // Soli-Berechnungs-Pfade nachvollziehen
  const soliVollsatz = incomeTaxYearly * soliFullRate;
  const soliMilderung = Math.max(0, (incomeTaxYearly - soliFreigrenze) * 0.119);
  const soliBelowFreigrenze = incomeTaxYearly <= soliFreigrenze;
  const soliMilderungAktiv =
    !soliBelowFreigrenze && soliMilderung < soliVollsatz;

  // Kirchensteuer
  const churchActive = !!employee.personalData.churchTax;
  const churchRate = employee.personalData.churchTaxRate ?? 9;

  return (
    <Card className="shadow-card border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Berechnungs-Transparenz: Soli &amp; Kirchensteuer
          <Badge variant="outline" className="ml-2 text-xs">
            Veranlagung {year}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lohnsteuer als Bezugsgröße */}
        <div className="rounded-md bg-muted/40 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Lohnsteuer (Jahr) – Bemessungsgrundlage
            </span>
            <span className="font-mono font-semibold">
              {formatCurrency(incomeTaxYearly)}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted-foreground">davon monatlich</span>
            <span className="font-mono">
              {formatCurrency(calc.taxes.incomeTax)}
            </span>
          </div>
        </div>

        {/* Solidaritätszuschlag */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Solidaritätszuschlag</h4>
            <Badge
              variant={
                soliBelowFreigrenze
                  ? "secondary"
                  : soliMilderungAktiv
                    ? "default"
                    : "outline"
              }
              className="text-xs"
            >
              {soliBelowFreigrenze
                ? "Unter Freigrenze – kein Soli"
                : soliMilderungAktiv
                  ? "Milderungszone (§ 4 SolzG)"
                  : "Vollsatz 5,5 %"}
            </Badge>
          </div>

          <div className="space-y-1.5 text-sm">
            <Row
              label={`Freigrenze ${year}`}
              value={formatCurrency(soliFreigrenze)}
              hint="Jahres-Lohnsteuer ≤ Freigrenze ⇒ Soli = 0 €"
            />
            <Row
              label="Vollsatz: 5,5 % × Lohnsteuer"
              value={formatCurrency(soliVollsatz)}
              dimmed={soliBelowFreigrenze}
            />
            <Row
              label="Milderung: 11,9 % × (LSt − Freigrenze)"
              value={formatCurrency(soliMilderung)}
              dimmed={soliBelowFreigrenze}
            />
            <div className="border-t border-border my-2" />
            <Row
              label={
                soliBelowFreigrenze
                  ? "Ergebnis: 0 € (unter Freigrenze)"
                  : soliMilderungAktiv
                    ? "min(Vollsatz; Milderung)"
                    : "min(Vollsatz; Milderung) = Vollsatz"
              }
              value={formatCurrency(soliYearly)}
              bold
            />
            <div className="text-xs text-muted-foreground pt-1">
              Monatlich:{" "}
              <span className="font-mono">
                {formatCurrency(calc.taxes.solidarityTax)}
              </span>
            </div>
          </div>
        </section>

        {/* Kirchensteuer */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Kirchensteuer</h4>
            <Badge variant={churchActive ? "default" : "secondary"} className="text-xs">
              {churchActive ? `${churchRate} % aktiv` : "Nicht kirchensteuerpflichtig"}
            </Badge>
          </div>

          {!churchActive ? (
            <p className="text-sm text-muted-foreground">
              Mitarbeiter ist nicht kirchensteuerpflichtig – es wird keine
              Kirchensteuer einbehalten.
            </p>
          ) : (
            <div className="space-y-1.5 text-sm">
              <Row
                label={`Standard: ${churchRate} % × Lohnsteuer`}
                value={formatCurrency(incomeTaxYearly * (churchRate / 100))}
                hint="Bayern/BW: 8 %, übrige Länder: 9 %"
              />
              <Row
                label="Optionale Kappung (zvE × Kappungssatz)"
                value="– nicht aktiviert –"
                dimmed
                hint="Bundesländer mit Kappung: typ. 2,75 % – 4 % des zvE, nur auf Antrag"
              />
              <div className="border-t border-border my-2" />
              <Row
                label="Ergebnis (Jahr)"
                value={formatCurrency(churchYearly)}
                bold
              />
              <div className="text-xs text-muted-foreground pt-1">
                Monatlich:{" "}
                <span className="font-mono">
                  {formatCurrency(calc.taxes.churchTax)}
                </span>
              </div>
            </div>
          )}
        </section>

        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Berechnet nach § 3, § 4 SolzG sowie KiStG der Länder. Cent-genaue
          Abrundung (§ 32a Abs. 1 S. 6 EStG analog). Alle Beträge auf
          Jahresbasis – Monatswerte ergeben sich aus / 12.
        </p>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  hint,
  bold,
  dimmed,
}: {
  label: string;
  value: string;
  hint?: string;
  bold?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-baseline ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col">
        <span className={bold ? "font-semibold" : "text-muted-foreground"}>
          {label}
        </span>
        {hint && (
          <span className="text-xs text-muted-foreground/80">{hint}</span>
        )}
      </div>
      <span className={`font-mono ${bold ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  );
}