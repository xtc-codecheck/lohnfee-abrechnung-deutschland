/**
 * Tests für die Mapper-Funktionen in useSupabaseEmployees und useSupabasePayroll
 * 
 * Da die Hooks intern Supabase und React Query verwenden, testen wir hier die
 * reinen Transformationsfunktionen (DB → App und App → DB).
 * Die Mapper werden für die Tests re-exportiert.
 */
import { describe, it, expect } from 'vitest';
import {
  dbToEmployee,
  taxClassFromNumber,
  taxClassToNumber,
  employeeToInsert,
} from '../use-supabase-employees-mappers';
import {
  dbToPeriod,
  dbToPayrollEntry,
} from '../use-supabase-payroll-mappers';
import type { Employee } from '@/types/employee';

// ============= Fixtures =============

const DB_EMPLOYEE_ROW = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  first_name: 'Anna',
  last_name: 'Schmidt',
  date_of_birth: '1990-05-15',
  street: 'Musterstraße 1',
  zip_code: '10115',
  city: 'Berlin',
  state: 'berlin',
  tax_id: '12345678901',
  tax_class: 1,
  church_tax: false,
  church_tax_rate: 0,
  health_insurance: 'TK',
  health_insurance_number: 'A123456789',
  sv_number: '12345678A123',
  children_allowance: 0,
  gross_salary: 4500,
  employment_type: 'vollzeit',
  entry_date: '2023-01-15',
  exit_date: null,
  weekly_hours: 40,
  department: 'IT',
  position: 'Entwicklerin',
  iban: 'DE89370400440532013000',
  bic: 'COBADEFFXXX',
  has_bav: true,
  bav_monthly_amount: 200,
  has_company_car: false,
  company_car_list_price: 0,
  company_car_distance_km: 0,
  is_active: true,
  personal_number: '1001',
  gender: 'female',
  tenant_id: 'tenant-1',
  created_at: '2023-01-15T10:00:00Z',
  updated_at: '2023-06-01T12:00:00Z',
  created_by: 'user-1',
};

const DB_PERIOD_ROW = {
  id: 'period-1',
  year: 2025,
  month: 3,
  start_date: '2025-03-01',
  end_date: '2025-03-31',
  status: 'draft',
  created_at: '2025-03-01T08:00:00Z',
  processed_at: null,
  processed_by: null,
  tenant_id: 'tenant-1',
};

const DB_ENTRY_ROW = {
  id: 'entry-1',
  employee_id: '550e8400-e29b-41d4-a716-446655440000',
  payroll_period_id: 'period-1',
  gross_salary: 4500,
  net_salary: 2800,
  final_net_salary: 2750,
  tax_income_tax: 500,
  tax_church: 0,
  tax_solidarity: 25,
  tax_total: 525,
  sv_health_employee: 350,
  sv_health_employer: 350,
  sv_pension_employee: 418.5,
  sv_pension_employer: 418.5,
  sv_unemployment_employee: 58.5,
  sv_unemployment_employer: 58.5,
  sv_care_employee: 76.5,
  sv_care_employer: 76.5,
  sv_total_employee: 903.5,
  sv_total_employer: 903.5,
  employer_costs: 5403.5,
  bonus: 0,
  overtime_hours: 0,
  overtime_pay: 0,
  deductions: 50,
  deduction_description: 'Vorschuss',
  notes: null,
  audit_data: null,
  tenant_id: 'tenant-1',
  created_at: '2025-03-15T10:00:00Z',
  updated_at: '2025-03-15T10:00:00Z',
};

// ============= dbToEmployee Tests =============

