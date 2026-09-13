import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { KpiScoreBand } from './types'

const { mapMetricToScore, calculateWeightedScore, calculateEvaluation, requiresAdjustmentReason, requiresEvidence } = await import('./scoring-engine.ts')

describe('KPI scoring engine', () => {
  it('maps a metric to the configured 1-5 score band', () => {
    const bands: KpiScoreBand[] = [
      { min: 0, max: 79.99, score: 1 },
      { min: 80, max: 89.99, score: 3 },
      { min: 90, max: null, score: 5 },
    ]

    assert.equal(mapMetricToScore(93, bands), 5)
  })

  it('treats exact thresholds as inclusive', () => {
    const bands: KpiScoreBand[] = [
      { min: 0, max: 79.99, score: 1 },
      { min: 80, max: 89.99, score: 3 },
      { min: 90, max: null, score: 5 },
    ]

    assert.equal(mapMetricToScore(80, bands), 3)
    assert.equal(mapMetricToScore(89.99, bands), 3)
  })

  it('returns a 1-5 weighted total', () => {
    assert.equal(calculateWeightedScore([
      { score: 4, weight: 20 },
      { score: 3.5, weight: 30 },
      { score: 4.5, weight: 50 },
    ]), 4)
  })

  it('marks missing data when no usable score exists', () => {
    const result = calculateEvaluation([
      {
        criterion: {
          id: 'ops_missing',
          weight: 100,
          adjustment_reason_required: true,
        },
      },
    ])

    assert.deepEqual(result.missing_data, ['ops_missing'])
    assert.equal(result.total_score, undefined)
  })

  it('requires an adjustment reason when the leader changes the suggested score', () => {
    const criterion = {
      id: 'customer_feedback',
      weight: 100,
      adjustment_reason_required: true,
    }

    assert.equal(requiresAdjustmentReason({
      criterion,
      suggested_score: 4,
      final_score: 3,
    }), true)
  })

  it('requires evidence when the final score falls below the configured threshold', () => {
    const criterion = {
      id: 'discipline_execution',
      weight: 100,
      adjustment_reason_required: true,
      evidence_required_below: 4 as const,
    }

    assert.equal(requiresEvidence({
      criterion,
      suggested_score: 5,
      final_score: 3,
      evidence_refs: [],
    }), true)
  })

  it('collects missing adjustment reason and evidence from the evaluation payload', () => {
    const result = calculateEvaluation([
      {
        criterion: {
          id: 'discipline_execution',
          weight: 100,
          adjustment_reason_required: true,
          evidence_required_below: 4 as const,
        },
        suggested_score: 5,
        final_score: 3,
        evidence_refs: [],
      },
    ])

    assert.deepEqual(result.missing_adjustment_reasons, ['discipline_execution'])
    assert.deepEqual(result.missing_evidence, ['discipline_execution'])
    assert.equal(result.total_score, 3)
  })

  it('rejects scores outside the official 1-5 range', () => {
    assert.throws(
      () => calculateWeightedScore([{ score: 6, weight: 100 }]),
      /1-5/
    )
  })
})
