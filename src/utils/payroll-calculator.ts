/**
 * Zentraler Lohnberechnungs-Service
 * 
 * Phase 1 & 4: Korrekte Berechnungen mit Input-Guards
 * Phase 5: Integrierter Audit-Trail für Revisionssicherheit
 * 
 * Kapselt die gesamte Lohnberechnungslogik mit:
 * - Input-Validierung
 * - Korrekter Steuer/SV-Berechnung via calculateCompleteTax
 * - Rundung auf Cent-Genauigkeit
 * - Berechnungs-Log für Audit-Trail
 */

import { Employee, SalaryCalculation } from '@/types/employee';
import { PayrollEntry, WorkingTimeData, Deductions, Additions, BONUS_RATES } from '@/types/payroll';
import { calculateCompleteTax, calculateOvertimeAndBonuses, TaxCalculationParams } from '@/utils/tax-calculation';
import { buildTaxParamsFromEmployee } from '@/utils/tax-params-factory';
import { roundCurrency, sumCurrency, isValidPayrollAmount } from '@/lib/formatters';
import { SOCIAL_INSURANCE_RATES_2025, getCareInsuranceRate, BBG_2025_MONTHLY } from '@/constants/social-security';
import { PayrollAuditLogger, CalculationAudit, createPayrollAudit } from '@/utils/calculation-audit';

// ============= Typen =============

export interface PayrollCalculationInput {
  employee: Employee;
  period: {
    year: number;
    month: number;
  };
  workingData: WorkingTimeData;
  additionalDeductions?: Partial<Deductions>;
  additionalAdditions?: Partial<Additions>;
}

export interface PayrollCalculationOutput {
  entry: Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'>;
  calculationLog: string[];
  warnings: string[];
  audit?: CalculationAudit; // Vollständiges Audit-Dokument für Revisionssicherheit
}

// ============= Input Guards =============

/**
 * Validiert die Eingabedaten vor der Berechnung
 */
function validateInput(input: PayrollCalculationInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Employee-Validierung
  if (!input.employee) {
    errors.push('Mitarbeiter fehlt');
    return { isValid: false, errors };
  }
  
  if (!input.employee.salaryData?.grossSalary || input.employee.salaryData.grossSalary <= 0) {
    errors.push('Ungültiges Bruttogehalt');
  }
  
  if (!input.employee.employmentData?.weeklyHours || input.employee.employmentData.weeklyHours <= 0) {
    errors.push('Ungültige Wochenarbeitsstunden');
  }
  
  // Perioden-Validierung
  if (!input.period || input.period.month < 1 || input.period.month > 12) {
    errors.push('Ungültiger Monat');
  }
  
  if (!input.period || input.period.year < 2020 || input.period.year > 2100) {
    errors.push('Ungültiges Jahr');
  }
  
  // WorkingData-Validierung
  const wd = input.workingData;
  if (wd.regularHours < 0 || wd.overtimeHours < 0 || wd.nightHours < 0) {
    errors.push('Stunden dürfen nicht negativ sein');
  }
  
  if (wd.actualWorkingDays < 0 || wd.expectedWorkingDays < 0) {
    errors.push('Arbeitstage dürfen nicht negativ sein');
  }
  
  return { isValid: errors.length === 0, errors };
}

// ============= Hauptberechnung =============

/**
 * Berechnet eine vollständige Lohnabrechnung für einen Mitarbeiter
 * 
 * @param input - Eingabedaten für die Berechnung
 * @returns Berechnungsergebnis mit Entry, Log und Warnungen
 * @throws Error bei ungültigen Eingabedaten
 */
