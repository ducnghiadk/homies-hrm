import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { createSupabaseKpiRepository, createDefaultSupabaseKpiGateway } = await import('./supabase-repository.ts')

type GatewayRows = {
  set_versions: Record<string, unknown>[]
  periods: Record<string, unknown>[]
  period_employees: Record<string, unknown>[]
  evaluations: Record<string, unknown>[]
  criterion_scores: Record<string, unknown>[]
  incidents: Record<string, unknown>[]
  incident_violations: Record<string, unknown>[]
  appeals: Record<string, unknown>[]
  development_cases: Record<string, unknown>[]
  audit_logs: Record<string, unknown>[]
  career_maps?: Record<string, unknown>[]
  career_map_nodes?: Record<string, unknown>[]
  career_map_edges?: Record<string, unknown>[]
  position_criteria_profiles?: Record<string, unknown>[]
  position_criteria_items?: Record<string, unknown>[]
  career_employee_placements?: Record<string, unknown>[]
  career_map_approval_logs?: Record<string, unknown>[]
  career_grades?: Record<string, unknown>[]
  operational_skills?: Record<string, unknown>[]
  employee_skill_certifications?: Record<string, unknown>[]
  employee_career_placements?: Record<string, unknown>[]
}

function buildRawRows(): GatewayRows {
  const snapshot = {
    id: 'set-v1',
    set_id: 'set-main',
    version: 1,
    name: 'KPI cua hang thang 08/2026',
    level_codes: ['pt2'],
    store_ids: ['store-1'],
    effective_from: '2026-08-01',
    effective_to: '2026-08-31',
    score_scale: [1, 2, 3, 4, 5],
    groups: [
      {
        id: 'grp_customer_service',
        name: 'Dich vu',
        tag: 'customer_service',
        weight: 100,
        promotion_core: true,
        sort_order: 1,
        criteria: [
          {
            id: 'customer_feedback',
            group_id: 'grp_customer_service',
            name: 'Diem khach hang',
            description: 'Tong hop feedback',
            scoring_mode: 'combined',
            weight: 100,
            score_bands: [
              { min: 4.5, max: null, score: 5 },
              { min: 0, max: 4.49, score: 3 },
            ],
            adjustment_reason_required: true,
            sort_order: 1,
            active: true,
          },
        ],
        source_key: 'service.customer_experience_index',
      },
    ],
    created_by: 'hr-1',
    created_at: '2026-08-01T08:00:00.000Z',
    published_by: 'ceo-1',
    published_at: '2026-08-01T09:00:00.000Z',
    source_status: 'published',
  }

  return {
    set_versions: [
      {
        id: 'set-v1',
        set_id: 'set-main',
        org_id: 'org-1',
        version_no: 1,
        name: 'KPI cua hang thang 08/2026',
        status: 'published',
        level_codes: ['pt2'],
        store_scope_all: false,
        store_ids: ['store-1'],
        effective_from: '2026-08-01',
        effective_to: '2026-08-31',
        score_scale: [1, 2, 3, 4, 5],
        groups: snapshot.groups,
        grades: [],
        promotion_paths: [],
        source_status: 'published',
        created_by: 'hr-1',
        created_at: '2026-08-01T08:00:00.000Z',
        published_by: 'ceo-1',
        published_at: '2026-08-01T09:00:00.000Z',
      },
    ],
    periods: [
      {
        id: 'period-1',
        org_id: 'org-1',
        store_id: 'store-1',
        set_version_id: 'set-v1',
        month_key: '2026-08',
        status: 'leader_scoring',
        snapshot,
        opened_by: 'hr-1',
        opened_at: '2026-08-02T08:00:00.000Z',
        revision: 2,
      },
    ],
    period_employees: [
      {
        id: 'pe-1',
        period_id: 'period-1',
        employee_id: 'emp-1',
        store_id: 'store-1',
        level_code: 'pt2',
        position_id: 'barista',
        employment_status: 'official',
      },
    ],
    evaluations: [
      {
        id: 'eval-1',
        period_id: 'period-1',
        period_employee_id: 'pe-1',
        snapshot,
        total_score: 4.1,
        grade_code: 'good',
        status: 'published',
        published_at: '2026-08-27T10:00:00.000Z',
        revision: 1,
      },
    ],
    criterion_scores: [
      {
        id: 'score-1',
        evaluation_id: 'eval-1',
        criterion_id: 'customer_feedback',
        group_id: 'grp_customer_service',
        suggested_score: 4,
        final_score: 5,
        source_refs: ['service-source-1'],
        adjustment_reason: 'Bo sung bang chung',
        evidence_refs: ['evidence-1'],
      },
    ],
    incidents: [
      {
        id: 'incident-1',
        org_id: 'org-1',
        store_id: 'store-1',
        employee_id: 'emp-1',
        period_id: 'period-1',
        occurred_at: '2026-08-18T08:00:00.000Z',
        source: 'operation',
        status: 'finalized',
        description: 'Nhap sai POS',
        evidence_refs: ['incident-photo'],
      },
    ],
    incident_violations: [
      {
        id: 'violation-1',
        incident_id: 'incident-1',
        code: 'pos_manual_error',
        primary_violation: true,
        independent_behavior: false,
        reason: 'Leader da xac nhan',
        evidence_refs: ['incident-photo'],
      },
    ],
    appeals: [
      {
        id: 'appeal-1',
        org_id: 'org-1',
        employee_id: 'emp-1',
        type: 'monthly_kpi',
        reference_id: 'eval-1',
        reason: 'Xin xem lai diem',
        evidence_refs: ['chat-1'],
        status: 'submitted',
        submitted_at: '2026-08-27T09:00:00.000Z',
        deadline_at: '2026-08-29T09:00:00.000Z',
      },
    ],
    development_cases: [
      {
        id: 'case-1',
        org_id: 'org-1',
        employee_id: 'emp-1',
        store_id: 'store-1',
        current_level: 'pt2',
        target_level: 'senior',
        status: 'testing',
      },
    ],
    audit_logs: [
      {
        id: 'audit-revision-7',
        entity_type: 'kpi_database',
        entity_id: 'global',
        action: 'revision',
        actor_id: 'system',
        new_value: { revision: 7 },
        created_at: '2026-08-21T10:00:00.000Z',
      },
      {
        id: 'audit-note-1',
        entity_type: 'kpi_set_version',
        entity_id: 'set-v1',
        action: 'publish',
        actor_id: 'ceo-1',
        new_value: { status: 'published' },
        created_at: '2026-08-01T09:00:00.000Z',
      },
    ],
  }
}

