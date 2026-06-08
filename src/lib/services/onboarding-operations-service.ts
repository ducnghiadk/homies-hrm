import type {
  OnboardingStageEvaluationTimelineView,
  OnboardingMiniQuizView,
  OnboardingStageGateView,
  OnboardingSelfReviewEntry,
  OnboardingOpsChecklistKey,
  OnboardingOpsRuleItem,
  OnboardingOpsSeverity,
} from '@/lib/career-path-types'
import {
  approveOnboardingStageGate,
  createBuddyAssignment,
  getActiveBuddiesForMentor,
  getActiveBuddyForMentee,
  getEmployeeOnboardingChecklistPlan,
  getEmployeeOnboardingChecklistProgressItems,
  getOnboardingChecklistTemplateById,
  getOnboardingRoleDisplayName,
  getOnboardingChecklistItems,
  getOnboardingChecklistStages,
  getOnboardingMiniQuizView,
  getOnboardingPlanRoleLabel,
  getOnboardingStageEvaluationTimelineView,
  getOnboardingStageGateView,
  getOnboardingSelfReviewStageView,
  getOnboardingRoleSettings,
  getSettings,
  getUnmatchedOnboardingRoleEmployees,
  proposeOnboardingStageGate,
  rejectOnboardingStageGate,
  resolveOnboardingRoleForEmployee,
  validateOnboardingRoleSettings,
} from '@/lib/career-path-service'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { EmployeeService } from '@/lib/services/employee-service'
import {
  OnboardingPolicyService,
  type EmployeeOnboardingPolicyRecord,
} from '@/lib/services/onboarding-policy-service'
import type { AuthUser } from '@/store/auth-store'
import { buildOnboardingRuntimeDays, type OnboardingRuntimeDay } from '@/lib/services/onboarding-content-runtime-service'

const STORAGE_KEY = 'homies_onboarding_operations_v1'
const MS_PER_DAY = 24 * 60 * 60 * 1000

export type OnboardingOpsStatusTone = 'block' | 'attention' | 'ready'
export type OnboardingOpsChecklistPhase = 'before_first_shift' | 'after_first_shift'
export type OnboardingOpsFirstShiftResult = 'pass' | 'follow_up' | 'issue'
export type OnboardingOpsFollowUpLevel = 'same_day' | 'next_day' | 'not_needed'
export type OnboardingOpsPriorityFilter = 'all' | 'urgent' | 'due_soon' | 'on_track' | 'blocked_start' | 'completed'
export type OnboardingOpsLegacyPriorityKey = 'block_day_one' | 'need_follow_up' | 'ready'
export type OnboardingOpsStageKey = 'offer_confirmed' | 'day_one' | 'early_ramp' | 'final_review'
export type OnboardingJourneyDayStatus = 'past' | 'today' | 'upcoming' | 'warning' | 'done' | 'empty'

export interface OnboardingJourneyDayTask {
  key: OnboardingOpsChecklistKey | 'follow_up'
  title: string
  description: string
  statusLabel: string
  isDone: boolean
  isPrimary: boolean
}

export interface OnboardingJourneyDaySummary {
  dayIndex: number
  title: string
  status: OnboardingJourneyDayStatus
  statusLabel: string
  taskCount: number
  primaryActionLabel: string
  phaseLabel: string
  isToday: boolean
}

export interface OnboardingJourneyDayDetail {
  dayIndex: number
  title: string
  phaseLabel: string
  status: OnboardingJourneyDayStatus
  statusLabel: string
  focusTitle: string
  focusActionLabel: string
  nextActionLabel: string
  tasks: OnboardingJourneyDayTask[]
  runtimeDay: OnboardingRuntimeDay | null
  focusItems: OnboardingRuntimeDay['focusItems']
  allItems: OnboardingRuntimeDay['allItems']
  isEmpty: boolean
}
export interface OnboardingOpsHistoryEntry {
  id: string
  message: string
  createdAt: string
}

export interface OnboardingOpsStageTaskRow {
  id: string
  title: string
  ownerLabel: string
  dueLabel: string
  expectedResultLabel: string
  statusLabel: string
  actionLabel: string
  isBlocked: boolean
  isDone: boolean
}

export interface OnboardingOpsEmployeeStageDetail {
  key: OnboardingOpsStageKey
  label: string
  statusLabel: 'Đã xong' | 'Đang làm' | 'Đang nghẽn' | 'Chưa bắt đầu'
  taskRows: OnboardingOpsStageTaskRow[]
  blockers: string[]
  latestNote: string | null
}

export interface OnboardingOpsListRow {
  employeeId: string
  employeeName: string
  storeId: string
  storeLabel: string
  roleLabel: string
  currentStageKey: OnboardingOpsStageKey | null
  currentStageLabel: string
  nextMilestoneLabel: string
  primaryMissingLabel: string | null
  statusKey: Exclude<OnboardingOpsPriorityFilter, 'all'>
  statusLabel: 'Cần xử lý ngay' | 'Sắp tới hạn' | 'Đang đúng tiến độ' | 'Chưa thể bắt đầu' | 'Đã chốt kết quả'
  primaryActionLabel: string
  dayFocusLabel: string | null
  isUnmatched: boolean
  unmatchedReason: string | null
  hireDate: string
  tone: OnboardingOpsStatusTone
  toneLabel: 'Block ng\u00E0y \u0111\u1EA7u' | 'C\u1EA7n ho\u00E0n t\u1EA5t s\u1EDBm' | 'S\u1EB5n s\u00E0ng'
  missingLabels: string[]
  hiddenMissingCount: number
  followUpLevel: OnboardingOpsFollowUpLevel | null
  reminderLabel: string | null
  shortNote: string
  suggestedTodayIndex: number
  journeyLength: number
  priorityKey: OnboardingOpsLegacyPriorityKey
}

export interface OnboardingOpsWorkspaceStat {
  key: 'upcoming' | 'block' | 'follow_up'
  label: string
  value: number
}

export interface OnboardingOpsQuickFilter {
  key: OnboardingOpsPriorityFilter
  label: string
  count: number
}

export type OnboardingOverviewSystemStatusKey = 'stable' | 'review' | 'config_error'

export interface OnboardingOverviewSystemStatus {
  key: OnboardingOverviewSystemStatusKey
  label: string
  reason: string
}

export interface OnboardingOverviewConfigSummary {
  enabledRoleCount: number
  missingTemplateCount: number
  duplicateMappingCount: number
  unmatchedEmployeeCount: number
}

export interface OnboardingOverviewUrgentItem {
  id: string
  kind: 'employee' | 'unmatched' | 'config'
  label: string
  detail: string
  ctaLabel: string
  priorityKey: Exclude<OnboardingOpsPriorityFilter, 'all'>
}

export interface OnboardingOpsWorkspaceOverview {
  rows: OnboardingOpsListRow[]
  allRows: OnboardingOpsListRow[]
  filters: OnboardingOpsQuickFilter[]
  stats: OnboardingOpsWorkspaceStat[]
  activeFilter: OnboardingOpsPriorityFilter
  systemStatus: OnboardingOverviewSystemStatus
  configSummary: OnboardingOverviewConfigSummary
  urgentItems: OnboardingOverviewUrgentItem[]
  journeyLength: number
  suggestedTodayIndex: number
}
export interface OnboardingOpsChecklistItem {
  key: OnboardingOpsChecklistKey
  label: string
  phase: OnboardingOpsChecklistPhase
  done: boolean
  severity: OnboardingOpsSeverity
  summary: string
}

export interface OnboardingOpsShiftOption {
  id: string
  label: string
  windowLabel: string
  tone: 'morning' | 'midday' | 'evening'
}

export interface OnboardingOpsBuddyCandidate {
  employeeId: string
  employeeName: string
  roleLabel: string
  activeBuddyCount: number
  isRecommended: boolean
}

export interface OnboardingOpsToolsAccessState {
  chatGroupJoined: boolean
  toolAccountReady: boolean
}

