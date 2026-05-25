# Noi quy onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Them flow gui noi quy nhan viec 2 nhip, co setting toi thieu, co trang thai theo doi ro, va co diem xac nhan cho nhan vien truoc/ngay dau vao lam.

**Architecture:** Giu settings trong cum `career-path settings` vi app da co san cho `onboarding_enabled`, nhung tach nghiep vu noi quy ra mot service rieng de khong lam phinh `employee-service` va `contract-service`. Service moi se luu record theo tung nhan vien trong localStorage, duoc kich hoat o 3 moc dang co san: duyet invitation, gui hop dong, va HR countersign; rieng moc theo ngay se chay theo kieu `sync khi HR/manager mo app` trong `AppShell` de hop voi app mock client-side hien tai.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand auth store, localStorage-backed services, Tailwind CSS v4, ESLint, Next production build.

---

## File Map

- Create: `src/lib/services/onboarding-policy-service.ts`
  Responsibility: luu template noi quy, luu record theo nhan vien, xu ly gui tom tat/gui day du/nhac lai/xac nhan, va tao notification.
- Modify: `src/lib/career-path-types.ts`
  Responsibility: mo rong `CareerPathSettings` voi bo setting toi thieu cho flow noi quy.
- Modify: `src/lib/mock-data-career-path.ts`
  Responsibility: them default setting cho noi quy onboarding.
- Modify: `src/lib/career-path-service.ts`
  Responsibility: tiep tuc dung `getSettings()` / `updateSettings()` de luu bo setting moi.
- Modify: `src/lib/services/employee-service.ts`
  Responsibility: goi hook noi quy khi HR duyet invitation va tao employee moi.
- Modify: `src/lib/services/contract-service.ts`
  Responsibility: goi hook noi quy khi HR gui hop dong va khi HR countersign.
- Modify: `src/components/layout/AppShell.tsx`
  Responsibility: chay `syncDueAutomation()` cho HR/manager de xu ly moc gui theo ngay va nhac lai trong moi truong mock.
- Modify: `src/app/career-path/settings/page.tsx`
  Responsibility: them card setting `Noi quy nhan viec` trong tab `Chung`.
- Modify: `src/app/employees/contracts/[id]/page.tsx`
  Responsibility: hien trang thai noi quy, moc gui, va nut gui lai/giai quyet tai cho ben canh action hop dong.
- Modify: `src/app/employees/[id]/page.tsx`
  Responsibility: hien tong quan noi quy, lich su gui/xac nhan, va thao tac day-1 cho HR/quan ly.
- Modify: `src/app/onboarding/page.tsx`
  Responsibility: cho nhan vien doc noi quy day du, bam `Toi da doc` hoac `Toi can HR giai thich them`, va dong bo buoc noi quy trong checklist onboarding.
- Modify: `docs/CODEMAP.md`
  Responsibility: cap nhat diem vao dung file moi va cac man hinh co noi quy onboarding.

## Implementation Notes

- Giu scope pass dau o muc MVP, KHONG them quiz, e-sign rieng, hay chia noi quy qua sau theo role.
- Dung `system` notifications hien co, khong can them notification type moi trong pass dau.
- `Summary` va `full policy` nen dung 1 template id duy nhat trong MVP; template co 2 phan noi dung de tranh mo rong setting qua som.
- Khong chen side effect vao cac ham `get*`; chi kich hoat automation trong event hooks (`confirmInvitation`, `sendContract`, `countersign`) va `AppShell`.
- Vi chua co scheduler backend, moc `gui truoc ngay vao lam` va `nhac lai` phai chay qua `syncDueAutomation(user)` khi HR/manager vao app.
- `OnboardingPage` dang dung `mock-data-p5.ts`; trong pass dau chi can compute lai task `Noi quy` theo record moi, chua can refactor sang career-path service.
- Moi file moi them vao codebase phai cap nhat `docs/CODEMAP.md`.

