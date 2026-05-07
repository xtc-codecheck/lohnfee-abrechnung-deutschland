
CREATE TABLE IF NOT EXISTS public.bescheinigungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  bescheinigung_typ TEXT NOT NULL, -- 'eel_krankengeld' | 'eel_mutterschaft' | 'eel_kinderkrankengeld' | 'eel_verletztengeld' | 'bea_arbeitslosengeld'
  empfaenger_typ TEXT NOT NULL,    -- 'krankenkasse' | 'arbeitsagentur' | 'unfallversicherung'
  empfaenger_name TEXT NOT NULL,
  empfaenger_betriebsnummer TEXT,
  zeitraum_von DATE NOT NULL,
  zeitraum_bis DATE NOT NULL,
  brutto_entgelt NUMERIC NOT NULL DEFAULT 0,
  netto_entgelt NUMERIC NOT NULL DEFAULT 0,
  sv_brutto NUMERIC NOT NULL DEFAULT 0,
  arbeitsstunden NUMERIC NOT NULL DEFAULT 0,
  letzter_arbeitstag DATE,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'entwurf',
  uebermittelt_am TIMESTAMPTZ,
  transfer_ticket TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bescheinigungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant bescheinigungen"
  ON public.bescheinigungen FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can manage tenant bescheinigungen"
  ON public.bescheinigungen FOR ALL TO authenticated
  USING (
    (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id)
     OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id))
    AND is_tenant_member(auth.uid(), tenant_id)
  )
  WITH CHECK (
    (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id)
     OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id))
    AND is_tenant_member(auth.uid(), tenant_id)
  );

CREATE TRIGGER trg_bescheinigungen_updated_at
  BEFORE UPDATE ON public.bescheinigungen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_bescheinigungen_tenant_emp
  ON public.bescheinigungen(tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_bescheinigungen_status
  ON public.bescheinigungen(tenant_id, status);