export interface OnboardingOpsEmployeeDetail {
  employeeId: string
  employeeName: string
  onboardingPlanId: string | null
  currentStageCode: string | null
  currentStageKey: OnboardingOpsStageKey | null
  currentStageLabel: string
  nextMilestoneLabel: string
  primaryMissingLabel: string | null
  statusKey: Exclude<OnboardingOpsPriorityFilter, 'all'>
  statusLabel: 'Cần xử lý ngay' | 'Sắp tới hạn' | 'Đang đúng tiến độ' | 'Chưa thể bắt đầu' | 'Đã chốt kết quả'
  storeId: string
  storeLabel: string
  roleLabel: string
  isUnmatched: boolean
  unmatchedReason: string | null
  hireDate: string
  toneLabel: 'Block ng\u00E0y \u0111\u1EA7u' | 'C\u1EA7n ho\u00E0n t\u1EA5t s\u1EDBm' | 'S\u1EB5n s\u00E0ng'
  summaryLabel: string
  tone: OnboardingOpsStatusTone
  checklist: OnboardingOpsChecklistItem[]
  firstShiftOptions: OnboardingOpsShiftOption[]
  selectedFirstShiftKey: string | null
  buddyCandidates: OnboardingOpsBuddyCandidate[]
  selectedBuddyId: string | null
  toolsAccess: OnboardingOpsToolsAccessState
  firstShiftNote: string
  followUpLevel: OnboardingOpsFollowUpLevel | null
  followUpLabel: string
  followUpSuggestedLabel: string
  quickNote: string
  gateView: OnboardingStageGateView | null
  gateRetryItems: Array<{ id: string; title: string }>
  miniQuizView: OnboardingMiniQuizView | null
  evaluationTimelineView: OnboardingStageEvaluationTimelineView | null
  selfReviewLatest: OnboardingSelfReviewEntry | null
  selfReviewHistory: OnboardingSelfReviewEntry[]
  history: OnboardingOpsHistoryEntry[]
  stages: OnboardingOpsEmployeeStageDetail[]
  journeyDays: OnboardingJourneyDaySummary[]
  runtimeDays: OnboardingRuntimeDay[]
  suggestedTodayIndex: number
}
export type OnboardingOpsCompletionPayload =
  | { key: 'first_shift'; firstShiftKey: string; firstShiftLabel: string }
  | { key: 'buddy'; assignedBuddyId: string; assignedBuddyName: string }
  | { key: 'uniform_attendance_policy'; storePolicyConfirmed: true }
  | { key: 'tools_and_group'; chatGroupJoined?: boolean; toolAccountReady?: boolean }
  | { key: 'first_shift_result'; firstShiftResult: OnboardingOpsFirstShiftResult }
  | { key: 'first_shift_note'; firstShiftNote: string }
  | { key: 'follow_up'; followUpLevel: OnboardingOpsFollowUpLevel }

export type StoredOnboardingOpsProgress = Record<
  string,
  {
    firstShiftKey?: string
    firstShiftLabel?: string
    assignedBuddyId?: string
    assignedBuddyName?: string
    storePolicyConfirmed?: boolean
    chatGroupJoined?: boolean
    toolAccountReady?: boolean
    firstShiftResult?: OnboardingOpsFirstShiftResult
    firstShiftNote?: string
    followUpLevel?: OnboardingOpsFollowUpLevel
    history?: OnboardingOpsHistoryEntry[]
  }
>

type ChecklistDraftItem = {
  key: OnboardingOpsChecklistKey
  phase: OnboardingOpsChecklistPhase
  done: boolean
  summary: string
}

type BuildChecklistInput = {
  policyRecord: EmployeeOnboardingPolicyRecord | null
  assignedBuddyName?: string | null
  toolsAccess: OnboardingOpsToolsAccessState
  firstShiftLabel?: string
  storePolicyConfirmed: boolean
  firstShiftResult?: OnboardingOpsFirstShiftResult
  firstShiftNote?: string
  followUpLevel?: OnboardingOpsFollowUpLevel
}

const FIRST_SHIFT_OPTIONS: OnboardingOpsShiftOption[] = [
  {
    id: 'shift-morning',
    label: 'Ca s\u00E1ng 07:30 \u2022 c\u00F3 m\u1EB7t 07:15',
    windowLabel: 'S\u00E1ng',
    tone: 'morning',
  },
  {
    id: 'shift-midday',
    label: 'Ca gi\u1EEFa 13:00 \u2022 c\u00F3 m\u1EB7t 12:45',
    windowLabel: 'Gi\u1EEFa ng\u00E0y',
    tone: 'midday',
  },
  {
    id: 'shift-evening',
    label: 'Ca t\u1ED1i 17:30 \u2022 c\u00F3 m\u1EB7t 17:15',
    windowLabel: 'T\u1ED1i',
    tone: 'evening',
  },
]

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function getNowIsoTimestamp() {
  return new Date().toISOString()
}

function getDaysUntil(dateValue: string) {
  const today = getTodayIsoDate()
  const target = new Date(`${dateValue}T00:00:00`)
  const current = new Date(`${today}T00:00:00`)

  if (Number.isNaN(target.getTime()) || Number.isNaN(current.getTime())) {
    return Number.POSITIVE_INFINITY
  }

  return Math.round((target.getTime() - current.getTime()) / MS_PER_DAY)
}

function getJourneyLength() {
  const settings = getSettings().onboarding_operations
  const configured = settings?.lookahead_days

  if (typeof configured === 'number' && configured >= 1 && configured <= 30) {
    return configured
  }

  return 10
}

function getSuggestedTodayIndex(hireDate: string, journeyLength: number) {
  const delta = getDaysUntil(hireDate)
  if (!Number.isFinite(delta)) return 1
  if (delta > 0) return Math.max(1, journeyLength - delta)
  return Math.min(journeyLength, Math.abs(delta) + 1)
}

function buildJourneyDays(input: {
  journeyLength: number
  suggestedTodayIndex: number
  checklist: OnboardingOpsChecklistItem[]
  followUpLevel: OnboardingOpsFollowUpLevel | null
}): OnboardingJourneyDaySummary[] {
  const beforeShiftPending = input.checklist.filter((item) => item.phase === 'before_first_shift' && !item.done)
  const afterShiftPending = input.checklist.filter((item) => item.phase === 'after_first_shift' && !item.done)

  return Array.from({ length: input.journeyLength }, (_, offset) => {
    const dayIndex = offset + 1
    const isToday = dayIndex === input.suggestedTodayIndex
    const isBeforeShiftWindow = dayIndex <= input.suggestedTodayIndex
    const taskPool = isBeforeShiftWindow ? beforeShiftPending : afterShiftPending
    const primary = taskPool[0]
    const phaseLabel = isBeforeShiftWindow ? 'Chuẩn bị trước ngày đầu' : 'Theo dõi sau ca đầu'
    const status: OnboardingJourneyDayStatus = primary
      ? (isToday ? 'today' : dayIndex < input.suggestedTodayIndex ? 'warning' : 'upcoming')
      : isToday
        ? 'empty'
        : dayIndex < input.suggestedTodayIndex
          ? 'done'
          : 'upcoming'

    return {
      dayIndex,
      title: `Ngày ${dayIndex}`,
      status,
      statusLabel: status === 'today'
        ? 'Hôm nay'
        : status === 'warning'
          ? 'Cần xử lý'
          : status === 'done'
            ? 'Đã xong'
            : status === 'empty'
              ? 'Không có việc'
              : 'Sắp tới',
      taskCount: taskPool.length,
      primaryActionLabel: primary?.label ?? 'Không có đầu việc ưu tiên',
      phaseLabel,
      isToday,
    }
  })
}

const STAGE_ORDER: OnboardingOpsStageKey[] = ['offer_confirmed', 'day_one', 'early_ramp', 'final_review']

const STAGE_LABELS: Record<OnboardingOpsStageKey, string> = {
  offer_confirmed: 'Chốt nhận việc và chuẩn bị vào làm',
  day_one: 'Ngày đầu nhận việc',
  early_ramp: 'Làm quen và kèm cặp',
  final_review: 'Đánh giá và chốt kết quả',
}

function mapStageCodeToStageKey(stageCode: string | null | undefined): OnboardingOpsStageKey {
  if (stageCode === 'day_1') return 'day_one'
  if (stageCode === 'day_2_3' || stageCode === 'day_4_7') return 'early_ramp'
  if (stageCode === 'week_2') return 'final_review'
  return 'offer_confirmed'
}

function resolveCurrentStageKey(input: {
  currentStageCode: string | null | undefined
  isUnmatched: boolean
  planStatus?: string | null
  gateView?: OnboardingStageGateView | null
}): OnboardingOpsStageKey {
  if (input.isUnmatched) return 'offer_confirmed'
  if (input.planStatus === 'completed' || input.gateView?.status === 'da_qua_gate') return 'final_review'
  return mapStageCodeToStageKey(input.currentStageCode)
}

function getStageLabel(stageKey: OnboardingOpsStageKey | null) {
  if (!stageKey) return 'Chưa thể bắt đầu'
  return STAGE_LABELS[stageKey]
}

function getStageDueLabel(stageKey: OnboardingOpsStageKey) {
  if (stageKey === 'offer_confirmed') return 'Trước ngày vào làm'
  if (stageKey === 'day_one') return 'Trong ngày đầu'
  if (stageKey === 'early_ramp') return 'Trong những ngày đầu'
  return 'Cuối kỳ thử việc'
}

function getOwnerLabelFromChecklistKey(key: OnboardingOpsChecklistKey) {
  if (key === 'first_shift') return 'Nhân sự'
  if (key === 'buddy') return 'Nhân sự'
  if (key === 'uniform_attendance_policy') return 'Quản lý cửa hàng'
  if (key === 'tools_and_group') return 'Nhân sự'
  return 'Người kèm / Quản lý'
}