export function calculatePayrollEntry(input: PayrollCalculationInput): PayrollCalculationOutput {
  const log: string[] = [];
  const warnings: string[] = [];
  
  // 1. Input-Validierung
  const validation = validateInput(input);
  if (!validation.isValid) {
    throw new Error(`Ungültige Eingabedaten: ${validation.errors.join(', ')}`);
  }
  
  const { employee, workingData } = input;
  
  // Audit-Logger initialisieren
  const auditLogger = createPayrollAudit(
    employee.id,
    input.period.month,
    input.period.year
  );
  
  log.push(`Berechnung gestartet für ${employee.personalData.firstName} ${employee.personalData.lastName}`);
  log.push(`Periode: ${input.period.month}/${input.period.year}`);
  
  // 2. Basis-Gehaltsdaten
  const baseSalary = roundCurrency(employee.salaryData.grossSalary);
  const weeklyHours = employee.employmentData.weeklyHours;
  const monthlyHours = weeklyHours * 4.33;
  const hourlyRate = roundCurrency(baseSalary / monthlyHours);
  
  auditLogger.log('BASE_SALARY', 'Basisgehalt ermittelt', {
    Bruttogehalt: baseSalary,
    Wochenstunden: weeklyHours,
    Monatsstunden: roundCurrency(monthlyHours, 1),
    Stundensatz: hourlyRate,
  });
  
  log.push(`Basisgehalt: ${baseSalary}€, Stundensatz: ${hourlyRate}€`);
  
  // 3. Zuschläge berechnen
  const overtimeCalc = calculateOvertimeAndBonuses({
    regularHours: workingData.regularHours,
    overtimeHours: workingData.overtimeHours,
    nightHours: workingData.nightHours,
    sundayHours: workingData.sundayHours,
    holidayHours: workingData.holidayHours,
    hourlyRate,
  });
  
  const additions: Additions = {
    overtimePay: roundCurrency(workingData.overtimeHours * hourlyRate * BONUS_RATES.overtime),
    nightShiftBonus: roundCurrency(workingData.nightHours * hourlyRate * BONUS_RATES.nightShift),
    sundayBonus: roundCurrency(workingData.sundayHours * hourlyRate * BONUS_RATES.sunday),
    holidayBonus: roundCurrency(workingData.holidayHours * hourlyRate * BONUS_RATES.holiday),
    bonuses: roundCurrency(input.additionalAdditions?.bonuses ?? 0),
    oneTimePayments: roundCurrency(input.additionalAdditions?.oneTimePayments ?? 0),
    expenseReimbursements: roundCurrency(input.additionalAdditions?.expenseReimbursements ?? 0),
    total: 0,
  };
  
  additions.total = sumCurrency(
    additions.overtimePay,
    additions.nightShiftBonus,
    additions.sundayBonus,
    additions.holidayBonus,
    additions.bonuses,
    additions.oneTimePayments,
    additions.expenseReimbursements
  );
  
  if (additions.total > 0) {
    auditLogger.log('ADDITIONS', 'Zuschläge berechnet', {
      Überstunden_Std: workingData.overtimeHours,
      Nacht_Std: workingData.nightHours,
      Sonntag_Std: workingData.sundayHours,
      Feiertag_Std: workingData.holidayHours,
    }, {
      Überstundenzuschlag: additions.overtimePay,
      Nachtzuschlag: additions.nightShiftBonus,
      Sonntagszuschlag: additions.sundayBonus,
      Feiertagszuschlag: additions.holidayBonus,
      Zuschläge_Gesamt: additions.total,
    }, [
      `Überstunden: ${BONUS_RATES.overtime * 100}%`,
      `Nacht: ${BONUS_RATES.nightShift * 100}%`,
      `Sonntag: ${BONUS_RATES.sunday * 100}%`,
      `Feiertag: ${BONUS_RATES.holiday * 100}%`,
    ]);
  }
  
  log.push(`Zuschläge gesamt: ${additions.total}€`);
  
  // 4. Abzüge
  const deductions: Deductions = {
    unpaidLeave: roundCurrency(input.additionalDeductions?.unpaidLeave ?? 0),
    advancePayments: roundCurrency(input.additionalDeductions?.advancePayments ?? 0),
    otherDeductions: roundCurrency(input.additionalDeductions?.otherDeductions ?? 0),
    total: 0,
  };
  
  deductions.total = sumCurrency(
    deductions.unpaidLeave,
    deductions.advancePayments,
    deductions.otherDeductions
  );
  
  if (deductions.total > 0) {
    auditLogger.log('DEDUCTIONS', 'Abzüge erfasst', undefined, {
      Unbezahlter_Urlaub: deductions.unpaidLeave,
      Vorschüsse: deductions.advancePayments,
      Sonstige: deductions.otherDeductions,
      Gesamt: deductions.total,
    });
  }
  
  // 5. Gesamtbrutto berechnen
  const totalGrossSalary = roundCurrency(baseSalary + additions.total);
  log.push(`Gesamtbrutto: ${totalGrossSalary}€`);
  
  auditLogger.log('GROSS_TOTAL', 'Gesamtbrutto ermittelt', {
    Basisgehalt: baseSalary,
    Zuschläge: additions.total,
  }, {
    Gesamtbrutto: totalGrossSalary,
  });
  
  // 6. Konstanten protokollieren
  const eastGermanStates = ['berlin', 'brandenburg', 'mecklenburg-vorpommern', 'sachsen', 'sachsen-anhalt', 'thueringen'];
  const isEastGermany = eastGermanStates.includes((employee.personalData.address?.state || '').toLowerCase());
  const isChildless = employee.personalData.childAllowances === 0;
  auditLogger.logConstants(isEastGermany ? 'east' : 'west', isChildless);
  
  // 7. BBG-Kappung prüfen und protokollieren
  const bbgPension = isEastGermany ? BBG_2025_MONTHLY.pensionEast : BBG_2025_MONTHLY.pensionWest;
  const bbgHealth = BBG_2025_MONTHLY.healthCare;
  
  if (totalGrossSalary > bbgPension) {
    auditLogger.logBBGCapping('RV/AV', totalGrossSalary, bbgPension, bbgPension);
  }
  if (totalGrossSalary > bbgHealth) {
    auditLogger.logBBGCapping('KV/PV', totalGrossSalary, bbgHealth, bbgHealth);
  }
  
  // 8. KORREKTE Steuer- und SV-Berechnung via calculateCompleteTax
  const taxParams = buildTaxParamsFromEmployee(employee, {
    grossSalaryYearly: totalGrossSalary * 12,
  });
  
  const taxResult = calculateCompleteTax(taxParams);
  
  // 9. SalaryCalculation-Objekt erstellen
  const monthlyTax = roundCurrency(taxResult.incomeTax / 12);
  const monthlyChurchTax = roundCurrency(taxResult.churchTax / 12);
  const monthlySoli = roundCurrency(taxResult.solidarityTax / 12);
  
  const monthlyPension = roundCurrency(taxResult.pensionInsurance / 12);
  const monthlyHealth = roundCurrency(taxResult.healthInsurance / 12);
  const monthlyUnemployment = roundCurrency(taxResult.unemploymentInsurance / 12);
  const monthlyCare = roundCurrency(taxResult.careInsurance / 12);
  
  // Steuerberechnung protokollieren
  auditLogger.logTaxCalculation(
    totalGrossSalary,
    employee.personalData.taxClass,
    monthlyTax,
    monthlySoli,
    monthlyChurchTax
  );
  
  // Arbeitgeber-Anteile berechnen
  const employerPension = roundCurrency(monthlyPension);
  const employerHealth = roundCurrency(monthlyHealth);
  const employerUnemployment = roundCurrency(monthlyUnemployment);
  
  // Pflegeversicherung: AG-Anteil kann abweichen
  const careRate = getCareInsuranceRate(
    isChildless,
    calculateAge(employee.personalData.dateOfBirth)
  );
  const employerCare = roundCurrency(
    Math.min(totalGrossSalary, bbgHealth) * (careRate.employer / 100)
  );
  
  // SV-Berechnung protokollieren
  auditLogger.logSocialSecurityCalculation(
    totalGrossSalary,
    { employee: monthlyPension, employer: employerPension },
    { employee: monthlyHealth, employer: employerHealth },
    { employee: monthlyUnemployment, employer: employerUnemployment },
    { employee: monthlyCare, employer: employerCare }
  );
  
  log.push(`Steuerberechnung: Lohnsteuer ${monthlyTax}€/Monat`);
  log.push(`SV-Beiträge AN: ${roundCurrency(monthlyPension + monthlyHealth + monthlyUnemployment + monthlyCare)}€/Monat`);
  
  const salaryCalculation: SalaryCalculation = {
    grossSalary: totalGrossSalary,
    netSalary: roundCurrency(taxResult.netMonthly),
    socialSecurityContributions: {
      healthInsurance: {
        employee: monthlyHealth,
        employer: employerHealth,
        total: roundCurrency(monthlyHealth + employerHealth),
      },
      pensionInsurance: {
        employee: monthlyPension,
        employer: employerPension,
        total: roundCurrency(monthlyPension + employerPension),
      },
      unemploymentInsurance: {
        employee: monthlyUnemployment,
        employer: employerUnemployment,
        total: roundCurrency(monthlyUnemployment + employerUnemployment),
      },
      careInsurance: {
        employee: monthlyCare,
        employer: employerCare,
        total: roundCurrency(monthlyCare + employerCare),
      },
      total: {
        employee: roundCurrency(monthlyPension + monthlyHealth + monthlyUnemployment + monthlyCare),
        employer: roundCurrency(employerPension + employerHealth + employerUnemployment + employerCare),
        total: roundCurrency(
          monthlyPension + monthlyHealth + monthlyUnemployment + monthlyCare +
          employerPension + employerHealth + employerUnemployment + employerCare
        ),
      },
    },
    taxes: {
      incomeTax: monthlyTax,
      churchTax: monthlyChurchTax,
      solidarityTax: monthlySoli,
      total: roundCurrency(monthlyTax + monthlyChurchTax + monthlySoli),
    },
    employerCosts: roundCurrency(taxResult.employerCosts / 12),
  };
  
  // 10. Finale Nettoauszahlung
  const finalNetSalary = roundCurrency(salaryCalculation.netSalary - deductions.total);
  log.push(`Finale Nettoauszahlung: ${finalNetSalary}€`);
  
  // 11. Warnungen generieren
  if (finalNetSalary < 0) {
    warnings.push('KRITISCH: Negative Nettoauszahlung berechnet');
    auditLogger.addWarning('Negative Nettoauszahlung berechnet');
  }
  
  if (totalGrossSalary > bbgPension) {
    log.push('Hinweis: Gehalt über BBG RV/AV, Kappung angewendet');
  }
  
  if (deductions.total > 0) {
    log.push(`Abzüge von ${deductions.total}€ berücksichtigt`);
  }
  
  // 12. Entry zusammenbauen
  const entry: Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'> = {
    employeeId: employee.id,
    payrollPeriodId: '', // Wird beim Speichern gesetzt
    employee,
    workingData,
    salaryCalculation,
    deductions,
    additions,
    finalNetSalary,
  };
  
  // 13. Audit finalisieren
  const audit = auditLogger.finalize({
    grossMonthly: totalGrossSalary,
    netMonthly: finalNetSalary,
    totalTaxes: salaryCalculation.taxes.total,
    totalSocialSecurity: salaryCalculation.socialSecurityContributions.total.employee,
    employerCosts: salaryCalculation.employerCosts,
  });
  
  log.push('Berechnung abgeschlossen');
  log.push(`Audit-ID: ${audit.calculationId}`);
  
  return { entry, calculationLog: log, warnings, audit };
}

