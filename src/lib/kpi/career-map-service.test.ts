import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  addCareerMapEdge,
  addCareerMapNode,
  addCareerPosition,
  applyHomiesCareerTemplate,
  classifyCareerTransition,
  createCareerMapDraft,
  findUnplacedPositions,
  moveCareerMapNode,
  removeCareerMapEdge,
  removeCareerMapNode,
  resolveCareerGradeCode,
  selectEditableCareerMap,
  updateSharedPreset,
  validateCareerMap,
} from './career-map-service.ts'
import {
  publishCareerMap,
  returnCareerMapDraft,
  buildKpiSetDraftsFromCareerMap,
} from './career-map-deployment-service.ts'
import { createDefaultProfileForPosition } from './career-map-criteria-service.ts'
import { buildHomiesCareerMapSeed } from './seed.ts'
import { DEFAULT_CAREER_TRANSITION_PRESETS } from './career-map-types.ts'
import type {
  KpiCareerPositionSnapshot,
  KpiPositionCriteriaProfile,
} from './career-map-types.ts'
import type { KpiSetVersion } from './types.ts'

const positions: KpiCareerPositionSnapshot[] = [
  { id: 'barista_c1', name: 'Pha chế C1', department_id: 'ops', level: 1, base_salary: 5500000, pay_type: 'hourly' },
  { id: 'barista_c2', name: 'Pha chế C2', department_id: 'ops', level: 2, base_salary: 6000000, pay_type: 'hourly' },
  { id: 'barista_lead', name: 'Pha chế chính', department_id: 'ops', level: 3, base_salary: 7000000, pay_type: 'monthly' },
  { id: 'cashier_c1', name: 'Thu ngân C1', department_id: 'ops', level: 1, base_salary: 5000000, pay_type: 'hourly' },
  { id: 'cashier_c2', name: 'Thu ngân C2', department_id: 'ops', level: 2, base_salary: 5500000, pay_type: 'hourly' },
  { id: 'shift_leader', name: 'Trưởng ca', department_id: 'ops', level: 3, base_salary: 8000000, pay_type: 'monthly' },
  { id: 'store_manager', name: 'Quản lý cửa hàng', department_id: 'ops', level: 4, base_salary: 15000000, pay_type: 'monthly' },
]

