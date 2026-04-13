# LohnPro – Deutsche Lohnbuchhaltung in Steuerberaterqualität

Multi-Tenant SaaS-Anwendung für Lohn- und Gehaltsabrechnung nach deutschem Recht (2025).

## Tech-Stack

- **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS v3, shadcn/ui
- **Backend:** Lovable Cloud (Supabase) – Authentifizierung, Datenbank, RLS
- **Tests:** Vitest (311 Tests in 11 Suites)

---

## Architektur

### Frontend-only SPA

Die App ist eine reine Client-Anwendung. Alle Backend-Funktionen (Auth, DB, Storage) laufen über Lovable Cloud (Supabase). Es gibt keinen eigenen Server.

### Multi-Tenant-Isolation

- **Jede Tabelle** hat eine `tenant_id`-Spalte
- **RLS-Policies** auf allen Tabellen prüfen Tenant-Zugehörigkeit via `is_tenant_member(auth.uid(), tenant_id)`
- Ein Nutzer kann mehreren Tenants angehören (`tenant_members`-Tabelle)
- Standard-Tenant wird via `get_default_tenant(user_id)` ermittelt

### Rollen-System

Enum `app_role` mit drei Stufen:

| Rolle | Rechte |
|-------|--------|
| `admin` | Vollzugriff, Nutzerverwaltung, Einstellungen |
| `sachbearbeiter` | Mitarbeiter anlegen, Abrechnungen erstellen |
| `leserecht` | Nur Lesen |

Rollen werden in `user_roles`-Tabelle gespeichert (niemals in `profiles`). Prüfung via `has_role(user_id, role)` (SECURITY DEFINER Funktion).

### Authentifizierung

- Email + Passwort (auto-confirm ist aktiviert)
- HIBP-Passwort-Check ist aktiviert
- Passwort-Reset via `/reset-password`
- Bei Registrierung wird automatisch ein Tenant + Tenant-Membership erstellt

---

## Datenbank-Schema (13 Tabellen)

### Kern-Tabellen

| Tabelle | Zweck | Wichtige Spalten |
|---------|-------|------------------|
| `tenants` | Mandanten (Firmen) | `name`, `betriebsnummer`, `tax_number`, Adresse |
| `tenant_members` | Nutzer-Mandant-Zuordnung | `user_id`, `tenant_id`, `is_default` |
| `profiles` | Nutzerprofile | `user_id`, `display_name`, `email` |
| `user_roles` | Rollenverteilung | `user_id`, `role` (app_role Enum) |

### Mitarbeiter & Abrechnung

| Tabelle | Zweck | Wichtige Spalten |
|---------|-------|------------------|
| `employees` | Mitarbeiterstammdaten | `personal_number` (auto via Trigger), `first_name`, `last_name`, `gross_salary`, `tax_class`, `health_insurance`, `sv_number`, `tax_id`, bAV-Felder, Dienstwagen-Felder |
| `payroll_periods` | Abrechnungszeiträume | `year`, `month`, `status` (draft/calculated/approved/paid/finalized) |
| `payroll_entries` | Einzelne Abrechnungen | `employee_id`, `gross_salary`, `net_salary`, `final_net_salary`, alle Steuer- und SV-Felder einzeln (AN/AG), `audit_data` (JSON) |

### Meldewesen

| Tabelle | Zweck | Wichtige Spalten |
|---------|-------|------------------|
| `beitragsnachweise` | SV-Beitragsnachweise pro KK | `krankenkasse`, `month`, `year`, KV/RV/AV/PV je AN/AG, Umlagen |
| `lohnsteuerbescheinigungen` | Elektronische LStB | `employee_id`, `year`, Zeilen 3-26 (Brutto, LSt, Soli, KiSt, SV-Anteile) |
| `sv_meldungen` | SV-Meldungen (An-/Abmeldung) | `employee_id`, `meldegrund`, `zeitraum_von/bis`, `sv_brutto` |

### Verwaltung

| Tabelle | Zweck |
|---------|-------|
| `company_settings` | Firmeneinstellungen (Name, Steuernummer, Bank) |
| `gdpr_requests` | DSGVO-Anfragen (Auskunft, Löschung) |
| `audit_log` | Audit-Trail aller Änderungen |

### DB-Funktionen

| Funktion | Typ | Zweck |
|----------|-----|-------|
| `has_role(user_id, role)` | SECURITY DEFINER | Rollenprüfung ohne RLS-Rekursion |
| `has_any_role(user_id)` | SECURITY DEFINER | Prüft ob Nutzer mindestens eine Rolle hat |
| `is_tenant_member(user_id, tenant_id)` | SECURITY DEFINER | Tenant-Zugehörigkeitsprüfung |
| `get_default_tenant(user_id)` | SECURITY DEFINER | Standard-Tenant eines Nutzers |

### Trigger

