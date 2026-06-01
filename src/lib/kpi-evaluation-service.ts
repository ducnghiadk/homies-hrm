// =============================================
// HRM Trà Sữa 🧋 — KPI Evaluation Service
// Phase 3F-3: Score calculation, evaluation CRUD, promotion
// =============================================

import type {
  KPIEvaluation, EvaluationScore, CategoryScore, PromotionReview,
  EvaluationStatus, EvaluatorRole, KPIGradeCode, EmployeeLevel, KPIOptionType,
} from './kpi-types'
import {
  mockKPICategories, mockKPICriteria, mockKPIGrades, mockLevelConfigs,
  getViolationSummary, mockViolationRecords,
} from './mock-data-kpi'
import { mockAttendances } from './mock-data'
import type { Attendance } from './mock-data'
import { mockEvaluations, mockPromotionReviews } from './mock-data-kpi'

// ══════════════════════════════════════
// PERSISTENT STORES (localStorage-backed)
// ══════════════════════════════════════

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return [...fallback]
  try {
    const saved = localStorage.getItem(`kpi-${key}`)
    return saved ? JSON.parse(saved) : [...fallback]
  } catch { return [...fallback] }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(`kpi-${key}`, JSON.stringify(data)) } catch { /* quota */ }
  }
}

export const evaluationStore: KPIEvaluation[] = loadFromStorage('evaluations', mockEvaluations)
export const promotionStore: PromotionReview[] = loadFromStorage('promotions', mockPromotionReviews)

export function persistEvaluations(): void { saveToStorage('evaluations', evaluationStore) }
export function persistPromotions(): void { saveToStorage('promotions', promotionStore) }

/** Re-initialize stores from mock data + localStorage. Call once per page mount. */
export function initStores(): void {
  if (evaluationStore.length === 0) {
    const data = loadFromStorage('evaluations', mockEvaluations)
    evaluationStore.push(...data)
  }
  if (promotionStore.length === 0) {
    const data = loadFromStorage('promotions', mockPromotionReviews)
    promotionStore.push(...data)
  }
}

/** Clear all persisted KPI data (for testing) */
export function resetKPIData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kpi-evaluations')
    localStorage.removeItem('kpi-promotions')
    localStorage.removeItem('kpi-violations')
  }
  evaluationStore.length = 0
  evaluationStore.push(...mockEvaluations.map(e => ({ ...e })))
  promotionStore.length = 0
  promotionStore.push(...mockPromotionReviews.map(p => ({ ...p })))
}

// ══════════════════════════════════════
// AUTO SCORE CALCULATION
// ══════════════════════════════════════

export function calculateAttendanceScore(
  employeeId: string,
  period: string, // '2026-02'
): { attendance_rate: number; punctuality_rate: number } {
  const [y, m] = period.split('-').map(Number)
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const end = `${y}-${String(m).padStart(2, '0')}-28`

  const records = (mockAttendances as Attendance[]).filter(
    a => a.employee_id === employeeId && a.date >= start && a.date <= end,
  )

  if (records.length === 0) return { attendance_rate: 100, punctuality_rate: 100 }

  const totalDays = records.length
  const presentDays = records.filter(r =>
    ['on_time', 'late', 'early'].includes(r.status),
  ).length
  const onTimeDays = records.filter(r =>
    ['on_time', 'early'].includes(r.status),
  ).length

  return {
    attendance_rate: Math.round((presentDays / totalDays) * 100),
    punctuality_rate: presentDays > 0 ? Math.round((onTimeDays / presentDays) * 100) : 100,
  }
}

export function calculateAutoScores(
  employeeId: string,
  period: string,
  criteriaList: typeof mockKPICriteria,
): EvaluationScore[] {
  const att = calculateAttendanceScore(employeeId, period)
  return criteriaList
    .filter(c => c.auto_source)
    .map(c => {
      let value = 0
      if (c.auto_source === 'attendance.rate') value = att.attendance_rate
      else if (c.auto_source === 'attendance.on_time') value = att.punctuality_rate
      return {
        criteria_id: c.id,
        final_score: value,
        source: 'auto' as const,
      }
    })
}

