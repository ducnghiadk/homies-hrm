import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, canAccessStore, isChainWideRole, hasRequiredRole, type AuthenticatedUser } from '@/lib/server/auth-helper'
import { getServerDb, saveServerDb, type ServerDatabaseSchema } from '@/lib/server/db'
import { careerApproverIds, pushCareerNotices } from '@/lib/server/career-notify'
import { normalizeCareerPathSettings, type CareerPathSettings } from '@/lib/career-path/settings'
import { canApproveGrade, createProposal, decideProposal, workingDaysSince, type PromotionProposal } from '@/lib/career-path/promotion'
import { buildCareerSummary, careerViewScope } from '@/lib/server/career-progress'
import { getVnDateString } from '@/lib/time/vn-time'

/**
 * Đề xuất & duyệt nâng bậc (Playbook V7).
 * GET: danh sách đề xuất trong phạm vi xem được, kèm quyền thao tác và số ngày chờ.
 * POST { action: 'propose', employee_id, reason }: vai trò được đánh giá (theo Cài đặt) đề xuất lên bậc kế tiếp.
 * POST { action: 'approve' | 'reject' | 'cancel', proposal_id, note?, effective_date? }: duyệt theo Cài đặt.
 */

function inStore(db: ServerDatabaseSchema, user: AuthenticatedUser, employeeId: string) {
  if (isChainWideRole(user.role)) return true
  const emp = db.employees.find((e) => e.id === employeeId)
  return Boolean(emp && canAccessStore(user, emp.store_id))
}

