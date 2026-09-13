-- ============================================================
-- HOMIES MILK TEA - KPI SAAS PILOT SEED
-- Requires: schema_v3_master_fixed.sql, rls_v3_policies.sql,
-- and 20260821_kpi_saas_core.sql
-- Scope: published KPI set, one pilot period, PT1/PT2/Senior/
-- Shift Leader routes only. No L0-L5 seed.
-- ============================================================

WITH base AS (
    SELECT
        'a0000000-0000-0000-0000-000000000001'::uuid AS org_id,
        'c0000000-0000-0000-0000-000000000001'::uuid AS store_id,
        'e0000000-0000-0000-0000-000000000016'::uuid AS hr_admin_id,
        'e0000000-0000-0000-0000-000000000001'::uuid AS ceo_id
)
INSERT INTO kpi_sets (id, org_id, code, name, description)
SELECT
    '11111111-1111-1111-1111-111111111111'::uuid,
    base.org_id,
    'main_store_kpi',
    'KPI cua hang Homies',
    'Bo KPI pilot cho danh gia nhan su cua hang, gom score thang, appeal, incident va thang tien.'
FROM base
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

WITH base AS (
    SELECT
        'a0000000-0000-0000-0000-000000000001'::uuid AS org_id,
        'c0000000-0000-0000-0000-000000000001'::uuid AS store_id,
        'e0000000-0000-0000-0000-000000000016'::uuid AS hr_admin_id,
        'e0000000-0000-0000-0000-000000000001'::uuid AS ceo_id
)
INSERT INTO kpi_set_versions (
    id,
    set_id,
    org_id,
    version_no,
    name,
    status,
    level_codes,
    store_scope_all,
    store_ids,
    effective_from,
    effective_to,
    score_scale,
    groups,
    grades,
    promotion_paths,
    source_status,
    created_by,
    created_at,
    published_by,
    published_at
)
SELECT
    '11111111-1111-1111-1111-111111111112'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    base.org_id,
    1,
    'KPI cua hang thang 08/2026',
    'published',
    ARRAY['pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader'],
    FALSE,
    ARRAY[base.store_id],
    DATE '2026-08-01',
    DATE '2026-08-31',
    ARRAY[1, 2, 3, 4, 5],
    '[
      {
        "id": "grp_revenue",
        "name": "Doanh thu",
        "tag": "revenue",
        "weight": 25,
        "promotion_core": false,
        "sort_order": 1,
        "criteria": [
          {
            "id": "revenue_output",
            "group_id": "grp_revenue",
            "name": "Ket qua doanh thu theo ca",
            "description": "Do theo du lieu ban hang da chot cho vi tri va so gio tham gia trong ky.",
            "scoring_mode": "automatic",
            "weight": 25,
            "source_key": "pos.revenue_shift_index",
            "score_bands": [
              { "min": 95, "max": null, "score": 5 },
              { "min": 90, "max": 94.99, "score": 4 },
              { "min": 80, "max": 89.99, "score": 3 },
              { "min": 70, "max": 79.99, "score": 2 },
              { "min": 0, "max": 69.99, "score": 1 }
            ],
            "adjustment_reason_required": true,
            "applies_when": { "min_hours": 80 },
            "sort_order": 1,
            "active": true
          }
        ]
      },
      {
        "id": "grp_customer_service",
        "name": "Dich vu va trai nghiem khach hang",
        "tag": "customer_service",
        "weight": 25,
        "promotion_core": true,
        "sort_order": 2,
        "criteria": [
          {
            "id": "customer_feedback",
            "group_id": "grp_customer_service",
            "name": "Diem trai nghiem khach hang",
            "description": "Tong hop phan hoi khach, food app va diem phuc vu theo rubric da cong bo.",
            "scoring_mode": "combined",
            "weight": 25,
            "source_key": "service.customer_experience_index",
            "score_bands": [
              { "min": 4.7, "max": null, "score": 5 },
              { "min": 4.4, "max": 4.69, "score": 4 },
              { "min": 4.0, "max": 4.39, "score": 3 },
              { "min": 3.5, "max": 3.99, "score": 2 },
              { "min": 0, "max": 3.49, "score": 1 }
            ],
            "evidence_required_below": 3,
            "adjustment_reason_required": true,
            "sort_order": 1,
            "active": true
          }
        ]
      },
      {
        "id": "grp_operations",
        "name": "Van hanh va tuan thu",
        "tag": "operations",
        "weight": 25,
        "promotion_core": true,
        "sort_order": 3,
        "criteria": [
          {
            "id": "operations_accuracy",
            "group_id": "grp_operations",
            "name": "Do chinh xac van hanh",
            "description": "Do tu checklist ca, loi nhap POS va tuan thu SOP da xac nhan nguon.",
            "scoring_mode": "combined",
            "weight": 25,
            "source_key": "operations.compliance_index",
            "score_bands": [
              { "min": 97, "max": null, "score": 5 },
              { "min": 93, "max": 96.99, "score": 4 },
              { "min": 88, "max": 92.99, "score": 3 },
              { "min": 80, "max": 87.99, "score": 2 },
              { "min": 0, "max": 79.99, "score": 1 }
            ],
            "evidence_required_below": 3,
            "adjustment_reason_required": true,
            "sort_order": 1,
            "active": true
          }
        ]
      },
      {
        "id": "grp_discipline",
        "name": "Ky luat va thuc thi",
        "tag": "discipline",
        "weight": 25,
        "promotion_core": true,
        "sort_order": 4,
        "criteria": [
          {
            "id": "discipline_execution",
            "group_id": "grp_discipline",
            "name": "Ky luat ca lam va phan hoi vi pham",
            "description": "Tong hop cham cong, ho so su co da xac nhan va muc tuan thu quyet dinh van hanh.",
            "scoring_mode": "combined",
            "weight": 25,
            "source_key": "discipline.execution_index",
            "score_bands": [
              { "min": 97, "max": null, "score": 5 },
              { "min": 93, "max": 96.99, "score": 4 },
              { "min": 88, "max": 92.99, "score": 3 },
              { "min": 80, "max": 87.99, "score": 2 },
              { "min": 0, "max": 79.99, "score": 1 }
            ],
            "evidence_required_below": 4,
            "adjustment_reason_required": true,
            "sort_order": 1,
            "active": true
          }
        ]
      }
    ]'::jsonb,
    '[
      { "code": "excellent", "name": "Xuat sac", "min_score": 4.5, "max_score": 5.0 },
      { "code": "good", "name": "Tot", "min_score": 3.8, "max_score": 4.49 },
      { "code": "fair", "name": "Dat", "min_score": 3.0, "max_score": 3.79 },
      { "code": "warning", "name": "Can dao tao lai", "min_score": 2.0, "max_score": 2.99 },
      { "code": "critical", "name": "Can xu ly ngay", "min_score": 1.0, "max_score": 1.99 }
    ]'::jsonb,
    '[
      {
        "from": "pt1_pc",
        "to": "pt2",
        "minimum_months": 3,
        "required_average_score": 3.5,
        "minimum_monthly_score": 3.0,
        "core_group_average_score": 3.5,
        "disqualifying_incident_lookback_months": 6,
        "active_warning_lookback_months": 6,
        "test_score_threshold": 80,
        "challenge_duration_months": "1"
      },
      {
        "from": "pt2",
        "to": "senior",
        "minimum_months": 6,
        "required_average_score": 3.8,
        "minimum_monthly_score": 3.5,
        "core_group_average_score": 3.8,
        "required_high_months": 4,
        "required_high_month_score": 3.5,
        "disqualifying_incident_lookback_months": 12,
        "active_warning_lookback_months": 6,
        "test_score_threshold": 80,
        "challenge_duration_months": "2"
      },
      {
        "from": "senior",
        "to": "shift_leader",
        "minimum_months": 6,
        "required_average_score": 4.0,
        "minimum_monthly_score": 4.0,
        "core_group_average_score": 4.0,
        "required_high_months": 3,
        "required_high_month_score": 4.0,
        "disqualifying_incident_lookback_months": 12,
        "active_warning_lookback_months": 12,
        "test_score_threshold": 85,
        "challenge_duration_months": "2-3"
      }
    ]'::jsonb,
    'published',
    base.hr_admin_id,
    TIMESTAMPTZ '2026-08-01 08:00:00+07',
    base.ceo_id,
    TIMESTAMPTZ '2026-08-01 09:00:00+07'
