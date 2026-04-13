
-- ============================================
-- PHASE 2: TABELLEN FÜR LOCALSTORAGE-MIGRATION
-- ============================================

-- 1. TIME_ENTRIES
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'work',
  hours_worked NUMERIC,
  start_time TEXT,
  end_time TEXT,
  break_time NUMERIC, -- Minuten
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, employee_id, date)
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant time entries"
ON public.time_entries FOR SELECT TO authenticated
USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can manage tenant time entries"
ON public.time_entries FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sachbearbeiter'::app_role)) AND is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER update_time_entries_updated_at
BEFORE UPDATE ON public.time_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. SPECIAL_PAYMENTS
CREATE TABLE public.special_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL, -- 'sick_pay', 'maternity', 'short_time_work'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.special_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant special payments"
ON public.special_payments FOR SELECT TO authenticated
USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can manage tenant special payments"
ON public.special_payments FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sachbearbeiter'::app_role)) AND is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER update_special_payments_updated_at
BEFORE UPDATE ON public.special_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. COMPLIANCE_ALERTS
CREATE TABLE public.compliance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant compliance alerts"
ON public.compliance_alerts FOR SELECT TO authenticated
USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can manage tenant compliance alerts"
ON public.compliance_alerts FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sachbearbeiter'::app_role)) AND is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER update_compliance_alerts_updated_at
BEFORE UPDATE ON public.compliance_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. PAYROLL_GUARDIAN_ANOMALIES
CREATE TABLE public.payroll_guardian_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  expected_value NUMERIC,
  deviation NUMERIC,
  period TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolution TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_guardian_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant anomalies"
ON public.payroll_guardian_anomalies FOR SELECT TO authenticated
USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can manage tenant anomalies"
ON public.payroll_guardian_anomalies FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sachbearbeiter'::app_role)) AND is_tenant_member(auth.uid(), tenant_id));

-- 5. PAYROLL_GUARDIAN_HISTORY
CREATE TABLE public.payroll_guardian_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  gross_salary NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  overtime NUMERIC NOT NULL DEFAULT 0,
  bonuses NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, employee_id, period)
);

ALTER TABLE public.payroll_guardian_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant guardian history"
ON public.payroll_guardian_history FOR SELECT TO authenticated
USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can manage tenant guardian history"
ON public.payroll_guardian_history FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sachbearbeiter'::app_role)) AND is_tenant_member(auth.uid(), tenant_id));