| Trigger | Tabelle | Zweck |
|---------|---------|-------|
| `trg_generate_personal_number` | `employees` | Auto-Generierung der Personalnummer (1001, 1002, ...) pro Tenant |

---

## Seiten & Routing

Alle Routen außer `/auth` und `/reset-password` sind durch `<ProtectedRoute>` geschützt.

| Route | Seite | Komponente |
|-------|-------|------------|
| `/` | Dashboard | `main-dashboard.tsx` |
| `/employees` | Mitarbeiterverwaltung | `employee-dashboard.tsx` (4-Schritt-Wizard) |
| `/payroll` | Lohnabrechnung | `advanced-payroll-dashboard.tsx` |
| `/autolohn` | Automatische Abrechnung | `autolohn-dashboard.tsx` |
| `/time-tracking` | Zeiterfassung | `time-tracking-dashboard.tsx` |
| `/settings` | Einstellungen | Firmeneinstellungen, Admin, DSGVO |
| `/meldewesen` | Meldewesen | Beitragsnachweise, eLStB, SV-Meldungen |
| `/auth` | Login/Registrierung | `Auth.tsx` |
| `/reset-password` | Passwort zurücksetzen | `ResetPassword.tsx` |

---

## Berechnungslogik (Kernmodul)

### Steuerberechnung

**Datei:** `src/utils/tax-calculation.ts`

- Vollständige Lohnsteuerberechnung nach deutschem Recht 2025
- Unterstützt alle 6 Steuerklassen
- Solidaritätszuschlag (5,5% mit Freigrenze 19.950 €/Jahr)
- Kirchensteuer (8% oder 9% je nach Bundesland)
- Kinderfreibeträge
- Besondere Lohnsteuertabelle (`src/utils/besondere-lohnsteuertabelle.ts`)

### Sozialversicherung

**Datei:** `src/constants/social-security.ts` (~7.900 Zeilen)

Enthält alle SV-Konstanten für 2025:
- Beitragsbemessungsgrenzen (BBG) Ost/West
- Beitragssätze: KV 14,6%, RV 18,6%, AV 2,6%, PV 3,4%
- Zusatzbeitrag KV (durchschnittlich 2,5%)
- Minijob-Grenze: 556 €, Midijob-Grenze: 2.000 €
- Steuerliche Freibeträge (Grundfreibetrag 12.096 €)
- Vollständige Lohnsteuertabelle 2025

### Payroll-Calculator

**Datei:** `src/utils/payroll-calculator.ts`

Zentrale Berechnungsfunktion `calculatePayrollEntry()`:
1. Bruttolohn + Zuschläge berechnen
2. Lohnsteuer berechnen (inkl. Soli, KiSt)
3. SV-Beiträge berechnen (AN + AG getrennt)
4. Nettolohn = Brutto - Steuern - SV (AN)
5. Arbeitgeberkosten = Brutto + SV (AG)

### Branchenmodule

| Modul | Datei | Features |
|-------|-------|----------|
| **Bau** | `construction-payroll.ts` | SOKA-BAU, Winterbeschäftigung, Auslösung, 13. Monatseinkommen |
| **Gastronomie** | `gastronomy-payroll.ts` | Sachbezugswerte (Mahlzeiten), Trinkgeld, Saisonarbeit |
| **Pflege** | `nursing-payroll.ts` | Schichtzuschläge, Pflegezulage, Bereitschaftsdienst |

### Zusatzmodule

| Modul | Datei | Zweck |
|-------|-------|-------|
| bAV-Berechnung | `bav-calculation.ts` | Betriebliche Altersvorsorge, Entgeltumwandlung |
| Dienstwagen | `company-car-calculation.ts` | 1%-Methode, 0,25%/0,5% E-Auto, Fahrtenbuch |
| Netto→Brutto | `net-to-gross-calculation.ts` | Hochrechnung vom Wunschnetto |
| Gehaltsprognose | `salary-forecast.ts` | Gehaltsprojektion über Jahre |
| DATEV-Export | `datev-export.ts` | Export im DATEV-Format |
| Anomalie-Erkennung | `anomaly-detection.ts` | Abweichungsprüfung zwischen Abrechnungen |

---

## Meldewesen

### Beitragsnachweise

**Komponente:** `src/components/meldewesen/beitragsnachweis-page.tsx`

- Generierung pro Krankenkasse und Monat
- Aufschlüsselung: KV, RV, AV, PV (jeweils AN/AG)
- Umlagen U1, U2, Insolvenzgeldumlage
- Status-Workflow: Entwurf → Übermittelt

### Elektronische Lohnsteuerbescheinigung (eLStB)

**Komponente:** `src/components/meldewesen/lohnsteuerbescheinigung-page.tsx`

- Zeile 3: Bruttoarbeitslohn
- Zeile 4: Einbehaltene Lohnsteuer
- Zeile 5: Solidaritätszuschlag
- Zeile 6/7: Kirchensteuer (AN/Ehegatte)
- Zeilen 22-26: SV-Beiträge (AN/AG je Zweig)