describe('career map graph domain and rules', () => {
  it('creates one chain-wide draft from Homies position master data', () => {
    const map = createCareerMapDraft(positions, 'hr_01', '2026-08-24T08:00:00.000Z')
    assert.equal(map.scope, 'chain')
    assert.equal(map.status, 'draft')
    assert.equal(map.version, 1)
    assert.equal(map.nodes.length, 0)
    assert.equal(map.edges.length, 0)
    assert.equal(map.created_by, 'hr_01')
    assert.equal(map.master_position_snapshot.length, 7)
    assert.equal(map.created_at, '2026-08-24T08:00:00.000Z')
  })

  it('allows adding, moving, and removing career map nodes immutably', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    const withNode1 = addCareerMapNode(draft, 'barista_c1', { x: 100, y: 100 })
    assert.equal(draft.nodes.length, 0, 'Original draft must not be mutated')
    assert.equal(withNode1.nodes.length, 1)
    assert.equal(withNode1.nodes[0].position_name_snapshot, 'Pha chế C1')
    assert.equal(withNode1.nodes[0].position_level_snapshot, 1)
    assert.equal(withNode1.nodes[0].x, 100)
    assert.equal(withNode1.nodes[0].y, 100)

    const nodeId = withNode1.nodes[0].id
    const moved = moveCareerMapNode(withNode1, nodeId, 250, 350)
    assert.equal(withNode1.nodes[0].x, 100, 'Previous map must not be mutated')
    assert.equal(moved.nodes[0].x, 250)
    assert.equal(moved.nodes[0].y, 350)

    const removed = removeCareerMapNode(moved, nodeId)
    assert.equal(moved.nodes.length, 1)
    assert.equal(removed.nodes.length, 0)
  })

  it('allows multiple grade nodes for the same position without id collisions', () => {
    const employeePosition: KpiCareerPositionSnapshot = {
      id: 'pos_store_employee',
      name: 'Nhân viên cửa hàng',
      level: 1,
      job_family: 'barista',
    }
    const draft = createCareerMapDraft([employeePosition], 'hr_01')
    const withC1 = addCareerMapNode(draft, employeePosition, undefined, 'profile_c1_pc', undefined, 'c1_pc')
    const withC2 = addCareerMapNode(withC1, employeePosition, undefined, 'profile_c2', undefined, 'c2')

    assert.equal(withC2.nodes.length, 2)
    assert.deepEqual(withC2.nodes.map((node) => node.grade_code), ['c1_pc', 'c2'])
    assert.notEqual(withC2.nodes[0].id, withC2.nodes[1].id)
  })

  it('removes associated incoming and outgoing edges when a node is removed', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'barista_c1')
    map = addCareerMapNode(map, 'barista_c2')
    map = addCareerMapNode(map, 'shift_leader')

    const node1Id = map.nodes[0].id
    const node2Id = map.nodes[1].id
    const node3Id = map.nodes[2].id

    map = addCareerMapEdge(map, node1Id, node2Id)
    map = addCareerMapEdge(map, node2Id, node3Id)
    assert.equal(map.edges.length, 2)

    // Remove middle node (node2Id)
    const updated = removeCareerMapNode(map, node2Id)
    assert.equal(updated.nodes.length, 2)
    assert.equal(updated.edges.length, 0, 'Both edges connected to node2 must be removed')
  })

  it('allows removing an edge explicitly', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'barista_c1')
    map = addCareerMapNode(map, 'barista_c2')
    map = addCareerMapEdge(map, map.nodes[0].id, map.nodes[1].id)
    assert.equal(map.edges.length, 1)

    const edgeId = map.edges[0].id
    const updated = removeCareerMapEdge(map, edgeId)
    assert.equal(updated.edges.length, 0)
    assert.equal(map.edges.length, 1, 'Original map must remain unchanged')
  })

  it('allows multiple branches to converge on the next level (e.g. into Shift Leader)', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'barista_c2')
    map = addCareerMapNode(map, 'cashier_c2')
    map = addCareerMapNode(map, 'shift_leader')

    const baristaNodeId = map.nodes.find((n) => n.position_id === 'barista_c2')!.id
    const cashierNodeId = map.nodes.find((n) => n.position_id === 'cashier_c2')!.id
    const shiftLeaderNodeId = map.nodes.find((n) => n.position_id === 'shift_leader')!.id

    map = addCareerMapEdge(map, baristaNodeId, shiftLeaderNodeId)
    map = addCareerMapEdge(map, cashierNodeId, shiftLeaderNodeId)

    assert.equal(map.edges.length, 2)
    const validation = validateCareerMap(map)
    assert.equal(validation.has_blocking, false)
    assert.equal(validation.valid, true)
  })

  it('blocks same-level edges with issue code same_level', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'barista_c2')
    map = addCareerMapNode(map, 'cashier_c2')

    const node1Id = map.nodes[0].id
    const node2Id = map.nodes[1].id
    map = addCareerMapEdge(map, node1Id, node2Id)

    const validation = validateCareerMap(map)
    assert.equal(validation.valid, false)
    assert.equal(validation.has_blocking, true)
    const issue = validation.issues.find((i) => i.code === 'same_level')
    assert.ok(issue, 'Must report same_level issue')
    assert.equal(issue?.severity, 'blocking')
  })

  it('blocks downward edges with issue code downward', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'shift_leader') // Level 3
    map = addCareerMapNode(map, 'barista_c2') // Level 2

    const leaderNodeId = map.nodes[0].id
    const baristaNodeId = map.nodes[1].id
    map = addCareerMapEdge(map, leaderNodeId, baristaNodeId)

    const validation = validateCareerMap(map)
    assert.equal(validation.valid, false)
    assert.equal(validation.has_blocking, true)
    const issue = validation.issues.find((i) => i.code === 'downward')
    assert.ok(issue, 'Must report downward issue')
    assert.equal(issue?.severity, 'blocking')
  })

  it('blocks skipped-level edges with issue code skipped_level', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'barista_c1') // Level 1
    map = addCareerMapNode(map, 'shift_leader') // Level 3

    const node1Id = map.nodes[0].id
    const node2Id = map.nodes[1].id
    map = addCareerMapEdge(map, node1Id, node2Id)

    const validation = validateCareerMap(map)
    assert.equal(validation.valid, false)
    assert.equal(validation.has_blocking, true)
    const issue = validation.issues.find((i) => i.code === 'skipped_level')
    assert.ok(issue, 'Must report skipped_level issue')
    assert.equal(issue?.severity, 'blocking')
  })

  it('blocks self-loop edges with issue code self_loop', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'barista_c1')

    const node1Id = map.nodes[0].id
    map = addCareerMapEdge(map, node1Id, node1Id)

    const validation = validateCareerMap(map)
    assert.equal(validation.valid, false)
    assert.equal(validation.has_blocking, true)
    const issue = validation.issues.find((i) => i.code === 'self_loop')
    assert.ok(issue, 'Must report self_loop issue')
    assert.equal(issue?.severity, 'blocking')
  })

  it('blocks cyclic edges with issue code cycle', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'barista_c1')
    map = addCareerMapNode(map, 'barista_c2')
    map = addCareerMapNode(map, 'shift_leader')

    const n1 = map.nodes[0].id
    const n2 = map.nodes[1].id
    const n3 = map.nodes[2].id

    map = addCareerMapEdge(map, n1, n2)
    map = addCareerMapEdge(map, n2, n3)
    // Manually force cycle back to n1 for cycle detection testing
    map = {
      ...map,
      edges: [
        ...map.edges,
        {
          id: 'edge_cycle_test',
          source_node_id: n3,
          target_node_id: n1,
          preset_key: 'same_profession_level_up',
          preset_version: 1,
          active: true,
        },
      ],
    }

    const validation = validateCareerMap(map)
    assert.equal(validation.valid, false)
    assert.equal(validation.has_blocking, true)
    const cycleIssue = validation.issues.find((i) => i.code === 'cycle')
    assert.ok(cycleIssue, 'Must report cycle issue')
    assert.equal(cycleIssue?.severity, 'blocking')
  })

  it('lists newly added master positions as unplaced', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    const unplacedAll = findUnplacedPositions(draft, positions)
    assert.equal(unplacedAll.length, positions.length)

    const withOneNode = addCareerMapNode(draft, 'barista_c1')
    const unplacedRest = findUnplacedPositions(withOneNode, positions)
    assert.equal(unplacedRest.length, positions.length - 1)
    assert.ok(!unplacedRest.some((p) => p.id === 'barista_c1'))
    assert.ok(unplacedRest.some((p) => p.id === 'barista_c2'))
  })

  it('classifies transition presets accurately based on source and target nodes', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'barista_c1')
    map = addCareerMapNode(map, 'barista_c2')
    map = addCareerMapNode(map, 'barista_lead')
    map = addCareerMapNode(map, 'shift_leader')
    map = addCareerMapNode(map, 'store_manager')

    const nB1 = map.nodes.find((n) => n.position_id === 'barista_c1')!
    const nB2 = map.nodes.find((n) => n.position_id === 'barista_c2')!
    const nLead = map.nodes.find((n) => n.position_id === 'barista_lead')!
    const nSL = map.nodes.find((n) => n.position_id === 'shift_leader')!
    const nSM = map.nodes.find((n) => n.position_id === 'store_manager')!

    assert.equal(classifyCareerTransition(nB1, nB2), 'same_profession_level_up')
    assert.equal(classifyCareerTransition(nB2, nLead), 'to_senior_employee')
    assert.equal(classifyCareerTransition(nB2, nSL), 'to_shift_leader')
    assert.equal(classifyCareerTransition(nSL, nSM), 'to_store_manager')
  })

  it('detects missing level on node as a blocking validation issue', () => {
    const customPositions: KpiCareerPositionSnapshot[] = [
      { id: 'pos_no_level', name: 'Nhân viên thời vụ', department_id: 'ops' },
    ]
    let map = createCareerMapDraft(customPositions, 'hr_01')
    map = addCareerMapNode(map, 'pos_no_level')

    const validation = validateCareerMap(map)
    assert.equal(validation.valid, false)
    assert.equal(validation.has_blocking, true)
    const missingLevelIssue = validation.issues.find((i) => i.code === 'missing_level')
    assert.ok(missingLevelIssue, 'Must report missing_level issue')
  })

  it('generates warning issues for unplaced positions and non-terminal nodes with no progression', () => {
    let map = createCareerMapDraft(positions, 'hr_01')
    map = addCareerMapNode(map, 'barista_c1') // Level 1, no outgoing edge

    const validation = validateCareerMap(map)
    const unplacedIssue = validation.issues.find((i) => i.code === 'unplaced_positions')
    assert.ok(unplacedIssue, 'Should warn about unplaced master positions')
    assert.equal(unplacedIssue?.severity, 'warning')

    const noProgressionIssue = validation.issues.find((i) => i.code === 'no_progression')
    assert.ok(noProgressionIssue, 'Should warn about non-terminal node without progression')
    assert.equal(noProgressionIssue?.severity, 'warning')
  })

  it('adds a live master position without converting its UUID into the display name', () => {
    const livePosition: KpiCareerPositionSnapshot = {
      id: '8f7636e2-2a91-4cf1-83d7-4638d2f70b7d',
      name: 'Pha chế Trà Sữa Thượng Hạng',
      level: 2,
      department_id: 'store_operations',
      active: true,
    }
    const draft = createCareerMapDraft([livePosition], 'hr_01')
    const updated = addCareerMapNode(draft, livePosition)

    assert.equal(updated.nodes.length, 1)
    assert.equal(updated.nodes[0].position_id, '8f7636e2-2a91-4cf1-83d7-4638d2f70b7d')
    assert.equal(updated.nodes[0].position_name_snapshot, 'Pha chế Trà Sữa Thượng Hạng')
    assert.notEqual(updated.nodes[0].position_name_snapshot, '8f7636e2-2a91-4cf1-83d7-4638d2f70b7d')
  })

  it('adds a newly-created master position with its real adjacent level', () => {
    const draft = createCareerMapDraft([], 'hr_01')
    const newPos: KpiCareerPositionSnapshot = {
      id: 'pos_new_lead',
      name: 'Trưởng nhóm phục vụ C3',
      department_id: 'ops',
    }
    const updated = addCareerMapNode(draft, newPos)

    assert.equal(updated.nodes[0].position_level_snapshot, 3)
    assert.equal(updated.nodes[0].job_family, 'service')
  })

  it('creates and links the default F&B criteria profile when a node is added', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    const updated = addCareerMapNode(draft, 'barista_c1')

    assert.ok(updated.nodes[0].criteria_profile_id)
    assert.equal(updated.nodes[0].criteria_profile_id, 'profile_barista_c1')
  })

  it('uses the career map as the primary scope flow without generating per-stage drafts', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    const populated = addCareerMapNode(addCareerMapNode(draft, 'barista_c1'), 'barista_c2')

    assert.equal(populated.scope, 'chain')
    assert.equal(populated.nodes.length, 2)
    assert.equal(populated.status, 'draft')
  })

  it('blocks submission when a node has no criteria profile', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    const map = addCareerMapNode(draft, 'barista_c1')
    const validation = validateCareerMap(map, []) // empty profiles

    assert.equal(validation.valid, false)
    assert.equal(validation.has_blocking, true)
    assert.ok(validation.issues.some((i) => i.code === 'missing_criteria'))
  })

  it('blocks publication when active criteria do not total 100 percent', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    const map = addCareerMapNode(draft, 'barista_c1')
    const invalidProfile: KpiPositionCriteriaProfile = {
      id: 'profile_barista_c1',
      position_ids: ['barista_c1'],
      job_family: 'barista',
      version: 1,
      effective_from: null,
      criteria: [
        {
          id: 'c_1',
          name: 'Tốc độ ra món',
          source: 'fnb_common',
          evidence_source: 'pos',
          direction: 'higher_is_better',
          suggested_weight: 40,
          weight: 40, // only 40%, not 100%
          locked: false,
          active: true,
        },
      ],
    }

    const validation = validateCareerMap(map, [invalidProfile])
    assert.equal(validation.valid, false)
    assert.equal(validation.has_blocking, true)
    assert.ok(validation.issues.some((i) => i.code === 'invalid_weight'))
  })

  it('blocks CEO from publishing a draft that HR has not submitted', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    const map = addCareerMapNode(draft, 'barista_c1')

    assert.throws(
      () => publishCareerMap(map, { id: 'ceo_01', role: 'ceo' }, '2026-09-01', []),
      /Chỉ có thể ban hành sơ đồ đang ở trạng thái Chờ duyệt/
    )
  })

  it('blocks returning a map that is not pending approval', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')

    assert.throws(
      () => returnCareerMapDraft(draft, { id: 'ceo_01', role: 'ceo' }, 'Cần chỉnh lại'),
      /Chỉ có thể trả lại sơ đồ đang ở trạng thái Chờ duyệt/
    )
  })

  it('creates KPI set version 2 instead of dropping a repeated position deployment', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    const map = addCareerMapNode(draft, 'barista_c1')
    const profile = createDefaultProfileForPosition({ id: 'barista_c1', name: 'Pha chế C1', level: 1 })

    const existingV1Sets: KpiSetVersion[] = [
      {
        id: 'kpi_set_barista_c1_v1',
        set_id: 'kpi_set_barista_c1',
        version: 1,
        name: 'Bộ KPI Pha chế C1 v1',
        status: 'published',
        position_ids: ['barista_c1'],
        level_codes: ['pt1_pc'],
        store_ids: 'all',
        effective_from: '2026-08-01',
        score_scale: [1, 2, 3, 4, 5],
        groups: [],
        created_by: 'hr_01',
        created_at: '2026-08-01T00:00:00Z',
      },
    ]

    const newDrafts = buildKpiSetDraftsFromCareerMap(map, [profile], existingV1Sets)
    assert.equal(newDrafts.length, 1)
    assert.equal(newDrafts[0].version, 2)
    assert.equal(newDrafts[0].set_id, 'kpi_set_barista_c1')
    assert.notEqual(newDrafts[0].id, existingV1Sets[0].id)
  })

  it('keeps published KPI version 1 unchanged after version 2 is generated', () => {
    const existingV1: KpiSetVersion = {
      id: 'kpi_set_barista_c1_v1',
      set_id: 'kpi_set_barista_c1',
      version: 1,
      name: 'Bộ KPI Pha chế C1 v1',
      status: 'published',
      position_ids: ['barista_c1'],
      level_codes: ['pt1_pc'],
      store_ids: 'all',
      effective_from: '2026-08-01',
      score_scale: [1, 2, 3, 4, 5],
      groups: [],
      created_by: 'hr_01',
      created_at: '2026-08-01T00:00:00Z',
    }

    const draft = createCareerMapDraft(positions, 'hr_01')
    const map = addCareerMapNode(draft, 'barista_c1')
    const profile = createDefaultProfileForPosition({ id: 'barista_c1', name: 'Pha chế C1', level: 1 })

    const newDrafts = buildKpiSetDraftsFromCareerMap(map, [profile], [existingV1])

    assert.equal(existingV1.version, 1)
    assert.equal(existingV1.status, 'published')
    assert.equal(newDrafts[0].version, 2)
  })

  it('creates a live-master career map instead of reusing the fake-id seed', () => {
    const liveMaster: KpiCareerPositionSnapshot[] = [
      { id: 'b0000000-0000-0000-0000-000000000001', name: 'Pha chế C1', level: 1, department_id: 'ops', job_family: 'barista' },
      { id: 'b0000000-0000-0000-0000-000000000002', name: 'Trưởng ca', level: 3, department_id: 'ops', job_family: 'management' },
    ]

    const fakeSeedMap = createCareerMapDraft([
      { id: 'pos_barista_c1', name: 'Pha chế C1 (Fake)', level: 1 },
    ], 'system')

    const selected = selectEditableCareerMap({
      maps: [fakeSeedMap],
      livePositions: liveMaster,
      actorId: 'hr_01',
    })

    assert.equal(selected.status, 'draft')
    assert.equal(selected.master_position_snapshot.length, 2)
    assert.equal(selected.master_position_snapshot[0].id, 'b0000000-0000-0000-0000-000000000001')
    assert.notEqual(selected.id, fakeSeedMap.id)
  })

  it('adds a position snapshot with its UUID name level department and job family intact', () => {
    const livePos: KpiCareerPositionSnapshot = {
      id: 'e4f1a234-5678-4abc-9def-0123456789ab',
      name: 'Pha chế bậc 1',
      level: 1,
      department_id: 'dep_beverage_01',
      job_family: 'barista',
    }

    const draft = createCareerMapDraft([livePos], 'hr_01')
    const result = addCareerPosition(draft, [], livePos, { x: 120, y: 180 })

    assert.equal(result.map.nodes.length, 1)
    const node = result.map.nodes[0]
    assert.equal(node.position_id, 'e4f1a234-5678-4abc-9def-0123456789ab')
    assert.equal(node.position_name_snapshot, 'Pha chế bậc 1')
    assert.equal(node.position_level_snapshot, 1)
    assert.equal(node.job_family, 'barista')
    assert.equal(node.x, 120)
    assert.equal(node.y, 180)
  })

  it('atomically adds a node and a real default profile whose active weights total 100', () => {
    const livePos: KpiCareerPositionSnapshot = {
      id: 'e4f1a234-5678-4abc-9def-0123456789ab',
      name: 'Pha chế bậc 1',
      level: 1,
      job_family: 'barista',
    }

    const draft = createCareerMapDraft([livePos], 'hr_01')
    const result = addCareerPosition(draft, [], livePos, { x: 100, y: 100 })

    assert.equal(result.map.nodes.length, 1)
    assert.equal(result.profiles.length, 1)

    const profile = result.profiles[0]
    assert.ok(profile.id)
    assert.deepEqual(profile.position_ids, [livePos.id])
    assert.equal(result.map.nodes[0].criteria_profile_id, profile.id)

    const activeCriteria = profile.criteria.filter((c) => c.active)
    assert.ok(activeCriteria.length > 0, 'Profile must have active criteria')
    const totalWeight = activeCriteria.reduce((sum, c) => sum + c.weight, 0)
    assert.equal(totalWeight, 100, 'Active criteria must total exactly 100%')
  })

  it('blocks an operations branch that never converges to management', () => {
    const opsPositions: KpiCareerPositionSnapshot[] = [
      { id: 'pos_b1', name: 'Pha chế C1', level: 1, job_family: 'barista' },
      { id: 'pos_b2', name: 'Pha chế C2', level: 2, job_family: 'barista' },
      { id: 'pos_c1', name: 'Thu ngân C1', level: 1, job_family: 'cashier' },
      { id: 'pos_sl', name: 'Trưởng ca', level: 3, job_family: 'management' },
    ]

    let map = createCareerMapDraft(opsPositions, 'hr_01')
    for (const p of opsPositions) {
      map = addCareerMapNode(map, p.id)
    }

    const nB1 = map.nodes.find((n) => n.position_id === 'pos_b1')!.id
    const nB2 = map.nodes.find((n) => n.position_id === 'pos_b2')!.id
    const nC1 = map.nodes.find((n) => n.position_id === 'pos_c1')!.id
    const nSL = map.nodes.find((n) => n.position_id === 'pos_sl')!.id

    // b1 -> b2 (dead end, never connects to management/SL), c1 -> sl
    map = addCareerMapEdge(map, nB1, nB2)
    map = addCareerMapEdge(map, nC1, nSL)

    const profiles = opsPositions.map((p) => createDefaultProfileForPosition(p))
    const validation = validateCareerMap(map, profiles)

    assert.equal(validation.valid, false)
    assert.ok(
      validation.issues.some((i) => i.code === 'no_management_convergence' && i.node_id === nB2),
      'Must flag non-terminal ops node that never reaches management level'
    )
  })

  it('updates every matching edge when a shared preset receives a new version', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    let map = addCareerMapNode(draft, 'barista_c1')
    map = addCareerMapNode(map, 'barista_c2')
    map = addCareerMapNode(map, 'cashier_c1')
    map = addCareerMapNode(map, 'cashier_c2')

    const nB1 = map.nodes.find((n) => n.position_id === 'barista_c1')!.id
    const nB2 = map.nodes.find((n) => n.position_id === 'barista_c2')!.id
    const nC1 = map.nodes.find((n) => n.position_id === 'cashier_c1')!.id
    const nC2 = map.nodes.find((n) => n.position_id === 'cashier_c2')!.id

    map = addCareerMapEdge(map, nB1, nB2) // same_profession_level_up v1
    map = addCareerMapEdge(map, nC1, nC2) // same_profession_level_up v1

    const presets = { ...DEFAULT_CAREER_TRANSITION_PRESETS }

    const updateResult = updateSharedPreset(
      presets,
      map,
      'same_profession_level_up',
      { required_good_months: 4, min_kpi_score: 85 }
    )

    assert.equal(updateResult.presets.same_profession_level_up.version, 2)
    assert.equal(updateResult.presets.same_profession_level_up.required_good_months, 4)
    assert.equal(updateResult.affectedEdgeCount, 2)

    assert.equal(updateResult.map.edges[0].preset_version, 2)
    assert.equal(updateResult.map.edges[1].preset_version, 2)
  })

  it('validates and flags empty_map as blocking when career map has 0 active nodes', () => {
    const emptyDraft = createCareerMapDraft([], 'hr_01')
    const result = validateCareerMap(emptyDraft, [])
    assert.equal(result.valid, false)
    assert.equal(result.has_blocking, true)
    assert.ok(result.issues.some((i) => i.code === 'empty_map' && i.severity === 'blocking'))
  })

  it('rejects strict validation when profiles presets or master positions are missing or inactive', () => {
    const draft = createCareerMapDraft(positions, 'hr_01')
    const withNode = addCareerMapNode(draft, 'barista_c1')
    const validProfile = createDefaultProfileForPosition(positions[0])

    // Missing profile context in strict mode
    const strictNoProfiles = validateCareerMap({ map: withNode, strict: true })
    assert.equal(strictNoProfiles.valid, false)
    assert.ok(strictNoProfiles.issues.some((i) => i.code === 'missing_profile_context'))

    const strictNoPresets = validateCareerMap({
      map: withNode,
      profiles: [validProfile],
      masterPositions: positions,
      strict: true,
    })
    assert.equal(strictNoPresets.valid, false)
    assert.ok(strictNoPresets.issues.some((i) => i.code === 'missing_preset_context'))

    const strictNoMasterPositions = validateCareerMap({
      map: withNode,
      profiles: [validProfile],
      presets: DEFAULT_CAREER_TRANSITION_PRESETS,
      strict: true,
    })
    assert.equal(strictNoMasterPositions.valid, false)
    assert.ok(strictNoMasterPositions.issues.some((i) => i.code === 'missing_master_position_context'))

    // Inactive master position
    const inactiveMasterPositions = [
      { id: 'barista_c1', name: 'Pha chế C1', level: 1, active: false },
    ]
    const strictInactivePos = validateCareerMap({
      map: withNode,
      profiles: [],
      masterPositions: inactiveMasterPositions,
      strict: true,
    })
    assert.equal(strictInactivePos.valid, false)
    assert.ok(strictInactivePos.issues.some((i) => i.code === 'master_position_inactive_or_missing'))
  })

  it('allows C1-PC and C1-TN to share one position and converges to C2', () => {
    const homiesPositions: KpiCareerPositionSnapshot[] = [
      { id: 'pos_store_employee', name: 'Nhân viên cửa hàng', level: 1, job_family: 'store_operations', active: true },
      { id: 'pos_shift_leader', name: 'Trưởng ca', level: 2, job_family: 'management', active: true },
      { id: 'pos_store_manager', name: 'Quản lý cửa hàng', level: 3, job_family: 'management', active: true },
    ]
    const result = applyHomiesCareerTemplate({ positions: homiesPositions, actor_id: 'hr_01' })
    const c1Nodes = result.map.nodes.filter((node) => ['c1_pc', 'c1_tn'].includes(node.grade_code || ''))
    assert.equal(c1Nodes.length, 2)
    assert.equal(new Set(c1Nodes.map((node) => node.position_id)).size, 1)

    const validation = validateCareerMap({
      map: result.map,
      profiles: result.profiles,
      masterPositions: homiesPositions,
      strict: true,
    })
    assert.equal(validation.valid, true)
  })

  it('does not infer grade from probation or position name', () => {
    assert.equal(resolveCareerGradeCode({ explicit_grade_code: null }), null)
    assert.equal(resolveCareerGradeCode({}), null)
  })

  it('builds six grade nodes and five transitions via seed', () => {
    const result = buildHomiesCareerMapSeed()
    assert.deepEqual(result.map.nodes.map((node) => node.grade_code), [
      'c1_pc', 'c1_tn', 'c2', 'c3', 'c4', 'c5',
    ])
    assert.equal(result.map.edges.length, 5)
    for (const node of result.map.nodes) {
      const profile = result.profiles.find((item) => item.id === node.criteria_profile_id)
      assert.ok(profile)
      assert.equal(profile.criteria.reduce((sum, item) => sum + item.weight, 0), 100)
    }
  })
})