function createFakeGateway(initialRows: GatewayRows, options: { replaceError?: string } = {}) {
  const state = structuredClone(initialRows)
  const calls: Array<{ type: 'load' | 'replace'; payload?: GatewayRows }> = []

  return {
    calls,
    gateway: {
      async loadAll() {
        calls.push({ type: 'load' })
        return structuredClone(state)
      },
      async replaceAll(payload: GatewayRows) {
        calls.push({ type: 'replace', payload: structuredClone(payload) })

        if (options.replaceError) {
          throw new Error(options.replaceError)
        }

        state.set_versions = structuredClone(payload.set_versions)
        state.periods = structuredClone(payload.periods)
        state.period_employees = structuredClone(payload.period_employees)
        state.evaluations = structuredClone(payload.evaluations)
        state.criterion_scores = structuredClone(payload.criterion_scores)
        state.incidents = structuredClone(payload.incidents)
        state.incident_violations = structuredClone(payload.incident_violations)
        state.appeals = structuredClone(payload.appeals)
        state.development_cases = structuredClone(payload.development_cases)
        state.audit_logs = structuredClone(payload.audit_logs)
        state.career_maps = structuredClone(payload.career_maps || [])
        state.career_map_nodes = structuredClone(payload.career_map_nodes || [])
        state.career_map_edges = structuredClone(payload.career_map_edges || [])
        state.position_criteria_profiles = structuredClone(payload.position_criteria_profiles || [])
        state.position_criteria_items = structuredClone(payload.position_criteria_items || [])
        state.career_employee_placements = structuredClone(payload.career_employee_placements || [])
        state.career_map_approval_logs = structuredClone(payload.career_map_approval_logs || [])
      },
    },
  }
}

