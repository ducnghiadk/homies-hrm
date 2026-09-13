import type {
  KpiCareerMapDeploymentPreview,
  KpiCareerPositionSnapshot,
  KpiCareerTransitionPreset,
  KpiCareerMapVersion,
  KpiEmployeePlacement,
  KpiPositionCriteriaProfile,
} from './career-map-types.ts'
import type {
  KpiActor,
  KpiCriterionDefinition,
  KpiGroupDefinition,
  KpiSetVersion,
} from './types.ts'
import { validateCareerMap } from './career-map-service.ts'
import {
  evaluatePromotionEligibility,
  type PromotionEligibilityInput,
} from './development-service.ts'

export interface CareerMapValidationContext {
  presets: Record<string, KpiCareerTransitionPreset>
  masterPositions: KpiCareerPositionSnapshot[]
}

export function placeEmployeesOnCareerMap(
  map: KpiCareerMapVersion,
  employees: Array<{
    id: string
    name: string
    position_id: string
    store_id: string
    secondary_position_ids?: string[]
    active?: boolean
  }>
): { placed: KpiEmployeePlacement[]; unresolved: KpiEmployeePlacement[] } {
  const activeNodes = map.nodes.filter((n) => n.active)
  const positionToNodeMap = new Map<string, string>()
  const positionLevelMap = new Map<string, number>()

  for (const node of activeNodes) {
    positionToNodeMap.set(node.position_id, node.id)
    positionLevelMap.set(node.position_id, node.position_level_snapshot)
  }

  const placed: KpiEmployeePlacement[] = []
  const unresolved: KpiEmployeePlacement[] = []

  for (const emp of employees) {
    if (emp.active === false) {
      unresolved.push({
        employee_id: emp.id,
        employee_name: emp.name,
        store_id: emp.store_id,
        position_id: emp.position_id,
        node_id: null,
        status: 'unresolved',
        unresolved_reason: 'inactive_position',
      })
      continue
    }

    const nodeId = positionToNodeMap.get(emp.position_id)
    if (!nodeId) {
      unresolved.push({
        employee_id: emp.id,
        employee_name: emp.name,
        store_id: emp.store_id,
        position_id: emp.position_id,
        node_id: null,
        status: 'unresolved',
        unresolved_reason: 'position_not_in_map',
      })
      continue
    }

    const level = positionLevelMap.get(emp.position_id)
    if (!level || level <= 0) {
      unresolved.push({
        employee_id: emp.id,
        employee_name: emp.name,
        store_id: emp.store_id,
        position_id: emp.position_id,
        node_id: nodeId,
        status: 'unresolved',
        unresolved_reason: 'missing_level',
      })
      continue
    }

    placed.push({
      employee_id: emp.id,
      employee_name: emp.name,
      store_id: emp.store_id,
      position_id: emp.position_id,
      node_id: nodeId,
      status: 'placed',
    })
  }

  return { placed, unresolved }
}

export function createCareerMapDeploymentPreview(params: {
  map: KpiCareerMapVersion
  profiles: KpiPositionCriteriaProfile[]
  employees: Array<{
    id: string
    name: string
    position_id: string
    store_id: string
    secondary_position_ids?: string[]
  }>
  stores: Array<{ id: string; name: string }>
  currentPublishedMap?: KpiCareerMapVersion | null
}): KpiCareerMapDeploymentPreview {
  const { map, profiles, employees, stores, currentPublishedMap } = params
  const validationResult = validateCareerMap(map)
  const { placed, unresolved } = placeEmployeesOnCareerMap(map, employees)

  const activeNodes = map.nodes.filter((n) => n.active)
  const activeEdges = map.edges.filter((e) => e.active)

  // Count distinct job families (branches)
  const branches = new Set(activeNodes.map((n) => n.job_family).filter(Boolean))
  const presetKeys = new Set(activeEdges.map((e) => e.preset_key))

  const changes: string[] = []
  if (!currentPublishedMap) {
    changes.push('Khởi tạo sơ đồ lộ trình chuẩn Homies đầu tiên cho toàn chuỗi.')
  } else {
    const prevNodePosIds = new Set(currentPublishedMap.nodes.map((n) => n.position_id))
    const newNodePosIds = new Set(activeNodes.map((n) => n.position_id))

    const added = [...newNodePosIds].filter((id) => !prevNodePosIds.has(id))
    const removed = [...prevNodePosIds].filter((id) => !newNodePosIds.has(id))

    if (added.length > 0) changes.push(`Thêm ${added.length} vị trí mới vào lộ trình.`)
    if (removed.length > 0) changes.push(`Ngưng áp dụng ${removed.length} vị trí trên lộ trình.`)
    if (activeEdges.length !== currentPublishedMap.edges.length) {
      changes.push(`Cập nhật số đường nối tăng bậc (${currentPublishedMap.edges.length} → ${activeEdges.length}).`)
    }
  }

  return {
    career_map_id: map.id,
    version: map.version,
    effective_from: map.effective_from,
    branch_count: Math.max(1, branches.size),
    position_count: activeNodes.length,
    transition_count: activeEdges.length,
    criteria_profile_count: profiles.length,
    preset_count: presetKeys.size,
    placed_employee_count: placed.length,
    unresolved_employee_count: unresolved.length,
    total_employee_count: employees.length,
    store_count: stores.length,
    changes_from_current: changes,
    requires_individual_confirmation: false,
    validation_result: validationResult,
  }
}

