
-- A1-Bescheinigungen (Entsendebescheinigung EU/EWR/CH)
CREATE TABLE public.a1_bescheinigungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  entsendeland text NOT NULL,
  zeitraum_von date NOT NULL,
  zeitraum_bis date NOT NULL,
  taetigkeit text,
  auftraggeber text,
  auftraggeber_adresse text,
  art text NOT NULL DEFAULT 'entsendung',
  status text NOT NULL DEFAULT 'entwurf',
  beantragt_am timestamptz,
  ausgestellt_am timestamptz,
  bescheinigung_nr text,
  transfer_ticket text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.a1_bescheinigungen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view tenant a1" ON public.a1_bescheinigungen FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant a1" ON public.a1_bescheinigungen FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_a1_updated BEFORE UPDATE ON public.a1_bescheinigungen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_a1_tenant ON public.a1_bescheinigungen(tenant_id);
CREATE INDEX idx_a1_employee ON public.a1_bescheinigungen(employee_id);

-- KUG-Anträge (Kurzarbeitergeld)
CREATE TABLE public.kug_antraege (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  zeitraum_von date NOT NULL,
  zeitraum_bis date NOT NULL,
  agentur_arbeit text,
  betriebsnummer text,
  antrag_typ text NOT NULL DEFAULT 'anzeige', -- anzeige | leistungsantrag
  arbeitsausfall_grund text,
  anzahl_betroffene integer NOT NULL DEFAULT 0,
  arbeitsausfall_prozent numeric NOT NULL DEFAULT 0,
  voraussichtliche_dauer_monate integer,
  ist_betriebsrat boolean NOT NULL DEFAULT false,
  einverstaendnis_betriebsrat boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'entwurf',
  beantragt_am timestamptz,
  bewilligt_am timestamptz,
  bewilligungs_nr text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kug_antraege ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view tenant kug" ON public.kug_antraege FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant kug" ON public.kug_antraege FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_kug_updated BEFORE UPDATE ON public.kug_antraege
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_kug_tenant ON public.kug_antraege(tenant_id);

-- KUG-Personenbezogene Daten je Antrag
CREATE TABLE public.kug_antrag_personen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  kug_antrag_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  soll_entgelt numeric NOT NULL DEFAULT 0,
  ist_entgelt numeric NOT NULL DEFAULT 0,
  ausgefallene_stunden numeric NOT NULL DEFAULT 0,
  kug_betrag numeric NOT NULL DEFAULT 0,
  hat_kind boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kug_antrag_personen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view tenant kug_pers" ON public.kug_antrag_personen FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant kug_pers" ON public.kug_antrag_personen FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));
CREATE INDEX idx_kug_pers_antrag ON public.kug_antrag_personen(kug_antrag_id);

-- Employee Garnishments (Pfändungen-Verwaltung)
CREATE TABLE public.employee_garnishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  glaeubiger text NOT NULL,
  glaeubiger_adresse text,
  aktenzeichen text,
  pfaendungs_typ text NOT NULL DEFAULT 'normal', -- normal | unterhalt | insolvenz
  forderungsbetrag numeric NOT NULL DEFAULT 0,
  resttbetrag numeric NOT NULL DEFAULT 0,
  rang integer NOT NULL DEFAULT 1,
  unterhaltsberechtigte integer NOT NULL DEFAULT 0,
  zustellungsdatum date,
  beginn_datum date NOT NULL,
  ende_datum date,
  status text NOT NULL DEFAULT 'aktiv', -- aktiv | erledigt | ruhend | aufgehoben
  bank_iban text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_garnishments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view tenant garnish" ON public.employee_garnishments FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant garnish" ON public.employee_garnishments FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_garnish_updated BEFORE UPDATE ON public.employee_garnishments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_garnish_tenant ON public.employee_garnishments(tenant_id);
CREATE INDEX idx_garnish_employee ON public.employee_garnishments(employee_id);