function getOwnerLabelFromConfirmerRole(role: 'employee' | 'buddy' | 'shift_leader' | 'store_manager' | 'hr_admin') {
  if (role === 'employee') return 'Nhân sự mới'
  if (role === 'buddy') return 'Người kèm'
  if (role === 'shift_leader') return 'Ca trưởng'
  if (role === 'store_manager') return 'Quản lý cửa hàng'
  return 'Nhân sự'
}

function getChecklistTaskStatusLabel(item: OnboardingOpsChecklistItem) {
  if (item.done) return 'Đã xong'
  return item.severity === 'block' ? 'Cần xử lý ngay' : 'Đang chờ'
}

function getTemplateTaskStatusLabel(status: 'not_started' | 'in_progress' | 'passed' | 'need_more_coaching' | null | undefined) {
  if (status === 'passed') return 'Đã xong'
  if (status === 'in_progress') return 'Đang làm'
  if (status === 'need_more_coaching') return 'Cần làm lại'
  return 'Chưa bắt đầu'
}

function getTemplateTaskActionLabel(status: 'not_started' | 'in_progress' | 'passed' | 'need_more_coaching' | null | undefined, stageKey: OnboardingOpsStageKey) {
  if (status === 'passed') return 'Đã xong'
  if (status === 'need_more_coaching') return stageKey === 'final_review' ? 'Làm lại trước khi chốt' : 'Nhắc xử lý'
  if (status === 'in_progress') return 'Cập nhật tiến độ'
  return stageKey === 'final_review' ? 'Chuẩn bị chốt' : 'Bắt đầu'
}

function buildChecklistStageTaskRows(input: {
  checklist: OnboardingOpsChecklistItem[]
  phase: OnboardingOpsChecklistPhase
  stageKey: OnboardingOpsStageKey
}): OnboardingOpsStageTaskRow[] {
  return input.checklist
    .filter((item) => item.phase === input.phase)
    .map((item) => ({
      id: `ops-${input.stageKey}-${item.key}`,
      title: item.label,
      ownerLabel: getOwnerLabelFromChecklistKey(item.key),
      dueLabel: getStageDueLabel(input.stageKey),
      expectedResultLabel: item.summary,
      statusLabel: getChecklistTaskStatusLabel(item),
      actionLabel: item.done ? 'Đã xong' : input.phase === 'before_first_shift' ? 'Bổ sung ngay' : 'Xử lý ngay',
      isBlocked: !item.done && item.severity === 'block',
      isDone: item.done,
    }))
}

function buildTemplateStageTaskRows(input: {
  onboardingPlanId: string
  templateId: string
}): Record<OnboardingOpsStageKey, OnboardingOpsStageTaskRow[]> {
  const stageRows: Record<OnboardingOpsStageKey, OnboardingOpsStageTaskRow[]> = {
    offer_confirmed: [],
    day_one: [],
    early_ramp: [],
    final_review: [],
  }

  const stages = getOnboardingChecklistStages(input.templateId)
  const stageMap = new Map(stages.map((stage) => [stage.id, stage]))
  const progressMap = new Map(
    getEmployeeOnboardingChecklistProgressItems(input.onboardingPlanId).map((item) => [item.checklist_item_id, item]),
  )

  getOnboardingChecklistItems(input.templateId)
    .filter((item) => item.active)
    .forEach((item) => {
      const stage = stageMap.get(item.stage_id)
      if (!stage) return

      const stageKey = mapStageCodeToStageKey(stage.code)
      const progress = progressMap.get(item.id)
      const progressStatus = progress?.status ?? 'not_started'

      stageRows[stageKey].push({
        id: item.id,
        title: item.title,
        ownerLabel: getOwnerLabelFromConfirmerRole(item.confirmer_role),
        dueLabel: getStageDueLabel(stageKey),
        expectedResultLabel: item.success_criteria || item.instruction_text,
        statusLabel: getTemplateTaskStatusLabel(progressStatus),
        actionLabel: getTemplateTaskActionLabel(progressStatus, stageKey),
        isBlocked: progressStatus === 'need_more_coaching',
        isDone: progressStatus === 'passed',
      })
    })

  return stageRows
}

function getStoreLabel(storeId: string) {
  const store = mockStores.find((item) => item.id === storeId)
  if (!store) return storeId
  return store.name.replace('Homies Milk Tea - ', '')
}

function getFallbackRoleLabel(employee: AuthUser) {
  return getOnboardingRoleDisplayName({
    label: mockPositions.find((item) => item.id === employee.position_id)?.name,
  })
    || employee.job_level
    || employee.role
}

function getConfiguredRoleLabel(
  employee: AuthUser,
  onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id),
) {
  return getOnboardingPlanRoleLabel(onboardingPlan)
    || resolveOnboardingRoleForEmployee(employee).role_label
    || getFallbackRoleLabel(employee)
}

function getRuntimeTemplateId(
  employee: AuthUser,
  onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id),
) {
  if (onboardingPlan?.template_id && getOnboardingChecklistTemplateById(onboardingPlan.template_id)) {
    return onboardingPlan.template_id
  }

  return resolveOnboardingRoleForEmployee(employee).template_id
}

function getUnmatchedOnboardingState(
  employee: AuthUser,
  onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id),
) {
  if (onboardingPlan) {
    return {
      isUnmatched: false,
      unmatchedReason: null,
    }
  }

  const resolvedRole = resolveOnboardingRoleForEmployee(employee)
  if (resolvedRole.source !== 'unmatched') {
    return {
      isUnmatched: false,
      unmatchedReason: null,
    }
  }

  return {
    isUnmatched: true,
    unmatchedReason: resolvedRole.unmatched_reason ?? 'Nhân sự này cần được ghép chức danh với quy trình thử việc trước.',
  }
}

function getToneLabel(tone: OnboardingOpsStatusTone): OnboardingOpsListRow['toneLabel'] {
  if (tone === 'block') return 'Block ng\u00E0y \u0111\u1EA7u'
  if (tone === 'attention') return 'C\u1EA7n ho\u00E0n t\u1EA5t s\u1EDBm'
  return 'S\u1EB5n s\u00E0ng'
}

