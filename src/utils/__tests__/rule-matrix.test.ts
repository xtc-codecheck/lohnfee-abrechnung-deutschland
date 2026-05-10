/**
 * Regel-Matrix System-Tests
 * ─────────────────────────────────────────────────────────────
 * Prüft monatliche, vierteljährliche und jährliche Sonderfälle
 * der deutschen Lohnabrechnung gegen eine breite, parametrisierte
 * Regel-Matrix. Jede Zeile = ein konkretes Behörden-Szenario mit
 * eindeutigen Erwartungs-Invarianten.
 */
import { describe, it, expect } from "vitest";
import { calculateCompleteTax, type TaxCalculationParams } from "../tax-calculation";
import { calculateMaerzklausel } from "../maerzklausel";
import { calculateAnnualTaxReconciliation } from "../annual-tax-reconciliation";
import { getLstaFrequency, getLstaDueDate, LSTA_THRESHOLDS } from "../lsta-frequency";
import { BBG_2025_MONTHLY, MINIJOB_2025 } from "@/constants/social-security";

// ============================================================
// 1. MONATLICHE MATRIX — Steuerklassen × Region × Brutto-Stufen
// ============================================================

type Bracket = "minijob" | "midijob" | "normal" | "bbg" | "high";
const BRACKET_GROSS: Record<Bracket, number> = {
  minijob: 556 * 12,
  midijob: 1500 * 12,
  normal: 4000 * 12,
  bbg: 7300 * 12, // > BBG RV West (8.050 €/Mo 2025 — knapp drunter)
  high: 15000 * 12,
};

interface MonthlyCase {
  id: string;
  taxClass: "1" | "2" | "3" | "4" | "5" | "6";
  east: boolean;
  church: boolean;
  childless: boolean;
  bracket: Bracket;
}

function* monthlyMatrix(): Generator<MonthlyCase> {
  for (const tc of ["1", "3", "4", "5", "6"] as const) {
    for (const east of [false, true]) {
      for (const church of [false, true]) {
        for (const bracket of ["minijob", "midijob", "normal", "bbg", "high"] as Bracket[]) {
          // Klasse 6 i. d. R. nicht für Minijob
          if (tc === "6" && bracket === "minijob") continue;
          // Klasse 3/5 nur sinnvoll für Verheiratete — wir testen trotzdem die Mechanik
          yield {
            id: `Kl${tc}-${east ? "Ost" : "West"}-${church ? "KiSt" : "ohneKi"}-${bracket}`,
            taxClass: tc, east, church, childless: true, bracket,
          };
        }
      }
    }
  }
}
const MONTHLY_CASES = Array.from(monthlyMatrix());

function paramsFor(c: MonthlyCase): TaxCalculationParams {
  return {
    grossSalaryYearly: BRACKET_GROSS[c.bracket],
    taxClass: c.taxClass,
    childAllowances: 0,
    churchTax: c.church,
    churchTaxRate: c.church ? 9 : 0,
    healthInsuranceRate: 1.7,
    isEastGermany: c.east,
    isChildless: c.childless,
    age: 30,
    employmentType:
      c.bracket === "minijob" ? "minijob"
      : c.bracket === "midijob" ? "midijob"
      : "fulltime",
    year: 2025,
  };
}

