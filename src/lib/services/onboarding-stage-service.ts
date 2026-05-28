import type {
  EmployeeOnboardingChecklistProgressItem,
  OnboardingOutputGateStatus,
  OnboardingOutputQualityResult,
  OnboardingOutputReadinessLabel,
  OnboardingOutputSnapshotRedFlag,
  OnboardingOutputTrack,
  OnboardingOutputWorkflowStatus,
  OnboardingChecklistItemTemplate,
  OnboardingThreeViewActionOwner,
  OnboardingThreeViewBlocker,
  OnboardingThreeViewChecklistItem,
  OnboardingThreeViewItemStatus,
  OnboardingThreeViewSnapshot,
  OnboardingThreeViewStageSummary,
} from '@/lib/career-path-types'
import {
  getEmployeeOnboardingChecklistBundleForEmployee,
  getEmployeeOnboardingChecklistPlan,
  getOnboardingOutputItemDefinitions,
  updateEmployeeOnboardingChecklistProgressItem,
} from '@/lib/career-path-service'
import { mockEmployees } from '@/lib/mock-data'

type EmployeeChecklistBundle = NonNullable<ReturnType<typeof getEmployeeOnboardingChecklistBundleForEmployee>>

function getEmployeeById(employeeId: string) {
  return mockEmployees.find((employee) => employee.id === employeeId) ?? null
}

function getPrimaryTrack(roleCode: string): OnboardingOutputTrack {
  if (roleCode === 'barista') return 'barista'
  if (roleCode === 'shift_leader') return 'shift_leader'
  return 'cashier_service'
}

function getOutputDefinition(item: OnboardingChecklistItemTemplate, roleCode: string) {
  const definitions = getOnboardingOutputItemDefinitions()
  const direct = definitions[item.code]
  if (direct) return direct

  const track = getPrimaryTrack(roleCode)
  return {
    code: item.code,
    track,
    self_check_prompt: `Ban tu danh gia muc do tu tin voi item ${item.title} nhu the nao?`,
    pass_standard_supported: `Dat item ${item.title} khi co buddy ho tro sat.`,
    pass_standard_independent: item.success_criteria,
    red_flags: [
      {
        code: `${item.code}_repeat_issue`,
        label: 'Con lap lai loi co ban',
        detail: `Item ${item.title} van con lap lai loi hoac can nhac qua nhieu lan.`,
      },
    ],
  }
}

function deriveThreeViewStatus(
  item: OnboardingChecklistItemTemplate,
  progress: EmployeeOnboardingChecklistProgressItem,
): OnboardingThreeViewItemStatus {
  if (progress.status === 'passed') {
    return 'passed'
  }

  if (progress.status === 'need_more_coaching') {
    return 'needs_coaching'
  }

  const waitingManager =
    item.requires_manager_confirmation
    && Boolean(progress.completed_at)
    && Boolean(progress.buddy_confirmed_at)
    && !progress.manager_confirmed_at

  if (waitingManager) {
    return 'pending_review'
  }

  const waitingBuddy =
    item.requires_buddy_confirmation
    && Boolean(progress.completed_at)
    && !progress.buddy_confirmed_at

  if (waitingBuddy) {
    return 'pending_review'
  }

  if (progress.status === 'in_progress') {
    return 'learning'
  }

  return 'not_started'
}

function deriveOutputWorkflowStatus(
  item: OnboardingChecklistItemTemplate,
  progress: EmployeeOnboardingChecklistProgressItem,
): OnboardingOutputWorkflowStatus {
  const status = deriveThreeViewStatus(item, progress)
  if (status === 'passed') return 'completed'
  if (status === 'pending_review') {
    if (
      item.requires_manager_confirmation
      && Boolean(progress.completed_at)
      && (!item.requires_buddy_confirmation || Boolean(progress.buddy_confirmed_at))
      && !progress.manager_confirmed_at
    ) {
      return 'pending_manager_gate'
    }

    return 'pending_buddy_review'
  }

  if (status === 'learning' || status === 'needs_coaching') return 'learning'
  return 'not_started'
}