describe('createSupabaseKpiRepository', () => {
  it('maps snake_case Supabase rows into the canonical KPI database', async () => {
    const fake = createFakeGateway(buildRawRows())
    const repo = createSupabaseKpiRepository({ gateway: fake.gateway })

    const db = await repo.load()

    assert.equal(db.revision, 7)
    assert.equal(db.sets[0].version, 1)
    assert.deepEqual(db.sets[0].store_ids, ['store-1'])
    assert.equal(db.periods[0].month, '2026-08')
    assert.deepEqual(db.periods[0].employee_ids, ['emp-1'])
    assert.equal(db.evaluations[0].employee.level_code, 'pt2')
    assert.equal(db.evaluations[0].scores[0].criterion_id, 'customer_feedback')
    assert.equal(db.evaluations[0].scores[0].final_score, 5)
    assert.equal(db.evaluations[0].published_at, '2026-08-27T10:00:00.000Z')
    assert.equal(db.incidents[0].violations[0].code, 'pos_manual_error')
    assert.equal(db.appeals[0].reference_id, 'eval-1')
    assert.equal(db.development_cases[0].target_level, 'senior')
    assert.equal(db.audit_logs.length, 2)
  })

  it('rejects stale revision saves before writing to Supabase', async () => {
    const fake = createFakeGateway(buildRawRows())
    const repo = createSupabaseKpiRepository({ gateway: fake.gateway })
    const current = await repo.load()

    await assert.rejects(
      repo.save({ ...current, revision: 8 }, 6),
      /Du lieu da duoc nguoi khac cap nhat/
    )

    assert.equal(fake.calls.filter((item) => item.type === 'replace').length, 0)
  })

  it('writes canonical data back into Supabase row format and bumps revision audit', async () => {
    const fake = createFakeGateway(buildRawRows())
    const repo = createSupabaseKpiRepository({ gateway: fake.gateway })
    const current = await repo.load()

    current.evaluations[0].scores[0].final_score = 4
    current.evaluations[0].status = 'submitted'
    current.appeals.push({
      id: '3e8ce8c2-3cbe-4e68-8e6c-b50663cf2ea1',
      type: 'monthly_kpi',
      employee_id: 'emp-1',
      reference_id: 'eval-1',
      reason: 'Đối chiếu lại dữ liệu POS.',
      evidence_refs: ['pos-sheet'],
      status: 'submitted',
      submitted_at: '2026-08-27T11:00:00.000Z',
      deadline_at: '2026-08-29T10:00:00.000Z',
    })

    const saved = await repo.save({ ...current, revision: 8 }, 7)

    assert.equal(saved.revision, 8)
    const replaceCall = fake.calls.findLast((item) => item.type === 'replace')
    assert.ok(replaceCall?.payload)
    assert.equal(replaceCall.payload!.set_versions[0].version_no, 1)
    assert.equal(replaceCall.payload!.periods[0].month_key, '2026-08')
    assert.equal(replaceCall.payload!.evaluations[0].status, 'submitted')
    assert.equal(replaceCall.payload!.evaluations[0].published_at, '2026-08-27T10:00:00.000Z')
    assert.equal(replaceCall.payload!.criterion_scores[0].final_score, 4)
    assert.equal(
      replaceCall.payload!.appeals.find((row) => row.id === '3e8ce8c2-3cbe-4e68-8e6c-b50663cf2ea1')?.org_id,
      'org-1'
    )

    const revisionAudit = replaceCall.payload!.audit_logs.find(
      (row) => row.entity_type === 'kpi_database' && row.entity_id === 'global' && row.action === 'revision'
    )
    assert.deepEqual(revisionAudit?.new_value, { revision: 8 })
  })

  it('throws a clear sync error when Supabase write fails', async () => {
    const fake = createFakeGateway(buildRawRows(), { replaceError: 'permission denied' })
    const repo = createSupabaseKpiRepository({ gateway: fake.gateway })
    const current = await repo.load()

    await assert.rejects(
      repo.save({ ...current, revision: 8 }, 7),
      /Khong the dong bo KPI len Supabase luc nay/
    )
  })

  it('loads and saves career maps and criteria profiles through Supabase gateway', async () => {
    const fake = createFakeGateway(buildRawRows())
    const repo = createSupabaseKpiRepository({ gateway: fake.gateway })
    const current = await repo.load()

    current.career_maps = [
      {
        id: 'map_01',
        version: 1,
        status: 'draft',
        scope: 'chain',
        effective_from: '2026-09-01',
        created_by: 'hr-1',
        approved_by: null,
        returned_reason: null,
        created_at: '2026-08-24T00:00:00.000Z',
        updated_at: '2026-08-24T00:00:00.000Z',
        based_on_version_id: null,
        master_position_snapshot: [{ id: 'barista_c1', name: 'Pha chế C1', level: 1 }],
        nodes: [
          {
            id: 'node_01',
            position_id: 'barista_c1',
            position_name_snapshot: 'Pha chế C1',
            position_level_snapshot: 1,
            job_family: 'barista',
            x: 50,
            y: 50,
            criteria_profile_id: 'profile_01',
            active: true,
          },
        ],
        edges: [],
      },
    ]

    current.position_criteria_profiles = [
      {
        id: 'profile_01',
        position_ids: ['barista_c1'],
        job_family: 'barista',
        version: 1,
        effective_from: null,
        criteria: [
          {
            id: 'crit_01',
            name: 'Pha chế đúng định lượng',
            source: 'homies_recommended',
            evidence_source: 'checklist',
            direction: 'higher_is_better',
            suggested_weight: 50,
            weight: 100,
            locked: false,
            active: true,
          },
        ],
      },
    ]

    const saved = await repo.save({ ...current, revision: 8 }, 7)
    assert.equal(saved.career_maps?.length, 1)
    assert.equal(saved.career_maps?.[0].id, 'map_01')
    assert.equal(saved.position_criteria_profiles?.length, 1)

    const replaceCall = fake.calls.findLast((item) => item.type === 'replace')
    assert.ok(replaceCall?.payload?.career_maps)
    assert.equal(replaceCall.payload!.career_maps![0].id, 'map_01')
    assert.equal(replaceCall.payload!.career_map_nodes![0].id, 'node_01')
    assert.equal(replaceCall.payload!.position_criteria_profiles![0].id, 'profile_01')
    assert.equal(replaceCall.payload!.position_criteria_items![0].id, 'crit_01')
  })

  it('loads and saves placements through the canonical KPI repository', async () => {
    const fake = createFakeGateway(buildRawRows())
    const repo = createSupabaseKpiRepository({ gateway: fake.gateway })
    const current = await repo.load()

    current.career_employee_placements = [
      {
        id: 'place_01',
        career_map_version_id: 'map_01',
        employee_id: 'emp_01',
        store_id: 'store_01',
        position_id: 'barista',
        node_id: 'node_01',
        status: 'placed',
        unresolved_reason: null,
        created_at: '2026-08-24T00:00:00.000Z',
      },
    ]

    const saved = await repo.save({ ...current, revision: 8 }, 7)
    assert.equal(saved.career_employee_placements?.length, 1)
    assert.equal(saved.career_employee_placements?.[0].id, 'place_01')

    const replaceCall = fake.calls.findLast((item) => item.type === 'replace')
    assert.ok(replaceCall?.payload?.career_employee_placements)
    assert.equal(replaceCall.payload!.career_employee_placements![0].id, 'place_01')
  })

  it('loads and saves career approval logs through their dedicated table', async () => {
    const fake = createFakeGateway(buildRawRows())
    const repo = createSupabaseKpiRepository({ gateway: fake.gateway })
    const current = await repo.load()

    current.career_map_approval_logs = [
      {
        id: 'log_01',
        career_map_version_id: 'map_01',
        action: 'submit',
        actor_id: 'hr_01',
        notes: 'HR Admin submit map',
        created_at: '2026-08-24T00:00:00.000Z',
      },
    ]

    const saved = await repo.save({ ...current, revision: 8 }, 7)
    assert.equal(saved.career_map_approval_logs?.length, 1)
    assert.equal(saved.career_map_approval_logs?.[0].id, 'log_01')

    const replaceCall = fake.calls.findLast((item) => item.type === 'replace')
    assert.ok(replaceCall?.payload?.career_map_approval_logs)
    assert.equal(replaceCall.payload!.career_map_approval_logs![0].id, 'log_01')
  })

  it('deletes database child rows missing from the saved career aggregate', async () => {
    const fake = createFakeGateway(buildRawRows())
    const repo = createSupabaseKpiRepository({ gateway: fake.gateway })
    const current = await repo.load()

    // Initially 2 nodes and 1 edge
    current.career_maps = [
      {
        id: 'map_01',
        version: 1,
        status: 'draft',
        scope: 'chain',
        effective_from: '2026-09-01',
        created_by: 'hr-1',
        approved_by: null,
        returned_reason: null,
        created_at: '2026-08-24T00:00:00.000Z',
        updated_at: '2026-08-24T00:00:00.000Z',
        based_on_version_id: null,
        master_position_snapshot: [{ id: 'p1', name: 'P1', level: 1 }, { id: 'p2', name: 'P2', level: 2 }],
        nodes: [
          { id: 'node_1', position_id: 'p1', position_name_snapshot: 'P1', position_level_snapshot: 1, job_family: 'barista', x: 0, y: 0, criteria_profile_id: null, active: true },
          { id: 'node_2', position_id: 'p2', position_name_snapshot: 'P2', position_level_snapshot: 2, job_family: 'barista', x: 0, y: 0, criteria_profile_id: null, active: true },
        ],
        edges: [
          { id: 'edge_1', source_node_id: 'node_1', target_node_id: 'node_2', preset_key: 'same_profession_level_up', preset_version: 1, active: true },
        ],
      },
    ]

    await repo.save({ ...current, revision: 8 }, 7)

    // Now delete node_2 and edge_1
    current.career_maps[0].nodes = [current.career_maps[0].nodes[0]]
    current.career_maps[0].edges = []

    await repo.save({ ...current, revision: 9 }, 8)

    const lastReplace = fake.calls.findLast((item) => item.type === 'replace')
    assert.ok(lastReplace?.payload)
    // Only 1 node remains and 0 edges in payload
    assert.equal(lastReplace.payload!.career_map_nodes?.length, 1)
    assert.equal(lastReplace.payload!.career_map_nodes?.[0].id, 'node_1')
    assert.equal(lastReplace.payload!.career_map_edges?.length, 0)
  })

  it('does not delete child rows belonging to another career map', async () => {
    const fake = createFakeGateway(buildRawRows())
    const repo = createSupabaseKpiRepository({ gateway: fake.gateway })
    const current = await repo.load()

    current.career_maps = [
      {
        id: 'map_01',
        version: 1,
        status: 'draft',
        scope: 'chain',
        effective_from: '2026-09-01',
        created_by: 'hr-1',
        approved_by: null,
        returned_reason: null,
        created_at: '2026-08-24T00:00:00.000Z',
        updated_at: '2026-08-24T00:00:00.000Z',
        based_on_version_id: null,
        master_position_snapshot: [{ id: 'p1', name: 'P1', level: 1 }],
        nodes: [{ id: 'node_1a', position_id: 'p1', position_name_snapshot: 'P1', position_level_snapshot: 1, job_family: 'barista', x: 0, y: 0, criteria_profile_id: null, active: true }],
        edges: [],
      },
      {
        id: 'map_02',
        version: 2,
        status: 'published',
        scope: 'chain',
        effective_from: '2026-09-01',
        created_by: 'hr-1',
        approved_by: 'ceo-1',
        returned_reason: null,
        created_at: '2026-08-24T00:00:00.000Z',
        updated_at: '2026-08-24T00:00:00.000Z',
        based_on_version_id: null,
        master_position_snapshot: [{ id: 'p2', name: 'P2', level: 2 }],
        nodes: [{ id: 'node_2a', position_id: 'p2', position_name_snapshot: 'P2', position_level_snapshot: 2, job_family: 'cashier', x: 0, y: 0, criteria_profile_id: null, active: true }],
        edges: [],
      },
    ]

    await repo.save({ ...current, revision: 8 }, 7)

    // Update map_01 node
    current.career_maps[0].nodes = [
      { id: 'node_1b', position_id: 'p1', position_name_snapshot: 'P1', position_level_snapshot: 1, job_family: 'barista', x: 10, y: 10, criteria_profile_id: null, active: true },
    ]

    await repo.save({ ...current, revision: 9 }, 8)

    const reloaded = await repo.load()
    // map_02 still has its own node
    const map2 = reloaded.career_maps?.find((m) => m.id === 'map_02')
    assert.ok(map2)
    assert.equal(map2.nodes.length, 1)
    assert.equal(map2.nodes[0].id, 'node_2a')
  })
})

