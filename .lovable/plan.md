
## Korrektur: LohnPro ersetzt das bestehende SYSTAX-Lohnmodul vollständig

Danke für die Klarstellung. Mein vorheriger Plan ging fälschlicherweise davon aus, dass LohnPro **neben** dem bestehenden SYSTAX-`payroll-core/` als zusätzliche Sub-App koexistiert. Tatsächlich soll LohnPro das vorhandene Lohnmodul **ablösen**. Das ändert die Strategie deutlich:

- **Kein Kompatibilitäts-Layer** zur bestehenden SYSTAX-Payroll-Logik notwendig
- **Keine doppelte Jurisdiktions-Registry** — LohnPro IST die neue Engine
- **Migrationspfad** muss beschrieben werden: Wie wird die alte Payroll-Logik in SYSTAX abgeschaltet und durch LohnPro ersetzt
- **Datenmigration** alter Lohn-Daten aus SYSTAX in das LohnPro-Schema

## Angepasster Plan

### Phase 1 — Code-Struktur für vollständige Übernahme

**1.1 `payroll-core/` als Standalone-Bibliothek extrahieren**
- Neuer Ordner `src/payroll-core/` mit reiner Berechnungslogik (keine UI/Supabase)
- Re-Export aller bestehenden Utils (tax-calculation, payroll-calculator, branchenspezifische Module, etc.)
- Versioniert als `@lohnpro/payroll-core v2026.1.0`
- **Ziel:** SYSTAX importiert künftig diese Library statt eigener Logik
- Bestehender Code bleibt funktionsfähig (Re-Exports, keine Breaking Changes)

**1.2 `src/standalone/lohnpro/` Einstiegspunkt**
- `StandaloneLohnProApp.tsx` Wrapper mit optionalem `basePath` Prop
- Mountet alle bestehenden Routen (`/employees`, `/payroll`, etc.) unter konfigurierbarem Pfad
- Damit kann LohnPro im SYSTAX-Hauptsystem unter `/lohn/*` gemountet werden — ohne Code-Doppelung

**1.3 Globale Provider SYSTAX-konform**
- `next-themes` ThemeProvider (statt eigener Dark-Mode-Logik)
- `ScrollToTop`, `OfflineBanner` Komponenten ergänzen
- React Query mit `networkMode: "online"` + tiered Caching
- `SessionTimeoutProvider` Stub (15 Min — DSGVO für Lohndaten)

### Phase 2 — Übergangs-/Migrations-Features

**2.1 Migrations-Helper für SYSTAX-Altdaten**
- Neue Util `src/utils/systax-legacy-migration.ts` (Stub mit klarer Schnittstelle)
- Mapping-Funktion: altes SYSTAX-Payroll-Schema → LohnPro-Schema
- Wird in der Übergabe konkret befüllt, sobald Altschema bekannt

**2.2 Feature-Flag-Hook**
- `useLohnFeatureFlag(key)` für SYSTAX-`feature_flags` Tabelle (lokaler Fallback `true`)
- Toggleable Module: Branchen (Bau/Gastro/Pflege), AI-Guardian, Autolohn

**2.3 Pre-Flight-Check vor Lohnlauf**
- Nutzt bestehenden Payroll-Guardian inline statt nachträglich
- Dialog: „X Auffälligkeiten — trotzdem speichern?"

### Phase 3 — Übergabe-Dokumentation (kritisch)

**3.1 Neues Dokument `docs/SYSTAX-INTEGRATION-GUIDE.md`** mit Fokus **Ablösung**:
- **Abschaltplan** für altes SYSTAX-Lohnmodul (Schritt-für-Schritt)
- **Datenmigration**: SQL-Skripte/Mapping-Tabelle altes Schema → LohnPro-Tabellen
- **Routen-Cutover**: Wie `/payroll` in SYSTAX auf LohnPro umgestellt wird
- **RLS-Mapping**: SYSTAX-Funktionen (`is_tenant_member`) zu LohnPro-Policies
- **Edge-Functions Liste**: bestehend (`parse-pdf-employee`) + neu zu deployen
- **Provider-Diff**: Welche Provider LohnPro ersetzt vs. übernimmt
- **Konflikt-Liste**: Doppelte Komponenten/Hooks die im Hauptsystem entfernt werden müssen
- **Rollback-Strategie**: Wie zur alten Engine zurückgekehrt werden kann
- **Testabdeckung**: Wie die 571 Tests in SYSTAX-CI eingebunden werden

**3.2 Erweiterung `docs/LohnPro-SubApp-Spezifikation.md`**
- Neuer Abschnitt **"Ablösung des SYSTAX-Lohnmoduls"** mit Cutover-Plan
- **Compatibility Matrix** (LohnPro v1 als Ersatz für SYSTAX-Payroll vXX)

**3.3 README aktualisieren**
- Banner: „Diese App ersetzt das bestehende SYSTAX-Lohnmodul"
- Verweis auf Integration Guide

### Phase 4 — UX-Polish (niedrige Priorität)
- Glossar-Erweiterung um SV/Lohnsteuer-Begriffe via `HelpTooltip`
- `CookieConsent` Banner für Landing Page (DSGVO)

### Was NICHT geändert wird
- Berechnungslogik (PAP, BMF) — cent-genau, getestet
- Datenbankschema (18 Tabellen) — bleibt führend, SYSTAX adaptiert sich
- Bestehende Routen/UI — funktionieren weiter im Standalone-Modus

### Reihenfolge
1. Phase 1.1 (`payroll-core/` extrahieren) — strukturell wichtigster Schritt
2. Phase 3.1 (Integration Guide mit Cutover-/Migrations-Plan) — höchster Übergabe-Wert
3. Phase 1.2 + 1.3 (Standalone-Shell + Provider)
4. Phase 2 (Migrations-Helper + Flags)
5. Phase 4 (Polish)

**Ergebnis:** LohnPro wird zur vollwertigen Ersatz-Engine. SYSTAX kann das alte Lohnmodul abschalten, LohnPro wird als Sub-App eingebunden und die Berechnungs-Library `payroll-core/` ist auch losgelöst nutzbar (z. B. für andere SYSTAX-Apps).
