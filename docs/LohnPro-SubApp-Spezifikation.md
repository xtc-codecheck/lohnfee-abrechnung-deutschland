# LohnPro – Vollständige SubApp-Spezifikation

> **Zweck:** Dieses Dokument beschreibt die komplette Funktionalität, Datenstrukturen, Berechnungslogik und Schnittstellen der LohnPro-App. Es dient als Blaupause für eine 1:1-Integration als SubApp in ein übergeordnetes Hauptsystem (Lovable-Projekt).

> **Status:** ✅ 100% Feature-komplett, 571 Tests in 26 Suites bestanden, Security-Audit bestanden
> **Berechnungsstand:** Steuer- und SV-Sätze **2025 und 2026** (dual-year support)

---

## 1. Systemübersicht

| Eigenschaft | Wert |
|---|---|
| **Framework** | React 18 + TypeScript 5 + Vite 5 |
| **Styling** | Tailwind CSS v3 + shadcn/ui |
| **State Management** | React Query (TanStack Query) + React Context |
| **Backend** | Supabase (Lovable Cloud) – PostgreSQL + Auth + RLS |
| **Routing** | React Router v6 |
| **SEO** | react-helmet-async + JSON-LD |
| **Berechnungsstand** | **2025 + 2026** (parametrisiert via `getYearConfig(year)`) |
| **Tests** | 571 Tests, 26 Suites (Vitest + fast-check) |
| **Security** | 18 Tabellen mit RLS, 0 kritische Findings |

---

## 2. Architektur & Provider-Hierarchie

```
ErrorBoundary
  └── HelmetProvider
       └── QueryClientProvider
            └── TooltipProvider
                 └── BrowserRouter
                      └── AuthProvider (Auth-State, Rollen)
                           └── TenantProvider (Mandanten-Isolation)
                                └── EmployeeProvider (Mitarbeiter-Cache)
                                     └── Routes
```

### 2.1 Kontexte (React Context)

| Context | Datei | Bereitgestellte Werte |
|---|---|---|
| **AuthContext** | `src/contexts/auth-context.tsx` | `user`, `roles`, `isAdmin`, `login()`, `logout()`, `refreshRolesForTenant()` |
| **TenantContext** | `src/contexts/tenant-context.tsx` | `currentTenant`, `tenants`, `tenantId`, `switchTenant()`, `refreshTenants()` |
| **EmployeeContext** | `src/contexts/employee-context.tsx` | `employees`, `isLoading`, `addEmployee()`, `updateEmployee()`, `deleteEmployee()`, `getEmployee()` |

---

## 3. Routing-Struktur

### 3.1 Öffentliche Routen (kein Auth erforderlich)

| Route | Seite | Beschreibung |
|---|---|---|
| `/` | `Landing.tsx` | Marketing-Landingpage |
| `/auth` | `Auth.tsx` | Login / Registrierung |
| `/reset-password` | `ResetPassword.tsx` | Passwort zurücksetzen |
| `/impressum` | `Impressum.tsx` | Impressum (§ 5 TMG) |
| `/datenschutz` | `Datenschutz.tsx` | Datenschutzerklärung (DSGVO) |
| `/agb` | `AGB.tsx` | Allgemeine Geschäftsbedingungen |
| `/kontakt` | `Kontakt.tsx` | Kontaktformular |
| `/hilfe` | `HilfeCenter.tsx` | Hilfe & FAQ |

### 3.2 Geschützte Routen (ProtectedRoute, Auth erforderlich)

| Route | Seite | Hauptkomponente |
|---|---|---|
| `/dashboard` | `Index.tsx` | `MainDashboard` |
| `/employees` | `Employees.tsx` | `EmployeeDashboard` + ELStAM-Validierung |
| `/payroll` | `Payroll.tsx` | `PayrollDashboard` + Jahresausgleich + Korrektur |
| `/autolohn` | `Autolohn.tsx` | `AutolohnDashboard` |
| `/time-tracking` | `TimeTracking.tsx` | `TimeTrackingDashboard` |
| `/settings` | `Settings.tsx` | Tabs: Firma, Benutzer, DSGVO, Kontakt |
| `/meldewesen` | `Meldewesen.tsx` | SV-Meldungen, Beitragsnachweise, eLStB |
| `/compliance` | `Compliance.tsx` | `ComplianceDashboard` |
| `/reports` | `Reports.tsx` | `AdvancedReports` |
| `/authorities` | `Authorities.tsx` | `AuthoritiesIntegration` |
| `/extended-calculations` | `ExtendedCalculations.tsx` | Erweiterte Berechnungen |
| `/salary-calculator` | `SalaryCalculator.tsx` | `UltimateSalaryCalculator` |

---

## 4. Datenbank-Schema (18 Tabellen)

### 4.1 Kern-Tabellen

#### `tenants`
Mandanten/Firmen. Jeder Datensatz im System gehört zu einem Tenant.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID PK | Mandanten-ID |
| `name` | text NOT NULL | Firmenname |
| `betriebsnummer` | text | Betriebsnummer der BA |
| `tax_number` | text | Steuernummer |
| `street`, `zip_code`, `city` | text | Adresse |
| `contact_email`, `contact_phone` | text | Kontakt |
| `is_active` | boolean | Aktiv-Status |

#### `tenant_members`
Zuordnung User → Tenant (N:M).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `tenant_id` | UUID FK → tenants | |
| `user_id` | UUID FK → auth.users | |
| `is_default` | boolean | Standard-Tenant des Users |

#### `user_roles`
Rollen pro Tenant. **Enum:** `admin`, `sachbearbeiter`, `leserecht`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `user_id` | UUID | |
| `role` | app_role (enum) | |
| `tenant_id` | UUID FK → tenants | |
| UNIQUE | (user_id, tenant_id, role) | |

