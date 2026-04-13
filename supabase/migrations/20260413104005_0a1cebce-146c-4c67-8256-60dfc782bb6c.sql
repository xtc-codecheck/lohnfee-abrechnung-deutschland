
DELETE FROM public.tenant_members WHERE user_id = 'dfffb999-0a2e-4bd5-b302-84f66178c8b7';
DELETE FROM public.user_roles WHERE user_id = 'dfffb999-0a2e-4bd5-b302-84f66178c8b7';
DELETE FROM public.profiles WHERE user_id = 'dfffb999-0a2e-4bd5-b302-84f66178c8b7';
DELETE FROM public.audit_log WHERE user_id = 'dfffb999-0a2e-4bd5-b302-84f66178c8b7';
DELETE FROM auth.users WHERE id = 'dfffb999-0a2e-4bd5-b302-84f66178c8b7';
