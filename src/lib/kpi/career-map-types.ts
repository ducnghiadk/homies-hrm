import type { CareerGradeCode } from './career-grade-types.ts'

export type { CareerGradeCode } from './career-grade-types.ts'

export type KpiCareerMapStatus =
  | 'draft'
  | 'pending_approval'
  | 'published'
  | 'returned'
  | 'superseded'

export type KpiCareerMapIssueSeverity = 'blocking' | 'warning'

export type KpiCareerMapIssueCode =
  | 'same_level'
  | 'downward'
  | 'skipped_level'
  | 'self_loop'
  | 'cycle'
  | 'missing_level'
  | 'missing_grade_code'
  | 'missing_criteria'
  | 'missing_rule'
  | 'invalid_weight'
  | 'unplaced_positions'
  | 'no_progression'
  | 'no_management_convergence'
  | 'empty_map'

export type KpiCareerTransitionPresetKey =
  | 'same_profession_level_up'
  | 'to_senior_employee'
  | 'to_shift_leader'
  | 'to_store_manager'

export interface KpiCareerTransitionPreset {
  key: KpiCareerTransitionPresetKey
  preset_key?: KpiCareerTransitionPresetKey
  version: number
  name: string
  preset_name?: string
  required_months: number
  required_good_months?: number
  min_score: number
  min_kpi_score?: number
  minimum_hours: number | null
  min_hours?: number | null
  test_min_score: number | null
  trial_shift_count: number | null
  challenge_required?: boolean
  requires_store_360: boolean
  blocks_on_serious_incident: boolean
  proposer_roles: string[]
  approver_roles: string[]
  effective_from: string | null
}

export const DEFAULT_CAREER_TRANSITION_PRESETS: Record<KpiCareerTransitionPresetKey, KpiCareerTransitionPreset> = {
  same_profession_level_up: {
    key: 'same_profession_level_up',
    version: 1,
    name: 'Tăng bậc chuyên môn liền kề (C1 → C2)',
    required_months: 2,
    min_score: 3.5,
    minimum_hours: 60,
    test_min_score: null,
    trial_shift_count: null,
    requires_store_360: false,
    blocks_on_serious_incident: true,
    proposer_roles: ['store_manager'],
    approver_roles: ['hr_admin'],
    effective_from: '2026-01-01',
  },
  to_senior_employee: {
    key: 'to_senior_employee',
    version: 1,
    name: 'Lên nhân viên Senior / Đa năng cứng',
    required_months: 3,
    min_score: 3.8,
    minimum_hours: 80,
    test_min_score: 80,
    trial_shift_count: null,
    requires_store_360: false,
    blocks_on_serious_incident: true,
    proposer_roles: ['store_manager'],
    approver_roles: ['hr_admin'],
    effective_from: '2026-01-01',
  },
  to_shift_leader: {
    key: 'to_shift_leader',
    version: 1,
    name: 'Thăng cấp Trưởng ca',
    required_months: 3,
    min_score: 4.0,
    minimum_hours: 100,
    test_min_score: 85,
    trial_shift_count: 4,
    requires_store_360: true,
    blocks_on_serious_incident: true,
    proposer_roles: ['store_manager'],
    approver_roles: ['ceo', 'hr_admin'],
    effective_from: '2026-01-01',
  },
  to_store_manager: {
    key: 'to_store_manager',
    version: 1,
    name: 'Bổ nhiệm Quản lý cửa hàng',
    required_months: 6,
    min_score: 4.2,
    minimum_hours: 120,
    test_min_score: 90,
    trial_shift_count: 8,
    requires_store_360: true,
    blocks_on_serious_incident: true,
    proposer_roles: ['area_manager', 'hr_admin'],
    approver_roles: ['ceo'],
    effective_from: '2026-01-01',
  },
}

export interface KpiCareerPositionSnapshot {
  id: string
  name: string
  department_id?: string
  level?: number
  base_salary?: number
  pay_type?: 'hourly' | 'monthly'
  job_family?: string
  active?: boolean
}

export interface KpiCareerMapNode {
  id: string
  position_id: string
  grade_code?: CareerGradeCode | null
  position_name_snapshot: string
  grade_name_snapshot?: string
  position_level_snapshot: number
  job_family: string
  x: number
  y: number
  criteria_profile_id: string | null
  active: boolean
}

