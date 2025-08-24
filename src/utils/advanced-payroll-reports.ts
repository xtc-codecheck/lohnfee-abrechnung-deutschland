// Erweiterte Payroll-Reports mit AG/AN-Anteilen und Zeitreihen

import { Employee } from '@/types/employee';
import { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import { calculateCompleteTax } from '@/utils/tax-calculation';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, subYears } from 'date-fns';
import { de } from 'date-fns/locale';

export interface PayrollCostBreakdown {
  employeeId: string;
  employeeName: string;
  department: string;
  grossSalary: number;
  
  // Arbeitnehmer-Anteile
  employeePensionInsurance: number;
  employeeUnemploymentInsurance: number;
  employeeHealthInsurance: number;
  employeeCareInsurance: number;
  employeeTotalSocialSecurity: number;
  
  // Arbeitgeber-Anteile
  employerPensionInsurance: number;
  employerUnemploymentInsurance: number;
  employerHealthInsurance: number;
  employerCareInsurance: number;
  employerTotalSocialSecurity: number;
  
  // Steuern
  incomeTax: number;
  solidarityTax: number;
  churchTax: number;
  totalTaxes: number;
  
  // Summen
  netSalary: number;
  totalEmployerCosts: number;
  totalLaborCosts: number;
}

export interface SocialSecurityOverview {
  period: string;
  totalGrossSalary: number;
  
  // Rentenversicherung
  pensionEmployeeTotal: number;
  pensionEmployerTotal: number;
  pensionGrandTotal: number;
  
  // Arbeitslosenversicherung
  unemploymentEmployeeTotal: number;
  unemploymentEmployerTotal: number;
  unemploymentGrandTotal: number;
  
  // Krankenversicherung
  healthEmployeeTotal: number;
  healthEmployerTotal: number;
  healthGrandTotal: number;
  
  // Pflegeversicherung
  careEmployeeTotal: number;
  careEmployerTotal: number;
  careGrandTotal: number;
  
  // Gesamtsummen
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
  totalSocialSecurity: number;
}

export interface TaxOverview {
  period: string;
  totalGrossSalary: number;
  totalIncomeTax: number;
  totalSolidarityTax: number;
  totalChurchTax: number;
  totalTaxBurden: number;
  averageTaxRate: number;
}

export interface PayrollTimeSeriesData {
  month: SocialSecurityOverview & TaxOverview;
  yearToDate: SocialSecurityOverview & TaxOverview;
  previousYear: SocialSecurityOverview & TaxOverview;
}

/**
 * Berechnet vollständige Lohnkosten-Aufschlüsselung
 */
export function calculatePayrollCostBreakdown(
  employees: Employee[],
  payrollEntries: PayrollEntry[],
  periodId: string
): PayrollCostBreakdown[] {
  const periodEntries = payrollEntries.filter(entry => entry.payrollPeriodId === periodId);
  
  return periodEntries.map(entry => {
    const employee = employees.find(e => e.id === entry.employeeId);
    if (!employee) throw new Error(`Employee not found: ${entry.employeeId}`);
    
    // Berechne exakte Steuer- und Sozialabgaben
    const taxResult = calculateCompleteTax({
      grossSalaryYearly: entry.salaryCalculation.grossSalary * 12,
      taxClass: employee.personalData.taxClass,
      childAllowances: employee.personalData.childAllowances || 0,
      churchTax: employee.personalData.churchTax,
      churchTaxRate: employee.personalData.churchTax ? 9 : 0,
      healthInsuranceRate: 2.45, // Standard
      isEastGermany: false,
      isChildless: (employee.personalData.childAllowances || 0) === 0,
      age: 30
    });
    
    // Arbeitnehmer-Anteile (monatlich)
    const employeePensionInsurance = taxResult.pensionInsurance / 12;
    const employeeUnemploymentInsurance = taxResult.unemploymentInsurance / 12;
    const employeeHealthInsurance = taxResult.healthInsurance / 12;
    const employeeCareInsurance = taxResult.careInsurance / 12;
    
    // Arbeitgeber-Anteile (gleich wie Arbeitnehmer-Anteile)
    const employerPensionInsurance = employeePensionInsurance;
    const employerUnemploymentInsurance = employeeUnemploymentInsurance;
    const employerHealthInsurance = employeeHealthInsurance;
    const employerCareInsurance = employeeCareInsurance;
    
    const employeeTotalSocialSecurity = employeePensionInsurance + employeeUnemploymentInsurance + 
                                      employeeHealthInsurance + employeeCareInsurance;
    const employerTotalSocialSecurity = employerPensionInsurance + employerUnemploymentInsurance + 
                                      employerHealthInsurance + employerCareInsurance;
    
    // Steuern (monatlich)
    const incomeTax = taxResult.incomeTax / 12;
    const solidarityTax = taxResult.solidarityTax / 12;
    const churchTax = taxResult.churchTax / 12;
    const totalTaxes = incomeTax + solidarityTax + churchTax;
    
    // Summen
    const grossSalary = entry.salaryCalculation.grossSalary;
    const netSalary = grossSalary - employeeTotalSocialSecurity - totalTaxes;
    const totalEmployerCosts = grossSalary + employerTotalSocialSecurity;
    const totalLaborCosts = totalEmployerCosts + totalTaxes;
    
    return {
      employeeId: employee.id,
      employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
      department: employee.employmentData.department,
      grossSalary,
      
      // Arbeitnehmer
      employeePensionInsurance,
      employeeUnemploymentInsurance,
      employeeHealthInsurance,
      employeeCareInsurance,
      employeeTotalSocialSecurity,
      
      // Arbeitgeber
      employerPensionInsurance,
      employerUnemploymentInsurance,
      employerHealthInsurance,
      employerCareInsurance,
      employerTotalSocialSecurity,
      
      // Steuern
      incomeTax,
      solidarityTax,
      churchTax,
      totalTaxes,
      
      // Summen
      netSalary,
      totalEmployerCosts,
      totalLaborCosts
    };
  });
}

