-- ============================================================
-- HOMIES MILK TEA - KPI CAREER MAP CORRECTION MIGRATION (ROUND 4)
-- Database: Supabase / PostgreSQL
-- Created: 2026-08-24
-- Scope: Unified TEXT ID strategy for Career Map aggregate,
--        Single Publish RPC, Delete reconciliation constraints,
--        Strict HR Submit / CEO Publish state machine
-- ============================================================

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

-- 1. Drop old overloaded RPC functions to leave exactly ONE signature
DROP FUNCTION IF EXISTS public.publish_kpi_career_map(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS public.publish_kpi_career_map(UUID, DATE);
DROP FUNCTION IF EXISTS public.publish_kpi_career_map(TEXT, DATE);
DROP FUNCTION IF EXISTS public.submit_kpi_career_map_for_approval(UUID);
DROP FUNCTION IF EXISTS public.submit_kpi_career_map_for_approval(TEXT);
DROP FUNCTION IF EXISTS public.return_kpi_career_map(UUID, TEXT);
DROP FUNCTION IF EXISTS public.return_kpi_career_map(TEXT, TEXT);

-- 2. Alter Career Aggregate IDs to TEXT (Preserving UUID for employee/store/actor)
-- Drop existing FK constraints before type change
DO $$
BEGIN
  -- kpi_career_map_versions
  ALTER TABLE public.kpi_career_map_versions DROP CONSTRAINT IF EXISTS kpi_career_map_versions_based_on_version_id_fkey;
  -- kpi_career_map_nodes
  ALTER TABLE public.kpi_career_map_nodes DROP CONSTRAINT IF EXISTS kpi_career_map_nodes_career_map_version_id_fkey;
  -- kpi_career_map_edges
  ALTER TABLE public.kpi_career_map_edges DROP CONSTRAINT IF EXISTS kpi_career_map_edges_career_map_version_id_fkey;
  ALTER TABLE public.kpi_career_map_edges DROP CONSTRAINT IF EXISTS kpi_career_map_edges_source_node_id_fkey;
  ALTER TABLE public.kpi_career_map_edges DROP CONSTRAINT IF EXISTS kpi_career_map_edges_target_node_id_fkey;
  -- kpi_position_criteria_items
  ALTER TABLE public.kpi_position_criteria_items DROP CONSTRAINT IF EXISTS kpi_position_criteria_items_profile_id_fkey;
  -- kpi_career_employee_placements
  ALTER TABLE public.kpi_career_employee_placements DROP CONSTRAINT IF EXISTS kpi_career_employee_placements_career_map_version_id_fkey;
  ALTER TABLE public.kpi_career_employee_placements DROP CONSTRAINT IF EXISTS kpi_career_employee_placements_node_id_fkey;
  -- kpi_career_map_approval_logs
  ALTER TABLE public.kpi_career_map_approval_logs DROP CONSTRAINT IF EXISTS kpi_career_map_approval_logs_career_map_version_id_fkey;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Convert aggregate ID columns to TEXT
ALTER TABLE public.kpi_career_map_versions 
  ALTER COLUMN id TYPE TEXT USING id::text,
  ALTER COLUMN based_on_version_id TYPE TEXT USING based_on_version_id::text;

ALTER TABLE public.kpi_career_map_nodes 
  ALTER COLUMN id TYPE TEXT USING id::text,
  ALTER COLUMN career_map_version_id TYPE TEXT USING career_map_version_id::text,
  ALTER COLUMN criteria_profile_id TYPE TEXT USING criteria_profile_id::text;

ALTER TABLE public.kpi_career_map_edges 
  ALTER COLUMN id TYPE TEXT USING id::text,
  ALTER COLUMN career_map_version_id TYPE TEXT USING career_map_version_id::text,
  ALTER COLUMN source_node_id TYPE TEXT USING source_node_id::text,
  ALTER COLUMN target_node_id TYPE TEXT USING target_node_id::text;

ALTER TABLE public.kpi_position_criteria_profiles 
  ALTER COLUMN id TYPE TEXT USING id::text;

ALTER TABLE public.kpi_position_criteria_items 
  ALTER COLUMN id TYPE TEXT USING id::text,
  ALTER COLUMN profile_id TYPE TEXT USING profile_id::text;

ALTER TABLE public.kpi_career_employee_placements 
  ALTER COLUMN id TYPE TEXT USING id::text,
  ALTER COLUMN career_map_version_id TYPE TEXT USING career_map_version_id::text,
  ALTER COLUMN node_id TYPE TEXT USING node_id::text;

ALTER TABLE public.kpi_career_map_approval_logs 
  ALTER COLUMN id TYPE TEXT USING id::text,
  ALTER COLUMN career_map_version_id TYPE TEXT USING career_map_version_id::text;

-- Re-add FK constraints
ALTER TABLE public.kpi_career_map_versions
  ADD CONSTRAINT kpi_career_map_versions_based_on_version_id_fkey
  FOREIGN KEY (based_on_version_id) REFERENCES public.kpi_career_map_versions(id) ON DELETE SET NULL;

ALTER TABLE public.kpi_career_map_nodes
  ADD CONSTRAINT kpi_career_map_nodes_career_map_version_id_fkey
  FOREIGN KEY (career_map_version_id) REFERENCES public.kpi_career_map_versions(id) ON DELETE CASCADE;

ALTER TABLE public.kpi_career_map_edges
  ADD CONSTRAINT kpi_career_map_edges_career_map_version_id_fkey
  FOREIGN KEY (career_map_version_id) REFERENCES public.kpi_career_map_versions(id) ON DELETE CASCADE,
  ADD CONSTRAINT kpi_career_map_edges_source_node_id_fkey
  FOREIGN KEY (source_node_id) REFERENCES public.kpi_career_map_nodes(id) ON DELETE CASCADE,
  ADD CONSTRAINT kpi_career_map_edges_target_node_id_fkey
  FOREIGN KEY (target_node_id) REFERENCES public.kpi_career_map_nodes(id) ON DELETE CASCADE;

ALTER TABLE public.kpi_position_criteria_items
  ADD CONSTRAINT kpi_position_criteria_items_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.kpi_position_criteria_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.kpi_career_employee_placements
  ADD CONSTRAINT kpi_career_employee_placements_career_map_version_id_fkey
  FOREIGN KEY (career_map_version_id) REFERENCES public.kpi_career_map_versions(id) ON DELETE CASCADE,
  ADD CONSTRAINT kpi_career_employee_placements_node_id_fkey
  FOREIGN KEY (node_id) REFERENCES public.kpi_career_map_nodes(id) ON DELETE SET NULL;

ALTER TABLE public.kpi_career_map_approval_logs
  ADD CONSTRAINT kpi_career_map_approval_logs_career_map_version_id_fkey
  FOREIGN KEY (career_map_version_id) REFERENCES public.kpi_career_map_versions(id) ON DELETE CASCADE;

-- 3. Edge Level Check Trigger Function
CREATE OR REPLACE FUNCTION public.check_career_map_edge_level()
RETURNS TRIGGER AS $$
DECLARE
  v_source_level INTEGER;
  v_target_level INTEGER;
  v_source_map_id TEXT;
  v_target_map_id TEXT;
BEGIN
  SELECT position_level_snapshot, career_map_version_id INTO v_source_level, v_source_map_id
  FROM public.kpi_career_map_nodes
  WHERE id = NEW.source_node_id;

  SELECT position_level_snapshot, career_map_version_id INTO v_target_level, v_target_map_id
  FROM public.kpi_career_map_nodes
  WHERE id = NEW.target_node_id;

  IF v_source_level IS NULL OR v_target_level IS NULL THEN
    RAISE EXCEPTION 'Source or target node does not exist in career map.';
  END IF;

  IF v_source_map_id <> NEW.career_map_version_id OR v_target_map_id <> NEW.career_map_version_id THEN
    RAISE EXCEPTION 'Cross-map edges are prohibited: source and target nodes must belong to career map version %.', NEW.career_map_version_id;
  END IF;

  IF v_target_level <> v_source_level + 1 THEN
    RAISE EXCEPTION 'Invalid career map edge: target level (%) must be exactly source level (%) + 1.', v_target_level, v_source_level;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_career_map_edge_level ON public.kpi_career_map_edges;
CREATE TRIGGER trg_check_career_map_edge_level
  BEFORE INSERT OR UPDATE ON public.kpi_career_map_edges
  FOR EACH ROW
  EXECUTE FUNCTION public.check_career_map_edge_level();

-- 4. State Machine RPC 1: Submit Career Map (HR Admin only)
CREATE OR REPLACE FUNCTION public.submit_kpi_career_map_for_approval(p_map_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id UUID;
  v_status VARCHAR(32);
  v_node_count INTEGER;
  v_missing_profile INTEGER;
BEGIN
  v_actor_id := public.app_kpi_current_employee_id();
  IF NOT public.app_kpi_is_hr_admin() THEN
    RAISE EXCEPTION 'Chỉ HR Admin mới có quyền gửi duyệt sơ đồ lộ trình.';
  END IF;

  SELECT status INTO v_status
  FROM public.kpi_career_map_versions
  WHERE id = p_map_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sơ đồ lộ trình không tồn tại: %', p_map_id;
  END IF;

  IF v_status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'Chỉ sơ đồ ở trạng thái draft hoặc returned mới có thể gửi duyệt. Trạng thái hiện tại: %', v_status;
  END IF;

  SELECT COUNT(*) INTO v_node_count
  FROM public.kpi_career_map_nodes
  WHERE career_map_version_id = p_map_id AND active = TRUE;

  IF v_node_count = 0 THEN
    RAISE EXCEPTION 'Sơ đồ chưa có vị trí công việc nào (empty_map).';
  END IF;

  SELECT COUNT(*) INTO v_missing_profile
  FROM public.kpi_career_map_nodes n
  WHERE n.career_map_version_id = p_map_id 
    AND n.active = TRUE
    AND (n.criteria_profile_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.kpi_position_criteria_profiles p WHERE p.id = n.criteria_profile_id
    ));

  IF v_missing_profile > 0 THEN
    RAISE EXCEPTION 'Có % vị trí chưa được gắn bộ tiêu chí đánh giá.', v_missing_profile;
  END IF;

  UPDATE public.kpi_career_map_versions
  SET status = 'pending_approval',
      updated_at = now()
  WHERE id = p_map_id;

  INSERT INTO public.kpi_career_map_approval_logs (
    id, career_map_version_id, action, actor_id, notes, created_at
  ) VALUES (
    gen_random_uuid()::text, p_map_id, 'submit', v_actor_id, 'HR Admin gửi phê duyệt sơ đồ lộ trình', now()
  );

  RETURN jsonb_build_object('success', TRUE, 'status', 'pending_approval', 'map_id', p_map_id);
END;
$$;

-- 5. State Machine RPC 2: Return Career Map (CEO only)
CREATE OR REPLACE FUNCTION public.return_kpi_career_map(p_map_id TEXT, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id UUID;
  v_status VARCHAR(32);
BEGIN
  v_actor_id := public.app_kpi_current_employee_id();
  IF NOT public.app_kpi_is_ceo() THEN
    RAISE EXCEPTION 'Chỉ CEO mới có quyền trả lại sơ đồ lộ trình.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Bắt buộc phải nhập lý do khi trả lại sơ đồ lộ trình.';
  END IF;

  SELECT status INTO v_status
  FROM public.kpi_career_map_versions
  WHERE id = p_map_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sơ đồ lộ trình không tồn tại: %', p_map_id;
  END IF;

  IF v_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Chỉ sơ đồ đang chờ duyệt (pending_approval) mới có thể trả lại. Trạng thái hiện tại: %', v_status;
  END IF;

  UPDATE public.kpi_career_map_versions
  SET status = 'returned',
      returned_reason = p_reason,
      updated_at = now()
  WHERE id = p_map_id;

  INSERT INTO public.kpi_career_map_approval_logs (
    id, career_map_version_id, action, actor_id, notes, created_at
  ) VALUES (
    gen_random_uuid()::text, p_map_id, 'return', v_actor_id, p_reason, now()
  );

  RETURN jsonb_build_object('success', TRUE, 'status', 'returned', 'map_id', p_map_id);
END;
$$;

-- 6. State Machine RPC 3: THE ONLY Publish Career Map (CEO only)
CREATE OR REPLACE FUNCTION public.publish_kpi_career_map(
  p_map_id TEXT,
  p_effective_from DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id UUID;
  v_org_id UUID;
  v_status VARCHAR(32);
  v_node_count INTEGER;
  v_missing_profile INTEGER;
  v_invalid_weight INTEGER;
  v_invalid_edge INTEGER;
  v_placed_count INTEGER := 0;
  v_unresolved_count INTEGER := 0;
  v_excluded_count INTEGER := 0;
  v_kpi_sets_created INTEGER := 0;
  v_log_id TEXT;
  v_emp RECORD;
  v_node RECORD;
  v_node_id TEXT;
  v_set_id UUID;
  v_version_no INTEGER;
BEGIN
  -- 1. Validate caller identity
  v_actor_id := public.app_kpi_current_employee_id();
  IF NOT public.app_kpi_is_ceo() THEN
    RAISE EXCEPTION 'Chỉ CEO (Ban Giám Đốc) mới có quyền phê duyệt và công bố sơ đồ lộ trình.';
  END IF;

  -- 2. Resolve actor organization (never fabricate with random UUID)
  SELECT to_chuc_id INTO v_org_id FROM public.nhan_vien WHERE id = v_actor_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy tổ chức (organization) hợp lệ cho actor %. Toàn bộ giao dịch bị hủy.', v_actor_id;
  END IF;

  -- 3. Validate effective date
  IF p_effective_from IS NULL THEN
    RAISE EXCEPTION 'Ngày hiệu lực (effective_from) không được để trống.';
  END IF;

  IF p_effective_from < CURRENT_DATE THEN
    RAISE EXCEPTION 'Ngày hiệu lực (%) không được nằm trong quá khứ.', p_effective_from;
  END IF;

  -- 4. Lock and validate map status
  SELECT status INTO v_status
  FROM public.kpi_career_map_versions
  WHERE id = p_map_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sơ đồ lộ trình không tồn tại: %', p_map_id;
  END IF;

  IF v_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Chỉ sơ đồ đang ở trạng thái chờ duyệt (pending_approval) mới có thể công bố. Trạng thái hiện tại: %', v_status;
  END IF;

  -- 5. Validate graph nodes
  SELECT COUNT(*) INTO v_node_count
  FROM public.kpi_career_map_nodes
  WHERE career_map_version_id = p_map_id AND active = TRUE;

  IF v_node_count = 0 THEN
    RAISE EXCEPTION 'Sơ đồ rỗng (empty_map). Không thể công bố sơ đồ không có vị trí hoạt động.';
  END IF;

  -- 6. Validate criteria profiles exist for every node
  SELECT COUNT(*) INTO v_missing_profile
  FROM public.kpi_career_map_nodes n
  WHERE n.career_map_version_id = p_map_id 
    AND n.active = TRUE
    AND (n.criteria_profile_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.kpi_position_criteria_profiles p WHERE p.id = n.criteria_profile_id
    ));

  IF v_missing_profile > 0 THEN
    RAISE EXCEPTION 'Có % vị trí chưa được cấu hình bộ tiêu chí đánh giá hợp lệ.', v_missing_profile;
  END IF;

  -- 7. Validate criteria weights equal 100%
  SELECT COUNT(*) INTO v_invalid_weight
  FROM (
    SELECT p.id, COALESCE(SUM(ci.weight), 0) as total_weight
    FROM public.kpi_position_criteria_profiles p
    JOIN public.kpi_career_map_nodes n ON n.criteria_profile_id = p.id
    LEFT JOIN public.kpi_position_criteria_items ci ON ci.profile_id = p.id AND ci.active = TRUE
    WHERE n.career_map_version_id = p_map_id AND n.active = TRUE
    GROUP BY p.id
  ) profile_weights
  WHERE total_weight <> 100;

  IF v_invalid_weight > 0 THEN
    RAISE EXCEPTION 'Có % bộ tiêu chí không đạt tổng trọng số 100%%.', v_invalid_weight;
  END IF;

  -- 8. Validate graph edges: target level must equal source level + 1, no self loop, same map
  SELECT COUNT(*) INTO v_invalid_edge
  FROM public.kpi_career_map_edges e
  JOIN public.kpi_career_map_nodes sn ON sn.id = e.source_node_id
  JOIN public.kpi_career_map_nodes tn ON tn.id = e.target_node_id
  WHERE e.career_map_version_id = p_map_id
    AND e.active = TRUE
    AND (
      e.source_node_id = e.target_node_id
      OR sn.career_map_version_id <> p_map_id
      OR tn.career_map_version_id <> p_map_id
      OR tn.position_level_snapshot <> sn.position_level_snapshot + 1
    );

  IF v_invalid_edge > 0 THEN
    RAISE EXCEPTION 'Có % đường nối không hợp lệ trong sơ đồ lộ trình.', v_invalid_edge;
  END IF;

  -- 9. Supersede any previously published career maps
  UPDATE public.kpi_career_map_versions
  SET status = 'superseded',
      updated_at = now()
  WHERE status = 'published' AND id <> p_map_id;

  -- 10. Publish the target career map
  UPDATE public.kpi_career_map_versions
  SET status = 'published',
      effective_from = p_effective_from,
      approved_by = v_actor_id,
      returned_reason = NULL,
      updated_at = now()
  WHERE id = p_map_id;

  -- 11. Update effective_from on linked criteria profiles
  UPDATE public.kpi_position_criteria_profiles
  SET effective_from = p_effective_from,
      updated_at = now()
  WHERE id IN (
    SELECT DISTINCT criteria_profile_id 
    FROM public.kpi_career_map_nodes 
    WHERE career_map_version_id = p_map_id AND criteria_profile_id IS NOT NULL
  );

  -- 12. Generate real employee placements from active staff
  DELETE FROM public.kpi_career_employee_placements
  WHERE career_map_version_id = p_map_id;

  FOR v_emp IN 
    SELECT nv.id as emp_id, nv.cua_hang_id as store_id, nv.chuc_vu_id as pos_id
    FROM public.nhan_vien nv
    WHERE nv.to_chuc_id = v_org_id
      AND (nv.trang_thai = 'dang_lam_viec' OR nv.trang_thai IS NULL)
  LOOP
    -- If employee lacks store_id, NEVER insert NULL into NOT NULL foreign key!
    IF v_emp.store_id IS NULL THEN
      v_excluded_count := v_excluded_count + 1;
      CONTINUE;
    END IF;

    IF v_emp.pos_id IS NULL THEN
      v_excluded_count := v_excluded_count + 1;
      CONTINUE;
    END IF;

    SELECT n.id INTO v_node_id
    FROM public.kpi_career_map_nodes n
    WHERE n.career_map_version_id = p_map_id 
      AND n.active = TRUE 
      AND (n.position_id = v_emp.pos_id::text OR n.position_id = v_emp.pos_id::text);

    IF v_node_id IS NOT NULL THEN
      INSERT INTO public.kpi_career_employee_placements (
        id, career_map_version_id, employee_id, store_id, position_id, node_id, status, unresolved_reason, created_at
      ) VALUES (
        gen_random_uuid()::text, p_map_id, v_emp.emp_id, v_emp.store_id, v_emp.pos_id::text, v_node_id, 'placed', NULL, now()
      );
      v_placed_count := v_placed_count + 1;
    ELSE
      INSERT INTO public.kpi_career_employee_placements (
        id, career_map_version_id, employee_id, store_id, position_id, node_id, status, unresolved_reason, created_at
      ) VALUES (
        gen_random_uuid()::text, p_map_id, v_emp.emp_id, v_emp.store_id, v_emp.pos_id::text, NULL, 'unresolved', 'position_not_in_map', now()
      );
      v_unresolved_count := v_unresolved_count + 1;
    END IF;
  END LOOP;

  -- 13. Create or sync KPI set versions for deployed positions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kpi_set_versions') THEN
    FOR v_node IN
      SELECT n.id, n.position_id, n.position_name_snapshot, n.position_level_snapshot, n.criteria_profile_id
      FROM public.kpi_career_map_nodes n
      WHERE n.career_map_version_id = p_map_id AND n.active = TRUE
    LOOP
      -- Find or create real kpi_set in the organization
      SELECT s.id INTO v_set_id
      FROM public.kpi_sets s
      WHERE s.org_id = v_org_id AND s.code = v_node.position_id
      LIMIT 1;

      IF v_set_id IS NULL THEN
        v_set_id := gen_random_uuid();
        INSERT INTO public.kpi_sets (
          id, org_id, code, name, description, created_at, updated_at
        ) VALUES (
          v_set_id, v_org_id, v_node.position_id, v_node.position_name_snapshot,
          'KPI Set cho vị trí ' || v_node.position_name_snapshot, now(), now()
        );
        v_kpi_sets_created := v_kpi_sets_created + 1;
      END IF;

      -- Calculate next version_no for this specific set
      SELECT COALESCE(MAX(version_no), 0) + 1 INTO v_version_no
      FROM public.kpi_set_versions
      WHERE set_id = v_set_id;

      -- Insert new kpi_set_version
      INSERT INTO public.kpi_set_versions (
        id, set_id, org_id, version_no, name, status, level_codes, store_scope_all, store_ids,
        effective_from, score_scale, groups, grades, promotion_paths, created_by, published_by, published_at
      ) VALUES (
        gen_random_uuid(),
        v_set_id,
        v_org_id,
        v_version_no,
        v_node.position_name_snapshot,
        'published',
        ARRAY[v_node.position_level_snapshot::text],
        TRUE,
        '{}',
        p_effective_from,
        ARRAY[1, 2, 3, 4, 5]::smallint[],
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'name', COALESCE(p.job_family, 'Chuyên môn'),
              'weight', 100,
              'criteria', (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', ci.id,
                    'name', ci.name,
                    'weight', ci.weight,
                    'direction', ci.direction,
                    'unit', ci.unit
                  )
                )
                FROM public.kpi_position_criteria_items ci
                WHERE ci.profile_id = p.id AND ci.active = TRUE
              )
            )
          )
          FROM public.kpi_position_criteria_profiles p
          WHERE p.id = v_node.criteria_profile_id
        ), '[]'::jsonb),
        '[]'::jsonb,
        '[]'::jsonb,
        v_actor_id,
        v_actor_id,
        now()
      );
    END LOOP;
  END IF;

  -- 14. Record dedicated approval log
  v_log_id := gen_random_uuid()::text;
  INSERT INTO public.kpi_career_map_approval_logs (
    id, career_map_version_id, action, actor_id, notes, created_at
  ) VALUES (
    v_log_id, p_map_id, 'publish', v_actor_id, 'CEO phê duyệt và công bố sơ đồ lộ trình toàn chuỗi', now()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'published',
    'map_id', p_map_id,
    'effective_from', p_effective_from,
    'placed_count', v_placed_count,
    'unresolved_count', v_unresolved_count,
    'excluded_count', v_excluded_count,
    'kpi_sets_created', v_kpi_sets_created,
    'log_id', v_log_id
  );
END;
$$;

-- 7. Permissions & Grants
GRANT EXECUTE ON FUNCTION public.submit_kpi_career_map_for_approval(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_kpi_career_map(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_kpi_career_map(TEXT, DATE) TO authenticated;
