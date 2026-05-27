import type {
  OnboardingOpsChecklistKey,
  OnboardingOpsRuleItem,
  OnboardingOpsSeverity,
} from '@/lib/career-path-types'
import { getSettings } from '@/lib/career-path-service'
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

export interface OnboardingOpsChecklistItem {
  key: OnboardingOpsChecklistKey
  label: string
  phase: OnboardingOpsChecklistPhase
  done: boolean
  severity: OnboardingOpsSeverity
  summary: string
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
}

export interface OnboardingOpsEmployeeDetail {
  employeeId: string
  employeeName: string
  storeId: string
  storeLabel: string
  roleLabel: string
  hireDate: string
  tone: OnboardingOpsStatusTone
  toneLabel: 'Block ngày đầu' | 'Cần hoàn tất sớm' | 'Sẵn sàng'
  summaryLabel: string
  checklist: OnboardingOpsChecklistItem[]
}

type OnboardingOpsStoredProgress = Record<
  string,
  {
    firstShiftLabel?: string
    assignedBuddyName?: string
    storePolicyConfirmed?: boolean
    hasChatAccess?: boolean
    firstShiftResult?: OnboardingOpsFirstShiftResult
  }
>

export type OnboardingOpsCompletionPayload =
  | { key: 'first_shift'; firstShiftLabel: string }
  | { key: 'buddy'; assignedBuddyName: string }
  | { key: 'uniform_attendance_policy'; storePolicyConfirmed: true }
  | { key: 'tools_and_group'; hasChatAccess: true }
  | { key: 'first_shift_result'; firstShiftResult: OnboardingOpsFirstShiftResult }

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function diffInDays(fromIsoDate: string, toIsoDate: string) {
  const from = new Date(`${fromIsoDate}T00:00:00`)
  const to = new Date(`${toIsoDate}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

function loadProgress(): OnboardingOpsStoredProgress {
  if (typeof window === 'undefined') return {}

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as OnboardingOpsStoredProgress
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveProgress(next: OnboardingOpsStoredProgress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function resolveStoreRules(storeId: string): OnboardingOpsRuleItem[] {
  const settings = getSettings().onboarding_operations
  const override = settings?.store_overrides?.find((item) => item.store_id === storeId)
  const overrideSet = new Set(override?.block_keys ?? [])

  return (settings?.rules ?? []).map((rule) => ({
    ...rule,
    severity: rule.store_override_allowed && overrideSet.has(rule.key) ? 'block' : rule.severity,
  }))
}

function buildChecklistItems(input: {
  policyRecord: EmployeeOnboardingPolicyRecord | null
  progress: OnboardingOpsStoredProgress[string] | undefined
}): Omit<OnboardingOpsChecklistItem, 'severity'>[] {
  const { policyRecord, progress } = input
  const firstShiftLabel = progress?.firstShiftLabel?.trim()
  const assignedBuddyName = progress?.assignedBuddyName?.trim()
  const storePolicyConfirmed = Boolean(progress?.storePolicyConfirmed || policyRecord?.confirmed_at_store_at)
  const hasChatAccess = Boolean(progress?.hasChatAccess)
  const firstShiftResult = progress?.firstShiftResult

  return [
    {
      key: 'first_shift',
      label: 'Ca đầu và giờ có mặt',
      phase: 'before_first_shift',
      done: Boolean(firstShiftLabel),
      summary: firstShiftLabel || 'Chưa chốt ca đầu và giờ có mặt',
    },
    {
      key: 'buddy',
      label: 'Người kèm / người hướng dẫn',
      phase: 'before_first_shift',
      done: Boolean(assignedBuddyName),
      summary: assignedBuddyName ? `Người kèm: ${assignedBuddyName}` : 'Chưa gán người kèm',
    },
    {
      key: 'uniform_attendance_policy',
      label: 'Đồng phục, chấm công, nội quy tại quán',
      phase: 'before_first_shift',
      done: storePolicyConfirmed,
      summary: storePolicyConfirmed
        ? 'Đã nhắc lại nội quy tại quán và kiểm tra chấm công'
        : 'Chưa xác nhận nội quy/chấm công tại quán',
    },
    {
      key: 'tools_and_group',
      label: 'Tài khoản, nhóm chat, công cụ',
      phase: 'before_first_shift',
      done: hasChatAccess,
      summary: hasChatAccess ? 'Đã vào nhóm chat và đủ công cụ cơ bản' : 'Chưa vào nhóm chat hoặc thiếu công cụ',
    },
    {
      key: 'first_shift_result',
      label: 'Xác nhận xong ca đầu ổn',
      phase: 'after_first_shift',
      done: Boolean(firstShiftResult),
      summary:
        firstShiftResult === 'pass'
          ? 'Đã chốt ổn sau ca đầu'
          : firstShiftResult === 'follow_up'
          ? 'Ổn một phần, cần theo sát thêm'
          : firstShiftResult === 'issue'
          ? 'Có vấn đề, cần xử lý ngay'
          : 'Chưa chốt kết quả sau ca đầu',
    },
  ]
}

function enrichChecklist(
  items: Omit<OnboardingOpsChecklistItem, 'severity'>[],
  rules: OnboardingOpsRuleItem[],
): OnboardingOpsChecklistItem[] {
  const severityMap = new Map(rules.map((rule) => [rule.key, rule.severity]))

  return items.map((item) => ({
    ...item,
    severity: severityMap.get(item.key) ?? 'attention',
  }))
}

function summarizeChecklist(items: OnboardingOpsChecklistItem[]) {
  const missing = items.filter((item) => !item.done && item.phase === 'before_first_shift')
  const hasBlock = missing.some((item) => item.severity === 'block')
  const tone: OnboardingOpsStatusTone = hasBlock ? 'block' : missing.length > 0 ? 'attention' : 'ready'

  return {
    tone,
    toneLabel:
      tone === 'block' ? 'Block ngày đầu' : tone === 'attention' ? 'Cần hoàn tất sớm' : 'Sẵn sàng',
    missingLabels: missing.slice(0, 2).map((item) => item.summary),
    hiddenMissingCount: Math.max(0, missing.length - 2),
    summaryLabel:
      tone === 'block'
        ? 'Cần xử lý ít nhất 1 mục block trước ngày đầu'
        : tone === 'attention'
        ? 'Còn vài mục cần hoàn tất sớm'
        : 'Đã đủ điều kiện trước ngày đầu',
  }
}

function shouldIncludeEmployee(hireDate: string | undefined, lookaheadDays: number) {
  if (!hireDate) return false

  const dayDiff = diffInDays(todayIsoDate(), hireDate)
  return dayDiff >= 0 && dayDiff <= lookaheadDays
}

export const OnboardingOperationsService = {
  getUpcomingRows(currentUser: AuthUser): OnboardingOpsListRow[] {
    const settings = getSettings().onboarding_operations
    const lookaheadDays = settings?.lookahead_days ?? 7
    const progress = loadProgress()

    return EmployeeService.getEmployees(currentUser)
      .filter((employee) => employee.status !== 'resigned')
      .filter((employee) => shouldIncludeEmployee(employee.hire_date, lookaheadDays))
      .map((employee) => {
        const policyRecord = OnboardingPolicyService.ensureRecordFromEmployee(employee)
        const items = enrichChecklist(buildChecklistItems({ policyRecord, progress: progress[employee.id] }), resolveStoreRules(employee.store_id))
        const summary = summarizeChecklist(items)

        return {
          employeeId: employee.id,
          employeeName: employee.full_name,
          storeId: employee.store_id,
          storeLabel: employee.department_name || employee.store_id,
          roleLabel: employee.job_level || employee.role,
          hireDate: employee.hire_date,
          tone: summary.tone,
          toneLabel: summary.toneLabel,
          missingLabels: summary.missingLabels,
          hiddenMissingCount: summary.hiddenMissingCount,
        }
      })
      .sort((left, right) => left.hireDate.localeCompare(right.hireDate) || left.employeeName.localeCompare(right.employeeName))
  },

  getEmployeeDetail(employeeId: string, currentUser: AuthUser): OnboardingOpsEmployeeDetail | null {
    const employee = EmployeeService.getEmployeeById(employeeId, currentUser)
    if (!employee) return null

    const progress = loadProgress()
    const policyRecord = OnboardingPolicyService.ensureRecordFromEmployee(employee)
    const items = enrichChecklist(
      buildChecklistItems({ policyRecord, progress: progress[employee.id] }),
      resolveStoreRules(employee.store_id),
    )
    const summary = summarizeChecklist(items)

    return {
      employeeId: employee.id,
      employeeName: employee.full_name,
      storeId: employee.store_id,
      storeLabel: employee.department_name || employee.store_id,
      roleLabel: employee.job_level || employee.role,
      hireDate: employee.hire_date,
      tone: summary.tone,
      toneLabel: summary.toneLabel,
      summaryLabel: summary.summaryLabel,
      checklist: items,
    }
  },

  updateChecklist(employeeId: string, payload: OnboardingOpsCompletionPayload) {
    const current = loadProgress()
    const existing = current[employeeId] ?? {}

    const nextValue =
      payload.key === 'first_shift'
        ? { ...existing, firstShiftLabel: payload.firstShiftLabel }
        : payload.key === 'buddy'
        ? { ...existing, assignedBuddyName: payload.assignedBuddyName }
        : payload.key === 'uniform_attendance_policy'
        ? { ...existing, storePolicyConfirmed: true }
        : payload.key === 'tools_and_group'
        ? { ...existing, hasChatAccess: true }
        : { ...existing, firstShiftResult: payload.firstShiftResult }

    saveProgress({
      ...current,
      [employeeId]: nextValue,
    })
  },
}
