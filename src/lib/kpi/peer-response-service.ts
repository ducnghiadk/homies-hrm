import type {
  KpiPeerAnswer,
  KpiPeerAssignment,
  KpiPeerAggregate,
  KpiPeerResponse,
  KpiPeerReviewPolicy,
} from './types'

export const PEER_QUESTION_CODES: KpiPeerAnswer['question_code'][] = [
  'peak_teamwork',
  'proactive_support',
  'shift_handover',
  'hygiene_process',
  'team_communication',
]

export const PEER_QUESTION_LABELS: Record<
  KpiPeerAnswer['question_code'],
  string
> = {
  peak_teamwork: 'Hỗ trợ đồng đội lúc cao điểm',
  proactive_support: 'Chủ động nhận việc & phụ quầy',
  shift_handover: 'Bàn giao ca & kiểm đếm',
  hygiene_process: 'Tuân thủ vệ sinh & quy trình',
  team_communication: 'Giao tiếp & thái độ hòa nhã',
}

export type KpiPeerResponseIssueCode =
  | 'ASSIGNMENT_NOT_ACTIVE'
  | 'QUESTION_SET'
  | 'SCORE_RANGE'
  | 'MISSING_EXTREME_EVIDENCE'
  | 'MISSING_SUMMARY_NOTE'
  | 'OBSERVATION_NOT_CONFIRMED'

export interface KpiPeerResponseIssue {
  code: KpiPeerResponseIssueCode
  message: string
  question_code?: KpiPeerAnswer['question_code']
}

export interface PeerResponseDraftInput {
  answers: KpiPeerAnswer[]
  strength_note: string
  improvement_note: string
  direct_observation_confirmed: boolean
}

export interface KpiManagerPeerProgressDto {
  required_count: 2
  submitted_count: number
  expired_count: number
  replacement_active: boolean
  enough_anonymous_sample: boolean
}

export interface KpiEmployeePeerResultDto {
  total_score?: number
  strength_summary?: string
  improvement_summary?: string
  enough_anonymous_sample: boolean
  unavailable_reason?: 'insufficient_anonymous_sample'
}

export function validatePeerResponseDraft(
  input: {
    assignment: KpiPeerAssignment
    draft: PeerResponseDraftInput
  },
  policy: KpiPeerReviewPolicy
): KpiPeerResponseIssue[] {
  const { assignment, draft } = input
  const issues: KpiPeerResponseIssue[] = []

  if (assignment.status !== 'assigned') {
    issues.push({
      code: 'ASSIGNMENT_NOT_ACTIVE',
      message: 'Phiếu đánh giá không ở trạng thái mở hoặc đã hết hạn.',
    })
  }

  const answeredCodes = new Set(draft.answers.map((a) => a.question_code))
  if (
    draft.answers.length !== PEER_QUESTION_CODES.length ||
    !PEER_QUESTION_CODES.every((code) => answeredCodes.has(code))
  ) {
    issues.push({
      code: 'QUESTION_SET',
      message: `Cần trả lời đầy đủ ${PEER_QUESTION_CODES.length} câu hỏi theo mẫu chuẩn.`,
    })
  }

  for (const answer of draft.answers) {
    if (answer.score < 1 || answer.score > 5) {
      issues.push({
        code: 'SCORE_RANGE',
        message: 'Điểm đánh giá phải nằm trong khoảng từ 1 đến 5.',
        question_code: answer.question_code,
      })
    }

    // Kiểm tra bằng chứng cho điểm cực trị (1, 2, 5 điểm)
    if (answer.score === 1 || answer.score === 2 || answer.score === 5) {
      const noteLength = (answer.evidence_note || '').trim().length
      if (
        !answer.observed_date ||
        !answer.situation_code ||
        noteLength < policy.extreme_comment_min_length
      ) {
        issues.push({
          code: 'MISSING_EXTREME_EVIDENCE',
          message: `Điểm ${answer.score} cần có ngày quan sát, bối cảnh và nhận xét cụ thể tối thiểu ${policy.extreme_comment_min_length} ký tự.`,
          question_code: answer.question_code,
        })
      }
    }
  }

  if (!draft.strength_note || draft.strength_note.trim().length === 0) {
    issues.push({
      code: 'MISSING_SUMMARY_NOTE',
      message: 'Vui lòng ghi nhận điểm mạnh / hành vi tích cực của đồng nghiệp.',
    })
  }

  if (!draft.improvement_note || draft.improvement_note.trim().length === 0) {
    issues.push({
      code: 'MISSING_SUMMARY_NOTE',
      message: 'Vui lòng ghi nhận điểm cần cải thiện để hỗ trợ đồng nghiệp phát triển.',
    })
  }

  if (!draft.direct_observation_confirmed) {
    issues.push({
      code: 'OBSERVATION_NOT_CONFIRMED',
      message: 'Vui lòng xác nhận bạn đã trực tiếp quan sát các hành vi trên trong ca làm việc.',
    })
  }

  return issues
}

export function submitPeerResponse(input: {
  assignment: KpiPeerAssignment
  reviewer_id: string
  draft: PeerResponseDraftInput
  policy: KpiPeerReviewPolicy
  submitted_at: string
}): { assignment: KpiPeerAssignment; response: KpiPeerResponse } {
  const { assignment, reviewer_id, draft, policy, submitted_at } = input

  const issues = validatePeerResponseDraft(
    { assignment, draft },
    policy
  )
  if (issues.length > 0) {
    throw new Error(
      `Phiếu đánh giá chưa hợp lệ: ${issues.map((i) => i.code).join(', ')} - ${issues[0].message}`
    )
  }

  const updatedAssignment: KpiPeerAssignment = {
    ...assignment,
    status: 'submitted',
  }

  const response: KpiPeerResponse = {
    id: `peer_response_${assignment.monthly_review_id}_${reviewer_id}`,
    assignment_id: assignment.id,
    monthly_review_id: assignment.monthly_review_id,
    reviewer_id,
    answers: draft.answers.map((a) => ({ ...a })),
    strength_note: draft.strength_note.trim(),
    improvement_note: draft.improvement_note.trim(),
    direct_observation_confirmed: true,
    submitted_at,
  }

  return { assignment: updatedAssignment, response }
}

export function toManagerPeerProgressDto(input: {
  assignments: KpiPeerAssignment[]
  responses: KpiPeerResponse[]
  policy: KpiPeerReviewPolicy
}): KpiManagerPeerProgressDto {
  const { assignments, policy } = input

  const submittedCount = assignments.filter((a) => a.status === 'submitted').length
  const expiredCount = assignments.filter((a) => a.status === 'expired').length
  const replacementActive = assignments.some(
    (a) => a.status === 'assigned' && Boolean(a.replacement_for_assignment_id)
  )
  const enoughAnonymousSample = submittedCount >= policy.required_reviewer_count

  return {
    required_count: 2,
    submitted_count: submittedCount,
    expired_count: expiredCount,
    replacement_active: replacementActive,
    enough_anonymous_sample: enoughAnonymousSample,
  }
}

export function toEmployeePeerAggregateDto(
  aggregate: KpiPeerAggregate | null
): KpiEmployeePeerResultDto {
  if (!aggregate || !aggregate.enough_anonymous_sample) {
    return {
      enough_anonymous_sample: false,
      unavailable_reason: 'insufficient_anonymous_sample',
    }
  }

  return {
    total_score: aggregate.total_score,
    strength_summary: aggregate.strength_summary,
    improvement_summary: aggregate.improvement_summary,
    enough_anonymous_sample: true,
  }
}