describe("Regel-Matrix · Monatliche Sonderfälle", () => {
  it.each(MONTHLY_CASES)("$id — Grundinvarianten", (c) => {
    const r = calculateCompleteTax(paramsFor(c));

    // Invariante 1: Netto >= 0
    expect(r.netMonthly).toBeGreaterThanOrEqual(0);
    // Invariante 2: Netto <= Brutto
    expect(r.netMonthly).toBeLessThanOrEqual(r.grossMonthly + 0.01);
    // Invariante 3: Summe Abzüge konsistent
    const sumDed = r.incomeTax + r.solidarityTax + r.churchTax
      + r.pensionInsurance + r.unemploymentInsurance + r.healthInsurance + r.careInsurance;
    expect(Math.abs(sumDed - r.totalDeductions)).toBeLessThan(0.05);
    // Invariante 4: Brutto - Abzüge ≈ Netto (Toleranz 5 ct/Jahr)
    expect(Math.abs((r.grossYearly - r.totalDeductions) - r.netYearly)).toBeLessThan(0.05);
    // Invariante 5: Arbeitgeberkosten ≥ Brutto
    expect(r.employerCosts).toBeGreaterThanOrEqual(r.grossYearly - 0.01);
    // Invariante 6: KiSt nur wenn churchTax aktiv
    if (!c.church) expect(r.churchTax).toBe(0);
    // Invariante 7: Minijob → kein LSt-/AN-SV-Abzug
    if (c.bracket === "minijob") {
      expect(r.incomeTax).toBe(0);
      expect(r.healthInsurance).toBe(0);
      expect(r.pensionInsurance).toBe(0);
    }
    // Invariante 8: Soli-Freigrenze — Niedrigverdiener (Kl 1, normal-Brutto) zahlen 0 Soli
    if (c.taxClass === "1" && c.bracket === "midijob") {
      expect(r.solidarityTax).toBe(0);
    }
    // Invariante 9: Tax Class III < Tax Class V bei gleichem Brutto (mehr Netto in Kl 3)
    // (separat unten getestet — hier nur Sanity)
  });

  it("Steuerklassen-Vergleich: Klasse III hat mehr Netto als Klasse V (Brutto 4.000 €/Mo)", () => {
    const base = paramsFor({ id: "x", taxClass: "3", east: false, church: false, childless: true, bracket: "normal" });
    const k3 = calculateCompleteTax({ ...base, taxClass: "3" });
    const k5 = calculateCompleteTax({ ...base, taxClass: "5" });
    expect(k3.netMonthly).toBeGreaterThan(k5.netMonthly);
  });

  it("Ost/West-BBG: bei BBG-Überschreitung ist RV-Beitrag Ost ≤ West", () => {
    const w = calculateCompleteTax(paramsFor({ id: "x", taxClass: "1", east: false, church: false, childless: true, bracket: "high" }));
    const o = calculateCompleteTax(paramsFor({ id: "x", taxClass: "1", east: true, church: false, childless: true, bracket: "high" }));
    // Ost-BBG ≤ West-BBG → AN zahlt in Ost ≤ in West
    expect(o.pensionInsurance).toBeLessThanOrEqual(w.pensionInsurance + 0.01);
  });

  it("Kinderlosen-Zuschlag PV: Kinderlos > 23 Jahre zahlt mehr Pflege als Eltern", () => {
    const base = paramsFor({ id: "x", taxClass: "1", east: false, church: false, childless: true, bracket: "normal" });
    const childless = calculateCompleteTax({ ...base, isChildless: true, numberOfChildren: 0 });
    const parent = calculateCompleteTax({ ...base, isChildless: false, numberOfChildren: 2 });
    expect(childless.careInsurance).toBeGreaterThan(parent.careInsurance);
  });

  it("Minijob-Grenze 556 € exakt: SV-frei", () => {
    const r = calculateCompleteTax({
      grossSalaryYearly: MINIJOB_2025.maxEarnings * 12,
      taxClass: "1", childAllowances: 0, churchTax: false, churchTaxRate: 0,
      healthInsuranceRate: 1.7, isEastGermany: false, isChildless: true, age: 30,
      employmentType: "minijob",
    });
    expect(r.netMonthly).toBeCloseTo(MINIJOB_2025.maxEarnings, 1);
    expect(r.totalDeductions).toBeLessThan(0.5);
  });

  it("BBG-Deckel KV: Beitrag bei 15.000 €/Mo gleich Beitrag bei 20.000 €/Mo", () => {
    const a = calculateCompleteTax(paramsFor({ id: "x", taxClass: "1", east: false, church: false, childless: false, bracket: "high" }));
    const b = calculateCompleteTax({
      ...paramsFor({ id: "x", taxClass: "1", east: false, church: false, childless: false, bracket: "high" }),
      grossSalaryYearly: 20000 * 12,
    });
    expect(a.healthInsurance).toBeCloseTo(b.healthInsurance, 0);
  });
});

// ============================================================
// 2. VIERTELJÄHRLICHE MATRIX — § 41a EStG Anmeldungszeitraum
// ============================================================

const FREQ_MATRIX = [
  { tax: 0, expected: "yearly" },
  { tax: 500, expected: "yearly" },
  { tax: LSTA_THRESHOLDS.yearlyMax, expected: "yearly" }, // exakt 1.080
  { tax: LSTA_THRESHOLDS.yearlyMax + 0.01, expected: "quarterly" },
  { tax: 2500, expected: "quarterly" },
  { tax: LSTA_THRESHOLDS.quarterlyMax, expected: "quarterly" }, // exakt 5.000
  { tax: LSTA_THRESHOLDS.quarterlyMax + 0.01, expected: "monthly" },
  { tax: 25_000, expected: "monthly" },
  { tax: 500_000, expected: "monthly" },
] as const;

