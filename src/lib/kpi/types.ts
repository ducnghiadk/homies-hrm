export type { KpiDatabase } from './repository'
export type KpiLevelCode = 'pt1_tn' | 'pt1_pc' | 'pt2' | 'senior' | 'shift_leader'
export type KpiGroupTag = 'revenue' | 'customer_service' | 'operations' | 'discipline' | 'custom'
export type KpiScoringMode = 'automatic' | 'leader' | 'combined'
export type KpiScoreValue = 1 | 2 | 3 | 4 | 5
export type KpiSetStatus = 'draft' | 'published' | 'archived'
export type KpiTemplateId = 'barista' | 'cashier' | 'server' | 'kitchen' | 'shift_leader' | 'store_manager'
export type KpiMetricUnit = 'percent' | 'minutes' | 'vnd' | 'count' | 'score'
export type KpiMetricDirection = 'higher' | 'lower' | 'rubric'
export type KpiSetupStep = 'template' | 'criteria' | 'targets' | 'overrides' | 'publish'
export type KpiPeriodStatus =
  | 'draft'
  | 'collecting'
  | 'leader_scoring'
  | 'ceo_preapproval'
  | 'published'
  | 'appeal_window'
  | 'locked'

export interface KpiScoreBand {
  min: number
  max: number | null
  score: KpiScoreValue
}

export interface KpiStoreGroup {
  id: string
  name: string
  store_ids: string[]
  active: boolean
}

export interface KpiStoreGroupSnapshot {
  id: string
  name: string
  store_ids: string[]
}

export interface KpiCriterionTarget {
  criterion_id: string
  target: number
  score_bands: KpiScoreBand[]
}

export interface KpiTargetProfile {
  scope: 'chain' | 'store_group'
  store_group_id?: string
  targets: KpiCriterionTarget[]
}

export interface KpiStoreTargetOverride {
  id: string
  store_id: string
  criterion_id: string
  target: number
  reason: string
  owner_id: string
  effective_from: string
  effective_to: string
}

export interface KpiCriterionDefinition {
  id: string
  group_id: string
  name: string
  description: string
  scoring_mode: KpiScoringMode
  weight: number
  unit?: KpiMetricUnit
  direction?: KpiMetricDirection
  core?: boolean
  recommended_weight_range?: { min: number; max: number }
  source_key?: string
  score_bands: KpiScoreBand[]
  evidence_required_below?: KpiScoreValue
  adjustment_reason_required: boolean
  applies_when?: { min_hours?: number; position_ids?: string[] }
  sort_order: number
  active: boolean
}

export interface KpiGroupDefinition {
  id: string
  name: string
  tag: KpiGroupTag
  weight: number
  promotion_core: boolean
  sort_order: number
  criteria: KpiCriterionDefinition[]
}

export type KpiProgramPurpose =
  | 'promotion'
  | 'monthly_bonus'
  | 'probation'
  | 'capability_review'
  | 'training'
  | 'store_operations'

export type KpiProgramSetupStep = 'purpose' | 'scope' | 'sources' | 'readiness' | 'review'

export type KpiReviewSource =
  | 'operations'
  | 'shift_leader'
  | 'peer'
  | 'self'
  | 'store_manager'
  | 'area_manager'
  | 'store_360'
  | 'skill_test'
  | 'trial_role'

export interface KpiEvaluationSourcePolicy {
  enabled_sources: KpiReviewSource[]
  peer_reviewer_count: number
  peer_weight_cap: number
  store_360_frequency?: 'quarterly'
}

export interface KpiPromotionRule {
  from_position_id: string
  to_position_id: string
  score_mode: 'consecutive' | 'rolling'
  required_months: number
  rolling_window_months?: number
  min_score: number
  min_shifts: number
  min_hours: number
  required_skill_ids: string[]
  test_min_score?: number
  trial_shift_count?: number
  trial_week_count?: number
  requires_store_360: boolean
  blocking_incident_codes: string[]
  proposer_roles: KpiActor['role'][]
  approver_roles: KpiActor['role'][]
}

export type KpiPromotionPresetKey =
  | 'probation'
  | 'employee_to_core'
  | 'employee_to_leader'
  | 'leader_to_supervisor'
  | 'supervisor_to_manager'
  | 'manager_to_area'

export interface KpiCareerStageSuggestion {
  id: string
  label: string
  from_position_id: string
  from_position_name: string
  to_position_id: string
  to_position_name: string
  template_id: KpiTemplateId
  promotion_preset: KpiPromotionPresetKey
}

