
-- Delete user data in correct order
DELETE FROM public.tenant_members WHERE user_id = '2832e33d-78eb-4901-9cf1-62ba5cd4213b';
DELETE FROM public.user_roles WHERE user_id = '2832e33d-78eb-4901-9cf1-62ba5cd4213b';
DELETE FROM public.profiles WHERE user_id = '2832e33d-78eb-4901-9cf1-62ba5cd4213b';
DELETE FROM public.audit_log WHERE user_id = '2832e33d-78eb-4901-9cf1-62ba5cd4213b';
DELETE FROM auth.users WHERE id = '2832e33d-78eb-4901-9cf1-62ba5cd4213b';
