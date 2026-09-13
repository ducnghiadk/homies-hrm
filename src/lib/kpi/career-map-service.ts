import { createDefaultProfileForGrade, createDefaultProfileForPosition } from './career-map-criteria-service.ts'
import { HOMIES_CAREER_GRADES } from './career-grade-catalog.ts'
import type { CareerGradeCode } from './career-grade-types.ts'
import { buildHomiesCareerMapSeed } from './seed.ts'
import {
  DEFAULT_CAREER_TRANSITION_PRESETS,
  type CareerMapAggregateChange,
  type KpiCareerMapEdge,
  type KpiCareerMapNode,
  type KpiCareerMapValidationIssue,
  type KpiCareerMapValidationResult,
  type KpiCareerMapVersion,
  type KpiCareerPositionSnapshot,
  type KpiCareerTransitionPreset,
  type KpiCareerTransitionPresetKey,
  type KpiPositionCriteriaProfile,
} from './career-map-types.ts'

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export function inferJobFamily(positionName: string, id?: string, customFamily?: string): string {
  if (customFamily && customFamily.trim()) {
    return customFamily.trim()
  }

  const clean = removeVietnameseTones(positionName || id || '')
  if (clean.includes('pha che') || clean.includes('barista')) return 'barista'
  if (clean.includes('thu ngan') || clean.includes('cashier')) return 'cashier'
  if (clean.includes('phuc vu') || clean.includes('service') || clean.includes('chay ban')) return 'service'
  if (clean.includes('bep') || clean.includes('kitchen')) return 'kitchen'
  if (
    clean.includes('truong ca') ||
    clean.includes('shift leader') ||
    clean.includes('shift_leader') ||
    clean.includes('quan ly') ||
    clean.includes('giam sat') ||
    clean.includes('manager')
  ) {
    return 'management'
  }
  return 'other'
}

export function inferPositionLevel(
  positionName: string,
  id?: string,
  explicitLevel?: number
): number {
  if (typeof explicitLevel === 'number') {
    return explicitLevel
  }
  const clean = removeVietnameseTones(positionName || id || '')
  if (clean.includes('c1') || clean.includes('hoc viec') || clean.includes('intern') || clean.includes('thu viec') || clean.includes('part-time 1') || clean.includes('pt1')) return 1
  if (clean.includes('c2') || clean.includes('chuan') || clean.includes('part-time 2') || clean.includes('pt2')) return 2
  if (clean.includes('c3') || clean.includes('senior') || clean.includes('chinh') || clean.includes('cung') || clean.includes('chuyen vien')) return 3
  if (clean.includes('truong ca') || clean.includes('shift leader') || clean.includes('giam sat') || clean.includes('supervisor')) return 4
  if (clean.includes('quan ly') || clean.includes('store manager') || clean.includes('cua hang truong') || clean.includes('manager')) return 5
  if (clean.includes('khu vuc') || clean.includes('area manager')) return 6
  return 0
}

export function resolveCareerGradeCode(input: {
  explicit_grade_code?: CareerGradeCode | null
}): CareerGradeCode | null {
  return input.explicit_grade_code ?? null
}

export function findCriteriaProfileForNode(
  node: KpiCareerMapNode,
  profiles: KpiPositionCriteriaProfile[]
): KpiPositionCriteriaProfile | null {
  if (node.criteria_profile_id) {
    const byId = profiles.find((profile) => profile.id === node.criteria_profile_id)
    if (byId) return byId
  }
  if (node.grade_code) {
    const byGrade = profiles.find((profile) => profile.grade_codes?.includes(node.grade_code!))
    if (byGrade) return byGrade
  }
  return profiles.find((profile) => profile.position_ids.includes(node.position_id)) ?? null
}

export interface ApplyHomiesCareerTemplateInput {
  positions: KpiCareerPositionSnapshot[]
  actor_id: string
  now?: string
}

