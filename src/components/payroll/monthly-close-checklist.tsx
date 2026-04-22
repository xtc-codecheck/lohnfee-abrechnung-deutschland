import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ClipboardCheck, RotateCcw } from "lucide-react";

type ChecklistCategory = "stamm" | "bewegung" | "abrechnung" | "abschluss";

interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  label: string;
  hint?: string;
  required: boolean;
}

const CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  stamm: "Stammdaten",
  bewegung: "Bewegungsdaten",
  abrechnung: "Abrechnungslauf",
  abschluss: "Versand & Abschluss",
};

/**
 * 14-Punkte-Monatsabschluss-Checkliste nach internem ProCheck.
 * Status wird pro Periode lokal (per period-Key) im LocalStorage gespeichert.
 */
const ITEMS: ChecklistItem[] = [
  { id: "stamm-elstam", category: "stamm", label: "ELStAM-Abruf aktuell (alle MA)", required: true, hint: "Letzter Abruf ≤ 30 Tage" },
  { id: "stamm-svnr", category: "stamm", label: "SV-Nummern & Steuer-IDs vollständig", required: true },
  { id: "stamm-kk", category: "stamm", label: "Krankenkassen-Betriebsnummern gepflegt", required: true },
  { id: "stamm-besonderheiten", category: "stamm", label: "Mandantenbesonderheiten geprüft", required: false, hint: "Tankgutschein, Sachbezüge etc." },

  { id: "bewegung-ein-aus", category: "bewegung", label: "Ein- und Austritte erfasst", required: true },
  { id: "bewegung-zeit", category: "bewegung", label: "Zeiterfassung übernommen / freigegeben", required: true },
  { id: "bewegung-eau", category: "bewegung", label: "eAU-Meldungen abgerufen", required: false },
  { id: "bewegung-sonder", category: "bewegung", label: "Sonderzahlungen (UB, WG, Boni) eingespielt", required: false },

  { id: "abr-mindestlohn", category: "abrechnung", label: "Mindestlohn-Prüfprotokoll erstellt", required: true },
  { id: "abr-anomalien", category: "abrechnung", label: "Payroll Guardian – Anomalien gesichtet", required: true },
  { id: "abr-pfaendung", category: "abrechnung", label: "Pfändungen & bAV-Limits geprüft", required: false },

  { id: "abschluss-lsta", category: "abschluss", label: "Lohnsteueranmeldung übermittelt", required: true },
  { id: "abschluss-bnw", category: "abschluss", label: "Beitragsnachweise versendet", required: true },
  { id: "abschluss-datev", category: "abschluss", label: "DATEV-Export erzeugt & archiviert", required: true },
];

function storageKey(period: string) {
  return `monthly-close-checklist:${period}`;
}

function loadState(period: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(period));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function MonthlyCloseChecklist({
  period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
}: { period?: string }) {
  const [state, setState] = useState<Record<string, boolean>>(() => loadState(period));

  const toggle = (id: string, value: boolean) => {
    setState((prev) => {
      const next = { ...prev, [id]: value };
      try {
        window.localStorage.setItem(storageKey(period), JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  };

  const reset = () => {
    setState({});
    try {
      window.localStorage.removeItem(storageKey(period));
    } catch {
      /* ignore */
    }
  };

  const stats = useMemo(() => {
    const total = ITEMS.length;
    const done = ITEMS.filter((i) => state[i.id]).length;
    const requiredOpen = ITEMS.filter((i) => i.required && !state[i.id]).length;
    return { total, done, requiredOpen, percent: Math.round((done / total) * 100) };
  }, [state]);

  const grouped = useMemo(() => {
    return (Object.keys(CATEGORY_LABEL) as ChecklistCategory[]).map((cat) => ({
      category: cat,
      items: ITEMS.filter((i) => i.category === cat),
    }));
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Monatsabschluss-Checkliste {period}
            </CardTitle>
            <CardDescription>
              Prüfprotokoll vor Versand der Lohnabrechnung – nach internem ProCheck.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Zurücksetzen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {stats.done} / {stats.total} Punkte erledigt
            </span>
            {stats.requiredOpen === 0 ? (
              <Badge variant="secondary">Pflichtpunkte erledigt</Badge>
            ) : (
              <Badge variant="destructive">{stats.requiredOpen} Pflichtpunkt(e) offen</Badge>
            )}
          </div>
          <Progress value={stats.percent} />
        </div>

        <Separator />

        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.category} className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABEL[group.category]}
              </h4>
              <ul className="space-y-2">
                {group.items.map((item) => {
                  const checked = !!state[item.id];
                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-md border bg-card p-3 hover:bg-accent/30 transition-colors"
                    >
                      <Checkbox
                        id={item.id}
                        checked={checked}
                        onCheckedChange={(v) => toggle(item.id, v === true)}
                        className="mt-1"
                      />
                      <label htmlFor={item.id} className="flex-1 cursor-pointer space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {item.label}
                          {item.required && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              Pflicht
                            </Badge>
                          )}
                        </div>
                        {item.hint && (
                          <p className="text-xs text-muted-foreground">{item.hint}</p>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}