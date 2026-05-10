
ALTER TABLE public.payroll_entries
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS corrects_entry_id uuid,
  ADD COLUMN IF NOT EXISTS correction_reason text,
  ADD COLUMN IF NOT EXISTS corrected_at timestamptz,
  ADD COLUMN IF NOT EXISTS corrected_by uuid;

ALTER TABLE public.lohnsteueranmeldungen
  ADD COLUMN IF NOT EXISTS is_correction boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replaces_id uuid;

ALTER TABLE public.beitragsnachweise
  ADD COLUMN IF NOT EXISTS is_correction boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replaces_id uuid;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sv_meldungen') THEN
    EXECUTE 'ALTER TABLE public.sv_meldungen
      ADD COLUMN IF NOT EXISTS is_correction boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS replaces_id uuid';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payroll_entries_corrects ON public.payroll_entries(corrects_entry_id) WHERE corrects_entry_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lsta_replaces ON public.lohnsteueranmeldungen(replaces_id) WHERE replaces_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bnw_replaces ON public.beitragsnachweise(replaces_id) WHERE replaces_id IS NOT NULL;
