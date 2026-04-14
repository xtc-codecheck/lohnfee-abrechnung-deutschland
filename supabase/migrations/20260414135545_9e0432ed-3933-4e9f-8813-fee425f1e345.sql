-- Add FK constraints where they don't already exist
-- Using IF NOT EXISTS pattern via DO blocks

DO $$
BEGIN
  -- audit_log -> tenants (only if not already present via named FK)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_audit_log_tenant') THEN
    -- already exists per schema
    NULL;
  END IF;

  -- beitragsnachweise -> tenants
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_beitragsnachweise_tenant') THEN
    -- already exists per schema
    NULL;
  END IF;

  -- company_settings -> tenants  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_company_settings_tenant') THEN
    -- already exists per schema
    NULL;
  END IF;

  -- payroll_entries -> employees (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payroll_entries_employee_cascade') THEN
    -- Drop the non-cascade version if it exists, then re-add with CASCADE
    ALTER TABLE public.payroll_entries DROP CONSTRAINT IF EXISTS fk_payroll_entries_employee;
    ALTER TABLE public.payroll_entries DROP CONSTRAINT IF EXISTS payroll_entries_employee_id_fkey;
    ALTER TABLE public.payroll_entries 
      ADD CONSTRAINT fk_payroll_entries_employee_cascade 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- payroll_entries -> payroll_periods (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payroll_entries_period_cascade') THEN
    ALTER TABLE public.payroll_entries DROP CONSTRAINT IF EXISTS fk_payroll_entries_period;
    ALTER TABLE public.payroll_entries DROP CONSTRAINT IF EXISTS payroll_entries_payroll_period_id_fkey;
    ALTER TABLE public.payroll_entries 
      ADD CONSTRAINT fk_payroll_entries_period_cascade 
      FOREIGN KEY (payroll_period_id) REFERENCES public.payroll_periods(id) ON DELETE CASCADE;
  END IF;

  -- payroll_entries -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payroll_entries_tenant_cascade') THEN
    ALTER TABLE public.payroll_entries DROP CONSTRAINT IF EXISTS fk_payroll_entries_tenant;
    ALTER TABLE public.payroll_entries DROP CONSTRAINT IF EXISTS payroll_entries_tenant_id_fkey;
    ALTER TABLE public.payroll_entries 
      ADD CONSTRAINT fk_payroll_entries_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- sv_meldungen -> employees (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sv_meldungen_employee_cascade') THEN
    ALTER TABLE public.sv_meldungen DROP CONSTRAINT IF EXISTS fk_sv_meldungen_employee;
    ALTER TABLE public.sv_meldungen DROP CONSTRAINT IF EXISTS sv_meldungen_employee_id_fkey;
    ALTER TABLE public.sv_meldungen 
      ADD CONSTRAINT fk_sv_meldungen_employee_cascade 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- sv_meldungen -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sv_meldungen_tenant_cascade') THEN
    ALTER TABLE public.sv_meldungen DROP CONSTRAINT IF EXISTS fk_sv_meldungen_tenant;
    ALTER TABLE public.sv_meldungen DROP CONSTRAINT IF EXISTS sv_meldungen_tenant_id_fkey;
    ALTER TABLE public.sv_meldungen 
      ADD CONSTRAINT fk_sv_meldungen_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- lohnsteuerbescheinigungen -> employees (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lstb_employee_cascade') THEN
    ALTER TABLE public.lohnsteuerbescheinigungen DROP CONSTRAINT IF EXISTS fk_lstb_employee;
    ALTER TABLE public.lohnsteuerbescheinigungen DROP CONSTRAINT IF EXISTS lohnsteuerbescheinigungen_employee_id_fkey;
    ALTER TABLE public.lohnsteuerbescheinigungen 
      ADD CONSTRAINT fk_lstb_employee_cascade 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- lohnsteuerbescheinigungen -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lstb_tenant_cascade') THEN
    ALTER TABLE public.lohnsteuerbescheinigungen DROP CONSTRAINT IF EXISTS fk_lstb_tenant;
    ALTER TABLE public.lohnsteuerbescheinigungen DROP CONSTRAINT IF EXISTS lohnsteuerbescheinigungen_tenant_id_fkey;
    ALTER TABLE public.lohnsteuerbescheinigungen 
      ADD CONSTRAINT fk_lstb_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- special_payments -> employees (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_special_payments_employee_cascade') THEN
    ALTER TABLE public.special_payments DROP CONSTRAINT IF EXISTS special_payments_employee_id_fkey;
    ALTER TABLE public.special_payments 
      ADD CONSTRAINT fk_special_payments_employee_cascade 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- special_payments -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_special_payments_tenant_cascade') THEN
    ALTER TABLE public.special_payments DROP CONSTRAINT IF EXISTS special_payments_tenant_id_fkey;
    ALTER TABLE public.special_payments 
      ADD CONSTRAINT fk_special_payments_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- compliance_alerts -> employees (set null)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_compliance_alerts_employee_cascade') THEN
    ALTER TABLE public.compliance_alerts DROP CONSTRAINT IF EXISTS compliance_alerts_employee_id_fkey;
    ALTER TABLE public.compliance_alerts 
      ADD CONSTRAINT fk_compliance_alerts_employee_cascade 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;

  -- compliance_alerts -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_compliance_alerts_tenant_cascade') THEN
    ALTER TABLE public.compliance_alerts DROP CONSTRAINT IF EXISTS compliance_alerts_tenant_id_fkey;
    ALTER TABLE public.compliance_alerts 
      ADD CONSTRAINT fk_compliance_alerts_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- time_entries -> employees (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_time_entries_employee_cascade') THEN
    ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_employee_id_fkey;
    ALTER TABLE public.time_entries 
      ADD CONSTRAINT fk_time_entries_employee_cascade 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- time_entries -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_time_entries_tenant_cascade') THEN
    ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_tenant_id_fkey;
    ALTER TABLE public.time_entries 
      ADD CONSTRAINT fk_time_entries_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- payroll_guardian_anomalies -> employees (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_guardian_anomalies_employee_cascade') THEN
    ALTER TABLE public.payroll_guardian_anomalies DROP CONSTRAINT IF EXISTS payroll_guardian_anomalies_employee_id_fkey;
    ALTER TABLE public.payroll_guardian_anomalies 
      ADD CONSTRAINT fk_guardian_anomalies_employee_cascade 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- payroll_guardian_anomalies -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_guardian_anomalies_tenant_cascade') THEN
    ALTER TABLE public.payroll_guardian_anomalies DROP CONSTRAINT IF EXISTS payroll_guardian_anomalies_tenant_id_fkey;
    ALTER TABLE public.payroll_guardian_anomalies 
      ADD CONSTRAINT fk_guardian_anomalies_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- payroll_guardian_history -> employees (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_guardian_history_employee_cascade') THEN
    ALTER TABLE public.payroll_guardian_history DROP CONSTRAINT IF EXISTS payroll_guardian_history_employee_id_fkey;
    ALTER TABLE public.payroll_guardian_history 
      ADD CONSTRAINT fk_guardian_history_employee_cascade 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- payroll_guardian_history -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_guardian_history_tenant_cascade') THEN
    ALTER TABLE public.payroll_guardian_history DROP CONSTRAINT IF EXISTS payroll_guardian_history_tenant_id_fkey;
    ALTER TABLE public.payroll_guardian_history 
      ADD CONSTRAINT fk_guardian_history_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- payroll_periods -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payroll_periods_tenant_cascade') THEN
    ALTER TABLE public.payroll_periods DROP CONSTRAINT IF EXISTS fk_payroll_periods_tenant;
    ALTER TABLE public.payroll_periods DROP CONSTRAINT IF EXISTS payroll_periods_tenant_id_fkey;
    ALTER TABLE public.payroll_periods 
      ADD CONSTRAINT fk_payroll_periods_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- employees -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employees_tenant_cascade') THEN
    ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS fk_employees_tenant;
    ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_tenant_id_fkey;
    ALTER TABLE public.employees 
      ADD CONSTRAINT fk_employees_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- tenant_members -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_members_tenant_cascade') THEN
    ALTER TABLE public.tenant_members DROP CONSTRAINT IF EXISTS fk_tenant_members_tenant;
    ALTER TABLE public.tenant_members DROP CONSTRAINT IF EXISTS tenant_members_tenant_id_fkey;
    ALTER TABLE public.tenant_members 
      ADD CONSTRAINT fk_tenant_members_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- user_roles -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_roles_tenant_cascade') THEN
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_tenant_id_fkey;
    ALTER TABLE public.user_roles 
      ADD CONSTRAINT fk_user_roles_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- gdpr_requests -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gdpr_requests_tenant_cascade') THEN
    ALTER TABLE public.gdpr_requests DROP CONSTRAINT IF EXISTS fk_gdpr_requests_tenant;
    ALTER TABLE public.gdpr_requests DROP CONSTRAINT IF EXISTS gdpr_requests_tenant_id_fkey;
    ALTER TABLE public.gdpr_requests 
      ADD CONSTRAINT fk_gdpr_requests_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  -- lohnsteueranmeldungen -> tenants (cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lsta_tenant_cascade') THEN
    ALTER TABLE public.lohnsteueranmeldungen DROP CONSTRAINT IF EXISTS lohnsteueranmeldungen_tenant_id_fkey;
    ALTER TABLE public.lohnsteueranmeldungen 
      ADD CONSTRAINT fk_lsta_tenant_cascade 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

END $$;