function deriveOutputQualityResult(
  item: OnboardingChecklistItemTemplate,
  progress: EmployeeOnboardingChecklistProgressItem,
): OnboardingOutputQualityResult {
  const status = deriveThreeViewStatus(item, progress)
  if (status === 'passed') {
    if (item.requires_manager_confirmation || item.requires_buddy_confirmation) {
      return 'met_independently'
    }

    return 'met_with_support'
  }

  if (status === 'pending_review' || status === 'learning') {
    return 'met_with_support'
  }

  if (status === 'needs_coaching') {
    return 'needs_retrain'
  }

  return 'not_met'
}

function resolveActionOwner(
  status: OnboardingThreeViewItemStatus,
  item: OnboardingChecklistItemTemplate,
  progress: EmployeeOnboardingChecklistProgressItem,
): OnboardingThreeViewActionOwner {
  if (status === 'passed' || status === 'not_applicable') {
    return 'none'
  }

  if (status === 'pending_review') {
    if (
      item.requires_manager_confirmation
      && Boolean(progress.completed_at)
      && Boolean(progress.buddy_confirmed_at)
      && !progress.manager_confirmed_at
    ) {
      return 'manager'
    }

    return 'buddy'
  }

  return 'employee'
}

function buildManagerCheck(item: OnboardingChecklistItemTemplate) {
  if (item.requires_manager_confirmation) {
    return `Quan ly xac nhan: ${item.success_criteria}`
  }

  if (item.requires_buddy_confirmation) {
    return 'Quan ly xem canh bao neu item bi tra ve hoac ket qua khong on dinh.'
  }

  return 'Quan ly chi can xem tong quan tien do cua chang nay.'
}

function buildChecklistItems(bundle: EmployeeChecklistBundle): OnboardingThreeViewChecklistItem[] {
  const stageCodeByStageId = new Map(bundle.stages.map((stage) => [stage.id, stage.code]))

  return bundle.items.map((item) => {
    const status = deriveThreeViewStatus(item, item.progress)
    const definition = getOutputDefinition(item, bundle.plan.role_code)
    return {
      id: item.id,
      code: item.code,
      stage_id: item.stage_id,
      stage_code: stageCodeByStageId.get(item.stage_id) ?? bundle.summary.current_stage_code,
      title: item.title,
      required: item.is_required,
      employee_action: item.instruction_text,
      buddy_action: item.requires_buddy_confirmation
        ? `Buddy huong dan va xac nhan theo tieu chuan: ${item.success_criteria}`
        : `Buddy ho tro nhan vien luyen dung thao tac cua item ${item.title}.`,
      manager_check: buildManagerCheck(item),
      passing_standard: item.success_criteria,
      pass_standard_supported: definition.pass_standard_supported,
      pass_standard_independent: definition.pass_standard_independent,
      self_check_prompt: definition.self_check_prompt,
      status,
      quality_result: deriveOutputQualityResult(item, item.progress),
      workflow_status: deriveOutputWorkflowStatus(item, item.progress),
      red_flags: definition.red_flags,
      action_owner: resolveActionOwner(status, item, item.progress),
      note: item.progress.note,
    }
  })
}

function buildStageSummaries(
  bundle: EmployeeChecklistBundle,
  items: OnboardingThreeViewChecklistItem[],
): OnboardingThreeViewStageSummary[] {
  return bundle.stages.map((stage) => {
    const stageItems = items.filter((item) => item.stage_id === stage.id)
    const requiredItems = stageItems.filter((item) => item.required)
    const passedRequiredItems = requiredItems.filter((item) => item.status === 'passed')

    return {
      id: stage.id,
      code: stage.code,
      label: stage.label,
      goal_summary: stage.goal_summary,
      status: stage.code === bundle.summary.current_stage_code
        ? 'current'
        : stage.status === 'completed'
          ? 'passed'
          : 'locked',
      total_items: stageItems.length,
      passed_items: stageItems.filter((item) => item.status === 'passed').length,
      required_items: requiredItems.length,
      required_items_remaining: requiredItems.length - passedRequiredItems.length,
    }
  })
}

