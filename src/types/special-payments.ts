// Spezielle Lohnarten und Zahlungen

export interface SickPayCalculation {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  dailyGrossSalary: number;
  sickPayPerDay: number; // 70% vom Brutto, max. 90% vom Netto
  totalSickPay: number;
  daysOfSickness: number;
  status: 'active' | 'completed';
  createdAt: Date;
}

export interface MaternityBenefits {
  id: string;
  employeeId: string;
  type: 'maternity-protection' | 'parental-leave' | 'child-benefit';
  startDate: Date;
  endDate: Date;
  grossSalaryBasis: number;
  dailyBenefit: number;
  totalBenefit: number;
  paidByEmployer: number; // Arbeitgeberzuschuss
  paidByInsurance: number; // Krankenkasse/Staat
  status: 'active' | 'completed';
  createdAt: Date;
}

export interface ShortTimeWork {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  originalWorkingHours: number;
  reducedWorkingHours: number;
  reductionPercentage: number;
  grossSalaryLoss: number;
  shortTimeWorkBenefit: number; // 60% oder 67% mit Kindern
  hasChildren: boolean;
  status: 'active' | 'completed';
  createdAt: Date;
}

export interface SpecialPaymentSummary {
  employeeId: string;
  month: number;
  year: number;
  sickPay: number;
  maternityBenefits: number;
  shortTimeWorkBenefit: number;
  totalSpecialPayments: number;
}

// Berechnungsparameter für Deutschland 2025
export const SICK_PAY_RATES = {
  percentage: 0.70, // 70% vom Bruttogehalt
  maxPercentageOfNet: 0.90, // max. 90% vom Nettogehalt
  maxDurationWeeks: 78, // 78 Wochen bei gleicher Krankheit
} as const;

export const MATERNITY_RATES = {
  dailyMaxBenefit: 13, // €13 pro Tag von Krankenkasse
  employerSupplementPercentage: 1.0, // Arbeitgeber zahlt Differenz zum vollen Gehalt
  protectionPeriodWeeks: 14, // 6 Wochen vor + 8 Wochen nach Geburt
} as const;

export const SHORT_TIME_WORK_RATES = {
  basePercentage: 0.60, // 60% für Kinderlose
  withChildrenPercentage: 0.67, // 67% mit Kindern
  maxDurationMonths: 24, // max. 24 Monate
  minReductionPercentage: 0.10, // mind. 10% Arbeitszeit-Reduzierung
} as const;