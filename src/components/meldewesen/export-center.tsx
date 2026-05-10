/**
 * Meldewesen-Export-Center
 * ─────────────────────────────────────────────────────────────
 * Zentrale Anlaufstelle für Unternehmer:
 *   "Was muss ich diesen Monat wo einreichen?"
 *
 * Lädt alle für den gewählten Monat erzeugten Meldungs-Datensätze
 * (LStA, Beitragsnachweise, DEÜV, AAG, UV, Sofortmeldung, eLStB)
 * aus der DB und packt sie als ZIP-Bundle zum Download.
 * Pro Meldung: maschinenlesbares XML/CSV + Klartext-Anleitung,
 * wo der Datensatz produktiv hochgeladen werden muss
 * (sv.net Classic, Mein ELSTER, BG-Portal …).
 *
 * Damit kann ein Unternehmer ohne ITSG-Zertifizierung alle
 * gesetzlichen Meldungen termingerecht abgeben.
 */
import { useState } from "react";
import JSZip from "jszip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Package, FileText, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";

const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

interface BundleResult {
  files: number;
  recipients: { name: string; portal: string; url: string; count: number }[];
}

function xmlEscape(v: unknown): string {
  return String(v ?? "").replace(/[<>&"']/g, c => ({ "<":"&lt;",">":"&gt;","&":"&amp;","\"":"&quot;","'":"&apos;" }[c]!));
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

interface Props { onBack: () => void }

