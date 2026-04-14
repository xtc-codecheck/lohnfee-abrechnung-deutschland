# LohnPro – Deutsche Lohnbuchhaltung in Steuerberaterqualität

Multi-Tenant SaaS-Anwendung für Lohn- und Gehaltsabrechnung nach deutschem Recht (2025).

---

## Schnellstart

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Tests ausführen
npx vitest run

# Build erstellen
npm run build
```

> **Voraussetzung:** Node.js ≥ 18, npm ≥ 9. Das Backend läuft über Lovable Cloud – kein eigener Server nötig.

---

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS v3, shadcn/ui |
| **State** | TanStack React Query + React Context |
| **Routing** | React Router v6 (Code-Split via `React.lazy`) |
| **Backend** | Lovable Cloud (Supabase) – PostgreSQL, Auth, RLS, Edge Functions |
| **Tests** | Vitest (485 Tests in 19 Suites) |
| **SEO** | react-helmet-async + JSON-LD |

---

## Architektur

### Provider-Hierarchie

```
ErrorBoundary
  └── HelmetProvider
       └── QueryClientProvider
            └── TooltipProvider
                 └── BrowserRouter
                      └── AuthProvider (Auth-State, Rollen)
                           └── TenantProvider (Mandanten-Isolation)
                                └── EmployeeProvider (Mitarbeiter-Cache)
                                     └── Routes (17 lazy-loaded)
```

### Multi-Tenant-Isolation

- **Jede operative Tabelle** hat eine `tenant_id`-Spalte
- **RLS-Policies** prüfen Tenant-Zugehörigkeit via `is_tenant_member(auth.uid(), tenant_id)`
- Rollen (`admin`, `sachbearbeiter`, `leserecht`) sind **mandantenspezifisch** in `user_roles`
- Prüfung über `SECURITY DEFINER`-Funktionen (keine RLS-Rekursion)

### Rollen-System

| Rolle | Rechte |
|-------|--------|
| `admin` | Vollzugriff, Nutzerverwaltung, Einstellungen, Löschung |
| `sachbearbeiter` | Mitarbeiter anlegen, Abrechnungen erstellen/bearbeiten |
| `leserecht` | Nur Lesen |

### Authentifizierung

- Email + Passwort (HIBP-Passwort-Check aktiviert)
- Passwort-Reset via `/reset-password`
- Bei Registrierung: automatische Tenant- + Rollenerstellung (1. User → Admin)

---

## Datenbank-Schema (18 Tabellen)

### Kern

| Tabelle | Zweck |
|---------|-------|
| `tenants` | Mandanten (Firmen) |
| `tenant_members` | User ↔ Tenant Zuordnung (N:M) |
| `profiles` | Nutzerprofile (auto via Trigger) |
| `user_roles` | Rollenverteilung pro Tenant |
| `platform_admins` | System-Administratoren |

### Mitarbeiter & Abrechnung

| Tabelle | Zweck |
|---------|-------|
| `employees` | Stammdaten (35 Felder, Personalnummer auto-generiert) |
| `payroll_periods` | Abrechnungszeiträume (Status-Workflow) |
| `payroll_entries` | Einzelabrechnungen (Steuer + SV detailliert AN/AG) |
| `time_entries` | Zeiterfassung |
| `special_payments` | Sonderzahlungen (Krankengeld, Mutterschutz, KuG) |

### Meldewesen (DEÜV)

| Tabelle | Zweck |
|---------|-------|
| `sv_meldungen` | SV-Meldungen (An-/Abmeldung, Jahresmeldung) |
| `beitragsnachweise` | Monatliche Beitragsnachweise pro KK |
| `lohnsteuerbescheinigungen` | Elektronische LStB (Zeilen 3–26) |

### Verwaltung

| Tabelle | Zweck |
|---------|-------|
| `company_settings` | Firmeneinstellungen |
| `compliance_alerts` | Compliance-Warnungen |
| `gdpr_requests` | DSGVO-Anfragen |
| `audit_log` | Manipulationssicherer Audit-Trail (nur via DB-Trigger) |
| `autolohn_settings` | Autolohn-Konfiguration |

### DB-Funktionen

| Funktion | Zweck |
|----------|-------|
| `has_role(user_id, role)` | Rollenprüfung (SECURITY DEFINER) |
| `has_role_in_tenant(user_id, role, tenant_id)` | Tenant-spezifische Rollenprüfung |
| `is_tenant_member(user_id, tenant_id)` | Tenant-Zugehörigkeit |
| `is_primary_admin(user_id)` | Platform-Admin-Prüfung |
| `get_default_tenant(user_id)` | Standard-Tenant ermitteln |
| `generate_personal_number()` | Auto-Personalnummer (Trigger) |
| `audit_trigger_func()` | Audit-Log-Trigger |

---

## Berechnungslogik (Kernmodul)

### Steuerberechnung (`src/utils/tax-calculation.ts`)

- Vollständige Lohnsteuer nach § 32a EStG 2025
- Alle 6 Steuerklassen, Solidaritätszuschlag, Kirchensteuer
- Besondere Lohnsteuertabelle für Beamte/PKV
- Minijob-Pauschalbesteuerung (2%), Midijob-Gleitzone

### Sozialversicherung (`src/constants/social-security.ts`)

- BBG Ost/West, alle Beitragssätze 2025
- Lohnsteuertabelle 2025 (7.000+ Einträge)
- Minijob ≤556€, Midijob ≤2.000€, Gleitzonenfaktor 0,6683

### Branchenmodule

| Modul | Datei | Features |
|-------|-------|----------|
| Bau | `construction-payroll.ts` | SOKA-BAU, Wintergeld, Auslösung, 13. ME |
| Gastronomie | `gastronomy-payroll.ts` | Sachbezugswerte, Trinkgeld, Saisonarbeit |
| Pflege | `nursing-payroll.ts` | Schichtzuschläge, Pflegezulage, Bereitschaft |

### Zusatzmodule

| Modul | Datei |
|-------|-------|
| bAV-Berechnung | `bav-calculation.ts` |
| Dienstwagen (1%/0,5%/0,25%) | `company-car-calculation.ts` |
| Netto→Brutto-Umkehr | `net-to-gross-calculation.ts` |
| DATEV-Export (SKR03/04) | `datev-export.ts` |
| Anomalie-Erkennung | `anomaly-detection.ts` |
| Gehaltsprognose | `salary-forecast.ts` |
| KV-Vergleichsrechner | `health-insurance-comparison.ts` |

---

## Seiten & Routing

Alle Routen außer Landing, Auth, Legal sind durch `<ProtectedRoute>` geschützt und via `React.lazy()` code-gesplittet.

| Route | Beschreibung |
|-------|-------------|
| `/` | Marketing-Landingpage |
| `/dashboard` | Haupt-Dashboard (KPIs, Übersicht) |
| `/employees` | Mitarbeiterverwaltung (4-Schritt-Wizard) |
| `/payroll` | Lohnabrechnung (Journal, Lohnkonto, DATEV) |
| `/autolohn` | Automatische Abrechnung |
| `/time-tracking` | Zeiterfassung |
| `/meldewesen` | Beitragsnachweise, eLStB, SV-Meldungen |
| `/reports` | Berichte & Auswertungen |
| `/compliance` | Compliance-Dashboard |
| `/settings` | Firma, Benutzer, DSGVO |
| `/salary-calculator` | Gehaltsrechner |

---

## Testsuite

**485 Tests** in **19 Suites** – alle bestanden ✅

| Bereich | Tests |
|---------|-------|
| Steuerberechnung | ~52 |
| Sozialversicherung | ~40 |
| Tax-Params-Factory | ~24 |
| Golden-Master Payroll | ~25 |
| Property-Based Payroll | ~18 |
| Edge-Cases | ~22 |
| DATEV-Export | ~32 |
| Baulohn | ~28 |
| Gastronomie | ~26 |
| Pflege | ~30 |
| Sonderzahlungen | ~20 |
| Supabase-Mapper | ~30 |
| Hook-Mapper | ~22 |
| Branchenmodul-Integration | ~15 |
| Formatters | ~12 |
| Employee-Validierung | ~42 |
| German-Checksums | ~14 |
| BMF-Referenz-Steuer | ~33 |

```bash
npx vitest run        # Alle Tests
npx vitest            # Watch-Modus
```

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
│   └── social-security.ts     # Alle SV-Konstanten 2025
├── contexts/                  # Auth, Tenant, Employee Context
├── hooks/                     # React Query Hooks
├── types/                     # TypeScript-Definitionen
├── utils/                     # Berechnungslogik
│   └── __tests__/             # 485 Tests
├── pages/                     # Seiten-Komponenten
└── integrations/supabase/     # Auto-generiert (NICHT editieren!)
docs/
├── IMPROVEMENTS-SUMMARY.md    # Verbesserungsplan-Zusammenfassung
└── LohnPro-SubApp-Spezifikation.md  # Vollständige SubApp-Spezifikation
```

