
# Umfassender Systemcheck: LohnPro

---

## 1. Codequalitaet & Sauberkeit

### Kritisch: localStorage-Altlasten (4 Hooks noch auf localStorage)
- `use-time-tracking.ts` – Zeiterfassungsdaten in localStorage
- `use-special-payments.ts` – Krankengeld, Mutterschutz, Kurzarbeit in localStorage
- `use-payroll-guardian.ts` – Anomalien, historische Daten, Config in localStorage
- `use-compliance.ts` – Alerts und Reports in localStorage

**Problem:** Mitarbeiter/Payroll wurden auf Supabase migriert, aber diese 4 Module nicht. Daten gehen bei Browser-Wechsel verloren und sind nicht mandantenfaehig.

### Doppelter Code
- `getStatusColor()` / `getStatusLabel()` ist in 4 Dateien identisch implementiert (payroll-dashboard, time-tracking-dashboard, employee-status-indicator, system-enhancement-proposal)
- AG-Kostenberechnung `grossSalary * 1.2` ist ein Hardcode-Schaetzwert, dupliziert in main-dashboard.tsx und employee-dashboard.tsx – sollte die echte Payroll-Berechnung verwenden
- `useSupabaseEmployees` exportiert sich zweimal (als Default und als `useEmployeeStorage`), plus `use-employee-storage.ts` re-exportiert nochmals

### Stilkonsistenz
- Code insgesamt gut strukturiert und deutsch kommentiert
- Einheitliches Pattern bei Hooks und Komponenten
- TypeScript wird durchgaengig genutzt

---

## 2. Architektur & Struktur

### Gut
- Saubere Trennung: Pages → Components → Hooks → Utils → Types
- Multi-Tenant-Isolation konsequent umgesetzt
- Berechnungslogik zentral in `src/utils/`

### Problematisch
- **Employees-Seite ist ueberladen:** 12 verschiedene Views in einer einzigen Page-Komponente (Wizard, Salary Calculator, Time Tracking, Compliance, Reports, etc.)
- **Payroll-Dashboard ebenso:** 570 Zeilen mit 8 Sub-Views via State-Switch
- **Enge Kopplung:** `useSupabasePayroll` importiert `useSupabaseEmployees` direkt – bei jedem Payroll-Render werden alle Employees geladen
- **Fehlende Foreign Keys:** Trotz geplanter Migration zeigt die DB-Schema-Analyse: keine einzige FK-Constraint existiert

### Fehlende DB-Trigger
Die `<db-triggers>`-Sektion ist leer – der `trg_generate_personal_number`-Trigger aus der letzten Migration scheint nicht korrekt registriert zu sein. Dies muss geprueft werden.

---

## 3. Performance & Effizienz

- **social-security.ts mit ~7.900 Zeilen** wird komplett im Bundle geladen, obwohl nur wenige Konstanten pro Berechnung gebraucht werden. Kein Tree-Shaking moeglich bei einem einzelnen Objekt-Export.
- **useSupabasePayroll** laedt ALLE payroll_entries bei jedem Mount – keine Paginierung, kein Limit. Bei 100+ Mitarbeitern × 12 Monate = 1.200+ Eintraege stoesst das an das 1.000-Row-Limit von Supabase.
- **employeeMap** wird bei jedem Render neu erstellt (`new Map(employees.map(...))`), statt via `useMemo`
- **Keine Debouncing** bei der Mitarbeitersuche

---

## 4. Stabilitaet & Zuverlaessigkeit

### Tests
- 311 Unit-Tests fuer Berechnungslogik – sehr gut
- **Keine Integrationstests** fuer Supabase-Hooks
- **Keine E2E-Tests** (kein Playwright/Cypress)
- **Keine Tests fuer UI-Komponenten** (Wizard, Dashboards)

