import test from 'node:test'
import assert from 'node:assert/strict'
import { getDefaultCareerPathSettings } from './settings.ts'
import type { CareerPlacement } from './placement.ts'
import type { EligibilityResult } from './eligibility.ts'
import { canApproveGrade, createProposal, decideProposal, workingDaysSince } from './promotion.ts'

const settings = getDefaultCareerPathSettings()
const placement: CareerPlacement = {
  employee_id: 'emp-1', primary_position: 'cashier', grade_code: 'G1', effective_date: '2026-09-01',
  carried_hours: 0, entry_assessment: 'confirmed', note: '', updated_at: '', updated_by: '',
}
const ready: EligibilityResult = { current: 'G1', next: 'G2', checks: [], ready: true }
const notReady: EligibilityResult = { current: 'G1', next: 'G2', checks: [{ key: 'hours', label: 'Giờ', ok: false, detail: '1/240' }], ready: false }
const sm = { id: 'emp-sm', name: 'QL', role: 'store_manager' }
const hr = { id: 'emp-hr', name: 'HR', role: 'hr_admin' }
const now = new Date('2026-11-25T03:00:00Z')
let n = 0
const id = () => `x-${++n}`

const propose = (elig = ready, reason = 'Đạt đủ kỹ năng') =>
  createProposal([], { placement, store_id: 'store-001', eligibility: elig, months: 3, hours: 300, reason }, sm, now, id)

test('đề xuất khi đủ điều kiện, chặn trùng và chặn tự đề xuất', () => {
  const r = propose()
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.proposal.to_grade, 'G2')
  assert.equal(r.proposal.exception, false)
  const dup = createProposal(r.proposals, { placement, store_id: 's', eligibility: ready, months: 3, hours: 300, reason: 'Đạt đủ kỹ năng' }, hr, now, id)
  assert.ok(!dup.ok && dup.errors[0].includes('chờ duyệt'))
  const self = createProposal([], { placement, store_id: 's', eligibility: ready, months: 3, hours: 300, reason: 'Đạt đủ kỹ năng' }, { ...sm, id: 'emp-1' }, now, id)
  assert.ok(!self.ok)
})

test('đề xuất ngoại lệ cần lý do dài', () => {
  assert.ok(!propose(notReady, 'Làm tốt').ok)
  const r = propose(notReady, 'Thiếu giờ do nghỉ ốm nhưng kỹ năng đã vững')
  assert.ok(r.ok && r.proposal.exception)
})

test('duyệt: đổi bậc và ghi lịch sử nâng bậc', () => {
  const r = propose()
  if (!r.ok) return assert.fail()
  const state = { proposals: r.proposals, placements: [placement], history: [] }
  const blocked = decideProposal(state, { proposal_id: r.proposal.id, decision: 'approve' }, settings, sm, '2026-11-25', now, id)
  assert.ok(!blocked.ok, 'quản lý cửa hàng không được duyệt khi Cài đặt không cho phép')
  const ok = decideProposal(state, { proposal_id: r.proposal.id, decision: 'approve', effective_date: '2026-12-01' }, settings, hr, '2026-11-25', now, id)
  assert.ok(ok.ok)
  if (!ok.ok) return
  assert.equal(ok.placements[0].grade_code, 'G2')
  assert.equal(ok.placements[0].effective_date, '2026-12-01')
  assert.equal(ok.history[0].kind, 'promotion')
  assert.equal(ok.proposal.status, 'approved')
  const again = decideProposal({ ...ok }, { proposal_id: r.proposal.id, decision: 'approve' }, settings, hr, '2026-11-25', now, id)
  assert.ok(!again.ok)
})

test('từ chối cần lý do; người duyệt phải khác người đề xuất', () => {
  const r = createProposal([], { placement, store_id: 's', eligibility: ready, months: 3, hours: 300, reason: 'Đạt đủ kỹ năng' }, hr, now, id)
  if (!r.ok) return assert.fail()
  const state = { proposals: r.proposals, placements: [placement], history: [] }
  assert.ok(!decideProposal(state, { proposal_id: r.proposal.id, decision: 'approve' }, settings, hr, '2026-11-25').ok)
  const ceo = { id: 'emp-ceo', name: 'CEO', role: 'ceo' }
  assert.ok(!decideProposal(state, { proposal_id: r.proposal.id, decision: 'reject', note: '' }, settings, ceo, '2026-11-25').ok)
  const rej = decideProposal(state, { proposal_id: r.proposal.id, decision: 'reject', note: 'Cần thêm 1 tháng' }, settings, ceo, '2026-11-25')
  assert.ok(rej.ok && rej.proposal.status === 'rejected' && rej.placements[0].grade_code === 'G1')
  const cancel = decideProposal(state, { proposal_id: r.proposal.id, decision: 'cancel' }, settings, hr, '2026-11-25')
  assert.ok(cancel.ok && cancel.proposal.status === 'cancelled')
})

test('quyền duyệt theo bậc và đếm ngày làm việc', () => {
  const s = { ...settings, approval: { ...settings.approval, store_manager_can_approve_up_to: 'G2' as const } }
  assert.ok(canApproveGrade(s, 'store_manager', 'G2'))
  assert.ok(!canApproveGrade(s, 'store_manager', 'G3'))
  assert.ok(canApproveGrade(s, 'ceo', 'G4'))
  // 2026-11-23 là Thứ Hai; tới Chủ nhật 29 có 6 ngày làm việc.
  assert.equal(workingDaysSince('2026-11-23T08:00:00Z', '2026-11-29'), 6)
})
