---
name: Multilingual Payslip (DE/EN)
description: PDF-Lohnzettel in DE oder EN pro Mitarbeiter; englische Fassung ist nur Übersetzungshilfe.
type: feature
---
- **DB:** `employees.payslip_language` ('de' | 'en', default 'de', CHECK constraint).
- **Type:** `Employee.personalData.payslipLanguage`.
- **Wörterbuch:** `src/utils/payroll-pdf-i18n.ts` mit Labels + `formatPayslipCurrency` (Intl).
- **Generator:** `generatePayrollPdf` und `downloadPayrollPdf` akzeptieren `locale: 'de' | 'en'`.
- **UI:** Auswahl im Edit-Mitarbeiter-Dialog (Tab "Persönliche Daten"); Lohnjournal hat Default-PDF (Mitarbeiter-Sprache) + Sprach-Toggle-Button (jeweils andere Sprache).
- **Recht:** Englische Lohnzettel haben Disclaimer im Footer: rechtsverbindlich bleibt die deutsche Fassung (deutsches Steuer-/SV-Recht).
