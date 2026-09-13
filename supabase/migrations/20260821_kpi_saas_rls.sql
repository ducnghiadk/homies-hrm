-- ============================================================
-- HOMIES MILK TEA - KPI SAAS RLS
-- Database: Supabase / PostgreSQL
-- Created: 2026-08-21
-- Scope: KPI access control by employee / leader / manager / HR / CEO
-- ============================================================

-- Helper identity functions
CREATE OR REPLACE FUNCTION public.app_kpi_current_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT n.id
    FROM public.nhan_vien n
    WHERE n.auth_id = auth.uid()
       OR n.id = auth.uid()
    ORDER BY CASE WHEN n.auth_id = auth.uid() THEN 0 ELSE 1 END
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_current_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT n.to_chuc_id
    FROM public.nhan_vien n
    WHERE n.id = public.app_kpi_current_employee_id()
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_current_store_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT n.cua_hang_id
    FROM public.nhan_vien n
    WHERE n.id = public.app_kpi_current_employee_id()
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE n.vai_tro::text
        WHEN 'nhan_vien' THEN 'employee'
        WHEN 'truong_ca' THEN 'shift_leader'
        WHEN 'quan_ly_cua_hang' THEN 'store_manager'
        WHEN 'quan_ly_khu_vuc' THEN 'area_manager'
        WHEN 'quan_tri_hr' THEN 'hr_admin'
        WHEN 'ban_giam_doc' THEN 'ceo'
        ELSE NULL
    END
    FROM public.nhan_vien n
    WHERE n.id = public.app_kpi_current_employee_id()
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_has_role(roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.app_kpi_current_role() = ANY(roles), FALSE)
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_is_ceo()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.app_kpi_current_role() = 'ceo', FALSE)
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_is_hr_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.app_kpi_current_role() = 'hr_admin', FALSE)
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_is_self(target_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.app_kpi_current_employee_id() = target_employee_id
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_can_view_employee(
    target_employee_id UUID,
    target_store_id UUID,
    target_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN public.app_kpi_is_self(target_employee_id) THEN TRUE
        WHEN public.app_kpi_current_org_id() IS DISTINCT FROM target_org_id THEN FALSE
        WHEN public.app_kpi_current_role() IN ('ceo', 'hr_admin', 'area_manager') THEN TRUE
        WHEN public.app_kpi_current_role() IN ('store_manager', 'shift_leader')
             AND public.app_kpi_current_store_id() = target_store_id THEN TRUE
        ELSE FALSE
    END
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_can_view_store(
    target_store_id UUID,
    target_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN public.app_kpi_current_org_id() IS DISTINCT FROM target_org_id THEN FALSE
        WHEN public.app_kpi_current_role() IN ('ceo', 'hr_admin', 'area_manager') THEN TRUE
        WHEN public.app_kpi_current_role() IN ('store_manager', 'shift_leader', 'employee')
             AND public.app_kpi_current_store_id() = target_store_id THEN TRUE
        ELSE FALSE
    END
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_can_configure(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.app_kpi_current_org_id() = target_org_id
       AND public.app_kpi_current_role() IN ('hr_admin', 'ceo')
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_can_approve_policy(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.app_kpi_current_org_id() = target_org_id
       AND public.app_kpi_current_role() = 'ceo'
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_can_manage_scope(
    target_store_id UUID,
    target_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN public.app_kpi_current_org_id() IS DISTINCT FROM target_org_id THEN FALSE
        WHEN public.app_kpi_current_role() IN ('ceo', 'hr_admin', 'area_manager') THEN TRUE
        WHEN public.app_kpi_current_role() IN ('store_manager', 'shift_leader')
             AND public.app_kpi_current_store_id() = target_store_id THEN TRUE
        ELSE FALSE
    END
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_can_manage_period(
    target_store_id UUID,
    target_org_id UUID,
    period_status TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN public.app_kpi_current_org_id() IS DISTINCT FROM target_org_id THEN FALSE
        WHEN public.app_kpi_current_role() = 'ceo' THEN TRUE
        WHEN period_status = 'locked' THEN FALSE
        WHEN public.app_kpi_current_role() IN ('hr_admin', 'area_manager') THEN TRUE
        WHEN public.app_kpi_current_role() IN ('store_manager', 'shift_leader')
             AND public.app_kpi_current_store_id() = target_store_id
             AND period_status IN ('draft', 'collecting', 'leader_scoring', 'ceo_preapproval') THEN TRUE
        ELSE FALSE
    END
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_can_view_salary(
    target_employee_id UUID,
    target_store_id UUID,
    target_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN public.app_kpi_is_self(target_employee_id) THEN TRUE
        WHEN public.app_kpi_current_org_id() IS DISTINCT FROM target_org_id THEN FALSE
        WHEN public.app_kpi_current_role() IN ('ceo', 'hr_admin', 'area_manager') THEN TRUE
        WHEN public.app_kpi_current_role() = 'store_manager'
             AND public.app_kpi_current_store_id() = target_store_id THEN TRUE
        ELSE FALSE
    END
$$;

CREATE OR REPLACE FUNCTION public.app_kpi_can_decide_salary(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.app_kpi_current_org_id() = target_org_id
       AND public.app_kpi_current_role() = 'ceo'
$$;

GRANT EXECUTE ON FUNCTION public.app_kpi_current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_current_store_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_has_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_is_self(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_can_view_employee(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_can_view_store(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_can_configure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_can_approve_policy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_can_manage_scope(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_can_manage_period(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_can_view_salary(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_kpi_can_decide_salary(UUID) TO authenticated;

ALTER TABLE public.kpi_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_set_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_period_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_criterion_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_source_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_incident_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_development_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_salary_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_salary_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kpi_sets_select ON public.kpi_sets;
DROP POLICY IF EXISTS kpi_sets_write ON public.kpi_sets;
CREATE POLICY kpi_sets_select ON public.kpi_sets
    FOR SELECT TO authenticated
    USING (
        public.app_kpi_current_org_id() = org_id
        AND public.app_kpi_current_role() IN ('shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo')
    );
CREATE POLICY kpi_sets_write ON public.kpi_sets
    FOR ALL TO authenticated
    USING (public.app_kpi_can_configure(org_id))
    WITH CHECK (public.app_kpi_can_configure(org_id));

DROP POLICY IF EXISTS kpi_set_versions_select ON public.kpi_set_versions;
DROP POLICY IF EXISTS kpi_set_versions_write ON public.kpi_set_versions;
CREATE POLICY kpi_set_versions_select ON public.kpi_set_versions
    FOR SELECT TO authenticated
    USING (
        public.app_kpi_can_view_store(public.app_kpi_current_store_id(), org_id)
        OR public.app_kpi_can_configure(org_id)
        OR (
            public.app_kpi_current_org_id() = org_id
            AND public.app_kpi_current_role() IN ('shift_leader', 'store_manager')
            AND (
                store_scope_all
                OR public.app_kpi_current_store_id() = ANY(store_ids)
            )
        )
    );
CREATE POLICY kpi_set_versions_write ON public.kpi_set_versions
    FOR ALL TO authenticated
    USING (public.app_kpi_can_configure(org_id))
    WITH CHECK (public.app_kpi_can_configure(org_id));

DROP POLICY IF EXISTS kpi_periods_select ON public.kpi_periods;
DROP POLICY IF EXISTS kpi_periods_insert ON public.kpi_periods;
DROP POLICY IF EXISTS kpi_periods_update ON public.kpi_periods;
CREATE POLICY kpi_periods_select ON public.kpi_periods
    FOR SELECT TO authenticated
    USING (public.app_kpi_can_view_store(store_id, org_id));
CREATE POLICY kpi_periods_insert ON public.kpi_periods
    FOR INSERT TO authenticated
    WITH CHECK (public.app_kpi_can_configure(org_id));
CREATE POLICY kpi_periods_update ON public.kpi_periods
    FOR UPDATE TO authenticated
    USING (public.app_kpi_can_manage_period(store_id, org_id, status))
    WITH CHECK (public.app_kpi_can_manage_period(store_id, org_id, status));

DROP POLICY IF EXISTS kpi_period_employees_select ON public.kpi_period_employees;
DROP POLICY IF EXISTS kpi_period_employees_write ON public.kpi_period_employees;
CREATE POLICY kpi_period_employees_select ON public.kpi_period_employees
    FOR SELECT TO authenticated
    USING (public.app_kpi_can_view_employee(employee_id, store_id, (SELECT org_id FROM public.kpi_periods WHERE id = period_id)));
CREATE POLICY kpi_period_employees_write ON public.kpi_period_employees
    FOR ALL TO authenticated
    USING (public.app_kpi_can_configure((SELECT org_id FROM public.kpi_periods WHERE id = period_id)))
    WITH CHECK (public.app_kpi_can_configure((SELECT org_id FROM public.kpi_periods WHERE id = period_id)));

DROP POLICY IF EXISTS kpi_evaluations_select ON public.kpi_evaluations;
DROP POLICY IF EXISTS kpi_evaluations_write ON public.kpi_evaluations;
CREATE POLICY kpi_evaluations_select ON public.kpi_evaluations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_period_employees pe
            JOIN public.kpi_periods p ON p.id = pe.period_id
            WHERE pe.id = period_employee_id
              AND public.app_kpi_can_view_employee(pe.employee_id, pe.store_id, p.org_id)
        )
    );
CREATE POLICY kpi_evaluations_write ON public.kpi_evaluations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_periods p
            WHERE p.id = period_id
              AND public.app_kpi_can_manage_period(p.store_id, p.org_id, p.status)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.kpi_periods p
            WHERE p.id = period_id
              AND public.app_kpi_can_manage_period(p.store_id, p.org_id, p.status)
        )
    );

DROP POLICY IF EXISTS kpi_criterion_scores_select ON public.kpi_criterion_scores;
DROP POLICY IF EXISTS kpi_criterion_scores_write ON public.kpi_criterion_scores;
CREATE POLICY kpi_criterion_scores_select ON public.kpi_criterion_scores
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_evaluations e
            JOIN public.kpi_period_employees pe ON pe.id = e.period_employee_id
            JOIN public.kpi_periods p ON p.id = e.period_id
            WHERE e.id = evaluation_id
              AND public.app_kpi_can_view_employee(pe.employee_id, pe.store_id, p.org_id)
        )
    );
CREATE POLICY kpi_criterion_scores_write ON public.kpi_criterion_scores
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_evaluations e
            JOIN public.kpi_periods p ON p.id = e.period_id
            WHERE e.id = evaluation_id
              AND public.app_kpi_can_manage_period(p.store_id, p.org_id, p.status)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.kpi_evaluations e
            JOIN public.kpi_periods p ON p.id = e.period_id
            WHERE e.id = evaluation_id
              AND public.app_kpi_can_manage_period(p.store_id, p.org_id, p.status)
        )
    );

DROP POLICY IF EXISTS kpi_source_data_select ON public.kpi_source_data;
DROP POLICY IF EXISTS kpi_source_data_write ON public.kpi_source_data;
CREATE POLICY kpi_source_data_select ON public.kpi_source_data
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_periods p
            WHERE p.id = period_id
              AND public.app_kpi_can_view_employee(employee_id, p.store_id, p.org_id)
        )
    );
CREATE POLICY kpi_source_data_write ON public.kpi_source_data
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_periods p
            WHERE p.id = period_id
              AND public.app_kpi_can_manage_period(p.store_id, p.org_id, p.status)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.kpi_periods p
            WHERE p.id = period_id
              AND public.app_kpi_can_manage_period(p.store_id, p.org_id, p.status)
        )
    );

DROP POLICY IF EXISTS kpi_incidents_select ON public.kpi_incidents;
DROP POLICY IF EXISTS kpi_incidents_write ON public.kpi_incidents;
CREATE POLICY kpi_incidents_select ON public.kpi_incidents
    FOR SELECT TO authenticated
    USING (public.app_kpi_can_view_employee(employee_id, store_id, org_id));
CREATE POLICY kpi_incidents_write ON public.kpi_incidents
    FOR ALL TO authenticated
    USING (public.app_kpi_can_manage_scope(store_id, org_id))
    WITH CHECK (public.app_kpi_can_manage_scope(store_id, org_id));

DROP POLICY IF EXISTS kpi_incident_violations_select ON public.kpi_incident_violations;
DROP POLICY IF EXISTS kpi_incident_violations_write ON public.kpi_incident_violations;
CREATE POLICY kpi_incident_violations_select ON public.kpi_incident_violations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_incidents i
            WHERE i.id = incident_id
              AND public.app_kpi_can_view_employee(i.employee_id, i.store_id, i.org_id)
        )
    );
CREATE POLICY kpi_incident_violations_write ON public.kpi_incident_violations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_incidents i
            WHERE i.id = incident_id
              AND public.app_kpi_can_manage_scope(i.store_id, i.org_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.kpi_incidents i
            WHERE i.id = incident_id
              AND public.app_kpi_can_manage_scope(i.store_id, i.org_id)
        )
    );

