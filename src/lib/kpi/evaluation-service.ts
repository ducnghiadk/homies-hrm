import {
  calculateEvaluation,
  mapMetricToScore,
  requiresAdjustmentReason,
  requiresEvidence,
} from './scoring-engine.ts'
import type { KpiSourceDatum } from './source-service.ts'
import { resolveCriterionTarget } from './target-policy-service.ts'
import type {
  KpiActor,
  KpiCriterionDefinition,
  KpiEmployeeRef,
  KpiEvaluation,
  KpiPeerAggregate,
  KpiPeriod,
} from './types.ts'

export interface LeaderScoreInput {
  criterion_id: string
  score: number
  adjustment_reason?: string
  evidence_refs: string[]
}

export interface KpiSubmissionIssue {
  code: 'MISSING_SCORE' | 'MISSING_SOURCE' | 'MISSING_REASON' | 'MISSING_EVIDENCE'
  criterion_id: string
  message: string
}

export function createEvaluationFromPeriod(period: KpiPeriod, employee: KpiEmployeeRef): KpiEvaluation {
  const criteria = flattenCriteria(period.snapshot.groups)

  return {
    id: `eval_${employee.id}_${period.id}`,
    period_id: period.id,
    employee,
    snapshot: structuredClone(period.snapshot),
    scores: criteria.map((criterion) => ({
      criterion_id: criterion.id,
      source_refs: [],
      evidence_refs: [],
    })),
    status: 'draft',
    revision: 0,
  }
}

export function applySuggestedScores(evaluation: KpiEvaluation, sources: KpiSourceDatum[]): KpiEvaluation {
  const criterionMap = new Map(flattenCriteria(evaluation.snapshot.groups).map((criterion) => [criterion.id, criterion]))

  return {
    ...evaluation,
    scores: evaluation.scores.map((score) => {
      const criterion = criterionMap.get(score.criterion_id)
      if (!criterion?.source_key) {
        return score
      }

      const source = resolveSuggestedSource(sources, criterion.source_key)
      if (!source || !['ready', 'confirmed'].includes(source.status) || source.value === undefined) {
        return score
      }

      const resolvedTarget = resolveCriterionTarget(
        evaluation.snapshot,
        criterion.id,
        evaluation.employee.store_id,
        source.captured_at
      )

      return {
        ...score,
        suggested_score: mapMetricToScore(source.value, resolvedTarget?.score_bands ?? criterion.score_bands),
        source_refs: [source.key],
      }
    }),
  }
}

export function updateLeaderScore(evaluation: KpiEvaluation, input: LeaderScoreInput): KpiEvaluation {
  assertScoreInRange(input.score)

  return {
    ...evaluation,
    scores: evaluation.scores.map((score) => (
      score.criterion_id === input.criterion_id
        ? {
            ...score,
            final_score: input.score,
            adjustment_reason: input.adjustment_reason,
            evidence_refs: [...input.evidence_refs],
          }
        : score
    )),
  }
}

export function applyPeerAggregateToEvaluation(
  evaluation: KpiEvaluation,
  aggregate: KpiPeerAggregate,
  peerCriterionIds?: string[]
): KpiEvaluation {
  const targetCriterionIds = new Set(peerCriterionIds ?? [])

  const nextScores = evaluation.scores.map((score) => {
    if (
      aggregate.enough_anonymous_sample &&
      aggregate.total_score !== undefined &&
      (targetCriterionIds.has(score.criterion_id) ||
        score.criterion_id.includes('team') ||
        score.criterion_id.includes('peer'))
    ) {
      return {
        ...score,
        suggested_score: aggregate.total_score,
        source_refs: ['peer.anonymous_review'],
      }
    }
    return score
  })

  const peerSummary = {
    total_score: aggregate.total_score,
    enough_anonymous_sample: aggregate.enough_anonymous_sample,
    applied_weight_percent: aggregate.applied_peer_weight_percent,
    fallback_primary_weight_percent: aggregate.fallback_primary_weight_percent,
    strength_summary: aggregate.strength_summary,
    improvement_summary: aggregate.improvement_summary,
  }

  return {
    ...evaluation,
    scores: nextScores,
    peer_summary: peerSummary,
  }
}

