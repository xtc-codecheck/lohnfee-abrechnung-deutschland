# Phase 1 – Test-Härtung der Steuer-/SV-Logik

**Status:** Wartet auf Freigabe  
**Ziel:** Cent-genaue Verifizierung aller 31 Calculation-Utilities gegen amtliche BMF-Stützstellen, ergänzt durch Property-Based-Tests (fast-check) und Mutation-Tests (Stryker) für die Kern-Module.

**Kritische Regel:** Keine produktive Berechnungslogik wird verändert. Alle Änderungen sind **rein additiv** (neue Test-Dateien, neue Fixtures, neue Configs). Falls ein Test einen echten Bug aufdeckt → STOP, Befund dokumentieren, separat freigeben lassen.

**Geschätzte Dauer:** 4–6 Stunden Implementierung + Stryker-Run (15–45 Min).

---

## Schritt 0 – Vorbereitung & Dependencies (5 Min)

- DevDeps: `fast-check`, `@stryker-mutator/core`, `@stryker-mutator/vitest-runner`, `@stryker-mutator/typescript-checker`.
- Baseline `vitest run` muss grün sein (571 Tests).

## Schritt 1 – BMF-Referenz-Fixtures 2025 / 2026 (60–90 Min)

**Quelle:** BMF-Programmablaufplan zur maschinellen Lohnsteuerberechnung 2025 / 2026.

**Strategie (Mix):**
- ~20 amtliche BMF-PAP-Stützstellen pro Jahr (Brutto/StKl → erwartete LSt/Soli/KiSt).
- Ergänzt durch ~15 Snapshot-Stützstellen für Edge Cases (Faktor IV/IV, KiSt-Kappung, Mehrfachbeschäftigung, Midijob-Übergangsbereich, BBG-Splits, Ost/West).

**Neue Dateien:**
- `src/utils/__tests__/fixtures/bmf-pap-2025.ts`
- `src/utils/__tests__/fixtures/bmf-pap-2026.ts`
- `src/utils/__tests__/fixtures/sv-bmg-2025.ts`
- `src/utils/__tests__/fixtures/sv-bmg-2026.ts`
- `src/utils/__tests__/fixtures/README.md`
- `src/utils/__tests__/bmf-fixtures-verification.test.ts`

## Schritt 2 – Property-Based-Tests mit fast-check (120–180 Min)

8 neue Test-Dateien unter `src/utils/__tests__/property/`:

1. `tax-calculation.property.test.ts`
2. `social-security.property.test.ts`
3. `besondere-lohnsteuer.property.test.ts`
4. `employment-types.property.test.ts`
5. `special-payments.property.test.ts`
6. `industry.property.test.ts`
7. `payroll-calculator.property.test.ts`
8. `auxiliaries.property.test.ts`

Konvention: `fc.assert(fc.property(...), { numRuns: 200, seed: 42 })`.

## Schritt 3 – Stryker Mutation-Testing (45–60 Min Setup + 15–45 Min Run)

- `stryker.config.json` (neu): testRunner=vitest, mutate auf 4 Kern-Utilities, thresholds high=90/low=70/break=null.
- `package.json`: Skript `"test:mutation": "stryker run"`.
- Pilot-Run: `tax-calculation.ts`, `social-security.ts`, `besondere-lohnsteuertabelle.ts`, `payroll-calculator.ts`.

## Schritt 4 – Dokumentation & Verifikation (30 Min)

- `docs/AUDIT-2026-04.md`: Sektion „Phase 1 – Ergebnisse".
- `.lovable/memory/logic/test-harness-phase1.md`: Memory-Eintrag.
- Final: `vitest run` grün + `stryker run` Score dokumentiert.

## Was NICHT geändert wird

- Keine Datei in `src/utils/*.ts` (außer Tests).
- Keine Edge Functions, DB, UI.
- Keine bestehenden Test-Dateien werden modifiziert.

## Abbruchkriterien

- Cent-Diff > 1 ¢ in produktiver Logik → STOP, Befund dokumentieren.
- Stryker-Score < 50 % für ein Modul → als „Test-Lücke" eintragen.

## Lieferumfang

| Datei | Typ |
|-------|-----|
| 4 Fixture-Dateien + README | neu |
| 1 Fixture-Verification-Test | neu |
| 8 Property-Tests | neu |
| `stryker.config.json` | neu |
| `package.json` | edit (devDeps + Skript) |
| `docs/AUDIT-2026-04.md` | edit |
| `.lovable/memory/logic/test-harness-phase1.md` | neu |

**Erwartet:** ~600+ neue Test-Cases, Mutation-Score-Baseline für 4 Kern-Module.
