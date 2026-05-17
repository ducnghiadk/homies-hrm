// =============================================
// HRM Trà Sữa 🧋 — KPI System Types
// Phase 3F: Comprehensive KPI Data Models
// =============================================

// ═══════════════════════════════════
// ENUMS / UNION TYPES
// ═══════════════════════════════════

/** Option A: L0-L1 (Thử việc / NV mới), B: L2-L3 (NV / Senior), C: L4-L5 (PQL / QL) */
export type KPIOptionType = 'A' | 'B' | 'C'

export type EmployeeLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

export type EvaluatorRole =
  | 'self' | 'mentor' | 'senior' | 'leader' | 'manager' | 'ceo' | 'peer'

export type CategoryType = 'auto' | 'manual' | 'deduction'

export type CriteriaInputType = 'star' | 'percent' | 'number' | 'boolean'

export type ViolationSeverity = 'minor' | 'medium' | 'major' | 'critical'

export type KPIGradeCode = 'excellent' | 'good' | 'fair' | 'average' | 'poor'

export type EvaluationStatus =
  | 'draft' | 'self_submitted' | 'under_review'
  | 'published' | 'appealed' | 'finalized'

// ═══════════════════════════════════
// CATEGORY (Khía cạnh đánh giá)
// ═══════════════════════════════════

export interface KPICategory {
  id: string
  name: string           // "Chuyên cần", "Thái độ", …
  name_en: string
  type: CategoryType
  weight: number          // % (tổng các category trong 1 option = 100)
  option_type: KPIOptionType
  evaluators: EvaluatorRole[]
  icon: string
  color: string
  sort_order: number
  is_active: boolean
}

// ═══════════════════════════════════
// CRITERIA (Tiêu chí trong mỗi khía cạnh)
// ═══════════════════════════════════

export interface KPICriteria {
  id: string
  category_id: string
  name: string            // "Tỷ lệ đi làm", "Nhiệt tình", …
  name_en: string
  description: string
  input_type: CriteriaInputType
  max_value: number       // 5 cho star, 100 cho percent
  target_value: number    // Mục tiêu (VD: 95%)
  target_operator: '>=' | '<=' | '='
  auto_source?: string    // 'attendance.rate', 'attendance.on_time', …
  rating_guide?: string   // Hướng dẫn chấm điểm
  sort_order: number
  is_active: boolean
}

// ═══════════════════════════════════
// VIOLATION TYPE (Loại lỗi)
// ═══════════════════════════════════

export interface ViolationType {
  id: string
  code: string            // L01, M01, H01, S01, MG01
  name: string
  name_en: string
  description: string
  severity: ViolationSeverity
  penalty_points: number  // Điểm trừ (5, 10, 20, 30, 50)
  applicable_levels: EmployeeLevel[]
  requires_evidence: boolean
  requires_acknowledgment: boolean
  notify_admin: boolean   // Thông báo CEO khi log
  sort_order: number
  is_active: boolean
}

// ═══════════════════════════════════
// GRADE (Xếp loại)
// ═══════════════════════════════════

export interface KPIGrade {
  id: string
  code: KPIGradeCode
  name: string            // "Xuất sắc", "Tốt", …
  name_en: string
  min_score: number
  max_score: number
  color: string
  icon: string
  promotion_eligible: boolean
  sort_order: number
}

// ═══════════════════════════════════
// LEVEL CONFIG (Cấu hình cấp bậc)
// ═══════════════════════════════════

export interface LevelConfig {
  id: string
  level: EmployeeLevel
  name: string            // "Thử việc", "NV chính thức", …
  option_type: KPIOptionType
  min_months_to_promote: number
  required_kpi_average: number
  allow_self_evaluation: boolean
  evaluators: EvaluatorRole[]
  promotion_requires_ceo_approval: boolean
}

// ═══════════════════════════════════
// EVALUATION TIMELINE (Lịch đánh giá)
// ═══════════════════════════════════

export interface EvaluationTimeline {
  id: string
  phase: 'data_collection' | 'self_evaluation' | 'review' | 'publish' | 'appeal'
  name: string
  start_day: number       // Ngày trong tháng
  end_day: number
  responsible_role: EvaluatorRole[]
}

// ═══════════════════════════════════
// KPI SETTINGS (Tổng hợp settings)
// ═══════════════════════════════════

