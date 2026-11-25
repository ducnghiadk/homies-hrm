import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, canAccessStore, isChainWideRole, hasRequiredRole, MANAGER_ROLES, type AuthenticatedUser } from '@/lib/server/auth-helper'
import { getServerDb, saveServerDb, type ServerDatabaseSchema } from '@/lib/server/db'
import { normalizeCareerPathSettings, type CareerPathSettings } from '@/lib/career-path/settings'
import { applyAssessment, currentSkillLevels, type AssessmentInput } from '@/lib/career-path/assessment'
import { evaluateNextGrade, fullMonthsBetween, sumWorkedHours } from '@/lib/career-path/eligibility'
import type { CareerPlacement } from '@/lib/career-path/placement'
import { getVnDateString } from '@/lib/time/vn-time'

/**
 * Đánh giá kỹ năng nhân viên (Playbook V7).
 * GET: xem theo quyền (toàn chuỗi / chi nhánh / bản thân). ?employee_id=... trả kèm các phiếu đánh giá.
 *      Kèm "điều kiện xét bậc kế tiếp" chỉ để tham khảo, không tự nâng bậc.
 * POST: vai trò được đánh giá (theo Cài đặt) chấm kỹ năng cho nhân viên đã được xếp bậc, trong phạm vi chi nhánh.
 */

function buildSummary(db: ServerDatabaseSchema, settings: CareerPathSettings, placement: CareerPlacement, today: string) {
  const entries = db.career_skill_assessments || []
  const employee = db.employees.find((e) => e.id === placement.employee_id)
  const levels = currentSkillLevels(entries, placement.employee_id)
  const mine = entries.filter((e) => e.employee_id === placement.employee_id)
  const months = fullMonthsBetween(employee?.hire_date || placement.effective_date, today)
  const hours = Math.round((placement.carried_hours + sumWorkedHours(db.attendance || [], placement.employee_id)) * 100) / 100
  return {
    employee_id: placement.employee_id,
    levels,
    assessments_count: mine.length,
    last_assessed_at: mine.reduce((max, e) => (e.assessed_at > max ? e.assessed_at : max), ''),
    months,
    hours,
    eligibility: evaluateNextGrade(settings, { grade: placement.grade_code, position: placement.primary_position, levels, months, hours }),
  }
}

function canSeeFactory(db: ServerDatabaseSchema, user: AuthenticatedUser) {
  const employeeById = new Map(db.employees.map((e) => [e.id, e]))
  return (employeeId: string) => {
    if (employeeId === user.userId) return true
    if (isChainWideRole(user.role)) return true
    if (hasRequiredRole(user.role, MANAGER_ROLES)) {
      const emp = employeeById.get(employeeId)
      return Boolean(emp && canAccessStore(user, emp.store_id))
    }
    return false
  }
}

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const user = gate.user
  try {
    const db = await getServerDb()
    const settings = normalizeCareerPathSettings(db.career_settings)
    const canSee = canSeeFactory(db, user)
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
