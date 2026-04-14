

# Umfassender Systemcheck – LohnPro

---

## 1. Codequalität & Sauberkeit

**Gut:**
- Konsistente Verwendung von TypeScript, shadcn/ui und Tailwind
- Klare Trennung zwischen DB-Mapper-Funktionen und Hook-Logik (use-supabase-employees.ts, use-supabase-payroll.ts)
- Zentralisierte Formatierungs-Utilities (formatters.ts) und Tax-Params-Factory

**Probleme:**
- **Redundante Re-Exports**: `use-employee-storage.ts` und `use-payroll-storage.ts` sind jeweils nur 1-Zeilen-Re-Exports. Überflüssig, da die Supabase-Hooks auch direkt exportiert werden (Zeile 261 in use-supabase-employees.ts)
- **`any`-Typen**: `dbToPayrollEntry` verwendet `Map<string, any>` und `emp ?? {} as any` (Zeile 33/39 in use-supabase-payroll.ts); `onCalculateSalary: (data?: any)` in employee-dashboard.tsx
- **Unvollständige Implementierungen**: `updatePayrollEntry` tut nur `await fetchData()` (Zeile 233-236), Autolohn-Dashboard hat `// TODO`-Kommentare
- **navigate(-1 as any)** in Impressum/Datenschutz/AGB – Type-Hack statt `navigate(-1)`
- **Fehlende Kommentare** in vielen Komponenten (z. B. Landing.tsx 500+ Zeilen ohne JSDoc)

---

## 2. Architektur & Struktur

**Gut:**
- Saubere Trennung: pages → components → hooks → utils → types
- Multi-Tenant-Architektur mit RLS und Context-basiertem Tenant-Switching
- Error Boundary auf Top-Level

**Probleme:**
- **Employees-Seite als "God Page"**: `Employees.tsx` rendert 11 verschiedene Views (Zeiterfassung, Compliance, Reports, Authorities...) über einen lokalen State-Switch. Viele davon gehören in eigene Routen
- **Doppelte Datenladung**: `useSupabasePayroll` ruft intern `useSupabaseEmployees` auf → wenn beide Hooks in einer Komponente verwendet werden (z. B. MainDashboard), werden Employees doppelt geladen
- **Kein React Query/TanStack Query**: Trotz installierter Dependency werden alle Supabase-Queries manuell mit useState/useEffect verwaltet – kein Caching, kein Deduping, keine Background-Refetches
- **Inkonsistente Navigation**: Manche Views nutzen React Router (`/payroll`, `/time-tracking`), andere sind Sub-Views innerhalb einer Page (Employees-Seite hat Zeiterfassung als View-State)

---

## 3. Performance & Effizienz

**Probleme:**
- **Doppelte Employee-Fetches**: PayrollDashboard lädt Employees über `usePayrollStorage` UND `useEmployeeStorage` (Zeile 6-7 in payroll-dashboard.tsx) – 2 identische Supabase-Queries
- **employeeMap-Dependency**: `fetchData` in use-supabase-payroll.ts hängt von `employees.length` ab (Zeile 118), nicht von der Map selbst – Entries werden bei jeder Employee-Änderung komplett neu geladen
- **Kein Pagination**: Employees-Query hat kein Limit (lädt alle), Payroll-Entries begrenzt auf 500, aber ohne Pagination-UI
- **Landing Page**: 508 Zeilen in einer Datei, Testimonials-Daten sind inline statt in Konstanten extrahiert

---

## 4. Stabilität & Zuverlässigkeit

**Gut:**
- Error Boundary vorhanden
- Loading-States in allen Dashboards
- 354 Vitest-Tests in 11 Suites für Berechnungslogik

