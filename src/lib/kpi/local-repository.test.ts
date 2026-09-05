import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createEmptyKpiDatabase } from './repository.ts'
import { createLocalKpiRepository } from './local-repository.ts'

interface MemoryStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function createFakeStorage(initial: Record<string, string> = {}): MemoryStorageLike {
  const store = new Map(Object.entries(initial))

  return {
    getItem(key) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key, value) {
      store.set(key, value)
    },
    removeItem(key) {
      store.delete(key)
    },
  }
}

describe('createLocalKpiRepository', () => {
  it('loads a clean seed when no persisted data exists', async () => {
    const repo = createLocalKpiRepository()
    const db = await repo.load()

    assert.equal(db.schema_version, 1)
    assert.equal(db.revision, 0)
    assert.deepEqual(db.sets, [])
    assert.deepEqual(db.audit_logs, [])
  })

  it('saves with optimistic concurrency and rejects stale revisions', async () => {
    const repo = createLocalKpiRepository()
    const first = await repo.load()

    const saved = await repo.save({ ...first, revision: first.revision + 1 }, first.revision)
    assert.equal(saved.revision, 1)

    await assert.rejects(
      repo.save({ ...first, revision: first.revision + 1 }, first.revision),
      /Du lieu da duoc nguoi khac cap nhat/
    )
  })

  it('returns a clean seed and warns when persisted JSON is corrupted', async () => {
    const warnings: string[] = []
    const repo = createLocalKpiRepository({
      storage: createFakeStorage({
        homies_kpi_saas_v1: '{bad json}',
      }),
      onWarn(message) {
        warnings.push(message)
      },
    })

    const db = await repo.load()

    assert.equal(db.revision, 0)
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /Failed to parse KPI repository/)
  })

  it('normalizes legacy persisted data that is missing store groups', async () => {
    const storage = createFakeStorage({
      homies_kpi_saas_v1: JSON.stringify({
        schema_version: 1,
        revision: 2,
        sets: [
          {
            id: 'legacy-set-01',
            name: 'Legacy KPI',
          },
        ],
      }),
    })

    const loaded = await createLocalKpiRepository({ storage }).load()

    assert.deepEqual(loaded.store_groups, [])
    assert.equal(loaded.sets[0].name, 'Legacy KPI')
  })

  it('resets the repository to the provided seed', async () => {
    const storage = createFakeStorage()
    const repo = createLocalKpiRepository({ storage })
    const seed = createEmptyKpiDatabase()
    seed.revision = 4
    seed.audit_logs.push({
      id: 'audit_01',
      entity_type: 'set',
      entity_id: 'set-v1',
      action: 'seed',
      actor_id: 'system',
      created_at: '2026-08-21T10:00:00.000Z',
    })

    await repo.reset(seed)

    const loaded = await repo.load()
    assert.equal(loaded.revision, 4)
    assert.equal(loaded.audit_logs.length, 1)
  })

  it('loads legacy sets and preserves new program metadata', async () => {
    const legacy = { id: 'legacy-set', name: 'Legacy KPI' }
    const modern = {
      id: 'modern-set',
      name: 'Promotion program',
      primary_purpose: 'promotion',
      secondary_purposes: ['training'],
      program_setup_step: 'review',
    }
    const storage = createFakeStorage({
      homies_kpi_saas_v1: JSON.stringify({ schema_version: 1, revision: 2, sets: [legacy, modern] }),
    })
    const loaded = await createLocalKpiRepository({ storage }).load()
    assert.equal(loaded.sets[0].name, 'Legacy KPI')
    assert.equal(loaded.sets[1].primary_purpose, 'promotion')
    assert.equal(loaded.sets[1].program_setup_step, 'review')
  })

  it('normalizes legacy databases without career map collections', async () => {
    const storage = createFakeStorage({
      homies_kpi_saas_v1: JSON.stringify({ schema_version: 1, revision: 4, sets: [] }),
    })
    const database = await createLocalKpiRepository({ storage }).load()
    assert.deepEqual(database.career_maps, [])
    assert.deepEqual(database.position_criteria_profiles, [])
    assert.deepEqual(database.career_employee_placements, [])
    assert.deepEqual(database.career_map_approval_logs, [])
  })

  it('round trips career map drafts and criteria profiles', async () => {
    const storage = createFakeStorage()
    const repository = createLocalKpiRepository({ storage })
    const careerMapFixture = {
      id: 'map_01',
      version: 1,
      status: 'draft' as const,
      scope: 'chain' as const,
      effective_from: null,
      created_by: 'hr_01',
      approved_by: null,
      returned_reason: null,
      created_at: '2026-08-24T08:00:00.000Z',
      updated_at: '2026-08-24T08:00:00.000Z',
      based_on_version_id: null,
      master_position_snapshot: [],
      nodes: [],
      edges: [],
    }
    const criteriaProfileFixture = {
      id: 'profile_pos_01',
      position_ids: ['pos_01'],
      job_family: 'barista',
      version: 1,
      effective_from: null,
      criteria: [],
    }
    const placementFixture = {
      id: 'place_01',
      career_map_version_id: 'map_01',
      employee_id: 'emp_01',
      store_id: 'store_01',
      position_id: 'barista',
      node_id: 'node_01',
      status: 'placed' as const,
      unresolved_reason: null,
      created_at: '2026-08-24T08:00:00.000Z',
    }
    const logFixture = {
      id: 'log_01',
      career_map_version_id: 'map_01',
      action: 'submit' as const,
      actor_id: 'hr_01',
      notes: 'HR submit',
      created_at: '2026-08-24T08:00:00.000Z',
    }

    const saved = await repository.save(
      {
        ...createEmptyKpiDatabase(),
        career_maps: [careerMapFixture],
        position_criteria_profiles: [criteriaProfileFixture],
        career_employee_placements: [placementFixture],
        career_map_approval_logs: [logFixture],
      },
      0
    )
    assert.equal(saved.career_maps[0].id, careerMapFixture.id)
    assert.equal(saved.position_criteria_profiles[0].id, criteriaProfileFixture.id)
    assert.equal(saved.career_employee_placements[0].id, placementFixture.id)
    assert.equal(saved.career_map_approval_logs[0].id, logFixture.id)

    const loaded = await repository.load()
    assert.equal(loaded.career_maps[0].id, careerMapFixture.id)
    assert.equal(loaded.position_criteria_profiles[0].id, criteriaProfileFixture.id)
    assert.equal(loaded.career_employee_placements[0].id, placementFixture.id)
    assert.equal(loaded.career_map_approval_logs[0].id, logFixture.id)
  })

  it('round-trips grades and certifications', async () => {
    const storage = createFakeStorage()
    const repository = createLocalKpiRepository({ storage })
    const database = createEmptyKpiDatabase()
    database.career_grades = [
      { code: 'c1_pc', rank: 1, label: 'C1 - Pha chế', position_key: 'store_employee', required_skill_codes: ['barista'], management: false },
      { code: 'c1_tn', rank: 1, label: 'C1 - Thu ngân', position_key: 'store_employee', required_skill_codes: ['cashier'], management: false },
      { code: 'c2', rank: 2, label: 'C2 - Nhân viên đa năng', position_key: 'store_employee', required_skill_codes: ['barista', 'cashier'], management: false },
      { code: 'c3', rank: 3, label: 'C3 - Senior', position_key: 'store_employee', required_skill_codes: ['barista', 'cashier'], management: false },
      { code: 'c4', rank: 4, label: 'C4 - Trưởng ca', position_key: 'shift_leader', required_skill_codes: ['barista', 'cashier'], management: true },
      { code: 'c5', rank: 5, label: 'C5 - Quản lý cửa hàng', position_key: 'store_manager', required_skill_codes: ['barista', 'cashier'], management: true },
    ]
    database.operational_skills = [
      { code: 'barista', label: 'Pha chế', active: true },
      { code: 'cashier', label: 'Thu ngân', active: true },
    ]
    database.employee_skill_certifications = [{
      id: 'cert-1',
      employee_id: 'emp-1',
      skill_code: 'barista',
      status: 'achieved',
      assessed_at: '2026-08-01',
      assessed_by: 'leader-1',
      score: 90,
      standard_version: 1,
    }]
    database.employee_career_placements = [{
      id: 'placement-1',
      employee_id: 'emp-1',
      career_map_version_id: 'map-1',
      position_id: 'pos_store_employee',
      grade_code: 'c1_pc',
      node_id: 'node_c1_pc',
      status: 'placed',
      unresolved_reason: null,
      effective_from: '2026-08-01',
      effective_to: null,
      decision_id: null,
    }]

    await repository.reset(database)
    const loaded = await repository.load()
    assert.equal(loaded.career_grades.length, 6)
    assert.equal(loaded.operational_skills.length, 2)
    assert.equal(loaded.employee_skill_certifications[0].skill_code, 'barista')
    assert.equal(loaded.employee_career_placements[0].grade_code, 'c1_pc')
  })
})

