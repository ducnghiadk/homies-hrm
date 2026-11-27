import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmptyKpiDatabase, type KpiDatabase } from './repository.ts'
import { createEmptyLocalPeerReviewDatabase } from './local-peer-review-repository.ts'
import { getDefaultPeerReviewPolicy } from './peer-review-policy-service.ts'
import { syncMonthlyPeerReviews, toSchedulerShift, type PeerSchedulerEmployee, type PeerSchedulerShift } from './peer-review-scheduler.ts'
import type { KpiPeriod } from './types'

const NOW = '2026-11-05T02:00:00.000Z'

function kpiWith(status: KpiPeriod['status'], enabled = true, employeeIds = ['e1']): KpiDatabase {
  const db = createEmptyKpiDatabase()
  db.periods = [{
    id: 'p_2026_11',
    org_id: 'org',
    store_id: 'store-001',
    month: '2026-11',
    status,
    snapshot: { peer_review_policy: { ...getDefaultPeerReviewPolicy(), enabled } } as unknown as KpiPeriod['snapshot'],
    employee_ids: employeeIds,
    opened_by: 'hr',
    opened_at: NOW,
    revision: 1,
  }]
  return db
}

const staff: PeerSchedulerEmployee[] = [
  { id: 'm1', name: 'Quản lý', role: 'store_manager', store_id: 'store-001', status: 'active' },
  { id: 'l1', name: 'Trưởng ca', role: 'shift_leader', store_id: 'store-001', status: 'active' },
  { id: 'e1', name: 'An', role: 'employee', store_id: 'store-001', status: 'active' },
  { id: 'e2', name: 'Bình', role: 'employee', store_id: 'store-001', status: 'active' },
  { id: 'e3', name: 'Chi', role: 'employee', store_id: 'store-001', status: 'active' },
  { id: 'e4', name: 'Dũng', role: 'employee', store_id: 'store-001', status: 'active' },
]

function shiftsFor(id: string, days: number, offset = 0): PeerSchedulerShift[] {
  return Array.from({ length: days }, (_, i) => {
    const date = `2026-11-${String(i + 1 + offset).padStart(2, '0')}`
    return toSchedulerShift({ employee_id: id, store_id: 'store-001', date, shift_id: 'shift-001', check_in_time: '08:30', check_out_time: '12:00' })!
  })
}

// e1 làm 10 ngày; e2 làm chung 10 ngày, e3 làm chung 7 ngày, e4 chỉ 2 ngày chung.
const shifts = [
  ...shiftsFor('e1', 10), ...shiftsFor('e2', 10), ...shiftsFor('e3', 10, 3), ...shiftsFor('e4', 2),
  ...shiftsFor('l1', 10), ...shiftsFor('m1', 10),
]

test('tạo hồ sơ tháng khi kỳ đang thu thập, xếp người chấm theo số ca làm chung', () => {
  const result = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: createEmptyLocalPeerReviewDatabase(), employees: staff, shifts, now: NOW })
  assert.equal(result.created, 1)
  const review = result.peer.monthly_reviews[0]
  assert.equal(review.employee_id, 'e1')
  assert.equal(review.status, 'assignment_pending')
  assert.equal(review.primary_reviewer_id, 'l1')
  const ranked = result.peer.candidates_by_review[review.id].map((c) => c.employee_id)
  assert.deepEqual(ranked, ['e2', 'e3'])
  assert.equal(result.peer.employee_names.e1.name, 'An')
})

test('chạy lại không tạo trùng', () => {
  const first = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: createEmptyLocalPeerReviewDatabase(), employees: staff, shifts, now: NOW })
  const second = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: first.peer, employees: staff, shifts, now: NOW })
  assert.equal(second.created, 0)
  assert.equal(second.changed, false)
  assert.equal(second.peer.monthly_reviews.length, 1)
})

