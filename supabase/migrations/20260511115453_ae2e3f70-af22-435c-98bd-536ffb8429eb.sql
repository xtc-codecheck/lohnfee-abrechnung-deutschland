
-- 1) Status enum
DO $$ BEGIN
  CREATE TYPE public.elstam_change_status AS ENUM ('open','processed','ignored');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Table
CREATE TABLE IF NOT EXISTS public.elstam_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.elstam_change_status NOT NULL DEFAULT 'open',
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  affected_entry_ids UUID[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_elstam_changes_tenant_status
  ON public.elstam_changes(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_elstam_changes_employee
  ON public.elstam_changes(employee_id, effective_date DESC);

-- 3) RLS
ALTER TABLE public.elstam_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "elstam_changes_select_tenant" ON public.elstam_changes;
CREATE POLICY "elstam_changes_select_tenant"
  ON public.elstam_changes FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "elstam_changes_update_admin" ON public.elstam_changes;
CREATE POLICY "elstam_changes_update_admin"
  ON public.elstam_changes FOR UPDATE TO authenticated
  USING (public.has_role_in_tenant(auth.uid(), 'admin', tenant_id))
  WITH CHECK (public.has_role_in_tenant(auth.uid(), 'admin', tenant_id));

-- No INSERT/DELETE policies: rows are inserted by the trigger (SECURITY DEFINER)
-- and never deleted (audit retention).

-- 4) Trigger on employees
CREATE OR REPLACE FUNCTION public.elstam_track_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant UUID := NEW.tenant_id;
BEGIN
  IF (NEW.tax_class IS DISTINCT FROM OLD.tax_class) THEN
    INSERT INTO public.elstam_changes(tenant_id, employee_id, field_name, old_value, new_value)
    VALUES (v_tenant, NEW.id, 'tax_class', OLD.tax_class::TEXT, NEW.tax_class::TEXT);
  END IF;
  IF (NEW.tax_id IS DISTINCT FROM OLD.tax_id) THEN
    INSERT INTO public.elstam_changes(tenant_id, employee_id, field_name, old_value, new_value)
    VALUES (v_tenant, NEW.id, 'tax_id', OLD.tax_id, NEW.tax_id);
  END IF;
  IF (NEW.church_tax IS DISTINCT FROM OLD.church_tax) THEN
    INSERT INTO public.elstam_changes(tenant_id, employee_id, field_name, old_value, new_value)
    VALUES (v_tenant, NEW.id, 'church_tax', OLD.church_tax::TEXT, NEW.church_tax::TEXT);
  END IF;
  IF (NEW.church_tax_rate IS DISTINCT FROM OLD.church_tax_rate) THEN
    INSERT INTO public.elstam_changes(tenant_id, employee_id, field_name, old_value, new_value)
    VALUES (v_tenant, NEW.id, 'church_tax_rate', OLD.church_tax_rate::TEXT, NEW.church_tax_rate::TEXT);
  END IF;
  IF (NEW.children_allowance IS DISTINCT FROM OLD.children_allowance) THEN
    INSERT INTO public.elstam_changes(tenant_id, employee_id, field_name, old_value, new_value)
    VALUES (v_tenant, NEW.id, 'children_allowance', OLD.children_allowance::TEXT, NEW.children_allowance::TEXT);
  END IF;
  IF (NEW.number_of_children IS DISTINCT FROM OLD.number_of_children) THEN
    INSERT INTO public.elstam_changes(tenant_id, employee_id, field_name, old_value, new_value)
    VALUES (v_tenant, NEW.id, 'number_of_children', OLD.number_of_children::TEXT, NEW.number_of_children::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.elstam_track_changes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_elstam_track_changes ON public.employees;
CREATE TRIGGER trg_elstam_track_changes
  AFTER UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.elstam_track_changes();

-- 5) updated_at trigger
DROP TRIGGER IF EXISTS trg_elstam_changes_updated_at ON public.elstam_changes;
CREATE TRIGGER trg_elstam_changes_updated_at
  BEFORE UPDATE ON public.elstam_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
