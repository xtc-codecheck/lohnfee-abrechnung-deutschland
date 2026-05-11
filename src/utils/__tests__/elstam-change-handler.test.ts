import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processElstamChange } from '../elstam-change-handler';

vi.mock('@/integrations/supabase/client', () => {
  const state: any = { change: null, entries: [], updates: [] };

  const fromMock = (table: string) => {
    if (table === 'elstam_changes') {
      const builder: any = {
        _action: 'select',
        select: () => builder,
        eq: () => builder,
        single: async () => ({ data: state.change, error: state.change ? null : { message: 'not found' } }),
        update: (vals: any) => {
          state.updates.push(vals);
          return { eq: async () => ({ data: null, error: null }) };
        },
      };
      return builder;
    }
    if (table === 'payroll_entries') {
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        gte: () => builder,
        neq: async () => ({ data: state.entries, error: null }),
      };
      // make awaiting builder return data
      builder.then = (res: any) => res({ data: state.entries, error: null });
      return builder;
    }
    throw new Error('unexpected table ' + table);
  };

  return {
    supabase: { from: fromMock },
    __state: state,
  };
});

import * as client from '@/integrations/supabase/client';
const state = (client as any).__state;

describe('processElstamChange', () => {
  beforeEach(() => {
    state.change = null;
    state.entries = [];
    state.updates = [];
  });

  it('markiert tax_class-Änderung als processed mit betroffenen Entries', async () => {
    state.change = {
      id: 'c1',
      tenant_id: 't1',
      employee_id: 'e1',
      field_name: 'tax_class',
      old_value: '1',
      new_value: '3',
      effective_date: '2026-03-01',
    };
    state.entries = [
      { id: 'p1', entry_type: 'regular', payroll_periods: { end_date: '2026-03-31', status: 'approved' } },
      { id: 'p2', entry_type: 'regular', payroll_periods: { end_date: '2026-04-30', status: 'draft' } },
      { id: 'p3', entry_type: 'regular', payroll_periods: { end_date: '2026-05-31', status: 'exported' } },
    ];

    const r = await processElstamChange('c1');
    expect(r.requiresPayrollCorrection).toBe(true);
    expect(r.affectedEntryIds).toEqual(['p1', 'p3']);
    expect(state.updates[0].status).toBe('processed');
    expect(state.updates[0].affected_entry_ids).toEqual(['p1', 'p3']);
  });

  it('markiert nicht-steuerrelevantes Feld als ignored', async () => {
    state.change = {
      id: 'c2',
      tenant_id: 't1',
      employee_id: 'e1',
      field_name: 'address',
      old_value: 'A',
      new_value: 'B',
      effective_date: '2026-03-01',
    };
    const r = await processElstamChange('c2');
    expect(r.requiresPayrollCorrection).toBe(false);
    expect(state.updates[0].status).toBe('ignored');
  });

  it('wirft bei unbekannter Change-ID', async () => {
    await expect(processElstamChange('missing')).rejects.toThrow();
  });
});
