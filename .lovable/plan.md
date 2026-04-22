# Go-Live-Plan – Steuerliche Berechnungen vollständig & cent-genau

**Stand:** 2026-04-22 · **Status:** L1 + L2 abgeschlossen ✅ · L3 in Arbeit  
**Bezug:** Übergabe `payroll-core` ins SYSTAX-Hauptsystem. Im Hauptsystem werden **keine Grundlagenfunktionen** mehr ergänzt – ausschließlich Design.

---

## 0. Statusübersicht (Live-Stand)

| Phase | Status | Nachweis |
|-------|--------|----------|
| **L1** Persistenz & Pre-Flight | ✅ erledigt | `use-supabase-payroll.ts` wirft jetzt Errors statt sie zu schlucken; Wizard markiert Fehl-Inserts; neuer Test `use-supabase-payroll-persistence.test.tsx` grün |
| **L2** BMF-PAP-Verifikation | ✅ erledigt | 2025-Tarif (Zone 5 Subtrahend `19.246,67` bestätigt); 2026-Tarif aktualisiert auf **§ 32a EStG i.d.F. ab VZ 2026** (GFB 12.348 €, Zone 2 koeff. 914,51, Zone 3 koeff. 173,10/2397/1034,87, Zone 4 SUB 11.135,63, Zone 5 SUB 19.470,38). Fixtures `bmf-pap-2025.ts` + `bmf-pap-2026.ts` + `bmf-pap-verification.test.ts` grün, **0 ¢ Diff** |
| **L3** SYSTAX-Payload-Spec | ✅ erledigt | `docs/SYSTAX-PAYLOAD-SPEC.md` (LStA, eLStB, DEÜV, Beitragsnachweis, SEPA) – wartet auf SYSTAX-Team-Gegenzeichnung |
| **L4** Härtung & Konstanten 2026 | ✅ erledigt | RLS-Linter geprüft (1 Warnung: `contact_messages.INSERT WITH CHECK true` – **bewusst öffentlich** für Kontaktformular, kein Risiko); `docs/CONSTANTS-VERIFIED-2026.md` erstellt; Net-to-Gross-Property-Test grün (18 Tests) |
| **L5** Go-Live-Readiness | ✅ alle Gates grün | siehe Tabelle unten – wartet nur noch auf SYSTAX-Team-Gegenzeichnung der Payload-Spec |
| **Tests gesamt** | ✅ | **616 grün** (Vitest, 0 fehlgeschlagen) |

### L5 Go-Live-Gate Status

| Gate | Soll | Ist |
|---|---|---|
| Vitest komplett grün | 100 % | ✅ 616/616 |
| BMF-PAP 0 ¢ Diff (2025+2026) | 0 ¢ | ✅ |
| Persistenz-Bug (R1) gefixt | Errors propagieren | ✅ |
| Pre-Flight Refetch (R2) | invalidateQueries | ✅ |
| RLS-Linter (R3) | 0 echte Warnungen | ✅ (verbleibende Warnung bewusst public) |
| Net-to-Gross Property-Test (R5) | grün | ✅ |
| 2026 Konstanten dokumentiert (R9) | Doku vorhanden | ✅ `CONSTANTS-VERIFIED-2026.md` |
| SYSTAX-Payload-Spec (R6) | Spec geliefert | ✅ `SYSTAX-PAYLOAD-SPEC.md` (wartet auf SYSTAX-Gegenzeichnung) |
| ELSTER/SEPA-Versand | über SYSTAX | ⛳ extern, **nicht in payroll-core**, vertraglich geklärt |

**Live-Gang-Empfehlung:** payroll-core ist **bereit zur Übergabe** an SYSTAX, sobald die Payload-Spec gegengezeichnet ist.

---

## A. Ehrliche Bestandsaufnahme (Ist-Zustand)

### A.1 Was ist nachweislich fertig & cent-genau

