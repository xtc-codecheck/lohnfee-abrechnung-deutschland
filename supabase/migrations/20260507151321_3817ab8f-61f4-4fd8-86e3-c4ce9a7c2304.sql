
-- 1) Mitarbeiter-Portal: Login-Verknüpfung Mitarbeiter ↔ User
CREATE TABLE public.employee_portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  user_id uuid NOT NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id),
  UNIQUE (user_id, tenant_id)
);
ALTER TABLE public.employee_portal_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self view portal user" ON public.employee_portal_users FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage portal users" ON public.employee_portal_users FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- Helper: liefert die employee_id eines eingeloggten Portal-Users
CREATE OR REPLACE FUNCTION public.current_portal_employee_id(_tenant_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT employee_id FROM public.employee_portal_users
  WHERE user_id = auth.uid() AND tenant_id = _tenant_id AND is_active = true LIMIT 1
$$;

-- 2) Urlaubsanträge
CREATE TABLE public.vacation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days numeric NOT NULL DEFAULT 0,
  request_type text NOT NULL DEFAULT 'urlaub',
  status text NOT NULL DEFAULT 'offen',
  reason text,
  decided_at timestamptz,
  decided_by uuid,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self view vacation" ON public.vacation_requests FOR SELECT TO authenticated
  USING (employee_id = current_portal_employee_id(tenant_id) OR is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "self create vacation" ON public.vacation_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = current_portal_employee_id(tenant_id) AND status = 'offen');
CREATE POLICY "manage vacation" ON public.vacation_requests FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_vac_updated BEFORE UPDATE ON public.vacation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_vac_employee ON public.vacation_requests(employee_id);

-- Portal-Mitarbeiter darf eigene Lohnzettel & Mitarbeiterstammsatz lesen
CREATE POLICY "portal self view payslip" ON public.payroll_entries FOR SELECT TO authenticated
  USING (employee_id = current_portal_employee_id(tenant_id));
CREATE POLICY "portal self view employee" ON public.employees FOR SELECT TO authenticated
  USING (id = current_portal_employee_id(tenant_id));

-- 3) OCR-Belegjobs
CREATE TABLE public.receipt_ocr_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  trip_id uuid,
  receipt_id uuid,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  raw_text text,
  extracted jsonb,
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.receipt_ocr_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view ocr" ON public.receipt_ocr_jobs FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage ocr" ON public.receipt_ocr_jobs FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- 4) DATEV-Connect Übermittlungslog
CREATE TABLE public.datev_connect_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  transfer_type text NOT NULL,
  payload_summary jsonb,
  document_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error text,
  external_ticket text,
  initiated_by uuid,
  initiated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.datev_connect_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view datev_transfers" ON public.datev_connect_transfers FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "manage datev_transfers" ON public.datev_connect_transfers FOR ALL TO authenticated
  USING ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin', tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter', tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- 5) Receipts: Storage Bucket + OCR-Felder
ALTER TABLE public.travel_receipts ADD COLUMN IF NOT EXISTS ocr_status text NOT NULL DEFAULT 'none';
ALTER TABLE public.travel_receipts ADD COLUMN IF NOT EXISTS ocr_confidence numeric;
ALTER TABLE public.travel_receipts ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- 6) Reise-Beine: Mahlzeitenkürzungen
ALTER TABLE public.travel_legs ADD COLUMN IF NOT EXISTS breakfast_provided boolean NOT NULL DEFAULT false;
ALTER TABLE public.travel_legs ADD COLUMN IF NOT EXISTS lunch_provided boolean NOT NULL DEFAULT false;
ALTER TABLE public.travel_legs ADD COLUMN IF NOT EXISTS dinner_provided boolean NOT NULL DEFAULT false;
ALTER TABLE public.travel_legs ADD COLUMN IF NOT EXISTS meal_reduction numeric NOT NULL DEFAULT 0;