### Task 1: Mo rong settings cho flow noi quy onboarding

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Modify: `src/lib/mock-data-career-path.ts`
- Modify: `src/lib/career-path-service.ts`
- Modify: `src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Them truong setting moi vao `CareerPathSettings`**

Chen them block duoi day vao `src/lib/career-path-types.ts` ngay sau `onboarding_enabled`:

```ts
export interface CareerPathSettings {
  buddy_system_enabled: boolean;
  leaderboard_enabled: boolean;
  goals_enabled: boolean;
  endorsements_enabled: boolean;
  notifications_enabled: boolean;
  onboarding_enabled: boolean;
  onboarding_policy_enabled: boolean;
  onboarding_policy_summary_trigger: 'approval_confirm' | 'contract_send';
  onboarding_policy_full_trigger: 'contract_countersign' | 'days_before_start';
  onboarding_policy_full_days_before_start: number;
  onboarding_policy_require_ack: boolean;
  onboarding_policy_max_reminders: number;
  onboarding_policy_template_id: 'default-policy-v1';
  onboarding_policy_alert_scope: 'hr_only' | 'hr_and_store_manager';
  skill_refresh_enabled: boolean;
  cross_training_enabled: boolean;
  trial_duration_days: number;
  max_active_goals: number;
  leaderboard_reset_period: 'monthly' | 'quarterly';
}
```

- [ ] **Step 2: Them default an toan cho setting moi**

Cap nhat `defaultSettings` trong `src/lib/mock-data-career-path.ts`:

```ts
export const defaultSettings: CareerPathSettings = {
  buddy_system_enabled: true,
  leaderboard_enabled: true,
  goals_enabled: true,
  endorsements_enabled: true,
  notifications_enabled: true,
  onboarding_enabled: true,
  onboarding_policy_enabled: true,
  onboarding_policy_summary_trigger: 'contract_send',
  onboarding_policy_full_trigger: 'days_before_start',
  onboarding_policy_full_days_before_start: 1,
  onboarding_policy_require_ack: true,
  onboarding_policy_max_reminders: 1,
  onboarding_policy_template_id: 'default-policy-v1',
  onboarding_policy_alert_scope: 'hr_and_store_manager',
  skill_refresh_enabled: false,
  cross_training_enabled: false,
  trial_duration_days: 14,
  max_active_goals: 3,
  leaderboard_reset_period: 'monthly',
};
```

- [ ] **Step 3: Giu `career-path-service` doc/ghi setting moi ma khong doi API**

Kiem tra `src/lib/career-path-service.ts` va giu nguyyen contract duoi day:

```ts
export function getSettings(): CareerPathSettings { return _settings; }

export function updateSettings(data: Partial<CareerPathSettings>): CareerPathSettings {
  const before = JSON.stringify(_settings);
  _settings = { ..._settings, ...data };
  save(KEYS.settings, _settings);
  logChange('settings', 'global', 'update', before, JSON.stringify(_settings), 'Cap nhat cai dat');
  return _settings;
}
```

Expected:
- khong them API moi
- import/export settings JSON van tu dong mang theo field moi

- [ ] **Step 4: Them card `Noi quy nhan viec` vao `GeneralTab`**

Them mot card rieng trong `src/app/career-path/settings/page.tsx`, khong nhoi vao mang `toggles` hien co:

```tsx
<div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#fffaf0', border: '1px solid #f4d7a1' }}>
  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Noi quy nhan viec</div>

  <FieldRow
    label="Bat flow noi quy"
    control={
      <button onClick={() => patchSettings({ onboarding_policy_enabled: !settings.onboarding_policy_enabled })}>
        {settings.onboarding_policy_enabled ? 'Bat' : 'Tat'}
      </button>
    }
  />

  <FieldRow
    label="Gui tom tat"
    control={
      <select
        value={settings.onboarding_policy_summary_trigger}
        onChange={(event) => patchSettings({ onboarding_policy_summary_trigger: event.target.value as 'approval_confirm' | 'contract_send' })}
      >
        <option value="approval_confirm">Ngay sau duyet ho so</option>
        <option value="contract_send">Luc gui hop dong</option>
      </select>
    }
  />

  <FieldRow
    label="Gui day du"
    control={
      <select
        value={settings.onboarding_policy_full_trigger}
        onChange={(event) => patchSettings({ onboarding_policy_full_trigger: event.target.value as 'contract_countersign' | 'days_before_start' })}
      >
        <option value="contract_countersign">Sau HR countersign</option>
        <option value="days_before_start">Truoc ngay vao lam</option>
      </select>
    }
  />
