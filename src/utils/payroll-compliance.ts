// Erweiterte Compliance-Validierung für Lohnabrechnung

import { Employee } from '@/types/employee';
import { PayrollEntry, WorkingTimeData } from '@/types/payroll';
import { MINIMUM_WAGES } from '@/types/compliance';
import { differenceInDays } from 'date-fns';

export interface MinimumWageValidation {
  isValid: boolean;
  currentHourlyWage: number;
  minimumHourlyWage: number;
  shortfall: number;
  requiredAdjustment: number;
  message: string;
}

export interface ComplianceValidationResult {
  minimumWageCheck: MinimumWageValidation;
  workingTimeCompliance: boolean;
  contractCompliance: boolean;
  dataRetentionCompliance: boolean;
  overallCompliance: boolean;
  violations: string[];
}

/**
 * Validiert Mindestlohn basierend auf Arbeitszeit und Gehalt
 */
export function validateMinimumWage(
  employee: Employee,
  workingData: WorkingTimeData,
  year: number = new Date().getFullYear()
): MinimumWageValidation {
  const minimumWage = MINIMUM_WAGES[year as keyof typeof MINIMUM_WAGES] || MINIMUM_WAGES[2025];
  
  // Berechne effektiven Stundenlohn
  const monthlyGross = employee.salaryData.grossSalary;
  const totalHoursWorked = workingData.regularHours + workingData.overtimeHours;
  
  // Wenn keine Stunden gearbeitet wurden, verwende Vertragsstunden
  const hoursForCalculation = totalHoursWorked > 0 ? totalHoursWorked : employee.employmentData.weeklyHours * 4.33;
  
  const currentHourlyWage = hoursForCalculation > 0 ? monthlyGross / hoursForCalculation : 0;
  
  const isValid = currentHourlyWage >= minimumWage;
  const shortfall = isValid ? 0 : minimumWage - currentHourlyWage;
  const requiredAdjustment = shortfall * hoursForCalculation;
  
  let message = '';
  if (!isValid) {
    message = `Mindestlohn-Unterschreitung: ${currentHourlyWage.toFixed(2)}€/h < ${minimumWage}€/h. Anpassung erforderlich: +${requiredAdjustment.toFixed(2)}€/Monat`;
  } else {
    message = `Mindestlohn erfüllt: ${currentHourlyWage.toFixed(2)}€/h ≥ ${minimumWage}€/h`;
  }
  
  return {
    isValid,
    currentHourlyWage,
    minimumHourlyWage: minimumWage,
    shortfall,
    requiredAdjustment,
    message
  };
}

/**
 * Vollständige Compliance-Validierung für Lohnabrechnung
 */
export function validatePayrollCompliance(
  employee: Employee,
  workingData: WorkingTimeData,
  year: number = new Date().getFullYear()
): ComplianceValidationResult {
  const violations: string[] = [];
  
  // Mindestlohn-Prüfung
  const minimumWageCheck = validateMinimumWage(employee, workingData, year);
  if (!minimumWageCheck.isValid) {
    violations.push(minimumWageCheck.message);
  }
  
  // Arbeitszeit-Compliance (max. 48h/Woche im Durchschnitt)
  const weeklyHours = (workingData.regularHours + workingData.overtimeHours) / 4.33;
  const workingTimeCompliance = weeklyHours <= 48;
  if (!workingTimeCompliance) {
    violations.push(`Arbeitszeitüberschreitung: ${weeklyHours.toFixed(1)}h/Woche > 48h erlaubt`);
  }
  
  // Vertrags-Compliance
  const contractCompliance = employee.employmentData.contractSigned;
  if (!contractCompliance) {
    violations.push('Arbeitsvertrag nicht unterschrieben zurückerhalten');
  }
  
  // Datenaufbewahrung-Compliance
  const today = new Date();
  const dataRetentionCompliance = employee.employmentData.dataRetentionDate > today;
  if (!dataRetentionCompliance) {
    violations.push('Aufbewahrungsfrist abgelaufen - Daten müssen gelöscht werden');
  }
  
  const overallCompliance = violations.length === 0;
  
  return {
    minimumWageCheck,
    workingTimeCompliance,
    contractCompliance,
    dataRetentionCompliance,
    overallCompliance,
    violations
  };
}

/**
 * Berechnet korrigiertes Gehalt bei Mindestlohn-Unterschreitung
 */
export function calculateMinimumWageAdjustment(
  employee: Employee,
  workingData: WorkingTimeData,
  year: number = new Date().getFullYear()
): number {
  const validation = validateMinimumWage(employee, workingData, year);
  return validation.isValid ? 0 : validation.requiredAdjustment;
}

/**
 * Prüft ob Überstunden erlaubt sind (max. 2h/Tag, 10h Gesamtarbeitszeit)
 */
export function validateOvertimeCompliance(
  workingData: WorkingTimeData,
  contractualDailyHours: number = 8
): { isValid: boolean; message: string } {
  const dailyOvertime = workingData.overtimeHours / workingData.actualWorkingDays;
  const totalDailyHours = contractualDailyHours + dailyOvertime;
  
  const maxOvertimePerDay = 2;
  const maxTotalDailyHours = 10;
  
  if (dailyOvertime > maxOvertimePerDay) {
    return {
      isValid: false,
      message: `Zu viele Überstunden: ${dailyOvertime.toFixed(1)}h/Tag > ${maxOvertimePerDay}h erlaubt`
    };
  }
  
  if (totalDailyHours > maxTotalDailyHours) {
    return {
      isValid: false,
      message: `Gesamtarbeitszeit zu hoch: ${totalDailyHours.toFixed(1)}h/Tag > ${maxTotalDailyHours}h erlaubt`
    };
  }
  
  return {
    isValid: true,
    message: 'Überstunden-Regelung eingehalten'
  };
}