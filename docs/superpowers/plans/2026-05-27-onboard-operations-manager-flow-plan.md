# Onboard Operations Manager Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xay flow onboard van hanh de quan ly cua hang quet nhanh nguoi sap vao lam, mo checklist tung nguoi, va chot ket qua sau ca dau theo rule block/can hoan tat som.

**Architecture:** Giu du lieu mock/localStorage hien co, khong doi backend. Tach logic moi vao mot service rieng de tinh danh sach, rule do-vang-xanh, 2 muc thieu chinh, va checklist chi tiet; sau do cho man manager va man setting doc cung nguon nay. Setting chia 2 tang: mac dinh toan he thong luu trong settings chung, override cua hang luu rieng va chi mo mot tap muc gioi han.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand auth, localStorage-backed services, Tailwind CSS v4, ESLint.

---

## File Map

- Modify: `src/lib/career-path-types.ts`
  Responsibility: them type cho onboarding van hanh, block rule, store override, item checklist, ket qua sau ca dau.
- Modify: `src/lib/career-path-service.ts`
  Responsibility: doc/ghi setting mac dinh toan he thong va override theo cua hang.
- Modify: `src/lib/services/onboarding-policy-service.ts`
  Responsibility: tiep tuc la nguon du lieu nen cho policy/noi quy de service moi co the doc chung.
- Create: `src/lib/services/onboarding-operations-service.ts`
  Responsibility: tong hop du lieu nhan vien + policy + setting de tra ra danh sach tong, checklist chi tiet, status do-vang-xanh, va thao tac cap nhat tung muc.
- Modify: `src/app/career-path/onboarding/page.tsx`
  Responsibility: doi man onboarding manager hien tai thanh man danh sach tong + checklist tung nguoi.
- Create: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
  Responsibility: cot trai hien danh sach nguoi sap vao lam, toi da 2 muc thieu chinh, trang thai tong.
- Create: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
  Responsibility: cot phai hien checklist `truoc ngay dau` va `sau ca dau`, thao tac nhanh cho quan ly.
- Modify: `src/app/career-path/settings/page.tsx`
  Responsibility: them khu setting 2 tang cho onboard van hanh.
- Modify: `docs/CODEMAP.md`
  Responsibility: cap nhat diem vao file moi sau khi code xong.
- Modify: `docs/KNOWN_ISSUES.md`
  Responsibility: ghi lai bug moi neu trong qua trinh code phat hien va fix.

## Task 1: Dinh nghia model va storage cho setting 2 tang

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Modify: `src/lib/career-path-service.ts`
- Test: `npx eslint src/lib/career-path-types.ts src/lib/career-path-service.ts`

- [ ] **Step 1: Them type cho rule mac dinh va override cua hang**

Chen cac type moi gan cum settings/onboarding types trong `src/lib/career-path-types.ts`:

```ts
export type OnboardingOpsChecklistKey =
  | 'first_shift'
  | 'buddy'
  | 'uniform_attendance_policy'
  | 'tools_and_group'
  | 'first_shift_result'

export type OnboardingOpsSeverity = 'block' | 'attention'

export interface OnboardingOpsRuleItem {
  key: OnboardingOpsChecklistKey
  label: string
  severity: OnboardingOpsSeverity
  store_override_allowed: boolean
}

export interface OnboardingOpsStoreOverride {
  store_id: string
  block_keys: OnboardingOpsChecklistKey[]
  reminder_days_before_start: number
  alert_roles: Array<'hr_admin' | 'store_manager'>
}

export interface OnboardingOpsSettings {
  enabled: boolean
  lookahead_days: number
  rules: OnboardingOpsRuleItem[]
  store_overrides: OnboardingOpsStoreOverride[]
}
```

- [ ] **Step 2: Mo rong shape settings chung**

Trong type settings tong o `src/lib/career-path-types.ts`, them field moi:

```ts
  onboarding_operations: OnboardingOpsSettings;
```

Neu file dang dung inline object type cho settings, chen full shape:

```ts
  onboarding_operations: {
    enabled: boolean;
    lookahead_days: number;
    rules: OnboardingOpsRuleItem[];
    store_overrides: OnboardingOpsStoreOverride[];
  };
```

