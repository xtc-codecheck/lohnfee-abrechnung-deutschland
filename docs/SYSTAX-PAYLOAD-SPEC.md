# SYSTAX Payload Specification – payroll-core → SYSTAX

**Version:** 1.0 · **Stand:** 2026-04-22 · **Quell-Interfaces:** `src/types/systax-integration.ts`

Dieses Dokument definiert verbindlich, welche Datenfelder `payroll-core` an das SYSTAX-Hauptsystem übergibt. SYSTAX übernimmt die echte Übermittlung an Finanzamt (ELSTER), Krankenkasse (DEÜV/SV-Meldeportal) und Bank (SEPA/finAPI).

**Live-Architektur:**

```
┌──────────────────────┐    Payload     ┌─────────────────────┐    XML/SEPA    ┌──────────────────┐
│  payroll-core        │ ──────────────▶│  SYSTAX (Haupt)     │ ──────────────▶│  Finanzamt /     │
│  (Berechnung +       │                │  ELSTER/finAPI/     │                │  Krankenkasse /  │
│   Persistenz)        │ ◀── Status ────│  Adapter            │ ◀── Antwort ───│  Bank            │
└──────────────────────┘                └─────────────────────┘                └──────────────────┘
```

---

## 1. Lohnsteueranmeldung (§ 41a EStG)

**Interface:** `LohnsteueranmeldungPayload`  
**SYSTAX-Methode:** `IElsterService.submitLohnsteueranmeldung(payload)`  
**Rückgabe:** `ElsterTransferResult { success, transferTicket, errors[], warnings[] }`

| Feld | Typ | Quelle DB | Pflicht | Beispiel |
|---|---|---|---|---|
| `steuernummer` | string (13) | `company_settings.tax_number` | ✅ | `2949081508156` |
| `finanzamt` | string | `company_settings.tax_office` | ✅ | `Finanzamt Berlin Mitte` |
| `anmeldezeitraum` | enum | `lohnsteueranmeldungen.anmeldezeitraum` | ✅ | `monatlich` |
| `year` / `month` | int | period | ✅ | 2026 / 4 |
| `summeLohnsteuer` | number(2) | Σ `payroll_entries.tax_income_tax` | ✅ | 12450.30 |
| `summeSolidaritaetszuschlag` | number(2) | Σ `payroll_entries.tax_solidarity` | ✅ | 0.00 |
| `summeKirchensteuerEv` | number(2) | Σ `payroll_entries.tax_church` (ev.) | ✅ | 432.10 |
| `summeKirchensteuerRk` | number(2) | Σ `payroll_entries.tax_church` (rk.) | ✅ | 312.40 |
| `summePauschaleLohnsteuer` | number(2) | Σ Minijob/Sachbezug § 40a | ✅ | 124.50 |
| `gesamtbetrag` | number(2) | Summe aller obigen | ✅ | 13319.30 |
| `anzahlArbeitnehmer` | int | distinct employees in period | ✅ | 12 |
| `istKorrektur` | bool | flag | ✅ | false |
| `korrekturVon` | uuid | optional | ⛔ | — |

---

## 2. Lohnsteuerbescheinigung (§ 41b EStG)

**Interface:** `LohnsteuerbescheinigungPayload` · **eine Bescheinigung pro Arbeitnehmer/Jahr**

| Feld | Quelle | Pflicht |
|---|---|---|
| `year`, `employeeId` | period + employee | ✅ |
| `steuerIdentifikationsnummer` | `employees.tax_id` | ✅ |
| `steuerklasse` | `employees.tax_class` (I–VI) | ✅ |
| `kinderfreibetraege` | `employees.children_allowance` | ✅ |
| `religion` | `employees.church_tax` + `church_tax_rate` → ev/rk/--- | ⚠ |
| `zeitraumVon`/`zeitraumBis` | `employees.entry_date` / `exit_date` | ✅ |
| `zeile3Bruttolohn` | Σ `payroll_entries.gross_salary` Jahr | ✅ |
| `zeile4Lohnsteuer` | Σ `payroll_entries.tax_income_tax` | ✅ |
| `zeile5Soli` | Σ `tax_solidarity` | ✅ |
| `zeile6Kirchensteuer` / `zeile7KirchensteuerEhegatte` | Σ `tax_church` | ⚠ |
| `zeile22a/b RV AN/AG` | Σ `sv_pension_employee` / `sv_pension_employer` | ✅ |
| `zeile23a/b KV AN/AG` | Σ `sv_health_*` | ✅ |
| `zeile24a/b AV AN/AG` | Σ `sv_unemployment_*` | ✅ |
| `zeile25 PV AN` / `zeile26 PV AG` | Σ `sv_care_*` | ✅ |

