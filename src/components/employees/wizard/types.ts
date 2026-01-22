/**
 * Gemeinsame Typen und Utilities für den Employee Wizard
 */

import { EmploymentType, TaxClass, SalaryType, RelationshipStatus, Religion } from '@/types/employee';

// ============= Form State Typ =============

export interface EmployeeFormData {
  // Persönliche Daten
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'diverse';
  dateOfBirth: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  taxId: string;
  taxClass: TaxClass;
  religion: Religion;
  relationshipStatus: RelationshipStatus;
  relationshipDate: string;
  healthInsurance: string;
  healthInsuranceRate: number;
  socialSecurityNumber: string;
  childAllowances: number;
  
  // Beschäftigungsdaten
  employmentType: EmploymentType;
  department: string;
  position: string;
  startDate: string;
  isFixedTerm: boolean;
  endDate: string;
  weeklyHours: number;
  vacationDays: number;
  contractSigned: boolean;
  contractSignedDate: string;
  workDays: WorkDayData[];
  
  // Gehaltsdaten
  grossSalary: number;
  hourlyWage: number;
  salaryType: SalaryType;
  
  // Zusatzleistungen
  carListPrice: number;
  carType: 'benzin' | 'elektro' | 'hybrid';
  benefits: number;
  benefitsCompliant: boolean;
  travelExpenses: number;
  bonuses: number;
  yearlyBonusPercent: number;
  yearlyBonusFixed: number;
  has13thSalary: boolean;
  factor13thSalary: number;
  has14thSalary: boolean;
  factor14thSalary: number;
  allowances: number;
  companyPension: number;
  capitalFormingBenefits: number;
  taxFreeBenefits: number;
}

export interface WorkDayData {
  day: string;
  isWorkDay: boolean;
  hours: number;
}

// ============= Step Props =============

export interface WizardStepProps {
  formData: EmployeeFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
}

// ============= Initial State =============

export const initialFormData: EmployeeFormData = {
  // Persönliche Daten
  firstName: '',
  lastName: '',
  gender: 'male',
  dateOfBirth: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  state: 'nordrhein-westfalen',
  country: 'Deutschland',
  phone: '',
  email: '',
  taxId: '',
  taxClass: 'I',
  religion: 'none',
  relationshipStatus: 'single',
  relationshipDate: '',
  healthInsurance: '',
  healthInsuranceRate: 2.45,
  socialSecurityNumber: '',
  childAllowances: 0,
  
  // Beschäftigungsdaten
  employmentType: 'fulltime',
  department: '',
  position: '',
  startDate: '',
  isFixedTerm: false,
  endDate: '',
  weeklyHours: 40,
  vacationDays: 30,
  contractSigned: false,
  contractSignedDate: '',
  workDays: [
    { day: 'monday', isWorkDay: true, hours: 8 },
    { day: 'tuesday', isWorkDay: true, hours: 8 },
    { day: 'wednesday', isWorkDay: true, hours: 8 },
    { day: 'thursday', isWorkDay: true, hours: 8 },
    { day: 'friday', isWorkDay: true, hours: 8 },
    { day: 'saturday', isWorkDay: false, hours: 0 },
    { day: 'sunday', isWorkDay: false, hours: 0 },
  ],
  
  // Gehaltsdaten
  grossSalary: 0,
  hourlyWage: 0,
  salaryType: 'fixed',
  
  // Zusatzleistungen
  carListPrice: 0,
  carType: 'benzin',
  benefits: 0,
  benefitsCompliant: false,
  travelExpenses: 0,
  bonuses: 0,
  yearlyBonusPercent: 0,
  yearlyBonusFixed: 0,
  has13thSalary: false,
  factor13thSalary: 1,
  has14thSalary: false,
  factor14thSalary: 1,
  allowances: 0,
  companyPension: 0,
  capitalFormingBenefits: 0,
  taxFreeBenefits: 0,
};

// ============= Step Konfiguration =============

export const WIZARD_STEPS = [
  { id: 'personal', label: 'Persönliche Daten', shortLabel: 'Persönlich' },
  { id: 'employment', label: 'Beschäftigung', shortLabel: 'Beschäftigung' },
  { id: 'salary', label: 'Gehalt', shortLabel: 'Gehalt' },
  { id: 'benefits', label: 'Zusatzleistungen', shortLabel: 'Benefits' },
] as const;

export type WizardStepId = typeof WIZARD_STEPS[number]['id'];