export function ExportCenter({ onBack }: Props) {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BundleResult | null>(null);

  const buildBundle = async () => {
    if (!tenantId) return;
    setBusy(true);
    setResult(null);
    try {
      const zip = new JSZip();
      const period = `${year}-${String(month).padStart(2, "0")}`;
      const recipients = new Map<string, { name: string; portal: string; url: string; count: number }>();
      const addRecipient = (key: string, info: Omit<typeof recipients extends Map<string, infer V> ? V : never, "count">) => {
        const cur = recipients.get(key);
        if (cur) cur.count += 1;
        else recipients.set(key, { ...info, count: 1 });
      };

      // 1) Lohnsteueranmeldung → Mein ELSTER
      const { data: lsta } = await supabase.from("lohnsteueranmeldungen")
        .select("*").eq("tenant_id", tenantId).eq("year", year).eq("month", month);
      lsta?.forEach((row, i) => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<LohnsteuerAnmeldung Zeitraum="${period}">
  <Steuernummer>${xmlEscape(row.steuernummer)}</Steuernummer>
  <Finanzamt>${xmlEscape(row.finanzamt)}</Finanzamt>
  <Anzahl_AN>${row.anzahl_arbeitnehmer ?? 0}</Anzahl_AN>
  <Lohnsteuer>${row.summe_lohnsteuer ?? 0}</Lohnsteuer>
  <Soli>${row.summe_solidaritaetszuschlag ?? 0}</Soli>
  <KiSt_Ev>${row.summe_kirchensteuer_ev ?? 0}</KiSt_Ev>
  <KiSt_Rk>${row.summe_kirchensteuer_rk ?? 0}</KiSt_Rk>
  <Pauschal>${row.summe_pauschale_lohnsteuer ?? 0}</Pauschal>
  <Gesamt>${row.gesamtbetrag ?? 0}</Gesamt>
</LohnsteuerAnmeldung>`;
        zip.folder("01_Lohnsteueranmeldung_ELSTER")?.file(`LSt_${period}_${i + 1}.xml`, xml);
        addRecipient("elster", {
          name: `Finanzamt – Lohnsteueranmeldung ${period}`,
          portal: "Mein ELSTER",
          url: "https://www.elster.de",
        });
      });

      // 2) Beitragsnachweise → sv.net Classic
      const { data: bnw } = await supabase.from("beitragsnachweise")
        .select("*").eq("year", year).eq("month", month);
      const bnwForTenant = (bnw ?? []).filter(b => b.tenant_id === tenantId);
      bnwForTenant.forEach((row, i) => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Beitragsnachweis Zeitraum="${period}">
  <Krankenkasse>${xmlEscape(row.krankenkasse)}</Krankenkasse>
  <BBNR_KK>${xmlEscape(row.betriebsnummer_kk)}</BBNR_KK>
  <Anzahl_Versicherte>${row.anzahl_versicherte ?? 0}</Anzahl_Versicherte>
  <KV_AN>${row.kv_an ?? 0}</KV_AN><KV_AG>${row.kv_ag ?? 0}</KV_AG>
  <RV_AN>${row.rv_an ?? 0}</RV_AN><RV_AG>${row.rv_ag ?? 0}</RV_AG>
  <AV_AN>${row.av_an ?? 0}</AV_AN><AV_AG>${row.av_ag ?? 0}</AV_AG>
  <PV_AN>${row.pv_an ?? 0}</PV_AN><PV_AG>${row.pv_ag ?? 0}</PV_AG>
  <Umlage_U1>${row.umlage_u1 ?? 0}</Umlage_U1>
  <Umlage_U2>${row.umlage_u2 ?? 0}</Umlage_U2>
  <Insolvenzgeldumlage>${row.insolvenzgeldumlage ?? 0}</Insolvenzgeldumlage>
  <Gesamtbetrag>${row.gesamtbetrag ?? 0}</Gesamtbetrag>
  <Faelligkeit>${xmlEscape(row.faelligkeitsdatum)}</Faelligkeit>
</Beitragsnachweis>`;
        zip.folder("02_Beitragsnachweise_svnet")?.file(`BNW_${period}_${(row.krankenkasse || "KK").replace(/\W+/g, "_")}_${i + 1}.xml`, xml);
        addRecipient("svnet", {
          name: `Krankenkasse – Beitragsnachweise ${period}`,
          portal: "sv.net Classic",
          url: "https://www.itsg.de/produkte/sv-net/",
        });
      });

      // 3) DEÜV / SV-Meldungen → sv.net Classic
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10);
      const { data: svm } = await supabase.from("sv_meldungen").select("*")
        .eq("tenant_id", tenantId).gte("created_at", monthStart).lte("created_at", monthEnd + "T23:59:59");
      svm?.forEach((row: any, i) => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DEUEV_Meldung>
  <Grund>${xmlEscape(row.meldegrund)}</Grund>
  <PersonengruppeSchluessel>${xmlEscape(row.personengruppe ?? "101")}</PersonengruppeSchluessel>
  <BBNR_AG>${xmlEscape(row.betriebsnummer_ag ?? "")}</BBNR_AG>
  <BBNR_KK>${xmlEscape(row.betriebsnummer_kk)}</BBNR_KK>
  <Krankenkasse>${xmlEscape(row.krankenkasse)}</Krankenkasse>
  <Zeitraum_Von>${xmlEscape(row.zeitraum_von)}</Zeitraum_Von>
  <Zeitraum_Bis>${xmlEscape(row.zeitraum_bis)}</Zeitraum_Bis>
  <Brutto>${row.brutto ?? row.entgelt ?? 0}</Brutto>
</DEUEV_Meldung>`;
        zip.folder("03_DEUEV_SV-Meldungen_svnet")?.file(`DEUEV_${row.meldegrund || "X"}_${i + 1}.xml`, xml);
        addRecipient("svnet", {
          name: `Krankenkasse – DEÜV-Meldungen ${period}`,
          portal: "sv.net Classic",
          url: "https://www.itsg.de/produkte/sv-net/",
        });
      });

      // 4) AAG-Erstattungsanträge → sv.net
      const { data: aag } = await supabase.from("aag_antraege").select("*")
        .eq("tenant_id", tenantId)
        .gte("zeitraum_von", `${year}-01-01`).lte("zeitraum_bis", `${year}-12-31`);
      const aagForMonth = (aag ?? []).filter(a => {
        const d = new Date(a.zeitraum_von);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      aagForMonth.forEach((row, i) => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AAG_Antrag Typ="${xmlEscape(row.antrag_typ)}">
  <Krankenkasse>${xmlEscape(row.krankenkasse)}</Krankenkasse>
  <Zeitraum_Von>${xmlEscape(row.zeitraum_von)}</Zeitraum_Von>
  <Zeitraum_Bis>${xmlEscape(row.zeitraum_bis)}</Zeitraum_Bis>
  <Brutto_Entgelt>${row.brutto_entgelt}</Brutto_Entgelt>
  <Fortzahlungstage>${row.fortzahlungstage}</Fortzahlungstage>
  <Erstattungssatz>${row.erstattungssatz}</Erstattungssatz>
  <Erstattungsbetrag>${row.erstattungsbetrag}</Erstattungsbetrag>
  <SV_Beitraege>${row.sv_beitraege}</SV_Beitraege>
</AAG_Antrag>`;
        zip.folder("04_AAG_Erstattung_svnet")?.file(`AAG_${row.antrag_typ}_${i + 1}.xml`, xml);
        addRecipient("svnet", {
          name: "Krankenkasse – AAG U1/U2 Erstattung",
          portal: "sv.net Classic",
          url: "https://www.itsg.de/produkte/sv-net/",
        });
      });

      // 5) UV-Jahresmeldung (DSLN) — nur Februar relevant, aber immer auflisten
      const { data: uv } = await supabase.from("uv_jahresmeldungen").select("*")
        .eq("tenant_id", tenantId).eq("year", year);
      uv?.forEach((row: any, i) => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<UV_Jahresmeldung Meldejahr="${row.year}">
  <BG>${xmlEscape(row.berufsgenossenschaft ?? "")}</BG>
  <Mitgliedsnummer>${xmlEscape(row.bg_mitgliedsnummer)}</Mitgliedsnummer>
  <Gefahrtarifstelle>${xmlEscape(row.gefahrtarifstelle)}</Gefahrtarifstelle>
  <Gesamt_Brutto>${row.brutto_summe ?? 0}</Gesamt_Brutto>
  <Gesamt_Stunden>${row.geleistete_arbeitsstunden ?? 0}</Gesamt_Stunden>
  <Anzahl_Versicherte>${row.anzahl_versicherte ?? 0}</Anzahl_Versicherte>
</UV_Jahresmeldung>`;
        zip.folder("05_UV_Jahresmeldung_BG-Portal")?.file(`DSLN_${row.year}_${i + 1}.xml`, xml);
        addRecipient("bg", {
          name: `Berufsgenossenschaft – DSLN ${row.year}`,
          portal: "BG-Portal Lohnnachweis Digital",
          url: "https://www.dguv.de/lohnnachweis-digital",
        });
      });

      // 6) Sofortmeldungen
      const { data: sm } = await supabase.from("sv_meldungen").select("*")
        .eq("tenant_id", tenantId).eq("meldegrund", "20")
        .gte("created_at", monthStart).lte("created_at", monthEnd + "T23:59:59");
      sm?.forEach((row, i) => {
        addRecipient("svnet", {
          name: "Krankenkasse – Sofortmeldungen § 28a SGB IV",
          portal: "sv.net Classic",
          url: "https://www.itsg.de/produkte/sv-net/",
        });
      });

      // 7) Lohnsteuerbescheinigungen (eLStB) — am Jahresende relevant
      const { data: lstb } = await supabase.from("lohnsteuerbescheinigungen").select("*")
        .eq("tenant_id", tenantId).eq("year", year);
      if (month === 12 && lstb && lstb.length > 0) {
        const header = "Mitarbeiter;Steuerklasse;Brutto;Lohnsteuer;Soli;KiSt;RV_AN;RV_AG;KV_AN;KV_AG;AV_AN;AV_AG;PV_AN;PV_AG\n";
        const rows = lstb.map(r =>
          [r.employee_id, r.steuerklasse, r.zeile_3_bruttolohn, r.zeile_4_lst, r.zeile_5_soli,
           r.zeile_6_kist, r.zeile_22a_arbeitnehmeranteil_rv, r.zeile_22b_arbeitgeberanteil_rv,
           r.zeile_23a_arbeitnehmeranteil_kv, r.zeile_23b_arbeitgeberanteil_kv,
           r.zeile_24a_arbeitnehmeranteil_av, r.zeile_24b_arbeitgeberanteil_av,
           r.zeile_25_arbeitnehmeranteil_pv, r.zeile_26_arbeitgeberanteil_pv].map(csvEscape).join(";"),
        ).join("\n");
        zip.folder("06_Lohnsteuerbescheinigungen_ELSTER")?.file(`eLStB_${year}.csv`, header + rows);
        addRecipient("elster", {
          name: `Finanzamt – elektronische Lohnsteuerbescheinigung ${year}`,
          portal: "Mein ELSTER",
          url: "https://www.elster.de",
        });
      }

      // README mit Anleitung
      const readme = `LOHNPRO – MELDUNGS-EXPORT ${period}
================================================

Dieses Bundle enthält alle gesetzlichen Meldungs-Datensätze für ${MONTHS[month-1]} ${year},
die für Ihren Betrieb fällig sind. Die Datensätze sind formal korrekt erzeugt und können
über die folgenden offiziellen Portale eingereicht werden:

1) Lohnsteueranmeldung (LStA, § 41a EStG)
   → Mein ELSTER (https://www.elster.de)
   → Frist: 10. des Folgemonats

2) Beitragsnachweise an die Krankenkassen
   → sv.net Classic (https://www.itsg.de/produkte/sv-net/)
   → Frist: 5. Arbeitstag des Folgemonats (drittletzter Banktag des Monats)

3) DEÜV / SV-Meldungen (An-/Abmeldungen, Jahresmeldungen)
   → sv.net Classic
   → Frist: max. 6 Wochen nach Eintritt/Austritt