**Probleme:**
- **Keine Error-UI in Hooks**: Fehler werden in `error`-State gesetzt, aber nirgends in der UI angezeigt (kein Toast/Alert bei Ladefehler)
- **Race Conditions**: Auth-State wird doppelt initialisiert (Zeile 50-73 in auth-context.tsx: sowohl `onAuthStateChange` als auch `getSession` können überlappen)
- **Keine Retry-Logik** bei Netzwerkfehlern
- **Keine E2E-Tests** oder Integrationstests für Workflows

---

## 5. Sicherheit & Datenschutz

**Kritisch (Security Scan):**
- **contact_messages SELECT-Policy** erlaubt ALLEN authentifizierten Nutzern, alle Kontaktnachrichten (mit E-Mail/Namen) zu lesen → **Datenschutz-Verletzung**
- **contact_messages INSERT-Policy** mit `WITH CHECK (true)` → potentiell Spam-anfällig (kein Rate-Limiting)

**Weitere Punkte:**
- RLS-Policies sind sonst gut implementiert (Tenant-Isolation, Rollenprüfung)
- Keine Foreign Keys zwischen Tabellen → keine referentielle Integrität auf DB-Ebene
- Auth-Implementierung ist solide (Supabase Auth, kein clientseitiger Rollencheck)

---

## 6. Konsistenz & Wartbarkeit

**Probleme:**
- **Inkonsistente Layouts**: Legal-Seiten (Impressum, Datenschutz, AGB, Kontakt, Hilfe) haben KEIN MainLayout (eigener Header/Footer), App-Seiten nutzen MainLayout → verschiedene Headers/Footers
- **Inkonsistente Footer**: Landing-Footer vs. MainLayout-Footer haben verschiedene Link-Sets und Struktur
- **Gemischte Sprachen**: Deutsche UI-Texte, englische Variablen/Typen/Kommentare – das ist OK, aber nicht immer konsistent (z. B. `handleBack` vs. `handleBackToDashboard`)
- **Error-Handling**: Manche Hooks setzen `setError(msg)`, andere loggen mit `console.error` – kein einheitliches Pattern

---

## 7. Verweise & Ressourcen

- **Unused Import**: `useNavigate` in Payroll.tsx importiert, `navigate` in Zeile 3 deklariert, aber nur in 1 Callback verwendet
- **Unused Import**: `Baby`, `Settings` in employee-dashboard.tsx und payroll-dashboard.tsx importiert, möglicherweise nicht verwendet
- **placeholder.svg** in /public – unklar ob genutzt
- **Doppelte Toast-Hooks**: `src/hooks/use-toast.ts` und `src/components/ui/use-toast.ts`

---

## 8. Dokumentation & Verständlichkeit

**Gut:**
- README.md dokumentiert Architektur, DB-Schema, Testsuite
- ANNUAL_UPDATE_CHECKLIST.md für Jahreswechsel-Updates
- Memory-Einträge dokumentieren Architekturentscheidungen

**Fehlt:**
- API-Dokumentation für Hooks und Utilities
- Kommentare in komplexen Berechnungsfunktionen (tax-calculation.ts, payroll-calculator.ts)
- Onboarding-Guide für Entwickler

---

## 9. Benutzererfahrung & Design

**Probleme:**
- **Inkonsistenter Header**: Landing hat `sticky top-0 bg-card/80 backdrop-blur-lg`, MainLayout hat `sticky top-0 bg-card shadow-card` – unterschiedliche Optik
- **Legal-Seiten ohne einheitlichen Header/Footer**: Impressum, Datenschutz, AGB haben nur einen "Zurück"-Button, keinen Header mit Logo/Navigation
- **Mobile Navigation auf Landing**: Navbar-Buttons (Hilfe, Kontakt, Anmelden, Kostenlos starten) werden auf Mobile nicht in ein Hamburger-Menü zusammengefasst
- **Keine Breadcrumbs** in Sub-Views (z. B. Compliance über Employees erreichbar, aber kein Pfad-Indikator)

---

## 10. Funktionsübersicht

### Kernfunktionen