- [ ] **Step 3: Seed default setting trong `career-path-service`**

Them default value gan khu `getSettings()` / default settings:

```ts
const defaultOnboardingOperationsSettings: OnboardingOpsSettings = {
  enabled: true,
  lookahead_days: 7,
  rules: [
    { key: 'first_shift', label: 'Ca dau va gio co mat', severity: 'attention', store_override_allowed: true },
    { key: 'buddy', label: 'Nguoi kem / nguoi huong dan', severity: 'block', store_override_allowed: true },
    { key: 'uniform_attendance_policy', label: 'Dong phuc, cham cong, noi quy tai quan', severity: 'attention', store_override_allowed: true },
    { key: 'tools_and_group', label: 'Tai khoan, nhom chat, cong cu', severity: 'attention', store_override_allowed: true },
    { key: 'first_shift_result', label: 'Xac nhan xong ca dau on', severity: 'attention', store_override_allowed: false },
  ],
  store_overrides: [],
}
```

Va merge vao object settings tong:

```ts
  onboarding_operations: saved.onboarding_operations ?? defaultOnboardingOperationsSettings,
```

- [ ] **Step 4: Them ham cap nhat override theo cua hang**

Trong `src/lib/career-path-service.ts`, them helper:

```ts
export function upsertOnboardingOperationsStoreOverride(input: OnboardingOpsStoreOverride) {
  const settings = getSettings()
  const nextOverrides = settings.onboarding_operations.store_overrides.some((item) => item.store_id === input.store_id)
    ? settings.onboarding_operations.store_overrides.map((item) => (item.store_id === input.store_id ? input : item))
    : [...settings.onboarding_operations.store_overrides, input]

  updateSettings({
    onboarding_operations: {
      ...settings.onboarding_operations,
      store_overrides: nextOverrides,
    },
  })
}
```

- [ ] **Step 5: Run lint cho task 1**

Run: `npx eslint src/lib/career-path-types.ts src/lib/career-path-service.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 1**

```bash
git add src/lib/career-path-types.ts src/lib/career-path-service.ts
git commit -m "feat: add onboarding operations settings model"
```

## Task 2: Tao service tong hop status danh sach va checklist chi tiet

**Files:**
- Create: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/lib/services/onboarding-policy-service.ts`
- Test: `npx eslint src/lib/services/onboarding-operations-service.ts src/lib/services/onboarding-policy-service.ts`

- [ ] **Step 1: Them type cho row danh sach va detail checklist**

Tao file `src/lib/services/onboarding-operations-service.ts` va khai bao:

```ts
import { getSettings } from '@/lib/career-path-service'
import { EmployeeService } from '@/lib/services/employee-service'
import { OnboardingPolicyService, type EmployeeOnboardingPolicyRecord } from '@/lib/services/onboarding-policy-service'
import type { AuthUser } from '@/store/auth-store'
import type {
  OnboardingOpsChecklistKey,
  OnboardingOpsRuleItem,
} from '@/lib/career-path-types'

export type OnboardingOpsStatusTone = 'block' | 'attention' | 'ready'

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
  phase: 'before_first_shift' | 'after_first_shift'
  done: boolean
  severity: 'block' | 'attention'
  summary: string
}

export interface OnboardingOpsEmployeeDetail {
  employeeId: string
  employeeName: string
  hireDate: string
  summaryLabel: string
  tone: OnboardingOpsStatusTone
  checklist: OnboardingOpsChecklistItem[]
}
```

- [ ] **Step 2: Viet helper merge rule he thong voi override cua hang**

Trong cung file, them helper:

```ts
function resolveStoreRules(storeId: string) {
  const settings = getSettings().onboarding_operations
  const override = settings.store_overrides.find((item) => item.store_id === storeId)
  const overrideSet = new Set(override?.block_keys ?? [])

  return settings.rules.map((rule) => ({
    ...rule,
    severity:
      rule.store_override_allowed && overrideSet.has(rule.key)
        ? 'block'
        : rule.severity,
  }))
}
```

- [ ] **Step 3: Viet helper suy ra checklist detail tu employee + policy**

