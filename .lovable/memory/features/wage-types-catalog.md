---
name: Lohnarten-Katalog
description: Frei konfigurierbare Bezüge & Abzüge (VWL, Sachbezug, Pfändung, Zuschüsse) pro Mandant + Mitarbeiter-Zuordnung
type: feature
---
Lohnarten-Katalog (Phase P4):
- Tabellen `wage_types` (Mandanten-Katalog) und `employee_wage_types` (wiederkehrende Zuordnung pro Mitarbeiter mit valid_from/valid_to)
- Kategorien: bezug, abzug, sachbezug, pauschalsteuer, pfaendung, vwl, zuschuss, sonstiges
- Steuerliche Felder: is_taxable, is_sv_relevant, pauschal_tax_rate (%), Konten SKR03/SKR04
- Standardkatalog: VWL, Fahrtkostenzuschuss (15% pauschal), Kindergartenzuschuss, 50€-Sachbezug, Jobticket, Essenszuschuss (25%), Pfändung, AG-Darlehen, Prämie, Internetpauschale (25%)
- UI: Settings → Lohnarten (Verwaltung), Mitarbeiter-Edit → Tab "Lohnarten" (Zuordnung)
- System-Lohnarten (is_system=true) sind nicht löschbar
- TODO: Integration in payroll-calculator noch ausstehend (Daten/UI bereits funktionsfähig zur Erfassung)
