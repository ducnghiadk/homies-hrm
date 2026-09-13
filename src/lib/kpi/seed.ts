import { createPeriodSnapshot, publishVersion } from './configuration-service.ts'
import { DEFAULT_KPI_POLICY } from './default-policy.ts'
import { getDefaultPromotionRule, getDefaultSourcePolicy } from './program-service.ts'
import { createEmptyKpiDatabase, type KpiDatabase } from './repository.ts'
import type { KpiActor, KpiDevelopmentCase, KpiEmployeeRef, KpiEvaluation, KpiPeriod, KpiSetVersion } from './types.ts'
import type {
  KpiCareerMapEdge,
  KpiCareerMapNode,
  KpiCareerMapVersion,
  KpiCareerPositionSnapshot,
  KpiPositionCriteriaProfile,
} from './career-map-types.ts'
import { DEFAULT_CAREER_TRANSITION_PRESETS } from './career-map-types.ts'
import { createDefaultProfileForGrade, createDefaultProfileForPosition } from './career-map-criteria-service.ts'

const HR_ADMIN: KpiActor = { id: 'hr_admin_01', role: 'hr_admin' }
const CEO: KpiActor = { id: 'ceo_01', role: 'ceo' }

const EMPLOYEES: KpiEmployeeRef[] = [
  { id: 'emp_pt1', store_id: 'store_001', level_code: 'pt1_pc', position_id: 'cashier', employment_status: 'official' },
  { id: 'emp_pt2', store_id: 'store_001', level_code: 'pt2', position_id: 'barista', employment_status: 'official' },
  { id: 'emp_senior', store_id: 'store_001', level_code: 'senior', position_id: 'senior_barista', employment_status: 'official' },
  { id: 'emp_leader', store_id: 'store_001', level_code: 'shift_leader', position_id: 'shift_leader', employment_status: 'official' },
]

export function buildKpiSeed(): KpiDatabase {
  const db = createEmptyKpiDatabase()
  const publishedVersion = buildPublishedVersion()
  const draftVersion = buildDraftVersion()
  const samplePeriod = buildSamplePeriod(publishedVersion)
  const evaluations = buildSampleEvaluations(samplePeriod)
  const developmentCases = buildDevelopmentCases()
  const careerMapSeed = buildHomiesCareerMapSeed()

  db.revision = 1
  db.sets = [publishedVersion, draftVersion]
  db.periods = [samplePeriod]
  db.evaluations = evaluations
  db.development_cases = developmentCases
  db.career_maps = [careerMapSeed.map]
  db.position_criteria_profiles = careerMapSeed.profiles
  db.audit_logs = [
    {
      id: 'audit_seed_publish',
      entity_type: 'kpi_set_version',
      entity_id: publishedVersion.id,
      action: 'publish',
      actor_id: CEO.id,
      new_value: { status: 'published' },
      created_at: publishedVersion.published_at!,
    },
    {
      id: 'audit_seed_draft',
      entity_type: 'kpi_set_version',
      entity_id: draftVersion.id,
      action: 'create_draft',
      actor_id: HR_ADMIN.id,
      new_value: { status: 'draft' },
      created_at: draftVersion.created_at,
    },
  ]

  return db
}

function buildPublishedVersion(): KpiSetVersion {
  const version: KpiSetVersion = {
    id: 'kpi_set_2026_08_v1',
    set_id: 'kpi_set_main',
    version: 1,
    name: 'KPI cua hang thang 08/2026',
    status: 'draft',
    level_codes: DEFAULT_KPI_POLICY.levels,
    store_ids: ['store_001'],
    effective_from: '2026-08-01',
    effective_to: '2026-08-31',
    score_scale: DEFAULT_KPI_POLICY.score_scale,
    groups: structuredClone(DEFAULT_KPI_POLICY.groups),
    created_by: HR_ADMIN.id,
    created_at: '2026-08-01T08:00:00.000Z',
  }

  return publishVersion(version, CEO.id, '2026-08-01T09:00:00.000Z')
}

