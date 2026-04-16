/**
 * useLohnFeatureFlag
 * ─────────────────────────────────────────────────────────────
 * Liest Feature-Flags aus.
 *
 * Standalone-Modus (LohnPro):
 *   • Liefert lokalen Default (in der Regel `true`).
 *
 * SYSTAX-Modus (Übernahme ins Hauptsystem):
 *   • Liest aus `feature_flags` / `plan_modules` Tabelle des
 *     SYSTAX-Hauptsystems (Modul-Key: "lohn").
 *   • Erlaubt z. B. Branchen-Module (Bau/Gastro/Pflege),
 *     AI-Guardian oder Autolohn pro Plan/Mandant zu schalten.
 *
 * Bekannte Flags – siehe `LohnFeatureFlag` Union.
 */

export type LohnFeatureFlag =
  | "industry.construction"
  | "industry.gastronomy"
  | "industry.nursing"
  | "ai.payroll-guardian"
  | "automation.autolohn"
  | "export.datev"
  | "export.gobd"
  | "salary.benchmarking";

const LOCAL_DEFAULTS: Record<LohnFeatureFlag, boolean> = {
  "industry.construction": true,
  "industry.gastronomy": true,
  "industry.nursing": true,
  "ai.payroll-guardian": true,
  "automation.autolohn": true,
  "export.datev": true,
  "export.gobd": true,
  "salary.benchmarking": true,
};

export function useLohnFeatureFlag(flag: LohnFeatureFlag): boolean {
  // TODO (SYSTAX-Integration):
  //   const { data } = useQuery({
  //     queryKey: ["feature_flags", "lohn", flag],
  //     queryFn: () => fetchFeatureFlag("lohn", flag),
  //   });
  //   return data ?? LOCAL_DEFAULTS[flag];
  return LOCAL_DEFAULTS[flag];
}