/**
 * Erstellt Sozialversicherungs-Übersicht für einen Zeitraum
 */
export function createSocialSecurityOverview(
  payrollBreakdowns: PayrollCostBreakdown[],
  period: string
): SocialSecurityOverview {
  const totals = payrollBreakdowns.reduce((acc, breakdown) => {
    acc.totalGrossSalary += breakdown.grossSalary;
    
    // Rentenversicherung
    acc.pensionEmployeeTotal += breakdown.employeePensionInsurance;
    acc.pensionEmployerTotal += breakdown.employerPensionInsurance;
    
    // Arbeitslosenversicherung
    acc.unemploymentEmployeeTotal += breakdown.employeeUnemploymentInsurance;
    acc.unemploymentEmployerTotal += breakdown.employerUnemploymentInsurance;
    
    // Krankenversicherung
    acc.healthEmployeeTotal += breakdown.employeeHealthInsurance;
    acc.healthEmployerTotal += breakdown.employerHealthInsurance;
    
    // Pflegeversicherung
    acc.careEmployeeTotal += breakdown.employeeCareInsurance;
    acc.careEmployerTotal += breakdown.employerCareInsurance;
    
    return acc;
  }, {
    totalGrossSalary: 0,
    pensionEmployeeTotal: 0,
    pensionEmployerTotal: 0,
    unemploymentEmployeeTotal: 0,
    unemploymentEmployerTotal: 0,
    healthEmployeeTotal: 0,
    healthEmployerTotal: 0,
    careEmployeeTotal: 0,
    careEmployerTotal: 0
  });
  
  return {
    period,
    totalGrossSalary: totals.totalGrossSalary,
    
    pensionEmployeeTotal: totals.pensionEmployeeTotal,
    pensionEmployerTotal: totals.pensionEmployerTotal,
    pensionGrandTotal: totals.pensionEmployeeTotal + totals.pensionEmployerTotal,
    
    unemploymentEmployeeTotal: totals.unemploymentEmployeeTotal,
    unemploymentEmployerTotal: totals.unemploymentEmployerTotal,
    unemploymentGrandTotal: totals.unemploymentEmployeeTotal + totals.unemploymentEmployerTotal,
    
    healthEmployeeTotal: totals.healthEmployeeTotal,
    healthEmployerTotal: totals.healthEmployerTotal,
    healthGrandTotal: totals.healthEmployeeTotal + totals.healthEmployerTotal,
    
    careEmployeeTotal: totals.careEmployeeTotal,
    careEmployerTotal: totals.careEmployerTotal,
    careGrandTotal: totals.careEmployeeTotal + totals.careEmployerTotal,
    
    totalEmployeeContributions: totals.pensionEmployeeTotal + totals.unemploymentEmployeeTotal + 
                               totals.healthEmployeeTotal + totals.careEmployeeTotal,
    totalEmployerContributions: totals.pensionEmployerTotal + totals.unemploymentEmployerTotal + 
                               totals.healthEmployerTotal + totals.careEmployerTotal,
    totalSocialSecurity: (totals.pensionEmployeeTotal + totals.pensionEmployerTotal) +
                        (totals.unemploymentEmployeeTotal + totals.unemploymentEmployerTotal) +
                        (totals.healthEmployeeTotal + totals.healthEmployerTotal) +
                        (totals.careEmployeeTotal + totals.careEmployerTotal)
  };
}

