import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyCriterionToScope,
  createCustomCriterion,
  createDefaultProfileForPosition,
  rebalanceCriteriaWeights,
  suggestCriteriaForPosition,
} from './career-map-criteria-service.ts'
import type { KpiCareerPositionSnapshot } from './career-map-types.ts'

const positions: KpiCareerPositionSnapshot[] = [
  { id: 'barista_c1', name: 'Pha chế C1', job_family: 'barista', level: 1 },
  { id: 'barista_c2', name: 'Pha chế C2', job_family: 'barista', level: 2 },
  { id: 'cashier_c1', name: 'Thu ngân C1', job_family: 'cashier', level: 1 },
  { id: 'shift_leader', name: 'Trưởng ca', job_family: 'management', level: 3 },
]

describe('career map criteria service', () => {
  it('suggests Homies F&B criteria before custom creation', () => {
    const suggestions = suggestCriteriaForPosition({ id: 'barista_c1', name: 'Pha chế C1', level: 1 })
    assert.ok(suggestions.length >= 3)
    assert.equal(suggestions[0].source, 'homies_recommended')
    assert.ok(suggestions.some((item) => item.name.includes('công thức') || item.name.includes('Đúng công thức')))
  })

  it('converts four plain-language answers into a measurable criterion', () => {
    const criterion = createCustomCriterion({
      outcome: 'Giảm món làm sai công thức',
      evidence_source: 'shift_log',
      pass_target: 'Không quá 2 món sai mỗi tháng',
      importance: 'high',
    })
    assert.equal(criterion.direction, 'lower_is_better')
    assert.equal(criterion.suggested_weight, 30)
    assert.equal(criterion.weight, 30)
    assert.equal(criterion.source, 'custom')
  })

  it('applies one criterion to current position, job family or selected positions', () => {
    const customCriterion = createCustomCriterion({
      outcome: 'Tuân thủ mở ca đúng giờ',
      evidence_source: 'checklist',
      pass_target: '100% đúng giờ',
      importance: 'medium',
    })

    // 1. Current position mode
    const res1 = applyCriterionToScope(
      { mode: 'current_position', position_id: 'barista_c1' },
      customCriterion,
      positions,
      []
    )
    assert.deepEqual(res1.affected_position_ids, ['barista_c1'])

    // 2. Job family mode
    const res2 = applyCriterionToScope(
      { mode: 'job_family', job_family: 'barista' },
      customCriterion,
      positions,
      []
    )
    assert.deepEqual(res2.affected_position_ids.sort(), ['barista_c1', 'barista_c2'].sort())

    // 3. Selected positions mode
    const res3 = applyCriterionToScope(
      { mode: 'selected_positions', position_ids: ['barista_c1', 'cashier_c1'] },
      customCriterion,
      positions,
      []
    )
    assert.deepEqual(res3.affected_position_ids.sort(), ['barista_c1', 'cashier_c1'].sort())
  })

  it('auto rebalances enabled criteria to exactly 100 percent', () => {
    const result = rebalanceCriteriaWeights([
      { id: 'a', weight: 50, locked: false },
      { id: 'b', weight: 40, locked: false },
      { id: 'c', weight: 30, locked: false },
    ])
    assert.equal(result.reduce((sum, item) => sum + item.weight, 0), 100)
  })

  it('preserves locked criteria weights during rebalancing', () => {
    const result = rebalanceCriteriaWeights([
      { id: 'a', weight: 40, locked: true },
      { id: 'b', weight: 30, locked: false },
      { id: 'c', weight: 20, locked: false },
    ])
    assert.equal(result.find((i) => i.id === 'a')?.weight, 40)
    assert.equal(result.reduce((sum, item) => sum + item.weight, 0), 100)
  })

  it('creates default profile for a position with valid criteria totaling 100 percent', () => {
    const profile = createDefaultProfileForPosition(positions[0])
    assert.equal(profile.position_ids[0], 'barista_c1')
    assert.ok(profile.criteria.length > 0)
    const totalWeight = profile.criteria.reduce((sum, c) => sum + c.weight, 0)
    assert.equal(totalWeight, 100)
  })
})
