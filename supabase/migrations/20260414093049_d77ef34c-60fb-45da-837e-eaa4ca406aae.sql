-- Ensure the table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.autolohn_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS (idempotent)
ALTER TABLE public.autolohn_settings ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exist first for idempotency)
DROP POLICY IF EXISTS "Users can view tenant autolohn settings" ON public.autolohn_settings;
CREATE POLICY "Users can view tenant autolohn settings"
ON public.autolohn_settings
FOR SELECT
TO authenticated
USING (is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins can manage tenant autolohn settings" ON public.autolohn_settings;
CREATE POLICY "Admins can manage tenant autolohn settings"
ON public.autolohn_settings
FOR ALL
TO authenticated
USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id))
WITH CHECK (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));

-- Timestamp trigger (idempotent)
DROP TRIGGER IF EXISTS update_autolohn_settings_updated_at ON public.autolohn_settings;
CREATE TRIGGER update_autolohn_settings_updated_at
BEFORE UPDATE ON public.autolohn_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();