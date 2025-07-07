// TypeScript-Definitionen für die Mitarbeiterverwaltung

export interface Employee {
  id: string;
  personalData: PersonalData;
  employmentData: EmploymentData;
  salaryData: SalaryData;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  address: Address;
  taxId: string;
  taxClass: TaxClass;
  churchTax: boolean;
  churchTaxState?: string;
  healthInsurance: HealthInsurance;
  socialSecurityNumber: string;
  childAllowances: number;
}

export interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface EmploymentData {
  employmentType: EmploymentType;
  startDate: Date;
  endDate?: Date;
  isFixedTerm: boolean;
  weeklyHours: number;
}

export interface SalaryData {
  grossSalary: number;
  hourlyWage?: number;
  salaryType: SalaryType;
  additionalBenefits: AdditionalBenefits;
}

export interface AdditionalBenefits {
  companyCar?: number; // geldwerter Vorteil
  benefits?: number; // Sachbezüge
  travelExpenses?: number;
  bonuses?: number;
  allowances?: number;
  companyPension?: number; // bAV
  capitalFormingBenefits?: number; // VL
  taxFreeBenefits?: number;
}

export interface HealthInsurance {
  name: string;
  additionalRate: number; // in Prozent
}

export interface SalaryCalculation {
  grossSalary: number;
  netSalary: number;
  socialSecurityContributions: SocialSecurityContributions;
  taxes: TaxCalculation;
  employerCosts: number;
}

export interface SocialSecurityContributions {
  healthInsurance: ContributionSplit;
  pensionInsurance: ContributionSplit;
  unemploymentInsurance: ContributionSplit;
  careInsurance: ContributionSplit;
  total: ContributionSplit;
}

export interface ContributionSplit {
  employee: number;
  employer: number;
  total: number;
}

export interface TaxCalculation {
  incomeTax: number;
  churchTax: number;
  solidarityTax: number;
  total: number;
}

export type EmploymentType = 'minijob' | 'midijob' | 'fulltime' | 'parttime';
export type TaxClass = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type SalaryType = 'fixed' | 'hourly' | 'variable';