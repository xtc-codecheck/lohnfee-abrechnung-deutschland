
-- Fix user_roles: Admin can only manage roles for users in the same tenant
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Create a helper function to check if two users share a tenant
CREATE OR REPLACE FUNCTION public.shares_tenant(_user_a uuid, _user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members tm1
    JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
    WHERE tm1.user_id = _user_a AND tm2.user_id = _user_b
  )
$$;

CREATE POLICY "Admins can insert roles for same-tenant users"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND shares_tenant(auth.uid(), user_id)
);

CREATE POLICY "Admins can update roles for same-tenant users"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND shares_tenant(auth.uid(), user_id)
);

CREATE POLICY "Admins can delete roles for same-tenant users"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND shares_tenant(auth.uid(), user_id)
);
