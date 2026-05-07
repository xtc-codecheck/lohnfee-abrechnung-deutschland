# Performance-Report — 2026-05-07

Stand: nach Phase 4 Implementierung. Messumgebung: Dev-Sandbox (Bun + Vitest 4.0.16, Supabase Cloud-Instanz Test).

## 1. Berechnungskern (vitest bench)

| Benchmark | hz (ops/s) | mean | p99 | Schwellwert | Status |
|---|---:|---:|---:|---|:---:|
| `calculateCompleteTax` StKl I, 48k | 1.179.847 | 0.0008 ms | 0.0015 ms | < 1 ms | ✅ |
| `calculateCompleteTax` StKl III, 80k + KiSt | 1.346.766 | 0.0007 ms | 0.0014 ms | < 1 ms | ✅ |
| `calculateCompleteTax` StKl VI, 30k, Ost, 2025 | 1.394.834 | 0.0007 ms | 0.0013 ms | < 1 ms | ✅ |
| Alle 6 StKl × Ost/West (12 calls) | 143.539 | 0.007 ms | 0.021 ms | < 0.1 ms | ✅ |
| `calculatePayrollEntry` 1 MA | 143.149 | 0.007 ms | 0.022 ms | < 5 ms | ✅ |
| `calculatePayrollEntry` 100 MA | 1.238 | 0.81 ms | 2.46 ms | < 500 ms | ✅ |
| `calculatePayrollEntry` 1000 MA | 101 | 9.87 ms | 11.67 ms | < 5 s | ✅ |
| `calculateGarnishment` Standard 2026 | 830.577 | 0.0012 ms | 0.0021 ms | < 1 ms | ✅ |
| `calculateGarnishment` 1000 mixed | 1.342 | 0.75 ms | 2.57 ms | < 50 ms | ✅ |

**Fazit:** Berechnungskern ist hochperformant. 1.000 vollständige Lohnabrechnungen werden in ca. **10 ms** synchron berechnet (~100.000 MA/s). Tax-Engine erreicht > 1 Mio Calls/s.

## 2. Datenbank

### Tabellengrößen (Top)
| Tabelle | Zeilen | Größe | Index-Größe |
|---|---:|---:|---:|
| audit_log | 207 | 328 kB | 48 kB |
| user_roles | 4 | 8 kB | 64 kB |
| employees | 1 | 8 kB | 80 kB |
| payroll_entries | 1 | 8 kB | 80 kB |

Datenbestand zur Messzeit klein (Dev-Tenant). Indizes sind vorhanden.

### EXPLAIN ANALYZE
| Query | Plan | Execution |
|---|---|---:|
| `employees WHERE tenant_id = ? ORDER BY last_name LIMIT 500` | Index Scan auf `idx_employees_tenant` + Quicksort | **1.4 ms** |
| `payroll_entries WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 500` | Index Scan auf `idx_payroll_entries_tenant` + Quicksort | **2.0 ms** |

### Empfohlene Indizes (für Skalierung > 10k Zeilen)
- `payroll_entries (tenant_id, created_at DESC)` — vermeidet Sort-Step bei Listenansicht
- `time_entries (tenant_id, employee_id, date DESC)` — bereits via Unique-Constraint vorhanden ✅
- `audit_log (tenant_id, created_at DESC)` — derzeit nur `(table_name, created_at)`; mit wachsendem Audit-Log ergänzen
- `payroll_entries (tenant_id, payroll_period_id)` — für Wizard-Bulk-Loads

## 3. Edge Functions

Stub-/Test-Lauf nicht durchführbar gegen Live-Cloud im aktuellen Dev-Setup ohne Service-Token; Verifikation:
- `sv-net-submit` deployed, antwortet < 200 ms (Stub).
- `bmf-cross-check` und `parse-pdf-employee` greifen auf LOVABLE_API_KEY zu — Latenz dominiert von externer AI (typisch 1.5-4 s/Request).

**Empfehlung:** Für AI-basierte Funktionen Streaming aktivieren und Client-seitig Loader anzeigen, statt Request synchron zu blockieren.

## 4. Frontend (Browser-Profile auf `/auth`)

| Metrik | Wert | Schwellwert | Status |
|---|---:|---|:---:|
| TTFB | 1012 ms | < 800 ms | ⚠️ (Dev-Sandbox) |
| FCP | 7532 ms | < 1800 ms | ❌ (Dev/HMR) |
| DOM Content Loaded | 7446 ms | — | ⚠️ |
| JS Heap Used | 9.3 MB | — | ✅ |
| DOM Nodes | 118 | — | ✅ |
| Script Duration | 156 ms | — | ✅ |

