

# Plan: DATEV Lohn & Gehalt Import-Funktion

## Kontext

Bei einem Mandantenwechsel (z.B. von einem Steuerberater zu LohnPro) müssen die bestehenden Lohndaten aus DATEV Lohn & Gehalt importiert werden können. Die hochgeladenen Dateien zeigen 4 verschiedene DATEV-Exportformate:

## Erkannte Dateiformate

| Datei | Format | Inhalt |
|-------|--------|--------|
| `00003_*.txt` / `00103_*.txt` | DATEV Personalstammdaten (Fließtext) | Vollständige Mitarbeiter-Stammdaten: Name, Adresse, SV-Nr, Steuerklasse, Krankenkasse, Gehalt, Lohnarten, Bankverbindung |
| `*_SD.txt` | DATEV ASCII Stammdaten (CSV, `;`-getrennt) | Kompakte Stammdaten aller Mitarbeiter als Semikolon-CSV mit ~200 Feldern pro Zeile |
| `*_LA.txt` | DATEV ASCII Lohnarten (CSV, `;`-getrennt) | Bewegungsdaten: Lohnarten pro Mitarbeiter und Monat (Gehalt, Sachbezüge, Zuschüsse) |
| `*.pdf` | DATEV Auswertungen | Lohnjournal, Beitragsnachweise, Mindestlohnprüfung, SV-Meldungen (zur Validierung/Archiv) |

## Umsetzungsplan

### 1. DATEV-Import-Parser erstellen
**Datei:** `src/utils/datev-import.ts`

Drei Parser für die maschinenlesbaren Formate:

- **`parseDatevStammdatenASCII(csv: string)`** — Parst die SD-Datei (`;`-getrennte CSV). Mappt Felder wie Personalnummer, Name, IBAN, Steuerklasse, Krankenkasse, Gehalt auf das `Employee`-Datenmodell.
- **`parseDatevPersonalstamm(text: string)`** — Parst die Fließtext-Stammdaten (00003_*.txt). Verwendet Regex/Zeilenanalyse für Schlüssel-Wert-Paare (`Familienname → lastName`, `Steuerklasse → taxClass`, etc.).
- **`parseDatevLohnarten(csv: string)`** — Parst die LA-Datei für Bewegungsdaten (Lohnarten 2000=Gehalt, 2480=Sachbezug, 3300=Mutterschaftsgeld etc.).

Jeder Parser liefert typisierte Objekte zurück, die direkt in die `employees`-Tabelle gemappt werden können.

### 2. Import-Wizard UI erstellen
**Datei:** `src/components/import/datev-import-wizard.tsx`

Geführter 4-Schritte-Wizard:

1. **Dateiauswahl** — Drag & Drop für `.txt`, `.csv` und `.pdf`. Automatische Formaterkennung (SD/LA/Personalstamm) anhand des Headers.
2. **Vorschau & Validierung** — Tabelle mit allen erkannten Mitarbeitern, Feld-Mapping-Vorschau, Warnungen bei fehlenden Pflichtfeldern (z.B. fehlende Steuer-ID).
3. **Konfliktauflösung** — Falls bereits Mitarbeiter mit gleicher Personal-Nr oder SV-Nr existieren: Überschreiben / Zusammenführen / Überspringen.
4. **Import bestätigen** — Zusammenfassung (X Mitarbeiter, Y Lohnarten) und Import in die Datenbank.

### 3. Import-Seite/Navigation
**Dateien:** `src/pages/Settings.tsx`, `src/components/settings/datev-import-page.tsx`

- Neuer Tab "DATEV Import" in den Einstellungen (neben Firmendaten, DSGVO etc.)
- Nur für `admin`-Rolle zugänglich

### 4. Datenbank-Import-Logik
**Datei:** `src/hooks/use-datev-import.ts`

- Batch-Insert der geparsten Mitarbeiter in `employees`-Tabelle
- Mapping der DATEV-Felder auf die bestehenden DB-Spalten (Personalstamm → `first_name`, `last_name`, `tax_id`, `tax_class`, `sv_number`, `iban`, `gross_salary`, `health_insurance`, `church_tax`, etc.)
- Optional: Import historischer Lohndaten als `payroll_entries`
- Audit-Log-Eintrag für jeden Import

### 5. PDF-Archivierung (optional)
Die PDF-Auswertungen (Lohnjournal, Beitragsnachweise) werden als Referenzdokumente gespeichert, nicht geparst — sie dienen der Mandanten-Dokumentation.

## Feld-Mapping (Auszug)

```text
DATEV SD-Feld              → LohnPro DB-Spalte
─────────────────────────────────────────────
Personalnummer             → personal_number
Familienname               → last_name
Vorname                    → first_name
Geburtsdatum               → date_of_birth
Geschlecht                 → gender
IBAN                       → iban
BIC                        → bic
Eintrittsdatum             → entry_date
Austrittsdatum             → exit_date
Standardentlohnung         → gross_salary
Steuerklasse (aus Steuerkarte) → tax_class
IdNr                       → tax_id
Versicherungsnummer        → sv_number
Krankenkasse               → health_insurance
Konfession                 → church_tax / church_tax_rate
Kinderfreibetrag           → children_allowance
Wochenarbeitsstunden       → weekly_hours
Personengruppenschl.       → employment_type mapping
```

## Technische Details

- Encoding: Die DATEV-Dateien sind in Windows-1252 (CP1252) kodiert — Parser muss `TextDecoder('windows-1252')` verwenden
- CSV-Delimiter: Semikolon (`;`), Textqualifier: Anführungszeichen (`"`)
- Dezimaltrennzeichen: Komma (`,`) → muss in Punkt konvertiert werden
- Datumsformat: `dd.mm.yyyy` → ISO-Konvertierung