/**
 * Erstellt Steuerlasten-Übersicht für einen Zeitraum
 */
export function createTaxOverview(
  payrollBreakdowns: PayrollCostBreakdown[],
  period: string
): TaxOverview {
  const totals = payrollBreakdowns.reduce((acc, breakdown) => {
    acc.totalGrossSalary += breakdown.grossSalary;
    acc.totalIncomeTax += breakdown.incomeTax;
    acc.totalSolidarityTax += breakdown.solidarityTax;
    acc.totalChurchTax += breakdown.churchTax;
    acc.totalTaxBurden += breakdown.totalTaxes;
    return acc;
  }, {
    totalGrossSalary: 0,
    totalIncomeTax: 0,
    totalSolidarityTax: 0,
    totalChurchTax: 0,
    totalTaxBurden: 0
  });
  
  const averageTaxRate = totals.totalGrossSalary > 0 ? 
    (totals.totalTaxBurden / totals.totalGrossSalary) * 100 : 0;
  
  return {
    period,
    totalGrossSalary: totals.totalGrossSalary,
    totalIncomeTax: totals.totalIncomeTax,
    totalSolidarityTax: totals.totalSolidarityTax,
    totalChurchTax: totals.totalChurchTax,
    totalTaxBurden: totals.totalTaxBurden,
    averageTaxRate
  };
}

/**
 * Erstellt Zeitreihen-Daten (Monat/YTD/VJ) für Reports
 */
export function createPayrollTimeSeries(
  employees: Employee[],
  payrollEntries: PayrollEntry[],
  payrollPeriods: PayrollPeriod[],
  targetDate: Date = new Date()
): PayrollTimeSeriesData {
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth();
  
  // Aktueller Monat
  const currentPeriod = payrollPeriods.find(p => 
    p.year === currentYear && p.month === currentMonth + 1
  );
  
  // Year-to-Date Perioden
  const ytdPeriods = payrollPeriods.filter(p => 
    p.year === currentYear && p.month <= currentMonth + 1
  );
  
  // Vorjahr Perioden  
  const previousYearPeriods = payrollPeriods.filter(p => 
    p.year === currentYear - 1
  );
  
  // Berechne Breakdowns
  const monthBreakdowns = currentPeriod ? 
    calculatePayrollCostBreakdown(employees, payrollEntries, currentPeriod.id) : [];
  
  const ytdBreakdowns = ytdPeriods.flatMap(period => 
    calculatePayrollCostBreakdown(employees, payrollEntries, period.id)
  );
  
  const previousYearBreakdowns = previousYearPeriods.flatMap(period => 
    calculatePayrollCostBreakdown(employees, payrollEntries, period.id)
  );
  
  // Erstelle Übersichten
  const monthPeriodName = format(targetDate, 'MMMM yyyy', { locale: de });
  const ytdPeriodName = `Jahr ${currentYear} (bis ${monthPeriodName})`;
  const previousYearPeriodName = `Jahr ${currentYear - 1}`;
  
  return {
    month: {
      ...createSocialSecurityOverview(monthBreakdowns, monthPeriodName),
      ...createTaxOverview(monthBreakdowns, monthPeriodName)
    },
    yearToDate: {
      ...createSocialSecurityOverview(ytdBreakdowns, ytdPeriodName),
      ...createTaxOverview(ytdBreakdowns, ytdPeriodName)
    },
    previousYear: {
      ...createSocialSecurityOverview(previousYearBreakdowns, previousYearPeriodName),
      ...createTaxOverview(previousYearBreakdowns, previousYearPeriodName)
    }
  };
}