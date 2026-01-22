// Payroll Guardian Typen für Anomalie-Erkennung und KI-Analyse

export interface PayrollAnomaly {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  currentValue: number;
  expectedValue?: number;
  deviation?: number; // Prozentuale Abweichung
  detectedAt: Date;
  period: string; // z.B. "2025-01"
  isResolved: boolean;
  resolution?: string;
}

export type AnomalyType = 
  | 'salary-spike' // Plötzlicher Gehaltsanstieg
  | 'salary-drop' // Plötzlicher Gehaltsrückgang
  | 'overtime-excessive' // Übermäßige Überstunden
  | 'bonus-unusual' // Ungewöhnliche Bonuszahlung
  | 'missing-entry' // Fehlende Lohnabrechnung
  | 'duplicate-entry' // Doppelte Lohnabrechnung
  | 'tax-discrepancy' // Steuer-Diskrepanz
  | 'sv-discrepancy' // Sozialversicherungs-Diskrepanz
  | 'working-time-violation' // Arbeitszeitverletzung
  | 'minimum-wage-violation' // Mindestlohn-Unterschreitung
  | 'pattern-break'; // Abweichung vom Muster

export interface SalaryForecast {
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  projections: SalaryProjection[];
  careerPath: CareerMilestone[];
  optimizationPotential: OptimizationSuggestion[];
  marketComparison: MarketPosition;
}

export interface SalaryProjection {
  year: number;
  projectedSalary: number;
  projectedNet: number;
  confidence: number; // 0-100%
  assumptions: string[];
}

export interface CareerMilestone {
  year: number;
  event: string;
  salaryImpact: number;
  probability: number;
}

export interface OptimizationSuggestion {
  type: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  potentialSaving: number;
  effort: 'low' | 'medium' | 'high';
}

export interface MarketPosition {
  percentile: number; // 0-100
  medianSalary: number;
  delta: number;
  recommendation: string;
}

export interface PayrollGuardianStats {
  totalAnomalies: number;
  unresolvedAnomalies: number;
  criticalAnomalies: number;
  lastScanAt: Date;
  healthScore: number; // 0-100
  trendsPositive: number;
  trendsNegative: number;
}

export interface HistoricalPayrollData {
  employeeId: string;
  period: string;
  grossSalary: number;
  netSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
}

export interface AnomalyDetectionConfig {
  salaryDeviationThreshold: number; // z.B. 0.15 = 15%
  overtimeThreshold: number; // Stunden pro Monat
  bonusThreshold: number; // Euro-Betrag
  minimumDataPoints: number; // Mindestanzahl historischer Datenpunkte
  enabledChecks: AnomalyType[];
}

export const DEFAULT_ANOMALY_CONFIG: AnomalyDetectionConfig = {
  salaryDeviationThreshold: 0.15,
  overtimeThreshold: 40,
  bonusThreshold: 5000,
  minimumDataPoints: 3,
  enabledChecks: [
    'salary-spike',
    'salary-drop',
    'overtime-excessive',
    'bonus-unusual',
    'missing-entry',
    'duplicate-entry',
    'tax-discrepancy',
    'sv-discrepancy',
    'working-time-violation',
    'minimum-wage-violation',
    'pattern-break'
  ]
};
