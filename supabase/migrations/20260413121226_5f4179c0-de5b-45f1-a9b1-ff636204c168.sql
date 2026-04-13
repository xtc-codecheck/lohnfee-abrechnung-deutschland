
-- ============================================
-- PHASE 1: SICHERHEIT & REFERENZIELLE INTEGRITÄT (RETRY)
-- ============================================

-- 1. FIX: Privilege Escalation in user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. FIX: Audit-Log nur über Trigger beschreibbar
DROP POLICY IF EXISTS "Authenticated users can insert audit log entries" ON public.audit_log;

-- 3. FOREIGN KEYS (nur fehlende, mit DO-Block für idempotent)
DO $$
BEGIN
  -- payroll_periods → tenants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payroll_periods_tenant') THEN
    ALTER TABLE public.payroll_periods ADD CONSTRAINT fk_payroll_periods_tenant
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- payroll_entries → employees
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payroll_entries_employee') THEN
    ALTER TABLE public.payroll_entries ADD CONSTRAINT fk_payroll_entries_employee
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
  END IF;

  -- payroll_entries → payroll_periods
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payroll_entries_period') THEN
    ALTER TABLE public.payroll_entries ADD CONSTRAINT fk_payroll_entries_period
      FOREIGN KEY (payroll_period_id) REFERENCES public.payroll_periods(id) ON DELETE RESTRICT;
  END IF;

  -- payroll_entries → tenants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payroll_entries_tenant') THEN
    ALTER TABLE public.payroll_entries ADD CONSTRAINT fk_payroll_entries_tenant
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- company_settings → tenants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_company_settings_tenant') THEN
    ALTER TABLE public.company_settings ADD CONSTRAINT fk_company_settings_tenant
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- gdpr_requests → tenants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gdpr_requests_tenant') THEN
    ALTER TABLE public.gdpr_requests ADD CONSTRAINT fk_gdpr_requests_tenant
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- audit_log → tenants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_audit_log_tenant') THEN
    ALTER TABLE public.audit_log ADD CONSTRAINT fk_audit_log_tenant
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- tenant_members → tenants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_members_tenant') THEN
    ALTER TABLE public.tenant_members ADD CONSTRAINT fk_tenant_members_tenant
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;
END $$;
