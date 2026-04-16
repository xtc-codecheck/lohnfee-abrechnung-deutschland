/**
 * @lohnpro/payroll-core
 * ─────────────────────────────────────────────────────────────────────
 * Standalone-Berechnungs-Bibliothek für deutsche Lohnabrechnung.
 *
 * Diese Bibliothek enthält ausschließlich reine Berechnungslogik
 * (keine UI, keine Supabase, keine React-Abhängigkeiten).
 *
 * Sie ist so konzipiert, dass sie 1:1 in das SYSTAX-Hauptsystem
 * übernommen werden kann und das dort vorhandene Lohnmodul
 * vollständig ersetzt.
 *
 * Version:   2026.1.0
 * Stand:     PAP 2025/2026 (BMF-konform, cent-genau)
 * Tests:     571 Unit-/Integration-/Property-/Golden-Master-Tests
 * Lizenz:    Intern (LohnPro → SYSTAX)
 *
 * Public API – nach Domänen geordnet:
 *
 *   • Tax-Engine        Lohnsteuer, Soli, Kirchensteuer, Jahresausgleich
 *   • Social Security   KV/RV/AV/PV (Ost/West, Kinder, Zusatzbeitrag)
 *   • Payroll Engine    Brutto→Netto-Master-Berechnung
 *   • Industry Modules  Bau (SOKA-BAU), Gastro, Pflege (TVöD-P)
 *   • Special Calc      bAV, Dienstwagen, Pfändung, Mehrfachbeschäft.
 *   • Specials          Märzklausel, Entgeltfortzahlung, Mutterschaft
 *   • Reporting         DATEV, GoBD, ELStAM-Validierung
 *   • Audit             Calculation-Audit-Trail (Revisionssicherheit)
 * ─────────────────────────────────────────────────────────────────────
 */

export const PAYROLL_CORE_VERSION = '2026.1.0' as const;
export const PAYROLL_CORE_JURISDICTION = 'DE' as const;
export const PAYROLL_CORE_SUPPORTED_YEARS = [2025, 2026] as const;

// ── Tax-Engine ──────────────────────────────────────────────────────
export * from '@/utils/tax-calculation';
// tax-params-factory: re-export ohne `getChurchTaxRate` (Konflikt mit tax-calculation)
export {
  createTaxParams,
  createSocialSecurityParams,
  buildPayrollContext,
} from '@/utils/tax-params-factory';
export * from '@/utils/besondere-lohnsteuertabelle';
export * from '@/utils/annual-tax-reconciliation';

// ── Social Security ─────────────────────────────────────────────────
export * from '@/constants/social-security';

// ── Payroll Master Engine ───────────────────────────────────────────
export * from '@/utils/payroll-calculator';
export * from '@/utils/net-to-gross-calculation';
export * from '@/utils/payroll-correction';

// ── Industry Modules ────────────────────────────────────────────────
// Hinweis: Beide Branchen-Module exportieren `calculateSfnBonuses` —
// daher als Namespace-Re-Exports, um Konflikte zu vermeiden.
export * as constructionPayroll from '@/utils/construction-payroll';
export * as gastronomyPayroll from '@/utils/gastronomy-payroll';
export * as nursingPayroll from '@/utils/nursing-payroll';

// ── Special Calculations ────────────────────────────────────────────
export * from '@/utils/bav-calculation';
export * from '@/utils/company-car-calculation';
export * from '@/utils/garnishment-calculation';
export * from '@/utils/multiple-employment';
export * from '@/utils/maerzklausel';
export * from '@/utils/entgeltfortzahlung';
export * from '@/utils/maternity-benefit';
export * from '@/utils/health-insurance-comparison';

// ── Reporting & Export ──────────────────────────────────────────────
export * from '@/utils/datev-export';
export * from '@/utils/gobd-export';
export * from '@/utils/elstam-validation';
export * from '@/utils/fibu-booking';

// ── Audit & Forecast ────────────────────────────────────────────────
export * from '@/utils/calculation-audit';
export * from '@/utils/anomaly-detection';
export * from '@/utils/salary-forecast';
export * from '@/utils/salary-benchmarking';

// ── Type-Exports ────────────────────────────────────────────────────
export type {
  Employee,
  SalaryCalculation,
} from '@/types/employee';
export type {
  PayrollPeriod,
  PayrollEntry,
  PayrollStatus,
  PayrollSummary,
  PayrollReport,
  WorkingTimeData,
  Deductions,
  Additions,
} from '@/types/payroll';