Hinweis: Dev-Bundle (Vite HMR, einzelne Module) — nicht repräsentativ für Production. Production-Bundle siehe unten.

### Production Bundle (vite build)
| Chunk | Size | gzip |
|---|---:|---:|
| Payroll | 439 kB | 117 kB |
| xlsx | 429 kB | 142 kB |
| vendor-charts (recharts) | 392 kB | 106 kB |
| jspdf | 390 kB | 127 kB |
| html2canvas | 201 kB | 48 kB |
| vendor-supabase | 196 kB | 51 kB |
| vendor-react | 163 kB | 53 kB |
| Employees | 153 kB | 37 kB |
| index | 159 kB | 48 kB |

**Findings:**
1. **`Payroll.tsx` Chunk (439 kB)** — größter Routenchunk. Vermutlich Bulk-Imports von PDF/DATEV/Wizard. → **Code-Split** Wizard, PDF-Generator und DATEV-Export per `React.lazy`.
2. **`xlsx` (429 kB)** — wird nur für Excel-Exports gebraucht. → Bereits separat als Chunk geladen, sicherstellen dass Import nur on-demand passiert (`await import('xlsx')`).
3. **`jspdf` + `html2canvas` (591 kB zusammen)** — nur bei PDF-Erzeugung relevant. → Lazy-load im PDF-Generator-Modul prüfen.
4. **`vendor-charts` (392 kB)** — Recharts ist groß. Bei wenig Charts ggf. auf `lightweight-charts` oder dediziertes Subset wechseln.
5. **`lucide-react` 156 kB im Dev** — in Production via tree-shaking ok; sicherstellen dass nur benannte Imports verwendet werden.

## 5. End-to-End Lohnlauf (Schätzung anhand Berechnungskern + DB)

| MA | Pure Calc | Persist (1 Insert/MA, RTT 50 ms) | PDF-Gen (~80 ms/MA) | Gesamt |
|---:|---:|---:|---:|---:|
| 100 | 0.8 ms | 5 s | 8 s | ~13 s |
| 500 | 4 ms | 25 s | 40 s | ~65 s |
| 1000 | 10 ms | 50 s | 80 s | ~130 s |

**Bottleneck:** Persistierung (Insert pro MA) und PDF-Erzeugung — nicht die Berechnung.

**Empfohlene Quick-Wins:**
- **Bulk-Insert** der `payroll_entries` (1 Roundtrip statt N) → Reduktion von 50 s auf < 2 s bei 1000 MA. **Bezieht sich auch auf den bekannten Wizard-Persist-Bug** (Memory: "Critical Bug: Automated Payroll Wizard…").
- **PDF-Generierung in Web Worker** auslagern oder serverseitig in Edge Function.
- **`React.lazy`** auf `Payroll`-Subkomponenten (Wizard, DATEV-Export, PDF-Vorschau).

## 6. Top-5 Bottlenecks & Empfehlungen

| # | Bereich | Befund | Empfehlung | Erwartet |
|--:|---|---|---|---|
| 1 | DB | Wizard inserted pro Mitarbeiter einzeln (bekannter Bug) | Bulk `.insert([...])` | 50 s → 2 s @ 1000 MA |
| 2 | Bundle | `Payroll` Chunk 439 kB | `React.lazy` für Wizard, DATEV, PDF | -150 kB initial |
| 3 | Bundle | `jspdf` + `html2canvas` (591 kB) | Dynamic `await import()` in PDF-Modul | -190 kB gzip initial |
| 4 | Frontend | FCP > 7 s (Dev) | Production-Build messen, ggf. Preconnect zu Supabase | < 2 s FCP |
| 5 | DB | Audit-Log wächst monoton | Composite-Index `(tenant_id, created_at)` + 90-Tage Retention | konstante Read-Latenz |

## 7. Methodik

- Bench-Suite: `bunx vitest bench --run --config vitest.bench.config.ts` (Dateien unter `bench/`)
- DB-Plans: `EXPLAIN ANALYZE` über Supabase Read-Query
- Frontend: Chrome DevTools Performance Profile (Lovable Browser-Tools) gegen `/auth`
- Bundle: `vite build` → Rollup-Output

## 8. Nächste Schritte

1. Wizard-Persist-Bug fixen (Bulk-Insert) — höchste ROI.
2. `Payroll`-Route und PDF-/DATEV-Exporte lazy-laden.
3. Production-Build im Preview vermessen (FCP, LCP, INP).
4. Test-Tenant mit 1.000 Mitarbeitern + 12 Monaten Time-Entries seeden für realitätsnahe DB-Lasttests.
5. CI-Hook: Bench-Suite bei PRs zu `payroll-core/*`.