---

## 3. SV-Meldungen (DEÜV)

**Interface:** `SvMeldungPayload`

| Feld | Quelle DB | Pflicht |
|---|---|---|
| `betriebsnummerAg` | `company_settings.betriebsnummer` | ✅ |
| `betriebsnummerKk` | `sv_meldungen.betriebsnummer_kk` | ✅ |
| `svNummer` | `employees.sv_number` (12-stellig, validiert) | ✅ |
| `meldegrund` | enum (`anmeldung`, `abmeldung`, `jahresmeldung`, `unterbrechung`, `aenderung`, `gkv_monatsmeldung`) | ✅ |
| `meldegrundSchluessel` | DEÜV-Schlüssel (z.B. `10`, `30`, `50`, `70`) | ✅ |
| `personengruppe` | DEÜV-Personengruppen-Schlüssel (z.B. `101` = sozialversicherungspflichtig) | ✅ |
| `beitragsgruppe` | 4-stellig (z.B. `1111` = volle SV) | ✅ |
| `zeitraumVon`/`zeitraumBis` | period | ✅ |
| `svBrutto` | Σ `payroll_entries.gross_salary` SV-pflichtig | ✅ |

---

## 4. Beitragsnachweis (Krankenkasse)

**Interface:** `BeitragsnachweisPayload` · 1 pro Krankenkasse/Monat

Alle Felder werden direkt aus aggregierten `payroll_entries` summiert. Schlüsselwerte 1:1 in der DB-Tabelle `beitragsnachweise` gespeichert.

---

## 5. SEPA / finAPI – Gehaltsüberweisungen

**Interface:** `SalaryBatchPayment` · `IFinApiService.submitBatchPayment`

| Feld | Quelle DB | Pflicht |
|---|---|---|
| `batchId` | `tenant_id + period_id` | ✅ |
| `senderName` | `company_settings.company_name` | ✅ |
| `senderIban` | `company_settings.iban` (validiert IBAN-Checksum) | ✅ |
| `senderBic` | `company_settings.bic` | ⚠ |
| `payments[]` | je Mitarbeiter ein Eintrag | ✅ |
| `payments[].recipientIban` | `employees.iban` (validiert) | ✅ |
| `payments[].amount` | `payroll_entries.final_net_salary` | ✅ |
| `payments[].purpose` | `Lohn ${month}/${year}` | ✅ |
| `payments[].executionDate` | i.d.R. letzter Werktag des Monats | ✅ |
| `totalAmount` | Σ `final_net_salary` | ✅ |

---

## 6. Datenqualitäts-Garantien (payroll-core ↔ SYSTAX)

- **Cent-genau:** Alle Beträge sind als `number(2)` (max. 2 Nachkommastellen) übergeben. payroll-core garantiert, dass die Aggregate (z.B. `summeLohnsteuer`) bis auf den letzten Cent mit den Einzeleinträgen übereinstimmen.
- **BMF-konform:** Die Berechnung erfolgt nach § 32a EStG i.d.F. JStG 2024 (2025) bzw. ab VZ 2026. Verifiziert gegen `bmf-pap-2025.ts` / `bmf-pap-2026.ts` Fixtures, **0 ¢ Diff**.
- **Idempotenz:** Wiederholte Übermittlung mit identischer `transferTicket`-Bedingung muss SYSTAX deduplizieren. payroll-core liefert bei Korrekturen `istKorrektur=true` + `korrekturVon=<UUID>`.
- **Validierung:** SV-Nr. (12-stellig + Prüfziffer), IBAN (ISO 13616), Steuer-ID (11-stellig + Prüfziffer) werden in `lib/validations/german-checksums.ts` vor Übergabe geprüft.

---

## 7. Offene Punkte für SYSTAX-Team

- [ ] Bestätigung: SYSTAX akzeptiert Payload-Format 1:1 oder benötigt Adapter?
- [ ] Authentifizierung: API-Key per Tenant oder shared? (`SYSTAX_API_KEY` als Secret)
- [ ] Endpoint-URLs Test/Prod
- [ ] Retry-Policy: wer macht Retries (payroll-core oder SYSTAX-Gateway)?
- [ ] Echte ELSTER-ERiC-Integration: nur SYSTAX-Seite (payroll-core ruft kein ERiC)

**Abnahme:** Diese Spec wird vom SYSTAX-Team gegengezeichnet, bevor die Übergabe live geschaltet wird.