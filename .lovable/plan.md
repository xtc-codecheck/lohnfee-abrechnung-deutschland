

# Plan: DATEV-Import-System optimieren basierend auf Erkenntnissen

## Erkenntnisse aus dem Import

### Datenqualität der 23 importierten Mitarbeiter

| Problem | Betroffen | Ursache |
|---------|-----------|---------|
| **Steuerklasse fehlt** | 21/23 | SD-Header enthält `Steuerklasse` aber Encoding-Mismatch verhindert Match |
| **Steuer-ID fehlt** | 21/23 | Gleiche Ursache – `IdNr` Spalte nicht erkannt |
| **Wochenstunden fehlt** | 23/23 | Spaltenname `Wöchentliche Arbeitszeit` vs. `W�chentliche Arbeitszeit` |
| **Straße fehlt/falsch** | 21/23 | `Straße/Postfach` nur als Hausnr. importiert (z.B. "52" statt "Prüfeninger Straße 52") |
| **Krankenkasse = Nummer** | 20/23 | SD speichert KK-Betriebsnummer (z.B. `87880235`) statt Name (z.B. `KKH`) |
| **Kirchensteuer fehlt** | 21/23 | `Konfession` Spalte nicht gelesen |
| **Kinderfreibetrag fehlt** | 21/23 | Nicht aus SD extrahiert |
| **Bundesland fehlt** | 23/23 | Nicht in SD enthalten, muss aus PLZ abgeleitet werden |
| **Gehalt = 0** | 3/23 | Azubis/Elternzeit – korrekt, aber System muss das handhaben |
| **Nur 2 Personalstamm-Dateien** | 21/23 | Personalstamm hat die reichsten Daten, aber nur für 2 MA hochgeladen |

### Kernproblem: Encoding
Die DATEV-Dateien sind **Windows-1252** kodiert. Der Browser `FileReader` liest sie als **UTF-8**, wodurch `ö`, `ü`, `ß`, `ä` zu `�` werden. Die Spaltensuche nach `Straße/Postfach` findet dann `Stra�e/Postfach` nicht.

## Umsetzungsplan

### 1. Encoding-Fix im Import-Wizard
**Datei:** `src/components/import/datev-import-wizard.tsx`

- `FileReader.readAsArrayBuffer()` statt `readAsText()` verwenden
- `TextDecoder('windows-1252')` für die Dekodierung
- Damit werden alle Spaltenheader korrekt gemappt

### 2. SD-Parser erweitern — fehlende Felder extrahieren
**Datei:** `src/utils/datev-import.ts`

Zusätzliche Felder aus SD-CSV auslesen (die Spalten existieren im Header, werden aber wegen Encoding nicht gefunden):
- `Steuerklasse` → `tax_class`
- `IdNr` → `tax_id`
- `Konfession` → `church_tax` + `church_tax_rate`
- `Kinderfreibetrag` → `children_allowance`
- `Wöchentliche Arbeitszeit` → `weekly_hours`

Außerdem:
- Fuzzy/Normalized Column-Matching: Umlaute normalisieren bevor Header verglichen werden
- `Straße/Postfach` korrekt als vollständige Adresse parsen
- KK-Betriebsnummer als `health_insurance_number` speichern, Name aus `KK-Zusatzinformation` extrahieren

### 3. PLZ → Bundesland Mapping
**Datei:** `src/utils/datev-import.ts`

PLZ-Range-Tabelle für Ost/West-Erkennung (relevant für BBG):
- `01xxx-09xxx` → Sachsen/Thüringen/Brandenburg (Ost)
- `93xxx` → Bayern (West)
- etc.

Dies setzt das `state`-Feld automatisch, was für die SV-Berechnung (BBG Ost/West) kritisch ist.

### 4. Personalstamm-Parser verbessern
**Datei:** `src/utils/datev-import.ts`

- Encoding-Fix (gleich wie SD)
- `Versicherungsnummer / gültig ab` korrekt parsen (aktuell wird SV-Nr bei Gloria nicht übernommen)
- `Wöchentliche Arbeitszeit / gültig ab` → letzten (aktuellsten) Wert nehmen
- Lohnarten-Sektion parsen → Gehalt aus Lohnart 2000 extrahieren
- `Midijob`-Erkennung aus Personalstamm-Daten

### 5. Import-Qualitäts-Dashboard im Wizard
**Datei:** `src/components/import/datev-import-wizard.tsx`

Nach dem Import eine **Datenqualitäts-Übersicht** zeigen:
- Ampelsystem pro Mitarbeiter (🟢 vollständig / 🟡 Warnungen / 🔴 kritische Lücken)
- Fehlende Pflichtfelder hervorheben (Steuerklasse, Steuer-ID, Wochenstunden)
- Empfehlung: "Laden Sie die Personalstamm-Dateien (00xxx_*.txt) für vollständige Daten hoch"

### 6. Import-Hook: Merge-Logik verbessern
**Datei:** `src/hooks/use-datev-import.ts`

- Bei `merge`-Strategie: Nur leere Felder überschreiben, vorhandene behalten
- Aktuell wird bei `merge` das gleiche gemacht wie bei `overwrite`
- Personalstamm-Daten sollen SD-Daten ergänzen, nicht ersetzen

## Technische Details

- Kein neues DB-Schema nötig – `employees`-Tabelle hat bereits alle benötigten Spalten inkl. `state`, `health_insurance_number`
- Encoding-Fix ist die kritischste Änderung — behebt 90% der Datenlücken
- PLZ-Mapping reicht als Top-Level-Zuordnung (2-stellig → Bundesland)

## Betroffene Dateien

1. `src/utils/datev-import.ts` — Parser-Fixes, PLZ-Mapping, erweiterte Felder
2. `src/components/import/datev-import-wizard.tsx` — Encoding-Fix, Qualitäts-Dashboard
3. `src/hooks/use-datev-import.ts` — Merge-Logik korrigieren

