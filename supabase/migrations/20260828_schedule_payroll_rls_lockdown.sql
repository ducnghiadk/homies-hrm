-- Lock down legacy public policies for schedule, attendance and payroll tables.
-- Depends on the v3 master schema and nhan_vien.auth_id.

CREATE OR REPLACE FUNCTION public.app_hrm_current_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nv.id
  FROM public.nhan_vien AS nv
  WHERE nv.auth_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_current_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nv.to_chuc_id
  FROM public.nhan_vien AS nv
  WHERE nv.auth_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_current_store_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nv.cua_hang_id
  FROM public.nhan_vien AS nv
  WHERE nv.auth_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nv.vai_tro::TEXT
  FROM public.nhan_vien AS nv
  WHERE nv.auth_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_is_global_viewer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_hrm_current_role() IN ('quan_ly_khu_vuc', 'quan_tri_hr', 'ban_giam_doc')
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_is_payroll_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_hrm_current_role() IN ('quan_tri_hr', 'ban_giam_doc')
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_store_in_org(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cua_hang AS ch
    WHERE ch.id = target_store_id
      AND ch.to_chuc_id = public.app_hrm_current_org_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_position_in_org(target_position_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chuc_vu AS cv
    WHERE cv.id = target_position_id
      AND cv.to_chuc_id = public.app_hrm_current_org_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_employee_matches_store(
  target_employee_id UUID,
  target_store_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nhan_vien AS nv
    WHERE nv.id = target_employee_id
      AND nv.cua_hang_id = target_store_id
      AND nv.to_chuc_id = public.app_hrm_current_org_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_shift_in_org(target_shift_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ca_lam AS cl
    WHERE cl.id = target_shift_id
      AND cl.to_chuc_id = public.app_hrm_current_org_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_payroll_slip_in_scope(
  target_period_id UUID,
  target_employee_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ky_luong AS kl
    JOIN public.nhan_vien AS nv ON nv.to_chuc_id = kl.to_chuc_id
    WHERE kl.id = target_period_id
      AND nv.id = target_employee_id
      AND kl.to_chuc_id = public.app_hrm_current_org_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_can_view_store(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_hrm_store_in_org(target_store_id)
    AND (
      public.app_hrm_is_global_viewer()
      OR (
        public.app_hrm_current_role() IN ('truong_ca', 'quan_ly_cua_hang')
        AND target_store_id = public.app_hrm_current_store_id()
      )
    )
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_can_manage_store(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_hrm_store_in_org(target_store_id)
    AND (
      public.app_hrm_is_payroll_admin()
      OR (
        public.app_hrm_current_role() = 'quan_ly_cua_hang'
        AND target_store_id = public.app_hrm_current_store_id()
      )
    )
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_can_manage_schedule_rules()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_hrm_current_employee_id() IS NOT NULL
    AND public.app_hrm_current_role() IN (
      'quan_ly_cua_hang', 'quan_ly_khu_vuc', 'quan_tri_hr', 'ban_giam_doc'
    )
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_can_manage_attendance(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_hrm_store_in_org(target_store_id)
    AND (
      public.app_hrm_is_global_viewer()
      OR (
        public.app_hrm_current_role() IN ('truong_ca', 'quan_ly_cua_hang')
        AND target_store_id = public.app_hrm_current_store_id()
      )
    )
$$;

CREATE OR REPLACE FUNCTION public.app_hrm_can_manage_schedule(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_hrm_store_in_org(target_store_id)
    AND (
      public.app_hrm_is_global_viewer()
      OR (
        public.app_hrm_current_role() = 'quan_ly_cua_hang'
        AND target_store_id = public.app_hrm_current_store_id()
      )
    )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_hrm_current_role() IN (
    'truong_ca', 'quan_ly_cua_hang', 'quan_ly_khu_vuc', 'quan_tri_hr', 'ban_giam_doc'
  )
$$;

GRANT EXECUTE ON FUNCTION public.app_hrm_current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_current_store_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_store_in_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_position_in_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_employee_matches_store(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_shift_in_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_payroll_slip_in_scope(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_can_view_store(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_can_manage_store(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_can_manage_schedule_rules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_can_manage_attendance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hrm_can_manage_schedule(UUID) TO authenticated;

DO $$
  DECLARE
  table_name TEXT;
  p RECORD;
  table_names TEXT[] := ARRAY[
    'cua_hang', 'chuc_vu', 'nhan_vien', 'ca_lam', 'lich_phan_ca',
    'cham_cong', 'don_tu', 'ky_luong', 'phieu_luong',
    'quy_tac_xep_ca', 'ngoai_le_quy_tac'
  ];
BEGIN
  FOREACH table_name IN ARRAY table_names LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;

  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ANY(table_names)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

CREATE POLICY hrm_cua_hang_select ON public.cua_hang
  FOR SELECT TO authenticated
  USING (
    public.app_hrm_store_in_org(id)
    AND (
      public.app_hrm_is_global_viewer()
      OR id = public.app_hrm_current_store_id()
    )
  );

CREATE POLICY hrm_cua_hang_manage ON public.cua_hang
  FOR ALL TO authenticated
  USING (public.app_hrm_is_payroll_admin() AND to_chuc_id = public.app_hrm_current_org_id())
  WITH CHECK (public.app_hrm_is_payroll_admin() AND to_chuc_id = public.app_hrm_current_org_id());

CREATE POLICY hrm_chuc_vu_select ON public.chuc_vu
  FOR SELECT TO authenticated
  USING (to_chuc_id = public.app_hrm_current_org_id());

CREATE POLICY hrm_chuc_vu_manage ON public.chuc_vu
  FOR ALL TO authenticated
  USING (public.app_hrm_is_payroll_admin() AND to_chuc_id = public.app_hrm_current_org_id())
  WITH CHECK (public.app_hrm_is_payroll_admin() AND to_chuc_id = public.app_hrm_current_org_id());

CREATE POLICY hrm_ca_lam_select ON public.ca_lam
  FOR SELECT TO authenticated
  USING (to_chuc_id = public.app_hrm_current_org_id());

CREATE POLICY hrm_ca_lam_manage ON public.ca_lam
  FOR ALL TO authenticated
  USING (public.app_hrm_is_payroll_admin() AND to_chuc_id = public.app_hrm_current_org_id())
  WITH CHECK (public.app_hrm_is_payroll_admin() AND to_chuc_id = public.app_hrm_current_org_id());

CREATE POLICY hrm_nhan_vien_select ON public.nhan_vien
  FOR SELECT TO authenticated
  USING (
    id = public.app_hrm_current_employee_id()
    OR (
      to_chuc_id = public.app_hrm_current_org_id()
      AND (
        public.app_hrm_is_global_viewer()
        OR (
          public.app_hrm_current_role() IN ('truong_ca', 'quan_ly_cua_hang')
          AND cua_hang_id = public.app_hrm_current_store_id()
        )
      )
    )
  );

CREATE POLICY hrm_nhan_vien_insert ON public.nhan_vien
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_hrm_is_payroll_admin()
    AND to_chuc_id = public.app_hrm_current_org_id()
    AND (cua_hang_id IS NULL OR public.app_hrm_store_in_org(cua_hang_id))
    AND (chuc_vu_id IS NULL OR public.app_hrm_position_in_org(chuc_vu_id))
  );

CREATE POLICY hrm_nhan_vien_update ON public.nhan_vien
  FOR UPDATE TO authenticated
  USING (
    (
      id = public.app_hrm_current_employee_id()
      AND to_chuc_id = public.app_hrm_current_org_id()
      AND cua_hang_id = public.app_hrm_current_store_id()
      AND vai_tro::TEXT = public.app_hrm_current_role()
    )
    OR (
      public.app_hrm_current_role() = 'quan_ly_cua_hang'
      AND to_chuc_id = public.app_hrm_current_org_id()
      AND cua_hang_id = public.app_hrm_current_store_id()
    )
    OR (
      public.app_hrm_is_payroll_admin()
      AND to_chuc_id = public.app_hrm_current_org_id()
    )
  )
  WITH CHECK (
    (
      id = public.app_hrm_current_employee_id()
      AND to_chuc_id = public.app_hrm_current_org_id()
      AND cua_hang_id = public.app_hrm_current_store_id()
      AND vai_tro::TEXT = public.app_hrm_current_role()
    )
    OR (
      public.app_hrm_current_role() = 'quan_ly_cua_hang'
      AND to_chuc_id = public.app_hrm_current_org_id()
      AND cua_hang_id = public.app_hrm_current_store_id()
      AND vai_tro::TEXT IN ('nhan_vien', 'truong_ca', 'quan_ly_cua_hang')
      AND (chuc_vu_id IS NULL OR public.app_hrm_position_in_org(chuc_vu_id))
    )
    OR (
      public.app_hrm_is_payroll_admin()
      AND to_chuc_id = public.app_hrm_current_org_id()
      AND (cua_hang_id IS NULL OR public.app_hrm_store_in_org(cua_hang_id))
      AND (chuc_vu_id IS NULL OR public.app_hrm_position_in_org(chuc_vu_id))
    )
  );

CREATE POLICY hrm_nhan_vien_delete ON public.nhan_vien
  FOR DELETE TO authenticated
  USING (public.app_hrm_is_payroll_admin() AND to_chuc_id = public.app_hrm_current_org_id());

CREATE POLICY hrm_lich_phan_ca_select ON public.lich_phan_ca
  FOR SELECT TO authenticated
  USING (
    nhan_vien_id = public.app_hrm_current_employee_id()
    OR public.app_hrm_can_view_store(cua_hang_id)
  );

CREATE POLICY hrm_lich_phan_ca_manage ON public.lich_phan_ca
  FOR ALL TO authenticated
  USING (
    public.app_hrm_can_manage_schedule(cua_hang_id)
    AND public.app_hrm_employee_matches_store(nhan_vien_id, cua_hang_id)
    AND public.app_hrm_shift_in_org(ca_lam_id)
  )
  WITH CHECK (
    public.app_hrm_can_manage_schedule(cua_hang_id)
    AND public.app_hrm_employee_matches_store(nhan_vien_id, cua_hang_id)
    AND public.app_hrm_shift_in_org(ca_lam_id)
  );

CREATE POLICY hrm_cham_cong_select ON public.cham_cong
  FOR SELECT TO authenticated
  USING (
    nhan_vien_id = public.app_hrm_current_employee_id()
    OR public.app_hrm_can_view_store(cua_hang_id)
  );

CREATE POLICY hrm_cham_cong_insert ON public.cham_cong
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      nhan_vien_id = public.app_hrm_current_employee_id()
      AND cua_hang_id = public.app_hrm_current_store_id()
      AND public.app_hrm_employee_matches_store(nhan_vien_id, cua_hang_id)
    )
    OR (
      public.app_hrm_can_manage_attendance(cua_hang_id)
      AND public.app_hrm_employee_matches_store(nhan_vien_id, cua_hang_id)
    )
  );

CREATE POLICY hrm_cham_cong_update ON public.cham_cong
  FOR UPDATE TO authenticated
  USING (
    nhan_vien_id = public.app_hrm_current_employee_id()
    OR public.app_hrm_can_manage_attendance(cua_hang_id)
  )
  WITH CHECK (
    (
      nhan_vien_id = public.app_hrm_current_employee_id()
      AND cua_hang_id = public.app_hrm_current_store_id()
      AND public.app_hrm_employee_matches_store(nhan_vien_id, cua_hang_id)
    )
    OR (
      public.app_hrm_can_manage_attendance(cua_hang_id)
      AND public.app_hrm_employee_matches_store(nhan_vien_id, cua_hang_id)
    )
  );

CREATE POLICY hrm_cham_cong_delete ON public.cham_cong
  FOR DELETE TO authenticated
  USING (public.app_hrm_can_manage_attendance(cua_hang_id));

CREATE POLICY hrm_don_tu_select ON public.don_tu
  FOR SELECT TO authenticated
  USING (
    nhan_vien_id = public.app_hrm_current_employee_id()
    OR public.app_hrm_can_view_store(cua_hang_id)
  );

CREATE POLICY hrm_don_tu_insert ON public.don_tu
  FOR INSERT TO authenticated
  WITH CHECK (
    nhan_vien_id = public.app_hrm_current_employee_id()
    AND cua_hang_id = public.app_hrm_current_store_id()
    AND public.app_hrm_employee_matches_store(nhan_vien_id, cua_hang_id)
  );

CREATE POLICY hrm_don_tu_update ON public.don_tu
  FOR UPDATE TO authenticated
  USING (
    nhan_vien_id = public.app_hrm_current_employee_id()
    OR public.app_hrm_can_manage_attendance(cua_hang_id)
  )
  WITH CHECK (
    (
      nhan_vien_id = public.app_hrm_current_employee_id()
      AND public.app_hrm_employee_matches_store(nhan_vien_id, cua_hang_id)
    )
    OR (
      public.app_hrm_can_manage_attendance(cua_hang_id)
      AND public.app_hrm_employee_matches_store(nhan_vien_id, cua_hang_id)
    )
  );

CREATE POLICY hrm_ky_luong_select ON public.ky_luong
  FOR SELECT TO authenticated
  USING (
    public.app_hrm_is_payroll_admin()
    AND to_chuc_id = public.app_hrm_current_org_id()
  );

CREATE POLICY hrm_ky_luong_manage ON public.ky_luong
  FOR ALL TO authenticated
  USING (
    public.app_hrm_is_payroll_admin()
    AND to_chuc_id = public.app_hrm_current_org_id()
  )
  WITH CHECK (
    public.app_hrm_is_payroll_admin()
    AND to_chuc_id = public.app_hrm_current_org_id()
  );

CREATE POLICY hrm_phieu_luong_select ON public.phieu_luong
  FOR SELECT TO authenticated
  USING (
    public.app_hrm_payroll_slip_in_scope(ky_luong_id, nhan_vien_id)
    AND (
      nhan_vien_id = public.app_hrm_current_employee_id()
      OR public.app_hrm_is_payroll_admin()
    )
  );

CREATE POLICY hrm_phieu_luong_manage ON public.phieu_luong
  FOR ALL TO authenticated
  USING (
    public.app_hrm_is_payroll_admin()
    AND public.app_hrm_payroll_slip_in_scope(ky_luong_id, nhan_vien_id)
  )
  WITH CHECK (
    public.app_hrm_is_payroll_admin()
    AND public.app_hrm_payroll_slip_in_scope(ky_luong_id, nhan_vien_id)
  );

DO $$
BEGIN
  IF to_regclass('public.quy_tac_xep_ca') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY hrm_quy_tac_xep_ca_select ON public.quy_tac_xep_ca
      FOR SELECT TO authenticated
      USING (auth.uid() IS NOT NULL)
    $policy$;
    EXECUTE $policy$
      CREATE POLICY hrm_quy_tac_xep_ca_manage ON public.quy_tac_xep_ca
      FOR ALL TO authenticated
      USING (public.app_hrm_can_manage_schedule_rules())
      WITH CHECK (public.app_hrm_can_manage_schedule_rules())
    $policy$;
  END IF;

  IF to_regclass('public.ngoai_le_quy_tac') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY hrm_ngoai_le_quy_tac_select ON public.ngoai_le_quy_tac
      FOR SELECT TO authenticated
      USING (auth.uid() IS NOT NULL)
    $policy$;
    EXECUTE $policy$
      CREATE POLICY hrm_ngoai_le_quy_tac_manage ON public.ngoai_le_quy_tac
      FOR ALL TO authenticated
      USING (public.app_hrm_can_manage_schedule_rules())
      WITH CHECK (public.app_hrm_can_manage_schedule_rules())
    $policy$;
  END IF;
END $$;

REVOKE ALL ON TABLE public.cua_hang, public.chuc_vu, public.nhan_vien,
  public.ca_lam, public.lich_phan_ca, public.cham_cong, public.don_tu,
  public.ky_luong, public.phieu_luong FROM anon;

GRANT SELECT ON TABLE public.cua_hang, public.chuc_vu, public.ca_lam TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nhan_vien TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lich_phan_ca TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cham_cong TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.don_tu TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ky_luong, public.phieu_luong TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.quy_tac_xep_ca') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.quy_tac_xep_ca FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quy_tac_xep_ca TO authenticated';
  END IF;

  IF to_regclass('public.ngoai_le_quy_tac') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.ngoai_le_quy_tac FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ngoai_le_quy_tac TO authenticated';
  END IF;
END $$;