### SV-Meldungen

**Komponente:** `src/components/meldewesen/sv-meldungen-page.tsx`

- Anmeldung (10), Abmeldung (30), Jahresmeldung (50)
- Unterbrechungsmeldung, sonstige Gründe
- Stornierung mit Begründung

---

## Testsuite

**Konfiguration:** `vitest.config.ts`

311 Tests in 11 Suites:

| Suite | Datei | Tests | Prüft |
|-------|-------|-------|-------|
| Steuerberechnung | `tax-calculation.test.ts` | ~40 | Alle Steuerklassen, Soli, KiSt |
| Sozialversicherung | `social-security.test.ts` | ~30 | BBG, Gleitzone, Minijob |
| Golden-Master | `golden-master-payroll.test.ts` | ~20 | Referenzwerte gegen DATEV |
| Property-Based | `property-based-payroll.test.ts` | ~30 | Invarianten (Netto < Brutto etc.) |
| Bau | `construction-payroll.test.ts` | ~25 | SOKA, Wintergeld |
| Gastro | `gastronomy-payroll.test.ts` | ~20 | Sachbezüge, Trinkgeld |
| Pflege | `nursing-payroll.test.ts` | ~20 | Schichtzuschläge |
| Sonderzahlungen | `special-payments.test.ts` | ~15 | 13. Gehalt, Urlaubsgeld |
| Edge Cases | `edge-cases.test.ts` | ~20 | Grenzwerte, 0€-Gehalt |
| Mitarbeiter-Validierung | `employee.test.ts` | ~15 | Pflichtfelder, Formate |
| Branchenlogik | `use-industry-payroll.test.ts` | ~10 | Hook-Integration |

```bash
# Tests ausführen
npx vitest run

# Tests im Watch-Modus
npx vitest
```

---

## Jährliche Wartung

**Checkliste:** `src/constants/ANNUAL_UPDATE_CHECKLIST.md`

Jedes Jahr zum 1. Januar müssen aktualisiert werden:
1. Beitragsbemessungsgrenzen (BBG)
2. SV-Beitragssätze
3. Minijob/Midijob-Grenzen
4. Steuerliche Freibeträge
5. Lohnsteuertabelle (komplett ersetzen)
6. Sachbezugswerte
7. SOKA-BAU-Beiträge
8. Dienstwagen-Prozentsätze
9. KV-Zusatzbeiträge pro Kasse

---


## Verzeichnisstruktur

```
src/
├── components/
│   ├── auth/                  # Login, Protected Route
│   ├── autolohn/              # Automatische Abrechnung
│   ├── compliance/            # Compliance-Dashboard
│   ├── dashboard/             # Haupt-Dashboard
│   ├── employees/             # Mitarbeiterverwaltung + Wizard
│   ├── layout/                # Hauptlayout (Sidebar, Navigation)
│   ├── meldewesen/            # Beitragsnachweise, eLStB, SV-Meldungen
│   ├── payroll/               # Lohnabrechnung, Journal, DATEV-Export
│   ├── reports/               # Berichte und Auswertungen
│   ├── salary/                # Gehaltsrechner, Branchenmodule
│   ├── settings/              # Firmeneinstellungen, Admin, DSGVO
│   ├── time-tracking/         # Zeiterfassung
│   └── ui/                    # shadcn/ui Komponenten
├── constants/
│   └── social-security.ts     # Alle SV-Konstanten 2025 (~7.900 Zeilen)
├── contexts/
│   ├── auth-context.tsx       # Auth + Rollen
│   └── tenant-context.tsx     # Multi-Tenant-Kontext
├── hooks/                     # Custom Hooks (Employees, Payroll, Time-Tracking)
├── types/                     # TypeScript-Definitionen
├── utils/                     # Berechnungslogik (Steuer, SV, Branchen)
│   └── __tests__/             # 311 Tests
├── pages/                     # Seiten-Komponenten
└── integrations/supabase/     # Auto-generiert (NICHT editieren!)
    ├── client.ts
    └── types.ts
```

---

## Wichtige Hinweise für die Weiterentwicklung

1. **`src/integrations/supabase/client.ts` und `types.ts` NIEMALS manuell editieren** – diese werden automatisch generiert
2. **`.env` NIEMALS manuell editieren** – wird automatisch verwaltet
3. **Rollen NIEMALS in `profiles` speichern** – immer `user_roles`-Tabelle verwenden
4. **Alle neuen Tabellen brauchen `tenant_id`** + RLS-Policy mit `is_tenant_member()`
5. **Konstanten-Update:** Jährlich zum 1.1. via Checkliste in `src/constants/ANNUAL_UPDATE_CHECKLIST.md`
6. **Steuerberechnung:** Bei Änderungen immer Golden-Master-Tests aktualisieren