FROM base
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    groups = EXCLUDED.groups,
    grades = EXCLUDED.grades,
    promotion_paths = EXCLUDED.promotion_paths,
    published_by = EXCLUDED.published_by,
    published_at = EXCLUDED.published_at;

INSERT INTO nhan_vien (
    id,
    to_chuc_id,
    cua_hang_id,
    chuc_vu_id,
    ma_nhan_vien,
    email,
    so_dien_thoai,
    ho_ten,
    ngay_bat_dau_lam,
    loai_hop_dong,
    trang_thai,
    vai_tro,
    tong_diem,
    hang_thanh_vien
) VALUES
(
    'e1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'KPI-PT1',
    'pilot-pt1@homies.local',
    '0901000001',
    'Pilot PT1 Pha che',
    DATE '2026-04-01',
    'toan_thoi_gian'::loai_hop_dong,
    'hoat_dong'::trang_thai_nhan_vien,
    'nhan_vien'::vai_tro_nhan_vien,
    0,
    'dong'
),
(
    'e1000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'KPI-PT2',
    'pilot-pt2@homies.local',
    '0901000002',
    'Pilot PT2',
    DATE '2025-12-01',
    'toan_thoi_gian'::loai_hop_dong,
    'hoat_dong'::trang_thai_nhan_vien,
    'nhan_vien'::vai_tro_nhan_vien,
    0,
    'dong'
),
(
    'e1000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'KPI-SENIOR',
    'pilot-senior@homies.local',
    '0901000003',
    'Pilot Senior',
    DATE '2025-09-01',
    'toan_thoi_gian'::loai_hop_dong,
    'hoat_dong'::trang_thai_nhan_vien,
    'nhan_vien'::vai_tro_nhan_vien,
    0,
    'dong'
),
(
    'e1000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'KPI-LEADER',
    'pilot-leader@homies.local',
    '0901000004',
    'Pilot Shift Leader',
    DATE '2025-06-01',
    'toan_thoi_gian'::loai_hop_dong,
    'hoat_dong'::trang_thai_nhan_vien,
    'truong_ca'::vai_tro_nhan_vien,
    0,
    'dong'
)
ON CONFLICT (id) DO UPDATE SET
    ho_ten = EXCLUDED.ho_ten,
    email = EXCLUDED.email,
    so_dien_thoai = EXCLUDED.so_dien_thoai,
    chuc_vu_id = EXCLUDED.chuc_vu_id,
    cua_hang_id = EXCLUDED.cua_hang_id,
    vai_tro = EXCLUDED.vai_tro;

