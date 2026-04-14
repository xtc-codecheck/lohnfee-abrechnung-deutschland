-- Drop the overly permissive ALL policy
DROP POLICY IF EXISTS "Platform admins can manage" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins can view" ON public.platform_admins;

-- Granular policies using the security definer function
CREATE POLICY "Platform admins can view own entry"
ON public.platform_admins
FOR SELECT
TO authenticated
USING (public.is_primary_admin(auth.uid()));

CREATE POLICY "Platform admins can insert"
ON public.platform_admins
FOR INSERT
TO authenticated
WITH CHECK (public.is_primary_admin(auth.uid()));

CREATE POLICY "Platform admins can delete"
ON public.platform_admins
FOR DELETE
TO authenticated
USING (public.is_primary_admin(auth.uid()));