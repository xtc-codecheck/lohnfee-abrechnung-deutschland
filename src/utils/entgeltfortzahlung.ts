/**
 * Entgeltfortzahlung im Krankheitsfall (§ 3 EFZG)
 * 
 * Arbeitgeber zahlt die ersten 6 Wochen (42 Kalendertage) 100% des Gehalts weiter.
 * Erst danach zahlt die Krankenkasse Krankengeld (70% Brutto, max. 90% Netto).
 */

import { differenceInCalendarDays, startOfDay, endOfDay, addDays } from 'date-fns';
import { Employee } from '@/types/employee';
import { SickPayCalculation, SICK_PAY_RATES } from '@/types/special-payments';
import { calculateCompleteTax } from './tax-calculation';
import { buildTaxParamsFromEmployee } from './tax-params-factory';
import { roundCurrency } from '@/lib/formatters';

export const EFZG_DURATION_DAYS = 42; // 6 Wochen = 42 Kalendertage

export interface EFZGResult {
  /** Phase 1: Entgeltfortzahlung durch Arbeitgeber */
  employerPaymentDays: number;
  employerPaymentAmount: number;
  /** Phase 2: Krankengeld durch Krankenkasse */
  sickPayDays: number;
  sickPayAmount: number;
  /** Gesamtübersicht */
  totalDays: number;
  totalAmount: number;
  /** Detaillierte Berechnung */
  dailyGrossSalary: number;
  dailySickPay: number;
  efzgEndDate: Date;
  sickPayStartDate: Date | null;
}

export interface EFZGParams {
  employee: Employee;
  sickStartDate: Date;
  sickEndDate: Date;
  grossMonthlySalary: number;
  /** Bereits verbrauchte EFZG-Tage in dieser Krankheitsperiode (gleiche Diagnose) */
  previousEfzgDaysUsed?: number;
}

/**
 * Berechnet Entgeltfortzahlung und ggf. anschließendes Krankengeld
 */
export function calculateEFZG(params: EFZGParams): EFZGResult {
  const { employee, sickStartDate, sickEndDate, grossMonthlySalary, previousEfzgDaysUsed = 0 } = params;

  const totalDays = differenceInCalendarDays(endOfDay(sickEndDate), startOfDay(sickStartDate)) + 1;
  const dailyGrossSalary = roundCurrency(grossMonthlySalary / 30);

  // Verbleibende EFZG-Tage
  const remainingEfzgDays = Math.max(0, EFZG_DURATION_DAYS - previousEfzgDaysUsed);
  const employerPaymentDays = Math.min(totalDays, remainingEfzgDays);
  const employerPaymentAmount = roundCurrency(employerPaymentDays * dailyGrossSalary);

  // Krankengeld-Phase (nach EFZG)
  const sickPayDays = Math.max(0, totalDays - employerPaymentDays);

  let dailySickPay = 0;
  let sickPayAmount = 0;

  if (sickPayDays > 0) {
    // Krankengeld: 70% Brutto, max. 90% Netto
    const taxParams = buildTaxParamsFromEmployee(employee, {
      grossSalaryYearly: grossMonthlySalary * 12,
    });
    const taxResult = calculateCompleteTax(taxParams);
    const dailyNetSalary = roundCurrency(taxResult.netMonthly / 30);

    const sickPayFromGross = roundCurrency(dailyGrossSalary * SICK_PAY_RATES.percentage);
    const maxSickPayFromNet = roundCurrency(dailyNetSalary * SICK_PAY_RATES.maxPercentageOfNet);
    dailySickPay = Math.min(sickPayFromGross, maxSickPayFromNet);
    sickPayAmount = roundCurrency(sickPayDays * dailySickPay);
  }

  const efzgEndDate = addDays(sickStartDate, employerPaymentDays - 1);
  const sickPayStartDate = sickPayDays > 0 ? addDays(efzgEndDate, 1) : null;

  return {
    employerPaymentDays,
    employerPaymentAmount,
    sickPayDays,
    sickPayAmount,
    totalDays,
    totalAmount: roundCurrency(employerPaymentAmount + sickPayAmount),
    dailyGrossSalary,
    dailySickPay,
    efzgEndDate,
    sickPayStartDate,
  };
}