export function applyHomiesCareerTemplate(
  input: ApplyHomiesCareerTemplateInput
): CareerMapAggregateChange {
  const employeePosition = input.positions.find(
    (item) => item.name === 'Nhân viên cửa hàng' || item.id === 'pos_store_employee' || item.id === 'pos-store-employee'
  )
  const leaderPosition = input.positions.find(
    (item) => item.name === 'Trưởng ca' || item.id === 'pos_shift_leader' || item.id === 'pos-shift-leader'
  )
  const managerPosition = input.positions.find(
    (item) => item.name === 'Quản lý cửa hàng' || item.id === 'pos_store_manager' || item.id === 'pos-store-manager'
  )

  if (!employeePosition || !leaderPosition || !managerPosition) {
    throw new Error('Danh mục chức danh chưa đủ Nhân viên cửa hàng, Trưởng ca và Quản lý cửa hàng.')
  }

  return buildHomiesCareerMapSeed({
    positions: [employeePosition, leaderPosition, managerPosition],
    actor_id: input.actor_id,
    now: input.now,
  })
}

export interface SelectEditableCareerMapInput {
  maps: KpiCareerMapVersion[]
  livePositions: KpiCareerPositionSnapshot[]
  actorId: string
  demoFallback?: boolean
}

export function selectEditableCareerMap({
  maps,
  livePositions,
  actorId,
  demoFallback = false,
}: SelectEditableCareerMapInput): KpiCareerMapVersion {
  if (livePositions.length > 0) {
    const livePosIds = new Set(livePositions.map((p) => p.id))
    // 1. Check for draft or returned map matching live position IDs
    const matchingDraft = maps.find(
      (m) =>
        (m.status === 'draft' || m.status === 'returned') &&
        m.master_position_snapshot.some((p) => livePosIds.has(p.id))
    )
    if (matchingDraft) {
      return matchingDraft
    }
    // 2. Check for published map matching live position IDs
    const matchingPublished = maps.find(
      (m) =>
        m.status === 'published' &&
        m.master_position_snapshot.some((p) => livePosIds.has(p.id))
    )
    if (matchingPublished) {
      return matchingPublished
    }
    // 3. Otherwise create fresh draft using live master positions
    return createCareerMapDraft(livePositions, actorId)
  }

  if (maps.length > 0 && demoFallback) {
    return maps.find((m) => m.status === 'draft' || m.status === 'returned') || maps[0]
  }

  return createCareerMapDraft([], actorId)
}