function buildDraftVersion(): KpiSetVersion {
  return {
    id: 'kpi_set_2026_09_v2',
    set_id: 'kpi_set_main',
    version: 2,
    name: 'KPI cua hang thang 09/2026',
    status: 'draft',
    primary_purpose: 'promotion',
    secondary_purposes: ['monthly_bonus', 'training'],
    program_setup_step: 'review',
    source_policy: getDefaultSourcePolicy('promotion', 'employee'),
    promotion_rule: getDefaultPromotionRule('senior_barista', 'shift_leader', 'employee_to_leader'),
    position_ids: ['senior_barista'],
    level_codes: DEFAULT_KPI_POLICY.levels,
    store_ids: ['store_001'],
    effective_from: '2026-09-01',
    effective_to: '2026-09-30',
    score_scale: DEFAULT_KPI_POLICY.score_scale,
    groups: structuredClone(DEFAULT_KPI_POLICY.groups),
    created_by: HR_ADMIN.id,
    created_at: '2026-08-21T09:30:00.000Z',
  }
}

function buildSamplePeriod(version: KpiSetVersion): KpiPeriod {
  return {
    id: 'period_2026_08_store_001',
    org_id: 'homies',
    store_id: 'store_001',
    month: '2026-08',
    status: 'leader_scoring',
    snapshot: createPeriodSnapshot(version),
    employee_ids: EMPLOYEES.map((employee) => employee.id),
    opened_by: HR_ADMIN.id,
    opened_at: '2026-08-02T08:00:00.000Z',
    revision: 0,
  }
}

function buildSampleEvaluations(period: KpiPeriod): KpiEvaluation[] {
  return EMPLOYEES.map((employee, index) => ({
    id: `eval_${employee.id}_2026_08`,
    period_id: period.id,
    employee,
    snapshot: structuredClone(period.snapshot),
    scores: period.snapshot.groups.map((group, groupIndex) => ({
      criterion_id: group.criteria[0].id,
      suggested_score: groupIndex === 0 ? 4 : 3 + (index % 2),
      final_score: groupIndex === 3 && employee.level_code === 'shift_leader' ? 5 : undefined,
      source_refs: [`source_${group.tag}_${employee.id}`],
      evidence_refs: group.tag === 'discipline' ? [`evidence_${employee.id}`] : [],
      adjustment_reason: group.tag === 'discipline' && employee.level_code === 'shift_leader'
        ? 'Da bo sung bang chung sau khi leader doi chieu.'
        : undefined,
    })),
    total_score: index < 2 ? 4 : 3,
    grade_code: index < 2 ? 'good' : 'fair',
    status: index === 3 ? 'submitted' : 'draft',
    revision: 0,
  }))
}

function buildDevelopmentCases(): KpiDevelopmentCase[] {
  return [
    {
      id: 'dev_pt1_to_pt2',
      employee_id: 'emp_pt1',
      current_level: 'pt1_pc',
      target_level: 'pt2',
      status: 'leader_proposed',
    },
    {
      id: 'dev_pt2_to_senior',
      employee_id: 'emp_pt2',
      current_level: 'pt2',
      target_level: 'senior',
      status: 'testing',
    },
    {
      id: 'dev_senior_to_leader',
      employee_id: 'emp_senior',
      current_level: 'senior',
      target_level: 'shift_leader',
      status: 'challenge',
    },
  ]
}

