// Pflege-/Schichtdienst Lohnabrechnung 2025
// SFN-Zuschläge, Schichtmodelle, Bereitschaftsdienst

export type ShiftType = 'early' | 'late' | 'night' | 'split';
export type CareLevel = 'assistant' | 'nurse' | 'specialist' | 'lead';

export interface NursingPayrollParams {
  grossMonthly: number;
  hoursWorked: number;
  careLevel: CareLevel;
  
  // Schichtarbeit
  shifts: ShiftEntry[];
  
  // Bereitschaftsdienst
  onCallHours?: number;
  onCallRate?: number; // Prozent des Stundenlohns
  
  // Besondere Dienste
  weekendDays?: number;
  holidayDays?: number;
}

export interface ShiftEntry {
  date: Date;
  type: ShiftType;
  hours: number;
  nightHours: number; // Anteil Nachtarbeit
  sundayHours: number;
  holidayHours: number;
}

export interface NursingPayrollResult {
  // Grundgehalt
  baseGross: number;
  hourlyRate: number;
  
  // SFN-Zuschläge
  nightBonus: number;
  sundayBonus: number;
  holidayBonus: number;
  christmasBonus: number;
  totalSfnBonuses: number;
  
  // Schichtzulagen
  shiftAllowance: number;
  
  // Bereitschaft
  onCallPay: number;
  
  // Gesamt
  totalGross: number;
  taxFreeAmount: number;
  taxableAmount: number;
  
  // Schicht-Übersicht
  shiftSummary: {
    earlyShifts: number;
    lateShifts: number;
    nightShifts: number;
    totalNightHours: number;
    totalSundayHours: number;
    totalHolidayHours: number;
  };
  
  details: string[];
}

// Steuerfreie Zuschlagssätze nach § 3b EStG
const SFN_RATES = {
  night_20_06: 0.25, // 25% für Nachtarbeit (20-6 Uhr)
  night_00_04: 0.40, // 40% für Nachtarbeit (0-4 Uhr)
  sunday: 0.50, // 50% für Sonntagsarbeit
  holiday: 1.25, // 125% für Feiertage
  christmas_eve: 1.50, // 150% für 24.12. ab 14 Uhr, 25./26.12.
  new_years_eve: 1.50, // 150% für 31.12. ab 14 Uhr
  may_first: 1.50, // 150% für 1. Mai
};

// Maximaler Grundlohn für steuerfreie Zuschläge
const SFN_GRUNDLOHN_LIMIT = 50;

// Schichtzulagen (tarifabhängig, hier Durchschnitt)
const SHIFT_ALLOWANCES = {
  early: 0, // Frühschicht meist ohne Zulage
  late: 1.50, // Spätschicht ca. 1,50€/h
  night: 3.00, // Nachtschicht ca. 3,00€/h
  split: 2.00, // Geteilter Dienst ca. 2,00€/h
};

// Stundenlöhne nach Qualifikation (TVöD-P Orientierung 2025)
const HOURLY_RATES: Record<CareLevel, number> = {
  assistant: 16.00,
  nurse: 19.50,
  specialist: 22.00,
  lead: 25.00,
};

/**
 * Berechnet SFN-Zuschläge für die Pflege
 */
