import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { KpiSetVersion } from './types'

const { isValidStoreTargetOverride, resolveCriterionTarget, suggestScoreBands, validateStoreGroupCoverage } = await import(
  './target-policy-service.ts'
)

function createVersion(): KpiSetVersion {
  return {
    id: 'kpi-v1',
    set_id: 'kpi-set',
    version: 1,
    name: 'KPI 09/2026',
    status: 'published',
    level_codes: ['pt1_pc'],
    store_ids: 'all',
    effective_from: '2026-09-01',
    score_scale: [1, 2, 3, 4, 5],
    groups: [],
    created_by: 'hr_admin_01',
    created_at: '2026-08-22T10:00:00.000Z',
    store_group_snapshots: [
      { id: 'district-a', name: 'District A', store_ids: ['store-001', 'store-002'] },
      { id: 'district-b', name: 'District B', store_ids: ['store-003'] },
    ],
    target_profiles: [
      {
        scope: 'chain',
        targets: [
          {
            criterion_id: 'crit_upsell',
            target: 100,
            score_bands: [
              { min: 0, max: 79, score: 1 },
              { min: 80, max: 99, score: 2 },
              { min: 100, max: 109, score: 3 },
              { min: 110, max: 119, score: 4 },
              { min: 120, max: null, score: 5 },
            ],
          },
          {
            criterion_id: 'crit_hygiene',
            target: 95,
            score_bands: [
              { min: 0, max: 74, score: 1 },
              { min: 75, max: 89, score: 2 },
              { min: 90, max: 99, score: 3 },
              { min: 100, max: 109, score: 4 },
              { min: 110, max: null, score: 5 },
            ],
          },
        ],
      },
      {
        scope: 'store_group',
        store_group_id: 'district-a',
        targets: [
          {
            criterion_id: 'crit_upsell',
            target: 120,
            score_bands: [
              { min: 0, max: 95, score: 1 },
              { min: 96, max: 119, score: 2 },
              { min: 120, max: 131, score: 3 },
              { min: 132, max: 143, score: 4 },
              { min: 144, max: null, score: 5 },
            ],
          },
        ],
      },
    ],
    target_overrides: [
      {
        id: 'override-001',
        store_id: 'store-001',
        criterion_id: 'crit_upsell',
        target: 140,
        reason: 'Pilot store stretch target',
        owner_id: 'ceo_01',
        effective_from: '2026-09-01',
        effective_to: '2026-11-30',
      },
    ],
  }
}

function scoreForValue(bands: ReturnType<typeof suggestScoreBands>, value: number): number | undefined {
  return bands.find((band) => value >= band.min && (band.max === null || value <= band.max))?.score
}

function assertBandsHaveNoGaps(bands: ReturnType<typeof suggestScoreBands>): void {
  for (let index = 1; index < bands.length; index += 1) {
    const previous = bands[index - 1]
    const current = bands[index]

    if (previous.max !== null) {
      assert.equal(current.min <= round2(previous.max + 0.01), true)
    }
  }
}

