import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HOMIES_CAREER_GRADES, HOMIES_CAREER_TRANSITIONS } from './career-grade-catalog.ts'

describe('Homies career grades', () => {
  it('has two C1 entries that converge to C2', () => {
    assert.deepEqual(HOMIES_CAREER_GRADES.map((item) => item.code), [
      'c1_pc', 'c1_tn', 'c2', 'c3', 'c4', 'c5',
    ])
    assert.deepEqual(
      HOMIES_CAREER_TRANSITIONS
        .filter((item) => item.to_grade_code === 'c2')
        .map((item) => item.from_grade_code)
        .sort(),
      ['c1_pc', 'c1_tn']
    )
  })

  it('uses the approved Homies transition presets without demotion', () => {
    const presets = Object.fromEntries(HOMIES_CAREER_TRANSITIONS.map((item) => [item.id, item]))

    assert.equal(presets.c1_pc_to_c2.required_tenure_months, 2)
    assert.equal(presets.c1_pc_to_c2.required_hours_part_time, 160)
    assert.equal(presets.c1_tn_to_c2.required_tenure_months, 2)
    assert.equal(presets.c1_tn_to_c2.required_hours_part_time, 160)
    assert.equal(presets.c2_to_c3.required_tenure_months, 3)
    assert.equal(presets.c2_to_c3.required_hours_part_time, 150)
    assert.equal(presets.c3_to_c4.required_tenure_months, 3)
    assert.equal(presets.c4_to_c5.required_tenure_months, 6)
    assert.ok(HOMIES_CAREER_TRANSITIONS.every((item) => item.allow_demotion === false))
  })
})
