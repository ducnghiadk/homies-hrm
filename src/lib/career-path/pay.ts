// Tiền cộng thêm theo bậc (Playbook V7) cho một kỳ lương.
// Bậc trong kỳ lấy theo lịch sử đổi bậc (ngày hiệu lực), nên nâng bậc giữa tháng được tính đúng từ ngày đó.
// Part-time: cộng theo giờ làm thực tế x mức cộng/giờ của bậc tại ngày làm.
// Full-time: theo Cài đặt "cách cộng lương Full-time" (cố định theo tháng, chia theo số ngày ở mỗi bậc; hoặc theo giờ như Part-time).

import { CAREER_GRADE_CODES, gradeOrder, type CareerGradeCode, type CareerPathSettings, type FullTimePayMethod } from './settings.ts'
import type { CareerGradeHistoryEntry, CareerPlacement } from './placement.ts'

/** Một đoạn thời gian nhân viên giữ 1 bậc trong kỳ (từ `from` tới `to`, cả hai đầu, YYYY-MM-DD). */
export interface CareerPaySegment {
  grade: CareerGradeCode
  from: string
  to: string
  /** Tổng mức cộng/giờ so với G1 (cộng dồn các bậc tới bậc này). */
  hourly_bonus_vnd: number
  /** Mức cộng/tháng so với G1 cho Full-time khi chọn cách cố định. */
  ft_monthly_vnd: number
}

export interface CareerPayPlan {
  employee_id: string
  ft_pay_method: FullTimePayMethod
  segments: CareerPaySegment[]
}

/** Tổng mức cộng/giờ của 1 bậc = cộng dồn "cộng thêm so với bậc liền trước" từ T0 tới bậc đó. */
export function cumulativeHourlyBonus(settings: CareerPathSettings, grade: CareerGradeCode): number {
  const upTo = gradeOrder(grade)
  return settings.grades
    .filter((g) => gradeOrder(g.code) <= upTo)
    .reduce((sum, g) => sum + (Number(g.hourly_step_vnd) || 0), 0)
}

const addDays = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const daysInclusive = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1

/** Chia kỳ [start, end] thành các đoạn theo bậc. Ngày chưa có bậc (trước lần xếp đầu) không có đoạn. */
export function buildPaySegments(
  settings: CareerPathSettings,
  placement: CareerPlacement,
  history: CareerGradeHistoryEntry[],
  periodStart: string,
  periodEnd: string
): CareerPaySegment[] {
  const changes = history
    .filter((h) => h.employee_id === placement.employee_id && CAREER_GRADE_CODES.includes(h.to_grade) && h.effective_date)
    .map((h) => ({ date: h.effective_date, grade: h.to_grade, at: h.created_at || '' }))
  if (changes.length === 0) changes.push({ date: placement.effective_date, grade: placement.grade_code, at: '' })
  // Cùng ngày hiệu lực: bản ghi tạo sau thắng (vd: điều chỉnh lại).
  changes.sort((a, b) => a.date.localeCompare(b.date) || a.at.localeCompare(b.at))

  const gradeOn = (day: string): CareerGradeCode | null => {
    let g: CareerGradeCode | null = null
    for (const c of changes) if (c.date <= day) g = c.grade
    return g
  }
  const boundaries = [periodStart, ...changes.map((c) => c.date).filter((d) => d > periodStart && d <= periodEnd)]
  const starts = [...new Set(boundaries)].sort()
  const segments: CareerPaySegment[] = []
  starts.forEach((from, i) => {
    const to = i + 1 < starts.length ? addDays(starts[i + 1], -1) : periodEnd
    const grade = gradeOn(from)
    if (!grade) return
    const cfg = settings.grades.find((g) => g.code === grade)
    const last = segments[segments.length - 1]
    if (last && last.grade === grade) { last.to = to; return }
    segments.push({ grade, from, to, hourly_bonus_vnd: cumulativeHourlyBonus(settings, grade), ft_monthly_vnd: Number(cfg?.ft_monthly_vs_g1_vnd) || 0 })
  })
  return segments
}

export interface CareerPayLine {
  name: string
  amount: number
}

/**
 * Tính tiền cộng theo bậc trong kỳ từ kế hoạch đoạn bậc + giờ làm thực tế.
 * `workedHours` là danh sách {date, hours} của nhân viên trong kỳ (đã lọc ca hợp lệ).
 */
export function computeCareerPay(
  plan: CareerPayPlan,
  opts: { isPartTime: boolean; periodStart: string; periodEnd: string; workedHours: { date: string; hours: number }[] }
): CareerPayLine[] {
  const byHours = opts.isPartTime || plan.ft_pay_method === 'hourly_x_hours'
  const lines: CareerPayLine[] = []
  for (const seg of plan.segments) {
    let amount = 0
    let detail = ''
    if (byHours) {
      const hours = opts.workedHours
        .filter((w) => w.date >= seg.from && w.date <= seg.to && Number.isFinite(w.hours) && w.hours > 0)
        .reduce((sum, w) => sum + w.hours, 0)
      amount = Math.round(hours * seg.hourly_bonus_vnd)
      detail = `${Math.round(hours * 100) / 100} giờ x ${seg.hourly_bonus_vnd.toLocaleString('vi-VN')}đ`
    } else {
      const total = daysInclusive(opts.periodStart, opts.periodEnd)
      const days = daysInclusive(seg.from, seg.to)
      amount = Math.round((seg.ft_monthly_vnd * days) / total)
      detail = days === total ? 'cả kỳ' : `${days}/${total} ngày`
    }
    if (amount > 0) lines.push({ name: `Cộng lương bậc ${seg.grade} (${detail})`, amount })
  }
  return lines
}
