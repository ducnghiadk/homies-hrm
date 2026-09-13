import type {
  KpiActor,
  KpiEvaluationIntegrityFlag,
  KpiPeerAssignment,
  KpiPeerResponse,
} from './types'

export function detectEvaluationIntegrityFlags(input: {
  monthly_review_id: string
  subject_id: string
  current_assignments: KpiPeerAssignment[]
  current_responses: KpiPeerResponse[]
  all_period_assignments?: KpiPeerAssignment[]
  subject_id_by_review?: Record<string, string>
  month_by_review?: Record<string, string>
  historical_assignments?: KpiPeerAssignment[]
  historical_reviewer_scores?: Array<{ reviewer_id: string; score: number }>
  peer_total_score?: number
  primary_total_score?: number
}): KpiEvaluationIntegrityFlag[] {
  const {
    monthly_review_id,
    subject_id,
    current_assignments,
    current_responses,
    all_period_assignments = [],
    subject_id_by_review = {},
    month_by_review = {},
    historical_assignments = [],
    peer_total_score,
    primary_total_score,
  } = input

  const flags: KpiEvaluationIntegrityFlag[] = []

  // 1. RECIPROCAL_PAIR: Phát hiện đánh giá chéo qua lại trong cùng kỳ
  const currentReviewerIds = new Set(
    current_assignments.map((a) => a.reviewer_id)
  )

  const reciprocal = all_period_assignments.some((assignment) => (
    assignment.monthly_review_id !== monthly_review_id &&
    assignment.reviewer_id === subject_id &&
    currentReviewerIds.has(subject_id_by_review[assignment.monthly_review_id] ?? '')
  ))

  if (reciprocal) {
    const reciprocalAssignment = current_assignments.find((assignment) => currentReviewerIds.has(assignment.reviewer_id))
    flags.push({
      id: `flag_${monthly_review_id}_RECIPROCAL_PAIR`,
      monthly_review_id,
      code: 'RECIPROCAL_PAIR',
      severity: 'warning',
      evidence_refs: reciprocalAssignment ? [`assignment:${reciprocalAssignment.id}`] : [monthly_review_id],
      status: 'open',
    })
  }

  // 2. REPEATED_PAIR: Cùng một người đánh giá 3 kỳ liên tiếp
  for (const assignment of current_assignments) {
    const currentMonth = month_by_review[monthly_review_id]
    const requiredPreviousMonths = currentMonth ? [previousMonth(currentMonth), previousMonth(previousMonth(currentMonth))] : []
    const reviewerHistoryMonths = new Set(historical_assignments
      .filter((historical) => historical.reviewer_id === assignment.reviewer_id)
      .map((historical) => month_by_review[historical.monthly_review_id])
      .filter(Boolean))
    if (requiredPreviousMonths.length === 2 && requiredPreviousMonths.every((month) => reviewerHistoryMonths.has(month))) {
      flags.push({
        id: `flag_${monthly_review_id}_REPEATED_PAIR_${assignment.reviewer_id}`,
        monthly_review_id,
        code: 'REPEATED_PAIR',
        severity: 'info',
        evidence_refs: [`assignment:${assignment.id}`],
        status: 'open',
      })
    }
  }

  // 3. IDENTICAL_RESPONSES: Hai phiếu nộp có 5 câu trả lời giống hệt nhau
  if (current_responses.length >= 2) {
    const [r1, r2] = current_responses
    const isIdentical =
      r1.answers.length === r2.answers.length &&
      r1.answers.every((a1) => {
        const a2 = r2.answers.find((a) => a.question_code === a1.question_code)
        return a2 && a2.score === a1.score
      })

    if (isIdentical) {
      flags.push({
        id: `flag_${monthly_review_id}_IDENTICAL_RESPONSES`,
        monthly_review_id,
        code: 'IDENTICAL_RESPONSES',
        severity: 'warning',
        evidence_refs: [`assignment:${r1.assignment_id}`, `assignment:${r2.assignment_id}`],
        status: 'open',
      })
    }
  }

  // 4. EXTREME_WITH_WEAK_EVIDENCE: Điểm 1, 2, 5 có bằng chứng < 20 ký tự
  for (const resp of current_responses) {
    for (const ans of resp.answers) {
      if (ans.score === 1 || ans.score === 2 || ans.score === 5) {
        const len = (ans.evidence_note || '').trim().length
        if (len < 20) {
          flags.push({
            id: `flag_${monthly_review_id}_EXTREME_WEAK_${ans.question_code}`,
            monthly_review_id,
            code: 'EXTREME_WITH_WEAK_EVIDENCE',
            severity: 'warning',
            evidence_refs: [`assignment:${resp.assignment_id}`],
            status: 'open',
          })
        }
      }
    }
  }

  // 5. SOURCE_DIVERGENCE: Điểm peer lệch điểm primary >= 1.5
  if (
    typeof peer_total_score === 'number' &&
    typeof primary_total_score === 'number' &&
    Math.abs(peer_total_score - primary_total_score) >= 1.5
  ) {
    flags.push({
      id: `flag_${monthly_review_id}_SOURCE_DIVERGENCE`,
      monthly_review_id,
      code: 'SOURCE_DIVERGENCE',
      severity: 'warning',
      evidence_refs: [monthly_review_id],
      status: 'open',
    })
  }

  return flags
}

function previousMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 2, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function resolveIntegrityFlag(input: {
  flag: KpiEvaluationIntegrityFlag
  actor: KpiActor
  decision: 'dismissed' | 'confirmed'
  reason: string
}): KpiEvaluationIntegrityFlag {
  const { flag, actor, decision, reason } = input

  if (!['hr_admin', 'ceo'].includes(actor.role)) {
    throw new Error('Vai trò hiện tại không có quyền xử lý cờ liêm chính.')
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error('Vui lòng nhập lý do giải quyết cờ liêm chính.')
  }

  return {
    ...flag,
    status: decision,
    resolved_by: actor.id,
    resolution_reason: reason.trim(),
  }
}
