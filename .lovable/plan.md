

# Umfassender Systemcheck: LohnPro (Post-Phase-5)

---

## 1. Codequalitaet & Sauberkeit

### Verbleibende Probleme

**`any`-Typen in Employees.tsx (Mittel)**
- `useState<any>(null)` (Zeile 22), `data?: any` (Zeile 35), `data: any` (Zeile 48) -- unsichere Typisierung, sollte durch konkrete Interfaces ersetzt werden.

**Autolohn-Dashboard TODO (Niedrig)**
- `autolohn-dashboard.tsx` Zeile 100: Kommentar "Speicherung in localStorage oder Backend implementieren" -- veralteter Kommentar, Einstellungen werden nicht persistiert.

**CHURCH_TAX_RATES Redundanz (Niedrig)**
- `src/types/employee.ts` Zeilen 226-243: Alle 16 Bundeslaender haben identische Raten-Objekte pro Religion. Koennte auf eine Map `state => rate` reduziert werden (8% oder 9%).

---

## 2. Architektur & Struktur

**Employees-Seite als Mega-Router (Mittel)**
- `src/pages/Employees.tsx` routet 11 verschiedene Views (dashboard, wizard, 2 calculators, time-tracking, compliance, reports, advanced-payroll, authorities, extended-calc). Das ueberlaesst die Mitarbeiter-Seite und sollte in eigene Routen aufgeteilt werden.

**Payroll-Dashboard lokale Status-Alias (Niedrig)**
- `payroll-dashboard.tsx` Zeile 38-39: `const getStatusColor = getPayrollStatusColor` -- unnoetige Alias-Variablen, direkter Import reicht.

**Sonst sauber:** Hook-Abstraktion (Storage-Hooks als Re-Exports), Tenant-Context, Auth-Context, zentralisierte Formatierung -- alles gut strukturiert.

---

## 3. Performance & Effizienz

**Time-Entries: Alle Eintraege geladen (Mittel)**
- `use-time-tracking.ts` laedt alle `time_entries` fuer den Tenant ohne Limit oder Datumsfilter. Bei wachsenden Daten problematisch.

**Compliance-Regeln: Neuberechnung bei jedem Render (Niedrig)**
- `useMemo` ohne Abhaengigkeiten fuer `complianceRules` ist korrekt, aber `runEmployeeCompliance` erzeugt bei jedem Aufruf neue IDs mit `Date.now()` -- keine Caching-Moeglichkeit.

**Sonst OK:** `useMemo` fuer employeeMap, Query-Limits fuer Payroll, Loading-States vorhanden.

---

## 4. Stabilitaet & Zuverlaessigkeit

**Fehlende Error-Toasts (Mittel)**
- Alle Supabase-Hooks loggen Fehler nur mit `console.error`. Der Nutzer bekommt keine visuelle Rueckmeldung bei fehlgeschlagenen DB-Operationen (Zeiterfassung, Sonderzahlungen, Guardian).

**Property-Based Test schlaegt fehl (Niedrig)**
- Bekannter fehlschlagender Test bei Steuerprogression-Grenzen. Sollte gefixt oder mit `todo`/`skip` markiert werden.

**354 Tests bestehen**, Error-Boundary vorhanden, Zod-Validierung fuer Mitarbeiterdaten.

---

## 5. Sicherheit & Datenschutz -- KRITISCH

Der Security-Scan hat **3 kritische Privilege-Escalation-Luecken** und **1 Datenleck** gefunden:

1. **KRITISCH: Cross-Tenant Admin-Rollen** -- `user_roles` hat keine `tenant_id`. Ein Admin kann global Rollen vergeben/aendern.
2. **KRITISCH: Cross-Tenant Member-Injection** -- `tenant_members` Policy prueft nur `has_role('admin')` ohne `is_tenant_member`. Ein Admin kann sich in jeden Tenant einschleusen.
3. **KRITISCH: Tenant-Daten offen fuer alle Admins** -- `tenants` Policy erlaubt jedem Admin Zugriff auf alle Tenant-Daten (Steuernummer, Kontakt).
4. **WARNUNG: Profil-Enumeration** -- Jeder authentifizierte Nutzer kann alle Profil-E-Mails sehen.

---

## 6. Konsistenz & Wartbarkeit