function buildBlockers(
  bundle: EmployeeChecklistBundle,
  items: OnboardingThreeViewChecklistItem[],
): OnboardingThreeViewBlocker[] {
  const currentStage = bundle.stages.find((stage) => stage.code === bundle.summary.current_stage_code)
  if (!currentStage) {
    return []
  }

  const currentStageItems = items.filter((item) => item.stage_id === currentStage.id && item.required)
  const itemBlockers = currentStageItems.flatMap((item) => {
    if (item.status === 'passed' || item.status === 'not_applicable') {
      return []
    }

    const severity = item.status === 'needs_coaching'
      ? 'risk'
      : item.status === 'pending_review'
        ? 'slow'
        : 'attention'

    const blockerType = item.action_owner === 'employee' ? 'item' : 'owner'
    const label = item.status === 'pending_review'
      ? 'Dang cho duyet'
      : item.status === 'needs_coaching'
        ? 'Can kem them'
        : 'Chua dat item bat buoc'

    const detail = item.action_owner === 'employee'
      ? `Nhan vien can xu ly tiep item ${item.title}.`
      : item.action_owner === 'buddy'
        ? `Buddy can danh gia hoac xac nhan item ${item.title}.`
        : `Quan ly can xac nhan item ${item.title}.`

    return [
      {
        id: `blocker-${bundle.plan.employee_id}-${item.id}`,
        employee_id: bundle.plan.employee_id,
        stage_id: currentStage.id,
        stage_code: currentStage.code,
        item_id: item.id,
        item_title: item.title,
        type: blockerType,
        severity,
        action_owner: item.action_owner,
        label,
        detail,
      } satisfies OnboardingThreeViewBlocker,
    ]
  })

  if (itemBlockers.length === 0) {
    return []
  }

  return [
    ...itemBlockers,
    {
      id: `stage-rule-${bundle.plan.employee_id}-${currentStage.code}`,
      employee_id: bundle.plan.employee_id,
      stage_id: currentStage.id,
      stage_code: currentStage.code,
      type: 'stage_rule',
      severity: itemBlockers.some((blocker) => blocker.severity === 'risk') ? 'risk' : 'attention',
      action_owner: itemBlockers[0]?.action_owner ?? 'employee',
      label: 'Chua du dieu kien qua chang',
      detail: `Chang ${currentStage.label} con item bat buoc chua dat nen chua mo chang sau.`,
    },
  ]
}

function buildOpenRedFlags(items: OnboardingThreeViewChecklistItem[]): OnboardingOutputSnapshotRedFlag[] {
  return items.flatMap((item) => {
    if (item.quality_result !== 'needs_retrain' && item.quality_result !== 'not_met') {
      return []
    }

    return (item.red_flags ?? []).map((flag) => ({
      ...flag,
      item_id: item.id,
      item_title: item.title,
    }))
  })
}

function getSnapshotReadinessLabel(
  items: OnboardingThreeViewChecklistItem[],
  blockers: OnboardingThreeViewBlocker[],
): OnboardingOutputReadinessLabel {
  if (blockers.some((blocker) => blocker.severity === 'risk')) {
    return 'can_kem_sat'
  }

  if (items.some((item) => item.quality_result === 'met_with_support' || item.quality_result === 'not_met')) {
    return 'can_kem_nhe'
  }

  return 'tu_lam'
}

function getSnapshotGateStatus(
  readinessLabel: OnboardingOutputReadinessLabel,
  blockers: OnboardingThreeViewBlocker[],
): OnboardingOutputGateStatus {
  if (blockers.length > 0) return 'blocked'
  if (readinessLabel === 'tu_lam') return 'independent_ready'
  return 'supported_ready'
}

