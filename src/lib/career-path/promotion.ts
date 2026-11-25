// Đề xuất và duyệt nâng bậc theo Playbook V7 (lưu trên máy chủ).
// Mỗi đề xuất chỉ lên đúng 1 bậc kế tiếp. Duyệt xong mới đổi bậc và ghi lịch sử "promotion".

import { CAREER_GRADE_CODES, gradeOrder, type CareerGradeCode, type CareerPathSettings, type CareerPositionCode } from './settings.ts'
import type { CareerGradeHistoryEntry, CareerPlacement } from './placement.ts'
import type { EligibilityResult } from './eligibility.ts'

export type PromotionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface PromotionProposal {
  id: string
  employee_id: string
  store_id: string
  position: CareerPositionCode
  from_grade: CareerGradeCode
  to_grade: CareerGradeCode
  /** Đề xuất khi chưa đủ điều kiện theo Cài đặt (ngoại lệ, bắt buộc lý do dài hơn). */
  exception: boolean
  eligibility_snapshot: { months: number; hours: number; checks: EligibilityResult['checks'] }
  reason: string
  proposed_by: string
  proposed_by_name: string
  proposed_at: string
  status: PromotionStatus
  decided_by: string
  decided_by_name: string
  decided_at: string
  decision_note: string
  /** Ngày bậc mới có hiệu lực (YYYY-MM-DD), chỉ có khi đã duyệt. */
  effective_date: string
}

export interface Actor {
  id: string
  name: string
  role: string
}

export const MIN_PROPOSAL_REASON = 5
export const MIN_EXCEPTION_REASON = 20

type Fail = { ok: false; errors: string[] }