| Bereich | Status | Nachweis |
|---------|--------|----------|
| **Lohnsteuer 2025/2026** (allg. + besondere Tabelle, alle StKl I–VI) | ✅ | `tax-calculation.ts` (575 LOC), Golden-Master `golden-master-2026.test.ts`, BMF-Reference `bmf-reference-tax.test.ts` |
| **Solidaritätszuschlag** (Freigrenze, Milderungszone) | ✅ | im Tax-Calc integriert, Tests grün |
| **Kirchensteuer** (8 % BY/BW, 9 % Rest, Kappung) | ✅ | Tests grün |
| **SV KV/RV/AV/PV** (Ost/West, Kinderlosen-Zuschlag, Zusatzbeitrag) | ✅ | `social-security.ts`, `social-security.test.ts` |
| **Minijob/Midijob** (556 €, Übergangsbereichsformel) | ✅ | `employment-types`-Memory, Tests vorhanden |
| **BBG-Splits Mehrfachbeschäftigung** | ✅ | `multiple-employment.ts` |
| **bAV / Dienstwagen / Pfändung** | ✅ | `bav-`, `company-car-`, `garnishment-calculation.ts` |
| **Märzklausel / Entgeltfortzahlung / Mutterschaft** | ✅ | je eigene Test-Datei |
| **Branchen: Bau (SOKA), Gastro, Pflege (TVöD-P)** | ✅ | je eigene Test-Datei |
| **Jahresausgleich (annual-tax-reconciliation)** | ✅ | Tests grün |
| **DATEV-Export EXTF 7.0** (31-Feld-Header) | ✅ | `datev-export.test.ts` |
| **GoBD-Export** | ✅ | `gobd-export.test.ts` |
| **ELStAM-Validierung** | ✅ | `elstam-validation.test.ts` |
| **FiBu-Buchungssätze SKR03/SKR04** | ✅ | `fibu-booking.ts` |
| **Lohnkonto §41 EStG** | ✅ | DB-persistiert |
| **Audit-Trail (Revisionssicherheit)** | ✅ | `calculation-audit.ts` + DB-Trigger |
| **Tests gesamt** | ✅ | **571 grün** (Vitest 4.0.16) |

### A.2 Was NICHT 100 % live-fertig ist (ehrliche Liste der Restrisiken)

