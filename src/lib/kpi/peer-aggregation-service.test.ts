import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  aggregatePeerResponses,
  buildPeerSummary,
} from './peer-aggregation-service.ts'
import { getDefaultPeerReviewPolicy } from './peer-review-policy-service.ts'
import type { KpiPeerResponse } from './types.ts'

describe('peer aggregation service', () => {
  const policy = getDefaultPeerReviewPolicy()

  const responseA: KpiPeerResponse = {
    id: 'resp-1',
    assignment_id: 'assign-1',
    monthly_review_id: 'review-1',
    reviewer_id: 'peer-a',
    answers: [
      { question_code: 'peak_teamwork', score: 5, observed_date: '2026-08-10', situation_code: 'peak', evidence_note: 'Hỗ trợ đồng đội rất nhanh trong giờ cao điểm trưa.' },
      { question_code: 'proactive_support', score: 4 },
      { question_code: 'shift_handover', score: 4 },
      { question_code: 'hygiene_process', score: 5, observed_date: '2026-08-12', situation_code: 'clean', evidence_note: 'Khu vực quầy bar luôn sạch sẽ và gọn gàng ngăn nắp.' },
      { question_code: 'team_communication', score: 4 },
    ],
    strength_note: 'Làm việc nhanh nhẹn, tinh thần đồng đội tốt.',
    improvement_note: 'Bàn giao tồn kho chi tiết hơn.',
    direct_observation_confirmed: true,
    submitted_at: '2026-08-26T10:00:00.000Z',
  }

  const responseB: KpiPeerResponse = {
    id: 'resp-2',
    assignment_id: 'assign-2',
    monthly_review_id: 'review-1',
    reviewer_id: 'peer-b',
    answers: [
      { question_code: 'peak_teamwork', score: 4 },
      { question_code: 'proactive_support', score: 4 },
      { question_code: 'shift_handover', score: 3 },
      { question_code: 'hygiene_process', score: 4 },
      { question_code: 'team_communication', score: 5, observed_date: '2026-08-14', situation_code: 'talk', evidence_note: 'Giao tiếp rất hòa nhã và luôn chủ động giúp đỡ người mới.' },
    ],
    strength_note: 'Hòa đồng, hỗ trợ nhiệt tình.',
    improvement_note: 'Cần chú ý kiểm đếm nguyên vật liệu lúc đổi ca.',
    direct_observation_confirmed: true,
    submitted_at: '2026-08-26T11:00:00.000Z',
  }

  it('handles insufficient samples safely and falls back weight to primary reviewer', () => {
    // Chỉ có 1 phiếu (chưa đủ ngưỡng ẩn danh >= 2)
    const aggregate = aggregatePeerResponses({
      monthly_review_id: 'review-1',
      responses: [responseA],
      policy,
    })

    assert.equal(aggregate.valid_response_count, 1)
    assert.equal(aggregate.enough_anonymous_sample, false)
    assert.equal(aggregate.question_scores.length, 0)
    assert.equal(aggregate.total_score, undefined)
    assert.equal(aggregate.configured_weight_percent, 10)
    assert.equal(aggregate.applied_peer_weight_percent, 0)
    assert.equal(aggregate.fallback_primary_weight_percent, 10)
  })

  it('aggregates scores accurately and synthesizes anonymous summary notes when 2 responses exist', () => {
    // Đủ 2 phiếu hợp lệ
    const aggregate = aggregatePeerResponses({
      monthly_review_id: 'review-1',
      responses: [responseA, responseB],
      policy,
    })

    assert.equal(aggregate.valid_response_count, 2)
    assert.equal(aggregate.enough_anonymous_sample, true)
    assert.equal(aggregate.configured_weight_percent, 10)
    assert.equal(aggregate.applied_peer_weight_percent, 10)
    assert.equal(aggregate.fallback_primary_weight_percent, 0)

    // Kiểm tra điểm từng câu:
    // peak_teamwork: (5 + 4) / 2 = 4.5
    // proactive_support: (4 + 4) / 2 = 4.0
    // shift_handover: (4 + 3) / 2 = 3.5
    // hygiene_process: (5 + 4) / 2 = 4.5
    // team_communication: (4 + 5) / 2 = 4.5
    // Tổng điểm TB: (4.5 + 4.0 + 3.5 + 4.5 + 4.5) / 5 = 21.0 / 5 = 4.20
    const peakScore = aggregate.question_scores.find((q) => q.question_code === 'peak_teamwork')?.score
    assert.equal(peakScore, 4.5)

    const handoverScore = aggregate.question_scores.find((q) => q.question_code === 'shift_handover')?.score
    assert.equal(handoverScore, 3.5)

    assert.equal(aggregate.total_score, 4.2)

    // Kiểm tra tóm tắt nhận xét ẩn danh
    const summary = buildPeerSummary({ aggregate, responses: [responseA, responseB] })
    assert.ok(summary.strength_summary)
    assert.ok(summary.improvement_summary)
    assert.equal(summary.strength_summary?.includes('peer-a'), false)
    assert.equal(summary.strength_summary?.includes('peer-b'), false)
  })
})