### Fehlerbehandlung
- Supabase-Fehler werden per `console.error` geloggt und in `error`-State gesetzt, aber dem Nutzer nie als Toast angezeigt
- `dbToPayrollEntry` setzt `emp ?? {} as any` wenn Mitarbeiter nicht gefunden – crashed bei Zugriff auf Properties
- `runPayrollCompliance` hat einen Placeholder (`if (true)`) der immer Warnungen erzeugt

---

## 5. Sicherheit & Datenschutz

### Kritisch: Privilege Escalation
Security-Scan bestaetigt: **Jeder authentifizierte Nutzer kann sich selbst Admin-Rechte geben** via INSERT in `user_roles`. Die ALL-Policy fuer Admins ist PERMISSIV, aber es fehlt eine restriktive INSERT-Policy fuer Nicht-Admins.

### Audit-Log Manipulation
Jeder Tenant-Member kann beliebige Eintraege in `audit_log` schreiben – inkl. gefaelschter `user_id`, `action`, `old_values`. Der Audit-Trail ist nicht vertrauenswuerdig.

### Fehlende Foreign Keys
Ohne FKs kann `employee_id` in `payroll_entries` auf nicht-existierende Mitarbeiter zeigen. Keine referentielle Integritaet.

---

## 6. Konsistenz & Wartbarkeit

- **Benennungs-Inkonsistenz:** `employmentType` verwendet `fulltime`/`parttime` im Code, aber `vollzeit` als Default in DB
- **Doppelte Re-Exports:** `use-employee-storage.ts` und `use-payroll-storage.ts` sind reine 1-Zeilen-Re-Exports – koennen direkt importiert werden
- **Error Handling:** Kein einheitliches Pattern – manche Hooks setzen `error`-State, manche loggen nur, manche zeigen Toasts

---

## 7. Verweise & Ressourcen

- `QuickSalaryCalculator` wird importiert in Employees.tsx aber nie verwendet (Zeile 8)
- `currentView === 'ultimate-calculator'` und `currentView === 'quick-salary-calculator'` rendern beide `UltimateSalaryCalculator` – redundant
- `use-company-settings.ts` und `use-time-payroll-integration.ts` – Nutzung nicht verifiziert
- Keine ungenutzten npm-Pakete gefunden

---

## 8. Dokumentation & Verstaendlichkeit

- README.md ist umfassend und aktuell (gerade erneuert)
- `ANNUAL_UPDATE_CHECKLIST.md` vorhanden und hilfreich
- **Fehlend:** API-Dokumentation der Supabase-Edge-Functions (keine vorhanden)
- **Fehlend:** Onboarding-Guide fuer neue Entwickler
- **Testdaten-Hinweis** in README vorhanden

---

## 9. Design & UX

### Konsistenz
- Header/Footer durchgaengig via `MainLayout` – konsistent
- Mobile Navigation via Hamburger-Menu vorhanden
- **Auth-Seite hat KEIN MainLayout** (korrekt – kein Header/Footer vor Login)

### Verbesserungsbedarf
- **Keine Loading-States sichtbar:** `isLoading` wird in Hooks gesetzt aber in vielen Dashboards nicht ausgewertet – Nutzer sieht leere Listen statt Spinner
- **Keine Empty-State-Konsistenz:** Manche Seiten zeigen "Noch keine Daten", andere zeigen einfach nichts
- **Kein Dark-Mode-Toggle** sichtbar, obwohl Dark-Mode CSS-Variablen definiert sind
- **Footer-Navigation** wiederholt nur 3 von 7 Nav-Items – inkonsistent

---

## 10. Funktionsuebersicht & Verknuepfungen

### Alle Systemfunktionen

**1. Dashboard (/)** 
- Statistik-Kacheln (Mitarbeiter, Durchschnittsgehalt, Gesamtkosten, Abrechnungen)
- Quick-Actions zu Mitarbeiter, Lohnabrechnung, Gehaltsrechner
- Onboarding-Hinweis bei leerer DB
- Daten aus `useEmployeeStorage` + `usePayrollStorage`
- AG-Kosten sind Schaetzwert (×1.2), nicht echte Berechnung

