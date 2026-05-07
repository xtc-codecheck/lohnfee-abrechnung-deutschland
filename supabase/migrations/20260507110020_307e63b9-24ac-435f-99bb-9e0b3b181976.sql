
-- ============================================================
-- Phase 2-4: Pfändung, Reisekosten, StB-Workflow, DEÜV, ZVK
-- ============================================================

-- Add steuerberater role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'steuerberater';

-- ============================================================
-- Phase 2.5: Pfändungstabelle (Jahres-Loader, DB-gestützt)
-- ============================================================
CREATE TABLE public.pfaendung_tabellen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  base_exemption NUMERIC NOT NULL,
  per_dependent_increase NUMERIC NOT NULL,
  max_dependents INTEGER NOT NULL DEFAULT 5,
  base_pfaendungs_rate NUMERIC NOT NULL DEFAULT 0.3,
  rate_reduction_per_dependent NUMERIC NOT NULL DEFAULT 0.1,
  full_garnishment_threshold NUMERIC NOT NULL,
  valid_from DATE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pfaendung_tabellen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view pfaendung tables"
  ON public.pfaendung_tabellen FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only platform admins can modify pfaendung tables"
  ON public.pfaendung_tabellen FOR ALL TO authenticated
  USING (is_primary_admin(auth.uid())) WITH CHECK (is_primary_admin(auth.uid()));

INSERT INTO public.pfaendung_tabellen (year, base_exemption, per_dependent_increase, full_garnishment_threshold, valid_from, source)
VALUES
  (2025, 1491.75, 561.43, 4298.81, '2024-07-01', 'Pfändungsfreigrenzenbekanntmachung 2024'),
  (2026, 1559.99, 587.97, 4500.00, '2025-07-01', 'Pfändungsfreigrenzenbekanntmachung 2025 (vorläufig)');

-- ============================================================
-- Phase 2.6: Reisekosten als Vollmodul
-- ============================================================
CREATE TABLE public.travel_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  purpose TEXT NOT NULL,
  destination TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'DE',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'entwurf', -- entwurf | eingereicht | genehmigt | abgelehnt | abgerechnet
  notes TEXT,
  total_meal_allowance NUMERIC NOT NULL DEFAULT 0,
  total_lodging NUMERIC NOT NULL DEFAULT 0,
  total_mileage NUMERIC NOT NULL DEFAULT 0,
  total_other NUMERIC NOT NULL DEFAULT 0,
  total_taxable NUMERIC NOT NULL DEFAULT 0,
  total_tax_free NUMERIC NOT NULL DEFAULT 0,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_travel_trips_tenant ON public.travel_trips(tenant_id);
CREATE INDEX idx_travel_trips_employee ON public.travel_trips(employee_id);

CREATE TABLE public.travel_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.travel_trips(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  leg_date DATE NOT NULL,
  duration_hours NUMERIC NOT NULL DEFAULT 0,
  is_overnight BOOLEAN NOT NULL DEFAULT false,
  is_arrival_or_departure BOOLEAN NOT NULL DEFAULT false,
  country_code TEXT NOT NULL DEFAULT 'DE',
  km_distance NUMERIC NOT NULL DEFAULT 0,
  vehicle_type TEXT NOT NULL DEFAULT 'pkw', -- pkw | motorrad | other
  meal_allowance NUMERIC NOT NULL DEFAULT 0,
  lodging_amount NUMERIC NOT NULL DEFAULT 0,
  lodging_is_receipt BOOLEAN NOT NULL DEFAULT false,
  mileage_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_travel_legs_trip ON public.travel_legs(trip_id);

CREATE TABLE public.travel_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.travel_trips(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  receipt_date DATE NOT NULL,
  category TEXT NOT NULL, -- lodging | meal | transport | other
  amount NUMERIC NOT NULL DEFAULT 0,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  storage_path TEXT,
  is_taxable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_travel_receipts_trip ON public.travel_receipts(trip_id);

ALTER TABLE public.travel_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view tenant travel_trips" ON public.travel_trips FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant travel_trips" ON public.travel_trips FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id));

CREATE POLICY "view tenant travel_legs" ON public.travel_legs FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant travel_legs" ON public.travel_legs FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id));

CREATE POLICY "view tenant travel_receipts" ON public.travel_receipts FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant travel_receipts" ON public.travel_receipts FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id));

CREATE TRIGGER tr_travel_trips_updated BEFORE UPDATE ON public.travel_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('travel-receipts', 'travel-receipts', false)
  ON CONFLICT (id) DO NOTHING;
CREATE POLICY "tenant members can read travel receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'travel-receipts');
CREATE POLICY "tenant members can upload travel receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'travel-receipts');
CREATE POLICY "tenant members can delete travel receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'travel-receipts');

