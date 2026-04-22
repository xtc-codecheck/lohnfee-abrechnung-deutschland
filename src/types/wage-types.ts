export type WageTypeCategory = 'bezug' | 'abzug' | 'sachbezug' | 'pauschalsteuer' | 'pfaendung' | 'vwl' | 'zuschuss' | 'sonstiges';
export type AmountType = 'fixed' | 'percentage' | 'hourly';

export interface WageType {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  category: WageTypeCategory;
  is_taxable: boolean;
  is_sv_relevant: boolean;
  pauschal_tax_rate: number;
  account_skr03: string | null;
  account_skr04: string | null;
  default_amount: number;
  amount_type: AmountType;
  is_active: boolean;
  is_system: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWageType {
  id: string;
  tenant_id: string;
  employee_id: string;
  wage_type_id: string;
  amount: number;
  valid_from: string;
  valid_to: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  wage_type?: WageType;
}

export const CATEGORY_LABELS: Record<WageTypeCategory, string> = {
  bezug: 'Bezug',
  abzug: 'Abzug',
  sachbezug: 'Sachbezug',
  pauschalsteuer: 'Pauschalsteuer',
  pfaendung: 'Pfändung',
  vwl: 'VWL',
  zuschuss: 'Zuschuss',
  sonstiges: 'Sonstiges',
};

export const DEFAULT_WAGE_TYPES: Array<Omit<WageType, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>> = [
  { code: 'VWL', name: 'Vermögenswirksame Leistungen', category: 'vwl', is_taxable: true, is_sv_relevant: true, pauschal_tax_rate: 0, account_skr03: '4140', account_skr04: '6020', default_amount: 40, amount_type: 'fixed', is_active: true, is_system: true, description: 'Arbeitgeberzuschuss zu VWL (max. 40€/Monat)' },
  { code: 'FAHRT', name: 'Fahrtkostenzuschuss (15% pauschal)', category: 'zuschuss', is_taxable: false, is_sv_relevant: false, pauschal_tax_rate: 15, account_skr03: '4145', account_skr04: '6025', default_amount: 0, amount_type: 'fixed', is_active: true, is_system: true, description: 'Pauschal versteuert nach § 40 Abs. 2 EStG' },
  { code: 'KIGA', name: 'Kindergartenzuschuss', category: 'zuschuss', is_taxable: false, is_sv_relevant: false, pauschal_tax_rate: 0, account_skr03: '4170', account_skr04: '6035', default_amount: 0, amount_type: 'fixed', is_active: true, is_system: true, description: 'Steuer- und SV-frei nach § 3 Nr. 33 EStG' },
  { code: 'SACH50', name: 'Sachbezug 50€-Freigrenze', category: 'sachbezug', is_taxable: false, is_sv_relevant: false, pauschal_tax_rate: 0, account_skr03: '4150', account_skr04: '6030', default_amount: 50, amount_type: 'fixed', is_active: true, is_system: true, description: '§ 8 Abs. 2 S. 11 EStG, max. 50€/Monat' },
  { code: 'JOBTKT', name: 'Jobticket (steuerfrei)', category: 'zuschuss', is_taxable: false, is_sv_relevant: false, pauschal_tax_rate: 0, account_skr03: '4145', account_skr04: '6025', default_amount: 0, amount_type: 'fixed', is_active: true, is_system: true, description: '§ 3 Nr. 15 EStG' },
  { code: 'ESSEN', name: 'Essenszuschuss / Restaurantscheck', category: 'sachbezug', is_taxable: true, is_sv_relevant: true, pauschal_tax_rate: 25, account_skr03: '4948', account_skr04: '6645', default_amount: 0, amount_type: 'fixed', is_active: true, is_system: true, description: 'Pauschal 25% nach § 40 Abs. 2 Nr. 1 EStG' },
  { code: 'PFAND', name: 'Pfändung / Lohnabtretung', category: 'pfaendung', is_taxable: false, is_sv_relevant: false, pauschal_tax_rate: 0, account_skr03: '1755', account_skr04: '3755', default_amount: 0, amount_type: 'fixed', is_active: true, is_system: true, description: 'Pfändungsfreibetrag nach § 850c ZPO beachten' },
  { code: 'DARLA', name: 'AG-Darlehen Tilgung', category: 'abzug', is_taxable: false, is_sv_relevant: false, pauschal_tax_rate: 0, account_skr03: '1361', account_skr04: '1370', default_amount: 0, amount_type: 'fixed', is_active: true, is_system: true, description: 'Rückzahlung Arbeitgeberdarlehen' },
  { code: 'PRAEMIE', name: 'Prämie / Sonderzahlung', category: 'bezug', is_taxable: true, is_sv_relevant: true, pauschal_tax_rate: 0, account_skr03: '4120', account_skr04: '6010', default_amount: 0, amount_type: 'fixed', is_active: true, is_system: true, description: 'Steuer- und SV-pflichtig' },
  { code: 'INTNETZ', name: 'Internetpauschale', category: 'zuschuss', is_taxable: false, is_sv_relevant: false, pauschal_tax_rate: 25, account_skr03: '4945', account_skr04: '6815', default_amount: 50, amount_type: 'fixed', is_active: true, is_system: true, description: 'Pauschal 25% nach § 40 Abs. 2 Nr. 5 EStG' },
];