test('kỳ còn nháp thì chưa tạo', () => {
  const result = syncMonthlyPeerReviews({ kpi: kpiWith('draft'), peer: createEmptyLocalPeerReviewDatabase(), employees: staff, shifts, now: NOW })
  assert.equal(result.created, 0)
})

test('không đủ đồng nghiệp làm chung thì bỏ qua bước đồng nghiệp và đánh dấu thiếu mẫu', () => {
  const result = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: createEmptyLocalPeerReviewDatabase(), employees: staff, shifts: shiftsFor('e1', 10), now: NOW })
  const review = result.peer.monthly_reviews[0]
  assert.equal(review.status, 'primary_review_pending')
  assert.equal(review.missing_peer_sample, true)
})

test('tắt đánh giá đồng nghiệp thì hồ sơ đi thẳng sang người chấm chính', () => {
  const result = syncMonthlyPeerReviews({ kpi: kpiWith('collecting', false), peer: createEmptyLocalPeerReviewDatabase(), employees: staff, shifts, now: NOW })
  assert.equal(result.peer.monthly_reviews[0].status, 'primary_review_pending')
  assert.equal(result.peer.monthly_reviews[0].missing_peer_sample, false)
})

test('quá hạn quản lý chọn người thì hệ thống tự chọn 2 người đứng đầu', () => {
  const first = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: createEmptyLocalPeerReviewDatabase(), employees: staff, shifts, now: NOW })
  const later = '2026-11-06T03:00:00.000Z'
  const result = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: first.peer, employees: staff, shifts, now: later })
  const review = result.peer.monthly_reviews[0]
  assert.equal(review.status, 'collecting')
  assert.deepEqual(result.peer.assignments.map((a) => a.reviewer_id).sort(), ['e2', 'e3'])
  assert.ok(review.peer_deadline_at)
})

test('đủ 2 phiếu thì chuyển sang người chấm chính; hết hạn thiếu phiếu thì đánh dấu thiếu mẫu', () => {
  const first = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: createEmptyLocalPeerReviewDatabase(), employees: staff, shifts, now: NOW })
  const selected = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: first.peer, employees: staff, shifts, now: '2026-11-06T03:00:00.000Z' })

  const full = structuredClone(selected.peer)
  full.assignments = full.assignments.map((a) => ({ ...a, status: 'submitted' as const }))
  const done = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: full, employees: staff, shifts, now: '2026-11-06T04:00:00.000Z' })
  assert.equal(done.peer.monthly_reviews[0].status, 'primary_review_pending')
  assert.equal(done.peer.monthly_reviews[0].missing_peer_sample, false)

  const half = structuredClone(selected.peer)
  half.assignments[0] = { ...half.assignments[0], status: 'submitted' }
  const notYet = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: half, employees: staff, shifts, now: '2026-11-06T04:00:00.000Z' })
  assert.equal(notYet.peer.monthly_reviews[0].status, 'collecting')
  const expired = syncMonthlyPeerReviews({ kpi: kpiWith('collecting'), peer: half, employees: staff, shifts, now: '2026-11-09T04:00:00.000Z' })
  assert.equal(expired.peer.monthly_reviews[0].status, 'primary_review_pending')
  assert.equal(expired.peer.monthly_reviews[0].missing_peer_sample, true)
  assert.equal(expired.peer.assignments.filter((a) => a.status === 'expired').length, 1)
})

test('trưởng ca do quản lý cửa hàng chấm chính; người đã nghỉ không được tạo', () => {
  const people = staff.map((e) => (e.id === 'e1' ? { ...e, status: 'resigned' as const } : e))
  const result = syncMonthlyPeerReviews({ kpi: kpiWith('collecting', true, ['l1', 'e1']), peer: createEmptyLocalPeerReviewDatabase(), employees: people, shifts, now: NOW })
  assert.equal(result.peer.monthly_reviews.length, 1)
  assert.equal(result.peer.monthly_reviews[0].employee_id, 'l1')
  assert.equal(result.peer.monthly_reviews[0].primary_reviewer_id, 'm1')
})
