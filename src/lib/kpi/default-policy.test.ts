import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { DEFAULT_KPI_POLICY } = await import('./default-policy.ts')

describe('DEFAULT_KPI_POLICY', () => {
  it('uses the approved career levels and a 1-5 KPI scale', () => {
    assert.deepEqual(DEFAULT_KPI_POLICY.levels, ['pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader'])
    assert.deepEqual(DEFAULT_KPI_POLICY.score_scale, [1, 2, 3, 4, 5])
    assert.equal(DEFAULT_KPI_POLICY.monthly_appeal_hours, 48)
    assert.equal(DEFAULT_KPI_POLICY.people_decision_appeal_business_days, 3)
  })
})
