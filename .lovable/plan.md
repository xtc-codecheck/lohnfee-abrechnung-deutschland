
# LohnPro – Systemcheck Stand 2026-05-11

## A. Ist-Zustand (Messwerte)

| Metrik | Wert | Bewertung |
|---|---|---|
| Source-Dateien (`.ts/.tsx`, ohne Tests) | **300** | gewachsen ggü. Audit 04 (246) |
| Test-Dateien / Tests | **33 / 773** (771 grün, **1 rot**, 1 todo) | hoch |
| `console.*` außerhalb Tests | **0** | bereinigt |
| `TODO/FIXME/HACK` | **0** | bereinigt |
| `any` / `as any` außerhalb Tests | **0** | bereinigt |
| Hardcoded Tailwind-Farben | **0** | komplett auf Tokens migriert |
| Supabase-Linter | **28 WARN** (SECURITY DEFINER ausführbar für anon/authenticated) | mittel |
| Bekannte kritische Bugs | Auto-Wizard `payroll_entries`-Persistenz (Memory Core) | hoch |

**Quintessenz:** Code-Qualitätsschulden aus dem April-Audit sind weitgehend abgebaut. Der Fokus dieses Checks liegt auf **fachlicher Vollständigkeit, Datenflüssen, Sicherheits-Hardening** und einem **echten Test-Failure**.

---

## B. Befunde nach den 11 Prüfpunkten

### 1. Codequalität & Sauberkeit
- ✅ Keine `console.*`, `any`, `TODO` mehr — sauber.
- ⚠ **1 fehlschlagender Test:** `datev-export.test.ts > getDefaultDatevConfig > gibt gültige Standardkonfiguration zurück`. Muss vor jedem Release fixen.
- ⚠ Mehrere große Komponenten >500 Zeilen (z. B. `monthly-payroll-wizard.tsx`, `time-payroll-sync.tsx`, `automation-dashboard.tsx`) — Kandidaten für Subkomponenten-Split.
- ⚠ `payroll-core/index.ts` Re-Exports lassen ts-prune ~150 Funde produzieren (false positives, dokumentiert).

### 2. Architektur & Struktur
- ✅ Saubere Schichtung: `pages → components/<domain> → hooks → utils → payroll-core`.
- ✅ `payroll-core/` jurisdiktions-isoliert (SYSTAX-ready), eigene `index.ts` als öffentliche API.
- ⚠ Doppelte AI-Aufruf-Pfade (Edge Functions + direkte Helper) sollten in einen Gateway-Wrapper.
- ⚠ Keine zentrale `error-handler.ts` für Edge-Function-Fehler (Mapping → Toast/Logger fehlt einheitlich).

### 3. Performance & Effizienz
- ✅ Payroll-Queries auf 500 limitiert, Time-Entries 90 Tage default.
- ✅ React lazy-loading auf 24 Routen, Suspense-Fallback vorhanden.
- ⚠ React-Query nicht durchgängig — etliche Hooks haben manuelle `useEffect`+`useState`-Loader (`use-special-payments`, `use-eau-records`, `use-export-schedule`).
- ⚠ Bench-Suite vorhanden (`bench/*.bench.ts`) aber nicht regelmäßig gegen Baseline geprüft.

