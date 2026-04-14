

# Umfassender Systemcheck – LohnPro

---

## 1. Codequalität & Sauberkeit

**Doppelter Code:**
- `calculateAge()` existiert doppelt: in `tax-params-factory.ts` (exportiert) und `payroll-calculator.ts` (private Kopie). Die Variante in `payroll-calculator.ts` sollte durch einen Import der Factory-Version ersetzt werden.
- `EAST_GERMAN_STATES` ist in `tax-params-factory.ts` definiert und wird in `payroll-calculator.ts` als inline-Array wiederholt (Zeile 220).
- Die Hook-Alias-Dateien (`use-employee-storage.ts`, `use-payroll-storage.ts`) sind korrekt als Single-Line-Re-Exports implementiert – sauber.

**Veralteter Code:**
- `GERMAN_HOLIDAYS_2024` in `src/types/payroll.ts` – hartkodierte Feiertage für 2024, aber das System arbeitet mit 2025-Konstanten. Sollte durch eine dynamische Feiertags-Berechnung oder 2025/2026 ersetzt werden.
- Landing-Page sagt "Steuer- und SV-Sätze für 2026" – aber alle Berechnungslogik nutzt 2025-Konstanten. Inkonsistente Jahreszahl.

**Stil/Konventionen:**
- Einheitlich TypeScript, deutsche Kommentierung, konsistente Verwendung von Tailwind. Gut.
- `social-security.ts` ist ~7.900 Zeilen lang (hauptsächlich Lohnsteuertabelle). Funktional korrekt, aber sehr groß. Könnte in eine separate JSON-Datei extrahiert werden.

---

## 2. Architektur & Struktur

**Positiv:**
- Saubere Trennung: `types/` → `utils/` → `hooks/` → `contexts/` → `components/` → `pages/`
- Zentraler Berechnungs-Service (`payroll-calculator.ts`) mit Audit-Trail
- Tax-Params-Factory eliminiert Duplikation bei Steuerparameter-Erstellung
- Employee Context verhindert doppelte Queries
- React Query Migration sauber umgesetzt

**Verbesserungsbedarf:**
- Payroll-Dashboard (`payroll-dashboard.tsx`, 550 Zeilen) verwaltet 8 Sub-Views via `currentView`-State. Sollte auf Route-basierte Navigation umgestellt werden oder zumindest aufgeteilt werden.
- Employee-Dashboard ähnlich: 358 Zeilen mit inline Sub-View-Management.
- Die `Payroll`-Page und `Meldewesen`-Page nutzen unterschiedliche State-Management-Patterns für Sub-Views (mal `activeView`, mal `currentView`).

---

## 3. Performance & Effizienz

- `staleTime: 30_000` bei Employee-Queries – guter Wert für diese Use-Case.
- `employeeMap` in `useSupabasePayroll` wird via `useMemo` gecacht – korrekt.
- 90-Tage-Fenster für Zeiterfassung und 500-Einträge-Limit für Payroll – dokumentiert und umgesetzt.
- `WAGE_TAX_TABLE_2025` (7.000+ Zeilen) wird bei jedem Import geladen. Für ein Lohnabrechnungssystem akzeptabel, aber bei Bundle-Optimierung könnte Lazy Loading helfen.

---

## 4. Stabilität & Zuverlässigkeit

**Tests:**
- 354 Vitest-Tests in 11 Suites vorhanden (Golden-Master, Property-Based, Edge-Cases)
- Branchenmodule (Bau, Gastro, Pflege) gut abgedeckt
- **Fehlend:** Keine Tests für Hooks (`use-supabase-employees`, `use-supabase-payroll`), keine Integrationstests für den DATEV-Export, keine E2E-Tests

**Fehlerbehandlung:**
- Error Boundary auf App-Ebene vorhanden
- `validateInput()` im Payroll-Calculator mit klaren Fehlermeldungen
- Catch-Blöcke in Mutations sind leer (`// error handled by mutation`) – Fehler werden zwar von React Query erfasst, aber dem User nicht angezeigt.

---

## 5. Sicherheit & Datenschutz

**Positiv:**
- RLS auf allen 18 Tabellen aktiv
- Tenant-Isolation via `is_tenant_member()` und `has_role_in_tenant()`
- Audit-Log ist manipulationssicher (nur INSERT via Trigger, Client blockiert)
- Kein `localStorage` für Auth-State (nur für Theme-Toggle)

**Offene Probleme (aus Security-Scan):**
- `contact_messages` SELECT-Policy erlaubt jedem Admin aller Tenants Zugriff (kein `tenant_id`-Scope)
- `contact_messages` hat keine UPDATE-Policy → Status kann nicht auf "gelesen" gesetzt werden
- `tenant_members` INSERT-Policy hat eine Bootstrapping-Schwäche: Neue User ohne Tenant können keinen erstellen (gelöst durch `assign_default_role` Trigger, aber RLS-technisch kritisch)

