-- 1. Add state column to employees table for East/West Germany tax calculation
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS state text;

-- 2. Add UPDATE policy for contact_messages so admins can mark messages as read
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);