describe('dbToEmployee', () => {
  it('mappt alle persönlichen Daten korrekt', () => {
    const emp = dbToEmployee(DB_EMPLOYEE_ROW as any);
    expect(emp.id).toBe(DB_EMPLOYEE_ROW.id);
    expect(emp.personalData.firstName).toBe('Anna');
    expect(emp.personalData.lastName).toBe('Schmidt');
    expect(emp.personalData.taxId).toBe('12345678901');
    expect(emp.personalData.taxClass).toBe('I');
    expect(emp.personalData.churchTax).toBe(false);
    expect(emp.personalData.socialSecurityNumber).toBe('12345678A123');
    expect(emp.personalData.childAllowances).toBe(0);
  });

  it('mappt Adressdaten korrekt', () => {
    const emp = dbToEmployee(DB_EMPLOYEE_ROW as any);
    expect(emp.personalData.address.street).toBe('Musterstraße 1');
    expect(emp.personalData.address.postalCode).toBe('10115');
    expect(emp.personalData.address.city).toBe('Berlin');
    expect(emp.personalData.address.state).toBe('berlin');
  });

  it('mappt Beschäftigungsdaten korrekt', () => {
    const emp = dbToEmployee(DB_EMPLOYEE_ROW as any);
    expect(emp.employmentData.employmentType).toBe('vollzeit');
    expect(emp.employmentData.weeklyHours).toBe(40);
    expect(emp.employmentData.department).toBe('IT');
    expect(emp.employmentData.position).toBe('Entwicklerin');
    expect(emp.employmentData.startDate).toBeInstanceOf(Date);
    expect(emp.employmentData.endDate).toBeUndefined();
  });

  it('mappt Gehaltsdaten und Benefits korrekt', () => {
    const emp = dbToEmployee(DB_EMPLOYEE_ROW as any);
    expect(emp.salaryData.grossSalary).toBe(4500);
    expect(emp.salaryData.additionalBenefits.companyPension).toBe(200);
    expect(emp.salaryData.additionalBenefits.companyCar).toBeUndefined();
    expect(emp.salaryData.bankingData.iban).toBe('DE89370400440532013000');
  });

  it('behandelt NULL-Werte graceful', () => {
    const minimalRow = {
      ...DB_EMPLOYEE_ROW,
      date_of_birth: null,
      street: null,
      zip_code: null,
      city: null,
      state: null,
      tax_id: null,
      sv_number: null,
      health_insurance: null,
      iban: null,
      bic: null,
      department: null,
      position: null,
      exit_date: null,
    };
    const emp = dbToEmployee(minimalRow as any);
    expect(emp.personalData.address.street).toBe('');
    expect(emp.personalData.taxId).toBe('');
    expect(emp.salaryData.bankingData.iban).toBe('');
    expect(emp.employmentData.department).toBe('');
  });
});

// ============= taxClassFromNumber / taxClassToNumber =============

describe('taxClassFromNumber', () => {
  it.each([
    [1, 'I'], [2, 'II'], [3, 'III'], [4, 'IV'], [5, 'V'], [6, 'VI'],
  ] as const)('mappt %d → %s', (num, expected) => {
    expect(taxClassFromNumber(num)).toBe(expected);
  });

  it('gibt I für null zurück', () => {
    expect(taxClassFromNumber(null)).toBe('I');
  });

  it('gibt I für ungültige Zahlen zurück', () => {
    expect(taxClassFromNumber(99)).toBe('I');
  });
});

describe('taxClassToNumber', () => {
  it.each([
    ['I', 1], ['II', 2], ['III', 3], ['IV', 4], ['V', 5], ['VI', 6],
  ] as const)('mappt %s → %d', (cls, expected) => {
    expect(taxClassToNumber(cls)).toBe(expected);
  });
});

// ============= employeeToInsert =============

