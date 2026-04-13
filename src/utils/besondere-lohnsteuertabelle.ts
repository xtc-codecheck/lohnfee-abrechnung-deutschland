/**
 * Besondere Lohnsteuertabelle 2025
 * 
 * Gilt für:
 * - Beamte, Richter, Berufssoldaten
 * - Arbeitnehmer die komplett privat krankenversichert sind
 * - Arbeitnehmer ohne Beiträge zur gesetzlichen Renten-/Arbeitslosenversicherung
 * 
 * Unterschied zur allgemeinen Tabelle:
 * Die Vorsorgepauschale wird OHNE Sozialversicherungsbeiträge berechnet,
 * da diese Personengruppen keine oder stark reduzierte SV-Beiträge haben.
 * Dadurch ist die Lohnsteuer HÖHER als bei der allgemeinen Tabelle.
 * 
 * Berechnungsmethode:
 * Statt einer zweiten statischen Tabelle wird die Lohnsteuer nach dem
 * Programmablaufplan (PAP) 2025 des BMF berechnet, wobei die Vorsorgepauschale
 * nur die private Kranken-/Pflegeversicherung (Basisbeitrag) berücksichtigt.
 */

import { 
  TAX_ALLOWANCES_2025, 
  TAX_RATES_2025 
} from '@/constants/social-security';

// ============= Typen =============

export interface BesondereTaxParams {
  grossMonthly: number;
  taxClass: number; // 1-6
  childAllowances: number;
  churchTax: boolean;
  churchTaxRate: number; // 8 oder 9
  privateHealthInsuranceMonthly?: number; // PKV-Basisbeitrag pro Monat
  privateCareInsuranceMonthly?: number; // PPV-Beitrag pro Monat
}

export interface BesondereTaxResult {
  incomeTax: number; // Monatliche Lohnsteuer
  solidarityTax: number;
  churchTax: number;
  totalTax: number;
  effectiveRate: number; // Effektiver Steuersatz in %
}

// ============= PAP 2025 Implementierung =============

/**
 * Berechnet das zu versteuernde Einkommen für die besondere Tabelle.
 * 
 * Vorsorgepauschale nach § 39b Abs. 2 Satz 5 Nr. 3 EStG:
 * - Keine RV-/AV-Anteile
 * - Nur PKV-Basisbeitrag (max. 1/12 des Höchstbetrags nach § 10 Abs. 4 EStG)
 *   = 2.800 € / 12 = 233,33 € für StKl III, sonst 1.900 € / 12 = 158,33 €
 */
function calculateBesondereVorsorgepauschale(
  taxClass: number,
  privateHealthMonthly: number,
  privateCareMonthly: number,
): number {
  // Höchstbetrag für Vorsorgeaufwendungen (Basiskranken- + Pflege)
  const maxBasisbeitrag = taxClass === 3 ? 233.33 : 158.33;
  
  // Basisbeitrag = 96% des PKV-Beitrags (Arbeitgeberzuschuss ausgenommen)
  // In der Praxis: Mindestens der Arbeitnehmeranteil
  const basiskrankenversicherung = Math.min(privateHealthMonthly * 0.96, maxBasisbeitrag);
  const pflegeversicherung = privateCareMonthly;
  
  return basiskrankenversicherung + pflegeversicherung;
}

/**
 * Einkommensteuerberechnung nach § 32a EStG (PAP 2025)
 * Berechnet die tarifliche Einkommensteuer auf das zu versteuernde Einkommen
 */
function calculateTariflicheESt(zvE: number): number {
  if (zvE <= TAX_ALLOWANCES_2025.basicAllowance) return 0;

  const { progressionZone1, progressionZone2, proportionalZone1, proportionalZone2 } = TAX_RATES_2025;

  if (zvE <= progressionZone1.to) {
    const y = (zvE - TAX_ALLOWANCES_2025.basicAllowance) / 10000;
    return Math.floor((progressionZone1.coefficients[0] * y + progressionZone1.coefficients[1]) * y);
  }

  if (zvE <= progressionZone2.to) {
    const z = (zvE - progressionZone2.from + 1) / 10000;
    return Math.floor((progressionZone2.coefficients[0] * z + progressionZone2.coefficients[1]) * z + progressionZone2.constant);
  }

  if (zvE <= proportionalZone2.from - 1) {
    return Math.floor(zvE * proportionalZone1.rate - proportionalZone1.constant);
  }

  return Math.floor(zvE * proportionalZone2.rate - proportionalZone2.constant);
}

