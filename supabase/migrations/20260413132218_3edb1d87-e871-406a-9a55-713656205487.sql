
-- 1. Add tenant_id column (nullable first)
ALTER TABLE public.user_roles
ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Backfill: assign tenant from tenant_members
UPDATE public.user_roles ur
SET tenant_id = (
  SELECT tm.tenant_id FROM public.tenant_members tm
  WHERE tm.user_id = ur.user_id
  ORDER BY tm.is_default DESC
  LIMIT 1
);

-- 3. For orphaned roles (no tenant membership), create a tenant and membership
DO $$
DECLARE
  r RECORD;
  new_tid UUID;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.user_roles WHERE tenant_id IS NULL
  LOOP
    INSERT INTO public.tenants (name) VALUES ('Mein Unternehmen') RETURNING id INTO new_tid;
    INSERT INTO public.tenant_members (tenant_id, user_id, is_default) VALUES (new_tid, r.user_id, true);
    UPDATE public.user_roles SET tenant_id = new_tid WHERE user_id = r.user_id AND tenant_id IS NULL;
  END LOOP;
END $$;

-- 4. Now make NOT NULL
ALTER TABLE public.user_roles ALTER COLUMN tenant_id SET NOT NULL;

-- 5. Update unique constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_tenant_id_role_key UNIQUE (user_id, tenant_id, role);

-- 6. Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view same-tenant roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles for same-tenant users" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles for same-tenant users" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles for same-tenant users" ON public.user_roles;

-- 7. New tenant-scoped RLS policies
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view tenant roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can insert tenant roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can update tenant roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can delete tenant roles"
ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND is_tenant_member(auth.uid(), tenant_id));

-- 8. Update assign_default_role trigger
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  default_tenant_id UUID;
BEGIN
  SELECT tm.tenant_id INTO default_tenant_id
  FROM public.tenant_members tm
  WHERE tm.user_id = NEW.id
  ORDER BY tm.is_default DESC
  LIMIT 1;

  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name) VALUES ('Mein Unternehmen') RETURNING id INTO default_tenant_id;
    INSERT INTO public.tenant_members (tenant_id, user_id, is_default) VALUES (default_tenant_id, NEW.id, true);
  END IF;

  SELECT COUNT(*) INTO user_count FROM public.user_roles;

  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role, tenant_id) VALUES (NEW.id, 'admin', default_tenant_id);
  ELSE
    INSERT INTO public.user_roles (user_id, role, tenant_id) VALUES (NEW.id, 'leserecht', default_tenant_id);
  END IF;

  RETURN NEW;
END;
$function$;

-- 9. New tenant-scoped role check function
CREATE OR REPLACE FUNCTION public.has_role_in_tenant(_user_id uuid, _role app_role, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND tenant_id = _tenant_id
  )
$$;

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant ON public.user_roles(user_id, tenant_id);