export function submitCareerMapForApproval(
  map: KpiCareerMapVersion,
  actor: KpiActor | { id: string; role: string },
  profiles: KpiPositionCriteriaProfile[],
  context?: CareerMapValidationContext
): KpiCareerMapVersion {
  if (actor.role !== 'hr_admin') {
    throw new Error('Chỉ HR Admin mới có quyền gửi duyệt sơ đồ lộ trình.')
  }

  if (map.status !== 'draft' && map.status !== 'returned') {
    throw new Error('Chỉ có thể gửi duyệt sơ đồ ở trạng thái Bản nháp (draft) hoặc Bị trả lại (returned).')
  }

  if (!profiles || profiles.length === 0) {
    throw new Error('Danh sách tiêu chí (profiles) là bắt buộc khi gửi duyệt.')
  }

  const validation = validateCareerMap({
    map,
    profiles,
    presets: context?.presets,
    masterPositions: context?.masterPositions,
    strict: true,
  })
  if (validation.has_blocking) {
    const blockingMsgs = validation.issues.filter((i) => i.severity === 'blocking').map((i) => i.message).join('; ')
    throw new Error(`Không thể gửi duyệt sơ đồ còn lỗi chặn: ${blockingMsgs}`)
  }

  return {
    ...map,
    status: 'pending_approval',
    returned_reason: null,
    updated_at: new Date().toISOString(),
  }
}

export function returnCareerMapDraft(
  map: KpiCareerMapVersion,
  actor: KpiActor | { id: string; role: string },
  reason: string
): KpiCareerMapVersion {
  if (actor.role !== 'ceo') {
    throw new Error('Chỉ CEO mới có quyền trả lại sơ đồ.')
  }

  if (map.status !== 'pending_approval') {
    throw new Error('Chỉ có thể trả lại sơ đồ đang ở trạng thái Chờ duyệt (pending_approval).')
  }

  if (!reason || !reason.trim()) {
    throw new Error('Cần nêu rõ lý do trả lại để HR Admin chỉnh sửa.')
  }

  return {
    ...map,
    status: 'returned',
    returned_reason: reason.trim(),
    updated_at: new Date().toISOString(),
  }
}

