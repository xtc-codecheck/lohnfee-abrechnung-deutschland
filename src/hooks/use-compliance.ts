/**
 * Compliance Hook – Supabase-basiert für Alerts, Berechnungslogik bleibt client-seitig
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { PayrollEntry } from '@/types/payroll';
import { ComplianceCheck, ComplianceAlert, ComplianceReport, MINIMUM_WAGES } from '@/types/compliance';
import { BBG_2025_MONTHLY } from '@/constants/social-security';
import { useTenant } from '@/contexts/tenant-context';
import { supabase } from '@/integrations/supabase/client';

export function useCompliance() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTenant } = useTenant();

  // Load alerts from Supabase
  useEffect(() => {
    if (!currentTenant) return;

    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading compliance alerts:', error);
      } else if (data) {
        setAlerts(data.map(row => ({
          id: row.id,
          type: row.type as ComplianceAlert['type'],
          title: row.title,
          message: row.message,
          severity: row.severity as ComplianceAlert['severity'],
          employeeId: row.employee_id ?? undefined,
          isRead: row.is_read,
          isResolved: row.is_resolved,
          createdAt: new Date(row.created_at),
          dueDate: row.due_date ? new Date(row.due_date) : undefined,
        })));
      }
      setIsLoading(false);
    };

    load();
  }, [currentTenant]);

  // Compliance-Regeln (reine Berechnung, kein Storage nötig)
  const complianceRules = useMemo(() => [
    {
      id: 'minimum-wage-2025',
      type: 'minimum-wage' as const,
      title: 'Mindestlohn 2025',
      description: 'Überprüfung der Einhaltung des aktuellen Mindestlohns',
      severity: 'critical' as const,
      isActive: true,
      checkFunction: (employee: Employee) => {
        const currentMinWage = MINIMUM_WAGES[2025];
        const hourlyWage = employee.salaryData.hourlyWage || (employee.salaryData.grossSalary / (employee.employmentData.weeklyHours * 4.33));
        if (hourlyWage < currentMinWage) {
          return { status: 'failed' as const, message: `Stundenlohn (${hourlyWage.toFixed(2)}€) unterschreitet Mindestlohn (${currentMinWage}€)` };
        }
        return { status: 'passed' as const, message: `Mindestlohn wird eingehalten (${hourlyWage.toFixed(2)}€)` };
      }
    },
    {
      id: 'social-security-limits',
      type: 'social-security' as const,
      title: 'Sozialversicherungsgrenzen',
      description: 'Überprüfung der Beitragsbemessungsgrenzen',
      severity: 'medium' as const,
      isActive: true,
      checkFunction: (employee: Employee) => {
        const monthlyGross = employee.salaryData.grossSalary;
        const bbgRent = BBG_2025_MONTHLY.pensionWest;
        const bbgHealth = BBG_2025_MONTHLY.healthCare;
        const warnings: string[] = [];
        if (monthlyGross > bbgRent) warnings.push(`Gehalt überschreitet BBG Rente/ALV (${bbgRent}€)`);
        if (monthlyGross > bbgHealth) warnings.push(`Gehalt überschreitet BBG Kranken-/Pflegeversicherung (${bbgHealth}€)`);
        if (warnings.length > 0) return { status: 'warning' as const, message: warnings.join('; ') };
        return { status: 'passed' as const, message: 'Alle Beitragsbemessungsgrenzen werden beachtet' };
      }
    },
    {
      id: 'employee-data-complete',
      type: 'contract' as const,
      title: 'Mitarbeiterdaten vollständig',
      description: 'Überprüfung der Vollständigkeit der Mitarbeiterdaten',
      severity: 'high' as const,
      isActive: true,
      checkFunction: (employee: Employee) => {
        const requiredFields = [
          { field: employee.personalData.firstName, name: 'Vorname' },
          { field: employee.personalData.lastName, name: 'Nachname' },
          { field: employee.personalData.taxId, name: 'Steuer-ID' },
          { field: employee.personalData.socialSecurityNumber, name: 'Sozialversicherungsnummer' },
          { field: employee.employmentData.department, name: 'Abteilung' },
          { field: employee.employmentData.position, name: 'Position' }
        ];
        const missingFields = requiredFields.filter(item => !item.field || item.field.toString().trim() === '').map(item => item.name);
        if (missingFields.length > 0) return { status: 'failed' as const, message: `Fehlende Pflichtfelder: ${missingFields.join(', ')}` };
        return { status: 'passed' as const, message: 'Alle Pflichtfelder sind ausgefüllt' };
      }
    },
    {
      id: 'contract-signed',
      type: 'contract' as const,
      title: 'Arbeitsvertrag unterschrieben',
      description: 'Arbeitsvertrag muss unterschrieben zurückerhalten worden sein',
      severity: 'high' as const,
      isActive: true,
      checkFunction: (employee: Employee) => {
        if (!employee.employmentData.contractSigned) {
          return { status: 'failed' as const, message: 'Arbeitsvertrag noch nicht unterschrieben zurückerhalten' };
        }
        return { status: 'passed' as const, message: 'Arbeitsvertrag ordnungsgemäß unterschrieben' };
      }
    },
    {
      id: 'data-retention',
      type: 'data-retention' as const,
      title: 'Aufbewahrungsfristen',
      description: 'Überprüfung der Aufbewahrungsfristen für Personaldaten',
      severity: 'medium' as const,
      isActive: true,
      checkFunction: (employee: Employee) => {
        const today = new Date();
        const retentionDate = new Date(employee.employmentData.dataRetentionDate);
        const daysUntilDeletion = Math.ceil((retentionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeletion < 0) return { status: 'warning' as const, message: 'Aufbewahrungsfrist abgelaufen. Daten können gelöscht werden.' };
        if (daysUntilDeletion < 365) return { status: 'warning' as const, message: `Aufbewahrungsfrist läuft in ${daysUntilDeletion} Tagen ab` };
        return { status: 'passed' as const, message: `Aufbewahrungsfrist läuft am ${retentionDate.toLocaleDateString('de-DE')} ab` };
      }
    }
  ], []);

  const runEmployeeCompliance = useCallback((employees: Employee[]): ComplianceCheck[] => {
    const checks: ComplianceCheck[] = [];
    employees.forEach(employee => {
      complianceRules.forEach(rule => {
        if (!rule.isActive) return;
        try {
          const result = rule.checkFunction(employee);
          checks.push({
            id: `${rule.id}-${employee.id}-${Date.now()}`,
            type: rule.type,
            title: rule.title,
            description: rule.description,
            status: result.status,
            severity: result.status === 'failed' ? rule.severity : result.status === 'warning' ? 'medium' : 'low',
            message: result.message,
            employeeId: employee.id,
            checkDate: new Date()
          });
        } catch (error) {
          checks.push({
            id: `${rule.id}-${employee.id}-error-${Date.now()}`,
            type: rule.type,
            title: rule.title,
            description: rule.description,
            status: 'failed',
            severity: 'high',
            message: `Fehler bei der Compliance-Prüfung: ${error}`,
            employeeId: employee.id,
            checkDate: new Date()
          });
        }
      });
    });
    return checks;
  }, [complianceRules]);

  const runPayrollCompliance = useCallback((payrollEntries: PayrollEntry[]): ComplianceCheck[] => {
    // Simplified: no placeholder `if (true)` anymore
    return [];
  }, []);

  const generateComplianceReport = useCallback((employees: Employee[], payrollEntries: PayrollEntry[]): ComplianceReport => {
    const employeeChecks = runEmployeeCompliance(employees);
    const payrollChecks = runPayrollCompliance(payrollEntries);
    const allChecks = [...employeeChecks, ...payrollChecks];
    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      period: { from: new Date(new Date().getFullYear(), 0, 1), to: new Date() },
      checks: allChecks,
      summary: {
        totalChecks: allChecks.length,
        passed: allChecks.filter(c => c.status === 'passed').length,
        warnings: allChecks.filter(c => c.status === 'warning').length,
        failed: allChecks.filter(c => c.status === 'failed').length,
        critical: allChecks.filter(c => c.severity === 'critical').length
      }
    };
  }, [runEmployeeCompliance, runPayrollCompliance]);

  const saveComplianceReport = useCallback(async (employees: Employee[], payrollEntries: PayrollEntry[]) => {
    const report = generateComplianceReport(employees, payrollEntries);

    // Save critical alerts to Supabase
    if (currentTenant) {
      const criticalChecks = report.checks.filter(c => c.severity === 'critical' && c.status === 'failed');
      if (criticalChecks.length > 0) {
        const rows = criticalChecks.map(check => ({
          tenant_id: currentTenant.id,
          type: check.type,
          title: check.title,
          message: check.message,
          severity: check.severity,
          employee_id: check.employeeId ?? null,
          due_date: check.dueDate ? check.dueDate.toISOString().split('T')[0] : null,
        }));

        const { data, error } = await supabase
          .from('compliance_alerts')
          .insert(rows)
          .select();

        if (!error && data) {
          const newAlerts: ComplianceAlert[] = data.map(row => ({
            id: row.id,
            type: row.type as ComplianceAlert['type'],
            title: row.title,
            message: row.message,
            severity: row.severity as ComplianceAlert['severity'],
            employeeId: row.employee_id ?? undefined,
            isRead: row.is_read,
            isResolved: row.is_resolved,
            createdAt: new Date(row.created_at),
            dueDate: row.due_date ? new Date(row.due_date) : undefined,
          }));
          setAlerts(prev => [...newAlerts, ...prev]);
        }
      }
    }

    setReports(prev => [report, ...prev.slice(0, 9)]);
    return report;
  }, [currentTenant, generateComplianceReport]);

  const markAlertAsRead = useCallback(async (alertId: string) => {
    const { error } = await supabase.from('compliance_alerts').update({ is_read: true }).eq('id', alertId);
    if (!error) setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  }, []);

  const resolveAlert = useCallback(async (alertId: string) => {
    const { error } = await supabase.from('compliance_alerts').update({ is_read: true, is_resolved: true }).eq('id', alertId);
    if (!error) setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isResolved: true, isRead: true } : a));
  }, []);

  const activeAlerts = alerts.filter(a => !a.isResolved);
  const unreadAlerts = alerts.filter(a => !a.isRead && !a.isResolved);

  return {
    complianceRules,
    alerts,
    reports,
    activeAlerts,
    unreadAlerts,
    isLoading,
    runEmployeeCompliance,
    runPayrollCompliance,
    generateComplianceReport,
    saveComplianceReport,
    markAlertAsRead,
    resolveAlert
  };
}
