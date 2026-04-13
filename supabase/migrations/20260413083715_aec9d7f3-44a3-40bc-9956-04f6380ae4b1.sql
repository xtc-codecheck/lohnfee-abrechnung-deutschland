
-- SV-Meldungen (DEÜV-Meldungen an Krankenkassen)
CREATE TABLE public.sv_meldungen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  meldegrund TEXT NOT NULL, -- 'anmeldung', 'abmeldung', 'jahresmeldung', 'unterbrechung'
  meldegrund_schluessel TEXT, -- DEÜV-Schlüssel z.B. '10' = Anmeldung wg. Beschäftigungsbeginn
  zeitraum_von DATE NOT NULL,
  zeitraum_bis DATE NOT NULL,
  krankenkasse TEXT NOT NULL,
  betriebsnummer_kk TEXT, -- Betriebsnummer der Krankenkasse
  beitragsgruppe TEXT, -- z.B. '1111' = KV/RV/AV/PV pflichtversichert
  personengruppe TEXT DEFAULT '101', -- '101' = sozialversicherungspflichtig Beschäftigte
  sv_brutto NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'entwurf', -- 'entwurf', 'gemeldet', 'bestaetigt', 'storniert'
  meldedatum DATE,
  storniert_am DATE,
  storno_grund TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sv_meldungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Sachbearbeiter can manage sv_meldungen"
  ON public.sv_meldungen FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sachbearbeiter'::app_role));

CREATE POLICY "Authenticated can view sv_meldungen"
  ON public.sv_meldungen FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()));

-- Trigger für updated_at
CREATE TRIGGER update_sv_meldungen_updated_at
  BEFORE UPDATE ON public.sv_meldungen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit-Trigger
CREATE TRIGGER audit_sv_meldungen
  AFTER INSERT OR UPDATE OR DELETE ON public.sv_meldungen
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


-- Beitragsnachweise (monatlich an Krankenkassen)
CREATE TABLE public.beitragsnachweise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  krankenkasse TEXT NOT NULL,
  betriebsnummer_kk TEXT,
  anzahl_versicherte INTEGER DEFAULT 0,
  kv_an NUMERIC DEFAULT 0,
  kv_ag NUMERIC DEFAULT 0,
  kv_zusatzbeitrag_an NUMERIC DEFAULT 0,
  kv_zusatzbeitrag_ag NUMERIC DEFAULT 0,
  rv_an NUMERIC DEFAULT 0,
  rv_ag NUMERIC DEFAULT 0,
  av_an NUMERIC DEFAULT 0,
  av_ag NUMERIC DEFAULT 0,
  pv_an NUMERIC DEFAULT 0,
  pv_ag NUMERIC DEFAULT 0,
  pv_kinderlose_zuschlag NUMERIC DEFAULT 0,
  umlage_u1 NUMERIC DEFAULT 0,
  umlage_u2 NUMERIC DEFAULT 0,
  insolvenzgeldumlage NUMERIC DEFAULT 0,
  gesamtbetrag NUMERIC DEFAULT 0,
  faelligkeitsdatum DATE,
  status TEXT NOT NULL DEFAULT 'entwurf', -- 'entwurf', 'uebermittelt', 'bestaetigt'
  uebermittelt_am TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(year, month, krankenkasse)
);

ALTER TABLE public.beitragsnachweise ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Sachbearbeiter can manage beitragsnachweise"
  ON public.beitragsnachweise FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sachbearbeiter'::app_role));

CREATE POLICY "Authenticated can view beitragsnachweise"
  ON public.beitragsnachweise FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()));

CREATE TRIGGER update_beitragsnachweise_updated_at
  BEFORE UPDATE ON public.beitragsnachweise
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_beitragsnachweise
  AFTER INSERT OR UPDATE OR DELETE ON public.beitragsnachweise
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


-- Elektronische Lohnsteuerbescheinigungen (eLStB)
CREATE TABLE public.lohnsteuerbescheinigungen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  -- Bescheinigungsinhalte (Zeilen der eLStB)
  zeile_3_bruttolohn NUMERIC DEFAULT 0, -- Bruttoarbeitslohn
  zeile_4_lst NUMERIC DEFAULT 0, -- Lohnsteuer
  zeile_5_soli NUMERIC DEFAULT 0, -- Solidaritätszuschlag
  zeile_6_kist NUMERIC DEFAULT 0, -- Kirchensteuer AN
  zeile_7_kist_ehegatte NUMERIC DEFAULT 0, -- Kirchensteuer Ehegatte
  zeile_22a_arbeitnehmeranteil_rv NUMERIC DEFAULT 0,
  zeile_22b_arbeitgeberanteil_rv NUMERIC DEFAULT 0,
  zeile_23a_arbeitnehmeranteil_kv NUMERIC DEFAULT 0,
  zeile_23b_arbeitgeberanteil_kv NUMERIC DEFAULT 0,
  zeile_24a_arbeitnehmeranteil_av NUMERIC DEFAULT 0,
  zeile_24b_arbeitgeberanteil_av NUMERIC DEFAULT 0,
  zeile_25_arbeitnehmeranteil_pv NUMERIC DEFAULT 0,
  zeile_26_arbeitgeberanteil_pv NUMERIC DEFAULT 0,
  steuerklasse TEXT,
  kinderfreibetraege NUMERIC DEFAULT 0,
  religion TEXT,
  zeitraum_von DATE,
  zeitraum_bis DATE,
  status TEXT NOT NULL DEFAULT 'entwurf', -- 'entwurf', 'uebermittelt', 'bestaetigt'
  uebermittelt_am TIMESTAMPTZ,
  transfer_ticket TEXT, -- Transferticket von ELSTER
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, year)
);

ALTER TABLE public.lohnsteuerbescheinigungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Sachbearbeiter can manage lohnsteuerbescheinigungen"
  ON public.lohnsteuerbescheinigungen FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sachbearbeiter'::app_role));

CREATE POLICY "Authenticated can view lohnsteuerbescheinigungen"
  ON public.lohnsteuerbescheinigungen FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()));

CREATE TRIGGER update_lohnsteuerbescheinigungen_updated_at
  BEFORE UPDATE ON public.lohnsteuerbescheinigungen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_lohnsteuerbescheinigungen
  AFTER INSERT OR UPDATE OR DELETE ON public.lohnsteuerbescheinigungen
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
