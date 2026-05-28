import type {
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
  getOnboardingChecklistItems,
  getOnboardingChecklistStages,
  getOnboardingStageGateView,
  getOnboardingSelfReviewStageView,
  getSettings,
  proposeOnboardingStageGate,
  rejectOnboardingStageGate,
} from '@/lib/career-path-service'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { EmployeeService } from '@/lib/services/employee-service'
import {
  OnboardingPolicyService,
  type EmployeeOnboardingPolicyRecord,
} from '@/lib/services/onboarding-policy-service'
import type { AuthUser } from '@/store/auth-store'

const STORAGE_KEY = 'homies_onboarding_operations_v1'
const MS_PER_DAY = 24 * 60 * 60 * 1000

export type OnboardingOpsStatusTone = 'block' | 'attention' | 'ready'
export type OnboardingOpsChecklistPhase = 'before_first_shift' | 'after_first_shift'
export type OnboardingOpsFirstShiftResult = 'pass' | 'follow_up' | 'issue'
export type OnboardingOpsFollowUpLevel = 'same_day' | 'next_day' | 'not_needed'
export type OnboardingOpsPriorityFilter = 'all' | 'block_day_one' | 'need_follow_up' | 'ready'

export interface OnboardingOpsHistoryEntry {
  id: string
  message: string
  createdAt: string
}

