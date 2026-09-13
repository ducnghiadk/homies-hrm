import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildPeerCandidateFacts,
  createPeerReviewAdapter,
  peerReviewAdapter,
} from './peer-review-adapter.ts'
import type { KpiPeerReviewRepository } from '../kpi/peer-review-repository.ts'

describe('peer review adapter', () => {
  const employees = [
    { id: 'subject', role: 'employee', status: 'active', store_id: 'store-1', probation: false, suspended: false },
    { id: 'peer-a', role: 'employee', status: 'active', store_id: 'store-1', probation: false, suspended: false },
    { id: 'peer-b', role: 'employee', status: 'active', store_id: 'store-1', probation: false, suspended: false },
    { id: 'peer-other-store', role: 'employee', status: 'active', store_id: 'store-2', probation: false, suspended: false },
    { id: 'leader-01', role: 'shift_leader', status: 'active', store_id: 'store-1', probation: false, suspended: false },
  ]

  const schedules = [
    // 2 ca làm chung giữa subject và peer-a
    { employee_id: 'subject', store_id: 'store-1', date: '2026-08-01', shift_id: 'morning', status: 'published' },
    { employee_id: 'peer-a', store_id: 'store-1', date: '2026-08-01', shift_id: 'morning', status: 'published' },
    { employee_id: 'subject', store_id: 'store-1', date: '2026-08-02', shift_id: 'evening', status: 'published' },
    { employee_id: 'peer-a', store_id: 'store-1', date: '2026-08-02', shift_id: 'evening', status: 'published' },

    // 1 ca làm chung giữa subject và peer-b
    { employee_id: 'subject', store_id: 'store-1', date: '2026-08-03', shift_id: 'morning', status: 'published' },
    { employee_id: 'peer-b', store_id: 'store-1', date: '2026-08-03', shift_id: 'morning', status: 'published' },

    // Ca riêng lẻ không chung shift_id
    { employee_id: 'subject', store_id: 'store-1', date: '2026-08-04', shift_id: 'morning', status: 'published' },
    { employee_id: 'peer-b', store_id: 'store-1', date: '2026-08-04', shift_id: 'evening', status: 'published' },

    // Ca draft chưa publish -> không được tính
    { employee_id: 'subject', store_id: 'store-1', date: '2026-08-05', shift_id: 'morning', status: 'draft' },
    { employee_id: 'peer-a', store_id: 'store-1', date: '2026-08-05', shift_id: 'morning', status: 'draft' },
  ]

  it('computes shared shifts and total shifts accurately from schedule facts', () => {
    const facts = buildPeerCandidateFacts({
      subject_id: 'subject',
      primary_reviewer_id: 'leader-01',
      employees,
      schedules,
      month: '2026-08',
      previous_reviewer_ids: ['peer-b'],
      reciprocal_pairs: [['subject', 'peer-reciprocal']],
    })

    const peerAFact = facts.find((f) => f.employee_id === 'peer-a')
    assert.ok(peerAFact)
    assert.equal(peerAFact.shared_shifts, 2)
    assert.equal(peerAFact.total_shifts, 2)
    assert.equal(peerAFact.reviewed_subject_last_month, false)

    const peerBFact = facts.find((f) => f.employee_id === 'peer-b')
    assert.ok(peerBFact)
    assert.equal(peerBFact.shared_shifts, 1)
    assert.equal(peerBFact.total_shifts, 2)
    assert.equal(peerBFact.reviewed_subject_last_month, true)
  })

  it('exposes getRuntimeMode on peerReviewAdapter', () => {
    const mode = peerReviewAdapter.getRuntimeMode()
    assert.ok(mode === 'local_demo' || mode === 'supabase_secure')
  })

  it('routes every operation to the secure repository when Supabase mode is active', async () => {
    const calls: string[] = []
    const emptyRepository: KpiPeerReviewRepository = {
      async listReviewerTasks() { calls.push('secure:listReviewerTasks'); return [] },
      async listManagerQueue() { calls.push('secure:listManagerQueue'); return [] },
      async submitResponse() { calls.push('secure:submitResponse') },
      async selectReviewers() { calls.push('secure:selectReviewers') },
      async approveMonthlyReview() { calls.push('secure:approveMonthlyReview'); throw new Error('test-stop') },
      async returnMonthlyReview() { calls.push('secure:returnMonthlyReview'); throw new Error('test-stop') },
      async getEmployeeAggregate() {
        calls.push('secure:getEmployeeAggregate')
        return { enough_anonymous_sample: false, unavailable_reason: 'insufficient_anonymous_sample' }
      },
      async revealReviewerIdentity() { calls.push('secure:revealReviewerIdentity'); return { reviewer_id: 'peer-01' } },
      async listIntegrityFlags() { calls.push('secure:listIntegrityFlags'); return [] },
      async resolveIntegrityFlag() { calls.push('secure:resolveIntegrityFlag'); throw new Error('test-stop') },
    }

    const adapter = createPeerReviewAdapter({
      requestedMode: 'supabase_secure',
      supabaseConfigured: true,
      localRepository: emptyRepository,
      secureRepository: emptyRepository,
    })

    await adapter.listReviewerTasks({ id: 'emp-01', role: 'employee', store_id: 'store-001' })

    assert.equal(adapter.getRuntimeMode(), 'supabase_secure')
    assert.deepEqual(calls, ['secure:listReviewerTasks'])
  })

  it('loads the Homies peer review demo seed for the manager workspace', async () => {
    const queue = await peerReviewAdapter.listManagerQueue({
      id: 'emp_sm_01',
      role: 'store_manager',
      store_id: 'store-001',
    })

    assert.ok(queue.length > 0)
    assert.ok(queue.some((item) => item.review.status === 'assignment_pending'))
    assert.ok(queue.some((item) => (
      item.review.subject_role === 'employee' &&
      item.review.status === 'manager_approval_pending'
    )))
  })

  it('routes approval and return actions through the monthly review guard', async () => {
    const manager = {
      id: 'emp_sm_01',
      role: 'store_manager' as const,
      store_id: 'store-001',
    }

    await assert.rejects(
      async () => peerReviewAdapter.approveMonthlyReview(
        manager,
        'mr_03_emp_senior',
        '2026-08-27T10:00:00.000Z'
      ),
      /chưa ở trạng thái chờ/i
    )
    await assert.rejects(
      async () => peerReviewAdapter.returnMonthlyReview(
        manager,
        'mr_03_emp_senior',
        'Bổ sung bằng chứng.',
        '2026-08-27T10:00:00.000Z'
      ),
      /chỉ hồ sơ đang chờ duyệt/i
    )
  })
})