**Konsistentes Muster:** Alle operativen Hooks folgen dem gleichen Muster (Supabase-Query, State-Mapping, CRUD-Callbacks). Formatierung zentralisiert. Dark-Mode-Support einheitlich.

**Inkonsistenz: `navigate` in Payroll** -- Payroll.tsx importiert `useNavigate` (Zeile 2), nutzt es aber nicht selbst, sondern uebergibt `onBack={() => navigate("/")}`. Unnoetig.

---

## 7. Verweise & Ressourcen

**Keine toten Imports gefunden.** `QuickSalaryCalculator` wurde in Phase 4 entfernt. Alle verbliebenen Imports sind gueltig.

**README Testdaten-Hinweis (Niedrig):** Der Abschnitt "Bekannte Testdaten" in der README erwaehnt noch `steuerberater-test@lohnpro.de` und Maria Mueller -- diese wurden bereits geloescht. README aktualisieren.

---

## 8. Dokumentation

README ist umfassend und aktuell (bis auf den Testdaten-Hinweis). Inline-Kommentare in `formatters.ts` und Hooks sind gut. `ANNUAL_UPDATE_CHECKLIST.md` vorhanden.

---

## 9. Benutzererfahrung & Design

**Header/Footer konsistent:** Beide nutzen `navItems`-Array, Dark-Mode-Toggle im Header, Responsive Mobile-Menu vorhanden.

**Fehlende Mobile-Optimierung in Footer:** `DarkModeToggle` und `TenantSwitcher` fehlen im Mobile-Menu (nur Desktop-Nav hat sie).

**Kein Breadcrumb-Navigation** in tief verschachtelten Views (z.B. Payroll > Guardian > Anomalie-Detail).

---

## 10. Funktionsliste & Verknuepfungen

### Funktionen

| Funktion | Stichpunkte |
|---|---|
| **Dashboard** | Statistiken (MA-Anzahl, Durchschnittsgehalt, AG-Kosten, Perioden), Quick-Actions, Loading-State, Onboarding-Hinweis bei 0 MA |
| **Mitarbeiterverwaltung** | 4-Schritt-Wizard (Personal, Beschaeftigung, Gehalt, Benefits), CRUD, Suche, Branchenmodule (Bau/Gastro/Pflege), Export |
| **Lohnabrechnung** | Perioden-Verwaltung (Entwurf->Berechnet->Freigegeben->Ausgezahlt), Steuer+SV-Berechnung, DATEV-Export, PDF-Generierung, Journal |
| **Gehaltsrechner** | Brutto-Netto (alle 6 Steuerklassen), Netto-Brutto-Umkehr, bAV-Optimierung, Dienstwagen (1%/0.25%), Gehaltsprognose |
| **Zeiterfassung** | Tageseintraege (Arbeit/Urlaub/Krank), Bulk-Erfassung, Ampel-Status, Arbeitszeitkonten, Payroll-Sync |
| **Sonderzahlungen** | Krankengeld, Mutterschutz, Kurzarbeit -- jeweils CRUD mit Perioden-Zuordnung |
| **Meldewesen** | Beitragsnachweise pro KK, eLStB (Zeilen 3-26), SV-Meldungen (An-/Abmeldung/Storno) |
| **Payroll Guardian** | Anomalie-Erkennung, Gehaltshistorie, Prognosen, Health-Score |
| **Compliance** | Mindestlohn-Pruefung, BBG-Grenzen, Datenvollstaendigkeit, Aufbewahrungsfristen, Alerts in DB |
| **Einstellungen** | Firmenstammdaten, Benutzerverwaltung (Rollen), DSGVO-Anfragen |
| **Auth & Multi-Tenant** | Email+Passwort, Rollen (admin/sachbearbeiter/leserecht), Tenant-Switcher, Auto-Tenant-Erstellung |

### Verknuepfungen

| Von | Nach | Mechanismus | Status |
|---|---|---|---|
| Dashboard | Mitarbeiter, Abrechnung, Gehaltsrechner | Navigation-Buttons | OK |
| Mitarbeiter-Wizard | Gehaltsrechner | `onCalculate`-Callback | OK |
| Abrechnung | Sonderzahlungen, Automation, Guardian, Lohnkonto | View-Switching | OK |
| Zeiterfassung | Payroll-Sync | `TimePayrollSync`-Komponente | OK |
| Payroll Guardian | Anomalie-Detection-Utils | `detectAnomalies()` | OK |
| Compliance | Mitarbeiter-Daten | `runEmployeeCompliance()` | OK |
| Meldewesen | Payroll-Entries | Generierung aus Abrechnungsdaten | OK |
| Alle operativen Hooks | Tenant-Context | `currentTenant.id` als Filter | OK |
| Auth | Rollen-System | `user_roles`-Tabelle + `has_role()` | OK (aber Cross-Tenant-Luecke) |

