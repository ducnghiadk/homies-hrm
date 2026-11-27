import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildStarterKpiDraft } from './starter-draft.ts'

test('bản nháp đầu tiên để trống mục tiêu, vị trí, điều kiện và không phát hành', () => {
  const draft = buildStarterKpiDraft('hr-1', new Date('2026-11-27T03:00:00Z'))
  assert.equal(draft.status, 'draft')
  assert.equal(draft.version, 1)
  assert.equal(draft.effective_from, '2026-11-01')
  assert.equal(draft.primary_purpose, undefined)
  assert.equal(draft.promotion_rule, undefined)
  assert.equal(draft.source_policy, undefined)
  assert.deepEqual(draft.position_ids, [])
  assert.equal(draft.created_by, 'hr-1')
  assert.ok(draft.groups.length > 0)
})