DROP POLICY IF EXISTS kpi_appeals_select ON public.kpi_appeals;
DROP POLICY IF EXISTS kpi_appeals_insert ON public.kpi_appeals;
DROP POLICY IF EXISTS kpi_appeals_update ON public.kpi_appeals;
CREATE POLICY kpi_appeals_select ON public.kpi_appeals
    FOR SELECT TO authenticated
    USING (
        public.app_kpi_is_self(employee_id)
        OR (
            public.app_kpi_current_org_id() = org_id
            AND public.app_kpi_current_role() IN ('shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo')
        )
    );
CREATE POLICY kpi_appeals_insert ON public.kpi_appeals
    FOR INSERT TO authenticated
    WITH CHECK (
        public.app_kpi_is_self(employee_id)
        AND public.app_kpi_current_org_id() = org_id
    );
CREATE POLICY kpi_appeals_update ON public.kpi_appeals
    FOR UPDATE TO authenticated
    USING (
        public.app_kpi_current_org_id() = org_id
        AND public.app_kpi_current_role() IN ('shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo')
    )
    WITH CHECK (
        public.app_kpi_current_org_id() = org_id
        AND public.app_kpi_current_role() IN ('shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo')
    );

DROP POLICY IF EXISTS kpi_development_cases_select ON public.kpi_development_cases;
DROP POLICY IF EXISTS kpi_development_cases_insert ON public.kpi_development_cases;
DROP POLICY IF EXISTS kpi_development_cases_update ON public.kpi_development_cases;
CREATE POLICY kpi_development_cases_select ON public.kpi_development_cases
    FOR SELECT TO authenticated
    USING (public.app_kpi_can_view_employee(employee_id, store_id, org_id));
