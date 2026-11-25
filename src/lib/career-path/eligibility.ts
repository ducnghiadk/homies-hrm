// Xem nhân viên đã đủ điều kiện xét lên bậc kế tiếp chưa (chỉ để hiển thị).
// Không tự nâng bậc, không đổi lương: nâng bậc phải qua đề xuất và duyệt.

import { CAREER_GRADE_CODES, gradeOrder, type CareerGradeCode, type CareerPathSettings, type CareerPositionCode } from './settings.ts'
import { applicableSkills, type ApplicableBucket, type CurrentSkillLevel } from './assessment.ts'

export interface EligibilityCheck {
  key: 'months' | 'hours' | ApplicableBucket
  label: string
  ok: boolean
  detail: string
}

export interface EligibilityResult {
  current: CareerGradeCode
  next: CareerGradeCode | null
  checks: EligibilityCheck[]
  ready: boolean
}

export interface EligibilityInput {
  grade: CareerGradeCode
  position: CareerPositionCode
  levels: Record<string, CurrentSkillLevel>
  months: number
  hours: number
}

const BUCKET_LABEL: Record<ApplicableBucket, string> = {
  main: 'Kỹ năng chính của vị trí chính',
  support: 'Kỹ năng hỗ trợ vị trí còn lại',
  second: 'Kỹ năng chính của vị trí thứ hai',
  common: 'Tiêu chuẩn chung (ATTP, SOP)',
  advanced: 'Năng lực nâng cao',
}

/** Số tháng tròn từ ngày bắt đầu (YYYY-MM-DD) tới hôm nay (YYYY-MM-DD). */
export function fullMonthsBetween(start: string, today: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/
  const a = m.exec(start || '')
  const b = m.exec(today || '')
  if (!a || !b) return 0
  let months = (Number(b[1]) - Number(a[1])) * 12 + (Number(b[2]) - Number(a[2]))
  if (Number(b[3]) < Number(a[3])) months -= 1
  return Math.max(0, months)
}

/** Tổng giờ công đã ghi nhận trong hệ thống của 1 nhân viên. */
export function sumWorkedHours(logs: { employee_id: string; total_hours?: number }[], employeeId: string): number {
  let total = 0
  for (const log of logs) {
    if (log.employee_id !== employeeId) continue
    const h = Number(log.total_hours)
    if (Number.isFinite(h) && h > 0) total += h
  }
  return Math.round(total * 100) / 100
}

export function evaluateNextGrade(settings: CareerPathSettings, input: EligibilityInput): EligibilityResult {
  const idx = gradeOrder(input.grade)
  const next = idx >= 0 && idx < CAREER_GRADE_CODES.length - 1 ? CAREER_GRADE_CODES[idx + 1] : null
  if (!next) return { current: input.grade, next: null, checks: [], ready: false }
  const target = settings.grades.find((g) => g.code === next)
  if (!target) return { current: input.grade, next: null, checks: [], ready: false }

  const checks: EligibilityCheck[] = [
    { key: 'months', label: 'Thời gian làm việc', ok: input.months >= target.min_months, detail: `${input.months}/${target.min_months} tháng` },
    { key: 'hours', label: 'Số giờ đã làm', ok: input.hours >= target.min_hours, detail: `${input.hours}/${target.min_hours} giờ` },
  ]

  const skills = applicableSkills(settings, input.position)
  const r = target.requirement
  const bucketMin: [ApplicableBucket, number | null][] = [
    ['main', r.main_min_level],
    ['support', r.support_min_level],
    ['second', r.second_min_level],
    ['advanced', r.advanced_min_level],
    ['common', r.common_required ? settings.common_pass_level : null],
  ]
  for (const [bucket, min] of bucketMin) {
    if (min === null || min === undefined) continue
    const list = skills.filter((s) => s.bucket === bucket)
    const passed = list.filter(({ skill }) => (input.levels[skill.code]?.level ?? -1) >= min).length
    checks.push({
      key: bucket,
      label: BUCKET_LABEL[bucket],
      ok: passed === list.length,
      detail: list.length === 0 ? 'Chưa có kỹ năng nào trong nhóm này' : `${passed}/${list.length} kỹ năng đạt mức ${min} trở lên`,
    })
  }
  return { current: input.grade, next, checks, ready: checks.every((c) => c.ok) }
}

/** Tóm tắt tiến độ 1 nhân viên do API /api/career-path/assessments trả về. */
export interface CareerProgressSummary {
  employee_id: string
  levels: Record<string, CurrentSkillLevel>
  assessments_count: number
  last_assessed_at: string
  months: number
  hours: number
  eligibility: EligibilityResult
}
