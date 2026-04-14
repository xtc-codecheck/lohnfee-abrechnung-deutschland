/**
 * GoBD-konformer Datenexport für Betriebsprüfungen
 * 
 * Implementiert den Export gemäß:
 * - GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern)
 * - GDPdU (Grundsätze zum Datenzugriff und zur Prüfbarkeit digitaler Unterlagen)
 * - § 147 AO (Aufbewahrungspflichten)
 * 
 * Exportformat: index.xml + CSV-Dateien (GDPdU-Beschreibungsstandard V2)
 */

export interface GoBDExportConfig {
  companyName: string;
  taxNumber: string;
  betriebsnummer: string;
  exportYear: number;
  exportMonthFrom: number;
  exportMonthTo: number;
  createdBy: string;
}

export interface GoBDEmployeeRecord {
  personalNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  taxId: string;
  svNumber: string;
  taxClass: number;
  healthInsurance: string;
  entryDate: string;
  exitDate: string;
  department: string;
  grossSalary: number;
}

export interface GoBDPayrollRecord {
  personalNumber: string;
  employeeName: string;
  year: number;
  month: number;
  grossSalary: number;
  incomeTax: number;
  solidarityTax: number;
  churchTax: number;
  svHealthEmployee: number;
  svHealthEmployer: number;
  svPensionEmployee: number;
  svPensionEmployer: number;
  svUnemploymentEmployee: number;
  svUnemploymentEmployer: number;
  svCareEmployee: number;
  svCareEmployer: number;
  totalTax: number;
  totalSVEmployee: number;
  totalSVEmployer: number;
  netSalary: number;
  employerCosts: number;
  bonus: number;
  overtimePay: number;
  deductions: number;
  finalNetSalary: number;
}

export interface GoBDJournalRecord {
  timestamp: string;
  userId: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValues: string;
  newValues: string;
}

/**
 * Erstellt die GDPdU index.xml Beschreibungsdatei
 */