export interface OnboardingOpsListRow {
  employeeId: string
  employeeName: string
  storeId: string
  storeLabel: string
  roleLabel: string
  hireDate: string
  tone: OnboardingOpsStatusTone
  toneLabel: 'Block ngày đầu' | 'Cần hoàn tất sớm' | 'Sẵn sàng'
  missingLabels: string[]
  hiddenMissingCount: number
  followUpLevel: OnboardingOpsFollowUpLevel | null
  reminderLabel: string | null
  shortNote: string
  priorityKey: Exclude<OnboardingOpsPriorityFilter, 'all'>
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

export interface OnboardingOpsWorkspaceOverview {
  rows: OnboardingOpsListRow[]
  allRows: OnboardingOpsListRow[]
  filters: OnboardingOpsQuickFilter[]
  stats: OnboardingOpsWorkspaceStat[]
  activeFilter: OnboardingOpsPriorityFilter
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
  storeId: string
  storeLabel: string
  roleLabel: string
  hireDate: string
  toneLabel: 'Block ngày đầu' | 'Cần hoàn tất sớm' | 'Sẵn sàng'
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
  selfReviewLatest: OnboardingSelfReviewEntry | null
  selfReviewHistory: OnboardingSelfReviewEntry[]
  history: OnboardingOpsHistoryEntry[]
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
    label: 'Ca sáng 07:30 • có mặt 07:15',
    windowLabel: 'Sáng',
    tone: 'morning',
  },
  {
    id: 'shift-midday',
    label: 'Ca giữa 13:00 • có mặt 12:45',
    windowLabel: 'Giữa ngày',
    tone: 'midday',
  },
  {
    id: 'shift-evening',
    label: 'Ca tối 17:30 • có mặt 17:15',
    windowLabel: 'Tối',
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

function getStoreLabel(storeId: string) {
  const store = mockStores.find((item) => item.id === storeId)
  if (!store) return storeId
  return store.name.replace('Homies Milk Tea - ', '')
}

function getRoleLabel(employee: AuthUser) {
  return mockPositions.find((item) => item.id === employee.position_id)?.name
    || employee.job_level
    || employee.role
}

function getToneLabel(tone: OnboardingOpsStatusTone): OnboardingOpsListRow['toneLabel'] {
  if (tone === 'block') return 'Block ngày đầu'
  if (tone === 'attention') return 'Cần hoàn tất sớm'
  return 'Sẵn sàng'
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
    return 'Đã vào nhóm chat và đủ công cụ cơ bản'
  }

  if (toolsAccess.chatGroupJoined) {
    return 'Đã vào nhóm chat, còn thiếu tool làm việc'
  }

  if (toolsAccess.toolAccountReady) {
    return 'Đã có tool làm việc, còn thiếu nhóm chat'
  }

  return 'Chưa đủ nhóm chat và tool làm việc'
}

function getFollowUpLabel(level?: OnboardingOpsFollowUpLevel | null) {
  if (level === 'same_day') return 'Gọi lại trong ngày'
  if (level === 'next_day') return 'Check lại ngày mai'
  if (level === 'not_needed') return 'Không cần follow-up thêm'
  return 'Chưa chốt follow-up sau ca'
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
    : 'Chọn kết quả sau ca để hệ thống gợi ý follow-up mặc định.'
}

function getReminderLabel(level?: OnboardingOpsFollowUpLevel | null) {
  if (level === 'same_day') return 'Cần gọi lại trong ngày'
  if (level === 'next_day') return 'Cần check lại ngày mai'
  return null
}

function getPriorityKey(row: Pick<OnboardingOpsListRow, 'tone' | 'followUpLevel'>): Exclude<OnboardingOpsPriorityFilter, 'all'> {
  if (row.tone === 'block') return 'block_day_one'
  if (row.followUpLevel === 'same_day' || row.followUpLevel === 'next_day') return 'need_follow_up'
  return 'ready'
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
  if (params.followUpLevel === 'not_needed') return 'Đã chốt không cần follow-up'
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
  if (payload.key === 'first_shift') return `Đã chốt ca đầu: ${payload.firstShiftLabel}`
  if (payload.key === 'buddy') return `Đã chốt người kèm: ${payload.assignedBuddyName}`
  if (payload.key === 'uniform_attendance_policy') return 'Đã xác nhận nội quy và chấm công tại quán'
  if (payload.key === 'tools_and_group') {
    const updates: string[] = []

    if (payload.chatGroupJoined !== undefined) {
      updates.push(payload.chatGroupJoined ? 'đã vào nhóm chat' : 'đã bỏ trạng thái vào nhóm chat')
    }

    if (payload.toolAccountReady !== undefined) {
      updates.push(payload.toolAccountReady ? 'đã đủ tool làm việc' : 'đã bỏ trạng thái đủ tool làm việc')
    }

    return updates.length > 0 ? `Cập nhật công cụ: ${updates.join(', ')}` : null
  }

  if (payload.key === 'first_shift_result') {
    if (payload.firstShiftResult === 'pass') return 'Đã chốt kết quả ca đầu: Ổn'
    if (payload.firstShiftResult === 'follow_up') return 'Đã chốt kết quả ca đầu: Theo sát thêm'
    return 'Đã chốt kết quả ca đầu: Có vấn đề'
  }

  if (payload.key === 'first_shift_note') {
    return payload.firstShiftNote ? 'Đã lưu ghi chú ca đầu' : 'Đã xóa ghi chú ca đầu'
  }

  return `Đã chốt follow-up: ${getFollowUpLabel(payload.followUpLevel)}`
}

function matchesFilter(row: OnboardingOpsListRow, filter: OnboardingOpsPriorityFilter) {
  if (filter === 'all') return true
  return row.priorityKey === filter
}

function buildChecklistItems(input: BuildChecklistInput): ChecklistDraftItem[] {
  return [
    {
      key: 'first_shift',
      phase: 'before_first_shift',
      done: Boolean(input.firstShiftLabel),
      summary: input.firstShiftLabel
        ? input.firstShiftLabel
        : 'Chưa chốt ca đầu và giờ có mặt',
    },
    {
      key: 'buddy',
      phase: 'before_first_shift',
      done: Boolean(input.assignedBuddyName),
      summary: input.assignedBuddyName
        ? `Người kèm: ${input.assignedBuddyName}`
        : 'Chưa gán người kèm',
    },
    {
      key: 'uniform_attendance_policy',
      phase: 'before_first_shift',
      done: Boolean(input.policyRecord?.full_sent_at) && input.storePolicyConfirmed,
      summary: input.storePolicyConfirmed
        ? 'Đã nhắc lại nội quy tại quán và kiểm tra chấm công'
        : 'Chưa xác nhận nội quy/chấm công tại quán',
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
          ? 'Đã chốt ổn sau ca đầu'
          : input.firstShiftResult === 'follow_up'
            ? 'Ổn một phần, cần theo sát thêm'
            : input.firstShiftResult === 'issue'
              ? 'Có vấn đề, cần xử lý ngay'
              : 'Chưa chốt kết quả sau ca đầu',
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
  if (tone === 'block') return 'Cần xử lý ít nhất 1 mục block trước ngày đầu'
  if (tone === 'attention') return 'Còn vài mục cần hoàn tất sớm'
  return 'Đã đủ điều kiện trước ngày đầu'
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
        roleLabel: getRoleLabel(candidate),
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
    const allRows = getUpcomingEmployees(currentUser).map((employee) => {
      const employeeProgress = progress[employee.id]
      const { summary } = buildEmployeeChecklist(employee, currentUser, employeeProgress)
      const reminderLabel = getReminderLabel(employeeProgress?.followUpLevel)
      const assignedBuddy = resolveAssignedBuddy(employee, currentUser, employeeProgress)

      return {
        employeeId: employee.id,
        employeeName: employee.full_name,
        storeId: employee.store_id,
        storeLabel: getStoreLabel(employee.store_id),
        roleLabel: getRoleLabel(employee),
        hireDate: employee.hire_date,
        ...summary,
        followUpLevel: employeeProgress?.followUpLevel ?? null,
        reminderLabel,
        shortNote: buildShortNote({
          reminderLabel,
          firstShiftNote: employeeProgress?.firstShiftNote,
          assignedBuddyName: assignedBuddy.assignedBuddyName,
          firstShiftLabel: employeeProgress?.firstShiftLabel,
          followUpLevel: employeeProgress?.followUpLevel ?? null,
          tone: summary.tone,
          missingLabels: summary.missingLabels,
        }),
        priorityKey: getPriorityKey({
          tone: summary.tone,
          followUpLevel: employeeProgress?.followUpLevel ?? null,
        }),
      }
    }).sort((left, right) => {
      const priorityOrder = {
        block_day_one: 0,
        need_follow_up: 1,
        ready: 2,
      } as const

      return priorityOrder[left.priorityKey] - priorityOrder[right.priorityKey]
        || left.hireDate.localeCompare(right.hireDate)
        || left.employeeName.localeCompare(right.employeeName)
    })

    return {
      rows: allRows.filter((row) => matchesFilter(row, activeFilter)),
      allRows,
      filters: [
        { key: 'all', label: 'Tất cả', count: allRows.length },
        { key: 'block_day_one', label: 'Block ngày đầu', count: allRows.filter((row) => row.priorityKey === 'block_day_one').length },
        { key: 'need_follow_up', label: 'Cần follow-up', count: allRows.filter((row) => row.priorityKey === 'need_follow_up').length },
        { key: 'ready', label: 'Sẵn sàng', count: allRows.filter((row) => row.priorityKey === 'ready').length },
      ],
      stats: [
        { key: 'upcoming', label: 'Sắp vào làm', value: allRows.length },
        { key: 'block', label: 'Còn block', value: allRows.filter((row) => row.tone === 'block').length },
        {
          key: 'follow_up',
          label: 'Cần follow-up sau ca',
          value: allRows.filter((row) => row.followUpLevel === 'same_day' || row.followUpLevel === 'next_day').length,
        },
      ],
      activeFilter,
    }
  },

  getEmployeeDetail(employeeId: string, currentUser: AuthUser): OnboardingOpsEmployeeDetail | null {
    const employee = EmployeeService.getEmployeeById(employeeId, currentUser)
    if (!employee) return null

    const progress = loadProgress()[employeeId]
    const { checklist, summary, toolsAccess, assignedBuddy } = buildEmployeeChecklist(employee, currentUser, progress)
    const onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id)
    const selfReviewStageView = onboardingPlan
      ? getOnboardingSelfReviewStageView(employee.id, onboardingPlan.id, onboardingPlan.current_stage_code)
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

    return {
      employeeId: employee.id,
      employeeName: employee.full_name,
      onboardingPlanId: onboardingPlan?.id ?? null,
      currentStageCode: onboardingPlan?.current_stage_code ?? null,
      storeId: employee.store_id,
      storeLabel: getStoreLabel(employee.store_id),
      roleLabel: getRoleLabel(employee),
      hireDate: employee.hire_date,
      toneLabel: summary.toneLabel,
      summaryLabel: buildDetailSummaryLabel(summary.tone),
      tone: summary.tone,
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
      quickNote: buildShortNote({
        reminderLabel: getReminderLabel(progress?.followUpLevel),
        firstShiftNote: progress?.firstShiftNote,
        assignedBuddyName: assignedBuddy.assignedBuddyName,
        firstShiftLabel: progress?.firstShiftLabel,
        followUpLevel: progress?.followUpLevel ?? null,
        tone: summary.tone,
        missingLabels: summary.missingLabels,
      }),
      gateView,
      gateRetryItems,
      selfReviewLatest: selfReviewStageView?.latest ?? null,
      selfReviewHistory: selfReviewStageView?.history ?? [],
      history: progress?.history ?? [],
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