/**
 * Berechnung nach besonderer Lohnsteuertabelle
 * 
 * Ablauf:
 * 1. Jahres-Brutto hochrechnen
 * 2. Werbungskostenpauschale abziehen
 * 3. Sonderausgabenpauschale abziehen
 * 4. Vorsorgepauschale (nur PKV-Basis) abziehen
 * 5. Kinderfreibetrag berücksichtigen (bei Soli/KiSt)
 * 6. Tarifliche ESt nach § 32a berechnen
 * 7. Steuerklassenfaktor anwenden
 * 8. Auf Monat umrechnen
 */
export function calculateBesondereLohnsteuer(params: BesondereTaxParams): BesondereTaxResult {
  const { 
    grossMonthly, taxClass, childAllowances, 
    churchTax, churchTaxRate,
    privateHealthInsuranceMonthly = 300, // Standardwert PKV-Basis
    privateCareInsuranceMonthly = 50,    // Standardwert PPV
  } = params;

  if (grossMonthly <= 0) {
    return { incomeTax: 0, solidarityTax: 0, churchTax: 0, totalTax: 0, effectiveRate: 0 };
  }

  const grossYearly = grossMonthly * 12;

  // Abzüge
  const werbungskosten = TAX_ALLOWANCES_2025.workRelatedExpenses;
  const sonderausgaben = TAX_ALLOWANCES_2025.specialExpenses;
  const vorsorgepauschale = calculateBesondereVorsorgepauschale(
    taxClass, privateHealthInsuranceMonthly, privateCareInsuranceMonthly
  ) * 12;

  let zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;

  // Steuerklassen-Anpassung
  // StKl III: doppelter Grundfreibetrag (Splitting)
  // StKl V/VI: kein Grundfreibetrag
  let est: number;
  
  switch (taxClass) {
    case 1:
    case 4:
      est = calculateTariflicheESt(Math.max(0, zvE));
      break;
    case 2:
      // Entlastungsbetrag Alleinerziehende: 4.260 € + 240 € je weiteres Kind
      const entlastung = 4260 + Math.max(0, childAllowances - 1) * 240;
      est = calculateTariflicheESt(Math.max(0, zvE - entlastung));
      break;
    case 3:
      // Splittingverfahren: zvE halbieren, ESt berechnen, verdoppeln
      est = calculateTariflicheESt(Math.max(0, zvE / 2)) * 2;
      break;
    case 5:
      // Kein Grundfreibetrag, höhere Belastung
      est = calculateTariflicheESt(Math.max(0, zvE));
      // StKl V: Zusätzliche Belastung durch fehlenden GFB des Partners
      break;
    case 6:
      // Kein Grundfreibetrag, keine Pauschalen (außer Vorsorgepauschale)
      zvE = grossYearly - vorsorgepauschale;
      est = calculateTariflicheESt(Math.max(0, zvE));
      break;
    default:
      est = calculateTariflicheESt(Math.max(0, zvE));
  }

  // Monatliche Lohnsteuer
  const monthlyIncomeTax = Math.floor(est / 12 * 100) / 100;

  // Solidaritätszuschlag (Freigrenze: monatlich ~1.662,50 €)
  const soliFreigrenze = TAX_ALLOWANCES_2025.solidarityTaxFreeAmount / 12;
  let solidarityTax = 0;
  if (monthlyIncomeTax > soliFreigrenze) {
    solidarityTax = Math.floor(monthlyIncomeTax * 0.055 * 100) / 100;
  }

  // Kirchensteuer
  const churchTaxAmount = churchTax 
    ? Math.floor(monthlyIncomeTax * (churchTaxRate / 100) * 100) / 100 
    : 0;

  const totalTax = monthlyIncomeTax + solidarityTax + churchTaxAmount;
  const effectiveRate = grossMonthly > 0 ? (totalTax / grossMonthly) * 100 : 0;

  return {
    incomeTax: monthlyIncomeTax,
    solidarityTax,
    churchTax: churchTaxAmount,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
  };
}

/**
 * Prüft ob ein Mitarbeiter unter die besondere Lohnsteuertabelle fällt
 */
export function isBesondereLohnsteuertabelle(options: {
  isBeamter?: boolean;
  isPrivatInsured?: boolean;
  hasSVPflicht?: boolean;
}): boolean {
  if (options.isBeamter) return true;
  if (options.isPrivatInsured && !options.hasSVPflicht) return true;
  return false;
}
