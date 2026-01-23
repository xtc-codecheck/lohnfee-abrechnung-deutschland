/**
 * Berechnungs-Audit-Trail
 * 
 * Phase 5: Audit-Trail und Nachverfolgbarkeit
 * 
 * Protokolliert jeden Berechnungsschritt für vollständige
 * Revisionssicherheit und Nachvollziehbarkeit.
 */

import { 
  SOCIAL_INSURANCE_RATES_2025, 
  BBG_2025_MONTHLY, 
  MINIJOB_2025, 
  MIDIJOB_2025,
  TAX_ALLOWANCES_2025 
} from '@/constants/social-security';

// ============= Typen =============

export interface AuditEntry {
  timestamp: Date;
  step: string;
  description: string;
  inputValues?: Record<string, unknown>;
  outputValues?: Record<string, unknown>;
  appliedRules?: string[];
  constants?: Record<string, unknown>;
}

export interface CalculationAudit {
  version: string;
  calculationId: string;
  createdAt: Date;
  employeeId: string;
  periodMonth: number;
  periodYear: number;
  entries: AuditEntry[];
  summary: {
    grossMonthly: number;
    netMonthly: number;
    totalTaxes: number;
    totalSocialSecurity: number;
    employerCosts: number;
  };
  appliedConstants: AppliedConstants;
  warnings: string[];
}

export interface AppliedConstants {
  year: number;
  bbgPensionMonthly: number;
  bbgHealthMonthly: number;
  minijobLimit: number;
  midijobUpperLimit: number;
  pensionRate: number;
  healthRate: number;
  unemploymentRate: number;
  careRate: number;
  basicAllowance: number;
  solidarityTaxRate: number;
}

// ============= Audit-Logger Klasse =============

export class PayrollAuditLogger {
  private entries: AuditEntry[] = [];
  private warnings: string[] = [];
  private calculationId: string;
  private employeeId: string;
  private periodMonth: number;
  private periodYear: number;

  constructor(employeeId: string, periodMonth: number, periodYear: number) {
    this.calculationId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.employeeId = employeeId;
    this.periodMonth = periodMonth;
    this.periodYear = periodYear;
    
    this.log('INIT', 'Berechnungsaudit initialisiert', {
      employeeId,
      period: `${periodMonth}/${periodYear}`,
    });
  }

  /**
   * Protokolliert einen Berechnungsschritt
   */
  log(
    step: string, 
    description: string, 
    inputValues?: Record<string, unknown>,
    outputValues?: Record<string, unknown>,
    appliedRules?: string[]
  ): void {
    this.entries.push({
      timestamp: new Date(),
      step,
      description,
      inputValues,
      outputValues,
      appliedRules,
    });
  }

  /**
   * Protokolliert die verwendeten Konstanten
   */
  logConstants(region: 'west' | 'east', isChildless: boolean): void {
    const constants: Record<string, unknown> = {
      BBG_RV_Monatlich: region === 'west' ? BBG_2025_MONTHLY.pensionWest : BBG_2025_MONTHLY.pensionEast,
      BBG_KV_Monatlich: BBG_2025_MONTHLY.healthCare,
      Minijob_Grenze: MINIJOB_2025.maxEarnings,
      Midijob_Obergrenze: MIDIJOB_2025.maxEarnings,
      RV_Satz: `${SOCIAL_INSURANCE_RATES_2025.pension.total}%`,
      KV_Satz: `${SOCIAL_INSURANCE_RATES_2025.health.total}%`,
      AV_Satz: `${SOCIAL_INSURANCE_RATES_2025.unemployment.total}%`,
      PV_Satz: isChildless 
        ? `${SOCIAL_INSURANCE_RATES_2025.careChildless.total}% (kinderlos)`
        : `${SOCIAL_INSURANCE_RATES_2025.care.total}%`,
      Grundfreibetrag: TAX_ALLOWANCES_2025.basicAllowance,
    };

    this.log('CONSTANTS', 'Angewendete Konstanten 2025', undefined, constants, [
      'Stand: Januar 2025',
      'Quelle: BMF / Deutsche Rentenversicherung',
    ]);
  }

  /**
   * Protokolliert einen Sonderfall
   */
  logSpecialCase(caseType: string, description: string, details: Record<string, unknown>): void {
    this.log(`SPECIAL_${caseType}`, description, details, undefined, [caseType]);
    this.warnings.push(`Sonderfall: ${description}`);
  }

  /**
   * Protokolliert eine BBG-Kappung
   */
  logBBGCapping(insuranceType: string, actualBase: number, cappedBase: number, bbgLimit: number): void {
    if (actualBase > bbgLimit) {
      this.log(
        'BBG_CAP',
        `${insuranceType}: Beitragsbemessungsgrenze angewendet`,
        { Brutto: actualBase },
        { Bemessungsgrundlage: cappedBase },
        [`Gekürzt von ${actualBase.toFixed(2)}€ auf ${cappedBase.toFixed(2)}€ (BBG: ${bbgLimit}€)`]
      );
    }
  }

  /**
   * Protokolliert die Steuerberechnung
   */
  logTaxCalculation(
    grossMonthly: number,
    taxClass: string,
    incomeTax: number,
    solidarityTax: number,
    churchTax: number
  ): void {
    this.log(
      'TAX',
      'Lohnsteuerberechnung aus Tabelle',
      { 
        Brutto_Monatlich: grossMonthly,
        Steuerklasse: taxClass,
      },
      {
        Lohnsteuer: incomeTax,
        Solidaritätszuschlag: solidarityTax,
        Kirchensteuer: churchTax,
        Gesamt: incomeTax + solidarityTax + churchTax,
      },
      [
        `Steuerklasse ${taxClass}`,
        'Lohnsteuertabelle 2025 (Allgemeine Tabelle)',
        solidarityTax === 0 ? 'Soli-Freigrenze unterschritten' : 'Soli 5,5% der LSt',
        churchTax > 0 ? 'Mit Kirchensteuer' : 'Ohne Kirchensteuer',
      ]
    );
  }

