/**
 * Tests für separate DATEV-/FiBu-Buchungssätze pro Lohnart (P4)
 */
import { describe, it, expect } from 'vitest';
import {
  generatePayrollBookings,
  SKR03_KONTEN,
  SKR04_KONTEN,
  type DatevExportConfig,
} from '@/utils/datev-export';
import { generateBuchungenForEntry } from '@/utils/fibu-booking';
import type { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import type { Employee } from '@/types/employee';
import type { WageTypeLineItem } from '@/utils/wage-types-integration';

function emp(): Employee {
  return {
    id: 'emp-1',
    personalData: {
      firstName: 'Max', lastName: 'Mustermann',
      dateOfBirth: new Date(1990, 0, 1),
      address: { street: '', houseNumber: '', postalCode: '10115', city: 'Berlin', state: 'berlin', country: 'DE' },
      taxId: '12345678901', taxClass: 'I', churchTax: false,
      healthInsurance: { name: 'TK', additionalRate: 1.7 },
      socialSecurityNumber: '12345678A123', childAllowances: 0, relationshipStatus: 'single',
    },
    employmentData: {
      employmentType: 'fulltime', startDate: new Date(2023, 0, 1), isFixedTerm: false,
      weeklyHours: 40, vacationDays: 30, workDays: [], department: 'IT', position: 'Dev',
      contractSigned: true, dataRetentionDate: new Date(2033, 0, 1),
    },
    salaryData: {
      grossSalary: 4500, salaryType: 'fixed', additionalBenefits: {},
      bankingData: { iban: 'DE89370400440532013000', bic: '', bankName: '', accountHolder: 'Max' },
    },
    createdAt: new Date(), updatedAt: new Date(),
  } as Employee;
}

function entry(overrides?: Partial<PayrollEntry>): PayrollEntry {
  return {
    id: 'entry-1', employeeId: 'emp-1', payrollPeriodId: 'p-1', employee: emp(),
    workingData: { regularHours: 160, overtimeHours: 0, nightHours: 0, sundayHours: 0, holidayHours: 0, vacationDays: 0, sickDays: 0, actualWorkingDays: 22, expectedWorkingDays: 22 },
    salaryCalculation: {
      grossSalary: 4500, netSalary: 2800,
      taxes: { incomeTax: 600, churchTax: 0, solidarityTax: 0, total: 600 },
      socialSecurityContributions: {
        healthInsurance: { employee: 0, employer: 0, total: 0 },
        pensionInsurance: { employee: 0, employer: 0, total: 0 },
        unemploymentInsurance: { employee: 0, employer: 0, total: 0 },
        careInsurance: { employee: 0, employer: 0, total: 0 },
        total: { employee: 0, employer: 0, total: 0 },
      },
      employerCosts: 4500,
    },
    deductions: { unpaidLeave: 0, advancePayments: 0, otherDeductions: 0, total: 0 },
    additions: { overtimePay: 0, nightShiftBonus: 0, sundayBonus: 0, holidayBonus: 0, bonuses: 0, oneTimePayments: 0, expenseReimbursements: 0, total: 0 },
    finalNetSalary: 2800, createdAt: new Date(), updatedAt: new Date(), ...overrides,
  } as PayrollEntry;
}

const period: PayrollPeriod = {
  id: 'p-1', year: 2025, month: 3,
  startDate: new Date(2025, 2, 1), endDate: new Date(2025, 2, 31),
  status: 'finalized', createdAt: new Date(),
};

const cfg: DatevExportConfig = {
  kontenrahmen: 'SKR03', beraterNr: '1234567', mandantenNr: '12345',
  wirtschaftsjahrBeginn: new Date(2025, 0, 1), sachkontenlaenge: 4, exportName: 'Lohn',
  umlagen: { u1Rate: 0, u2Rate: 0, insolvenzgeldRate: 0 },
};

const liVWL: WageTypeLineItem = {
  code: 'VWL', name: 'Vermögenswirksame Leistungen', category: 'vwl',
  amount: 40, effect: 'gross_taxable', account: '4140',
};
const liFahrt: WageTypeLineItem = {
  code: 'FAHRT', name: 'Fahrtkostenzuschuss', category: 'zuschuss',
  amount: 100, effect: 'pauschal', account: '4145',
  pauschalTaxRate: 15, pauschalTaxAmount: 15,
};
const liSach: WageTypeLineItem = {
  code: 'SACH50', name: '50€-Sachbezug', category: 'sachbezug',
  amount: 50, effect: 'in_kind', account: '4150',
};
const liPfand: WageTypeLineItem = {
  code: 'PFAND', name: 'Pfändung', category: 'pfaendung',
  amount: 200, effect: 'net_deduction', account: '1755',
};

describe('DATEV — Lohnart-Buchungen', () => {
  it('erzeugt eine Buchung pro Lohnart auf das Lohnart-Konto', () => {
    const bookings = generatePayrollBookings(
      entry({ wageTypeLineItems: [liVWL, liFahrt] }),
      cfg, period
    );
    // Konto-Spalte ist Index 6 in createBookingLine
    const konten = bookings.map(b => b[6]);
    expect(konten).toContain('4140'); // VWL
    expect(konten).toContain('4145'); // FAHRT (Auszahlung + Pausch.LSt)
  });

  it('Sachbezug erzeugt Brutto-Aufwand UND Netto-Abzug (2 Zeilen)', () => {
    const bookings = generatePayrollBookings(
      entry({ wageTypeLineItems: [liSach] }),
      cfg, period
    );
    const sachBookings = bookings.filter(b => b[6] === '4150' || b[7] === '4150');
    expect(sachBookings.length).toBe(2);
    // Erste: Soll 4150 (Aufwand) gegen Verb. Löhne
    expect(sachBookings[0][6]).toBe('4150');
    expect(sachBookings[0][7]).toBe(SKR03_KONTEN.verbindlichkeitenLoehne);
    // Zweite: Soll Verb. Löhne gegen 4150 (Netto-Abzug)
    expect(sachBookings[1][6]).toBe(SKR03_KONTEN.verbindlichkeitenLoehne);
    expect(sachBookings[1][7]).toBe('4150');
  });

  it('Pauschalsteuer-Lohnart bucht Pausch.LSt-Betrag separat ans Finanzamt', () => {
    const bookings = generatePayrollBookings(
      entry({ wageTypeLineItems: [liFahrt] }),
      cfg, period
    );
    const pauschal = bookings.find(b => b[13]?.startsWith('Pausch.LSt'));
    expect(pauschal).toBeDefined();
    expect(pauschal![0]).toBe('15,00');
    expect(pauschal![6]).toBe('4145'); // Soll Aufwandskonto Lohnart
    expect(pauschal![7]).toBe(SKR03_KONTEN.pauschalsteuerAbfuehrung);
  });

  it('Pfändung bucht Verb. Löhne an Lohnart-Konto', () => {
    const bookings = generatePayrollBookings(
      entry({ wageTypeLineItems: [liPfand] }),
      cfg, period
    );
    const pfandBuchung = bookings.find(b => b[7] === '1755');
    expect(pfandBuchung).toBeDefined();
    expect(pfandBuchung![0]).toBe('200,00');
    expect(pfandBuchung![6]).toBe(SKR03_KONTEN.verbindlichkeitenLoehne);
  });

  it('SKR04 nutzt SKR04-Verbindlichkeitskonto', () => {
    const bookings = generatePayrollBookings(
      entry({ wageTypeLineItems: [liVWL] }),
      { ...cfg, kontenrahmen: 'SKR04' }, period
    );
    const vwl = bookings.find(b => b[6] === '4140'); // Lohnart-Konto bleibt wie konfiguriert
    expect(vwl).toBeDefined();
    expect(vwl![7]).toBe(SKR04_KONTEN.verbindlichkeitenLoehne);
  });

  it('keine Lohnarten → keine zusätzlichen Buchungen', () => {
    const without = generatePayrollBookings(entry(), cfg, period).length;
    const withEmpty = generatePayrollBookings(entry({ wageTypeLineItems: [] }), cfg, period).length;
    expect(withEmpty).toBe(without);
  });
});

describe('FiBu — Lohnart-Buchungen', () => {
  it('erzeugt FibuBuchung pro Lohnart mit Kategorie "lohnart"', () => {
    const buchungen = generateBuchungenForEntry(
      entry({ wageTypeLineItems: [liVWL, liFahrt] }),
      'SKR03', '03/2025', 1
    );
    const lohnartBuchungen = buchungen.filter(b => b.kategorie === 'lohnart');
    expect(lohnartBuchungen.length).toBeGreaterThanOrEqual(2);
    expect(lohnartBuchungen.some(b => b.sollKonto === '4140')).toBe(true);
    expect(lohnartBuchungen.some(b => b.sollKonto === '4145')).toBe(true);
  });

  it('FiBu erzeugt separate Pauschalsteuer-Buchung mit Kategorie "pauschalsteuer"', () => {
    const buchungen = generateBuchungenForEntry(
      entry({ wageTypeLineItems: [liFahrt] }),
      'SKR03', '03/2025', 1
    );
    const pauschal = buchungen.find(b => b.kategorie === 'pauschalsteuer');
    expect(pauschal).toBeDefined();
    expect(pauschal!.betrag).toBe(15);
    expect(pauschal!.habenKonto).toBe(SKR03_KONTEN.lohnsteuerAbfuehrung);
  });
});