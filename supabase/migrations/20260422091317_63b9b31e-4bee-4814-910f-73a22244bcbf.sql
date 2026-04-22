
-- Lohnarten-Katalog (Wage Types Catalog)
CREATE TABLE IF NOT EXISTS public.wage_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('bezug', 'abzug', 'sachbezug', 'pauschalsteuer', 'pfaendung', 'vwl', 'zuschuss', 'sonstiges')),
  -- Steuerliche Behandlung
  is_taxable boolean NOT NULL DEFAULT true,
  is_sv_relevant boolean NOT NULL DEFAULT true,
  -- Pauschalbesteuerung (z.B. Sachbezug 30%, Fahrtkostenzuschuss 15%)
  pauschal_tax_rate numeric(5,2) DEFAULT 0,
  -- Buchhaltung
  account_skr03 text,
  account_skr04 text,
  -- Default-Wert (kann pro Mitarbeiter überschrieben werden)
  default_amount numeric(10,2) DEFAULT 0,
  amount_type text NOT NULL DEFAULT 'fixed' CHECK (amount_type IN ('fixed', 'percentage', 'hourly')),
  -- Gültigkeit
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,  -- System-Lohnarten können nicht gelöscht werden
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_wage_types_tenant ON public.wage_types(tenant_id);
CREATE INDEX idx_wage_types_active ON public.wage_types(tenant_id, is_active);

ALTER TABLE public.wage_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant wage_types"
  ON public.wage_types FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage tenant wage_types"
  ON public.wage_types FOR ALL TO authenticated
  USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));

-- Mitarbeiter-Lohnarten-Zuordnung (wiederkehrende Bezüge/Abzüge)
CREATE TABLE IF NOT EXISTS public.employee_wage_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  wage_type_id uuid NOT NULL REFERENCES public.wage_types(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  -- Gültigkeitszeitraum
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_to date,
  -- Notizen (z.B. Pfändungs-Aktenzeichen)
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_employee_wage_types_emp ON public.employee_wage_types(employee_id, is_active);
CREATE INDEX idx_employee_wage_types_tenant ON public.employee_wage_types(tenant_id);

ALTER TABLE public.employee_wage_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant employee_wage_types"
  ON public.employee_wage_types FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can manage tenant employee_wage_types"
  ON public.employee_wage_types FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- updated_at Trigger
CREATE TRIGGER update_wage_types_updated_at BEFORE UPDATE ON public.wage_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_wage_types_updated_at BEFORE UPDATE ON public.employee_wage_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
