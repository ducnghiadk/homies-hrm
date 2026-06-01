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
    unmatchedReason: resolvedRole.unmatched_reason ?? 'Nh\u00E2n vi\u00EAn n\u00E0y c\u1EA7n \u0111\u01B0\u1EE3c map role onboarding tr\u01B0\u1EDBc.',
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
    return '\u0110\u00E3 v\u00E0o nh\u00F3m chat, c\u00F2n thi\u1EBFu tool l\u00E0m vi\u1EC7c'
  }

  if (toolsAccess.toolAccountReady) {
    return '\u0110\u00E3 c\u00F3 tool l\u00E0m vi\u1EC7c, c\u00F2n thi\u1EBFu nh\u00F3m chat'
  }

  return 'Ch\u01B0a \u0111\u1EE7 nh\u00F3m chat v\u00E0 tool l\u00E0m vi\u1EC7c'
}

function getFollowUpLabel(level?: OnboardingOpsFollowUpLevel | null) {
  if (level === 'same_day') return 'G\u1ECDi l\u1EA1i trong ng\u00E0y'
  if (level === 'next_day') return 'Check l\u1EA1i ng\u00E0y mai'
  if (level === 'not_needed') return 'Kh\u00F4ng c\u1EA7n follow-up th\u00EAm'
  return 'Ch\u01B0a ch\u1ED1t follow-up sau ca'
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
    ?                   `G\u1EE3i \u00FD m\u1EB7c \u0111\u1ECBnh: ${getFollowUpLabel(suggested)}`
    : 'Ch\u1ECDn k\u1EBFt qu\u1EA3 sau ca \u0111\u1EC3 h\u1EC7 th\u1ED1ng g\u1EE3i \u00FD follow-up m\u1EB7c \u0111\u1ECBnh.'
}

function getReminderLabel(level?: OnboardingOpsFollowUpLevel | null) {
  if (level === 'same_day') return 'C\u1EA7n g\u1ECDi l\u1EA1i trong ng\u00E0y'
  if (level === 'next_day') return 'C\u1EA7n check l\u1EA1i ng\u00E0y mai'
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
  if (params.firstShiftNote) return '\u0110\u00E3 l\u01B0u ghi ch\u00FA ca \u0111\u1EA7u'
  if (!params.assignedBuddyName) return 'Ch\u01B0a ch\u1ED1t ng\u01B0\u1EDDi k\u00E8m'
  if (!params.firstShiftLabel) return 'Ch\u01B0a ch\u1ED1t ca \u0111\u1EA7u'
  if (params.followUpLevel === 'not_needed') return '\u0110\u00E3 ch\u1ED1t kh\u00F4ng c\u1EA7n follow-up'
  if (params.tone === 'ready') return '\u0110\u00E3 \u0111\u1EE7 b\u01B0\u1EDBc tr\u01B0\u1EDBc ng\u00E0y \u0111\u1EA7u'
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
      updates.push(payload.toolAccountReady ? '\u0111\u00E3 \u0111\u1EE7 tool l\u00E0m vi\u1EC7c' : '\u0111\u00E3 b\u1ECF tr\u1EA1ng th\u00E1i \u0111\u1EE7 tool l\u00E0m vi\u1EC7c')
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

  return `\u0110\u00E3 ch\u1ED1t follow-up: ${getFollowUpLabel(payload.followUpLevel)}`
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
      reason: 'Role onboarding đang thiếu template hoặc trùng mapping.',
    }
  }

  if (configSummary.unmatchedEmployeeCount > 0 || rows.some((row) => row.priorityKey !== 'ready')) {
    return {
      key: 'review',
      label: 'Cần rà soát',
      reason: 'Còn nhân sự mới hoặc ngoại lệ cần xử lý.',
    }
  }

  return {
    key: 'stable',
    label: 'Ổn định',
    reason: 'Không có block ngày đầu hay lỗi cấu hình mở.',
  }
}