</div>
```

Them helper nho ngay trong file de update setting ma khong lap code:

```tsx
const patchSettings = (data: Partial<CareerPathSettings>) => {
  updateSettings(data);
  onReload();
};
```

- [ ] **Step 5: Them cac field so/nguyen tac con lai vao card**

Them tiep 4 field sau trong card tren:

```tsx
<FieldRow
  label="Gui truoc ngay vao lam"
  control={
    <input
      type="number"
      min={0}
      max={7}
      value={settings.onboarding_policy_full_days_before_start}
      onChange={(event) => patchSettings({ onboarding_policy_full_days_before_start: Number(event.target.value || 0) })}
    />
  }
/>

<FieldRow
  label="Bat xac nhan"
  control={
    <button onClick={() => patchSettings({ onboarding_policy_require_ack: !settings.onboarding_policy_require_ack })}>
      {settings.onboarding_policy_require_ack ? 'Co' : 'Khong'}
    </button>
  }
/>

<FieldRow
  label="Nhac toi da"
  control={
    <input
      type="number"
      min={0}
      max={5}
      value={settings.onboarding_policy_max_reminders}
      onChange={(event) => patchSettings({ onboarding_policy_max_reminders: Number(event.target.value || 0) })}
    />
  }
/>

<FieldRow
  label="Nguoi nhan canh bao"
  control={
    <select
      value={settings.onboarding_policy_alert_scope}
      onChange={(event) => patchSettings({ onboarding_policy_alert_scope: event.target.value as 'hr_only' | 'hr_and_store_manager' })}
    >
      <option value="hr_only">Chi HR</option>
      <option value="hr_and_store_manager">HR va quan ly cua hang</option>
    </select>
  }
/>
```

- [ ] **Step 6: Run lint cho cum setting**

Run: `npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/app/career-path/settings/page.tsx`

Expected:
- exit code `0`
- neu co warning style, sua ngay trong pass nay

- [ ] **Step 7: Commit cum setting**

```bash
git add src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/app/career-path/settings/page.tsx
git commit -m "feat: add onboarding policy settings"
```

### Task 2: Tao service rieng cho noi quy onboarding va noi event hooks

**Files:**
- Create: `src/lib/services/onboarding-policy-service.ts`
- Modify: `src/lib/services/employee-service.ts`
- Modify: `src/lib/services/contract-service.ts`

- [ ] **Step 1: Tao service moi voi types, template, va localStorage store**

Tao `src/lib/services/onboarding-policy-service.ts` voi khung toi thieu duoi day:

```ts
import { getSettings } from '@/lib/career-path-service'
import { createNotificationDeduped } from '@/lib/notifications/notification-center'
import type { EmployeeInvitation } from '@/lib/mock-data-employee-ext'
import type { AuthUser } from '@/store/auth-store'
import { EmployeeService } from '@/lib/services/employee-service'
import { ContractService, type EmployeeContract } from '@/lib/services/contract-service'

export type OnboardingPolicyStatus =
  | 'chua_gui'
  | 'da_gui_tom_tat'
  | 'da_gui_day_du'
  | 'da_doc'
  | 'da_xac_nhan'
  | 'can_nhac'
  | 'can_giai_thich'

export interface OnboardingPolicyHistoryItem {
  id: string
  at: string
  action: 'summary_sent' | 'full_sent' | 'employee_read' | 'employee_acknowledged' | 'clarification_requested' | 'reminder_sent' | 'store_confirmed'
  actor_name: string
  note: string
}

