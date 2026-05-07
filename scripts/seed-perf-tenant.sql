-- Performance-Test Seed: 1.000 MA + 12 Monate Time-Entries (~ 250.000 Zeilen)
-- Wird gegen einen leeren Test-Tenant eingespielt. Cleanup am Ende.
--
-- Ausführung (als Service-Role über Supabase SQL Editor oder psql):
--   \set tenant_uuid '11111111-1111-1111-1111-111111111111'
--   \i scripts/seed-perf-tenant.sql

DO $$
DECLARE
  v_tenant_id uuid := COALESCE(current_setting('app.tenant_id', true)::uuid,
                               '11111111-1111-1111-1111-111111111111'::uuid);
  v_emp_id uuid;
  v_day date;
  i int;
BEGIN
  -- 1) Tenant anlegen (idempotent)
  INSERT INTO public.tenants (id, name) VALUES (v_tenant_id, 'PERF-TEST-1000')
  ON CONFLICT (id) DO NOTHING;

  -- 2) 1.000 Mitarbeiter
  FOR i IN 1..1000 LOOP
    INSERT INTO public.employees (
      tenant_id, first_name, last_name, gross_salary, weekly_hours,
      employment_type, is_active, entry_date, tax_class, state, health_insurance
    ) VALUES (
      v_tenant_id,
      'Perf' || i,
      'User' || i,
      2500 + ((i % 50) * 100),
      40,
      'vollzeit',
      true,
      DATE '2024-01-01',
      ((i % 6) + 1),
      CASE WHEN i % 5 = 0 THEN 'sachsen' ELSE 'bayern' END,
      'TK'
    ) RETURNING id INTO v_emp_id;
  END LOOP;

  -- 3) Time-Entries: 12 Monate à ~21 Arbeitstage = 252 Tage * 1000 MA
  --    Einfacher Bulk-Insert via generate_series
  INSERT INTO public.time_entries (tenant_id, employee_id, date, type, hours_worked)
  SELECT
    v_tenant_id,
    e.id,
    d::date,
    'work',
    8
  FROM public.employees e
  CROSS JOIN generate_series(DATE '2025-01-02', DATE '2025-12-31', interval '1 day') d
  WHERE e.tenant_id = v_tenant_id
    AND EXTRACT(DOW FROM d) BETWEEN 1 AND 5
  ON CONFLICT (tenant_id, employee_id, date) DO NOTHING;

  RAISE NOTICE 'Seed fertig. Mitarbeiter: %, Time-Entries: %',
    (SELECT count(*) FROM public.employees WHERE tenant_id = v_tenant_id),
    (SELECT count(*) FROM public.time_entries WHERE tenant_id = v_tenant_id);
END $$;

-- Cleanup-Snippet (nach Test ausführen):
-- DELETE FROM public.time_entries  WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
-- DELETE FROM public.payroll_entries WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
-- DELETE FROM public.payroll_periods  WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
-- DELETE FROM public.employees       WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
-- DELETE FROM public.tenants         WHERE id = '11111111-1111-1111-1111-111111111111';