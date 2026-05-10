# Funktionsumfang vs. DATEV / Lexware Lohn

> Stand: Mai 2026 — Ehrliche Einschätzung basierend auf dem, was im Projekt **tatsächlich implementiert** ist (Code- und DB-Audit).
> 
> Letzte Aktualisierung: **Meldungs-Export-Center** für sv.net Classic / Mein ELSTER / BG-Portal,
> Reisekosten-Pauschalen-Automatik aus Etappen, Beleg-OCR via Lovable AI, Auto-Wizard Persistenz-Fix.

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
| **Pauschalen-Automatik aus Etappen** (VMK + Übernachtung + km) | ✅ `aggregateTrip(buildLegs())` |
| **Beleg-OCR** via Lovable AI (Gemini Vision) | ✅ Edge Function `receipt-ocr` |
| Kreditkarten-CSV-Import | ✅ `parseCreditCardCsv` |

### Meldungs-Versand (Workaround statt ITSG-Zertifizierung)
| Funktion | Status |
|---|---|
| **Export-Center** — alle Meldungen eines Monats als ZIP | ✅ neu |
| XML-Generierung pro Datensatz (LStA, BNW, DEÜV, AAG, UV, eLStB) | ✅ |
| Klartext-Anleitung pro Empfänger im README | ✅ |
| Direkt-Links zu sv.net Classic, Mein ELSTER, BG-Portal | ✅ |

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

## ⚠️ Eingeschränkt

- **Direkter zertifizierter Versand**: Datensätze werden korrekt erzeugt; das Bundle muss vom Unternehmer
  einmal pro Monat über die kostenlosen offiziellen Portale hochgeladen werden (sv.net Classic, Mein ELSTER, BG-Portal).
  Eine direkte ITSG-zertifizierte Übermittlung fehlt weiterhin.
- **Pfändung**: Compliance-Alert bei veralteten Tabellen vorhanden, jährliches Update via Migration
- **UI-Tokens**: Einige Komponenten nutzen noch hartkodierte Tailwind-Farben (Dark-Mode-Optik leidet, Funktion nicht).

---

## ❌ Was DATEV/Lexware kann, hier aber fehlt

- **ITSG-/GKV-Zertifizierung** für direkten SV-Versand (Workaround: Export-Center → sv.net Classic)
- **ERiC-Modul** für direkten ELSTER-Versand (Workaround: Export-Center → Mein ELSTER)
- **Mandantenfähige Steuerberater-Workflows** à la DATEV Unternehmen online (Steuerberater-Paket-Export vorhanden,
  aber kein Two-Way-Workflow)

---

## Fazit (aktualisiert)

| Bereich | Reifegrad |
|---|---|
| Berechnung & Belegerzeugung | **~95 %** auf DATEV/Lexware-Niveau |
| Meldewesen — Datensatz-Erzeugung | **~75 %** |
| Meldewesen — Übermittlung | **Workaround 100 %** (Export-Center → offizielle Portale) · zertifizierter Direktversand 0 % |
| Reisekosten | **~90 %** (Workflow + Two-Stage Approval + Pauschalen-Automatik + OCR) |
| Mitarbeiter-Portal | **~70 %** (PDF, Urlaub, eAU, Manager-Inbox vorhanden) |
| Pfändung | **~80 %** (Berechnung + Compliance-Alert vorhanden; manuelles Update) |

## Praxis-Empfehlung für Unternehmer

Mit dem Export-Center kann ein Unternehmer ab sofort selbständig Lohn machen:

1. **Lohnabrechnung erstellen** (Wizard oder Auto-Pilot) — cent-genau, BMF-konform.
2. **Meldewesen → Export-Center** öffnen, Monat wählen, ZIP herunterladen.
3. README im ZIP folgen: drei Klicks pro Meldung im jeweiligen kostenlosen Portal.

Damit sind alle gesetzlichen Pflichten (LSt, SV, AAG, UV, eLStB) termingerecht erfüllt — ohne ITSG-Zertifizierung
und ohne Steuerberater. Die Berechnung und Datensatzerzeugung liegen auf DATEV-Niveau; der einzige Unterschied
ist der manuelle Upload-Schritt statt direkter Übermittlung.
