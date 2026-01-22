// Baulohn-Berechnungen 2025
// SOKA-BAU, Urlaubskasse, Winterbeschäftigung, Tarifzuschläge

export type ConstructionRegion = 'west' | 'east';
export type ConstructionTradeGroup = 'worker' | 'skilled' | 'foreman' | 'master';

export interface ConstructionPayrollParams {
  grossMonthly: number;
  region: ConstructionRegion;
  tradeGroup: ConstructionTradeGroup;
  hoursWorked: number;
  // Winterbeschäftigung
  isWinterPeriod: boolean; // Dezember - März
  winterHours?: number;
  // Zulagen
  dirtyWorkHours?: number; // Schmutzzulage
  heightWorkHours?: number; // Höhenzulage
  dangerWorkHours?: number; // Gefahrenzulage
  // Urlaub
  vacationDaysTaken?: number;
  previousYearVacationDays?: number;
}

export interface ConstructionPayrollResult {
  // SOKA-BAU
  sokaEmployerContribution: number;
  sokaEmployeeContribution: number; // Immer 0 für Arbeitnehmer
  
  // Urlaubskasse
  vacationPayEntitlement: number;
  vacationBonusEntitlement: number;
  
  // Winterbeschäftigung
  winterAllowance: number;
  winterShortTimeWork?: number;
  
  // Zulagen
  dirtyWorkBonus: number;
  heightWorkBonus: number;
  dangerWorkBonus: number;
  totalBonuses: number;
  
  // Gesamt
  totalGross: number;
  sokaDeductions: number;
  netAdditions: number;
  
  details: string[];
}

export interface VacationAccountResult {
  previousBalance: number;
  currentYearEntitlement: number;
  daysTaken: number;
  remainingDays: number;
  monetaryValue: number;
  expirationDate: Date;
  details: string[];
}

// Konstanten SOKA-BAU 2025
const SOKA_EMPLOYER_RATE = 15.2; // 15,2% Arbeitgeberbeitrag
const SOKA_EMPLOYEE_RATE = 0; // AN zahlt nichts direkt
const WINTER_ALLOWANCE_HOURLY = 1.0; // 1,00€/Stunde Wintergeld (Dez-März)
const VACATION_DAYS_ENTITLEMENT = 30; // Urlaubsanspruch Bau
const VACATION_BONUS_RATE = 0.145; // 14,5% Urlaubsgeld

// Stundenlöhne nach Tarifgruppe (Durchschnitt West, 2025)
const HOURLY_RATES: Record<ConstructionRegion, Record<ConstructionTradeGroup, number>> = {
  west: {
    worker: 16.50,
    skilled: 19.50,
    foreman: 22.50,
    master: 26.00,
  },
  east: {
    worker: 15.50,
    skilled: 18.00,
    foreman: 21.00,
    master: 24.00,
  },
};

// Zulagen pro Stunde
const BONUS_RATES = {
  dirtyWork: 0.75, // Schmutzzulage
  heightWork: 1.50, // Höhenzulage (ab 10m)
  dangerWork: 2.00, // Gefahrenzulage
};

/**
 * Berechnet SOKA-BAU Beiträge
 */
export function calculateSokaContributions(
  grossMonthly: number,
  region: ConstructionRegion
): { employer: number; employee: number; details: string[] } {
  const employerContribution = grossMonthly * (SOKA_EMPLOYER_RATE / 100);
  
  return {
    employer: employerContribution,
    employee: 0, // AN zahlt nichts
    details: [
      `SOKA-BAU Arbeitgeberbeitrag: ${SOKA_EMPLOYER_RATE}%`,
      `Monatlicher AG-Beitrag: ${formatCurrency(employerContribution)}`,
      `Arbeitnehmer: Kein Beitrag (0%)`,
      `Region: ${region === 'west' ? 'West' : 'Ost'}`,
    ],
  };
}

/**
 * Berechnet Urlaubskassen-Ansprüche
 */