// ══════════════════════════════════════
// SCORE CALCULATION
// ══════════════════════════════════════

export function calculateCategoryScore(
  scores: EvaluationScore[],
  criteria: typeof mockKPICriteria,
): number {
  if (scores.length === 0) return 0
  let totalWeighted = 0
  let totalMax = 0
  for (const s of scores) {
    const crit = criteria.find(c => c.id === s.criteria_id)
    if (!crit) continue
    const normalized = (s.final_score / crit.max_value) * 100
    totalWeighted += normalized
    totalMax++
  }
  return totalMax > 0 ? Math.round(totalWeighted / totalMax) : 0
}

export function calculateTotalScore(evaluation: KPIEvaluation): number {
  let total = 0
  for (const cat of evaluation.category_scores) {
    total += cat.weighted_score
  }
  return Math.round(total)
}

export function determineGrade(totalScore: number): KPIGradeCode {
  const sorted = [...mockKPIGrades].sort((a, b) => b.min_score - a.min_score)
  for (const g of sorted) {
    if (totalScore >= g.min_score) return g.code
  }
  return 'poor'
}

function getOptionForLevel(level: EmployeeLevel): KPIOptionType {
  const cfg = mockLevelConfigs.find(c => c.level === level)
  return cfg?.option_type ?? 'A'
}

// ══════════════════════════════════════
// EVALUATION CRUD
// ══════════════════════════════════════

