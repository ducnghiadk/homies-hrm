import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, canAccessStore, isChainWideRole, hasRequiredRole } from '@/lib/server/auth-helper'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { normalizeCareerPathSettings } from '@/lib/career-path/settings'
import { applyAssessment, type AssessmentInput } from '@/lib/career-path/assessment'
import { buildCareerSummary as buildSummary, careerViewScope } from '@/lib/server/career-progress'
import { getVnDateString } from '@/lib/time/vn-time'

/**
 * Đánh giá kỹ năng nhân viên (Playbook V7).
 * GET: xem theo quyền (toàn chuỗi / chi nhánh / bản thân). ?employee_id=... trả kèm các phiếu đánh giá.
 *      Kèm "điều kiện xét bậc kế tiếp" chỉ để tham khảo, không tự nâng bậc.
 * POST: vai trò được đánh giá (theo Cài đặt) chấm kỹ năng cho nhân viên đã được xếp bậc, trong phạm vi chi nhánh.
 */

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const user = gate.user
  try {
    const db = await getServerDb()
    const settings = normalizeCareerPathSettings(db.career_settings)
    const canSee = careerViewScope(db, user)
    const today = getVnDateString()
    const canAssess = hasRequiredRole(user.role, settings.approval.assessor_roles)
    const placements = db.career_placements || []
    const employeeId = req.nextUrl.searchParams.get('employee_id')
    if (employeeId) {
      if (!canSee(employeeId)) {
        return NextResponse.json({ success: false, message: 'Bạn không có quyền xem đánh giá của nhân viên này.' }, { status: 403 })
      }
      const placement = placements.find((p) => p.employee_id === employeeId)
      return NextResponse.json({
        success: true,
        can_assess: canAssess,
        summary: placement ? buildSummary(db, settings, placement, today) : null,
        entries: (db.career_skill_assessments || [])
          .filter((e) => e.employee_id === employeeId)
          .sort((a, b) => b.assessed_at.localeCompare(a.assessed_at)),
      })
    }
    return NextResponse.json({
      success: true,
      can_assess: canAssess,
      summaries: placements.filter((p) => canSee(p.employee_id)).map((p) => buildSummary(db, settings, p, today)),
    })
  } catch (error) {
    console.error('[API /api/career-path/assessments GET] Error:', error)
    return NextResponse.json({ success: false, message: 'Không tải được đánh giá kỹ năng.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const user = gate.user
  try {
    const body = (await req.json().catch(() => null)) as AssessmentInput | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Thiếu dữ liệu đánh giá.' }, { status: 400 })
    }
    const db = await getServerDb()
    const settings = normalizeCareerPathSettings(db.career_settings)
    if (!hasRequiredRole(user.role, settings.approval.assessor_roles)) {
      return NextResponse.json({ success: false, message: 'Vai trò của bạn chưa được phép đánh giá kỹ năng (xem Cài đặt lộ trình).' }, { status: 403 })
    }
    const employee = db.employees.find((e) => e.id === body.employee_id)
    if (!employee) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy nhân viên.' }, { status: 404 })
    }
    if (!isChainWideRole(user.role) && !canAccessStore(user, employee.store_id)) {
      return NextResponse.json({ success: false, message: 'Bạn chỉ được đánh giá nhân viên thuộc chi nhánh của mình.' }, { status: 403 })
    }
    const placement = (db.career_placements || []).find((p) => p.employee_id === employee.id)
    if (!placement) {
      return NextResponse.json({ success: false, message: 'Nhân viên chưa được xếp bậc. HR cần xếp bậc trước khi đánh giá.' }, { status: 400 })
    }
    const result = applyAssessment(
      db.career_skill_assessments || [],
      body,
      settings,
      placement.primary_position,
      { id: user.userId, name: user.employee?.full_name || user.email }
    )
    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.errors[0], errors: result.errors }, { status: 400 })
    }
    db.career_skill_assessments = result.entries
    await saveServerDb(db)
    return NextResponse.json({
      success: true,
      entry: result.entry,
      summary: buildSummary(db, settings, placement, getVnDateString()),
    })
  } catch (error) {
    console.error('[API /api/career-path/assessments POST] Error:', error)
    return NextResponse.json({ success: false, message: 'Không lưu được đánh giá kỹ năng.' }, { status: 500 })
  }
}