export interface EmployeeOnboardingPolicyRecord {
  employee_id: string
  employee_name: string
  store_id: string
  hire_date: string
  template_id: 'default-policy-v1'
  status: OnboardingPolicyStatus
  summary_sent_at?: string
  full_sent_at?: string
  read_at?: string
  acknowledged_at?: string
  clarification_requested_at?: string
  last_reminded_at?: string
  reminder_count: number
  confirmed_at_store_at?: string
  latest_contract_id?: string
  history: OnboardingPolicyHistoryItem[]
}
```

Them 1 template MVP trong cung file:

```ts
const POLICY_TEMPLATES = {
  'default-policy-v1': {
    id: 'default-policy-v1',
    summary_points: ['Dong phuc', 'Gio giac', 'Bao nghi', 'Doi ca', 'Ve sinh', 'Tac phong'],
    full_sections: [
      { title: 'Dong phuc', body: 'Mac dong phuc sach se, deo bang ten, dung chuan F&B.' },
      { title: 'Cham cong', body: 'Check-in, di muon, ve som, OT va doi ca deu phai ghi nhan tren app.' },
      { title: 'Van hanh', body: 'Tuan thu quy trinh ve sinh, ban giao, tien mat va ATTP.' },
    ],
  },
} as const
```

- [ ] **Step 2: Them API doc/ghi record va helper lich su**

Trong service moi, them nhom ham nen sau:

```ts
const STORAGE_KEY = 'homies_onboarding_policy_records_v1'

function loadRecords(): EmployeeOnboardingPolicyRecord[] { /* localStorage safe load */ }
function saveRecords(records: EmployeeOnboardingPolicyRecord[]) { /* localStorage safe save */ }
function nowIso() { return new Date().toISOString() }

function pushHistory(
  record: EmployeeOnboardingPolicyRecord,
  action: OnboardingPolicyHistoryItem['action'],
  actorName: string,
  note: string,
) {
  record.history.unshift({
    id: `${record.employee_id}-${action}-${Date.now()}`,
    at: nowIso(),
    action,
    actor_name: actorName,
    note,
  })
}

export const OnboardingPolicyService = {
  getRecord(employeeId: string) { /* ... */ },
  getTemplate(templateId: 'default-policy-v1') { return POLICY_TEMPLATES[templateId] },
  listRecords() { /* ... */ },
}
```

Dung `console.warn` khi parse storage loi, giong pattern service khac trong repo.

- [ ] **Step 3: Them cac event hook chinh cho approve invitation / send contract / countersign**

Them 3 ham event chinh:

```ts
handleInvitationApproved(input: { employee: AuthUser; invitation: EmployeeInvitation; actor?: AuthUser }) {
  const settings = getSettings()
  if (!settings.onboarding_policy_enabled) return null
  const record = this.ensureRecordFromEmployee(input.employee)
  if (settings.onboarding_policy_summary_trigger === 'approval_confirm') {
    this.markSummarySent(record, input.actor?.full_name || 'He thong', 'Gui ban tom tat sau khi HR duyet ho so')
  }
  this.persistRecord(record)
  return record
}

handleContractSent(input: { contract: EmployeeContract; actor: AuthUser }) {
  const settings = getSettings()
  if (!settings.onboarding_policy_enabled || settings.onboarding_policy_summary_trigger !== 'contract_send') return null
  const employee = EmployeeService.getEmployeeById(input.contract.employeeId, input.actor)
  if (!employee) return null
  const record = this.ensureRecordFromEmployee(employee)
  record.latest_contract_id = input.contract.id
  this.markSummarySent(record, input.actor.full_name, 'Gui ban tom tat luc gui hop dong')
  this.persistRecord(record)
  return record
}

handleContractActivated(input: { contract: EmployeeContract; actor: AuthUser }) {
  const settings = getSettings()
  if (!settings.onboarding_policy_enabled || settings.onboarding_policy_full_trigger !== 'contract_countersign') return null
  const employee = EmployeeService.getEmployeeById(input.contract.employeeId, input.actor)
  if (!employee) return null
  const record = this.ensureRecordFromEmployee(employee)
  record.latest_contract_id = input.contract.id
  this.markFullSent(record, input.actor.full_name, 'Gui noi quy day du sau khi HR countersign')
  this.persistRecord(record)
  return record
}
```

- [ ] **Step 4: Noi hook vao `confirmInvitation`, `sendContract`, `countersign`**

Trong `src/lib/services/employee-service.ts`, sau khi `newEmployee` duoc tao va invitation duoc set `approved`, chen:

```ts
OnboardingPolicyService.handleInvitationApproved({
  employee: newEmployee,
  invitation: db[invIndex],
  actor: currentUser,
})
```

Trong `src/lib/services/contract-service.ts`, cap nhat `sendContract()` va `countersign()` de goi hook sau khi `updateContract()` tra ve:

```ts
const updated = await this.updateContract(id, currentUser, contract => ({
  ...contract,
  status: 'pending_employee_sign',
  sentAt: now(),
  auditLogs: [this.makeLog('send', currentUser, 'Gui hop dong cho nhan su ky tren app'), ...contract.auditLogs],
}))