**2. Mitarbeiterverwaltung (/employees)**
- 4-Schritt-Wizard (Personal → Beschaeftigung → Gehalt → Zusatzleistungen)
- Mitarbeiterliste mit Suche, Bearbeiten, Loeschen
- Gehaltsrechner (Quick + Ultimate)
- Compliance-Center, Berichte, Zeiterfassung, Lohn-Reports
- Verknuepfung: employees → payroll_entries, sv_meldungen, lohnsteuerbescheinigungen, beitragsnachweise

**3. Lohnabrechnung (/payroll)**
- Abrechnungsperioden erstellen (Monat/Jahr)
- Detailansicht pro Periode mit allen Mitarbeitern
- Lohnjournal, Lohnkonto (§41 EStG)
- Manuelle Erfassung, Zeiterfassung-Sync
- Spezielle Lohnarten (Krankengeld, Mutterschutz, Kurzarbeit)
- DATEV-Export (SKR03/SKR04)
- Payroll Guardian (Anomalie-Erkennung)
- Verknuepfung: payroll_periods ↔ payroll_entries ↔ employees

**4. Zeiterfassung (/time-tracking)**
- Kalender-basierte Erfassung pro Mitarbeiter
- Bulk-Eintraege (Urlaub, Krankheit)
- Ampel-Status (Soll/Ist-Vergleich)
- Arbeitszeitkonten
- **PROBLEM:** Daten in localStorage, nicht in Supabase → nicht mandantenfaehig

**5. Meldewesen (/meldewesen)**
- Beitragsnachweise (pro KK und Monat, KV/RV/AV/PV aufgeschluesselt)
- Elektronische Lohnsteuerbescheinigung (Zeilen 3-26)
- SV-Meldungen (An-/Abmeldung, Jahresmeldung, Stornierung)
- Verknuepfung: beitragsnachweise ↔ payroll_entries, lohnsteuerbescheinigungen ↔ employees

**6. Autolohn (/autolohn)**
- Automatische Abrechnungskonfiguration
- Zeitplaene, Benachrichtigungen
- **PROBLEM:** Einstellungen werden nur als Toast bestaetigt, nicht persistent gespeichert

**7. Einstellungen (/settings)**
- Firmenstammdaten (Name, Steuernummer, Bank)
- Benutzerverwaltung (Rollen zuweisen)
- DSGVO-Management (Auskunft, Loeschung)
- TenantSwitcher im Header

**8. Auth (/auth + /reset-password)**
- Email + Passwort Login/Signup
- Auto-Login nach Registrierung (bei auto-confirm)
- Passwort-Reset-Flow
- HIBP-Check aktiviert

### Verknuepfungen mit Problemen

| Von | Nach | Status |
|-----|------|--------|
| employees → payroll_entries | Funktional, aber ohne FK | ⚠️ |
| employees → sv_meldungen | Funktional, aber ohne FK | ⚠️ |
| employees → lohnsteuerbescheinigungen | Funktional, aber ohne FK | ⚠️ |
| payroll_periods → payroll_entries | Funktional, aber ohne FK | ⚠️ |
| time-tracking → payroll (TimePayrollSync) | localStorage → Supabase Mismatch | ❌ |
| special-payments → payroll | localStorage, nicht in Payroll integriert | ❌ |
| compliance → employees | Funktional, localStorage-Alerts | ⚠️ |
| payroll-guardian → payroll | localStorage, keine echte Verbindung | ❌ |
| autolohn → payroll | Einstellungen nicht persistent | ❌ |
| dashboard stats → echte Berechnung | Hardcoded ×1.2 statt real | ❌ |

---

## 11. Design-Check

- Header: Konsistent, sticky, responsive mit Hamburger-Menu ✓
- Footer: Vorhanden, aber nur 3 Links statt 7 ⚠️
- Farbschema: Professionelles Blau, durchgaengig ✓
- Dark Mode: CSS vorhanden, kein Toggle sichtbar ⚠️
- Card-Shadows: Einheitlich `shadow-card` / `shadow-elegant` ✓
- Animations: `animate-fade-in` konsistent genutzt ✓
- Responsive: Grid-Layout mit Breakpoints ✓

