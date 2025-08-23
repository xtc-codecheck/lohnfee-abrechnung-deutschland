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

// Deutsche Krankenkassen mit Zusatzbeiträgen 2025
export const GERMAN_HEALTH_INSURANCES = [
  { name: "AOK Baden‑Württemberg", additionalRate: 2.60 },
  { name: "AOK Bayern", additionalRate: 2.69 },
  { name: "AOK Bremen/Bremerhaven", additionalRate: 2.49 },
  { name: "AOK Hessen", additionalRate: 2.49 },
  { name: "AOK Niedersachsen", additionalRate: 2.70 },
  { name: "AOK Nordost", additionalRate: 3.50 },
  { name: "AOK Nordwest", additionalRate: 2.79 },
  { name: "AOK Plus", additionalRate: 3.10 },
  { name: "AOK Rheinland/Hamburg", additionalRate: 2.99 },
  { name: "AOK Rheinland‑Pfalz/Saarland", additionalRate: 2.47 },
  { name: "AOK Sachsen-Anhalt", additionalRate: 2.50 },
  { name: "Audi BKK", additionalRate: 2.40 },
  { name: "Bahn‑BKK", additionalRate: 3.40 },
  { name: "Barmer Ersatzkasse (BARMER)", additionalRate: 3.29 },
  { name: "BKK Akzo Nobel", additionalRate: 3.39 },
  { name: "BKK B. Braun Aesculap", additionalRate: 2.95 },
  { name: "BKK Deutsche Bank AG", additionalRate: 3.40 },
  { name: "BKK Diakonie", additionalRate: 3.80 },
  { name: "BKK DürkoppAdler", additionalRate: 3.88 },
  { name: "BKK Euregio", additionalRate: 3.39 },
  { name: "BKK Exklusiv", additionalRate: 2.39 },
  { name: "BKK Faber‑Castell & Partner", additionalRate: 2.18 },
  { name: "BKK Firmus", additionalRate: 2.18 },
  { name: "BKK Freudenberg", additionalRate: 2.49 },
  { name: "BKK Gildemeister Seidensticker", additionalRate: 3.40 },
  { name: "BKK Herkules", additionalRate: 3.48 },
  { name: "BKK Linde", additionalRate: 2.99 },
  { name: "BKK Melitta HMR", additionalRate: 3.50 },
  { name: "BKK Pfalz", additionalRate: 3.90 },
  { name: "BKK ProVita", additionalRate: 2.89 },
  { name: "BKK Public", additionalRate: 2.30 },
  { name: "BKK SBH", additionalRate: 2.44 },
  { name: "BKK Scheufelen", additionalRate: 3.40 },
  { name: "BKK Technoform", additionalRate: 3.49 },
  { name: "BKK Verbundplus", additionalRate: 3.89 },
  { name: "BKK Werra‑Meissner", additionalRate: 3.39 },
  { name: "BKK Wirtschaft & Finanzen", additionalRate: 3.99 },
  { name: "BKK ZF & Partner", additionalRate: 3.40 },
  { name: "BKK24", additionalRate: 4.39 },
  { name: "Bundesinnungskrankenkasse Gesundheit", additionalRate: 3.39 },
  { name: "Continentale BKK", additionalRate: 3.33 },
  { name: "DAK‑Gesundheit", additionalRate: 2.80 },
  { name: "Debeka BKK", additionalRate: 3.25 },
  { name: "Energie‑BKK", additionalRate: 2.98 },
  { name: "Handelskrankenkasse (hkk)", additionalRate: 2.19 },
  { name: "Heimat Krankenkasse", additionalRate: 3.10 },
  { name: "HEK – Hanseatische Krankenkasse", additionalRate: 2.50 },
  { name: "IKK classic", additionalRate: 3.40 },
  { name: "IKK gesund plus", additionalRate: 3.39 },
  { name: "IKK – Die Innovationskasse", additionalRate: 4.30 },
  { name: "KKH (Kaufmännische Krankenkasse)", additionalRate: 3.78 },
  { name: "Knappschaft", additionalRate: 4.40 },
  { name: "mhplus BKK", additionalRate: 3.29 },
  { name: "Mobil Krankenkasse", additionalRate: 3.89 },
  { name: "Novitas BKK", additionalRate: 2.98 },
  { name: "pronova BKK", additionalRate: 3.20 },
  { name: "R+V BKK", additionalRate: 2.96 },
  { name: "Salus BKK", additionalRate: 2.99 },
  { name: "SBK (Siemens‑BKK)", additionalRate: 3.80 },
  { name: "Techniker Krankenkasse (TK)", additionalRate: 2.45 },
  { name: "TUI BKK", additionalRate: 2.50 },
  { name: "Viactiv BKK", additionalRate: 3.27 },
  { name: "Vivida BKK", additionalRate: 3.79 },
  { name: "WMF BKK", additionalRate: 2.45 }
];

// Sozialversicherungssätze 2025 (in Prozent)
export const SOCIAL_SECURITY_RATES = {
  pension: { total: 18.6, employee: 9.3, employer: 9.3 },
  unemployment: { total: 2.6, employee: 1.3, employer: 1.3 },
  care: { total: 3.4, employee: 1.7, employer: 1.7 }, // ohne Kinderlosenzuschlag
  careWithoutChildren: { total: 4.0, employee: 2.0, employer: 2.0 } // mit Kinderlosenzuschlag
};

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