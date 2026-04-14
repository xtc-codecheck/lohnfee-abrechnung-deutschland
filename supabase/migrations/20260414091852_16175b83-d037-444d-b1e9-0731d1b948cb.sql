-- Drop existing overly permissive policies on contact_messages
DROP POLICY IF EXISTS "Only admins can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;

-- Create a security definer function to check if user is the primary admin
-- (the first admin user who registered - identified by earliest user_roles entry with admin role)
CREATE OR REPLACE FUNCTION public.is_primary_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'admin'::app_role
    ORDER BY created_at ASC
    LIMIT 1
  )
$$;

-- New SELECT policy: only admins can view (scoped via security definer function)
CREATE POLICY "Primary admins can view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (public.is_primary_admin(auth.uid()));

-- New UPDATE policy: only admins can update status
CREATE POLICY "Primary admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (public.is_primary_admin(auth.uid()))
WITH CHECK (public.is_primary_admin(auth.uid()));