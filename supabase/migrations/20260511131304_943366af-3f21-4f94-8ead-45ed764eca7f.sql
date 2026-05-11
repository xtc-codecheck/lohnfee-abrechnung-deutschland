-- Deduplicate any existing duplicates before adding UNIQUE constraint.
-- Keeps the oldest row per (payroll_period_id, employee_id), deletes the rest.
DELETE FROM public.payroll_entries pe
USING public.payroll_entries pe2
WHERE pe.payroll_period_id = pe2.payroll_period_id
  AND pe.employee_id = pe2.employee_id
  AND pe.created_at > pe2.created_at;

-- Add UNIQUE constraint to prevent double-persistence of payroll entries
-- (same employee in same payroll period must not exist twice).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_payroll_entries_period_employee'
  ) THEN
    ALTER TABLE public.payroll_entries
      ADD CONSTRAINT uq_payroll_entries_period_employee
      UNIQUE (payroll_period_id, employee_id);
  END IF;
END $$;