### 4. Stabilität & Zuverlässigkeit
- 🔴 **HOCH: Auto-Wizard `payroll_entries`-Insert** scheitert teils still (Memory Core).
- 🔴 **HOCH: Pre-Flight Status-Refetch** nach Save aktualisiert UI nicht.
- 🔴 **HOCH: 1 roter Test** in DATEV-Export.
- ⚠ E2E-Test-Coverage für den Storno-/Korrektur-Workflow fehlt (Utility ist getestet, der Round-Trip „LStA → Storno → Re-LStA" nicht).
- ⚠ Fehlerverhalten der Edge Functions (`bmf-cross-check`, `parse-pdf-employee`, `sv-net-submit`, `receipt-ocr`) hat keine zentralen Retry/Backoff-Konventionen.

### 5. Sicherheit & Datenschutz
- 🔴 **28 Linter-WARNs**: SECURITY DEFINER-Funktionen sind für `anon` und/oder `authenticated` per Default ausführbar. Funktionen wie `is_primary_admin`, `has_role`, `is_tenant_member`, `audit_trigger_func`, `auto_create_tenant_for_new_user`, `assign_default_role`, `generate_personal_number`, `current_portal_employee_id`, `is_steuerberater_for_tenant`, `shares_tenant`, `get_default_tenant`, `handle_new_user`, `update_updated_at_column`. → Pro Funktion entscheiden: `REVOKE EXECUTE FROM anon, authenticated`, oder bewusst behalten + dokumentieren.
- ✅ AI-Aufrufe via Edge Functions, keine clientseitigen Keys.
- ✅ Audit-Trigger + GoBD-Audit-Protokoll mit Hash-Verifikation aktiv.
- ⚠ Storage-Buckets (`receipts`, `travel-receipts`, `eau-attests`) – RLS-Policies sollten verifiziert werden (per-Tenant + per-Mitarbeiter Zugriff).

### 6. Konsistenz & Wartbarkeit
- ✅ Naming konsistent (DE-Domäne, EN-Code), Dark/Light-Tokens flächendeckend.
- ⚠ Footer in `MainLayout` und `LegalLayout` potenziell doppelt — visuell prüfen.
- ⚠ Kein einheitlicher `logger.ts`-Wrapper (heute nur try/catch).

### 7. Verweise & Ressourcen
- ✅ `sitemap.xml`, `robots.txt`, `placeholder.svg` vorhanden.
- ⚠ Mehrere Markdown-Reports in `docs/` — Konsolidierung in `docs/INDEX.md` empfohlen.
- ⚠ `package.json` ohne explizite `engines`/Node-Version-Pin.

### 8. Dokumentation & Verständlichkeit
- ✅ `payroll-core/README.md`, `SYSTAX-INTEGRATION-GUIDE.md`, `SYSTAX-PAYLOAD-SPEC.md`, `CONSTANTS-VERIFIED-2026.md`.
- ⚠ Kein **Onboarding-Guide** (Setup, Tests, Migration-Workflow, Tenant-Bootstrap) für neue Entwickler.
- ⚠ Memory `mem://index.md` markiert Auto-Wizard-Bug noch als „Critical" — nach Fix entfernen.

### 9. UX
- ✅ `MainLayout` mit Skip-Link, ARIA, Dark-Mode, Tenant-Switcher, Cookie-Consent.
- ✅ `AppBreadcrumb` durchgängig.
- ⚠ Lange Wizards (Onboarding, Monthly Payroll) — Schritt-Validierung pro Step uneinheitlich.
- ⚠ Mobile (<768 px) Tests für Payroll-Detail, Wizard und Reports fehlen visuell verifiziert.

### 10. Funktions-Inventar (Kurzfassung — je 5 Stichpunkte)

> Vollständige Verknüpfungs-Matrix folgt in Phase 0 als `/docs/SYSTEMCHECK-2026-05.md`.

**Stamm & Onboarding**
- Mitarbeiter-Wizard, ELStAM-Validierung, PDF-Upload-Tab, Lohnarten-Zuordnung, Persönliche Nummer ab 1001.

**Lohnabrechnung (Payroll)**
- Monthly-Wizard (5 Schritte), Auto-Wizard, Pre-Flight, Detail-Ansicht, Storno-/Korrektur-Workflow, Audit-Protokoll (GoBD-Hash).

**Berechnungs-Engine (`payroll-core`)**
- BMF-PAP 2025/2026 cent-genau, Tax-Engine + SV (Ost/West/PV-Kinderlosen-Zuschlag), Special-Calc (bAV, Dienstwagen, Pfändung, Mehrfachbeschäftigung), Specials (Märzklausel, Entgeltfortzahlung, Mutterschutz), Industry (Bau/SOKA, Gastro, Pflege/TVöD-P).

**Meldewesen**
- LStA (§ 41a EStG), Beitragsnachweis (BNW), DEÜV/Sofortmeldung, UV-Jahresmeldung, AAG, Bescheinigungen, ZVK, Pre-Export-Validation-Dialog.

**Reports & Export**
- DATEV ASCII v7.0 (SKR03/04), GoBD-Export, FiBu-Journal, Lohnkonto §41 EStG, Compliance/Mindestlohn-Audit, Krankheits-/Urlaubsreport, Steuer-/SV-Report, Statistik.

**Compliance & Guardian**
- AI Payroll Guardian (Z-Score-Anomalie), Mindestlohn-Audit, Compliance-Alerts, Salary-Forecasting, Salary-Benchmarking.

**Zeit & Travel**
- Time-Tracking (Kalender, Bulk-Entry, EAU), Travel/Spesen, Time-Payroll-Sync mit Zuschlägen.

**Behörden & Schnittstellen**
- ELSTER/ELStAM-Validierung, SV-Net-Submit (Edge Function), DATEV-Connect-Transfer, BMF-Cross-Check (Edge Function), PDF-Parser (Edge Function), Receipt-OCR.

**Plattform & Admin**
- Multi-Tenant (`tenant_id` überall), Rollen (`user_roles` per Tenant), Steuerberater-Mandanten-Zuordnung, Mitarbeiter-Portal, GDPR-Mgmt, Cookie-Consent, Session-Timeout.

**Logische Lücken / Verbindungs-Risiken (Phase 0 verifizieren)**
- Auto-Wizard ↔ `payroll_entries` (Persistenz unsicher).
- Pre-Flight ↔ Period-Status (kein Refetch nach Save).
- Storno-Workflow ↔ DEÜV-Stornomeldung (heute nur LStA + BNW – Sozialversicherungs-Storno-Pfad unklar).
- ELStAM ↔ Lohnabrechnung-Trigger (Änderungsmitteilungen lösen automatische Korrekturberechnung?).
- Mehrfachbeschäftigung ↔ BBG-Split (Modul vorhanden, aber Aufruf aus Master-Engine prüfen).

### 11. Design / Konsistenz
- ✅ HSL-Tokens, Light/Dark vollständig.
- ⚠ Möglicher Doppel-Footer (`MainLayout` + `LegalLayout`) – visuelle Prüfung.
- ⚠ Mobile-Wizard-Stepper noch nicht durchverifiziert.

---

## C. Konsolidierte Top-Findings

| # | Befund | Schwere | Kategorie |
|---|---|---|---|
| 1 | Auto-Wizard `payroll_entries`-Persistenz schlägt still fehl | **HOCH** | Stabilität |
| 2 | 28 SECURITY DEFINER-Funktionen ohne `REVOKE EXECUTE` | **HOCH** | Security |
| 3 | DATEV-Export Test rot (`getDefaultDatevConfig`) | **HOCH** | Test/Release |
| 4 | Pre-Flight Status-Refetch fehlt | **HOCH** | UX/Stabilität |
| 5 | DEÜV-Storno-Pfad im Korrektur-Workflow unklar | MITTEL | Compliance |
| 6 | React-Query nicht durchgängig (manuelle Loader) | MITTEL | Performance |
| 7 | Storage-Bucket-RLS für `receipts/eau-attests/travel-receipts` ungeprüft | MITTEL | Security |
| 8 | Wizard-Komponenten >500 LOC | MITTEL | Wartbarkeit |
| 9 | Edge-Function-Fehlerhandling uneinheitlich | MITTEL | Zuverlässigkeit |
| 10 | Onboarding-Doc für neue Entwickler fehlt | NIEDRIG | Doku |
| 11 | Doppelter Footer-Verdacht / Mobile-QA Wizards | NIEDRIG | Design |

---

## D. 6-Phasen-Verbesserungsplan

### Phase 0 — Inventarisierung & Analyse (read-only, ~½ Tag)
- `docs/SYSTEMCHECK-2026-05.md` mit vollständigem Funktions-Inventar + Verknüpfungsmatrix (Tabelle: Quelle → Ziel → Datenfeld → Test-Status).
- Manuelle Verifikation der 5 „logischen Lücken" aus Punkt 10.
- **Akzeptanz:** Ein Markdown-Dokument unter `/docs`, im Memory verlinkt.

### Phase 1 — Kritische Stabilität (1–2 Tage)
1. **DATEV-Export-Test fixen** (`getDefaultDatevConfig`) — Root-Cause analysieren, ggf. Defaults anpassen, Test grün.
2. **Auto-Wizard `payroll_entries`-Persistenz fixen** — Insert-Pfad + Fehlerbehandlung instrumentieren, Vitest + Integrationstest gegen Mock-Supabase.
3. **Pre-Flight-Status-Refetch** — `queryClient.invalidateQueries(['payroll-period', id])` nach Save.
- **Akzeptanz:** alle 773 Tests grün, manueller Round-Trip erfolgreich.

### Phase 2 — Security-Hardening (1 Tag)
1. **28 SECURITY DEFINER WARNs** Funktion für Funktion bewerten:
   - „Trigger-only" → `REVOKE EXECUTE FROM anon, authenticated`.
   - „Helper für RLS" (`has_role`, `is_tenant_member` …) → bleiben aufrufbar, im Memory + `security-memory` als bewusst dokumentieren.
2. **Storage-Bucket-Policies** auditieren (`receipts`, `travel-receipts`, `eau-attests`) — Tenant-/Employee-Isolation.
3. **Security-Memory** aktualisieren.
- **Akzeptanz:** Linter ≤ Anzahl bewusst-akzeptierter Findings, alle übrigen weg.

### Phase 3 — Compliance-Lücken Meldewesen (2–3 Tage)
1. **DEÜV-Storno-Pfad** in `payroll-storno-workflow.ts` ergänzen (analog zu LStA/BNW).
2. **ELStAM-Änderungs-Trigger** → automatische Korrekturberechnung mit Pre-Export-Validation.
3. **Mehrfachbeschäftigung BBG-Split** End-to-End Integration prüfen (Master-Engine-Aufruf, Test).
- **Akzeptanz:** Neue Tests in `rule-matrix.test.ts` + dedizierter Storno-E2E-Test grün.

### Phase 4 — Architektur-Refactor (2–3 Tage)
1. Einheitlicher `lib/logger.ts`-Wrapper (warn/error → konsole + optional Sentry/Edge).
2. Edge-Function-Fehlerhandling vereinheitlichen (`utils/edge-error.ts` mit Retry/Toast/Mapping).
3. React-Query Migration für die verbleibenden manuellen Hooks (`use-special-payments`, `use-eau-records`, `use-export-schedule`).
4. Großkomponenten splitten (`monthly-payroll-wizard.tsx`, `time-payroll-sync.tsx`, `automation-dashboard.tsx`).
- **Akzeptanz:** Keine Komponente >400 LOC, Hooks nutzen React-Query.

### Phase 5 — Tests & Performance-Baseline (1–2 Tage)
1. **E2E-Tests** für Storno-, Korrektur-, Auto-Wizard-Round-Trip.
2. **Property-Tests** für DEÜV-/Mehrfachbeschäftigung.
3. **Bench-Baseline** in CI persistieren (`payroll-bench.yml` erweitern, % Regression-Gate).
- **Akzeptanz:** ≥800 Tests grün, Bench-Report im PR-Workflow.

### Phase 6 — Doku & UX-Polish (1 Tag)
1. `docs/ONBOARDING.md` (Setup, Test-Run, Migration-Workflow, Tenant-Seed).
2. `docs/INDEX.md` als Übersicht aller `/docs`-Dateien.
3. Mobile-QA der 3 wichtigsten Flows (Wizard, Payroll-Detail, Reports).
4. Doppel-Footer-Check + Fix.
- **Akzeptanz:** Onboarding-Walkthrough möglich, Mobile-Screenshots im Doc.

---

## Hinweis zu kritischen Integrationen
Berührungen an **Tax-Engine, SV-Berechnung, DATEV-/GoBD-/SV-Net-/ELSTER-Schnittstellen, BMF-Cross-Check** erfolgen ausschließlich:
- mit vorheriger Golden-Master-/Property-Test-Erweiterung,
- ohne Änderung an verifizierten Konstanten (siehe `CONSTANTS-VERIFIED-2026.md`),
- mit cent-genauer Vorher/Nachher-Diff-Pflicht.

Bestätige bitte, mit welchen Phasen ich starten soll (Empfehlung: **Phase 1 zuerst**, weil 1 roter Test + 2 dokumentierte HOCH-Bugs).
