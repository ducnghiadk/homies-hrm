-- Homies HRM - KPI Career Map RLS & Atomic RPCs
-- Created at: 2026-08-24
-- Target: Supabase Postgres

-- 0. Identity & Role Helper Functions (Self-contained & Idempotent)
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

CREATE OR REPLACE FUNCTION public.app_kpi_can_view_store(
    target_store_id UUID,
    target_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN target_org_id IS NOT NULL AND (SELECT n.to_chuc_id FROM public.nhan_vien n WHERE n.id = public.app_kpi_current_employee_id()) IS DISTINCT FROM target_org_id THEN FALSE
        WHEN public.app_kpi_current_role() IN ('ceo', 'hr_admin', 'area_manager') THEN TRUE
        WHEN public.app_kpi_current_role() IN ('store_manager', 'shift_leader', 'employee')
             AND (SELECT n.cua_hang_id FROM public.nhan_vien n WHERE n.id = public.app_kpi_current_employee_id()) = target_store_id THEN TRUE
        ELSE FALSE
    END
$$;

ALTER TABLE public.kpi_career_map_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_career_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_career_map_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_position_criteria_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_position_criteria_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_career_employee_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_career_map_approval_logs ENABLE ROW LEVEL SECURITY;

-- 1. Policies for kpi_career_map_versions
DROP POLICY IF EXISTS "Career map version read policy" ON public.kpi_career_map_versions;
CREATE POLICY "Career map version read policy"
  ON public.kpi_career_map_versions
  FOR SELECT
  USING (
    status = 'published'
    OR public.app_kpi_is_ceo()
    OR public.app_kpi_is_hr_admin()
  );

DROP POLICY IF EXISTS "Career map version HR/CEO write policy" ON public.kpi_career_map_versions;
CREATE POLICY "Career map version HR/CEO write policy"
  ON public.kpi_career_map_versions
  FOR ALL
  USING (
    public.app_kpi_is_ceo()
    OR (public.app_kpi_is_hr_admin() AND status IN ('draft', 'returned'))
  )
  WITH CHECK (
    public.app_kpi_is_ceo()
    OR (public.app_kpi_is_hr_admin() AND status IN ('draft', 'returned', 'pending_approval'))
  );

-- 2. Policies for nodes and edges (Inherit from version)
DROP POLICY IF EXISTS "Career map nodes read policy" ON public.kpi_career_map_nodes;
CREATE POLICY "Career map nodes read policy"
  ON public.kpi_career_map_nodes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.kpi_career_map_versions v
      WHERE v.id = kpi_career_map_nodes.career_map_version_id
        AND (v.status = 'published' OR public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin())
    )
  );

DROP POLICY IF EXISTS "Career map nodes write policy" ON public.kpi_career_map_nodes;
CREATE POLICY "Career map nodes write policy"
  ON public.kpi_career_map_nodes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kpi_career_map_versions v
      WHERE v.id = kpi_career_map_nodes.career_map_version_id
        AND (public.app_kpi_is_ceo() OR (public.app_kpi_is_hr_admin() AND v.status IN ('draft', 'returned')))
    )
  );

DROP POLICY IF EXISTS "Career map edges read policy" ON public.kpi_career_map_edges;
CREATE POLICY "Career map edges read policy"
  ON public.kpi_career_map_edges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.kpi_career_map_versions v
      WHERE v.id = kpi_career_map_edges.career_map_version_id
        AND (v.status = 'published' OR public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin())
    )
  );

DROP POLICY IF EXISTS "Career map edges write policy" ON public.kpi_career_map_edges;
CREATE POLICY "Career map edges write policy"
  ON public.kpi_career_map_edges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kpi_career_map_versions v
      WHERE v.id = kpi_career_map_edges.career_map_version_id
        AND (public.app_kpi_is_ceo() OR (public.app_kpi_is_hr_admin() AND v.status IN ('draft', 'returned')))
    )
  );

-- 3. Policies for criteria profiles & items
DROP POLICY IF EXISTS "Criteria profiles read policy" ON public.kpi_position_criteria_profiles;
CREATE POLICY "Criteria profiles read policy"
  ON public.kpi_position_criteria_profiles
  FOR SELECT
  USING (
    public.app_kpi_is_ceo()
    OR public.app_kpi_is_hr_admin()
    OR effective_from IS NOT NULL
  );

DROP POLICY IF EXISTS "Criteria profiles write policy" ON public.kpi_position_criteria_profiles;
CREATE POLICY "Criteria profiles write policy"
  ON public.kpi_position_criteria_profiles
  FOR ALL
  USING (public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin());

DROP POLICY IF EXISTS "Criteria items read policy" ON public.kpi_position_criteria_items;
CREATE POLICY "Criteria items read policy"
  ON public.kpi_position_criteria_items
  FOR SELECT
  USING (
    public.app_kpi_is_ceo()
    OR public.app_kpi_is_hr_admin()
    OR EXISTS (
      SELECT 1 FROM public.kpi_position_criteria_profiles p
      WHERE p.id = kpi_position_criteria_items.profile_id
        AND p.effective_from IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Criteria items write policy" ON public.kpi_position_criteria_items;
CREATE POLICY "Criteria items write policy"
  ON public.kpi_position_criteria_items
  FOR ALL
  USING (public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin());

-- 4. Policies for placements
DROP POLICY IF EXISTS "Placements read policy" ON public.kpi_career_employee_placements;
CREATE POLICY "Placements read policy"
  ON public.kpi_career_employee_placements
  FOR SELECT
  USING (
    employee_id = public.app_kpi_current_employee_id()
    OR public.app_kpi_is_ceo()
    OR public.app_kpi_is_hr_admin()
    OR public.app_kpi_can_view_store(store_id, NULL)
  );

-- 5. Policies for approval logs (HR Admin & CEO only)
DROP POLICY IF EXISTS "Approval logs read policy" ON public.kpi_career_map_approval_logs;
CREATE POLICY "Approval logs read policy"
  ON public.kpi_career_map_approval_logs
  FOR SELECT
  USING (public.app_kpi_is_ceo() OR public.app_kpi_is_hr_admin());
