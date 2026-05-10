
CREATE TABLE IF NOT EXISTS public.payroll_audit_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payroll_entry_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  period_year integer NOT NULL,
  period_month integer NOT NULL,
  version integer NOT NULL,
  event_type text NOT NULL DEFAULT 'created',
  snapshot_employee jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot_calculation jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculation_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  exports jsonb NOT NULL DEFAULT '[]'::jsonb,
  applied_constants jsonb NOT NULL DEFAULT '{}'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_pap_entry ON public.payroll_audit_protocols(payroll_entry_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_pap_period ON public.payroll_audit_protocols(tenant_id, period_year, period_month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pap_unique_version ON public.payroll_audit_protocols(payroll_entry_id, version);

ALTER TABLE public.payroll_audit_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view tenant audit protocols"
ON public.payroll_audit_protocols FOR SELECT TO authenticated
USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "insert tenant audit protocols"
ON public.payroll_audit_protocols FOR INSERT TO authenticated
WITH CHECK (
  (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id)
   OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id))
  AND is_tenant_member(auth.uid(), tenant_id)
);

CREATE POLICY "deny update audit protocols"
ON public.payroll_audit_protocols FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "deny delete audit protocols"
ON public.payroll_audit_protocols FOR DELETE TO authenticated
USING (false);
