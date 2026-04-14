-- Fix contact_messages: restrict SELECT to admins only
DROP POLICY IF EXISTS "Authenticated users can view contact messages" ON public.contact_messages;

CREATE POLICY "Only admins can view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);