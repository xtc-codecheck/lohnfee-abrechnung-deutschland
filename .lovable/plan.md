
# Roadmap: Vollständigkeit Richtung DATEV/Lexware

Ziel: Die im letzten Assessment identifizierten Lücken systematisch in 4 Phasen schließen, geordnet nach Rechtspflicht (Echtbetriebsrelevanz) → Produktivitätsnutzen → Zertifizierungs-/Integrationsarbeit.

## Phase 1 – Pflicht-Meldungen (Compliance kritisch)

Lücken, die für legalen Echtbetrieb zwingend sind, aber rein intern lösbar (ohne externe Zertifizierung).

1. **AAG U1/U2 – Erstattungsanträge nach AAG**
   - Neues Modul `src/utils/aag-calculation.ts` (U1 = Krankheit, U2 = Mutterschaft).
   - Erstattungssätze pro Krankenkasse (Stammdaten-Tabelle `kk_erstattungssaetze`).
   - UI: `src/components/meldewesen/aag-page.tsx` mit Antragsliste, Status, PDF/XML-Export.
   - DB: Tabelle `aag_antraege` (tenant_id, employee_id, periode, typ, brutto, erstattung, status).

2. **Sofortmeldung § 28a SGB IV** (Bau, Gastro, Gebäudereinigung, Spedition, Schausteller, Fleisch, Forst, Messebau)
   - Trigger bei Neuanlage Mitarbeiter wenn Branche in Liste.
   - DEÜV-Datensatz `DSME` Abgabegrund `20`.
   - UI-Hinweis "Sofortmeldung erforderlich" + One-Click-Export.

3. **UV-Jahresmeldung / Berufsgenossenschaft (Lohnnachweis digital)**
   - Stammdaten Mitarbeiter: `bg_mitgliedsnummer`, `gefahrtarifstelle`.
   - Jahreslauf `src/utils/uv-jahresmeldung.ts` aggregiert Bruttos je Gefahrtarifstelle.
   - Export: XML-Lohnnachweis (Format DSLN).
   - UI: `src/components/meldewesen/uv-jahresmeldung-page.tsx`.

4. **Bescheinigungswesen EEL & BEA**
   - **EEL** (Entgeltersatzleistungen, §§107 SGB IV): Krankengeld, Mutterschaft, Kinderkrankengeld, Verletztengeld.
   - **BEA** (Arbeitslosengeld-Bescheinigung).
   - Generator-Modul `src/utils/bescheinigungen.ts` mit XML/PDF-Output.
   - UI in Meldewesen: neuer Tab "Bescheinigungen".

## Phase 2 – Datenpflege & Aktualität

5. **Pfändungstabelle automatische Jahrespflege**
   - Konstanten in `src/constants/pfaendung-tabelle-2025.ts`, `…-2026.ts`.
   - Loader `getPfaendungstabelle(year)` analog zu Tax-Params.
   - Jahres-Update-Checkliste in `src/constants/ANNUAL_UPDATE_CHECKLIST.md` ergänzen.
   - Edge Function (optional) `bmf-pfaendung-check` zur Validierung.

6. **Reisekosten als Vollmodul**
   - Bestehenden Tab `travel-expenses-tab.tsx` ablösen durch eigenständiges Modul.
   - Funktionen: Verpflegungspauschalen (DE/Ausland, BMF-Sätze), Übernachtung (Beleg/Pauschale), km-Pauschale (0,30 €/0,38 €), Auslandstagegelder.
   - DB: `travel_trips`, `travel_legs`, `travel_receipts` (mit tenant_id, RLS).
   - Verknüpfung an Lohnabrechnung (lohnsteuerfrei vs. pflichtig automatisch).
   - Belegupload via Storage, Genehmigungsworkflow (Einreichung → Vorgesetzter → Lohn).

## Phase 3 – Workflow & Mandantenfähigkeit

7. **Steuerberater-Mandanten-Workflow** (DATEV-Unternehmen-Online-Style)
   - Rolle `steuerberater` (cross-tenant Lesezugriff über `mandant_zuordnung`).
   - Freigabe-Workflow: Mandant erstellt Lauf → "Zur Freigabe" → StB prüft → "Freigegeben" → Versand.
   - Kommunikationsmodul: Nachrichten/Rückfragen pro Lauf (`payroll_run_messages`).
   - Dokumentenaustausch: Mandant lädt Belege hoch, StB sieht im Postkorb.

