# LohnPro – Vollständige SubApp-Spezifikation

> **Zweck:** Dieses Dokument beschreibt die komplette Funktionalität, Datenstrukturen, Berechnungslogik und Schnittstellen der LohnPro-App. Es dient als Blaupause für eine 1:1-Integration als SubApp in ein übergeordnetes Hauptsystem (Lovable-Projekt).

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
| **Berechnungsstand** | Steuer- und SV-Sätze 2025 |

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
| `/employees` | `Employees.tsx` | `EmployeeDashboard` |
| `/payroll` | `Payroll.tsx` | `PayrollDashboard` |
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

### 4.3 Zeiterfassung

#### `time_entries`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `employee_id` | UUID FK → employees | |
| `tenant_id` | UUID FK → tenants | |
| `date` | date | Arbeitstag |
| `start_time`, `end_time` | text | Beginn/Ende |
| `break_time` | numeric | Pause (Minuten) |
| `hours_worked` | numeric | Gearbeitete Stunden |
| `type` | text | work/vacation/sick/holiday |
| `notes` | text | |

### 4.4 Meldewesen (DEÜV)

#### `sv_meldungen`
Sozialversicherungsmeldungen.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `employee_id` | UUID FK → employees | |
| `meldegrund` | text | Anmeldung/Abmeldung/Jahresmeldung etc. |
| `meldegrund_schluessel` | text | DEÜV-Schlüssel (z.B. 10, 30) |
| `zeitraum_von`, `zeitraum_bis` | date | Meldezeitraum |
| `krankenkasse` | text | Empfangende KK |
| `betriebsnummer_kk` | text | Betriebsnummer der KK |
| `personengruppe` | text | Default '101' |
| `beitragsgruppe` | text | z.B. '1111' |
| `sv_brutto` | numeric | SV-pflichtiges Brutto |
| `status` | text | entwurf/gemeldet/bestaetigt/storniert |
| `storniert_am`, `storno_grund` | date/text | Storno-Daten |

#### `beitragsnachweise`
Monatliche Beitragsnachweise an Krankenkassen.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `year`, `month` | integer | Zeitraum |
| `krankenkasse` | text | KK-Name |
| `betriebsnummer_kk` | text | |
| `anzahl_versicherte` | integer | |
| `kv_an/ag`, `rv_an/ag`, `av_an/ag`, `pv_an/ag` | numeric | Beiträge AN/AG |
| `kv_zusatzbeitrag_an/ag` | numeric | KV-Zusatzbeitrag |
| `pv_kinderlose_zuschlag` | numeric | PV-Zuschlag Kinderlose |
| `umlage_u1`, `umlage_u2`, `insolvenzgeldumlage` | numeric | Umlagen |
| `gesamtbetrag` | numeric | Summe |
| `faelligkeitsdatum` | date | |
| `status` | text | entwurf/eingereicht/bestaetigt |

#### `lohnsteuerbescheinigungen`
Elektronische Lohnsteuerbescheinigungen (eLStB).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `employee_id` | UUID FK → employees | |
| `year` | integer | Steuerjahr |
| `steuerklasse` | text | |
| `kinderfreibetraege` | numeric | |
| `religion` | text | |
| `zeitraum_von`, `zeitraum_bis` | date | |
| `zeile_3_bruttolohn` | numeric | Bruttoarbeitslohn |
| `zeile_4_lst` | numeric | Lohnsteuer |
| `zeile_5_soli` | numeric | Solidaritätszuschlag |
| `zeile_6_kist` | numeric | Kirchensteuer |
| `zeile_22a/b` bis `zeile_26` | numeric | SV-Beiträge AN/AG |
| `status` | text | entwurf/uebermittelt |
| `transfer_ticket` | text | ELSTER-Transferticket |

### 4.5 Weitere Tabellen

#### `compliance_alerts`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `tenant_id`, `employee_id` | UUID | |
| `type`, `title`, `message` | text | Alert-Daten |
| `severity` | text | low/medium/high/critical |
| `is_read`, `is_resolved` | boolean | Status |
| `due_date` | date | Fälligkeitsdatum |

