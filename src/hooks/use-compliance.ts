import { useState, useEffect, useMemo } from 'react';
import { Employee } from '@/types/employee';
import { PayrollEntry } from '@/types/payroll';
import { ComplianceCheck, ComplianceAlert, ComplianceReport, MINIMUM_WAGES } from '@/types/compliance';
import { BBG_2025_MONTHLY } from '@/constants/social-security';

export function useCompliance() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);

  // Lade Alerts und Reports aus localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem('compliance-alerts');
    const savedReports = localStorage.getItem('compliance-reports');
    
    if (savedAlerts) {
      try {
        const parsed = JSON.parse(savedAlerts);
        setAlerts(parsed.map((alert: any) => ({
          ...alert,
          createdAt: new Date(alert.createdAt),
          dueDate: alert.dueDate ? new Date(alert.dueDate) : undefined
        })));
      } catch (error) {
        console.error('Fehler beim Laden der Compliance-Alerts:', error);
      }
    }

    if (savedReports) {
      try {
        const parsed = JSON.parse(savedReports);
        setReports(parsed.map((report: any) => ({
          ...report,
          generatedAt: new Date(report.generatedAt),
          period: {
            from: new Date(report.period.from),
            to: new Date(report.period.to)
          },
          checks: report.checks.map((check: any) => ({
            ...check,
            checkDate: new Date(check.checkDate),
            dueDate: check.dueDate ? new Date(check.dueDate) : undefined
          }))
        })));
      } catch (error) {
        console.error('Fehler beim Laden der Compliance-Reports:', error);
      }
    }
  }, []);

  // Speichere Alerts und Reports in localStorage
  useEffect(() => {
    localStorage.setItem('compliance-alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('compliance-reports', JSON.stringify(reports));
  }, [reports]);

  // Compliance-Regeln definieren
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
          return {
            status: 'failed' as const,
            message: `Stundenlohn (${hourlyWage.toFixed(2)}€) unterschreitet Mindestlohn (${currentMinWage}€)`
          };
        }
        
        return {
          status: 'passed' as const,
          message: `Mindestlohn wird eingehalten (${hourlyWage.toFixed(2)}€)`
        };
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
        const bbgRent = BBG_2025_MONTHLY.pensionWest; // BBG Rente/ALV 2025 West
        const bbgHealth = BBG_2025_MONTHLY.healthCare; // BBG KV/PV 2025
        
        let warnings = [];
        
        if (monthlyGross > bbgRent) {
          warnings.push(`Gehalt überschreitet BBG Rente/ALV (${bbgRent}€)`);
        }
        
        if (monthlyGross > bbgHealth) {
          warnings.push(`Gehalt überschreitet BBG Kranken-/Pflegeversicherung (${bbgHealth}€)`);
        }
        
        if (warnings.length > 0) {
          return {
            status: 'warning' as const,
            message: warnings.join('; ')
          };
        }
        
        return {
          status: 'passed' as const,
          message: 'Alle Beitragsbemessungsgrenzen werden beachtet'
        };
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
        
        const missingFields = requiredFields
          .filter(item => !item.field || item.field.toString().trim() === '')
          .map(item => item.name);
        
        if (missingFields.length > 0) {
          return {
            status: 'failed' as const,
            message: `Fehlende Pflichtfelder: ${missingFields.join(', ')}`
          };
        }
        
        return {
          status: 'passed' as const,
          message: 'Alle Pflichtfelder sind ausgefüllt'
        };
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
          return {
            status: 'failed' as const,
            message: 'Arbeitsvertrag noch nicht unterschrieben zurückerhalten'
          };
        }
        
        return {
          status: 'passed' as const,
          message: 'Arbeitsvertrag ordnungsgemäß unterschrieben'
        };
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
        
        if (daysUntilDeletion < 0) {
          return {
            status: 'warning' as const,
            message: `Aufbewahrungsfrist abgelaufen. Daten können gelöscht werden.`
          };
        } else if (daysUntilDeletion < 365) {
          return {
            status: 'warning' as const,
            message: `Aufbewahrungsfrist läuft in ${daysUntilDeletion} Tagen ab`
          };
        }
        
        return {
          status: 'passed' as const,
          message: `Aufbewahrungsfrist läuft am ${retentionDate.toLocaleDateString('de-DE')} ab`
        };
      }
    }
  ], []);

  // Compliance-Prüfungen für Mitarbeiter durchführen
  const runEmployeeCompliance = (employees: Employee[]): ComplianceCheck[] => {
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
            severity: result.status === 'failed' ? rule.severity : 
                     result.status === 'warning' ? 'medium' : 'low',
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
  };

  // Compliance-Prüfungen für Lohnabrechnung
  const runPayrollCompliance = (payrollEntries: PayrollEntry[]): ComplianceCheck[] => {
    const checks: ComplianceCheck[] = [];
    
    // Beispiel: Prüfung auf fehlende Lohnabrechnungen
    payrollEntries.forEach(entry => {
      // Vereinfachte Prüfung ohne documentation Property
      if (true) { // Placeholder für zukünftige Dokumentationsprüfung
        checks.push({
          id: `payroll-doc-${entry.id}-${Date.now()}`,
          type: 'contract',
          title: 'Lohnabrechnung Dokumentation',
          description: 'Lohnabrechnung muss dokumentiert werden',
          status: 'warning',
          severity: 'medium',
          message: 'Lohnabrechnung wurde noch nicht als PDF generiert',
          checkDate: new Date()
        });
      }
    });
    
    return checks;
  };

  // Compliance-Report generieren
  const generateComplianceReport = (employees: Employee[], payrollEntries: PayrollEntry[]): ComplianceReport => {
    const employeeChecks = runEmployeeCompliance(employees);
    const payrollChecks = runPayrollCompliance(payrollEntries);
    const allChecks = [...employeeChecks, ...payrollChecks];
    
    const summary = {
      totalChecks: allChecks.length,
      passed: allChecks.filter(c => c.status === 'passed').length,
      warnings: allChecks.filter(c => c.status === 'warning').length,
      failed: allChecks.filter(c => c.status === 'failed').length,
      critical: allChecks.filter(c => c.severity === 'critical').length
    };
    
    const report: ComplianceReport = {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      period: {
        from: new Date(new Date().getFullYear(), 0, 1), // Jahresanfang
        to: new Date() // Heute
      },
      checks: allChecks,
      summary
    };
    
    // Kritische Alerts erstellen
    const criticalChecks = allChecks.filter(c => c.severity === 'critical' && c.status === 'failed');
    const newAlerts: ComplianceAlert[] = criticalChecks.map(check => ({
      id: `alert-${check.id}`,
      type: check.type,
      title: check.title,
      message: check.message,
      severity: check.severity,
      employeeId: check.employeeId,
      isRead: false,
      isResolved: false,
      createdAt: new Date(),
      dueDate: check.dueDate
    }));
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
    }
    
    setReports(prev => [report, ...prev.slice(0, 9)]); // Behalte nur die letzten 10 Reports
    
    return report;
  };

  // Alert als gelesen markieren
  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  // Alert als gelöst markieren
  const resolveAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isResolved: true, isRead: true } : alert
      )
    );
  };

  // Computed values
  const activeAlerts = alerts.filter(alert => !alert.isResolved);
  const unreadAlerts = alerts.filter(alert => !alert.isRead && !alert.isResolved);

  return {
    complianceRules,
    alerts,
    reports,
    activeAlerts,
    unreadAlerts,
    runEmployeeCompliance,
    runPayrollCompliance,
    generateComplianceReport,
    markAlertAsRead,
    resolveAlert
  };
}