Tao ham thuần:

```ts
function buildChecklistItems(input: {
  employee: AuthUser
  policyRecord: EmployeeOnboardingPolicyRecord | null
  assignedBuddyName?: string | null
  hasChatAccess: boolean
  firstShiftLabel?: string
  storePolicyConfirmed: boolean
  firstShiftResult?: 'pass' | 'follow_up' | 'issue'
}) {
  return [
    {
      key: 'first_shift',
      label: 'Ca đầu và giờ có mặt',
      phase: 'before_first_shift',
      done: Boolean(input.firstShiftLabel),
      summary: input.firstShiftLabel ? input.firstShiftLabel : 'Chưa chốt ca đầu và giờ có mặt',
    },
    {
      key: 'buddy',
      label: 'Người kèm / người hướng dẫn',
      phase: 'before_first_shift',
      done: Boolean(input.assignedBuddyName),
      summary: input.assignedBuddyName ? `Người kèm: ${input.assignedBuddyName}` : 'Chưa gán người kèm',
    },
    {
      key: 'uniform_attendance_policy',
      label: 'Đồng phục, chấm công, nội quy tại quán',
      phase: 'before_first_shift',
      done: Boolean(input.policyRecord?.full_sent_at) && input.storePolicyConfirmed,
      summary: input.storePolicyConfirmed ? 'Đã nhắc lại nội quy tại quán và kiểm tra chấm công' : 'Chưa xác nhận nội quy/chấm công tại quán',
    },
    {
      key: 'tools_and_group',
      label: 'Tài khoản, nhóm chat, công cụ',
      phase: 'before_first_shift',
      done: input.hasChatAccess,
      summary: input.hasChatAccess ? 'Đã vào nhóm chat và đủ công cụ cơ bản' : 'Chưa vào nhóm chat hoặc thiếu công cụ',
    },
    {
      key: 'first_shift_result',
      label: 'Xác nhận xong ca đầu ổn',
      phase: 'after_first_shift',
      done: Boolean(input.firstShiftResult),
      summary: input.firstShiftResult === 'pass'
        ? 'Đã chốt ổn sau ca đầu'
        : input.firstShiftResult === 'follow_up'
        ? 'Ổn một phần, cần theo sát thêm'
        : input.firstShiftResult === 'issue'
        ? 'Có vấn đề, cần xử lý ngay'
        : 'Chưa chốt kết quả sau ca đầu',
    },
  ] as const
}
```

- [ ] **Step 4: Viet ham tra row danh sach voi toi da 2 muc thieu**

Them ham public:

```ts
function summarizeMissing(items: ReturnType<typeof buildChecklistItems>, rules: OnboardingOpsRuleItem[]) {
  const ruleMap = new Map(rules.map((rule) => [rule.key, rule]))
  const missing = items
    .filter((item) => !item.done && item.phase === 'before_first_shift')
    .map((item) => ({
      label: item.summary,
      severity: ruleMap.get(item.key)?.severity ?? 'attention',
    }))

  const hasBlock = missing.some((item) => item.severity === 'block')
  const tone: OnboardingOpsStatusTone = hasBlock ? 'block' : missing.length > 0 ? 'attention' : 'ready'
  return {
    tone,
    toneLabel: tone === 'block' ? 'Block ngày đầu' : tone === 'attention' ? 'Cần hoàn tất sớm' : 'Sẵn sàng',
    missingLabels: missing.slice(0, 2).map((item) => item.label),
    hiddenMissingCount: Math.max(0, missing.length - 2),
  }
}
```

Va expose service:

```ts
export const OnboardingOperationsService = {
  getUpcomingRows(currentUser: AuthUser) {
    const employees = EmployeeService.getEmployees(currentUser).filter((employee) => employee.status !== 'resigned')
    return employees
      .filter((employee) => employee.hire_date)
      .map((employee) => {
        const policyRecord = OnboardingPolicyService.ensureRecordFromEmployee(employee)
        const rules = resolveStoreRules(employee.store_id)
        const checklist = buildChecklistItems({
          employee,
          policyRecord,
          assignedBuddyName: null,
          hasChatAccess: false,
          firstShiftLabel: '',
          storePolicyConfirmed: Boolean(policyRecord?.confirmed_at_store_at),
        })
        const summary = summarizeMissing(checklist, rules)
        return {
          employeeId: employee.id,
          employeeName: employee.full_name,
          storeId: employee.store_id,
          storeLabel: employee.department_name ?? employee.store_id,
          roleLabel: employee.job_level ?? employee.role,
          hireDate: employee.hire_date,
          ...summary,
        }
      })
  },
}
```

