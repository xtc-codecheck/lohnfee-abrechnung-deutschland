# SYSTAX Integration Guide — Ablösung des bestehenden Lohnmoduls

> **Zweck:** Diese Anleitung beschreibt Schritt für Schritt, wie LohnPro das
> bestehende Lohnmodul im SYSTAX-Hauptsystem **vollständig ersetzt**.
>
> **Adressat:** Engineering-Team SYSTAX, das den Cutover umsetzt.
>
> **Status:** Übergabe-Dokument, Stand der LohnPro-Codebasis (siehe
> `package.json` und `src/payroll-core/index.ts` → `PAYROLL_CORE_VERSION`).

---

## 1. Zielbild

```
┌────────────────────────────────────────────────────────────────┐
│  SYSTAX Hauptsystem                                            │
│                                                                │
│  ┌─────────────────────────────────┐                           │
│  │  /lohn/*                        │  ← LohnPro als Sub-App    │
│  │   <StandaloneLohnProApp         │     (mountet alle UI)     │
│  │      basePath="/lohn"           │                           │
│  │      useHostProviders={true} /> │                           │
│  └─────────────────────────────────┘                           │
│                ▲                                               │
│                │ importiert                                    │
│  ┌─────────────────────────────────┐                           │
│  │  @lohnpro/payroll-core          │  ← Reine Berechnungs-Lib  │
│  │  (PAP 2025/2026, 571 Tests)     │     (ohne UI / Supabase)  │
│  └─────────────────────────────────┘                           │
│                                                                │
│  Altes SYSTAX-Lohnmodul: ABGESCHALTET (siehe §3 + §8)          │
└────────────────────────────────────────────────────────────────┘
```

**Kernsatz:** LohnPro **ersetzt** — es koexistiert nicht. Nach erfolgreichem
Cutover wird das alte Lohnmodul deinstalliert.

---

## 2. Voraussetzungen

| Bereich               | Anforderung                                                  |
|-----------------------|--------------------------------------------------------------|
| React                 | ≥ 18.3                                                       |
| React Router          | ≥ 6.x (kompatibel mit BrowserRouter im Host)                 |
| TypeScript            | ≥ 5.0                                                        |
| TanStack React Query  | ≥ 5.x                                                        |
| Supabase Schema       | Ziel-Schema = LohnPro-Schema (18 Tabellen, siehe §6)         |
| Auth                  | SYSTAX-Auth liefert `user` + `tenant_id` (siehe §5)          |

---

## 3. Cutover-Plan (Hochlevel)

| Phase | Was passiert                                                                                | Dauer    |
|-------|---------------------------------------------------------------------------------------------|----------|
|  T-14 | Code-Übernahme: `src/payroll-core/` + `src/standalone/lohnpro/` in SYSTAX-Repo importieren  | 1–2 Tage |
|  T-10 | Datenbank-Migration vorbereiten (siehe §6), Schema-Diff prüfen                              | 2–3 Tage |
|  T-7  | Dry-Run der Datenmigration (`migrateLegacyPayrollData({dryRun:true})`)                      | 1 Tag    |
|  T-3  | Feature-Flag `lohnpro.enabled = true` für Pilot-Mandanten                                   | 1 Tag    |
|  T-0  | Cutover: `/payroll`-Route auf `<StandaloneLohnProApp />` umleiten, alte Route deaktivieren  | 1 Tag    |
|  T+7  | Beobachtung Pilot-Mandanten, Anomalien-Check via Payroll-Guardian                           | 1 Woche  |
|  T+14 | Rollout für alle Mandanten                                                                  | 1 Tag    |
|  T+30 | Altes Lohnmodul aus SYSTAX-Repo entfernen (Code-Cleanup)                                    | 1 Tag    |

---

## 4. Code-Integration

### 4.1 Bibliothek `@lohnpro/payroll-core`

Reine Berechnungslogik, ohne UI/Supabase. Übernehmen via Monorepo-Paket
oder direktem Verzeichnis-Import:

```ts
// In SYSTAX:
import {
  calculateNetSalary,
  calculatePayroll,
  PAYROLL_CORE_VERSION,
} from "@lohnpro/payroll-core";

console.log(PAYROLL_CORE_VERSION); // "2026.1.0"
```

### 4.2 Sub-App-Mount

```tsx
// SYSTAX: src/App.tsx
import { StandaloneLohnProApp } from "@lohnpro/standalone";

<Route
  path="/lohn/*"
  element={
    <StandaloneLohnProApp
      basePath="/lohn"
      useHostProviders={true}
    />
  }
/>
```