#### `special_payments`
Sonderzahlungen (Krankengeld, Mutterschutz, Kurzarbeit).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `employee_id`, `tenant_id` | UUID | |
| `payment_type` | text | sickPay/maternityLeave/shortTimeWork |
| `start_date`, `end_date` | date | Zeitraum |
| `total_amount` | numeric | Gesamtbetrag |
| `status` | text | active/completed/cancelled |
| `details` | jsonb | Berechnungsdetails |

#### `payroll_guardian_anomalies` / `payroll_guardian_history`
Anomalie-Erkennung und Gehaltshistorie für Plausibilitätsprüfungen.

#### `gdpr_requests`
DSGVO-Anfragen (Auskunft, Löschung, Berichtigung).

#### `company_settings`
Firmeneinstellungen pro Tenant.

#### `audit_log`
Manipulationssicheres Audit-Log (nur INSERT via DB-Trigger).

#### `contact_messages`
Kontaktformular-Nachrichten.

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
-- Prüft Tenant-Mitgliedschaft (verhindert RLS-Rekursion)
is_tenant_member(_user_id uuid, _tenant_id uuid) → boolean

-- Prüft Rolle im Tenant
has_role_in_tenant(_user_id uuid, _role app_role, _tenant_id uuid) → boolean

-- Prüft globale Rolle
has_role(_user_id uuid, _role app_role) → boolean