- [ ] **Step 5: Them thao tac cap nhat checklist tung muc**

Trong service moi, them mutator localStorage nho:

```ts
export type OnboardingOpsCompletionPayload =
  | { key: 'first_shift'; firstShiftLabel: string }
  | { key: 'buddy'; assignedBuddyName: string }
  | { key: 'uniform_attendance_policy'; storePolicyConfirmed: true }
  | { key: 'tools_and_group'; hasChatAccess: true }
  | { key: 'first_shift_result'; firstShiftResult: 'pass' | 'follow_up' | 'issue' }
```

Va public methods:

```ts
type StoredOnboardingOpsProgress = Record<
  string,
  {
    firstShiftLabel?: string
    assignedBuddyName?: string
    storePolicyConfirmed?: boolean
    hasChatAccess?: boolean
    firstShiftResult?: 'pass' | 'follow_up' | 'issue'
  }
>

function loadProgress(): StoredOnboardingOpsProgress {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as StoredOnboardingOpsProgress
  } catch {
    return {}
  }
}

function saveProgress(next: StoredOnboardingOpsProgress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export const OnboardingOperationsService = {
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
  getEmployeeDetail(employeeId: string, currentUser: AuthUser): OnboardingOpsEmployeeDetail | null {
    const employee = EmployeeService.getEmployeeById(employeeId, currentUser)
    if (!employee) return null

    const progress = loadProgress()[employeeId] ?? {}
    const policyRecord = OnboardingPolicyService.ensureRecordFromEmployee(employee)
    const rules = resolveStoreRules(employee.store_id)
    const checklist = buildChecklistItems({
      employee,
      policyRecord,
      assignedBuddyName: progress.assignedBuddyName ?? null,
      hasChatAccess: Boolean(progress.hasChatAccess),
      firstShiftLabel: progress.firstShiftLabel,
      storePolicyConfirmed: Boolean(progress.storePolicyConfirmed || policyRecord?.confirmed_at_store_at),
      firstShiftResult: progress.firstShiftResult,
    }).map((item) => ({
      ...item,
      severity: rules.find((rule) => rule.key === item.key)?.severity ?? 'attention',
    }))

    const summary = summarizeMissing(checklist, rules)
    return {
      employeeId: employee.id,
      employeeName: employee.full_name,
      hireDate: employee.hire_date,
      summaryLabel:
        summary.tone === 'block'
          ? 'Cần xử lý ít nhất 1 mục block trước ngày đầu'
          : summary.tone === 'attention'
          ? 'Còn vài mục cần hoàn tất sớm'
          : 'Đã đủ điều kiện trước ngày đầu',
      tone: summary.tone,
      checklist,
    }
  },
}
```

Luu du lieu rieng theo key moi:

```ts
const STORAGE_KEY = 'homies_onboarding_operations_v1'
```

- [ ] **Step 6: Run lint cho task 2**

Run: `npx eslint src/lib/services/onboarding-operations-service.ts src/lib/services/onboarding-policy-service.ts`
Expected: exit code `0`

- [ ] **Step 7: Commit task 2**

```bash
git add src/lib/services/onboarding-operations-service.ts src/lib/services/onboarding-policy-service.ts
git commit -m "feat: add onboarding operations service"
```

## Task 3: Doi man manager onboarding thanh list + detail

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Create: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- Create: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Test: `npx eslint src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx`

- [ ] **Step 1: Tach UI cot trai va cot phai thanh 2 component**

Tao `src/components/onboarding-operations/UpcomingOnboardingList.tsx`:

