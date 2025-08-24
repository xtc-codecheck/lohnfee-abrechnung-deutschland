// Compliance und rechtliche Anforderungen

export interface ComplianceCheck {
  id: string;
  type: 'minimum-wage' | 'working-time' | 'data-retention' | 'contract' | 'social-security';
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  employeeId?: string;
  checkDate: Date;
  dueDate?: Date;
}

export interface ComplianceAlert {
  id: string;
  type: ComplianceCheck['type'];
  title: string;
  message: string;
  severity: ComplianceCheck['severity'];
  employeeId?: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  dueDate?: Date;
}

export interface ComplianceReport {
  id: string;
  generatedAt: Date;
  period: {
    from: Date;
    to: Date;
  };
  checks: ComplianceCheck[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
    critical: number;
  };
}

// Mindestlöhne Deutschland (historisch)
export const MINIMUM_WAGES = {
  2020: 9.35,
  2021: 9.60,
  2022: 10.45,
  2023: 12.00,
  2024: 12.41,
  2025: 12.82
} as const;

export const DEPARTMENTS = [
  'Geschäftsführung',
  'Verwaltung',
  'Buchhaltung',
  'Personalwesen',
  'Vertrieb',
  'Marketing',
  'IT',
  'Produktion',
  'Logistik',
  'Qualitätssicherung',
  'Kundendienst',
  'Einkauf',
  'Forschung & Entwicklung',
  'Sonstiges'
] as const;

export type Department = typeof DEPARTMENTS[number];