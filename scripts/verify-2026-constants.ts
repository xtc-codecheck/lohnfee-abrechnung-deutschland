#!/usr/bin/env bun
/**
 * Verify-2026-Constants
 * ─────────────────────────────────────────────────────────────
 * Vergleicht die in `src/constants/social-security.ts` hinterlegten
 * 2026-Werte mit den Soll-Werten aus `docs/CONSTANTS-VERIFIED-2026.md`.
 *
 * Exit-Code:
 *   0 = alles in Ordnung
 *   1 = mindestens eine Abweichung — Build/CI muss failen
 *
 * Anwendung:
 *   bun scripts/verify-2026-constants.ts
 *
 * Pflege: Sobald BMF-Schreiben Q4/2025 oder die endgültige
 * Sozialversicherungs-Rechengrößenverordnung 2026 final ist, hier
 * die EXPECTED-Tabelle aktualisieren — der Lauf erzwingt dann den
 * Code-Sync.
 */

import {
  BBG_2026_YEARLY,
  BBG_2026_MONTHLY,
  SOCIAL_INSURANCE_RATES_2026,
  TAX_ALLOWANCES_2026,
  TAX_RATES_2026,
  MINIJOB_2026,
} from '../src/constants/social-security';

interface Check {
  label: string;
  expected: number;
  actual: number;
  source: string;
}

const CHECKS: Check[] = [
  // BBG 2026
  { label: 'BBG RV/AV West (jährlich)', expected: 96600, actual: BBG_2026_YEARLY.pensionWest, source: 'SV-RechGrV 2026' },
  { label: 'BBG RV/AV Ost (jährlich, einheitlich)', expected: 96600, actual: BBG_2026_YEARLY.pensionEast, source: 'SV-RechGrV 2026' },
  { label: 'BBG KV/PV (jährlich)', expected: 66150, actual: BBG_2026_YEARLY.healthCare, source: 'SV-RechGrV 2026' },
  { label: 'BBG RV/AV West (monatlich)', expected: 8050, actual: BBG_2026_MONTHLY.pensionWest, source: 'SV-RechGrV 2026' },
  { label: 'BBG KV/PV (monatlich)', expected: 5512.5, actual: BBG_2026_MONTHLY.healthCare, source: 'SV-RechGrV 2026' },

  // Beitragssätze 2026
  { label: 'RV-Satz AN (%)', expected: 9.3, actual: SOCIAL_INSURANCE_RATES_2026.pension.employee, source: '§ 158 SGB VI' },
  { label: 'AV-Satz AN (%)', expected: 1.3, actual: SOCIAL_INSURANCE_RATES_2026.unemployment.employee, source: 'SGB III' },
  { label: 'KV-Grundbeitrag AN (%)', expected: 7.3, actual: SOCIAL_INSURANCE_RATES_2026.health.employee, source: '§ 241 SGB V' },
  { label: 'KV ⌀ Zusatzbeitrag (%)', expected: 1.0, actual: SOCIAL_INSURANCE_RATES_2026.health.averageAdditional, source: 'BMG-Bekanntmachung 2026' },
  { label: 'PV-Basissatz Gesamt (%)', expected: 3.6, actual: SOCIAL_INSURANCE_RATES_2026.care.total, source: 'PUEG 2026' },

  // Steuerliche Freibeträge 2026
  { label: 'Grundfreibetrag (€)', expected: 12348, actual: TAX_ALLOWANCES_2026.basicAllowance, source: '§ 32a EStG / JStG 2024' },
  { label: 'Kinderfreibetrag pro Elternteil (€)', expected: 6828, actual: TAX_ALLOWANCES_2026.childAllowance, source: 'JStG 2024' },

  // Tarif 2026 (Eckwerte)
  { label: 'Progression-Zone1 obere Grenze (€)', expected: 17799, actual: TAX_RATES_2026.progressionZone1.to, source: '§ 32a EStG ab VZ 2026' },
  { label: 'Progression-Zone1 Koeffizient a', expected: 914.51, actual: TAX_RATES_2026.progressionZone1.coefficients[0], source: '§ 32a EStG ab VZ 2026' },
  { label: 'Progression-Zone1 Koeffizient b', expected: 1400, actual: TAX_RATES_2026.progressionZone1.coefficients[1], source: '§ 32a EStG ab VZ 2026' },
  { label: 'Proportional-Zone1 Satz (%)', expected: 0.42, actual: TAX_RATES_2026.proportionalZone1.rate, source: '§ 32a EStG ab VZ 2026' },
  { label: 'Proportional-Zone2 Satz (%)', expected: 0.45, actual: TAX_RATES_2026.proportionalZone2.rate, source: '§ 32a EStG ab VZ 2026' },

  // Minijob 2026
  { label: 'Minijob-Grenze (€/Monat)', expected: 603, actual: MINIJOB_2026.maxEarnings, source: 'Mindestlohn 2026 (13,90 €)' },
];

let failures = 0;
const lines: string[] = [];
lines.push('╔══════════════════════════════════════════════════════════════════╗');
lines.push('║   Verify-2026-Constants — payroll-core                           ║');
lines.push('╚══════════════════════════════════════════════════════════════════╝');

for (const c of CHECKS) {
  const ok = Math.abs(c.expected - c.actual) < 0.005;
  const status = ok ? '✅' : '❌';
  lines.push(`${status}  ${c.label.padEnd(40)} Soll=${String(c.expected).padStart(10)} · Ist=${String(c.actual).padStart(10)}  [${c.source}]`);
  if (!ok) failures++;
}

lines.push('──────────────────────────────────────────────────────────────────');
lines.push(`Resultat: ${failures === 0 ? '✅ ALLE OK' : `❌ ${failures} ABWEICHUNG(EN)`}`);

console.log(lines.join('\n'));
process.exit(failures === 0 ? 0 : 1);