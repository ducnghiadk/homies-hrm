import { DEFAULT_KPI_POLICY } from './default-policy.ts'
import { HOMIES_CAREER_GRADES, HOMIES_CAREER_TRANSITIONS } from './career-grade-catalog.ts'
import type {
  CareerGradeCode,
  CareerTransitionDefinition,
  EmployeeSkillCertification,
  OperationalSkillCode,
} from './career-grade-types.ts'
import type { KpiEmployeeRef, KpiLevelCode } from './types.ts'

export interface PromotionEligibilityInput {
  employee: KpiEmployeeRef
  target_level: KpiLevelCode
  months_in_level: number
  monthly_scores: Array<{ month: string; total: number; core_average: number; valid_hours: number }>
  critical_incident_dates: string[]
  active_warning_dates: string[]
  unresolved_appeal_months?: string[]
  now: string
}

export interface EligibilityCheck {
  code: string
  label: string
  passed: boolean
  actual: string
  required: string
  blocking: boolean
}

export interface PromotionEligibilityResult {
  status: 'not_eligible' | 'eligible_for_test'
  checks: EligibilityCheck[]
}

export interface CareerGradeTransitionEligibilityInput {
  employee_id: string
  current_grade: CareerGradeCode
  target_grade: CareerGradeCode
  tenure_months: number
  total_hours_in_grade?: number
  monthly_kpi_scores: Array<{ month: string; score: number }>
  certifications: EmployeeSkillCertification[]
  has_critical_incident?: boolean
  unresolved_appeals_count?: number
  transition_override?: Partial<CareerTransitionDefinition>
}

export interface CareerGradeTransitionEligibilityResult {
  status: 'eligible_for_review' | 'not_eligible'
  action_type: 'promotion' | 'cross_skill' | 'demotion'
  missing_skills: OperationalSkillCode[]
  checks: EligibilityCheck[]
}

