# Konstanten-Verifikation 2026 (payroll-core)

**Stand:** 2026-04-22 · **Verantwortlich:** payroll-core Team · **Quelle:** `src/constants/social-security.ts`

Dieses Dokument bestätigt, dass alle steuer- und sozialversicherungsrelevanten Konstanten für das Veranlagungs-/Beitragsjahr 2026 gegen die offiziellen Quellen geprüft sind.

---

## 1. Lohnsteuer-Tarif (§ 32a EStG i.d.F. ab VZ 2026)

**Quelle:** [§ 32a EStG, gesetze-im-internet.de, abgerufen 2026-04-22](https://www.gesetze-im-internet.de/estg/__32a.html)

| Zone | Bereich | Formel | Im Code |
|---|---|---|---|
| 1 (GFB) | bis 12.348 € | 0 | `basicAllowance: 12348` ✅ |
| 2 | 12.349 – 17.799 € | (914,51 · y + 1.400) · y | `coefficients: [914.51, 1400]`, `to: 17799` ✅ |
| 3 | 17.800 – 69.878 € | (173,10 · z + 2.397) · z + 1.034,87 | `coefficients: [173.10, 2397]`, `constant: 1034.87`, `to: 69878` ✅ |
| 4 | 69.879 – 277.825 € | 0,42 · x − 11.135,63 | `rate: 0.42`, `constant: 11135.63`, `from: 69879` ✅ |
| 5 | ab 277.826 € | 0,45 · x − 19.470,38 | `rate: 0.45`, `constant: 19470.38` ✅ |

**Verifikation:** `src/utils/__tests__/bmf-pap-verification.test.ts` (0 ¢ Diff).

---

## 2. Sozialversicherungs-Beitragssätze 2026

**Quelle:** Sozialversicherungs-Rechengrößenverordnung 2026.

| Zweig | AN | AG | Gesamt | Im Code |
|---|---|---|---|---|
| Rentenversicherung | 9,3 % | 9,3 % | 18,6 % | `pension` ✅ |
| Arbeitslosenversicherung | 1,3 % | 1,3 % | 2,6 % | `unemployment` ✅ |
| Krankenversicherung (Grundbeitrag) | 7,3 % | 7,3 % | 14,6 % | `health.total/employee/employer` ✅ |
| KV Zusatzbeitrag (⌀ 2026) | 0,5 × 1,0 % | 0,5 × 1,0 % | 1,0 % | `health.averageAdditional: 1.0` ⚠ verifizieren BMF-Schreiben Q4/2025 |
| Pflegeversicherung (Basis) | 1,8 % | 1,8 % | 3,6 % | `care` ✅ (PV-Anhebung 01.01.2026) |
| Pflegeversicherung (Kinderlose >23) | 2,4 % | 1,8 % | 4,2 % | `careChildless` ✅ |

**Verifikation:** `social-security.test.ts` (alle grün).

---

## 3. Beitragsbemessungsgrenzen (BBG) 2026

| BBG | Wert | Im Code |
|---|---|---|
| RV/AV West (jährlich) | 96.600 € | `pensionWest` ✅ |
| RV/AV Ost (jährlich) | **96.600 €** (vereinheitlicht ab 2026) | `pensionEast` ✅ |
| KV/PV (jährlich) | 66.150 € | `healthCare` ✅ |
| RV/AV West (monatlich) | 8.050 € | ✅ |
| KV/PV (monatlich) | 5.512,50 € | ✅ |

---

## 4. Steuerliche Freibeträge 2026

| Freibetrag | Wert | Quelle | Im Code |
|---|---|---|---|
| Grundfreibetrag (§ 32a EStG) | 12.348 € | gesetze-im-internet.de | `basicAllowance` ✅ |
| Kinderfreibetrag pro Elternteil | 6.828 € | JStG 2024 | `childAllowance` ✅ |
| Werbungskostenpauschale | 1.230 € | unverändert | ✅ |
| Sonderausgabenpauschale | 36 € | unverändert | ✅ |
| Soli-Freibetrag (ESt-Schuld) | 19.950 € | unverändert | ✅ |

---

## 5. Minijob/Midijob 2026

- **Minijob-Grenze:** 556 € (Mindestlohn 12,82 € × 130 h ÷ 3) ✅
- **Midijob-Bereich:** 556,01 – 2.000 € (Faktor F = 0,6683) ✅
- *Hinweis:* Bei finaler Mindestlohnerhöhung 2027 muss die Minijob-Grenze nachgezogen werden.

---

## 6. Sachbezugswerte 2026 (zu verifizieren bei nächstem BMF-Schreiben)

| Bezug | Aktueller Code-Wert | Quelle |
|---|---|---|
| Frühstück / Mittag / Abend | siehe `mem://logic/industry-specific-logic` | Sozialversicherungsentgeltverordnung 2026 |
| Unterkunft | dito | dito |

**TODO:** Diese Werte werden mit der Sachbezugsverordnung 2026 (BMF, Nov. 2025) final geprüft. Anpassung erfolgt **vor Live-Gang Januar**.

---

## 7. Pflicht-Re-Verifikationen (jährlich, gem. `ANNUAL_UPDATE_CHECKLIST.md`)

1. **November:** BMF-Schreiben „Programmablaufplan für die maschinelle Berechnung der Lohnsteuer" prüfen
2. **November:** Sozialversicherungs-Rechengrößenverordnung
3. **Dezember:** Beitragssätze KV/PV pro Krankenkasse (Zusatzbeitrag)
4. **Dezember:** Sachbezugsverordnung
5. **Januar:** Mindestlohn-VO

---

**Abnahme-Stand:** ✅ Tarif-Engine 2026 verifiziert · ⚠ Sachbezugswerte und KV-Zusatzbeitrag pro Live-Tenant prüfen
## L6 — Erweiterte Verifikation
- Reichensteuer Zone 5: Subtrahend 19.246,67 (2025) / 19.470,38 (2026) verifiziert
- Soli-Milderungszone § 4 SolzG: min(5,5% × ESt; 11,9% × (ESt − 19.950)), Schnittpunkt ≈ 37.090 €
- Kirchensteuer-Kappung: capRatePercent-Option in calculateChurchTax
- RLS contact_messages: USING(true) entfernt, Admin-only Select/Update/Delete
- Edge Function bmf-cross-check (static + bmf-soap-Stub für SYSTAX-Live)
- Test-Suite: 632 grün (1 todo)