export function calculateSfnBonuses(
  hourlyRate: number,
  nightHours: number,
  sundayHours: number,
  holidayHours: number,
  christmasHours: number = 0
): {
  night: number;
  sunday: number;
  holiday: number;
  christmas: number;
  total: number;
  taxFree: number;
  details: string[];
} {
  // Grundlohn auf 50€/h begrenzen
  const cappedRate = Math.min(hourlyRate, SFN_GRUNDLOHN_LIMIT);
  
  // Durchschnittlicher Nachtzuschlag (Mischkalkulation 25%/40%)
  const avgNightRate = 0.30; // Vereinfacht 30%
  
  const nightBonus = nightHours * cappedRate * avgNightRate;
  const sundayBonus = sundayHours * cappedRate * SFN_RATES.sunday;
  const holidayBonus = holidayHours * cappedRate * SFN_RATES.holiday;
  const christmasBonus = christmasHours * cappedRate * SFN_RATES.christmas_eve;
  
  const total = nightBonus + sundayBonus + holidayBonus + christmasBonus;
  const taxFree = hourlyRate <= SFN_GRUNDLOHN_LIMIT ? total : 0;
  
  const details: string[] = [];
  
  if (nightHours > 0) {
    details.push(`Nachtzuschlag: ${nightHours}h × 30% × ${formatCurrency(cappedRate)} = ${formatCurrency(nightBonus)}`);
  }
  if (sundayHours > 0) {
    details.push(`Sonntagszuschlag: ${sundayHours}h × 50% × ${formatCurrency(cappedRate)} = ${formatCurrency(sundayBonus)}`);
  }
  if (holidayHours > 0) {
    details.push(`Feiertagszuschlag: ${holidayHours}h × 125% × ${formatCurrency(cappedRate)} = ${formatCurrency(holidayBonus)}`);
  }
  if (christmasHours > 0) {
    details.push(`Weihnachtszuschlag: ${christmasHours}h × 150% × ${formatCurrency(cappedRate)} = ${formatCurrency(christmasBonus)}`);
  }
  
  if (hourlyRate <= SFN_GRUNDLOHN_LIMIT) {
    details.push(`✅ Alle SFN-Zuschläge steuerfrei (§ 3b EStG)`);
  } else {
    details.push(`⚠️ Stundenlohn > ${formatCurrency(SFN_GRUNDLOHN_LIMIT)}: Zuschläge teilweise steuerpflichtig`);
  }
  
  return {
    night: nightBonus,
    sunday: sundayBonus,
    holiday: holidayBonus,
    christmas: christmasBonus,
    total,
    taxFree,
    details,
  };
}

/**
 * Berechnet Schichtzulagen
 */
export function calculateShiftAllowances(shifts: ShiftEntry[]): {
  total: number;
  byType: Record<ShiftType, { hours: number; amount: number }>;
  details: string[];
} {
  const byType: Record<ShiftType, { hours: number; amount: number }> = {
    early: { hours: 0, amount: 0 },
    late: { hours: 0, amount: 0 },
    night: { hours: 0, amount: 0 },
    split: { hours: 0, amount: 0 },
  };
  
  shifts.forEach(shift => {
    byType[shift.type].hours += shift.hours;
    byType[shift.type].amount += shift.hours * SHIFT_ALLOWANCES[shift.type];
  });
  
  const total = Object.values(byType).reduce((sum, t) => sum + t.amount, 0);
  
  const shiftNames: Record<ShiftType, string> = {
    early: 'Frühschicht',
    late: 'Spätschicht',
    night: 'Nachtschicht',
    split: 'Geteilter Dienst',
  };
  
  const details = Object.entries(byType)
    .filter(([_, data]) => data.hours > 0)
    .map(([type, data]) => 
      `${shiftNames[type as ShiftType]}: ${data.hours}h × ${formatCurrency(SHIFT_ALLOWANCES[type as ShiftType])} = ${formatCurrency(data.amount)}`
    );
  
  return { total, byType, details };
}

/**
 * Berechnet Bereitschaftsdienst-Vergütung
 */
export function calculateOnCallPay(
  hourlyRate: number,
  onCallHours: number,
  onCallRate: number = 25 // 25% des Stundenlohns
): {
  amount: number;
  effectiveHourlyRate: number;
  details: string[];
} {
  const effectiveHourlyRate = hourlyRate * (onCallRate / 100);
  const amount = onCallHours * effectiveHourlyRate;
  
  return {
    amount,
    effectiveHourlyRate,
    details: [
      `Bereitschaftsstunden: ${onCallHours}h`,
      `Vergütungssatz: ${onCallRate}% von ${formatCurrency(hourlyRate)} = ${formatCurrency(effectiveHourlyRate)}/h`,
      `Bereitschaftsvergütung: ${formatCurrency(amount)}`,
    ],
  };
}

/**
 * Hauptberechnung Pflege-Lohn
 */
