
-- Fix user_roles SELECT: scope admin view to same-tenant users only
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view same-tenant roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND shares_tenant(auth.uid(), user_id)
  )
);

-- Explicitly deny client-side writes to audit_log
-- (writes happen only via SECURITY DEFINER trigger)
CREATE POLICY "Deny all inserts to audit_log"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny all updates to audit_log"
ON public.audit_log
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny all deletes to audit_log"
ON public.audit_log
FOR DELETE
TO authenticated
USING (false);
