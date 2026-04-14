/**
 * Mehrfachbeschäftigung – SV-Beitragsverteilung (§ 22 Abs. 2 SGB IV)
 * 
 * Bei mehreren Arbeitgebern wird die Beitragsbemessungsgrenze anteilig
 * auf die einzelnen Beschäftigungen verteilt. Die Verteilung erfolgt
 * im Verhältnis der Bruttoentgelte zueinander.
 * 
 * Der Arbeitnehmer muss den Arbeitgebern die Mehrfachbeschäftigung melden.
 */

import { roundCurrency } from '@/lib/formatters';
import { BBG_2025_MONTHLY, SOCIAL_INSURANCE_RATES_2025, getCareInsuranceRate } from '@/constants/social-security';

// ============= Typen =============

export interface Employment {
  /** Kennung des Arbeitgebers */
  employerId: string;
  employerName: string;
  /** Monatliches Bruttoentgelt */
  monthlyGross: number;
  /** Ist dies die Hauptbeschäftigung? */
  isPrimary: boolean;
}

export interface MultipleEmploymentInput {
  /** Alle Beschäftigungen des Arbeitnehmers */
  employments: Employment[];
  /** Ist der AN in Ostdeutschland? */
  isEastGermany?: boolean;
  /** Ist der AN kinderlos (für PV)? */
  isChildless?: boolean;
  /** Alter des AN */
  age?: number;
  /** Anzahl Kinder (für PV-Abschlag) */
  numberOfChildren?: number;
}

export interface EmploymentSVResult {
  employerId: string;
  employerName: string;
  monthlyGross: number;
  /** Anteil an der BBG (in %) */
  bbgSharePercent: number;
  /** Anteilige BBG für dieses Beschäftigungsverhältnis */
  allocatedBBG_RV: number;
  allocatedBBG_KV: number;
  /** SV-pflichtiges Entgelt (gekappt auf anteilige BBG) */
  svGross_RV: number;
  svGross_KV: number;
  /** SV-Beiträge AN */
  pensionEmployee: number;
  healthEmployee: number;
  unemploymentEmployee: number;
  careEmployee: number;
  totalEmployee: number;
}

export interface MultipleEmploymentResult {
  /** Gesamtbrutto über alle Beschäftigungen */
  totalGross: number;
  /** Gesamt-BBG (wird anteilig verteilt) */
  bbg_RV: number;
  bbg_KV: number;
  /** Ergebnis je Beschäftigung */
  employmentResults: EmploymentSVResult[];
  /** Gesamte SV-Beiträge AN */
  totalSVEmployee: number;
  /** Hinweise */
  warnings: string[];
}

// ============= Berechnung =============

/**
 * Berechnet die SV-Beitragsverteilung bei Mehrfachbeschäftigung
 */
export function calculateMultipleEmploymentSV(input: MultipleEmploymentInput): MultipleEmploymentResult {
  const {
    employments,
    isEastGermany = false,
    isChildless = false,
    age = 30,
    numberOfChildren = 0,
  } = input;

  const warnings: string[] = [];

  if (employments.length < 2) {
    warnings.push('Weniger als 2 Beschäftigungen – keine Mehrfachbeschäftigung.');
  }

  // Gesamt-Brutto
  const totalGross = roundCurrency(employments.reduce((sum, e) => sum + e.monthlyGross, 0));

  // BBGs
  const bbg_RV = isEastGermany ? BBG_2025_MONTHLY.pensionEast : BBG_2025_MONTHLY.pensionWest;
  const bbg_KV = BBG_2025_MONTHLY.healthCare;

  // SV-Sätze
  const rates = SOCIAL_INSURANCE_RATES_2025;
  const careRate = getCareInsuranceRate(isChildless, age, numberOfChildren);

  // Anteilige Verteilung nach Brutto-Verhältnis
  const employmentResults: EmploymentSVResult[] = employments.map((emp) => {
    const share = totalGross > 0 ? emp.monthlyGross / totalGross : 0;
    const bbgSharePercent = roundCurrency(share * 100, 2);

    const allocatedBBG_RV = roundCurrency(bbg_RV * share);
    const allocatedBBG_KV = roundCurrency(bbg_KV * share);

    const svGross_RV = roundCurrency(Math.min(emp.monthlyGross, allocatedBBG_RV));
    const svGross_KV = roundCurrency(Math.min(emp.monthlyGross, allocatedBBG_KV));

    const pensionEmployee = roundCurrency(svGross_RV * rates.pension.employee / 100);
    const healthEmployee = roundCurrency(svGross_KV * (rates.health.employee + rates.health.averageAdditional / 2) / 100);
    const unemploymentEmployee = roundCurrency(svGross_RV * rates.unemployment.employee / 100);
    const careEmployee = roundCurrency(svGross_KV * careRate.employee / 100);
    const totalEmployee = roundCurrency(pensionEmployee + healthEmployee + unemploymentEmployee + careEmployee);

    return {
      employerId: emp.employerId,
      employerName: emp.employerName,
      monthlyGross: emp.monthlyGross,
      bbgSharePercent,
      allocatedBBG_RV,
      allocatedBBG_KV,
      svGross_RV,
      svGross_KV,
      pensionEmployee,
      healthEmployee,
      unemploymentEmployee,
      careEmployee,
      totalEmployee,
    };
  });

  const totalSVEmployee = roundCurrency(
    employmentResults.reduce((sum, r) => sum + r.totalEmployee, 0)
  );

  // Warnungen
  if (totalGross > bbg_RV) {
    warnings.push(`Gesamtbrutto (${totalGross.toFixed(2)} €) übersteigt BBG RV (${bbg_RV.toFixed(2)} €) – Kappung je Beschäftigung angewandt.`);
  }

  return {
    totalGross,
    bbg_RV,
    bbg_KV,
    employmentResults,
    totalSVEmployee,
    warnings,
  };
}