const isYmd = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`))

/** Vai trò này có được duyệt đề xuất lên `toGrade` không (chưa xét phạm vi chi nhánh). */
export function canApproveGrade(settings: CareerPathSettings, role: string, toGrade: CareerGradeCode): boolean {
  const r = role.toLowerCase()
  if (settings.approval.approver_roles.map((x) => x.toLowerCase()).includes(r)) return true
  const cap = settings.approval.store_manager_can_approve_up_to
  return r === 'store_manager' && cap !== null && gradeOrder(toGrade) <= gradeOrder(cap)
}

export function createProposal(
  proposals: PromotionProposal[],
  input: { placement: CareerPlacement; store_id: string; eligibility: EligibilityResult; months: number; hours: number; reason: unknown },
  actor: Actor,
  now: Date = new Date(),
  makeId: () => string = () => `cpp-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`
): { ok: true; proposals: PromotionProposal[]; proposal: PromotionProposal } | Fail {
  const { placement, eligibility } = input
  const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
  if (placement.employee_id === actor.id) return { ok: false, errors: ['Không được tự đề xuất nâng bậc cho chính mình.'] }
  if (!eligibility.next) return { ok: false, errors: ['Nhân viên đã ở bậc cao nhất của lộ trình.'] }
  if (proposals.some((p) => p.employee_id === placement.employee_id && p.status === 'pending')) {
    return { ok: false, errors: ['Nhân viên này đang có đề xuất chờ duyệt.'] }
  }
  const exception = !eligibility.ready
  const minLen = exception ? MIN_EXCEPTION_REASON : MIN_PROPOSAL_REASON
  if (reason.length < minLen) {
    return {
      ok: false,
      errors: [exception
        ? `Nhân viên chưa đủ điều kiện. Muốn đề xuất ngoại lệ cần ghi lý do ít nhất ${MIN_EXCEPTION_REASON} ký tự.`
        : `Cần ghi lý do đề xuất (ít nhất ${MIN_PROPOSAL_REASON} ký tự).`],
    }
  }
  const proposal: PromotionProposal = {
    id: makeId(),
    employee_id: placement.employee_id,
    store_id: input.store_id,
    position: placement.primary_position,
    from_grade: placement.grade_code,
    to_grade: eligibility.next,
    exception,
    eligibility_snapshot: { months: input.months, hours: input.hours, checks: eligibility.checks },
    reason: reason.slice(0, 1000),
    proposed_by: actor.id,
    proposed_by_name: actor.name,
    proposed_at: now.toISOString(),
    status: 'pending',
    decided_by: '',
    decided_by_name: '',
    decided_at: '',
    decision_note: '',
    effective_date: '',
  }
  return { ok: true, proposals: [...proposals, proposal], proposal }
}

export interface DecisionInput {
  proposal_id: unknown
  decision: 'approve' | 'reject' | 'cancel'
  note?: unknown
  effective_date?: unknown
}

export interface DecisionResult {
  ok: true
  proposals: PromotionProposal[]
  placements: CareerPlacement[]
  history: CareerGradeHistoryEntry[]
  proposal: PromotionProposal
}

/**
 * Duyệt / từ chối / hủy 1 đề xuất. Phạm vi chi nhánh do API kiểm tra trước.
 * Duyệt: đổi bậc trên hồ sơ xếp bậc, ghi lịch sử "promotion" (không sửa lịch sử cũ).
 */
export function decideProposal(
  state: { proposals: PromotionProposal[]; placements: CareerPlacement[]; history: CareerGradeHistoryEntry[] },
  input: DecisionInput,
  settings: CareerPathSettings,
  actor: Actor,
  today: string,
  now: Date = new Date(),
  makeId: () => string = () => `cgh-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`
): DecisionResult | Fail {
  const proposal = state.proposals.find((p) => p.id === input.proposal_id)
  if (!proposal) return { ok: false, errors: ['Không tìm thấy đề xuất.'] }
  if (proposal.status !== 'pending') return { ok: false, errors: ['Đề xuất này đã được xử lý.'] }
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, 1000) : ''
  const nowIso = now.toISOString()
  const done = (status: PromotionStatus, extra: Partial<PromotionProposal> = {}): PromotionProposal => ({
    ...proposal, status, decided_by: actor.id, decided_by_name: actor.name, decided_at: nowIso, decision_note: note, ...extra,
  })
  const replace = (next: PromotionProposal) => state.proposals.map((p) => (p.id === next.id ? next : p))

  if (input.decision === 'cancel') {
    const isAdmin = settings.approval.approver_roles.map((r) => r.toLowerCase()).includes(actor.role.toLowerCase())
    if (actor.id !== proposal.proposed_by && !isAdmin) return { ok: false, errors: ['Chỉ người đề xuất hoặc người duyệt mới được hủy đề xuất.'] }
    const next = done('cancelled')
    return { ok: true, proposals: replace(next), placements: state.placements, history: state.history, proposal: next }
  }

  if (actor.id === proposal.employee_id) return { ok: false, errors: ['Không được tự duyệt đề xuất của chính mình.'] }
  if (!canApproveGrade(settings, actor.role, proposal.to_grade)) return { ok: false, errors: [`Vai trò của bạn chưa được duyệt nâng lên ${proposal.to_grade}.`] }
  if (settings.approval.require_different_approver && actor.id === proposal.proposed_by) {
    return { ok: false, errors: ['Người duyệt phải khác người đề xuất (theo Cài đặt).'] }
  }

  if (input.decision === 'reject') {
    if (note.length < MIN_PROPOSAL_REASON) return { ok: false, errors: [`Từ chối cần ghi lý do (ít nhất ${MIN_PROPOSAL_REASON} ký tự).`] }
    const next = done('rejected')
    return { ok: true, proposals: replace(next), placements: state.placements, history: state.history, proposal: next }
  }

  if (input.decision !== 'approve') return { ok: false, errors: ['Thao tác không hợp lệ.'] }
  const effectiveDate = input.effective_date === undefined || input.effective_date === '' ? today : input.effective_date
  if (!isYmd(effectiveDate)) return { ok: false, errors: ['Ngày hiệu lực không hợp lệ (định dạng YYYY-MM-DD).'] }
  const placement = state.placements.find((p) => p.employee_id === proposal.employee_id)
  if (!placement || placement.grade_code !== proposal.from_grade || placement.primary_position !== proposal.position) {
    return { ok: false, errors: ['Bậc hoặc vị trí của nhân viên đã thay đổi sau khi đề xuất. Hãy hủy và đề xuất lại.'] }
  }
  if (!CAREER_GRADE_CODES.includes(proposal.to_grade)) return { ok: false, errors: ['Bậc đề xuất không hợp lệ.'] }

  const nextPlacement: CareerPlacement = { ...placement, grade_code: proposal.to_grade, effective_date: effectiveDate, updated_at: nowIso, updated_by: actor.id }
  const entry: CareerGradeHistoryEntry = {
    id: makeId(),
    employee_id: proposal.employee_id,
    kind: 'promotion',
    from_grade: proposal.from_grade,
    to_grade: proposal.to_grade,
    from_position: proposal.position,
    to_position: proposal.position,
    effective_date: effectiveDate,
    reason: note ? `${proposal.reason} — Duyệt: ${note}` : proposal.reason,
    decided_by: actor.id,
    decided_by_name: actor.name,
    created_at: nowIso,
  }
  const next = done('approved', { effective_date: effectiveDate })
  return {
    ok: true,
    proposals: replace(next),
    placements: state.placements.map((p) => (p.employee_id === proposal.employee_id ? nextPlacement : p)),
    history: [...state.history, entry],
    proposal: next,
  }
}

/** Số ngày làm việc (trừ Chủ nhật) từ lúc đề xuất tới hôm nay, để nhắc hạn phản hồi. */
export function workingDaysSince(isoStart: string, today: string): number {
  const start = new Date(`${isoStart.slice(0, 10)}T00:00:00Z`)
  const end = new Date(`${today}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  let days = 0
  for (const d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 0) days += 1
  }
  return days
}
