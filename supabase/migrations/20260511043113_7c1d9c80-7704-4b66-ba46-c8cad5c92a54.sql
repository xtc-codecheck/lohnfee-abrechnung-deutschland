
-- Phase 2: Security-Hardening — SECURITY DEFINER-Funktionen vor öffentlichem Aufruf schützen
-- Funktionen bleiben für Trigger und RLS-Policies nutzbar (laufen als Owner),
-- sind aber nicht mehr direkt über PostgREST aufrufbar.

REVOKE EXECUTE ON FUNCTION public.is_primary_admin(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role_in_tenant(uuid, public.app_role, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_steuerberater_for_tenant(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.shares_tenant(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_default_tenant(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_portal_employee_id(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_create_tenant_for_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_personal_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
