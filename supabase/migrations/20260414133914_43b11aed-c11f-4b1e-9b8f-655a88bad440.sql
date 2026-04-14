
CREATE OR REPLACE FUNCTION public.assign_default_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Check if user already has a tenant (e.g., invited)
  SELECT tm.tenant_id INTO default_tenant_id
  FROM public.tenant_members tm
  WHERE tm.user_id = NEW.id
  ORDER BY tm.is_default DESC
  LIMIT 1;

  -- If no tenant exists, create one
  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name) VALUES ('Mein Unternehmen') RETURNING id INTO default_tenant_id;
    INSERT INTO public.tenant_members (tenant_id, user_id, is_default) VALUES (default_tenant_id, NEW.id, true);
  END IF;

  -- The creator of a new tenant is ALWAYS admin in that tenant
  -- This ensures every new user can manage their own company
  INSERT INTO public.user_roles (user_id, role, tenant_id) 
  VALUES (NEW.id, 'admin', default_tenant_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