function assertBandsHaveValidRanges(bands: ReturnType<typeof suggestScoreBands>): void {
  assert.equal(bands.length, 5)
  assert.equal(bands.every((band) => band.min >= 0), true)
  assert.equal(bands.every((band) => band.max === null || band.max >= band.min), true)
  assertBandsHaveNoGaps(bands)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function hasAtMostTwoDecimals(value: number): boolean {
  return Number(value.toFixed(2)) === value
}

describe('resolveCriterionTarget', () => {
  it('prioritizes active override, then store group, then chain, and expires overrides by date', () => {
    const version = createVersion()

    assert.equal(resolveCriterionTarget(version, 'crit_upsell', 'store-001', '2026-09-15')?.source, 'override')
    assert.equal(resolveCriterionTarget(version, 'crit_upsell', 'store-002', '2026-09-15')?.source, 'store_group')
    assert.equal(resolveCriterionTarget(version, 'crit_hygiene', 'store-003', '2026-09-15')?.source, 'chain')
    assert.equal(resolveCriterionTarget(version, 'crit_upsell', 'store-001', '2026-12-01')?.source, 'store_group')
  })

  it('treats override effective dates as inclusive boundaries', () => {
    const version = createVersion()

    assert.equal(resolveCriterionTarget(version, 'crit_upsell', 'store-001', '2026-09-01')?.source, 'override')
    assert.equal(resolveCriterionTarget(version, 'crit_upsell', 'store-001', '2026-11-30T23:59:59.000Z')?.source, 'override')
  })

  it('returns cloned score bands so callers cannot mutate version internals', () => {
    const version = createVersion()
    const resolved = resolveCriterionTarget(version, 'crit_upsell', 'store-002', '2026-09-15')
    assert.ok(resolved)

    resolved.score_bands[0].min = 999

    assert.equal(version.target_profiles?.[1]?.targets[0]?.score_bands[0]?.min, 0)
  })
})

describe('suggestScoreBands', () => {
  it('creates five higher-is-better bands with score 3 starting at the target and rounded boundaries', () => {
    const bands = suggestScoreBands(33.333, 'higher')

    assert.equal(bands.length, 5)
    assert.equal(bands[2].score, 3)
    assert.equal(bands[2].min, 33.33)
    assert.equal(scoreForValue(bands, 33.33), 3)
    assert.equal(scoreForValue(bands, 26.5) !== undefined, true)
    assert.equal(scoreForValue(bands, 33.1) !== undefined, true)
    assert.equal(scoreForValue(bands, 36.5) !== undefined, true)
    assertBandsHaveNoGaps(bands)
    assert.equal(bands.every((band) => hasAtMostTwoDecimals(band.min)), true)
    assert.equal(bands.every((band) => band.max === null || hasAtMostTwoDecimals(band.max)), true)
  })

  it('creates five lower-is-better bands where lower values receive better scores', () => {
    const bands = suggestScoreBands(33.333, 'lower')

    assert.equal(bands.length, 5)
    assert.equal(scoreForValue(bands, 30), 5)
    assert.equal(scoreForValue(bands, 43.5), 3)
    assert.equal(scoreForValue(bands, 53.5), 1)
    assert.equal(scoreForValue(bands, 33.5) !== undefined, true)
    assert.equal(scoreForValue(bands, 36.5) !== undefined, true)
    assert.equal(scoreForValue(bands, 46.5) !== undefined, true)
    assertBandsHaveNoGaps(bands)
    assert.equal(bands.every((band) => hasAtMostTwoDecimals(band.min)), true)
    assert.equal(bands.every((band) => band.max === null || hasAtMostTwoDecimals(band.max)), true)
  })

  it('keeps small targets non-negative, ordered, and contiguous', () => {
    const targets = [0, 0.005, 0.01, 0.02]

    for (const target of targets) {
      const higherBands = suggestScoreBands(target, 'higher')
      assertBandsHaveValidRanges(higherBands)
      assert.equal(scoreForValue(higherBands, 0) !== undefined, true)
      assert.equal(scoreForValue(higherBands, target) !== undefined, true)
      assert.equal(scoreForValue(higherBands, round2(target)) !== undefined, true)
      assert.equal(scoreForValue(higherBands, 0.03) !== undefined, true)
      if (target > 0) {
        assert.equal(scoreForValue(higherBands, target), 3)
        assert.equal(scoreForValue(higherBands, round2(target)), 3)
      }
      if (target === 0.005) {
        assert.equal(scoreForValue(higherBands, 0.004), 3)
        assert.equal(scoreForValue(higherBands, 0.006), 3)
      }

      const lowerBands = suggestScoreBands(target, 'lower')
      assertBandsHaveValidRanges(lowerBands)
      assert.equal(scoreForValue(lowerBands, 0) !== undefined, true)
      assert.equal(scoreForValue(lowerBands, round2(target)) !== undefined, true)
      assert.equal(scoreForValue(lowerBands, 0.03) !== undefined, true)
    }
  })
})

describe('validateStoreGroupCoverage', () => {
  it('returns unique missing store ids in the input order', () => {
    assert.deepEqual(
      validateStoreGroupCoverage(
        [{ id: 'district-a', name: 'District A', store_ids: ['store-001', 'store-003'] }],
        ['store-001', 'store-002', 'store-002', 'store-003', 'store-004']
      ),
      ['store-002', 'store-004']
    )
  })
})

describe('isValidStoreTargetOverride', () => {
  const validOverride = {
    id: 'override-1',
    store_id: 'store-001',
    criterion_id: 'criterion-001',
    target: 95,
    reason: 'Cửa hàng đang sửa mặt bằng',
    owner_id: 'hr-admin-01',
    effective_from: '2026-08-23',
    effective_to: '2026-08-31',
  }

  it('accepts a complete override inside the allowed store and criterion scope', () => {
    assert.equal(isValidStoreTargetOverride(validOverride, ['store-001'], ['criterion-001']), true)
  })

  it('rejects invalid dates, missing reasons and items outside the allowed scope', () => {
    assert.equal(
      isValidStoreTargetOverride(
        { ...validOverride, effective_from: '2026-09-01', effective_to: '2026-08-31' },
        ['store-001'],
        ['criterion-001']
      ),
      false
    )
    assert.equal(
      isValidStoreTargetOverride({ ...validOverride, reason: '   ' }, ['store-001'], ['criterion-001']),
      false
    )
    assert.equal(isValidStoreTargetOverride(validOverride, ['store-002'], ['criterion-001']), false)
  })
})
