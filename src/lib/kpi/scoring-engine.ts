import type { KpiCriterionDefinition, KpiScoreBand } from './types'

type CriterionPolicy = Pick<KpiCriterionDefinition, 'id' | 'weight' | 'adjustment_reason_required' | 'evidence_required_below'>

export interface KpiWeightedScoreInput {
  score: number
  weight: number
}

export interface KpiEvaluationInput {
  criterion: CriterionPolicy
  suggested_score?: number
  final_score?: number
  adjustment_reason?: string
  evidence_refs?: string[]
}

export interface KpiEvaluationResult {
  total_score?: number
  missing_data: string[]
  missing_adjustment_reasons: string[]
  missing_evidence: string[]
}

export function mapMetricToScore(value: number, bands: KpiScoreBand[]): number {
  const band = bands.find((item) => value >= item.min && (item.max === null || value <= item.max))

  if (!band) {
    throw new Error(`Khong co muc quy doi cho gia tri ${value}`)
  }

  return band.score
}

export function calculateWeightedScore(items: KpiWeightedScoreInput[]): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)

  if (totalWeight !== 100) {
    throw new Error(`Tong trong so phai bang 100%, hien tai ${totalWeight}%`)
  }

  for (const item of items) {
    assertScoreInRange(item.score)
  }

  const total = items.reduce((sum, item) => sum + item.score * item.weight / 100, 0)

  return clampScore(Math.round(total))
}

export function requiresAdjustmentReason(input: Pick<KpiEvaluationInput, 'criterion' | 'suggested_score' | 'final_score'>): boolean {
  if (!input.criterion.adjustment_reason_required) {
    return false
  }

  if (input.suggested_score === undefined || input.final_score === undefined) {
    return false
  }

  return input.suggested_score !== input.final_score
}

export function requiresEvidence(input: Pick<KpiEvaluationInput, 'criterion' | 'suggested_score' | 'final_score' | 'evidence_refs'>): boolean {
  const resolvedScore = resolveScore(input.suggested_score, input.final_score)

  if (resolvedScore === undefined) {
    return false
  }

  if (input.criterion.evidence_required_below === undefined) {
    return false
  }

  return resolvedScore < input.criterion.evidence_required_below
}

export function calculateEvaluation(items: KpiEvaluationInput[]): KpiEvaluationResult {
  const missing_data: string[] = []
  const missing_adjustment_reasons: string[] = []
  const missing_evidence: string[] = []
  const weightedItems: KpiWeightedScoreInput[] = []

  for (const item of items) {
    const resolvedScore = resolveScore(item.suggested_score, item.final_score)

    if (resolvedScore === undefined) {
      missing_data.push(item.criterion.id)
      continue
    }

    assertScoreInRange(resolvedScore)
    weightedItems.push({ score: resolvedScore, weight: item.criterion.weight })

    if (requiresAdjustmentReason(item) && !item.adjustment_reason?.trim()) {
      missing_adjustment_reasons.push(item.criterion.id)
    }

    if (requiresEvidence(item) && (!item.evidence_refs || item.evidence_refs.length === 0)) {
      missing_evidence.push(item.criterion.id)
    }
  }

  return {
    total_score: weightedItems.length === items.length ? calculateWeightedScore(weightedItems) : undefined,
    missing_data,
    missing_adjustment_reasons,
    missing_evidence,
  }
}

function resolveScore(suggestedScore?: number, finalScore?: number): number | undefined {
  return finalScore ?? suggestedScore
}

function assertScoreInRange(score: number): void {
  if (score < 1 || score > 5) {
    throw new Error(`Diem KPI phai nam trong thang 1-5, nhan duoc ${score}`)
  }
}

function clampScore(score: number): number {
  return Math.min(5, Math.max(1, score))
}