function loadProgress(): StoredOnboardingOpsProgress {
  if (typeof window === 'undefined') return {}

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as StoredOnboardingOpsProgress
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveProgress(next: StoredOnboardingOpsProgress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function resolveStoreRules(storeId: string): OnboardingOpsRuleItem[] {
  const settings = getSettings().onboarding_operations
  const override = settings?.store_overrides.find((item) => item.store_id === storeId)
  const overrideSet = new Set(override?.block_keys ?? [])

  return (settings?.rules ?? []).map((rule) => ({
    ...rule,
    severity:
      rule.store_override_allowed && overrideSet.has(rule.key)
        ? 'block'
        : rule.severity,
  }))
}

function getToolsAccess(progress?: StoredOnboardingOpsProgress[string]): OnboardingOpsToolsAccessState {
  return {
    chatGroupJoined: Boolean(progress?.chatGroupJoined),
    toolAccountReady: Boolean(progress?.toolAccountReady),
  }
}

function buildToolsSummary(toolsAccess: OnboardingOpsToolsAccessState) {
  if (toolsAccess.chatGroupJoined && toolsAccess.toolAccountReady) {
    return '\u0110\u00E3 v\u00E0o nh\u00F3m chat v\u00E0 \u0111\u1EE7 c\u00F4ng c\u1EE5 c\u01A1 b\u1EA3n'
  }

  if (toolsAccess.chatGroupJoined) {
    return '\u0110\u00E3 v\u00E0o nh\u00F3m chat, c\u00F2n thi\u1EBFu c\u00F4ng c\u1EE5 l\u00E0m vi\u1EC7c'
  }

  if (toolsAccess.toolAccountReady) {
    return '\u0110\u00E3 c\u00F3 c\u00F4ng c\u1EE5 l\u00E0m vi\u1EC7c, c\u00F2n thi\u1EBFu nh\u00F3m chat'
  }

  return 'Ch\u01B0a \u0111\u1EE7 nh\u00F3m chat v\u00E0 c\u00F4ng c\u1EE5 l\u00E0m vi\u1EC7c'
}

function getFollowUpLabel(level?: OnboardingOpsFollowUpLevel | null) {
  if (level === 'same_day') return 'Theo sát trong ngày'
  if (level === 'next_day') return 'Theo sát ngày mai'
  if (level === 'not_needed') return 'Không cần theo sát thêm'
  return 'Chưa chốt mức theo sát sau ca'
}

function getSuggestedFollowUpLevel(result?: OnboardingOpsFirstShiftResult): OnboardingOpsFollowUpLevel | null {
  if (result === 'follow_up') return 'next_day'
  if (result === 'issue') return 'same_day'
  if (result === 'pass') return 'not_needed'
  return null
}

function getSuggestedFollowUpLabel(result?: OnboardingOpsFirstShiftResult) {
  const suggested = getSuggestedFollowUpLevel(result)
  return suggested
    ? `Gợi ý mặc định: ${getFollowUpLabel(suggested)}`
    : 'Chọn kết quả sau ca để hệ thống gợi ý mức theo sát mặc định.'
}

function getReminderLabel(level?: OnboardingOpsFollowUpLevel | null) {
  if (level === 'same_day') return 'Cần theo sát lại trong ngày'
  if (level === 'next_day') return 'Cần theo sát lại ngày mai'
  return null
}

function getStatusMeta(input: {
  isUnmatched: boolean
  tone: OnboardingOpsStatusTone
  followUpLevel: OnboardingOpsFollowUpLevel | null
  gateView: OnboardingStageGateView | null
  planStatus?: string | null
}) {
  if (input.isUnmatched) {
    return { statusKey: 'blocked_start' as const, statusLabel: 'Chưa thể bắt đầu' as const, tone: 'block' as const }
  }

  if (input.planStatus === 'completed' || input.gateView?.status === 'da_qua_gate') {
    return { statusKey: 'completed' as const, statusLabel: 'Đã chốt kết quả' as const, tone: 'ready' as const }
  }

  if (input.tone === 'block' || Boolean(input.gateView?.blocked_item_ids.length)) {
    return { statusKey: 'urgent' as const, statusLabel: 'Cần xử lý ngay' as const, tone: 'block' as const }
  }

  if (input.followUpLevel === 'same_day' || input.followUpLevel === 'next_day' || input.tone === 'attention') {
    return { statusKey: 'due_soon' as const, statusLabel: 'Sắp tới hạn' as const, tone: 'attention' as const }
  }

  return { statusKey: 'on_track' as const, statusLabel: 'Đang đúng tiến độ' as const, tone: 'ready' as const }
}
function getLegacyPriorityKey(statusKey: Exclude<OnboardingOpsPriorityFilter, 'all'>): OnboardingOpsLegacyPriorityKey {
  if (statusKey === 'urgent' || statusKey === 'blocked_start') return 'block_day_one'
  if (statusKey === 'due_soon') return 'need_follow_up'
  return 'ready'
}

function buildPrimaryMissingLabel(input: {
  isUnmatched: boolean
  unmatchedReason: string | null
  missingLabels: string[]
  followUpLevel: OnboardingOpsFollowUpLevel | null
  gateView: OnboardingStageGateView | null
}) {
  if (input.isUnmatched) return input.unmatchedReason
  if (input.gateView?.blocked_item_ids.length) return 'Còn mục bắt buộc chưa đạt'
  if (input.followUpLevel === 'same_day') return 'Cần xử lý lại trong ngày'
  if (input.followUpLevel === 'next_day') return 'Cần kiểm tra lại ngày mai'
  return input.missingLabels[0] ?? null
}
function buildPrimaryActionLabel(statusKey: Exclude<OnboardingOpsPriorityFilter, 'all'>) {
  if (statusKey === 'blocked_start') return 'Đi tới thiết lập'
  if (statusKey === 'urgent') return 'Xử lý ngay'
  if (statusKey === 'due_soon') return 'Theo dõi tiếp'
  if (statusKey === 'completed') return 'Xem kết quả'
  return 'Mở chi tiết'
}
function buildNextMilestoneLabel(input: {
  currentStageKey: OnboardingOpsStageKey
  statusKey: Exclude<OnboardingOpsPriorityFilter, 'all'>
  primaryMissingLabel: string | null
  dayFocusLabel: string | null
  followUpLevel: OnboardingOpsFollowUpLevel | null
  gateView: OnboardingStageGateView | null
}) {
  if (input.statusKey === 'completed') return 'Đã chốt kết quả thử việc'
  if (input.followUpLevel === 'same_day') return 'Xử lý theo sát trong ngày'
  if (input.followUpLevel === 'next_day') return 'Kiểm tra lại vào ngày mai'
  if (input.gateView?.status === 'cho_quan_ly_duyet') return 'Chờ quản lý chốt kết quả'
  if (input.primaryMissingLabel) return input.primaryMissingLabel
  if (input.dayFocusLabel) return input.dayFocusLabel
  if (input.currentStageKey === 'offer_confirmed') return 'Hoàn tất chuẩn bị trước ngày vào làm'
  if (input.currentStageKey === 'day_one') return 'Ghi nhận kết quả ngày đầu'
  if (input.currentStageKey === 'early_ramp') return 'Cập nhật đánh giá người kèm'
  return 'Chốt đánh giá cuối kỳ'
}

function buildStageStatusLabel(input: {
  stageKey: OnboardingOpsStageKey
  currentStageKey: OnboardingOpsStageKey
  rows: OnboardingOpsStageTaskRow[]
  statusKey: Exclude<OnboardingOpsPriorityFilter, 'all'>
}): OnboardingOpsEmployeeStageDetail['statusLabel'] {
  const stageIndex = STAGE_ORDER.indexOf(input.stageKey)
  const currentIndex = STAGE_ORDER.indexOf(input.currentStageKey)
  const hasPending = input.rows.some((row) => !row.isDone)
  const hasBlocked = input.rows.some((row) => row.isBlocked)

  if (!hasPending && input.rows.length > 0) return 'Đã xong'
  if (stageIndex < currentIndex) return 'Đã xong'
  if (stageIndex > currentIndex) return 'Chưa bắt đầu'
  if (hasBlocked || input.statusKey === 'urgent' || input.statusKey === 'blocked_start') return 'Đang nghẽn'
  return 'Đang làm'
}

function buildShortNote(params: {
  reminderLabel: string | null
  firstShiftNote?: string
  assignedBuddyName?: string | null
  firstShiftLabel?: string
  followUpLevel?: OnboardingOpsFollowUpLevel | null
  tone: OnboardingOpsStatusTone
  missingLabels: string[]
}) {
  if (params.reminderLabel) return params.reminderLabel
  if (params.firstShiftNote) return 'Đã lưu ghi chú ca đầu'
  if (!params.assignedBuddyName) return 'Chưa chốt người kèm'
  if (!params.firstShiftLabel) return 'Chưa chốt ca đầu'
  if (params.followUpLevel === 'not_needed') return 'Đã chốt không cần theo sát thêm'
  if (params.tone === 'ready') return 'Đã đủ bước trước ngày đầu'
  return params.missingLabels[0] ?? 'Còn mục cần xử lý'
}

function appendHistory(
  history: OnboardingOpsHistoryEntry[] | undefined,
  message: string,
): OnboardingOpsHistoryEntry[] {
  return [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      createdAt: getNowIsoTimestamp(),
    },
    ...(history ?? []),
  ].slice(0, 12)
}

function buildHistoryMessage(payload: OnboardingOpsCompletionPayload) {
  if (payload.key === 'first_shift') return `\u0110\u00E3 ch\u1ED1t ca \u0111\u1EA7u: ${payload.firstShiftLabel}`
  if (payload.key === 'buddy') return `\u0110\u00E3 ch\u1ED1t ng\u01B0\u1EDDi k\u00E8m: ${payload.assignedBuddyName}`
  if (payload.key === 'uniform_attendance_policy') return '\u0110\u00E3 x\u00E1c nh\u1EADn n\u1ED9i quy v\u00E0 ch\u1EA5m c\u00F4ng t\u1EA1i qu\u00E1n'
  if (payload.key === 'tools_and_group') {
    const updates: string[] = []

    if (payload.chatGroupJoined !== undefined) {
      updates.push(payload.chatGroupJoined ? '\u0111\u00E3 v\u00E0o nh\u00F3m chat' : '\u0111\u00E3 b\u1ECF tr\u1EA1ng th\u00E1i v\u00E0o nh\u00F3m chat')
    }

    if (payload.toolAccountReady !== undefined) {
      updates.push(payload.toolAccountReady ? '\u0111\u00E3 \u0111\u1EE7 c\u00F4ng c\u1EE5 l\u00E0m vi\u1EC7c' : '\u0111\u00E3 b\u1ECF tr\u1EA1ng th\u00E1i \u0111\u1EE7 c\u00F4ng c\u1EE5 l\u00E0m vi\u1EC7c')
    }

    return updates.length > 0 ? `C\u1EADp nh\u1EADt c\u00F4ng c\u1EE5: ${updates.join(', ')}` : null
  }

  if (payload.key === 'first_shift_result') {
    if (payload.firstShiftResult === 'pass') return '\u0110\u00E3 ch\u1ED1t k\u1EBFt qu\u1EA3 ca \u0111\u1EA7u: \u1ED5n'
    if (payload.firstShiftResult === 'follow_up') return '\u0110\u00E3 ch\u1ED1t k\u1EBFt qu\u1EA3 ca \u0111\u1EA7u: Theo s\u00E1t th\u00EAm'
    return '\u0110\u00E3 ch\u1ED1t k\u1EBFt qu\u1EA3 ca \u0111\u1EA7u: C\u00F3 v\u1EA5n \u0111\u1EC1'
  }

  if (payload.key === 'first_shift_note') {
    return payload.firstShiftNote ? '\u0110\u00E3 l\u01B0u ghi ch\u00FA ca \u0111\u1EA7u' : '\u0110\u00E3 x\u00F3a ghi ch\u00FA ca \u0111\u1EA7u'
  }

  return `Đã chốt mức theo sát: ${getFollowUpLabel(payload.followUpLevel)}`
}

function matchesFilter(row: OnboardingOpsListRow, filter: OnboardingOpsPriorityFilter) {
  if (filter === 'all') return true
  return row.statusKey === filter
}

function buildChecklistItems(input: BuildChecklistInput): ChecklistDraftItem[] {
  return [
    {
      key: 'first_shift',
      phase: 'before_first_shift',
      done: Boolean(input.firstShiftLabel),
      summary: input.firstShiftLabel
        ? input.firstShiftLabel
        : 'Ch\u01B0a ch\u1ED1t ca \u0111\u1EA7u v\u00E0 gi\u1EDD c\u00F3 m\u1EB7t',
    },
    {
      key: 'buddy',
      phase: 'before_first_shift',
      done: Boolean(input.assignedBuddyName),
      summary: input.assignedBuddyName
        ? `Ng\u01B0\u1EDDi k\u00E8m: ${input.assignedBuddyName}`
        : 'Ch\u01B0a g\u00E1n ng\u01B0\u1EDDi k\u00E8m',
    },
    {
      key: 'uniform_attendance_policy',
      phase: 'before_first_shift',
      done: Boolean(input.policyRecord?.full_sent_at) && input.storePolicyConfirmed,
      summary: input.storePolicyConfirmed
        ? '\u0110\u00E3 nh\u1EAFc l\u1EA1i n\u1ED9i quy t\u1EA1i qu\u00E1n v\u00E0 ki\u1EC3m tra ch\u1EA5m c\u00F4ng'
        : 'Ch\u01B0a x\u00E1c nh\u1EADn n\u1ED9i quy/ch\u1EA5m c\u00F4ng t\u1EA1i qu\u00E1n',
    },
    {
      key: 'tools_and_group',
      phase: 'before_first_shift',
      done: input.toolsAccess.chatGroupJoined && input.toolsAccess.toolAccountReady,
      summary: buildToolsSummary(input.toolsAccess),
    },
    {
      key: 'first_shift_result',
      phase: 'after_first_shift',
      done: Boolean(input.firstShiftResult),
      summary:
        input.firstShiftResult === 'pass'
          ? '\u0110\u00E3 ch\u1ED1t \u1ED5n sau ca \u0111\u1EA7u'
          : input.firstShiftResult === 'follow_up'
            ? '\u1ED4n m\u1ED9t ph\u1EA7n, c\u1EA7n theo s\u00E1t th\u00EAm'
            : input.firstShiftResult === 'issue'
              ? 'C\u00F3 v\u1EA5n \u0111\u1EC1, c\u1EA7n x\u1EED l\u00FD ngay'
              : 'Ch\u01B0a ch\u1ED1t k\u1EBFt qu\u1EA3 sau ca \u0111\u1EA7u',
    },
  ]
}

function mapChecklistItems(
  draftItems: ChecklistDraftItem[],
  rules: OnboardingOpsRuleItem[],
): OnboardingOpsChecklistItem[] {
  const ruleMap = new Map(rules.map((rule) => [rule.key, rule]))

  return draftItems.map((item) => {
    const rule = ruleMap.get(item.key)
    return {
      key: item.key,
      label: rule?.label ?? item.key,
      phase: item.phase,
      done: item.done,
      severity: rule?.severity ?? 'attention',
      summary: item.summary,
    }
  })
}

function summarizeMissing(items: OnboardingOpsChecklistItem[]) {
  const missing = items.filter((item) => !item.done && item.phase === 'before_first_shift')
  const tone: OnboardingOpsStatusTone = missing.some((item) => item.severity === 'block')
    ? 'block'
    : missing.length > 0
      ? 'attention'
      : 'ready'

  return {
    tone,
    toneLabel: getToneLabel(tone),
    missingLabels: missing.slice(0, 2).map((item) => item.summary),
    hiddenMissingCount: Math.max(0, missing.length - 2),
  }
}

function buildDetailSummaryLabel(tone: OnboardingOpsStatusTone) {
  if (tone === 'block') return 'Cần xử lý ít nhất 1 mục nghẽn trước ngày đầu'
  if (tone === 'attention') return 'Còn vài mục cần hoàn tất sớm'
  return 'Đã đủ điều kiện trước ngày đầu'
}

function buildEmployeeStages(input: {
  onboardingPlanId: string | null
  templateId: string | null
  checklist: OnboardingOpsChecklistItem[]
  currentStageKey: OnboardingOpsStageKey
  statusKey: Exclude<OnboardingOpsPriorityFilter, 'all'>
  gateView: OnboardingStageGateView | null
  quickNote: string
  firstShiftNote: string
  history: OnboardingOpsHistoryEntry[]
  unmatchedReason: string | null
}) {
  const templateStageRows = input.onboardingPlanId && input.templateId
    ? buildTemplateStageTaskRows({
        onboardingPlanId: input.onboardingPlanId,
        templateId: input.templateId,
      })
    : {
        offer_confirmed: [],
        day_one: [],
        early_ramp: [],
        final_review: [],
      }

  const stageRows: Record<OnboardingOpsStageKey, OnboardingOpsStageTaskRow[]> = {
    offer_confirmed: [
      ...buildChecklistStageTaskRows({ checklist: input.checklist, phase: 'before_first_shift', stageKey: 'offer_confirmed' }),
      ...templateStageRows.offer_confirmed,
    ],
    day_one: [
      ...buildChecklistStageTaskRows({ checklist: input.checklist, phase: 'after_first_shift', stageKey: 'day_one' }),
      ...templateStageRows.day_one,
    ],
    early_ramp: templateStageRows.early_ramp,
    final_review: templateStageRows.final_review,
  }

  if (!input.onboardingPlanId) {
    stageRows.offer_confirmed.unshift({
      id: 'setup-role-onboarding',
      title: 'Hoàn tất ghép chức danh thử việc cho nhân sự',
      ownerLabel: 'Nhân sự',
      dueLabel: getStageDueLabel('offer_confirmed'),
      expectedResultLabel: input.unmatchedReason ?? 'Nhân sự được gắn đúng quy trình thử việc',
      statusLabel: 'Cần xử lý ngay',
      actionLabel: 'Đi tới thiết lập',
      isBlocked: true,
      isDone: false,
    })
  }

  stageRows.final_review.push({
    id: 'trial-final-gate',
    title: 'Chốt kết quả thử việc',
    ownerLabel: 'Quản lý cửa hàng',
    dueLabel: getStageDueLabel('final_review'),
    expectedResultLabel: 'Duyệt đạt hoặc yêu cầu làm lại các mục còn thiếu',
    statusLabel:
      input.gateView?.status === 'da_qua_gate'
        ? 'Đã xong'
        : input.gateView?.status === 'cho_quan_ly_duyet'
          ? 'Đang chờ duyệt'
          : input.gateView?.status === 'chua_qua_gate'
            ? 'Cần làm lại'
            : 'Chưa bắt đầu',
    actionLabel: input.gateView?.status === 'da_qua_gate' ? 'Đã xong' : 'Chốt kết quả',
    isBlocked: input.gateView?.status === 'chua_qua_gate' || Boolean(input.gateView?.blocked_item_ids.length),
    isDone: input.gateView?.status === 'da_qua_gate',
  })

  return STAGE_ORDER.map((stageKey) => {
    const rows = stageRows[stageKey]
    const blockers = rows
      .filter((row) => row.isBlocked || (stageKey === input.currentStageKey && !row.isDone))
      .slice(0, 2)
      .map((row) => row.title)

    const latestNote =
      stageKey === 'final_review'
        ? input.gateView?.manager_note || input.gateView?.buddy_note || input.history[0]?.message || input.quickNote || null
        : stageKey === 'day_one'
          ? input.firstShiftNote || input.history[0]?.message || input.quickNote || null
          : input.history[0]?.message || input.quickNote || null

    return {
      key: stageKey,
      label: STAGE_LABELS[stageKey],
      statusLabel: buildStageStatusLabel({
        stageKey,
        currentStageKey: input.currentStageKey,
        rows,
        statusKey: input.statusKey,
      }),
      taskRows: rows,
      blockers,
      latestNote,
    }
  })
}
function getUpcomingEmployees(currentUser: AuthUser) {
  const settings = getSettings().onboarding_operations
  if (!settings?.enabled) return []

  return EmployeeService.getEmployees(currentUser)
    .filter((employee) => employee.status !== 'resigned')
    .filter((employee) => Boolean(employee.hire_date))
    .filter((employee) => {
      const daysUntil = getDaysUntil(employee.hire_date)
      return daysUntil >= 0 && daysUntil <= settings.lookahead_days
    })
    .sort((left, right) => left.hire_date.localeCompare(right.hire_date) || left.full_name.localeCompare(right.full_name))
}

function buildConfigSummary(): OnboardingOverviewConfigSummary {
  const settings = getOnboardingRoleSettings()
  const issues = validateOnboardingRoleSettings(settings)
  const unmatchedEmployees = getUnmatchedOnboardingRoleEmployees(settings)

  return {
    enabledRoleCount: settings.roles.filter((role) => role.enabled).length,
    missingTemplateCount: issues.filter((issue) => issue.code === 'missing_template').length,
    duplicateMappingCount: issues.filter((issue) => issue.code === 'duplicate_position').length,
    unmatchedEmployeeCount: unmatchedEmployees.length,
  }
}

function buildSystemStatus(
  configSummary: OnboardingOverviewConfigSummary,
  rows: OnboardingOpsListRow[],
): OnboardingOverviewSystemStatus {
  if (configSummary.duplicateMappingCount > 0 || configSummary.missingTemplateCount > 0) {
    return {
      key: 'config_error',
      label: 'Có lỗi cấu hình',
      reason: 'Thiết lập thử việc đang thiếu mẫu hoặc trùng ghép chức danh.',
    }
  }

  if (configSummary.unmatchedEmployeeCount > 0 || rows.some((row) => row.statusKey !== 'on_track' && row.statusKey !== 'completed')) {
    return {
      key: 'review',
      label: 'Cần rà soát',
      reason: 'Còn nhân sự mới hoặc ngoại lệ cần xử lý.',
    }
  }

  return {
    key: 'stable',
    label: 'Ổn định',
    reason: 'Không có nghẽn ngày đầu hay lỗi cấu hình đang mở.',
  }
}

function buildUrgentItems(
  rows: OnboardingOpsListRow[],
  configSummary: OnboardingOverviewConfigSummary,
): OnboardingOverviewUrgentItem[] {
  const items: OnboardingOverviewUrgentItem[] = []

  const firstUnmatched = rows.find((row) => row.statusKey === 'blocked_start')
  if (firstUnmatched) {
    items.push({
      id: `unmatched-${firstUnmatched.employeeId}`,
      kind: 'unmatched',
      label: firstUnmatched.employeeName,
      detail: firstUnmatched.unmatchedReason ?? 'Chưa ghép chức danh thử việc.',
      ctaLabel: 'Xử lý thiết lập',
      priorityKey: 'blocked_start',
    })
  }

  const firstBlock = rows.find((row) => row.statusKey === 'urgent')
  if (firstBlock) {
    items.push({
      id: `block-${firstBlock.employeeId}`,
      kind: 'employee',
      label: firstBlock.employeeName,
      detail: firstBlock.shortNote,
      ctaLabel: 'Xử lý ngay',
      priorityKey: 'urgent',
    })
  }

  if (configSummary.missingTemplateCount > 0) {
    items.push({
      id: 'config-missing-template',
      kind: 'config',
      label: 'Chức danh đang thiếu mẫu',
      detail: `${configSummary.missingTemplateCount} chức danh đang bật chưa gắn mẫu danh sách việc.`,
      ctaLabel: 'Rà soát chức danh và mẫu',
      priorityKey: 'urgent',
    })
  }

  return items
}

function resolveAssignedBuddy(employee: AuthUser, currentUser: AuthUser, progress?: StoredOnboardingOpsProgress[string]) {
  const activeBuddy = getActiveBuddyForMentee(employee.id)
  if (activeBuddy) {
    const mentor = EmployeeService.getEmployeeById(activeBuddy.mentor_id, currentUser)
      || EmployeeService.getEmployeeById(activeBuddy.mentor_id)

    return {
      assignedBuddyId: activeBuddy.mentor_id,
      assignedBuddyName: mentor?.full_name ?? progress?.assignedBuddyName ?? null,
    }
  }

  return {
    assignedBuddyId: progress?.assignedBuddyId ?? null,
    assignedBuddyName: progress?.assignedBuddyName ?? null,
  }
}

function getBuddyCandidates(employee: AuthUser, currentUser: AuthUser): OnboardingOpsBuddyCandidate[] {
  return EmployeeService.getEmployees(currentUser)
    .filter((candidate) => candidate.id !== employee.id)
    .filter((candidate) => candidate.store_id === employee.store_id)
    .filter((candidate) => candidate.status !== 'resigned')
    .map((candidate) => {
      const activeBuddyCount = getActiveBuddiesForMentor(candidate.id).length
      const isRecommended = candidate.role === 'store_manager' || candidate.role === 'shift_leader'

      return {
        employeeId: candidate.id,
        employeeName: candidate.full_name,
        roleLabel: getConfiguredRoleLabel(candidate),
        activeBuddyCount,
        isRecommended,
      }
    })
    .sort((left, right) => {
      if (left.isRecommended !== right.isRecommended) {
        return left.isRecommended ? -1 : 1
      }

      if (left.activeBuddyCount !== right.activeBuddyCount) {
        return left.activeBuddyCount - right.activeBuddyCount
      }

      return left.employeeName.localeCompare(right.employeeName)
    })
}

function buildEmployeeChecklist(
  employee: AuthUser,
  currentUser: AuthUser,
  progress?: StoredOnboardingOpsProgress[string],
) {
  const policyRecord = OnboardingPolicyService.ensureRecordFromEmployee(employee)
  const rules = resolveStoreRules(employee.store_id)
  const toolsAccess = getToolsAccess(progress)
  const assignedBuddy = resolveAssignedBuddy(employee, currentUser, progress)
  const draftItems = buildChecklistItems({
    policyRecord,
    assignedBuddyName: assignedBuddy.assignedBuddyName,
    toolsAccess,
    firstShiftLabel: progress?.firstShiftLabel,
    storePolicyConfirmed: Boolean(progress?.storePolicyConfirmed || policyRecord?.confirmed_at_store_at),
    firstShiftResult: progress?.firstShiftResult,
    firstShiftNote: progress?.firstShiftNote,
    followUpLevel: progress?.followUpLevel,
  })
  const checklist = mapChecklistItems(draftItems, rules)
  const summary = summarizeMissing(checklist)

  return {
    checklist,
    summary,
    toolsAccess,
    assignedBuddy,
  }
}

export const OnboardingOperationsService = {
  getWorkspaceOverview(
    currentUser: AuthUser,
    activeFilter: OnboardingOpsPriorityFilter = 'all',
  ): OnboardingOpsWorkspaceOverview {
    const progress = loadProgress()
    const journeyLength = getJourneyLength()
    const allRows = getUpcomingEmployees(currentUser).map((employee) => {
      const employeeProgress = progress[employee.id]
      const { checklist, summary } = buildEmployeeChecklist(employee, currentUser, employeeProgress)
      const onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id)
      const unmatchedState = getUnmatchedOnboardingState(employee, onboardingPlan)
      const runtimeTemplateId = getRuntimeTemplateId(employee, onboardingPlan)
      const runtimeDays = runtimeTemplateId ? buildOnboardingRuntimeDays(runtimeTemplateId) : []
      const rowJourneyLength = runtimeDays.length > 0 ? runtimeDays.length : journeyLength
      const rowSuggestedTodayIndex = getSuggestedTodayIndex(employee.hire_date, rowJourneyLength)
      const runtimeToday = runtimeDays.find((day) => day.dayIndex === rowSuggestedTodayIndex) ?? runtimeDays[0] ?? null
      const reminderLabel = getReminderLabel(employeeProgress?.followUpLevel)
      const assignedBuddy = resolveAssignedBuddy(employee, currentUser, employeeProgress)
      const gateView = onboardingPlan
        ? getOnboardingStageGateView(employee.id, onboardingPlan.id, onboardingPlan.current_stage_code)
        : null
      const rowSummary = unmatchedState.isUnmatched
        ? {
            tone: 'block' as const,
            toneLabel: getToneLabel('block'),
            missingLabels: ['Chưa ghép chức danh thử việc'],
            hiddenMissingCount: 0,
          }
        : summary

      const currentStageKey = resolveCurrentStageKey({
        currentStageCode: onboardingPlan?.current_stage_code,
        isUnmatched: unmatchedState.isUnmatched,
        planStatus: onboardingPlan?.status ?? null,
        gateView,
      })
      const statusMeta = getStatusMeta({
        isUnmatched: unmatchedState.isUnmatched,
        tone: rowSummary.tone,
        followUpLevel: employeeProgress?.followUpLevel ?? null,
        gateView,
        planStatus: onboardingPlan?.status ?? null,
      })
      const primaryMissingLabel = buildPrimaryMissingLabel({
        isUnmatched: unmatchedState.isUnmatched,
        unmatchedReason: unmatchedState.unmatchedReason,
        missingLabels: rowSummary.missingLabels,
        followUpLevel: employeeProgress?.followUpLevel ?? null,
        gateView,
      })
      const dayFocusLabel = runtimeToday?.focusItems[0]?.title ?? runtimeToday?.allItems[0]?.title ?? null
      const nextMilestoneLabel = buildNextMilestoneLabel({
        currentStageKey,
        statusKey: statusMeta.statusKey,
        primaryMissingLabel,
        dayFocusLabel,
        followUpLevel: employeeProgress?.followUpLevel ?? null,
        gateView,
      })
      const primaryActionLabel = buildPrimaryActionLabel(statusMeta.statusKey)
      const shortNote = unmatchedState.isUnmatched
        ? 'Cần ghép chức danh thử việc trước khi tạo danh sách việc'
        : primaryMissingLabel
          ?? buildShortNote({
            reminderLabel,
            firstShiftNote: employeeProgress?.firstShiftNote,
            assignedBuddyName: assignedBuddy.assignedBuddyName,
            firstShiftLabel: employeeProgress?.firstShiftLabel,
            followUpLevel: employeeProgress?.followUpLevel ?? null,
            tone: checklist.some((item) => !item.done && item.severity === 'block') ? 'block' : rowSummary.tone,
            missingLabels: rowSummary.missingLabels,
          })

      return {
        employeeId: employee.id,
        employeeName: employee.full_name,
        storeId: employee.store_id,
        storeLabel: getStoreLabel(employee.store_id),
        roleLabel: getConfiguredRoleLabel(employee, onboardingPlan),
        currentStageKey,
        currentStageLabel: getStageLabel(currentStageKey),
        nextMilestoneLabel,
        primaryMissingLabel,
        statusKey: statusMeta.statusKey,
        statusLabel: statusMeta.statusLabel,
        primaryActionLabel,
        dayFocusLabel,
        isUnmatched: unmatchedState.isUnmatched,
        unmatchedReason: unmatchedState.unmatchedReason,
        hireDate: employee.hire_date,
        tone: statusMeta.tone,
        toneLabel: getToneLabel(statusMeta.tone),
        missingLabels: rowSummary.missingLabels,
        hiddenMissingCount: rowSummary.hiddenMissingCount,
        followUpLevel: employeeProgress?.followUpLevel ?? null,
        reminderLabel,
        suggestedTodayIndex: rowSuggestedTodayIndex,
        journeyLength: rowJourneyLength,
        shortNote,
        priorityKey: getLegacyPriorityKey(statusMeta.statusKey),
      }
    }).sort((left, right) => {
      const priorityOrder = {
        urgent: 0,
        due_soon: 1,
        blocked_start: 2,
        on_track: 3,
        completed: 4,
      } as const

      return priorityOrder[left.statusKey] - priorityOrder[right.statusKey]
        || left.hireDate.localeCompare(right.hireDate)
        || left.employeeName.localeCompare(right.employeeName)
    })

    const configSummary = buildConfigSummary()
    const systemStatus = buildSystemStatus(configSummary, allRows)
    const urgentItems = buildUrgentItems(allRows, configSummary)
    const suggestedTodayIndex = allRows.length > 0
      ? Math.min(...allRows.map((row) => row.suggestedTodayIndex))
      : 1

    return {
      rows: allRows.filter((row) => matchesFilter(row, activeFilter)),
      allRows,
      filters: [
        { key: 'all', label: 'Tất cả', count: allRows.length },
        { key: 'urgent', label: 'Cần xử lý ngay', count: allRows.filter((row) => row.statusKey === 'urgent').length },
        { key: 'due_soon', label: 'Sắp tới hạn', count: allRows.filter((row) => row.statusKey === 'due_soon').length },
        { key: 'on_track', label: 'Đang đúng tiến độ', count: allRows.filter((row) => row.statusKey === 'on_track').length },
        { key: 'blocked_start', label: 'Chưa thể bắt đầu', count: allRows.filter((row) => row.statusKey === 'blocked_start').length },
        { key: 'completed', label: 'Đã chốt kết quả', count: allRows.filter((row) => row.statusKey === 'completed').length },
      ],
      stats: [
        { key: 'upcoming', label: 'Nhân sự mới', value: allRows.length },
        { key: 'block', label: 'Cần xử lý ngay', value: allRows.filter((row) => row.statusKey === 'urgent').length },
        {
          key: 'follow_up',
          label: 'Sắp tới hạn',
          value: allRows.filter((row) => row.statusKey === 'due_soon').length,
        },
      ],
      activeFilter,
      systemStatus,
      configSummary,
      urgentItems,
      journeyLength,
      suggestedTodayIndex,
    }
  },

  getEmployeeDetail(employeeId: string, currentUser: AuthUser): OnboardingOpsEmployeeDetail | null {
    const employee = EmployeeService.getEmployeeById(employeeId, currentUser)
    if (!employee) return null

    const onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id)
    const unmatchedState = getUnmatchedOnboardingState(employee, onboardingPlan)
    const progress = loadProgress()[employeeId]
    const { checklist, summary, toolsAccess, assignedBuddy } = buildEmployeeChecklist(employee, currentUser, progress)
    const roleLabel = getConfiguredRoleLabel(employee, onboardingPlan)
    const runtimeTemplateId = getRuntimeTemplateId(employee, onboardingPlan)
    const runtimeDays = runtimeTemplateId ? buildOnboardingRuntimeDays(runtimeTemplateId) : []

    const journeyLength = runtimeDays.length > 0 ? runtimeDays.length : getJourneyLength()
    const suggestedTodayIndex = getSuggestedTodayIndex(employee.hire_date, journeyLength)
    const journeyDays = buildJourneyDays({
      journeyLength,
      suggestedTodayIndex,
      checklist,
      followUpLevel: progress?.followUpLevel ?? null,
    })

    const unmatchedCurrentStageKey = 'offer_confirmed' as const
    const unmatchedQuickNote = 'Vào phần thiết lập quy trình thử việc để ghép chức danh và chọn mẫu áp dụng.'
    const unmatchedStages = buildEmployeeStages({
      onboardingPlanId: null,
      templateId: null,
      checklist: [],
      currentStageKey: unmatchedCurrentStageKey,
      statusKey: 'blocked_start',
      gateView: null,
      quickNote: unmatchedQuickNote,
      firstShiftNote: '',
      history: progress?.history ?? [],
      unmatchedReason: unmatchedState.unmatchedReason,
    })

    if (unmatchedState.isUnmatched && !onboardingPlan) {
      return {
        employeeId: employee.id,
        employeeName: employee.full_name,
        onboardingPlanId: null,
        currentStageCode: null,
        currentStageKey: unmatchedCurrentStageKey,
        currentStageLabel: getStageLabel(unmatchedCurrentStageKey),
        nextMilestoneLabel: unmatchedState.unmatchedReason ?? 'Đi tới thiết lập quy trình thử việc',
        primaryMissingLabel: unmatchedState.unmatchedReason,
        statusKey: 'blocked_start',
        statusLabel: 'Chưa thể bắt đầu',
        storeId: employee.store_id,
        storeLabel: getStoreLabel(employee.store_id),
        roleLabel,
        isUnmatched: true,
        unmatchedReason: unmatchedState.unmatchedReason,
        hireDate: employee.hire_date,
        toneLabel: getToneLabel('block'),
        summaryLabel: 'Chưa tự gắn vì chưa ghép chức danh thử việc',
        tone: 'block',
        checklist: [],
        firstShiftOptions: FIRST_SHIFT_OPTIONS,
        selectedFirstShiftKey: null,
        buddyCandidates: getBuddyCandidates(employee, currentUser),
        selectedBuddyId: null,
        toolsAccess: getToolsAccess(),
        firstShiftNote: '',
        followUpLevel: null,
        followUpLabel: getFollowUpLabel(null),
        followUpSuggestedLabel: getSuggestedFollowUpLabel(undefined),
        quickNote: 'Vào phần thiết lập quy trình thử việc để ghép chức danh và chọn mẫu áp dụng.',
        gateView: null,
        gateRetryItems: [],
        miniQuizView: null,
        evaluationTimelineView: null,
        selfReviewLatest: null,
        selfReviewHistory: [],
        history: progress?.history ?? [],
        stages: unmatchedStages,
        journeyDays,
        runtimeDays,
        suggestedTodayIndex,
      }
    }

    const selfReviewStageView = onboardingPlan
      ? getOnboardingSelfReviewStageView(employee.id, onboardingPlan.id, onboardingPlan.current_stage_code)
      : null
    const miniQuizView = onboardingPlan
      ? getOnboardingMiniQuizView(employee.id, onboardingPlan.id, onboardingPlan.current_stage_code)
      : null
    const evaluationTimelineView = onboardingPlan
      ? getOnboardingStageEvaluationTimelineView(employee.id, onboardingPlan.id, onboardingPlan.current_stage_code)
      : null
    const gateView = onboardingPlan
      ? getOnboardingStageGateView(employee.id, onboardingPlan.id, onboardingPlan.current_stage_code)
      : null
    const gateRetryItems = onboardingPlan && gateView
      ? (() => {
          const stages = getOnboardingChecklistStages(onboardingPlan.template_id)
          const stage = stages.find((entry) => entry.code === onboardingPlan.current_stage_code)
          if (!stage) return []

          return getOnboardingChecklistItems(onboardingPlan.template_id)
            .filter((item) => item.stage_id === stage.id && gateView.retry_item_ids.includes(item.id))
            .map((item) => ({ id: item.id, title: item.title }))
        })()
      : []

    const detailSummary = unmatchedState.isUnmatched
      ? {
          tone: 'block' as const,
          missingLabels: ['Chưa ghép chức danh thử việc'],
        }
      : summary
    const currentStageKey = resolveCurrentStageKey({
      currentStageCode: onboardingPlan?.current_stage_code,
      isUnmatched: unmatchedState.isUnmatched,
      planStatus: onboardingPlan?.status ?? null,
      gateView,
    })
    const statusMeta = getStatusMeta({
      isUnmatched: unmatchedState.isUnmatched,
      tone: detailSummary.tone,
      followUpLevel: progress?.followUpLevel ?? null,
      gateView,
      planStatus: onboardingPlan?.status ?? null,
    })
    const primaryMissingLabel = buildPrimaryMissingLabel({
      isUnmatched: unmatchedState.isUnmatched,
      unmatchedReason: unmatchedState.unmatchedReason,
      missingLabels: detailSummary.missingLabels,
      followUpLevel: progress?.followUpLevel ?? null,
      gateView,
    })
    const runtimeToday = runtimeDays.find((day) => day.dayIndex === suggestedTodayIndex) ?? runtimeDays[0] ?? null
    const dayFocusLabel = runtimeToday?.focusItems[0]?.title ?? runtimeToday?.allItems[0]?.title ?? null
    const nextMilestoneLabel = buildNextMilestoneLabel({
      currentStageKey,
      statusKey: statusMeta.statusKey,
      primaryMissingLabel,
      dayFocusLabel,
      followUpLevel: progress?.followUpLevel ?? null,
      gateView,
    })
    const quickNote = primaryMissingLabel
      ?? buildShortNote({
        reminderLabel: getReminderLabel(progress?.followUpLevel),
        firstShiftNote: progress?.firstShiftNote,
        assignedBuddyName: assignedBuddy.assignedBuddyName,
        firstShiftLabel: progress?.firstShiftLabel,
        followUpLevel: progress?.followUpLevel ?? null,
        tone: checklist.some((item) => !item.done && item.severity === 'block') ? 'block' : detailSummary.tone,
        missingLabels: detailSummary.missingLabels,
      })
    const stages = buildEmployeeStages({
      onboardingPlanId: onboardingPlan?.id ?? null,
      templateId: onboardingPlan?.template_id ?? null,
      checklist,
      currentStageKey,
      statusKey: statusMeta.statusKey,
      gateView,
      quickNote,
      firstShiftNote: progress?.firstShiftNote ?? '',
      history: progress?.history ?? [],
      unmatchedReason: unmatchedState.unmatchedReason,
    })

    return {
      employeeId: employee.id,
      employeeName: employee.full_name,
      onboardingPlanId: onboardingPlan?.id ?? null,
      currentStageCode: onboardingPlan?.current_stage_code ?? null,
      currentStageKey,
      currentStageLabel: getStageLabel(currentStageKey),
      nextMilestoneLabel,
      primaryMissingLabel,
      statusKey: statusMeta.statusKey,
      statusLabel: statusMeta.statusLabel,
      storeId: employee.store_id,
      storeLabel: getStoreLabel(employee.store_id),
      roleLabel,
      isUnmatched: unmatchedState.isUnmatched,
      unmatchedReason: unmatchedState.unmatchedReason,
      hireDate: employee.hire_date,
      toneLabel: getToneLabel(statusMeta.tone),
      summaryLabel: buildDetailSummaryLabel(statusMeta.tone),
      tone: statusMeta.tone,
      checklist,
      firstShiftOptions: FIRST_SHIFT_OPTIONS,
      selectedFirstShiftKey: progress?.firstShiftKey ?? null,
      buddyCandidates: getBuddyCandidates(employee, currentUser),
      selectedBuddyId: assignedBuddy.assignedBuddyId,
      toolsAccess,
      firstShiftNote: progress?.firstShiftNote ?? '',
      followUpLevel: progress?.followUpLevel ?? null,
      followUpLabel: getFollowUpLabel(progress?.followUpLevel),
      followUpSuggestedLabel: getSuggestedFollowUpLabel(progress?.firstShiftResult),
      quickNote,
      gateView,
      gateRetryItems,
      miniQuizView,
      evaluationTimelineView,
      selfReviewLatest: selfReviewStageView?.latest ?? null,
      selfReviewHistory: selfReviewStageView?.history ?? [],
      history: progress?.history ?? [],
      stages,
      journeyDays,
      runtimeDays,
      suggestedTodayIndex,
    }
  },

  proposeStageGate(employeeId: string, buddyNote: string): void {
    const employee = EmployeeService.getEmployeeById(employeeId)
    if (!employee) return

    const onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id)
    if (!onboardingPlan) return

    proposeOnboardingStageGate({
      employeeId: employee.id,
      onboardingPlanId: onboardingPlan.id,
      stageCode: onboardingPlan.current_stage_code,
      buddyNote,
    })
  },

  approveStageGate(employeeId: string, managerNote: string): void {
    const employee = EmployeeService.getEmployeeById(employeeId)
    if (!employee) return

    const onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id)
    if (!onboardingPlan) return

    approveOnboardingStageGate({
      employeeId: employee.id,
      onboardingPlanId: onboardingPlan.id,
      stageCode: onboardingPlan.current_stage_code,
      managerNote,
    })
  },

  rejectStageGate(employeeId: string, managerNote: string, retryItemIds: string[]): void {
    const employee = EmployeeService.getEmployeeById(employeeId)
    if (!employee) return

    const onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id)
    if (!onboardingPlan) return

    rejectOnboardingStageGate({
      employeeId: employee.id,
      onboardingPlanId: onboardingPlan.id,
      stageCode: onboardingPlan.current_stage_code,
      managerNote,
      retryItemIds,
    })
  },

  updateChecklist(employeeId: string, payload: OnboardingOpsCompletionPayload): void {
    const current = loadProgress()
    const existing = current[employeeId] ?? {}
    const nextValue =
      payload.key === 'first_shift'
        ? {
            ...existing,
            firstShiftKey: payload.firstShiftKey,
            firstShiftLabel: payload.firstShiftLabel,
          }
        : payload.key === 'buddy'
          ? {
              ...existing,
              assignedBuddyId: payload.assignedBuddyId,
              assignedBuddyName: payload.assignedBuddyName,
            }
          : payload.key === 'uniform_attendance_policy'
            ? { ...existing, storePolicyConfirmed: payload.storePolicyConfirmed }
            : payload.key === 'tools_and_group'
              ? {
                  ...existing,
                  chatGroupJoined: payload.chatGroupJoined ?? existing.chatGroupJoined ?? false,
                  toolAccountReady: payload.toolAccountReady ?? existing.toolAccountReady ?? false,
                }
              : payload.key === 'first_shift_result'
                ? {
                    ...existing,
                    firstShiftResult: payload.firstShiftResult,
                    followUpLevel: getSuggestedFollowUpLevel(payload.firstShiftResult) ?? existing.followUpLevel,
                  }
                : payload.key === 'first_shift_note'
                  ? { ...existing, firstShiftNote: payload.firstShiftNote }
                  : { ...existing, followUpLevel: payload.followUpLevel }
    const historyMessage = buildHistoryMessage(payload)
    const shouldAppendHistory =
      historyMessage
      && (
        payload.key === 'first_shift'
        ? existing.firstShiftKey !== payload.firstShiftKey
        : payload.key === 'buddy'
          ? existing.assignedBuddyId !== payload.assignedBuddyId
          : payload.key === 'uniform_attendance_policy'
            ? !existing.storePolicyConfirmed
            : payload.key === 'tools_and_group'
              ? existing.chatGroupJoined !== nextValue.chatGroupJoined || existing.toolAccountReady !== nextValue.toolAccountReady
              : payload.key === 'first_shift_result'
                ? existing.firstShiftResult !== payload.firstShiftResult
                : payload.key === 'first_shift_note'
                  ? (existing.firstShiftNote ?? '') !== payload.firstShiftNote
                  : existing.followUpLevel !== payload.followUpLevel
      )

    saveProgress({
      ...current,
      [employeeId]: {
        ...nextValue,
        history: shouldAppendHistory && historyMessage
          ? appendHistory(existing.history, historyMessage)
          : existing.history ?? [],
      },
    })
  },

  assignBuddy(employeeId: string, mentorId: string, currentUser: AuthUser): void {
    const employee = EmployeeService.getEmployeeById(employeeId, currentUser)
    const mentor = EmployeeService.getEmployeeById(mentorId, currentUser) || EmployeeService.getEmployeeById(mentorId)

    if (!employee || !mentor || mentor.store_id !== employee.store_id) {
      return
    }

    const activeBuddy = getActiveBuddyForMentee(employeeId)
    if (!activeBuddy) {
      createBuddyAssignment(mentorId, employeeId, employee.store_id)
    }

    this.updateChecklist(employeeId, {
      key: 'buddy',
      assignedBuddyId: mentorId,
      assignedBuddyName: mentor.full_name,
    })
  },
}












