import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PEER_QUESTION_CODES,
  validatePeerResponseDraft,
  submitPeerResponse,
  toManagerPeerProgressDto,
  toEmployeePeerAggregateDto,
  type PeerResponseDraftInput,
} from './peer-response-service.ts'
import { getDefaultPeerReviewPolicy } from './peer-review-policy-service.ts'
import type {
  KpiPeerAssignment,
  KpiPeerAggregate,
  KpiPeerResponse,
} from './types.ts'

describe('peer response service', () => {
  const policy = getDefaultPeerReviewPolicy()

  const sampleAssignment: KpiPeerAssignment = {
    id: 'peer_assignment_rev1_peerA',
    monthly_review_id: 'rev-1',
    reviewer_id: 'peer-a',
    rank: 1,
    shared_shift_count: 10,
    total_shift_count: 18,
    selected_by: 'manager',
    status: 'assigned',
    assigned_at: '2026-08-25T08:00:00.000Z',
    deadline_at: '2026-08-27T08:00:00.000Z',
  }

  it('validates 5 question codes, scores 1-5, and extreme evidence requirements', () => {
    // 1. Bản nháp thiếu evidence cho điểm 5 (cực trị)
    const draftMissingExtremeEvidence: PeerResponseDraftInput = {
      answers: PEER_QUESTION_CODES.map((code) => ({
        question_code: code,
        score: 5 as const,
      })),
      strength_note: 'Bạn làm việc rất tốt và chủ động trong ca.',
      improvement_note: 'Cần chú ý vệ sinh máy móc kỹ hơn sau giờ cao điểm.',
      direct_observation_confirmed: true,
    }

    const issues1 = validatePeerResponseDraft(
      { assignment: sampleAssignment, draft: draftMissingExtremeEvidence },
      policy
    )
    assert.equal(
      issues1.some((issue) => issue.code === 'MISSING_EXTREME_EVIDENCE'),
      true
    )

    // 2. Bản nháp hợp lệ đầy đủ evidence cho điểm cực trị
    const validDraft: PeerResponseDraftInput = {
      answers: [
        {
          question_code: 'peak_teamwork',
          score: 5,
          observed_date: '2026-08-15',
          situation_code: 'peak_hour',
          evidence_note:
            'Hỗ trợ quầy pha chế ra món rất nhanh trong khung giờ cao điểm 12h-14h.',
        },
        { question_code: 'proactive_support', score: 4 },
        { question_code: 'shift_handover', score: 3 },
        {
          question_code: 'hygiene_process',
          score: 1,
          observed_date: '2026-08-18',
          situation_code: 'closing_checklist',
          evidence_note:
            'Quên rửa vòi đánh sữa 2 lần khi đóng ca làm việc tối ngày 18.',
        },
        { question_code: 'team_communication', score: 4 },
      ],
      strength_note: 'Giao tiếp tốt với đồng đội và khách hàng.',
      improvement_note: 'Cần kiểm tra kỹ checklist đóng ca trước khi về.',
      direct_observation_confirmed: true,
    }

    const issues2 = validatePeerResponseDraft(
      { assignment: sampleAssignment, draft: validDraft },
      policy
    )
    assert.deepEqual(issues2, [])
  })

  it('rejects submissions when direct observation is not confirmed or summary notes are missing', () => {
    const draftWithoutConfirmation: PeerResponseDraftInput = {
      answers: PEER_QUESTION_CODES.map((code) => ({
        question_code: code,
        score: 3 as const,
      })),
      strength_note: '',
      improvement_note: '',
      direct_observation_confirmed: false,
    }

    const issues = validatePeerResponseDraft(
      { assignment: sampleAssignment, draft: draftWithoutConfirmation },
      policy
    )
    assert.equal(
      issues.some((issue) => issue.code === 'OBSERVATION_NOT_CONFIRMED'),
      true
    )
    assert.equal(
      issues.some((issue) => issue.code === 'MISSING_SUMMARY_NOTE'),
      true
    )
  })

  it('submits response and locks assignment status to submitted', () => {
    const validDraft: PeerResponseDraftInput = {
      answers: PEER_QUESTION_CODES.map((code) => ({
        question_code: code,
        score: 4 as const,
      })),
      strength_note: 'Làm việc năng nổ và nhiệt tình.',
      improvement_note: 'Nên chú ý giờ giấc đúng ca hơn.',
      direct_observation_confirmed: true,
    }

    const result = submitPeerResponse({
      assignment: sampleAssignment,
      reviewer_id: 'peer-a',
      draft: validDraft,
      policy,
      submitted_at: '2026-08-26T10:00:00.000Z',
    })

    assert.equal(result.assignment.status, 'submitted')
    assert.equal(result.response.reviewer_id, 'peer-a')
    assert.equal(result.response.monthly_review_id, 'rev-1')
    assert.equal(result.response.answers.length, 5)

    // Không cho phép submit lại nếu assignment đã expired hoặc replaced
    const expiredAssignment: KpiPeerAssignment = {
      ...sampleAssignment,
      status: 'expired',
    }
    assert.throws(
      () =>
        submitPeerResponse({
          assignment: expiredAssignment,
          reviewer_id: 'peer-a',
          draft: validDraft,
          policy,
          submitted_at: '2026-08-28T10:00:00.000Z',
        }),
      /ASSIGNMENT_NOT_ACTIVE/
    )
  })

  it('produces role-safe sanitized DTOs for managers and employees', () => {
    const assignments: KpiPeerAssignment[] = [
      {
        ...sampleAssignment,
        status: 'submitted',
      },
      {
        ...sampleAssignment,
        id: 'peer_assignment_rev1_peerB',
        reviewer_id: 'peer-b',
        status: 'assigned',
      },
    ]

    const responses: KpiPeerResponse[] = [
      {
        id: 'resp-1',
        assignment_id: sampleAssignment.id,
        monthly_review_id: 'rev-1',
        reviewer_id: 'peer-a',
        answers: PEER_QUESTION_CODES.map((code) => ({
          question_code: code,
          score: 4 as const,
        })),
        strength_note: 'Nhiệt tình',
        improvement_note: 'Đúng giờ hơn',
        direct_observation_confirmed: true,
        submitted_at: '2026-08-26T10:00:00.000Z',
      },
    ]

    // DTO cho quản lý: Chỉ thấy tiến độ tổng quát, không chứa reviewer_id hay điểm chi tiết của từng người
    const managerDto = toManagerPeerProgressDto({
      assignments,
      responses,
      policy,
    })

    assert.equal(managerDto.required_count, 2)
    assert.equal(managerDto.submitted_count, 1)
    assert.equal(managerDto.expired_count, 0)
    assert.equal(managerDto.enough_anonymous_sample, false) // Mới có 1/2 phiếu

    // DTO cho nhân viên: Chỉ thấy kết quả aggregate khi đủ 2 phiếu
    const aggregate: KpiPeerAggregate = {
      monthly_review_id: 'rev-1',
      valid_response_count: 2,
      enough_anonymous_sample: true,
      question_scores: PEER_QUESTION_CODES.map((code) => ({
        question_code: code,
        score: 4.2,
      })),
      total_score: 4.2,
      strength_summary: 'Hỗ trợ đồng đội xuất sắc',
      improvement_summary: 'Bàn giao ca chu đáo hơn',
      configured_weight_percent: 10,
      applied_peer_weight_percent: 10,
      fallback_primary_weight_percent: 0,
    }

    const employeeDto = toEmployeePeerAggregateDto(aggregate)
    assert.equal(employeeDto.enough_anonymous_sample, true)
    assert.equal(employeeDto.total_score, 4.2)
    assert.equal(employeeDto.strength_summary, 'Hỗ trợ đồng đội xuất sắc')
  })
})