function buildUrgentItems(
  rows: OnboardingOpsListRow[],
  configSummary: OnboardingOverviewConfigSummary,
): OnboardingOverviewUrgentItem[] {
  const items: OnboardingOverviewUrgentItem[] = []

  const firstUnmatched = rows.find((row) => row.isUnmatched)
  if (firstUnmatched) {
    items.push({
      id: `unmatched-${firstUnmatched.employeeId}`,
      kind: 'unmatched',
      label: firstUnmatched.employeeName,
      detail: firstUnmatched.unmatchedReason ?? 'Chưa khớp role onboarding.',
      ctaLabel: 'Xử lý unmatched',
      priorityKey: 'block_day_one',
    })
  }

  const firstBlock = rows.find((row) => row.priorityKey === 'block_day_one' && !row.isUnmatched)
  if (firstBlock) {
    items.push({
      id: `block-${firstBlock.employeeId}`,
      kind: 'employee',
      label: firstBlock.employeeName,
      detail: firstBlock.shortNote,
      ctaLabel: 'Xử lý ngay',
      priorityKey: 'block_day_one',
    })
  }

  if (configSummary.missingTemplateCount > 0) {
    items.push({
      id: 'config-missing-template',
      kind: 'config',
      label: 'Role đang thiếu template',
      detail: `${configSummary.missingTemplateCount} role active chưa gắn template checklist.`,
      ctaLabel: 'Rà soát role và template',
      priorityKey: 'block_day_one',
    })
  }

  const firstFollowUp = rows.find((row) => row.priorityKey === 'need_follow_up')
  if (firstFollowUp) {
    items.push({
      id: `follow-up-${firstFollowUp.employeeId}`,
      kind: 'employee',
      label: firstFollowUp.employeeName,
      detail: firstFollowUp.shortNote,
      ctaLabel: 'Theo dõi tiếp',
      priorityKey: 'need_follow_up',
    })
  }

  if (configSummary.duplicateMappingCount > 0) {
    items.push({
      id: 'config-duplicate-mapping',
      kind: 'config',
      label: 'Role bị trùng mapping',
      detail: `${configSummary.duplicateMappingCount} vị trí đang map vào nhiều role active.`,
      ctaLabel: 'Mở cấu hình onboarding',
      priorityKey: 'block_day_one',
    })
  }

  return items.slice(0, 5)
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
    const allRows = getUpcomingEmployees(currentUser).map((employee) => {
      const employeeProgress = progress[employee.id]
      const { summary } = buildEmployeeChecklist(employee, currentUser, employeeProgress)
      const onboardingPlan = getEmployeeOnboardingChecklistPlan(employee.id)
      const unmatchedState = getUnmatchedOnboardingState(employee, onboardingPlan)
      const reminderLabel = getReminderLabel(employeeProgress?.followUpLevel)
      const assignedBuddy = resolveAssignedBuddy(employee, currentUser, employeeProgress)
      const rowSummary = unmatchedState.isUnmatched
        ? {
            tone: 'block' as const,
            toneLabel: getToneLabel('block'),
            missingLabels: ['Chưa map role onboarding'],
            hiddenMissingCount: 0,
          }
        : summary

      return {
        employeeId: employee.id,
        employeeName: employee.full_name,
        storeId: employee.store_id,
        storeLabel: getStoreLabel(employee.store_id),
        roleLabel: getConfiguredRoleLabel(employee, onboardingPlan),
        isUnmatched: unmatchedState.isUnmatched,
        unmatchedReason: unmatchedState.unmatchedReason,
        hireDate: employee.hire_date,
        ...rowSummary,
        followUpLevel: employeeProgress?.followUpLevel ?? null,
        reminderLabel,
        shortNote: unmatchedState.isUnmatched
          ? 'Cần map role onboarding trước khi tạo checklist'
          : buildShortNote({
              reminderLabel,
              firstShiftNote: employeeProgress?.firstShiftNote,
              assignedBuddyName: assignedBuddy.assignedBuddyName,
              firstShiftLabel: employeeProgress?.firstShiftLabel,
              followUpLevel: employeeProgress?.followUpLevel ?? null,
              tone: rowSummary.tone,
              missingLabels: rowSummary.missingLabels,
            }),
        priorityKey: unmatchedState.isUnmatched
          ? 'block_day_one'
          : getPriorityKey({
              tone: rowSummary.tone,
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

    const configSummary = buildConfigSummary()
    const systemStatus = buildSystemStatus(configSummary, allRows)
    const urgentItems = buildUrgentItems(allRows, configSummary)

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
      systemStatus,
      configSummary,
      urgentItems,
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

    if (unmatchedState.isUnmatched && !onboardingPlan) {
      return {
        employeeId: employee.id,
        employeeName: employee.full_name,
        onboardingPlanId: null,
        currentStageCode: null,
        storeId: employee.store_id,
        storeLabel: getStoreLabel(employee.store_id),
        roleLabel,
        isUnmatched: true,
        unmatchedReason: unmatchedState.unmatchedReason,
        hireDate: employee.hire_date,
        toneLabel: getToneLabel('block'),
        summaryLabel: 'Chưa auto-assign vì chưa match role onboarding',
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
        quickNote: 'Vào Career Path Settings để map chức danh vào role onboarding và chọn template.',
        gateView: null,
        gateRetryItems: [],
        miniQuizView: null,
        evaluationTimelineView: null,
        selfReviewLatest: null,
        selfReviewHistory: [],
        history: progress?.history ?? [],
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

    return {
      employeeId: employee.id,
      employeeName: employee.full_name,
      onboardingPlanId: onboardingPlan?.id ?? null,
      currentStageCode: onboardingPlan?.current_stage_code ?? null,
      storeId: employee.store_id,
      storeLabel: getStoreLabel(employee.store_id),
      roleLabel,
      isUnmatched: unmatchedState.isUnmatched,
      unmatchedReason: unmatchedState.unmatchedReason,
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
      miniQuizView,
      evaluationTimelineView,
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






