# Funktionsumfang vs. DATEV / Lexware Lohn

> Stand: Mai 2026 — Kurze, ehrliche Einschätzung basierend auf dem, was im Projekt **tatsächlich implementiert** ist (Code- und DB-Audit).

---

## ✅ Vorhanden (vergleichbar mit Lexware/DATEV Lohn)

### Berechnung (Kern)
- Lohnsteuer, Soli, KiSt — PAP 2025/2026, BMF-konform, cent-genau (571 Tests, Golden Master)
- SV: KV/RV/AV/PV inkl. Ost/West, Kinderlos-Zuschlag, Zusatzbeitrag, BBG
- Minijob (556 €), Midijob-Gleitzone, Tax Class VI / Mehrfachbeschäftigung
- Märzklausel, Entgeltfortzahlung (§ 3 EFZG), Mutterschaft, Pfändung
- bAV, Dienstwagen (1 % / 0,5 % / 0,25 %), VWL, Sachbezüge
- Branchen: Bau (SOKA-BAU), Gastro, Pflege (TVöD-P SFN)
- **Pfändungstabellen 2025/2026** als Stammdaten in `pfaendung_tabellen` (jährliches Update via Migration)

### Abrechnung & Belege
- Monatlicher Abrechnungslauf (Automated Wizard, 5-Schritte, Bulk-Insert-optimiert)
- Lohnkonto § 41 EStG, mehrsprachige Lohnabrechnung (DE/EN)
- Lohnarten-Katalog mit eigener Verbuchung
- Audit-Trail / GoBD-Export
- DATEV ASCII v7.0 (SKR03/SKR04, EXTF 31-Feld-Header)
- FiBu-Journal, Steuerberater-Paket-Export

### Meldewesen — Datensatz-Erzeugung (vollständig implementiert)
| Modul | DB-Tabelle | UI |
|---|---|---|
| Lohnsteueranmeldung (§ 41a EStG) | `lohnsteueranmeldungen` | ✅ |
| Lohnsteuerbescheinigung (eLStB) | `lohnsteuerbescheinigungen` | ✅ |
| DEÜV / SV-Meldungen | `sv_meldungen` | ✅ |
| Beitragsnachweise | `beitragsnachweise` | ✅ |
| **AAG U1/U2-Erstattungsanträge** | `aag_antraege` | ✅ |
| **Sofortmeldung § 28a SGB IV** | `sv_meldungen` (Grund 20) | ✅ |
| **UV-Jahresmeldung (DSLN)** | `uv_jahresmeldungen` | ✅ |
| **Bescheinigungen EEL & BEA** | `bescheinigungen` | ✅ |
| **DEÜV-Rückmeldungen (Inbox)** | `deuev_rueckmeldungen` | ✅ |
| **ZVK / Pensionskassen** | `zvk_kassen`, `zvk_meldungen` | ✅ |
| ELStAM-Validierung | — | ✅ |

---

## ⚠️ Eingeschränkt / nur intern

- **Übermittlung** aller Meldungen erfolgt aktuell nur über einen **Stub-Provider** (`sv-net-submit` Edge Function). Datensätze werden korrekt erzeugt, der echte Versand an Krankenkassen/Finanzamt fehlt.
- **ELSTER**: nur Facade über SYSTAX-Layer, keine direkte ERiC-Anbindung
- **SV-Meldungen**: erzeugt + valide, aber keine sv.net/ITSG-zertifizierte Übermittlung
- **Reisekosten/Spesen**: Tab + DB-Tabellen (`travel_trips`, `travel_legs`, `travel_receipts`) vorhanden, aber kein vollwertiges Modul (keine Pauschalen-Automatik, kein Genehmigungs-Workflow, kein Belegscan)
- **Pfändung**: Berechnung + Tabellen vorhanden, jährliches Update aktuell manuell per Migration

---

## ❌ Was DATEV/Lexware kann, hier aber fehlt

- **ITSG-/GKV-Zertifizierung** für SV-Meldungen (rechtliche Voraussetzung für Echtbetrieb)
- **ERiC-Modul** für direkte ELSTER-Übermittlung
- **dakota.le / sv.net-Integration** (produktiver Provider)
- **Mandantenfähige Steuerberater-Workflows** mit Freigabe und Mandantenkommunikation à la DATEV Unternehmen online (Steuerberater-Paket-Export ist vorhanden, aber kein Two-Way-Workflow)
- **Reisekostenabrechnung** als vollwertiges Modul (Pauschalen, Verpflegungsmehraufwand-Automatik, Belegerkennung, Genehmigungsprozess)

---

## Fazit (aktualisiert)

| Bereich | Reifegrad |
|---|---|
| Berechnung & Belegerzeugung | **~95 %** auf DATEV/Lexware-Niveau |
| Meldewesen — Datensatz-Erzeugung | **~75 %** (vorher ~40 %; AAG, Sofortmeldung, UV, EEL/BEA, ZVK, DEÜV-Rückmeldungen sind jetzt implementiert) |
| Meldewesen — zertifizierte Übermittlung | **~10 %** (Stub-Provider, kein echter Versand) |
| Reisekosten | **~20 %** (Grundgerüst vorhanden, kein vollwertiges Modul) |

**Nächste große Schritte für den Echtbetrieb:**
1. ITSG-Zertifizierung + produktive sv.net/dakota.le-Anbindung (ersetzt Stub in `sv-net-submit`)
2. ERiC-Anbindung für direkte ELSTER-Übermittlung (LStA, eLStB)
3. Reisekostenmodul ausbauen (Pauschalen, Workflow, Belegscan)
4. Steuerberater-Workflow mit Mandantenfreigabe

Bis dahin müssen Meldungen extern (z. B. via sv.net Classic) eingereicht werden — die korrekten Datensätze stehen in der DB bereit und können exportiert werden.