
-- 1. Fix platform_admins bootstrap: replace INSERT policy
-- Drop the existing INSERT policy that allows circular self-insert
DROP POLICY IF EXISTS "Platform admins can insert" ON public.platform_admins;

-- New INSERT policy: allow insert only if the table is empty (bootstrap) OR user is already a platform admin
CREATE POLICY "Platform admins can insert" ON public.platform_admins
FOR INSERT TO authenticated
WITH CHECK (
  is_primary_admin(auth.uid())
  OR NOT EXISTS (SELECT 1 FROM public.platform_admins)
);

-- 2. Add DELETE policy for contact_messages (GDPR compliance)
CREATE POLICY "Primary admins can delete contact messages"
ON public.contact_messages
FOR DELETE TO authenticated
USING (is_primary_admin(auth.uid()));
