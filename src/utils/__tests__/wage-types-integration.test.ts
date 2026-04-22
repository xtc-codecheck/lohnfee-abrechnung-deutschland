import { describe, it, expect } from 'vitest';
import { applyWageTypes, filterActiveWageTypes } from '../wage-types-integration';
import { EmployeeWageType, WageType } from '@/types/wage-types';

function makeWT(overrides: Partial<WageType>): WageType {
  return {
    id: 'wt-' + (overrides.code ?? 'X'),
    tenant_id: 't1',
    code: 'X',
    name: 'X',
    category: 'bezug',
    is_taxable: true,
    is_sv_relevant: true,
    pauschal_tax_rate: 0,
    account_skr03: '4120',
    account_skr04: '6010',
    default_amount: 0,
    amount_type: 'fixed',
    is_active: true,
    is_system: false,
    description: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}
function makeAssign(wt: WageType, amount: number, overrides: Partial<EmployeeWageType> = {}): EmployeeWageType {
  return {
    id: 'ew-' + wt.code,
    tenant_id: 't1',
    employee_id: 'e1',
    wage_type_id: wt.id,
    amount,
    valid_from: '2025-01-01',
    valid_to: null,
    notes: null,
    is_active: true,
    created_at: '',
    updated_at: '',
    wage_type: wt,
    ...overrides,
  };
}

describe('applyWageTypes', () => {
  const ref = new Date('2025-06-15');

  it('returns zero impact for empty input', () => {
    const r = applyWageTypes([], ref);
    expect(r.taxableGrossAddition).toBe(0);
    expect(r.netDeductions).toBe(0);
    expect(r.lineItems).toEqual([]);
  });

  it('VWL: erhöht Brutto und reduziert Netto um denselben Betrag', () => {
    const vwl = makeWT({ code: 'VWL', category: 'vwl', is_taxable: true, is_sv_relevant: true });
    const r = applyWageTypes([makeAssign(vwl, 40)], ref);
    expect(r.taxableGrossAddition).toBe(40);
    expect(r.netDeductions).toBe(40);
    expect(r.pauschalTax).toBe(0);
  });

  it('Fahrtkostenzuschuss 15% pauschal: AG zahlt Pauschalsteuer, AN-Auszahlung erhält Betrag steuerfrei', () => {
    const fahrt = makeWT({ code: 'FAHRT', category: 'zuschuss', is_taxable: false, is_sv_relevant: false, pauschal_tax_rate: 15 });
    const r = applyWageTypes([makeAssign(fahrt, 100)], ref);
    expect(r.taxableGrossAddition).toBe(0);
    expect(r.taxFreeNetAddition).toBe(100);
    expect(r.pauschalTax).toBe(15);
  });

  it('Pfändung: reine Netto-Reduktion', () => {
    const pf = makeWT({ code: 'PFAND', category: 'pfaendung', is_taxable: false, is_sv_relevant: false });
    const r = applyWageTypes([makeAssign(pf, 250)], ref);
    expect(r.netDeductions).toBe(250);
    expect(r.taxableGrossAddition).toBe(0);
  });

  it('50€-Sachbezug steuerfrei: kein Brutto- und kein Netto-Effekt', () => {
    const sach = makeWT({ code: 'SACH50', category: 'sachbezug', is_taxable: false, is_sv_relevant: false });
    const r = applyWageTypes([makeAssign(sach, 50)], ref);
    expect(r.taxableGrossAddition).toBe(0);
    expect(r.inKindDeduction).toBe(0);
  });

  it('Kindergartenzuschuss steuerfrei: erhöht Auszahlung', () => {
    const kiga = makeWT({ code: 'KIGA', category: 'zuschuss', is_taxable: false, is_sv_relevant: false });
    const r = applyWageTypes([makeAssign(kiga, 150)], ref);
    expect(r.taxFreeNetAddition).toBe(150);
    expect(r.taxableGrossAddition).toBe(0);
  });

  it('Prämie: voll steuer-/SV-pflichtig', () => {
    const pr = makeWT({ code: 'PRAEMIE', category: 'bezug', is_taxable: true, is_sv_relevant: true });
    const r = applyWageTypes([makeAssign(pr, 500)], ref);
    expect(r.taxableGrossAddition).toBe(500);
    expect(r.netDeductions).toBe(0);
  });

  it('Inaktive oder abgelaufene Zuordnungen werden ignoriert', () => {
    const wt = makeWT({ code: 'X', category: 'bezug' });
    const items = [
      makeAssign(wt, 100, { is_active: false }),
      makeAssign(wt, 200, { valid_to: '2025-01-31' }),
      makeAssign(wt, 300, { valid_from: '2030-01-01' }),
    ];
    expect(filterActiveWageTypes(items, new Date('2025-06-15'))).toHaveLength(0);
    expect(applyWageTypes(items, new Date('2025-06-15')).taxableGrossAddition).toBe(0);
  });
});