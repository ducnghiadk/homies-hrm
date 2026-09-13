import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { KpiSetVersion } from './types'

const { DEFAULT_KPI_POLICY } = await import('./default-policy.ts')
const { validateKpiSet, cloneAsNextDraft, publishVersion, createPeriodSnapshot } = await import('./configuration-service.ts')
const { createVersionFromTemplate } = await import('./fnb-template-catalog.ts')

function createBaseVersion(): KpiSetVersion {
  return {
    id: 'set-v1',
    set_id: 'set-default',
    version: 1,
    name: 'KPI thang 08/2026',
    status: 'draft',
    level_codes: DEFAULT_KPI_POLICY.levels,
    store_ids: 'all',
    effective_from: '2026-08-01',
    effective_to: '2026-08-31',
    score_scale: DEFAULT_KPI_POLICY.score_scale,
    groups: structuredClone(DEFAULT_KPI_POLICY.groups),
    created_by: 'hr_admin_01',
    created_at: '2026-08-21T09:00:00.000Z',
  }
}

function getActiveCriterionIds(version: KpiSetVersion): string[] {
  return version.groups.flatMap((group) => group.criteria.filter((criterion) => criterion.active).map((criterion) => criterion.id))
}

function buildTargetsForAllActiveCriteria(version: KpiSetVersion) {
  return getActiveCriterionIds(version).map((criterionId) => ({
    criterion_id: criterionId,
    target: 90,
    score_bands: [{ min: 90, max: null, score: 5 as const }],
  }))
}

describe('validateKpiSet', () => {
  it('reports missing source data and invalid group weight totals', () => {
    const invalidSet = createBaseVersion()
    invalidSet.groups[0].weight = 10
    invalidSet.groups[0].criteria[0].weight = 10
    invalidSet.groups[0].criteria[0].source_key = undefined

    assert.deepEqual(validateKpiSet(invalidSet).map((item: { code: string }) => item.code), [
      'GROUP_WEIGHT_TOTAL',
      'MISSING_AUTO_SOURCE',
    ])
  })

  it('reports when criterion weights do not match the group weight', () => {
    const invalidSet = createBaseVersion()
    invalidSet.groups[1].criteria[0].weight = 80

    assert.equal(validateKpiSet(invalidSet).some((item: { code: string }) => item.code === 'CRITERION_WEIGHT_TOTAL'), true)
  })

  it('reports overlapping effective ranges for the same scope', () => {
    const current = createBaseVersion()
    current.status = 'published'
    current.published_by = 'ceo_01'
    current.published_at = '2026-08-20T09:00:00.000Z'

    const candidate = createBaseVersion()
    candidate.id = 'set-v2'
    candidate.version = 2
    candidate.effective_from = '2026-08-15'
    candidate.effective_to = '2026-09-15'

    assert.equal(
      validateKpiSet(candidate, [current]).some((item: { code: string }) => item.code === 'EFFECTIVE_RANGE_OVERLAP'),
      true
    )
  })

  it('reports missing template scope, missing targets, and invalid overrides', () => {
    const templateVersion = createVersionFromTemplate('barista', [], 'ceo_01', 1, '2026-08-22T10:00:00.000Z')
    templateVersion.target_overrides = [
      {
        id: 'ov1',
        store_id: 'store-001',
        criterion_id: 'missing',
        target: 1,
        reason: '',
        owner_id: '',
        effective_from: '2026-10-01',
        effective_to: '2026-09-01',
      },
    ]

    const codes = validateKpiSet(templateVersion, [], ['store-001']).map((issue: { code: string }) => issue.code)

    assert.ok(['MISSING_POSITION_SCOPE', 'MISSING_TARGET', 'INVALID_OVERRIDE'].every((code) => codes.includes(code)))
  })

  it('accepts override dates that are the same business date in different formats', () => {
    const templateVersion = createVersionFromTemplate('barista', ['barista'], 'ceo_01', 1, '2026-08-22T10:00:00.000Z')
    const criterionId = getActiveCriterionIds(templateVersion)[0]
    templateVersion.store_group_snapshots = [{ id: 'group-a', name: 'Nhom A', store_ids: ['store-001'] }]
    templateVersion.target_profiles = [{ scope: 'chain', targets: buildTargetsForAllActiveCriteria(templateVersion) }]
    templateVersion.target_overrides = [
      {
        id: 'ov1',
        store_id: 'store-001',
        criterion_id: criterionId,
        target: 91,
        reason: 'Dieu chinh theo ngay khai truong',
        owner_id: 'ceo_01',
        effective_from: '2026-09-01T00:00:00.000Z',
        effective_to: '2026-09-01',
      },
    ]

    const codes = validateKpiSet(templateVersion, [], ['store-001']).map((issue: { code: string }) => issue.code)

    assert.equal(codes.includes('INVALID_OVERRIDE'), false)
  })

  it('requires store group targets only for groups covered by the provided stores', () => {
    const templateVersion = createVersionFromTemplate('barista', ['barista'], 'ceo_01', 1, '2026-08-22T10:00:00.000Z')
    templateVersion.store_group_snapshots = [
      { id: 'group-a', name: 'Nhom A', store_ids: ['store-001'] },
      { id: 'group-b', name: 'Nhom B', store_ids: ['store-002'] },
    ]
    templateVersion.target_profiles = [
      {
        scope: 'store_group',
        store_group_id: 'group-a',
        targets: buildTargetsForAllActiveCriteria(templateVersion),
      },
    ]

    const codes = validateKpiSet(templateVersion, [], ['store-001']).map((issue: { code: string }) => issue.code)

    assert.equal(codes.includes('MISSING_TARGET'), false)
  })
})