function canDecide(db: ServerDatabaseSchema, settings: CareerPathSettings, user: AuthenticatedUser, p: PromotionProposal) {
  if (p.status !== 'pending' || p.employee_id === user.userId) return false
  if (settings.approval.require_different_approver && p.proposed_by === user.userId) return false
  return canApproveGrade(settings, user.role, p.to_grade) && inStore(db, user, p.employee_id)
}

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const user = gate.user
  try {
    const db = await getServerDb()
    const settings = normalizeCareerPathSettings(db.career_settings)
    const canSee = careerViewScope(db, user)
    const today = getVnDateString()
    const limit = settings.approval.respond_within_working_days
    const proposals = (db.career_promotions || [])
      .filter((p) => canSee(p.employee_id))
      .sort((a, b) => b.proposed_at.localeCompare(a.proposed_at))
      .map((p) => {
        const waiting = p.status === 'pending' ? workingDaysSince(p.proposed_at, today, settings.rules.non_working_weekdays) : 0
        return {
          ...p,
          employee_name: db.employees.find((e) => e.id === p.employee_id)?.full_name || p.employee_id,
          waiting_working_days: waiting,
          overdue: p.status === 'pending' && limit > 0 && waiting > limit,
          can_decide: canDecide(db, settings, user, p),
          can_cancel: p.status === 'pending' && (p.proposed_by === user.userId || hasRequiredRole(user.role, settings.approval.approver_roles)),
        }
      })
    return NextResponse.json({
      success: true,
      can_propose: settings.configured && hasRequiredRole(user.role, settings.approval.assessor_roles),
      configured: settings.configured,
      respond_within_working_days: limit,
      reason_min_chars: settings.rules.reason_min_chars,
      allow_exception: settings.rules.allow_exception,
      exception_reason_min_chars: settings.rules.exception_reason_min_chars,
      proposals,
    })
  } catch (error) {
    console.error('[API /api/career-path/promotions GET] Error:', error)
    return NextResponse.json({ success: false, message: 'Không tải được đề xuất nâng bậc.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const user = gate.user
  const actor = { id: user.userId, name: user.employee?.full_name || user.email, role: user.role }
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Thiếu dữ liệu.' }, { status: 400 })
    }
    const db = await getServerDb()
    const settings = normalizeCareerPathSettings(db.career_settings)
    const today = getVnDateString()
    const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status })

    if (body.action === 'propose') {
      if (!hasRequiredRole(user.role, settings.approval.assessor_roles)) return bad('Vai trò của bạn chưa được phép đề xuất nâng bậc (xem Cài đặt lộ trình).', 403)
      const employee = db.employees.find((e) => e.id === body.employee_id)
      if (!employee) return bad('Không tìm thấy nhân viên.', 404)
      if (!inStore(db, user, employee.id)) return bad('Bạn chỉ được đề xuất cho nhân viên thuộc chi nhánh của mình.', 403)
      const placement = (db.career_placements || []).find((p) => p.employee_id === employee.id)
      if (!placement) return bad('Nhân viên chưa được xếp bậc.')
      const summary = buildCareerSummary(db, settings, placement, today)
      const result = createProposal(
        db.career_promotions || [],
        { settings, placement, store_id: employee.store_id, eligibility: summary.eligibility, months: summary.months, hours: summary.hours, reason: body.reason },
        actor
      )
      if (!result.ok) return bad(result.errors[0])
      db.career_promotions = result.proposals
      const p = result.proposal
      const kind = p.exception ? 'đề xuất ngoại lệ' : 'đề xuất'
      pushCareerNotices(db, careerApproverIds(db, (role) => canApproveGrade(settings, role, p.to_grade), employee.store_id, user.userId).map((id) => ({
        title: 'Có đề xuất nâng bậc chờ duyệt',
        message: `${actor.name} ${kind} ${employee.full_name} lên ${p.to_grade}. Vào "Đề xuất & duyệt nâng bậc" để xử lý.`,
        target_user_id: id,
        metadata: { proposal_id: p.id, link: '/career-path/review' },
      })))
      await saveServerDb(db)
      return NextResponse.json({ success: true, proposal: result.proposal })
    }

    if (body.action === 'approve' || body.action === 'reject' || body.action === 'cancel') {
      const proposal = (db.career_promotions || []).find((p) => p.id === body.proposal_id)
      if (!proposal) return bad('Không tìm thấy đề xuất.', 404)
      if (body.action !== 'cancel' && !inStore(db, user, proposal.employee_id)) return bad('Đề xuất này thuộc chi nhánh khác.', 403)
      const result = decideProposal(
        { proposals: db.career_promotions || [], placements: db.career_placements || [], history: db.career_grade_history || [] },
        { proposal_id: body.proposal_id, decision: body.action, note: body.note, effective_date: body.effective_date },
        settings,
        actor,
        today
      )
      if (!result.ok) return bad(result.errors[0], result.errors[0].startsWith('Vai trò') ? 403 : 400)
      db.career_promotions = result.proposals
      db.career_placements = result.placements
      db.career_grade_history = result.history
      const p = result.proposal
      const name = db.employees.find((e) => e.id === p.employee_id)?.full_name || 'Nhân viên'
      if (body.action === 'approve') {
        pushCareerNotices(db, [
          { title: `Chúc mừng! Bạn đã lên ${p.to_grade}`, message: `Bậc mới có hiệu lực từ ngày ${p.effective_date}. Xem chi tiết ở "Lộ trình của tôi".`, target_user_id: p.employee_id, metadata: { proposal_id: p.id, link: '/career-path/me' } },
          ...(p.proposed_by !== user.userId ? [{ title: 'Đề xuất nâng bậc đã được duyệt', message: `${name} đã lên ${p.to_grade} (hiệu lực ${p.effective_date}).`, target_user_id: p.proposed_by, metadata: { proposal_id: p.id, link: '/career-path/review' } }] : []),
        ])
      } else if (body.action === 'reject' && p.proposed_by !== user.userId) {
        pushCareerNotices(db, [{ title: 'Đề xuất nâng bậc bị từ chối', message: `Đề xuất cho ${name} lên ${p.to_grade} bị từ chối${p.decision_note ? `: ${p.decision_note}` : '.'}`, target_user_id: p.proposed_by, metadata: { proposal_id: p.id, link: '/career-path/review' } }])
      }
      await saveServerDb(db)
      return NextResponse.json({ success: true, proposal: result.proposal })
    }

    return bad('Thao tác không hợp lệ.')
  } catch (error) {
    console.error('[API /api/career-path/promotions POST] Error:', error)
    return NextResponse.json({ success: false, message: 'Không lưu được đề xuất nâng bậc.' }, { status: 500 })
  }
}
