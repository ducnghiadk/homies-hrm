import { PEER_QUESTION_CODES } from './peer-response-service.ts'
import type {
  KpiPeerAggregate,
  KpiPeerAnswer,
  KpiPeerResponse,
  KpiPeerReviewPolicy,
} from './types'

export function buildPeerSummary(input: {
  aggregate: KpiPeerAggregate
  responses: KpiPeerResponse[]
}): Pick<KpiPeerAggregate, 'strength_summary' | 'improvement_summary'> {
  const { responses } = input

  if (responses.length === 0) {
    return {}
  }

  const strengths = responses
    .map((r) => r.strength_note.trim())
    .filter(Boolean)

  const improvements = responses
    .map((r) => r.improvement_note.trim())
    .filter(Boolean)

  return {
    strength_summary: strengths.join(' • '),
    improvement_summary: improvements.join(' • '),
  }
}

export function aggregatePeerResponses(input: {
  monthly_review_id: string
  responses: KpiPeerResponse[]
  policy: KpiPeerReviewPolicy
}): KpiPeerAggregate {
  const { monthly_review_id, responses, policy } = input

  const validResponseCount = responses.length
  const enoughAnonymousSample = validResponseCount >= policy.required_reviewer_count

  if (!enoughAnonymousSample) {
    return {
      monthly_review_id,
      valid_response_count: validResponseCount,
      enough_anonymous_sample: false,
      question_scores: [],
      configured_weight_percent: policy.weight_percent,
      applied_peer_weight_percent: 0,
      fallback_primary_weight_percent: policy.weight_percent,
    }
  }

  const questionScores: Array<{
    question_code: KpiPeerAnswer['question_code']
    score: number
  }> = []

  let totalSum = 0

  for (const questionCode of PEER_QUESTION_CODES) {
    const scoresForQuestion = responses
      .map((r) => r.answers.find((a) => a.question_code === questionCode)?.score)
      .filter((s): s is KpiPeerAnswer['score'] => typeof s === 'number')

    const avg =
      scoresForQuestion.length > 0
        ? Number(
            (
              scoresForQuestion.reduce((sum, s) => sum + s, 0) /
              scoresForQuestion.length
            ).toFixed(2)
          )
        : 0

    questionScores.push({
      question_code: questionCode,
      score: avg,
    })
    totalSum += avg
  }

  const totalScore =
    questionScores.length > 0
      ? Number((totalSum / questionScores.length).toFixed(2))
      : 0

  const summary = buildPeerSummary({
    aggregate: {
      monthly_review_id,
      valid_response_count: validResponseCount,
      enough_anonymous_sample: true,
      question_scores: questionScores,
      total_score: totalScore,
      configured_weight_percent: policy.weight_percent,
      applied_peer_weight_percent: policy.weight_percent,
      fallback_primary_weight_percent: 0,
    },
    responses,
  })

  return {
    monthly_review_id,
    valid_response_count: validResponseCount,
    enough_anonymous_sample: true,
    question_scores: questionScores,
    total_score: totalScore,
    strength_summary: summary.strength_summary,
    improvement_summary: summary.improvement_summary,
    configured_weight_percent: policy.weight_percent,
    applied_peer_weight_percent: policy.weight_percent,
    fallback_primary_weight_percent: 0,
  }
}
