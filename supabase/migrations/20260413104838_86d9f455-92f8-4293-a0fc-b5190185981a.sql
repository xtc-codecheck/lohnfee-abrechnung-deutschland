
DELETE FROM public.tenant_members WHERE user_id = '0027abaf-3a86-4b39-bbba-c31ecd5c1995';
DELETE FROM public.user_roles WHERE user_id = '0027abaf-3a86-4b39-bbba-c31ecd5c1995';
DELETE FROM public.profiles WHERE user_id = '0027abaf-3a86-4b39-bbba-c31ecd5c1995';
DELETE FROM public.audit_log WHERE user_id = '0027abaf-3a86-4b39-bbba-c31ecd5c1995';
DELETE FROM auth.users WHERE id = '0027abaf-3a86-4b39-bbba-c31ecd5c1995';
