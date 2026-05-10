/**
 * Pre-Export Plausibilitäts- und Konsistenzprüfung
 * ─────────────────────────────────────────────────────────────
 * Prüft Stammdaten, Mitarbeiter, Lohnabrechnungen und Meldungs-
 * Datensätze für einen Abrechnungsmonat *bevor* das Export-Center
 * das ZIP-Bundle erzeugt. Ziel: Unternehmer soll nie eine
 * fehlerhafte Meldung an Finanzamt oder Krankenkasse senden.
 *
 * Severity:
 *   error    → Bundle darf nicht erzeugt werden (DB-Fehler, fehlende Pflichtdaten)
 *   warning  → Bundle erzeugbar, aber Korrektur empfohlen
 *   info     → Hinweis (z. B. UV-Jahresmeldung nur Februar)
 */
import { supabase } from "@/integrations/supabase/client";

export type Severity = "error" | "warning" | "info";
export interface ValidationIssue {
  severity: Severity;
  category: string;
  title: string;
  detail: string;
  ref?: string; // z. B. Mitarbeiter-Name, Meldungs-ID
}
export interface ValidationReport {
  issues: ValidationIssue[];
  summary: { errors: number; warnings: number; infos: number };
  metrics: Record<string, number | string>;
}

const STEUERNUMMER_RE = /^\d{2,3}\/?\d{3}\/?\d{4,5}$/;
const BBNR_RE = /^\d{8}$/;
const SV_NUMMER_RE = /^\d{2}\d{6}[A-Z]\d{3}$/i;
const TAX_ID_RE = /^\d{11}$/;
const IBAN_RE = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

const round = (n: number) => Math.round(n * 100) / 100;
const sum = (arr: number[]) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

function MIN_WAGE(year: number) {
  if (year >= 2026) return 13.9;
  if (year >= 2025) return 12.82;
  return 12.41;
}

function lstaDeadline(year: number, month: number): Date {
  // 10. des Folgemonats
  const d = new Date(year, month, 10);
  return d;
}

function bnwDeadline(year: number, month: number): Date {
  // drittletzter Banktag (vereinfachend: 25. des Monats)
  return new Date(year, month - 1, 25);
}

