import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getDefaultPeerReviewPolicy,
  validatePeerReviewPolicy,
} from './peer-review-policy-service.ts'

describe('peer review policy', () => {
  it('uses the approved Homies defaults', () => {
    const policy = getDefaultPeerReviewPolicy()
    assert.equal(policy.enabled, true)
    assert.equal(policy.weight_percent, 10)
    assert.equal(policy.max_weight_percent, 15)
    assert.equal(policy.min_total_shifts, 8)
    assert.equal(policy.min_shared_shifts, 5)
    assert.equal(policy.manager_selection_hours, 24)
    assert.equal(policy.reviewer_deadline_hours, 48)
    assert.equal(policy.required_reviewer_count, 2)
    assert.equal(policy.extreme_comment_min_length, 20)
    assert.equal(policy.missing_sample_fallback, 'primary_reviewer')
  })

  it('rejects unsafe or impossible settings', () => {
    const policy = {
      ...getDefaultPeerReviewPolicy(),
      weight_percent: 16,
      required_reviewer_count: 1 as unknown as 2,
      min_total_shifts: -1,
      min_shared_shifts: -2,
      manager_selection_hours: 0,
      reviewer_deadline_hours: -10,
      extreme_comment_min_length: 5,
    }
    const issues = validatePeerReviewPolicy(policy)
    assert.deepEqual(
      issues.map((issue) => issue.code),
      [
        'PEER_WEIGHT_CAP',
        'REVIEWER_COUNT',
        'SHIFT_THRESHOLD',
        'DEADLINE',
        'COMMENT_LENGTH',
      ]
    )
  })
})