---

## Zusammenfassung: Kritischste Punkte

1. **KRITISCH – Privilege Escalation:** Jeder User kann sich Admin-Rechte geben
2. **KRITISCH – 4 Hooks auf localStorage:** Zeiterfassung, Sonderzahlungen, Compliance, Guardian verlieren Daten bei Browser-Wechsel und sind nicht mandantenfaehig
3. **HOCH – Keine Foreign Keys:** Keine referentielle Integritaet in der DB
4. **HOCH – Supabase Row-Limit:** Payroll laedt alle Entries ohne Paginierung (>1000 Rows = Datenverlust)
5. **MITTEL – Audit-Log manipulierbar:** Kein vertrauenswuerdiger Audit-Trail
6. **MITTEL – AG-Kosten Schaetzwert:** Dashboard zeigt ×1.2 statt echte Berechnung
7. **MITTEL – Keine Loading-States:** Nutzer sieht leere Listen statt Ladeindikator
8. **NIEDRIG – Doppelter Code:** getStatusColor/Label in 4 Dateien

---

## Verbesserungsvorschlaege mit Prioritaet

| # | Verbesserung | Prioritaet |
|---|-------------|-----------|
| 1 | Privilege Escalation fixen (INSERT-Policy user_roles) | KRITISCH |
| 2 | localStorage-Hooks auf Supabase migrieren (4 Hooks) | KRITISCH |
| 3 | Foreign Keys anlegen (alle Tabellen) | HOCH |
| 4 | Payroll-Query paginieren / Row-Limit beachten | HOCH |
| 5 | Audit-Log INSERT-Policy auf Trigger beschraenken | HOCH |
| 6 | Loading-States in allen Dashboards einbauen | MITTEL |
| 7 | AG-Kosten durch echte Berechnung ersetzen | MITTEL |
| 8 | getStatusColor/Label zentralisieren | MITTEL |
| 9 | Dark-Mode-Toggle hinzufuegen | NIEDRIG |
| 10 | Footer-Navigation vervollstaendigen | NIEDRIG |
| 11 | Unused Code entfernen (QuickSalaryCalculator etc.) | NIEDRIG |

---

## Umsetzungsplan

### Phase 1: Sicherheit (1 Nachricht)
- RLS-Policy fuer `user_roles`: INSERT nur fuer Admins
- Audit-Log: INSERT-Policy entfernen, nur Trigger erlauben
- Foreign Keys fuer alle Tabellen anlegen

### Phase 2: Datenmigration localStorage → Supabase (2 Nachrichten)
- Neue Tabellen: `time_entries`, `special_payments`, `compliance_alerts`, `payroll_guardian_config`
- Hooks umschreiben: `use-time-tracking`, `use-special-payments`, `use-compliance`, `use-payroll-guardian`
- RLS-Policies und Tenant-Isolation fuer alle neuen Tabellen

### Phase 3: Performance & Stabilitaet (1 Nachricht)
- Payroll-Queries paginieren / nach Periode filtern
- `employeeMap` in `useMemo` wrappen
- Loading-States in allen Dashboards einbauen
- Error-Toasts statt nur console.error

### Phase 4: Code-Qualitaet & UX (1 Nachricht)
- `getStatusColor`/`getStatusLabel` in `src/lib/formatters.ts` zentralisieren
- AG-Kosten durch echte Payroll-Berechnung ersetzen
- Unused Code entfernen (QuickSalaryCalculator, doppelte Views)
- Footer-Navigation vervollstaendigen
- Dark-Mode-Toggle hinzufuegen

### Phase 5: Test-Erweiterung (1 Nachricht)
- Integrationstests fuer Supabase-Hooks (mit Mocks)
- UI-Snapshot-Tests fuer kritische Komponenten (Wizard, Payroll-Detail)
- Alle Tests ausfuehren und Regressionen pruefen
