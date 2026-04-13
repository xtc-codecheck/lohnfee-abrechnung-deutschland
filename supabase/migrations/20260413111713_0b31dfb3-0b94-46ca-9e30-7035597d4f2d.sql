
-- =============================================
-- SCHRITT 1: Testdaten bereinigen
-- =============================================
DELETE FROM public.lohnsteuerbescheinigungen WHERE employee_id IN (SELECT id FROM public.employees WHERE first_name = 'Anna' AND last_name = 'Testmeier');
DELETE FROM public.sv_meldungen WHERE employee_id IN (SELECT id FROM public.employees WHERE first_name = 'Anna' AND last_name = 'Testmeier');
DELETE FROM public.payroll_entries WHERE employee_id IN (SELECT id FROM public.employees WHERE first_name = 'Anna' AND last_name = 'Testmeier');
DELETE FROM public.beitragsnachweise WHERE tenant_id IN (SELECT tenant_id FROM public.employees WHERE first_name = 'Anna' AND last_name = 'Testmeier');
DELETE FROM public.payroll_periods WHERE tenant_id IN (SELECT tenant_id FROM public.employees WHERE first_name = 'Anna' AND last_name = 'Testmeier') AND NOT EXISTS (SELECT 1 FROM public.payroll_entries WHERE payroll_entries.payroll_period_id = payroll_periods.id);
DELETE FROM public.employees WHERE first_name = 'Anna' AND last_name = 'Testmeier';

-- =============================================
-- SCHRITT 2: Foreign Keys
-- =============================================

-- employees -> tenants
ALTER TABLE public.employees
  ADD CONSTRAINT fk_employees_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- payroll_periods -> tenants
ALTER TABLE public.payroll_periods
  ADD CONSTRAINT fk_payroll_periods_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- payroll_entries -> employees
ALTER TABLE public.payroll_entries
  ADD CONSTRAINT fk_payroll_entries_employee
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- payroll_entries -> payroll_periods
ALTER TABLE public.payroll_entries
  ADD CONSTRAINT fk_payroll_entries_period
  FOREIGN KEY (payroll_period_id) REFERENCES public.payroll_periods(id) ON DELETE CASCADE;

-- payroll_entries -> tenants
ALTER TABLE public.payroll_entries
  ADD CONSTRAINT fk_payroll_entries_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- sv_meldungen -> employees
ALTER TABLE public.sv_meldungen
  ADD CONSTRAINT fk_sv_meldungen_employee
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- sv_meldungen -> tenants
ALTER TABLE public.sv_meldungen
  ADD CONSTRAINT fk_sv_meldungen_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- lohnsteuerbescheinigungen -> employees
ALTER TABLE public.lohnsteuerbescheinigungen
  ADD CONSTRAINT fk_lstb_employee
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- lohnsteuerbescheinigungen -> tenants
ALTER TABLE public.lohnsteuerbescheinigungen
  ADD CONSTRAINT fk_lstb_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- beitragsnachweise -> tenants
ALTER TABLE public.beitragsnachweise
  ADD CONSTRAINT fk_beitragsnachweise_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- company_settings -> tenants
ALTER TABLE public.company_settings
  ADD CONSTRAINT fk_company_settings_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- gdpr_requests -> tenants
ALTER TABLE public.gdpr_requests
  ADD CONSTRAINT fk_gdpr_requests_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- audit_log -> tenants
ALTER TABLE public.audit_log
  ADD CONSTRAINT fk_audit_log_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- tenant_members -> tenants
ALTER TABLE public.tenant_members
  ADD CONSTRAINT fk_tenant_members_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- tenant_members -> auth.users
ALTER TABLE public.tenant_members
  ADD CONSTRAINT fk_tenant_members_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- profiles -> auth.users
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_roles -> auth.users
ALTER TABLE public.user_roles
  ADD CONSTRAINT fk_user_roles_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =============================================
-- SCHRITT 3: Personalnummern-Automatik
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_personal_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  IF NEW.personal_number IS NULL OR NEW.personal_number = '' THEN
    SELECT COALESCE(MAX(CAST(personal_number AS INTEGER)), 1000) + 1
    INTO next_number
    FROM public.employees
    WHERE tenant_id = NEW.tenant_id
      AND personal_number ~ '^\d+$';

    NEW.personal_number := next_number::TEXT;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_personal_number
  BEFORE INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_personal_number();

-- =============================================
-- SCHRITT 6: Audit-Log INSERT-Policy
-- =============================================

CREATE POLICY "Authenticated users can insert audit log entries"
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (is_tenant_member(auth.uid(), tenant_id));

-- =============================================
-- SCHRITT 7: SV-Meldungen Unique Constraint
-- =============================================

CREATE UNIQUE INDEX idx_sv_meldungen_unique_check
  ON public.sv_meldungen (employee_id, meldegrund, zeitraum_von, zeitraum_bis, tenant_id)
  WHERE storniert_am IS NULL;
