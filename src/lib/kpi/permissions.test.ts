import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { canKpi } = await import('./permissions.ts')

describe('canKpi', () => {
  it('applies the approved role matrix', () => {
    assert.equal(canKpi('employee', 'view_self'), true)
    assert.equal(canKpi('employee', 'configure'), false)
    assert.equal(canKpi('shift_leader', 'score_store'), true)
    assert.equal(canKpi('hr_admin', 'configure'), true)
    assert.equal(canKpi('hr_admin', 'decide_salary'), false)
    assert.equal(canKpi('ceo', 'lock_period'), true)
  })

  it('keeps store manager out of ceo-only decisions', () => {
    assert.equal(canKpi('store_manager', 'view_store'), true)
    assert.equal(canKpi('store_manager', 'decide_salary'), false)
    assert.equal(canKpi('store_manager', 'reopen_period'), false)
    assert.equal(canKpi('store_manager', 'decide_promotion'), false)
  })
})