describe('createDefaultSupabaseKpiGateway direct verification', () => {
  function createMockSupabaseClient(options: {
    existingNodes?: Record<string, unknown>[]
    existingEdges?: Record<string, unknown>[]
    existingPlacements?: Record<string, unknown>[]
    existingItems?: Record<string, unknown>[]
    selectError?: Error
    deleteError?: Error
    upsertError?: Error
  } = {}) {
    const callLog: Array<{
      table: string
      action: 'select' | 'delete' | 'upsert'
      payload?: unknown
      inFilters?: Record<string, unknown[]>
    }> = []

    return {
      callLog,
      from(table: string) {
        return {
          select(fields: string) {
            const inFilters: Record<string, unknown[]> = {}
            const builder = {
              in(column: string, values: unknown[]) {
                inFilters[column] = values
                return builder
              },
              then(resolve: (res: { data: unknown; error: unknown }) => void) {
                callLog.push({ table, action: 'select', payload: fields, inFilters: { ...inFilters } })
                if (options.selectError) {
                  resolve({ data: null, error: options.selectError })
                  return
                }
                if (table === 'kpi_career_map_nodes') {
                  resolve({ data: options.existingNodes || [], error: null })
                } else if (table === 'kpi_career_map_edges') {
                  resolve({ data: options.existingEdges || [], error: null })
                } else if (table === 'kpi_career_employee_placements') {
                  resolve({ data: options.existingPlacements || [], error: null })
                } else if (table === 'kpi_position_criteria_items') {
                  resolve({ data: options.existingItems || [], error: null })
                } else {
                  resolve({ data: [], error: null })
                }
              },
            }
            return builder
          },
          delete() {
            const inFilters: Record<string, unknown[]> = {}
            const builder = {
              in(column: string, values: unknown[]) {
                inFilters[column] = values
                return builder
              },
              then(resolve: (res: { error: unknown }) => void) {
                callLog.push({ table, action: 'delete', inFilters: { ...inFilters } })
                if (options.deleteError) {
                  resolve({ error: options.deleteError })
                } else {
                  resolve({ error: null })
                }
              },
            }
            return builder
          },
          upsert(rows: unknown[]) {
            callLog.push({ table, action: 'upsert', payload: rows })
            if (options.upsertError) {
              return Promise.resolve({ error: options.upsertError })
            }
            return Promise.resolve({ error: null })
          },
        }
      },
    }
  }

  it('calls delete on the default Supabase gateway for child rows missing from the aggregate', async () => {
    const existingNodes = [
      { id: 'node_1', career_map_version_id: 'map_01' },
      { id: 'node_2_to_delete', career_map_version_id: 'map_01' },
    ]
    const mockClient = createMockSupabaseClient({ existingNodes })
    const gateway = createDefaultSupabaseKpiGateway(mockClient as unknown as Parameters<typeof createDefaultSupabaseKpiGateway>[0])

    const payload = {
      ...buildRawRows(),
      career_maps: [{ id: 'map_01' }],
      career_map_nodes: [{ id: 'node_1', career_map_version_id: 'map_01' }],
    }

    await gateway.replaceAll(payload as unknown as Parameters<typeof gateway.replaceAll>[0])

    const deleteCall = mockClient.callLog.find((c) => c.table === 'kpi_career_map_nodes' && c.action === 'delete')
    assert.ok(deleteCall, 'Must issue a delete call for removed child node')
    assert.deepEqual(deleteCall.inFilters?.['id'], ['node_2_to_delete'])
    assert.deepEqual(deleteCall.inFilters?.['career_map_version_id'], ['map_01'])
  })

  it('scopes criteria item deletes to the target profile', async () => {
    const existingItems = [
      { id: 'item_1', profile_id: 'prof_01' },
      { id: 'item_2_to_delete', profile_id: 'prof_01' },
    ]
    const mockClient = createMockSupabaseClient({ existingItems })
    const gateway = createDefaultSupabaseKpiGateway(mockClient as unknown as Parameters<typeof createDefaultSupabaseKpiGateway>[0])

    const payload = {
      ...buildRawRows(),
      position_criteria_profiles: [{ id: 'prof_01' }],
      position_criteria_items: [{ id: 'item_1', profile_id: 'prof_01' }],
    }

    await gateway.replaceAll(payload as unknown as Parameters<typeof gateway.replaceAll>[0])

    const deleteCall = mockClient.callLog.find((c) => c.table === 'kpi_position_criteria_items' && c.action === 'delete')
    assert.ok(deleteCall, 'Must issue a delete call for removed criteria item')
    assert.deepEqual(deleteCall.inFilters?.['id'], ['item_2_to_delete'])
    assert.deepEqual(deleteCall.inFilters?.['profile_id'], ['prof_01'])
  })

  it('throws when reconciliation select delete or upsert fails', async () => {
    // Select error
    const selectErrClient = createMockSupabaseClient({ selectError: new Error('DB select failed') })
    const gateway1 = createDefaultSupabaseKpiGateway(selectErrClient as unknown as Parameters<typeof createDefaultSupabaseKpiGateway>[0])
    await assert.rejects(
      async () => {
        await gateway1.replaceAll({
          ...buildRawRows(),
          career_maps: [{ id: 'map_01' }],
          career_map_nodes: [],
        } as unknown as Parameters<typeof gateway1.replaceAll>[0])
      },
      /DB select failed/
    )

    // Delete error
    const existingNodes = [{ id: 'node_stale', career_map_version_id: 'map_01' }]
    const deleteErrClient = createMockSupabaseClient({ existingNodes, deleteError: new Error('DB delete failed') })
    const gateway2 = createDefaultSupabaseKpiGateway(deleteErrClient as unknown as Parameters<typeof createDefaultSupabaseKpiGateway>[0])
    await assert.rejects(
      async () => {
        await gateway2.replaceAll({
          ...buildRawRows(),
          career_maps: [{ id: 'map_01' }],
          career_map_nodes: [],
        } as unknown as Parameters<typeof gateway2.replaceAll>[0])
      },
      /DB delete failed/
    )

    // Upsert error
    const upsertErrClient = createMockSupabaseClient({ upsertError: new Error('DB upsert failed') })
    const gateway3 = createDefaultSupabaseKpiGateway(upsertErrClient as unknown as Parameters<typeof createDefaultSupabaseKpiGateway>[0])
    await assert.rejects(
      async () => {
        await gateway3.replaceAll(buildRawRows() as unknown as Parameters<typeof gateway3.replaceAll>[0])
      },
      /DB upsert failed/
    )
  })

  it('round-trips career grades, skills and certifications to database and back', async () => {
    let storedRows: GatewayRows = {
      ...buildRawRows(),
      career_maps: [
        {
          id: 'map_01',
          version: 1,
          status: 'draft',
          scope: 'chain',
          created_by: 'hr_01',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
      career_grades: [
        { code: 'c1_pc', rank: 1, label: 'C1 - Pha chế', position_key: 'store_employee', required_skill_codes: ['barista'], management: false },
        { code: 'c2', rank: 2, label: 'C2 - Nhân viên đa năng', position_key: 'store_employee', required_skill_codes: ['barista', 'cashier'], management: false },
      ],
      operational_skills: [
        { code: 'barista', label: 'Pha chế', active: true },
        { code: 'cashier', label: 'Thu ngân', active: true },
      ],
      employee_skill_certifications: [
        {
          id: 'cert_1',
          employee_id: 'emp_1',
          skill_code: 'barista',
          status: 'achieved',
          assessed_at: '2026-08-01',
          assessed_by: 'lead_1',
          score: 95,
          evidence_refs: ['doc_1'],
          standard_version: 1,
        },
      ],
      career_map_nodes: [
        {
          id: 'node_c1_pc',
          career_map_version_id: 'map_01',
          position_id: 'pos_store_employee',
          position_name_snapshot: 'Nhân viên cửa hàng',
          position_level_snapshot: 1,
          job_family: 'store_operations',
          grade_code: 'c1_pc',
          grade_name_snapshot: 'C1 - Pha chế',
          x: 100,
          y: 200,
          criteria_profile_id: 'profile_c1_pc',
          active: true,
        },
      ],
      position_criteria_profiles: [
        {
          id: 'profile_c1_pc',
          position_ids: ['pos_store_employee'],
          grade_codes: ['c1_pc'],
          job_family: 'store_operations',
          version: 1,
          effective_from: '2026-08-01',
        },
      ],
    }

    const fakeGateway = {
      async loadAll() {
        return storedRows
      },
      async replaceAll(next: GatewayRows) {
        storedRows = next
      },
    }

    const repo = createSupabaseKpiRepository({ gateway: fakeGateway as any })
    const db = await repo.load()

    assert.equal(db.career_grades.length, 2)
    assert.equal(db.operational_skills.length, 2)
    assert.equal(db.employee_skill_certifications.length, 1)
    assert.equal(db.employee_skill_certifications[0].skill_code, 'barista')
    assert.equal(db.career_maps[0]?.nodes[0]?.grade_code, 'c1_pc')
    assert.deepEqual(db.position_criteria_profiles[0]?.grade_codes, ['c1_pc'])

    // Save back
    await repo.save({ ...db, revision: db.revision + 1 }, db.revision)
    assert.equal(storedRows.career_grades?.length, 2)
    assert.equal(storedRows.employee_skill_certifications?.length, 1)
  })
})