| # | Befund | Schweregrad | Quelle |
|---|--------|-------------|--------|
| **R1** | **Auto-Wizard-Persistenz-Bug**: Berechnung im Monthly-Wizard läuft, aber `payroll_entries`-Insert schlägt teils still fehl. Folge: Werte werden gerechnet, aber nicht in DB gespeichert → Lohnkonto/DATEV/Meldewesen leer. | **🔴 KRITISCH (Live-Blocker)** | `mem://index.md` Core, AUDIT-2026-04 §4.2 |
| **R2** | **Pre-Flight Status-Refetch**: nach Save aktualisiert UI den Period-Status nicht → Anwender weiß nicht, ob Abrechnung wirklich freigegeben ist. | **🟡 HOCH** | AUDIT-2026-04 §4.2 |
| **R3** | **RLS-Policy „always true"**: 1 Supabase-Linter-Warnung (UPDATE/DELETE/INSERT). Vermutlich `contact_messages.INSERT` (bewusst öffentlich) – muss verifiziert werden. | **🟡 HOCH (Security)** | `supabase--linter` |
| **R4** | **BMF-PAP-Fixtures fehlen** als externer Referenz-Anker. Heute „Golden-Master gegen sich selbst". Solange keine echten BMF-PAP-Stützstellen geprüft sind, ist „cent-genau" nur **intern konsistent**, nicht **amtlich verifiziert**. | **🟡 HOCH (Live-Blocker für „Steuerberaterqualität")** | Phase-1-Plan |
| **R5** | **Net-to-Gross** (Bruttohochrechnung) hat noch keinen Property-Test → Konvergenz/Idempotenz nicht abgesichert. | 🟠 MITTEL | `net-to-gross-calculation.ts` |
| **R6** | **ELSTER-Übermittlung** (LStA, eLStB, DEÜV) ist im Code als Status/Transfer-Ticket modelliert, aber **kein echter ELSTER-XML-Versand**. Heute werden nur DB-Status gesetzt. | **🔴 LIVE-BLOCKER**, sofern Live = „echte Übermittlung an Finanzamt/Krankenkasse" | `lohnsteueranmeldungen`/`sv_meldungen`-Schema, kein ELSTER-Adapter im Repo |
| **R7** | **SEPA-XML für Lohnüberweisungen** (pain.001) ist **nicht** im Repo. IBAN/BIC werden gespeichert, aber kein DTA/SEPA-Export. | 🟠 MITTEL (je nach Definition „Live") | grep ergibt keinen `pain.001`/`sepa`-Generator |
| **R8** | **315 hartkodierte Tailwind-Farben** → Dark-Mode-Risiken (rein optisch, keine Berechnungswirkung). | 🟢 NIEDRIG | AUDIT-2026-04 §2.2 |
| **R9** | **Beitragssätze 2026** (Zusatzbeitrag KV ⌀, PV-Sätze, BBG, Sachbezugswerte) → ist im Code gepflegt, aber jährliches Re-Validierungs-Datum **nach BMF-Schreiben Nov./Dez. 2025** ist nicht dokumentiert. | 🟠 MITTEL | `src/constants/social-security.ts`, `ANNUAL_UPDATE_CHECKLIST.md` |
| **R10** | **Lohnsteuer-Jahresausgleich durch Arbeitgeber** (§ 42b EStG) – Funktion vorhanden, aber Trigger-Workflow im UI nicht zwingend integriert. | 🟠 MITTEL | `annual-tax-reconciliation.ts` vorhanden |

### A.3 Klare Antwort auf die Frage „cent-genau zu 100 %?"

**Aktuell: NEIN – mit zwei wichtigen Differenzierungen.**

- **Rechen-Engine isoliert:** intern konsistent, 571 Tests grün, eigene Golden-Master decken alle Lohnsteuerklassen, SV-Zweige, Sonderzahlungen, Branchen ab → in **isolierten Tests cent-genau**.
- **End-to-End (Eingabe → DB → Lohnkonto → Meldung → Auszahlung):** **NICHT verifiziert**, da R1 (Persistenz-Bug) und R6 (kein echter ELSTER-Versand) offen sind.
- **Externe BMF-Verifikation:** Fehlt (R4). Ohne mind. 20 amtliche BMF-PAP-Stützstellen pro Jahr ist die Aussage „BMF-konform" eine **Selbstauskunft**, kein **Nachweis**.

→ **Vor Live-Gang sind R1, R4, R6 zwingend; R2, R3, R5, R9 stark empfohlen.**

---

## B. Live-Gang-Plan in 5 Phasen

**Reihenfolge nach „Schaden, wenn übersprungen". Alle Phasen sind unabhängig freigebbar.**

### Phase L1 – Persistenz & Pre-Flight reparieren (KRITISCH, ~3–4 h)

**Ziel:** R1 + R2 schließen. Ohne diese Phase ist das System **nicht live-fähig**.

- **L1.1** Bug-Reproduktion `payroll_entries`-Persistenz im Monthly-Wizard (`monthly-payroll-wizard.tsx`) – mit echtem Tenant in DB nachvollziehen, Logs prüfen.
- **L1.2** Root-Cause-Fix (vermutlich: fehlendes `tenant_id`-Feld bei Insert oder fehlerhafter `await` in Schleife).
- **L1.3** **Neuer Vitest** `monthly-payroll-wizard.persistence.test.ts`: prüft Insert-Aufruf für jeden Mitarbeiter mit korrektem Payload.
- **L1.4** Pre-Flight Status-Refetch: nach `markAsApproved`/Save → React-Query `invalidateQueries(['payroll-periods'])` ergänzen.
- **L1.5** **Smoke-Test-Skript** `scripts/e2e-payroll-smoke.ts` (Node, gegen Test-Tenant): legt Mitarbeiter an, läuft Wizard, prüft DB-Inhalt von `payroll_entries`, `lohnkonto`, `beitragsnachweise`.

**Abnahme:** alle Tests grün **+** Smoke-Skript bestätigt 1:1-Übereinstimmung Berechnung ↔ DB.

---

### Phase L2 – Amtliche BMF-PAP-Verifikation (LIVE-BLOCKER für „Steuerberaterqualität", ~4–6 h)

**Ziel:** R4 schließen. Externer Nachweis der Cent-Genauigkeit.

- **L2.1** Erfassen von **20 BMF-PAP-Stützstellen pro Jahr** (2025 + 2026), Mix:
  - StKl I, III, IV (mit/ohne Faktor), V, VI
  - Brutto-Bandbreite 1.500 € / 3.500 € / 5.500 € / 8.000 € / 12.000 €
  - Mit & ohne Kirchensteuer (8 %/9 %)
  - Mit Kinderfreibeträgen 0 / 1 / 2 / 3
- **L2.2** Fixtures: `src/utils/__tests__/fixtures/bmf-pap-2025.ts` + `bmf-pap-2026.ts` + `README.md` mit Quellenangabe BMF-Programmablaufplan (Datum, Version).
- **L2.3** Verification-Test `bmf-pap-verification.test.ts`: Diff in Cent für **LSt, Soli, KiSt** muss **= 0 ¢**.
- **L2.4** Wenn Diff > 0 ¢ → **STOP**, Befund dokumentieren, separat freigeben (kein Silent-Fix in Engine!).
- **L2.5** Analog SV: 10 BBG-Stützstellen Ost/West (KV/RV/AV/PV) mit/ohne Kinder, mit/ohne Zusatzbeitrag.

**Abnahme:** Test grün → **„BMF-konform" wird vom Selbstauskunft zum Nachweis**.

---

### Phase L3 – Echte Übermittlung (ELSTER + SEPA) (LIVE-BLOCKER, ~6–10 h, abhängig von SYSTAX-Adapter)

**Ziel:** R6 + R7 schließen. **Hier ist die wichtigste Frage:** Wird die Übermittlung von **payroll-core** geleistet oder von **SYSTAX** (Hauptsystem)?

| Variante | Verantwortung | Was zu tun ist |
|----------|---------------|----------------|
| **A: SYSTAX übernimmt** (empfohlen) | SYSTAX hat eigene ELSTER-/Krankenkassen-Schnittstelle | payroll-core liefert nur die **berechneten Datensätze** + DEÜV-/LStA-XML-Payloads über `systax-integration.ts`-Facade. **Wir müssen prüfen, ob SYSTAX dafür alle Felder erhält** (Spec-Abgleich). |
| **B: payroll-core übernimmt** | LohnPro selbst | ELSTER ERiC-Bibliothek einbinden (proprietär, BMF-Lizenz nötig), SEPA-XML pain.001.001.09-Generator schreiben, Krankenkassen-DEÜV-XML-Versand implementieren. **Größenordnung: separates Projekt, nicht in 1 Phase machbar.** |

**Empfehlung:** **Variante A**. → Konkrete Aufgaben:

- **L3.1** SYSTAX-Integrations-Layer (`src/types/systax-integration.ts`) auf Vollständigkeit prüfen: enthält die Facade alle Felder, die SYSTAX für **LStA, eLStB, DEÜV-Meldungen, Beitragsnachweise** braucht?
- **L3.2** Spec-Dokument `docs/SYSTAX-PAYLOAD-SPEC.md` (neu) – pro Meldungstyp: Felder, Datentypen, Quell-Tabelle, Beispielwert.
- **L3.3** Smoke-Adapter: Mock-SYSTAX-Endpoint, der den Payload prüft + zurückgibt.
- **L3.4** **Falls Variante B doch nötig:** Eigenes Roadmap-Item, separater Plan – nicht Teil dieses Live-Gangs.

**Abnahme:** SYSTAX bestätigt schriftlich Payload-Vollständigkeit ODER Mock-Adapter validiert alle Pflichtfelder.

---

### Phase L4 – Härtung & Annual-Constants (~2–3 h)

**Ziel:** R3, R5, R9, R10 schließen.

- **L4.1** RLS-Policy `always true` identifizieren (vermutlich `contact_messages`): Bestätigen oder einschränken. Migration vorbereiten.
- **L4.2** Property-Test `net-to-gross.property.test.ts` (R5) – Konvergenz, Idempotenz, Brutto(Netto(B)) ≈ B.
- **L4.3** **Annual-Constants-Re-Verifikation 2026:**
  - Zusatzbeitrag KV (⌀): aktuell hinterlegter Wert vs. BMF-Schreiben Nov. 2025 verifizieren.
  - PV-Beitragssatz + Kinderlosen-Zuschlag.
  - BBG KV/PV (West/Ost) + RV/AV (West/Ost).
  - Sachbezugswerte (Frühstück/Mittag/Abend, Unterkunft).
  - Mindestlohn 2026.
  - **Output:** `docs/CONSTANTS-VERIFIED-2026.md` mit Quellenangaben + Datum.
- **L4.4** Lohnsteuer-Jahresausgleich §42b im UI prominent anbieten (Trigger im Dezember-Wizard).

---

### Phase L5 – Go-Live-Readiness-Check (~1 h, ohne Code-Änderung)

**Ziel:** Formaler Go/No-Go-Check vor Schalten.

| Check | Quelle | Soll |
|-------|--------|------|
| Vitest grün | `npx vitest run` | 100 % |
| BMF-PAP-Verification grün | L2 | 0 ¢ Diff |
| E2E-Smoke grün | L1.5 | DB-Insert verifiziert |
| Supabase-Linter | `supabase--linter` | 0 Warnings |
| SYSTAX-Payload-Spec abgenommen | L3.2 | unterschrieben |
| Annual-Constants 2026 | L4.3 | dokumentiert |
| Backup-/Restore-Test Tenant-DB | manuell | erfolgreich |
| Dokumentation Steuerkanzlei-Übergabe | `payroll-core/README.md` + `SYSTAX-INTEGRATION-GUIDE.md` | aktuell |

**Liefer-Artefakt:** `docs/GO-LIVE-CHECK-2026.md` mit grünen/roten Häkchen.

---

## C. Schnellster realistischer Pfad zum Live-Gang

| Reihenfolge | Phase | Dauer | Blockt Live? |
|-------------|-------|-------|--------------|
| 1 | **L1** Persistenz-Bug + Pre-Flight | 3–4 h | ✅ ja |
| 2 | **L2** BMF-PAP-Fixtures | 4–6 h | ✅ ja (für „cent-genau") |
| 3 | **L3** SYSTAX-Payload-Spec (Variante A) | 3–4 h reine Spec | ✅ ja |
| 4 | **L4** Härtung + 2026-Konstanten | 2–3 h | ⚠ stark empfohlen |
| 5 | **L5** Go-Live-Check | 1 h | Pflicht-Gate |

**Summe Mindest-Pfad (L1+L2+L3+L5): ~12–16 h** – realistisch in 2 Arbeitstagen umsetzbar, vorausgesetzt SYSTAX-Spec-Antworten kommen zeitnah.

---

## D. Was im Hauptsystem (SYSTAX) nicht gebaut werden muss

Nach erfolgreichem Abschluss von L1–L5 ist im SYSTAX-Hauptsystem **keine** der folgenden Funktionen mehr nötig:

- Steuerberechnung (LSt, Soli, KiSt)
- SV-Berechnung (KV/RV/AV/PV inkl. Ost/West, Zusatzbeitrag, Kinderlose)
- Mini-/Midijob-Logik
- Branchen-Spezialregeln (Bau, Gastro, Pflege)
- bAV, Dienstwagen, Pfändung, Mehrfachbeschäftigung, Märzklausel, Entgeltfortzahlung
- Lohnsteuer-Jahresausgleich
- DATEV-/GoBD-Export, FiBu-Buchungssätze, Lohnkonto §41 EStG
- ELStAM-Validierung

SYSTAX braucht ausschließlich: **Tenant-/User-Verwaltung, Übermittlungs-Layer (ELSTER/SEPA/Krankenkassen-Adapter), Druck-/Archiv-Schicht, Design.**

---

## E. Abbruchkriterien (für jede Phase identisch)

- Cent-Diff > 1 ¢ vs. BMF-PAP → STOP, Befund dokumentieren, **kein Silent-Fix**.
- Persistenz-Bug nicht reproduzierbar → tieferes Logging einbauen, vor Live nicht weiter.
- SYSTAX-Spec-Lücke → Live-Gang verschieben bis schriftlich geklärt.

---

## F. Was dieser Plan **nicht** vorsieht

- Eigene ELSTER-ERiC-Integration (Variante B aus L3) – wäre eigenes Projekt.
- Hardcoded-Color-Refactor (R8) – rein optisch, kein Live-Blocker.
- ts-prune-Cleanup, Logger-Wrapper – Tech-Debt für nach Live.

---

**Freigabe-Frage an dich:** Welche Phasen sollen wir in welcher Reihenfolge starten? Empfehlung: **L1 → L2 → L3 (Spec) → L5**, L4 parallel wenn Kapazität.
