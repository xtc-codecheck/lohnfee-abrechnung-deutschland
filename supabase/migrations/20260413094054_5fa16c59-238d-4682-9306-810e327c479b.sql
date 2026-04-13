
-- =====================================================
-- Phase 4: Multi-Tenancy, Admin-Verwaltung & DSGVO
-- =====================================================

-- 4.1 Tenants (Mandanten) Tabelle
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tax_number TEXT,
  betriebsnummer TEXT,
  street TEXT,
  zip_code TEXT,
  city TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 4.2 Tenant Members (Zuordnung Benutzer → Mandant)
CREATE TABLE public.tenant_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check tenant membership
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

-- Get user's default tenant
CREATE OR REPLACE FUNCTION public.get_default_tenant(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = _user_id AND is_default = true
  LIMIT 1
$$;

-- 4.3 Add tenant_id to all operational tables
ALTER TABLE public.employees ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_periods ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_entries ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.company_settings ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sv_meldungen ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.beitragsnachweise ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.lohnsteuerbescheinigungen ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create indexes for tenant_id
CREATE INDEX idx_employees_tenant ON public.employees(tenant_id);
CREATE INDEX idx_payroll_periods_tenant ON public.payroll_periods(tenant_id);
CREATE INDEX idx_payroll_entries_tenant ON public.payroll_entries(tenant_id);
CREATE INDEX idx_company_settings_tenant ON public.company_settings(tenant_id);
CREATE INDEX idx_sv_meldungen_tenant ON public.sv_meldungen(tenant_id);
CREATE INDEX idx_beitragsnachweise_tenant ON public.beitragsnachweise(tenant_id);
CREATE INDEX idx_lohnsteuerbescheinigungen_tenant ON public.lohnsteuerbescheinigungen(tenant_id);

-- 4.4 RLS Policies for tenants table
CREATE POLICY "Users can view their tenants"
ON public.tenants FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), id));

CREATE POLICY "Admins can manage tenants"
ON public.tenants FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4.5 RLS Policies for tenant_members
CREATE POLICY "Users can view members of their tenants"
ON public.tenant_members FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage tenant members"
ON public.tenant_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4.6 Update existing RLS policies to include tenant isolation
-- Drop old policies and recreate with tenant filter

-- employees
DROP POLICY IF EXISTS "Authenticated can view employees" ON public.employees;
CREATE POLICY "Users can view tenant employees"
ON public.employees FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins and Sachbearbeiter can insert employees" ON public.employees;
CREATE POLICY "Editors can insert tenant employees"
ON public.employees FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'sachbearbeiter'::app_role))
  AND public.is_tenant_member(auth.uid(), tenant_id)
);

DROP POLICY IF EXISTS "Admins and Sachbearbeiter can update employees" ON public.employees;
CREATE POLICY "Editors can update tenant employees"
ON public.employees FOR UPDATE TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'sachbearbeiter'::app_role))
  AND public.is_tenant_member(auth.uid(), tenant_id)
);

DROP POLICY IF EXISTS "Only admins can delete employees" ON public.employees;
CREATE POLICY "Admins can delete tenant employees"
ON public.employees FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_tenant_member(auth.uid(), tenant_id));

-- payroll_periods
DROP POLICY IF EXISTS "Authenticated can view periods" ON public.payroll_periods;
CREATE POLICY "Users can view tenant periods"
ON public.payroll_periods FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins and Sachbearbeiter can manage periods" ON public.payroll_periods;
CREATE POLICY "Editors can manage tenant periods"
ON public.payroll_periods FOR ALL TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'sachbearbeiter'::app_role))
  AND public.is_tenant_member(auth.uid(), tenant_id)
);

-- payroll_entries
DROP POLICY IF EXISTS "Authenticated can view entries" ON public.payroll_entries;
CREATE POLICY "Users can view tenant entries"
ON public.payroll_entries FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins and Sachbearbeiter can manage entries" ON public.payroll_entries;
CREATE POLICY "Editors can manage tenant entries"
ON public.payroll_entries FOR ALL TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'sachbearbeiter'::app_role))
  AND public.is_tenant_member(auth.uid(), tenant_id)
);