#### `profiles`
Zusätzliche Benutzerdaten (automatisch via Trigger bei Registrierung).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `user_id` | UUID UNIQUE | |
| `email` | text | |
| `display_name` | text | |

#### `employees`
Mitarbeiterstammdaten.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID FK → tenants | Mandantenzuordnung |
| `personal_number` | text | Automatisch generiert (ab 1001) |
| `first_name`, `last_name` | text NOT NULL | |
| `date_of_birth` | date | |
| `street`, `zip_code`, `city`, `state` | text | Adresse inkl. Bundesland |
| `gender` | text | male/female/diverse |
| `tax_id` | text | Steuer-ID |
| `tax_class` | integer | Steuerklasse 1-6 |
| `church_tax` | boolean | Kirchensteuerpflichtig |
| `church_tax_rate` | numeric | KiSt-Satz |
| `sv_number` | text | SV-Nummer |
| `health_insurance` | text | Krankenkasse |
| `health_insurance_number` | text | KV-Nummer |
| `children_allowance` | numeric | Kinderfreibeträge |
| `number_of_children` | integer | Anzahl Kinder (für PV-Abschläge) |
| `gross_salary` | numeric NOT NULL | Bruttogehalt |
| `employment_type` | text | vollzeit/teilzeit/minijob/midijob |
| `weekly_hours` | numeric | Wochenstunden |
| `entry_date`, `exit_date` | date | Ein-/Austrittsdatum |
| `department`, `position` | text | Abteilung/Position |
| `iban`, `bic` | text | Bankverbindung |
| `has_bav`, `bav_monthly_amount` | boolean/numeric | bAV |
| `has_company_car`, `company_car_list_price`, `company_car_distance_km` | | Dienstwagen |
| `is_active` | boolean | Status |
| `created_by` | UUID | Ersteller |

### 4.2 Lohnabrechnung

#### `payroll_periods`
Abrechnungszeiträume.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `tenant_id` | UUID | |
| `year`, `month` | integer | Jahr/Monat |
| `start_date`, `end_date` | date | Zeitraum |
| `status` | text | draft/calculated/approved/paid/finalized |
| `processed_at`, `processed_by` | timestamp/UUID | |

#### `payroll_entries`
Einzelne Lohnabrechnungen pro Mitarbeiter und Periode.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `employee_id` | UUID FK → employees | |
| `payroll_period_id` | UUID FK → payroll_periods | |
| `gross_salary` | numeric | Brutto |
| `net_salary` | numeric | Netto |
| `final_net_salary` | numeric | Auszahlungsbetrag |
| `tax_income_tax` | numeric | Lohnsteuer |
| `tax_solidarity` | numeric | Solidaritätszuschlag |
| `tax_church` | numeric | Kirchensteuer |
| `tax_total` | numeric | Steuern gesamt |
| `sv_health_employee/employer` | numeric | KV AN/AG |
| `sv_pension_employee/employer` | numeric | RV AN/AG |
| `sv_unemployment_employee/employer` | numeric | AV AN/AG |
| `sv_care_employee/employer` | numeric | PV AN/AG |
| `sv_total_employee/employer` | numeric | SV gesamt AN/AG |
| `employer_costs` | numeric | AG-Gesamtkosten |
| `bonus` | numeric | Boni/Prämien |
| `overtime_hours`, `overtime_pay` | numeric | Überstunden |
| `deductions`, `deduction_description` | numeric/text | Abzüge |
| `notes` | text | Notizen |
| `audit_data` | jsonb | Audit-Trail (Berechnungsprotokoll) |

### 4.3 – 4.5 (unverändert)

Weitere Tabellen: `time_entries`, `sv_meldungen`, `beitragsnachweise`, `lohnsteuerbescheinigungen`, `lohnsteueranmeldungen`, `compliance_alerts`, `special_payments`, `payroll_guardian_anomalies`, `payroll_guardian_history`, `gdpr_requests`, `company_settings`, `autolohn_settings`, `audit_log`, `contact_messages`, `platform_admins`.

---

## 5. RLS-Sicherheitskonzept (Row Level Security)

### 5.1 Grundprinzip
Jede Tabelle mit `tenant_id` wird durch RLS geschützt:

```sql
-- Leserechte: Tenant-Mitgliedschaft
USING (is_tenant_member(auth.uid(), tenant_id))

-- Schreibrechte: Tenant-Mitgliedschaft + Rolle (admin oder sachbearbeiter)
USING (
  (has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR 
   has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id))
  AND is_tenant_member(auth.uid(), tenant_id)
)

-- Löschrechte: Nur Admin
USING (
  has_role_in_tenant(auth.uid(), 'admin', tenant_id) 
  AND is_tenant_member(auth.uid(), tenant_id)
)
```

### 5.2 Security-Definer-Funktionen

```sql
is_tenant_member(_user_id, _tenant_id) → boolean
has_role_in_tenant(_user_id, _role, _tenant_id) → boolean
has_role(_user_id, _role) → boolean
get_default_tenant(_user_id) → uuid
is_primary_admin(_user_id) → boolean
shares_tenant(_user_a, _user_b) → boolean
```

### 5.3 Sonderfälle
- **audit_log**: INSERT/UPDATE/DELETE blockiert für Client (nur Trigger)
- **contact_messages**: INSERT für `anon`+`authenticated` (Kontaktformular), SELECT/UPDATE nur für Platform-Admins
- **profiles**: INSERT/UPDATE nur eigenes Profil, SELECT über Tenant-Sharing

### 5.4 Security-Audit-Ergebnis (April 2026)
- ✅ 18 Tabellen geprüft, 0 kritische Findings
- ⚠️ 1 Info: `contact_messages` INSERT mit `WITH CHECK (true)` – absichtlich öffentlich
- ✅ Keine rekursiven Policies
- ✅ Keine Privilege-Escalation möglich

