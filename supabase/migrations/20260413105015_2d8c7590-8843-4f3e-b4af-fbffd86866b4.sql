
-- Unique constraint for beitragsnachweise upsert
ALTER TABLE public.beitragsnachweise
ADD CONSTRAINT beitragsnachweise_year_month_kk_tenant_unique
UNIQUE (year, month, krankenkasse, tenant_id);

-- Unique constraint for lohnsteuerbescheinigungen upsert
ALTER TABLE public.lohnsteuerbescheinigungen
ADD CONSTRAINT lohnsteuerbescheinigungen_employee_year_unique
UNIQUE (employee_id, year);
