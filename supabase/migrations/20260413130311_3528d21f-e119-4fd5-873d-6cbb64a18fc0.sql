
-- 1. Fix tenant_members: Admin write access scoped to own tenants
DROP POLICY IF EXISTS "Admins can manage tenant members" ON public.tenant_members;

CREATE POLICY "Admins can manage tenant members"
ON public.tenant_members
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND is_tenant_member(auth.uid(), tenant_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND is_tenant_member(auth.uid(), tenant_id)
);

-- 2. Fix tenants: Admin write access scoped to own tenants
DROP POLICY IF EXISTS "Admins can manage tenants" ON public.tenants;

CREATE POLICY "Admins can manage tenants"
ON public.tenants
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND is_tenant_member(auth.uid(), id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND is_tenant_member(auth.uid(), id)
);

-- 3. Fix profiles: restrict SELECT to same-tenant members
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view tenant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.tenant_members tm1
    JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = profiles.user_id
  )
);