---

## 6. DB-Trigger & Funktionen

| Trigger/Funktion | Tabelle | Beschreibung |
|---|---|---|
| `handle_new_user()` | `auth.users` → `profiles` | Erstellt Profil bei Registrierung |
| `assign_default_role()` | `auth.users` → `user_roles` + `tenants` + `tenant_members` | Erstellt Tenant + weist **immer admin-Rolle** zu (jeder neue User ist Admin in seinem eigenen Tenant) |
| `generate_personal_number()` | `employees` | Generiert Personalnummer ab 1001 pro Tenant |
| `audit_trigger_func()` | Diverse | Schreibt Audit-Log bei INSERT/UPDATE/DELETE |
| `update_updated_at_column()` | Diverse | Aktualisiert `updated_at` Timestamp |

---

## 7. Berechnungslogik

### 7.1 Steuerberechnung (§ 32a EStG 2025/2026)

**Datei:** `src/utils/tax-calculation.ts`

#### Formelbasierte PAP-Berechnung (kein Tabellen-Lookup!)
Die Steuerberechnung implementiert den **Programmablaufplan (PAP)** des BMF direkt:

```typescript
calculateTariflicheEStPAP2025(zvE: number, year: number = 2025): number
```

**Unterstützte Tarife:**
| Jahr | Grundfreibetrag | Zone 2 bis | Zone 3 bis | 42%-Grenze | 45%-Grenze |
|------|----------------|-----------|-----------|-----------|-----------|
| 2025 | €12.096 | €17.443 | €68.480 | €277.825 | ab €277.826 |
| 2026 | €12.336 | €17.687 | €68.480 | €277.825 | ab €277.826 |

#### Eingabeparameter (`TaxCalculationParams`)
```typescript
{
  grossSalaryYearly: number;
  taxClass: string;                // 'I' bis 'VI' oder '1'-'6'
  childAllowances: number;
  churchTax: boolean;
  churchTaxRate: number;           // 8% (Bayern, BW) oder 9%
  healthInsuranceRate: number;     // KV-Zusatzbeitrag
  isEastGermany: boolean;          // für BBG
  isChildless: boolean;            // für PV-Zuschlag
  age: number;
  numberOfChildren?: number;       // PV-Kinderabschläge (PUEG)
  employmentType?: 'minijob' | 'midijob' | 'fulltime' | 'parttime';
  useBesondereLohnsteuertabelle?: boolean;
  privateHealthInsuranceMonthly?: number;
  privateCareInsuranceMonthly?: number;
  year?: number;                   // 2025 oder 2026
}
```

#### Steuerklassen-Berechnung nach PAP
- **StKl I/IV**: Grundtarif
- **StKl II**: + Entlastungsbetrag Alleinerziehende (€4.260 + €240/weiteres Kind)
- **StKl III**: Splitting-Verfahren (ESt(zvE/2) × 2)
- **StKl V**: Vergleichsberechnung (2×ESt(zvE) − 2×ESt(zvE/2))
- **StKl VI**: Wie V, ohne Werbungskosten/Sonderausgaben

#### Vorsorgepauschale (§ 39b Abs. 2 EStG)
Dreistufig: VSP1 (RV-Beiträge) + max(VSP2 (12% Pauschale), VSP3 (KV+PV tatsächlich))

### 7.2 Besondere Lohnsteuertabelle

**Datei:** `src/utils/besondere-lohnsteuertabelle.ts`

Für Beamte, Richter, Berufssoldaten, PKV-Versicherte. **2026-fähig** via `year`-Parameter. Berechnet LSt ohne SV-basierte Vorsorgepauschale → höhere Steuerlast.

### 7.3 Sozialversicherungskonstanten 2025/2026

**Datei:** `src/constants/social-security.ts`

| Parameter | 2025 | 2026 |
|---|---|---|
| BBG RV West (jährlich) | €90.600 | €96.600 |
| BBG RV Ost (jährlich) | €89.400 | €96.600 (vereinheitlicht!) |
| BBG KV/PV (jährlich) | €62.100 | €66.150 |
| Minijob-Grenze | €556/Monat | €556/Monat |
| Midijob-Obergrenze | €2.000/Monat | €2.000/Monat |
| Gleitzonenfaktor | 0,6683 | 0,6683 |
| RV-Satz | 18,6% (9,3/9,3) | 18,6% (9,3/9,3) |
| AV-Satz | 2,6% (1,3/1,3) | 2,6% (1,3/1,3) |
| KV-Satz (Basis) | 14,6% + Zusatzbeitrag | 14,6% + Zusatzbeitrag |
| PV-Satz | 3,4% (1,7/1,7) | **3,6% (1,8/1,8)** |
| PV Kinderlose | 4,0% (2,3/1,7) | **4,2% (2,4/1,8)** |
| Grundfreibetrag | €12.096 | **€12.336** |
| Kinderfreibetrag | €6.612 | **€6.672** |

Parameterzugriff: `getYearConfig(year)` liefert alle Konstanten jahresabhängig.

### 7.4 Lohnberechnungs-Service

**Datei:** `src/utils/payroll-calculator.ts`

Orchestriert die gesamte Lohnberechnung mit:
1. Input-Validierung
2. Arbeitszeitberechnung (Ist vs. Soll)
3. Zuschlagsberechnung (Überstunden 25%, Nacht 25%, Sonntag 50%, Feiertag 100%)
4. Steuer-/SV-Berechnung via `calculateCompleteTax()`
5. **Entgeltfortzahlung (§ 3 EFZG)** – automatisch bei Krankheitstagen
6. Cent-genaue Rundung via `roundCurrency()`
7. Audit-Trail (revisionssicher)

### 7.5 Entgeltfortzahlung (§ 3 EFZG) – NEU Phase E

**Datei:** `src/utils/entgeltfortzahlung.ts`

