import { useState, useEffect, useMemo } from 'react';
import { 
  ComplianceRule, 
  ComplianceCheck, 
  ComplianceAlert, 
  ComplianceReport,
  ComplianceStatus,
  MINIMUM_WAGE_2024,
  MAX_WEEKLY_HOURS,
  SOCIAL_SECURITY_LIMITS_2024,
  TAX_FREE_ALLOWANCE_2024
} from '@/types/compliance';
import { Employee } from '@/types/employee';
import { PayrollEntry } from '@/types/payroll';

const COMPLIANCE_ALERTS_KEY = 'lohnpro_compliance_alerts';
const COMPLIANCE_REPORTS_KEY = 'lohnpro_compliance_reports';

export function useCompliance() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);

  // Load from localStorage
  useEffect(() => {
    const storedAlerts = localStorage.getItem(COMPLIANCE_ALERTS_KEY);
    const storedReports = localStorage.getItem(COMPLIANCE_REPORTS_KEY);

    if (storedAlerts) {
      try {
        const parsed = JSON.parse(storedAlerts);
        const alertsWithDates = parsed.map((alert: any) => ({
          ...alert,
          createdAt: new Date(alert.createdAt),
          resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
        }));
        setAlerts(alertsWithDates);
      } catch (error) {
        console.error('Error loading compliance alerts:', error);
      }
    }

    if (storedReports) {
      try {
        const parsed = JSON.parse(storedReports);
        const reportsWithDates = parsed.map((report: any) => ({
          ...report,
          generatedAt: new Date(report.generatedAt),
          period: {
            start: new Date(report.period.start),
            end: new Date(report.period.end)
          },
          checks: report.checks.map((check: any) => ({
            ...check,
            checkedAt: new Date(check.checkedAt)
          }))
        }));
        setReports(reportsWithDates);
      } catch (error) {
        console.error('Error loading compliance reports:', error);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(COMPLIANCE_ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(COMPLIANCE_REPORTS_KEY, JSON.stringify(reports));
  }, [reports]);

  // Compliance Rules Definition
  const complianceRules: ComplianceRule[] = useMemo(() => [
    {
      id: 'minimum_wage_check',
      type: 'minimum_wage',
      title: 'Mindestlohn-Prüfung',
      description: 'Überprüft, ob der gezahlte Lohn dem gesetzlichen Mindestlohn entspricht',
      severity: 'critical',
      isActive: true,
      checkFunction: (employee: Employee) => {
        const hourlyWage = employee.salaryData.grossSalary / (40 * 4.33); // Grober Stundenlohn
        const isCompliant = hourlyWage >= MINIMUM_WAGE_2024;
        
        return {
          ruleId: 'minimum_wage_check',
          status: isCompliant ? 'compliant' : 'non_compliant',
          message: isCompliant 
            ? 'Mindestlohn wird eingehalten'
            : `Stundenlohn (${hourlyWage.toFixed(2)}€) liegt unter Mindestlohn (${MINIMUM_WAGE_2024}€)`,
          details: `Berechnet: ${hourlyWage.toFixed(2)}€/h bei ${employee.salaryData.grossSalary}€ Bruttogehalt`,
          recommendations: isCompliant ? [] : [
            'Gehalt auf Mindestlohn anheben',
            'Arbeitszeiten überprüfen',
            'Rechtliche Beratung einholen'
          ],
          checkedAt: new Date(),
          affectedItems: [employee.id]
        };
      }
    },
    {
      id: 'social_security_limits',
      type: 'social_security',
      title: 'Sozialversicherungsgrenzen',
      description: 'Überprüft Beitragsbemessungsgrenzen der Sozialversicherung',
      severity: 'warning',
      isActive: true,
      checkFunction: (employee: Employee) => {
        const monthlyGross = employee.salaryData.grossSalary;
        const exceedsHealthLimit = monthlyGross > SOCIAL_SECURITY_LIMITS_2024.healthInsurance;
        const exceedsPensionLimit = monthlyGross > SOCIAL_SECURITY_LIMITS_2024.pensionInsurance;
        
        let status: ComplianceStatus = 'compliant';
        let messages: string[] = [];
        
        if (exceedsHealthLimit) {
          messages.push(`Überschreitet Beitragsbemessungsgrenze KV/PV (${SOCIAL_SECURITY_LIMITS_2024.healthInsurance}€)`);
          status = 'warning';
        }
        
        if (exceedsPensionLimit) {
          messages.push(`Überschreitet Beitragsbemessungsgrenze RV/ALV (${SOCIAL_SECURITY_LIMITS_2024.pensionInsurance}€)`);
          status = 'warning';
        }
        
        return {
          ruleId: 'social_security_limits',
          status,
          message: messages.length > 0 ? messages.join('; ') : 'Sozialversicherungsgrenzen eingehalten',
          details: `Bruttogehalt: ${monthlyGross}€`,
          recommendations: messages.length > 0 ? [
            'Beitragsbemessungsgrenzen bei Abrechnung beachten',
            'Steuerberatung konsultieren'
          ] : [],
          checkedAt: new Date(),
          affectedItems: [employee.id]
        };
      }
    },
    {
      id: 'employee_data_completeness',
      type: 'employee_data',
      title: 'Mitarbeiterdaten-Vollständigkeit',
      description: 'Überprüft Vollständigkeit der Mitarbeiterdaten',
      severity: 'warning',
      isActive: true,
      checkFunction: (employee: Employee) => {
        const missingFields: string[] = [];
        
        if (!employee.personalData.firstName) missingFields.push('Vorname');
        if (!employee.personalData.lastName) missingFields.push('Nachname');
        if (!employee.personalData.taxClass) missingFields.push('Steuerklasse');
        if (!employee.personalData.socialSecurityNumber) missingFields.push('Sozialversicherungsnummer');
        if (!employee.personalData.address?.street) missingFields.push('Adresse');
        
        const isCompliant = missingFields.length === 0;
        
        return {
          ruleId: 'employee_data_completeness',
          status: isCompliant ? 'compliant' : 'warning',
          message: isCompliant 
            ? 'Alle erforderlichen Mitarbeiterdaten vorhanden'
            : `Fehlende Daten: ${missingFields.join(', ')}`,
          details: `Überprüfte Felder: ${missingFields.length > 0 ? missingFields.length + ' fehlen' : 'Alle vollständig'}`,
          recommendations: missingFields.length > 0 ? [
            'Fehlende Mitarbeiterdaten nachpflegen',
            'Mitarbeiter zur Vervollständigung kontaktieren'
          ] : [],
          checkedAt: new Date(),
          affectedItems: [employee.id]
        };
      }
    },
    {
      id: 'payroll_documentation',
      type: 'payroll_documentation',
      title: 'Lohnabrechnung-Dokumentation',
      description: 'Überprüft Vollständigkeit der Lohnabrechnungsdokumentation',
      severity: 'error',
      isActive: true,
      checkFunction: (payrollEntry: PayrollEntry) => {
        const missingElements: string[] = [];
        
        if (!payrollEntry.salaryCalculation) missingElements.push('Gehaltsberechnung');
        if (!payrollEntry.workingData) missingElements.push('Arbeitszeitdaten');
        if (payrollEntry.salaryCalculation?.taxes?.total === undefined) missingElements.push('Steuerberechnung');
        if (!payrollEntry.salaryCalculation?.socialSecurityContributions) missingElements.push('Sozialversicherungsbeiträge');
        
        const isCompliant = missingElements.length === 0;
        
        return {
          ruleId: 'payroll_documentation',
          status: isCompliant ? 'compliant' : 'non_compliant',
          message: isCompliant 
            ? 'Lohnabrechnungsdokumentation vollständig'
            : `Unvollständige Dokumentation: ${missingElements.join(', ')}`,
          details: `Mitarbeiter: ${payrollEntry.employee.personalData.firstName} ${payrollEntry.employee.personalData.lastName}`,
          recommendations: missingElements.length > 0 ? [
            'Fehlende Berechnungsdetails ergänzen',
            'Lohnabrechnung neu berechnen'
          ] : [],
          checkedAt: new Date(),
          affectedItems: [payrollEntry.employeeId]
        };
      }
    }
  ], []);

  // Run compliance checks for employees
  const runEmployeeCompliance = (employees: Employee[]): ComplianceCheck[] => {
    const checks: ComplianceCheck[] = [];
    
    employees.forEach(employee => {
      complianceRules.forEach(rule => {
        if (rule.isActive && (rule.type === 'minimum_wage' || rule.type === 'social_security' || rule.type === 'employee_data')) {
          try {
            const check = rule.checkFunction(employee);
            checks.push(check);
          } catch (error) {
            console.error(`Error running compliance check ${rule.id}:`, error);
          }
        }
      });
    });
    
    return checks;
  };

  // Run compliance checks for payroll entries
  const runPayrollCompliance = (payrollEntries: PayrollEntry[]): ComplianceCheck[] => {
    const checks: ComplianceCheck[] = [];
    
    payrollEntries.forEach(entry => {
      complianceRules.forEach(rule => {
        if (rule.isActive && rule.type === 'payroll_documentation') {
          try {
            const check = rule.checkFunction(entry);
            checks.push(check);
          } catch (error) {
            console.error(`Error running compliance check ${rule.id}:`, error);
          }
        }
      });
    });
    
    return checks;
  };

  // Generate compliance report
  const generateComplianceReport = (
    employees: Employee[], 
    payrollEntries: PayrollEntry[] = []
  ): ComplianceReport => {
    const employeeChecks = runEmployeeCompliance(employees);
    const payrollChecks = runPayrollCompliance(payrollEntries);
    const allChecks = [...employeeChecks, ...payrollChecks];
    
    const summary = {
      total: allChecks.length,
      compliant: allChecks.filter(c => c.status === 'compliant').length,
      warnings: allChecks.filter(c => c.status === 'warning').length,
      nonCompliant: allChecks.filter(c => c.status === 'non_compliant').length,
      critical: allChecks.filter(c => complianceRules.find(r => r.id === c.ruleId)?.severity === 'critical' && c.status !== 'compliant').length
    };
    
    const report: ComplianceReport = {
      id: crypto.randomUUID(),
      generatedAt: new Date(),
      period: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date()
      },
      checks: allChecks,
      summary
    };
    
    setReports(prev => [report, ...prev.slice(0, 9)]); // Keep last 10 reports
    
    // Generate alerts for critical issues
    allChecks.forEach(check => {
      const rule = complianceRules.find(r => r.id === check.ruleId);
      if (rule && (rule.severity === 'critical' || rule.severity === 'error') && check.status !== 'compliant') {
        const alert: ComplianceAlert = {
          id: crypto.randomUUID(),
          ruleId: check.ruleId,
          type: rule.type,
          severity: rule.severity,
          title: rule.title,
          message: check.message,
          createdAt: new Date(),
          isRead: false,
          isResolved: false,
          affectedEmployees: check.affectedItems
        };
        
        setAlerts(prev => [alert, ...prev]);
      }
    });
    
    return report;
  };

  // Mark alert as read
  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  // Resolve alert
  const resolveAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isResolved: true, resolvedAt: new Date() } 
          : alert
      )
    );
  };

  // Get active alerts
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