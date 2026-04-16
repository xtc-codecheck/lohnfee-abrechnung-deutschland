# @lohnpro/payroll-core

Reine Berechnungs-Bibliothek für deutsche Lohnabrechnung.
**Keine UI, keine Supabase, keine React-Abhängigkeiten.**

## Zweck

Diese Bibliothek ist so geschnitten, dass sie 1:1 in das SYSTAX-Hauptsystem
übernommen werden kann und dort das vorhandene Lohnmodul **vollständig
ersetzt**.

## Version

- **2026.1.0** (PAP 2025/2026, BMF-konform, cent-genau)
- 571 Tests (Unit / Integration / Property-Based / Golden-Master)

## Verwendung

```ts
import {
  calculateNetSalary,
  calculatePayroll,
  PAYROLL_CORE_VERSION,
} from '@/payroll-core';
```

## Module

| Bereich            | Inhalt                                                 |
|--------------------|--------------------------------------------------------|
| Tax-Engine         | Lohnsteuer, Soli, Kirchensteuer, Jahresausgleich       |
| Social Security    | KV / RV / AV / PV (Ost/West, Kinder, Zusatzbeitrag)    |
| Payroll Engine     | Brutto→Netto-Master-Berechnung                         |
| Industry Modules   | Bau (SOKA-BAU), Gastro, Pflege (TVöD-P)                |
| Special Calc       | bAV, Dienstwagen, Pfändung, Mehrfachbeschäftigung      |
| Specials           | Märzklausel, Entgeltfortzahlung, Mutterschaft          |
| Reporting          | DATEV, GoBD, ELStAM-Validierung, FiBu                  |
| Audit              | Calculation-Audit-Trail (Revisionssicherheit)          |

## Übergabe an SYSTAX

Siehe [`/docs/SYSTAX-INTEGRATION-GUIDE.md`](../../docs/SYSTAX-INTEGRATION-GUIDE.md).
