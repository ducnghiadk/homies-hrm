-- Homies HRM - KPI Monthly Peer Review Security & RLS Policies
-- Depends on 20260821_kpi_saas_rls.sql identity helpers.

ALTER TABLE public.kpi_monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_peer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_peer_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_peer_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_peer_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_evaluation_integrity_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_evaluation_notification_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.kpi_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.nhan_vien(id),
  action VARCHAR(64) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kpi_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Monthly review scoped read" ON public.kpi_monthly_reviews;
CREATE POLICY "Monthly review scoped read"
  ON public.kpi_monthly_reviews
  FOR SELECT
  USING (
    employee_id = public.app_kpi_current_employee_id()
    OR primary_reviewer_id = public.app_kpi_current_employee_id()
    OR EXISTS (
      SELECT 1
      FROM public.kpi_periods p
      WHERE p.id = kpi_monthly_reviews.period_id
        AND public.app_kpi_can_view_store(kpi_monthly_reviews.store_id, p.org_id)
    )
  );

DROP POLICY IF EXISTS "Reviewer selects own assignments" ON public.kpi_peer_assignments;
CREATE POLICY "Reviewer selects own assignments"
  ON public.kpi_peer_assignments
  FOR SELECT
  USING (reviewer_id = public.app_kpi_current_employee_id());

DROP POLICY IF EXISTS "Reviewer inserts own response" ON public.kpi_peer_responses;
CREATE POLICY "Reviewer inserts own response"
  ON public.kpi_peer_responses
  FOR INSERT
  WITH CHECK (reviewer_id = public.app_kpi_current_employee_id());

DROP POLICY IF EXISTS "Reviewer selects own response" ON public.kpi_peer_responses;
CREATE POLICY "Reviewer selects own response"
  ON public.kpi_peer_responses
  FOR SELECT
  USING (reviewer_id = public.app_kpi_current_employee_id());

DROP POLICY IF EXISTS "Reviewer manages own answers" ON public.kpi_peer_answers;
CREATE POLICY "Reviewer manages own answers"
  ON public.kpi_peer_answers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.kpi_peer_responses r
      WHERE r.id = kpi_peer_answers.response_id
        AND r.reviewer_id = public.app_kpi_current_employee_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.kpi_peer_responses r
      WHERE r.id = kpi_peer_answers.response_id
        AND r.reviewer_id = public.app_kpi_current_employee_id()
    )
  );

DROP POLICY IF EXISTS "Employee sees own published aggregate" ON public.kpi_peer_aggregates;
CREATE POLICY "Employee sees own published aggregate"
  ON public.kpi_peer_aggregates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.kpi_monthly_reviews r
      JOIN public.kpi_periods p ON p.id = r.period_id
      WHERE r.id = kpi_peer_aggregates.monthly_review_id
        AND (
          (
            r.employee_id = public.app_kpi_current_employee_id()
            AND r.status IN ('published', 'appeal_open', 'locked')
          )
          OR public.app_kpi_can_view_store(r.store_id, p.org_id)
        )
    )
  );

DROP POLICY IF EXISTS "HR reviews integrity flags" ON public.kpi_evaluation_integrity_flags;
CREATE POLICY "HR reviews integrity flags"
  ON public.kpi_evaluation_integrity_flags
  FOR SELECT
  USING (public.app_kpi_has_role(ARRAY['hr_admin', 'ceo']));

DROP POLICY IF EXISTS "Recipient sees own KPI notifications" ON public.kpi_evaluation_notification_events;
CREATE POLICY "Recipient sees own KPI notifications"
  ON public.kpi_evaluation_notification_events
  FOR SELECT
  USING (recipient_id = public.app_kpi_current_employee_id());

DROP POLICY IF EXISTS "HR reads KPI audit logs" ON public.kpi_audit_logs;
CREATE POLICY "HR reads KPI audit logs"
  ON public.kpi_audit_logs
  FOR SELECT
  USING (public.app_kpi_has_role(ARRAY['hr_admin', 'ceo']));

