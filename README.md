# LohnPro – Deutsche Lohnbuchhaltung in Steuerberaterqualität

> 🔄 **Diese App ersetzt das bestehende Lohnmodul im SYSTAX-Hauptsystem.**
> Übergabe-Anleitung: [`docs/SYSTAX-INTEGRATION-GUIDE.md`](docs/SYSTAX-INTEGRATION-GUIDE.md)
> Standalone-Berechnungs-Bibliothek: [`src/payroll-core/`](src/payroll-core/README.md)

> **Status: ✅ ÜBERGABEFERTIG an SYSTAX-Hauptsystem**  
> Multi-Tenant SaaS-Anwendung für Lohn- und Gehaltsabrechnung nach deutschem Recht (2025/2026).  
> ELSTER und finAPI sind Bestandteil des SYSTAX-Hauptsystems.

---

## Schnellstart

```bash
npm install
npm run dev
npx vitest run
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
| **Tests** | Vitest (571 Tests in 26 Suites) |
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

### Authentifizierung & Onboarding

- Email + Passwort (HIBP-Passwort-Check aktiviert)
- Passwort-Reset via `/reset-password`
- Bei Registrierung: automatische Tenant- + Rollenerstellung (jeder neue User → Admin in eigenem Tenant)
- **Interaktiver Onboarding-Wizard** für neue Benutzer (Firmendaten, erster Mitarbeiter, erste Abrechnung)

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

### FK-Constraints

Alle Fremdschlüssel verwenden `ON DELETE CASCADE` für referenzielle Integrität. Migriert und verifiziert.

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

- Vollständige Lohnsteuer nach § 32a EStG **2025 + 2026** (PAP-formelbasiert)
- Alle 6 Steuerklassen, Solidaritätszuschlag, Kirchensteuer
- Besondere Lohnsteuertabelle für Beamte/PKV
- Minijob-Pauschalbesteuerung (2%), Midijob-Gleitzone

### Sozialversicherung (`src/constants/social-security.ts`)

- BBG Ost/West **2025 + 2026**, alle Beitragssätze
- PUEG-Kinderabschläge
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
| **Fibu-Buchungslogik** | `fibu-booking.ts` |
| GoBD-Export (Betriebsprüfung) | `gobd-export.ts` |
| Entgeltfortzahlung (§ 3 EFZG) | `entgeltfortzahlung.ts` |
| Jahresausgleich (§ 42b EStG) | `annual-tax-reconciliation.ts` |
| Märzklausel | `maerzklausel.ts` |
| Anomalie-Erkennung | `anomaly-detection.ts` |
| Gehaltsprognose | `salary-forecast.ts` |
| KV-Vergleichsrechner | `health-insurance-comparison.ts` |

---

## Payroll-Dashboard (Refactored)

Das Payroll-Dashboard wurde in modulare Sub-Komponenten aufgeteilt:

| Komponente | Datei | Funktion |
|-----------|-------|----------|
| `PayrollQuickActions` | `payroll-quick-actions.tsx` | Schnellaktionen |
| `PayrollStatsCards` | `payroll-stats-cards.tsx` | KPI-Karten |
| `PayrollPeriodsList` | `payroll-periods-list.tsx` | Periodenliste |
| `PayrollSubViewWrapper` | `payroll-sub-view-wrapper.tsx` | Sub-View-Container |
| **`MonthlyPayrollWizard`** | `monthly-payroll-wizard.tsx` | **5-Schritt-Wizard mit Auto-Run** |
| **`FibuJournalPage`** | `fibu-journal.tsx` | **Fibu-Journal mit Buchungssätzen + Saldenliste** |

---

## Error-Handling

- `NetworkErrorAlert`-Komponente für Datenbankfehler mit Retry-Funktion
- Integriert in Employee-Dashboard und Payroll-Dashboard
- `ErrorBoundary` als globaler Fallback

---

## Seiten & Routing

Alle Routen außer Landing, Auth, Legal sind durch `<ProtectedRoute>` geschützt und via `React.lazy()` code-gesplittet.

| Route | Beschreibung |
|-------|-------------|
| `/` | Marketing-Landingpage |
| `/dashboard` | Haupt-Dashboard (KPIs, Onboarding-Wizard) |
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

**571 Tests** in **26 Suites** – alle bestanden ✅

| Bereich | Tests |
|---------|-------|
| BMF-Referenz PAP 2025 | ~33 |
| Golden-Master 2026 | ~17 |
| Steuerberechnung | ~52 |
| Sozialversicherung | ~40 |
| Tax-Params-Factory | ~24 |
| Golden-Master Payroll | ~25 |
| Property-Based Payroll | ~18 |
| Edge-Cases | ~22 |
| DATEV-Export | ~32 |
| GoBD-Export | ~15 |
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
| Entgeltfortzahlung | ~12 |
| ELStAM-Validierung | ~10 |
| Jahresausgleich | ~8 |
| Märzklausel | ~8 |
| E2E-Flow | ~10 |
| Payroll-Integration | ~6 |

```bash
npx vitest run        # Alle Tests
npx vitest            # Watch-Modus
```

---

## SYSTAX-Integration

### Bereits im Hauptsystem vorhanden
- **ELSTER** – Elektronische Steuererklärung/Meldungen
- **finAPI** – Banküberweisungen (SEPA)

### Von LohnPro bereitgestellt
- Komplette Lohnberechnung (PAP 2025/2026)
- Multi-Tenant mit RLS
- DATEV/GoBD-Export
- Meldewesen-Datenaufbereitung (SV, LStA, eLStB)
- Onboarding für Laien-Nutzer

### Integrationspunkte
1. **Auth**: `AuthProvider` → SYSTAX Auth-System
2. **Tenant**: `TenantProvider` → SYSTAX Mandantenverwaltung
3. **Routing**: Alle Routen mit Prefix (z.B. `/lohnpro/...`)
4. **ELSTER**: Meldewesen-Daten → SYSTAX ELSTER-Modul
5. **finAPI**: Auszahlungsbeträge → SYSTAX Zahlungsmodul

---

## Jährliche Wartung

**Checkliste:** `src/constants/ANNUAL_UPDATE_CHECKLIST.md`

Jedes Jahr zum 1. Januar aktualisieren:
1. Beitragsbemessungsgrenzen (BBG Ost/West)
2. SV-Beitragssätze
3. Minijob/Midijob-Grenzen
4. Steuerliche Freibeträge (Grundfreibetrag)
5. PAP-Tarifformel (§ 32a EStG)
6. Sachbezugswerte (Gastronomie)
7. SOKA-BAU-Beiträge
8. KV-Zusatzbeiträge pro Kasse

---

## Wichtige Hinweise

1. **`src/integrations/supabase/client.ts` und `types.ts` NIEMALS manuell editieren** – werden automatisch generiert
2. **`.env` NIEMALS manuell editieren** – wird automatisch verwaltet
3. **Rollen NIEMALS in `profiles` speichern** – immer `user_roles`-Tabelle verwenden
4. **Alle neuen Tabellen brauchen `tenant_id`** + RLS-Policy mit `is_tenant_member()`
5. **Platform-Admin-Seeding:** Erster Admin muss per SQL-Migration eingetragen werden

---

## Dokumentation

| Dokument | Pfad | Inhalt |
|----------|------|--------|
| README (dieses) | `README.md` | Setup, Architektur, Tech-Stack, Übergabe |
| SubApp-Spezifikation | `docs/LohnPro-SubApp-Spezifikation.md` | Vollständige Integrationsanleitung |
| Verbesserungsplan | `docs/IMPROVEMENTS-SUMMARY.md` | Umgesetzte Optimierungen |
| Jahres-Checkliste | `src/constants/ANNUAL_UPDATE_CHECKLIST.md` | Jährliche Parameter-Updates |

---

*Status: ✅ Übergabefertig an SYSTAX – 14. April 2026*