export interface KPISettings {
  id: string
  org_id: string
  evaluation_cycle: 'monthly' | 'quarterly'
  promotion_review_months: number    // 6 tháng
  appeal_window_hours: number        // 48h
  allow_late_error_logging: boolean
  require_evidence_for_major: boolean
  notify_employee_on_error: boolean
  updated_at: string
  updated_by: string
}

// ═══════════════════════════════════
// VIOLATION RECORD (Bản ghi lỗi)
// ═══════════════════════════════════

export type ViolationRecordStatus =
  | 'pending' | 'acknowledged' | 'appealed'
  | 'appeal_approved' | 'appeal_rejected' | 'finalized'

export interface ViolationRecord {
  id: string
  org_id: string
  store_id: string
  employee_id: string
  violation_type_id: string
  logged_by: string
  logged_by_role: EvaluatorRole
  log_mode: 'realtime' | 'end_of_month'
  occurred_at: string
  logged_at: string
  description: string
  evidence_url?: string
  penalty_points: number

  // Appeal flow
  status: ViolationRecordStatus
  employee_response?: string
  appeal_reason?: string
  appeal_at?: string
  appeal_reviewed_by?: string
  appeal_reviewed_at?: string
  appeal_decision?: string

  // Timestamps
  acknowledged_at?: string
  finalized_at?: string
  period: string  // '2026-02' format
}

// ═══════════════════════════════════
// VIOLATION SUMMARY (Tổng hợp tháng)
// ═══════════════════════════════════

export interface ViolationSummary {
  employee_id: string
  period: string
  total_violations: number
  total_penalty_points: number
  by_severity: {
    minor: number
    medium: number
    major: number
    critical: number
  }
  pending_appeals: number
  violation_score: number  // 100 - total_penalty_points (min 0)
}

// ═══════════════════════════════════
// EVALUATION SCORE (Điểm từng tiêu chí)
// ═══════════════════════════════════

export interface EvaluationScore {
  criteria_id: string
  self_score?: number
  manager_score?: number
  final_score: number
  source: 'auto' | 'self' | 'manager' | 'mentor' | 'peer'
  note?: string
}

// ═══════════════════════════════════
// CATEGORY SCORE (Điểm từng khía cạnh)
// ═══════════════════════════════════

export interface CategoryScore {
  category_id: string
  category_name: string
  weight: number
  raw_score: number       // 0-100
  weighted_score: number  // raw_score × weight / 100
  scores: EvaluationScore[]
}

// ═══════════════════════════════════
// KPI EVALUATION (Bản đánh giá tháng)
// ═══════════════════════════════════

export interface KPIEvaluation {
  id: string
  org_id: string
  store_id: string
  employee_id: string
  employee_level: EmployeeLevel
  option_type: KPIOptionType
  period: string

  // Scores
  category_scores: CategoryScore[]
  violation_score: number
  total_score: number
  grade_code: KPIGradeCode

  // Status flow
  status: EvaluationStatus

  self_submitted_at?: string
  self_comment?: string

  reviewed_by?: string
  reviewed_at?: string
  manager_comment?: string

  // Multi-evaluator (L0)
  evaluator_scores?: {
    evaluator_id: string
    evaluator_role: EvaluatorRole
    scores: EvaluationScore[]
    comment?: string
    submitted_at: string
  }[]

  published_at?: string
  published_by?: string

  appeal_reason?: string
  appeal_at?: string
  appeal_result?: 'approved' | 'rejected'
  appeal_reviewed_by?: string
  appeal_reviewed_at?: string

  created_at: string
  updated_at: string
}

// ═══════════════════════════════════
// PROMOTION REVIEW (Xét thăng tiến)
// ═══════════════════════════════════

export interface PromotionReview {
  id: string
  employee_id: string
  current_level: EmployeeLevel
  target_level: EmployeeLevel
  review_period: string

  evaluations: string[]
  average_score: number
  lowest_score: number
  violation_count: number
  critical_violations: number

  eligible: boolean
  eligibility_reasons: string[]
  status: 'pending' | 'approved' | 'rejected' | 'deferred'
  decision_by?: string
  decision_at?: string
  decision_note?: string

  promoted_at?: string
  new_level?: EmployeeLevel
}