export function calculateNursingPayroll(params: NursingPayrollParams): NursingPayrollResult {
  const {
    grossMonthly,
    hoursWorked,
    careLevel,
    shifts,
    onCallHours = 0,
    onCallRate = 25,
  } = params;
  
  const hourlyRate = HOURLY_RATES[careLevel];
  
  // Schicht-Zusammenfassung
  const shiftSummary = {
    earlyShifts: shifts.filter(s => s.type === 'early').length,
    lateShifts: shifts.filter(s => s.type === 'late').length,
    nightShifts: shifts.filter(s => s.type === 'night').length,
    totalNightHours: shifts.reduce((sum, s) => sum + s.nightHours, 0),
    totalSundayHours: shifts.reduce((sum, s) => sum + s.sundayHours, 0),
    totalHolidayHours: shifts.reduce((sum, s) => sum + s.holidayHours, 0),
  };
  
  // SFN-Zuschläge
  const sfn = calculateSfnBonuses(
    hourlyRate,
    shiftSummary.totalNightHours,
    shiftSummary.totalSundayHours,
    shiftSummary.totalHolidayHours
  );
  
  // Schichtzulagen
  const shiftAllowances = calculateShiftAllowances(shifts);
  
  // Bereitschaftsdienst
  const onCall = calculateOnCallPay(hourlyRate, onCallHours, onCallRate);
  
  // Gesamt
  const totalGross = grossMonthly + sfn.total + shiftAllowances.total + onCall.amount;
  const taxFreeAmount = sfn.taxFree;
  const taxableAmount = totalGross - taxFreeAmount;
  
  const careLevelNames: Record<CareLevel, string> = {
    assistant: 'Pflegehilfskraft',
    nurse: 'Pflegefachkraft',
    specialist: 'Fachkrankenpfleger/in',
    lead: 'Stationsleitung',
  };
  
  const details: string[] = [
    `=== Pflege-Lohnabrechnung ===`,
    ``,
    `Qualifikation: ${careLevelNames[careLevel]}`,
    `Stundenlohn (TVöD-P): ${formatCurrency(hourlyRate)}`,
    `Arbeitsstunden: ${hoursWorked}h`,
    `Grundgehalt: ${formatCurrency(grossMonthly)}`,
    ``,
    `=== Schichtübersicht ===`,
    `Frühschichten: ${shiftSummary.earlyShifts}`,
    `Spätschichten: ${shiftSummary.lateShifts}`,
    `Nachtschichten: ${shiftSummary.nightShifts}`,
    ``,
    `=== SFN-Zuschläge (§ 3b EStG) ===`,
    ...sfn.details,
    ``,
    `=== Schichtzulagen ===`,
    ...shiftAllowances.details,
    `Schichtzulagen gesamt: ${formatCurrency(shiftAllowances.total)}`,
  ];
  
  if (onCallHours > 0) {
    details.push(``, `=== Bereitschaftsdienst ===`, ...onCall.details);
  }
  
  details.push(
    ``,
    `=== Zusammenfassung ===`,
    `Grundgehalt: ${formatCurrency(grossMonthly)}`,
    `+ SFN-Zuschläge: ${formatCurrency(sfn.total)}`,
    `+ Schichtzulagen: ${formatCurrency(shiftAllowances.total)}`,
    `+ Bereitschaft: ${formatCurrency(onCall.amount)}`,
    `= Brutto gesamt: ${formatCurrency(totalGross)}`,
    ``,
    `Steuerfrei: ${formatCurrency(taxFreeAmount)}`,
    `Steuerpflichtig: ${formatCurrency(taxableAmount)}`,
  );
  
  return {
    baseGross: grossMonthly,
    hourlyRate,
    
    nightBonus: sfn.night,
    sundayBonus: sfn.sunday,
    holidayBonus: sfn.holiday,
    christmasBonus: sfn.christmas,
    totalSfnBonuses: sfn.total,
    
    shiftAllowance: shiftAllowances.total,
    onCallPay: onCall.amount,
    
    totalGross,
    taxFreeAmount,
    taxableAmount,
    
    shiftSummary,
    details,
  };
}

/**
 * Generiert einen Schichtplan für den Monat
 */
export function generateMonthlyShiftPlan(
  month: number,
  year: number,
  shiftPattern: ShiftType[]
): ShiftEntry[] {
  const shifts: ShiftEntry[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const isSunday = dayOfWeek === 0;
    const isHoliday = false; // Vereinfacht - müsste gegen Feiertagsliste geprüft werden
    
    // Rotierendes Schichtmuster
    const shiftType = shiftPattern[(day - 1) % shiftPattern.length];
    
    let hours = 8;
    let nightHours = 0;
    let sundayHours = 0;
    
    // Nachtschicht-Stunden
    if (shiftType === 'night') {
      nightHours = 8; // Vereinfacht: alle Stunden als Nachtstunden
    }
    
    // Sonntagsstunden
    if (isSunday) {
      sundayHours = hours;
    }
    
    shifts.push({
      date,
      type: shiftType,
      hours,
      nightHours,
      sundayHours,
      holidayHours: isHoliday ? hours : 0,
    });
  }
  
  return shifts;
}

// Hilfsfunktion
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