export function buildPeerReviewDemoSeed(): import('./local-peer-review-repository.ts').LocalPeerReviewDatabase {
  return {
    monthly_reviews: [
      // 1. Frontline review chờ manager chọn
      {
        id: 'mr_01_emp_pt1',
        period_id: 'period_2026_08_store_001',
        evaluation_id: 'eval_emp_pt1_2026_08',
        employee_id: 'emp_pt1',
        store_id: 'store_001',
        position_id: 'cashier',
        subject_role: 'employee',
        primary_reviewer_id: 'emp_leader',
        primary_reviewer_role: 'shift_leader',
        status: 'assignment_pending',
        assignment_deadline_at: '2026-08-26T08:00:00.000Z',
        missing_peer_sample: false,
        blocker_codes: [],
        created_at: '2026-08-25T08:00:00.000Z',
        updated_at: '2026-08-25T08:00:00.000Z',
      },
      // 2. Review đang thu thập phiếu (có task assigned)
      {
        id: 'mr_02_emp_pt2',
        period_id: 'period_2026_08_store_001',
        evaluation_id: 'eval_emp_pt2_2026_08',
        employee_id: 'emp_pt2',
        store_id: 'store_001',
        position_id: 'barista',
        subject_role: 'employee',
        primary_reviewer_id: 'emp_leader',
        primary_reviewer_role: 'shift_leader',
        status: 'collecting',
        peer_deadline_at: '2026-08-27T08:00:00.000Z',
        missing_peer_sample: false,
        blocker_codes: [],
        created_at: '2026-08-25T08:00:00.000Z',
        updated_at: '2026-08-25T08:00:00.000Z',
      },
      // 3. Review đủ 2 phiếu chờ primary review
      {
        id: 'mr_03_emp_senior',
        period_id: 'period_2026_08_store_001',
        evaluation_id: 'eval_emp_senior_2026_08',
        employee_id: 'emp_senior',
        store_id: 'store_001',
        position_id: 'senior_barista',
        subject_role: 'employee',
        primary_reviewer_id: 'emp_leader',
        primary_reviewer_role: 'shift_leader',
        status: 'primary_review_pending',
        missing_peer_sample: false,
        blocker_codes: [],
        created_at: '2026-08-25T08:00:00.000Z',
        updated_at: '2026-08-26T10:00:00.000Z',
      },
      // 4. Review thiếu sample đã fallback 10%, người chấm chính đã gửi và chờ manager duyệt
      {
        id: 'mr_04_emp_fallback',
        period_id: 'period_2026_08_store_001',
        evaluation_id: 'eval_emp_fallback_2026_08',
        employee_id: 'emp_fallback',
        store_id: 'store_001',
        position_id: 'cashier',
        subject_role: 'employee',
        primary_reviewer_id: 'emp_leader',
        primary_reviewer_role: 'shift_leader',
        status: 'manager_approval_pending',
        missing_peer_sample: true,
        blocker_codes: [],
        created_at: '2026-08-25T08:00:00.000Z',
        updated_at: '2026-08-27T08:00:00.000Z',
      },
      // 5. Shift leader review chờ Store Manager
      {
        id: 'mr_05_emp_leader',
        period_id: 'period_2026_08_store_001',
        evaluation_id: 'eval_emp_leader_2026_08',
        employee_id: 'emp_leader',
        store_id: 'store_001',
        position_id: 'shift_leader',
        subject_role: 'shift_leader',
        primary_reviewer_id: 'emp_sm_01',
        primary_reviewer_role: 'store_manager',
        status: 'primary_review_pending',
        missing_peer_sample: false,
        blocker_codes: [],
        created_at: '2026-08-25T08:00:00.000Z',
        updated_at: '2026-08-25T08:00:00.000Z',
      },
    ],
    assignments: [
      {
        id: 'assign_mr02_emp_pt1',
        monthly_review_id: 'mr_02_emp_pt2',
        reviewer_id: 'emp_pt1',
        rank: 1,
        shared_shift_count: 12,
        total_shift_count: 20,
        selected_by: 'manager',
        status: 'assigned',
        assigned_at: '2026-08-25T08:00:00.000Z',
        deadline_at: '2026-08-27T08:00:00.000Z',
      },
      {
        id: 'assign_mr02_emp_senior',
        monthly_review_id: 'mr_02_emp_pt2',
        reviewer_id: 'emp_senior',
        rank: 2,
        shared_shift_count: 10,
        total_shift_count: 18,
        selected_by: 'manager',
        status: 'assigned',
        assigned_at: '2026-08-25T08:00:00.000Z',
        deadline_at: '2026-08-27T08:00:00.000Z',
      },
      {
        id: 'assign_mr03_emp_pt1',
        monthly_review_id: 'mr_03_emp_senior',
        reviewer_id: 'emp_pt1',
        rank: 1,
        shared_shift_count: 14,
        total_shift_count: 20,
        selected_by: 'manager',
        status: 'submitted',
        assigned_at: '2026-08-25T08:00:00.000Z',
        deadline_at: '2026-08-27T08:00:00.000Z',
      },
      {
        id: 'assign_mr03_emp_pt2',
        monthly_review_id: 'mr_03_emp_senior',
        reviewer_id: 'emp_pt2',
        rank: 2,
        shared_shift_count: 11,
        total_shift_count: 18,
        selected_by: 'manager',
        status: 'submitted',
        assigned_at: '2026-08-25T08:00:00.000Z',
        deadline_at: '2026-08-27T08:00:00.000Z',
      },
    ],
    responses: [
      {
        id: 'resp_mr03_emp_pt1',
        assignment_id: 'assign_mr03_emp_pt1',
        monthly_review_id: 'mr_03_emp_senior',
        reviewer_id: 'emp_pt1',
        answers: [
          { question_code: 'peak_teamwork', score: 5, observed_date: '2026-08-10', situation_code: 'peak', evidence_note: 'Hỗ trợ đồng đội rất nhanh trong giờ cao điểm trưa.' },
          { question_code: 'proactive_support', score: 4 },
          { question_code: 'shift_handover', score: 4 },
          { question_code: 'hygiene_process', score: 5, observed_date: '2026-08-12', situation_code: 'clean', evidence_note: 'Khu vực quầy bar luôn sạch sẽ và gọn gàng ngăn nắp.' },
          { question_code: 'team_communication', score: 4 },
        ],
        strength_note: 'Làm việc nhanh nhẹn, tinh thần đồng đội tốt.',
        improvement_note: 'Bàn giao tồn kho chi tiết hơn.',
        direct_observation_confirmed: true,
        submitted_at: '2026-08-26T10:00:00.000Z',
      },
      {
        id: 'resp_mr03_emp_pt2',
        assignment_id: 'assign_mr03_emp_pt2',
        monthly_review_id: 'mr_03_emp_senior',
        reviewer_id: 'emp_pt2',
        answers: [
          { question_code: 'peak_teamwork', score: 4 },
          { question_code: 'proactive_support', score: 4 },
          { question_code: 'shift_handover', score: 4 },
          { question_code: 'hygiene_process', score: 4 },
          { question_code: 'team_communication', score: 5, observed_date: '2026-08-14', situation_code: 'talk', evidence_note: 'Giao tiếp rất hòa nhã và luôn chủ động giúp đỡ người mới.' },
        ],
        strength_note: 'Hòa đồng, hỗ trợ nhiệt tình.',
        improvement_note: 'Cần chú ý kiểm đếm nguyên vật liệu lúc đổi ca.',
        direct_observation_confirmed: true,
        submitted_at: '2026-08-26T11:00:00.000Z',
      },
    ],
    aggregates: [
      {
        monthly_review_id: 'mr_03_emp_senior',
        valid_response_count: 2,
        enough_anonymous_sample: true,
        question_scores: [
          { question_code: 'peak_teamwork', score: 4.5 },
          { question_code: 'proactive_support', score: 4.0 },
          { question_code: 'shift_handover', score: 4.0 },
          { question_code: 'hygiene_process', score: 4.5 },
          { question_code: 'team_communication', score: 4.5 },
        ],
        total_score: 4.3,
        strength_summary: 'Làm việc nhanh nhẹn, tinh thần đồng đội tốt • Hòa đồng, hỗ trợ nhiệt tình',
        improvement_summary: 'Bàn giao tồn kho chi tiết hơn • Cần chú ý kiểm đếm nguyên vật liệu lúc đổi ca',
        configured_weight_percent: 10,
        applied_peer_weight_percent: 10,
        fallback_primary_weight_percent: 0,
      },
      {
        monthly_review_id: 'mr_04_emp_fallback',
        valid_response_count: 0,
        enough_anonymous_sample: false,
        question_scores: [],
        configured_weight_percent: 10,
        applied_peer_weight_percent: 0,
        fallback_primary_weight_percent: 10,
      },
    ],
    integrity_flags: [
      {
        id: 'flag_01_mr02',
        monthly_review_id: 'mr_02_emp_pt2',
        code: 'SOURCE_DIVERGENCE',
        severity: 'warning',
        evidence_refs: ['mr_02_emp_pt2'],
        status: 'open',
      },
    ],
    candidates_by_review: {
      mr_01_emp_pt1: [
        { employee_id: 'emp_pt2', rank: 1, shared_shifts: 15, total_shifts: 22, reason_label: 'Làm chung 15 ca · Tổng 22 ca' },
        { employee_id: 'emp_senior', rank: 2, shared_shifts: 12, total_shifts: 20, reason_label: 'Làm chung 12 ca · Tổng 20 ca' },
      ],
      mr_02_emp_pt2: [
        { employee_id: 'emp_pt1', rank: 1, shared_shifts: 12, total_shifts: 20, reason_label: 'Làm chung 12 ca · Tổng 20 ca' },
        { employee_id: 'emp_senior', rank: 2, shared_shifts: 10, total_shifts: 18, reason_label: 'Làm chung 10 ca · Tổng 18 ca' },
      ],
    },
    audit_logs: [],
    employee_names: {
      emp_pt1: { name: 'Trần Thị Thu Ngân', position_name: 'Thu ngân Part-time' },
      emp_pt2: { name: 'Lê Văn Pha Chế', position_name: 'Pha chế Part-time' },
      emp_senior: { name: 'Phạm Thị Pha Chế Chính', position_name: 'Pha chế chính Full-time' },
      emp_leader: { name: 'Nguyễn Văn Quản Lý Ca', position_name: 'Quản lý ca' },
      emp_fallback: { name: 'Vũ Thị Mới Vào', position_name: 'Thu ngân' },
    },
  }
}