- 42-Tage-Regel (6 Wochen) pro Krankheitsfall
- Automatische Aufteilung: EFZG-Tage (Arbeitgeber) vs. Krankengeld-Tage (Krankenkasse)
- Integration in `payroll-calculator.ts` via `sickLeave`-Parameter
- Tagesentgelt-Berechnung auf Basis der letzten 3 Monate

### 7.6 Jahresausgleich (§ 42b EStG) – NEU Phase B

**Datei:** `src/utils/annual-tax-reconciliation.ts`
**UI:** `src/components/payroll/annual-reconciliation-dialog.tsx` (integriert in `payroll-detail.tsx`)

- Vergleich Soll-LSt (Jahrestarif) vs. Ist-LSt (Summe Monatsabrechnungen)
- Erstattungs-/Nachzahlungsberechnung inkl. Soli + KiSt
- Voraussetzungsprüfung (ganzjährig beschäftigt, kein StKl-Wechsel)

### 7.7 Lohnkorrektur (§ 41c EStG) – NEU Phase B

**UI:** `src/components/payroll/payroll-correction-dialog.tsx` (integriert in `payroll-detail.tsx`)
**Persistenz:** `updatePayrollEntry()` in `src/hooks/use-supabase-payroll.ts`

- Differenzberechnung Original vs. Korrektur (Brutto, Netto, LSt, SV)
- Automatische Nachberechnung
- Korrekturzeitraum-Validierung
- **Vollständige DB-Persistenz**: Alle 30+ Felder (Tax, SV AG/AN, Brutto/Netto) werden in `payroll_entries` gespeichert
- Cache-Invalidierung nach Update für sofortige UI-Aktualisierung

### 7.8 Märzklausel – NEU Phase B

**Datei:** `src/utils/maerzklausel.ts`

- Prüfung bei Einmalzahlungen in Q1
- Vorjahreszuordnung wenn BBG überschritten
- SV-Differenzberechnung

### 7.9 ELStAM-Validierung – NEU Phase C

**Datei:** `src/utils/elstam-validation.ts`
**UI:** `src/components/employees/elstam-validation-card.tsx` (integriert in `employee-dashboard.tsx`)

- Vollständigkeits- und Plausibilitätsprüfung aller ELStAM-Merkmale
- Scoring (0-100) mit Ampelsystem
- Validierung: Steuer-ID (11 Ziffern), SV-Nummer, Steuerklasse, KV

### 7.10 GoBD-Export – NEU Phase C

**Datei:** `src/utils/gobd-export.ts`
**UI:** `src/components/reports/gobd-export-dialog.tsx`

- GDPdU-konforme index.xml Generierung
- Mitarbeiter-CSV und Lohnabrechnungs-CSV
- Revisionssichere Exportstruktur für Betriebsprüfungen

### 7.11 Tax-Params-Factory

**Datei:** `src/utils/tax-params-factory.ts`

Konvertiert `Employee`-Objekte in `TaxCalculationParams`. Zentrale Stelle für:
- Altersberechnung aus Geburtsdatum
- Ost/West-Erkennung via Bundesland
- Kirchensteuersatz-Ermittlung
- Krankenversicherungs-Zusatzbeitrag

### 7.12 Branchenmodule

| Modul | Datei | Besonderheiten |
|---|---|---|
| **Baulohn** | `src/utils/construction-payroll.ts` | SOKA-BAU-Beiträge, 13. Monatseinkommen, Wintergeld, Ost/West |
| **Gastronomie** | `src/utils/gastronomy-payroll.ts` | Sachbezugswerte Mahlzeiten (€4,13 Mittag, €2,17 Frühstück), Trinkgeld |
| **Pflege** | `src/utils/nursing-payroll.ts` | Schichtzulagen (Nacht €6/h, Sonntag 25%, Feiertag 35%), Pflegezulage |

### 7.13 Weitere Berechnungen

| Funktion | Datei | Beschreibung |
|---|---|---|
| Netto-Brutto-Umkehr | `net-to-gross-calculation.ts` | Binäre Suche (Toleranz ±0,01€) |
| Dienstwagenberechnung | `company-car-calculation.ts` | 1%/0,5%/0,25%-Regelung + Fahrtenbuch |
| bAV-Berechnung | `bav-calculation.ts` | Entgeltumwandlung + Rentenprognose |
| Sonderzahlungen | `special-payments-calculation.ts` | Krankengeld, Mutterschutz, Kurzarbeit |
| DATEV-Export | `datev-export.ts` | SKR03/SKR04, EXTF v7.0, 31-Feld-Header |
| **Fibu-Buchungslogik** | `fibu-booking.ts` | **Automatische Buchungssätze (Soll/Haben), Saldenliste, SKR03/SKR04** |
| Pfändungsberechnung | `garnishment-calculation.ts` | Pfändungsfreigrenzen |
| Mehrfachbeschäftigung | `multiple-employment.ts` | BBG-Aufteilung |
| Mutterschutzgeld | `maternity-benefit.ts` | MuSchG-Berechnung |
| Lohnkorrektur | `payroll-correction.ts` | Differenzberechnung |

---

## 8. Hooks (React Query)

| Hook | Datei | Funktion |
|---|---|---|
| `useSupabaseEmployees` | `use-supabase-employees.ts` | CRUD Mitarbeiter mit optimistischem Cache |
| `useSupabasePayroll` | `use-supabase-payroll.ts` | CRUD Abrechnungszeiträume + Einträge |
| `useTimeTracking` | `use-time-tracking.ts` | Zeiterfassung (90-Tage-Fenster) |
| `useCompliance` | `use-compliance.ts` | Compliance-Alerts |
| `useSpecialPayments` | `use-special-payments.ts` | Sonderzahlungen |
| `useCompanySettings` | `use-company-settings.ts` | Firmeneinstellungen |
| `usePayrollGuardian` | `use-payroll-guardian.ts` | Anomalie-Erkennung |
| `useTimePayrollIntegration` | `use-time-payroll-integration.ts` | Zeit → Lohn Synchronisation |
| `useIndustryPayroll` | `use-industry-payroll.ts` | Branchenspezifische Berechnung |

