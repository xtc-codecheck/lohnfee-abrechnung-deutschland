-- Tabelle für Lohnsteueranmeldungen (§ 41a EStG)
-- Monatliche/vierteljährliche Anmeldung der einbehaltenen Lohnsteuer beim Finanzamt

CREATE TABLE public.lohnsteueranmeldungen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  anmeldezeitraum TEXT NOT NULL DEFAULT 'monatlich' CHECK (anmeldezeitraum IN ('monatlich', 'vierteljaehrlich', 'jaehrlich')),
  
  -- Steuerbeträge (aggregiert über alle Mitarbeiter)
  summe_lohnsteuer NUMERIC NOT NULL DEFAULT 0,
  summe_solidaritaetszuschlag NUMERIC NOT NULL DEFAULT 0,
  summe_kirchensteuer_ev NUMERIC NOT NULL DEFAULT 0,
  summe_kirchensteuer_rk NUMERIC NOT NULL DEFAULT 0,
  summe_pauschale_lohnsteuer NUMERIC NOT NULL DEFAULT 0,
  gesamtbetrag NUMERIC NOT NULL DEFAULT 0,
  
  -- Meta
  anzahl_arbeitnehmer INTEGER NOT NULL DEFAULT 0,
  finanzamt TEXT,
  steuernummer TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'entwurf' CHECK (status IN ('entwurf', 'geprueft', 'uebermittelt', 'korrigiert')),
  uebermittelt_am TIMESTAMPTZ,
  transfer_ticket TEXT,
  korrektur_von UUID REFERENCES public.lohnsteueranmeldungen(id),
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique: pro Tenant, Jahr, Monat nur eine aktive Anmeldung
  UNIQUE (tenant_id, year, month)
);

-- RLS aktivieren
ALTER TABLE public.lohnsteueranmeldungen ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Editors can manage tenant lohnsteueranmeldungen"
  ON public.lohnsteueranmeldungen FOR ALL TO authenticated
  USING (
    (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) 
    OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id))
    AND is_tenant_member(auth.uid(), tenant_id)
  );

CREATE POLICY "Users can view tenant lohnsteueranmeldungen"
  ON public.lohnsteueranmeldungen FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

-- Updated-at Trigger
CREATE TRIGGER update_lohnsteueranmeldungen_updated_at
  BEFORE UPDATE ON public.lohnsteueranmeldungen
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Audit Trigger
CREATE TRIGGER audit_lohnsteueranmeldungen
  AFTER INSERT OR UPDATE OR DELETE ON public.lohnsteueranmeldungen
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_func();