export interface KpiProgramValidationIssue {
  code:
    | 'MISSING_PRIMARY_PURPOSE'
    | 'DUPLICATE_PURPOSE'
    | 'MISSING_POSITION_SCOPE'
    | 'MISSING_PROMOTION_PATH'
    | 'MISSING_SOURCE_POLICY'
    | 'INVALID_SOURCE_POLICY'
    | 'INVALID_PROMOTION_RULE'
    | 'PEER_WEIGHT_CAP'
    | 'REVIEWER_COUNT'
    | 'SHIFT_THRESHOLD'
    | 'DEADLINE'
    | 'COMMENT_LENGTH'
  path: string
  message: string
}

export interface KpiSetVersion {
  id: string
  set_id: string
  version: number
  name: string
  status: KpiSetStatus
  template_id?: KpiTemplateId
  position_ids?: string[]
  setup_step?: KpiSetupStep
  primary_purpose?: KpiProgramPurpose
  secondary_purposes?: KpiProgramPurpose[]
  program_setup_step?: KpiProgramSetupStep
  source_policy?: KpiEvaluationSourcePolicy
  promotion_rule?: KpiPromotionRule
  peer_review_policy?: KpiPeerReviewPolicy
  store_group_snapshots?: KpiStoreGroupSnapshot[]
  target_profiles?: KpiTargetProfile[]
  target_overrides?: KpiStoreTargetOverride[]
  level_codes: KpiLevelCode[]
  store_ids: string[] | 'all'
  effective_from: string
  effective_to?: string
  score_scale: KpiScoreValue[]
  groups: KpiGroupDefinition[]
  created_by: string
  created_at: string
  published_by?: string
  published_at?: string
}

export type KpiSetSnapshot = Omit<KpiSetVersion, 'status'> & { source_status: 'published' }

export interface KpiActor {
  id: string
  role: 'employee' | 'shift_leader' | 'store_manager' | 'area_manager' | 'hr_admin' | 'ceo'
  store_id?: string
}

export interface KpiEmployeeRef {
  id: string
  store_id: string
  level_code: KpiLevelCode
  position_id: string
  employment_status: 'probation' | 'official'
}

export interface KpiCriterionScore {
  criterion_id: string
  suggested_score?: number
  final_score?: number
  source_refs: string[]
  adjustment_reason?: string
  evidence_refs: string[]
}

export interface KpiEvaluation {
  id: string
  period_id: string
  employee: KpiEmployeeRef
  snapshot: KpiSetSnapshot
  scores: KpiCriterionScore[]
  total_score?: number
  grade_code?: string
  status: 'draft' | 'submitted' | 'returned' | 'preapproved' | 'published' | 'locked'
  published_at?: string
  peer_summary?: {
    total_score?: number
    enough_anonymous_sample: boolean
    applied_weight_percent: number
    fallback_primary_weight_percent: number
    strength_summary?: string
    improvement_summary?: string
  }
  monthly_feedback?: {
    strength: string
    improvement: string
    next_action:
      | 'normal_follow_up'
      | 'training'
      | 'trial_responsibility'
      | 'promotion_watchlist'
    support_needed: string
  }
  revision: number
}

export interface KpiPeriod {
  id: string
  org_id: string
  store_id: string
  month: string
  status: KpiPeriodStatus
  snapshot: KpiSetSnapshot
  employee_ids: string[]
  opened_by: string
  opened_at: string
  published_at?: string
  locked_at?: string
  revision: number
}

export interface KpiIncidentViolation {
  code: string
  primary: boolean
  independent_behavior: boolean
  reason: string
  evidence_refs: string[]
}

export interface KpiIncident {
  id: string
  store_id: string
  employee_id: string
  period_id?: string
  occurred_at: string
  source: 'attendance' | 'food_app' | 'customer' | 'operation' | 'other'
  status: 'proposed' | 'confirmed' | 'acknowledged' | 'appealed' | 'finalized' | 'cancelled'
  violations: KpiIncidentViolation[]
  description: string
  evidence_refs: string[]
}

export interface KpiAppeal {
  id: string
  type: 'monthly_kpi' | 'incident' | 'people_decision'
  employee_id: string
  reference_id: string
  reason: string
  evidence_refs: string[]
  status: 'submitted' | 'reviewing' | 'approved' | 'partially_approved' | 'rejected'
  submitted_at: string
  deadline_at: string
}

export interface KpiDevelopmentCase {
  id: string
  employee_id: string
  current_level: KpiLevelCode
  target_level: KpiLevelCode
  status: 'detected' | 'leader_proposed' | 'testing' | 'challenge' | 'approved' | 'deferred' | 'rejected'
}