---

## 6. Konsistenz & Wartbarkeit

**Inkonsistenzen:**
- Jahreszahl: Landing/SEO sagt "2026", Berechnungslogik nutzt "2025"
- `taxClass` ist in Employee-Type `TaxClass` (string: 'I'-'VI'), aber in `calculateCompleteTax` wird `string` erwartet und via `parseInt()` konvertiert. Fragile Konvertierung.
- DB-Mapper (`dbToEmployee`) setzt `address.state` auf leeren String → Ost/West-Erkennung funktioniert nie korrekt basierend auf DB-Daten, da `state` nicht in der DB gespeichert wird.
- `health_insurance_number` in DB existiert, wird aber im Mapper ignoriert.

---

## 7. Verweise & Ressourcen

- Keine toten Links im Routing gefunden
- `public/placeholder.svg` – unklar ob noch benötigt
- Alle Imports auflösbar (TypeScript-Build ohne Fehler bestätigt)

---

## 8. Dokumentation

- README.md dokumentiert Architektur und Testsuite
- `ANNUAL_UPDATE_CHECKLIST.md` für Jahreswechsel vorhanden
- Steuerlogik gut kommentiert mit Paragraphen-Referenzen (§ 32a EStG)
- API-Dokumentation fehlt (DATEV-Export-Schema, Berechnungsformeln)

---

## 9. UX / Design

**Positiv:**
- Konsistenter Header/Footer via `MainLayout`
- Dark Mode durchgängig implementiert
- Mobile Hamburger-Menü vorhanden
- Breadcrumb-Navigation in Sub-Views

**Verbesserungsbedarf:**
- Footer wiederholt die gesamte Haupt-Navigation → redundant auf kleinen Bildschirmen
- Landing-Page hat eigenes Layout ohne MainLayout → Design-Bruch (kein Footer mit Impressum/AGB Links für unangemeldete User, aber Links sind vorhanden in eigenem Footer)
- Kein Skip-to-Content Link für Barrierefreiheit
- Keine `aria-label` auf den meisten Navigations-Buttons

---

## 10. Funktionsliste & Verknüpfungen

### Alle Systemfunktionen

**1. Authentifizierung & Mandantenverwaltung**
- Email/Passwort Login mit Auto-Confirm
- Rollenbasiertes System (admin, sachbearbeiter, leserecht)
- Multi-Tenancy mit automatischer Tenant-Erstellung
- Tenant-Switcher im Header
- Passwort-Reset-Flow

**2. Dashboard**
- KPI-Übersicht (Mitarbeiter, Durchschnittsgehalt, Personalkosten)
- Quick-Actions zu allen Modulen
- Echtdaten aus Payroll-Entries und Employees
- Loading-States mit Spinner
- Responsive Grid-Layout

**3. Mitarbeiterverwaltung**
- 4-Schritt-Wizard (Persönlich → Beschäftigung → Gehalt → Benefits)
- Suche und Filterung
- Bearbeiten und Löschen mit Bestätigungsdialog
- Personalakte mit allen Stammdaten
- Automatische Personalnummern-Generierung (ab 1001)

**4. Lohnabrechnung**
- Abrechnungszeiträume erstellen/verwalten
- Steuerberechnung (Allgemeine + Besondere Lohnsteuertabelle)
- SV-Berechnung mit BBG-Kappung
- Minijob/Midijob-Sonderberechlung mit Gleitzonenformel
- Manuelle Lohnerfassung

**5. Gehaltsrechner (Ultimate)**
- Brutto-Netto-Berechnung
- Dienstwagen-Konfigurator (1%/0,5%/0,25%/Fahrtenbuch)
- bAV-Optimierer mit Rentenprognose
- PKV vs. GKV Vergleich
- Baulohn (SOKA-BAU), Gastronomie, Pflege-Module
- Gehalts-Benchmarking

**6. Zeiterfassung**
- Tageseinträge mit Start/Ende/Pause
- Bulk-Erfassung
- Abwesenheitstypen (Urlaub, Krank, Feiertag)
- Integration in Lohnabrechnung
- 90-Tage-Fenster für Performance

**7. Meldewesen (DEÜV)**
- SV-Meldungen mit Meldegrund und Zeitraum
- Beitragsnachweise (monatlich, nach KK gruppiert)
- Lohnsteuerbescheinigungen (eLStB)
- Duplikat-Vermeidung via Unique Constraints
- Storno-Funktion

**8. Compliance & DSGVO**
- Compliance-Alerts mit Severity-Levels
- DSGVO-Verwaltung (Auskunftsansprüche, Löschanträge)
- Aufbewahrungsfristen-Management
- Automatische Prüfungen

