/**
 * BMF-PAP-Stützstellen 2025 — Lohnsteuer
 * 
 * Quelle: § 32a EStG i.d.F. JStG 2024 / BMF PAP 2025.
 * Werte sind durch Anwendung der gesetzlichen Formel bestimmt
 * (der PAP ist die maschinelle Umsetzung von § 32a — Werte identisch).
 * 
 * Format: zvE (zu versteuerndes Einkommen) → erwartete Jahres-Lohnsteuer in ¢.
 */
export interface BmfTariffFixture {
  /** Zu versteuerndes Einkommen in EUR (Jahr) */
  zvE: number;
  /** Erwartete tarifliche Einkommensteuer in EUR (gerundet wie PAP: floor) */
  expectedESt: number;
  /** Beschreibung / Zone */
  desc: string;
}

/** § 32a Tarifstützstellen 2025 (Grundtarif, alle Zonen) */
export const TARIFF_FIXTURES_2025: readonly BmfTariffFixture[] = [
  // Zone 1: Grundfreibetrag (12.096 €)
  { zvE: 0,      expectedESt: 0,     desc: 'Grundfreibetrag – unter GFB' },
  { zvE: 12_096, expectedESt: 0,     desc: 'Grundfreibetrag – exakt' },
  // Zone 2: Progressionszone 1 (12.097 – 17.443)
  // Formel: ESt = floor((932.30 * y + 1400) * y), y = (zvE - 12096) / 10000
  { zvE: 15_000, expectedESt: Math.floor((932.30 * 0.2904 + 1400) * 0.2904), desc: 'Zone 2 Mitte' },
  { zvE: 17_443, expectedESt: Math.floor((932.30 * 0.5347 + 1400) * 0.5347), desc: 'Zone 2 Obergrenze' },
  // Zone 3: Progressionszone 2 (17.444 – 68.480)
  // Formel: ESt = floor((176.64 * z + 2397) * z + 1015.13), z = (zvE - 17443) / 10000
  { zvE: 30_000, expectedESt: Math.floor((176.64 * 1.2557 + 2397) * 1.2557 + 1015.13), desc: 'Zone 3 unten' },
  { zvE: 50_000, expectedESt: Math.floor((176.64 * 3.2557 + 2397) * 3.2557 + 1015.13), desc: 'Zone 3 mitte' },
  { zvE: 68_480, expectedESt: Math.floor((176.64 * 5.1037 + 2397) * 5.1037 + 1015.13), desc: 'Zone 3 Obergrenze' },
  // Zone 4: Proportionalzone 1 (68.481 – 277.825), 42% Grenzsteuer
  // Formel: ESt = floor(0.42 * zvE - 10911.92)
  { zvE: 80_000,  expectedESt: Math.floor(0.42 *  80_000 - 10_911.92), desc: 'Zone 4 unten' },
  { zvE: 100_000, expectedESt: Math.floor(0.42 * 100_000 - 10_911.92), desc: 'Zone 4 mitte' },
  { zvE: 200_000, expectedESt: Math.floor(0.42 * 200_000 - 10_911.92), desc: 'Zone 4 hoch' },
  { zvE: 277_825, expectedESt: Math.floor(0.42 * 277_825 - 10_911.92), desc: 'Zone 4 Obergrenze' },
  // Zone 5: Reichensteuer (≥ 277.826), 45% Grenzsteuer
  // Formel: ESt = floor(0.45 * zvE - 19246.67)  (§ 32a EStG 2025 i.d.F. JStG 2024)
  { zvE: 300_000, expectedESt: Math.floor(0.45 * 300_000 - 19_246.67), desc: 'Zone 5 Reichensteuer' },
  { zvE: 500_000, expectedESt: Math.floor(0.45 * 500_000 - 19_246.67), desc: 'Zone 5 sehr hoch' },
] as const;

/**
 * Soli-Stützstellen 2025 (Freigrenze 19.950 € ESt-Schuld 2025, danach Milderungszone)
 * Solidaritätszuschlag = 5,5 % der ESt, mit Freigrenze und Gleitzone.
 */
export interface SoliFixture {
  estJahr: number;
  expectedSoli: number;
  desc: string;
}

export const SOLI_FIXTURES_2025: readonly SoliFixture[] = [
  { estJahr:  10_000, expectedSoli: 0,       desc: 'Unter Freigrenze (≤ 19.950 €)' },
  { estJahr:  19_950, expectedSoli: 0,       desc: 'An Freigrenze' },
  // Milderungszone § 4 SolzG: Soli = min(5,5% × ESt; 11,9% × (ESt − 19.950))
  // Übergang in den Vollsatz bei ca. ESt = 33.911,76 € (Schnittpunkt der Geraden).
  { estJahr:  20_000, expectedSoli: Math.floor(0.119 * (20_000 - 19_950)),  desc: 'Milderung knapp über Freigrenze' },
  { estJahr:  25_000, expectedSoli: Math.floor(0.119 * (25_000 - 19_950)),  desc: 'Milderung mittel' },
  { estJahr:  30_000, expectedSoli: Math.floor(0.119 * (30_000 - 19_950)),  desc: 'Milderung hoch' },
  { estJahr:  34_000, expectedSoli: Math.floor(0.055 * 34_000),             desc: 'Vollsatz oberhalb Milderungsende' },
  { estJahr: 100_000, expectedSoli: Math.floor(0.055 * 100_000),            desc: 'Vollsatz hohe Einkommen' },
] as const;

/**
 * Kirchensteuer-Stützstellen 2025
 * 8 % in BY/BW, 9 % in allen anderen Bundesländern, ohne Kappung im Standard-Lohn.
 */
export interface ChurchTaxFixture {
  estJahr: number;
  /** Kirchensteuersatz in Prozent (8 oder 9), passend zur Funktionssignatur */
  rate: 8 | 9;
  expected: number;
  desc: string;
}

export const CHURCH_TAX_FIXTURES_2025: readonly ChurchTaxFixture[] = [
  { estJahr: 5_000,  rate: 9, expected: 450,  desc: '9% Standard NRW/Berlin' },
  { estJahr: 5_000,  rate: 8, expected: 400,  desc: '8% Bayern/BW' },
  { estJahr: 12_000, rate: 9, expected: 1080, desc: '9% mittleres Einkommen' },
] as const;
