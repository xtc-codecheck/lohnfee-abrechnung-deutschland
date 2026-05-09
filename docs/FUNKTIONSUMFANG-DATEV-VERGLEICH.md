# Funktionsumfang vs. DATEV / Lexware Lohn

> Stand: Mai 2026 — Ehrliche Einschätzung basierend auf dem, was im Projekt **tatsächlich implementiert** ist (Code- und DB-Audit).
> 
> Letzte Aktualisierung: Reisekosten-Genehmigungs-Workflow, Pfändungs-Compliance-Alert, Mitarbeiter-Portal-Erweiterungen.

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

### Reisekosten & Spesen (Workflow)
| Funktion | Status |
|---|---|
| Stammdaten: Reisen, Etappen, Belege | ✅ `travel_trips`, `travel_legs`, `travel_receipts` |
| **Two-Stage Approval** (>= 1.000 € erfordert zweite Freigabe durch anderen Genehmiger) | ✅ |
| **Rejection-Dialog** mit Pflichtkommentar | ✅ |
| **Audit-Log** (`travel_approval_log`) | ✅ |
| Verpflegungs-Pauschalen, Übernachtungs-Pauschalen | ✅ (hinterlegt, manuelle Eingabe) |
| **Keine** Beleg-OCR / Belegscan-Automatik | ❌ |

### Mitarbeiter-Self-Service Portal
| Funktion | Status |
|---|---|
| Lohnabrechnung als PDF herunterladen (jsPDF) | ✅ |
| Urlaubsantrag + Saldo-Anzeige | ✅ |
| **Manager-Inbox** (Freigabe/Ablehnung von Urlaubsanträgen) | ✅ |
| **eAU-Self-Service** (elektronische Arbeitsunfähigkeitsbescheinigung hochladen) | ✅ |

### Pfändung & Compliance
| Funktion | Status |
|---|---|
| Pfändungsberechnung (BMJ-Tabellen 2025/2026) | ✅ |
| **Compliance-Alert** bei Tabellen > 2 Jahre alt | ✅ |
| Jährliches Update der Tabellen | Manuell per Migration |

---

## ⚠️ Eingeschränkt / nur intern

- **Übermittlung** aller Meldungen erfolgt aktuell nur über einen **Stub-Provider** (`sv-net-submit` Edge Function). Datensätze werden korrekt erzeugt, der echte Versand an Krankenkassen/Finanzamt fehlt.
- **ELSTER**: nur Facade über SYSTAX-Layer, keine direkte ERiC-Anbindung
- **SV-Meldungen**: erzeugt + valide, aber keine sv.net/ITSG-zertifizierte Übermittlung
- **Reisekosten**: Workflow + Approval vorhanden, aber **keine** Pauschalen-Automatik (System errechnet nicht automatisch VMK aus Etappen), **kein** Beleg-OCR
- **Pfändung**: Compliance-Alert bei veralteten Tabellen vorhanden, aber jährliches Update erfordert weiterhin manuelle Migration

---

## ❌ Was DATEV/Lexware kann, hier aber fehlt

- **ITSG-/GKV-Zertifizierung** für SV-Meldungen (rechtliche Voraussetzung für Echtbetrieb)
- **ERiC-Modul** für direkte ELSTER-Übermittlung
- **dakota.le / sv.net-Integration** (produktiver Provider)
- **Mandantenfähige Steuerberater-Workflows** mit Freigabe und Mandantenkommunikation à la DATEV Unternehmen online (Steuerberater-Paket-Export ist vorhanden, aber kein Two-Way-Workflow)
- **Reisekostenabrechnung** als vollautomatisches Modul (Pauschalen-Automatik aus Etappen, Beleg-OCR, automatische Verbuchung auf Lohnarten)

---

## Fazit (aktualisiert)

| Bereich | Reifegrad |
|---|---|
| Berechnung & Belegerzeugung | **~95 %** auf DATEV/Lexware-Niveau |
| Meldewesen — Datensatz-Erzeugung | **~75 %** |
| Meldewesen — zertifizierte Übermittlung | **~10 %** (Stub-Provider, kein echter Versand) |
| Reisekosten | **~60 %** (Workflow + Two-Stage Approval + Audit Log vorhanden; fehlt: Pauschalen-Automatik, OCR) |
| Mitarbeiter-Portal | **~70 %** (PDF, Urlaub, eAU, Manager-Inbox vorhanden) |
| Pfändung | **~80 %** (Berechnung + Compliance-Alert vorhanden; manuelles Update) |

**Nächste große Schritte für den Echtbetrieb:**
1. ITSG-Zertifizierung + produktive sv.net/dakota.le-Anbindung (ersetzt Stub in `sv-net-submit`)
2. ERiC-Anbindung für direkte ELSTER-Übermittlung (LStA, eLStB)
3. Reisekostenmodul ausbauen (Pauschalen-Automatik aus Etappen, Beleg-OCR)
4. Steuerberater-Workflow mit Mandantenfreigabe

Bis dahin müssen Meldungen extern (z. B. via sv.net Classic) eingereicht werden — die korrekten Datensätze stehen in der DB bereit und können exportiert werden.
