import { useState, useCallback } from 'react';
import { useTimeTracking } from './use-time-tracking';
import { usePayrollStorage } from './use-payroll-storage';
import { useEmployeeStorage } from './use-employee-storage';
import { 
  integrateTimeTrackingToPayroll, 
  createPayrollFromTimeTracking,
  PayrollTimeIntegration 
} from '@/utils/time-payroll-integration';
import { PayrollEntry, WorkingTimeData, BONUS_RATES } from '@/types/payroll';
import { calculateCompleteTax } from '@/utils/tax-calculation';
import { buildTaxParamsFromEmployee } from '@/utils/tax-params-factory';

export interface TimePayrollSyncResult {
  success: boolean;
  entriesCreated: number;
  errors: string[];
}

export function useTimePayrollIntegration() {
  const { timeEntries, getTimeEntriesForEmployee } = useTimeTracking();
  const { 
    payrollPeriods, 
    addPayrollEntry, 
    getPayrollEntriesForPeriod,
    createPayrollPeriod 
  } = usePayrollStorage();
  const { employees } = useEmployeeStorage();
  
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Holt die Zeitintegrationsdaten für alle Mitarbeiter eines Monats
   */
  const getTimeIntegrationForPeriod = useCallback((
    year: number, 
    month: number
  ): PayrollTimeIntegration[] => {
    return createPayrollFromTimeTracking(employees, timeEntries, year, month);
  }, [employees, timeEntries]);

  /**
   * Holt die Zeitintegrationsdaten für einen einzelnen Mitarbeiter
   */
  const getTimeIntegrationForEmployee = useCallback((
    employeeId: string,
    year: number,
    month: number
  ): PayrollTimeIntegration | null => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;
    
    return integrateTimeTrackingToPayroll(employee, timeEntries, year, month);
  }, [employees, timeEntries]);

  /**
   * Synchronisiert Zeiterfassungsdaten in Lohnabrechnungen
   */
  const syncTimeToPayroll = useCallback(async (
    year: number,
    month: number,
    selectedEmployeeIds?: string[]
  ): Promise<TimePayrollSyncResult> => {
    setIsProcessing(true);
    const errors: string[] = [];
    let entriesCreated = 0;

    try {
      // Finde oder erstelle Abrechnungszeitraum
      let period = payrollPeriods.find(p => p.year === year && p.month === month);
      if (!period) {
        period = createPayrollPeriod(year, month);
      }

      // Hole existierende Einträge
      const existingEntries = getPayrollEntriesForPeriod(period.id);
      const existingEmployeeIds = new Set(existingEntries.map(e => e.employeeId));

      // Hole Zeitintegrationsdaten
      const integrations = getTimeIntegrationForPeriod(year, month);
      const filteredIntegrations = selectedEmployeeIds 
        ? integrations.filter(i => selectedEmployeeIds.includes(i.employeeId))
        : integrations;

      for (const integration of filteredIntegrations) {
        // Überspringe wenn bereits vorhanden
        if (existingEmployeeIds.has(integration.employeeId)) {
          continue;
        }

        const employee = employees.find(e => e.id === integration.employeeId);
        if (!employee) {
          errors.push(`Mitarbeiter ${integration.employeeName} nicht gefunden`);
          continue;
        }

        // Berechne Zuschläge basierend auf Zeitdaten
        const hourlyRate = employee.salaryData.hourlyWage || 
          (employee.salaryData.grossSalary / (employee.employmentData.weeklyHours * 4.33));

        const additions = {
          overtimePay: integration.timeData.overtimeHours * hourlyRate * BONUS_RATES.overtime,
          nightShiftBonus: integration.timeData.nightHours * hourlyRate * BONUS_RATES.nightShift,
          sundayBonus: integration.timeData.sundayHours * hourlyRate * BONUS_RATES.sunday,
          holidayBonus: integration.timeData.holidayHours * hourlyRate * BONUS_RATES.holiday,
          bonuses: 0,
          oneTimePayments: 0,
          expenseReimbursements: 0,
          total: 0
        };
        additions.total = additions.overtimePay + additions.nightShiftBonus + 
                         additions.sundayBonus + additions.holidayBonus;

        // Berechne Abzüge
        const deductions = {
          unpaidLeave: 0,
          advancePayments: 0,
          otherDeductions: 0,
          total: 0
        };

        // Berechne Gehalt mit Steuern - nutze zentrale Factory
        const grossWithAdditions = employee.salaryData.grossSalary + additions.total;
        const taxParams = buildTaxParamsFromEmployee(employee, {
          grossSalaryYearly: grossWithAdditions * 12,
        });
        const taxResult = calculateCompleteTax(taxParams);

        const payrollEntry: Omit<PayrollEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          employeeId: employee.id,
          payrollPeriodId: period.id,
          employee,
          workingData: integration.timeData,
          salaryCalculation: {
            grossSalary: grossWithAdditions,
            netSalary: taxResult.netMonthly,
            taxes: {
              incomeTax: taxResult.incomeTax / 12,
              solidarityTax: taxResult.solidarityTax / 12,
              churchTax: taxResult.churchTax / 12,
              total: taxResult.totalTaxes / 12
            },
            socialSecurityContributions: {
              pensionInsurance: {
                employee: taxResult.pensionInsurance / 12,
                employer: taxResult.pensionInsurance / 12,
                total: (taxResult.pensionInsurance / 12) * 2
              },
              healthInsurance: {
                employee: taxResult.healthInsurance / 12,
                employer: taxResult.healthInsurance / 12,
                total: (taxResult.healthInsurance / 12) * 2
              },
              unemploymentInsurance: {
                employee: taxResult.unemploymentInsurance / 12,
                employer: taxResult.unemploymentInsurance / 12,
                total: (taxResult.unemploymentInsurance / 12) * 2
              },
              careInsurance: {
                employee: taxResult.careInsurance / 12,
                employer: taxResult.careInsurance / 12,
                total: (taxResult.careInsurance / 12) * 2
              },
              total: {
                employee: taxResult.totalSocialContributions / 12,
                employer: taxResult.totalSocialContributions / 12,
                total: (taxResult.totalSocialContributions / 12) * 2
              }
            },
            employerCosts: taxResult.employerCosts / 12
          },
          deductions,
          additions,
          finalNetSalary: taxResult.netMonthly - deductions.total + additions.total
        };

        addPayrollEntry(payrollEntry);
        entriesCreated++;
      }

      return { success: true, entriesCreated, errors };
    } catch (error) {
      errors.push(`Fehler bei der Synchronisation: ${error}`);
      return { success: false, entriesCreated, errors };
    } finally {
      setIsProcessing(false);
    }
  }, [
    employees, 
    payrollPeriods, 
    createPayrollPeriod, 
    getPayrollEntriesForPeriod, 
    getTimeIntegrationForPeriod, 
    addPayrollEntry
  ]);

  /**
   * Prüft ob Zeitdaten für eine Periode vollständig sind
   */
  const checkTimeDataCompleteness = useCallback((
    year: number,
    month: number
  ): { complete: number; incomplete: number; withDiscrepancies: number } => {
    const integrations = getTimeIntegrationForPeriod(year, month);
    
    return {
      complete: integrations.filter(i => i.status === 'complete').length,
      incomplete: integrations.filter(i => i.status === 'incomplete').length,
      withDiscrepancies: integrations.filter(i => i.status === 'discrepancies').length
    };
  }, [getTimeIntegrationForPeriod]);

  return {
    isProcessing,
    getTimeIntegrationForPeriod,
    getTimeIntegrationForEmployee,
    syncTimeToPayroll,
    checkTimeDataCompleteness
  };
}