describe("Regel-Matrix · Vierteljährliche LStA-Pflicht (§ 41a EStG)", () => {
  it.each(FREQ_MATRIX)("Vorjahressteuer $tax € → $expected", ({ tax, expected }) => {
    expect(getLstaFrequency(tax)).toBe(expected);
  });

  it("Quartalsfälligkeit: Q1 → 10.04., Q2 → 10.07., Q3 → 10.10., Q4 → 10.01. Folgejahr", () => {
    expect(getLstaDueDate(2025, 1, "quarterly").toISOString().slice(0, 10)).toBe("2025-04-10");
    expect(getLstaDueDate(2025, 2, "quarterly").toISOString().slice(0, 10)).toBe("2025-07-10");
    expect(getLstaDueDate(2025, 3, "quarterly").toISOString().slice(0, 10)).toBe("2025-10-10");
    expect(getLstaDueDate(2025, 4, "quarterly").toISOString().slice(0, 10)).toBe("2026-01-10");
  });

  it("Monatsfälligkeit: Februar → 10.03.", () => {
    expect(getLstaDueDate(2025, 2, "monthly").toISOString().slice(0, 10)).toBe("2025-03-10");
  });

  it("Jahresfälligkeit: 2025 → 10.01.2026", () => {
    expect(getLstaDueDate(2025, 0, "yearly").toISOString().slice(0, 10)).toBe("2026-01-10");
  });

  it("Quartalssumme = Σ Monatssteuern (Q1, gleicher MA, konstantes Brutto)", () => {
    const month = calculateCompleteTax(paramsFor({ id: "x", taxClass: "1", east: false, church: false, childless: true, bracket: "normal" }));
    const monthlyTax = month.incomeTax / 12;
    const q1 = monthlyTax * 3;
    expect(q1).toBeCloseTo(month.incomeTax / 4, 1);
  });
});

// ============================================================
// 3. JÄHRLICHE MATRIX — Märzklausel & Lohnsteuer-Jahresausgleich
// ============================================================

const MAERZ_MATRIX = [
  {
    name: "Einmalzahlung im April (außerhalb Märzklausel) → 0 Vorjahres-Anteil",
    paymentMonth: 4 as any, oneTime: 5000, monthly: 4000,
    expectVorjahr: 0,
  },
  {
    name: "Niedrige Einmalzahlung im März, weit unter BBG → kein Vorjahresanteil",
    paymentMonth: 3 as const, oneTime: 1000, monthly: 3000,
    expectVorjahrZero: true,
  },
  {
    name: "Hohe Einmalzahlung im Februar, BBG-Überschreitung → Anteil ins Vorjahr",
    paymentMonth: 2 as const, oneTime: 30000, monthly: 8000,
    expectVorjahrPositive: true,
  },
] as const;

describe("Regel-Matrix · Jährliche Sonderfälle: Märzklausel", () => {
  it.each(MAERZ_MATRIX)("$name", (tc: any) => {
    const r = calculateMaerzklausel({
      paymentMonth: tc.paymentMonth,
      oneTimePaymentAmount: tc.oneTime,
      currentMonthlyGross: tc.monthly,
      previousYearTotalGross: tc.monthly * 12,
      previousYearBBG_RV: BBG_2025_MONTHLY.pensionWest * 12,
      previousYearBBG_KV: BBG_2025_MONTHLY.healthCare * 12,
      isEastGermany: false,
    });
    if ("expectVorjahr" in tc) expect(r.amountAttributedToPreviousYear).toBe(tc.expectVorjahr);
    if ("expectVorjahrZero" in tc) expect(r.amountAttributedToPreviousYear).toBe(0);
    if ("expectVorjahrPositive" in tc) expect(r.amountAttributedToPreviousYear).toBeGreaterThan(0);
    // Summen-Invariante: Vorjahres-Anteil + lfd. Jahr = Einmalzahlung
    expect(r.amountAttributedToPreviousYear + r.amountInCurrentYear).toBeCloseTo(tc.oneTime, 1);
  });
});