`useHostProviders={true}` deaktiviert die LohnPro-eigenen Provider
(Auth, Tenant, Theme, QueryClient) — SYSTAX stellt sie bereit.

---

## 5. RLS- und Auth-Mapping

LohnPro nutzt RLS-Funktionen, die SYSTAX bereits vergleichbar besitzt.

| LohnPro                              | SYSTAX-Äquivalent             | Aktion                  |
|--------------------------------------|--------------------------------|-------------------------|
| `is_tenant_member(tenant_id, uid)`   | `is_tenant_member(...)`        | 1:1 nutzbar             |
| `has_role_in_tenant(role, tid, uid)` | `has_role_in_tenant(...)`      | 1:1 nutzbar             |
| `has_role(role, uid)`                | `has_role(...)`                | 1:1 nutzbar             |
| `get_default_tenant(uid)`            | SYSTAX hat eigene Logik        | SYSTAX-Variante nutzen  |
| `is_primary_admin(uid)`              | `is_primary_admin(...)`        | 1:1 nutzbar             |

**Wichtig:** Die RLS-Policies aller 18 LohnPro-Tabellen referenzieren diese
Funktionen — keine Anpassung nötig, sofern SYSTAX dieselben Signaturen hat.

---

## 6. Datenbank-Migration

### 6.1 Tabellen-Inventar (LohnPro = führend)

| Tabelle                          | Status in SYSTAX  | Aktion                   |
|----------------------------------|-------------------|--------------------------|
| `employees`                      | ggf. existiert    | Schema-Diff + Merge      |
| `payroll_periods`                | bestehend (alt)   | **Migration aus alt**    |
| `payroll_entries`                | bestehend (alt)   | **Migration aus alt**    |
| `time_entries`                   | bestehend (alt)   | **Migration aus alt**    |
| `tenants`, `tenant_members`      | SYSTAX-führend    | LohnPro-Tabelle DROP     |
| `user_roles`, `profiles`         | SYSTAX-führend    | LohnPro-Tabelle DROP     |
| `compliance_alerts`              | neu               | CREATE                   |
| `payroll_guardian_anomalies`     | neu               | CREATE                   |
| `payroll_guardian_history`       | neu               | CREATE                   |
| `special_payments`               | neu               | CREATE                   |
| `lohnsteueranmeldungen`          | neu               | CREATE                   |
| `lohnsteuerbescheinigungen`      | neu               | CREATE                   |
| `sv_meldungen`                   | neu               | CREATE                   |
| `beitragsnachweise`              | neu               | CREATE                   |
| `gdpr_requests`                  | ggf. SYSTAX       | Vereinheitlichen         |
| `audit_log`                      | ggf. SYSTAX       | Vereinheitlichen         |
| `company_settings`               | ggf. SYSTAX       | Vereinheitlichen         |
| `autolohn_settings`              | neu               | CREATE                   |

### 6.2 Datenmigration alter Lohn-Daten

Verwendet die LohnPro-Util `src/utils/systax-legacy-migration.ts`:

```ts
import { migrateLegacyPayrollData } from "@lohnpro/payroll-core";

// Schritt 1: Dry-Run pro Mandant
const dry = await migrateLegacyPayrollData({
  sourceTenantId: tenantId,
  targetTenantId: tenantId,
  dryRun: true,
}, mappers);

if (dry.errors.length === 0) {
  // Schritt 2: Echte Migration
  await migrateLegacyPayrollData({ sourceTenantId, targetTenantId }, mappers);
}
```

Die `mappers` müssen im SYSTAX-Repo implementiert werden, sobald das
Altschema vorliegt. Der LohnPro-Stub gibt die Schnittstelle vor.

---

## 7. Provider-Diff

| Provider                        | LohnPro            | SYSTAX Cutover            |
|---------------------------------|--------------------|---------------------------|
| `QueryClientProvider`           | LohnPro-eigen      | **SYSTAX**                |
| `BrowserRouter`                 | LohnPro-eigen      | **SYSTAX**                |
| `HelmetProvider`                | LohnPro-eigen      | **SYSTAX**                |
| `AuthProvider`                  | LohnPro-eigen      | **SYSTAX**                |
| `TenantProvider`                | LohnPro-eigen      | **SYSTAX**                |
| `EmployeeProvider`              | LohnPro-eigen      | LohnPro behält (Domäne)   |
| `SystaxProvider`                | LohnPro-eigen      | LohnPro behält (Stub)     |
| `TooltipProvider` (shadcn)      | LohnPro-eigen      | **SYSTAX** (falls global) |
| `Toaster` (toast/sonner)        | LohnPro-eigen      | **SYSTAX**                |
| `ThemeProvider` (dark mode)     | LohnPro-eigen      | **SYSTAX** (next-themes)  |
| `ScrollToTop`                   | LohnPro-eigen      | **SYSTAX**                |
| `OfflineBanner`                 | LohnPro-eigen      | **SYSTAX** falls vorh.    |
| `SessionTimeoutProvider`        | LohnPro-Stub       | **SYSTAX**                |

