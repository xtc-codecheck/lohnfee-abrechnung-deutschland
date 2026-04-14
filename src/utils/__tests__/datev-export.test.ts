/**
 * Tests für DATEV-Export Funktionalität
 * 
 * Prüft Header-Generierung, Buchungssatz-Erstellung, SKR03/SKR04-Zuordnung,
 * Validierung und vollständigen CSV-Export.
 */
import { describe, it, expect } from 'vitest';
import {
  createDatevHeader,
  createDatevColumnHeaders,
  generatePayrollBookings,
  generateDatevExport,
  generateSummaryBookings,
  validateDatevConfig,
  getDefaultDatevConfig,
  SKR03_KONTEN,
  SKR04_KONTEN,
  type DatevExportConfig,
} from '@/utils/datev-export';
import type { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import type { Employee } from '@/types/employee';

// ============= Test Fixtures =============

function createTestPeriod(overrides?: Partial<PayrollPeriod>): PayrollPeriod {
  return {
    id: 'period-1',
    year: 2025,
    month: 3,
    startDate: new Date(2025, 2, 1),
    endDate: new Date(2025, 2, 31),
    status: 'finalized',
    createdAt: new Date(),
    ...overrides,
  };
}

function createTestEmployee(overrides?: Partial<Employee>): Employee {
  return {
    id: 'emp-1',
    personalData: {
      firstName: 'Max',
      lastName: 'Mustermann',
      dateOfBirth: new Date(1990, 0, 1),
      address: { street: 'Musterstr. 1', houseNumber: '', postalCode: '10115', city: 'Berlin', state: 'berlin', country: 'DE' },
      taxId: '12345678901',
      taxClass: 'I',
      churchTax: true,
      healthInsurance: { name: 'TK', additionalRate: 1.7 },
      socialSecurityNumber: '12345678A123',
      childAllowances: 0,
      relationshipStatus: 'single',
    },
    employmentData: {
      employmentType: 'fulltime',
      startDate: new Date(2023, 0, 1),
      isFixedTerm: false,
      weeklyHours: 40,
      vacationDays: 30,
      workDays: [],
      department: 'IT',
      position: 'Entwickler',
      contractSigned: true,
      dataRetentionDate: new Date(2033, 0, 1),
    },
    salaryData: {
      grossSalary: 4500,
      salaryType: 'fixed',
      additionalBenefits: {},
      bankingData: { iban: 'DE89370400440532013000', bic: '', bankName: '', accountHolder: 'Max Mustermann' },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Employee;
}

function createTestEntry(overrides?: Partial<PayrollEntry>): PayrollEntry {
  return {
    id: 'entry-1',
    employeeId: 'emp-1',
    payrollPeriodId: 'period-1',
    employee: createTestEmployee(),
    workingData: {
      regularHours: 160, overtimeHours: 5, nightHours: 0, sundayHours: 0,
      holidayHours: 0, vacationDays: 0, sickDays: 0, actualWorkingDays: 22, expectedWorkingDays: 22,
    },
    salaryCalculation: {
      grossSalary: 4500,
      netSalary: 2800,
      taxes: { incomeTax: 600, churchTax: 54, solidarityTax: 33, total: 687 },
      socialSecurityContributions: {
        healthInsurance: { employee: 328.5, employer: 328.5, total: 657 },
        pensionInsurance: { employee: 418.5, employer: 418.5, total: 837 },
        unemploymentInsurance: { employee: 58.5, employer: 58.5, total: 117 },
        careInsurance: { employee: 76.5, employer: 76.5, total: 153 },
        total: { employee: 882, employer: 882, total: 1764 },
      },
      employerCosts: 5382,
    },
    deductions: { unpaidLeave: 0, advancePayments: 0, otherDeductions: 0, total: 0 },
    additions: { overtimePay: 150, nightShiftBonus: 0, sundayBonus: 0, holidayBonus: 0, bonuses: 0, oneTimePayments: 0, expenseReimbursements: 0, total: 150 },
    finalNetSalary: 2800,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PayrollEntry;
}

function createTestConfig(overrides?: Partial<DatevExportConfig>): DatevExportConfig {
  return {
    kontenrahmen: 'SKR03',
    beraterNr: '1234567',
    mandantenNr: '12345',
    wirtschaftsjahrBeginn: new Date(2025, 0, 1),
    sachkontenlaenge: 4,
    exportName: 'Lohnbuchungen',
    ...overrides,
  };
}

// ============= Kontenrahmen-Tests =============

describe('Kontenrahmen-Definitionen', () => {
  it('SKR03 hat korrekte Lohnkonten', () => {
    expect(SKR03_KONTEN.loehneGehalt).toBe('4100');
    expect(SKR03_KONTEN.bank).toBe('1200');
    expect(SKR03_KONTEN.verbindlichkeitenLoehne).toBe('1740');
    expect(SKR03_KONTEN.verbindlichkeitenFinanzamt).toBe('1741');
  });

  it('SKR04 hat korrekte Lohnkonten', () => {
    expect(SKR04_KONTEN.loehneGehalt).toBe('6000');
    expect(SKR04_KONTEN.bank).toBe('1800');
    expect(SKR04_KONTEN.verbindlichkeitenLoehne).toBe('3720');
    expect(SKR04_KONTEN.verbindlichkeitenFinanzamt).toBe('3730');
  });

  it('SKR03 und SKR04 haben gleiche Schlüssel', () => {
    const skr03Keys = Object.keys(SKR03_KONTEN).sort();
    const skr04Keys = Object.keys(SKR04_KONTEN).sort();
    expect(skr03Keys).toEqual(skr04Keys);
  });
});

// ============= Header-Tests =============

describe('createDatevHeader', () => {
  it('erzeugt 31-Felder DATEV-Header gemäß Spezifikation', () => {
    const header = createDatevHeader(createTestConfig(), createTestPeriod());
    expect(header).toHaveLength(31);
    expect(header[0]).toBe('"EXTF"');           // Feld 1: gequotet
    expect(header[1]).toBe('700');              // Feld 2: Versionsnummer
    expect(header[2]).toBe('21');               // Feld 3: Buchungsstapel
    expect(header[3]).toBe('"Buchungsstapel"'); // Feld 4: gequotet
    expect(header[4]).toBe('13');               // Feld 5: Formatversion
    expect(header[7]).toBe('"RE"');             // Feld 8: Herkunft gequotet
    expect(header[8]).toBe('"LohnPro"');        // Feld 9: gequotet
    expect(header[9]).toBe('""');               // Feld 10: leerer gequoteter String
  });

  it('gibt Berater-/Mandantennummer als Zahlen aus (ohne Padding)', () => {
    const config = createTestConfig({ beraterNr: '1234567', mandantenNr: '12345' });
    const header = createDatevHeader(config, createTestPeriod());
    expect(header[10]).toBe('1234567');
    expect(header[11]).toBe('12345');
  });

  it('setzt Datumsbereich der Periode korrekt', () => {
    const header = createDatevHeader(createTestConfig(), createTestPeriod());
    expect(header[14]).toBe('20250301'); // datumVon
    expect(header[15]).toBe('20250331'); // datumBis
  });

  it('enthält Stapelbezeichnung gequotet mit Monat/Jahr', () => {
    const header = createDatevHeader(createTestConfig(), createTestPeriod());
    expect(header[16]).toContain('03/2025');
    expect(header[16]).toMatch(/^".*"$/); // muss gequotet sein
  });

  it('enthält Sachkontenrahmen in Feld 27', () => {
    const header = createDatevHeader(createTestConfig(), createTestPeriod());
    expect(header[26]).toBe('"03"'); // SKR03
  });

  it('setzt SKR04 in Feld 27 bei SKR04-Konfiguration', () => {
    const config = createTestConfig({ kontenrahmen: 'SKR04' });
    const header = createDatevHeader(config, createTestPeriod());
    expect(header[26]).toBe('"04"');
  });

  it('hat korrekte reservierte Felder', () => {
    const header = createDatevHeader(createTestConfig(), createTestPeriod());
    expect(header[6]).toBe('');     // Feld 7: importiert (leer)
    expect(header[22]).toBe('');    // Feld 23: reserviert
    expect(header[23]).toBe('""'); // Feld 24: Derivatskennzeichen
    expect(header[24]).toBe('');    // Feld 25: reserviert
    expect(header[25]).toBe('');    // Feld 26: reserviert
    expect(header[28]).toBe('');    // Feld 29: reserviert
    expect(header[29]).toBe('""'); // Feld 30: reserviert
  });

  it('erzeugt Zeitstempel mit Millisekunden (Feld 6)', () => {
    const header = createDatevHeader(createTestConfig(), createTestPeriod());
    // Format: YYYYMMDDHHMMSSfff = 17 Zeichen
    expect(header[5]).toMatch(/^\d{17}$/);
  });
});

// ============= Spaltenüberschriften =============

describe('createDatevColumnHeaders', () => {
  it('erzeugt korrekte Spaltenanzahl', () => {
    const headers = createDatevColumnHeaders();
    expect(headers.length).toBe(28);
  });

  it('beginnt mit Umsatz-Spalte', () => {
    const headers = createDatevColumnHeaders();
    expect(headers[0]).toBe('Umsatz (ohne Soll/Haben-Kz)');
    expect(headers[1]).toBe('Soll/Haben-Kennzeichen');
  });
});

// ============= Buchungssätze =============

describe('generatePayrollBookings', () => {
  const config = createTestConfig();
  const periode = createTestPeriod();
  const entry = createTestEntry();

  it('erzeugt Bruttolohn-Buchung als erste Buchung (Soll)', () => {
    const bookings = generatePayrollBookings(entry, config, periode);
    expect(bookings.length).toBeGreaterThanOrEqual(1);
    
    const bruttoBuchung = bookings[0];
    expect(bruttoBuchung[0]).toBe('4500,00'); // Betrag
    expect(bruttoBuchung[1]).toBe('S');        // Soll
    expect(bruttoBuchung[6]).toBe('4100');     // SKR03 Löhne
    expect(bruttoBuchung[7]).toBe('1740');     // Verbindlichkeiten
  });

  it('erzeugt Überstunden-Buchung wenn vorhanden', () => {
    const bookings = generatePayrollBookings(entry, config, periode);
    const ueberstunden = bookings.find(b => b[13]?.includes('Überstunden'));
    expect(ueberstunden).toBeDefined();
    expect(ueberstunden![0]).toBe('150,00');
  });

  it('erzeugt keine Überstunden-Buchung wenn 0', () => {
    const entryOhne = createTestEntry({
      additions: { overtimePay: 0, nightShiftBonus: 0, sundayBonus: 0, holidayBonus: 0, bonuses: 0, oneTimePayments: 0, expenseReimbursements: 0, total: 0 },
    });
    const bookings = generatePayrollBookings(entryOhne, config, periode);
    const ueberstunden = bookings.find(b => b[13]?.includes('Überstunden'));
    expect(ueberstunden).toBeUndefined();
  });

  it('erzeugt Lohnsteuer-Buchung', () => {
    const bookings = generatePayrollBookings(entry, config, periode);
    const lst = bookings.find(b => b[13]?.includes('LSt'));
    expect(lst).toBeDefined();
    expect(lst![0]).toBe('600,00');
    expect(lst![6]).toBe('1740'); // Von Verbindlichkeiten Löhne
    expect(lst![7]).toBe('1741'); // An Verbindlichkeiten Finanzamt
  });

  it('erzeugt Kirchensteuer-Buchung', () => {
    const bookings = generatePayrollBookings(entry, config, periode);
    const kist = bookings.find(b => b[13]?.includes('KiSt'));
    expect(kist).toBeDefined();
    expect(kist![0]).toBe('54,00');
  });

  it('erzeugt keine Kirchensteuer-Buchung wenn 0', () => {
    const entryOhne = createTestEntry();
    entryOhne.salaryCalculation.taxes.churchTax = 0;
    const bookings = generatePayrollBookings(entryOhne, config, periode);
    const kist = bookings.find(b => b[13]?.includes('KiSt'));
    expect(kist).toBeUndefined();
  });

  it('erzeugt SV-AG-Buchungen mit Kostenstelle', () => {
    const bookings = generatePayrollBookings(entry, config, periode);
    const kvAg = bookings.find(b => b[13]?.includes('KV-AG'));
    expect(kvAg).toBeDefined();
    expect(kvAg![6]).toBe('4138'); // SKR03 KV-AG
    expect(kvAg![22]).toBe('IT');  // Kostenstelle = Department
  });

  it('erzeugt Nettolohn-Buchung als letzte Buchung', () => {
    const bookings = generatePayrollBookings(entry, config, periode);
    const netto = bookings[bookings.length - 1];
    expect(netto[13]).toContain('Netto');
    expect(netto[0]).toBe('2800,00');
    expect(netto[6]).toBe('1740'); // Verbindlichkeiten Löhne
    expect(netto[7]).toBe('1200'); // Bank SKR03
  });

  it('verwendet SKR04-Konten wenn konfiguriert', () => {
    const skr04Config = createTestConfig({ kontenrahmen: 'SKR04' });
    const bookings = generatePayrollBookings(entry, skr04Config, periode);
    
    const bruttoBuchung = bookings[0];
    expect(bruttoBuchung[6]).toBe('6000'); // SKR04 Löhne
    expect(bruttoBuchung[7]).toBe('3720'); // SKR04 Verbindlichkeiten
    
    const netto = bookings[bookings.length - 1];
    expect(netto[7]).toBe('1800'); // SKR04 Bank
  });

  it('erzeugt Belegdatum im Format DDMM', () => {
    const bookings = generatePayrollBookings(entry, config, periode);
    expect(bookings[0][9]).toBe('3103'); // 31.03
  });

  it('kürzt Buchungstext auf max 60 Zeichen', () => {
    const longNameEmployee = createTestEmployee();
    longNameEmployee.personalData.lastName = 'Sehr-Langer-Nachname-Der-Über-Sechzig-Zeichen-Hinausgeht-XYZ';
    const entryLong = createTestEntry({ employee: longNameEmployee });
    
    const bookings = generatePayrollBookings(entryLong, config, periode);
    for (const booking of bookings) {
      expect(booking[13].length).toBeLessThanOrEqual(60);
    }
  });

  it('formatiert Beträge mit Komma als Dezimaltrennzeichen', () => {
    const bookings = generatePayrollBookings(entry, config, periode);
    for (const booking of bookings) {
      expect(booking[0]).toMatch(/^\d+,\d{2}$/);
    }
  });
});

// ============= Summen-Buchungen =============

describe('generateSummaryBookings', () => {
  it('erzeugt Sammelüberweisungen für LSt, SV und KK', () => {
    const entries = [createTestEntry()];
    const config = createTestConfig();
    const periode = createTestPeriod();
    
    const summaries = generateSummaryBookings(entries, config, periode);
    expect(summaries.length).toBe(3); // LSt, RV+ALV, KV+PV
    
    const lstBuchung = summaries.find(s => s[13].includes('Lohnsteuer'));
    expect(lstBuchung).toBeDefined();
    expect(lstBuchung![7]).toBe('1200'); // an Bank
    
    const svBuchung = summaries.find(s => s[13].includes('RV+ALV'));
    expect(svBuchung).toBeDefined();
    
    const kvBuchung = summaries.find(s => s[13].includes('KV+PV'));
    expect(kvBuchung).toBeDefined();
  });

  it('summiert über mehrere Mitarbeiter', () => {
    const entry1 = createTestEntry();
    const entry2 = createTestEntry({ id: 'entry-2', employeeId: 'emp-2' });
    const entries = [entry1, entry2];
    
    const summaries = generateSummaryBookings(entries, createTestConfig(), createTestPeriod());
    const lstBuchung = summaries.find(s => s[13].includes('Lohnsteuer'));
    
    // Doppelte LSt: 600 + 33 + 54 = 687 × 2 = 1374
    expect(lstBuchung![0]).toBe('1374,00');
  });
});

// ============= Vollständiger Export =============

describe('generateDatevExport', () => {
  it('erzeugt CSV mit Header, Spaltenüberschriften und Buchungen', () => {
    const csv = generateDatevExport([createTestEntry()], createTestPeriod(), createTestConfig());
    const lines = csv.split('\r\n');
    
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines[0]).toContain('EXTF'); // Header
    expect(lines[1]).toContain('Umsatz'); // Spaltenüberschriften
    expect(lines[2]).toContain('4500,00'); // Erste Buchung
  });

  it('verwendet Windows-Zeilenumbrüche (\\r\\n)', () => {
    const csv = generateDatevExport([createTestEntry()], createTestPeriod(), createTestConfig());
    expect(csv).toContain('\r\n');
    expect(csv.split('\r\n').length).toBeGreaterThan(1);
  });

  it('trennt Felder mit Semikolon', () => {
    const csv = generateDatevExport([createTestEntry()], createTestPeriod(), createTestConfig());
    const firstLine = csv.split('\r\n')[0];
    expect(firstLine).toContain(';');
  });
});

// ============= Validierung =============

describe('validateDatevConfig', () => {
  it('gibt leeres Array für gültige Konfiguration', () => {
    expect(validateDatevConfig(createTestConfig())).toEqual([]);
  });

  it('meldet Beraternummer außerhalb des Bereichs', () => {
    const errors = validateDatevConfig(createTestConfig({ beraterNr: '' }));
    expect(errors.some(e => e.includes('Beraternummer'))).toBe(true);
  });

  it('meldet Mandantennummer außerhalb des Bereichs', () => {
    const errors = validateDatevConfig(createTestConfig({ mandantenNr: '' }));
    expect(errors.some(e => e.includes('Mandantennummer'))).toBe(true);
  });

  it('meldet ungültige Sachkontenlänge', () => {
    const errors = validateDatevConfig(createTestConfig({ sachkontenlaenge: 3 as any }));
    expect(errors.some(e => e.includes('Sachkontenlänge'))).toBe(true);
  });

  it('validiert Beraternummer-Bereich (1001-9999999)', () => {
    expect(validateDatevConfig(createTestConfig({ beraterNr: '1000' }))).not.toEqual([]);
    expect(validateDatevConfig(createTestConfig({ beraterNr: '1001' }))).toEqual([]);
    expect(validateDatevConfig(createTestConfig({ beraterNr: '9999999' }))).toEqual([]);
    expect(validateDatevConfig(createTestConfig({ beraterNr: '10000000' }))).not.toEqual([]);
  });
});

// ============= Default-Konfiguration =============

describe('getDefaultDatevConfig', () => {
  it('gibt gültige Standardkonfiguration zurück', () => {
    const config = getDefaultDatevConfig();
    expect(config.kontenrahmen).toBe('SKR03');
    expect(config.sachkontenlaenge).toBe(4);
    expect(validateDatevConfig(config)).toEqual([]);
  });
});