describe('employeeToInsert', () => {
  it('transformiert Employee korrekt in DB-Format', () => {
    const emp = dbToEmployee(DB_EMPLOYEE_ROW as any);
    const insert = employeeToInsert(emp);
    
    expect(insert.first_name).toBe('Anna');
    expect(insert.last_name).toBe('Schmidt');
    expect(insert.gross_salary).toBe(4500);
    expect(insert.tax_class).toBe(1);
    expect(insert.employment_type).toBe('vollzeit');
    expect(insert.weekly_hours).toBe(40);
    expect(insert.has_bav).toBe(true);
    expect(insert.bav_monthly_amount).toBe(200);
    expect(insert.has_company_car).toBe(false);
    expect(insert.is_active).toBe(true);
  });

  it('setzt entry_date als ISO-Datum-String', () => {
    const emp = dbToEmployee(DB_EMPLOYEE_ROW as any);
    const insert = employeeToInsert(emp);
    expect(insert.entry_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ============= dbToPeriod =============

describe('dbToPeriod', () => {
  it('mappt Perioden-Daten korrekt', () => {
    const period = dbToPeriod(DB_PERIOD_ROW as any);
    expect(period.id).toBe('period-1');
    expect(period.year).toBe(2025);
    expect(period.month).toBe(3);
    expect(period.status).toBe('draft');
    expect(period.startDate).toBeInstanceOf(Date);
    expect(period.endDate).toBeInstanceOf(Date);
    expect(period.processedAt).toBeUndefined();
  });

  it('mappt processedAt wenn vorhanden', () => {
    const row = { ...DB_PERIOD_ROW, processed_at: '2025-03-31T18:00:00Z' };
    const period = dbToPeriod(row as any);
    expect(period.processedAt).toBeInstanceOf(Date);
  });
});

// ============= dbToPayrollEntry =============

describe('dbToPayrollEntry', () => {
  const mockEmployee: Employee = dbToEmployee(DB_EMPLOYEE_ROW as any);
  const employeeMap = new Map([[DB_EMPLOYEE_ROW.id, mockEmployee]]);

  it('mappt Grunddaten korrekt', () => {
    const entry = dbToPayrollEntry(DB_ENTRY_ROW as any, employeeMap);
    expect(entry.id).toBe('entry-1');
    expect(entry.employeeId).toBe(DB_EMPLOYEE_ROW.id);
    expect(entry.payrollPeriodId).toBe('period-1');
    expect(entry.employee).toBe(mockEmployee);
  });

  it('mappt Gehaltsberechnung korrekt', () => {
    const entry = dbToPayrollEntry(DB_ENTRY_ROW as any, employeeMap);
    expect(entry.salaryCalculation.grossSalary).toBe(4500);
    expect(entry.salaryCalculation.netSalary).toBe(2800);
    expect(entry.finalNetSalary).toBe(2750);
  });

  it('mappt Steuern korrekt', () => {
    const entry = dbToPayrollEntry(DB_ENTRY_ROW as any, employeeMap);
    expect(entry.salaryCalculation.taxes.incomeTax).toBe(500);
    expect(entry.salaryCalculation.taxes.solidarityTax).toBe(25);
    expect(entry.salaryCalculation.taxes.churchTax).toBe(0);
    expect(entry.salaryCalculation.taxes.total).toBe(525);
  });

  it('mappt SV-Beiträge korrekt', () => {
    const entry = dbToPayrollEntry(DB_ENTRY_ROW as any, employeeMap);
    const sv = entry.salaryCalculation.socialSecurityContributions;
    expect(sv.healthInsurance.employee).toBe(350);
    expect(sv.healthInsurance.employer).toBe(350);
    expect(sv.pensionInsurance.employee).toBe(418.5);
    expect(sv.total.employee).toBe(903.5);
    expect(sv.total.employer).toBe(903.5);
  });

  it('mappt Abzüge und Zuschläge korrekt', () => {
    const entry = dbToPayrollEntry(DB_ENTRY_ROW as any, employeeMap);
    expect(entry.deductions.total).toBe(50);
    expect(entry.additions.bonuses).toBe(0);
    expect(entry.additions.overtimePay).toBe(0);
  });

  it('behandelt fehlenden Mitarbeiter graceful', () => {
    const emptyMap = new Map<string, Employee>();
    const entry = dbToPayrollEntry(DB_ENTRY_ROW as any, emptyMap);
    expect(entry.employee).toEqual({});
  });
});
