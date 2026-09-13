import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildKpiSetDraftsFromCareerMap,
  buildPromotionDossiers,
  clonePublishedCareerMapAsDraft,
  createCareerMapDeploymentPreview,
  placeEmployeesOnCareerMap,
  publishCareerMap,
  returnCareerMapDraft,
  scopePromotionDossiers,
  submitCareerMapForApproval,
} from './career-map-deployment-service.ts'
import {
  addCareerMapEdge,
  addCareerMapNode,
  createCareerMapDraft,
} from './career-map-service.ts'
import { createDefaultProfileForPosition } from './career-map-criteria-service.ts'
import type {
  KpiCareerMapVersion,
  KpiCareerPositionSnapshot,
  KpiPositionCriteriaProfile,
} from './career-map-types.ts'

const masterPositions: KpiCareerPositionSnapshot[] = [
  { id: 'pos_b1', name: 'Pha chế C1', level: 1, job_family: 'barista' },
  { id: 'pos_b2', name: 'Pha chế C2', level: 2, job_family: 'barista' },
  { id: 'pos_c1', name: 'Thu ngân C1', level: 1, job_family: 'cashier' },
  { id: 'pos_c2', name: 'Thu ngân C2', level: 2, job_family: 'cashier' },
  { id: 'pos_sl', name: 'Trưởng ca', level: 3, job_family: 'management' },
  { id: 'pos_sm', name: 'Quản lý cửa hàng', level: 4, job_family: 'management' },
]

function createSampleMap(): {
  map: KpiCareerMapVersion
  positions: KpiCareerPositionSnapshot[]
  profiles: KpiPositionCriteriaProfile[]
  employees: Array<{ id: string; name: string; position_id: string; store_id: string }>
  stores: Array<{ id: string; name: string }>
} {
  let map = createCareerMapDraft(masterPositions, 'hr_01', '2026-08-24T08:00:00.000Z')
  for (const pos of masterPositions) {
    map = addCareerMapNode(map, pos.id)
  }

  const nB1 = map.nodes.find((n) => n.position_id === 'pos_b1')!.id
  const nB2 = map.nodes.find((n) => n.position_id === 'pos_b2')!.id
  const nC1 = map.nodes.find((n) => n.position_id === 'pos_c1')!.id
  const nC2 = map.nodes.find((n) => n.position_id === 'pos_c2')!.id
  const nSL = map.nodes.find((n) => n.position_id === 'pos_sl')!.id
  const nSM = map.nodes.find((n) => n.position_id === 'pos_sm')!.id

  map = addCareerMapEdge(map, nB1, nB2)
  map = addCareerMapEdge(map, nB2, nSL)
  map = addCareerMapEdge(map, nC1, nC2)
  map = addCareerMapEdge(map, nC2, nSL)
  map = addCareerMapEdge(map, nSL, nSM)

  const profiles = masterPositions.map((p) => createDefaultProfileForPosition(p))

  const employees = [
    { id: 'emp_01', name: 'Nguyễn Văn A', position_id: 'pos_b1', store_id: 'store_01' },
    { id: 'emp_02', name: 'Trần Thị B', position_id: 'pos_b2', store_id: 'store_01' },
    { id: 'emp_03', name: 'Lê Văn C', position_id: 'pos_unmapped', store_id: 'store_02' },
  ]

  const stores = [
    { id: 'store_01', name: 'Homies Hoàn Kiếm' },
    { id: 'store_02', name: 'Homies Cầu Giấy' },
  ]

  return { map, positions: [...masterPositions], profiles, employees, stores }
}

function validationContext(fixture: ReturnType<typeof createSampleMap>) {
  return {
    presets: fixture.map.transition_presets || {},
    masterPositions: fixture.positions,
  }
}