CREATE POLICY kpi_development_cases_insert ON public.kpi_development_cases
    FOR INSERT TO authenticated
    WITH CHECK (public.app_kpi_can_manage_scope(store_id, org_id));
CREATE POLICY kpi_development_cases_update ON public.kpi_development_cases
    FOR UPDATE TO authenticated
    USING (
        public.app_kpi_can_manage_scope(store_id, org_id)
        OR public.app_kpi_can_approve_policy(org_id)
    )
    WITH CHECK (
        public.app_kpi_can_manage_scope(store_id, org_id)
        OR public.app_kpi_can_approve_policy(org_id)
    );

DROP POLICY IF EXISTS kpi_test_sessions_select ON public.kpi_test_sessions;
DROP POLICY IF EXISTS kpi_test_sessions_write ON public.kpi_test_sessions;
CREATE POLICY kpi_test_sessions_select ON public.kpi_test_sessions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_development_cases dc
            WHERE dc.id = development_case_id
              AND public.app_kpi_can_view_employee(dc.employee_id, dc.store_id, dc.org_id)
        )
    );
CREATE POLICY kpi_test_sessions_write ON public.kpi_test_sessions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_development_cases dc
            WHERE dc.id = development_case_id
              AND public.app_kpi_can_manage_scope(dc.store_id, dc.org_id)
              AND public.app_kpi_current_role() IN ('store_manager', 'area_manager', 'hr_admin', 'ceo')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.kpi_development_cases dc
            WHERE dc.id = development_case_id
              AND public.app_kpi_can_manage_scope(dc.store_id, dc.org_id)
              AND public.app_kpi_current_role() IN ('store_manager', 'area_manager', 'hr_admin', 'ceo')
        )
    );