---

## 9. Komponenten-Übersicht

### 9.1 Layout
| Komponente | Beschreibung |
|---|---|
| `MainLayout` | Header (Navigation, Tenant-Switcher, Dark Mode, User-Info) + Footer |
| `LegalLayout` | Layout für Impressum/AGB/Datenschutz |
| `AppBreadcrumb` | Breadcrumb-Navigation mit Zurück-Button |
| `PageHeader` | Einheitlicher Seitenkopf |
| `DarkModeToggle` | Light/Dark Mode Umschalter |

### 9.2 Dashboard
| Komponente | Beschreibung |
|---|---|
| `MainDashboard` | KPI-Übersicht, Quick-Actions, Mitarbeiter-/Payroll-Zusammenfassung |

### 9.3 Mitarbeiter
| Komponente | Beschreibung |
|---|---|
| `EmployeeDashboard` | Mitarbeiterliste mit Suche/Filter + **ELStAM-Validierungskarte pro MA** |
| `EmployeeWizard` | 4-Schritt-Wizard (Persönlich → Beschäftigung → Gehalt → Benefits) |
| `EditEmployeeDialog` | Bearbeitungsdialog |
| `ELStAMValidationCard` | **ELStAM-Datenqualität (Score, Ampel, Fehlerliste)** |

### 9.4 Lohnabrechnung
| Komponente | Beschreibung |
|---|---|
| `PayrollDashboard` | Hauptansicht mit Sub-Views |
| `CreatePayrollDialog` | Abrechnungszeitraum erstellen |
| `PayrollDetail` | Detailansicht + **Jahresausgleich-Dialog + Korrektur-Dialog** |
| `PayrollJournal` | Lohnjournal |
| `ManualPayrollEntry` | Manuelle Lohnerfassung |
| `DatevExportDialog` | DATEV-Export (SKR03/SKR04) |
| `AnnualReconciliationDialog` | **§42b Jahresausgleich (Soll vs. Ist)** |
| `PayrollCorrectionDialog` | **§41c Lohnkorrektur (Differenzberechnung)** |
| `EmployeePayrollAccount` | Lohnkonto pro Mitarbeiter |
| `LohnkontoPage` | Lohnkonto-Übersicht (§41 EStG) |
| **`FibuJournalPage`** | **Fibu-Journal mit Buchungssätzen, Saldenliste, CSV-Export** |
| **`MonthlyPayrollWizard`** | **Geführter 5-Schritt-Wizard mit Auto-Run und Zusammenfassung** |
| `SpecialPaymentsManager` | Sonderzahlungen |
| `TimePayrollSync` | Zeiterfassung ↔ Lohn Synchronisation |
| `PayrollGuardianDashboard` | Anomalie-Erkennung |

### 9.5 Gehaltsrechner
| Komponente | Beschreibung |
|---|---|
| `UltimateSalaryCalculator` | Brutto-Netto mit allen Optionen |
| `CompanyCarConfigurator` | Dienstwagen-Konfigurator |
| `BavOptimizer` | bAV-Optimierer |
| `HealthInsuranceComparison` | KV-Vergleich |
| `ConstructionPayrollModule` | Baulohn |
| `GastronomyModule` | Gastronomie |
| `NursingShiftModule` | Pflege-Schichtmodell |

### 9.6 Zeiterfassung, Meldewesen, Reports, Compliance, Einstellungen
(unverändert – siehe Komponentenverzeichnis)

---

## 10. Schnittstellen & Integrationen

### 10.1 DATEV-Export
**Format:** DATEV EXTF v7.0, 31-Feld-Header (Formatkategorie 21, Version 13)
**Kontenrahmen:** SKR03 und SKR04
**Buchungssätze:** Bruttolohn → Netto → LSt → SolZ → KiSt → RV → KV → AV → PV

### 10.2 Fibu-Buchungslogik (NEU)
**Datei:** `src/utils/fibu-booking.ts`
**UI:** `src/components/payroll/fibu-journal.tsx`
- Automatische Buchungssatz-Generierung (Soll/Haben) aus jeder Lohnabrechnung
- Kontenrahmen SKR03 und SKR04 mit vollständiger Kontenbezeichnung
- Buchungsschema: Brutto → Netto (Verb. Löhne) + LSt/Soli/KiSt (Verb. Finanzamt) + SV AN/AG (Verb. SV)
- **Saldenliste** pro Konto (Soll/Haben/Saldo mit Differenzprüfung)
- CSV-Export der Buchungssätze
- Kategoriefilter (Gehalt, Steuer, SV, AG-SV, Nettolohn)

### 10.3 GoBD-Export
**Format:** GDPdU-konforme index.xml + CSV-Dateien
**Zweck:** Betriebsprüfung durch Finanzamt
**Inhalt:** Mitarbeiterstammdaten + Lohnabrechnungsdaten + Prüf-Metadaten

### 10.4 Geführter Monats-Wizard (NEU)
**Datei:** `src/components/payroll/monthly-payroll-wizard.tsx`
- 5-Schritt-Wizard: Zeiterfassung → Sonderzahlungen → Abrechnung → Meldungen → Export
- **Auto-Run-Modus**: Alle Schritte automatisch, stoppt nur bei Auffälligkeiten
- **Zusammenfassungsseite**: Kosten, Steuern, SV-Beiträge vor Freigabe

### 10.5 ELSTER (UI-Vorbereitung)
Oberfläche für zukünftige API-Anbindung an ELSTER (Finanzamt), SV-Meldestelle und BA.

