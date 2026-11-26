// Nối cộng lương theo bậc (lộ trình V7) vào bảng lương, tách riêng khỏi payroll-engine.
// Engine chỉ cần: tải kế hoạch 1 lần mỗi kỳ, rồi truyền kết quả vào `extraAllowances` của từng nhân viên.

import type { PayrollAttendanceRecord } from '../services/attendance/attendance-service'
import { computeCareerPay, type CareerPayPlan } from './pay'

/** Kế hoạch cộng lương theo bậc (lộ trình V7) của kỳ. null khi tắt liên kết hoặc không tải được (bảng lương giữ nguyên). */
export async function fetchCareerPayPlans(periodStart: string): Promise<Map<string, CareerPayPlan> | null> {
  if (typeof window === 'undefined') return null
  try {
    const res = await fetch(`/api/career-path/pay?period=${periodStart.slice(0, 7)}`, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || !json?.success || !json.enabled) return null
    return new Map(((json.plans || []) as CareerPayPlan[]).map(plan => [plan.employee_id, plan]))
  } catch (error) {
    console.warn('[Payroll] Không tải được cộng lương theo bậc, bỏ qua:', error)
    return null
  }
}

export function careerAllowancesFor(
  plans: Map<string, CareerPayPlan> | null,
  employeeId: string,
  isPartTime: boolean,
  periodStart: string,
  periodEnd: string,
  records: PayrollAttendanceRecord[],
) {
  const plan = plans?.get(employeeId)
  if (!plan) return undefined
  // Chỉ tính giờ của ca đã đóng và đã duyệt, giống cách tính giờ công.
  const workedHours = records
    .filter(r => r.employee_id === employeeId && !r.soCaChoDuyet && r.trang_thai_db !== 'cho_duyet' && !r.chuaCheckOut && Boolean(r.check_out_time)
      && (r.status === 'on_time' || r.status === 'late' || r.status === 'early'))
    .map(r => ({ date: r.date, hours: r.total_hours || 0 }))
  return computeCareerPay(plan, { isPartTime, periodStart, periodEnd, workedHours })
}