DROP POLICY IF EXISTS kpi_challenges_select ON public.kpi_challenges;
DROP POLICY IF EXISTS kpi_challenges_write ON public.kpi_challenges;
CREATE POLICY kpi_challenges_select ON public.kpi_challenges
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_development_cases dc
            WHERE dc.id = development_case_id
              AND public.app_kpi_can_view_employee(dc.employee_id, dc.store_id, dc.org_id)
        )
    );
CREATE POLICY kpi_challenges_write ON public.kpi_challenges
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_development_cases dc
            WHERE dc.id = development_case_id
              AND public.app_kpi_can_manage_scope(dc.store_id, dc.org_id)
              AND public.app_kpi_current_role() IN ('store_manager', 'area_manager', 'hr_admin', 'ceo')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.kpi_development_cases dc
            WHERE dc.id = development_case_id
              AND public.app_kpi_can_manage_scope(dc.store_id, dc.org_id)
              AND public.app_kpi_current_role() IN ('store_manager', 'area_manager', 'hr_admin', 'ceo')
        )
    );

DROP POLICY IF EXISTS kpi_salary_bands_select ON public.kpi_salary_bands;
DROP POLICY IF EXISTS kpi_salary_bands_write ON public.kpi_salary_bands;
CREATE POLICY kpi_salary_bands_select ON public.kpi_salary_bands
    FOR SELECT TO authenticated
    USING (
        public.app_kpi_current_org_id() = org_id
        AND public.app_kpi_current_role() IN ('store_manager', 'area_manager', 'hr_admin', 'ceo')
    );