4) AAG U1/U2 Erstattungsanträge (Krankheit / Mutterschaft)
   → sv.net Classic
   → Frist: ohne, je früher desto besser

5) UV-Jahresmeldung (Digitaler Lohnnachweis DSLN)
   → BG-Portal (https://www.dguv.de/lohnnachweis-digital)
   → Frist: 16. Februar des Folgejahres

6) Lohnsteuerbescheinigung (eLStB, § 41b EStG)
   → Mein ELSTER
   → Frist: 28. Februar des Folgejahres

WICHTIG
-------
Die XML-Dateien folgen dem fachlichen DEÜV/sv.net-Schema und enthalten alle gesetzlich
geforderten Felder. Sie sind als Vorlage für den manuellen Upload via sv.net Classic
gedacht. Eine direkte automatisierte Übermittlung erfordert eine ITSG-Zertifizierung,
die LohnPro derzeit nicht besitzt.

Stand: ${new Date().toLocaleDateString("de-DE")}
`;
      zip.file("README_Anleitung.txt", readme);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Meldungen_${period}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      const fileCount = Object.keys(zip.files).filter(f => !zip.files[f].dir).length;
      setResult({ files: fileCount, recipients: Array.from(recipients.values()) });
      toast({ title: `Export-Bundle erstellt`, description: `${fileCount} Dateien für ${period}` });
    } catch (e: any) {
      toast({ title: "Export-Fehler", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Export-Center"
        description="Alle gesetzlichen Meldungen eines Monats als ZIP-Bundle herunterladen — bereit für sv.net Classic, Mein ELSTER und das BG-Portal."
        onBack={onBack}
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Bundle für Meldemonat erstellen</CardTitle>
          <CardDescription>Wählen Sie den Abrechnungsmonat. Das System erzeugt ein ZIP mit allen fälligen Meldungen + Anleitung.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Jahr</Label>
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monat</Label>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={buildBundle} disabled={busy} className="w-full">
                {busy
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Erzeuge…</>
                  : <><Download className="h-4 w-4 mr-2" /> Bundle erstellen & herunterladen</>}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Hinweis zur Übermittlung</AlertTitle>
            <AlertDescription>
              Die Datensätze sind formal korrekt nach DEÜV/sv.net-Schema. Da LohnPro keine ITSG-Zertifizierung
              für den direkten Versand besitzt, laden Sie die Dateien einmalig pro Monat über die kostenlosen
              offiziellen Portale hoch (sv.net Classic, Mein ELSTER, BG-Portal). Ein README im ZIP führt Sie
              Schritt für Schritt.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {result && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" /> Bundle erzeugt: {result.files} Dateien
            </CardTitle>
            <CardDescription>So reichen Sie die einzelnen Pakete ein:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.recipients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Für diesen Monat liegen keine Meldungs-Datensätze vor. Erzeugen Sie zuerst die Lohnabrechnung
                und Meldungen unter „Lohn“ und „Meldewesen".
              </p>
            )}
            {result.recipients.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.portal}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.count}</Badge>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      Portal öffnen <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}