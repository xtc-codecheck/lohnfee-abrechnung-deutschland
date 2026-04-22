-- P3: Mandantenbesonderheiten + Versorgungswerk + eAU-Tracking

-- 1. Freitextfeld für Mandantenbesonderheiten
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS besonderheiten text;

-- 2. Versorgungswerk-Stammdaten je Mitarbeiter
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS versorgungswerk_name text,
ADD COLUMN IF NOT EXISTS versorgungswerk_mitgliedsnummer text,
ADD COLUMN IF NOT EXISTS versorgungswerk_beitragssatz numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rv_befreit boolean DEFAULT false;

-- 3. eAU-Tracking-Tabelle
CREATE TABLE IF NOT EXISTS public.eau_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  au_von date NOT NULL,
  au_bis date NOT NULL,
  diagnose_vorhanden boolean DEFAULT false,
  ist_folge_au boolean DEFAULT false,
  abruf_status text NOT NULL DEFAULT 'offen', -- offen | abgerufen | fehler | manuell
  abruf_datum timestamp with time zone,
  arzt_name text,
  arbeitgeber_kenntnis_datum date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.eau_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors can manage tenant eau_records"
  ON public.eau_records FOR ALL TO authenticated
  USING (
    (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id)
      OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id))
    AND is_tenant_member(auth.uid(), tenant_id)
  );

CREATE POLICY "Users can view tenant eau_records"
  ON public.eau_records FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER update_eau_records_updated_at
  BEFORE UPDATE ON public.eau_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_eau_records_tenant_employee
  ON public.eau_records (tenant_id, employee_id, au_von DESC);