| Funktion | Beschreibung |
|---|---|
| **Mitarbeiterverwaltung** | CRUD-Operationen, 4-Schritt-Wizard, Suche/Filter, Stammdatenpflege, Personalnummern-Generierung |
| **Lohnabrechnung** | Perioden-Management, Brutto-Netto-Berechnung, Steuer & SV, DATEV-Export, Lohnkonto |
| **Zeiterfassung** | Arbeitszeiterfassung, Abwesenheiten, Kalender, Massenerfassung, Arbeitszeitkonten |
| **Meldewesen** | SV-Meldungen, Beitragsnachweise, Lohnsteuerbescheinigungen, Status-Tracking |
| **Gehaltsrechner** | Brutto-Netto, Netto-Brutto, Gehaltsvergleich, Gehaltskurve, Optimierungstipps |
| **Sonderzahlungen** | Weihnachtsgeld, Urlaubsgeld, Prämien, Abfindungen mit Fünftelregelung |
| **Branchenmodule** | Bau (SOKA-BAU), Gastronomie (Sachbezüge), Pflege (SFN-Zuschläge) |
| **Payroll Guardian** | Anomalie-Erkennung, historische Analyse, Abweichungswarnungen |
| **Autolohn** | Automatisierte Abrechnungsläufe (TODO: Speicherung unvollständig) |
| **Compliance** | Mindestlohn-Prüfung, Fristenüberwachung, Alerts, DSGVO-Management |
| **Multi-Tenant** | Mandantenverwaltung, Tenant-Switching, rollenbasierte Zugriffskontrolle |
| **Reports** | Lohnkostenübersicht, Krankmeldungen, Steuer/SV, Audit-Report, MA-Statistiken |
| **Einstellungen** | Firmenstammdaten, Benutzerverwaltung, DSGVO-Requests |
| **Auth** | Login/Signup, Passwort-Reset, automatische Rollenzuweisung |
| **SEO** | Meta-Tags, Open Graph, JSON-LD Schema, Sitemap, Robots.txt |
| **Legal** | Impressum, Datenschutz, AGB, Kontaktformular, Hilfe-Center |

### Verknüpfungen

```text
Auth ──► Tenant-Context ──► Alle geschützten Seiten
                │
                ▼
         Employee-Hook ◄──── Employee-Dashboard
                │                    │
                ▼                    ▼
         Payroll-Hook ◄──── Payroll-Dashboard
                │                    │
                ├──► DATEV-Export     ├──► Lohnkonto
                ├──► Tax-Calculation ├──► Journal
                └──► SV-Calculation  └──► Guardian
                                         │
         Time-Tracking-Hook ◄───── TimeTracking-Dashboard
                │
                └──► Time-Payroll-Integration ──► Payroll

         Meldewesen ──► SV-Meldungen (braucht Employees)
                    ──► Beitragsnachweise (braucht Employees)
                    ──► Lohnsteuerbescheinigungen (braucht Employees)

         Compliance-Hook ──► Compliance-Dashboard (über Employees-Page)
         Special-Payments ──► Payroll-Page Sub-View

         Landing ──► Auth ──► Dashboard ──► {Employees, Payroll, TimeTracking, Meldewesen, Autolohn, Settings}
         Footer ──► {Impressum, Datenschutz, AGB, Kontakt, Hilfe}
```

**Fehlende/unvollständige Verknüpfungen:**
- Autolohn-Dashboard: Speicherung nicht implementiert (TODO)
- Time-Payroll-Sync existiert als Komponente, aber die Integration überträgt keine echten Daten
- Authorities-Integration (ELSTER etc.) ist nur UI-Mockup ohne echte API-Anbindung
- Automation-Dashboard ist funktional isoliert (kein echter Cron/Scheduler)
- Kontaktformular-Nachrichten: kein Admin-UI zum Lesen/Beantworten

---

## 11. Design-Konsistenz

