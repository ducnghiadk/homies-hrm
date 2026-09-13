import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canEditCareerMapStructure } from '../../../lib/kpi/career-map-service.ts'

describe('Career Map UI Role and Device Policy', () => {
  it('allows only hr_admin to edit draft and returned status on desktop', () => {
    assert.equal(canEditCareerMapStructure('hr_admin', 'draft', false), true)
    assert.equal(canEditCareerMapStructure('hr_admin', 'returned', false), true)
  })

  it('disallows admin, ceo, manager, employee, and undefined roles from editing structure', () => {
    assert.equal(canEditCareerMapStructure('admin', 'draft', false), false)
    assert.equal(canEditCareerMapStructure('ceo', 'draft', false), false)
    assert.equal(canEditCareerMapStructure('store_manager', 'draft', false), false)
    assert.equal(canEditCareerMapStructure('employee', 'draft', false), false)
    assert.equal(canEditCareerMapStructure(undefined, 'draft', false), false)
  })

  it('disallows editing on mobile regardless of role', () => {
    assert.equal(canEditCareerMapStructure('hr_admin', 'draft', true), false)
    assert.equal(canEditCareerMapStructure('hr_admin', 'returned', true), false)
  })

  it('disallows editing when status is published or pending_approval', () => {
    assert.equal(canEditCareerMapStructure('hr_admin', 'published', false), false)
    assert.equal(canEditCareerMapStructure('hr_admin', 'pending_approval', false), false)
  })
})