export function generateGDPdUIndexXml(config: GoBDExportConfig): string {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<DataSet xmlns="urn:ftdata-de:gdpdu:v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Version>2.0</Version>
  <DataSupplier>
    <Name>${escapeXml(config.companyName)}</Name>
    <Location>${escapeXml(config.taxNumber)}</Location>
    <Comment>GoBD-Export LohnPro – Betriebsnummer: ${escapeXml(config.betriebsnummer)}</Comment>
  </DataSupplier>
  <Media>
    <Name>LohnPro Lohndaten ${config.exportYear}</Name>
    <Table>
      <Name>Stammdaten_Mitarbeiter</Name>
      <URL>stammdaten_mitarbeiter.csv</URL>
      <DecimalSymbol>,</DecimalSymbol>
      <DigitGroupingSymbol>.</DigitGroupingSymbol>
      <Encoding>UTF-8</Encoding>
      <Range>
        <From>${config.exportYear}-${String(config.exportMonthFrom).padStart(2, '0')}-01</From>
        <To>${config.exportYear}-${String(config.exportMonthTo).padStart(2, '0')}-31</To>
      </Range>
      <VariableLength>
        <ColumnDelimiter>;</ColumnDelimiter>
        <RecordDelimiter>&#10;</RecordDelimiter>
        <TextEncapsulator>"</TextEncapsulator>
        <VariablePrimaryKey>
          <Name>Personalnummer</Name>
        </VariablePrimaryKey>
        <VariableColumn><Name>Personalnummer</Name><Description>Eindeutige Personalnummer</Description><Numeric/><MaxLength>10</MaxLength></VariableColumn>
        <VariableColumn><Name>Vorname</Name><Description>Vorname des Mitarbeiters</Description><AlphaNumeric/><MaxLength>100</MaxLength></VariableColumn>
        <VariableColumn><Name>Nachname</Name><Description>Nachname des Mitarbeiters</Description><AlphaNumeric/><MaxLength>100</MaxLength></VariableColumn>
        <VariableColumn><Name>Geburtsdatum</Name><Description>Geburtsdatum</Description><Date><Format>DD.MM.YYYY</Format></Date></VariableColumn>
        <VariableColumn><Name>SteuerID</Name><Description>Steuerliche Identifikationsnummer</Description><AlphaNumeric/><MaxLength>11</MaxLength></VariableColumn>
        <VariableColumn><Name>SVNummer</Name><Description>Sozialversicherungsnummer</Description><AlphaNumeric/><MaxLength>12</MaxLength></VariableColumn>
        <VariableColumn><Name>Steuerklasse</Name><Description>Lohnsteuerklasse</Description><Numeric/><MaxLength>1</MaxLength></VariableColumn>
        <VariableColumn><Name>Krankenkasse</Name><Description>Gesetzliche Krankenkasse</Description><AlphaNumeric/><MaxLength>100</MaxLength></VariableColumn>
        <VariableColumn><Name>Eintrittsdatum</Name><Description>Datum des Beschäftigungsbeginns</Description><Date><Format>DD.MM.YYYY</Format></Date></VariableColumn>
        <VariableColumn><Name>Austrittsdatum</Name><Description>Datum des Beschäftigungsendes</Description><Date><Format>DD.MM.YYYY</Format></Date></VariableColumn>
        <VariableColumn><Name>Abteilung</Name><Description>Organisationseinheit</Description><AlphaNumeric/><MaxLength>100</MaxLength></VariableColumn>
        <VariableColumn><Name>Bruttogehalt</Name><Description>Aktuelles Bruttomonatsgehalt</Description><Numeric/><MaxLength>12</MaxLength></VariableColumn>
      </VariableLength>
    </Table>
    <Table>
      <Name>Lohnabrechnungen</Name>
      <URL>lohnabrechnungen.csv</URL>
      <DecimalSymbol>,</DecimalSymbol>
      <DigitGroupingSymbol>.</DigitGroupingSymbol>
      <Encoding>UTF-8</Encoding>
      <VariableLength>
        <ColumnDelimiter>;</ColumnDelimiter>
        <RecordDelimiter>&#10;</RecordDelimiter>
        <TextEncapsulator>"</TextEncapsulator>
        <ForeignKey>
          <Name>Personalnummer</Name>
          <References>Stammdaten_Mitarbeiter</References>
        </ForeignKey>
        <VariableColumn><Name>Personalnummer</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Mitarbeitername</Name><AlphaNumeric/></VariableColumn>
        <VariableColumn><Name>Jahr</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Monat</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Bruttolohn</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Lohnsteuer</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Solidaritaetszuschlag</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Kirchensteuer</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>KV_AN</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>KV_AG</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>RV_AN</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>RV_AG</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>ALV_AN</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>ALV_AG</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>PV_AN</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>PV_AG</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Steuer_Gesamt</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>SV_AN_Gesamt</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>SV_AG_Gesamt</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Nettolohn</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Arbeitgeberkosten</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Praemien</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Ueberstunden</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Abzuege</Name><Numeric/></VariableColumn>
        <VariableColumn><Name>Auszahlungsbetrag</Name><Numeric/></VariableColumn>
      </VariableLength>
    </Table>
    <Table>
      <Name>Aenderungsprotokoll</Name>
      <URL>aenderungsprotokoll.csv</URL>
      <Encoding>UTF-8</Encoding>
      <VariableLength>
        <ColumnDelimiter>;</ColumnDelimiter>
        <RecordDelimiter>&#10;</RecordDelimiter>
        <TextEncapsulator>"</TextEncapsulator>
        <VariableColumn><Name>Zeitstempel</Name><Date><Format>YYYY-MM-DDTHH:MM:SS</Format></Date></VariableColumn>
        <VariableColumn><Name>BenutzerID</Name><AlphaNumeric/></VariableColumn>
        <VariableColumn><Name>Aktion</Name><AlphaNumeric/></VariableColumn>
        <VariableColumn><Name>Tabelle</Name><AlphaNumeric/></VariableColumn>
        <VariableColumn><Name>DatensatzID</Name><AlphaNumeric/></VariableColumn>
        <VariableColumn><Name>AlteWerte</Name><AlphaNumeric/></VariableColumn>
        <VariableColumn><Name>NeueWerte</Name><AlphaNumeric/></VariableColumn>
      </VariableLength>
    </Table>
  </Media>
</DataSet>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const fmtDe = (n: number) => n.toFixed(2).replace('.', ',');

/**
 * Erstellt die CSV für Stammdaten
 */
export function generateEmployeeCSV(records: GoBDEmployeeRecord[]): string {
  const header = 'Personalnummer;Vorname;Nachname;Geburtsdatum;SteuerID;SVNummer;Steuerklasse;Krankenkasse;Eintrittsdatum;Austrittsdatum;Abteilung;Bruttogehalt';
  const rows = records.map(r => [
    r.personalNumber,
    `"${r.firstName}"`,
    `"${r.lastName}"`,
    r.dateOfBirth,
    r.taxId,
    r.svNumber,
    r.taxClass,
    `"${r.healthInsurance}"`,
    r.entryDate,
    r.exitDate || '',
    `"${r.department}"`,
    fmtDe(r.grossSalary),
  ].join(';'));
  return [header, ...rows].join('\n');
}

/**
 * Erstellt die CSV für Lohnabrechnungen
 */
export function generatePayrollCSV(records: GoBDPayrollRecord[]): string {
  const header = 'Personalnummer;Mitarbeitername;Jahr;Monat;Bruttolohn;Lohnsteuer;Solidaritaetszuschlag;Kirchensteuer;KV_AN;KV_AG;RV_AN;RV_AG;ALV_AN;ALV_AG;PV_AN;PV_AG;Steuer_Gesamt;SV_AN_Gesamt;SV_AG_Gesamt;Nettolohn;Arbeitgeberkosten;Praemien;Ueberstunden;Abzuege;Auszahlungsbetrag';
  const rows = records.map(r => [
    r.personalNumber,
    `"${r.employeeName}"`,
    r.year,
    r.month,
    fmtDe(r.grossSalary),
    fmtDe(r.incomeTax),
    fmtDe(r.solidarityTax),
    fmtDe(r.churchTax),
    fmtDe(r.svHealthEmployee),
    fmtDe(r.svHealthEmployer),
    fmtDe(r.svPensionEmployee),
    fmtDe(r.svPensionEmployer),
    fmtDe(r.svUnemploymentEmployee),
    fmtDe(r.svUnemploymentEmployer),
    fmtDe(r.svCareEmployee),
    fmtDe(r.svCareEmployer),
    fmtDe(r.totalTax),
    fmtDe(r.totalSVEmployee),
    fmtDe(r.totalSVEmployer),
    fmtDe(r.netSalary),
    fmtDe(r.employerCosts),
    fmtDe(r.bonus),
    fmtDe(r.overtimePay),
    fmtDe(r.deductions),
    fmtDe(r.finalNetSalary),
  ].join(';'));
  return [header, ...rows].join('\n');
}

/**
 * Erstellt die CSV für das Änderungsprotokoll
 */
export function generateJournalCSV(records: GoBDJournalRecord[]): string {
  const header = 'Zeitstempel;BenutzerID;Aktion;Tabelle;DatensatzID;AlteWerte;NeueWerte';
  const rows = records.map(r => [
    r.timestamp,
    `"${r.userId}"`,
    `"${r.action}"`,
    `"${r.tableName}"`,
    `"${r.recordId}"`,
    `"${(r.oldValues || '').replace(/"/g, '""')}"`,
    `"${(r.newValues || '').replace(/"/g, '""')}"`,
  ].join(';'));
  return [header, ...rows].join('\n');
}

/**
 * GoBD-Prüfsumme für Dateiintegrität (SHA-256 Hash als Hex-String)
 */
export async function calculateChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Erstellt ein Prüfprotokoll für den GoBD-Export
 */
export function generateExportProtocol(config: GoBDExportConfig, checksums: Record<string, string>): string {
  const now = new Date();
  const lines = [
    '═══════════════════════════════════════════════════════',
    '  GoBD-EXPORTPROTOKOLL',
    '  Gemäß §§ 146, 147 AO / GoBD / GDPdU',
    '═══════════════════════════════════════════════════════',
    '',
    `Unternehmen:       ${config.companyName}`,
    `Steuernummer:      ${config.taxNumber}`,
    `Betriebsnummer:    ${config.betriebsnummer}`,
    `Exportzeitraum:    ${config.exportMonthFrom}/${config.exportYear} – ${config.exportMonthTo}/${config.exportYear}`,
    `Erstellt am:       ${now.toLocaleDateString('de-DE')} ${now.toLocaleTimeString('de-DE')}`,
    `Erstellt von:      ${config.createdBy}`,
    '',
    '───────────────────────────────────────────────────────',
    '  DATEIPRÜFSUMMEN (SHA-256)',
    '───────────────────────────────────────────────────────',
    '',
    ...Object.entries(checksums).map(([file, hash]) => `  ${file.padEnd(35)} ${hash}`),
    '',
    '───────────────────────────────────────────────────────',
    '  HINWEISE',
    '───────────────────────────────────────────────────────',
    '',
    '  • Dieser Export ist GoBD-konform und unveränderbar.',
    '  • Die Prüfsummen dienen der Integritätsprüfung.',
    '  • Aufbewahrungspflicht: 10 Jahre (§ 147 Abs. 3 AO).',
    '  • Änderungen an den Exportdateien sind nicht zulässig.',
    '  • Bei Fragen wenden Sie sich an Ihren Steuerberater.',
    '',
    '═══════════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