export async function runPreExportValidation(
  tenantId: string,
  year: number,
  month: number,
): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const metrics: Record<string, number | string> = {};
  const add = (i: ValidationIssue) => issues.push(i);

  const period = `${year}-${String(month).padStart(2, "0")}`;
  const monthStart = `${period}-01`;
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10);

  // ---------- 1. Stammdaten Tenant ----------
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle();
  if (!tenant) {
    add({ severity: "error", category: "Stammdaten", title: "Mandant nicht gefunden",
      detail: "Es konnten keine Firmendaten geladen werden." });
    return finalize(issues, metrics);
  }
  if (!tenant.tax_number || !STEUERNUMMER_RE.test(String(tenant.tax_number).replace(/\s/g, ""))) {
    add({ severity: "error", category: "Stammdaten", title: "Steuernummer fehlt oder ungültig",
      detail: "Format z. B. 12/345/67890. Ohne gültige Steuernummer wird die Lohnsteueranmeldung vom Finanzamt abgelehnt.",
      ref: "Einstellungen → Firma" });
  }
  if (!tenant.betriebsnummer || !BBNR_RE.test(String(tenant.betriebsnummer))) {
    add({ severity: "error", category: "Stammdaten", title: "Betriebsnummer (BBNR) fehlt",
      detail: "Pflichtfeld für DEÜV-Meldungen und Beitragsnachweise (8 Ziffern, vergeben durch die Bundesagentur für Arbeit).",
      ref: "Einstellungen → Firma" });
  }
  if (!tenant.street || !tenant.zip_code || !tenant.city) {
    add({ severity: "warning", category: "Stammdaten", title: "Firmenanschrift unvollständig",
      detail: "Straße, PLZ und Ort sind für ELSTER- und Krankenkassen-Meldungen erforderlich." });
  }

  // ---------- 2. Mitarbeiter, die im Monat aktiv waren ----------
  const { data: employees } = await supabase
    .from("employees").select("*")
    .eq("tenant_id", tenantId);
  const active = (employees ?? []).filter(e => {
    if (e.is_active === false) return false;
    if (e.entry_date && e.entry_date > monthEnd) return false;
    if (e.exit_date && e.exit_date < monthStart) return false;
    return true;
  });
  metrics["Aktive Mitarbeiter"] = active.length;

  if (active.length === 0) {
    add({ severity: "warning", category: "Mitarbeiter", title: "Keine aktiven Mitarbeiter im Monat",
      detail: "Für den gewählten Zeitraum liegen keine aktiven Beschäftigten vor." });
  }

  for (const e of active) {
    const name = `${e.first_name} ${e.last_name} (Pers-Nr ${e.personal_number ?? "?"})`;
    if (!e.sv_number || !SV_NUMMER_RE.test(String(e.sv_number).replace(/\s/g, ""))) {
      add({ severity: "error", category: "Mitarbeiter", title: "SV-Nummer fehlt/ungültig", ref: name,
        detail: "12 Stellen Format: TTMMJJ + Buchstabe + Seriennr (z. B. 65180539W001). Pflicht für DEÜV." });
    }
    if (!e.tax_id || !TAX_ID_RE.test(String(e.tax_id))) {
      add({ severity: "error", category: "Mitarbeiter", title: "Steuer-ID fehlt/ungültig", ref: name,
        detail: "11-stellige IdNr — Pflicht für ELStAM-Abruf und eLStB." });
    }
    if (!e.date_of_birth) {
      add({ severity: "error", category: "Mitarbeiter", title: "Geburtsdatum fehlt", ref: name,
        detail: "Pflichtfeld für SV-Meldungen." });
    }
    if (!e.tax_class || e.tax_class < 1 || e.tax_class > 6) {
      add({ severity: "error", category: "Mitarbeiter", title: "Steuerklasse fehlt/ungültig", ref: name,
        detail: "Steuerklasse 1–6 ist Pflicht für die Lohnsteuerberechnung." });
    }
    if (!e.health_insurance) {
      add({ severity: "error", category: "Mitarbeiter", title: "Krankenkasse nicht gesetzt", ref: name,
        detail: "Ohne Krankenkasse kein Beitragsnachweis möglich." });
    }
    if (!e.iban || !IBAN_RE.test(String(e.iban).replace(/\s/g, "").toUpperCase())) {
      add({ severity: "warning", category: "Mitarbeiter", title: "IBAN fehlt/unplausibel", ref: name,
        detail: "Ohne gültige IBAN kann der Nettolohn nicht überwiesen werden." });
    }
    if (!e.street || !e.zip_code || !e.city) {
      add({ severity: "warning", category: "Mitarbeiter", title: "Anschrift unvollständig", ref: name,
        detail: "Pflicht für Lohnsteuerbescheinigung." });
    }
    // Personalnummer-Konvention: ≥ 1001
    if (e.personal_number && Number(e.personal_number) < 1001) {
      add({ severity: "warning", category: "Mitarbeiter", title: "Personalnummer < 1001", ref: name,
        detail: "Konvention: Personalnummern beginnen bei 1001." });
    }
    // Minijob-Grenze
    if (e.employment_type === "minijob" && Number(e.gross_salary) > 556) {
      add({ severity: "error", category: "Mitarbeiter", title: "Minijob-Grenze überschritten", ref: name,
        detail: `Grundlohn ${e.gross_salary} € > 556 €. Beschäftigung ist nicht mehr geringfügig.` });
    }
  }

  // ---------- 3. Lohnabrechnungs-Entries für den Monat ----------
  const { data: period_rows } = await supabase
    .from("payroll_periods").select("id,status").eq("tenant_id", tenantId)
    .eq("year", year).eq("month", month);
  const periodIds = (period_rows ?? []).map(p => p.id);

  let entries: any[] = [];
  if (periodIds.length) {
    const { data: ent } = await supabase
      .from("payroll_entries").select("*")
      .in("payroll_period_id", periodIds);
    entries = ent ?? [];
  }
  metrics["Abrechnungen im Monat"] = entries.length;

  if (active.length > 0 && entries.length === 0) {
    add({ severity: "error", category: "Lohnabrechnung", title: "Keine Abrechnungen für den Monat",
      detail: `Für ${period} existiert kein Eintrag in payroll_entries. Bitte zuerst den Lohnlauf durchführen.` });
  }
  if (entries.length > 0 && active.length > entries.length) {
    add({ severity: "warning", category: "Lohnabrechnung", title: "Abrechnungen unvollständig",
      detail: `${entries.length} Abrechnungen für ${active.length} aktive Mitarbeiter. ${active.length - entries.length} Mitarbeiter ohne Lohnzettel.` });
  }

  let sumLst = 0, sumSoli = 0, sumKist = 0, sumKv = 0, sumRv = 0, sumAv = 0, sumPv = 0, sumGross = 0;
  for (const en of entries) {
    const emp = active.find(a => a.id === en.employee_id);
    const ref = emp ? `${emp.first_name} ${emp.last_name}` : `Mitarbeiter ${en.employee_id}`;
    const gross = Number(en.gross_salary) || 0;
    const net = Number(en.final_net_salary ?? en.net_salary) || 0;
    const lst = Number(en.tax_income_tax) || 0;
    const soli = Number(en.tax_solidarity) || 0;
    const kist = Number(en.tax_church) || 0;
    const svAn = Number(en.sv_total_employee) || 0;

    sumGross += gross; sumLst += lst; sumSoli += soli; sumKist += kist;
    sumKv += Number(en.sv_health_employee) + Number(en.sv_health_employer);
    sumRv += Number(en.sv_pension_employee) + Number(en.sv_pension_employer);
    sumAv += Number(en.sv_unemployment_employee) + Number(en.sv_unemployment_employer);
    sumPv += Number(en.sv_care_employee) + Number(en.sv_care_employer);

    if (gross <= 0) {
      add({ severity: "warning", category: "Lohnabrechnung", title: "Bruttolohn 0 €", ref,
        detail: "Eintrag ohne Brutto — Mitarbeiter im Monat unbezahlt? Bitte prüfen." });
    }
    if (net < 0) {
      add({ severity: "error", category: "Lohnabrechnung", title: "Negativer Nettolohn", ref,
        detail: `Netto ${net} € < 0. Abzüge übersteigen das Brutto.` });
    }
    if (net > gross + 0.01) {
      add({ severity: "error", category: "Lohnabrechnung", title: "Netto > Brutto", ref,
        detail: `Netto ${net} € > Brutto ${gross} €. Berechnung inkonsistent.` });
    }
    if (lst + soli + kist + svAn > gross + 0.01) {
      add({ severity: "error", category: "Lohnabrechnung", title: "Abzüge > Brutto", ref,
        detail: `LSt+Soli+KiSt+SV (AN) ${round(lst + soli + kist + svAn)} € > Brutto ${gross} €.` });
    }
    // Mindestlohn (nur Vollzeit/Teilzeit/Minijob mit Stundenangabe)
    if (emp && Number(emp.weekly_hours) > 0 && ["vollzeit", "teilzeit", "minijob", "midijob"].includes(emp.employment_type)) {
      const monthlyHours = Number(emp.weekly_hours) * 4.33;
      const stundenlohn = monthlyHours > 0 ? gross / monthlyHours : 0;
      const minLohn = MIN_WAGE(year);
      if (stundenlohn > 0 && stundenlohn < minLohn - 0.005) {
        add({ severity: "error", category: "Lohnabrechnung", title: "Mindestlohn unterschritten", ref,
          detail: `Effektiver Stundenlohn ${stundenlohn.toFixed(2)} € < gesetzl. Mindestlohn ${minLohn} € (${year}).` });
      }
    }
  }
  metrics["Σ Brutto"] = round(sumGross);
  metrics["Σ Lohnsteuer"] = round(sumLst);

  // ---------- 4. Meldungs-Konsistenz ----------
  // 4a) LStA: Summen müssen mit Payroll matchen
  const { data: lsta } = await supabase.from("lohnsteueranmeldungen").select("*")
    .eq("tenant_id", tenantId).eq("year", year).eq("month", month);
  if ((lsta ?? []).length === 0 && entries.length > 0) {
    add({ severity: "error", category: "Meldungen", title: "Lohnsteueranmeldung fehlt",
      detail: `Keine LStA für ${period} erzeugt. Frist: 10.${String(month + 1).padStart(2, "0")}.${year}.`,
      ref: "Meldewesen → Lohnsteueranmeldung" });
  } else if ((lsta ?? []).length > 1) {
    add({ severity: "warning", category: "Meldungen", title: "Mehrere LStA für denselben Monat",
      detail: `${lsta!.length} Lohnsteueranmeldungen für ${period}. Doppelte Übermittlung vermeiden!` });
  }
  for (const a of lsta ?? []) {
    const diffLst = Math.abs(Number(a.summe_lohnsteuer ?? 0) - sumLst);
    if (diffLst > 0.02) {
      add({ severity: "error", category: "Meldungen", title: "LStA-Summe weicht von Abrechnungen ab",
        detail: `LStA: ${a.summe_lohnsteuer} € vs. Σ Lohnsteuer aller Abrechnungen: ${round(sumLst)} € (Differenz ${round(diffLst)} €).`,
        ref: "Lohnsteueranmeldung neu erzeugen" });
    }
    const diffSoli = Math.abs(Number(a.summe_solidaritaetszuschlag ?? 0) - sumSoli);
    if (diffSoli > 0.02) {
      add({ severity: "warning", category: "Meldungen", title: "LStA-Soli weicht ab",
        detail: `LStA: ${a.summe_solidaritaetszuschlag} € vs. Σ Soli: ${round(sumSoli)} € (Δ ${round(diffSoli)} €).` });
    }
    if (a.anzahl_arbeitnehmer != null && Number(a.anzahl_arbeitnehmer) !== entries.length) {
      add({ severity: "warning", category: "Meldungen", title: "Anzahl AN in LStA weicht ab",
        detail: `LStA meldet ${a.anzahl_arbeitnehmer} AN, ${entries.length} Abrechnungen vorhanden.` });
    }
  }

  // 4b) Beitragsnachweise — Doppelte je KK?
  const { data: bnw } = await supabase.from("beitragsnachweise").select("*")
    .eq("tenant_id", tenantId).eq("year", year).eq("month", month);
  const kkCount = new Map<string, number>();
  (bnw ?? []).forEach(b => {
    const k = String(b.krankenkasse ?? "");
    kkCount.set(k, (kkCount.get(k) ?? 0) + 1);
  });
  for (const [kk, c] of kkCount.entries()) {
    if (c > 1) {
      add({ severity: "warning", category: "Meldungen", title: `Doppelter Beitragsnachweis: ${kk}`,
        detail: `${c} Beitragsnachweise für ${kk} im selben Monat. Nur einer ist zulässig.` });
    }
  }

  // 4c) AAG Erstattungssatz
  const { data: aag } = await supabase.from("aag_antraege").select("*")
    .eq("tenant_id", tenantId)
    .gte("zeitraum_von", `${year}-01-01`).lte("zeitraum_bis", `${year}-12-31`);
  for (const a of aag ?? []) {
    const r = Number(a.erstattungssatz);
    if (!(r > 0 && r <= 100)) {
      add({ severity: "warning", category: "Meldungen", title: "AAG-Erstattungssatz unplausibel",
        detail: `Erstattungssatz ${r}% — erwartet 40–80% (U1) bzw. 100% (U2).` });
    }
  }

  // 4d) UV-Jahresmeldung — nur Februar fachlich relevant
  if (month !== 2) {
    add({ severity: "info", category: "Meldungen", title: "UV-Jahresmeldung (DSLN)",
      detail: "Wird fachlich nur im Februar des Folgejahres an die BG übermittelt (Frist 16.02.)." });
  }

  // 4e) Sofortmeldungen für Eintritte im Monat
  const eintritte = active.filter(e => e.entry_date && e.entry_date >= monthStart && e.entry_date <= monthEnd);
  if (eintritte.length > 0) {
    const { data: sofort } = await supabase.from("sv_meldungen").select("employee_id")
      .eq("tenant_id", tenantId).eq("meldegrund", "20")
      .gte("created_at", monthStart).lte("created_at", monthEnd + "T23:59:59");
    const sofortIds = new Set((sofort ?? []).map(s => s.employee_id));
    for (const e of eintritte) {
      if (!sofortIds.has(e.id)) {
        add({ severity: "warning", category: "Meldungen", title: "Sofortmeldung fehlt",
          ref: `${e.first_name} ${e.last_name}`,
          detail: `Eintritt ${e.entry_date} — Sofortmeldung § 28a SGB IV ist spätestens am Tag des Beschäftigungsbeginns fällig.` });
      }
    }
  }

  // ---------- 5. Fristen ----------
  const today = new Date();
  const lstaDl = lstaDeadline(year, month);
  const bnwDl = bnwDeadline(year, month);
  if (today > lstaDl) {
    add({ severity: "warning", category: "Fristen", title: "LStA-Frist überschritten",
      detail: `Lohnsteueranmeldung war fällig am ${lstaDl.toLocaleDateString("de-DE")}. Säumniszuschläge möglich.` });
  }
  if (today > bnwDl) {
    add({ severity: "warning", category: "Fristen", title: "BNW-Frist überschritten",
      detail: `Beitragsnachweise waren fällig am ~${bnwDl.toLocaleDateString("de-DE")} (drittletzter Banktag).` });
  }

  return finalize(issues, metrics);
}

function finalize(issues: ValidationIssue[], metrics: Record<string, number | string>): ValidationReport {
  return {
    issues,
    metrics,
    summary: {
      errors: issues.filter(i => i.severity === "error").length,
      warnings: issues.filter(i => i.severity === "warning").length,
      infos: issues.filter(i => i.severity === "info").length,
    },
  };
}