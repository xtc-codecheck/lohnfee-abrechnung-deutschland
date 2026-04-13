/**
 * Payroll Guardian Hook – Supabase-basiert
 */
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
import { useTenant } from '@/contexts/tenant-context';
import { supabase } from '@/integrations/supabase/client';

export function usePayrollGuardian() {
  const [anomalies, setAnomalies] = useState<PayrollAnomaly[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalPayrollData[]>([]);
  const [config] = useState<AnomalyDetectionConfig>(DEFAULT_ANOMALY_CONFIG);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTenant } = useTenant();

  // Load anomalies + history from Supabase
  useEffect(() => {
    if (!currentTenant) return;

    const load = async () => {
      setIsLoading(true);
      const [anomalyRes, historyRes] = await Promise.all([
        supabase.from('payroll_guardian_anomalies').select('*').eq('tenant_id', currentTenant.id),
        supabase.from('payroll_guardian_history').select('*').eq('tenant_id', currentTenant.id),
      ]);

      if (anomalyRes.data) {
        setAnomalies(anomalyRes.data.map(row => ({
          id: row.id,
          type: row.type as PayrollAnomaly['type'],
          severity: row.severity as PayrollAnomaly['severity'],
          employeeId: row.employee_id,
          employeeName: row.employee_name,
          title: row.title,
          description: row.description,
          currentValue: Number(row.current_value),
          expectedValue: row.expected_value != null ? Number(row.expected_value) : undefined,
          deviation: row.deviation != null ? Number(row.deviation) : undefined,
          period: row.period,
          isResolved: row.is_resolved,
          resolution: row.resolution ?? undefined,
          detectedAt: new Date(row.detected_at),
        })));
      }

      if (historyRes.data) {
        setHistoricalData(historyRes.data.map(row => ({
          employeeId: row.employee_id,
          period: row.period,
          grossSalary: Number(row.gross_salary),
          netSalary: Number(row.net_salary),
          overtime: Number(row.overtime),
          bonuses: Number(row.bonuses),
          deductions: Number(row.deductions),
        })));
      }

      setIsLoading(false);
    };

    load();
  }, [currentTenant]);

  const runScan = useCallback(async (employees: Employee[], payrollEntries: PayrollEntry[]): Promise<PayrollAnomaly[]> => {
    if (!currentTenant) return [];
    setIsScanning(true);

    try {
      const detectedAnomalies = detectAnomalies(employees, payrollEntries, historicalData, config);

      // Deduplicate against existing unresolved
      const existingIds = new Set(anomalies.filter(a => !a.isResolved).map(a => a.type + a.employeeId));
      const newAnomalies = detectedAnomalies.filter(a => !existingIds.has(a.type + a.employeeId));

      if (newAnomalies.length > 0) {
        const rows = newAnomalies.map(a => ({
          tenant_id: currentTenant.id,
          type: a.type,
          severity: a.severity,
          employee_id: a.employeeId,
          employee_name: a.employeeName,
          title: a.title,
          description: a.description,
          current_value: a.currentValue,
          expected_value: a.expectedValue ?? null,
          deviation: a.deviation ?? null,
          period: a.period,
        }));

        const { data } = await supabase.from('payroll_guardian_anomalies').insert(rows).select();
        if (data) {
          const saved: PayrollAnomaly[] = data.map(row => ({
            id: row.id,
            type: row.type as PayrollAnomaly['type'],
            severity: row.severity as PayrollAnomaly['severity'],
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            title: row.title,
            description: row.description,
            currentValue: Number(row.current_value),
            expectedValue: row.expected_value != null ? Number(row.expected_value) : undefined,
            deviation: row.deviation != null ? Number(row.deviation) : undefined,
            period: row.period,
            isResolved: row.is_resolved,
            resolution: row.resolution ?? undefined,
            detectedAt: new Date(row.detected_at),
          }));
          setAnomalies(prev => [...prev, ...saved]);
        }
      }

      setLastScanAt(new Date());
      return [...anomalies.filter(a => !a.isResolved), ...newAnomalies];
    } finally {
      setIsScanning(false);
    }
  }, [currentTenant, anomalies, historicalData, config]);

  const addToHistory = useCallback(async (entry: PayrollEntry) => {
    if (!currentTenant) return;

    const period = `${new Date(entry.createdAt).getFullYear()}-${String(new Date(entry.createdAt).getMonth() + 1).padStart(2, '0')}`;
    const row = {
      tenant_id: currentTenant.id,
      employee_id: entry.employeeId,
      period,
      gross_salary: entry.salaryCalculation.grossSalary,
      net_salary: entry.salaryCalculation.netSalary,
      overtime: entry.workingData.overtimeHours,
      bonuses: entry.additions.bonuses + entry.additions.oneTimePayments,
      deductions: entry.deductions.total,
    };

    // Upsert by unique constraint
    const { data } = await supabase
      .from('payroll_guardian_history')
      .upsert(row, { onConflict: 'tenant_id,employee_id,period' })
      .select()
      .single();

    if (data) {
      setHistoricalData(prev => {
        const exists = prev.some(h => h.employeeId === data.employee_id && h.period === data.period);
        if (exists) {
          return prev.map(h => h.employeeId === data.employee_id && h.period === data.period
            ? { employeeId: data.employee_id, period: data.period, grossSalary: Number(data.gross_salary), netSalary: Number(data.net_salary), overtime: Number(data.overtime), bonuses: Number(data.bonuses), deductions: Number(data.deductions) }
            : h
          );
        }
        return [...prev, { employeeId: data.employee_id, period: data.period, grossSalary: Number(data.gross_salary), netSalary: Number(data.net_salary), overtime: Number(data.overtime), bonuses: Number(data.bonuses), deductions: Number(data.deductions) }];
      });
    }
  }, [currentTenant]);

  const resolveAnomaly = useCallback(async (anomalyId: string, resolution?: string) => {
    const { error } = await supabase
      .from('payroll_guardian_anomalies')
      .update({ is_resolved: true, resolution: resolution ?? null })
      .eq('id', anomalyId);

    if (!error) {
      setAnomalies(prev => prev.map(a => a.id === anomalyId ? { ...a, isResolved: true, resolution } : a));
    }
  }, []);

  const dismissAnomaly = useCallback(async (anomalyId: string) => {
    const { error } = await supabase.from('payroll_guardian_anomalies').delete().eq('id', anomalyId);
    if (!error) setAnomalies(prev => prev.filter(a => a.id !== anomalyId));
  }, []);

  const getForecast = useCallback((employee: Employee): SalaryForecast => {
    const empHistory = historicalData.filter(h => h.employeeId === employee.id);
    return generateSalaryForecast(employee, empHistory);
  }, [historicalData]);

  const getAllForecasts = useCallback((employees: Employee[]): SalaryForecast[] => {
    return generateBatchForecasts(employees, historicalData);
  }, [historicalData]);

  const stats: PayrollGuardianStats = useMemo(() => {
    const unresolved = anomalies.filter(a => !a.isResolved);
    const critical = unresolved.filter(a => a.severity === 'critical');
    const recent = unresolved.filter(a => new Date(a.detectedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const older = unresolved.filter(a => new Date(a.detectedAt) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return {
      totalAnomalies: anomalies.length,
      unresolvedAnomalies: unresolved.length,
      criticalAnomalies: critical.length,
      lastScanAt: lastScanAt || new Date(),
      healthScore: calculateHealthScore(anomalies),
      trendsPositive: older.length > recent.length ? older.length - recent.length : 0,
      trendsNegative: recent.length > older.length ? recent.length - older.length : 0,
    };
  }, [anomalies, lastScanAt]);

  const unresolvedAnomalies = useMemo(() => anomalies.filter(a => !a.isResolved), [anomalies]);
  const criticalAnomalies = useMemo(() => anomalies.filter(a => a.severity === 'critical' && !a.isResolved), [anomalies]);

  return {
    anomalies,
    unresolvedAnomalies,
    criticalAnomalies,
    historicalData,
    config,
    stats,
    isScanning,
    isLoading,
    lastScanAt,
    runScan,
    addToHistory,
    resolveAnomaly,
    dismissAnomaly,
    getForecast,
    getAllForecasts,
  };
}