CREATE POLICY kpi_salary_bands_write ON public.kpi_salary_bands
    FOR ALL TO authenticated
    USING (public.app_kpi_can_configure(org_id))
    WITH CHECK (public.app_kpi_can_configure(org_id));

DROP POLICY IF EXISTS kpi_salary_decisions_select ON public.kpi_salary_decisions;
DROP POLICY IF EXISTS kpi_salary_decisions_write ON public.kpi_salary_decisions;
CREATE POLICY kpi_salary_decisions_select ON public.kpi_salary_decisions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_development_cases dc
            WHERE dc.id = development_case_id
              AND public.app_kpi_can_view_salary(dc.employee_id, dc.store_id, dc.org_id)
        )
    );
CREATE POLICY kpi_salary_decisions_write ON public.kpi_salary_decisions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.kpi_development_cases dc
            WHERE dc.id = development_case_id
              AND public.app_kpi_can_decide_salary(dc.org_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.kpi_development_cases dc
            WHERE dc.id = development_case_id
              AND public.app_kpi_can_decide_salary(dc.org_id)
        )
    );

DROP POLICY IF EXISTS kpi_audit_logs_select ON public.kpi_audit_logs;
DROP POLICY IF EXISTS kpi_audit_logs_write ON public.kpi_audit_logs;
CREATE POLICY kpi_audit_logs_select ON public.kpi_audit_logs
    FOR SELECT TO authenticated
    USING (
        public.app_kpi_current_org_id() = org_id
        AND public.app_kpi_current_role() IN ('hr_admin', 'ceo')
    );
CREATE POLICY kpi_audit_logs_write ON public.kpi_audit_logs
    FOR ALL TO authenticated
    USING (
        public.app_kpi_current_org_id() = org_id
        AND public.app_kpi_current_role() IN ('store_manager', 'area_manager', 'hr_admin', 'ceo')
    )
    WITH CHECK (
        public.app_kpi_current_org_id() = org_id
        AND public.app_kpi_current_role() IN ('store_manager', 'area_manager', 'hr_admin', 'ceo')
    );
