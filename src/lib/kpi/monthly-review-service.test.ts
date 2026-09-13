import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createMonthlyReview,
  advanceMonthlyReview,
  getPublicationBlockers,
  isManagerApprovalActionAvailable,
  approveMonthlyReview,
  publishMonthlyReview,
  returnMonthlyReviewForChanges,
  type MonthlyReviewBlockerInput,
} from './monthly-review-service.ts'
import { getDefaultPeerReviewPolicy } from './peer-review-policy-service.ts'
import type {
  KpiEmployeeRef,
  KpiEvaluation,
  KpiMonthlyReview,
} from './types.ts'

describe('monthly review lifecycle service', () => {
  const defaultPolicy = getDefaultPeerReviewPolicy()

  const frontlineEmployee: KpiEmployeeRef = {
    id: 'emp-01',
    store_id: 'store-001',
    level_code: 'pt1_pc',
    position_id: 'cashier',
    employment_status: 'official',
  }

  const leaderEmployee: KpiEmployeeRef = {
    id: 'leader-01',
    store_id: 'store-001',
    level_code: 'pt1_pc',
    position_id: 'shift_leader',
    employment_status: 'official',
  }

  it('lets a small store continue without peer score after collection closes with fewer than two eligible peers', () => {
    const review = createMonthlyReview({
      period_id: 'period-2026-08',
      evaluation_id: 'eval-small-store',
      employee: frontlineEmployee,
      subject_role: 'employee',
      primary_reviewer_id: 'leader-01',
      opened_at: '2026-08-25T08:00:00.000Z',
      peer_policy: defaultPolicy,
    })

    const next = advanceMonthlyReview({
      review,
      assignment_count: 1,
      submitted_peer_count: 1,
      peer_collection_closed: true,
      primary_submitted: false,
      manager_approved: false,
      integrity_flags: [],
      serious_incident_open: false,
      appeal_open: false,
      at: '2026-08-28T08:00:00.000Z',
    })

    assert.equal(next.status, 'primary_review_pending')
    assert.equal(next.missing_peer_sample, true)
    assert.equal(next.blocker_codes.includes('INTEGRITY_REVIEW_REQUIRED'), false)
  })

  it('creates frontline review with assignment_pending status and +24h deadline', () => {
    const review = createMonthlyReview({
      period_id: 'period-2026-08',
      evaluation_id: 'eval-01',
      employee: frontlineEmployee,
      subject_role: 'employee',
      primary_reviewer_id: 'leader-01',
      peer_policy: defaultPolicy,
      opened_at: '2026-08-25T08:00:00.000Z',
    })

    assert.equal(review.subject_role, 'employee')
    assert.equal(review.primary_reviewer_role, 'shift_leader')
    assert.equal(review.status, 'assignment_pending')
    assert.equal(review.assignment_deadline_at, '2026-08-26T08:00:00.000Z') // +24h
    assert.equal(review.peer_deadline_at, undefined)
  })

  it('creates shift leader review directly in primary_review_pending when peer is disabled', () => {
    const disabledPeerPolicy = {
      ...defaultPolicy,
      enabled: false,
      weight_percent: 0,
    }

    const review = createMonthlyReview({
      period_id: 'period-2026-08',
      evaluation_id: 'eval-leader',
      employee: leaderEmployee,
      subject_role: 'shift_leader',
      primary_reviewer_id: 'sm-01',
      peer_policy: disabledPeerPolicy,
      opened_at: '2026-08-25T08:00:00.000Z',
    })

    assert.equal(review.subject_role, 'shift_leader')
    assert.equal(review.primary_reviewer_role, 'store_manager')
    assert.equal(review.status, 'primary_review_pending')
    assert.equal(review.assignment_deadline_at, undefined)
  })

  it('only exposes the manager approval action at the correct lifecycle step', () => {
    const baseReview: KpiMonthlyReview = {
      id: 'mr-approval-visibility',
      period_id: 'period-2026-08',
      evaluation_id: 'eval-01',
      employee_id: 'emp-01',
      store_id: 'store-001',
      position_id: 'cashier',
      subject_role: 'employee',
      primary_reviewer_id: 'leader-01',
      primary_reviewer_role: 'shift_leader',
      status: 'primary_review_pending',
      missing_peer_sample: false,
      blocker_codes: [],
      created_at: '2026-08-25T08:00:00.000Z',
      updated_at: '2026-08-27T08:00:00.000Z',
    }

    assert.equal(isManagerApprovalActionAvailable(baseReview), false)
    assert.equal(
      isManagerApprovalActionAvailable({
        ...baseReview,
        status: 'manager_approval_pending',
      }),
      true
    )
  })

  it('publishes a clean shift leader review after the Store Manager submits once', () => {
    const review: KpiMonthlyReview = {
      id: 'mr-leader',
      period_id: 'period-2026-08',
      evaluation_id: 'eval-leader',
      employee_id: 'leader-01',
      store_id: 'store-001',
      position_id: 'shift_leader',
      subject_role: 'shift_leader',
      primary_reviewer_id: 'sm-01',
      primary_reviewer_role: 'store_manager',
      status: 'primary_review_pending',
      missing_peer_sample: false,
      blocker_codes: [],
      created_at: '2026-08-25T08:00:00.000Z',
      updated_at: '2026-08-27T08:00:00.000Z',
    }

    const published = advanceMonthlyReview({
      review,
      assignment_count: 0,
      submitted_peer_count: 0,
      primary_submitted: true,
      manager_approved: false,
      integrity_flags: [],
      serious_incident_open: false,
      appeal_open: false,
      at: '2026-08-27T10:00:00.000Z',
    })

    assert.equal(published.status, 'published')
    assert.deepEqual(published.blocker_codes, [])
  })

  it('identifies publication blockers accurately and never includes missing peer sample as a blocker', () => {
    const blockerInput: MonthlyReviewBlockerInput = {
      primary_submitted: false,
      important_source_unconfirmed: true,
      extreme_score_evidence_missing: true,
      serious_incident_open: true,
      appeal_open: false,
      integrity_flags_blocking: true,
      returned_changes_pending: false,
    }

    const blockers = getPublicationBlockers(blockerInput)

    assert.deepEqual(blockers, [
      'PRIMARY_REVIEW_MISSING',
      'IMPORTANT_SOURCE_UNCONFIRMED',
      'EXTREME_SCORE_EVIDENCE_MISSING',
      'SERIOUS_INCIDENT_OPEN',
      'INTEGRITY_REVIEW_REQUIRED',
    ])

    // Đảm bảo không bao giờ có mã blocker cho việc thiếu mẫu peer
    assert.equal((blockers as string[]).includes('MISSING_PEER_SAMPLE'), false)
  })

  it('advances review across standard lifecycle transitions', () => {
    let review = createMonthlyReview({
      period_id: 'period-2026-08',
      evaluation_id: 'eval-01',
      employee: frontlineEmployee,
      subject_role: 'employee',
      primary_reviewer_id: 'leader-01',
      peer_policy: defaultPolicy,
      opened_at: '2026-08-25T08:00:00.000Z',
    })

    // 1. Phân công reviewer xong -> collecting
    review = advanceMonthlyReview({
      review,
      assignment_count: 2,
      submitted_peer_count: 0,
      primary_submitted: false,
      manager_approved: false,
      integrity_flags: [],
      serious_incident_open: false,
      appeal_open: false,
      at: '2026-08-25T09:00:00.000Z',
    })
    assert.equal(review.status, 'collecting')

    // 2. Thu thập đủ phiếu peer -> primary_review_pending
    review = advanceMonthlyReview({
      review,
      assignment_count: 2,
      submitted_peer_count: 2,
      primary_submitted: false,
      manager_approved: false,
      integrity_flags: [],
      serious_incident_open: false,
      appeal_open: false,
      at: '2026-08-26T10:00:00.000Z',
    })
    assert.equal(review.status, 'primary_review_pending')

    // 3. Shift leader chấm điểm xong -> manager_approval_pending
    review = advanceMonthlyReview({
      review,
      assignment_count: 2,
      submitted_peer_count: 2,
      primary_submitted: true,
      manager_approved: false,
      integrity_flags: [],
      serious_incident_open: false,
      appeal_open: false,
      at: '2026-08-27T08:00:00.000Z',
    })
    assert.equal(review.status, 'manager_approval_pending')

    // 4. Store Manager duyệt -> published
    review = approveMonthlyReview({
      review,
      actor: { id: 'sm-01', role: 'store_manager', store_id: 'store-001' },
      at: '2026-08-27T10:00:00.000Z',
    })
    assert.equal(review.status, 'published')
    assert.equal(review.published_at, '2026-08-27T10:00:00.000Z')
    assert.equal(review.appeal_deadline_at, '2026-08-29T10:00:00.000Z') // +48h
  })

  it('keeps the review pending and rejects approval while publication blockers remain', () => {
    const review: KpiMonthlyReview = {
      id: 'mr-blocked',
      period_id: 'period-2026-08',
      evaluation_id: 'eval-01',
      employee_id: 'emp-01',
      store_id: 'store-001',
      position_id: 'cashier',
      subject_role: 'employee',
      primary_reviewer_id: 'leader-01',
      primary_reviewer_role: 'shift_leader',
      status: 'manager_approval_pending',
      missing_peer_sample: false,
      blocker_codes: [],
      created_at: '2026-08-25T08:00:00.000Z',
      updated_at: '2026-08-27T08:00:00.000Z',
    }

    const blocked = advanceMonthlyReview({
      review,
      assignment_count: 2,
      submitted_peer_count: 2,
      primary_submitted: true,
      manager_approved: true,
      integrity_flags: [
        {
          id: 'flag-blocking',
          monthly_review_id: review.id,
          code: 'SOURCE_DIVERGENCE',
          severity: 'blocking',
          evidence_refs: ['source-01'],
          status: 'open',
        },
      ],
      serious_incident_open: false,
      appeal_open: false,
      at: '2026-08-27T10:00:00.000Z',
    })

    assert.equal(blocked.status, 'manager_approval_pending')
    assert.deepEqual(blocked.blocker_codes, ['INTEGRITY_REVIEW_REQUIRED'])
    assert.throws(
      () => approveMonthlyReview({
        review: blocked,
        actor: { id: 'sm-01', role: 'store_manager', store_id: 'store-001' },
        at: '2026-08-27T10:00:00.000Z',
      }),
      /còn lỗi chặn/i
    )
  })

  it('returns a pending review for changes with a mandatory reason', () => {
    const review: KpiMonthlyReview = {
      id: 'mr-return',
      period_id: 'period-2026-08',
      evaluation_id: 'eval-01',
      employee_id: 'emp-01',
      store_id: 'store-001',
      position_id: 'cashier',
      subject_role: 'employee',
      primary_reviewer_id: 'leader-01',
      primary_reviewer_role: 'shift_leader',
      status: 'manager_approval_pending',
      missing_peer_sample: false,
      blocker_codes: [],
      created_at: '2026-08-25T08:00:00.000Z',
      updated_at: '2026-08-27T08:00:00.000Z',
    }

    const returned = returnMonthlyReviewForChanges({
      review,
      actor: { id: 'sm-01', role: 'store_manager', store_id: 'store-001' },
      reason: 'Bổ sung bằng chứng bàn giao ca còn thiếu.',
      at: '2026-08-27T09:00:00.000Z',
    })

    assert.equal(returned.status, 'primary_review_pending')
    assert.deepEqual(returned.blocker_codes, ['RETURNED_CHANGES_PENDING'])
  })

  it('publishes monthly review and updates evaluation status synchronously', () => {
    const review: KpiMonthlyReview = {
      id: 'mr-01',
      period_id: 'period-2026-08',
      evaluation_id: 'eval-01',
      employee_id: 'emp-01',
      store_id: 'store-001',
      position_id: 'cashier',
      subject_role: 'employee',
      primary_reviewer_id: 'leader-01',
      primary_reviewer_role: 'shift_leader',
      status: 'manager_approval_pending',
      missing_peer_sample: false,
      blocker_codes: [],
      created_at: '2026-08-25T08:00:00.000Z',
      updated_at: '2026-08-27T08:00:00.000Z',
    }

    const evaluation: KpiEvaluation = {
      id: 'eval-01',
      period_id: 'period-2026-08',
      employee: frontlineEmployee,
      snapshot: {
        id: 'snap-01',
        set_id: 'set-01',
        version: 1,
        name: 'KPI 2026-08',
        source_status: 'published',
        level_codes: ['pt1_pc'],
        store_ids: ['store-001'],
        effective_from: '2026-08-01',
        effective_to: '2026-08-31',
        score_scale: [1, 2, 3, 4, 5],
        groups: [],
        created_by: 'admin',
        created_at: '2026-08-01T00:00:00.000Z',
      },
      scores: [],
      status: 'preapproved',
      revision: 1,
    }

    const result = publishMonthlyReview({
      review,
      evaluation,
      at: '2026-08-27T10:00:00.000Z',
    })

    assert.equal(result.review.status, 'published')
    assert.equal(result.evaluation.status, 'published')
  })
})