8. **DEÜV-Rückmeldungsverarbeitung**
   - Importer `src/utils/deuev-rueckmeldung-import.ts` für Krankenkassen-Antworten (XML).
   - Status-Update der ursprünglichen Meldungen (akzeptiert / abgewiesen mit Fehlercode).
   - UI-Inbox in SV-Meldungen-Seite.

9. **Pensionskassen-/ZVK-Meldungen außerhalb SOKA-BAU**
   - Generisches ZVK-Meldewesen-Modul (Kassen-Stammdaten, Beitragsmeldung, Jahresmeldung).
   - Adapter-Pattern, damit weitere Kassen (z. B. ZVK Gerüstbau, Maler-/Lackierer-ZVK) konfigurierbar sind.

## Phase 4 – Externe Zertifizierung & Übermittlung

Erfordert Drittanbieter, juristische Schritte, ggf. Kosten – daher zuletzt.

10. **ITSG-/GKV-Zertifizierung (systemuntersucht, "GKV-Zulassung")**
    - Vorbereitung: Prüfprotokoll der ITSG durchlaufen (Testfälle DEÜV/BNW/EEL).
    - Modul `src/payroll-core/certification/` mit ITSG-Testdatensätzen (Golden Master).
    - Antragsprozess + jährliche Re-Zertifizierung dokumentieren.

11. **dakota.le / sv.net-Integration**
    - Adapter-Service als Edge Function `sv-net-submit` (Payload-Build, Quittungsabholung).
    - Alternative: dakota.le-API (kostenpflichtige Lib) hinter Interface `ISvSubmissionProvider`.
    - Stub bleibt für Standalone, echter Provider hinter Feature-Flag `submission.svnet`.

12. **ELSTER ERiC-Anbindung** (war im Assessment als "nur Facade" markiert)
    - ERiC-Bibliothek nur serverseitig nutzbar → Edge Function/eigener Submission-Service.
    - Interface bereits vorhanden (`SystaxIntegrationStub`) – produktive Implementierung ergänzen.

## Vorschlag zur Priorisierung

| Phase | Aufwand grob | Empfehlung |
|---|---|---|
| 1 (AAG, Sofortmeldung, UV, EEL/BEA) | 3-5 Sprints | **Jetzt starten** – Pflicht für Echtbetrieb |
| 2 (Pfändung, Reisekosten) | 2-3 Sprints | Direkt danach – hoher Nutzerwert |
| 3 (StB-Workflow, DEÜV-Rückmeldung, ZVK) | 4-6 Sprints | Mittelfristig |
| 4 (ITSG, sv.net, ERiC) | 6-12 Monate, juristisch | Langfristig, parallel vorbereiten |

## Technische Querschnittsthemen

- **DB**: alle neuen Tabellen mit `tenant_id` + RLS, Audit-Trigger.
- **Konstanten**: jährliche Werte (Pfändung, BG-Gefahrtarif, Verpflegungspauschalen) zentral in `src/constants/` mit Year-Loader.
- **Tests**: Golden-Master-Tests für jedes neue Meldungs-XML.
- **Feature-Flags**: neue Flags `meldung.aag`, `meldung.sofortmeldung`, `meldung.uv`, `bescheinigung.eel`, `bescheinigung.bea`, `travel.full`, `workflow.steuerberater`, `submission.svnet`, `submission.eric`.
- **Security-Memory**: bei Workflow-Rollen (Steuerberater) und Cross-Tenant-Zugriff aktualisieren.

## Empfehlung als nächster Schritt

Ich schlage vor, **Phase 1 zu starten und dort mit AAG U1/U2** zu beginnen (kleinster Scope, aber sofort spürbarer Compliance-Gewinn). Bestätige bitte, ob ich (a) Phase 1 komplett detailliert ausarbeiten soll, oder (b) direkt mit AAG U1/U2 als erstem Implementierungs-Plan loslege.