function buildSnapshot(bundle: EmployeeChecklistBundle): OnboardingThreeViewSnapshot {
  const items = buildChecklistItems(bundle)
  const stages = buildStageSummaries(bundle, items)
  const blockers = buildBlockers(bundle, items)
  const openRedFlags = buildOpenRedFlags(items)
  const readinessLabel = getSnapshotReadinessLabel(items, blockers)
  const gateStatus = getSnapshotGateStatus(readinessLabel, blockers)
  const currentStage = stages.find((stage) => stage.code === bundle.summary.current_stage_code) ?? stages[0]
  const currentStageIndex = stages.findIndex((stage) => stage.code === currentStage?.code)
  const nextStage = currentStageIndex >= 0 ? stages[currentStageIndex + 1] ?? null : null

  return {
    employee_id: bundle.plan.employee_id,
    employee_name: getEmployeeById(bundle.plan.employee_id)?.full_name ?? bundle.plan.employee_id,
    role_code: bundle.plan.role_code,
    primary_track: getPrimaryTrack(bundle.plan.role_code),
    assigned_store_id: bundle.plan.assigned_store_id,
    assigned_buddy_id: bundle.plan.assigned_buddy_id ?? null,
    assigned_buddy_name: bundle.plan.assigned_buddy_name ?? null,
    assigned_manager_id: bundle.plan.assigned_manager_id ?? null,
    assigned_manager_name: bundle.plan.assigned_manager_name ?? null,
    current_stage_code: currentStage?.code ?? bundle.summary.current_stage_code,
    current_stage_label: currentStage?.label ?? bundle.summary.current_stage_code,
    next_stage_code: nextStage?.code ?? null,
    next_stage_label: nextStage?.label ?? null,
    can_open_next_stage: blockers.length === 0,
    readiness_label: readinessLabel,
    gate_status: gateStatus,
    top_risk_label: openRedFlags[0]?.label ?? null,
    open_red_flags: openRedFlags,
    blockers,
    items,
    current_stage_items: items.filter((item) => item.stage_code === (currentStage?.code ?? bundle.summary.current_stage_code)),
    stages,
  }
}

export function getOnboardingThreeViewSnapshot(employeeId: string): OnboardingThreeViewSnapshot | null {
  const employee = getEmployeeById(employeeId)
  if (!employee) {
    return null
  }

  const bundle = getEmployeeOnboardingChecklistBundleForEmployee(employee)
  if (!bundle) {
    return null
  }

  return buildSnapshot(bundle)
}

export function listOnboardingThreeViewSnapshots(): OnboardingThreeViewSnapshot[] {
  return mockEmployees
    .map((employee) => getOnboardingThreeViewSnapshot(employee.id))
    .filter((snapshot): snapshot is OnboardingThreeViewSnapshot => Boolean(snapshot))
}

export function getCurrentStageBlockers(employeeId: string): OnboardingThreeViewBlocker[] {
  return getOnboardingThreeViewSnapshot(employeeId)?.blockers ?? []
}

export function getCurrentStageActionOwner(employeeId: string): OnboardingThreeViewActionOwner {
  const blockers = getCurrentStageBlockers(employeeId)
  return blockers[0]?.action_owner ?? 'none'
}

export function canOpenNextOnboardingStage(employeeId: string): boolean {
  return getOnboardingThreeViewSnapshot(employeeId)?.can_open_next_stage ?? false
}

export function getBuddyThreeViewQueue(buddyId: string): OnboardingThreeViewSnapshot[] {
  return listOnboardingThreeViewSnapshots().filter((snapshot) => snapshot.assigned_buddy_id === buddyId)
}

export function getManagerThreeViewQueue(managerId: string): OnboardingThreeViewSnapshot[] {
  return listOnboardingThreeViewSnapshots().filter((snapshot) => snapshot.assigned_manager_id === managerId)
}

export function getBuddyOutputQueue(buddyId: string): OnboardingThreeViewSnapshot[] {
  return getBuddyThreeViewQueue(buddyId)
}

export function getManagerOutputQueue(managerId: string): OnboardingThreeViewSnapshot[] {
  return getManagerThreeViewQueue(managerId)
}

