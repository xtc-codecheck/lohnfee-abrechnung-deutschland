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
  religion?: Religion;
  relationshipStatus: RelationshipStatus;
  relationshipDate?: Date; // Datum der Heirat, Scheidung oder Verwitwung
  healthInsurance: HealthInsurance;
  socialSecurityNumber: string;
  childAllowances: number;
}

export interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
}

export interface EmploymentData {
  employmentType: EmploymentType;
  startDate: Date;
  endDate?: Date;
  isFixedTerm: boolean;
  weeklyHours: number;
  vacationDays: number;
  workDays: WorkDay[];
}

export interface WorkDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isWorkDay: boolean;
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
export type RelationshipStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type Religion = 'none' | 'catholic' | 'protestant' | 'old-catholic' | 'jewish' | 'free-religious' | 'unitarian' | 'mennonite' | 'huguenot' | 'other';

// Kirchensteuersätze nach Bundesland und Religion
export const CHURCH_TAX_RATES: Record<string, Record<Religion, number>> = {
  'baden-wuerttemberg': { none: 0, catholic: 8, protestant: 8, 'old-catholic': 8, jewish: 8, 'free-religious': 8, unitarian: 8, mennonite: 8, huguenot: 8, other: 0 },
  'bayern': { none: 0, catholic: 8, protestant: 8, 'old-catholic': 8, jewish: 8, 'free-religious': 8, unitarian: 8, mennonite: 8, huguenot: 8, other: 0 },
  'berlin': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'brandenburg': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'bremen': { none: 0, catholic: 8, protestant: 8, 'old-catholic': 8, jewish: 8, 'free-religious': 8, unitarian: 8, mennonite: 8, huguenot: 8, other: 0 },
  'hamburg': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'hessen': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'mecklenburg-vorpommern': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'niedersachsen': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'nordrhein-westfalen': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'rheinland-pfalz': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'saarland': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'sachsen': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'sachsen-anhalt': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'schleswig-holstein': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 },
  'thueringen': { none: 0, catholic: 9, protestant: 9, 'old-catholic': 9, jewish: 9, 'free-religious': 9, unitarian: 9, mennonite: 9, huguenot: 9, other: 0 }
};

export const GERMAN_STATES = [
  'baden-wuerttemberg',
  'bayern', 
  'berlin',
  'brandenburg',
  'bremen',
  'hamburg',
  'hessen',
  'mecklenburg-vorpommern',
  'niedersachsen',
  'nordrhein-westfalen',
  'rheinland-pfalz',
  'saarland',
  'sachsen',
  'sachsen-anhalt',
  'schleswig-holstein',
  'thueringen'
];

export const GERMAN_STATE_NAMES: Record<string, string> = {
  'baden-wuerttemberg': 'Baden-Württemberg',
  'bayern': 'Bayern',
  'berlin': 'Berlin',
  'brandenburg': 'Brandenburg',
  'bremen': 'Bremen',
  'hamburg': 'Hamburg',
  'hessen': 'Hessen',
  'mecklenburg-vorpommern': 'Mecklenburg-Vorpommern',
  'niedersachsen': 'Niedersachsen',
  'nordrhein-westfalen': 'Nordrhein-Westfalen',
  'rheinland-pfalz': 'Rheinland-Pfalz',
  'saarland': 'Saarland',
  'sachsen': 'Sachsen',
  'sachsen-anhalt': 'Sachsen-Anhalt',
  'schleswig-holstein': 'Schleswig-Holstein',
  'thueringen': 'Thüringen'
};