---

## 11. Typsystem (TypeScript-Definitionen)

| Datei | Typen |
|---|---|
| `src/types/employee.ts` | `Employee`, `PersonalData`, `EmploymentData`, `SalaryData`, `Address`, `HealthInsurance`, `BankingData`, `TaxClass`, `EmploymentType`, `SalaryType`, `RelationshipStatus` |
| `src/types/payroll.ts` | `PayrollPeriod`, `PayrollEntry`, `WorkingTimeData`, `Deductions`, `Additions`, `PayrollSummary`, `PayrollReport`, `PayrollStatus` |
| `src/types/time-tracking.ts` | `TimeEntry`, `AbsenceType` |
| `src/types/compliance.ts` | `ComplianceAlert`, `ComplianceSeverity` |
| `src/types/special-payments.ts` | `SpecialPayment`, `PaymentType` |
| `src/types/payroll-guardian.ts` | `Anomaly`, `GuardianHistory` |
| `src/types/autolohn.ts` | `AutolohnSettings`, `CompanyData` |

---

## 12. Validierung

**Datei:** `src/lib/validations/employee.ts` (Zod-Schemas)

Validiert: Pflichtfelder, Formate (Steuer-ID, SV-Nummer, IBAN), Logik (Eintrittsdatum, Minijob-Grenze)

**Datei:** `src/lib/validations/german-checksums.ts` – Prüfziffern für Steuer-ID und SV-Nummer

---

## 13. Tests (571 Tests, 26 Suites)

| Test-Suite | Datei | Inhalt |
|---|---|---|
| **BMF-Referenz PAP 2025** | `bmf-reference-tax.test.ts` | § 32a EStG Tarifformel, Zonenübergänge, Monotonie, StKl-Ordnung |
| **Golden-Master 2026** | `golden-master-2026.test.ts` | 2026-Referenzfälle (StKl I-VI, Minijob, Midijob, Hochverdiener), Invarianten |
| **Golden-Master** | `golden-master-payroll.test.ts` | 10 manuell verifizierte Referenzdatensätze (Toleranz ±0,01€) |
| **E2E Flow** | `e2e-payroll-flow.test.ts` | Kompletter Flow: ELStAM → Steuer/SV → Märzklausel → LStA → GoBD |
| **Property-Based** | `property-based-payroll.test.ts` | Invarianten (Netto < Brutto, keine negativen Werte) |
| **Edge-Cases** | `edge-cases.test.ts` | Randfälle (0€, Max-BBG, StKl VI) |
| **Tax-Calculation** | `tax-calculation.test.ts` | Steuerberechnung alle StKl |
| **Tax-Params-Factory** | `tax-params-factory.test.ts` | Employee → TaxParams Konvertierung |
| **Social-Security** | `social-security.test.ts` | SV-Berechnung mit BBG |
| **Special-Payments** | `special-payments.test.ts` | Sonderzahlungen |
| **Märzklausel** | `maerzklausel.test.ts` | Vorjahreszuordnung bei Einmalzahlungen in Q1 |
| **Entgeltfortzahlung** | `entgeltfortzahlung.test.ts` | 42-Tage-Regel, Krankengeld-Übergang |
| **ELStAM-Validierung** | `elstam-validation.test.ts` | Vollständigkeits- und Plausibilitätsprüfung |
| **GoBD-Export** | `gobd-export.test.ts` | GDPdU-XML, CSV-Generierung |
| **DATEV-Export** | `datev-export.test.ts` | EXTF v7.0, SKR03/SKR04 |
| **Jahresausgleich** | `annual-tax-reconciliation.test.ts` | § 42b EStG Soll/Ist-Vergleich |
| **Construction** | `construction-payroll.test.ts` | SOKA-BAU |
| **Gastronomy** | `gastronomy-payroll.test.ts` | Sachbezüge |
| **Nursing** | `nursing-payroll.test.ts` | SFN-Zuschläge |
| **Integration** | `payroll-integration.test.ts` | E2E Lohnberechnung |
| **Formatters** | `formatters.test.ts` | Rundung/Formatierung |
| **Employee Validation** | `employee.test.ts`, `employee-extended.test.ts` | Eingabevalidierung |
| **German Checksums** | `german-checksums.test.ts` | Steuer-ID und SV-Prüfziffern |
| **Supabase Mappers** | `use-supabase-mappers.test.ts` | DB ↔ App Mapping |
| **Industry Payroll** | `use-industry-payroll.test.ts` | Branchenberechnung |

**Test-Framework:** Vitest + fast-check (Property-Based)

---

## 14. Abhängigkeiten (npm)

### Kern
- `react`, `react-dom` (18.x), `react-router-dom` (6.x)
- `@tanstack/react-query`, `@supabase/supabase-js`
- `typescript` (5.x)

### UI
- `tailwindcss` (3.x), `@radix-ui/*` (shadcn/ui), `lucide-react`, `recharts`
- `date-fns`, `react-helmet-async`, `sonner`

### Validierung & Test
- `zod`, `vitest`, `fast-check`

---

## 15. Datenflüsse & Verknüpfungen

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Employee    │────▶│  Payroll     │────▶│  DATEV Export    │
│  (Stammdaten)│     │  (Abrechnung)│     │  (SKR03/04)     │
│  + ELStAM   │     │  + EFZG      │     │  + GoBD Export   │
└──────┬──────┘     │  + §42b/§41c │     │  + Fibu-Journal  │
       │            └──────┬───────┘     └─────────────────┘
       │                   │
       │                   ├────▶ Fibu (Buchungssätze, Saldenliste)
       │                   │
       │                   ├────▶ Meldewesen (SV, eLStB, BN)
       │                   │
       │                   ├────▶ Reports (Journal, Kosten)
       │                   │
       │                   ├────▶ Märzklausel (Q1-Prüfung)
       │                   │
       │                   └────▶ Payroll Guardian (Anomalien)
       │
       ├────▶ TimeTracking ──▶ TimePayrollSync ──▶ Payroll
       │
       ├────▶ SpecialPayments (Krankengeld, Mutterschutz)
       │
       └────▶ Compliance (Vertragsprüfungen, Fristen)