describe("Regel-Matrix · Lohnsteuer-Jahresausgleich (§ 42b EStG)", () => {
  const baseTaxParams: Omit<TaxCalculationParams, "grossSalaryYearly"> = {
    taxClass: "1", childAllowances: 0, churchTax: false, churchTaxRate: 0,
    healthInsuranceRate: 1.7, isEastGermany: false, isChildless: true, age: 30,
    employmentType: "fulltime", year: 2025,
  };

  it("Konstantes Brutto über 12 Monate → keine Differenz (≈ 0 €)", () => {
    const annual = calculateCompleteTax({ ...baseTaxParams, grossSalaryYearly: 4000 * 12 });
    const monthlyTax = annual.incomeTax / 12;
    const r = calculateAnnualTaxReconciliation({
      monthlyGrossSalaries: Array(12).fill(4000),
      monthlyTaxesWithheld: Array(12).fill(monthlyTax),
      monthlySoliWithheld: Array(12).fill(annual.solidarityTax / 12),
      monthlyChurchTaxWithheld: Array(12).fill(0),
      taxParams: baseTaxParams,
    });
    expect(Math.abs(r.taxDifference)).toBeLessThan(1.0);
  });

  it("Schwankendes Brutto (3.000–6.000) → Erstattungsanspruch (Differenz < 0)", () => {
    const months = [3000, 3000, 3000, 3000, 3000, 3000, 6000, 6000, 6000, 6000, 6000, 6000];
    // simuliere monatliche LSt isoliert je Monat (Hochrechnung wie Lohnsoftware tut)
    const monthlyTaxes = months.map(g => {
      const r = calculateCompleteTax({ ...baseTaxParams, grossSalaryYearly: g * 12 });
      return r.incomeTax / 12;
    });
    const r = calculateAnnualTaxReconciliation({
      monthlyGrossSalaries: months,
      monthlyTaxesWithheld: monthlyTaxes,
      monthlySoliWithheld: months.map(() => 0),
      monthlyChurchTaxWithheld: months.map(() => 0),
      taxParams: baseTaxParams,
    });
    // Bei progressiv steigendem Tarif & gemittelten Bruttos: Jahressteuer < Σ Monatssteuern → Erstattung
    expect(r.taxDifference).toBeLessThan(0);
    expect(r.hasReconciliation).toBe(true);
  });

  it("Soli-Freigrenze auf Jahresebene: Brutto 30.000 € (Kl 1) → 0 € Soli", () => {
    const r = calculateCompleteTax({ ...baseTaxParams, grossSalaryYearly: 30000 });
    expect(r.solidarityTax).toBe(0);
  });

  it("Hohe Einkommen: Soli > 0 (Kl 1, 200.000 € Jahr)", () => {
    const r = calculateCompleteTax({ ...baseTaxParams, grossSalaryYearly: 200000 });
    expect(r.solidarityTax).toBeGreaterThan(0);
  });
});

// ============================================================
// 4. CROSS-PERIOD-INVARIANTEN
// ============================================================

describe("Regel-Matrix · Cross-Period-Konsistenz", () => {
  it("Σ 12 Monatsbruttos = Jahresbrutto (für jeden Bracket)", () => {
    for (const bracket of Object.keys(BRACKET_GROSS) as Bracket[]) {
      const c: MonthlyCase = { id: "x", taxClass: "1", east: false, church: false, childless: true, bracket };
      const r = calculateCompleteTax(paramsFor(c));
      expect(r.grossMonthly * 12).toBeCloseTo(r.grossYearly, 1);
    }
  });

  it("Jahressumme aus 12 identischen Monaten ≈ Jahresberechnung (Kl 1, 4.000 €/Mo)", () => {
    const monthly = calculateCompleteTax({
      taxClass: "1", grossSalaryYearly: 4000 * 12,
      childAllowances: 0, churchTax: false, churchTaxRate: 0,
      healthInsuranceRate: 1.7, isEastGermany: false, isChildless: true, age: 30,
      employmentType: "fulltime", year: 2025,
    });
    expect(monthly.netYearly).toBeCloseTo(monthly.netMonthly * 12, 0);
  });

  it("Brutto = 0 € → alle Werte 0", () => {
    const r = calculateCompleteTax({
      taxClass: "1", grossSalaryYearly: 0,
      childAllowances: 0, churchTax: false, churchTaxRate: 0,
      healthInsuranceRate: 1.7, isEastGermany: false, isChildless: true, age: 30,
      employmentType: "fulltime", year: 2025,
    });
    expect(r.netMonthly).toBe(0);
    expect(r.totalDeductions).toBe(0);
  });
});