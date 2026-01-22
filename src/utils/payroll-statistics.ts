/**
 * Zentrale Statistik-Utilities für Lohnabrechnungen
 * 
 * Konsolidiert redundante Statistik-Berechnungen aus verschiedenen
 * Dashboard-Komponenten in wiederverwendbare Funktionen.
 */

import { Employee } from '@/types/employee';
import { PayrollEntry, PayrollPeriod } from '@/types/payroll';

// ============= Typen =============

export interface PayrollTotals {
  grossTotal: number;
  netTotal: number;
  taxTotal: number;
  socialSecurityTotal: number;
  employerCostsTotal: number;
  entryCount: number;
}

export interface EmployeeStats {
  totalCount: number;
  byEmploymentType: Record<string, number>;
  byDepartment: Record<string, number>;
  averageSalary: number;
  totalMonthlyCost: number;
}

export interface PeriodComparison {
  current: PayrollTotals;
  previous: PayrollTotals;
  differences: {
    gross: number;
    net: number;
    tax: number;
    socialSecurity: number;
    employerCosts: number;
  };
  percentChanges: {
    gross: number;
    net: number;
    tax: number;
    socialSecurity: number;
    employerCosts: number;
  };
}

export interface DepartmentStats {
  department: string;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  averageSalary: number;
  totalEmployerCosts: number;
}

// ============= Payroll Statistiken =============

/**
 * Berechnet Gesamtsummen für Lohnabrechnungseinträge
 * 
 * @example
 * const totals = calculatePayrollTotals(entries);
 * console.log(`Brutto gesamt: ${totals.grossTotal}`);
 */
export function calculatePayrollTotals(entries: PayrollEntry[]): PayrollTotals {
  return entries.reduce<PayrollTotals>(
    (acc, entry) => {
      const calc = entry.salaryCalculation;
      
      return {
        grossTotal: acc.grossTotal + (calc?.grossSalary ?? 0),
        netTotal: acc.netTotal + (calc?.netSalary ?? 0),
        taxTotal: acc.taxTotal + (calc?.taxes?.total ?? 0),
        socialSecurityTotal: acc.socialSecurityTotal + 
          (calc?.socialSecurityContributions?.total?.employee ?? 0),
        employerCostsTotal: acc.employerCostsTotal + (calc?.employerCosts ?? 0),
        entryCount: acc.entryCount + 1,
      };
    },
    {
      grossTotal: 0,
      netTotal: 0,
      taxTotal: 0,
      socialSecurityTotal: 0,
      employerCostsTotal: 0,
      entryCount: 0,
    }
  );
}

/**
 * Erstellt leere Totals für Initialisierung
 */
export function createEmptyPayrollTotals(): PayrollTotals {
  return {
    grossTotal: 0,
    netTotal: 0,
    taxTotal: 0,
    socialSecurityTotal: 0,
    employerCostsTotal: 0,
    entryCount: 0,
  };
}

/**
 * Berechnet Durchschnittswerte aus Totals
 */
export function calculatePayrollAverages(totals: PayrollTotals): {
  averageGross: number;
  averageNet: number;
  averageTax: number;
  averageEmployerCosts: number;
} {
  const count = totals.entryCount || 1; // Division by zero verhindern
  
  return {
    averageGross: totals.grossTotal / count,
    averageNet: totals.netTotal / count,
    averageTax: totals.taxTotal / count,
    averageEmployerCosts: totals.employerCostsTotal / count,
  };
}

// ============= Mitarbeiter-Statistiken =============

/**
 * Berechnet aggregierte Mitarbeiter-Statistiken
 * 
 * @example
 * const stats = calculateEmployeeStats(employees);
 * console.log(`${stats.totalCount} Mitarbeiter in ${Object.keys(stats.byDepartment).length} Abteilungen`);
 */
export function calculateEmployeeStats(employees: Employee[]): EmployeeStats {
  const byEmploymentType: Record<string, number> = {};
  const byDepartment: Record<string, number> = {};
  let totalSalary = 0;

  for (const employee of employees) {
    // Nach Beschäftigungsart
    const empType = employee.employmentData.employmentType;
    byEmploymentType[empType] = (byEmploymentType[empType] ?? 0) + 1;

    // Nach Abteilung
    const dept = employee.employmentData.department || 'Ohne Abteilung';
    byDepartment[dept] = (byDepartment[dept] ?? 0) + 1;

    // Gehaltssumme
    totalSalary += employee.salaryData.grossSalary;
  }

  const count = employees.length || 1;

  return {
    totalCount: employees.length,
    byEmploymentType,
    byDepartment,
    averageSalary: totalSalary / count,
    totalMonthlyCost: totalSalary, // Vereinfacht, ohne AG-Anteile
  };
}

/**
 * Berechnet Statistiken pro Abteilung
 */