// ============= Hilfsfunktionen =============

/**
 * Berechnet das Alter aus dem Geburtsdatum
 */
function calculateAge(dateOfBirth: Date | string): number {
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Erstellt Standard-Arbeitszeitdaten für einen Monat
 */
export function createDefaultWorkingData(employee: Employee): WorkingTimeData {
  const weeklyHours = employee.employmentData.weeklyHours || 40;
  const monthlyHours = roundCurrency(weeklyHours * 4.33, 1);
  
  return {
    regularHours: monthlyHours,
    overtimeHours: 0,
    nightHours: 0,
    sundayHours: 0,
    holidayHours: 0,
    vacationDays: 0,
    sickDays: 0,
    actualWorkingDays: 21,
    expectedWorkingDays: 21,
  };
}

/**
 * Validiert ein berechnetes PayrollEntry auf Konsistenz
 */
export function validatePayrollConsistency(entry: PayrollEntry): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Summenprüfung: Netto = Brutto - SV - Steuern
  const expectedNet = roundCurrency(
    entry.salaryCalculation.grossSalary - 
    entry.salaryCalculation.socialSecurityContributions.total.employee -
    entry.salaryCalculation.taxes.total
  );
  
  if (Math.abs(expectedNet - entry.salaryCalculation.netSalary) > 0.02) {
    errors.push(`Netto-Summe inkonsistent: Erwartet ${expectedNet}€, gefunden ${entry.salaryCalculation.netSalary}€`);
  }
  
  // Finale Auszahlung prüfen
  const expectedFinal = roundCurrency(entry.salaryCalculation.netSalary - entry.deductions.total);
  if (Math.abs(expectedFinal - entry.finalNetSalary) > 0.02) {
    errors.push(`Finale Auszahlung inkonsistent: Erwartet ${expectedFinal}€, gefunden ${entry.finalNetSalary}€`);
  }
  
  // Zuschläge-Summe prüfen
  const expectedAdditionsTotal = sumCurrency(
    entry.additions.overtimePay,
    entry.additions.nightShiftBonus,
    entry.additions.sundayBonus,
    entry.additions.holidayBonus,
    entry.additions.bonuses,
    entry.additions.oneTimePayments,
    entry.additions.expenseReimbursements
  );
  
  if (Math.abs(expectedAdditionsTotal - entry.additions.total) > 0.02) {
    errors.push(`Zuschläge-Summe inkonsistent`);
  }
  
  return { isValid: errors.length === 0, errors };
}
