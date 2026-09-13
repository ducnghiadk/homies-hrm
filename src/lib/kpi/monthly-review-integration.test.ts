import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type {
  KpiEmployeeRef,
  KpiEvaluation,
  KpiPeerAssignment,
  KpiPeerResponse,
  KpiPeerReviewPolicy,
} from './types.ts'

import type { KpiPeerCandidateFact } from './peer-assignment-service.ts'

const {
  rankPeerCandidates,
  selectPeerReviewers,
  autoSelectPeerReviewers,
  activateReplacementReviewer,
} = await import('./peer-assignment-service.ts')

const {
  validatePeerResponseDraft,
  submitPeerResponse,
  PEER_QUESTION_CODES,
} = await import('./peer-response-service.ts')

const {
  aggregatePeerResponses,
} = await import('./peer-aggregation-service.ts')

const {
  applyPeerAggregateToEvaluation,
} = await import('./evaluation-service.ts')

const {
  createMonthlyReview,
  advanceMonthlyReview,
  getPublicationBlockers,
  publishMonthlyReview,
} = await import('./monthly-review-service.ts')

const {
  resolveIntegrityFlag,
} = await import('./evaluation-integrity-service.ts')

const {
  createMonthlyAppeal,
  isEvaluationUsableForPromotion,
  decideAppeal,
} = await import('./appeal-service.ts')

const {
  evaluatePromotionEligibility,
} = await import('./development-service.ts')

const { getDefaultPeerReviewPolicy } = await import('./peer-review-policy-service.ts')