-- company_settings
DROP POLICY IF EXISTS "Authenticated users can view company" ON public.company_settings;
CREATE POLICY "Users can view tenant company settings"
ON public.company_settings FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins can manage company" ON public.company_settings;
CREATE POLICY "Admins can manage tenant company settings"
ON public.company_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_tenant_member(auth.uid(), tenant_id));

-- sv_meldungen
DROP POLICY IF EXISTS "Authenticated can view sv_meldungen" ON public.sv_meldungen;
CREATE POLICY "Users can view tenant sv_meldungen"
ON public.sv_meldungen FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins and Sachbearbeiter can manage sv_meldungen" ON public.sv_meldungen;
CREATE POLICY "Editors can manage tenant sv_meldungen"
ON public.sv_meldungen FOR ALL TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'sachbearbeiter'::app_role))
  AND public.is_tenant_member(auth.uid(), tenant_id)
);

-- beitragsnachweise
DROP POLICY IF EXISTS "Authenticated can view beitragsnachweise" ON public.beitragsnachweise;
CREATE POLICY "Users can view tenant beitragsnachweise"
ON public.beitragsnachweise FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins and Sachbearbeiter can manage beitragsnachweise" ON public.beitragsnachweise;
CREATE POLICY "Editors can manage tenant beitragsnachweise"
ON public.beitragsnachweise FOR ALL TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'sachbearbeiter'::app_role))
  AND public.is_tenant_member(auth.uid(), tenant_id)
);

-- lohnsteuerbescheinigungen
DROP POLICY IF EXISTS "Authenticated can view lohnsteuerbescheinigungen" ON public.lohnsteuerbescheinigungen;
CREATE POLICY "Users can view tenant lohnsteuerbescheinigungen"
ON public.lohnsteuerbescheinigungen FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins and Sachbearbeiter can manage lohnsteuerbescheinigungen" ON public.lohnsteuerbescheinigungen;
CREATE POLICY "Editors can manage tenant lohnsteuerbescheinigungen"
ON public.lohnsteuerbescheinigungen FOR ALL TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'sachbearbeiter'::app_role))
  AND public.is_tenant_member(auth.uid(), tenant_id)
);

-- audit_log - update policy
DROP POLICY IF EXISTS "Authenticated can view audit log" ON public.audit_log;
CREATE POLICY "Users can view tenant audit log"
ON public.audit_log FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

-- 4.7 DSGVO: Löschanfragen-Tabelle
CREATE TABLE public.gdpr_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  request_type TEXT NOT NULL, -- 'deletion', 'export', 'rectification'
  subject_type TEXT NOT NULL, -- 'employee', 'user'
  subject_id UUID NOT NULL,
  subject_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'rejected'
  reason TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  retention_end_date DATE, -- gesetzliche Aufbewahrungsfrist
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant gdpr requests"
ON public.gdpr_requests FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage gdpr requests"
ON public.gdpr_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.is_tenant_member(auth.uid(), tenant_id));

-- 4.8 Auto-create tenant for first user (trigger)
CREATE OR REPLACE FUNCTION public.auto_create_tenant_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  member_count INTEGER;
BEGIN
  -- Check if this is the first user (no tenant_members exist)
  SELECT COUNT(*) INTO member_count FROM public.tenant_members;
  
  IF member_count = 0 THEN
    -- Create default tenant
    INSERT INTO public.tenants (name) 
    VALUES ('Mein Unternehmen')
    RETURNING id INTO new_tenant_id;
    
    -- Assign user as member
    INSERT INTO public.tenant_members (tenant_id, user_id, is_default)
    VALUES (new_tenant_id, NEW.id, true);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_tenant
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_tenant_for_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gdpr_requests_updated_at BEFORE UPDATE ON public.gdpr_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit triggers for new tables
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_gdpr_requests AFTER INSERT OR UPDATE OR DELETE ON public.gdpr_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
