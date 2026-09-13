import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const designerSource = readFileSync(
  new URL('../../components/kpi/career-map/KPICareerMapDesigner.tsx', import.meta.url),
  'utf8'
)
const canvasSource = readFileSync(
  new URL('../../components/kpi/career-map/KPICareerMapCanvas.tsx', import.meta.url),
  'utf8'
)
const scopeSource = readFileSync(
  new URL('../../components/kpi/program/KPIProgramScopeStep.tsx', import.meta.url),
  'utf8'
)

describe('career map aggregate save contract', () => {
  it('uses one aggregate mutation callback throughout the career map editor', () => {
    for (const source of [designerSource, canvasSource, scopeSource]) {
      assert.doesNotMatch(source, /onUpdateCareerMap/)
      assert.doesNotMatch(source, /onUpdateCareerProfiles/)
      assert.doesNotMatch(source, /onUpdateProfiles/)
      assert.doesNotMatch(source, /\bonChange\(next: KpiCareerMapVersion\)/)
    }

    assert.match(designerSource, /onAggregateChange\(change: CareerMapAggregateChange\): void/)
    assert.match(canvasSource, /onAggregateChange\(change: CareerMapAggregateChange\): void/)
    assert.match(scopeSource, /onAggregateChange\(change: CareerMapAggregateChange\): void/)
  })
})