---

## 8. Konflikt-Liste (zu entfernen aus SYSTAX nach Cutover)

Folgendes muss im SYSTAX-Repo nach erfolgreichem Cutover entfernt werden,
damit kein Doppel-Code existiert:

- `src/payroll-core/` (alt) — durch LohnPro-Variante ersetzt
- Altes Payroll-Routing (`/payroll`-Route auf altes Modul)
- Alte Berechnungs-Hooks (`useOldPayroll`, etc.)
- Alte Lohn-Komponenten (`<OldPayrollDashboard />`, etc.)
- Alte Tabellen-Migrationen, die durch LohnPro-Schema ersetzt werden

---

## 9. Edge-Functions

| Funktion              | Status      | Aktion                                   |
|-----------------------|-------------|------------------------------------------|
| `parse-pdf-employee`  | Bestehend   | In SYSTAX-Edge-Functions kopieren        |
| _(geplant)_           | —           | weitere Edge-Functions hier ergänzen     |

---

## 10. Routen-Cutover

| Alt (SYSTAX)         | Neu (LohnPro)                   |
|----------------------|---------------------------------|
| `/payroll`           | `/lohn/payroll`                 |
| `/payroll/employees` | `/lohn/employees`               |
| `/payroll/reports`   | `/lohn/reports`                 |
| _(weitere)_          | unter `/lohn/*` gemountet       |

**HTTP-Redirects** im SYSTAX-Reverse-Proxy für Bookmarks alter Routen
(301 von `/payroll` → `/lohn/payroll`).

---

## 11. Rollback-Strategie

Bei kritischen Problemen während der Pilot-Phase:

1. Feature-Flag `lohnpro.enabled = false` setzen
2. SYSTAX-Reverse-Proxy: 301-Redirects deaktivieren
3. Alte `/payroll`-Route reaktivieren
4. Neu in LohnPro angelegte Daten via Audit-Log identifizieren und
   ggf. ins Altsystem rückportieren (manuell, da Schema-Mismatch)

**Wichtig:** Rollback ist nur risikolos in den ersten **7 Tagen** möglich,
solange noch keine produktiven Lohnläufe in LohnPro abgeschlossen wurden.

---

## 12. Testabdeckung in SYSTAX-CI

LohnPro liefert **571 Tests**. So binden Sie sie in die SYSTAX-CI ein:

```bash
# In SYSTAX root:
bun test src/payroll-core/**/*.test.ts
bun test src/standalone/lohnpro/**/*.test.tsx
```

| Test-Kategorie       | Anzahl ca. | Pflicht im SYSTAX-CI |
|----------------------|------------|----------------------|
| Tax-Engine Unit      | ~120       | ✅ Pflicht           |
| Social Security      | ~40        | ✅ Pflicht           |
| Industry Modules     | ~80        | ✅ Pflicht           |
| Specials             | ~60        | ✅ Pflicht           |
| Golden-Master 2025/26| ~40        | ✅ Pflicht           |
| Property-Based       | ~30        | ✅ Pflicht           |
| Integration / E2E    | ~50        | ✅ Pflicht           |
| Mappers / Hooks      | ~150       | empfohlen            |

---

## 13. Versionierung & Kompatibilität

| LohnPro Version | SYSTAX-Payroll-Modul (alt) | Status            |
|-----------------|----------------------------|-------------------|
| 2026.1.0 (akt.) | jegliche                   | **ersetzt diese** |

Semver-Garantie: Patch-Updates (`2026.1.x`) sind binärkompatibel.

---

## 14. Kontakt

- **Übergabe:** LohnPro-Team
- **Spezifikation:** [`docs/LohnPro-SubApp-Spezifikation.md`](./LohnPro-SubApp-Spezifikation.md)
- **Code-Einstieg:** `src/payroll-core/index.ts`, `src/standalone/lohnpro/`
