
# Production-Readiness Audit: Steuerberater-Qualitat

## Bewertung: NICHT produktionsreif

Die App hat eine solide Berechnungs-Engine, aber es fehlen kritische Komponenten fur den Echtbetrieb mit Steuerberater-Qualitat.

---

## Kritische Lucken (Showstopper)

### 1. Keine Datenbankanbindung - nur localStorage
Alle Daten (Mitarbeiter, Abrechnungen, Zeiterfassung) liegen im Browser-LocalStorage. Das bedeutet:
- Datenverlust beim Loschen des Browsercaches
- Kein Multi-User-Betrieb moglich
- Keine Revisionssicherheit (Daten sind manipulierbar)
- Keine Datensicherung

**Losung:** Supabase-Anbindung mit Tabellen fur Employees, PayrollPeriods, PayrollEntries, TimeEntries, AuditLog.

### 2. Keine Authentifizierung
Jeder kann auf alle Daten zugreifen. Fur Lohndaten (hochsensibel, DSGVO) inakzeptabel.

**Losung:** Supabase Auth mit Rollen (Admin, Sachbearbeiter, Leserecht).

### 3. Besondere Lohnsteuertabelle fehlt
Im Code steht explizit: "Die besondere Lohnsteuertabelle ist derzeit NICHT implementiert." Beamte, Richter und privat Versicherte konnen nicht korrekt abgerechnet werden.

### 4. Kein Meldewesen (SV-Meldungen)
Fehlend: Anmeldung, Abmeldung, Jahresmeldung, DEÜV-Meldungen an Krankenkassen. Ohne das kann kein Arbeitgeber legal abrechnen.

### 5. Keine Lohnsteuerbescheinigung
Die jahrliche elektronische Lohnsteuerbescheinigung (eLStB) fehlt komplett.

### 6. Kein Beitragsnachweis
Der monatliche Beitragsnachweis an die Krankenkassen fehlt.

---

## Hohe Prioritat (Qualitatsrelevant)

### 7. Lohnkonto fehlt
Kein fortlaufendes Lohnkonto pro Mitarbeiter/Jahr gemas § 41 EStG.

### 8. Firmenstammdaten hardcoded
Der PDF-Generator enthalt Beispiel-Firmendaten. Firmenname, Adresse, Steuernummer, Betriebsnummer mussen konfigurierbar sein.

### 9. Tests nicht verifiziert lauffähig
Die Testsuite existiert, aber es ist unklar ob alle Tests aktuell bestehen.

### 10. Lohnsteuer-Extrapolation fur hohe Gehalter
Bei Gehaltern uber dem letzten Tabelleneintrag (~100.000EUR) wird linear extrapoliert - das ist mathematisch ungenau.

### 11. Keine Mandantenfahigkeit
Ein Steuerberater betreut mehrere Firmen. Es gibt kein Mandantenkonzept.

---

## Implementierungsplan

```text
Phase 1: Fundament (KRITISCH)
├── 1.1 Supabase-Datenbank einrichten
│    ├── employees, payroll_periods, payroll_entries
│    ├── audit_log, company_settings
│    └── RLS-Policies + Rollen
├── 1.2 Authentifizierung implementieren
│    └── Login, Rollen, geschützte Routen
└── 1.3 Datenmigration localStorage → Supabase

Phase 2: Gesetzliche Pflichten
├── 2.1 Lohnkonto pro MA/Jahr (§ 41 EStG)
├── 2.2 Firmenstammdaten-Verwaltung
├── 2.3 Besondere Lohnsteuertabelle
└── 2.4 Lohnsteuer-Hochrechnung fur >100k EUR

Phase 3: Meldewesen & Export
├── 3.1 SV-Meldungen (An-/Ab-/Jahresmeldung)
├── 3.2 Beitragsnachweis-Generierung
├── 3.3 Elektronische Lohnsteuerbescheinigung
└── 3.4 DATEV-Export Feinschliff

Phase 4: Professionalisierung
├── 4.1 Mandantenfahigkeit
├── 4.2 Vollstandige Testsuite ausfuhren + fixen
├── 4.3 DSGVO-Loschkonzept
└── 4.4 Backup & Wiederherstellung
```

---

## Was bereits gut funktioniert

- Steuerberechnung uber offizielle Lohnsteuertabelle 2025
- Sozialversicherung mit korrekten BBG, Midijob-Gleitzone, Minijob
- Zentraler Payroll-Calculator mit Audit-Trail
- DATEV-Export mit SKR03/SKR04
- Branchenmodule (Bau, Gastro, Pflege)
- Kaufmannische Rundung (Cent-genau)
- Golden-Master-Tests und Property-Based Testing
- Zod-Validierung der Eingabedaten

## Empfehlung

Phase 1 (Datenbank + Auth) zuerst umsetzen - ohne das ist ein produktiver Einsatz ausgeschlossen. Danach Phase 2 fur die gesetzlichen Mindestanforderungen. Phase 3 und 4 konnen schrittweise folgen.

Soll ich mit Phase 1 beginnen?
