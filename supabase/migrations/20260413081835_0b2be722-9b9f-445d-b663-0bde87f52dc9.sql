
-- Rollen-Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'sachbearbeiter', 'leserecht');

-- User-Roles-Tabelle
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-Definer-Funktion für Rollenprüfung
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Hilfsfunktion: Hat der Nutzer mindestens Leserecht?
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS für user_roles: Admins können alles, jeder sieht seine eigenen
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles-Tabelle
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger: Auto-Create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Firmenstammdaten
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  street TEXT,
  zip_code TEXT,
  city TEXT,
  tax_number TEXT,
  tax_office TEXT,
  betriebsnummer TEXT,
  bank_name TEXT,
  iban TEXT,
  bic TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view company" ON public.company_settings
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage company" ON public.company_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Mitarbeiter-Tabelle
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('männlich', 'weiblich', 'divers')),
  street TEXT,
  zip_code TEXT,
  city TEXT,
  tax_id TEXT,
  tax_class INTEGER CHECK (tax_class BETWEEN 1 AND 6),
  church_tax BOOLEAN DEFAULT false,
  church_tax_rate NUMERIC(5,2) DEFAULT 0,
  sv_number TEXT,
  health_insurance TEXT,
  health_insurance_number TEXT,
  iban TEXT,
  bic TEXT,
  gross_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  employment_type TEXT DEFAULT 'vollzeit' CHECK (employment_type IN ('vollzeit', 'teilzeit', 'minijob', 'midijob', 'werkstudent', 'praktikant', 'auszubildender')),
  weekly_hours NUMERIC(5,2) DEFAULT 40,
  entry_date DATE,
  exit_date DATE,
  department TEXT,
  position TEXT,
  children_allowance NUMERIC(3,1) DEFAULT 0,
  has_bav BOOLEAN DEFAULT false,
  bav_monthly_amount NUMERIC(10,2) DEFAULT 0,
  has_company_car BOOLEAN DEFAULT false,
  company_car_list_price NUMERIC(12,2) DEFAULT 0,
  company_car_distance_km NUMERIC(5,1) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view employees" ON public.employees
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins and Sachbearbeiter can insert employees" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sachbearbeiter')
  );

CREATE POLICY "Admins and Sachbearbeiter can update employees" ON public.employees
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sachbearbeiter')
  );

CREATE POLICY "Only admins can delete employees" ON public.employees
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Abrechnungszeiträume
CREATE TABLE public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'finalized', 'exported')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view periods" ON public.payroll_periods
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins and Sachbearbeiter can manage periods" ON public.payroll_periods
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sachbearbeiter')
  );

-- Abrechnungseinträge
CREATE TABLE public.payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE RESTRICT NOT NULL,
  gross_salary NUMERIC(12,2) NOT NULL,
  net_salary NUMERIC(12,2) NOT NULL,
  tax_income_tax NUMERIC(10,2) DEFAULT 0,
  tax_solidarity NUMERIC(10,2) DEFAULT 0,
  tax_church NUMERIC(10,2) DEFAULT 0,
  tax_total NUMERIC(10,2) DEFAULT 0,
  sv_health_employee NUMERIC(10,2) DEFAULT 0,
  sv_health_employer NUMERIC(10,2) DEFAULT 0,
  sv_pension_employee NUMERIC(10,2) DEFAULT 0,
  sv_pension_employer NUMERIC(10,2) DEFAULT 0,
  sv_unemployment_employee NUMERIC(10,2) DEFAULT 0,
  sv_unemployment_employer NUMERIC(10,2) DEFAULT 0,
  sv_care_employee NUMERIC(10,2) DEFAULT 0,
  sv_care_employer NUMERIC(10,2) DEFAULT 0,
  sv_total_employee NUMERIC(10,2) DEFAULT 0,
  sv_total_employer NUMERIC(10,2) DEFAULT 0,
  employer_costs NUMERIC(12,2) DEFAULT 0,
  bonus NUMERIC(10,2) DEFAULT 0,
  overtime_hours NUMERIC(6,2) DEFAULT 0,
  overtime_pay NUMERIC(10,2) DEFAULT 0,
  deductions NUMERIC(10,2) DEFAULT 0,
  deduction_description TEXT,
  final_net_salary NUMERIC(12,2) NOT NULL,
  audit_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payroll_period_id, employee_id)
);
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view entries" ON public.payroll_entries
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins and Sachbearbeiter can manage entries" ON public.payroll_entries
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sachbearbeiter')
  );

-- Audit-Log (revisionssicher)
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Audit-Log ist nur lesbar, nie änderbar
CREATE POLICY "Authenticated can view audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

-- Audit-Trigger-Funktion
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, action, new_values)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, action, old_values, new_values)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, action, old_values)
    VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Audit-Trigger auf kritische Tabellen
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_payroll_entries AFTER INSERT OR UPDATE OR DELETE ON public.payroll_entries
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_payroll_periods AFTER INSERT OR UPDATE OR DELETE ON public.payroll_periods
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_company_settings AFTER INSERT OR UPDATE OR DELETE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Updated-at Trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_entries_updated_at BEFORE UPDATE ON public.payroll_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indizes für Performance
CREATE INDEX idx_employees_active ON public.employees(is_active);
CREATE INDEX idx_employees_personal_number ON public.employees(personal_number);
CREATE INDEX idx_payroll_entries_period ON public.payroll_entries(payroll_period_id);
CREATE INDEX idx_payroll_entries_employee ON public.payroll_entries(employee_id);
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name, created_at DESC);
CREATE INDEX idx_audit_log_record ON public.audit_log(record_id);