**9. DATEV-Export**
- SKR03 und SKR04 Kontenrahmen
- Vollständige Buchungssätze (Brutto → Netto → Steuern → SV)
- Summen-Buchungen für Sammelüberweisungen
- DATEV ASCII-Format Version 7.0

**10. Reports**
- Personalkostenübersicht
- Krankheits-/Urlaubsstatistik
- Steuer- und SV-Report
- Audit-Report
- Mitarbeiterstatistik
- Export-Manager

**11. Payroll Guardian (Anomalie-Erkennung)**
- Gehaltsabweichungen erkennen
- Historienvergleich
- Auflösungs-Workflow

**12. Sonderzahlungen**
- Krankengeld-Berechnung
- Mutterschutz
- Kurzarbeit
- Verwaltung mit Status-Tracking

**13. Autolohn (Automatisierung)**
- Regelbasierte Lohnläufe
- E-Mail-Benachrichtigungen (geplant)
- Zeitplan-Management

**14. Behörden-Integration**
- ELSTER-Anbindung (Oberfläche, keine echte API)
- SV-Meldestelle
- Finanzamt-Kommunikation

**15. Admin-Bereich**
- Benutzer- und Rollenverwaltung
- Firmeneinstellungen
- Kontaktnachrichten (Admin-only)
- DSGVO-Management

### Verknüpfungen zwischen Modulen

```text
Employee ──→ Payroll (Gehaltsdaten → Brutto-Netto)
Employee ──→ TimeTracking (Zuordnung Zeiteinträge)
Employee ──→ Compliance (Vertragsprüfungen)
Employee ──→ Meldewesen (SV-Meldungen, eLStB)
Employee ──→ SpecialPayments (Krankengeld, Mutterschutz)
Employee ──→ Reports (Personalkostenberichte)

TimeTracking ──→ Payroll (via TimePayrollSync)
    Arbeitsstunden → Zuschlagsberechnung → Gesamtbrutto

Payroll ──→ DATEV (Buchungssätze generieren)
Payroll ──→ Meldewesen (Beitragsnachweise aus Abrechnungsdaten)
Payroll ──→ Reports (Lohnjournal, Kostenübersicht)
Payroll ──→ PayrollGuardian (Anomalie-Erkennung)
Payroll ──→ Lohnkonto (§41 EStG kumulierte Aufzeichnung)

TaxCalculation ──→ PayrollCalculator (via buildTaxParamsFromEmployee)
SocialSecurity ──→ TaxCalculation (BBG, Beitragssätze)
BesondereLSt ──→ TaxCalculation (PKV/Beamte-Sonderfall)

Auth ──→ Tenant ──→ alle Module (Datenisolation)
Roles ──→ RLS (Zugriffssteuerung auf DB-Ebene)
```

### Fehlende/Unvollständige Verknüpfungen

1. **Employee → DB: `state`-Feld fehlt** → Ost/West-Erkennung basierend auf DB-Daten funktioniert nicht, da `state` nicht in der `employees`-Tabelle gespeichert wird. Die Steuerberechnung fällt immer auf "West" zurück.
2. **Payroll → eLStB**: Die Lohnsteuerbescheinigung wird separat verwaltet, aber nicht automatisch aus Payroll-Entries befüllt. Die kumulierten Werte (Zeile 3-26) müssen manuell eingegeben werden.
3. **Autolohn**: Die Automatisierungs-Oberfläche existiert, speichert Einstellungen aber nur als TODO-Kommentar. Keine Persistenz.
4. **DATEV → FiBu/Bilanz**: Der DATEV-Export generiert Lohnbuchungen korrekt, aber es gibt **keine FiBu-Module** im System. Der Pfad Lohnbuchung → Hauptbuch → Bilanz (HB/StB) → EÜR → Steuererklärungen (ESt, GewSt, KSt, USt) existiert **nicht**. LohnPro ist ein reines Lohnabrechnungssystem – die Finanzbuchhaltung und Steuererklärungen sind **nicht implementiert** und gehören in ein separates System (DATEV, Lexware, etc.).
5. **Contact Messages**: Kein UPDATE-RLS → Status "gelesen"/"beantwortet" kann nicht gespeichert werden.

---

## 11. Design-Konsistenz

- **MainLayout**: Header mit Navigation, Logo, Tenant-Switcher, Dark Mode, User-Info – konsistent über alle geschützten Routen.
- **Landing-Page**: Eigenes Layout mit separatem Header/Footer. Funktioniert, aber der Footer-Stil unterscheidet sich leicht.
- **Legal-Layout**: Eigenes Layout für Impressum/AGB/Datenschutz mit Back-Button – konsistent untereinander.
- **Responsive**: Mobile Navigation funktioniert. Tabellen in Reports könnten auf kleinen Bildschirmen abgeschnitten werden (keine horizontale Scroll-Lösung sichtbar).

