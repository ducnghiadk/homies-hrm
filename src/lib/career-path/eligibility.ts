// Xem nhân viên đã đủ điều kiện xét lên bậc kế tiếp chưa (chỉ để hiển thị).
// Không tự nâng bậc, không đổi lương: nâng bậc phải qua đề xuất và duyệt.

import { CAREER_GRADE_CODES, gradeOrder, type CareerGradeCode, type CareerPathSettings, type CareerPositionCode, type HoursSource } from './settings.ts'
import type { CareerHoursBreakdown } from './hours.ts'
import type { CareerKpiStats } from './kpi.ts'
import { applicableSkills, type ApplicableBucket, type CurrentSkillLevel } from './assessment.ts'

export interface EligibilityCheck {
  key: 'setup' | 'months' | 'hours' | ApplicableBucket | KpiCheckKey
  label: string
  ok: boolean
  detail: string
}

export type KpiCheckKey = 'kpi_late' | 'kpi_late_minutes' | 'kpi_no_show' | 'kpi_missing_checkout' | 'kpi_error_points' | 'kpi_serious'

export const isKpiCheck = (c: Pick<EligibilityCheck, 'key'>) => String(c.key).startsWith('kpi_')

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
  /** Chỉ số vận hành trong N tháng gần nhất. Không truyền thì không xét KPI. */
  kpi?: CareerKpiStats
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

/** Tổng giờ công đã ghi nhận trong hệ thống của 1 nhân viên (tùy chọn: chỉ tính từ ngày fromDate trở đi). */
export function sumWorkedHours(
  logs: { employee_id: string; total_hours?: number; date?: string }[],
  employeeId: string,
  fromDate?: string,
): number {
  let total = 0
  for (const log of logs) {
    if (log.employee_id !== employeeId) continue
    if (fromDate && String(log.date || '') < fromDate) continue
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
  if (!settings.configured) {
    return {
      current: input.grade,
      next,
      checks: [{ key: 'setup', label: 'Chưa cài đặt lộ trình', ok: false, detail: 'CEO/HR cần nhập và lưu cài đặt lộ trình trước khi hệ thống xét bậc' }],
      ready: false,
    }
  }

  // Mốc bằng 0 nghĩa là CEO/HR không xét tiêu chí đó.
  const checks: EligibilityCheck[] = []
  if (target.min_months > 0) {
    checks.push({ key: 'months', label: 'Thời gian làm việc', ok: input.months >= target.min_months, detail: `${input.months}/${target.min_months} tháng` })
  }
  if (target.min_hours > 0) {
    checks.push({ key: 'hours', label: 'Số giờ đã làm', ok: input.hours >= target.min_hours, detail: `${input.hours}/${target.min_hours} giờ` })
  }

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
  checks.push(...kpiChecks(settings, target.kpi, input.kpi))
  return { current: input.grade, next, checks, ready: checks.every((c) => c.ok) }
}

function kpiChecks(settings: CareerPathSettings, limit: CareerPathSettings['grades'][number]['kpi'] | undefined, stats: CareerKpiStats | undefined): EligibilityCheck[] {
  const months = settings.kpi?.lookback_months || 0
  if (!limit || !stats || months < 1) return []
  const span = `trong ${months} tháng gần nhất`
  const rows: [KpiCheckKey, string, number | null, number, string][] = [
    ['kpi_late', 'Số lần đi trễ', limit.max_late_count, stats.late_count, 'lần'],
    ['kpi_late_minutes', 'Tổng số phút đi trễ', limit.max_late_minutes, stats.late_minutes, 'phút'],
    ['kpi_no_show', 'Số ngày vắng ca không phép', limit.max_no_show, stats.no_show_count, 'ngày'],
    ['kpi_missing_checkout', 'Số lần quên chấm công tan ca', limit.max_missing_checkout, stats.missing_checkout_count, 'lần'],
    ['kpi_error_points', 'Điểm lỗi cá nhân đã duyệt', limit.max_error_points, stats.error_points, 'điểm'],
  ]
  const out: EligibilityCheck[] = []
  for (const [key, label, max, value, unit] of rows) {
    if (max === null || max === undefined) continue
    out.push({ key, label, ok: value <= max, detail: `${value} ${unit} ${span} (tối đa ${max})` })
  }
  if (limit.block_serious_error) {
    out.push({
      key: 'kpi_serious',
      label: 'Không có lỗi nghiêm trọng',
      ok: stats.serious_error_count === 0,
      detail: stats.serious_error_count === 0 ? `Không có lỗi nghiêm trọng ${span}` : `${stats.serious_error_count} lỗi nghiêm trọng đã duyệt ${span}`,
    })
  }
  return out
}

/** Tóm tắt tiến độ 1 nhân viên do API /api/career-path/assessments trả về. */
export interface CareerProgressSummary {
  employee_id: string
  levels: Record<string, CurrentSkillLevel>
  assessments_count: number
  last_assessed_at: string
  months: number
  hours: number
  /** Giờ được tính / bị loại theo Cài đặt (để nhân viên và quản lý thấy rõ vì sao ra con số này). */
  hours_breakdown?: CareerHoursBreakdown & { carried: number; source: HoursSource }
  /** Chỉ số vận hành dùng để xét KPI (chỉ có khi đã cài số tháng xét KPI). */
  kpi?: CareerKpiStats
  /** BSC cửa hàng kỳ đã công bố gần nhất: chỉ để tham khảo, không dùng để xét bậc. */
  store_bsc?: { store_name: string; period: string; coefficient: number | null; unlocked: boolean }
  eligibility: EligibilityResult
}
