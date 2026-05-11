# Performance-Report — Großmandant (500 / 1.000 MA)

**Stand:** 2026-05-11 · **Hardware:** CI-Sandbox (Linux x64, Bun v1.3.x)
**Bench-Quelle:** `bench/large-tenant.bench.ts`

## Ziel-SLAs

| Operation                                | SLA        | Gemessen       | Status |
|------------------------------------------|------------|----------------|--------|
| 500 MA · Brutto→Netto (in-memory)        | < 800 ms   | **5.6 ms**     | ✅ 142× besser |
| 1.000 MA · Brutto→Netto (in-memory)      | < 1.600 ms | **9.4 ms**     | ✅ 170× besser |
| DATEV-Export · 500 Abrechnungen          | < 300 ms   | **9.9 ms**     | ✅ 30× besser |

## Methodik

- Berechnungs-Pipeline (`calculatePayrollEntry`) wird sequenziell für N Mitarbeiter
  durchlaufen — repräsentativ für den Wizard-Auto-Run-Pfad ohne DB-Roundtrips.
- DATEV-Export rendert 500 vollständige Buchungssätze inkl. SKR03-Konten,
  Header-Zeile (31 Felder) und CRLF-Joining.
- Iterationen: 10 (500 MA), 5 (1.000 MA), 20 (DATEV).

## Beobachtungen

1. **Lineare Skalierung:** 1.000 MA = ~1.69× der Zeit von 500 MA — sauber linear,
   keine versteckten O(n²)-Hotspots.
2. **DATEV-Export ist nicht der Bottleneck:** 9.9 ms für 500 MA bedeutet, dass
   selbst Mandanten mit 5.000 MA den Export in < 100 ms erzeugen.
3. **Echter Bottleneck im Wizard ist die DB-Persistenz** (≈ 1 RTT pro Bulk-Insert
   à 25 Zeilen, siehe `addPayrollEntries`). Bei 500 MA = 20 Roundtrips =
   ca. 1–3 Sekunden in der Praxis. Hauptkosten = Netzwerk, nicht Berechnung.

## Empfehlungen für 1.000 MA+

- **Bulk-Insert weiter optimieren:** Aktueller Chunk = 25, könnte auf 100 erhöht
  werden, sobald DB-Statement-Limits geprüft sind.
- **Pagination-Audit:** `payroll_entries`-Hauptquery hat `limit(500)` —
  ausreichend für 500 MA + 1 Periode, aber bei Multi-Period-Views muss
  ein Period-Filter ergänzt werden.
- **Query-Caching (`staleTime: 30s`):** Bereits aktiv, reduziert Re-Renders.

## Pending — vor Produktiv-Lasttest

- [ ] Echte Postgres-Latenz-Messung über `scripts/seed-perf-tenant.sql`
      gegen Live-Cloud-DB (nicht in CI sinnvoll).
- [ ] Memory-Profiling mit `--heap`-Snapshot über 100 Wizard-Läufe.
- [ ] Multi-Period-Reports (Jahresübersicht 12 Monate × 500 MA).

## Reproduktion

```bash
bunx vitest bench --run --config vitest.bench.config.ts bench/large-tenant.bench.ts
```