export interface KpiReopenRequest {
  id: string
  period_id: string
  requested_by: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface KpiAuditLog {
  id: string
  entity_type: string
  entity_id: string
  action: string
  actor_id: string
  old_value?: unknown
  new_value?: unknown
  reason?: string
  created_at: string
}

export interface KpiGradeDefinition {
  code: string
  name: string
  min_score: number
  max_score: number
}

export interface KpiPromotionPath {
  from: KpiLevelCode
  to: KpiLevelCode
  minimum_months: number
  required_average_score: number
  minimum_monthly_score: number
  core_group_average_score: number
  required_high_months?: number
  required_high_month_score?: number
  disqualifying_incident_lookback_months: number
  active_warning_lookback_months: number
  test_score_threshold: number
  challenge_duration_months: string
}

export interface KpiDefaultPolicy {
  levels: KpiLevelCode[]
  score_scale: KpiScoreValue[]
  monthly_appeal_hours: number
  people_decision_appeal_business_days: number
  minimum_monthly_hours_for_full_kpi: number
  groups: KpiGroupDefinition[]
  grades: KpiGradeDefinition[]
  promotion_paths: KpiPromotionPath[]
}

export interface KpiPeerReviewPolicy {
  enabled: boolean
  weight_percent: number
  max_weight_percent: 15
  min_total_shifts: number
  min_shared_shifts: number
  manager_selection_hours: number
  reviewer_deadline_hours: number
  required_reviewer_count: 2
  standby_enabled: boolean
  exclude_probation: boolean
  exclude_suspended: boolean
  extreme_comment_min_length: number
  missing_sample_fallback: 'primary_reviewer'
}

export type KpiMonthlyReviewStatus =
  | 'assignment_pending'
  | 'collecting'
  | 'primary_review_pending'
  | 'manager_approval_pending'
  | 'published'
  | 'appeal_open'
  | 'locked'

export interface KpiMonthlyReview {
  id: string
  period_id: string
  evaluation_id: string
  employee_id: string
  store_id: string
  position_id: string
  subject_role: 'employee' | 'shift_leader'
  primary_reviewer_id: string
  primary_reviewer_role: 'shift_leader' | 'store_manager'
  status: KpiMonthlyReviewStatus
  assignment_deadline_at?: string
  peer_deadline_at?: string
  published_at?: string
  appeal_deadline_at?: string
  missing_peer_sample: boolean
  blocker_codes: string[]
  created_at: string
  updated_at: string
}

export type KpiPeerAssignmentStatus = 'candidate' | 'assigned' | 'submitted' | 'expired' | 'replaced'

export interface KpiPeerAssignment {
  id: string
  monthly_review_id: string
  reviewer_id: string
  rank: number
  shared_shift_count: number
  total_shift_count: number
  selected_by: 'system' | 'manager'
  selected_by_actor_id?: string
  selection_reason?: string
  status: KpiPeerAssignmentStatus
  assigned_at?: string
  deadline_at?: string
  replacement_for_assignment_id?: string
}

export interface KpiPeerAnswer {
  question_code:
    | 'peak_teamwork'
    | 'proactive_support'
    | 'shift_handover'
    | 'hygiene_process'
    | 'team_communication'
  score: 1 | 2 | 3 | 4 | 5
  observed_date?: string
  situation_code?: string
  evidence_note?: string
}

export interface KpiPeerResponse {
  id: string
  assignment_id: string
  monthly_review_id: string
  reviewer_id: string
  answers: KpiPeerAnswer[]
  strength_note: string
  improvement_note: string
  direct_observation_confirmed: boolean
  submitted_at: string
}

export interface KpiPeerAggregate {
  monthly_review_id: string
  valid_response_count: number
  enough_anonymous_sample: boolean
  question_scores: Array<{
    question_code: KpiPeerAnswer['question_code']
    score: number
  }>
  total_score?: number
  strength_summary?: string
  improvement_summary?: string
  configured_weight_percent: number
  applied_peer_weight_percent: number
  fallback_primary_weight_percent: number
}

export interface KpiEvaluationIntegrityFlag {
  id: string
  monthly_review_id: string
  code:
    | 'RECIPROCAL_PAIR'
    | 'REPEATED_PAIR'
    | 'IDENTICAL_RESPONSES'
    | 'EXTREME_WITH_WEAK_EVIDENCE'
    | 'SOURCE_DIVERGENCE'
    | 'MANAGER_OVERRIDE_PATTERN'
    | 'REVIEWER_BIAS_PATTERN'
  severity: 'info' | 'warning' | 'blocking'
  evidence_refs: string[]
  status: 'open' | 'dismissed' | 'confirmed'
  resolved_by?: string
  resolution_reason?: string
}
