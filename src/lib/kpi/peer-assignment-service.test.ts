import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  rankPeerCandidates,
  selectPeerReviewers,
  autoSelectPeerReviewers,
  activateReplacementReviewer,
  type KpiPeerCandidateFact,
} from './peer-assignment-service.ts'
import { getDefaultPeerReviewPolicy } from './peer-review-policy-service.ts'

describe('peer assignment service', () => {
  const policy = getDefaultPeerReviewPolicy()

  const sampleFacts: KpiPeerCandidateFact[] = [
    {
      employee_id: 'peer-a',
      role: 'employee',
      status: 'active',
      probation: false,
      suspended: false,
      serious_incident_open: false,
      total_shifts: 18,
      shared_shifts: 12,
      reviewed_subject_last_month: false,
      reciprocal_in_period: false,
    },
    {
      employee_id: 'peer-b',
      role: 'employee',
      status: 'active',
      probation: false,
      suspended: false,
      serious_incident_open: false,
      total_shifts: 20,
      shared_shifts: 8,
      reviewed_subject_last_month: false,
      reciprocal_in_period: false,
    },
    {
      employee_id: 'peer-c',
      role: 'employee',
      status: 'active',
      probation: true, // bị loại vì đang thử việc
      suspended: false,
      serious_incident_open: false,
      total_shifts: 22,
      shared_shifts: 15,
      reviewed_subject_last_month: false,
      reciprocal_in_period: false,
    },
    {
      employee_id: 'peer-d',
      role: 'employee',
      status: 'active',
      probation: false,
      suspended: false,
      serious_incident_open: false,
      total_shifts: 16,
      shared_shifts: 4, // bị loại vì shared_shifts < 5
      reviewed_subject_last_month: false,
      reciprocal_in_period: false,
    },
    {
      employee_id: 'peer-e',
      role: 'employee',
      status: 'active',
      probation: false,
      suspended: false,
      serious_incident_open: false,
      total_shifts: 25,
      shared_shifts: 12,
      reviewed_subject_last_month: true, // bị xếp sau peer-a vì tháng trước đã đánh giá
      reciprocal_in_period: false,
    },
    {
      employee_id: 'peer-reciprocal',
      role: 'employee',
      status: 'active',
      probation: false,
      suspended: false,
      serious_incident_open: false,
      total_shifts: 20,
      shared_shifts: 10,
      reviewed_subject_last_month: false,
      reciprocal_in_period: true, // bị loại vì subject đã đánh giá người này trong kỳ
    },
  ]

  it('ranks eligible candidates stably and excludes disqualified peers', () => {
    const ranked = rankPeerCandidates({
      subject_id: 'subject-1',
      primary_reviewer_id: 'manager-1',
      facts: sampleFacts,
      policy,
    })

    assert.deepEqual(
      ranked.map((item) => item.employee_id),
      ['peer-a', 'peer-e', 'peer-b']
    )

    assert.equal(ranked[0].rank, 1)
    assert.equal(ranked[0].reason_label, 'Làm chung 12 ca · Tổng 18 ca')
  })

  it('excludes subject and primary reviewer', () => {
    const factsWithSubjectAndReviewer: KpiPeerCandidateFact[] = [
      ...sampleFacts,
      {
        employee_id: 'subject-1',
        role: 'employee',
        status: 'active',
        probation: false,
        suspended: false,
        serious_incident_open: false,
        total_shifts: 20,
        shared_shifts: 20,
        reviewed_subject_last_month: false,
        reciprocal_in_period: false,
      },
      {
        employee_id: 'manager-1',
        role: 'shift_leader',
        status: 'active',
        probation: false,
        suspended: false,
        serious_incident_open: false,
        total_shifts: 20,
        shared_shifts: 20,
        reviewed_subject_last_month: false,
        reciprocal_in_period: false,
      },
    ]

    const ranked = rankPeerCandidates({
      subject_id: 'subject-1',
      primary_reviewer_id: 'manager-1',
      facts: factsWithSubjectAndReviewer,
      policy,
    })

    assert.equal(ranked.some((r) => r.employee_id === 'subject-1'), false)
    assert.equal(ranked.some((r) => r.employee_id === 'manager-1'), false)
  })

  it('allows manager selection of 2 reviewers and validates selection reason for low rank', () => {
    const ranked = rankPeerCandidates({
      subject_id: 'subject-1',
      facts: sampleFacts,
      policy,
    })

    // Chọn đúng 2 người từ danh sách gợi ý
    const assignments = selectPeerReviewers({
      monthly_review_id: 'rev-101',
      candidates: ranked,
      reviewer_ids: ['peer-a', 'peer-b'],
      actor_id: 'manager-1',
      selected_at: '2026-08-25T08:00:00.000Z',
      policy,
    })

    assert.equal(assignments.length, 2)
    assert.equal(assignments[0].status, 'assigned')
    assert.equal(assignments[0].selected_by, 'manager')
    assert.equal(assignments[0].deadline_at, '2026-08-27T08:00:00.000Z') // +48h

    // Ném lỗi nếu chọn khác 2 người
    assert.throws(
      () =>
        selectPeerReviewers({
          monthly_review_id: 'rev-101',
          candidates: ranked,
          reviewer_ids: ['peer-a'],
          actor_id: 'manager-1',
          selected_at: '2026-08-25T08:00:00.000Z',
          policy,
        }),
      /đúng 2 người/
    )
  })

  it('auto-selects top 2 candidates when manager does not select in time', () => {
    const ranked = rankPeerCandidates({
      subject_id: 'subject-1',
      facts: sampleFacts,
      policy,
    })

    const autoAssigned = autoSelectPeerReviewers({
      monthly_review_id: 'rev-101',
      candidates: ranked,
      selected_at: '2026-08-25T08:00:00.000Z',
      policy,
    })

    assert.equal(autoAssigned.length, 2)
    assert.equal(autoAssigned[0].reviewer_id, 'peer-a')
    assert.equal(autoAssigned[1].reviewer_id, 'peer-e')
    assert.equal(autoAssigned[0].selected_by, 'system')
  })

  it('activates replacement reviewer when an assignment expires', () => {
    const ranked = rankPeerCandidates({
      subject_id: 'subject-1',
      facts: sampleFacts,
      policy,
    })

    const autoAssigned = autoSelectPeerReviewers({
      monthly_review_id: 'rev-101',
      candidates: ranked,
      selected_at: '2026-08-25T08:00:00.000Z',
      policy,
    })

    // peer-a hết hạn sau 48h
    const expiredAssignment = autoAssigned[0]

    const result = activateReplacementReviewer({
      expired_assignment: expiredAssignment,
      existing_assignments: autoAssigned,
      candidates: ranked,
      activated_at: '2026-08-27T09:00:00.000Z',
      policy,
    })

    assert.equal(result.expired.status, 'expired')
    assert.ok(result.replacement)
    assert.equal(result.replacement.reviewer_id, 'peer-b') // Người kế tiếp chưa được giao
    assert.equal(result.replacement.status, 'assigned')
    assert.equal(result.replacement.replacement_for_assignment_id, expiredAssignment.id)
  })
})
