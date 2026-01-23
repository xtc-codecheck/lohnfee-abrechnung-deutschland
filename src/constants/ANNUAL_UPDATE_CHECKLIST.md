# Jährliche Konstanten-Aktualisierung Checkliste

**Letzte Aktualisierung:** Januar 2025  
**Nächste Aktualisierung:** Januar 2026

## 📋 Übersicht

Diese Checkliste dokumentiert alle sozialversicherungsrechtlichen und steuerlichen Konstanten, die jährlich aktualisiert werden müssen.

---

## 1. Beitragsbemessungsgrenzen (BBG)

**Datei:** `src/constants/social-security.ts`  
**Quelle:** [Deutsche Rentenversicherung](https://www.deutsche-rentenversicherung.de)

| Konstante | 2025 Wert | Zu prüfen |
|-----------|-----------|-----------|
| `BBG_2025_YEARLY.pensionWest` | 90.600 € | ☐ |
| `BBG_2025_YEARLY.pensionEast` | 89.400 € | ☐ |
| `BBG_2025_YEARLY.healthCare` | 62.100 € | ☐ |
| `BBG_2025_MONTHLY.pensionWest` | 7.550 € | ☐ |
| `BBG_2025_MONTHLY.pensionEast` | 7.450 € | ☐ |
| `BBG_2025_MONTHLY.healthCare` | 5.175 € | ☐ |

**Hinweis:** Ab 2025 sind Ost/West-Werte fast angeglichen. Prüfen Sie, ob eine Vereinheitlichung erfolgt.

---

## 2. Sozialversicherungsbeiträge

**Datei:** `src/constants/social-security.ts`  
**Quelle:** [BMG](https://www.bundesgesundheitsministerium.de), [BMAS](https://www.bmas.de)

| Konstante | 2025 Wert | Zu prüfen |
|-----------|-----------|-----------|
| `SOCIAL_INSURANCE_RATES_2025.pension.total` | 18,6% | ☐ |
| `SOCIAL_INSURANCE_RATES_2025.unemployment.total` | 2,6% | ☐ |
| `SOCIAL_INSURANCE_RATES_2025.health.total` | 14,6% | ☐ |
| `SOCIAL_INSURANCE_RATES_2025.health.averageAdditional` | 0,85% | ☐ |
| `SOCIAL_INSURANCE_RATES_2025.care.total` | 3,4% | ☐ |
| `SOCIAL_INSURANCE_RATES_2025.careChildless.employee` | 2,4% | ☐ |

**Hinweis:** Der durchschnittliche Zusatzbeitrag der Krankenkassen ändert sich jährlich!

---

## 3. Minijob / Midijob Grenzen

**Datei:** `src/constants/social-security.ts`  
**Quelle:** [Minijob-Zentrale](https://www.minijob-zentrale.de)

| Konstante | 2025 Wert | Zu prüfen |
|-----------|-----------|-----------|
| `MINIJOB_2025.maxEarnings` | 556 € | ☐ |
| `MIDIJOB_2025.minEarnings` | 556,01 € | ☐ |
| `MIDIJOB_2025.maxEarnings` | 2.000 € | ☐ |
| `MIDIJOB_2025.factor` | 0,6683 | ☐ |

**Hinweis:** Die Minijob-Grenze ist an den Mindestlohn gekoppelt (Mindestlohn × 10 × 13 ÷ 3).

---

## 4. Steuerliche Freibeträge

**Datei:** `src/constants/social-security.ts`  
**Quelle:** [BMF](https://www.bundesfinanzministerium.de)

| Konstante | 2025 Wert | Zu prüfen |
|-----------|-----------|-----------|
| `TAX_ALLOWANCES_2025.basicAllowance` | 12.096 € | ☐ |
| `TAX_ALLOWANCES_2025.childAllowance` | 6.612 € | ☐ |
| `TAX_ALLOWANCES_2025.workRelatedExpenses` | 1.230 € | ☐ |
| `TAX_ALLOWANCES_2025.solidarityTaxFreeAmount` | 19.950 € | ☐ |

---

## 5. Lohnsteuertabelle

**Datei:** `src/constants/social-security.ts`  
**Quelle:** [BMF Lohnsteuer-Programmablaufplan](https://www.bmf-steuerrechner.de)

| Konstante | Beschreibung | Zu prüfen |
|-----------|--------------|-----------|
| `WAGE_TAX_TABLE_2025` | Komplette Lohnsteuertabelle | ☐ |

**KRITISCH:** Die gesamte Lohnsteuertabelle muss jährlich ersetzt werden!

**Quellen für neue Tabelle:**
- BMF Lohnsteuer-Programmablaufplan PAP
- DATEV Lohnsteuertabellen

---

## 6. Sachbezugswerte

**Datei:** `src/utils/gastronomy-payroll.ts`  
**Quelle:** [Sozialversicherungsentgeltverordnung (SvEV)](https://www.gesetze-im-internet.de)

| Konstante | 2025 Wert | Zu prüfen |
|-----------|-----------|-----------|
| Frühstück | 2,17 € | ☐ |
| Mittagessen | 4,13 € | ☐ |
| Abendessen | 4,13 € | ☐ |
| Unterkunft (frei) | 278 € | ☐ |

---

## 7. SOKA-BAU Beiträge

**Datei:** `src/utils/construction-payroll.ts`  
**Quelle:** [SOKA-BAU](https://www.soka-bau.de)

| Konstante | 2025 Wert | Zu prüfen |
|-----------|-----------|-----------|
| SOKA Arbeitgeber | 15,20% | ☐ |
| Winterbeschäftigungs-Umlage | 1,0% | ☐ |
| Wintergeld | 1,00 €/Std | ☐ |

---

## 8. Dienstwagen-Besteuerung

**Datei:** `src/utils/company-car-calculation.ts`  
**Quelle:** [BMF](https://www.bundesfinanzministerium.de)

| Konstante | 2025 Wert | Zu prüfen |
|-----------|-----------|-----------|
| Verbrenner | 1,0% | ☐ |
| Hybrid | 0,5% | ☐ |
| Elektro | 0,25% | ☐ |
| E-Auto Obergrenze | 70.000 € | ☐ |

---

## 9. Krankenversicherungs-Zusatzbeiträge

**Datei:** `src/types/employee.ts` → `GERMAN_HEALTH_INSURANCES`  
**Quelle:** [GKV-Spitzenverband](https://www.gkv-spitzenverband.de)

Jede Krankenkasse hat einen individuellen Zusatzbeitrag. Diese Liste muss jährlich überprüft werden.

---

## 🔄 Update-Prozess

### Vor dem Update:
1. ☐ Neue Werte aus offiziellen Quellen sammeln
2. ☐ BMF-Schreiben zum Jahreswechsel prüfen
3. ☐ Backup der aktuellen Konstanten erstellen

### Während des Updates:
1. ☐ `src/constants/social-security.ts` aktualisieren
2. ☐ Alle `_2025` Suffixe zu `_2026` ändern (oder generisch machen)
3. ☐ Lohnsteuertabelle komplett ersetzen
4. ☐ Sachbezugswerte in Branchen-Modulen aktualisieren

### Nach dem Update:
1. ☐ Alle Unit-Tests ausführen: `npx vitest run`
2. ☐ Golden-Master-Tests mit neuen Referenzwerten aktualisieren
3. ☐ Property-Based Tests ausführen
4. ☐ Manuelle Prüfung mit DATEV-Vergleichsrechner

---

## 📚 Quellenverzeichnis

| Thema | Quelle | URL |
|-------|--------|-----|
| BBG, SV-Sätze | Deutsche Rentenversicherung | deutsche-rentenversicherung.de |
| Lohnsteuer | BMF | bmf-steuerrechner.de |
| Freibeträge | BMF | bundesfinanzministerium.de |
| Minijob | Minijob-Zentrale | minijob-zentrale.de |
| Sachbezüge | SvEV | gesetze-im-internet.de |
| SOKA-BAU | SOKA-BAU | soka-bau.de |
| KV-Zusatzbeiträge | GKV-Spitzenverband | gkv-spitzenverband.de |

---

**Verantwortlich:** Lohnbuchhaltung  
**Letzte Prüfung:** Januar 2025
