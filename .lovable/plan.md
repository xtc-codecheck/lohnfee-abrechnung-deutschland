

# Plan: Intelligente Datenrekonstruktion bei unvollständigen DATEV-Imports

## Ausgangslage

- 21/23 Mitarbeiter sind vollständig (91%)
- 2 Mitarbeiter (Wittmann, Merl) fehlen: Steuerklasse, Steuer-ID, Krankenkasse
- Problem in der Praxis: Mandanten liefern selten alle Dateien

## Was wir automatisch ableiten können

| Fehlendes Feld | Rekonstruktionsmöglichkeit |
|---|---|
| **Steuerklasse** | Default-Vorschlag basierend auf Beschäftigungsart (Minijob → pauschal, Vollzeit → StKl 1 als Platzhalter) |
| **Bundesland** | ✅ Bereits implementiert via PLZ-Mapping |
| **Wochenstunden** | Aus Beschäftigungsart ableiten (Vollzeit → 40h, Teilzeit → aus Gehaltsverhältnis schätzen) |
| **Kirchensteuer-Satz** | Aus Bundesland (Bayern = 8%, Rest = 9%) |
| **Krankenkasse** | Häufigste KK im Betrieb als Vorschlag |

## Was NICHT rekonstruierbar ist (braucht immer Quelldaten)

- Steuer-ID (11-stellig, einmalig vom BZSt)
- SV-Nummer (vom Rentenversicherungsträger)
- IBAN/BIC
- Geburtsdatum

## Umsetzung

### 1. Nachbearbeitungs-Assistent im Import-Wizard
**Datei:** `src/components/import/datev-import-wizard.tsx`

Nach dem Import ein 5. Schritt "Daten vervollständigen":
- Zeigt nur Mitarbeiter mit Lücken (rot/gelb markiert)
- Für jedes fehlende Feld: Eingabefeld + intelligenter Vorschlag (z.B. "StKl 1 vorgeschlagen")
- Batch-Edit: "Gleiche Krankenkasse für alle ohne KK setzen"
- Hinweis: "Für Steuer-ID und SV-Nr benötigen Sie die DATEV-Personalstamm-Dateien oder ELStAM-Abruf"

### 2. Smart-Defaults-Engine
**Datei:** `src/utils/datev-import.ts`

Neue Funktion `inferMissingFields(employee, allEmployees)`:
- Steuerklasse: Minijob (≤556€) → Kennzeichen "pauschal", sonst StKl 1 als Default
- Wochenstunden: Wenn `employment_type = 'vollzeit'` → 40h, `teilzeit` → Verhältnis aus Gehalt/höchstem Vollzeitgehalt
- Kirchensteuer-Satz: Automatisch aus `state` (BY = 8%, alle anderen = 9%)
- Krankenkasse: Modus (häufigste) aus dem Betrieb vorschlagen

### 3. Nachladen einzelner Personalstamm-Dateien
**Datei:** `src/components/import/datev-import-wizard.tsx`

Button "Fehlende Daten nachladen" auf der Mitarbeiter-Detailseite:
- Einzelne Personalstamm-Datei (00xxx_*.txt) hochladen
- Automatisch dem richtigen Mitarbeiter zuordnen (via Personalnummer im Dateinamen)
- Merge-Strategie: Nur leere Felder füllen

### 4. Vollständigkeits-Badge in der Mitarbeiterliste
**Datei:** `src/components/employees/employee-dashboard.tsx`

- Ampel-Icon pro Mitarbeiter: 🟢 abrechnungsfähig / 🟡 Warnungen / 🔴 nicht abrechnungsfähig
- Tooltip zeigt fehlende Felder
- Filter: "Nur unvollständige anzeigen"

## Betroffene Dateien

1. `src/utils/datev-import.ts` — `inferMissingFields()` Funktion
2. `src/components/import/datev-import-wizard.tsx` — Schritt 5 "Vervollständigen", Nachladen-Button
3. `src/components/employees/employee-dashboard.tsx` — Vollständigkeits-Badge
4. `src/hooks/use-datev-import.ts` — Smart-Defaults bei Insert anwenden

