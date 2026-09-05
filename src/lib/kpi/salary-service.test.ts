import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { suggestPromotionSalary, suggestInLevelRaise, approveSalaryDecision } = await import('./salary-service.ts')

describe('salary-service', () => {
  it('suggests promotion salary from the higher of target floor or current plus increase, capped by the band max', () => {
    const result = suggestPromotionSalary({
      current_hourly_rate: 24000,
      target_band_min: 26000,
      target_band_max: 30000,
      promotion_increase_min: 1500,
      promotion_increase_max: 5000,
    })

    assert.deepEqual(result, {
      min: 26000,
      max: 29000,
      recommended: 27500,
      capped: false,
      explanation: 'De xuat tu muc san cap moi va bien do tang luong promotion.',
    })
  })

  it('caps promotion suggestion when the allowed increase would exceed the band max', () => {
    const result = suggestPromotionSalary({
      current_hourly_rate: 29500,
      target_band_min: 28000,
      target_band_max: 30000,
      promotion_increase_min: 1500,
      promotion_increase_max: 4000,
    })

    assert.deepEqual(result, {
      min: 30000,
      max: 30000,
      recommended: 30000,
      capped: true,
      explanation: 'Da cham tran band moi nen de xuat bi khoa o muc toi da.',
    })
  })

  it('caps in-level raise at the current band max', () => {
    const result = suggestInLevelRaise({
      current_hourly_rate: 28500,
      band_max: 29500,
      increase_min: 1000,
      increase_max: 2500,
    })

    assert.deepEqual(result, {
      min: 29500,
      max: 29500,
      recommended: 29500,
      capped: true,
      explanation: 'Tang trong cap nhung khong duoc vuot tran band hien tai.',
    })
  })

  it('requires CEO, reason, evidence, and expiry for salary exceptions', () => {
    assert.throws(
      () =>
        approveSalaryDecision(
          {
            employee_id: 'emp_pt2',
            development_case_id: 'dev_pt2_to_senior',
            decided_rate: 32000,
            effective_from: '2026-09-01',
            reason: 'Vuot tran do giu nguoi',
            exception: {
              type: 'over_band',
              evidence_refs: [],
              expires_at: '2026-12-31',
            },
          },
          { id: 'hr_admin_01', role: 'hr_admin' }
        ),
      /Chi CEO moi duoc phe duyet luong/
    )

    assert.throws(
      () =>
        approveSalaryDecision(
          {
            employee_id: 'emp_pt2',
            development_case_id: 'dev_pt2_to_senior',
            decided_rate: 32000,
            effective_from: '2026-09-01',
            reason: 'Vuot tran do giu nguoi',
            exception: {
              type: 'over_band',
              evidence_refs: [],
              expires_at: '2026-12-31',
            },
          },
          { id: 'ceo_01', role: 'ceo' }
        ),
      /Ngoai le luong bat buoc co evidence/
    )
  })
})
