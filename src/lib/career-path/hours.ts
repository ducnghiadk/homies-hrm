// Tính số giờ làm dùng để xét lên bậc, theo cách CEO/HR chọn trong Cài đặt lộ trình (hàm thuần, có test).
// Giờ của mỗi lượt chấm công lấy từ total_hours: đây là giờ đã tính theo Cài đặt vận hành
// (đến sớm / ở muộn, làm tròn) giống hệt bảng lương, nên xét bậc và trả lương dùng cùng một con số.

import type { HoursSource, LegacyHoursRule } from './settings.ts'

export interface CareerAttendanceLog {
  employee_id: string
  date?: string
  total_hours?: number
  /** Lịch đã chốt / lịch rảnh / không có ca. Dữ liệu cũ (iPOS) không có trường này. */
  schedule_source?: 'official' | 'availability' | 'none'
  off_schedule?: boolean
  /** Quản lý đã ghi nhận / duyệt lượt chấm công ngoài lịch này. */
  off_schedule_approved_by?: string
}

export interface CareerHoursOptions {
  source: HoursSource
  legacy: LegacyHoursRule
  /** Chỉ tính từ ngày này (YYYY-MM-DD) trở đi. */
  fromDate?: string
  /** Các ngày (YYYY-MM-DD) nhân viên có đơn bổ sung / giải trình chấm công đã được duyệt. */
  approvedDates?: Set<string>
}

export interface CareerHoursBreakdown {
  /** Tổng giờ được tính (chưa gồm giờ HR nhập lúc xếp bậc). */
  counted: number
  /** Giờ trong lịch đã chốt. */
  official: number
  /** Giờ ngoài lịch được quản lý duyệt (đã tính). */
  approved_off_schedule: number
  /** Giờ ngoài lịch chưa được duyệt (không tính). */
  off_schedule_excluded: number
  /** Giờ dữ liệu cũ không biết có trong lịch hay không (đã tính). */
  legacy_counted: number
  /** Giờ dữ liệu cũ bị bỏ qua theo Cài đặt. */
  legacy_excluded: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function computeCareerHours(logs: CareerAttendanceLog[], employeeId: string, opts: CareerHoursOptions): CareerHoursBreakdown {
  const b: CareerHoursBreakdown = { counted: 0, official: 0, approved_off_schedule: 0, off_schedule_excluded: 0, legacy_counted: 0, legacy_excluded: 0 }
  for (const log of logs) {
    if (log.employee_id !== employeeId) continue
    if (opts.fromDate && String(log.date || '') < opts.fromDate) continue
    const h = Number(log.total_hours)
    // Chỉ lượt đã tan ca (có giờ công) mới được tính.
    if (!Number.isFinite(h) || h <= 0) continue

    if (opts.source === 'all_attendance') {
      b.counted += h
      continue
    }
    const marked = log.schedule_source !== undefined || log.off_schedule !== undefined
    if (!marked) {
      if (opts.legacy === 'count') {
        b.legacy_counted += h
        b.counted += h
      } else {
        b.legacy_excluded += h
      }
      continue
    }
    const inSchedule = log.schedule_source === 'official' && log.off_schedule !== true
    if (inSchedule) {
      b.official += h
      b.counted += h
      continue
    }
    const approved = Boolean(log.off_schedule_approved_by) || Boolean(log.date && opts.approvedDates?.has(log.date))
    if (opts.source === 'confirmed_plus_approved' && approved) {
      b.approved_off_schedule += h
      b.counted += h
    } else {
      b.off_schedule_excluded += h
    }
  }
  return {
    counted: round2(b.counted),
    official: round2(b.official),
    approved_off_schedule: round2(b.approved_off_schedule),
    off_schedule_excluded: round2(b.off_schedule_excluded),
    legacy_counted: round2(b.legacy_counted),
    legacy_excluded: round2(b.legacy_excluded),
  }
}