  /**
   * Protokolliert die SV-Berechnung
   */
  logSocialSecurityCalculation(
    grossMonthly: number,
    pension: { employee: number; employer: number },
    health: { employee: number; employer: number },
    unemployment: { employee: number; employer: number },
    care: { employee: number; employer: number }
  ): void {
    this.log(
      'SOCIAL_SECURITY',
      'Sozialversicherungsbeiträge',
      { Brutto_Monatlich: grossMonthly },
      {
        RV_AN: pension.employee,
        RV_AG: pension.employer,
        KV_AN: health.employee,
        KV_AG: health.employer,
        AV_AN: unemployment.employee,
        AV_AG: unemployment.employer,
        PV_AN: care.employee,
        PV_AG: care.employer,
        Gesamt_AN: pension.employee + health.employee + unemployment.employee + care.employee,
        Gesamt_AG: pension.employer + health.employer + unemployment.employer + care.employer,
      },
      [
        `RV: ${SOCIAL_INSURANCE_RATES_2025.pension.total}% (je 50%)`,
        `KV: ${SOCIAL_INSURANCE_RATES_2025.health.total}% + Zusatzbeitrag (je 50%)`,
        `AV: ${SOCIAL_INSURANCE_RATES_2025.unemployment.total}% (je 50%)`,
        'PV: inkl. Kinderlosenzuschlag falls zutreffend',
      ]
    );
  }

  /**
   * Fügt eine Warnung hinzu
   */
  addWarning(warning: string): void {
    this.warnings.push(warning);
  }

  /**
   * Erstellt das vollständige Audit-Dokument
   */
  finalize(summary: {
    grossMonthly: number;
    netMonthly: number;
    totalTaxes: number;
    totalSocialSecurity: number;
    employerCosts: number;
  }): CalculationAudit {
    this.log('FINALIZE', 'Berechnung abgeschlossen', undefined, {
      Brutto: summary.grossMonthly,
      Netto: summary.netMonthly,
      Steuern: summary.totalTaxes,
      Sozialversicherung: summary.totalSocialSecurity,
      Arbeitgeberkosten: summary.employerCosts,
    });

    return {
      version: '2025.1.0',
      calculationId: this.calculationId,
      createdAt: new Date(),
      employeeId: this.employeeId,
      periodMonth: this.periodMonth,
      periodYear: this.periodYear,
      entries: this.entries,
      summary,
      appliedConstants: {
        year: 2025,
        bbgPensionMonthly: BBG_2025_MONTHLY.pensionWest,
        bbgHealthMonthly: BBG_2025_MONTHLY.healthCare,
        minijobLimit: MINIJOB_2025.maxEarnings,
        midijobUpperLimit: MIDIJOB_2025.maxEarnings,
        pensionRate: SOCIAL_INSURANCE_RATES_2025.pension.total,
        healthRate: SOCIAL_INSURANCE_RATES_2025.health.total,
        unemploymentRate: SOCIAL_INSURANCE_RATES_2025.unemployment.total,
        careRate: SOCIAL_INSURANCE_RATES_2025.care.total,
        basicAllowance: TAX_ALLOWANCES_2025.basicAllowance,
        solidarityTaxRate: 5.5,
      },
      warnings: this.warnings,
    };
  }

  /**
   * Gibt die Audit-Einträge als formatierten Text zurück
   */
  toFormattedLog(): string {
    const lines: string[] = [
      `═══════════════════════════════════════════════════════════════`,
      `  LOHNBERECHNUNGS-AUDIT  |  ${this.calculationId}`,
      `  Mitarbeiter: ${this.employeeId}  |  Periode: ${this.periodMonth}/${this.periodYear}`,
      `═══════════════════════════════════════════════════════════════`,
      '',
    ];

    for (const entry of this.entries) {
      const time = entry.timestamp.toISOString().substring(11, 19);
      lines.push(`[${time}] ${entry.step}: ${entry.description}`);
      
      if (entry.inputValues) {
        lines.push(`  ├─ Eingabe: ${JSON.stringify(entry.inputValues)}`);
      }
      if (entry.outputValues) {
        lines.push(`  ├─ Ausgabe: ${JSON.stringify(entry.outputValues)}`);
      }
      if (entry.appliedRules && entry.appliedRules.length > 0) {
        lines.push(`  └─ Regeln: ${entry.appliedRules.join(', ')}`);
      }
      lines.push('');
    }

    if (this.warnings.length > 0) {
      lines.push('⚠️  WARNUNGEN:');
      for (const warning of this.warnings) {
        lines.push(`  • ${warning}`);
      }
    }

    return lines.join('\n');
  }
}

// ============= Hilfsfunktionen =============

/**
 * Erstellt einen neuen Audit-Logger für eine Lohnabrechnung
 */
export function createPayrollAudit(
  employeeId: string, 
  periodMonth: number, 
  periodYear: number
): PayrollAuditLogger {
  return new PayrollAuditLogger(employeeId, periodMonth, periodYear);
}

/**
 * Formatiert ein Audit-Dokument als JSON für die Archivierung
 */
export function serializeAudit(audit: CalculationAudit): string {
  return JSON.stringify(audit, null, 2);
}

/**
 * Lädt ein Audit-Dokument aus JSON
 */
export function deserializeAudit(json: string): CalculationAudit {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    entries: parsed.entries.map((e: AuditEntry) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    })),
  };
}