-- Ermittelt Standard-Tenant
get_default_tenant(_user_id uuid) → uuid
```

### 5.3 Sonderfälle
- **audit_log**: INSERT/UPDATE/DELETE blockiert für Client (nur Trigger)
- **contact_messages**: INSERT für `anon`+`authenticated` (Kontaktformular), SELECT/UPDATE nur für Admins
- **profiles**: INSERT/UPDATE nur eigenes Profil, SELECT über Tenant-Sharing

---

## 6. DB-Trigger & Funktionen

| Trigger/Funktion | Tabelle | Beschreibung |
|---|---|---|
| `handle_new_user()` | `auth.users` → `profiles` | Erstellt Profil bei Registrierung |
| `assign_default_role()` | `auth.users` → `user_roles` + `tenants` + `tenant_members` | Erstellt Tenant + weist Rolle zu (erster User → admin, weitere → leserecht) |
| `auto_create_tenant_for_new_user()` | `auth.users` | Legacy-Trigger für Tenant-Erstellung |
| `generate_personal_number()` | `employees` | Generiert Personalnummer ab 1001 pro Tenant |
| `audit_trigger_func()` | Diverse | Schreibt Audit-Log bei INSERT/UPDATE/DELETE |
| `update_updated_at_column()` | Diverse | Aktualisiert `updated_at` Timestamp |

---

## 7. Berechnungslogik

### 7.1 Steuerberechnung (§ 32a EStG 2025)

**Datei:** `src/utils/tax-calculation.ts` (472 Zeilen)

#### Eingabeparameter (`TaxCalculationParams`)
```typescript
{
  grossSalaryYearly: number;       // Jahresbrutto
  taxClass: string;                // 'I' bis 'VI'
  childAllowances: number;         // Kinderfreibeträge
  churchTax: boolean;              // Kirchensteuerpflichtig
  churchTaxRate: number;           // 8% oder 9%
  healthInsuranceRate: number;     // KV-Zusatzbeitrag
  isEastGermany: boolean;          // Ost/West (für BBG)
  isChildless: boolean;            // Kinderlos (für PV-Zuschlag)
  age: number;                     // Alter (für PV)
  employmentType?: string;         // minijob/midijob/fulltime/parttime
  useBesondereLohnsteuertabelle?: boolean;  // Für Beamte/PKV
  privateHealthInsuranceMonthly?: number;   // PKV-Basisbeitrag
  privateCareInsuranceMonthly?: number;     // PPV-Beitrag
}
```

#### Ausgabe (`TaxCalculationResult`)
```typescript
{
  grossYearly, grossMonthly,
  taxableIncome,
  incomeTax, solidarityTax, churchTax,
  pensionInsurance, unemploymentInsurance, healthInsurance, careInsurance,
  pensionInsuranceEmployer, unemploymentInsuranceEmployer,
  healthInsuranceEmployer, careInsuranceEmployer,
  totalDeductions, netMonthly, netYearly,
  totalEmployerCosts, employerCostMonthly,
}
```

#### Berechnungsschritte
1. **Minijob-Sonderbehandlung** (≤ 556€): 2% Pauschalsteuer, keine SV-Abzüge AN
2. **Midijob-Gleitzone** (556,01€ – 2.000€): Reduziertes SV-Brutto via Gleitzonenformel (Faktor 0,6683)
3. **Lohnsteuer**: Lookup in `WAGE_TAX_TABLE_2025` (7.000+ Einträge) nach Monatsbrutto und Steuerklasse
4. **Solidaritätszuschlag**: 5,5% der LSt, Freigrenze €19.950/Jahr (€1.662,50/Monat)
5. **Kirchensteuer**: LSt × KiSt-Satz (8% BW/BY, 9% andere)
6. **Rentenversicherung**: 9,3% AN, 9,3% AG (BBG West: €7.550, Ost: €7.450/Monat)
7. **Krankenversicherung**: 7,3% + Zusatzbeitrag/2 AN, 7,3% + Zusatzbeitrag/2 AG (BBG: €5.175/Monat)
8. **Arbeitslosenversicherung**: 1,3% AN, 1,3% AG
9. **Pflegeversicherung**: 1,7% AN (2,4% wenn kinderlos >23J), 1,7% AG

#### Besondere Lohnsteuertabelle
**Datei:** `src/utils/besondere-lohnsteuertabelle.ts`

Für Beamte, Richter, Berufssoldaten, PKV-Versicherte. Berechnet LSt **ohne** Vorsorgepauschale → höhere Steuerlast.

### 7.2 Sozialversicherungskonstanten 2025

**Datei:** `src/constants/social-security.ts` (7.922 Zeilen, inkl. Lohnsteuertabelle)

| Konstante | Wert |
|---|---|
| BBG RV West (jährlich) | €90.600 |
| BBG RV Ost (jährlich) | €89.400 |
| BBG KV/PV (jährlich) | €62.100 |
| Minijob-Grenze | €556/Monat |
| Midijob-Obergrenze | €2.000/Monat |
| Gleitzonenfaktor | 0,6683 |
| RV-Satz | 18,6% (9,3/9,3) |
| AV-Satz | 2,6% (1,3/1,3) |
| KV-Satz | 14,6% + Zusatzbeitrag |
| PV-Satz | 3,4% (1,7/1,7), kinderlos: 4,0% (2,4/1,6) |

### 7.3 Lohnberechnungs-Service

**Datei:** `src/utils/payroll-calculator.ts` (452 Zeilen)

Orchestriert die gesamte Lohnberechnung mit:
1. Input-Validierung
2. Arbeitszeitberechnung (Ist vs. Soll)
3. Zuschlagsberechnung (Überstunden 25%, Nacht 25%, Sonntag 50%, Feiertag 100%)
4. Steuer-/SV-Berechnung via `calculateCompleteTax()`
5. Cent-genaue Rundung via `roundCurrency()`
6. Audit-Trail (revisionssicher)

### 7.4 Tax-Params-Factory

**Datei:** `src/utils/tax-params-factory.ts`

Konvertiert `Employee`-Objekte in `TaxCalculationParams`. Zentrale Stelle für:
- Altersberechnung aus Geburtsdatum
- Ost/West-Erkennung via Bundesland
- Kirchensteuersatz-Ermittlung
- Krankenversicherungs-Zusatzbeitrag

### 7.5 Branchenmodule

| Modul | Datei | Besonderheiten |
|---|---|---|
| **Baulohn** | `src/utils/construction-payroll.ts` | SOKA-BAU-Beiträge, 13. Monatseinkommen, Wintergeld, Ost/West-Differenzierung |
| **Gastronomie** | `src/utils/gastronomy-payroll.ts` | Sachbezugswerte für Mahlzeiten (€4,40 Mittag, €2,17 Frühstück), Trinkgeld-Behandlung |
| **Pflege** | `src/utils/nursing-payroll.ts` | Schichtzulagen (Nacht €6/h, Sonntag 25%, Feiertag 35%), Pflegezulage |

### 7.6 Weitere Berechnungen

| Funktion | Datei | Beschreibung |
|---|---|---|
| Netto-Brutto-Umkehr | `src/utils/net-to-gross-calculation.ts` | Binäre Suche (Toleranz ±0,01€) |
| Dienstwagenberechnung | `src/utils/company-car-calculation.ts` | 1%/0,5%/0,25%-Regelung + Fahrtenbuch |
| bAV-Berechnung | `src/utils/bav-calculation.ts` | Entgeltumwandlung + Rentenprognose |
| Sonderzahlungen | `src/utils/special-payments-calculation.ts` | Krankengeld, Mutterschutz, Kurzarbeit |
| DATEV-Export | `src/utils/datev-export.ts` | SKR03/SKR04 Buchungssätze, ASCII-Format v7.0 |
| Gehalts-Benchmarking | `src/utils/salary-benchmarking.ts` | Marktvergleich |
| Gehalts-Prognose | `src/utils/salary-forecast.ts` | Gehaltsentwicklung |
| KV-Vergleich | `src/utils/health-insurance-comparison.ts` | Krankenkassen-Vergleichsrechner |
| Anomalie-Erkennung | `src/utils/anomaly-detection.ts` | Payroll Guardian |

---

## 8. Hooks (React Query)

| Hook | Datei | Funktion |
|---|---|---|
| `useSupabaseEmployees` | `src/hooks/use-supabase-employees.ts` | CRUD Mitarbeiter mit optimistischem Cache |
| `useSupabasePayroll` | `src/hooks/use-supabase-payroll.ts` | CRUD Abrechnungszeiträume + Einträge |
| `useTimeTracking` | `src/hooks/use-time-tracking.ts` | Zeiterfassung (90-Tage-Fenster) |
| `useCompliance` | `src/hooks/use-compliance.ts` | Compliance-Alerts |
| `useSpecialPayments` | `src/hooks/use-special-payments.ts` | Sonderzahlungen |
| `useCompanySettings` | `src/hooks/use-company-settings.ts` | Firmeneinstellungen |
| `usePayrollGuardian` | `src/hooks/use-payroll-guardian.ts` | Anomalie-Erkennung |
| `useTimePayrollIntegration` | `src/hooks/use-time-payroll-integration.ts` | Zeit → Lohn Synchronisation |
| `useIndustryPayroll` | `src/hooks/use-industry-payroll.ts` | Branchenspezifische Berechnung |

### Query Keys (Cache-Invalidierung)
```typescript
queryKeys = {
  employees: { all: (tenantId) => ['employees', tenantId] },
  payroll: {
    periods: (tenantId) => ['payroll-periods', tenantId],
    entries: (tenantId) => ['payroll-entries', tenantId],
  },
  timeEntries: { all: (tenantId) => ['time-entries', tenantId] },
  compliance: { alerts: (tenantId) => ['compliance-alerts', tenantId] },
  specialPayments: { all: (tenantId) => ['special-payments', tenantId] },
  contactMessages: { all: () => ['contact-messages'] },
}
```

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
| `EmployeeDashboard` | Mitarbeiterliste mit Suche/Filter |
| `EmployeeWizard` | 4-Schritt-Wizard (Persönlich → Beschäftigung → Gehalt → Benefits) |
| `EditEmployeeDialog` | Bearbeitungsdialog |
| `PersonalDataStep` | Wizard-Schritt: Persönliche Daten |
| `EmploymentDataStep` | Wizard-Schritt: Beschäftigungsdaten |
| `SalaryDataStep` | Wizard-Schritt: Gehaltsdaten |
| `BenefitsDataStep` | Wizard-Schritt: Zusatzleistungen |

### 9.4 Lohnabrechnung
| Komponente | Beschreibung |
|---|---|
| `PayrollDashboard` | Hauptansicht mit Sub-Views |
| `CreatePayrollDialog` | Abrechnungszeitraum erstellen |
| `PayrollDetail` | Detailansicht einer Abrechnung |
| `PayrollJournal` | Lohnjournal |
| `ManualPayrollEntry` | Manuelle Lohnerfassung |
| `DatevExportDialog` | DATEV-Export (SKR03/SKR04) |
| `EmployeePayrollAccount` | Lohnkonto pro Mitarbeiter |
| `LohnkontoPage` | Lohnkonto-Übersicht (§41 EStG) |
| `TaxCalculationSettings` | Steuerberechnungseinstellungen |
| `SpecialPaymentsManager` | Sonderzahlungen |
| `TimePayrollSync` | Zeiterfassung ↔ Lohn Synchronisation |
| `PayrollGuardianDashboard` | Anomalie-Erkennung |

### 9.5 Gehaltsrechner
| Komponente | Beschreibung |
|---|---|
| `UltimateSalaryCalculator` | Brutto-Netto mit allen Optionen |
| `SalaryCalculator` | Standard-Rechner |
| `CompanyCarConfigurator` | Dienstwagen-Konfigurator |
| `BavOptimizer` | bAV-Optimierer |
| `HealthInsuranceComparison` | KV-Vergleich |
| `ConstructionPayrollModule` | Baulohn |
| `GastronomyModule` | Gastronomie |
| `NursingShiftModule` | Pflege-Schichtmodell |
| `SalaryCurveChart` | Gehaltskurve |
| `SalaryInsights` | Gehalts-Insights |
| `OptimizationTips` | Optimierungstipps |

### 9.6 Zeiterfassung
| Komponente | Beschreibung |
|---|---|
| `TimeTrackingDashboard` | Zeiterfassung mit Kalender |
| `EmployeeCalendar` | Kalenderansicht |
| `BulkEntryDialog` | Massenerfassung |
| `EmployeeStatusIndicator` | Anwesenheitsstatus |

### 9.7 Meldewesen
| Komponente | Beschreibung |
|---|---|
| `SvMeldungenPage` | SV-Meldungen (DEÜV) |
| `BeitragsnachweisPage` | Beitragsnachweise |
| `LohnsteuerbescheinigungPage` | eLStB |

### 9.8 Reports & Compliance
| Komponente | Beschreibung |
|---|---|
| `AdvancedReports` | Report-Hub |
| `PayrollCostOverviewReport` | Personalkostenübersicht |
| `SickLeaveVacationReport` | Krankheits-/Urlaubsstatistik |
| `TaxSocialSecurityReport` | Steuer- und SV-Report |
| `EmployeeStatisticsReport` | Mitarbeiterstatistik |
| `AuditReport` | Audit-Report |
| `EmployeeReports` | Mitarbeiterberichte |
| `ExportManager` | Export-Manager |
| `ComplianceDashboard` | Compliance-Übersicht |
| `ComplianceAlerts` | Compliance-Warnungen |

### 9.9 Einstellungen
| Komponente | Beschreibung |
|---|---|
| `CompanySettingsPage` | Firmeneinstellungen |
| `AdminUsersPage` | Benutzerverwaltung |
| `GdprManagementPage` | DSGVO-Verwaltung |
| `ContactMessagesPage` | Kontaktnachrichten (Admin) |
| `TenantSwitcher` | Mandantenwechsler |

---

## 10. Schnittstellen & Integrationen

### 10.1 DATEV-Export
**Datei:** `src/utils/datev-export.ts`

| Eigenschaft | Wert |
|---|---|
| Format | DATEV ASCII v7.0 |
| Kontenrahmen | SKR03 und SKR04 |
| Buchungssätze | Bruttolohn → Netto → LSt → SolZ → KiSt → RV → KV → AV → PV |
| Konfiguration | Berater-Nr., Mandanten-Nr., WJ-Beginn |

**SKR03 Konten:**
- 4100/4110: Löhne/Gehälter
- 4130: Soziale Abgaben AG
- 1741: Verbindlichkeiten LSt
- 1742: Verbindlichkeiten SolZ
- 1743: Verbindlichkeiten KiSt
- 1740: Verbindlichkeiten SV
- 1800: Bank (Netto-Auszahlung)

### 10.2 Supabase/Lovable Cloud API

Alle Datenbankzugriffe über den Supabase-Client:
```typescript
import { supabase } from "@/integrations/supabase/client";
```

**Konfiguration:**
- `VITE_SUPABASE_URL` (automatisch)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (automatisch)

### 10.3 Auth-Flow

1. Registrierung: Email + Passwort → Auto-Confirm → Auto-Login
2. `handle_new_user` Trigger → Profil erstellen
3. `assign_default_role` Trigger → Tenant + Rolle zuweisen
4. Frontend: `AuthProvider` → `TenantProvider` → Daten laden

### 10.4 Behörden-Integration (UI-only)
**Datei:** `src/components/integration/authorities-integration.tsx`

Oberflächen für:
- ELSTER (Finanzamt)
- SV-Meldestelle
- Bundesagentur für Arbeit

> **Hinweis:** Keine echte API-Anbindung. Nur UI-Vorbereitung für zukünftige Integration.

---

## 11. Typsystem (TypeScript-Definitionen)

### 11.1 Kern-Typen

| Datei | Typen |
|---|---|
| `src/types/employee.ts` | `Employee`, `PersonalData`, `EmploymentData`, `SalaryData`, `Address`, `HealthInsurance`, `BankingData`, `AdditionalBenefits`, `SalaryCalculation`, `SocialSecurityContributions`, `TaxCalculation` |
| `src/types/payroll.ts` | `PayrollPeriod`, `PayrollEntry`, `WorkingTimeData`, `Deductions`, `Additions`, `PayrollSummary`, `PayrollReport`, `PayrollStatus` |
| `src/types/time-tracking.ts` | `TimeEntry`, `AbsenceType` |
| `src/types/compliance.ts` | `ComplianceAlert`, `ComplianceSeverity` |
| `src/types/special-payments.ts` | `SpecialPayment`, `PaymentType` |
| `src/types/payroll-guardian.ts` | `Anomaly`, `GuardianHistory` |
| `src/types/autolohn.ts` | `AutolohnSettings`, `CompanyData` |

### 11.2 Enums & Konstanten

```typescript
type EmploymentType = 'minijob' | 'midijob' | 'fulltime' | 'parttime';
type TaxClass = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
type SalaryType = 'fixed' | 'hourly' | 'variable';
type RelationshipStatus = 'single' | 'married' | 'divorced' | 'widowed';
type Religion = 'none' | 'catholic' | 'protestant' | ...;
type IndustryType = 'standard' | 'construction' | 'gastronomy' | 'nursing';
type app_role = 'admin' | 'sachbearbeiter' | 'leserecht';
```

---

## 12. Validierung

**Datei:** `src/lib/validations/employee.ts` (Zod-Schemas)

Validiert:
- Pflichtfelder (Vorname, Nachname, Bruttogehalt)
- Format (Steuer-ID: 11 Ziffern, SV-Nummer, IBAN)
- Logik (Eintrittsdatum < Austrittsdatum, Minijob-Grenze)

---

## 13. Tests

| Test-Suite | Datei | Inhalt |
|---|---|---|
| Golden-Master | `golden-master-payroll.test.ts` | 10 manuell verifizierte Referenzdatensätze (Toleranz ±0,01€) |
| Property-Based | `property-based-payroll.test.ts` | Invarianten (Netto < Brutto, keine negativen Werte) |
| Edge-Cases | `edge-cases.test.ts` | Randfälle (0€ Brutto, Max-BBG, Steuerklasse VI) |
| Tax-Calculation | `tax-calculation.test.ts` | Steuerberechnung |
| Social-Security | `social-security.test.ts` | SV-Berechnung |
| Special-Payments | `special-payments.test.ts` | Sonderzahlungen |
| Construction | `construction-payroll.test.ts` | Baulohn |
| Gastronomy | `gastronomy-payroll.test.ts` | Gastronomie |
| Nursing | `nursing-payroll.test.ts` | Pflege |
| Integration | `payroll-integration.test.ts` | E2E Lohnberechnung |
| Formatters | `formatters.test.ts` | Rundung/Formatierung |
| Employee Validation | `employee.test.ts`, `employee-extended.test.ts` | Eingabevalidierung |
| Tax-Params-Factory | `tax-params-factory.test.ts` | Parameterkonvertierung |

**Test-Framework:** Vitest + fast-check (Property-Based)

---

## 14. Abhängigkeiten (npm)

### Kern
- `react`, `react-dom` (18.x)
- `react-router-dom` (6.x)
- `@tanstack/react-query`
- `@supabase/supabase-js`
- `typescript` (5.x)

### UI
- `tailwindcss` (3.x)
- `@radix-ui/*` (shadcn/ui Primitives)
- `lucide-react` (Icons)
- `recharts` (Charts)
- `date-fns` (Datumsformatierung)
- `react-helmet-async` (SEO)
- `sonner` (Toast-Notifications)

### Validierung
- `zod`

### Test
- `vitest`
- `fast-check`

---

## 15. Datenflüsse & Verknüpfungen

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Employee    │────▶│  Payroll     │────▶│  DATEV Export    │
│  (Stammdaten)│     │  (Abrechnung)│     │  (SKR03/04)     │
└──────┬──────┘     └──────┬───────┘     └─────────────────┘
       │                   │
       │                   ├────▶ Meldewesen (SV, eLStB, BN)
       │                   │
       │                   ├────▶ Reports (Journal, Kosten)
       │                   │
       │                   └────▶ Payroll Guardian (Anomalien)
       │
       ├────▶ TimeTracking ──▶ TimePayrollSync ──▶ Payroll
       │
       ├────▶ SpecialPayments (Krankengeld, Mutterschutz)
       │
       └────▶ Compliance (Vertragsprüfungen, Fristen)

Auth ──▶ Tenant ──▶ RLS (Datenisolation auf allen Tabellen)
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
├── constants/       → social-security.ts (Steuer-/SV-Konstanten)
├── utils/           → Alle Berechnungslogik (1:1 kopieren)
├── lib/             → formatters.ts, validations/, query-keys.ts
├── hooks/           → Alle Hooks (Supabase-Queries)
├── contexts/        → auth-context, tenant-context, employee-context
├── components/      → Alle UI-Komponenten
├── pages/           → Alle Seiten
└── integrations/    → supabase/client.ts (wird automatisch generiert)
```

### 16.4 DB-Migration
Alle SQL-Migrationen aus `supabase/migrations/` in der richtigen Reihenfolge ausführen. Die Tabellen, Trigger, Funktionen und RLS-Policies werden dadurch automatisch erstellt.

### 16.5 Kritische Dateien (nicht ändern!)
- `src/constants/social-security.ts` – Lohnsteuertabelle + SV-Sätze
- `src/utils/tax-calculation.ts` – Steuerberechnungslogik
- `src/utils/besondere-lohnsteuertabelle.ts` – Besondere LSt
- `src/utils/payroll-calculator.ts` – Lohnberechnungs-Orchestrator

---

## 17. Versionierung & Jahreswechsel

**Datei:** `src/constants/ANNUAL_UPDATE_CHECKLIST.md`

Jährlich zu aktualisieren:
- [ ] Beitragsbemessungsgrenzen (BBG)
- [ ] Sozialversicherungsbeitragssätze
- [ ] Minijob-/Midijob-Grenzwerte
- [ ] Lohnsteuertabelle
- [ ] Solidaritätszuschlag-Freigrenze
- [ ] Sachbezugswerte (Gastronomie)
- [ ] Feiertage
- [ ] Krankenkassen-Zusatzbeiträge

---

*Erstellt am: 14. April 2026*
*LohnPro Version: Phase 5 (Production-Ready)*
*Berechnungsstand: Steuer- und SV-Sätze 2025*
