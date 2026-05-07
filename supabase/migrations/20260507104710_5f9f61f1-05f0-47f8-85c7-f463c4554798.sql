
-- BG-Stammdaten je Mitarbeiter (Mitgliedsnummer + Gefahrtarifstelle)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS bg_mitgliedsnummer TEXT,
  ADD COLUMN IF NOT EXISTS gefahrtarifstelle TEXT;

-- Tabelle für die jährlichen UV-Lohnnachweise (DSLN)
CREATE TABLE IF NOT EXISTS public.uv_jahresmeldungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  year INTEGER NOT NULL,
  bg_mitgliedsnummer TEXT NOT NULL,
  gefahrtarifstelle TEXT NOT NULL,
  anzahl_versicherte INTEGER NOT NULL DEFAULT 0,
  brutto_summe NUMERIC NOT NULL DEFAULT 0,
  geleistete_arbeitsstunden NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'entwurf',
  uebermittelt_am TIMESTAMPTZ,
  transfer_ticket TEXT,
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.uv_jahresmeldungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant uv_jahresmeldungen"
  ON public.uv_jahresmeldungen FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can manage tenant uv_jahresmeldungen"
  ON public.uv_jahresmeldungen FOR ALL TO authenticated
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

CREATE TRIGGER trg_uv_jahresmeldungen_updated_at
  BEFORE UPDATE ON public.uv_jahresmeldungen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_uv_jahresmeldungen_tenant_year
  ON public.uv_jahresmeldungen(tenant_id, year);
