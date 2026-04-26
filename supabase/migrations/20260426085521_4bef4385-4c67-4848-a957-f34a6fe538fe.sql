ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS payslip_language text NOT NULL DEFAULT 'de';

ALTER TABLE public.employees
DROP CONSTRAINT IF EXISTS employees_payslip_language_check;

ALTER TABLE public.employees
ADD CONSTRAINT employees_payslip_language_check
CHECK (payslip_language IN ('de', 'en'));