export function evaluateCareerGradeTransitionEligibility(
  input: CareerGradeTransitionEligibilityInput
): CareerGradeTransitionEligibilityResult {
  const defaultTransition = HOMIES_CAREER_TRANSITIONS.find(
    (t) => t.from === input.current_grade && t.to === input.target_grade
  )

  const currentGradeDef = HOMIES_CAREER_GRADES.find((g) => g.code === input.current_grade)
  const targetGradeDef = HOMIES_CAREER_GRADES.find((g) => g.code === input.target_grade)

  const currentRank = currentGradeDef?.rank || 1
  const targetRank = targetGradeDef?.rank || 1

  let action_type: 'promotion' | 'cross_skill' | 'demotion' = 'promotion'
  if (targetRank < currentRank) {
    action_type = 'demotion'
  } else if (targetRank === currentRank) {
    action_type = 'cross_skill'
  }

  if (!defaultTransition && !input.transition_override) {
    return {
      status: 'not_eligible',
      action_type,
      missing_skills: [],
      checks: [
        {
          code: 'transition_path',
          label: 'Lộ trình chuyển cấp',
          passed: false,
          actual: `${input.current_grade} -> ${input.target_grade}`,
          required: 'Phải có quy định chuyển cấp hợp lệ',
          blocking: true,
        },
      ],
    }
  }

  const transition: CareerTransitionDefinition = {
    id: defaultTransition?.id || `${input.current_grade}_to_${input.target_grade}`,
    from: input.current_grade,
    to: input.target_grade,
    required_tenure_months: input.transition_override?.required_tenure_months ?? defaultTransition?.required_tenure_months ?? 3,
    required_hours_part_time: input.transition_override?.required_hours_part_time ?? defaultTransition?.required_hours_part_time ?? 0,
    required_kpi_consecutive_months: input.transition_override?.required_kpi_consecutive_months ?? defaultTransition?.required_kpi_consecutive_months ?? 2,
    required_kpi_min_score: input.transition_override?.required_kpi_min_score ?? defaultTransition?.required_kpi_min_score ?? 80,
    required_skills: input.transition_override?.required_skills ?? defaultTransition?.required_skills ?? (targetGradeDef?.required_skill_codes || []),
    approval_authority: input.transition_override?.approval_authority ?? defaultTransition?.approval_authority ?? 'store_manager',
    allow_demotion: input.transition_override?.allow_demotion ?? defaultTransition?.allow_demotion ?? false,
  }

  const checks: EligibilityCheck[] = []

  // 1. Thâm niên giữ bậc
  checks.push({
    code: 'tenure_months',
    label: 'Thâm niên giữ bậc tối thiểu',
    passed: input.tenure_months >= transition.required_tenure_months,
    actual: `${input.tenure_months} tháng`,
    required: `>= ${transition.required_tenure_months} tháng`,
    blocking: true,
  })

  // 2. Tổng số giờ tích lũy (nếu có yêu cầu)
  if (transition.required_hours_part_time > 0 && typeof input.total_hours_in_grade === 'number') {
    checks.push({
      code: 'total_hours',
      label: 'Số giờ làm việc tích lũy tối thiểu',
      passed: input.total_hours_in_grade >= transition.required_hours_part_time,
      actual: `${input.total_hours_in_grade} giờ`,
      required: `>= ${transition.required_hours_part_time} giờ`,
      blocking: true,
    })
  }

  // 3. KPI các tháng gần nhất
  const relevantKpiScores = input.monthly_kpi_scores.slice(-transition.required_kpi_consecutive_months)
  const hasEnoughMonths = relevantKpiScores.length >= transition.required_kpi_consecutive_months
  const allMonthsPassed =
    hasEnoughMonths && relevantKpiScores.every((m) => m.score >= transition.required_kpi_min_score)

  const lowestScore = relevantKpiScores.length > 0 ? Math.min(...relevantKpiScores.map((m) => m.score)) : 0

  checks.push({
    code: 'kpi_consecutive_months',
    label: `KPI ${transition.required_kpi_consecutive_months} tháng liên tiếp`,
    passed: allMonthsPassed,
    actual: hasEnoughMonths
      ? `Thấp nhất ${lowestScore} điểm (${relevantKpiScores.map((m) => m.score).join(', ')})`
      : `Chưa đủ ${transition.required_kpi_consecutive_months} tháng dữ liệu KPI (${relevantKpiScores.length} tháng)`,
    required: `>= ${transition.required_kpi_min_score} điểm trong ${transition.required_kpi_consecutive_months} tháng liên tiếp`,
    blocking: true,
  })

  // 4. Chứng nhận kỹ năng bắt buộc
  const achievedSkillCodes = new Set(
    input.certifications
      .filter((c) => c.status === 'achieved')
      .map((c) => c.skill_code)
  )

  const missing_skills = transition.required_skills.filter((s) => !achievedSkillCodes.has(s))

  checks.push({
    code: 'mandatory_skills',
    label: 'Chứng nhận kỹ năng chuyên môn bắt buộc',
    passed: missing_skills.length === 0,
    actual:
      missing_skills.length === 0
        ? 'Đã đạt tất cả chứng chỉ yêu cầu'
        : `Còn thiếu: ${missing_skills.join(', ')}`,
    required: `Bắt buộc đạt: ${transition.required_skills.join(', ')}`,
    blocking: true,
  })

  // 5. Kiểm tra kỷ luật / incident nghiêm trọng
  checks.push({
    code: 'critical_incident',
    label: 'Không vi phạm lỗi vận hành nghiêm trọng',
    passed: !input.has_critical_incident,
    actual: input.has_critical_incident ? 'Có ghi nhận sự vụ vi phạm nghiêm trọng' : 'Không có vi phạm',
    required: 'Không có sự vụ vi phạm nghiêm trọng',
    blocking: true,
  })

  // 6. Kiểm tra khiếu nại chưa giải quyết
  const unresolvedCount = input.unresolved_appeals_count || 0
  checks.push({
    code: 'unresolved_appeals',
    label: 'Không tồn đọng khiếu nại KPI',
    passed: unresolvedCount === 0,
    actual: unresolvedCount > 0 ? `Đang có ${unresolvedCount} khiếu nại chưa xử lý` : 'Không có',
    required: 'Tất cả khiếu nại phải được đóng trước khi xét',
    blocking: true,
  })

  const allPassed = checks.every((c) => c.passed || !c.blocking)

  return {
    status: allPassed ? 'eligible_for_review' : 'not_eligible',
    action_type,
    missing_skills,
    checks,
  }
}

export function countConsecutiveQualifiedMonths(records: Array<{ month: string; qualified: boolean }>): number {
  const qualificationByMonth = new Map<string, boolean>()
  for (const record of records) {
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(record.month)) {
      qualificationByMonth.set(record.month, (qualificationByMonth.get(record.month) ?? true) && record.qualified)
    }
  }

  const months = [...qualificationByMonth.keys()].sort().reverse()
  if (months.length === 0) return 0

  let count = 0
  let expectedMonth = months[0]
  for (const month of months) {
    if (month !== expectedMonth || !qualificationByMonth.get(month)) break
    count += 1
    expectedMonth = previousMonth(month)
  }

  return count
}

