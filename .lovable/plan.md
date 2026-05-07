## Funktionsumfang vs. DATEV / Lexware Lohn — Dokumentation aktualisieren

### Ziel
Die existierende Gegenüberstellung auf den tatsächlichen Implementierungsstand prüfen und korrigieren. Viele als „fehlend" markierte Features sind inzwischen implementiert.

### Festgestellter Implementierungsstand (DB + Code geprüft)

**Neu implementiert seit letzter Einschätzung:**

| Feature | DB-Tabelle | Code | Status |
|---|---|---|---|
| AAG U1/U2 | `aag_antraege` | `aag-page.tsx`, `aag-calculation.ts` | Vollständig |
| Sofortmeldung §28a SGB IV | `sv_meldungen` | `sofortmeldung-page.tsx`, `sofortmeldung.ts` | Vollständig |
| UV-Jahresmeldung (DSLN) | `uv_jahresmeldungen` | `uv-jahresmeldung-page.tsx`, `uv-jahresmeldung.ts` | Vollständig |
| Bescheinigungen EEL/BEA | `bescheinigungen` | `bescheinigungen-page.tsx`, `bescheinigungen.ts` | Vollständig |
| ZVK / Pensionskassen | `zvk_kassen`, `zvk_meldungen` | `zvk-page.tsx`, `zvk-meldung.ts` | Vollständig |
| DEÜV-Rückmeldungen | `deuev_rueckmeldungen` | `deuev-rueckmeldungen-page.tsx` | Vollständig |
| Reisekosten/Spesen | `travel_trips`, `travel_legs`, `travel_receipts` | `Travel.tsx`, `travel-expenses.ts` | Rudimentär (Tab vorhanden) |
| Pfändung | `pfaendung_tabellen` | `garnishment-calculation.ts` | Vollständig |

### Korrekturen an der Übersicht

1. **AAG U1/U2** — Von „nicht implementiert" → „Implementiert, aber ohne zertifizierte Übermittlung"
2. **Sofortmeldung §28a** — Von „nicht implementiert" → „Implementiert, aber ohne zertifizierte Übermittlung"
3. **UV-Jahresmeldung** — Von „fehlt" → „Implementiert, aber ohne zertifizierte Übermittlung"
4. **Bescheinigungen EEL/BEA** — Von „fehlt" → „Implementiert, aber ohne zertifizierte Übermittlung"
5. **ZVK/Pensionskassen** — Von „fehlt" → „Implementiert, aber ohne zertifizierte Übermittlung"
6. **DEÜV-Rückmeldungen** — Von „fehlt" → „Implementiert (Import-Logik vorhanden)"
7. **Reisekosten** — Von „rudimentär" → „Tab + Stammdaten vorhanden, kein vollwertiges Modul"
8. **Pfändung** — Von „nicht jährlich automatisch aktualisiert" → „Tabellen + Berechnung vorhanden, jährliches Update manuell"

### Neue Einschätzung

- **Berechnung & Belegerzeugung:** ~95 % (unverändert)
- **Meldewesen (Datenerzeugung):** ~75 % (vorher ~40 % — AAG, Sofortmeldung, UV, Bescheinigungen, ZVK sind jetzt da)
- **Meldewesen (zertifizierte Übermittlung):** ~40 % (unverändert — immer noch kein ITSG/sv.net/ERiC)
- **Reisekosten:** ~20 % (Tab vorhanden, kein vollwertiges Modul)

### Deliverable
Neue Datei `docs/FUNKTIONSUMFANG-DATEV-VERGLEICH.md` mit der aktualisierten, ehrlichen Gegenüberstellung.