| Bereich | Status | Problem |
|---|---|---|
| Landing Header | ⚠️ | Andere Styles als MainLayout-Header, kein Mobile-Menü |
| Landing Footer | ⚠️ | Andere Struktur als MainLayout-Footer |
| Legal-Seiten | ❌ | Kein einheitlicher Header/Footer, nur "Zurück"-Button |
| App-Seiten | ✅ | Konsistent via MainLayout |
| Dark Mode | ✅ | Durchgängig unterstützt |
| Responsivität | ⚠️ | Landing-Navbar bricht auf Mobile, Legal-Seiten haben keinen Nav-Zugang |

---

## Kritischste Punkte (Zusammenfassung)

1. **SICHERHEIT**: contact_messages-Tabelle exponiert personenbezogene Daten an alle authentifizierten Nutzer
2. **ARCHITEKTUR**: Employees-Page ist ein monolithischer View-Switch mit 11 Sub-Views statt echtem Routing
3. **PERFORMANCE**: Doppelte Employee-Fetches durch verschachtelte Hook-Aufrufe
4. **DESIGN**: Legal-Seiten ohne einheitliches Layout/Navigation, Landing ohne Mobile-Menü
5. **UNVOLLSTÄNDIG**: Autolohn-Speicherung, Time-Payroll-Integration, Authorities-Integration sind Stubs

---

## Verbesserungsvorschläge nach Priorität

### Hoch
1. RLS-Policy für `contact_messages` einschränken (nur Admins dürfen lesen)
2. Landing-Navbar Mobile-Menü implementieren
3. Legal-Seiten in einheitliches Layout einbetten (Header + Footer)
4. Doppelte Employee-Fetches eliminieren (Shared Context oder React Query)
5. `any`-Typen durch korrekte Typen ersetzen

### Mittel
6. Employees-Page Sub-Views in eigene Routes migrieren
7. React Query/TanStack Query für Supabase-Queries nutzen (Caching, Dedup)
8. Error-States in UI anzeigen (Toast bei Ladefehler)
9. Auth-Context Race Condition beheben
10. Foreign Keys in der Datenbank hinzufügen

### Niedrig
11. Redundante Re-Export-Dateien entfernen
12. Unused Imports bereinigen
13. Doppelten Toast-Hook konsolidieren
14. API/Hook-Dokumentation ergänzen
15. `navigate(-1 as any)` Type-Hack fixen

---

## Umsetzungsplan

### Phase 1: Sicherheit & Kritische Fixes (sofort)
- contact_messages RLS-Policy korrigieren
- `any`-Typen in Hooks durch korrekte Typen ersetzen
- Auth-Context Race Condition fixen

### Phase 2: Design-Konsistenz (1-2 Tage)
- Legal-Seiten (Impressum, Datenschutz, AGB, Kontakt, Hilfe) in ein einheitliches Layout mit Header/Footer einbetten
- Landing-Navbar: Mobile-Hamburger-Menü hinzufügen
- Footer-Struktur zwischen Landing und MainLayout angleichen

### Phase 3: Architektur-Refactoring (2-3 Tage)
- Employees-Page Sub-Views in eigene Routes migrieren (/compliance, /reports, /authorities etc.)
- Doppelte Employee-Fetches eliminieren (Shared Employee-Context oder React Query Migration)
- Error-States mit User-Feedback (Toast/Alert) in allen Hooks

### Phase 4: Cleanup & Wartbarkeit (1 Tag)
- Unused Imports, redundante Re-Exports, doppelte Toast-Hooks bereinigen
- `navigate(-1 as any)` Hacks fixen
- Autolohn-TODO und Stub-Funktionen dokumentieren oder entfernen
- Foreign Keys per Migration hinzufügen

### Phase 5: Erweiterungen (optional)
- React Query Migration für alle Supabase-Queries
- Admin-UI für Kontaktnachrichten
- Breadcrumb-Navigation in Sub-Views
- Pagination für Employees und Payroll-Entries