-- ============================================================
-- Phase 3.7: Steuerberater Mandanten-Workflow
-- ============================================================
CREATE TABLE public.mandant_zuordnung (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steuerberater_user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'read', -- read | review | release
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (steuerberater_user_id, tenant_id)
);
ALTER TABLE public.mandant_zuordnung ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Steuerberater can view their mandants"
  ON public.mandant_zuordnung FOR SELECT TO authenticated
  USING (steuerberater_user_id = auth.uid() OR has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id));
CREATE POLICY "Tenant admins manage mandant_zuordnung"
  ON public.mandant_zuordnung FOR ALL TO authenticated
  USING (has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id))
  WITH CHECK (has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id));

-- Helper: is steuerberater for tenant
CREATE OR REPLACE FUNCTION public.is_steuerberater_for_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mandant_zuordnung
    WHERE steuerberater_user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

CREATE TABLE public.payroll_run_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  payroll_period_id UUID NOT NULL,
  author_user_id UUID NOT NULL,
  author_role TEXT NOT NULL, -- mandant | steuerberater
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prm_period ON public.payroll_run_messages(payroll_period_id);
ALTER TABLE public.payroll_run_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view tenant or stb messages"
  ON public.payroll_run_messages FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id) OR is_steuerberater_for_tenant(auth.uid(), tenant_id));
CREATE POLICY "post tenant or stb messages"
  ON public.payroll_run_messages FOR INSERT TO authenticated
  WITH CHECK ((is_tenant_member(auth.uid(), tenant_id) OR is_steuerberater_for_tenant(auth.uid(), tenant_id)) AND author_user_id = auth.uid());

-- Add release workflow columns to payroll_periods
ALTER TABLE public.payroll_periods
  ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_for_review_by UUID,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS released_by UUID,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'open'; -- open | in_review | released | rejected

-- Cross-tenant read for steuerberater on key tables
CREATE POLICY "Steuerberater can view assigned tenant employees"
  ON public.employees FOR SELECT TO authenticated
  USING (is_steuerberater_for_tenant(auth.uid(), tenant_id));
CREATE POLICY "Steuerberater can view assigned tenant payroll periods"
  ON public.payroll_periods FOR SELECT TO authenticated
  USING (is_steuerberater_for_tenant(auth.uid(), tenant_id));
CREATE POLICY "Steuerberater can view assigned tenant payroll entries"
  ON public.payroll_entries FOR SELECT TO authenticated
  USING (is_steuerberater_for_tenant(auth.uid(), tenant_id));

-- ============================================================
-- Phase 3.8: DEÜV-Rückmeldungen
-- ============================================================
CREATE TABLE public.deuev_rueckmeldungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  sv_meldung_id UUID,
  krankenkasse TEXT NOT NULL,
  betriebsnummer_kk TEXT,
  rueckmeldung_typ TEXT NOT NULL, -- bestaetigung | fehler | korrektur
  fehler_code TEXT,
  fehler_text TEXT,
  empfangen_am TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_xml TEXT,
  status TEXT NOT NULL DEFAULT 'neu', -- neu | bearbeitet | ignoriert
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deuev_rueck_tenant ON public.deuev_rueckmeldungen(tenant_id);
ALTER TABLE public.deuev_rueckmeldungen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view tenant deuev_rueck" ON public.deuev_rueckmeldungen FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant deuev_rueck" ON public.deuev_rueckmeldungen FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id));

-- ============================================================
-- Phase 3.9: ZVK / Pensionskassen-Meldungen
-- ============================================================
CREATE TABLE public.zvk_kassen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  kassen_typ TEXT NOT NULL, -- zvk_geruestbau | zvk_maler | pensionskasse | other
  mitgliedsnummer TEXT,
  beitragssatz_arbeitgeber NUMERIC NOT NULL DEFAULT 0,
  beitragssatz_arbeitnehmer NUMERIC NOT NULL DEFAULT 0,
  bemessungsgrundlage TEXT NOT NULL DEFAULT 'brutto', -- brutto | sv_brutto | other
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.zvk_meldungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  kasse_id UUID NOT NULL REFERENCES public.zvk_kassen(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER, -- NULL für Jahresmeldung
  meldungs_typ TEXT NOT NULL DEFAULT 'beitrag', -- beitrag | jahresmeldung
  anzahl_versicherte INTEGER NOT NULL DEFAULT 0,
  bemessungssumme NUMERIC NOT NULL DEFAULT 0,
  beitrag_arbeitgeber NUMERIC NOT NULL DEFAULT 0,
  beitrag_arbeitnehmer NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'entwurf',
  uebermittelt_am TIMESTAMPTZ,
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.zvk_kassen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zvk_meldungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view tenant zvk_kassen" ON public.zvk_kassen FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant zvk_kassen" ON public.zvk_kassen FOR ALL TO authenticated
  USING (has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id))
  WITH CHECK (has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id));

CREATE POLICY "view tenant zvk_meldungen" ON public.zvk_meldungen FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant zvk_meldungen" ON public.zvk_meldungen FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(),tenant_id));
