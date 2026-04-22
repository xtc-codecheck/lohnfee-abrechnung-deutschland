/**
 * Lohnarten-Integration in die Lohnabrechnung (P4)
 *
 * Bringt aktive `employee_wage_types` in den vorhandenen Calculator-Output ein:
 * - Bezug / Zuschuss (steuer-/SV-pflichtig): erhöhen Brutto und werden in Steuer/SV einbezogen
 * - Steuer-/SV-freie Zuschüsse: werden zur Auszahlung addiert, wirken aber nicht auf Steuer/SV
 * - Sachbezug: erhöht Brutto (steuer-/SV-pflichtig wenn flagged), wird vom Netto wieder abgezogen
 *   (geldwerter Vorteil — Mitarbeiter erhält Sache, nicht Geld)
 * - Pauschalsteuer-Zuschüsse (z.B. Fahrt 15%, Internet 25%): pauschale Lohnsteuer trägt AG,
 *   Auszahlung an AN unverändert, aber AG-Kosten steigen
 * - Pfändung / Abzug / VWL / AG-Darlehen: vom Netto abgezogen
 *
 * Hinweis: Cent-genaue Steuer-/SV-Logik bleibt im bestehenden Calculator —
 * dieses Modul wendet die Lohnarten *additiv* auf den Calculator-Input und -Output an.
 */

import { EmployeeWageType } from '@/types/wage-types';
import { roundCurrency } from '@/lib/formatters';

export interface WageTypesImpact {
  /** Zusätzliches steuer-/SV-pflichtiges Bruttoentgelt (in monatliches Brutto einrechnen) */
  taxableGrossAddition: number;
  /** Steuer-/SV-freie Auszahlung (z.B. Kindergartenzuschuss, Jobticket §3 Nr.15) */
  taxFreeNetAddition: number;
  /** Sachbezüge, die nach Versteuerung wieder vom Netto abgezogen werden */
  inKindDeduction: number;
  /** Vom Netto abzuziehen (Pfändung, AG-Darlehen, VWL-AN-Anteil etc.) */
  netDeductions: number;
  /** Pauschale Lohnsteuer, die der Arbeitgeber trägt (zusätzliche AG-Kosten) */
  pauschalTax: number;
  /** Aufschlüsselung pro Lohnart für Lohnzettel/Audit */
  lineItems: WageTypeLineItem[];
}

export interface WageTypeLineItem {
  code: string;
  name: string;
  category: string;
  amount: number;
  effect: 'gross_taxable' | 'net_taxfree' | 'in_kind' | 'net_deduction' | 'pauschal';
  pauschalTaxRate?: number;
  pauschalTaxAmount?: number;
  account?: string | null;
}

/**
 * Filtert nur Zuordnungen, die zum Stichtag gültig & aktiv sind.
 */
export function filterActiveWageTypes(
  items: EmployeeWageType[],
  reference: Date
): EmployeeWageType[] {
  const ref = reference.toISOString().slice(0, 10);
  return items.filter(it => {
    if (!it.is_active) return false;
    if (it.valid_from && it.valid_from > ref) return false;
    if (it.valid_to && it.valid_to < ref) return false;
    return !!it.wage_type?.is_active;
  });
}

/**
 * Berechnet die Auswirkung aller aktiven Lohnarten auf eine Abrechnung.
 */
