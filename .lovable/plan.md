## Behebungsplan: 3 offene Punkte vor SYSTAX-Übergabe

### 1) Wizard-Persistenz-Bug (höchste Priorität)

**Symptom:** `payroll_entries` werden nach Wizard-Abschluss nicht zuverlässig persistiert, obwohl Berechnung korrekt ist.

**Befund aus Code-Analyse:**
- `handleConfirmSave` ruft `addPayrollEntries(...)` korrekt auf, aber:
  - `addToHistory` läuft mit `void Promise.allSettled(...)` als Fire-and-forget → Fehler werden geschluckt.
  - Wenn `period.id` existiert, aber `addPayrollEntries` partial fehlschlägt, bleibt der Period-Status auf `draft`, ohne dass ein Retry-Pfad existiert.
  - `entriesWithPeriod` enthält `id: ''` und Default-Timestamps aus `handleCreatePayroll` → Mapper/RLS könnte stillschweigend ablehnen.
- Im Auto-Run (`runAuto` Step 2) wird `calculateAndPersistEntries` aufgerufen, aber dieser Pfad **überspringt** die Pre-Flight-Dialog-Prüfung — zwei unterschiedliche Persistenz-Pfade mit unterschiedlichem Verhalten.
- `usePayrollRunner.calculateAndPersistEntries` filtert per `existingEmployeeIds` aus dem **lokalen** `payrollEntries`-Cache → bei stale State werden Entries fälschlich als „skipped" markiert.

**Fix-Schritte:**
1. **Persistenz-Pfade vereinheitlichen:** Eine einzige Funktion `persistPayrollBatch(periodId, entries)` in `usePayrollRunner` — wird von Auto-Run UND `handleConfirmSave` benutzt.
2. **Skip-Detection serverseitig:** Statt lokalen Cache, vor Insert `payroll_entries` per `(period_id, employee_id)` aus DB neu lesen (oder UNIQUE-Constraint + `onConflict: ignore`).
3. **DB-Constraint absichern:** Migration für `UNIQUE (payroll_period_id, employee_id)` auf `payroll_entries` (falls nicht vorhanden) — verhindert Doubletten.
4. **Atomarer Abschluss:** `updatePayrollPeriodStatus('calculated')` nur wenn `failed.length === 0` UND `saved + skipped === activeEmployees.length`. Andernfalls Period bleibt `draft` und User sieht Retry-Button.
5. **Guardian-History sync:** `await Promise.allSettled(...)` statt fire-and-forget — Fehler nicht blockierend, aber geloggt via `logger.warn`.
6. **Detaillierte Fehler-UI:** Im Toast bei Teilfehlern Liste der Mitarbeiter + Retry-Button anzeigen.

**E2E-Test (`src/utils/__tests__/wizard-persistence.e2e.test.ts`):**
- Setup: Test-Tenant, 5 Mitarbeiter, Time-Entries für Monat.
- Run: kompletter Wizard-Durchlauf via `MonthlyPayrollWizard` mit React-Testing-Library + Mock-Supabase-Client.
- Assert: nach Wizard-Ende existieren 5 `payroll_entries` mit korrekten Beträgen, `period.status = 'calculated'`, Audit-Trail-Einträge geschrieben.
- Negativfall: ein Mitarbeiter mit fehlenden Stammdaten → Period bleibt `draft`, 4 Entries persistiert, klare Fehlermeldung.

### 2) Konstanten 2026 — Re-Check-Automatisierung

**Ziel:** Sobald BMF-Schreiben final ist, soll ein Skript-Lauf cent-genau gegen Referenzwerte vergleichen und Drift erkennen.

**Schritte:**
1. **Verifikations-Skript** `scripts/verify-2026-constants.ts`:
   - Liest `CONSTANTS-VERIFIED-2026.md` (Tabellen mit Soll-Werten).
   - Vergleicht gegen `src/constants/social-security.ts`, `src/utils/tax-params-factory.ts`, `besondere-lohnsteuertabelle.ts`.
   - Output: Diff-Report mit allen Abweichungen (Feldname, Soll, Ist, Quelle).
2. **CI-Hook** in `.github/workflows/payroll-bench.yml` ergänzen: Job `verify-constants` läuft das Skript bei jedem PR.
3. **Golden-Master-Refresh-Test** (`golden-master-2026.test.ts`): Marker-Kommentar `// VERIFY-AFTER-BMF-2026-FINAL` an allen Stellen, die nach BMF-Final neu generiert werden müssen.
4. **Update-Checkliste** als Anhang in `ANNUAL_UPDATE_CHECKLIST.md`: 8-Punkte-Liste (BBG, Beitragssätze, KV-Zusatz, PAP-Tabelle, Soli-Freigrenze, Kinderfreibetrag, Reisekosten-Pauschalen, Sachbezugswerte).

### 3) Großmandanten-Lasttest

**Ziel:** Beweisen, dass das System mit 500+ Mitarbeitern, 12 Monaten Historie, 50.000 Time-Entries stabil läuft.

**Schritte:**
1. **Seed-Skript** `scripts/seed-perf-tenant.sql` erweitern (existiert bereits) auf:
   - 500 Mitarbeiter (Mix Vollzeit/Teilzeit/Minijob/Midijob, alle Branchen).
   - 12 abgeschlossene `payroll_periods` mit je 500 `payroll_entries`.
   - 50.000 `time_entries` über 90 Tage.
   - 200 `eau_records`, 100 `garnishments`.
2. **Bench-Suite** `bench/large-tenant.bench.ts`:
   - Wizard-Komplettlauf für aktuellen Monat (Auto-Run, kein UI).
   - DATEV-Export, GoBD-Export, Lohnkonto-PDF für 500 MA.
   - Reports-Aggregationen (Tax-Social-Security-Report).
   - Ziel-SLA: Wizard < 30 s, DATEV-Export < 10 s, Reports < 5 s.
3. **Memory-Profiling:** Vitest-Bench mit `--heap` Flag, Detektion von Leaks bei wiederholten Wizard-Läufen.
4. **Performance-Report** `docs/PERFORMANCE-REPORT-LARGE-TENANT.md` mit Soll/Ist, Auffälligkeiten, Empfehlungen.
5. **Pagination-Audit:** Prüfung, dass `payrollEntries`-Loader nirgends das 500er-Limit umgeht (existierender Constraint laut Memory).

### Reihenfolge & Risiko

| # | Aufgabe                          | Aufwand | Risiko | Blockt Übergabe |
|---|----------------------------------|---------|--------|-----------------|
| 1 | Wizard-Persistenz + DB-Constraint | M       | Mittel | **Ja** |
| 1 | E2E-Test                         | S       | Klein  | **Ja** |
| 2 | Verify-Skript + CI               | S       | Klein  | Nein (BMF wartet) |
| 3 | Seed + Bench-Suite               | M       | Klein  | Nein (kann parallel) |

### Nicht im Scope

- ITSG-Zertifizierung (externer Prozess).
- Echte ELSTER/finAPI-Anbindung (SYSTAX-seitig).
- Refactoring der `usePayrollRunner`-Architektur (gerade frisch fertig).

### Deliverables

- 1 DB-Migration (UNIQUE-Constraint).
- Edits in `usePayrollRunner.ts`, `monthly-payroll-wizard.tsx`.
- Neuer Test `wizard-persistence.e2e.test.ts`.
- Neues Skript `scripts/verify-2026-constants.ts` + CI-Job.
- Neue Bench-Datei + Performance-Report.
- 1 Memory-Update (Critical-Bug-Eintrag entfernen nach Fix).