Monats-Wizard (Auto-Run) ──▶ Zeit → Sonderzahlungen → Abrechnung → Meldungen → Export

Auth ──▶ Tenant ──▶ RLS (Datenisolation auf allen 18 Tabellen)
```

---

## 16. Hinweise für die Integration als SubApp

### 16.1 Voraussetzungen im Hauptsystem
1. **Supabase/Lovable Cloud**: Eigene Instanz mit identischem DB-Schema
2. **Auth-System**: Kompatibles Auth (Supabase Auth oder Adapter)
3. **Tenant-Konzept**: `tenant_id` muss vom Hauptsystem bereitgestellt werden
4. **React Query**: `QueryClientProvider` muss vorhanden sein

### 16.2 Integrationspunkte
1. **Auth-Kontext**: `AuthProvider` muss den User + Rollen bereitstellen
2. **Tenant-Kontext**: `TenantProvider` muss `tenantId` liefern
3. **Supabase-Client**: `src/integrations/supabase/client.ts` (automatisch generiert)
4. **Routing**: Alle Routen mit Prefix versehen (z.B. `/lohnpro/dashboard`)
5. **Layout**: `MainLayout` kann durch das Hauptsystem-Layout ersetzt werden

### 16.3 Zu migrierende Dateien

```
src/
├── types/           → Alle Typdefinitionen (1:1 kopieren)
├── constants/       → social-security.ts (2025+2026 Konstanten)
├── utils/           → Alle Berechnungslogik (1:1 kopieren)
│   ├── tax-calculation.ts          (PAP 2025/2026)
│   ├── besondere-lohnsteuertabelle.ts (2025/2026)
│   ├── payroll-calculator.ts       (inkl. EFZG)
│   ├── entgeltfortzahlung.ts       (§ 3 EFZG)
│   ├── annual-tax-reconciliation.ts (§ 42b EStG)
│   ├── maerzklausel.ts             (Q1-Prüfung)
│   ├── elstam-validation.ts        (Datenqualität)
│   ├── gobd-export.ts              (Betriebsprüfung)
│   ├── datev-export.ts             (EXTF v7.0)
│   ├── fibu-booking.ts             (Buchungssätze + Saldenliste)
│   └── ... (alle weiteren Utils)
├── lib/             → formatters.ts, validations/, query-keys.ts
├── hooks/           → Alle Hooks (Supabase-Queries)
├── contexts/        → auth-context, tenant-context, employee-context
├── components/      → Alle UI-Komponenten
├── pages/           → Alle Seiten
└── integrations/    → supabase/client.ts (wird automatisch generiert)
```

### 16.4 DB-Migration
Alle SQL-Migrationen aus `supabase/migrations/` in der richtigen Reihenfolge ausführen.

### 16.5 Kritische Dateien (nicht ändern!)
- `src/constants/social-security.ts` – SV-Sätze + Tarifparameter 2025/2026
- `src/utils/tax-calculation.ts` – PAP-Steuerberechnung (formelbasiert)
- `src/utils/besondere-lohnsteuertabelle.ts` – Besondere LSt (2025/2026)
- `src/utils/payroll-calculator.ts` – Lohnberechnungs-Orchestrator (inkl. EFZG)

---

## 17. Versionierung & Jahreswechsel

**Datei:** `src/constants/ANNUAL_UPDATE_CHECKLIST.md`

Jährlich zu aktualisieren:
- [ ] Beitragsbemessungsgrenzen (BBG) in `social-security.ts`
- [ ] Tarifparameter (§ 32a EStG Zonenformel) in `social-security.ts`
- [ ] Grundfreibetrag und Kinderfreibetrag
- [ ] Sozialversicherungsbeitragssätze (insb. PV)
- [ ] Minijob-/Midijob-Grenzwerte
- [ ] Solidaritätszuschlag-Freigrenze
- [ ] Sachbezugswerte (Gastronomie)
- [ ] PV-Kinderabschläge (PUEG)
- [ ] Neue `YEAR_CONFIG` in `getYearConfig()` registrieren

---

## 18. Qualitätssicherung

| Kriterium | Status |
|---|---|
| PAP-formelbasierte Steuerberechnung | ✅ 2025 + 2026 |
| BMF-Referenzwerte validiert | ✅ 24+ Tariftests |
| Golden-Master-Referenzabrechnungen | ✅ 10 (2025) + 7 (2026) |
| Property-Based Testing | ✅ Invarianten gesichert |
| E2E-Integrationstests | ✅ Kompletter Flow |
| Security-Audit (RLS) | ✅ 18 Tabellen, 0 Findings |
| Multi-Tenant-Isolation | ✅ Getestet |
| Audit-Trail (manipulationssicher) | ✅ DB-Trigger only |
| DSGVO-Konformität | ✅ Lösch-/Export-/Berichtigungsanfragen |
| Besondere Lohnsteuertabelle | ✅ 2025 + 2026 |
| Entgeltfortzahlung | ✅ 42-Tage-Regel |
| Jahresausgleich (§42b) | ✅ UI + Berechnung |
| Lohnkorrektur (§41c) | ✅ UI + Differenzberechnung + **DB-Persistenz** |
| GoBD-Export | ✅ Betriebsprüfungsfähig |
| ELStAM-Validierung | ✅ Score + Ampel |
| Fibu-Buchungslogik | ✅ Soll/Haben, Saldenliste, SKR03/SKR04 |
| Monats-Wizard (Auto-Run) | ✅ 5 Schritte + Zusammenfassung |
| Rollen-Zuweisung bei Registrierung | ✅ Jeder neue User = Admin im eigenen Tenant |
| Lohnkorrektur DB-Persistenz | ✅ `updatePayrollEntry()` vollständig implementiert |

---

### Letzte Änderungen (14. April 2026)

| Änderung | Beschreibung | Status |
|---|---|---|
| **Fibu-Buchungslogik** | Automatische Buchungssätze (Soll/Haben) aus Lohnabrechnungen, SKR03/SKR04, Saldenliste, CSV-Export | ✅ |
| **Monats-Wizard** | 5-Schritt-Wizard (Zeit → Sonderzahlungen → Abrechnung → Meldungen → Export) mit Auto-Run und Zusammenfassung | ✅ |
| `assign_default_role()` | Neue Benutzer erhalten immer `admin` in ihrem eigenen Tenant | ✅ |
| `updatePayrollEntry()` | Lohnkorrekturen vollständig in DB persistiert (30+ Felder) | ✅ |
| Payroll-Dashboard Refactoring | In 4 Sub-Komponenten aufgeteilt (QuickActions, StatsCards, PeriodsList, SubViewWrapper) | ✅ |
| FK-Constraints | Alle Fremdschlüssel auf `ON DELETE CASCADE` migriert | ✅ |
| Onboarding-Wizard | 3-Schritt-Wizard für neue Benutzer (Firmendaten, erster MA) | ✅ |
| Error-Handling | `NetworkErrorAlert` in Employee- und Payroll-Dashboard | ✅ |
| E-Mail-Bestätigung | Auth-Konfiguration für sichere Registrierung | ✅ |

---

## 19. SYSTAX-Integration

### Im Hauptsystem vorhanden (nicht in LohnPro nötig)
- **ELSTER** – Elektronische Steuermeldungen an Finanzamt
- **finAPI** – Bankanbindung für SEPA-Überweisungen
- **DMS** – Dokumentenmanagement und Archivierung

### Von LohnPro bereitgestellte Schnittstellen-Daten
- Meldewesen-Daten (SV-Meldungen, LStA, eLStB, Beitragsnachweise) → ELSTER
- Auszahlungsbeträge (Netto pro Mitarbeiter) → finAPI
- DATEV-Export (EXTF v7.0) → Buchhaltung
- **Fibu-Buchungssätze (Soll/Haben, SKR03/SKR04)** → Buchhaltung
- GoBD-Export → Betriebsprüfung

### Integrationspunkte
1. **Auth**: `AuthProvider` → SYSTAX Auth-System adaptieren
2. **Tenant**: `TenantProvider` → SYSTAX Mandantenverwaltung
3. **Routing**: Alle Routen mit Prefix (z.B. `/lohnpro/...`)
4. **Layout**: `MainLayout` durch SYSTAX-Layout ersetzen

---

## 14. Ablösung des SYSTAX-Lohnmoduls (Cutover-Plan)

> **Kernsatz:** LohnPro **ersetzt** das bestehende SYSTAX-Lohnmodul vollständig — es koexistiert nicht.

Der detaillierte Cutover-/Migrations-Plan ist in einem eigenen Dokument
beschrieben: [`SYSTAX-INTEGRATION-GUIDE.md`](./SYSTAX-INTEGRATION-GUIDE.md)

Kurzfassung der Übernahme-Schritte:

1. **Code-Übernahme**
   - `src/payroll-core/` → reine Berechnungs-Bibliothek (`PAYROLL_CORE_VERSION = "2026.1.0"`)
   - `src/standalone/lohnpro/` → mountbare Sub-App (`<StandaloneLohnProApp basePath="/lohn" useHostProviders />`)
2. **Datenmigration** alter Lohn-Daten via `src/utils/systax-legacy-migration.ts` (Stub mit definierter Schnittstelle)
3. **Routen-Cutover** `/payroll` → `/lohn/payroll` (mit 301-Redirects)
4. **Abschaltung** des alten SYSTAX-Lohnmoduls nach 7-Tage-Pilotbeobachtung
5. **Code-Cleanup** im SYSTAX-Repo (siehe „Konflikt-Liste" im Integration Guide)

### 14.1 Compatibility Matrix

| LohnPro Version | Ersetzt SYSTAX-Lohnmodul | Berechnungsstand     | Tests |
|-----------------|--------------------------|----------------------|-------|
| **2026.1.0**    | ja (alle Versionen)      | PAP 2025 + 2026      | 571   |

### 14.2 Provider-Übernahme

Im Standalone-Modus mountet LohnPro eigene Provider (Auth/Tenant/Theme/Query).
Im SYSTAX-Modus (`useHostProviders={true}`) übernimmt das Hauptsystem diese
Verantwortung — siehe Provider-Diff in §7 des Integration Guides.

### 14.3 Datenbank

LohnPro liefert das **führende** Schema (18 Tabellen). SYSTAX-Tabellen, die
mandanten-/auth-bezogen sind (`tenants`, `tenant_members`, `user_roles`,
`profiles`), werden vom Hauptsystem übernommen — die LohnPro-Variante wird
nicht migriert. Lohn-spezifische Tabellen (`payroll_*`, `lohnsteuer*`,
`sv_meldungen`, `compliance_alerts`, etc.) werden neu angelegt bzw. via
Migrations-Skript aus dem Altsystem überführt.

---

*Aktualisiert am: 14. April 2026*  
*LohnPro Version: Phase G – ✅ ÜBERGABEFERTIG AN SYSTAX (inkl. Fibu + Monats-Wizard)*  
*Berechnungsstand: Steuer- und SV-Sätze 2025 + 2026*  
*Tests: 571 bestanden, 26 Suites, 0 Fehler*  
*ELSTER + finAPI + DMS: Bestandteil des SYSTAX-Hauptsystems*
