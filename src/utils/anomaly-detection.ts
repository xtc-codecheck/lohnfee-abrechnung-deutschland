// Regelbasierte Anomalie-Erkennung für Payroll Guardian

import { Employee } from '@/types/employee';
import { PayrollEntry } from '@/types/payroll';
import { 
  PayrollAnomaly, 
  AnomalyType, 
  AnomalyDetectionConfig, 
  DEFAULT_ANOMALY_CONFIG,
  HistoricalPayrollData 
} from '@/types/payroll-guardian';
import { MINIMUM_WAGES } from '@/types/compliance';

/**
 * Hauptfunktion zur Anomalie-Erkennung
 */
export function detectAnomalies(
  employees: Employee[],
  currentEntries: PayrollEntry[],
  historicalData: HistoricalPayrollData[],
  config: AnomalyDetectionConfig = DEFAULT_ANOMALY_CONFIG
): PayrollAnomaly[] {
  const anomalies: PayrollAnomaly[] = [];

  employees.forEach(employee => {
    const employeeCurrentEntry = currentEntries.find(e => e.employeeId === employee.id);
    const employeeHistory = historicalData.filter(h => h.employeeId === employee.id);
    
    if (config.enabledChecks.includes('salary-spike')) {
      const spikeAnomaly = detectSalarySpike(employee, employeeCurrentEntry, employeeHistory, config);
      if (spikeAnomaly) anomalies.push(spikeAnomaly);
    }

    if (config.enabledChecks.includes('salary-drop')) {
      const dropAnomaly = detectSalaryDrop(employee, employeeCurrentEntry, employeeHistory, config);
      if (dropAnomaly) anomalies.push(dropAnomaly);
    }

    if (config.enabledChecks.includes('overtime-excessive')) {
      const overtimeAnomaly = detectExcessiveOvertime(employee, employeeCurrentEntry, config);
      if (overtimeAnomaly) anomalies.push(overtimeAnomaly);
    }

    if (config.enabledChecks.includes('bonus-unusual')) {
      const bonusAnomaly = detectUnusualBonus(employee, employeeCurrentEntry, employeeHistory, config);
      if (bonusAnomaly) anomalies.push(bonusAnomaly);
    }

    if (config.enabledChecks.includes('minimum-wage-violation')) {
      const minWageAnomaly = detectMinimumWageViolation(employee);
      if (minWageAnomaly) anomalies.push(minWageAnomaly);
    }

    if (config.enabledChecks.includes('working-time-violation')) {
      const workingTimeAnomaly = detectWorkingTimeViolation(employee, employeeCurrentEntry);
      if (workingTimeAnomaly) anomalies.push(workingTimeAnomaly);
    }

    if (config.enabledChecks.includes('tax-discrepancy')) {
      const taxAnomaly = detectTaxDiscrepancy(employee, employeeCurrentEntry);
      if (taxAnomaly) anomalies.push(taxAnomaly);
    }

    if (config.enabledChecks.includes('pattern-break')) {
      const patternAnomaly = detectPatternBreak(employee, employeeCurrentEntry, employeeHistory, config);
      if (patternAnomaly) anomalies.push(patternAnomaly);
    }
  });

  // Prüfe auf fehlende Einträge
  if (config.enabledChecks.includes('missing-entry')) {
    const missingAnomalies = detectMissingEntries(employees, currentEntries);
    anomalies.push(...missingAnomalies);
  }

  // Prüfe auf doppelte Einträge
  if (config.enabledChecks.includes('duplicate-entry')) {
    const duplicateAnomalies = detectDuplicateEntries(currentEntries);
    anomalies.push(...duplicateAnomalies);
  }

  return anomalies.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Erkennt plötzliche Gehaltsanstiege
 */
function detectSalarySpike(
  employee: Employee,
  currentEntry: PayrollEntry | undefined,
  history: HistoricalPayrollData[],
  config: AnomalyDetectionConfig
): PayrollAnomaly | null {
  if (!currentEntry || history.length < config.minimumDataPoints) return null;

  const avgHistoricalSalary = history.reduce((sum, h) => sum + h.grossSalary, 0) / history.length;
  const currentSalary = currentEntry.salaryCalculation.grossSalary;
  const deviation = (currentSalary - avgHistoricalSalary) / avgHistoricalSalary;

  if (deviation > config.salaryDeviationThreshold) {
    return {
      id: `anomaly-spike-${employee.id}-${Date.now()}`,
      type: 'salary-spike',
      severity: deviation > 0.3 ? 'high' : 'medium',
      employeeId: employee.id,
      employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
      title: 'Ungewöhnlicher Gehaltsanstieg',
      description: `Das Bruttogehalt ist um ${(deviation * 100).toFixed(1)}% gegenüber dem Durchschnitt gestiegen.`,
      currentValue: currentSalary,
      expectedValue: avgHistoricalSalary,
      deviation: deviation * 100,
      detectedAt: new Date(),
      period: new Date().toISOString().slice(0, 7),
      isResolved: false
    };
  }

  return null;
}

/**
 * Erkennt plötzliche Gehaltsrückgänge
 */
function detectSalaryDrop(
  employee: Employee,
  currentEntry: PayrollEntry | undefined,
  history: HistoricalPayrollData[],
  config: AnomalyDetectionConfig
): PayrollAnomaly | null {
  if (!currentEntry || history.length < config.minimumDataPoints) return null;

  const avgHistoricalSalary = history.reduce((sum, h) => sum + h.grossSalary, 0) / history.length;
  const currentSalary = currentEntry.salaryCalculation.grossSalary;
  const deviation = (avgHistoricalSalary - currentSalary) / avgHistoricalSalary;

  if (deviation > config.salaryDeviationThreshold) {
    return {
      id: `anomaly-drop-${employee.id}-${Date.now()}`,
      type: 'salary-drop',
      severity: deviation > 0.3 ? 'critical' : 'high',
      employeeId: employee.id,
      employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
      title: 'Ungewöhnlicher Gehaltsrückgang',
      description: `Das Bruttogehalt ist um ${(deviation * 100).toFixed(1)}% gegenüber dem Durchschnitt gefallen.`,
      currentValue: currentSalary,
      expectedValue: avgHistoricalSalary,
      deviation: -deviation * 100,
      detectedAt: new Date(),
      period: new Date().toISOString().slice(0, 7),
      isResolved: false
    };
  }

  return null;
}

/**
 * Erkennt übermäßige Überstunden
 */
function detectExcessiveOvertime(
  employee: Employee,
  currentEntry: PayrollEntry | undefined,
  config: AnomalyDetectionConfig
): PayrollAnomaly | null {
  if (!currentEntry) return null;

  const overtimeHours = currentEntry.workingData.overtimeHours;

  if (overtimeHours > config.overtimeThreshold) {
    const severity = overtimeHours > config.overtimeThreshold * 2 ? 'critical' : 
                    overtimeHours > config.overtimeThreshold * 1.5 ? 'high' : 'medium';

    return {
      id: `anomaly-overtime-${employee.id}-${Date.now()}`,
      type: 'overtime-excessive',
      severity,
      employeeId: employee.id,
      employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
      title: 'Übermäßige Überstunden',
      description: `${overtimeHours} Überstunden in diesem Monat (Schwellenwert: ${config.overtimeThreshold}h)`,
      currentValue: overtimeHours,
      expectedValue: config.overtimeThreshold,
      deviation: ((overtimeHours - config.overtimeThreshold) / config.overtimeThreshold) * 100,
      detectedAt: new Date(),
      period: new Date().toISOString().slice(0, 7),
      isResolved: false
    };
  }

  return null;
}

/**
 * Erkennt ungewöhnliche Bonuszahlungen
 */
function detectUnusualBonus(
  employee: Employee,
  currentEntry: PayrollEntry | undefined,
  history: HistoricalPayrollData[],
  config: AnomalyDetectionConfig
): PayrollAnomaly | null {
  if (!currentEntry) return null;

  const currentBonus = currentEntry.additions.bonuses + currentEntry.additions.oneTimePayments;
  
  if (currentBonus > config.bonusThreshold) {
    const avgHistoricalBonus = history.length > 0 
      ? history.reduce((sum, h) => sum + h.bonuses, 0) / history.length 
      : 0;

    const isUnusual = avgHistoricalBonus === 0 || currentBonus > avgHistoricalBonus * 3;

    if (isUnusual) {
      return {
        id: `anomaly-bonus-${employee.id}-${Date.now()}`,
        type: 'bonus-unusual',
        severity: currentBonus > config.bonusThreshold * 2 ? 'high' : 'medium',
        employeeId: employee.id,
        employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
        title: 'Ungewöhnliche Bonuszahlung',
        description: `Bonus von ${currentBonus.toFixed(2)}€ liegt deutlich über dem Durchschnitt (${avgHistoricalBonus.toFixed(2)}€)`,
        currentValue: currentBonus,
        expectedValue: avgHistoricalBonus,
        detectedAt: new Date(),
        period: new Date().toISOString().slice(0, 7),
        isResolved: false
      };
    }
  }

  return null;
}

/**
 * Erkennt Mindestlohn-Unterschreitungen
 */
function detectMinimumWageViolation(employee: Employee): PayrollAnomaly | null {
  const currentYear = new Date().getFullYear();
  const minimumWage = MINIMUM_WAGES[currentYear as keyof typeof MINIMUM_WAGES] || MINIMUM_WAGES[2025];
  
  const monthlyHours = employee.employmentData.weeklyHours * 4.33;
  const hourlyWage = employee.salaryData.hourlyWage || 
                     (monthlyHours > 0 ? employee.salaryData.grossSalary / monthlyHours : 0);

  if (hourlyWage > 0 && hourlyWage < minimumWage) {
    return {
      id: `anomaly-minwage-${employee.id}-${Date.now()}`,
      type: 'minimum-wage-violation',
      severity: 'critical',
      employeeId: employee.id,
      employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
      title: 'Mindestlohn-Unterschreitung',
      description: `Effektiver Stundenlohn (${hourlyWage.toFixed(2)}€) liegt unter dem Mindestlohn (${minimumWage}€)`,
      currentValue: hourlyWage,
      expectedValue: minimumWage,
      deviation: ((minimumWage - hourlyWage) / minimumWage) * 100,
      detectedAt: new Date(),
      period: new Date().toISOString().slice(0, 7),
      isResolved: false
    };
  }

  return null;
}

/**
 * Erkennt Arbeitszeitverletzungen
 */
function detectWorkingTimeViolation(
  employee: Employee,
  currentEntry: PayrollEntry | undefined
): PayrollAnomaly | null {
  if (!currentEntry) return null;

  const totalHours = currentEntry.workingData.regularHours + currentEntry.workingData.overtimeHours;
  const workingDays = currentEntry.workingData.actualWorkingDays;
  const avgDailyHours = workingDays > 0 ? totalHours / workingDays : 0;

  // Mehr als 10 Stunden pro Tag im Schnitt
  if (avgDailyHours > 10) {
    return {
      id: `anomaly-worktime-${employee.id}-${Date.now()}`,
      type: 'working-time-violation',
      severity: avgDailyHours > 12 ? 'critical' : 'high',
      employeeId: employee.id,
      employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
      title: 'Arbeitszeitgesetz-Verstoß',
      description: `Durchschnittliche Tagesarbeitszeit von ${avgDailyHours.toFixed(1)}h überschreitet gesetzliches Maximum (10h)`,
      currentValue: avgDailyHours,
      expectedValue: 10,
      deviation: ((avgDailyHours - 10) / 10) * 100,
      detectedAt: new Date(),
      period: new Date().toISOString().slice(0, 7),
      isResolved: false
    };
  }

  return null;
}

/**
 * Erkennt Steuer-Diskrepanzen
 */
function detectTaxDiscrepancy(
  employee: Employee,
  currentEntry: PayrollEntry | undefined
): PayrollAnomaly | null {
  if (!currentEntry) return null;

  const gross = currentEntry.salaryCalculation.grossSalary;
  const taxTotal = currentEntry.salaryCalculation.taxes.total;
  const effectiveTaxRate = gross > 0 ? (taxTotal / gross) * 100 : 0;

  // Sehr niedrige oder sehr hohe Steuerquote könnte auf Fehler hinweisen
  // Bei Steuerklasse 1 und Einkommen über 4000€ sollte die Quote mindestens ~15% sein
  if (gross > 4000 && effectiveTaxRate < 5) {
    return {
      id: `anomaly-tax-${employee.id}-${Date.now()}`,
      type: 'tax-discrepancy',
      severity: 'high',
      employeeId: employee.id,
      employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
      title: 'Ungewöhnlich niedrige Steuerbelastung',
      description: `Effektive Steuerquote von ${effectiveTaxRate.toFixed(1)}% bei ${gross.toFixed(2)}€ Brutto erscheint ungewöhnlich niedrig`,
      currentValue: effectiveTaxRate,
      expectedValue: 15,
      detectedAt: new Date(),
      period: new Date().toISOString().slice(0, 7),
      isResolved: false
    };
  }

  return null;
}

/**
 * Erkennt Musterbrüche basierend auf historischen Daten
 */
function detectPatternBreak(
  employee: Employee,
  currentEntry: PayrollEntry | undefined,
  history: HistoricalPayrollData[],
  config: AnomalyDetectionConfig
): PayrollAnomaly | null {
  if (!currentEntry || history.length < config.minimumDataPoints) return null;

  // Berechne Standardabweichung der historischen Gehälter
  const salaries = history.map(h => h.grossSalary);
  const mean = salaries.reduce((sum, s) => sum + s, 0) / salaries.length;
  const variance = salaries.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / salaries.length;
  const stdDev = Math.sqrt(variance);

  const currentSalary = currentEntry.salaryCalculation.grossSalary;
  const zScore = stdDev > 0 ? (currentSalary - mean) / stdDev : 0;

  // Z-Score > 2 oder < -2 bedeutet signifikante Abweichung
  if (Math.abs(zScore) > 2) {
    return {
      id: `anomaly-pattern-${employee.id}-${Date.now()}`,
      type: 'pattern-break',
      severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
      employeeId: employee.id,
      employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
      title: 'Abweichung vom Gehaltsmuster',
      description: `Statistisch signifikante Abweichung vom historischen Muster (Z-Score: ${zScore.toFixed(2)})`,
      currentValue: currentSalary,
      expectedValue: mean,
      deviation: zScore * 100,
      detectedAt: new Date(),
      period: new Date().toISOString().slice(0, 7),
      isResolved: false
    };
  }

  return null;
}

/**
 * Erkennt fehlende Lohnabrechnungen
 */
function detectMissingEntries(
  employees: Employee[],
  currentEntries: PayrollEntry[]
): PayrollAnomaly[] {
  const anomalies: PayrollAnomaly[] = [];
  const entryEmployeeIds = new Set(currentEntries.map(e => e.employeeId));

  employees.forEach(employee => {
    // Nur aktive Mitarbeiter prüfen
    const isActive = !employee.employmentData.endDate || 
                     new Date(employee.employmentData.endDate) > new Date();

    if (isActive && !entryEmployeeIds.has(employee.id)) {
      anomalies.push({
        id: `anomaly-missing-${employee.id}-${Date.now()}`,
        type: 'missing-entry',
        severity: 'high',
        employeeId: employee.id,
        employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
        title: 'Fehlende Lohnabrechnung',
        description: `Für diesen aktiven Mitarbeiter wurde noch keine Lohnabrechnung erstellt`,
        currentValue: 0,
        detectedAt: new Date(),
        period: new Date().toISOString().slice(0, 7),
        isResolved: false
      });
    }
  });

  return anomalies;
}

/**
 * Erkennt doppelte Lohnabrechnungen
 */
function detectDuplicateEntries(currentEntries: PayrollEntry[]): PayrollAnomaly[] {
  const anomalies: PayrollAnomaly[] = [];
  const employeeEntryCount = new Map<string, PayrollEntry[]>();

  currentEntries.forEach(entry => {
    const existing = employeeEntryCount.get(entry.employeeId) || [];
    existing.push(entry);
    employeeEntryCount.set(entry.employeeId, existing);
  });

  employeeEntryCount.forEach((entries, employeeId) => {
    if (entries.length > 1) {
      const employee = entries[0].employee;
      anomalies.push({
        id: `anomaly-duplicate-${employeeId}-${Date.now()}`,
        type: 'duplicate-entry',
        severity: 'critical',
        employeeId,
        employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
        title: 'Doppelte Lohnabrechnung',
        description: `Es existieren ${entries.length} Lohnabrechnungen für denselben Zeitraum`,
        currentValue: entries.length,
        expectedValue: 1,
        detectedAt: new Date(),
        period: new Date().toISOString().slice(0, 7),
        isResolved: false
      });
    }
  });

  return anomalies;
}

/**
 * Berechnet den Gesundheitsscore basierend auf Anomalien
 */
export function calculateHealthScore(anomalies: PayrollAnomaly[]): number {
  if (anomalies.length === 0) return 100;

  const unresolvedAnomalies = anomalies.filter(a => !a.isResolved);
  
  const penaltyPoints = unresolvedAnomalies.reduce((sum, anomaly) => {
    switch (anomaly.severity) {
      case 'critical': return sum + 25;
      case 'high': return sum + 15;
      case 'medium': return sum + 8;
      case 'low': return sum + 3;
      default: return sum;
    }
  }, 0);

  return Math.max(0, 100 - penaltyPoints);
}
