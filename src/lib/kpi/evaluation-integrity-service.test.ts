import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  detectEvaluationIntegrityFlags,
  resolveIntegrityFlag,
} from './evaluation-integrity-service.ts'
import type {
  KpiActor,
  KpiEvaluationIntegrityFlag,
  KpiPeerAssignment,
  KpiPeerResponse,
} from './types.ts'

describe('evaluation integrity service', () => {
  it('detects reciprocal pair and divergence signals', () => {
    const currentAssignments: KpiPeerAssignment[] = [
      {
        id: 'assign-1',
        monthly_review_id: 'mr-01',
        reviewer_id: 'peer-b',
        rank: 1,
        shared_shift_count: 10,
        total_shift_count: 20,
        selected_by: 'manager',
        status: 'submitted',
      },
    ]

    const reciprocalAssignments: KpiPeerAssignment[] = [
      {
        id: 'assign-2',
        monthly_review_id: 'mr-peer-b',
        reviewer_id: 'emp-01', // emp-01 đánh giá ngược lại peer-b
        rank: 1,
        shared_shift_count: 10,
        total_shift_count: 20,
        selected_by: 'manager',
        status: 'submitted',
      },
    ]

    const responses: KpiPeerResponse[] = [
      {
        id: 'resp-1',
        assignment_id: 'assign-1',
        monthly_review_id: 'mr-01',
        reviewer_id: 'peer-b',
        answers: [
          { question_code: 'peak_teamwork', score: 5, observed_date: '2026-08-10', situation_code: 'peak', evidence_note: 'Hỗ trợ đồng đội rất nhanh trong ca cao điểm.' },
          { question_code: 'proactive_support', score: 5, observed_date: '2026-08-10', situation_code: 'support', evidence_note: 'Chủ động phụ quầy pha chế khi đông khách.' },
          { question_code: 'shift_handover', score: 5, observed_date: '2026-08-10', situation_code: 'handover', evidence_note: 'Bàn giao ca đầy đủ và kiểm đếm chính xác.' },
          { question_code: 'hygiene_process', score: 5, observed_date: '2026-08-10', situation_code: 'clean', evidence_note: 'Dọn dẹp quầy sạch sẽ trước khi ra về.' },
          { question_code: 'team_communication', score: 5, observed_date: '2026-08-10', situation_code: 'talk', evidence_note: 'Giao tiếp rất hòa nhã và tôn trọng đồng đội.' },
        ],
        strength_note: 'Tốt',
        improvement_note: 'Không có',
        direct_observation_confirmed: true,
        submitted_at: '2026-08-26T10:00:00.000Z',
      },
    ]

    const flags = detectEvaluationIntegrityFlags({
      monthly_review_id: 'mr-01',
      subject_id: 'emp-01',
      current_assignments: currentAssignments,
      current_responses: responses,
      all_period_assignments: [...currentAssignments, ...reciprocalAssignments],
      subject_id_by_review: { 'mr-01': 'emp-01', 'mr-peer-b': 'peer-b' },
      historical_assignments: [],
      historical_reviewer_scores: [],
      peer_total_score: 4.8,
      primary_total_score: 3.0, // Lệch 1.8 điểm so với điểm quản lý trực tiếp chấm
    })

    assert.ok(flags.some((f) => f.code === 'RECIPROCAL_PAIR'))
    assert.ok(flags.some((f) => f.code === 'SOURCE_DIVERGENCE'))
  })

  it('detects repeated pairs over 3 consecutive cycles and identical answer vectors', () => {
    const currentAssignments: KpiPeerAssignment[] = [
      {
        id: 'assign-1',
        monthly_review_id: 'mr-01',
        reviewer_id: 'peer-a',
        rank: 1,
        shared_shift_count: 10,
        total_shift_count: 20,
        selected_by: 'manager',
        status: 'submitted',
      },
      {
        id: 'assign-2',
        monthly_review_id: 'mr-01',
        reviewer_id: 'peer-b',
        rank: 2,
        shared_shift_count: 8,
        total_shift_count: 18,
        selected_by: 'manager',
        status: 'submitted',
      },
    ]

    const history: KpiPeerAssignment[] = [
      { id: 'h-1', monthly_review_id: 'mr-prev-1', reviewer_id: 'peer-a', rank: 1, shared_shift_count: 10, total_shift_count: 20, selected_by: 'manager', status: 'submitted' },
      { id: 'h-2', monthly_review_id: 'mr-prev-2', reviewer_id: 'peer-a', rank: 1, shared_shift_count: 10, total_shift_count: 20, selected_by: 'manager', status: 'submitted' },
    ]

    // 2 phiếu có đáp án 5 câu giống hệt nhau
    const responses: KpiPeerResponse[] = [
      {
        id: 'resp-1',
        assignment_id: 'assign-1',
        monthly_review_id: 'mr-01',
        reviewer_id: 'peer-a',
        answers: [
          { question_code: 'peak_teamwork', score: 4 },
          { question_code: 'proactive_support', score: 4 },
          { question_code: 'shift_handover', score: 4 },
          { question_code: 'hygiene_process', score: 4 },
          { question_code: 'team_communication', score: 4 },
        ],
        strength_note: 'Tốt',
        improvement_note: 'Tốt',
        direct_observation_confirmed: true,
        submitted_at: '2026-08-26T10:00:00.000Z',
      },
      {
        id: 'resp-2',
        assignment_id: 'assign-2',
        monthly_review_id: 'mr-01',
        reviewer_id: 'peer-b',
        answers: [
          { question_code: 'peak_teamwork', score: 4 },
          { question_code: 'proactive_support', score: 4 },
          { question_code: 'shift_handover', score: 4 },
          { question_code: 'hygiene_process', score: 4 },
          { question_code: 'team_communication', score: 4 },
        ],
        strength_note: 'Tốt',
        improvement_note: 'Tốt',
        direct_observation_confirmed: true,
        submitted_at: '2026-08-26T11:00:00.000Z',
      },
    ]

    const flags = detectEvaluationIntegrityFlags({
      monthly_review_id: 'mr-01',
      subject_id: 'emp-01',
      current_assignments: currentAssignments,
      current_responses: responses,
      all_period_assignments: currentAssignments,
      historical_assignments: history,
      month_by_review: { 'mr-01': '2026-08', 'mr-prev-1': '2026-07', 'mr-prev-2': '2026-06' },
      historical_reviewer_scores: [],
    })

    assert.ok(flags.some((f) => f.code === 'REPEATED_PAIR'))
    assert.ok(flags.some((f) => f.code === 'IDENTICAL_RESPONSES'))
  })

  it('does not infer reciprocal pairs from review id text and only counts consecutive months', () => {
    const flags = detectEvaluationIntegrityFlags({
      monthly_review_id: 'mr-current',
      subject_id: 'emp-01',
      current_assignments: [
        { id: 'a1', monthly_review_id: 'mr-current', reviewer_id: 'peer-a', rank: 1, shared_shift_count: 8, total_shift_count: 15, selected_by: 'system', status: 'submitted' },
      ],
      current_responses: [],
      all_period_assignments: [
        { id: 'a2', monthly_review_id: 'mr-name-contains-peer-a', reviewer_id: 'emp-other', rank: 1, shared_shift_count: 8, total_shift_count: 15, selected_by: 'system', status: 'submitted' },
      ],
      subject_id_by_review: { 'mr-current': 'emp-01', 'mr-name-contains-peer-a': 'someone-else' },
      historical_assignments: [
        { id: 'h1', monthly_review_id: 'mr-june', reviewer_id: 'peer-a', rank: 1, shared_shift_count: 8, total_shift_count: 15, selected_by: 'system', status: 'submitted' },
        { id: 'h2', monthly_review_id: 'mr-april', reviewer_id: 'peer-a', rank: 1, shared_shift_count: 8, total_shift_count: 15, selected_by: 'system', status: 'submitted' },
      ],
      month_by_review: { 'mr-current': '2026-08', 'mr-june': '2026-06', 'mr-april': '2026-04' },
    })

    assert.equal(flags.some((flag) => flag.code === 'RECIPROCAL_PAIR'), false)
    assert.equal(flags.some((flag) => flag.code === 'REPEATED_PAIR'), false)
  })

  it('allows only HR Admin or CEO to resolve integrity flags with a mandatory reason', () => {
    const flag: KpiEvaluationIntegrityFlag = {
      id: 'flag-01',
      monthly_review_id: 'mr-01',
      code: 'SOURCE_DIVERGENCE',
      severity: 'warning',
      evidence_refs: ['mr-01'],
      status: 'open',
    }

    const hrActor: KpiActor = { id: 'hr-01', role: 'hr_admin', store_id: 'store-001' }
    const leaderActor: KpiActor = { id: 'leader-01', role: 'shift_leader', store_id: 'store-001' }

    // Quản lý ca không được resolve flag
    assert.throws(
      () =>
        resolveIntegrityFlag({
          flag,
          actor: leaderActor,
          decision: 'dismissed',
          reason: 'Đã trao đổi',
        }),
      /không có quyền/
    )

    // HR Admin resolve hợp lệ
    const resolved = resolveIntegrityFlag({
      flag,
      actor: hrActor,
      decision: 'dismissed',
      reason: 'Đã xác minh chênh lệch do đặc thù phân ca độc lập.',
    })

    assert.equal(resolved.status, 'dismissed')
    assert.equal(resolved.resolved_by, 'hr-01')
    assert.equal(resolved.resolution_reason, 'Đã xác minh chênh lệch do đặc thù phân ca độc lập.')
  })
})
