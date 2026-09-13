import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { FNB_KPI_TEMPLATES, createVersionFromTemplate, getFnbTemplate } = await import(
  './fnb-template-catalog.ts'
)

describe('FNB_KPI_TEMPLATES', () => {
  it('exposes the exact F&B template ids', () => {
    assert.deepEqual(
      FNB_KPI_TEMPLATES.map((template) => template.id),
      ['barista', 'cashier', 'server', 'kitchen', 'shift_leader', 'store_manager'],
    )
  })

  it('keeps each template group weights at 100', () => {
    for (const template of FNB_KPI_TEMPLATES) {
      const totalWeight = template.groups.reduce((total, group) => total + group.weight, 0)

      assert.equal(totalWeight, 100, template.id)
    }
  })

  it('requires unit and direction for all criteria', () => {
    for (const template of FNB_KPI_TEMPLATES) {
      for (const group of template.groups) {
        for (const criterion of group.criteria) {
          assert.ok(criterion.unit, `${template.id}/${criterion.id} missing unit`)
          assert.ok(criterion.direction, `${template.id}/${criterion.id} missing direction`)
        }
      }
    }
  })

  it('returns independently cloned groups from the factory', () => {
    const first = getFnbTemplate('barista')
    const second = getFnbTemplate('barista')

    first.groups[0].criteria[0].name = 'Mutated in test'

    assert.notEqual(second.groups[0].criteria[0].name, 'Mutated in test')
  })
})

describe('createVersionFromTemplate', () => {
  it('builds a draft KPI version from the selected template', () => {
    const version = createVersionFromTemplate(
      'cashier',
      ['position_cashier'],
      'hr_admin_01',
      3,
      '2026-08-22T09:00:00.000Z',
    )

    assert.equal(version.set_id, 'kpi_cashier')
    assert.deepEqual(version.position_ids, ['position_cashier'])
    assert.equal(version.setup_step, 'criteria')
    assert.equal(version.status, 'draft')
    assert.equal(version.store_ids, 'all')
    assert.equal(version.effective_from, '2026-08-22T09:00:00.000Z')
    assert.equal(version.created_by, 'hr_admin_01')
    assert.equal(version.created_at, '2026-08-22T09:00:00.000Z')
    assert.equal(version.version, 3)
    assert.deepEqual(version.score_scale, [1, 2, 3, 4, 5])
    assert.equal(version.template_id, 'cashier')
  })
})