describe('configuration versioning', () => {
  it('publishes a valid draft and stamps the actor metadata', () => {
    const published = publishVersion(createBaseVersion(), 'ceo_01', '2026-08-21T10:00:00.000Z')

    assert.equal(published.status, 'published')
    assert.equal(published.published_by, 'ceo_01')
    assert.equal(published.published_at, '2026-08-21T10:00:00.000Z')
  })

  it('blocks publishing when the version is already published', () => {
    const alreadyPublished = publishVersion(createBaseVersion(), 'ceo_01', '2026-08-21T10:00:00.000Z')

    assert.throws(
      () => publishVersion(alreadyPublished, 'ceo_02', '2026-08-21T12:00:00.000Z'),
      /Published/
    )
  })

  it('clones a published version into the next editable draft', () => {
    const published = publishVersion(createBaseVersion(), 'ceo_01', '2026-08-21T10:00:00.000Z')
    const nextDraft = cloneAsNextDraft(published, 'hr_admin_02', '2026-08-21T11:00:00.000Z')

    assert.equal(nextDraft.status, 'draft')
    assert.equal(nextDraft.version, 2)
    assert.equal(nextDraft.created_by, 'hr_admin_02')
    assert.equal(nextDraft.created_at, '2026-08-21T11:00:00.000Z')
    assert.equal(nextDraft.published_by, undefined)
    assert.equal(nextDraft.published_at, undefined)
    assert.notEqual(nextDraft.id, published.id)
  })

  it('creates a frozen snapshot that does not change after the source mutates', () => {
    const source = publishVersion(createBaseVersion(), 'ceo_01', '2026-08-21T10:00:00.000Z')
    const snapshot = createPeriodSnapshot(source)

    source.groups[0].name = 'Da sua sau publish'
    source.groups[0].criteria[0].name = 'Tieu chi da sua'

    assert.equal(snapshot.source_status, 'published')
    assert.equal(snapshot.groups[0].name, 'Doanh thu')
    assert.equal(snapshot.groups[0].criteria[0].name, 'Kết quả doanh thu theo ca')
  })

  it('keeps template target profiles frozen after the source mutates', () => {
    const source = createVersionFromTemplate('barista', ['barista'], 'ceo_01', 1, '2026-08-22T10:00:00.000Z')
    source.target_profiles = [
      {
        scope: 'chain',
        targets: [
          {
            criterion_id: source.groups[0].criteria[0].id,
            target: 95,
            score_bands: [{ min: 95, max: null, score: 5 }],
          },
        ],
      },
    ]

    const snapshot = createPeriodSnapshot(source)
    source.target_profiles[0].targets[0].target = 80

    assert.equal(snapshot.target_profiles?.[0]?.targets[0]?.target, 95)
  })
})
