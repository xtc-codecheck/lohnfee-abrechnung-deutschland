---
name: Lohnarten-Katalog
description: Frei konfigurierbare Bezüge & Abzüge (VWL, Sachbezug, Pfändung, Zuschüsse) pro Mandant + Mitarbeiter-Zuordnung, voll im Calculator integriert
type: feature
---
Lohnarten-Katalog (Phase P4 — vollständig):
- Tabellen `wage_types` (Mandanten-Katalog) und `employee_wage_types` (wiederkehrende Zuordnung pro Mitarbeiter mit valid_from/valid_to)
- Kategorien: bezug, abzug, sachbezug, pauschalsteuer, pfaendung, vwl, zuschuss, sonstiges
- Steuerliche Felder: is_taxable, is_sv_relevant, pauschal_tax_rate (%), Konten SKR03/SKR04
- Standardkatalog (10 Lohnarten): VWL, Fahrtkostenzuschuss (15% pauschal), Kindergartenzuschuss, 50€-Sachbezug, Jobticket, Essenszuschuss (25%), Pfändung, AG-Darlehen, Prämie, Internetpauschale (25%)
- UI: Settings → Lohnarten (Verwaltung), Mitarbeiter-Edit → Tab "Lohnarten" (Zuordnung)
- System-Lohnarten (is_system=true) sind nicht löschbar
- **Calculator-Integration**: `applyWageTypes()` in `src/utils/wage-types-integration.ts` wendet aktive Zuordnungen auf eine Abrechnung an:
  - bezug/zuschuss steuerpflichtig → erhöht Brutto (fließt in Steuer/SV)
  - VWL → erhöht Brutto + reduziert Netto (AG-Zuschuss wird an Bank gezahlt)
  - Pauschalsteuer-Lohnarten → AG trägt Pauschal-LSt, AN-Auszahlung erhält Betrag steuerfrei
  - Sachbezug (steuerpflichtig) → Brutto + Netto-Abzug (geldwerter Vorteil)
  - 50€-Sachbezug steuerfrei → kein Effekt
  - Pfändung/Abzug → reine Netto-Reduktion
  - Steuerfreie Zuschüsse (Kiga §3 Nr.33, Jobticket §3 Nr.15) → erhöhen Auszahlung
- Hook `useTenantEmployeeWageTypes` lädt alle aktiven Zuordnungen eines Mandanten gebündelt für den Wizard
- Anzeige: `AppliedWageTypesCard` in der Payroll-Detail-Ansicht (aufklappbar pro Mitarbeiter)
- Tests: 8 Unit-Tests in `src/utils/__tests__/wage-types-integration.test.ts`
