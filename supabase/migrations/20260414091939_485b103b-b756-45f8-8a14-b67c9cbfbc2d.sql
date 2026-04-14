-- Fix: Only the very first admin user (platform owner) can access contact messages
-- This is determined by the earliest created_at in user_roles with admin role
CREATE OR REPLACE FUNCTION public.is_primary_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = (
    SELECT user_id FROM public.user_roles
    WHERE role = 'admin'::app_role
    ORDER BY created_at ASC
    LIMIT 1
  )
$$;