export function buildHomiesCareerMapSeed(input?: {
  positions?: KpiCareerPositionSnapshot[]
  actor_id?: string
  now?: string
}): {
  map: KpiCareerMapVersion
  profiles: KpiPositionCriteriaProfile[]
} {
  const employeePos: KpiCareerPositionSnapshot = input?.positions?.find(
    (p) => p.name === 'Nhân viên cửa hàng' || p.id === 'pos_store_employee'
  ) || { id: 'pos_store_employee', name: 'Nhân viên cửa hàng', level: 1, job_family: 'store_operations', active: true }

  const leaderPos: KpiCareerPositionSnapshot = input?.positions?.find(
    (p) => p.name === 'Trưởng ca' || p.id === 'pos_shift_leader'
  ) || { id: 'pos_shift_leader', name: 'Trưởng ca', level: 2, job_family: 'management', active: true }

  const managerPos: KpiCareerPositionSnapshot = input?.positions?.find(
    (p) => p.name === 'Quản lý cửa hàng' || p.id === 'pos_store_manager'
  ) || { id: 'pos_store_manager', name: 'Quản lý cửa hàng', level: 3, job_family: 'management', active: true }

  const masterPositions: KpiCareerPositionSnapshot[] = input?.positions || [
    employeePos,
    leaderPos,
    managerPos,
  ]

  const nodes: KpiCareerMapNode[] = [
    {
      id: 'node_c1_pc',
      position_id: employeePos.id,
      grade_code: 'c1_pc',
      position_name_snapshot: employeePos.name,
      grade_name_snapshot: 'C1 - Pha chế',
      position_level_snapshot: employeePos.level || 1,
      job_family: 'store_operations',
      x: 50,
      y: 60,
      criteria_profile_id: 'profile_c1_pc',
      active: true,
    },
    {
      id: 'node_c1_tn',
      position_id: employeePos.id,
      grade_code: 'c1_tn',
      position_name_snapshot: employeePos.name,
      grade_name_snapshot: 'C1 - Thu ngân',
      position_level_snapshot: employeePos.level || 1,
      job_family: 'store_operations',
      x: 50,
      y: 220,
      criteria_profile_id: 'profile_c1_tn',
      active: true,
    },
    {
      id: 'node_c2',
      position_id: employeePos.id,
      grade_code: 'c2',
      position_name_snapshot: employeePos.name,
      grade_name_snapshot: 'C2 - Nhân viên đa năng',
      position_level_snapshot: employeePos.level || 1,
      job_family: 'store_operations',
      x: 260,
      y: 140,
      criteria_profile_id: 'profile_c2',
      active: true,
    },
    {
      id: 'node_c3',
      position_id: employeePos.id,
      grade_code: 'c3',
      position_name_snapshot: employeePos.name,
      grade_name_snapshot: 'C3 - Senior',
      position_level_snapshot: employeePos.level || 1,
      job_family: 'store_operations',
      x: 450,
      y: 140,
      criteria_profile_id: 'profile_c3',
      active: true,
    },
    {
      id: 'node_c4',
      position_id: leaderPos.id,
      grade_code: 'c4',
      position_name_snapshot: leaderPos.name,
      grade_name_snapshot: 'C4 - Trưởng ca',
      position_level_snapshot: leaderPos.level || 2,
      job_family: 'management',
      x: 640,
      y: 140,
      criteria_profile_id: 'profile_c4',
      active: true,
    },
    {
      id: 'node_c5',
      position_id: managerPos.id,
      grade_code: 'c5',
      position_name_snapshot: managerPos.name,
      grade_name_snapshot: 'C5 - Quản lý cửa hàng',
      position_level_snapshot: managerPos.level || 3,
      job_family: 'management',
      x: 830,
      y: 140,
      criteria_profile_id: 'profile_c5',
      active: true,
    },
  ]

  const edges: KpiCareerMapEdge[] = [
    {
      id: 'edge_c1_pc_c2',
      source_node_id: 'node_c1_pc',
      target_node_id: 'node_c2',
      preset_key: 'same_profession_level_up',
      preset_version: 1,
      active: true,
    },
    {
      id: 'edge_c1_tn_c2',
      source_node_id: 'node_c1_tn',
      target_node_id: 'node_c2',
      preset_key: 'same_profession_level_up',
      preset_version: 1,
      active: true,
    },
    {
      id: 'edge_c2_c3',
      source_node_id: 'node_c2',
      target_node_id: 'node_c3',
      preset_key: 'to_senior_employee',
      preset_version: 1,
      active: true,
    },
    {
      id: 'edge_c3_c4',
      source_node_id: 'node_c3',
      target_node_id: 'node_c4',
      preset_key: 'to_shift_leader',
      preset_version: 1,
      active: true,
    },
    {
      id: 'edge_c4_c5',
      source_node_id: 'node_c4',
      target_node_id: 'node_c5',
      preset_key: 'to_store_manager',
      preset_version: 1,
      active: true,
    },
  ]

  const nowIso = input?.now || '2026-08-01T08:00:00.000Z'
  const actorId = input?.actor_id || HR_ADMIN.id

  const map: KpiCareerMapVersion = {
    id: 'career_map_homies_standard_v1',
    version: 1,
    status: 'published',
    scope: 'chain',
    effective_from: '2026-08-01',
    created_by: actorId,
    approved_by: CEO.id,
    returned_reason: null,
    created_at: nowIso,
    updated_at: nowIso,
    based_on_version_id: null,
    master_position_snapshot: masterPositions,
    nodes,
    edges,
    transition_presets: DEFAULT_CAREER_TRANSITION_PRESETS,
  }

  const profiles: KpiPositionCriteriaProfile[] = [
    createDefaultProfileForGrade('c1_pc', employeePos.id, 'profile_c1_pc'),
    createDefaultProfileForGrade('c1_tn', employeePos.id, 'profile_c1_tn'),
    createDefaultProfileForGrade('c2', employeePos.id, 'profile_c2'),
    createDefaultProfileForGrade('c3', employeePos.id, 'profile_c3'),
    createDefaultProfileForGrade('c4', leaderPos.id, 'profile_c4'),
    createDefaultProfileForGrade('c5', managerPos.id, 'profile_c5'),
  ]

  return { map, profiles }
}
