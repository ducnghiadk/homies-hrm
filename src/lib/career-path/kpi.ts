// Đếm các chỉ số vận hành (đi trễ, vắng ca, quên tan ca, lỗi cá nhân) của 1 nhân viên
// trong N tháng gần nhất, dùng làm điều kiện KPI khi xét lên bậc. Hàm thuần, có test.

export interface KpiAttendanceLog {
  employee_id: string
  date?: string
  status?: string
  is_late?: boolean
  late_minutes?: number
}

export interface KpiScheduleRow {
  employee_id: string
  date: string
  status?: string
}

export interface KpiErrorLog {
  employee_id?: string
  log_type?: string
  points?: number
  occurred_at?: string
  approval_status?: string
  locks_personal_bonus?: boolean
}

export interface KpiLeaveRequest {
  employee_id: string
  type?: string
  status?: string
  date?: string
}

export interface CareerKpiStats {
  /** Ngày bắt đầu khoảng xét (YYYY-MM-DD), rỗng = không giới hạn. */
  from: string
  /** Ngày kết thúc khoảng xét (hôm qua, YYYY-MM-DD). */
  to: string
  late_count: number
  late_minutes: number
  no_show_count: number
  missing_checkout_count: number
  error_points: number
  serious_error_count: number
}

/** Trạng thái lỗi BSC coi là đã duyệt chính thức (giống cách tính thưởng BSC). */
const APPROVED_ERROR_STATUSES = new Set(['approved_ceo', 'confirmed'])

const ymd = (v: unknown) => String(v || '').slice(0, 10)

/** Lùi `months` tháng từ ngày `today` (YYYY-MM-DD). months <= 0 → '' (không giới hạn). */
export function monthsBefore(today: string, months: number): string {
  if (!months || months <= 0) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(today)
  if (!m) return ''
  const total = Number(m[1]) * 12 + (Number(m[2]) - 1) - months
  const y = Math.floor(total / 12)
  const mo = (total % 12) + 1
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  const d = Math.min(Number(m[3]), lastDay)
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function dayBefore(today: string): string {
  const d = new Date(`${today}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return today
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function computeCareerKpiStats(
  data: {
    attendance: KpiAttendanceLog[]
    schedules: KpiScheduleRow[]
    errors: KpiErrorLog[]
    requests?: KpiLeaveRequest[]
  },
  employeeId: string,
  opts: { today: string; lookbackMonths: number },
): CareerKpiStats {
  const from = monthsBefore(opts.today, opts.lookbackMonths)
  // Không tính hôm nay: ca hôm nay có thể chưa tới giờ hoặc chưa tan ca.
  const to = dayBefore(opts.today)
  const inRange = (date: string) => Boolean(date) && (!from || date >= from) && date <= to

  const stats: CareerKpiStats = { from, to, late_count: 0, late_minutes: 0, no_show_count: 0, missing_checkout_count: 0, error_points: 0, serious_error_count: 0 }

  const workedDates = new Set<string>()
  for (const log of data.attendance) {
    if (log.employee_id !== employeeId) continue
    const date = ymd(log.date)
    if (date) workedDates.add(date)
    if (!inRange(date)) continue
    const lateMin = Number(log.late_minutes) || 0
    if (log.is_late || log.status === 'late' || lateMin > 0) {
      stats.late_count += 1
      stats.late_minutes += Math.max(0, lateMin)
    }
    if (log.status === 'missing_checkout') stats.missing_checkout_count += 1
  }

  // Ngày nghỉ phép đã duyệt không tính là vắng ca.
  const leaveDates = new Set(
    (data.requests || [])
      .filter((r) => r.employee_id === employeeId && r.type === 'leave' && r.status === 'APPROVED' && r.date)
      .map((r) => ymd(r.date))
  )
  const scheduledDates = new Set<string>()
  for (const s of data.schedules) {
    if (s.employee_id !== employeeId || s.status !== 'published') continue
    const date = ymd(s.date)
    if (inRange(date)) scheduledDates.add(date)
  }
  for (const date of scheduledDates) {
    if (!workedDates.has(date) && !leaveDates.has(date)) stats.no_show_count += 1
  }

  for (const e of data.errors) {
    if (e.employee_id !== employeeId || e.log_type !== 'personal') continue
    if (!APPROVED_ERROR_STATUSES.has(String(e.approval_status || ''))) continue
    if (!inRange(ymd(e.occurred_at))) continue
    stats.error_points += Math.max(0, Number(e.points) || 0)
    if (e.locks_personal_bonus) stats.serious_error_count += 1
  }
  stats.error_points = Math.round(stats.error_points * 100) / 100
  return stats
}