describe('Monthly KPI Review & Anonymous Peer Review Integration Flows', () => {
  const policy: KpiPeerReviewPolicy = getDefaultPeerReviewPolicy()

  const targetEmployee: KpiEmployeeRef = {
    id: 'emp_target',
    store_id: 'store_001',
    level_code: 'pt1_pc',
    position_id: 'cashier',
    employment_status: 'official',
  }

  const leaderEmployee: KpiEmployeeRef = {
    id: 'emp_leader',
    store_id: 'store_001',
    level_code: 'shift_leader',
    position_id: 'leader',
    employment_status: 'official',
  }

  const candidateFacts: KpiPeerCandidateFact[] = [
    {
      employee_id: 'emp_peer1',
      role: 'employee',
      status: 'active',
      probation: false,
      suspended: false,
      serious_incident_open: false,
      total_shifts: 22,
      shared_shifts: 14,
      reviewed_subject_last_month: false,
      reciprocal_in_period: false,
    },
    {
      employee_id: 'emp_peer2',
      role: 'employee',
      status: 'active',
      probation: false,
      suspended: false,
      serious_incident_open: false,
      total_shifts: 20,
      shared_shifts: 11,
      reviewed_subject_last_month: false,
      reciprocal_in_period: false,
    },
    {
      employee_id: 'emp_peer3',
      role: 'employee',
      status: 'active',
      probation: false,
      suspended: false,
      serious_incident_open: false,
      total_shifts: 18,
      shared_shifts: 8,
      reviewed_subject_last_month: false,
      reciprocal_in_period: false,
    },
  ]

  const baseEvaluation: KpiEvaluation = {
    id: 'eval_emp_target_2026_08',
    period_id: 'period-2026-08',
    employee: targetEmployee,
    status: 'draft',
    revision: 1,
    scores: [
      {
        criterion_id: 'core_skill',
        suggested_score: 4.0,
        final_score: 4.0,
        evidence_refs: ['pos_data'],
        source_refs: ['pos'],
      },
    ],
    total_score: 4.0,
    grade_code: 'good',
    snapshot: {
      id: 'set_01_v1',
      set_id: 'set_01',
      version: 1,
      name: 'KPI Thu Ngân Chuẩn',
      level_codes: ['pt1_pc'],
      store_ids: 'all',
      effective_from: '2026-08-01T00:00:00.000Z',
      score_scale: [1, 2, 3, 4, 5],
      groups: [
        {
          id: 'g1',
          name: 'Kỹ năng cốt lõi',
          tag: 'operations',
          weight: 90,
          promotion_core: true,
          sort_order: 1,
          criteria: [
            {
              id: 'core_skill',
              group_id: 'g1',
              name: 'Kỹ năng bán hàng',
              description: 'Đánh giá kỹ năng bán hàng',
              scoring_mode: 'combined',
              weight: 90,
              unit: 'count',
              direction: 'higher',
              score_bands: [],
              adjustment_reason_required: true,
              sort_order: 1,
              active: true,
            },
          ],
        },
      ],
      source_status: 'published',
      created_by: 'admin',
      created_at: '2026-08-20T10:00:00.000Z',
    },
  }

  // 1. Flow chính: Quản lý chọn 2 người -> 2 người chấm -> Trưởng ca chấm -> Quản lý duyệt -> Công bố
  it('Scenario 1: Standard happy path (Manager select -> 2 submits -> Primary submit -> Manager approve -> Publish)', () => {
    // 1.1 Khởi tạo Monthly Review cho nhân viên tuyến đầu
    const review = createMonthlyReview({
      period_id: 'period-2026-08',
      evaluation_id: baseEvaluation.id,
      employee: targetEmployee,
      subject_role: 'employee',
      primary_reviewer_id: 'emp_leader',
      peer_policy: policy,
      opened_at: '2026-08-20T00:00:00.000Z',
    })
    assert.equal(review.status, 'assignment_pending')

    // 1.2 Xếp hạng ứng viên và Quản lý chọn 2 người
    const ranked = rankPeerCandidates({
      subject_id: 'emp_target',
      primary_reviewer_id: 'emp_leader',
      facts: candidateFacts,
      policy,
    })
    assert.equal(ranked.length, 3)

    const selectedAssignments = selectPeerReviewers({
      monthly_review_id: review.id,
      candidates: ranked,
      reviewer_ids: ['emp_peer1', 'emp_peer2'],
      actor_id: 'mgr_01',
      selected_at: '2026-08-20T08:00:00.000Z',
      policy,
    })
    assert.equal(selectedAssignments.length, 2)

    // 1.3 Chuyển trạng thái review sang collecting
    const reviewInCollecting = advanceMonthlyReview({
      review,
      assignment_count: 2,
      submitted_peer_count: 0,
      primary_submitted: false,
      manager_approved: false,
      integrity_flags: [],
      serious_incident_open: false,
      appeal_open: false,
      at: '2026-08-20T08:00:00.000Z',
    })
    assert.equal(reviewInCollecting.status, 'collecting')

    // 1.4 Hai người đồng nghiệp nộp phiếu chấm
    const responses: KpiPeerResponse[] = selectedAssignments.map((assign) => {
      const draft = {
        answers: PEER_QUESTION_CODES.map((code) => ({
          question_code: code,
          score: 4 as const,
        })),
        strength_note: 'Làm việc nhiệt tình, hỗ trợ khách hàng nhanh nhẹn.',
        improvement_note: 'Cần chú ý thêm khâu dọn dẹp cuối ca.',
        direct_observation_confirmed: true,
      }
      const issues = validatePeerResponseDraft({ assignment: assign, draft }, policy)
      assert.equal(issues.length, 0)

      return submitPeerResponse({
        assignment: assign,
        reviewer_id: assign.reviewer_id,
        draft,
        policy,
        submitted_at: '2026-08-21T10:00:00.000Z',
      }).response
    })

    assert.equal(responses.length, 2)

    // 1.5 Tổng hợp điểm đồng nghiệp ẩn danh
    const aggregate = aggregatePeerResponses({
      monthly_review_id: review.id,
      policy,
      responses,
    })
    assert.equal(aggregate.enough_anonymous_sample, true)
    assert.equal(aggregate.applied_peer_weight_percent, 10)
    assert.equal(aggregate.total_score, 4.0)

    // 1.6 Áp điểm vào phiếu KPI của nhân viên
    const evaluationWithPeer = applyPeerAggregateToEvaluation(baseEvaluation, aggregate)
    assert.equal(evaluationWithPeer.peer_summary?.total_score, 4.0)

    // 1.7 Chuyển tiếp sang primary_review_pending -> manager_approval_pending -> published
    const reviewInApproval = advanceMonthlyReview({
      review: reviewInCollecting,
      assignment_count: 2,
      submitted_peer_count: 2,
      primary_submitted: true,
      manager_approved: false,
      integrity_flags: [],
      serious_incident_open: false,
      appeal_open: false,
      at: '2026-08-22T08:00:00.000Z',
    })
    assert.equal(reviewInApproval.status, 'manager_approval_pending')

    const blockers = getPublicationBlockers({
      primary_submitted: true,
      important_source_unconfirmed: false,
      extreme_score_evidence_missing: false,
      serious_incident_open: false,
      appeal_open: false,
      integrity_flags_blocking: false,
      returned_changes_pending: false,
    })
    assert.equal(blockers.length, 0)

    const { review: publishedReview, evaluation: publishedEvaluation } = publishMonthlyReview({
      review: reviewInApproval,
      evaluation: evaluationWithPeer,
      at: '2026-08-22T10:00:00.000Z',
    })
    assert.equal(publishedReview.status, 'published')
    assert.equal(publishedEvaluation.status, 'published')
  })

  // 2. Quản lý quá hạn 24h chọn -> Hệ thống tự động chọn Top 2
  it('Scenario 2: Manager selection timeout triggers automatic fallback to Top 2 candidates', () => {
    const ranked = rankPeerCandidates({
      subject_id: 'emp_target',
      primary_reviewer_id: 'emp_leader',
      facts: candidateFacts,
      policy,
    })

    const autoSelected = autoSelectPeerReviewers({
      monthly_review_id: 'review_01',
      candidates: ranked,
      selected_at: '2026-08-21T00:00:00.000Z',
      policy,
    })
    assert.equal(autoSelected.length, 2)
    assert.equal(autoSelected[0]?.reviewer_id, 'emp_peer1')
    assert.equal(autoSelected[1]?.reviewer_id, 'emp_peer2')
  })

  // 3. Người đánh giá quá hạn 48h -> Kích hoạt người dự phòng
  it('Scenario 3: Expired peer assignment activates replacement candidate', () => {
    const ranked = rankPeerCandidates({
      subject_id: 'emp_target',
      primary_reviewer_id: 'emp_leader',
      facts: candidateFacts,
      policy,
    })

    const expiredAssignment: KpiPeerAssignment = {
      id: 'assign_peer1',
      monthly_review_id: 'review_01',
      reviewer_id: 'emp_peer1',
      rank: 1,
      shared_shift_count: 14,
      total_shift_count: 22,
      selected_by: 'manager',
      status: 'assigned',
      assigned_at: '2026-08-20T08:00:00.000Z',
      deadline_at: '2026-08-22T08:00:00.000Z',
    }

    const { replacement } = activateReplacementReviewer({
      expired_assignment: expiredAssignment,
      existing_assignments: [expiredAssignment],
      candidates: ranked,
      activated_at: '2026-08-22T09:00:00.000Z',
      policy,
    })

    assert.ok(replacement)
    assert.equal(replacement.reviewer_id, 'emp_peer2')
    assert.equal(replacement.status, 'assigned')
  })

  // 4. Chỉ có 1 phiếu nộp -> Không đủ mẫu ẩn danh -> Trọng số tự động chuyển về Quản lý
  it('Scenario 4: Insufficient sample (1 response) falls back weight to primary reviewer safely', () => {
    const singleResponse: KpiPeerResponse = {
      id: 'resp_1',
      assignment_id: 'assign_1',
      monthly_review_id: 'review_01',
      reviewer_id: 'emp_peer1',
      direct_observation_confirmed: true,
      answers: PEER_QUESTION_CODES.map((code) => ({
        question_code: code,
        score: 5 as const,
        evidence_note: 'Luôn làm gương và hỗ trợ bạn trong ca',
      })),
      strength_note: 'Rất chủ động trong công việc.',
      improvement_note: 'Tiếp tục phát huy.',
      submitted_at: '2026-08-21T10:00:00.000Z',
    }

    const aggregate = aggregatePeerResponses({
      monthly_review_id: 'review_01',
      policy,
      responses: [singleResponse],
    })

    assert.equal(aggregate.enough_anonymous_sample, false)
    assert.equal(aggregate.applied_peer_weight_percent, 0)
    assert.equal(aggregate.fallback_primary_weight_percent, 10)

    const evaluation = applyPeerAggregateToEvaluation(baseEvaluation, aggregate)
    assert.equal(evaluation.peer_summary?.applied_weight_percent, 0)
    assert.equal(evaluation.peer_summary?.fallback_primary_weight_percent, 10)
    assert.equal(evaluation.peer_summary?.enough_anonymous_sample, false)
  })

  // 5. Cờ bất thường nghiêm trọng (Blocking Flag) -> Chặn công bố -> HR giải quyết -> Công bố
  it('Scenario 5: Integrity blocking flag blocks publication until HR resolves it', () => {
    const blockingFlag = {
      id: 'flag_01',
      monthly_review_id: 'review_01',
      code: 'RECIPROCAL_PAIR' as const,
      severity: 'blocking' as const,
      status: 'open' as const,
      evidence_refs: ['assign_01'],
      created_at: '2026-08-22T00:00:00.000Z',
    }

    // 5.1 Bị chặn khi còn cờ mở
    const blockers = getPublicationBlockers({
      primary_submitted: true,
      integrity_flags_blocking: true,
    })
    assert.ok(blockers.includes('INTEGRITY_REVIEW_REQUIRED'))

    // 5.2 HR xử lý cờ
    const resolvedFlag = resolveIntegrityFlag({
      flag: blockingFlag,
      actor: { id: 'hr_01', role: 'hr_admin' },
      decision: 'dismissed',
      reason: 'Đã xác minh phân ca ngẫu nhiên, không có dấu hiệu liên kết tiêu cực.',
    })
    assert.equal(resolvedFlag.status, 'dismissed')

    // 5.3 Sau khi cờ được giải quyết -> Không còn blocker
    const cleanBlockers = getPublicationBlockers({
      primary_submitted: true,
      integrity_flags_blocking: false,
    })
    assert.equal(cleanBlockers.length, 0)
  })

  // 6. Đánh giá Quản lý ca (Shift Leader) -> Không áp dụng đánh giá đồng nghiệp -> Đi thẳng vào primary_review_pending
  it('Scenario 6: Shift leader evaluation bypasses peer review directly to primary review', () => {
    const leaderReview = createMonthlyReview({
      period_id: 'period-2026-08',
      evaluation_id: 'eval_leader_01',
      employee: leaderEmployee,
      subject_role: 'shift_leader',
      primary_reviewer_id: 'store_manager_01',
      peer_policy: policy,
      opened_at: '2026-08-20T00:00:00.000Z',
    })

    assert.equal(leaderReview.status, 'primary_review_pending')
  })

  // 7. Đã công bố -> Nhân viên khiếu nại -> Tạm khóa thăng tiến -> CEO duyệt khiếu nại -> Mở lại thăng tiến
  it('Scenario 7: Published review with appeal holds promotion until decision', () => {
    // 7.1 Hồ sơ đã công bố hợp lệ
    assert.equal(
      isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: undefined }),
      true
    )

    // 7.2 Nhân viên gửi khiếu nại trong hạn 48h
    const appeal = createMonthlyAppeal({
      employee_id: 'emp_target',
      evaluation_id: baseEvaluation.id,
      reason: 'Đề nghị đối chiếu lại trừ điểm kỷ luật ca ngày 15/08.',
      evidence_refs: ['giai_trinh_ca_15_08'],
      criterion_ids: ['core_skill'],
      submitted_at: '2026-08-21T08:00:00.000Z',
      published_at: '2026-08-20T10:00:00.000Z',
      requester_id: 'emp_target',
    })

    // 7.3 Khiếu nại đang chờ xử lý -> Khóa thăng tiến
    assert.equal(
      isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: appeal.status }),
      false
    )

    const holdCheck = evaluatePromotionEligibility({
      employee: baseEvaluation.employee,
      target_level: 'pt2',
      months_in_level: 4,
      monthly_scores: [
        { month: '2026-06', total: 3.8, core_average: 3.8, valid_hours: 90 },
        { month: '2026-07', total: 3.9, core_average: 3.9, valid_hours: 92 },
        { month: '2026-08', total: 4.0, core_average: 4.0, valid_hours: 95 },
      ],
      critical_incident_dates: [],
      active_warning_dates: [],
      unresolved_appeal_months: ['2026-08'],
      now: '2026-08-22T00:00:00.000Z',
    })
    assert.equal(holdCheck.status, 'not_eligible')

    // 7.4 CEO giải quyết khiếu nại
    const decidedAppeal = decideAppeal(
      appeal,
      {
        result: 'approved',
        note: 'Chấp thuận bổ sung giải trình hợp lệ, cập nhật điểm.',
        score_changes: [{ criterion_id: 'core_skill', old_score: 4.0, new_score: 4.5 }],
      },
      { id: 'ceo_01', role: 'ceo' }
    )
    assert.equal(decidedAppeal.status, 'approved')

    // 7.5 Mở lại quyền xét thăng tiến
    assert.equal(
      isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: decidedAppeal.status }),
      true
    )

    const releasedCheck = evaluatePromotionEligibility({
      employee: baseEvaluation.employee,
      target_level: 'pt2',
      months_in_level: 4,
      monthly_scores: [
        { month: '2026-06', total: 3.8, core_average: 3.8, valid_hours: 90 },
        { month: '2026-07', total: 3.9, core_average: 3.9, valid_hours: 92 },
        { month: '2026-08', total: 4.5, core_average: 4.5, valid_hours: 95 },
      ],
      critical_incident_dates: [],
      active_warning_dates: [],
      unresolved_appeal_months: [],
      now: '2026-08-22T15:00:00.000Z',
    })
    assert.equal(releasedCheck.status, 'eligible_for_test')
  })
})