export function createCareerMapDraft(
  positions: KpiCareerPositionSnapshot[],
  createdBy: string,
  createdAt?: string
): KpiCareerMapVersion {
  const timestamp = createdAt || new Date().toISOString()
  return {
    id: `career_map_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    version: 1,
    status: 'draft',
    scope: 'chain',
    effective_from: null,
    created_by: createdBy,
    approved_by: null,
    returned_reason: null,
    created_at: timestamp,
    updated_at: timestamp,
    based_on_version_id: null,
    master_position_snapshot: positions.map((p) => ({
      ...p,
      level: p.level ?? inferPositionLevel(p.name, p.id),
      job_family: p.job_family || inferJobFamily(p.name, p.id),
    })),
    nodes: [],
    edges: [],
  }
}

export interface AddCareerPositionResult {
  map: KpiCareerMapVersion
  profiles: KpiPositionCriteriaProfile[]
}

export function addCareerPosition(
  map: KpiCareerMapVersion,
  profiles: KpiPositionCriteriaProfile[],
  positionInput: string | KpiCareerPositionSnapshot,
  coords?: { x: number; y: number },
  gradeCode?: CareerGradeCode
): AddCareerPositionResult {
  const positionId = typeof positionInput === 'string' ? positionInput : positionInput.id
  const snapshotPos = map.master_position_snapshot.find((p) => p.id === positionId)
  const inputPos = typeof positionInput === 'object' ? positionInput : undefined

  const name = inputPos?.name || snapshotPos?.name || positionId
  const level = inferPositionLevel(name, positionId, inputPos?.level ?? snapshotPos?.level) || 1
  const jobFamily = inputPos?.job_family || snapshotPos?.job_family || inferJobFamily(name, positionId)

  const posSnapshot: KpiCareerPositionSnapshot = {
    id: positionId,
    name,
    level,
    job_family: jobFamily,
    department_id: inputPos?.department_id ?? snapshotPos?.department_id,
    base_salary: inputPos?.base_salary ?? snapshotPos?.base_salary,
    pay_type: inputPos?.pay_type ?? snapshotPos?.pay_type,
    active: inputPos?.active ?? snapshotPos?.active ?? true,
  }

  // Find or create profile
  const updatedProfiles = [...profiles]
  let profile = gradeCode
    ? updatedProfiles.find((item) => item.grade_codes?.includes(gradeCode))
    : updatedProfiles.find(
        (item) => item.position_ids.includes(positionId) || (inputPos && item.position_ids.includes(inputPos.id))
      )

  if (!profile) {
    profile = gradeCode
      ? createDefaultProfileForGrade(gradeCode, positionId, `profile_${gradeCode}`)
      : createDefaultProfileForPosition(posSnapshot)
    updatedProfiles.push(profile)
  }

  const updatedMap = addCareerMapNode(map, posSnapshot, coords, profile.id, posSnapshot, gradeCode)

  return {
    map: updatedMap,
    profiles: updatedProfiles,
  }
}

export function addCareerMapNode(
  map: KpiCareerMapVersion,
  positionInput: string | KpiCareerPositionSnapshot,
  coords?: { x: number; y: number },
  profileId?: string,
  posSnapshot?: KpiCareerPositionSnapshot,
  gradeCode?: CareerGradeCode
): KpiCareerMapVersion {
  const positionId = typeof positionInput === 'string' ? positionInput : positionInput.id
  const existingNode = map.nodes.find(
    (n) => n.position_id === positionId && (n.grade_code || null) === (gradeCode || null)
  )
  if (existingNode) {
    return map
  }

  const snapshotPos = posSnapshot || map.master_position_snapshot.find((p) => p.id === positionId)
  const inputPos = typeof positionInput === 'object' ? positionInput : undefined
  const name = inputPos?.name || snapshotPos?.name || positionId
  const level = inferPositionLevel(name, positionId, inputPos?.level ?? snapshotPos?.level)
  const jobFamily = inputPos?.job_family || snapshotPos?.job_family || inferJobFamily(name, positionId)

  const newNode: KpiCareerMapNode = {
    id: `node_${positionId}${gradeCode ? `_${gradeCode}` : ''}`,
    position_id: positionId,
    grade_code: gradeCode || null,
    position_name_snapshot: name,
    grade_name_snapshot: gradeCode
      ? HOMIES_CAREER_GRADES.find((grade) => grade.code === gradeCode)?.label
      : undefined,
    position_level_snapshot: level,
    job_family: jobFamily,
    x: coords?.x ?? 0,
    y: coords?.y ?? 0,
    criteria_profile_id: profileId || `profile_${positionId}`,
    active: true,
  }

  const updatedMasterSnapshot = snapshotPos && map.master_position_snapshot.some((p) => p.id === positionId)
    ? map.master_position_snapshot.map((p) =>
        p.id === positionId
          ? { ...p, name, level, job_family: jobFamily }
          : p
      )
    : [
        ...map.master_position_snapshot,
        {
          id: positionId,
          name,
          level,
          job_family: jobFamily,
          department_id: inputPos?.department_id,
          active: inputPos?.active ?? true,
        },
      ]

  return {
    ...map,
    master_position_snapshot: updatedMasterSnapshot,
    nodes: [...map.nodes, newNode],
    updated_at: new Date().toISOString(),
  }
}

export function moveCareerMapNode(
  map: KpiCareerMapVersion,
  nodeId: string,
  x: number,
  y: number
): KpiCareerMapVersion {
  return {
    ...map,
    nodes: map.nodes.map((node) => (node.id === nodeId ? { ...node, x, y } : node)),
    updated_at: new Date().toISOString(),
  }
}

export function removeCareerMapNode(map: KpiCareerMapVersion, nodeId: string): KpiCareerMapVersion {
  return {
    ...map,
    nodes: map.nodes.filter((node) => node.id !== nodeId),
    edges: map.edges.filter(
      (edge) => edge.source_node_id !== nodeId && edge.target_node_id !== nodeId
    ),
    updated_at: new Date().toISOString(),
  }
}

export function classifyCareerTransition(
  sourceNode: KpiCareerMapNode,
  targetNode: KpiCareerMapNode
): KpiCareerTransitionPresetKey {
  const targetName = removeVietnameseTones(targetNode.position_name_snapshot)

  if (
    targetName.includes('quan ly cua hang') ||
    targetName.includes('store manager') ||
    (targetName.includes('quan ly') && targetNode.position_level_snapshot >= 4)
  ) {
    return 'to_store_manager'
  }

  if (
    targetName.includes('truong ca') ||
    targetName.includes('shift leader') ||
    targetName.includes('shift_leader')
  ) {
    return 'to_shift_leader'
  }

  if (
    targetName.includes('chinh') ||
    targetName.includes('senior') ||
    (targetNode.job_family === sourceNode.job_family && targetNode.position_level_snapshot >= 3)
  ) {
    return 'to_senior_employee'
  }

  return 'same_profession_level_up'
}

export function addCareerMapEdge(
  map: KpiCareerMapVersion,
  sourceNodeId: string,
  targetNodeId: string,
  presetKeyOverride?: KpiCareerTransitionPresetKey
): KpiCareerMapVersion {
  const existingEdge = map.edges.find(
    (e) => e.source_node_id === sourceNodeId && e.target_node_id === targetNodeId
  )
  if (existingEdge) {
    return map
  }

  const sourceNode = map.nodes.find((n) => n.id === sourceNodeId)
  const targetNode = map.nodes.find((n) => n.id === targetNodeId)

  let presetKey: KpiCareerTransitionPresetKey = presetKeyOverride || 'same_profession_level_up'
  if (!presetKeyOverride && sourceNode && targetNode) {
    presetKey = classifyCareerTransition(sourceNode, targetNode)
  }

  const newEdge: KpiCareerMapEdge = {
    id: `edge_${sourceNodeId}_${targetNodeId}`,
    source_node_id: sourceNodeId,
    target_node_id: targetNodeId,
    preset_key: presetKey,
    preset_version: 1,
    active: true,
  }

  return {
    ...map,
    edges: [...map.edges, newEdge],
    updated_at: new Date().toISOString(),
  }
}

export function removeCareerMapEdge(map: KpiCareerMapVersion, edgeId: string): KpiCareerMapVersion {
  return {
    ...map,
    edges: map.edges.filter((e) => e.id !== edgeId),
    updated_at: new Date().toISOString(),
  }
}

export function findUnplacedPositions(
  map: KpiCareerMapVersion,
  masterPositions?: KpiCareerPositionSnapshot[]
): KpiCareerPositionSnapshot[] {
  const source = masterPositions || map.master_position_snapshot || []
  const placedPositionIds = new Set(map.nodes.filter((n) => n.active).map((n) => n.position_id))
  return source.filter((p) => !placedPositionIds.has(p.id))
}

function detectCycles(nodeIds: string[], edges: { source: string; target: string }[]): boolean {
  const adj = new Map<string, string[]>()
  nodeIds.forEach((id) => adj.set(id, []))
  edges.forEach((edge) => {
    if (adj.has(edge.source)) {
      adj.get(edge.source)!.push(edge.target)
    }
  })

  const visited = new Map<string, number>() // 0: unvisited, 1: visiting, 2: visited

  function dfs(nodeId: string): boolean {
    visited.set(nodeId, 1)
    const neighbors = adj.get(nodeId) || []
    for (const neighbor of neighbors) {
      const state = visited.get(neighbor) || 0
      if (state === 1) {
        return true // Cycle detected
      }
      if (state === 0) {
        if (dfs(neighbor)) return true
      }
    }
    visited.set(nodeId, 2)
    return false
  }

  for (const nodeId of nodeIds) {
    if ((visited.get(nodeId) || 0) === 0) {
      if (dfs(nodeId)) return true
    }
  }

  return false
}

export interface UpdateSharedPresetResult {
  presets: Record<string, KpiCareerTransitionPreset>
  map: KpiCareerMapVersion
  affectedEdgeCount: number
}

export function updateSharedTransitionPreset(
  presets: Record<string, KpiCareerTransitionPreset>,
  map: KpiCareerMapVersion,
  presetKey: KpiCareerTransitionPresetKey,
  updatedFields: Partial<KpiCareerTransitionPreset>
): UpdateSharedPresetResult {
  const currentPreset = presets[presetKey] || DEFAULT_CAREER_TRANSITION_PRESETS[presetKey]
  const newVersion = (currentPreset?.version || 1) + 1
  const newPreset: KpiCareerTransitionPreset = {
    ...currentPreset,
    ...updatedFields,
    preset_key: presetKey,
    version: newVersion,
  }

  const nextPresets = {
    ...presets,
    [presetKey]: newPreset,
  }

  let affectedEdgeCount = 0
  const nextEdges = map.edges.map((edge) => {
    if (edge.preset_key === presetKey) {
      affectedEdgeCount++
      return {
        ...edge,
        preset_version: newVersion,
      }
    }
    return edge
  })

  const nextMap: KpiCareerMapVersion = {
    ...map,
    edges: nextEdges,
    transition_presets: nextPresets,
    updated_at: new Date().toISOString(),
  }

  return {
    presets: nextPresets,
    map: nextMap,
    affectedEdgeCount,
  }
}

export const updateSharedPreset = updateSharedTransitionPreset


export interface ValidateCareerMapInput {
  map: KpiCareerMapVersion
  profiles?: KpiPositionCriteriaProfile[]
  presets?: Record<string, KpiCareerTransitionPreset>
  masterPositions?: KpiCareerPositionSnapshot[]
  effectiveDate?: string | null
  strict?: boolean
}

export function validateCareerMap(
  mapOrInput: KpiCareerMapVersion | ValidateCareerMapInput,
  profilesArg?: KpiPositionCriteriaProfile[],
  presetsArg?: Record<string, KpiCareerTransitionPreset>,
  masterPositionsArg?: KpiCareerPositionSnapshot[],
  effectiveDateArg?: string | null
): KpiCareerMapValidationResult {
  let map: KpiCareerMapVersion
  let profiles: KpiPositionCriteriaProfile[] | undefined
  let presets: Record<string, KpiCareerTransitionPreset> | undefined
  let masterPositions: KpiCareerPositionSnapshot[] | undefined
  let effectiveDate: string | null | undefined
  let strict: boolean | undefined

  if ('nodes' in mapOrInput) {
    map = mapOrInput
    profiles = profilesArg
    presets = presetsArg
    masterPositions = masterPositionsArg
    effectiveDate = effectiveDateArg
  } else {
    map = mapOrInput.map
    profiles = mapOrInput.profiles
    presets = mapOrInput.presets
    masterPositions = mapOrInput.masterPositions
    effectiveDate = mapOrInput.effectiveDate
    strict = mapOrInput.strict
  }

  const issues: KpiCareerMapValidationIssue[] = []
  const activeNodes = map.nodes.filter((n) => n.active)
  const activeEdges = map.edges.filter((e) => e.active)
  const nodeMap = new Map<string, KpiCareerMapNode>(activeNodes.map((n) => [n.id, n]))

  // 0. Kiểm tra sơ đồ rỗng
  if (activeNodes.length === 0) {
    issues.push({
      code: 'empty_map',
      severity: 'blocking',
      message: 'Sơ đồ chưa có vị trí công việc nào.',
    })
  }

  // 1. Kiểm tra node thiếu cấp bậc và kiểm tra master position
  for (const node of activeNodes) {
    if (
      typeof node.position_level_snapshot !== 'number' ||
      node.position_level_snapshot <= 0 ||
      Number.isNaN(node.position_level_snapshot)
    ) {
      issues.push({
        code: 'missing_level',
        severity: 'blocking',
        message: `Vị trí "${node.position_name_snapshot}" chưa có cấp bậc hợp lệ.`,
        node_id: node.id,
        position_id: node.position_id,
      })
    }

    if (masterPositions && masterPositions.length > 0) {
      const masterPos = masterPositions.find((p) => p.id === node.position_id)
      if (!masterPos || masterPos.active === false) {
        issues.push({
          code: 'master_position_inactive_or_missing',
          severity: 'blocking',
          message: `Vị trí "${node.position_name_snapshot}" không tồn tại hoặc đã bị vô hiệu hóa trong danh mục Master Data.`,
          node_id: node.id,
          position_id: node.position_id,
        })
      }
    }
  }

  // 2. Kiểm tra Criteria Profile khi profiles được truyền vào hoặc strict mode
  if (strict && profiles === undefined) {
    issues.push({
      code: 'missing_profile_context',
      severity: 'blocking',
      message: 'Bộ tiêu chí đánh giá (profiles) là bắt buộc để kiểm tra toàn vẹn trước khi gửi duyệt / ban hành.',
    })
  } else if (profiles !== undefined) {
    for (const node of activeNodes) {
      const profile = findCriteriaProfileForNode(node, profiles)
      const activeCriteria = (profile?.criteria || []).filter((c) => c.active)

      if (!profile || activeCriteria.length === 0) {
        issues.push({
          code: 'missing_criteria',
          severity: 'blocking',
          message: `Vị trí "${node.grade_name_snapshot || node.position_name_snapshot}" chưa có bộ tiêu chí đánh giá KPI.`,
          node_id: node.id,
          position_id: node.position_id,
        })
      } else {
        const totalWeight = activeCriteria.reduce((sum, c) => sum + (c.weight || 0), 0)
        if (Math.abs(totalWeight - 100) > 0.01) {
          issues.push({
            code: 'invalid_weight',
            severity: 'blocking',
            message: `Tổng trọng số tiêu chí cho vị trí "${node.grade_name_snapshot || node.position_name_snapshot}" là ${totalWeight}% (bắt buộc đủ 100%).`,
            node_id: node.id,
            position_id: node.position_id,
            context: { totalWeight },
          })
        }
      }
    }
  }

  if (strict && presets === undefined && (!map.transition_presets || Object.keys(map.transition_presets).length === 0)) {
    issues.push({
      code: 'missing_preset_context',
      severity: 'blocking',
      message: 'Danh sách quy tắc thăng tiến (presets) là bắt buộc trước khi gửi duyệt / ban hành.',
    })
  }

  if (strict && masterPositions === undefined) {
    issues.push({
      code: 'missing_master_position_context',
      severity: 'blocking',
      message: 'Danh mục chức danh hiện hành là bắt buộc trước khi gửi duyệt / ban hành.',
    })
  }

  // 3. Kiểm tra ngày hiệu lực trong quá khứ
  if (effectiveDate) {
    const todayStr = new Date().toISOString().slice(0, 10)
    if (effectiveDate < todayStr) {
      issues.push({
        code: 'past_effective_date',
        severity: 'blocking',
        message: `Ngày hiệu lực (${effectiveDate}) không được nằm trong quá khứ.`,
      })
    }
  }

  // 4. Kiểm tra đường nối
  for (const edge of activeEdges) {
    if (edge.source_node_id === edge.target_node_id) {
      issues.push({
        code: 'self_loop',
        severity: 'blocking',
        message: 'Đường nối không thể trỏ vào chính vị trí đó.',
        edge_id: edge.id,
      })
      continue
    }

    const sourceNode = nodeMap.get(edge.source_node_id)
    const targetNode = nodeMap.get(edge.target_node_id)

    if (!sourceNode || !targetNode) {
      continue
    }

    const sourceGrade = sourceNode.grade_code
      ? HOMIES_CAREER_GRADES.find((g) => g.code === sourceNode.grade_code)
      : undefined
    const targetGrade = targetNode.grade_code
      ? HOMIES_CAREER_GRADES.find((g) => g.code === targetNode.grade_code)
      : undefined

    if (sourceGrade && targetGrade) {
      if (targetGrade.rank === sourceGrade.rank) {
        issues.push({
          code: 'same_level',
          severity: 'blocking',
          message: `Không thể nối hai vị trí cùng cấp bậc (${sourceNode.grade_name_snapshot || sourceNode.position_name_snapshot} → ${targetNode.grade_name_snapshot || targetNode.position_name_snapshot}).`,
          edge_id: edge.id,
        })
      } else if (targetGrade.rank < sourceGrade.rank) {
        issues.push({
          code: 'downward',
          severity: 'blocking',
          message: `Không thể nối ngược từ cấp cao xuống cấp thấp (${sourceNode.grade_name_snapshot || sourceNode.position_name_snapshot} → ${targetNode.grade_name_snapshot || targetNode.position_name_snapshot}).`,
          edge_id: edge.id,
        })
      } else if (targetGrade.rank > sourceGrade.rank + 1) {
        issues.push({
          code: 'skipped_level',
          severity: 'blocking',
          message: `Không thể nối nhảy cóc cấp bậc (${sourceNode.grade_name_snapshot || sourceNode.position_name_snapshot} → ${targetNode.grade_name_snapshot || targetNode.position_name_snapshot}).`,
          edge_id: edge.id,
        })
      }
    } else {
      const sourceLevel = sourceNode.position_level_snapshot
      const targetLevel = targetNode.position_level_snapshot

      if (sourceLevel > 0 && targetLevel > 0) {
        if (sourceLevel === targetLevel) {
          issues.push({
            code: 'same_level',
            severity: 'blocking',
            message: `Không thể nối hai vị trí cùng cấp bậc (${sourceNode.position_name_snapshot} → ${targetNode.position_name_snapshot}).`,
            edge_id: edge.id,
          })
        } else if (sourceLevel > targetLevel) {
          issues.push({
            code: 'downward',
            severity: 'blocking',
            message: `Không thể nối ngược từ cấp cao xuống cấp thấp (${sourceNode.position_name_snapshot} → ${targetNode.position_name_snapshot}).`,
            edge_id: edge.id,
          })
        } else if (targetLevel > sourceLevel + 1) {
          issues.push({
            code: 'skipped_level',
            severity: 'blocking',
            message: `Không thể nối nhảy cóc cấp bậc (${sourceNode.position_name_snapshot} [Cấp ${sourceLevel}] → ${targetNode.position_name_snapshot} [Cấp ${targetLevel}]).`,
            edge_id: edge.id,
          })
        }
      }
    }

    // Kiểm tra quy tắc thăng tiến
    const preset =
      presets?.[edge.preset_key] ||
      map.transition_presets?.[edge.preset_key] ||
      DEFAULT_CAREER_TRANSITION_PRESETS[edge.preset_key]
    if (!preset || (!preset.min_kpi_score && !preset.min_score) || (!preset.required_good_months && !preset.required_months)) {
      issues.push({
        code: 'missing_rule',
        severity: 'blocking',
        message: `Đường nối (${sourceNode.position_name_snapshot} → ${targetNode.position_name_snapshot}) chưa có quy tắc xét thăng tiến.`,
        edge_id: edge.id,
      })
    }
  }

  // 5. Kiểm tra vòng lặp bằng DFS
  const hasCycle = detectCycles(
    activeNodes.map((n) => n.id),
    activeEdges.map((e) => ({ source: e.source_node_id, target: e.target_node_id }))
  )
  if (hasCycle) {
    issues.push({
      code: 'cycle',
      severity: 'blocking',
      message: 'Sơ đồ lộ trình có vòng lặp khép kín.',
    })
  }

  // 6. Kiểm tra nhánh nghiệp vụ phải hội tụ lên cấp quản lý (no_management_convergence)
  const managementNodeIds = new Set(
    activeNodes
      .filter(
        (n) =>
          n.job_family === 'management' ||
          (n.grade_code && ['c4', 'c5'].includes(n.grade_code)) ||
          n.position_level_snapshot >= 3 ||
          n.position_name_snapshot.toLowerCase().includes('trưởng ca') ||
          n.position_name_snapshot.toLowerCase().includes('quản lý')
      )
      .map((n) => n.id)
  )

  if (managementNodeIds.size > 0) {
    const forwardAdj = new Map<string, string[]>()
    activeNodes.forEach((n) => forwardAdj.set(n.id, []))
    activeEdges.forEach((e) => {
      forwardAdj.get(e.source_node_id)?.push(e.target_node_id)
    })

    function canReachManagement(startNodeId: string): boolean {
      if (managementNodeIds.has(startNodeId)) return true
      const visited = new Set<string>()
      const queue = [startNodeId]
      visited.add(startNodeId)

      while (queue.length > 0) {
        const curr = queue.shift()!
        if (managementNodeIds.has(curr)) return true
        const nexts = forwardAdj.get(curr) || []
        for (const next of nexts) {
          if (!visited.has(next)) {
            visited.add(next)
            queue.push(next)
          }
        }
      }
      return false
    }

    for (const node of activeNodes) {
      if (!managementNodeIds.has(node.id)) {
        if (!canReachManagement(node.id)) {
          issues.push({
            code: 'no_management_convergence',
            severity: 'blocking',
            message: `Nhánh nghiệp vụ của vị trí "${node.position_name_snapshot}" không hội tụ lên cấp Quản lý / Trưởng ca.`,
            node_id: node.id,
            position_id: node.position_id,
          })
        }
      }
    }
  }

  // 7. Cảnh báo (Warnings)
  const unplaced = findUnplacedPositions(map, masterPositions)
  if (unplaced.length > 0) {
    issues.push({
      code: 'unplaced_positions',
      severity: 'warning',
      message: `Có ${unplaced.length} vị trí trong danh mục chưa được xếp vào sơ đồ lộ trình.`,
      context: { unplacedCount: unplaced.length },
    })
  }

  const maxLevel = Math.max(
    ...map.master_position_snapshot.map((p) => p.level || 0),
    ...activeNodes.map((n) => n.position_level_snapshot || 0),
    0
  )
  const outgoingCounts = new Map<string, number>()
  activeEdges.forEach((e) => {
    outgoingCounts.set(e.source_node_id, (outgoingCounts.get(e.source_node_id) || 0) + 1)
  })

  for (const node of activeNodes) {
    if (
      node.position_level_snapshot > 0 &&
      node.position_level_snapshot < maxLevel &&
      (outgoingCounts.get(node.id) || 0) === 0
    ) {
      issues.push({
        code: 'no_progression',
        severity: 'warning',
        message: `Vị trí "${node.position_name_snapshot}" chưa có hướng phát triển tiếp theo.`,
        node_id: node.id,
        position_id: node.position_id,
      })
    }
  }

  const has_blocking = issues.some((i) => i.severity === 'blocking')

  return {
    valid: !has_blocking,
    has_blocking,
    issues,
  }
}

export function canEditCareerMapStructure(role?: string, status?: string, isMobile?: boolean): boolean {
  if (isMobile) return false
  if (status !== 'draft' && status !== 'returned') return false
  if (role !== 'hr_admin') return false
  return true
}