---

## Steuerlogik & Berechnungsschema – Bewertung

### Was implementiert ist:

```text
Bruttolohn
  ├── Lohnsteuer (Allgemeine Tabelle 2025, alle 6 Steuerklassen)
  ├── Besondere Lohnsteuertabelle (Beamte/PKV)
  ├── Solidaritätszuschlag (5,5%, Freigrenze €19.950)
  ├── Kirchensteuer (8%/9% je Bundesland)
  ├── Rentenversicherung (9,3% AN, BBG West €90.600)
  ├── Krankenversicherung (7,3% + Zusatzbeitrag/2)
  ├── Arbeitslosenversicherung (1,3%)
  ├── Pflegeversicherung (1,7%/2,4% kinderlos)
  ├── Minijob-Sonderbehandlung (556€, 2% Pauschalsteuer)
  ├── Midijob-Gleitzone (556,01€-2.000€, Faktor 0,6683)
  ├── Zuschläge (Überstunden 25%, Nacht 25%, Sonntag 50%, Feiertag 100%)
  └── Netto-Brutto-Umkehr (binäre Suche)
```

### Was NICHT implementiert ist (und auch nicht der Scope dieses Systems ist):

- **Finanzbuchhaltung (FiBu)**: Keine Hauptbuch-Führung, keine Konten-Salden
- **Bilanz (HB/StB)**: Kein Jahresabschluss-Modul
- **EÜR**: Keine Einnahmen-Überschussrechnung
- **ESt-Erklärung**: Nicht im Scope (DATEV-Export dient als Schnittstelle)
- **GewSt/KSt/USt**: Nicht implementiert – irrelevant für Lohnabrechnungssoftware

**Bewertung**: LohnPro ist ein Lohnabrechnungssystem, kein FiBu-System. Der DATEV-Export stellt die korrekte Schnittstelle zur Finanzbuchhaltung dar. Die Buchungssätze (Soll/Haben) sind fachlich korrekt implementiert.

---

## Kritischste Punkte (Zusammenfassung)

| # | Problem | Priorität |
|---|---------|-----------|
| 1 | `state`-Feld fehlt in DB → Ost/West-Erkennung kaputt | **Hoch** |
| 2 | `contact_messages` ohne tenant_id-Scope und ohne UPDATE-Policy | **Hoch** |
| 3 | `calculateAge()` dupliziert in payroll-calculator | Mittel |
| 4 | GERMAN_HOLIDAYS_2024 veraltet | Mittel |
| 5 | Landing-Page sagt "2026", Logik ist 2025 | Mittel |
| 6 | Autolohn-Einstellungen werden nicht persistiert | Mittel |
| 7 | eLStB nicht automatisch aus Payroll-Entries befüllt | Mittel |
| 8 | Keine Tests für Hooks und DATEV-Export | Niedrig |
| 9 | Payroll-Dashboard zu groß (550 Zeilen) | Niedrig |
| 10 | Keine Accessibility-Attribute (aria-labels, skip-link) | Niedrig |

---

## Verbesserungsplan (Phasen)

### Phase 1: Kritische Korrekturen (Priorität Hoch)
1. `state`-Feld zur `employees`-Tabelle hinzufügen und im Mapper/Wizard integrieren
2. `contact_messages` RLS fixen: UPDATE-Policy + tenant_id-Scope
3. Jahreszahl-Konsistenz herstellen (2025 überall)

### Phase 2: Code-Bereinigung (Priorität Mittel)
4. `calculateAge()` deduplizieren → Import aus `tax-params-factory`
5. `GERMAN_HOLIDAYS_2024` durch dynamische Berechnung ersetzen
6. Autolohn-Einstellungen in Supabase persistieren
7. eLStB-Automatik: Kumulierte Werte aus Payroll-Entries berechnen

### Phase 3: Qualitätssicherung (Priorität Niedrig)
8. Hook-Tests für `useSupabaseEmployees` und `useSupabasePayroll`
9. DATEV-Export-Test (Buchungssatz-Validierung)
10. Payroll-Dashboard in kleinere Komponenten aufteilen

### Phase 4: UX & Accessibility
11. aria-labels und skip-to-content Link
12. Responsive Tabellen-Scrolling
13. Footer-Navigation vereinfachen

**Wichtig**: Alle Änderungen an Berechnungslogik, DATEV-Export und Steuerformeln sollten erst nach Prüfung gegen die Golden-Master-Testdaten erfolgen. Bestehende Tests MÜSSEN weiterhin bestanden werden.

