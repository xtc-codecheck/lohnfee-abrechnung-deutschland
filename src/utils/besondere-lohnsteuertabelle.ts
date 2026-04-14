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
 * Verwendet die zentrale PAP-2025-Formel aus tax-calculation.ts
 * (keine duplizierte Steuerformel mehr).
 */

import { TAX_ALLOWANCES_2025 } from '@/constants/social-security';
import { calculateTariflicheEStPAP2025 } from './tax-calculation';

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

// ============= Vorsorgepauschale =============

/**
 * Berechnet die Vorsorgepauschale für die besondere Tabelle.
 * Nur PKV-Basisbeitrag (max. Höchstbetrag nach § 10 Abs. 4 EStG).
 */
function calculateBesondereVorsorgepauschale(
  taxClass: number,
  privateHealthMonthly: number,
  privateCareMonthly: number,
): number {
  const maxBasisbeitrag = taxClass === 3 ? 233.33 : 158.33;
  const basiskrankenversicherung = Math.min(privateHealthMonthly * 0.96, maxBasisbeitrag);
  return basiskrankenversicherung + privateCareMonthly;
}

// ============= Hauptberechnung =============

/**
 * Berechnung nach besonderer Lohnsteuertabelle
 * Nutzt die zentrale calculateTariflicheEStPAP2025 Funktion.
 */
export function calculateBesondereLohnsteuer(params: BesondereTaxParams): BesondereTaxResult {
  const { 
    grossMonthly, taxClass, childAllowances, 
    churchTax, churchTaxRate,
    privateHealthInsuranceMonthly = 300,
    privateCareInsuranceMonthly = 50,
  } = params;

  if (grossMonthly <= 0) {
    return { incomeTax: 0, solidarityTax: 0, churchTax: 0, totalTax: 0, effectiveRate: 0 };
  }

  const grossYearly = grossMonthly * 12;

  const werbungskosten = TAX_ALLOWANCES_2025.workRelatedExpenses;
  const sonderausgaben = TAX_ALLOWANCES_2025.specialExpenses;
  const vorsorgepauschale = calculateBesondereVorsorgepauschale(
    taxClass, privateHealthInsuranceMonthly, privateCareInsuranceMonthly
  ) * 12;

  let zvE = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
  let est: number;
  
  switch (taxClass) {
    case 1:
    case 4:
      est = calculateTariflicheEStPAP2025(Math.max(0, zvE));
      break;
    case 2: {
      const entlastung = 4260 + Math.max(0, childAllowances - 1) * 240;
      est = calculateTariflicheEStPAP2025(Math.max(0, zvE - entlastung));
      break;
    }
    case 3:
      est = calculateTariflicheEStPAP2025(Math.max(0, Math.floor(zvE / 2))) * 2;
      break;
    case 5:
      est = 2 * calculateTariflicheEStPAP2025(Math.max(0, zvE)) 
          - 2 * calculateTariflicheEStPAP2025(Math.max(0, Math.floor(zvE / 2)));
      break;
    case 6:
      zvE = grossYearly - vorsorgepauschale;
      est = 2 * calculateTariflicheEStPAP2025(Math.max(0, zvE)) 
          - 2 * calculateTariflicheEStPAP2025(Math.max(0, Math.floor(zvE / 2)));
      break;
    default:
      est = calculateTariflicheEStPAP2025(Math.max(0, zvE));
  }

  const monthlyIncomeTax = Math.floor(est / 12 * 100) / 100;

  const soliFreigrenze = TAX_ALLOWANCES_2025.solidarityTaxFreeAmount / 12;
  let solidarityTax = 0;
  if (monthlyIncomeTax > soliFreigrenze) {
    solidarityTax = Math.floor(monthlyIncomeTax * 0.055 * 100) / 100;
  }

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
