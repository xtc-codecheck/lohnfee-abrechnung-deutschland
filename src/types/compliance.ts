// TypeScript-Definitionen für Compliance-System

export type ComplianceType = 
  | 'tax_calculation'
  | 'social_security'
  | 'minimum_wage'
  | 'working_time'
  | 'employee_data'
  | 'payroll_documentation'
  | 'legal_requirements';

export type ComplianceSeverity = 'info' | 'warning' | 'error' | 'critical';

export type ComplianceStatus = 'compliant' | 'warning' | 'non_compliant' | 'unknown';

export interface ComplianceRule {
  id: string;
  type: ComplianceType;
  title: string;
  description: string;
  severity: ComplianceSeverity;
  isActive: boolean;
  lastChecked?: Date;
  checkFunction: (data: any) => ComplianceCheck;
}

export interface ComplianceCheck {
  ruleId: string;
  status: ComplianceStatus;
  message: string;
  details?: string;
  recommendations?: string[];
  checkedAt: Date;
  affectedItems?: string[];
}

export interface ComplianceReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  checks: ComplianceCheck[];
  summary: {
    total: number;
    compliant: number;
    warnings: number;
    nonCompliant: number;
    critical: number;
  };
}

export interface ComplianceAlert {
  id: string;
  ruleId: string;
  type: ComplianceType;
  severity: ComplianceSeverity;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: Date;
  affectedEmployees?: string[];
}

// Deutsche Compliance-Konstanten
export const MINIMUM_WAGE_2024 = 12.41; // €/Stunde
export const MAX_WEEKLY_HOURS = 48;
export const MAX_DAILY_HOURS = 10;
export const MIN_REST_PERIOD = 11; // Stunden

export const SOCIAL_SECURITY_LIMITS_2024 = {
  healthInsurance: 5175, // Beitragsbemessungsgrenze KV/PV
  pensionInsurance: 7550, // Beitragsbemessungsgrenze RV/ALV (West)
  pensionInsuranceEast: 7450, // Beitragsbemessungsgrenze RV/ALV (Ost)
} as const;

export const TAX_FREE_ALLOWANCE_2024 = 11604; // Grundfreibetrag