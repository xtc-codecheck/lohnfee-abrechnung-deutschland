
-- PostgreSQL gewährt SECURITY DEFINER-Funktionen standardmäßig EXECUTE an PUBLIC.
-- Nur ein REVOKE FROM PUBLIC entfernt das tatsächlich.
REVOKE EXECUTE ON FUNCTION public.is_primary_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role_in_tenant(uuid, public.app_role, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_steuerberater_for_tenant(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.shares_tenant(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_default_tenant(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_portal_employee_id(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_create_tenant_for_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_personal_number() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
