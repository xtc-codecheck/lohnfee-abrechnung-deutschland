DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;

CREATE POLICY "Public insert contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(coalesce(name, '')) BETWEEN 1 AND 200
  AND length(coalesce(email, '')) BETWEEN 3 AND 320
  AND length(coalesce(subject, '')) BETWEEN 1 AND 300
  AND length(coalesce(message, '')) BETWEEN 1 AND 5000
);

CREATE POLICY "Platform admins can view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (public.is_primary_admin(auth.uid()));

CREATE POLICY "Platform admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (public.is_primary_admin(auth.uid()))
WITH CHECK (public.is_primary_admin(auth.uid()));

CREATE POLICY "Platform admins can delete contact messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (public.is_primary_admin(auth.uid()));