-- Homies HRM - KPI Monthly Peer Review Demo Seed Data
-- Uses canonical KPI periods, evaluations and nhan_vien records.

WITH review_sources AS (
  SELECT
    p.id AS period_id,
    e.id AS evaluation_id,
    pe.employee_id,
    pe.store_id,
    pe.position_id,
    pe.level_code,
    row_number() OVER (
      PARTITION BY p.id
      ORDER BY pe.level_code, pe.employee_id
    ) AS row_no
  FROM public.kpi_periods p
  JOIN public.kpi_period_employees pe ON pe.period_id = p.id
  JOIN public.kpi_evaluations e ON e.period_employee_id = pe.id
  WHERE p.month_key = '2026-08'
),
resolved_reviewers AS (
  SELECT
    source.*,
    CASE WHEN source.level_code = 'shift_leader' THEN 'shift_leader' ELSE 'employee' END AS subject_role,
    reviewer.id AS primary_reviewer_id,
    CASE WHEN source.level_code = 'shift_leader' THEN 'store_manager' ELSE 'shift_leader' END AS primary_reviewer_role
  FROM review_sources source
  JOIN LATERAL (
    SELECT n.id
    FROM public.nhan_vien n
    WHERE n.cua_hang_id = source.store_id
      AND n.id <> source.employee_id
      AND (
        (source.level_code = 'shift_leader' AND n.vai_tro::text = 'quan_ly_cua_hang')
        OR
        (source.level_code <> 'shift_leader' AND n.vai_tro::text = 'truong_ca')
      )
    ORDER BY n.id
    LIMIT 1
  ) reviewer ON TRUE
)
INSERT INTO public.kpi_monthly_reviews (
  period_id,
  evaluation_id,
  employee_id,
  store_id,
  position_id,
  subject_role,
  primary_reviewer_id,
  primary_reviewer_role,
  status,
  assignment_deadline_at,
  peer_deadline_at,
  missing_peer_sample,
  blocker_codes
)
SELECT
  period_id,
  evaluation_id,
  employee_id,
  store_id,
  position_id,
  subject_role,
  primary_reviewer_id,
  primary_reviewer_role,
  CASE
    WHEN subject_role = 'shift_leader' THEN 'primary_review_pending'
    WHEN row_no = 1 THEN 'assignment_pending'
    WHEN row_no = 2 THEN 'collecting'
    WHEN row_no = 3 THEN 'primary_review_pending'
    ELSE 'manager_approval_pending'
  END,
  CASE WHEN subject_role = 'employee' AND row_no = 1 THEN now() + interval '24 hours' END,
  CASE WHEN subject_role = 'employee' AND row_no = 2 THEN now() + interval '48 hours' END,
  subject_role = 'employee' AND row_no = 4,
  '{}'
FROM resolved_reviewers
ON CONFLICT (period_id, employee_id) DO NOTHING;

WITH candidate_pool AS (
  SELECT
    r.id AS monthly_review_id,
    candidate.id AS reviewer_id,
    row_number() OVER (
      PARTITION BY r.id
      ORDER BY candidate.id
    ) AS candidate_rank
  FROM public.kpi_monthly_reviews r
  JOIN public.nhan_vien candidate
    ON candidate.cua_hang_id = r.store_id
   AND candidate.id NOT IN (r.employee_id, r.primary_reviewer_id)
   AND candidate.vai_tro::text = 'nhan_vien'
   AND candidate.trang_thai::text = 'hoat_dong'
  WHERE r.subject_role = 'employee'
)
INSERT INTO public.kpi_peer_assignments (
  monthly_review_id,
  reviewer_id,
  rank,
  shared_shift_count,
  total_shift_count,
  selected_by,
  status,
  assigned_at,
  deadline_at
)
SELECT
  pool.monthly_review_id,
  pool.reviewer_id,
  pool.candidate_rank,
  GREATEST(5, 12 - pool.candidate_rank),
  GREATEST(8, 20 - pool.candidate_rank),
  'system',
  CASE
    WHEN review.status = 'collecting' AND pool.candidate_rank <= 2 THEN 'assigned'
    ELSE 'candidate'
  END,
  CASE WHEN review.status = 'collecting' AND pool.candidate_rank <= 2 THEN now() END,
  CASE WHEN review.status = 'collecting' AND pool.candidate_rank <= 2 THEN now() + interval '48 hours' END
FROM candidate_pool pool
JOIN public.kpi_monthly_reviews review ON review.id = pool.monthly_review_id
WHERE pool.candidate_rank <= 5
ON CONFLICT (monthly_review_id, reviewer_id) DO NOTHING;