```tsx
import type { OnboardingOpsListRow } from '@/lib/services/onboarding-operations-service'

export function UpcomingOnboardingList(props: {
  rows: OnboardingOpsListRow[]
  selectedEmployeeId: string | null
  onSelect: (employeeId: string) => void
}) {
  return (
    <div className="space-y-3">
      {props.rows.map((row) => (
        <button
          key={row.employeeId}
          type="button"
          onClick={() => props.onSelect(row.employeeId)}
          className="w-full rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-[var(--text-muted)]">{row.hireDate}</p>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{row.employeeName}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{row.roleLabel} • {row.storeLabel}</p>
            </div>
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold">{row.toneLabel}</span>
          </div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            {row.missingLabels.join(', ')}{row.hiddenMissingCount > 0 ? ` +${row.hiddenMissingCount} mục` : ''}
          </p>
        </button>
      ))}
    </div>
  )
}
```

Tao `src/components/onboarding-operations/OperationsChecklistDetail.tsx`:

```tsx
import type { OnboardingOpsEmployeeDetail } from '@/lib/services/onboarding-operations-service'

export function OperationsChecklistDetail(props: {
  detail: OnboardingOpsEmployeeDetail | null
  onQuickComplete: (payload: { employeeId: string; key: string; value?: string }) => void
}) {
  if (!props.detail) {
    return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">Chọn 1 người để xem checklist.</div>
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs text-[var(--text-muted)]">{props.detail.hireDate}</p>
      <h2 className="text-lg font-semibold text-[var(--heading-color)]">{props.detail.employeeName}</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{props.detail.summaryLabel}</p>
      {/* render groups before_first_shift and after_first_shift here */}
    </div>
  )
}
```

- [ ] **Step 2: Thay page cu bang shell manager moi**

Trong `src/app/career-path/onboarding/page.tsx`, doi logic mau demo `emp-003` sang manager shell:

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { OnboardingOperationsService } from '@/lib/services/onboarding-operations-service'
import { UpcomingOnboardingList } from '@/components/onboarding-operations/UpcomingOnboardingList'
import { OperationsChecklistDetail } from '@/components/onboarding-operations/OperationsChecklistDetail'

