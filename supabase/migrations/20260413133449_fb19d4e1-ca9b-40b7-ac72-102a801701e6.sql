
-- ============================================
-- EMPLOYEES
-- ============================================
DROP POLICY IF EXISTS "Editors can insert tenant employees" ON public.employees;
DROP POLICY IF EXISTS "Editors can update tenant employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete tenant employees" ON public.employees;

CREATE POLICY "Editors can insert tenant employees" ON public.employees FOR INSERT TO authenticated
WITH CHECK ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Editors can update tenant employees" ON public.employees FOR UPDATE TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can delete tenant employees" ON public.employees FOR DELETE TO authenticated
USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- PAYROLL_PERIODS
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant periods" ON public.payroll_periods;
CREATE POLICY "Editors can manage tenant periods" ON public.payroll_periods FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- PAYROLL_ENTRIES
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant entries" ON public.payroll_entries;
CREATE POLICY "Editors can manage tenant entries" ON public.payroll_entries FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- COMPANY_SETTINGS
-- ============================================
DROP POLICY IF EXISTS "Admins can manage tenant company settings" ON public.company_settings;
CREATE POLICY "Admins can manage tenant company settings" ON public.company_settings FOR ALL TO authenticated
USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- BEITRAGSNACHWEISE
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant beitragsnachweise" ON public.beitragsnachweise;
CREATE POLICY "Editors can manage tenant beitragsnachweise" ON public.beitragsnachweise FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- LOHNSTEUERBESCHEINIGUNGEN
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant lohnsteuerbescheinigungen" ON public.lohnsteuerbescheinigungen;
CREATE POLICY "Editors can manage tenant lohnsteuerbescheinigungen" ON public.lohnsteuerbescheinigungen FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- SV_MELDUNGEN
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant sv_meldungen" ON public.sv_meldungen;
CREATE POLICY "Editors can manage tenant sv_meldungen" ON public.sv_meldungen FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- TIME_ENTRIES
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant time entries" ON public.time_entries;
CREATE POLICY "Editors can manage tenant time entries" ON public.time_entries FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- SPECIAL_PAYMENTS
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant special payments" ON public.special_payments;
CREATE POLICY "Editors can manage tenant special payments" ON public.special_payments FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- COMPLIANCE_ALERTS
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant compliance alerts" ON public.compliance_alerts;
CREATE POLICY "Editors can manage tenant compliance alerts" ON public.compliance_alerts FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- GDPR_REQUESTS
-- ============================================
DROP POLICY IF EXISTS "Admins can manage gdpr requests" ON public.gdpr_requests;
CREATE POLICY "Admins can manage gdpr requests" ON public.gdpr_requests FOR ALL TO authenticated
USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- PAYROLL_GUARDIAN_ANOMALIES
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant anomalies" ON public.payroll_guardian_anomalies;
CREATE POLICY "Editors can manage tenant anomalies" ON public.payroll_guardian_anomalies FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- PAYROLL_GUARDIAN_HISTORY
-- ============================================
DROP POLICY IF EXISTS "Editors can manage tenant guardian history" ON public.payroll_guardian_history;
CREATE POLICY "Editors can manage tenant guardian history" ON public.payroll_guardian_history FOR ALL TO authenticated
USING ((has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) OR has_role_in_tenant(auth.uid(), 'sachbearbeiter'::app_role, tenant_id)) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- TENANT_MEMBERS
-- ============================================
DROP POLICY IF EXISTS "Admins can manage tenant members" ON public.tenant_members;
CREATE POLICY "Admins can manage tenant members" ON public.tenant_members FOR ALL TO authenticated
USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id))
WITH CHECK (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));

-- ============================================
-- TENANTS
-- ============================================
DROP POLICY IF EXISTS "Admins can manage tenants" ON public.tenants;
CREATE POLICY "Admins can manage tenants" ON public.tenants FOR ALL TO authenticated
USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, id) AND is_tenant_member(auth.uid(), id))
WITH CHECK (has_role_in_tenant(auth.uid(), 'admin'::app_role, id) AND is_tenant_member(auth.uid(), id));

-- ============================================
-- USER_ROLES
-- ============================================
DROP POLICY IF EXISTS "Admins can view tenant roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert tenant roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update tenant roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete tenant roles" ON public.user_roles;

CREATE POLICY "Admins can view tenant roles" ON public.user_roles FOR SELECT TO authenticated
USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can insert tenant roles" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can update tenant roles" ON public.user_roles FOR UPDATE TO authenticated
USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can delete tenant roles" ON public.user_roles FOR DELETE TO authenticated
USING (has_role_in_tenant(auth.uid(), 'admin'::app_role, tenant_id) AND is_tenant_member(auth.uid(), tenant_id));