CREATE OR REPLACE FUNCTION public.get_my_peer_reviewer_tasks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID := public.app_kpi_current_employee_id();
  v_result JSONB;
BEGIN
  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ nhân viên của tài khoản hiện tại.';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'assignment_id', a.id,
      'monthly_review_id', a.monthly_review_id,
      'subject', jsonb_build_object(
        'id', n.id,
        'name', n.ho_ten,
        'position_name', COALESCE(cv.ten, 'Nhân viên')
      ),
      'month', p.month_key,
      'shared_shift_count', a.shared_shift_count,
      'deadline_at', a.deadline_at,
      'status', a.status
    )
    ORDER BY a.deadline_at NULLS LAST
  )
  INTO v_result
  FROM public.kpi_peer_assignments a
  JOIN public.kpi_monthly_reviews r ON r.id = a.monthly_review_id
  JOIN public.kpi_periods p ON p.id = r.period_id
  JOIN public.nhan_vien n ON n.id = r.employee_id
  LEFT JOIN public.chuc_vu cv ON cv.id = r.position_id
  WHERE a.reviewer_id = v_employee_id
    AND a.status IN ('assigned', 'submitted');

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_store_peer_manager_queue()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := public.app_kpi_current_role();
  v_result JSONB;
BEGIN
  IF v_role NOT IN ('shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo') THEN
    RAISE EXCEPTION 'Vai trò hiện tại không có quyền xem hàng đợi quản lý.';
  END IF;

  SELECT jsonb_agg(queue_item ORDER BY queue_item->'review'->>'updated_at' DESC)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'monthly_review_id', r.id,
      'review', to_jsonb(r),
      'subject', jsonb_build_object(
        'id', n.id,
        'name', n.ho_ten,
        'position_name', COALESCE(cv.ten, 'Nhân viên')
      ),
      'candidates', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'employee_id', ca.reviewer_id,
            'rank', ca.rank,
            'total_shifts', ca.total_shift_count,
            'shared_shifts', ca.shared_shift_count,
            'reason_label', 'Làm chung ' || ca.shared_shift_count || ' ca · Tổng ' || ca.total_shift_count || ' ca'
          ) ORDER BY ca.rank
        )
        FROM public.kpi_peer_assignments ca
        WHERE ca.monthly_review_id = r.id
          AND ca.status IN ('candidate', 'assigned', 'submitted')
      ), '[]'::jsonb),
      'selected_reviewer_ids', COALESCE((
        SELECT jsonb_agg(sa.reviewer_id ORDER BY sa.rank)
        FROM public.kpi_peer_assignments sa
        WHERE sa.monthly_review_id = r.id
          AND sa.status IN ('assigned', 'submitted')
      ), '[]'::jsonb),
      'progress', jsonb_build_object(
        'required_count', 2,
        'submitted_count', (
          SELECT count(*) FROM public.kpi_peer_assignments pa
          WHERE pa.monthly_review_id = r.id AND pa.status = 'submitted'
        ),
        'expired_count', (
          SELECT count(*) FROM public.kpi_peer_assignments pa
          WHERE pa.monthly_review_id = r.id AND pa.status = 'expired'
        ),
        'replacement_active', EXISTS (
          SELECT 1 FROM public.kpi_peer_assignments pa
          WHERE pa.monthly_review_id = r.id
            AND pa.status = 'assigned'
            AND pa.replacement_for_assignment_id IS NOT NULL
        ),
        'enough_anonymous_sample', (
          SELECT count(*) >= 2 FROM public.kpi_peer_assignments pa
          WHERE pa.monthly_review_id = r.id AND pa.status = 'submitted'
        )
      ),
      'integrity_flag_count', (
        SELECT count(*) FROM public.kpi_evaluation_integrity_flags f
        WHERE f.monthly_review_id = r.id AND f.status = 'open'
      )
    ) AS queue_item
    FROM public.kpi_monthly_reviews r
    JOIN public.kpi_periods p ON p.id = r.period_id
    JOIN public.nhan_vien n ON n.id = r.employee_id
    LEFT JOIN public.chuc_vu cv ON cv.id = r.position_id
    WHERE public.app_kpi_can_view_store(r.store_id, p.org_id)
  ) q;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_peer_response(
  p_assignment_id UUID,
  p_answers JSONB,
  p_strength_note TEXT,
  p_improvement_note TEXT,
  p_direct_observation_confirmed BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID := public.app_kpi_current_employee_id();
  v_assignment public.kpi_peer_assignments%ROWTYPE;
  v_response_id UUID;
BEGIN
  SELECT * INTO v_assignment
  FROM public.kpi_peer_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF v_assignment.id IS NULL
     OR v_assignment.reviewer_id IS DISTINCT FROM v_employee_id
     OR v_assignment.status <> 'assigned' THEN
    RAISE EXCEPTION 'Phiếu đánh giá không thuộc tài khoản hiện tại hoặc không còn mở.';
  END IF;

  IF v_assignment.deadline_at IS NOT NULL AND v_assignment.deadline_at < now() THEN
    RAISE EXCEPTION 'Phiếu đánh giá đã quá hạn.';
  END IF;

  IF p_direct_observation_confirmed IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Bạn phải xác nhận chỉ đánh giá điều đã trực tiếp quan sát.';
  END IF;

  IF jsonb_typeof(p_answers) <> 'array'
     OR jsonb_array_length(p_answers) <> 5
     OR (SELECT count(DISTINCT answer->>'question_code') FROM jsonb_array_elements(p_answers) answer) <> 5 THEN
    RAISE EXCEPTION 'Cần trả lời đầy đủ 5 câu hỏi chuẩn.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_answers) answer
    WHERE (answer->>'question_code') NOT IN (
      'peak_teamwork', 'proactive_support', 'shift_handover', 'hygiene_process', 'team_communication'
    )
      OR (answer->>'score')::INTEGER NOT BETWEEN 1 AND 5
      OR (
        (answer->>'score')::INTEGER IN (1, 2, 5)
        AND (
          NULLIF(trim(answer->>'observed_date'), '') IS NULL
          OR NULLIF(trim(answer->>'situation_code'), '') IS NULL
          OR char_length(trim(COALESCE(answer->>'evidence_note', ''))) < 20
        )
      )
  ) THEN
    RAISE EXCEPTION 'Điểm số hoặc bằng chứng quan sát chưa hợp lệ.';
  END IF;

  IF NULLIF(trim(p_strength_note), '') IS NULL OR NULLIF(trim(p_improvement_note), '') IS NULL THEN
    RAISE EXCEPTION 'Cần nhập điểm mạnh và điều cần cải thiện.';
  END IF;

  INSERT INTO public.kpi_peer_responses (
    assignment_id, monthly_review_id, reviewer_id, strength_note,
    improvement_note, direct_observation_confirmed
  ) VALUES (
    v_assignment.id, v_assignment.monthly_review_id, v_employee_id,
    trim(p_strength_note), trim(p_improvement_note), TRUE
  )
  RETURNING id INTO v_response_id;

  INSERT INTO public.kpi_peer_answers (
    response_id, question_code, score, observed_date, situation_code, evidence_note
  )
  SELECT
    v_response_id,
    answer->>'question_code',
    (answer->>'score')::INTEGER,
    NULLIF(answer->>'observed_date', '')::DATE,
    NULLIF(trim(answer->>'situation_code'), ''),
    NULLIF(trim(answer->>'evidence_note'), '')
  FROM jsonb_array_elements(p_answers) answer;

  UPDATE public.kpi_peer_assignments
  SET status = 'submitted', updated_at = now()
  WHERE id = v_assignment.id;

  IF EXISTS (
    SELECT 1
    FROM public.kpi_peer_responses other_response
    WHERE other_response.monthly_review_id = v_assignment.monthly_review_id
      AND other_response.id <> v_response_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.kpi_peer_answers current_answer
        FULL JOIN public.kpi_peer_answers other_answer
          ON other_answer.response_id = other_response.id
         AND other_answer.question_code = current_answer.question_code
        WHERE current_answer.response_id = v_response_id
          AND (other_answer.id IS NULL OR current_answer.score IS DISTINCT FROM other_answer.score)
      )
  ) AND NOT EXISTS (
    SELECT 1 FROM public.kpi_evaluation_integrity_flags existing_flag
    WHERE existing_flag.monthly_review_id = v_assignment.monthly_review_id
      AND existing_flag.code = 'IDENTICAL_RESPONSES'
      AND existing_flag.status = 'open'
  ) THEN
    INSERT INTO public.kpi_evaluation_integrity_flags (
      monthly_review_id, code, severity, evidence_refs, status
    ) VALUES (
      v_assignment.monthly_review_id,
      'IDENTICAL_RESPONSES',
      'warning',
      ARRAY['assignment:' || v_assignment.id::text],
      'open'
    );
  END IF;

  IF (
    SELECT count(*)
    FROM public.kpi_peer_assignments
    WHERE monthly_review_id = v_assignment.monthly_review_id
      AND status = 'submitted'
  ) >= 2 THEN
    INSERT INTO public.kpi_peer_aggregates (
      monthly_review_id,
      valid_response_count,
      enough_anonymous_sample,
      question_scores,
      total_score,
      strength_summary,
      improvement_summary,
      calculated_at,
      updated_at
    )
    SELECT
      v_assignment.monthly_review_id,
      count(DISTINCT pr.id),
      TRUE,
      (
        SELECT jsonb_agg(
          jsonb_build_object('question_code', scores.question_code, 'score', scores.avg_score)
          ORDER BY scores.question_code
        )
        FROM (
          SELECT pa2.question_code, round(avg(pa2.score)::numeric, 2) AS avg_score
          FROM public.kpi_peer_answers pa2
          JOIN public.kpi_peer_responses response ON response.id = pa2.response_id
          WHERE response.monthly_review_id = v_assignment.monthly_review_id
          GROUP BY pa2.question_code
        ) scores
      ),
      round(avg(pa.score)::numeric, 2),
      string_agg(DISTINCT pr.strength_note, ' · '),
      string_agg(DISTINCT pr.improvement_note, ' · '),
      now(),
      now()
    FROM public.kpi_peer_responses pr
    JOIN public.kpi_peer_answers pa ON pa.response_id = pr.id
    WHERE pr.monthly_review_id = v_assignment.monthly_review_id
    GROUP BY pr.monthly_review_id
    ON CONFLICT (monthly_review_id) DO UPDATE SET
      valid_response_count = EXCLUDED.valid_response_count,
      enough_anonymous_sample = EXCLUDED.enough_anonymous_sample,
      question_scores = EXCLUDED.question_scores,
      total_score = EXCLUDED.total_score,
      strength_summary = EXCLUDED.strength_summary,
      improvement_summary = EXCLUDED.improvement_summary,
      calculated_at = EXCLUDED.calculated_at,
      updated_at = EXCLUDED.updated_at;

    UPDATE public.kpi_monthly_reviews
    SET status = CASE
      WHEN status = 'collecting' THEN 'primary_review_pending'
      ELSE status
    END,
    updated_at = now()
    WHERE id = v_assignment.monthly_review_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.manager_select_peer_reviewers(
  p_monthly_review_id UUID,
  p_reviewer_ids UUID[],
  p_selection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := public.app_kpi_current_employee_id();
  v_review public.kpi_monthly_reviews%ROWTYPE;
BEGIN
  IF public.app_kpi_current_role() <> 'store_manager' THEN
    RAISE EXCEPTION 'Chỉ Quản lý cửa hàng mới được chọn người đánh giá.';
  END IF;

  SELECT * INTO v_review
  FROM public.kpi_monthly_reviews
  WHERE id = p_monthly_review_id
  FOR UPDATE;

  IF v_review.id IS NULL OR v_review.store_id IS DISTINCT FROM public.app_kpi_current_store_id() THEN
    RAISE EXCEPTION 'Không có quyền chọn người đánh giá cho cửa hàng khác.';
  END IF;

  IF cardinality(p_reviewer_ids) <> 2
     OR (SELECT count(DISTINCT reviewer_id) FROM unnest(p_reviewer_ids) reviewer_id) <> 2 THEN
    RAISE EXCEPTION 'Cần chọn đúng 2 đồng nghiệp khác nhau.';
  END IF;

  IF (
    SELECT count(*)
    FROM public.kpi_peer_assignments a
    WHERE a.monthly_review_id = p_monthly_review_id
      AND a.reviewer_id = ANY(p_reviewer_ids)
      AND a.status IN ('candidate', 'assigned')
  ) <> 2 THEN
    RAISE EXCEPTION 'Danh sách có người không thuộc nhóm ứng viên hợp lệ.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.kpi_monthly_reviews reciprocal_review
    JOIN public.kpi_peer_assignments reciprocal_assignment
      ON reciprocal_assignment.monthly_review_id = reciprocal_review.id
    WHERE reciprocal_review.period_id = v_review.period_id
      AND reciprocal_review.employee_id = ANY(p_reviewer_ids)
      AND reciprocal_assignment.reviewer_id = v_review.employee_id
      AND reciprocal_assignment.status IN ('assigned', 'submitted')
  ) THEN
    RAISE EXCEPTION 'RECIPROCAL_PAIR: Không thể phân công hai nhân viên chấm chéo nhau trong cùng kỳ.';
  END IF;

  UPDATE public.kpi_peer_assignments
  SET status = 'candidate', updated_at = now()
  WHERE monthly_review_id = p_monthly_review_id
    AND status = 'assigned'
    AND reviewer_id <> ALL(p_reviewer_ids);

  UPDATE public.kpi_peer_assignments
  SET status = 'assigned',
      selected_by = 'manager',
      selected_by_actor_id = v_actor_id,
      selection_reason = NULLIF(trim(p_selection_reason), ''),
      assigned_at = now(),
      deadline_at = now() + interval '48 hours',
      updated_at = now()
  WHERE monthly_review_id = p_monthly_review_id
    AND reviewer_id = ANY(p_reviewer_ids);

  UPDATE public.kpi_monthly_reviews
  SET status = 'collecting',
      peer_deadline_at = now() + interval '48 hours',
      updated_at = now()
  WHERE id = p_monthly_review_id;

  INSERT INTO public.kpi_audit_logs (actor_id, action, target_id, reason)
  VALUES (
    v_actor_id,
    'SELECT_PEER_REVIEWERS',
    p_monthly_review_id::text,
    COALESCE(NULLIF(trim(p_selection_reason), ''), 'Chọn theo danh sách hệ thống đề xuất')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_employee_peer_aggregate(
  p_monthly_review_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review public.kpi_monthly_reviews%ROWTYPE;
  v_period public.kpi_periods%ROWTYPE;
  v_aggregate public.kpi_peer_aggregates%ROWTYPE;
BEGIN
  SELECT * INTO v_review
  FROM public.kpi_monthly_reviews
  WHERE id = p_monthly_review_id;

  IF v_review.id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ đánh giá tháng.';
  END IF;

  SELECT * INTO v_period FROM public.kpi_periods WHERE id = v_review.period_id;

  IF NOT (
    (
      v_review.employee_id = public.app_kpi_current_employee_id()
      AND v_review.status IN ('published', 'appeal_open', 'locked')
    )
    OR public.app_kpi_can_view_store(v_review.store_id, v_period.org_id)
  ) THEN
    RAISE EXCEPTION 'Không có quyền xem kết quả tổng hợp này.';
  END IF;

  SELECT * INTO v_aggregate
  FROM public.kpi_peer_aggregates
  WHERE monthly_review_id = p_monthly_review_id;

  IF v_aggregate.id IS NULL OR NOT v_aggregate.enough_anonymous_sample THEN
    RETURN jsonb_build_object(
      'enough_anonymous_sample', FALSE,
      'unavailable_reason', 'insufficient_anonymous_sample'
    );
  END IF;

  RETURN jsonb_build_object(
    'total_score', v_aggregate.total_score,
    'strength_summary', v_aggregate.strength_summary,
    'improvement_summary', v_aggregate.improvement_summary,
    'enough_anonymous_sample', TRUE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_monthly_review(
  p_monthly_review_id UUID,
  p_approved_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := public.app_kpi_current_employee_id();
  v_review public.kpi_monthly_reviews%ROWTYPE;
  v_at TIMESTAMPTZ := COALESCE(p_approved_at, now());
BEGIN
  IF public.app_kpi_current_role() <> 'store_manager' THEN
    RAISE EXCEPTION 'Chỉ Quản lý cửa hàng mới được duyệt đánh giá tháng.';
  END IF;

  SELECT * INTO v_review
  FROM public.kpi_monthly_reviews
  WHERE id = p_monthly_review_id
  FOR UPDATE;

  IF v_review.id IS NULL OR v_review.store_id IS DISTINCT FROM public.app_kpi_current_store_id() THEN
    RAISE EXCEPTION 'Không có quyền duyệt hồ sơ của cửa hàng khác.';
  END IF;

  IF v_review.subject_role <> 'employee' OR v_review.status <> 'manager_approval_pending' THEN
    RAISE EXCEPTION 'Hồ sơ chưa ở trạng thái chờ Quản lý cửa hàng duyệt.';
  END IF;

  IF cardinality(v_review.blocker_codes) > 0 THEN
    RAISE EXCEPTION 'Hồ sơ còn lỗi chặn, chưa thể công bố.';
  END IF;

  UPDATE public.kpi_monthly_reviews
  SET status = 'published',
      published_at = v_at,
      appeal_deadline_at = v_at + interval '48 hours',
      updated_at = v_at
  WHERE id = p_monthly_review_id
  RETURNING * INTO v_review;

  UPDATE public.kpi_evaluations
  SET status = 'published', published_at = v_at, updated_at = v_at
  WHERE id = v_review.evaluation_id;

  INSERT INTO public.kpi_audit_logs (actor_id, action, target_id, reason)
  VALUES (v_actor_id, 'APPROVE_MONTHLY_REVIEW', p_monthly_review_id::text, 'Hồ sơ sạch được duyệt công bố');

  RETURN to_jsonb(v_review);
END;
$$;

CREATE OR REPLACE FUNCTION public.return_monthly_review(
  p_monthly_review_id UUID,
  p_reason TEXT,
  p_returned_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := public.app_kpi_current_employee_id();
  v_review public.kpi_monthly_reviews%ROWTYPE;
  v_at TIMESTAMPTZ := COALESCE(p_returned_at, now());
BEGIN
  IF public.app_kpi_current_role() <> 'store_manager' THEN
    RAISE EXCEPTION 'Chỉ Quản lý cửa hàng mới được trả lại đánh giá tháng.';
  END IF;

  IF NULLIF(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Vui lòng nhập lý do trả lại hồ sơ.';
  END IF;

  SELECT * INTO v_review
  FROM public.kpi_monthly_reviews
  WHERE id = p_monthly_review_id
  FOR UPDATE;

  IF v_review.id IS NULL OR v_review.store_id IS DISTINCT FROM public.app_kpi_current_store_id() THEN
    RAISE EXCEPTION 'Không có quyền trả lại hồ sơ của cửa hàng khác.';
  END IF;

  IF v_review.subject_role <> 'employee' OR v_review.status <> 'manager_approval_pending' THEN
    RAISE EXCEPTION 'Chỉ hồ sơ đang chờ duyệt mới có thể trả lại.';
  END IF;

  UPDATE public.kpi_monthly_reviews
  SET status = 'primary_review_pending',
      blocker_codes = ARRAY['RETURNED_CHANGES_PENDING'],
      published_at = NULL,
      appeal_deadline_at = NULL,
      updated_at = v_at
  WHERE id = p_monthly_review_id
  RETURNING * INTO v_review;

  UPDATE public.kpi_evaluations
  SET status = 'returned', updated_at = v_at
  WHERE id = v_review.evaluation_id;

  INSERT INTO public.kpi_audit_logs (actor_id, action, target_id, reason)
  VALUES (v_actor_id, 'RETURN_MONTHLY_REVIEW', p_monthly_review_id::text, trim(p_reason));

  RETURN to_jsonb(v_review);
END;
$$;

CREATE OR REPLACE FUNCTION public.reveal_peer_reviewer_identity(
  p_assignment_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := public.app_kpi_current_employee_id();
  v_reviewer_id UUID;
BEGIN
  IF NOT public.app_kpi_has_role(ARRAY['hr_admin', 'ceo']) THEN
    RAISE EXCEPTION 'Vai trò hiện tại không có quyền giải mật danh tính người đánh giá.';
  END IF;

  IF NULLIF(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Vui lòng nhập lý do giải mật danh tính.';
  END IF;

  SELECT reviewer_id INTO v_reviewer_id
  FROM public.kpi_peer_assignments
  WHERE id = p_assignment_id;

  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu phân công.';
  END IF;

  INSERT INTO public.kpi_audit_logs (actor_id, action, target_id, reason)
  VALUES (v_actor_id, 'REVEAL_PEER_REVIEWER_IDENTITY', p_assignment_id::text, trim(p_reason));

  RETURN jsonb_build_object('reviewer_id', v_reviewer_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_kpi_integrity_flags()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.app_kpi_has_role(ARRAY['hr_admin', 'ceo']) THEN
    RAISE EXCEPTION 'Vai trò hiện tại không có quyền xem cờ liêm chính.';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(flag) ORDER BY flag.created_at DESC)
    FROM public.kpi_evaluation_integrity_flags flag
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_kpi_integrity_flag(
  p_flag_id UUID,
  p_decision TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := public.app_kpi_current_employee_id();
  v_flag public.kpi_evaluation_integrity_flags%ROWTYPE;
BEGIN
  IF NOT public.app_kpi_has_role(ARRAY['hr_admin', 'ceo']) THEN
    RAISE EXCEPTION 'Vai trò hiện tại không có quyền xử lý cờ liêm chính.';
  END IF;
  IF p_decision NOT IN ('dismissed', 'confirmed') THEN
    RAISE EXCEPTION 'Kết luận cờ liêm chính không hợp lệ.';
  END IF;
  IF NULLIF(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Vui lòng nhập lý do xử lý cờ liêm chính.';
  END IF;

  UPDATE public.kpi_evaluation_integrity_flags
  SET status = p_decision,
      resolved_by = v_actor_id,
      resolution_reason = trim(p_reason),
      resolved_at = now()
  WHERE id = p_flag_id AND status = 'open'
  RETURNING * INTO v_flag;

  IF v_flag.id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy cờ đang mở.';
  END IF;

  INSERT INTO public.kpi_audit_logs (actor_id, action, target_id, reason)
  VALUES (v_actor_id, 'RESOLVE_KPI_INTEGRITY_FLAG', p_flag_id::text, trim(p_reason));
  RETURN to_jsonb(v_flag);
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_peer_reviewer_tasks() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_store_peer_manager_queue() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_peer_response(UUID, JSONB, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.manager_select_peer_reviewers(UUID, UUID[], TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_employee_peer_aggregate(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_monthly_review(UUID, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.return_monthly_review(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reveal_peer_reviewer_identity(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_kpi_integrity_flags() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_kpi_integrity_flag(UUID, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_peer_reviewer_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_peer_manager_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_peer_response(UUID, JSONB, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manager_select_peer_reviewers(UUID, UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_peer_aggregate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_monthly_review(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_monthly_review(UUID, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_peer_reviewer_identity(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kpi_integrity_flags() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_kpi_integrity_flag(UUID, TEXT, TEXT) TO authenticated;