export function calculateVacationAccount(params: ConstructionPayrollParams): VacationAccountResult {
  const { 
    grossMonthly, 
    vacationDaysTaken = 0, 
    previousYearVacationDays = 0,
    hoursWorked 
  } = params;
  
  // Urlaubsanspruch pro Jahr
  const currentYearEntitlement = VACATION_DAYS_ENTITLEMENT;
  const totalAvailable = previousYearVacationDays + currentYearEntitlement;
  const remainingDays = totalAvailable - vacationDaysTaken;
  
  // Urlaubsvergütung (Tagessatz)
  const dailyRate = grossMonthly / 21.75; // Durchschnittliche Arbeitstage
  const vacationPayValue = remainingDays * dailyRate;
  
  // Urlaubsgeld (14,5% auf Urlaubsvergütung)
  const vacationBonus = vacationPayValue * VACATION_BONUS_RATE;
  
  const monetaryValue = vacationPayValue + vacationBonus;
  
  // Verfall: Bis 31.03. des Folgejahres
  const currentYear = new Date().getFullYear();
  const expirationDate = new Date(currentYear + 1, 2, 31);
  
  return {
    previousBalance: previousYearVacationDays,
    currentYearEntitlement,
    daysTaken: vacationDaysTaken,
    remainingDays,
    monetaryValue,
    expirationDate,
    details: [
      `Vorjahresrest: ${previousYearVacationDays} Tage`,
      `Jahresanspruch: ${currentYearEntitlement} Tage`,
      `Genommen: ${vacationDaysTaken} Tage`,
      `Resturlaub: ${remainingDays} Tage`,
      `Urlaubsvergütung: ${formatCurrency(vacationPayValue)}`,
      `Urlaubsgeld (14,5%): ${formatCurrency(vacationBonus)}`,
      `Gesamtwert: ${formatCurrency(monetaryValue)}`,
      `⚠️ Verfall bis: ${expirationDate.toLocaleDateString('de-DE')}`,
    ],
  };
}

/**
 * Berechnet Winterbeschäftigungs-Zuschüsse
 */
export function calculateWinterAllowances(
  winterHours: number,
  isWinterPeriod: boolean
): { allowance: number; details: string[] } {
  if (!isWinterPeriod) {
    return {
      allowance: 0,
      details: ['Wintergeld nur im Zeitraum Dezember - März'],
    };
  }
  
  const allowance = winterHours * WINTER_ALLOWANCE_HOURLY;
  
  return {
    allowance,
    details: [
      `Wintergeld: ${formatCurrency(WINTER_ALLOWANCE_HOURLY)}/Stunde`,
      `Winterstunden: ${winterHours}`,
      `Gesamt-Wintergeld: ${formatCurrency(allowance)}`,
      `✅ Steuerfrei nach § 3 Nr. 10 EStG`,
    ],
  };
}

/**
 * Berechnet tarifliche Zulagen
 */
export function calculateConstructionBonuses(params: ConstructionPayrollParams): {
  dirtyWork: number;
  heightWork: number;
  dangerWork: number;
  total: number;
  details: string[];
} {
  const { 
    dirtyWorkHours = 0, 
    heightWorkHours = 0, 
    dangerWorkHours = 0 
  } = params;
  
  const dirtyWork = dirtyWorkHours * BONUS_RATES.dirtyWork;
  const heightWork = heightWorkHours * BONUS_RATES.heightWork;
  const dangerWork = dangerWorkHours * BONUS_RATES.dangerWork;
  const total = dirtyWork + heightWork + dangerWork;
  
  const details: string[] = [];
  
  if (dirtyWorkHours > 0) {
    details.push(`Schmutzzulage: ${dirtyWorkHours}h × ${formatCurrency(BONUS_RATES.dirtyWork)} = ${formatCurrency(dirtyWork)}`);
  }
  if (heightWorkHours > 0) {
    details.push(`Höhenzulage: ${heightWorkHours}h × ${formatCurrency(BONUS_RATES.heightWork)} = ${formatCurrency(heightWork)}`);
  }
  if (dangerWorkHours > 0) {
    details.push(`Gefahrenzulage: ${dangerWorkHours}h × ${formatCurrency(BONUS_RATES.dangerWork)} = ${formatCurrency(dangerWork)}`);
  }
  
  if (details.length === 0) {
    details.push('Keine Zulagen in diesem Zeitraum');
  }
  
  return { dirtyWork, heightWork, dangerWork, total, details };
}