export function applyWageTypes(
  items: EmployeeWageType[],
  reference: Date,
  accountSystem: 'SKR03' | 'SKR04' = 'SKR03'
): WageTypesImpact {
  const active = filterActiveWageTypes(items, reference);
  const impact: WageTypesImpact = {
    taxableGrossAddition: 0,
    taxFreeNetAddition: 0,
    inKindDeduction: 0,
    netDeductions: 0,
    pauschalTax: 0,
    lineItems: [],
  };

  for (const it of active) {
    const wt = it.wage_type;
    if (!wt) continue;
    const amount = roundCurrency(Number(it.amount) || 0);
    if (amount === 0) continue;

    const account = accountSystem === 'SKR03' ? wt.account_skr03 : wt.account_skr04;
    const base: Omit<WageTypeLineItem, 'effect'> = {
      code: wt.code,
      name: wt.name,
      category: wt.category,
      amount,
      account,
    };

    // Pauschalsteuer-Lohnarten: Pauschalsteuer berechnen (AG trägt), Auszahlung an AN unverändert,
    // wenn nicht zusätzlich steuer-/SV-pflichtig.
    if (wt.pauschal_tax_rate && wt.pauschal_tax_rate > 0) {
      const pauschal = roundCurrency(amount * (wt.pauschal_tax_rate / 100));
      impact.pauschalTax += pauschal;

      // Pauschal versteuerte Zuschüsse sind i.d.R. SV-frei und werden netto an AN ausgezahlt
      // (z.B. Fahrtkostenzuschuss §40 Abs.2 EStG, Internetpauschale §40 Abs.2 Nr.5 EStG).
      // Essenszuschuss (§40 Abs.2 Nr.1) ist Sachbezug → wird unten gesondert behandelt.
      if (wt.category === 'sachbezug') {
        // Geldwerter Vorteil: Brutto erhöht (sofern is_taxable), aber Netto-Auszahlung -= Wert
        if (wt.is_taxable) impact.taxableGrossAddition += amount;
        else impact.taxFreeNetAddition += 0; // weder noch
        impact.inKindDeduction += amount;
        impact.lineItems.push({ ...base, effect: 'in_kind', pauschalTaxRate: wt.pauschal_tax_rate, pauschalTaxAmount: pauschal });
      } else {
        impact.taxFreeNetAddition += amount;
        impact.lineItems.push({ ...base, effect: 'pauschal', pauschalTaxRate: wt.pauschal_tax_rate, pauschalTaxAmount: pauschal });
      }
      continue;
    }

    // Abzüge (Pfändung, AG-Darlehen, sonstige Abzüge, VWL-AN-Anteil)
    if (wt.category === 'abzug' || wt.category === 'pfaendung') {
      impact.netDeductions += amount;
      impact.lineItems.push({ ...base, effect: 'net_deduction' });
      continue;
    }

    // VWL: AG-Zuschuss ist steuer-/SV-pflichtiger Bezug, wird aber direkt an Bausparkasse/Bank
    // gezahlt → erhöht Brutto, wird dann wieder vom Netto abgezogen.
    if (wt.category === 'vwl') {
      impact.taxableGrossAddition += amount;
      impact.netDeductions += amount;
      impact.lineItems.push({ ...base, effect: 'gross_taxable' });
      continue;
    }

    // Sachbezug ohne Pauschalsteuer (z.B. 50€-Sachbezugsfreigrenze)
    if (wt.category === 'sachbezug') {
      if (wt.is_taxable) {
        impact.taxableGrossAddition += amount;
        impact.inKindDeduction += amount;
        impact.lineItems.push({ ...base, effect: 'in_kind' });
      } else {
        // Steuer-/SV-frei (50€ Freigrenze, §8 Abs.2 S.11 EStG) — kein Effekt auf Auszahlung
        impact.lineItems.push({ ...base, effect: 'in_kind', amount: 0 });
      }
      continue;
    }

    // Bezug / Prämie / Sonderzahlung: steuer-/SV-pflichtig, wird ausgezahlt
    if (wt.is_taxable || wt.is_sv_relevant) {
      impact.taxableGrossAddition += amount;
      impact.lineItems.push({ ...base, effect: 'gross_taxable' });
      continue;
    }

    // Steuer-/SV-freier Zuschuss (Kindergarten §3 Nr.33, Jobticket §3 Nr.15)
    impact.taxFreeNetAddition += amount;
    impact.lineItems.push({ ...base, effect: 'net_taxfree' });
  }

  // Cent-genau runden
  impact.taxableGrossAddition = roundCurrency(impact.taxableGrossAddition);
  impact.taxFreeNetAddition = roundCurrency(impact.taxFreeNetAddition);
  impact.inKindDeduction = roundCurrency(impact.inKindDeduction);
  impact.netDeductions = roundCurrency(impact.netDeductions);
  impact.pauschalTax = roundCurrency(impact.pauschalTax);
  return impact;
}
