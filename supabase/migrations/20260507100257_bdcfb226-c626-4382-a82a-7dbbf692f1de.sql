
CREATE TABLE public.aag_antraege (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  krankenkasse text NOT NULL,
  betriebsnummer_kk text,
  antrag_typ text NOT NULL CHECK (antrag_typ IN ('U1','U2')),
  zeitraum_von date NOT NULL,
  zeitraum_bis date NOT NULL,
  brutto_entgelt numeric NOT NULL DEFAULT 0,
  fortzahlungstage integer NOT NULL DEFAULT 0,
  erstattungssatz numeric NOT NULL DEFAULT 0,
  erstattungsbetrag numeric NOT NULL DEFAULT 0,
  sv_beitraege numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'entwurf',
  gemeldet_am timestamptz,
  bestaetigt_am timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX idx_aag_antraege_tenant ON public.aag_antraege(tenant_id);
CREATE INDEX idx_aag_antraege_employee ON public.aag_antraege(employee_id);

ALTER TABLE public.aag_antraege ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant aag_antraege"
  ON public.aag_antraege FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can manage tenant aag_antraege"
  ON public.aag_antraege FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(),'admin'::app_role,tenant_id) OR has_role_in_tenant(auth.uid(),'sachbearbeiter'::app_role,tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER aag_antraege_updated_at
  BEFORE UPDATE ON public.aag_antraege
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
