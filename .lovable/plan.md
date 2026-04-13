

# Plan: Umfassende README erstellen

Die aktuelle README ist eine generische Lovable-Vorlage. Sie wird durch eine vollstaendige Projekt-Dokumentation ersetzt, die einer KI im Zielprojekt alle Informationen gibt, um die App korrekt zu verstehen und weiterzuentwickeln.

## Was geschrieben wird

Eine einzelne Datei: **README.md** (Ueberschreibung der bestehenden Vorlage)

## Inhalt der neuen README

### 1. Projekt-Uebersicht
- Name: LohnPro -- Deutsche Lohnbuchhaltung in Steuerberaterqualitaet
- Zweck: Multi-Tenant SaaS fuer Lohn- und Gehaltsabrechnung nach deutschem Recht
- Tech-Stack: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, Lovable Cloud (Supabase)

### 2. Architektur
- Frontend-only SPA mit Lovable Cloud Backend
- Multi-Tenant-Isolation ueber `tenant_id` in allen Tabellen
- RLS-Policies auf allen Tabellen, Tenant-Zugehoerigkeit via `is_tenant_member()`
- Rollen-System: `admin`, `sachbearbeiter`, `leserecht` (Enum `app_role`)
- Auth: Email + Passwort, auto-confirm aktiv, HIBP-Check aktiv

### 3. Datenbank-Schema (13 Tabellen)
Dokumentation aller Tabellen mit Zweck und wichtigen Spalten:
- `tenants`, `tenant_members`, `profiles`, `user_roles`
- `employees` (mit auto-generierter `personal_number` via Trigger)
- `payroll_periods`, `payroll_entries`
- `beitragsnachweise`, `lohnsteuerbescheinigungen`, `sv_meldungen`
- `company_settings`, `gdpr_requests`, `audit_log`
- DB-Funktionen: `get_default_tenant`, `has_role`, `has_any_role`, `is_tenant_member`
- Trigger: `trg_generate_personal_number`, Audit-Trigger

### 4. Seiten & Routing
Alle 8 geschuetzten Routen + Auth/ResetPassword

### 5. Berechnungslogik (Kernmodul)
- Steuerberechnung: `src/utils/tax-calculation.ts` mit voller Lohnsteuertabelle 2025
- SV-Berechnung: `src/constants/social-security.ts` (7900+ Zeilen, alle Konstanten 2025)
- Payroll-Calculator: `src/utils/payroll-calculator.ts`
- Branchenmodule: Bau (`construction-payroll.ts`), Gastro (`gastronomy-payroll.ts`), Pflege (`nursing-payroll.ts`)
- Zusatzmodule: bAV, Dienstwagen, Netto-Brutto, Gehaltsprognose

### 6. Meldewesen
- Beitragsnachweise (KV, RV, AV, PV pro Krankenkasse)
- Elektronische Lohnsteuerbescheinigung (Zeilen 3-26)
- SV-Meldungen (An-/Abmeldung, Jahresmeldung)

### 7. Testsuite
- 311 Tests in 11 Suites (vitest)
- Golden-Master-Tests, Property-Based Tests, Branchentests

### 8. Jaehrliche Wartung
Verweis auf `src/constants/ANNUAL_UPDATE_CHECKLIST.md`

### 9. Bekannte Testdaten
Hinweis: Es existieren noch Testnutzer und Testdaten in der DB (steuerberater-test@lohnpro.de, Maria Mueller). Diese muessen vor Produktivbetrieb geloescht werden.

### 10. Verzeichnisstruktur
Uebersicht der wichtigsten Ordner und Dateien

## Technische Details
- Nur 1 Datei wird geaendert: `README.md`
- Keine Code-Aenderungen, keine Migrationen
- Geschaetzte Laenge: ~400 Zeilen Markdown