### Fehlende/Unvollstaendige Verknuepfungen

1. **Autolohn-Einstellungen** werden nicht persistiert (TODO-Kommentar vorhanden)
2. **`runPayrollCompliance`** gibt immer leeres Array zurueck (Zeile 179) -- Payroll-Compliance-Pruefungen fehlen
3. **Working-Time-Accounts** (`/employees?view=working-time-accounts`) ist als View definiert aber nicht navigierbar -- kein Button fuehrt dorthin

---

## 11. Design

- **Header:** Konsistent mit Logo, Nav, Tenant-Switcher, Dark-Mode, User-Info. Sticky. Responsive mit Mobile-Menu.
- **Footer:** Konsistent mit Logo, Nav-Links, Copyright. Aber: Dark-Mode-Toggle und Tenant-Switcher fehlen im Mobile-Menue.
- **Karten-Design:** Einheitlich `shadow-card hover:shadow-elegant`. Dark-Mode-kompatibel durch Tailwind-Klassen.
- **Keine globale Breadcrumb-Komponente** fuer verschachtelte Views.

---

## Kritischste Punkte (Zusammenfassung)

1. **3 Cross-Tenant Privilege-Escalation-Luecken** in RLS-Policies (user_roles, tenant_members, tenants)
2. **Profil-Enumeration** -- alle Nutzer koennen alle E-Mails sehen
3. **Fehlende Error-Toasts** in allen Supabase-Hooks -- Nutzer sieht keine Fehler
4. **Time-Entries ohne Limit/Filter** -- Performance-Risiko bei wachsenden Daten
5. **`any`-Typen** in Employees.tsx
6. **README enthaelt geloeschte Testdaten-Referenz**

---

## Verbesserungsvorschlaege

| Prioritaet | Massnahme |
|---|---|
| **HOCH** | RLS-Policies fixen: `tenant_members` und `tenants` Policies um `is_tenant_member` erweitern |
| **HOCH** | `profiles` SELECT-Policy auf gleichen Tenant einschraenken |
| **HOCH** | Error-Toasts in allen Supabase-Hooks (time-tracking, special-payments, compliance, guardian) |
| **MITTEL** | Time-Entries-Query mit Datums-Limit (z.B. letzte 90 Tage) |
| **MITTEL** | `any`-Typen in Employees.tsx durch `Employee`-Interface ersetzen |
| **MITTEL** | Mobile-Menu um Dark-Mode-Toggle und Tenant-Switcher erweitern |
| **NIEDRIG** | README Testdaten-Abschnitt entfernen |
| **NIEDRIG** | `runPayrollCompliance` implementieren oder entfernen |
| **NIEDRIG** | Autolohn-Einstellungen persistieren |
| **NIEDRIG** | Payroll-Dashboard Status-Alias entfernen |

---

## Umsetzungsplan

### Phase A: Sicherheitshärtung (1 Nachricht)
- RLS-Policies fuer `tenant_members`, `tenants`, `user_roles` um Tenant-Scoping erweitern
- `profiles` SELECT-Policy auf Tenant-Zugehoerigkeit einschraenken
- Security-Scan erneut ausfuehren zur Verifikation

### Phase B: Robustheit & UX (1 Nachricht)
- Toast-Fehlerbenachrichtigungen in alle 4 Supabase-Hooks einbauen
- Time-Entries-Query auf 90-Tage-Fenster begrenzen
- `any`-Typen in Employees.tsx ersetzen
- Dark-Mode-Toggle + Tenant-Switcher ins Mobile-Menu

### Phase C: Cleanup & Dokumentation (1 Nachricht)
- README: Testdaten-Abschnitt entfernen
- `runPayrollCompliance` mit echten Pruefungen fuellen oder entfernen
- Payroll-Dashboard: unnoetige Alias-Variablen entfernen
- Property-Based Test fixen oder als `todo` markieren