function getPlanAndBundle(employeeId: string) {
  const employee = getEmployeeById(employeeId)
  if (!employee) {
    return null
  }

  const plan = getEmployeeOnboardingChecklistPlan(employeeId)
  const bundle = getEmployeeOnboardingChecklistBundleForEmployee(employee)
  if (!plan || !bundle) {
    return null
  }

  return { plan, bundle }
}

function getTemplateItem(bundle: EmployeeChecklistBundle, itemId: string) {
  return bundle.items.find((item) => item.id === itemId) ?? null
}

export function startOnboardingStageItem(employeeId: string, itemId: string) {
  const context = getPlanAndBundle(employeeId)
  if (!context) {
    return null
  }

  return updateEmployeeOnboardingChecklistProgressItem(context.plan.id, itemId, (current) => ({
    ...current,
    status: current.status === 'passed' ? 'passed' : 'in_progress',
    started_at: current.started_at ?? new Date().toISOString(),
  }))
}

export function submitOnboardingStageItemForReview(employeeId: string, itemId: string) {
  const context = getPlanAndBundle(employeeId)
  if (!context) {
    return null
  }

  const item = getTemplateItem(context.bundle, itemId)
  if (!item) {
    return null
  }

  return updateEmployeeOnboardingChecklistProgressItem(context.plan.id, itemId, (current) => ({
    ...current,
    status: item.requires_buddy_confirmation || item.requires_manager_confirmation ? 'in_progress' : 'passed',
    started_at: current.started_at ?? new Date().toISOString(),
    completed_at: new Date().toISOString(),
    note: current.note,
  }))
}

export function reviewOnboardingStageItemAsBuddy(
  employeeId: string,
  itemId: string,
  reviewerId: string,
  outcome: 'passed' | 'needs_coaching',
  note?: string,
) {
  const context = getPlanAndBundle(employeeId)
  if (!context) {
    return null
  }

  const item = getTemplateItem(context.bundle, itemId)
  if (!item) {
    return null
  }

  return updateEmployeeOnboardingChecklistProgressItem(context.plan.id, itemId, (current) => {
    const reviewedAt = new Date().toISOString()

    if (outcome === 'needs_coaching') {
      return {
        ...current,
        status: 'need_more_coaching',
        note: note ?? current.note,
        buddy_confirmed_by: reviewerId,
        buddy_confirmed_at: reviewedAt,
      }
    }

    if (item.requires_manager_confirmation) {
      return {
        ...current,
        status: 'in_progress',
        started_at: current.started_at ?? reviewedAt,
        completed_at: current.completed_at ?? reviewedAt,
        buddy_confirmed_by: reviewerId,
        buddy_confirmed_at: reviewedAt,
        note: note ?? current.note,
      }
    }

    return {
      ...current,
      status: 'passed',
      started_at: current.started_at ?? reviewedAt,
      completed_at: current.completed_at ?? reviewedAt,
      buddy_confirmed_by: reviewerId,
      buddy_confirmed_at: reviewedAt,
      note: note ?? current.note,
    }
  })
}

export function reviewOnboardingStageItemAsManager(
  employeeId: string,
  itemId: string,
  reviewerId: string,
  outcome: 'passed' | 'needs_coaching',
  note?: string,
) {
  const context = getPlanAndBundle(employeeId)
  if (!context) {
    return null
  }

  return updateEmployeeOnboardingChecklistProgressItem(context.plan.id, itemId, (current) => {
    const reviewedAt = new Date().toISOString()

    if (outcome === 'needs_coaching') {
      return {
        ...current,
        status: 'need_more_coaching',
        manager_confirmed_by: reviewerId,
        manager_confirmed_at: reviewedAt,
        note: note ?? current.note,
      }
    }

    return {
      ...current,
      status: 'passed',
      started_at: current.started_at ?? reviewedAt,
      completed_at: current.completed_at ?? reviewedAt,
      manager_confirmed_by: reviewerId,
      manager_confirmed_at: reviewedAt,
      note: note ?? current.note,
    }
  })
}
