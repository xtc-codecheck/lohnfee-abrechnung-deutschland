// TypeScript-Definitionen für Autolohn-Einstellungen

export interface CompanyData {
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  taxNumber: string;
  operationNumber: string; // Betriebsnummer der Bundesagentur für Arbeit
}

export interface AutolohnSettings {
  companyData: CompanyData;
  socialSecurityReporting: {
    enabled: boolean;
    daysBefore: number; // Tage vor Monatsende
  };
  payrollTaxReporting: {
    enabled: boolean;
    dayOfNextMonth: number; // Tag im Folgemonat
  };
  employeeNotifications: {
    enabled: boolean;
    sendOnPayrollCreation: boolean;
  };
  managerNotifications: {
    enabled: boolean;
    managerEmail: string;
    daysBefore: number; // Tage vor Lohnabrechnungszeitraum
  };
}