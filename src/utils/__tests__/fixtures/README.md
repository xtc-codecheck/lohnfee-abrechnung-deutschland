# BMF-PAP-Fixtures 2025 / 2026

## Zweck

Diese Fixtures dienen als **externer Referenz-Anker** für die Lohnsteuerberechnung.
Sie validieren, dass `calculateTariflicheEStPAP2025()` und `calculateCompleteTax()`
**cent-genau** mit dem amtlichen Programmablaufplan des BMF übereinstimmen.

## Quellen

Die Werte stammen aus dem offiziellen **Programmablaufplan zur maschinellen
Lohnsteuerberechnung** des Bundesministeriums der Finanzen:

- **PAP 2025**: BMF-Schreiben vom 22.11.2024 (IV C 5 – S 2361/19/10008 :008)
- **PAP 2026**: BMF-Schreiben (Veröffentlichung Nov./Dez. 2025 erwartet)

Die Tarif-Formeln sind in § 32a EStG kodifiziert und im PAP 1:1 umgesetzt.

## Wichtig: Pflegehinweis

**Vor jedem Jahreswechsel** müssen diese Fixtures gegen den neu publizierten
BMF-PAP verifiziert und ggf. ergänzt werden. Siehe
`src/constants/ANNUAL_UPDATE_CHECKLIST.md`.

## Struktur

| Datei | Inhalt |
|-------|--------|
| `bmf-pap-2025.ts` | Stützstellen Lohnsteuer 2025 (alle StKl, Brutto-Bandbreite, KiSt) |
| `bmf-pap-2026.ts` | Stützstellen Lohnsteuer 2026 |
| `sv-bmg-2025.ts`  | BBG-Stützstellen SV 2025 (KV/RV/AV/PV, Ost/West) |
| `sv-bmg-2026.ts`  | BBG-Stützstellen SV 2026 |

## Akzeptanzkriterium

**Diff zwischen Engine-Output und Fixture: max. 0 ¢ pro Steuer-/SV-Wert.**

Falls ein Test fehlschlägt:
1. STOP — keine Silent-Fixes in der Engine.
2. Befund dokumentieren in `docs/AUDIT-2026-04.md`.
3. Mit Steuerberater abklären, welche Seite (Engine oder Fixture) korrigiert wird.