export default function CareerPathOnboardingPage() {
  const user = useAuthStore((state) => state.user)
  const rows = useMemo(() => (user ? OnboardingOperationsService.getUpcomingRows(user) : []), [user])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(rows[0]?.employeeId ?? null)
  const detail = useMemo(
    () => (user && selectedEmployeeId ? OnboardingOperationsService.getEmployeeDetail(selectedEmployeeId, user) : null),
    [selectedEmployeeId, user],
  )

  return (
    <div className="min-h-screen bg-[var(--page-bg)] px-4 py-4 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <UpcomingOnboardingList rows={rows} selectedEmployeeId={selectedEmployeeId} onSelect={setSelectedEmployeeId} />
        <OperationsChecklistDetail detail={detail} onQuickComplete={() => {}} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Them thao tac nhanh trong detail**

Trong `OperationsChecklistDetail.tsx`, render 5 nhom va 3 ket qua sau ca dau:

```tsx
{afterShiftItems.map((item) => (
  <div key={item.key} className="rounded-2xl border border-black/5 bg-[var(--card-bg)] p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.summary}</p>
      </div>
      {!item.done && item.key === 'first_shift_result' ? (
        <div className="flex gap-2">
          <button type="button" onClick={() => props.onQuickComplete({ employeeId: props.detail.employeeId, key: item.key, value: 'pass' })}>Ổn</button>
          <button type="button" onClick={() => props.onQuickComplete({ employeeId: props.detail.employeeId, key: item.key, value: 'follow_up' })}>Theo sát thêm</button>
          <button type="button" onClick={() => props.onQuickComplete({ employeeId: props.detail.employeeId, key: item.key, value: 'issue' })}>Có vấn đề</button>
        </div>
      ) : null}
    </div>
  </div>
))}
```

- [ ] **Step 4: Ap rule UI Homies**

Chinh class/inline token theo palette Homies:

```tsx
const toneClassMap = {
  block: 'bg-[color:color-mix(in_srgb,var(--error)_12%,white)] text-[var(--error)]',
  attention: 'bg-[color:color-mix(in_srgb,var(--warning)_18%,white)] text-[var(--warning-strong)]',
  ready: 'bg-[var(--success-soft)] text-[var(--success)]',
}
```

Khong do toan card. Chi nhan vao badge nho, text thong diep, va border rat nhe.

- [ ] **Step 5: Run lint cho task 3**

Run: `npx eslint src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx`
Expected: exit code `0`

- [ ] **Step 6: Commit task 3**

```bash
git add src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx
git commit -m "feat: add manager onboarding operations workspace"
```

## Task 4: Them setting 2 tang vao trang settings

**Files:**
- Modify: `src/app/career-path/settings/page.tsx`
- Modify: `src/lib/career-path-service.ts`
- Test: `npx eslint src/app/career-path/settings/page.tsx src/lib/career-path-service.ts`

- [ ] **Step 1: Doc settings moi trong page**

Trong `src/app/career-path/settings/page.tsx`, lay setting:

```ts
const settings = getSettings()
const onboardingOps = settings.onboarding_operations
```

Va tao state local cho editing:

```ts
const [opsDraft, setOpsDraft] = useState(() => onboardingOps)
```

- [ ] **Step 2: Render khu mac dinh toan he thong**

Them section moi co id ro de deep link:

```tsx
<section id="onboarding-operations" className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
  <div className="flex items-start justify-between gap-3">
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Onboard vận hành</p>
      <h2 className="text-lg font-semibold text-[var(--heading-color)]">Rule mặc định toàn hệ thống</h2>
    </div>
  </div>
  {opsDraft.rules.map((rule) => (
    <label key={rule.key} className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3">
      <span className="text-sm text-[var(--text-primary)]">{rule.label}</span>
      <select
        value={rule.severity}
        onChange={(event) => {
          const nextSeverity = event.target.value as 'block' | 'attention'
          setOpsDraft((current) => ({
            ...current,
            rules: current.rules.map((item) => (item.key === rule.key ? { ...item, severity: nextSeverity } : item)),
          }))
        }}
      >
        <option value="block">Block ngày đầu</option>
        <option value="attention">Cần hoàn tất sớm</option>
      </select>
    </label>
  ))}
</section>
```

- [ ] **Step 3: Render override theo cua hang, chi mo muc duoc phep**

Trong cung page, tao UI:

```tsx
{storeOptions.map((store) => {
  const override = opsDraft.store_overrides.find((item) => item.store_id === store.id) ?? {
    store_id: store.id,
    block_keys: [],
    reminder_days_before_start: 1,
    alert_roles: ['store_manager'],
  }

  return (
    <div key={store.id} className="rounded-2xl border border-black/5 p-4">
      <h3 className="text-sm font-semibold">{store.name}</h3>
      {opsDraft.rules.filter((rule) => rule.store_override_allowed).map((rule) => (
        <label key={rule.key} className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={override.block_keys.includes(rule.key)}
            onChange={() => toggleStoreBlockKey(store.id, rule.key)}
          />
          <span>{rule.label}</span>
        </label>
      ))}
    </div>
  )
})}
```

- [ ] **Step 4: Luu setting qua service**

Noi nut save vao `updateSettings` + `upsertOnboardingOperationsStoreOverride`:

```ts
updateSettings({
  onboarding_operations: {
    ...opsDraft,
    store_overrides: opsDraft.store_overrides,
  },
})
```

- [ ] **Step 5: Run lint cho task 4**

Run: `npx eslint src/app/career-path/settings/page.tsx src/lib/career-path-service.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 4**

```bash
git add src/app/career-path/settings/page.tsx src/lib/career-path-service.ts
git commit -m "feat: add onboarding operations settings"
```

## Task 5: Wiring, docs, verify cuoi

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md` (chi neu co bug moi duoc fix trong qua trinh code)
- Test: `npx eslint src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/lib/services/onboarding-operations-service.ts src/app/career-path/settings/page.tsx src/lib/career-path-service.ts src/lib/career-path-types.ts`
- Test: `npm run build`

- [ ] **Step 1: Noi thao tac quick-complete vao page**

Trong `src/app/career-path/onboarding/page.tsx`, noi callback:

```tsx
const handleQuickComplete = (payload: { employeeId: string; key: string; value?: string }) => {
  if (payload.key === 'buddy' && payload.value) {
    OnboardingOperationsService.updateChecklist(payload.employeeId, { key: 'buddy', assignedBuddyName: payload.value })
  }
  if (payload.key === 'first_shift_result' && payload.value) {
    OnboardingOperationsService.updateChecklist(payload.employeeId, {
      key: 'first_shift_result',
      firstShiftResult: payload.value as 'pass' | 'follow_up' | 'issue',
    })
  }
  startTransition(() => {
    setRevision((value) => value + 1)
  })
}
```

Va truyen vao detail:

```tsx
<OperationsChecklistDetail detail={detail} onQuickComplete={handleQuickComplete} />
```

- [ ] **Step 2: Cap nhat CODEMAP cho file moi**

Them vao muc `Noi quy nhan viec va onboarding` trong `docs/CODEMAP.md`:

```md
- File chinh: `src/lib/services/onboarding-policy-service.ts`, `src/lib/services/onboarding-operations-service.ts`, `src/app/career-path/onboarding/page.tsx`, `src/components/onboarding-operations/*`, `src/app/career-path/settings/page.tsx`
- Dung khi: sua onboard van hanh do quan ly cua hang cam chinh, rule block/can hoan tat som, danh sach nguoi sap vao lam va checklist chi tiet
```

- [ ] **Step 3: Ghi KNOWN_ISSUES neu co bug moi va da fix**

Chi them dong moi neu thuc te co mot bug phat sinh duoc fix trong pass nay:

```md
- Da fix YYYY-MM-DD: ... | nguyen nhan: ... | cach fix: ... | file lien quan: ...
```

Neu khong phat hien bug moi, bo qua buoc ghi file nay.

- [ ] **Step 4: Run lint tong**

Run:

```bash
npx eslint src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/lib/services/onboarding-operations-service.ts src/app/career-path/settings/page.tsx src/lib/career-path-service.ts src/lib/career-path-types.ts
```

Expected: exit code `0`

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: build thanh cong, khong co loi prerender hoac hook usage.

- [ ] **Step 6: Manual verify**

Mo local:

```bash
npm run dev
```

Kiem tra:

1. vao `/career-path/onboarding` bang role `store_manager`
2. thay danh sach nguoi sap vao lam trong `7 ngay toi`
3. moi dong chi hien toi da `2 muc thieu chinh`
4. dong co thieu `nguoi kem` hien `Block ngày đầu`
5. bam 1 nguoi mo ra checklist tach `Trước ngày đầu` va `Sau ca đầu`
6. doi setting o `/career-path/settings#onboarding-operations`, quay lai page va thay trang thai cap nhat dung
7. chot `Ổn`, `Theo sát thêm`, `Có vấn đề` sau ca dau va thay detail doi ngay

- [ ] **Step 7: Commit task 5**

```bash
git add src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/lib/services/onboarding-operations-service.ts src/app/career-path/settings/page.tsx src/lib/career-path-service.ts src/lib/career-path-types.ts docs/CODEMAP.md docs/KNOWN_ISSUES.md
git commit -m "feat: add onboarding operations manager flow"
```

## Spec Coverage Check

- Vai tro `quan ly cua hang cam chinh`: Task 3 + Task 5 doi man manager workspace.
- `2 lop` danh sach tong -> checklist tung nguoi: Task 2 + Task 3.
- `Do / vang / xanh`: Task 2.
- `Setting 2 tang`: Task 1 + Task 4.
- `Toi da 2 muc thieu chinh`: Task 2 + Task 3.
- `Checklist 5 nhom` va `3 ket qua sau ca dau`: Task 2 + Task 3.
- `Rule UI Homies`: Task 3.
- `CODEMAP / KNOWN_ISSUES / verify`: Task 5.

## Placeholder Scan

- Khong dung `TODO`, `TBD`, hoac “sua sau”.
- Moi task da co file, code mau, lenh verify, va commit checkpoint.