WITH base AS (
    SELECT
        'a0000000-0000-0000-0000-000000000001'::uuid AS org_id,
        'c0000000-0000-0000-0000-000000000001'::uuid AS store_id,
        'e0000000-0000-0000-0000-000000000016'::uuid AS hr_admin_id,
        '11111111-1111-1111-1111-111111111112'::uuid AS set_version_id
)
INSERT INTO kpi_periods (
    id,
    org_id,
    store_id,
    set_version_id,
    month_key,
    status,
    snapshot,
    opened_by,
    opened_at,
    revision
)
SELECT
    '11111111-1111-1111-1111-111111111113'::uuid,
    base.org_id,
    base.store_id,
    base.set_version_id,
    '2026-08',
    'leader_scoring',
    jsonb_build_object(
        'id', '11111111-1111-1111-1111-111111111112',
        'set_id', '11111111-1111-1111-1111-111111111111',
        'version', 1,
        'name', 'KPI cua hang thang 08/2026',
        'level_codes', ARRAY['pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader'],
        'store_ids', jsonb_build_array(base.store_id::text),
        'effective_from', '2026-08-01',
        'effective_to', '2026-08-31',
        'score_scale', jsonb_build_array(1, 2, 3, 4, 5),
        'groups', (SELECT groups FROM kpi_set_versions WHERE id = base.set_version_id),
        'created_by', 'e0000000-0000-0000-0000-000000000016',
        'created_at', '2026-08-01T08:00:00+07',
        'published_by', 'e0000000-0000-0000-0000-000000000001',
        'published_at', '2026-08-01T09:00:00+07',
        'source_status', 'published'
    ),
    base.hr_admin_id,
    TIMESTAMPTZ '2026-08-02 08:00:00+07',
    0
