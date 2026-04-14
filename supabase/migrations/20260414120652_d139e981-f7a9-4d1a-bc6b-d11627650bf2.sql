-- Drop the insecure INSERT policy with bootstrap OR clause
DROP POLICY IF EXISTS "Platform admins can insert" ON public.platform_admins;

-- Create secure INSERT policy - only existing admins can add new admins
CREATE POLICY "Platform admins can insert"
ON public.platform_admins
FOR INSERT
TO authenticated
WITH CHECK (is_primary_admin(auth.uid()));