---

## Jährliche Wartung

**Checkliste:** `src/constants/ANNUAL_UPDATE_CHECKLIST.md`

Jedes Jahr zum 1. Januar aktualisieren:
1. Beitragsbemessungsgrenzen (BBG Ost/West)
2. SV-Beitragssätze
3. Minijob/Midijob-Grenzen
4. Steuerliche Freibeträge (Grundfreibetrag)
5. Lohnsteuertabelle (komplett ersetzen)
6. Sachbezugswerte (Gastronomie)
7. SOKA-BAU-Beiträge
8. KV-Zusatzbeiträge pro Kasse

---

## Wichtige Hinweise

1. **`src/integrations/supabase/client.ts` und `types.ts` NIEMALS manuell editieren** – werden automatisch generiert
2. **`.env` NIEMALS manuell editieren** – wird automatisch verwaltet
3. **Rollen NIEMALS in `profiles` speichern** – immer `user_roles`-Tabelle verwenden
4. **Alle neuen Tabellen brauchen `tenant_id`** + RLS-Policy mit `is_tenant_member()`
5. **Platform-Admin-Seeding:** Erster Admin muss per SQL-Migration eingetragen werden (`platform_admins`)

---

## Dokumentation

| Dokument | Pfad | Inhalt |
|----------|------|--------|
| README (dieses) | `README.md` | Setup, Architektur, Tech-Stack |
| SubApp-Spezifikation | `docs/LohnPro-SubApp-Spezifikation.md` | Vollständige Integrationsanleitung |
| Verbesserungsplan | `docs/IMPROVEMENTS-SUMMARY.md` | Umgesetzte Optimierungen |
| Jahres-Checkliste | `src/constants/ANNUAL_UPDATE_CHECKLIST.md` | Jährliche Parameter-Updates |