FROM base
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    snapshot = EXCLUDED.snapshot,
    updated_at = NOW();

INSERT INTO kpi_period_employees (
    id,
    period_id,
    employee_id,
    store_id,
    level_code,
    position_id,
    employment_status
) VALUES
(
    '11111111-1111-1111-1111-111111111201',
    '11111111-1111-1111-1111-111111111113',
    'e1000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'pt1_pc',
    'b0000000-0000-0000-0000-000000000001',
    'official'
),
(
    '11111111-1111-1111-1111-111111111202',
    '11111111-1111-1111-1111-111111111113',
    'e1000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'pt2',
    'b0000000-0000-0000-0000-000000000001',
    'official'
),
(
    '11111111-1111-1111-1111-111111111203',
    '11111111-1111-1111-1111-111111111113',
    'e1000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'senior',
    'b0000000-0000-0000-0000-000000000001',
    'official'
),
(
    '11111111-1111-1111-1111-111111111204',
    '11111111-1111-1111-1111-111111111113',
    'e1000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'shift_leader',
    'b0000000-0000-0000-0000-000000000004',
    'official'
)
ON CONFLICT (id) DO UPDATE SET
    level_code = EXCLUDED.level_code,
    position_id = EXCLUDED.position_id,
    employment_status = EXCLUDED.employment_status;

