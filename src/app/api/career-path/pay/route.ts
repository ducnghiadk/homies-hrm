import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth-helper'
import { getServerDb } from '@/lib/server/db'
import { normalizeCareerPathSettings } from '@/lib/career-path/settings'
import { buildPaySegments, type CareerPayPlan } from '@/lib/career-path/pay'
import { careerViewScope } from '@/lib/server/career-progress'

/**
 * Kế hoạch cộng lương theo bậc (Playbook V7) cho 1 kỳ lương: GET ?period=YYYY-MM.
 * Trả các đoạn bậc trong kỳ; bảng lương tự nhân với giờ làm / số ngày. `enabled` = false khi Cài đặt chưa bật liên kết.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const period = req.nextUrl.searchParams.get('period') || ''
  const m = /^(\d{4})-(\d{2})$/.exec(period)
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) {
    return NextResponse.json({ success: false, message: 'Kỳ lương không hợp lệ (định dạng YYYY-MM).' }, { status: 400 })
  }
  try {
    const db = await getServerDb()
    const settings = normalizeCareerPathSettings(db.career_settings)
    const start = `${period}-01`
    const end = new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).toISOString().slice(0, 10)
    const canSee = careerViewScope(db, gate.user)
    const history = db.career_grade_history || []
    // Chỉ cộng lương khi CEO/HR đã lưu cài đặt lộ trình và bật liên kết bảng lương.
    const enabled = settings.payroll_link_enabled && settings.configured
    const plans: CareerPayPlan[] = enabled
      ? (db.career_placements || [])
          .filter((p) => canSee(p.employee_id))
          .map((p) => ({
            employee_id: p.employee_id,
            ft_pay_method: settings.ft_pay_method,
            ft_mid_month: settings.rules.ft_mid_month,
            taxable: settings.rules.pay_taxable,
            segments: buildPaySegments(settings, p, history, start, end),
          }))
          .filter((plan) => plan.segments.length > 0)
      : []
    return NextResponse.json({ success: true, enabled, configured: settings.configured, period, period_start: start, period_end: end, ft_pay_method: settings.ft_pay_method, plans })
  } catch (error) {
    console.error('[API /api/career-path/pay GET] Error:', error)
    return NextResponse.json({ success: false, message: 'Không tải được cộng lương theo bậc.' }, { status: 500 })
  }
}