export function calculateDepartmentStats(
  employees: Employee[],
  entries?: PayrollEntry[]
): DepartmentStats[] {
  const departments = new Map<string, {
    employees: Employee[];
    entries: PayrollEntry[];
  }>();

  // Mitarbeiter gruppieren
  for (const employee of employees) {
    const dept = employee.employmentData.department || 'Ohne Abteilung';
    if (!departments.has(dept)) {
      departments.set(dept, { employees: [], entries: [] });
    }
    departments.get(dept)!.employees.push(employee);
  }

  // Einträge zuordnen (falls vorhanden)
  if (entries) {
    for (const entry of entries) {
      const dept = entry.employee?.employmentData?.department || 'Ohne Abteilung';
      if (departments.has(dept)) {
        departments.get(dept)!.entries.push(entry);
      }
    }
  }

  // Statistiken berechnen
  const stats: DepartmentStats[] = [];
  
  for (const [department, data] of departments) {
    const totals = entries 
      ? calculatePayrollTotals(data.entries)
      : createEmptyPayrollTotals();

    const employeeSalarySum = data.employees.reduce(
      (sum, emp) => sum + emp.salaryData.grossSalary,
      0
    );

    stats.push({
      department,
      employeeCount: data.employees.length,
      totalGross: totals.grossTotal || employeeSalarySum,
      totalNet: totals.netTotal,
      averageSalary: employeeSalarySum / (data.employees.length || 1),
      totalEmployerCosts: totals.employerCostsTotal,
    });
  }

  // Nach Mitarbeiteranzahl sortieren
  return stats.sort((a, b) => b.employeeCount - a.employeeCount);
}

// ============= Perioden-Vergleich =============

/**
 * Vergleicht zwei Abrechnungsperioden
 * 
 * @example
 * const comparison = comparePayrollPeriods(currentEntries, previousEntries);
 * if (comparison.percentChanges.gross > 0.1) {
 *   console.log('Lohnkosten um mehr als 10% gestiegen!');
 * }
 */
export function comparePayrollPeriods(
  currentEntries: PayrollEntry[],
  previousEntries: PayrollEntry[]
): PeriodComparison {
  const current = calculatePayrollTotals(currentEntries);
  const previous = calculatePayrollTotals(previousEntries);

  const calcDiff = (curr: number, prev: number) => curr - prev;
  const calcPercent = (curr: number, prev: number) => 
    prev === 0 ? (curr > 0 ? 1 : 0) : (curr - prev) / prev;

  return {
    current,
    previous,
    differences: {
      gross: calcDiff(current.grossTotal, previous.grossTotal),
      net: calcDiff(current.netTotal, previous.netTotal),
      tax: calcDiff(current.taxTotal, previous.taxTotal),
      socialSecurity: calcDiff(current.socialSecurityTotal, previous.socialSecurityTotal),
      employerCosts: calcDiff(current.employerCostsTotal, previous.employerCostsTotal),
    },
    percentChanges: {
      gross: calcPercent(current.grossTotal, previous.grossTotal),
      net: calcPercent(current.netTotal, previous.netTotal),
      tax: calcPercent(current.taxTotal, previous.taxTotal),
      socialSecurity: calcPercent(current.socialSecurityTotal, previous.socialSecurityTotal),
      employerCosts: calcPercent(current.employerCostsTotal, previous.employerCostsTotal),
    },
  };
}

// ============= Trend-Analyse =============

/**
 * Berechnet einen gleitenden Durchschnitt über mehrere Perioden
 */
export function calculateMovingAverage(
  periodTotals: PayrollTotals[],
  windowSize = 3
): number {
  if (periodTotals.length === 0) return 0;
  
  const window = periodTotals.slice(-windowSize);
  const sum = window.reduce((acc, t) => acc + t.grossTotal, 0);
  
  return sum / window.length;
}

/**
 * Erkennt signifikante Änderungen zwischen Perioden
 */
export function detectSignificantChanges(
  comparison: PeriodComparison,
  thresholdPercent = 0.1
): string[] {
  const alerts: string[] = [];

  if (Math.abs(comparison.percentChanges.gross) > thresholdPercent) {
    const direction = comparison.percentChanges.gross > 0 ? 'gestiegen' : 'gesunken';
    const percent = Math.abs(comparison.percentChanges.gross * 100).toFixed(1);
    alerts.push(`Bruttolohnsumme um ${percent}% ${direction}`);
  }

  if (Math.abs(comparison.percentChanges.employerCosts) > thresholdPercent) {
    const direction = comparison.percentChanges.employerCosts > 0 ? 'gestiegen' : 'gesunken';
    const percent = Math.abs(comparison.percentChanges.employerCosts * 100).toFixed(1);
    alerts.push(`Arbeitgeberkosten um ${percent}% ${direction}`);
  }

  return alerts;
}

// ============= Aggregations-Helfer =============

/**
 * Gruppiert Einträge nach Jahr und Monat
 */
export function groupEntriesByPeriod(
  entries: PayrollEntry[],
  periods: PayrollPeriod[]
): Map<string, PayrollEntry[]> {
  const periodMap = new Map<string, PayrollPeriod>();
  for (const period of periods) {
    periodMap.set(period.id, period);
  }

  const grouped = new Map<string, PayrollEntry[]>();
  
  for (const entry of entries) {
    const period = periodMap.get(entry.payrollPeriodId);
    if (!period) continue;
    
    const key = `${period.year}-${String(period.month).padStart(2, '0')}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  }

  return grouped;
}

/**
 * Berechnet Jahressummen
 */
export function calculateYearlyTotals(
  entries: PayrollEntry[],
  periods: PayrollPeriod[],
  year: number
): PayrollTotals {
  const yearPeriodIds = new Set(
    periods
      .filter(p => p.year === year)
      .map(p => p.id)
  );

  const yearEntries = entries.filter(e => yearPeriodIds.has(e.payrollPeriodId));
  return calculatePayrollTotals(yearEntries);
}
