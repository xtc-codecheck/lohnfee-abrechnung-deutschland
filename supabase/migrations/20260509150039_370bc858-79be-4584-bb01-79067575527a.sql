
-- Travel approval log
CREATE TABLE public.travel_approval_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  trip_id uuid NOT NULL REFERENCES public.travel_trips(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_user_id uuid,
  actor_role text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_travel_approval_log_trip ON public.travel_approval_log(trip_id);
ALTER TABLE public.travel_approval_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view tenant travel_approval_log" ON public.travel_approval_log
  FOR SELECT TO authenticated USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage tenant travel_approval_log" ON public.travel_approval_log
  FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- Travel: second approval & total
ALTER TABLE public.travel_trips
  ADD COLUMN IF NOT EXISTS requires_second_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS second_approved_by uuid,
  ADD COLUMN IF NOT EXISTS second_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_by uuid;

-- Employees: vacation entitlement
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS vacation_days_per_year integer NOT NULL DEFAULT 30;

-- eAU storage path
ALTER TABLE public.eau_records
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS submitted_by_employee boolean NOT NULL DEFAULT false;

-- Portal employees can insert their own eAU
CREATE POLICY "portal self insert eau" ON public.eau_records
  FOR INSERT TO authenticated
  WITH CHECK (employee_id = current_portal_employee_id(tenant_id) AND submitted_by_employee = true);

CREATE POLICY "portal self view eau" ON public.eau_records
  FOR SELECT TO authenticated
  USING (employee_id = current_portal_employee_id(tenant_id));

-- Storage bucket for eAU attests
INSERT INTO storage.buckets (id, name, public) VALUES ('eau-attests', 'eau-attests', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies: users from same tenant can manage; portal self can upload to own folder (tenant_id/employee_id/...)
CREATE POLICY "tenant members read eau-attests" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'eau-attests' AND is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid));

CREATE POLICY "tenant editors write eau-attests" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'eau-attests' AND (
      (has_role_in_tenant(auth.uid(), 'admin'::app_role, ((storage.foldername(name))[1])::uuid)
        OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, ((storage.foldername(name))[1])::uuid))
      OR current_portal_employee_id(((storage.foldername(name))[1])::uuid) IS NOT NULL
    )
  );
