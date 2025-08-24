// Behörden-Integration und Meldewesen

export interface DATEVExport {
  id: string;
  periodId: string;
  generatedAt: Date;
  fileName: string;
  status: 'pending' | 'generated' | 'transmitted' | 'error';
  format: 'ascii' | 'xml';
  recordCount: number;
  totalGrossAmount: number;
  errors?: string[];
}

export interface ELSTERSubmission {
  id: string;
  type: 'lohnsteueranmeldung' | 'lohnsteuerbescheinigung' | 'umsatzsteuervoranmeldung';
  period: {
    year: number;
    month?: number;
    quarter?: number;
  };
  submittedAt: Date;
  status: 'draft' | 'validated' | 'submitted' | 'accepted' | 'rejected';
  transferTicket?: string;
  validationErrors?: string[];
  dataXML?: string;
}

export interface SocialSecurityMessage {
  id: string;
  type: 'anmeldung' | 'abmeldung' | 'unterbrechungsmeldung' | 'jahresmeldung';
  employeeId: string;
  insuranceProvider: string; // Krankenkasse
  submittedAt: Date;
  status: 'pending' | 'sent' | 'confirmed' | 'rejected';
  messageContent: string;
  confirmationNumber?: string;
  errors?: string[];
}

export interface EmploymentAgencyMessage {
  id: string;
  type: 'kurzarbeiteranzeige' | 'kurzarbeiterabrechnung' | 'arbeitslosenmeldung';
  employeeIds: string[];
  period: {
    year: number;
    month: number;
  };
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  referenceNumber?: string;
  shortTimeWorkData?: {
    totalEmployees: number;
    affectedEmployees: number;
    totalLossAmount: number;
    benefitAmount: number;
  };
}

export interface ComplianceExport {
  id: string;
  type: 'datev' | 'elster' | 'krankenkasse' | 'arbeitsagentur';
  generatedAt: Date;
  periodCovered: {
    startDate: Date;
    endDate: Date;
  };
  status: 'pending' | 'ready' | 'transmitted' | 'confirmed' | 'error';
  fileSize?: number;
  downloadUrl?: string;
  errors?: string[];
}

// DATEV-spezifische Strukturen
export interface DATEVRecord {
  employeeNumber: string;
  grossSalary: number;
  incomeTax: number;
  solidarityTax: number;
  churchTax: number;
  pensionInsurance: number;
  unemploymentInsurance: number;
  healthInsurance: number;
  careInsurance: number;
  personalNumber: string; // Personalnummer
  taxClass: string;
  costCenter?: string;
}

// ELSTER-spezifische Strukturen  
export interface ELSTERTaxData {
  period: {
    year: number;
    month: number;
  };
  companyData: {
    steuernummer: string;
    elsterSteuernummer: string;
    companyName: string;
    address: string;
  };
  employees: Array<{
    employeeId: string;
    taxData: {
      grossSalary: number;
      incomeTax: number;
      solidarityTax: number;
      churchTax: number;
      socialSecurity: number;
    };
  }>;
  totals: {
    totalGross: number;
    totalIncomeTax: number;
    totalSolidarityTax: number;
    totalChurchTax: number;
    totalSocialSecurity: number;
  };
}

export const INSURANCE_PROVIDERS = [
  'AOK Baden-Württemberg',
  'AOK Bayern',
  'AOK Bremen/Bremerhaven',
  'AOK Hessen',
  'AOK Niedersachsen',
  'AOK Nordost',
  'AOK Nordwest',
  'AOK Plus',
  'AOK Rheinland-Pfalz/Saarland',
  'AOK Rheinland/Hamburg',
  'AOK Sachsen-Anhalt',
  'Barmer',
  'DAK-Gesundheit',
  'Techniker Krankenkasse',
  'IKK classic',
  'Knappschaft',
  'BKK Mobil Oil',
  'HEK - Hanseatische Krankenkasse',
  'Kaufmännische Krankenkasse - KKH',
  'Sonstige'
] as const;

export type InsuranceProvider = typeof INSURANCE_PROVIDERS[number];