describe('career map deployment service', () => {
  it('summarizes branches, nodes, edges, criteria, employees and stores', () => {
    const fixture = createSampleMap()
    const preview = createCareerMapDeploymentPreview({
      map: fixture.map,
      profiles: fixture.profiles,
      employees: fixture.employees,
      stores: fixture.stores,
    })

    assert.equal(preview.position_count, 6)
    assert.equal(preview.transition_count, 5)
    assert.equal(preview.store_count, 2)
    assert.equal(preview.total_employee_count, 3)
    assert.equal(preview.placed_employee_count, 2)
    assert.equal(preview.unresolved_employee_count, 1)
    assert.equal(preview.requires_individual_confirmation, false)
  })

  it('maps employees by their current position and reports unresolved conflicts', () => {
    const fixture = createSampleMap()
    const result = placeEmployeesOnCareerMap(fixture.map, fixture.employees)

    assert.equal(result.placed.length, 2)
    assert.equal(result.unresolved.length, 1)
    assert.equal(result.unresolved[0].employee_id, 'emp_03')
    assert.equal(result.unresolved[0].unresolved_reason, 'position_not_in_map')
  })

  it('blocks HR Admin from publishing directly and allows CEO final approval', () => {
    const fixture = createSampleMap()
    const submitted = submitCareerMapForApproval(fixture.map, { id: 'hr_01', role: 'hr_admin' }, fixture.profiles, validationContext(fixture))
    assert.equal(submitted.status, 'pending_approval')

    assert.throws(
      () => publishCareerMap(submitted, { id: 'hr_01', role: 'hr_admin' }, '2026-09-01', fixture.profiles, validationContext(fixture)),
      /Chỉ CEO mới có quyền ban hành/
    )

    const published = publishCareerMap(submitted, { id: 'ceo_01', role: 'ceo' }, '2026-09-01', fixture.profiles, validationContext(fixture))
    assert.equal(published.status, 'published')
    assert.equal(published.approved_by, 'ceo_01')
    assert.equal(published.effective_from, '2026-09-01')
  })

  it('allows CEO to return draft with a clear reason', () => {
    const fixture = createSampleMap()
    const submitted = submitCareerMapForApproval(fixture.map, { id: 'hr_01', role: 'hr_admin' }, fixture.profiles, validationContext(fixture))
    const returned = returnCareerMapDraft(
      submitted,
      { id: 'ceo_01', role: 'ceo' },
      'Cần bổ sung tiêu chí an toàn vệ sinh thực phẩm cho Bếp'
    )
    assert.equal(returned.status, 'returned')
    assert.equal(returned.returned_reason, 'Cần bổ sung tiêu chí an toàn vệ sinh thực phẩm cho Bếp')
  })

  it('keeps an immutable published snapshot when master position changes', () => {
    const fixture = createSampleMap()
    const submitted = submitCareerMapForApproval(fixture.map, { id: 'hr_01', role: 'hr_admin' }, fixture.profiles, validationContext(fixture))
    const published = publishCareerMap(submitted, { id: 'ceo_01', role: 'ceo' }, '2026-09-01', fixture.profiles, validationContext(fixture))

    fixture.positions[0].name = 'Tên vị trí đã đổi'
    assert.equal(published.nodes[0].position_name_snapshot, 'Pha chế C1')
    assert.notEqual(published.nodes[0].position_name_snapshot, 'Tên vị trí đã đổi')
  })

  it('clones a published map as a next draft version', () => {
    const fixture = createSampleMap()
    const submitted = submitCareerMapForApproval(fixture.map, { id: 'hr_01', role: 'hr_admin' }, fixture.profiles, validationContext(fixture))
    const published = publishCareerMap(submitted, { id: 'ceo_01', role: 'ceo' }, '2026-09-01', fixture.profiles, validationContext(fixture))

    const nextDraft = clonePublishedCareerMapAsDraft(published, 'hr_02')
    assert.equal(nextDraft.status, 'draft')
    assert.equal(nextDraft.version, 2)
    assert.equal(nextDraft.based_on_version_id, published.id)
    assert.equal(nextDraft.created_by, 'hr_02')
    assert.equal(nextDraft.approved_by, null)
    assert.equal(nextDraft.nodes.length, published.nodes.length)
    assert.equal(nextDraft.edges.length, published.edges.length)
  })

  it('builds KPI set drafts from published career map without individual stage confirmation', () => {
    const fixture = createSampleMap()
    const sets = buildKpiSetDraftsFromCareerMap(fixture.map, fixture.profiles)
    assert.equal(sets.length, fixture.map.nodes.length)
    assert.equal(new Set(sets.map((s) => s.position_ids?.[0])).size, fixture.map.nodes.length)
  })

  it('handles edge cases: inactive employee and missing level in placement', () => {
    const fixture = createSampleMap()
    const edgeEmployees = [
      { id: 'emp_inactive', name: 'Nhân viên nghỉ việc', position_id: 'barista_c1', store_id: 's1', active: false },
      { id: 'emp_missing_lvl', name: 'Nhân viên lỗi cấp', position_id: 'unknown_pos', store_id: 's1', active: true },
    ]

    const result = placeEmployeesOnCareerMap(fixture.map, edgeEmployees)
    assert.equal(result.placed.length, 0)
    assert.equal(result.unresolved.length, 2)
    assert.equal(result.unresolved[0].unresolved_reason, 'inactive_position')
    assert.equal(result.unresolved[1].unresolved_reason, 'position_not_in_map')
  })

  it('rejects submission when profiles are omitted', () => {
    const fixture = createSampleMap()
    // Submitting without passing profiles must be rejected
    assert.throws(
      () => (submitCareerMapForApproval as unknown as (map: KpiCareerMapVersion, actor: { id: string; role: string }) => KpiCareerMapVersion)(
        fixture.map,
        { id: 'hr_01', role: 'hr_admin' }
      ),
      /Danh sách tiêu chí \(profiles\) là bắt buộc khi gửi duyệt/
    )
  })

  it('allows only HR Admin to submit and only CEO to return or publish', () => {
    const fixture = createSampleMap()

    // CEO cannot submit draft
    assert.throws(
      () => submitCareerMapForApproval(fixture.map, { id: 'ceo_01', role: 'ceo' }, fixture.profiles, validationContext(fixture)),
      /Chỉ HR Admin mới có quyền gửi duyệt sơ đồ lộ trình/
    )

    // generic admin cannot submit
    assert.throws(
      () => submitCareerMapForApproval(fixture.map, { id: 'admin_01', role: 'admin' }, fixture.profiles, validationContext(fixture)),
      /Chỉ HR Admin mới có quyền gửi duyệt sơ đồ lộ trình/
    )

    const submitted = submitCareerMapForApproval(fixture.map, { id: 'hr_01', role: 'hr_admin' }, fixture.profiles, validationContext(fixture))

    // HR cannot return or publish
    assert.throws(
      () => returnCareerMapDraft(submitted, { id: 'hr_01', role: 'hr_admin' }, 'Lý do'),
      /Chỉ CEO mới có quyền trả lại sơ đồ/
    )

    assert.throws(
      () => publishCareerMap(submitted, { id: 'hr_01', role: 'hr_admin' }, '2026-09-01', fixture.profiles, validationContext(fixture)),
      /Chỉ CEO mới có quyền ban hành sơ đồ/
    )

    // generic admin cannot publish
    assert.throws(
      () => publishCareerMap(submitted, { id: 'admin_01', role: 'admin' }, '2026-09-01', fixture.profiles, validationContext(fixture)),
      /Chỉ CEO mới có quyền ban hành sơ đồ/
    )
  })

  it('rejects a past effective date', () => {
    const fixture = createSampleMap()
    const submitted = submitCareerMapForApproval(fixture.map, { id: 'hr_01', role: 'hr_admin' }, fixture.profiles, validationContext(fixture))

    // Past date (e.g. 2020-01-01)
    assert.throws(
      () => publishCareerMap(submitted, { id: 'ceo_01', role: 'ceo' }, '2020-01-01', fixture.profiles, validationContext(fixture)),
      /Ngày hiệu lực không được nằm trong quá khứ/
    )
  })

  it('shows no dossier instead of another employee when employee mapping is missing', () => {
    const dossiers = [
      { id: 'd1', employee_id: 'emp_01', store_id: 'store_01', employeeName: 'Nguyễn Văn A' },
      { id: 'd2', employee_id: 'emp_02', store_id: 'store_02', employeeName: 'Trần Thị B' },
    ]

    const scoped = scopePromotionDossiers(dossiers, { id: 'emp_unmapped', role: 'employee' })
    assert.equal(scoped.length, 0, 'Must return empty array rather than falling back to another employee')
  })

  it('shows no dossiers outside the store managers permitted stores', () => {
    const dossiers = [
      { id: 'd1', employee_id: 'emp_01', store_id: 'store_01', employeeName: 'Nguyễn Văn A' },
      { id: 'd2', employee_id: 'emp_02', store_id: 'store_02', employeeName: 'Trần Thị B' },
    ]

    // Store manager of store_03 (which has no dossiers)
    const scoped = scopePromotionDossiers(dossiers, { id: 'mgr_03', role: 'store_manager', store_id: 'store_03' })
    assert.equal(scoped.length, 0, 'Must return empty array rather than all dossiers')

    // Store manager without store_id
    const scopedNoStore = scopePromotionDossiers(dossiers, { id: 'mgr_none', role: 'store_manager' })
    assert.equal(scopedNoStore.length, 0, 'Must return empty array when store scope is missing')

    // Store manager of store_01
    const scopedStore1 = scopePromotionDossiers(dossiers, { id: 'mgr_01', role: 'store_manager', store_id: 'store_01' })
    assert.equal(scopedStore1.length, 1)
    assert.equal(scopedStore1[0].id, 'd1')
  })

  it('builds promotion dossiers from real placements and active career map', () => {
    const fixture = createSampleMap()
    const nodeB1 = fixture.map.nodes.find((n) => n.position_id === 'pos_b1')!
    const placements = [
      {
        id: 'pl_01',
        career_map_version_id: fixture.map.id,
        employee_id: 'emp_01',
        store_id: 'store_01',
        position_id: 'pos_b1',
        node_id: nodeB1.id,
        status: 'placed' as const,
        unresolved_reason: null,
        created_at: '2026-08-24T00:00:00.000Z',
      },
    ]

    const result = buildPromotionDossiers({
      placements,
      employees: fixture.employees,
      careerMap: fixture.map,
    })

    assert.equal(result.length, 1)
    assert.equal(result[0].employee_id, 'emp_01')
    assert.equal(result[0].employeeName, 'Nguyễn Văn A')
    assert.equal(result[0].targetLevel, 'L2')
    assert.equal(result[0].eligibilityStatus, 'not_eligible')
    assert.equal(result[0].stageLabel, 'Chưa đủ dữ liệu đánh giá')
    assert.equal(result[0].eligibilityInput, null, 'Must not create an eligibility input from missing operational data')
    assert.equal(result[0].currentHourlyRate, null, 'Must not fabricate an hourly rate')
  })

  it('returns an empty array when placements are empty and never falls back to fabricated dossiers', () => {
    const fixture = createSampleMap()
    const result = buildPromotionDossiers({
      placements: [],
      employees: fixture.employees,
      careerMap: fixture.map,
    })
    assert.deepEqual(result, [])
  })

  it('keeps a dossier not eligible when required evaluation data is missing', () => {
    const fixture = createSampleMap()
    const nodeB1 = fixture.map.nodes.find((n) => n.position_id === 'pos_b1')!
    const placements = [
      {
        id: 'pl_01',
        career_map_version_id: fixture.map.id,
        employee_id: 'emp_01',
        store_id: 'store_01',
        position_id: 'pos_b1',
        node_id: nodeB1.id,
        status: 'placed' as const,
        unresolved_reason: null,
        created_at: '2026-08-24T00:00:00.000Z',
      },
    ]

    const dossiers = buildPromotionDossiers({
      placements,
      employees: fixture.employees,
      careerMap: fixture.map,
      evaluations: [],
    })

    assert.equal(dossiers.length, 1)
    assert.equal(dossiers[0].eligibilityStatus, 'not_eligible')
    assert.equal(dossiers[0].stageLabel, 'Chưa đủ dữ liệu đánh giá')
    assert.equal(dossiers[0].overallStatus, 'in_testing')
    assert.equal(dossiers[0].eligibilityInput, null)
    assert.deepEqual(dossiers[0].eligibilityChecks.map((item) => item.code), ['missing_operational_data'])
  })
})
