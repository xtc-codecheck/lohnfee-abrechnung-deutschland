/**
 * SYSTAX Legacy Payroll → LohnPro Migration
 * ──────────────────────────────────────────────────────────────────────
 * Dieses Modul ist ein STUB mit klar definierter Schnittstelle.
 *
 * Es wird im Rahmen der Übernahme in SYSTAX konkret befüllt, sobald
 * das Schema des bestehenden SYSTAX-Lohnmoduls offiziell vorliegt.
 *
 * Die Schnittstelle ist bewusst stabil gehalten, damit der Aufrufer
 * im SYSTAX-CI-Pipeline (Migrations-Job) sich nicht ändern muss.
 *
 * Verwendung (geplant):
 *   const result = await migrateLegacyPayrollData({
 *     sourceTenantId: "...",
 *     targetTenantId: "...",
 *     dryRun: true,
 *   });
 *
 * Siehe `/docs/SYSTAX-INTEGRATION-GUIDE.md` → Abschnitt "Datenmigration".
 * ──────────────────────────────────────────────────────────────────────
 */

import { Employee } from "@/types/employee";
import { PayrollEntry, PayrollPeriod } from "@/types/payroll";

export interface LegacyMigrationOptions {
  sourceTenantId: string;
  targetTenantId: string;
  /** Wenn `true`, werden keine Inserts ausgeführt – nur Mapping geprüft. */
  dryRun?: boolean;
  /** Optional: Nur ab diesem Jahr migrieren (z. B. 2024). */
  fromYear?: number;
}

export interface LegacyMigrationReport {
  employees: { read: number; mapped: number; failed: number };
  periods:   { read: number; mapped: number; failed: number };
  entries:   { read: number; mapped: number; failed: number };
  warnings: string[];
  errors: string[];
  durationMs: number;
}

/**
 * Generischer Schema-Mapper-Typ für die Übergabe.
 * SYSTAX-Altschema (Source) ist hier intentional `unknown`, weil
 * es nicht im Repo liegt – die konkrete Mapping-Implementierung
 * erfolgt im Rahmen der Übernahme.
 */
export type LegacyEmployeeMapper = (legacyRow: unknown) => Employee | null;
export type LegacyPeriodMapper = (legacyRow: unknown) => PayrollPeriod | null;
export type LegacyEntryMapper = (legacyRow: unknown) => PayrollEntry | null;

export interface LegacyMappers {
  mapEmployee: LegacyEmployeeMapper;
  mapPeriod: LegacyPeriodMapper;
  mapEntry: LegacyEntryMapper;
}

/**
 * Stub – wird in SYSTAX konkret implementiert.
 * Wirft absichtlich bei direkter Benutzung im LohnPro-Standalone.
 */
export async function migrateLegacyPayrollData(
  _options: LegacyMigrationOptions,
  _mappers?: Partial<LegacyMappers>
): Promise<LegacyMigrationReport> {
  throw new Error(
    "[systax-legacy-migration] Stub – wird in SYSTAX-Integration mit konkreten Mappern befüllt. " +
      "Siehe /docs/SYSTAX-INTEGRATION-GUIDE.md → Abschnitt 'Datenmigration'."
  );
}

/**
 * Validiert, ob ein gemapptes Employee-Objekt LohnPro-konform ist
 * (Pflichtfelder, Plausibilität). Hilft beim Pre-Flight im Dry-Run.
 */
export function validateMappedEmployee(emp: Partial<Employee>): string[] {
  const errors: string[] = [];
  if (!emp.firstName) errors.push("firstName fehlt");
  if (!emp.lastName) errors.push("lastName fehlt");
  if (typeof emp.grossSalary !== "number" || emp.grossSalary < 0)
    errors.push("grossSalary ungültig");
  return errors;
}