export function createEvaluation(
  employeeId: string,
  period: string,
  storeId: string,
  level: EmployeeLevel,
): KPIEvaluation {
  const option = getOptionForLevel(level)
  const categories = mockKPICategories.filter(c => c.option_type === option && c.is_active)
  const now = new Date().toISOString()

  const categoryScores: CategoryScore[] = categories.map(cat => {
    const criteria = mockKPICriteria.filter(c => c.category_id === cat.id && c.is_active)
    const autoScores = cat.type === 'auto'
      ? calculateAutoScores(employeeId, period, criteria)
      : []

    return {
      category_id: cat.id,
      category_name: cat.name,
      weight: cat.weight,
      raw_score: 0,
      weighted_score: 0,
      scores: autoScores,
    }
  })

  const violationSum = getViolationSummary(employeeId, period)

  const evaluation: KPIEvaluation = {
    id: `eval-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    org_id: 'org-001',
    store_id: storeId,
    employee_id: employeeId,
    employee_level: level,
    option_type: option,
    period,
    category_scores: categoryScores,
    violation_score: violationSum.violation_score,
    total_score: 0,
    grade_code: 'average',
    status: 'draft',
    created_at: now,
    updated_at: now,
  }

  evaluationStore.push(evaluation)
  return evaluation
}

export function getEvaluation(employeeId: string, period: string): KPIEvaluation | undefined {
  return evaluationStore.find(
    e => e.employee_id === employeeId && e.period === period,
  )
}

export function getEvaluationById(id: string): KPIEvaluation | undefined {
  return evaluationStore.find(e => e.id === id)
}

export function getEvaluationsByStore(storeId: string, period: string): KPIEvaluation[] {
  return evaluationStore.filter(e => e.store_id === storeId && e.period === period)
}

export function getEvaluationsByStatus(status: EvaluationStatus, storeId?: string): KPIEvaluation[] {
  return evaluationStore.filter(
    e => e.status === status && (!storeId || e.store_id === storeId),
  )
}

// ══════════════════════════════════════
// SELF EVALUATION
// ══════════════════════════════════════

export function submitSelfEvaluation(
  evaluationId: string,
  scores: EvaluationScore[],
  comment?: string,
): KPIEvaluation | null {
  const ev = evaluationStore.find(e => e.id === evaluationId)
  if (!ev || !['draft'].includes(ev.status)) return null
  const now = new Date().toISOString()

  // Merge self scores into category_scores
  for (const cat of ev.category_scores) {
    const criteria = mockKPICriteria.filter(c => c.category_id === cat.category_id && c.is_active)
    for (const crit of criteria) {
      const selfScore = scores.find(s => s.criteria_id === crit.id)
      if (selfScore) {
        const existing = cat.scores.find(s => s.criteria_id === crit.id)
        if (existing) {
          existing.self_score = selfScore.self_score
          if (existing.source !== 'auto') {
            existing.final_score = selfScore.self_score ?? existing.final_score
            existing.source = 'self'
          }
        } else {
          cat.scores.push({
            criteria_id: crit.id,
            self_score: selfScore.self_score,
            final_score: selfScore.self_score ?? 0,
            source: 'self',
          })
        }
      }
    }
    // Recalculate
    cat.raw_score = calculateCategoryScore(cat.scores, criteria)
    cat.weighted_score = Math.round(cat.raw_score * cat.weight / 100)
  }

  ev.status = 'self_submitted'
  ev.self_submitted_at = now
  ev.self_comment = comment
  ev.total_score = calculateTotalScore(ev)
  ev.grade_code = determineGrade(ev.total_score)
  ev.updated_at = now
  persistEvaluations()
  return ev
}

// ══════════════════════════════════════
// MANAGER REVIEW
// ══════════════════════════════════════

export function submitManagerReview(
  evaluationId: string,
  scores: EvaluationScore[],
  comment: string,
  reviewerId: string,
): KPIEvaluation | null {
  const ev = evaluationStore.find(e => e.id === evaluationId)
  if (!ev || !['self_submitted', 'under_review'].includes(ev.status)) return null
  const now = new Date().toISOString()

  for (const cat of ev.category_scores) {
    const criteria = mockKPICriteria.filter(c => c.category_id === cat.category_id && c.is_active)
    for (const crit of criteria) {
      const mgrScore = scores.find(s => s.criteria_id === crit.id)
      if (mgrScore) {
        const existing = cat.scores.find(s => s.criteria_id === crit.id)
        if (existing) {
          existing.manager_score = mgrScore.manager_score
          if (existing.source !== 'auto') {
            existing.final_score = mgrScore.manager_score ?? existing.final_score
            existing.source = 'manager'
          }
        } else {
          cat.scores.push({
            criteria_id: crit.id,
            manager_score: mgrScore.manager_score,
            final_score: mgrScore.manager_score ?? 0,
            source: 'manager',
          })
        }
      }
    }
    cat.raw_score = calculateCategoryScore(cat.scores, criteria)
    cat.weighted_score = Math.round(cat.raw_score * cat.weight / 100)
  }

  ev.status = 'under_review'
  ev.reviewed_by = reviewerId
  ev.reviewed_at = now
  ev.manager_comment = comment
  ev.total_score = calculateTotalScore(ev)
  ev.grade_code = determineGrade(ev.total_score)
  ev.updated_at = now
  persistEvaluations()
  return ev
}

// ══════════════════════════════════════
// L0 MULTI-EVALUATOR
// ══════════════════════════════════════

export function submitEvaluatorScore(
  evaluationId: string,
  evaluatorId: string,
  evaluatorRole: EvaluatorRole,
  scores: EvaluationScore[],
  comment?: string,
): KPIEvaluation | null {
  const ev = evaluationStore.find(e => e.id === evaluationId)
  if (!ev) return null
  const now = new Date().toISOString()

  const existing = ev.evaluator_scores?.find(es => es.evaluator_id === evaluatorId)
  if (existing) {
    existing.scores = scores
    existing.comment = comment
    existing.submitted_at = now
  } else {
    if (!ev.evaluator_scores) ev.evaluator_scores = []
    ev.evaluator_scores.push({ evaluator_id: evaluatorId, evaluator_role: evaluatorRole, scores, comment, submitted_at: now })
  }

  ev.updated_at = now
  persistEvaluations()
  return ev
}

export function getRequiredEvaluators(
  level: EmployeeLevel,
): { role: EvaluatorRole; required: boolean }[] {
  const cfg = mockLevelConfigs.find(c => c.level === level)
  if (!cfg) return []
  return cfg.evaluators.map(role => ({
    role,
    required: role === 'mentor' || role === 'manager',
  }))
}

// ══════════════════════════════════════
// PUBLISH
// ══════════════════════════════════════

export function publishEvaluation(
  evaluationId: string,
  publisherId: string,
): KPIEvaluation | null {
  const ev = evaluationStore.find(e => e.id === evaluationId)
  if (!ev || !['under_review', 'self_submitted'].includes(ev.status)) return null
  const now = new Date().toISOString()

  // Violation deduction category
  for (const cat of ev.category_scores) {
    const catDef = mockKPICategories.find(c => c.id === cat.category_id)
    if (catDef?.type === 'deduction') {
      cat.raw_score = ev.violation_score
      cat.weighted_score = Math.round(cat.raw_score * cat.weight / 100)
    }
  }

  ev.total_score = calculateTotalScore(ev)
  ev.grade_code = determineGrade(ev.total_score)
  ev.status = 'published'
  ev.published_at = now
  ev.published_by = publisherId
  ev.updated_at = now
  persistEvaluations()
  return ev
}

export function publishBatchEvaluations(
  evaluationIds: string[],
  publisherId: string,
): KPIEvaluation[] {
  return evaluationIds
    .map(id => publishEvaluation(id, publisherId))
    .filter((e): e is KPIEvaluation => e !== null)
}

// ══════════════════════════════════════
// APPEAL
// ══════════════════════════════════════

export function appealEvaluation(
  evaluationId: string,
  reason: string,
): KPIEvaluation | null {
  const ev = evaluationStore.find(e => e.id === evaluationId)
  if (!ev || ev.status !== 'published') return null
  ev.status = 'appealed'
  ev.appeal_reason = reason
  ev.appeal_at = new Date().toISOString()
  ev.updated_at = new Date().toISOString()
  persistEvaluations()
  return ev
}

export function reviewEvaluationAppeal(
  evaluationId: string,
  result: 'approved' | 'rejected',
  reviewerId: string,
  note: string,
): KPIEvaluation | null {
  const ev = evaluationStore.find(e => e.id === evaluationId)
  if (!ev || ev.status !== 'appealed') return null
  const now = new Date().toISOString()
  ev.appeal_result = result
  ev.appeal_reviewed_by = reviewerId
  ev.appeal_reviewed_at = now
  ev.manager_comment = (ev.manager_comment || '') + ' | Kết quả KN: ' + note
  ev.status = 'finalized'
  ev.updated_at = now
  persistEvaluations()
  return ev
}

// ══════════════════════════════════════
// PROMOTION
// ══════════════════════════════════════

export function checkPromotionEligibility(
  employeeId: string,
  currentLevel: EmployeeLevel,
): {
  eligible: boolean
  reasons: string[]
  avgScore: number
  lowestScore: number
  monthsMet: number
  requiredMonths: number
} {
  const cfg = mockLevelConfigs.find(c => c.level === currentLevel)
  if (!cfg) return { eligible: false, reasons: ['Cấp bậc không hợp lệ'], avgScore: 0, lowestScore: 0, monthsMet: 0, requiredMonths: 0 }

  // Get last N month evaluations
  const periods = getPreviousPeriods(cfg.min_months_to_promote)
  const evals = periods
    .map(p => getEvaluation(employeeId, p))
    .filter((e): e is KPIEvaluation => !!e && ['published', 'finalized'].includes(e.status))

  const scores = evals.map(e => e.total_score)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const lowestScore = scores.length ? Math.min(...scores) : 0
  const monthsMet = scores.filter(s => s >= cfg.required_kpi_average).length

  // Count violations
  const _violationCount = mockViolationRecords.filter(
    v => v.employee_id === employeeId && ['finalized', 'appeal_rejected'].includes(v.status),
  ).length
  void _violationCount
  const critViolations = mockViolationRecords.filter(
    v => v.employee_id === employeeId &&
    ['finalized', 'appeal_rejected'].includes(v.status) &&
    v.penalty_points >= 30,
  ).length

  const reasons: string[] = []
  let eligible = true

  if (evals.length < cfg.min_months_to_promote) {
    reasons.push(`Chưa đủ ${cfg.min_months_to_promote} tháng đánh giá (có ${evals.length})`)
    eligible = false
  }
  if (avgScore < cfg.required_kpi_average) {
    reasons.push(`KPI trung bình ${avgScore} < ${cfg.required_kpi_average} yêu cầu`)
    eligible = false
  }
  if (critViolations > 0) {
    reasons.push(`Có ${critViolations} lỗi nghiêm trọng`)
    eligible = false
  }

  if (eligible) {
    reasons.push('Đủ điều kiện thăng tiến')
  }

  return { eligible, reasons, avgScore, lowestScore, monthsMet, requiredMonths: cfg.min_months_to_promote }
}

export function createPromotionReview(
  employeeId: string,
  currentLevel: EmployeeLevel,
  targetLevel: EmployeeLevel,
): PromotionReview {
  const check = checkPromotionEligibility(employeeId, currentLevel)
  const cfg = mockLevelConfigs.find(c => c.level === currentLevel)
  const periods = getPreviousPeriods(cfg?.min_months_to_promote ?? 6)
  const evals = periods
    .map(p => getEvaluation(employeeId, p))
    .filter((e): e is KPIEvaluation => !!e)

  const review: PromotionReview = {
    id: `promo-${Date.now()}`,
    employee_id: employeeId,
    current_level: currentLevel,
    target_level: targetLevel,
    review_period: `${periods[periods.length - 1] || ''} to ${periods[0] || ''}`,
    evaluations: evals.map(e => e.id),
    average_score: check.avgScore,
    lowest_score: check.lowestScore,
    violation_count: mockViolationRecords.filter(
      v => v.employee_id === employeeId && ['finalized', 'appeal_rejected'].includes(v.status),
    ).length,
    critical_violations: mockViolationRecords.filter(
      v => v.employee_id === employeeId && v.penalty_points >= 30 && ['finalized', 'appeal_rejected'].includes(v.status),
    ).length,
    eligible: check.eligible,
    eligibility_reasons: check.reasons,
    status: 'pending',
  }

  promotionStore.push(review)
  persistPromotions()
  return review
}

export function approvePromotion(
  reviewId: string,
  approverId: string,
  note: string,
): PromotionReview | null {
  const review = promotionStore.find(r => r.id === reviewId)
  if (!review || review.status !== 'pending') return null
  review.status = 'approved'
  review.decision_by = approverId
  review.decision_at = new Date().toISOString()
  review.decision_note = note
  review.promoted_at = new Date().toISOString()
  review.new_level = review.target_level
  persistPromotions()
  return review
}

export function rejectPromotion(
  reviewId: string,
  approverId: string,
  note: string,
): PromotionReview | null {
  const review = promotionStore.find(r => r.id === reviewId)
  if (!review || review.status !== 'pending') return null
  review.status = 'rejected'
  review.decision_by = approverId
  review.decision_at = new Date().toISOString()
  review.decision_note = note
  persistPromotions()
  return review
}

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

export function getCurrentPeriod(): string {
  return '2026-02'
}

export function getPreviousPeriods(count: number): string[] {
  const base = [2026, 2]
  const periods: string[] = []
  for (let i = 0; i < count; i++) {
    let y = base[0], m = base[1] - i
    while (m <= 0) { m += 12; y-- }
    periods.push(`${y}-${String(m).padStart(2, '0')}`)
  }
  return periods
}
