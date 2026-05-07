# Performance-Test Plan

Ziel: Belastbare Messung von Frontend-, Backend- und Berechnungs-Performance der App – inklusive realer Lohnabrechnungs-Last (100/500/1000 Mitarbeiter), DB-Queries, Edge Functions und UI-Rendering.

## 1. Berechnungskern (Pure Logic Benchmarks)
Vitest-basierte Benchmarks (`bench/`) ohne UI/DB:
- `payroll-calculator.bench.ts` – `calculatePayrollEntry` für 1, 10, 100, 1000 MA (Standard, mit Lohnarten, mit Zuschlägen, mit EFZG)
- `tax-calculation.bench.ts` – `calculateCompleteTax` über alle 6 Steuerklassen × Ost/West × Kirchensteuer
- `net-to-gross.bench.ts` – Iterative Netto→Brutto-Konvergenz
- `garnishment.bench.ts` – Pfändungstabellen-Lookup 2025/2026
- `wage-types-integration.bench.ts` – 50 Lohnarten gleichzeitig
- `datev-export.bench.ts` – DATEV-ASCII-Generierung 1k Buchungssätze
- `payroll-pdf-generator.bench.ts` – PDF-Erzeugung 100 Lohnabrechnungen

Metriken: ops/s, mean, p95, p99, Speicherverbrauch (heapUsed delta).
Schwellwerte: 1 Berechnung < 5 ms, 100 MA < 500 ms, 1000 MA < 5 s.

## 2. Datenbank- & Backend-Last
Skript `scripts/perf-db.ts` (Service-Role, gegen Test-Tenant):
- Seed: 1 Tenant, 1000 MA, 12 Monate Time-Entries (~250k Zeilen)
- Messung typischer Queries (EXPLAIN ANALYZE via `supabase--read_query`):
  - `employees` Liste (mit `tenant_id` Filter)
  - `payroll_entries` 90-Tage-Fenster
  - `time_entries` Aggregation pro Mitarbeiter/Monat
  - DEÜV-Rückmeldungen + Lohnkonto-Read
- Index-Check: vorhandene Indizes vs. langsame Queries
- RLS-Overhead messen (mit/ohne JWT)

## 3. Edge Functions
Lasttest via `autocannon`/`curl`-Loop:
- `sv-net-submit` – 50 parallele Requests, 1 Minute
- `parse-pdf-employee` – seriell, 20 PDFs
- `bmf-cross-check` – 100 Requests
Metriken: p50/p95/p99-Latenz, Fehlerrate, Cold-Start-Zeit (Logs).

## 4. Frontend-Performance (Browser-Profiling)
Mit `browser--performance_profile` + `start_profiling`/`stop_profiling`:
- `/dashboard` – initial load, Web Vitals (LCP, CLS, INP, TTFB)
- `/employees` – Liste mit 1000 MA (Render-Zeit, lange Tasks)
- `/payroll` – Lohnlauf-Wizard (5 Schritte, Re-Renders)
- `/time-tracking` – Kalender + Bulk-Entry
- `/reports` – PDF-Export & Charts
- `/meldewesen` – alle Subseiten (AAG, DEÜV, ZVK …)

Bundle-Analyse: `vite build --mode production` + `rollup-plugin-visualizer` Snapshot, Top-10 Chunks.

## 5. End-to-End Lohnlauf
Realistisches Szenario via Test-Skript:
- Automated Payroll Wizard für 100 / 500 / 1000 MA
- Messen: Wall-Clock pro Phase (Input-Load, Berechnung, Persist, PDF, DATEV)
- Identifizieren: Engpass beim Bulk-`insert` in `payroll_entries` (bekannter Bug aus Memory)

## 6. Reporting
- `docs/PERFORMANCE-REPORT-2026-05.md` mit:
  - Tabellen je Bereich (Baseline, Median, p95, Schwellwert, Status)
  - Top-5 Bottlenecks mit konkretem Fix-Vorschlag (Index, Memoization, Batch-Insert, Lazy-Load)
  - Vorher/Nachher falls Quick-Wins direkt umgesetzt
- Artefakt nach `/mnt/documents/performance-report.pdf`

## Technische Details
- Tooling: vitest `bench`, `tinybench`, `autocannon` (npm), `puppeteer` via Lovable Browser-Tools, `supabase--read_query` für `EXPLAIN ANALYZE`.
- Test-Tenant wird angelegt und nach Lauf bereinigt (Cleanup-Skript).
- Keine Production-Daten, keine echte SV-Übermittlung (Stub bleibt aktiv).
- Läuft nicht im CI – manuell ausführbar via `bun run perf:all`.

## Lieferumfang
1. Bench-Suite unter `bench/`
2. Skripte unter `scripts/perf-*.ts`
3. NPM-Scripts: `perf:bench`, `perf:db`, `perf:edge`, `perf:frontend`, `perf:all`
4. PDF-Report mit Empfehlungen

## Offene Fragen
- Soll der Test gegen die **Live-Cloud** oder einen separaten Test-Tenant laufen?
- Sollen identifizierte Quick-Wins (Indizes, Batch-Insert-Fix für Wizard) direkt im selben Lauf umgesetzt werden, oder erst nach Review des Reports?