INSERT INTO kpi_evaluations (
    id,
    period_id,
    period_employee_id,
    snapshot,
    total_score,
    grade_code,
    status,
    revision
) VALUES
(
    '11111111-1111-1111-1111-111111111301',
    '11111111-1111-1111-1111-111111111113',
    '11111111-1111-1111-1111-111111111201',
    (SELECT snapshot FROM kpi_periods WHERE id = '11111111-1111-1111-1111-111111111113'),
    3.70,
    'fair',
    'draft',
    0
),
(
    '11111111-1111-1111-1111-111111111302',
    '11111111-1111-1111-1111-111111111113',
    '11111111-1111-1111-1111-111111111202',
    (SELECT snapshot FROM kpi_periods WHERE id = '11111111-1111-1111-1111-111111111113'),
    4.10,
    'good',
    'draft',
    0
),
(
    '11111111-1111-1111-1111-111111111303',
    '11111111-1111-1111-1111-111111111113',
    '11111111-1111-1111-1111-111111111203',
    (SELECT snapshot FROM kpi_periods WHERE id = '11111111-1111-1111-1111-111111111113'),
    4.25,
    'good',
    'submitted',
    0
)
ON CONFLICT (id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    grade_code = EXCLUDED.grade_code,
    status = EXCLUDED.status;

INSERT INTO kpi_criterion_scores (
    id,
    evaluation_id,
    criterion_id,
    group_id,
    suggested_score,
    final_score,
    source_refs,
    adjustment_reason,
    evidence_refs
) VALUES
(
    '11111111-1111-1111-1111-111111111401',
    '11111111-1111-1111-1111-111111111302',
    'customer_feedback',
    'grp_customer_service',
    4.00,
    4.00,
    '["source_service_emp_pt2"]'::jsonb,
    NULL,
    '[]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111402',
    '11111111-1111-1111-1111-111111111302',
    'operations_accuracy',
    'grp_operations',
    4.00,
    4.00,
    '["source_ops_emp_pt2"]'::jsonb,
    NULL,
    '[]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111403',
    '11111111-1111-1111-1111-111111111303',
    'discipline_execution',
    'grp_discipline',
    4.00,
    5.00,
    '["source_discipline_emp_senior"]'::jsonb,
    'Leader bo sung bang chung sau khi doi chieu incident.',
    '["evidence_emp_senior"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    suggested_score = EXCLUDED.suggested_score,
    final_score = EXCLUDED.final_score,
    adjustment_reason = EXCLUDED.adjustment_reason,
    evidence_refs = EXCLUDED.evidence_refs;

INSERT INTO kpi_source_data (
    id,
    period_id,
    employee_id,
    criterion_id,
    source_key,
    source_type,
    status,
    value_numeric,
    value_json,
    source_refs,
    confirmed_by,
    confirmed_at
) VALUES
(
    '11111111-1111-1111-1111-111111111501',
    '11111111-1111-1111-1111-111111111113',
    'e1000000-0000-0000-0000-000000000002',
    'operations_accuracy',
    'operations.compliance_index',
    'combined',
    'confirmed',
    93.00,
    '{"valid_hours": 204}'::jsonb,
    '["pos_manual_input_checked"]'::jsonb,
    'e0000000-0000-0000-0000-000000000002',
    TIMESTAMPTZ '2026-08-20 10:00:00+07'
),
(
    '11111111-1111-1111-1111-111111111502',
    '11111111-1111-1111-1111-111111111113',
    'e1000000-0000-0000-0000-000000000003',
    'discipline_execution',
    'discipline.execution_index',
    'combined',
    'ready',
    96.00,
    '{"warning_window_clear": true}'::jsonb,
    '["incident_policy_v1"]'::jsonb,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    value_numeric = EXCLUDED.value_numeric,
    value_json = EXCLUDED.value_json;

INSERT INTO kpi_incidents (
    id,
    org_id,
    store_id,
    employee_id,
    period_id,
    occurred_at,
    source,
    status,
    description,
    evidence_refs,
    created_by
) VALUES
(
    '11111111-1111-1111-1111-111111111601',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111113',
    TIMESTAMPTZ '2026-07-18 08:00:00+07',
    'operation',
    'finalized',
    'Nhap sai POS trong ca cao diem, leader da xac nhan root cause va huong dan sua quy trinh.',
    '["incident_photo_01", "pos_log_2026_07_18"]'::jsonb,
    'e0000000-0000-0000-0000-000000000002'
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    description = EXCLUDED.description,
    evidence_refs = EXCLUDED.evidence_refs;

INSERT INTO kpi_incident_violations (
    id,
    incident_id,
    code,
    primary_violation,
    independent_behavior,
    reason,
    evidence_refs
) VALUES
(
    '11111111-1111-1111-1111-111111111701',
    '11111111-1111-1111-1111-111111111601',
    'pos_manual_error',
    TRUE,
    TRUE,
    'Loi nhap tay POS da duoc leader xac nhan la loi van hanh.',
    '["pos_log_2026_07_18"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    reason = EXCLUDED.reason,
    evidence_refs = EXCLUDED.evidence_refs;

INSERT INTO kpi_appeals (
    id,
    org_id,
    employee_id,
    type,
    reference_id,
    reason,
    evidence_refs,
    status,
    submitted_at,
    deadline_at
) VALUES
(
    '11111111-1111-1111-1111-111111111801',
    'a0000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000002',
    'monthly_kpi',
    '11111111-1111-1111-1111-111111111302',
    'Nhan vien de nghi xem lai diem service vi co bo sung evidence feedback tot.',
    '["customer_chat_capture"]'::jsonb,
    'submitted',
    TIMESTAMPTZ '2026-08-27 09:00:00+07',
    TIMESTAMPTZ '2026-08-29 09:00:00+07'
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    reason = EXCLUDED.reason,
    evidence_refs = EXCLUDED.evidence_refs;

INSERT INTO kpi_development_cases (
    id,
    org_id,
    employee_id,
    store_id,
    current_level,
    target_level,
    status,
    detected_from_period_id,
    eligibility_result,
    leader_note
) VALUES
(
    '11111111-1111-1111-1111-111111111901',
    'a0000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'pt1_pc',
    'pt2',
    'leader_proposed',
    '11111111-1111-1111-1111-111111111113',
    '{"status":"eligible_for_test"}'::jsonb,
    'Leader de xuat vao danh sach nguon sau 3 thang dat KPI va khong co incident nghiem trong.'
),
(
    '11111111-1111-1111-1111-111111111902',
    'a0000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'pt2',
    'senior',
    'testing',
    '11111111-1111-1111-1111-111111111113',
    '{"status":"eligible_for_test"}'::jsonb,
    'Leader de xuat test nang bac vi KPI 3 thang gan nhat on dinh.'
),
(
    '11111111-1111-1111-1111-111111111903',
    'a0000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'senior',
    'shift_leader',
    'challenge',
    '11111111-1111-1111-1111-111111111113',
    '{"status":"eligible_for_test"}'::jsonb,
    'Leader de xuat mo challenge Shift Leader sau khi qua bai test.'
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    eligibility_result = EXCLUDED.eligibility_result,
    leader_note = EXCLUDED.leader_note;

INSERT INTO kpi_test_sessions (
    id,
    development_case_id,
    employee_id,
    current_level,
    target_level,
    rubric,
    passing_total,
    section_floor,
    total_score,
    outcome,
    retest_attempts,
    retest_scheduled_for,
    finalized_by,
    finalized_at,
    created_by
) VALUES
(
    '11111111-1111-1111-1111-111111112001',
    '11111111-1111-1111-1111-111111111902',
    'e1000000-0000-0000-0000-000000000002',
    'pt2',
    'senior',
    '[
      {"section_id":"product_knowledge","score":84,"evidence_refs":["rubric_pt2_1"]},
      {"section_id":"operations_execution","score":86,"evidence_refs":["rubric_pt2_2"]},
      {"section_id":"service_attitude","score":88,"evidence_refs":["rubric_pt2_3"]}
    ]'::jsonb,
    80,
    70,
    86,
    'passed',
    0,
    NULL,
    'e0000000-0000-0000-0000-000000000002',
    TIMESTAMPTZ '2026-08-22 10:00:00+07',
    'e0000000-0000-0000-0000-000000000016'
)
ON CONFLICT (id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    outcome = EXCLUDED.outcome,
    rubric = EXCLUDED.rubric;

INSERT INTO kpi_challenges (
    id,
    development_case_id,
    employee_id,
    current_level,
    target_level,
    duration_label,
    required_checkpoints,
    check_ins,
    status,
    extension_count,
    final_decision_note,
    approved_by,
    approved_at
) VALUES
(
    '11111111-1111-1111-1111-111111112101',
    '11111111-1111-1111-1111-111111111903',
    'e1000000-0000-0000-0000-000000000003',
    'senior',
    'shift_leader',
    '2-3',
    '["week_2","week_4","final"]'::jsonb,
    '[
      {"checkpoint":"week_2","actor_id":"e0000000-0000-0000-0000-000000000002","note":"Da bat dau kem cap nhan su moi.","recorded_at":"2026-09-05T09:00:00+07"},
      {"checkpoint":"week_4","actor_id":"e0000000-0000-0000-0000-000000000001","note":"Can theo doi tiep kha nang dieu phoi ca.","recorded_at":"2026-09-19T09:00:00+07"}
    ]'::jsonb,
    'active',
    0,
    NULL,
    'e0000000-0000-0000-0000-000000000001',
    TIMESTAMPTZ '2026-08-23 09:00:00+07'
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    check_ins = EXCLUDED.check_ins,
    final_decision_note = EXCLUDED.final_decision_note;

INSERT INTO kpi_salary_bands (
    id,
    org_id,
    level_code,
    min_hourly_rate,
    max_hourly_rate,
    promotion_increase_min,
    promotion_increase_max,
    in_level_increase_min,
    in_level_increase_max,
    status,
    effective_from,
    effective_to,
    created_by,
    created_at,
    published_by,
    published_at
) VALUES
(
    '11111111-1111-1111-1111-111111112201',
    'a0000000-0000-0000-0000-000000000001',
    'pt1_pc',
    24000,
    28000,
    1000,
    2500,
    500,
    1500,
    'published',
    DATE '2026-08-01',
    NULL,
    'e0000000-0000-0000-0000-000000000016',
    TIMESTAMPTZ '2026-08-01 08:00:00+07',
    'e0000000-0000-0000-0000-000000000001',
    TIMESTAMPTZ '2026-08-01 09:00:00+07'
),
(
    '11111111-1111-1111-1111-111111112202',
    'a0000000-0000-0000-0000-000000000001',
    'pt2',
    27000,
    32000,
    1000,
    3000,
    500,
    1500,
    'published',
    DATE '2026-08-01',
    NULL,
    'e0000000-0000-0000-0000-000000000016',
    TIMESTAMPTZ '2026-08-01 08:00:00+07',
    'e0000000-0000-0000-0000-000000000001',
    TIMESTAMPTZ '2026-08-01 09:00:00+07'
),
(
    '11111111-1111-1111-1111-111111112203',
    'a0000000-0000-0000-0000-000000000001',
    'senior',
    31000,
    36000,
    1500,
    4500,
    500,
    2000,
    'published',
    DATE '2026-08-01',
    NULL,
    'e0000000-0000-0000-0000-000000000016',
    TIMESTAMPTZ '2026-08-01 08:00:00+07',
    'e0000000-0000-0000-0000-000000000001',
    TIMESTAMPTZ '2026-08-01 09:00:00+07'
),
(
    '11111111-1111-1111-1111-111111112204',
    'a0000000-0000-0000-0000-000000000001',
    'shift_leader',
    38000,
    46000,
    2000,
    5000,
    1000,
    2500,
    'published',
    DATE '2026-08-01',
    NULL,
    'e0000000-0000-0000-0000-000000000016',
    TIMESTAMPTZ '2026-08-01 08:00:00+07',
    'e0000000-0000-0000-0000-000000000001',
    TIMESTAMPTZ '2026-08-01 09:00:00+07'
)
ON CONFLICT (id) DO UPDATE SET
    min_hourly_rate = EXCLUDED.min_hourly_rate,
    max_hourly_rate = EXCLUDED.max_hourly_rate,
    promotion_increase_min = EXCLUDED.promotion_increase_min,
    promotion_increase_max = EXCLUDED.promotion_increase_max,
    in_level_increase_min = EXCLUDED.in_level_increase_min,
    in_level_increase_max = EXCLUDED.in_level_increase_max,
    status = EXCLUDED.status;

INSERT INTO kpi_salary_decisions (
    id,
    development_case_id,
    employee_id,
    salary_band_id,
    decided_rate,
    suggested_range_min,
    suggested_range_max,
    effective_from,
    reason,
    exception_payload,
    decided_by,
    decided_at
) VALUES
(
    '11111111-1111-1111-1111-111111112301',
    '11111111-1111-1111-1111-111111111903',
    'e1000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111112204',
    41000,
    38000,
    43000,
    DATE '2026-10-10',
    'CEO duyet bo nhiem sau khi challenge dat va trong band Shift Leader.',
    '{}'::jsonb,
    'e0000000-0000-0000-0000-000000000001',
    TIMESTAMPTZ '2026-10-07 10:00:00+07'
)
ON CONFLICT (id) DO UPDATE SET
    decided_rate = EXCLUDED.decided_rate,
    effective_from = EXCLUDED.effective_from,
    reason = EXCLUDED.reason;

INSERT INTO kpi_audit_logs (
    id,
    org_id,
    entity_type,
    entity_id,
    action,
    actor_id,
    old_value,
    new_value,
    reason,
    created_at
) VALUES
(
    '11111111-1111-1111-1111-111111112401',
    'a0000000-0000-0000-0000-000000000001',
    'kpi_set_version',
    '11111111-1111-1111-1111-111111111112',
    'publish',
    'e0000000-0000-0000-0000-000000000001',
    NULL,
    '{"status":"published"}'::jsonb,
    'Cong bo version KPI pilot thang 08/2026',
    TIMESTAMPTZ '2026-08-01 09:00:00+07'
),
(
    '11111111-1111-1111-1111-111111112402',
    'a0000000-0000-0000-0000-000000000001',
    'kpi_development_case',
    '11111111-1111-1111-1111-111111111903',
    'move_to_challenge',
    'e0000000-0000-0000-0000-000000000001',
    '{"status":"testing"}'::jsonb,
    '{"status":"challenge"}'::jsonb,
    'Qua bai test va mo challenge Shift Leader',
    TIMESTAMPTZ '2026-08-23 09:00:00+07'
)
ON CONFLICT (id) DO UPDATE SET
    action = EXCLUDED.action,
    new_value = EXCLUDED.new_value,
    reason = EXCLUDED.reason,
    created_at = EXCLUDED.created_at;