if (updated) {
  OnboardingPolicyService.handleContractSent({ contract: updated, actor: currentUser })
}

return updated
```

Va:

```ts
const updated = await this.updateContract(id, currentUser, contract => ({
  ...contract,
  status: 'active',
  activatedAt: now(),
  signatures: [...contract.signatures.filter(item => item.role !== 'hr'), signature],
  auditLogs: [this.makeLog('hr_countersign', currentUser, 'HR countersign va kich hoat hop dong'), ...contract.auditLogs],
}))

if (updated) {
  OnboardingPolicyService.handleContractActivated({ contract: updated, actor: currentUser })
}

return updated
```

- [ ] **Step 5: Them ham employee acknowledgement va manager day-one confirm**

Hoan tat API tuong tac trong service:

```ts
acknowledge(employeeId: string, actor: AuthUser) { /* set read_at + acknowledged_at + status da_xac_nhan */ }
requestClarification(employeeId: string, actor: AuthUser) { /* set clarification_requested_at + status can_giai_thich */ }
confirmAtStore(employeeId: string, actor: AuthUser) { /* set acknowledged_at neu chua co + confirmed_at_store_at */ }
```

Rules:
- `acknowledge()` chi cho phep employee tu xac nhan record cua minh
- `requestClarification()` dua record ve `can_giai_thich`
- `confirmAtStore()` chi cho phep `ceo`, `hr_admin`, `store_manager`

- [ ] **Step 6: Run lint cho service va hooks**

Run: `npx eslint src/lib/services/onboarding-policy-service.ts src/lib/services/employee-service.ts src/lib/services/contract-service.ts`

Expected:
- exit code `0`

- [ ] **Step 7: Commit cum service + hooks**

```bash
git add src/lib/services/onboarding-policy-service.ts src/lib/services/employee-service.ts src/lib/services/contract-service.ts
git commit -m "feat: wire onboarding policy events"
```

### Task 3: Them mock automation cho gui theo ngay va nhac lai

**Files:**
- Modify: `src/lib/services/onboarding-policy-service.ts`
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Them `syncDueAutomation()` vao service**

Them logic scan record va employee trong service moi:

```ts
syncDueAutomation(currentUser: AuthUser) {
  const settings = getSettings()
  if (!settings.onboarding_policy_enabled) return { fullSent: 0, reminders: 0 }
  if (!['ceo', 'hr_admin', 'store_manager'].includes(currentUser.role)) return { fullSent: 0, reminders: 0 }

  const employees = EmployeeService.getEmployees(currentUser)
  const records = loadRecords()
  let fullSent = 0
  let reminders = 0

  employees.forEach((employee) => {
    const record = this.ensureRecordFromEmployee(employee, records)
    const daysUntilStart = this.diffDays(employee.hire_date)

    if (
      settings.onboarding_policy_full_trigger === 'days_before_start' &&
      !record.full_sent_at &&
      daysUntilStart <= settings.onboarding_policy_full_days_before_start
    ) {
      this.markFullSent(record, currentUser.full_name, 'Gui noi quy day du theo moc truoc ngay vao lam')
      fullSent += 1
    }

    if (
      settings.onboarding_policy_require_ack &&
      record.full_sent_at &&
      !record.acknowledged_at &&
      record.reminder_count < settings.onboarding_policy_max_reminders
    ) {
      this.markReminderSent(record, currentUser.full_name, 'Nhac lai nhan vien doc/xac nhan noi quy')
      reminders += 1
    }
  })

  saveRecords(records)
  return { fullSent, reminders }
}
```

`diffDays()` o day phai tinh theo `YYYY-MM-DD` cua `hire_date`, khong dung gio local lech le.

- [ ] **Step 2: Tao notification cho employee va HR/manager ngay trong helper mark**

Trong `markSummarySent`, `markFullSent`, `markReminderSent`, va `requestClarification`, goi `createNotificationDeduped()` voi `type: 'system'`:

```ts
createNotificationDeduped(
  employeeId,
  'system',
  'Noi quy nhan viec da san sang',
  'Ban vui long doc va xac nhan noi quy truoc ngay vao lam.',
  { action_url: '/onboarding', employee_id: employeeId, policy_stage: 'full' },
  5 * 60 * 1000,
)
```

Va voi HR/quan ly:

```ts
createNotificationDeduped(
  managerId,
  'system',
  'Nhan vien chua xac nhan noi quy',
  `${employeeName} van chua xac nhan noi quy truoc ngay vao lam.`,
  { action_url: `/employees/${employeeId}`, employee_id: employeeId, policy_status: 'can_nhac' },
  5 * 60 * 1000,
)
```

- [ ] **Step 3: Goi sync automation tu `AppShell`**

Them vao `src/components/layout/AppShell.tsx`:

```ts
import { OnboardingPolicyService } from '@/lib/services/onboarding-policy-service'
```

Va them `useEffect` moi sau khi `mounted` san sang:

```ts
useEffect(() => {
  if (!mounted || !user) return
  if (!['ceo', 'hr_admin', 'store_manager'].includes(user.role)) return
  OnboardingPolicyService.syncDueAutomation(user)
}, [mounted, user?.id, user?.role])
```

Muc tieu:
- app mock tu dong tao su kien theo ngay khi HR/manager mo app
- khong chen side effect vao `Header`, `auth-store`, hay `getEmployees()`

- [ ] **Step 4: Run lint cho automation**

Run: `npx eslint src/lib/services/onboarding-policy-service.ts src/components/layout/AppShell.tsx`

Expected:
- exit code `0`

- [ ] **Step 5: Commit cum automation**

```bash
git add src/lib/services/onboarding-policy-service.ts src/components/layout/AppShell.tsx
git commit -m "feat: sync onboarding policy automation"
```

### Task 4: Hien trang thai va thao tac cho HR/quan ly

**Files:**
- Modify: `src/app/employees/contracts/[id]/page.tsx`
- Modify: `src/app/employees/[id]/page.tsx`

- [ ] **Step 1: Them block tong quan noi quy trong trang chi tiet hop dong**

Trong `src/app/employees/contracts/[id]/page.tsx`, sau khi load `contract`, tinh:

```ts
const policyRecord = contract ? OnboardingPolicyService.getRecord(contract.employeeId) : null
const policyTemplate = policyRecord ? OnboardingPolicyService.getTemplate(policyRecord.template_id) : null
const canManagePolicy = Boolean(user && ['ceo', 'hr_admin', 'store_manager'].includes(user.role))
```

Render 1 card moi gan khu action:

```tsx
<section className="rounded-3xl border border-amber-100 bg-amber-50/60 p-5">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Noi quy nhan viec</p>
      <h2 className="mt-1 text-lg font-bold text-slate-900">{policyRecord?.status || 'chua_gui'}</h2>
    </div>
    <p className="text-xs text-slate-500">Tom tat: {policyRecord?.summary_sent_at || 'Chua gui'} · Day du: {policyRecord?.full_sent_at || 'Chua gui'}</p>
  </div>
