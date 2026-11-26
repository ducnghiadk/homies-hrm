import { test } from 'node:test'
import assert from 'node:assert/strict'
import { markReminded, planCareerReminders } from './reminders.ts'
import type { PromotionProposal } from './promotion.ts'
import type { CareerReminderConfig } from './settings.ts'

const proposal = (over: Partial<PromotionProposal> = {}): PromotionProposal => ({
  id: 'p1', employee_id: 'e1', store_id: 's1', position: 'cashier', from_grade: 'G1', to_grade: 'G2', exception: false,
  eligibility_snapshot: { months: 0, hours: 0, checks: [] }, reason: '', proposed_by: 'm1', proposed_by_name: 'QL',
  proposed_at: '2026-11-16T08:00:00Z', status: 'pending', decided_by: '', decided_by_name: '', decided_at: '', decision_note: '', effective_date: '',
  ...over,
})
const cfg = (over: Partial<CareerReminderConfig> = {}): CareerReminderConfig => ({
  enabled: true, repeat_every_days: 1, max_times: 0, send_hour: null, escalate_after_days: 0, escalate_roles: ['ceo'], ...over,
})
// 16/11/2026 là Thứ 2. Tới 26/11 (Thứ 5) có 10 ngày, trừ Chủ nhật = 9 ngày làm việc.
const base = { respondWithinDays: 3, nonWorkingWeekdays: [0], today: '2026-11-26', hour: 9 }

test('không nhắc khi tắt, chưa có hạn phản hồi, hoặc chưa tới giờ gửi', () => {
  assert.equal(planCareerReminders([proposal()], { ...base, config: cfg({ enabled: false }) }).length, 0)
  assert.equal(planCareerReminders([proposal()], { ...base, respondWithinDays: 0, config: cfg() }).length, 0)
  assert.equal(planCareerReminders([proposal()], { ...base, config: cfg({ send_hour: 10 }) }).length, 0)
})

test('nhắc đề xuất quá hạn, mỗi ngày tối đa 1 lần, tôn trọng số lần tối đa', () => {
  const [a] = planCareerReminders([proposal()], { ...base, config: cfg() })
  assert.deepEqual(a, { proposal_id: 'p1', remind: true, escalate: false, overdue_days: 6 })
  const again = markReminded(proposal(), a, '2026-11-26')
  assert.equal(planCareerReminders([again], { ...base, config: cfg() }).length, 0)
  assert.equal(planCareerReminders([again], { ...base, today: '2026-11-27', config: cfg({ max_times: 1 }) }).length, 0)
  assert.equal(planCareerReminders([again], { ...base, today: '2026-11-27', config: cfg({ repeat_every_days: 0 }) }).length, 0)
  assert.equal(planCareerReminders([again], { ...base, today: '2026-11-27', config: cfg() }).length, 1)
})

test('báo lên cấp trên đúng 1 lần khi quá hạn đủ số ngày', () => {
  const [a] = planCareerReminders([proposal()], { ...base, config: cfg({ escalate_after_days: 2 }) })
  assert.equal(a.escalate, true)
  const done = markReminded(proposal(), a, '2026-11-26')
  const next = planCareerReminders([done], { ...base, today: '2026-11-27', config: cfg({ escalate_after_days: 2 }) })
  assert.equal(next[0].escalate, false)
  assert.equal(planCareerReminders([proposal({ status: 'approved' })], { ...base, config: cfg() }).length, 0)
})
