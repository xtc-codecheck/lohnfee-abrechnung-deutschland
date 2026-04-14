-- Create explicit platform_admins table
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only existing platform admins can manage this table
CREATE POLICY "Platform admins can view"
ON public.platform_admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Platform admins can manage"
ON public.platform_admins
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.platform_admins pa
    WHERE pa.user_id = auth.uid()
  )
);

-- Seed: insert the first-ever admin as platform admin
INSERT INTO public.platform_admins (user_id)
SELECT user_id FROM public.user_roles
WHERE role = 'admin'::app_role
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- Update is_primary_admin to check the explicit table
CREATE OR REPLACE FUNCTION public.is_primary_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id
  )
$$;