</section>
```

- [ ] **Step 2: Them nut gui lai / gui tay cho HR**

Trong card tren, neu `canManagePolicy` thi them buttons:

```tsx
<button type="button" onClick={() => runPolicyAction('summary')} className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800">
  Gui lai tom tat
</button>
<button type="button" onClick={() => runPolicyAction('full')} className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white">
  Gui lai noi quy day du
</button>
```

Them handler:

```ts
const runPolicyAction = (mode: 'summary' | 'full') => {
  if (!user || !contract) return
  const result = mode === 'summary'
    ? OnboardingPolicyService.resendSummary(contract.employeeId, user)
    : OnboardingPolicyService.resendFull(contract.employeeId, user)

  setMessage(result ? 'Da cap nhat va gui lai noi quy.' : 'Chua the gui noi quy o trang thai nay.')
  setRefreshKey((current) => current + 1)
}
```

- [ ] **Step 3: Them card lich su va action day-1 vao ho so nhan vien**

Trong `src/app/employees/[id]/page.tsx`, sau khi co `employee`, them:

```ts
const policyRecord = OnboardingPolicyService.getRecord(employee.id)
const policyHistory = policyRecord?.history.slice(0, 5) || []
const canResolvePolicyAtStore = ['ceo', 'hr_admin', 'store_manager'].includes(user.role)
```

Render 1 block trong tab overview:

```tsx
<section className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Noi quy nhan viec</p>
      <h3 className="mt-1 text-lg font-bold text-slate-900">{policyRecord?.status || 'chua_gui'}</h3>
      <p className="mt-1 text-sm text-slate-600">Xac nhan: {policyRecord?.acknowledged_at || 'Chua co'}</p>
    </div>
    {canResolvePolicyAtStore ? (
      <button type="button" onClick={handleConfirmPolicyAtStore} className="inline-flex h-10 items-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white">
        Chot tai cua hang
      </button>
    ) : null}
  </div>