/**
 * Hauptberechnung Baulohn
 */
export function calculateConstructionPayroll(params: ConstructionPayrollParams): ConstructionPayrollResult {
  const {
    grossMonthly,
    region,
    tradeGroup,
    hoursWorked,
    isWinterPeriod,
    winterHours = 0,
  } = params;
  
  // SOKA-BAU
  const soka = calculateSokaContributions(grossMonthly, region);
  
  // Urlaubskasse
  const vacation = calculateVacationAccount(params);
  
  // Winterbeschäftigung
  const winter = calculateWinterAllowances(winterHours, isWinterPeriod);
  
  // Zulagen
  const bonuses = calculateConstructionBonuses(params);
  
  // Tariflicher Stundenlohn
  const hourlyRate = HOURLY_RATES[region][tradeGroup];
  const baseWage = hoursWorked * hourlyRate;
  
  const totalGross = grossMonthly + bonuses.total + winter.allowance;
  const sokaDeductions = 0; // AN zahlt nichts bei SOKA
  const netAdditions = bonuses.total + winter.allowance;
  
  const tradeGroupNames: Record<ConstructionTradeGroup, string> = {
    worker: 'Bauhelfer/Werker',
    skilled: 'Facharbeiter',
    foreman: 'Vorarbeiter/Polier',
    master: 'Baumeister',
  };
  
  return {
    sokaEmployerContribution: soka.employer,
    sokaEmployeeContribution: 0,
    
    vacationPayEntitlement: vacation.monetaryValue * 0.87, // Nur Urlaubsvergütung
    vacationBonusEntitlement: vacation.monetaryValue * 0.13, // Urlaubsgeld-Anteil
    
    winterAllowance: winter.allowance,
    
    dirtyWorkBonus: bonuses.dirtyWork,
    heightWorkBonus: bonuses.heightWork,
    dangerWorkBonus: bonuses.dangerWork,
    totalBonuses: bonuses.total,
    
    totalGross,
    sokaDeductions,
    netAdditions,
    
    details: [
      `=== Baulohn-Abrechnung ===`,
      `Tarifgebiet: ${region === 'west' ? 'West' : 'Ost'}`,
      `Lohngruppe: ${tradeGroupNames[tradeGroup]}`,
      `Stundenlohn: ${formatCurrency(hourlyRate)}/h`,
      `Arbeitsstunden: ${hoursWorked}h`,
      ``,
      `=== SOKA-BAU ===`,
      ...soka.details,
      ``,
      `=== Urlaubskasse ===`,
      ...vacation.details,
      ``,
      `=== Winterbeschäftigung ===`,
      ...winter.details,
      ``,
      `=== Zulagen ===`,
      ...bonuses.details,
      ``,
      `=== Gesamt ===`,
      `Grundgehalt: ${formatCurrency(grossMonthly)}`,
      `+ Zulagen: ${formatCurrency(bonuses.total)}`,
      `+ Wintergeld: ${formatCurrency(winter.allowance)}`,
      `= Brutto gesamt: ${formatCurrency(totalGross)}`,
    ],
  };
}

/**
 * Ermittelt den Tarifstundenlohn
 */
export function getTariffHourlyRate(
  region: ConstructionRegion,
  tradeGroup: ConstructionTradeGroup
): number {
  return HOURLY_RATES[region][tradeGroup];
}

// Hilfsfunktion
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
