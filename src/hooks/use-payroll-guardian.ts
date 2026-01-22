// Hook für Payroll Guardian Funktionalitäten

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { PayrollEntry } from '@/types/payroll';
import { 
  PayrollAnomaly, 
  PayrollGuardianStats, 
  AnomalyDetectionConfig,
  DEFAULT_ANOMALY_CONFIG,
  HistoricalPayrollData,
  SalaryForecast
} from '@/types/payroll-guardian';
import { detectAnomalies, calculateHealthScore } from '@/utils/anomaly-detection';
import { generateSalaryForecast, generateBatchForecasts } from '@/utils/salary-forecast';

const STORAGE_KEY_ANOMALIES = 'payroll-guardian-anomalies';
const STORAGE_KEY_HISTORY = 'payroll-guardian-history';
const STORAGE_KEY_CONFIG = 'payroll-guardian-config';

export function usePayrollGuardian() {
  const [anomalies, setAnomalies] = useState<PayrollAnomaly[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalPayrollData[]>([]);
  const [config, setConfig] = useState<AnomalyDetectionConfig>(DEFAULT_ANOMALY_CONFIG);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Lade gespeicherte Daten
  useEffect(() => {
    try {
      const savedAnomalies = localStorage.getItem(STORAGE_KEY_ANOMALIES);
      if (savedAnomalies) {
        const parsed = JSON.parse(savedAnomalies);
        setAnomalies(parsed.map((a: any) => ({
          ...a,
          detectedAt: new Date(a.detectedAt)
        })));
      }

      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        setHistoricalData(JSON.parse(savedHistory));
      }

      const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Guardian-Daten:', error);
    }
  }, []);

  // Speichere Anomalien
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ANOMALIES, JSON.stringify(anomalies));
  }, [anomalies]);

  // Speichere historische Daten
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(historicalData));
  }, [historicalData]);

  // Speichere Konfiguration
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  /**
   * Führt einen vollständigen Scan durch
   */
  const runScan = useCallback((
    employees: Employee[],
    payrollEntries: PayrollEntry[]
  ): PayrollAnomaly[] => {
    setIsScanning(true);
    
    try {
      // Führe Anomalie-Erkennung durch
      const detectedAnomalies = detectAnomalies(
        employees,
        payrollEntries,
        historicalData,
        config
      );

      // Merge mit bestehenden ungelösten Anomalien (vermeide Duplikate)
      const existingUnresolved = anomalies.filter(a => !a.isResolved);
      const existingIds = new Set(existingUnresolved.map(a => a.type + a.employeeId));
      
      const newAnomalies = detectedAnomalies.filter(
        a => !existingIds.has(a.type + a.employeeId)
      );

      const allAnomalies = [...existingUnresolved, ...newAnomalies];
      setAnomalies(allAnomalies);
      setLastScanAt(new Date());

      return allAnomalies;
    } finally {
      setIsScanning(false);
    }
  }, [anomalies, historicalData, config]);

  /**
   * Fügt einen Payroll-Eintrag zur Historie hinzu
   */
  const addToHistory = useCallback((entry: PayrollEntry) => {
    const historyEntry: HistoricalPayrollData = {
      employeeId: entry.employeeId,
      period: `${new Date(entry.createdAt).getFullYear()}-${String(new Date(entry.createdAt).getMonth() + 1).padStart(2, '0')}`,
      grossSalary: entry.salaryCalculation.grossSalary,
      netSalary: entry.salaryCalculation.netSalary,
      overtime: entry.workingData.overtimeHours,
      bonuses: entry.additions.bonuses + entry.additions.oneTimePayments,
      deductions: entry.deductions.total
    };

    setHistoricalData(prev => {
      // Verhindere Duplikate für dieselbe Periode
      const exists = prev.some(
        h => h.employeeId === historyEntry.employeeId && h.period === historyEntry.period
      );
      if (exists) {
        return prev.map(h => 
          h.employeeId === historyEntry.employeeId && h.period === historyEntry.period
            ? historyEntry
            : h
        );
      }
      return [...prev, historyEntry];
    });
  }, []);

  /**
   * Löst eine Anomalie
   */
  const resolveAnomaly = useCallback((anomalyId: string, resolution?: string) => {
    setAnomalies(prev => 
      prev.map(a => 
        a.id === anomalyId 
          ? { ...a, isResolved: true, resolution } 
          : a
      )
    );
  }, []);

  /**
   * Löscht eine Anomalie
   */
  const dismissAnomaly = useCallback((anomalyId: string) => {
    setAnomalies(prev => prev.filter(a => a.id !== anomalyId));
  }, []);

  /**
   * Aktualisiert die Konfiguration
   */
  const updateConfig = useCallback((newConfig: Partial<AnomalyDetectionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Generiert Gehaltsprognose für einen Mitarbeiter
   */
  const getForecast = useCallback((employee: Employee): SalaryForecast => {
    const employeeHistory = historicalData.filter(h => h.employeeId === employee.id);
    return generateSalaryForecast(employee, employeeHistory);
  }, [historicalData]);

  /**
   * Generiert Batch-Prognosen für alle Mitarbeiter
   */
  const getAllForecasts = useCallback((employees: Employee[]): SalaryForecast[] => {
    return generateBatchForecasts(employees, historicalData);
  }, [historicalData]);

  // Berechnete Statistiken
  const stats: PayrollGuardianStats = useMemo(() => {
    const unresolvedAnomalies = anomalies.filter(a => !a.isResolved);
    const criticalAnomalies = unresolvedAnomalies.filter(a => a.severity === 'critical');
    
    // Trend-Analyse (positiv = weniger Anomalien im Vergleich zu früher)
    const recentAnomalies = unresolvedAnomalies.filter(
      a => new Date(a.detectedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const olderAnomalies = unresolvedAnomalies.filter(
      a => new Date(a.detectedAt) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    return {
      totalAnomalies: anomalies.length,
      unresolvedAnomalies: unresolvedAnomalies.length,
      criticalAnomalies: criticalAnomalies.length,
      lastScanAt: lastScanAt || new Date(),
      healthScore: calculateHealthScore(anomalies),
      trendsPositive: olderAnomalies.length > recentAnomalies.length ? 
        olderAnomalies.length - recentAnomalies.length : 0,
      trendsNegative: recentAnomalies.length > olderAnomalies.length ?
        recentAnomalies.length - olderAnomalies.length : 0
    };
  }, [anomalies, lastScanAt]);

  // Gefilterte Listen
  const unresolvedAnomalies = useMemo(
    () => anomalies.filter(a => !a.isResolved),
    [anomalies]
  );

  const criticalAnomalies = useMemo(
    () => anomalies.filter(a => a.severity === 'critical' && !a.isResolved),
    [anomalies]
  );

  return {
    // State
    anomalies,
    unresolvedAnomalies,
    criticalAnomalies,
    historicalData,
    config,
    stats,
    isScanning,
    lastScanAt,
    
    // Actions
    runScan,
    addToHistory,
    resolveAnomaly,
    dismissAnomaly,
    updateConfig,
    getForecast,
    getAllForecasts
  };
}