export function evaluatePromotionEligibility(input: PromotionEligibilityInput): PromotionEligibilityResult {
  const path = DEFAULT_KPI_POLICY.promotion_paths.find((item) => (
    item.from === input.employee.level_code && item.to === input.target_level
  ))

  if (!path) {
    return {
      status: 'not_eligible',
      checks: [
        {
          code: 'promotion_path',
          label: 'Tuyen thang bac',
          passed: false,
          actual: `${input.employee.level_code} -> ${input.target_level}`,
          required: 'Phai co tuyen thang bac trong policy',
          blocking: true,
        },
      ],
    }
  }

  const averageTotal = average(input.monthly_scores.map((item) => item.total))
  const averageCore = average(input.monthly_scores.map((item) => item.core_average))
  const lowestMonthly = min(input.monthly_scores.map((item) => item.total))
  const lowestHours = min(input.monthly_scores.map((item) => item.valid_hours))
  const highMonthCount = input.monthly_scores.filter((item) => (
    item.total >= (path.required_high_month_score ?? 0)
  )).length

  const incidentCutoff = shiftMonths(input.now, -path.disqualifying_incident_lookback_months)
  const warningCutoff = shiftMonths(input.now, -path.active_warning_lookback_months)
  const hasRecentCriticalIncident = input.critical_incident_dates.some((item) => item >= incidentCutoff)
  const hasActiveWarning = input.active_warning_dates.some((item) => item >= warningCutoff)

  const checks: EligibilityCheck[] = [
    {
      code: 'months_in_level',
      label: 'Thoi gian giu bac hien tai',
      passed: input.months_in_level >= path.minimum_months,
      actual: `${input.months_in_level} thang`,
      required: `>= ${path.minimum_months} thang`,
      blocking: true,
    },
    {
      code: 'average_score',
      label: 'KPI trung binh',
      passed: averageTotal >= path.required_average_score,
      actual: formatScore(averageTotal),
      required: `>= ${formatScore(path.required_average_score)}`,
      blocking: true,
    },
    {
      code: 'minimum_monthly_score',
      label: 'San diem tung thang',
      passed: lowestMonthly >= path.minimum_monthly_score,
      actual: formatScore(lowestMonthly),
      required: `>= ${formatScore(path.minimum_monthly_score)}`,
      blocking: true,
    },
    {
      code: 'core_group_average',
      label: 'Trung binh nhom trong yeu',
      passed: averageCore >= path.core_group_average_score,
      actual: formatScore(averageCore),
      required: `>= ${formatScore(path.core_group_average_score)}`,
      blocking: true,
    },
    {
      code: 'minimum_valid_hours',
      label: 'Gio hop le moi thang',
      passed: lowestHours >= DEFAULT_KPI_POLICY.minimum_monthly_hours_for_full_kpi,
      actual: `${lowestHours} gio`,
      required: `>= ${DEFAULT_KPI_POLICY.minimum_monthly_hours_for_full_kpi} gio`,
      blocking: true,
    },
  ]

  if (typeof path.required_high_months === 'number' && typeof path.required_high_month_score === 'number') {
    checks.push({
      code: 'required_high_months',
      label: 'So thang dat muc tot',
      passed: highMonthCount >= path.required_high_months,
      actual: `${highMonthCount} thang`,
      required: `>= ${path.required_high_months} thang tu ${formatScore(path.required_high_month_score)}`,
      blocking: true,
    })
  }

  checks.push(
    {
      code: 'critical_incident_window',
      label: 'Incident nghiem trong trong thoi gian cam',
      passed: !hasRecentCriticalIncident,
      actual: hasRecentCriticalIncident ? 'Co incident trong cua so cam' : 'Khong co',
      required: `${path.disqualifying_incident_lookback_months} thang gan nhat khong co`,
      blocking: true,
    },
    {
      code: 'active_warning_window',
      label: 'Canh bao dang con hieu luc',
      passed: !hasActiveWarning,
      actual: hasActiveWarning ? 'Con canh bao trong cua so xet' : 'Khong co',
      required: `${path.active_warning_lookback_months} thang gan nhat khong co`,
      blocking: true,
    },
    {
      code: 'unresolved_appeals',
      label: 'Khong co khieu nai dang cho xu ly',
      passed: (input.unresolved_appeal_months ?? []).length === 0,
      actual: (input.unresolved_appeal_months ?? []).length > 0
        ? `Dang co khieu nai tai thang ${(input.unresolved_appeal_months ?? []).join(', ')}`
        : 'Khong co khieu nai ton dong',
      required: 'Tat ca khieu nai phai duoc giai quyet truoc khi xet',
      blocking: true,
    }
  )

  return {
    status: checks.every((item) => item.passed || !item.blocking) ? 'eligible_for_test' : 'not_eligible',
    checks,
  }
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function min(values: number[]): number {
  if (values.length === 0) return 0
  return Math.min(...values)
}

function formatScore(value: number): string {
  return value.toFixed(2)
}

function shiftMonths(isoDate: string, monthDelta: number): string {
  const date = new Date(isoDate)
  const shifted = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + monthDelta,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  ))

  return shifted.toISOString()
}

function previousMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 2, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

