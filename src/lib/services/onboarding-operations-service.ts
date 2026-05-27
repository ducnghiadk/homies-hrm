import type {
  OnboardingOpsChecklistKey,
  OnboardingOpsRuleItem,
  OnboardingOpsSeverity,
} from '@/lib/career-path-types'
import { getSettings } from '@/lib/career-path-service'
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
}

export interface OnboardingOpsChecklistItem {
  key: OnboardingOpsChecklistKey
  label: string
  phase: OnboardingOpsChecklistPhase
  done: boolean
  severity: OnboardingOpsSeverity
  summary: string
}

export interface OnboardingOpsEmployeeDetail {
  employeeId: string
  employeeName: string
  storeId: string
  storeLabel: string
  roleLabel: string
  hireDate: string
  toneLabel: 'Block ngày đầu' | 'Cần hoàn tất sớm' | 'Sẵn sàng'
  summaryLabel: string
  tone: OnboardingOpsStatusTone
  checklist: OnboardingOpsChecklistItem[]
}

export type OnboardingOpsCompletionPayload =
  | { key: 'first_shift'; firstShiftLabel: string }
  | { key: 'buddy'; assignedBuddyName: string }
  | { key: 'uniform_attendance_policy'; storePolicyConfirmed: true }
  | { key: 'tools_and_group'; hasChatAccess: true }
  | { key: 'first_shift_result'; firstShiftResult: OnboardingOpsFirstShiftResult }

export type StoredOnboardingOpsProgress = Record<
  string,
  {
    firstShiftLabel?: string
    assignedBuddyName?: string
    storePolicyConfirmed?: boolean
    hasChatAccess?: boolean
    firstShiftResult?: OnboardingOpsFirstShiftResult
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
  hasChatAccess: boolean
  firstShiftLabel?: string
  storePolicyConfirmed: boolean
  firstShiftResult?: OnboardingOpsFirstShiftResult
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
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

function buildChecklistItems(input: BuildChecklistInput): ChecklistDraftItem[] {
  return [
    {
      key: 'first_shift',
      phase: 'before_first_shift',
      done: Boolean(input.firstShiftLabel),
      summary: input.firstShiftLabel
        ? input.firstShiftLabel
        : 'Chua chot ca dau va gio co mat',
    },
    {
      key: 'buddy',
      phase: 'before_first_shift',
      done: Boolean(input.assignedBuddyName),
      summary: input.assignedBuddyName
        ? `Nguoi kem: ${input.assignedBuddyName}`
        : 'Chua gan nguoi kem',
    },
    {
      key: 'uniform_attendance_policy',
      phase: 'before_first_shift',
      done: Boolean(input.policyRecord?.full_sent_at) && input.storePolicyConfirmed,
      summary: input.storePolicyConfirmed
        ? 'Da nhac lai noi quy tai quan va kiem tra cham cong'
        : 'Chua xac nhan noi quy/cham cong tai quan',
    },
    {
      key: 'tools_and_group',
      phase: 'before_first_shift',
      done: input.hasChatAccess,
      summary: input.hasChatAccess
        ? 'Da vao nhom chat va du cong cu co ban'
        : 'Chua vao nhom chat hoac thieu cong cu',
    },
    {
      key: 'first_shift_result',
      phase: 'after_first_shift',
      done: Boolean(input.firstShiftResult),
      summary:
        input.firstShiftResult === 'pass'
          ? 'Da chot on sau ca dau'
          : input.firstShiftResult === 'follow_up'
            ? 'On mot phan, can theo sat them'
            : input.firstShiftResult === 'issue'
              ? 'Co van de, can xu ly ngay'
              : 'Chua chot ket qua sau ca dau',
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

function buildEmployeeChecklist(employee: AuthUser, progress?: StoredOnboardingOpsProgress[string]) {
  const policyRecord = OnboardingPolicyService.ensureRecordFromEmployee(employee)
  const rules = resolveStoreRules(employee.store_id)
  const draftItems = buildChecklistItems({
    policyRecord,
    assignedBuddyName: progress?.assignedBuddyName ?? null,
    hasChatAccess: Boolean(progress?.hasChatAccess),
    firstShiftLabel: progress?.firstShiftLabel,
    storePolicyConfirmed: Boolean(progress?.storePolicyConfirmed || policyRecord?.confirmed_at_store_at),
    firstShiftResult: progress?.firstShiftResult,
  })
  const checklist = mapChecklistItems(draftItems, rules)
  const summary = summarizeMissing(checklist)

  return {
    checklist,
    summary,
  }
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

export const OnboardingOperationsService = {
  getUpcomingRows(currentUser: AuthUser): OnboardingOpsListRow[] {
    const progress = loadProgress()

    return getUpcomingEmployees(currentUser).map((employee) => {
      const { summary } = buildEmployeeChecklist(employee, progress[employee.id])

      return {
        employeeId: employee.id,
        employeeName: employee.full_name,
        storeId: employee.store_id,
        storeLabel: getStoreLabel(employee.store_id),
        roleLabel: getRoleLabel(employee),
        hireDate: employee.hire_date,
        ...summary,
      }
    })
  },

  getEmployeeDetail(employeeId: string, currentUser: AuthUser): OnboardingOpsEmployeeDetail | null {
    const employee = EmployeeService.getEmployeeById(employeeId, currentUser)
    if (!employee) return null

    const progress = loadProgress()[employeeId]
    const { checklist, summary } = buildEmployeeChecklist(employee, progress)

    return {
      employeeId: employee.id,
      employeeName: employee.full_name,
      storeId: employee.store_id,
      storeLabel: getStoreLabel(employee.store_id),
      roleLabel: getRoleLabel(employee),
      hireDate: employee.hire_date,
      toneLabel: summary.toneLabel,
      summaryLabel: buildDetailSummaryLabel(summary.tone),
      tone: summary.tone,
      checklist,
    }
  },

  updateChecklist(employeeId: string, payload: OnboardingOpsCompletionPayload): void {
    const current = loadProgress()
    const existing = current[employeeId] ?? {}
    const nextValue =
      payload.key === 'first_shift'
        ? { ...existing, firstShiftLabel: payload.firstShiftLabel }
        : payload.key === 'buddy'
          ? { ...existing, assignedBuddyName: payload.assignedBuddyName }
          : payload.key === 'uniform_attendance_policy'
            ? { ...existing, storePolicyConfirmed: payload.storePolicyConfirmed }
            : payload.key === 'tools_and_group'
              ? { ...existing, hasChatAccess: payload.hasChatAccess }
              : { ...existing, firstShiftResult: payload.firstShiftResult }

    saveProgress({
      ...current,
      [employeeId]: nextValue,
    })
  },
}
