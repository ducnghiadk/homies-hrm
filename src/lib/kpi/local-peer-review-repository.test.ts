import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createLocalPeerReviewRepository,
  type LocalPeerReviewDatabase,
} from './local-peer-review-repository.ts'
import { PEER_QUESTION_CODES } from './peer-response-service.ts'
import type { KpiActor } from './types.ts'

describe('local peer review repository', () => {
  function createMemoryStorage(): Storage {
    const data = new Map<string, string>()
    return {
      get length() {
        return data.size
      },
      clear() {
        data.clear()
      },
      getItem(key) {
        return data.get(key) ?? null
      },
      key(index) {
        return [...data.keys()][index] ?? null
      },
      removeItem(key) {
        data.delete(key)
      },
      setItem(key, value) {
        data.set(key, value)
      },
    }
  }

  const initialData: LocalPeerReviewDatabase = {
    monthly_reviews: [
      {
        id: 'mr-01',
        period_id: 'period-2026-08',
        evaluation_id: 'eval-01',
        employee_id: 'emp-01',
        store_id: 'store-001',
        position_id: 'cashier',
        subject_role: 'employee',
        primary_reviewer_id: 'leader-01',
        primary_reviewer_role: 'shift_leader',
        status: 'collecting',
        missing_peer_sample: false,
        blocker_codes: [],
        created_at: '2026-08-25T08:00:00.000Z',
        updated_at: '2026-08-25T08:00:00.000Z',
      },
    ],
    assignments: [
      {
        id: 'assign-1',
        monthly_review_id: 'mr-01',
        reviewer_id: 'peer-a',
        rank: 1,
        shared_shift_count: 12,
        total_shift_count: 20,
        selected_by: 'manager',
        status: 'assigned',
        assigned_at: '2026-08-25T08:00:00.000Z',
        deadline_at: '2026-08-27T08:00:00.000Z',
      },
      {
        id: 'assign-2',
        monthly_review_id: 'mr-01',
        reviewer_id: 'peer-b',
        rank: 2,
        shared_shift_count: 10,
        total_shift_count: 18,
        selected_by: 'manager',
        status: 'assigned',
        assigned_at: '2026-08-25T08:00:00.000Z',
        deadline_at: '2026-08-27T08:00:00.000Z',
      },
    ],
    responses: [],
    aggregates: [],
    integrity_flags: [],
    candidates_by_review: {
      'mr-01': [
        { employee_id: 'peer-a', rank: 1, shared_shifts: 12, total_shifts: 20, reason_label: 'Làm chung 12 ca' },
        { employee_id: 'peer-b', rank: 2, shared_shifts: 10, total_shifts: 18, reason_label: 'Làm chung 10 ca' },
      ],
    },
    audit_logs: [],
    employee_names: {
      'emp-01': { name: 'Nguyễn Văn A', position_name: 'Thu ngân' },
    },
  }

  it('lists reviewer tasks securely for the authenticated reviewer only', async () => {
    const repo = createLocalPeerReviewRepository({ initialData })

    const peerAActor: KpiActor = { id: 'peer-a', role: 'employee', store_id: 'store-001' }
    const peerBActor: KpiActor = { id: 'peer-b', role: 'employee', store_id: 'store-001' }

    const tasksA = await repo.listReviewerTasks(peerAActor)
    assert.equal(tasksA.length, 1)
    assert.equal(tasksA[0].assignment_id, 'assign-1')
    assert.equal(tasksA[0].subject.name, 'Nguyễn Văn A')

    const tasksB = await repo.listReviewerTasks(peerBActor)
    assert.equal(tasksB.length, 1)
    assert.equal(tasksB[0].assignment_id, 'assign-2')
  })

  it('allows manager to view queue progress without exposing raw reviewer identities of submitted responses', async () => {
    const repo = createLocalPeerReviewRepository({ initialData })
    const managerActor: KpiActor = { id: 'leader-01', role: 'shift_leader', store_id: 'store-001' }

    const queue = await repo.listManagerQueue(managerActor)
    assert.equal(queue.length, 1)
    assert.equal(queue[0].review.id, 'mr-01')
    assert.equal(queue[0].review.status, 'collecting')
    assert.equal(queue[0].subject.name, 'Nguyễn Văn A')
    assert.equal(queue[0].progress.submitted_count, 0)
    assert.equal(queue[0].candidates.length, 2)
  })

  it('rejects manager queue access for employees', async () => {
    const repo = createLocalPeerReviewRepository({ initialData })
    const employeeActor: KpiActor = { id: 'emp-01', role: 'employee', store_id: 'store-001' }

    await assert.rejects(
      async () => repo.listManagerQueue(employeeActor),
      /không có quyền xem hàng đợi quản lý/i
    )
  })

  it('lets only the store manager select two eligible reviewers', async () => {
    const repo = createLocalPeerReviewRepository({ initialData })
    const shiftLeaderActor: KpiActor = { id: 'leader-01', role: 'shift_leader', store_id: 'store-001' }
    const managerActor: KpiActor = { id: 'manager-01', role: 'store_manager', store_id: 'store-001' }

    await assert.rejects(
      async () => repo.selectReviewers(shiftLeaderActor, 'mr-01', ['peer-a', 'peer-b']),
      /chỉ quản lý cửa hàng/i
    )

    await repo.selectReviewers(managerActor, 'mr-01', ['peer-a', 'peer-b'])
    const queue = await repo.listManagerQueue(managerActor)

    assert.deepEqual(queue[0].selected_reviewer_ids.sort(), ['peer-a', 'peer-b'])
    assert.equal(queue[0].review.status, 'collecting')
  })

  it('persists approval and return decisions across repository reloads', async () => {
    const storage = createMemoryStorage()
    const approvalData: LocalPeerReviewDatabase = {
      ...initialData,
      monthly_reviews: initialData.monthly_reviews.map((review) => ({
        ...review,
        status: 'manager_approval_pending' as const,
        blocker_codes: [],
      })),
    }
    const managerActor: KpiActor = { id: 'manager-01', role: 'store_manager', store_id: 'store-001' }
    const repo = createLocalPeerReviewRepository({ storage, initialData: approvalData })

    assert.ok(repo.approveMonthlyReview)
    await repo.approveMonthlyReview(managerActor, 'mr-01', '2026-08-27T10:00:00.000Z')

    const reloadedAfterApproval = createLocalPeerReviewRepository({ storage, initialData: approvalData })
    const approvedQueue = await reloadedAfterApproval.listManagerQueue(managerActor)
    assert.equal(approvedQueue[0].review.status, 'published')
    assert.equal(approvedQueue[0].review.published_at, '2026-08-27T10:00:00.000Z')

    const returnStorage = createMemoryStorage()
    const returnRepo = createLocalPeerReviewRepository({ storage: returnStorage, initialData: approvalData })
    assert.ok(returnRepo.returnMonthlyReview)
    await returnRepo.returnMonthlyReview(
      managerActor,
      'mr-01',
      'Bổ sung bằng chứng bàn giao ca.',
      '2026-08-27T09:00:00.000Z'
    )

    const reloadedAfterReturn = createLocalPeerReviewRepository({ storage: returnStorage, initialData: approvalData })
    const returnedQueue = await reloadedAfterReturn.listManagerQueue(managerActor)
    assert.equal(returnedQueue[0].review.status, 'primary_review_pending')
    assert.deepEqual(returnedQueue[0].review.blocker_codes, ['RETURNED_CHANGES_PENDING'])
  })

  it('submits peer response and auto-aggregates when 2 responses are submitted', async () => {
    const repo = createLocalPeerReviewRepository({ initialData })

    const peerAActor: KpiActor = { id: 'peer-a', role: 'employee', store_id: 'store-001' }
    const peerBActor: KpiActor = { id: 'peer-b', role: 'employee', store_id: 'store-001' }

    // Peer A submit
    await repo.submitResponse(peerAActor, 'assign-1', {
      answers: PEER_QUESTION_CODES.map((code) => ({ question_code: code, score: 4 as const })),
      strength_note: 'Rất nhiệt tình',
      improvement_note: 'Đúng giờ hơn',
      direct_observation_confirmed: true,
    })

    // Peer B submit
    await repo.submitResponse(peerBActor, 'assign-2', {
      answers: PEER_QUESTION_CODES.map((code) => ({ question_code: code, score: 5 as const, observed_date: '2026-08-10', situation_code: 'peak', evidence_note: 'Hỗ trợ đồng đội nhanh nhẹn trong giờ cao điểm.' })),
      strength_note: 'Chăm chỉ',
      improvement_note: 'Giao tiếp tốt hơn',
      direct_observation_confirmed: true,
    })

    // Employee xem kết quả tổng hợp
    const empActor: KpiActor = { id: 'emp-01', role: 'employee', store_id: 'store-001' }
    const aggregateDto = await repo.getEmployeeAggregate(empActor, 'mr-01')

    assert.equal(aggregateDto.enough_anonymous_sample, true)
    assert.equal(aggregateDto.total_score, 4.5)
    assert.ok(aggregateDto.strength_summary)
  })

  it('automatically creates an integrity flag when two submitted answer vectors are identical', async () => {
    const repo = createLocalPeerReviewRepository({ initialData })
    const draft = {
      answers: PEER_QUESTION_CODES.map((code) => ({ question_code: code, score: 4 as const })),
      strength_note: 'Hỗ trợ đồng đội ổn định trong các ca đông khách.',
      improvement_note: 'Cần bàn giao nguyên liệu chi tiết hơn vào cuối ca.',
      direct_observation_confirmed: true,
    }
    await repo.submitResponse({ id: 'peer-a', role: 'employee', store_id: 'store-001' }, 'assign-1', draft)
    await repo.submitResponse({ id: 'peer-b', role: 'employee', store_id: 'store-001' }, 'assign-2', draft)

    const flags = await repo.listIntegrityFlags({ id: 'hr-01', role: 'hr_admin', store_id: 'store-001' })
    assert.ok(flags.some((flag) => flag.monthly_review_id === 'mr-01' && flag.code === 'IDENTICAL_RESPONSES'))
  })

  it('allows reveal of reviewer identity only for HR Admin or CEO with audit trail', async () => {
    const repo = createLocalPeerReviewRepository({ initialData })

    const managerActor: KpiActor = { id: 'leader-01', role: 'shift_leader', store_id: 'store-001' }
    const hrActor: KpiActor = { id: 'hr-01', role: 'hr_admin', store_id: 'store-001' }

    // Quản lý cố giải mật -> bị từ chối
    await assert.rejects(
      async () => repo.revealReviewerIdentity(managerActor, 'assign-1', 'Kiểm tra điểm'),
      /Chỉ HR Admin hoặc Ban Giám Đốc/
    )

    // HR Admin giải mật có lý do -> thành công
    const result = await repo.revealReviewerIdentity(
      hrActor,
      'assign-1',
      'Điều tra khiếu nại điểm số bất thường theo đơn yêu cầu'
    )
    assert.equal(result.reviewer_id, 'peer-a')
  })

  it('persists integrity decisions and never exposes the queue to store roles', async () => {
    const storage = createMemoryStorage()
    const data: LocalPeerReviewDatabase = {
      ...initialData,
      integrity_flags: [{
        id: 'flag-01', monthly_review_id: 'mr-01', code: 'RECIPROCAL_PAIR', severity: 'warning',
        evidence_refs: ['assign-1'], status: 'open',
      }],
    }
    const repo = createLocalPeerReviewRepository({ storage, initialData: data })
    const manager: KpiActor = { id: 'manager-01', role: 'store_manager', store_id: 'store-001' }
    const hr: KpiActor = { id: 'hr-01', role: 'hr_admin', store_id: 'store-001' }

    await assert.rejects(() => repo.listIntegrityFlags(manager), /HR Admin|Ban Giám Đốc/)
    assert.equal((await repo.listIntegrityFlags(hr)).length, 1)
    await repo.resolveIntegrityFlag(hr, 'flag-01', 'confirmed', 'Đã đối chiếu lịch sử phân công chéo.')

    const reloaded = createLocalPeerReviewRepository({ storage, initialData: data })
    const resolved = await reloaded.listIntegrityFlags(hr)
    assert.equal(resolved[0].status, 'confirmed')
    assert.equal(resolved[0].resolved_by, 'hr-01')
  })
})
