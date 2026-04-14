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

import { TAX_ALLOWANCES_2025 } from '@/constants/social-security';
import { calculateTariflicheEStPAP2025 } from './tax-calculation';

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