</section>
```

- [ ] **Step 4: Noi handler cho action day-1 va list lich su**

Them handler vao `src/app/employees/[id]/page.tsx`:

```ts
const handleConfirmPolicyAtStore = () => {
  if (!user) return
  const result = OnboardingPolicyService.confirmAtStore(employee.id, user)
  setMessage(result ? 'Da xac nhan noi quy tai cua hang.' : 'Chua the chot noi quy o luc nay.')
  setRefreshKey((current) => current + 1)
}
```

Va them list lich su don gian:

```tsx
<div className="mt-4 space-y-3">
  {policyHistory.map((item) => (
    <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{item.note}</p>
      <p className="mt-1 text-xs text-slate-500">{item.at} · {item.actor_name}</p>
    </div>
  ))}
</div>
```

- [ ] **Step 5: Run lint cho UI HR/quan ly**

Run: `npx eslint src/app/employees/contracts/[id]/page.tsx src/app/employees/[id]/page.tsx`

Expected:
- exit code `0`

- [ ] **Step 6: Commit cum visibility HR**

```bash
git add src/app/employees/contracts/[id]/page.tsx src/app/employees/[id]/page.tsx
git commit -m "feat: show onboarding policy status to hr"
```

### Task 5: Them UI cho nhan vien doc va xac nhan noi quy

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/lib/services/onboarding-policy-service.ts`

- [ ] **Step 1: Dong bo task `Noi quy` trong onboarding page theo record moi**

Trong `src/app/onboarding/page.tsx`, import service moi va tinh:

```ts
const policyRecord = user ? OnboardingPolicyService.getRecord(user.id) : null
const policyTemplate = policyRecord ? OnboardingPolicyService.getTemplate(policyRecord.template_id) : null

const onboardingTasks = mockOnboardingTasks.map((task) =>
  task.title.toLowerCase().includes('noi quy')
    ? { ...task, done: Boolean(policyRecord?.acknowledged_at || policyRecord?.confirmed_at_store_at) }
    : task
)
```

Sau do doi `totalTasks`, `doneTasks`, `phaseTasks`, `currentPhaseIdx` sang doc tu `onboardingTasks`.

- [ ] **Step 2: Them card noi quy day du cho nhan vien**

Chen card moi tren danh sach phase/task:

```tsx
{policyRecord && policyTemplate ? (
  <div className="card p-4 animate-slide-up">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--primary)' }}>Noi quy nhan viec</p>
        <h3 className="mt-1 text-base font-bold">Trang thai: {policyRecord.status}</h3>
      </div>
      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
        {policyRecord.full_sent_at ? 'Ban day du da san sang' : 'Dang cho HR gui'}
      </span>
    </div>

    {policyRecord.full_sent_at ? (
      <div className="mt-4 space-y-3">
        {policyTemplate.full_sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-gray-100 bg-white p-3">
            <p className="text-sm font-bold">{section.title}</p>
            <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>{section.body}</p>
          </div>
        ))}
      </div>
    ) : null}
  </div>
) : null}
```

- [ ] **Step 3: Them 2 action cho employee**

Ngay duoi card tren, render:

