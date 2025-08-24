// Erweiterte Lohnberechnungen: Reisekosten, bAV, VL

export interface TravelExpense {
  id: string;
  employeeId: string;
  period: {
    year: number;
    month: number;
  };
  entries: TravelExpenseEntry[];
  totalAmount: number;
  taxableAmount: number;
  taxFreeAmount: number;
  status: 'draft' | 'approved' | 'paid';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TravelExpenseEntry {
  id: string;
  date: Date;
  type: TravelExpenseType;
  description: string;
  distance?: number; // km
  amount: number;
  taxable: boolean;
  category: ExpenseCategory;
  receiptUrl?: string;
  notes?: string;
}

export type TravelExpenseType = 
  | 'mileage' // Kilometerpauschale
  | 'accommodation' // Übernachtung
  | 'meals' // Verpflegung
  | 'parking' // Parkgebühren
  | 'tolls' // Mautgebühren
  | 'public_transport' // ÖPNV
  | 'other'; // Sonstiges

export type ExpenseCategory =
  | 'business_travel' // Dienstreise
  | 'customer_visit' // Kundenbesuch
  | 'training' // Schulung
  | 'conference' // Konferenz
  | 'other'; // Sonstiges

// Betriebliche Altersvorsorge (bAV)
export interface OccupationalPension {
  id: string;
  employeeId: string;
  provider: string;
  contractNumber: string;
  startDate: Date;
  endDate?: Date;
  pensionType: PensionType;
  contributionType: ContributionType;
  monthlyContribution: number;
  employerContribution: number;
  employeeContribution: number;
  maxTaxFreeAmount: number; // 2025: 3.504€
  maxSocialSecurityFreeAmount: number; // 2025: 2.928€
  currentContribution: number;
  status: 'active' | 'suspended' | 'terminated';
  taxBenefit: number;
  socialSecurityBenefit: number;
}

export type PensionType = 
  | 'direktversicherung' // Direktversicherung
  | 'pensionskasse' // Pensionskasse
  | 'pensionsfonds' // Pensionsfonds
  | 'unterstuetzungskasse' // Unterstützungskasse
  | 'direktzusage'; // Direktzusage

export type ContributionType =
  | 'entgeltumwandlung' // Entgeltumwandlung
  | 'arbeitgeberzuschuss' // Arbeitgeberzuschuss
  | 'mischfinanzierung'; // Mischfinanzierung

// Vermögenswirksame Leistungen (VL)
export interface CapitalFormingBenefit {
  id: string;
  employeeId: string;
  provider: string;
  contractNumber: string;
  startDate: Date;
  endDate?: Date;
  benefitType: VLType;
  monthlyAmount: number;
  employerContribution: number;
  employeeContribution: number;
  statePremiumEligible: boolean; // Arbeitnehmersparzulage berechtigt
  statePremiumAmount: number;
  incomeLimit: number; // Einkommensgrenze für Sparzulage
  status: 'active' | 'suspended' | 'terminated';
  totalSaved: number;
}

export type VLType =
  | 'bausparvertrag' // Bausparen
  | 'investmentfonds' // Aktienfonds
  | 'banksparen' // Banksparen
  | 'betriebliche_beteiligung' // Betriebliche Beteiligung
  | 'wohnungsbaupr_amie'; // Wohnungsbauprämie

// Berechnungsregeln 2025
export const EXPENSE_RATES_2025 = {
  mileage: {
    car: 0.30, // 30 Cent/km
    motorcycle: 0.13, // 13 Cent/km
    bicycle: 0.05, // 5 Cent/km
  },
  dailyAllowances: {
    germany: {
      fullDay: 28, // ab 24h Abwesenheit
      partialDay: 14, // 8-24h Abwesenheit
    },
    abroad: {
      // Länderspezifische Pauschalen
      austria: 42,
      switzerland: 60,
      // etc.
    }
  },
  accommodationLimits: {
    germany: 150, // übernachtungskosten ohne Beleg
    abroad: 250,
  }
} as const;

export const BAV_LIMITS_2025 = {
  maxTaxFree: 3504, // 4% der BBG West
  maxSocialSecurityFree: 2928, // Zusätzliche 1800€ für SV-Freiheit
  totalMaxBenefit: 6432, // Maximal steuer- und sozialversicherungsfrei
} as const;

export const VL_LIMITS_2025 = {
  maxEmployerContribution: 40, // pro Monat
  maxStatePremium: {
    bausparvertrag: 43, // bei Einkommen bis 17.900€
    investmentfonds: 80, // bei Einkommen bis 20.000€
  },
  incomeLimit: {
    bausparvertrag: 17900,
    investmentfonds: 20000,
  }
} as const;

export interface PayrollCalculationExtended {
  basicPayroll: any; // Basis-Lohnabrechnung
  travelExpenses: TravelExpense[];
  occupationalPension?: OccupationalPension;
  capitalFormingBenefit?: CapitalFormingBenefit;
  
  // Berechnete Werte
  totalTravelExpenses: number;
  taxableTravelExpenses: number;
  taxFreeTravelExpenses: number;
  
  bAVContribution: number;
  bAVTaxSavings: number;
  bAVSocialSecuritySavings: number;
  
  vLContribution: number;
  vLStatePremium: number;
  
  // Angepasste Endwerte
  adjustedGrossSalary: number;
  adjustedTaxableIncome: number;
  adjustedNetSalary: number;
}