export interface KpiCareerMapEdge {
  id: string
  source_node_id: string
  target_node_id: string
  preset_key: KpiCareerTransitionPresetKey
  preset_version: number
  active: boolean
}

export interface KpiCareerMapVersion {
  id: string
  version: number
  status: KpiCareerMapStatus
  scope: 'chain'
  effective_from: string | null
  created_by: string
  approved_by: string | null
  returned_reason: string | null
  created_at: string
  updated_at: string
  based_on_version_id: string | null
  master_position_snapshot: KpiCareerPositionSnapshot[]
  nodes: KpiCareerMapNode[]
  edges: KpiCareerMapEdge[]
  transition_presets?: Record<string, KpiCareerTransitionPreset>
}

export interface KpiCareerMapValidationIssue {
  code: KpiCareerMapIssueCode | string
  severity: KpiCareerMapIssueSeverity
  message: string
  node_id?: string
  edge_id?: string
  position_id?: string
  context?: Record<string, unknown>
}

export interface KpiCareerMapValidationResult {
  valid: boolean
  has_blocking: boolean
  issues: KpiCareerMapValidationIssue[]
}

export type KpiCareerCriterionSource =
  | 'homies_recommended'
  | 'fnb_common'
  | 'similar_position'
  | 'custom'

export type KpiCareerEvidenceSource =
  | 'pos'
  | 'checklist'
  | 'shift_log'
  | 'manager_rating'
  | 'peer_review'
  | 'other'

export type KpiCareerCriterionDirection = 'higher_is_better' | 'lower_is_better' | 'rubric'

export interface KpiCareerCriterion {
  id: string
  name: string
  description?: string
  source: KpiCareerCriterionSource
  evidence_source: KpiCareerEvidenceSource
  direction: KpiCareerCriterionDirection
  unit?: string
  pass_target?: string | number
  suggested_weight: number
  weight: number
  locked: boolean
  active: boolean
  importance?: 'low' | 'medium' | 'high'
}

export interface KpiPositionCriteriaProfile {
  id: string
  position_ids: string[]
  grade_codes?: CareerGradeCode[]
  job_family: string | null
  version: number
  effective_from: string | null
  criteria: KpiCareerCriterion[]
}

export type KpiCriteriaApplyScope =
  | { mode: 'current_position'; position_id: string }
  | { mode: 'job_family'; job_family: string }
  | { mode: 'selected_positions'; position_ids: string[] }

export interface KpiCustomCriterionInput {
  outcome: string
  evidence_source: KpiCareerEvidenceSource | string
  pass_target: string
  importance: 'low' | 'medium' | 'high'
  custom_name?: string
  unit?: string
}

export type KpiWeightRebalanceMode = 'auto_rebalance' | 'reduce_another' | 'advanced_manual'

export type KpiEmployeePlacementStatus = 'placed' | 'unresolved'
export type KpiEmployeeUnresolvedReason =
  | 'position_not_in_map'
  | 'missing_level'
  | 'inactive_position'
  | 'conflicting_positions'

export interface KpiEmployeePlacement {
  employee_id: string
  employee_name: string
  store_id: string
  position_id: string
  grade_code?: CareerGradeCode | null
  node_id: string | null
  status: KpiEmployeePlacementStatus
  unresolved_reason?: KpiEmployeeUnresolvedReason
}

export interface KpiCareerEmployeePlacement {
  id: string
  career_map_version_id: string
  employee_id: string
  store_id: string
  position_id: string
  grade_code?: CareerGradeCode | null
  node_id: string | null
  status: 'placed' | 'unresolved'
  unresolved_reason: string | null
  created_at: string
}

export interface KpiCareerMapDeploymentPreview {
  career_map_id: string
  version: number
  effective_from: string | null
  branch_count: number
  position_count: number
  transition_count: number
  criteria_profile_count: number
  preset_count: number
  placed_employee_count: number
  unresolved_employee_count: number
  total_employee_count: number
  store_count: number
  changes_from_current: string[]
  requires_individual_confirmation: false
  validation_result: KpiCareerMapValidationResult
}

export interface KpiCareerMapApprovalLog {
  id: string
  career_map_version_id: string
  career_map_id?: string
  version?: number
  action: 'submit' | 'return' | 'publish'
  actor_id: string
  actor_role?: string
  notes?: string | null
  created_at: string
}

export interface CareerMapAggregateChange {
  map: KpiCareerMapVersion
  profiles: KpiPositionCriteriaProfile[]
}
