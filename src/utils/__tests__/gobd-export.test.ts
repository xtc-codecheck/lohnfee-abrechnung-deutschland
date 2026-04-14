import { describe, it, expect } from 'vitest';
import {
  generateGDPdUIndexXml,
  generateEmployeeCSV,
  generatePayrollCSV,
  generateJournalCSV,
  generateExportProtocol,
  calculateChecksum,
  GoBDExportConfig,
} from '../gobd-export';

const config: GoBDExportConfig = {
  companyName: 'Test GmbH',
  taxNumber: '123/456/78901',
  betriebsnummer: '12345678',
  exportYear: 2025,
  exportMonthFrom: 1,
  exportMonthTo: 12,
  createdBy: 'admin',
};

describe('GoBD-Export', () => {
  it('sollte gültige GDPdU index.xml generieren', () => {
    const xml = generateGDPdUIndexXml(config);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('urn:ftdata-de:gdpdu:v2');
    expect(xml).toContain('Test GmbH');
    expect(xml).toContain('stammdaten_mitarbeiter.csv');
    expect(xml).toContain('lohnabrechnungen.csv');
    expect(xml).toContain('aenderungsprotokoll.csv');
    expect(xml).toContain('<Version>2.0</Version>');
  });

  it('sollte XML-Sonderzeichen escapen', () => {
    const xmlConfig = { ...config, companyName: 'Test & Co. <GmbH>' };
    const xml = generateGDPdUIndexXml(xmlConfig);
    expect(xml).toContain('Test &amp; Co. &lt;GmbH&gt;');
    expect(xml).not.toContain('Test & Co. <GmbH>');
  });

  it('sollte Mitarbeiter-CSV mit Header generieren', () => {
    const csv = generateEmployeeCSV([
      { personalNumber: '1001', firstName: 'Max', lastName: 'Müller', dateOfBirth: '01.01.1990',
        taxId: '12345678901', svNumber: '12010190A123', taxClass: 1,
        healthInsurance: 'TK', entryDate: '01.01.2020', exitDate: '', department: 'IT', grossSalary: 4000 },
    ]);
    expect(csv.split('\n')).toHaveLength(2);
    expect(csv).toContain('Personalnummer;');
    expect(csv).toContain('"Max"');
    expect(csv).toContain('4000,00');
  });

  it('sollte Payroll-CSV korrekt formatieren', () => {
    const csv = generatePayrollCSV([{
      personalNumber: '1001', employeeName: 'Müller, Max', year: 2025, month: 3,
      grossSalary: 4000, incomeTax: 500, solidarityTax: 27.5, churchTax: 0,
      svHealthEmployee: 320, svHealthEmployer: 320, svPensionEmployee: 372, svPensionEmployer: 372,
      svUnemploymentEmployee: 52, svUnemploymentEmployer: 52, svCareEmployee: 72, svCareEmployer: 52,
      totalTax: 527.5, totalSVEmployee: 816, totalSVEmployer: 796, netSalary: 2656.5,
      employerCosts: 4796, bonus: 0, overtimePay: 0, deductions: 0, finalNetSalary: 2656.5,
    }]);
    expect(csv).toContain('4000,00');
    expect(csv).toContain('527,50');
  });

  it('sollte Journal-CSV mit Escaping generieren', () => {
    const csv = generateJournalCSV([{
      timestamp: '2025-03-15T10:30:00Z',
      userId: 'user-1',
      action: 'UPDATE',
      tableName: 'employees',
      recordId: 'emp-1',
      oldValues: '{"salary": 3000}',
      newValues: '{"salary": 4000}',
    }]);
    expect(csv).toContain('Zeitstempel;');
    expect(csv).toContain('UPDATE');
  });

  it('sollte Prüfsummen berechnen', async () => {
    const hash = await calculateChecksum('test content');
    expect(hash).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('sollte identische Inhalte gleiche Prüfsummen liefern', async () => {
    const h1 = await calculateChecksum('hello world');
    const h2 = await calculateChecksum('hello world');
    expect(h1).toBe(h2);
  });

  it('sollte Exportprotokoll mit Prüfsummen erstellen', () => {
    const protocol = generateExportProtocol(config, {
      'index.xml': 'abc123',
      'stammdaten.csv': 'def456',
    });
    expect(protocol).toContain('GoBD-EXPORTPROTOKOLL');
    expect(protocol).toContain('Test GmbH');
    expect(protocol).toContain('abc123');
    expect(protocol).toContain('def456');
    expect(protocol).toContain('§ 147 Abs. 3 AO');
  });
});