```tsx
{policyRecord?.full_sent_at && user ? (
  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
    <button
      onClick={() => {
        const result = OnboardingPolicyService.acknowledge(user.id, user)
        if (result) window.location.reload()
      }}
      className="rounded-xl px-4 py-3 text-sm font-bold"
      style={{ background: 'var(--success)', color: 'white' }}
    >
      Toi da doc
    </button>

    <button
      onClick={() => {
        const result = OnboardingPolicyService.requestClarification(user.id, user)
        if (result) window.location.reload()
      }}
      className="rounded-xl px-4 py-3 text-sm font-bold"
      style={{ background: 'var(--warning)', color: 'white' }}
    >
      Toi can HR giai thich them
    </button>
  </div>
) : null}
```

- [ ] **Step 4: Run lint cho onboarding UI**

Run: `npx eslint src/app/onboarding/page.tsx src/lib/services/onboarding-policy-service.ts`

Expected:
- exit code `0`

- [ ] **Step 5: Commit cum UI nhan vien**

```bash
git add src/app/onboarding/page.tsx src/lib/services/onboarding-policy-service.ts
git commit -m "feat: add employee onboarding policy acknowledgment"
```

### Task 6: Cap nhat tai lieu va verify end-to-end

**Files:**
- Modify: `docs/CODEMAP.md`

- [ ] **Step 1: Cap nhat `CODEMAP` cho service va touchpoints moi**

Them vao `docs/CODEMAP.md` o khu `Nhan su va tuyen noi bo` hoac `Tai lieu dieu phoi` 1 dong giong sau:

```md
### Noi quy nhan viec va onboarding
- Mo ta: flow gui noi quy 2 nhip, setting toi thieu, xac nhan cua nhan vien va nhac day-1.
- File chinh: `src/lib/services/onboarding-policy-service.ts`, `src/app/career-path/settings/page.tsx`, `src/app/employees/contracts/[id]/page.tsx`, `src/app/employees/[id]/page.tsx`, `src/app/onboarding/page.tsx`
- Dung khi: sua moc gui noi quy, nhac lai, xac nhan nhan vien, va checklist onboarding ngay dau
```

- [ ] **Step 2: Run lint tren toan bo file feature**

Run:

```bash
npx eslint src/lib/services/onboarding-policy-service.ts src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/lib/services/employee-service.ts src/lib/services/contract-service.ts src/components/layout/AppShell.tsx src/app/career-path/settings/page.tsx src/app/employees/contracts/[id]/page.tsx src/app/employees/[id]/page.tsx src/app/onboarding/page.tsx
```

Expected:
- exit code `0`

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected:
- `Next.js` build thanh cong
- khong co loi `useSearchParams`, SSR/localStorage, hay type errors moi

- [ ] **Step 4: Run guard neu co sua doc**

Run: `npm run ai:guard`

Expected:
- pass

- [ ] **Step 5: Manual verify theo dung flow nghiep vu**

1. Vao `/career-path/settings`, bat `Noi quy nhan viec`, de `Gui tom tat = Luc gui hop dong`, `Gui day du = Truoc ngay vao lam 1 ngay`.
2. Vao `/employees/invitations`, duyet 1 invitation dang `pending_approval`.
3. Vao `/employees/contracts`, tao hop dong va bam gui ky.
4. Mo `/employees/contracts/[id]`, kiem tra card noi quy da co `da_gui_tom_tat`.
5. Dang nhap vai tro nhan vien do, vao `/onboarding`, kiem tra card noi quy hien dung trang thai.
6. Quay lai login HR/manager, mo lai app de `AppShell` chay sync, kiem tra `da_gui_day_du` va notification nhac neu nhan vien chua xac nhan.
7. Dang nhap lai vai tro nhan vien, bam `Toi da doc`.
8. Quay lai `/employees/[id]`, kiem tra status da chuyen `da_xac_nhan` va lich su co them dong moi.
9. Thu truong hop `Toi can HR giai thich them`, kiem tra HR/quan ly nhan notification va profile hien `can_giai_thich`.

- [ ] **Step 6: Commit docs + final integration**

```bash
git add docs/CODEMAP.md
git commit -m "docs: map onboarding policy flow"
```
