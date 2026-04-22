/**
 * SV-BBG-Stützstellen 2025
 * Quelle: Sozialversicherungs-Rechengrößenverordnung 2025 (BGBl. I 2024 Nr. 332)
 */
export interface SvBbgFixture {
  /** Brutto-Monat in EUR */
  bruttoMonat: number;
  /** Region: 'west' | 'east' (Ost relevant für RV/AV) */
  region: 'west' | 'east';
  /** Erwartete BMG für KV/PV (KV/PV-BBG kappt) */
  bmgKvPv: number;
  /** Erwartete BMG für RV/AV (RV/AV-BBG kappt, je nach Region) */
  bmgRvAv: number;
  desc: string;
}

// 2025 monatliche BBG (Quelle: BMAS):
// KV/PV bundesweit:           5.512,50 €
// RV/AV West:                 8.050,00 €
// RV/AV Ost:                  8.050,00 € (ab 2025 vereinheitlicht!)
const KV_PV_MONAT_2025 = 5512.50;
const RV_AV_MONAT_2025_WEST = 8050.00;
const RV_AV_MONAT_2025_OST  = 8050.00; // 2025: Vereinheitlichung

export const SV_BBG_FIXTURES_2025: readonly SvBbgFixture[] = [
  // Unter allen BBGs
  { bruttoMonat: 3_000, region: 'west', bmgKvPv: 3_000, bmgRvAv: 3_000, desc: '3000€ West – keine Kappung' },
  { bruttoMonat: 3_000, region: 'east', bmgKvPv: 3_000, bmgRvAv: 3_000, desc: '3000€ Ost – keine Kappung' },
  // Zwischen KV/PV und RV/AV
  { bruttoMonat: 6_000, region: 'west', bmgKvPv: KV_PV_MONAT_2025, bmgRvAv: 6_000, desc: '6000€ West – nur KV/PV gekappt' },
  { bruttoMonat: 6_000, region: 'east', bmgKvPv: KV_PV_MONAT_2025, bmgRvAv: 6_000, desc: '6000€ Ost – nur KV/PV gekappt' },
  // Über alle BBGs
  { bruttoMonat: 10_000, region: 'west', bmgKvPv: KV_PV_MONAT_2025, bmgRvAv: RV_AV_MONAT_2025_WEST, desc: '10000€ West – beide gekappt' },
  { bruttoMonat: 10_000, region: 'east', bmgKvPv: KV_PV_MONAT_2025, bmgRvAv: RV_AV_MONAT_2025_OST,  desc: '10000€ Ost – beide gekappt' },
  // Exakt an BBG
  { bruttoMonat: KV_PV_MONAT_2025, region: 'west', bmgKvPv: KV_PV_MONAT_2025, bmgRvAv: KV_PV_MONAT_2025, desc: 'KV/PV-BBG exakt' },
  { bruttoMonat: RV_AV_MONAT_2025_WEST, region: 'west', bmgKvPv: KV_PV_MONAT_2025, bmgRvAv: RV_AV_MONAT_2025_WEST, desc: 'RV/AV-BBG West exakt' },
] as const;