export function validateEvaluationSubmission(evaluation: KpiEvaluation): KpiSubmissionIssue[] {
  const criteria = flattenCriteria(evaluation.snapshot.groups)
  const issues: KpiSubmissionIssue[] = []

  for (const criterion of criteria) {
    const score = evaluation.scores.find((item) => item.criterion_id === criterion.id)
    if (!score) {
      issues.push({
        code: 'MISSING_SCORE',
        criterion_id: criterion.id,
        message: 'Chua co diem cho tieu chi nay',
      })
      continue
    }

    const resolvedScore = score.final_score ?? score.suggested_score
    if (resolvedScore === undefined) {
      issues.push({
        code: score.source_refs.length === 0 && criterion.source_key ? 'MISSING_SOURCE' : 'MISSING_SCORE',
        criterion_id: criterion.id,
        message: score.source_refs.length === 0 && criterion.source_key
          ? 'Chua co nguon du lieu de goi y diem'
          : 'Chua co diem cho tieu chi nay',
      })
      continue
    }

    if (requiresAdjustmentReason({
      criterion,
      suggested_score: score.suggested_score,
      final_score: score.final_score,
    }) && !score.adjustment_reason?.trim()) {
      issues.push({
        code: 'MISSING_REASON',
        criterion_id: criterion.id,
        message: 'Can ghi ro ly do khi leader sua diem goi y',
      })
    }

    if (requiresEvidence({
      criterion,
      suggested_score: score.suggested_score,
      final_score: score.final_score,
      evidence_refs: score.evidence_refs,
    }) && score.evidence_refs.length === 0) {
      issues.push({
        code: 'MISSING_EVIDENCE',
        criterion_id: criterion.id,
        message: 'Can bo sung bang chung cho diem duoi nguong',
      })
    }
  }

  return issues
}

export function submitEvaluation(evaluation: KpiEvaluation, actor: KpiActor): KpiEvaluation {
  if (!['shift_leader', 'store_manager', 'hr_admin', 'ceo', 'area_manager'].includes(actor.role)) {
    throw new Error('Vai tro hien tai khong duoc gui phieu KPI')
  }

  const issues = validateEvaluationSubmission(evaluation)
  if (issues.length > 0) {
    throw new Error('Phieu KPI chua du dieu kien gui')
  }

  const criteria = flattenCriteria(evaluation.snapshot.groups)
  const result = calculateEvaluation(
    evaluation.scores.map((score) => ({
      criterion: criteria.find((criterion) => criterion.id === score.criterion_id)!,
      suggested_score: score.suggested_score,
      final_score: score.final_score,
      adjustment_reason: score.adjustment_reason,
      evidence_refs: score.evidence_refs,
    }))
  )

  return {
    ...evaluation,
    total_score: result.total_score,
    status: 'submitted',
    revision: evaluation.revision + 1,
  }
}

export function autosaveEvaluation(evaluation: KpiEvaluation, nextRevision: number): KpiEvaluation {
  if (nextRevision <= evaluation.revision) {
    throw new Error('Du lieu da duoc nguoi khac cap nhat')
  }

  return {
    ...evaluation,
    revision: nextRevision,
  }
}

export interface KpiEvaluationScoreSummary {
  suggested_total?: number
  resolved_total?: number
}

export function getEvaluationScoreSummary(
  evaluation: Pick<KpiEvaluation, 'snapshot' | 'scores' | 'status' | 'total_score'>
): KpiEvaluationScoreSummary {
  const criteria = flattenCriteria(evaluation.snapshot.groups)
  const scoreMap = new Map(
    evaluation.scores.map((score) => [score.criterion_id, score])
  )

  const suggestedResult = calculateEvaluation(
    criteria.map((criterion) => {
      const score = scoreMap.get(criterion.id)

      return {
        criterion,
        suggested_score: score?.suggested_score,
      }
    })
  )

  const resolvedResult = calculateEvaluation(
    criteria.map((criterion) => {
      const score = scoreMap.get(criterion.id)

      return {
        criterion,
        suggested_score: score?.suggested_score,
        final_score: score?.final_score,
        adjustment_reason: score?.adjustment_reason,
        evidence_refs: score?.evidence_refs,
      }
    })
  )

  const canExposeResolvedTotal =
    evaluation.status === 'submitted' ||
    evaluation.status === 'preapproved' ||
    evaluation.status === 'published' ||
    evaluation.status === 'locked'

  return {
    suggested_total: suggestedResult.total_score,
    resolved_total: canExposeResolvedTotal
      ? evaluation.total_score ?? resolvedResult.total_score
      : undefined,
  }
}

function flattenCriteria(groups: Array<{ criteria: KpiCriterionDefinition[] }>): KpiCriterionDefinition[] {
  return groups.flatMap((group) => group.criteria).filter((criterion) => criterion.active)
}

function assertScoreInRange(score: number) {
  if (score < 1 || score > 5) {
    throw new Error(`Diem KPI phai nam trong thang 1-5, nhan duoc ${score}`)
  }
}

function resolveSuggestedSource(sources: KpiSourceDatum[], key: string) {
  const candidates = sources.filter((item) => item.key === key)

  if (candidates.length === 0) {
    return undefined
  }

  return candidates.sort((left, right) => {
    const leftPriority = left.status === 'confirmed' ? 2 : left.status === 'ready' ? 1 : 0
    const rightPriority = right.status === 'confirmed' ? 2 : right.status === 'ready' ? 1 : 0
    return rightPriority - leftPriority
  })[0]
}