export function publishCareerMap(
  map: KpiCareerMapVersion,
  actor: KpiActor | { id: string; role: string },
  effectiveFrom: string,
  profiles: KpiPositionCriteriaProfile[],
  context?: CareerMapValidationContext
): KpiCareerMapVersion {
  if (actor.role !== 'ceo') {
    throw new Error('Chỉ CEO mới có quyền ban hành sơ đồ.')
  }

  if (map.status !== 'pending_approval') {
    throw new Error('Chỉ có thể ban hành sơ đồ đang ở trạng thái Chờ duyệt (pending_approval). HR Admin cần gửi duyệt trước.')
  }

  if (!effectiveFrom) {
    throw new Error('Ngày hiệu lực không được để trống.')
  }

  if (!profiles || profiles.length === 0) {
    throw new Error('Danh sách tiêu chí (profiles) là bắt buộc khi ban hành sơ đồ.')
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  if (effectiveFrom < todayStr) {
    throw new Error(`Ngày hiệu lực không được nằm trong quá khứ (${effectiveFrom} < ${todayStr}).`)
  }

  const validation = validateCareerMap({
    map,
    profiles,
    presets: context?.presets,
    masterPositions: context?.masterPositions,
    effectiveDate: effectiveFrom,
    strict: true,
  })
  if (validation.has_blocking) {
    const blockingMsgs = validation.issues.filter((i) => i.severity === 'blocking').map((i) => i.message).join('; ')
    throw new Error(`Không thể ban hành sơ đồ còn lỗi chặn: ${blockingMsgs}`)
  }

  return {
    ...map,
    status: 'published',
    approved_by: actor.id,
    effective_from: effectiveFrom,
    returned_reason: null,
    updated_at: new Date().toISOString(),
  }
}

export function scopePromotionDossiers<
  T extends {
    id: string
    employee_id?: string
    store_id?: string
    employeeName?: string
    employee?: { id?: string; store_id?: string }
  }
>(
  dossiers: T[],
  user: { id: string; role: string; store_id?: string; [key: string]: unknown } | null | undefined
): T[] {
  if (!user) return []

  if (user.role === 'employee') {
    return dossiers.filter(
      (d) =>
        (d.employee_id && d.employee_id === user.id) ||
        (d.employee?.id && d.employee.id === user.id)
    )
  }

  if (user.role === 'store_manager') {
    if (!user.store_id) return []
    return dossiers.filter(
      (d) =>
        (d.store_id && d.store_id === user.store_id) ||
        (d.employee?.store_id && d.employee.store_id === user.store_id)
    )
  }

  if (user.role === 'hr_admin' || user.role === 'ceo' || user.role === 'admin') {
    return dossiers
  }

  return []
}

export interface PromotionDossierDTO {
  id: string
  employee_id: string
  employeeName: string
  store_id: string
  storeName: string
  employee: import('./types.ts').KpiEmployeeRef
  targetLevel: import('./types.ts').KpiLevelCode
  currentHourlyRate: number | null
  leaderProposalNote: string
  finalReviewNote: string
  appointmentNote: string
  appealDeadline: string
  eligibilityInput: import('./development-service.ts').PromotionEligibilityInput | null
  eligibilityChecks: import('./development-service.ts').EligibilityCheck[]
  eligibilityStatus: 'not_eligible' | 'eligible_for_test'
  testSession: import('./test-service.ts').TestSession | null
  challenge: import('./challenge-service.ts').KpiChallenge | null
  salarySuggestion: import('./salary-service.ts').SalarySuggestion | null
  salaryBandLabel: string | null
  overallStatus: 'ready_for_appointment' | 'in_testing' | 'blocked'
  stageLabel: string
}

export interface BuildPromotionDossiersInput {
  placements?: import('./career-map-types.ts').KpiCareerEmployeePlacement[]
  employees?: Array<{
    id: string
    name: string
    position_id: string
    store_id: string
    store_name?: string
    hourly_rate?: number
    active?: boolean
  }>
  careerMap?: KpiCareerMapVersion | null
  kpiSets?: KpiSetVersion[]
  evaluations?: import('./types.ts').KpiEvaluation[]
  developmentCases?: import('./types.ts').KpiDevelopmentCase[]
  monthsInLevelByEmployee?: Record<string, number>
  validHoursByEvaluation?: Record<string, number>
  criticalIncidentDatesByEmployee?: Record<string, string[]>
  activeWarningDatesByEmployee?: Record<string, string[]>
}

export function buildPromotionDossiers(input: BuildPromotionDossiersInput): PromotionDossierDTO[] {
  const {
    placements = [],
    employees = [],
    careerMap,
    evaluations = [],
    monthsInLevelByEmployee,
    validHoursByEvaluation,
    criticalIncidentDatesByEmployee,
    activeWarningDatesByEmployee,
  } = input

  if (placements.length === 0 && employees.length === 0) {
    return []
  }

  const activeNodes = careerMap?.nodes?.filter((n) => n.active) || []
  const nodeById = new Map(activeNodes.map((n) => [n.id, n]))
  const activeEdges = careerMap?.edges?.filter((e) => e.active) || []

  const dossiers: PromotionDossierDTO[] = []

  for (const placement of placements) {
    if (placement.status !== 'placed' || !placement.node_id) continue
    const node = nodeById.get(placement.node_id)
    if (!node) continue

    const emp = employees.find((e) => e.id === placement.employee_id)
    const empName = emp?.name || `Nhân viên ${placement.employee_id.slice(0, 6)}`
    const storeName = emp?.store_name || `Cửa hàng ${placement.store_id.slice(0, 6)}`

    const outgoingEdges = activeEdges.filter((e) => e.source_node_id === node.id)
    const targetEdge = outgoingEdges[0]
    const targetNode = targetEdge ? nodeById.get(targetEdge.target_node_id) : undefined
    const targetLevel = (targetNode ? `L${targetNode.position_level_snapshot}` : `L${node.position_level_snapshot + 1}`) as import('./types.ts').KpiLevelCode

    const employeeRef = {
      id: placement.employee_id,
      store_id: placement.store_id,
      level_code: `L${node.position_level_snapshot}` as import('./types.ts').KpiLevelCode,
      position_id: placement.position_id,
      employment_status: 'official' as const,
    }
    const empEvals = evaluations.filter((ev) => ev.employee?.id === placement.employee_id)
    const hasCompleteOperationalData =
      empEvals.length > 0 &&
      typeof monthsInLevelByEmployee?.[placement.employee_id] === 'number' &&
      empEvals.every((ev) => typeof ev.total_score === 'number' && typeof validHoursByEvaluation?.[ev.id] === 'number') &&
      Array.isArray(criticalIncidentDatesByEmployee?.[placement.employee_id]) &&
      Array.isArray(activeWarningDatesByEmployee?.[placement.employee_id])

    const eligibilityInput: PromotionEligibilityInput | null = hasCompleteOperationalData
      ? {
          employee: employeeRef,
          target_level: targetLevel,
          months_in_level: monthsInLevelByEmployee![placement.employee_id],
          monthly_scores: empEvals.map((ev) => ({
            month: ev.period_id,
            total: ev.total_score!,
            core_average: ev.total_score!,
            valid_hours: validHoursByEvaluation![ev.id],
          })),
          critical_incident_dates: criticalIncidentDatesByEmployee![placement.employee_id],
          active_warning_dates: activeWarningDatesByEmployee![placement.employee_id],
          now: new Date().toISOString(),
        }
      : null

    const eligibility = eligibilityInput
      ? evaluatePromotionEligibility(eligibilityInput)
      : {
          status: 'not_eligible' as const,
          checks: [{
            code: 'missing_operational_data',
            label: 'Dữ liệu xét tăng bậc',
            passed: false,
            actual: 'Chưa đủ dữ liệu thật',
            required: 'Đủ KPI, giờ công, thời gian giữ bậc, sự cố và cảnh báo',
            blocking: true,
          }],
        }
    const stageLabel = !eligibilityInput
      ? 'Chưa đủ dữ liệu đánh giá'
      : eligibility.status === 'eligible_for_test'
        ? 'Sẵn sàng xét thi'
        : 'Chưa đủ điều kiện'

    const isEligible = eligibility.status === 'eligible_for_test'
    const overallStatus: 'ready_for_appointment' | 'in_testing' | 'blocked' =
      !eligibilityInput
        ? 'in_testing'
        : !isEligible
          ? 'blocked'
          : 'in_testing'

    dossiers.push({
      id: `dossier_${placement.employee_id}`,
      employee_id: placement.employee_id,
      employeeName: empName,
      store_id: placement.store_id,
      storeName: storeName,
      employee: employeeRef,
      targetLevel,
      currentHourlyRate: typeof emp?.hourly_rate === 'number' ? emp.hourly_rate : null,
      leaderProposalNote: `Leader đề xuất nâng bậc cho ${empName} dựa trên lộ trình nghề nghiệp.`,
      finalReviewNote: 'Đang trong quy trình xem xét thăng tiến chuẩn 7 bước.',
      appointmentNote: 'Chờ hoàn tất quy trình kiểm tra và phê duyệt.',
      appealDeadline: 'Chưa bắt đầu',
      eligibilityInput,
      eligibilityChecks: eligibility.checks,
      eligibilityStatus: eligibility.status,
      testSession: null,
      challenge: null,
      salarySuggestion: null,
      salaryBandLabel: null,
      overallStatus,
      stageLabel,
    })
  }

  return dossiers
}

export function clonePublishedCareerMapAsDraft(
  publishedMap: KpiCareerMapVersion,
  createdBy: string
): KpiCareerMapVersion {
  const timestamp = new Date().toISOString()
  return {
    ...publishedMap,
    id: `map_draft_v${publishedMap.version + 1}_${Date.now()}`,
    version: publishedMap.version + 1,
    based_on_version_id: publishedMap.id,
    status: 'draft',
    created_by: createdBy,
    approved_by: null,
    returned_reason: null,
    created_at: timestamp,
    updated_at: timestamp,
    nodes: publishedMap.nodes.map((n) => ({ ...n })),
    edges: publishedMap.edges.map((e) => ({ ...e })),
  }
}

export function buildKpiSetDraftsFromCareerMap(
  map: KpiCareerMapVersion,
  profiles: KpiPositionCriteriaProfile[],
  existingSets?: KpiSetVersion[]
): KpiSetVersion[] {
  const activeNodes = map.nodes.filter((n) => n.active)
  const timestamp = new Date().toISOString()
  const sets = existingSets || []

  return activeNodes.map((node) => {
    const profile =
      profiles.find((p) => node.grade_code && p.grade_codes?.includes(node.grade_code)) ||
      profiles.find((p) => p.id === node.criteria_profile_id) ||
      profiles.find((p) => p.position_ids.includes(node.position_id))

    const setId = node.grade_code ? `kpi_set_${node.grade_code}` : `kpi_set_${node.position_id}`
    const matchingExistingSets = sets.filter(
      (s) =>
        s.set_id === setId ||
        (node.grade_code && s.level_codes?.includes(node.grade_code as unknown as import('./types.ts').KpiLevelCode)) ||
        (!node.grade_code && s.position_ids?.includes(node.position_id))
    )
    const maxVersion = matchingExistingSets.length > 0 ? Math.max(0, ...matchingExistingSets.map((s) => s.version)) : 0
    const nextVersion = maxVersion + 1
    const draftId = `${setId}_v${nextVersion}_${Date.now()}`

    const displayName = node.grade_name_snapshot || node.position_name_snapshot

    const criteriaDefs: KpiCriterionDefinition[] = (profile?.criteria || []).map((c, cIdx) => ({
      id: c.id,
      group_id: `grp_${node.grade_code || node.position_id}`,
      name: c.name,
      description: c.description || c.name,
      scoring_mode: c.direction === 'rubric' ? 'leader' : 'combined',
      weight: c.weight,
      unit: (c.unit || '%') as import('./types.ts').KpiCriterionDefinition['unit'],
      direction: c.direction === 'lower_is_better' ? 'lower' : c.direction === 'rubric' ? 'rubric' : 'higher',
      core: c.importance === 'high',
      recommended_weight_range: { min: Math.max(5, c.weight - 5), max: Math.min(100, c.weight + 5) },
      source_key: c.evidence_source,
      score_bands: [],
      evidence_required_below: 3,
      adjustment_reason_required: true,
      sort_order: cIdx + 1,
      active: c.active,
    }))

    const groups: KpiGroupDefinition[] = [
      {
        id: `grp_${node.grade_code || node.position_id}`,
        name: `Tiêu chí vận hành ${displayName}`,
        tag: 'operations',
        weight: 100,
        promotion_core: true,
        sort_order: 1,
        criteria: criteriaDefs,
      },
    ]

    let templateId: import('./types.ts').KpiTemplateId = 'barista'
    if (node.job_family === 'cashier' || node.grade_code === 'c1_tn') templateId = 'cashier'
    else if (node.job_family === 'service') templateId = 'server'
    else if (node.job_family === 'kitchen') templateId = 'kitchen'
    else if (node.job_family === 'management' || node.grade_code === 'c4' || node.grade_code === 'c5') {
      templateId = (node.grade_code === 'c5' || (node.position_level_snapshot || 1) >= 4) ? 'store_manager' : 'shift_leader'
    }

    return {
      id: draftId,
      set_id: setId,
      version: nextVersion,
      name: `Bộ KPI ${displayName} v${nextVersion}`,
      status: 'draft',
      template_id: templateId,
      position_ids: [node.position_id],
      level_codes: [
        (node.grade_code || `L${node.position_level_snapshot || 1}`) as unknown as import('./types.ts').KpiLevelCode,
      ],
      store_ids: 'all',
      effective_from: map.effective_from || timestamp,
      score_scale: [1, 2, 3, 4, 5],
      groups,
      primary_purpose: 'promotion',
      secondary_purposes: ['monthly_bonus', 'store_operations'],
      created_by: map.created_by,
      created_at: timestamp,
    }
  })
}
