# Onboarding Stage Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Them gate tong ket chang cho 2 moc cuoi onboarding, dung self-review lam dieu kien vao gate, cho buddy de xuat, cho quan ly duyet, va tra ve `1-3 item can lam lai` khi chua qua gate.

**Architecture:** Giu huong mock data + localStorage service. Them `gate record` tach rieng khoi checklist progress va self-review, map gate vao 3 mat dang co: nhan vien xem trang thai, buddy de xuat gate, quan ly duyet/tra ve tren workspace onboarding. Gate duyet xong se mo chang sau ngay nhung van luu lich su quyet dinh rieng.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, localStorage-backed service layer, Tailwind CSS v4, ESLint, production build, manual smoke test.

---

## File Map

- Modify: `src/lib/career-path-types.ts`
  Responsibility: them type cho `gate code`, `gate status`, `gate record`, `buddy recommendation`, `manager decision`.
- Modify: `src/lib/career-path-service.ts`
  Responsibility: luu/doc gate record, validate dieu kien gate, mo chang sau, va tra retry item ids.
- Modify: `src/app/onboarding/page.tsx`
  Responsibility: nap gate status cho nhan vien va chen UI trang thai gate.
- Create: `src/components/onboarding-employee/OnboardingStageGateStatusCard.tsx`
  Responsibility: render `Dang cho quan ly chot gate`, `Da qua gate`, `Can kem lai`, manager note, va retry items cho nhan vien.
- Modify: `src/lib/services/onboarding-operations-service.ts`
  Responsibility: map gate status vao detail/queue, xac dinh buddy co de xuat duoc khong, quan ly co duyet duoc khong.
- Modify: `src/app/career-path/onboarding/page.tsx`
  Responsibility: noi handler buddy de xuat gate va manager duyet/chua duyet gate.
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
  Responsibility: hien card `De xuat gate` cho buddy va card `Duyet gate` cho quan ly.
- Create: `src/components/onboarding-operations/OnboardingStageGatePanel.tsx`
  Responsibility: render chung gate panel cho operations, gom gate status, buddy note, manager note, retry item selector.
- Modify: `docs/CODEMAP.md`
  Responsibility: cap nhat component/service moi cho flow gate tong ket chang.
- Modify: `docs/KNOWN_ISSUES.md`
  Responsibility: chi cap nhat neu trong luc code phat hien va fix bug moi.

## Verification Strategy

Pass nay verify theo 4 lop:

1. fail-first bang check service gate path moi
2. `npx eslint` tren cum file vua sua
3. `npm run build`
4. smoke test role:
   - nhan vien moi vao `/onboarding`
   - buddy/quan ly vao `/career-path/onboarding`

## Task 1: Mo rong type cho gate record

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Test: `npx eslint src/lib/career-path-types.ts`

- [ ] **Step 1: Them type cho gate code va status**

Chen gan cum onboarding type:

```ts
export type OnboardingStageGateCode = 'ready_for_live_shift' | 'ready_for_independent_shift'

export type OnboardingStageGateStatus =
  | 'chua_de_xuat'
  | 'cho_quan_ly_duyet'
  | 'da_qua_gate'
  | 'chua_qua_gate'
```

- [ ] **Step 2: Them type cho buddy recommendation va manager decision**

Them tiep:

```ts
export type OnboardingBuddyGateRecommendation = 'de_xuat_qua_gate'
export type OnboardingManagerGateDecision = 'duyet_gate' | 'chua_duyet_gate'
```

- [ ] **Step 3: Them type cho gate record**

Them interface:

```ts
export interface OnboardingStageGateRecord {
  id: string
  employee_id: string
  onboarding_plan_id: string
  stage_code: OnboardingStageCode
  gate_code: OnboardingStageGateCode
  status: OnboardingStageGateStatus
  buddy_recommendation: OnboardingBuddyGateRecommendation | null
  buddy_note: string
  manager_decision: OnboardingManagerGateDecision | null
  manager_note: string
  retry_item_ids: string[]
  created_at: string
  decided_at: string | null
}
```

- [ ] **Step 4: Them type cho view model gate**

Them:

```ts
export interface OnboardingStageGateView {
  gate_code: OnboardingStageGateCode
  status: OnboardingStageGateStatus
  required_self_review: boolean
  has_self_review: boolean
  blocked_item_ids: string[]
  retry_item_ids: string[]
  buddy_note: string
  manager_note: string
}
```

- [ ] **Step 5: Run lint cho type**

Run: `npx eslint src/lib/career-path-types.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 1**

```bash
git add src/lib/career-path-types.ts
git commit -m "feat: add onboarding stage gate types"
```

## Task 2: Them storage key va helper read gate fail-first

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `npx eslint src/lib/career-path-service.ts`

- [ ] **Step 1: Them storage key va in-memory store**

Them:

```ts
stageGateRecords: 'cp_onboarding_stage_gate_records',
```

va

```ts
let _onboardingStageGateRecords: OnboardingStageGateRecord[] = [];
```

- [ ] **Step 2: Load gate records trong init**

Them vao `initCareerPathStores()`:

```ts
_onboardingStageGateRecords = load(KEYS.stageGateRecords, []);
```

- [ ] **Step 3: Them helper persist va get current gate record**

Them:

```ts
function persistOnboardingStageGateRecords(): void {
  save(KEYS.stageGateRecords, _onboardingStageGateRecords)
}

function getCurrentStageGateRecord(
  employeeId: string,
  onboardingPlanId: string,
  gateCode: OnboardingStageGateCode,
): OnboardingStageGateRecord | null {
  return [..._onboardingStageGateRecords]
    .filter((record) =>
      record.employee_id === employeeId
      && record.onboarding_plan_id === onboardingPlanId
      && record.gate_code === gateCode)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
}
```

- [ ] **Step 4: Them helper map gate code theo stage**

Them:

```ts
export function resolveGateCodeForStage(stageCode: OnboardingStageCode): OnboardingStageGateCode | null {
  if (stageCode === 'week_1') return 'ready_for_live_shift'
  if (stageCode === 'week_2') return 'ready_for_independent_shift'
  return null
}
```

- [ ] **Step 5: Run lint cho service**

Run: `npx eslint src/lib/career-path-service.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 2**

```bash
git add src/lib/career-path-service.ts
git commit -m "feat: add onboarding stage gate storage helpers"
```

## Task 3: Them service rule cho buddy de xuat gate

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `npx eslint src/lib/career-path-service.ts`

- [ ] **Step 1: Them helper tinh item block va self-review gate**

Them helper:

```ts
function getBlockedRequiredProgressItems(
  planId: string,
  stageCode: OnboardingStageCode,
): EmployeeOnboardingChecklistProgressItem[] {
  const plan = _onboardingEmployeePlans.find((entry) => entry.id === planId)
  if (!plan) return []

  const stages = getOnboardingChecklistStages(plan.template_id)
  const stage = stages.find((entry) => entry.code === stageCode)
  if (!stage) return []

  const items = getOnboardingChecklistItems(plan.template_id)
    .filter((item) => item.stage_id === stage.id && item.is_required)

  const progressItems = getEmployeeOnboardingChecklistProgressItems(planId)
  return items
    .map((item) => progressItems.find((progress) => progress.checklist_item_id === item.id) ?? getChecklistItemFallbackProgress(planId, item.id))
    .filter((progress) => progress.status === 'not_started' || progress.status === 'need_more_coaching')
}
```

- [ ] **Step 2: Them ham read gate view**

Them:

```ts
export function getOnboardingStageGateView(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingStageGateView | null {
  const gateCode = resolveGateCodeForStage(stageCode)
  if (!gateCode) return null

  const selfReview = getOnboardingSelfReviewStageView(employeeId, onboardingPlanId, stageCode)
  const blockedItems = getBlockedRequiredProgressItems(onboardingPlanId, stageCode)
  const record = getCurrentStageGateRecord(employeeId, onboardingPlanId, gateCode)

  return {
    gate_code: gateCode,
    status: record?.status ?? 'chua_de_xuat',
    required_self_review: true,
    has_self_review: Boolean(selfReview.latest),
    blocked_item_ids: blockedItems.map((item) => item.checklist_item_id),
    retry_item_ids: record?.retry_item_ids ?? [],
    buddy_note: record?.buddy_note ?? '',
    manager_note: record?.manager_note ?? '',
  }
}
```

- [ ] **Step 3: Them ham buddy de xuat gate**

Them:

```ts
export function proposeOnboardingStageGate(input: {
  employeeId: string
  onboardingPlanId: string
  stageCode: OnboardingStageCode
  buddyNote: string
}): OnboardingStageGateRecord | null {
  const gateView = getOnboardingStageGateView(input.employeeId, input.onboardingPlanId, input.stageCode)
  if (!gateView || !gateView.has_self_review || gateView.blocked_item_ids.length > 0) return null

  const record: OnboardingStageGateRecord = {
    id: `onb-stage-gate-${uid()}`,
    employee_id: input.employeeId,
    onboarding_plan_id: input.onboardingPlanId,
    stage_code: input.stageCode,
    gate_code: gateView.gate_code,
    status: 'cho_quan_ly_duyet',
    buddy_recommendation: 'de_xuat_qua_gate',
    buddy_note: input.buddyNote.trim().slice(0, 280),
    manager_decision: null,
    manager_note: '',
    retry_item_ids: [],
    created_at: new Date().toISOString(),
    decided_at: null,
  }

  _onboardingStageGateRecords = [..._onboardingStageGateRecords, record]
  persistOnboardingStageGateRecords()
  return record
}
```

- [ ] **Step 4: Run lint cho buddy gate flow**

Run: `npx eslint src/lib/career-path-service.ts`
Expected: exit code `0`

- [ ] **Step 5: Commit task 3**

```bash
git add src/lib/career-path-service.ts
git commit -m "feat: add onboarding buddy gate proposal flow"
```

## Task 4: Them manager duyet/chua duyet gate va mo chang sau

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `npx eslint src/lib/career-path-service.ts`

- [ ] **Step 1: Them helper mo chang sau theo gate**

Them:

```ts
function unlockNextStageFromGate(planId: string, gateCode: OnboardingStageGateCode): void {
  const planIndex = _onboardingEmployeePlans.findIndex((entry) => entry.id === planId)
  if (planIndex === -1) return

  const nextStageCode: OnboardingStageCode =
    gateCode === 'ready_for_live_shift' ? 'week_1' : 'week_2'

  _onboardingEmployeePlans[planIndex] = {
    ..._onboardingEmployeePlans[planIndex],
    current_stage_code: nextStageCode,
    updated_at: new Date().toISOString(),
  }

  save(KEYS.onboardingEmployeePlans, _onboardingEmployeePlans)
}
```
```

- [ ] **Step 2: Them ham manager duyet gate**

Them:

```ts
export function approveOnboardingStageGate(input: {
  employeeId: string
  onboardingPlanId: string
  stageCode: OnboardingStageCode
  managerNote: string
}): OnboardingStageGateRecord | null {
  const gateView = getOnboardingStageGateView(input.employeeId, input.onboardingPlanId, input.stageCode)
  const record = gateView ? getCurrentStageGateRecord(input.employeeId, input.onboardingPlanId, gateView.gate_code) : null
  if (!gateView || !record || !gateView.has_self_review || gateView.blocked_item_ids.length > 0) return null

  const updatedRecord = {
    ...record,
    status: 'da_qua_gate' as const,
    manager_decision: 'duyet_gate' as const,
    manager_note: input.managerNote.trim().slice(0, 280),
    decided_at: new Date().toISOString(),
  }

  _onboardingStageGateRecords = _onboardingStageGateRecords.map((entry) => entry.id === record.id ? updatedRecord : entry)
  persistOnboardingStageGateRecords()
  unlockNextStageFromGate(input.onboardingPlanId, gateView.gate_code)
  return updatedRecord
}
```

- [ ] **Step 3: Them ham manager chua duyet gate**

Them:

```ts
export function rejectOnboardingStageGate(input: {
  employeeId: string
  onboardingPlanId: string
  stageCode: OnboardingStageCode
  managerNote: string
  retryItemIds: string[]
}): OnboardingStageGateRecord | null {
  const gateView = getOnboardingStageGateView(input.employeeId, input.onboardingPlanId, input.stageCode)
  const record = gateView ? getCurrentStageGateRecord(input.employeeId, input.onboardingPlanId, gateView.gate_code) : null
  const normalizedRetryItemIds = input.retryItemIds.slice(0, 3)
  if (!gateView || !record || normalizedRetryItemIds.length === 0) return null

  const updatedRecord = {
    ...record,
    status: 'chua_qua_gate' as const,
    manager_decision: 'chua_duyet_gate' as const,
    manager_note: input.managerNote.trim().slice(0, 280),
    retry_item_ids: normalizedRetryItemIds,
    decided_at: new Date().toISOString(),
  }

  _onboardingStageGateRecords = _onboardingStageGateRecords.map((entry) => entry.id === record.id ? updatedRecord : entry)
  persistOnboardingStageGateRecords()
  return updatedRecord
}
```

- [ ] **Step 4: Run lint cho manager gate flow**

Run: `npx eslint src/lib/career-path-service.ts`
Expected: exit code `0`

- [ ] **Step 5: Commit task 4**

```bash
git add src/lib/career-path-service.ts
git commit -m "feat: add onboarding manager gate decisions"
```

## Task 5: Tao card nhan vien cho gate status

**Files:**
- Create: `src/components/onboarding-employee/OnboardingStageGateStatusCard.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Test: `npx eslint src/components/onboarding-employee/OnboardingStageGateStatusCard.tsx src/app/onboarding/page.tsx`

- [ ] **Step 1: Tao props cho card gate status**

Dung:

```ts
type OnboardingStageGateStatusCardProps = {
  stageLabel: string
  gateView: OnboardingStageGateView | null
  retryItems: Array<{ id: string; title: string }>
}
```

- [ ] **Step 2: Render 3 wording chinh**

Render toi thieu:

```tsx
<section className="rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
  <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Gate chặng</div>
  <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{stageLabel}</h3>
</section>
```

Wording:
- `cho_quan_ly_duyet` -> `Đang chờ quản lý chốt gate`
- `da_qua_gate` -> `Đã qua gate`
- `chua_qua_gate` -> `Cần kèm lại`

- [ ] **Step 3: Chen card vao man nhan vien**

Trong `src/app/onboarding/page.tsx`:

```ts
import { getOnboardingStageGateView } from '@/lib/career-path-service'
import { OnboardingStageGateStatusCard } from '@/components/onboarding-employee/OnboardingStageGateStatusCard'
```

va render duoi self-review:

```tsx
<OnboardingStageGateStatusCard
  stageLabel={selectedStage?.label || 'Chặng hiện tại'}
  gateView={gateView}
  retryItems={phaseTasks.filter((task) => (gateView?.retry_item_ids ?? []).includes(task.id)).map((task) => ({ id: task.id, title: task.title }))}
/>
```

- [ ] **Step 4: Run lint cho man nhan vien gate**

Run: `npx eslint src/components/onboarding-employee/OnboardingStageGateStatusCard.tsx src/app/onboarding/page.tsx`
Expected: exit code `0`

- [ ] **Step 5: Commit task 5**

```bash
git add src/components/onboarding-employee/OnboardingStageGateStatusCard.tsx src/app/onboarding/page.tsx
git commit -m "feat: show onboarding stage gate status to employee"
```

## Task 6: Tao gate panel cho buddy va quan ly

**Files:**
- Create: `src/components/onboarding-operations/OnboardingStageGatePanel.tsx`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Test: `npx eslint src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx`

- [ ] **Step 1: Tao props gate panel**

Dung:

```ts
type OnboardingStageGatePanelProps = {
  detail: OnboardingOpsEmployeeDetail
  onProposeGate: (employeeId: string, note: string) => void
  onApproveGate: (employeeId: string, managerNote: string) => void
  onRejectGate: (employeeId: string, managerNote: string, retryItemIds: string[]) => void
}
```

- [ ] **Step 2: Render khu buddy de xuat gate**

Hien:

```tsx
<div>
  <div>Đề xuất gate</div>
  <div>Đã có tự đánh giá: ...</div>
  <div>Còn item cần làm lại: ...</div>
</div>
```

- [ ] **Step 3: Render khu manager duyet/chua duyet**

Hien:

```tsx
<button type="button">Duyệt gate</button>
<button type="button">Chưa duyệt</button>
```

va selector retry item toi da 3 item.

- [ ] **Step 4: Chen panel vao `OperationsChecklistDetail`**

Chen truoc `HistoryPanel`:

```tsx
<OnboardingStageGatePanel
  detail={detail}
  onProposeGate={onProposeGate}
  onApproveGate={onApproveGate}
  onRejectGate={onRejectGate}
/>
```

- [ ] **Step 5: Run lint cho gate panel**

Run: `npx eslint src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx`
Expected: exit code `0`

- [ ] **Step 6: Commit task 6**

```bash
git add src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx
git commit -m "feat: add onboarding stage gate panel for operations"
```

## Task 7: Noi gate vao operations service va page

**Files:**
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/app/career-path/onboarding/page.tsx`
- Test: `npx eslint src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx`

- [ ] **Step 1: Them field gate vao `OnboardingOpsEmployeeDetail`**

Them:

```ts
  gateView: OnboardingStageGateView | null
  gateRetryItems: Array<{ id: string; title: string }>
```

- [ ] **Step 2: Map gate view va retry item trong service**

Import helper tu `career-path-service`:

```ts
const gateView = onboardingPlan
  ? getOnboardingStageGateView(employee.id, onboardingPlan.id, onboardingPlan.current_stage_code)
  : null
```

Retry item map tu `checklist`.

- [ ] **Step 3: Them handler page cho buddy/manager**

Trong `src/app/career-path/onboarding/page.tsx` them:

```ts
const handleProposeGate = (employeeId: string, note: string) => { ... }
const handleApproveGate = (employeeId: string, managerNote: string) => { ... }
const handleRejectGate = (employeeId: string, managerNote: string, retryItemIds: string[]) => { ... }
```

Moi handler goi helper service gate moi roi `refresh()`.

- [ ] **Step 4: Truyen handler xuong detail panel**

Truyen them props:

```tsx
onProposeGate={handleProposeGate}
onApproveGate={handleApproveGate}
onRejectGate={handleRejectGate}
```

- [ ] **Step 5: Run lint cho operations gate wiring**

Run: `npx eslint src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx`
Expected: exit code `0`

- [ ] **Step 6: Commit task 7**

```bash
git add src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx
git commit -m "feat: wire onboarding stage gate into operations flow"
```

## Task 8: Cap nhat docs va verify full pass B

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md` if needed
- Test: `npx eslint src/lib/career-path-types.ts src/lib/career-path-service.ts src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingStageGateStatusCard.tsx src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx`

- [ ] **Step 1: Cap nhat `docs/CODEMAP.md`**

Them component/service moi vao cum onboarding gate.

- [ ] **Step 2: Chi them `docs/KNOWN_ISSUES.md` neu co bug moi da fix**

Neu co bug moi da gap va da fix trong luc code thi them theo format hien co. Neu khong co thi bo qua.

- [ ] **Step 3: Run lint full cum file pass B**

Run:

```bash
npx eslint src/lib/career-path-types.ts src/lib/career-path-service.ts src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingStageGateStatusCard.tsx src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx
```

Expected: exit code `0`

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: build pass

- [ ] **Step 5: Smoke role buddy/quan ly**

Mo `http://localhost:3333/career-path/onboarding`
Expected:
- buddy chi de xuat gate khi da co self-review va khong con item bat buoc do
- manager thay duoc gate `cho_quan_ly_duyet`
- manager `chua duyet` bi buoc note + retry items

- [ ] **Step 6: Smoke role nhan vien**

Mo `http://localhost:3333/onboarding`
Expected:
- thay `Dang cho quan ly chot gate`
- thay `Da qua gate` sau duyet
- thay `Can kem lai` + retry items sau khi bi tra ve

- [ ] **Step 7: Commit verify checkpoint**

```bash
git add docs/CODEMAP.md docs/KNOWN_ISSUES.md src/lib/career-path-types.ts src/lib/career-path-service.ts src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingStageGateStatusCard.tsx src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx
git commit -m "test: verify onboarding stage gate flow"
```

## Spec Coverage Check

- chi gate 2 moc cuoi: Task 1, Task 2, Task 3, Task 4
- self-review bat buoc phai co: Task 3, Task 7, Task 8 smoke
- buddy de xuat, quan ly duyet: Task 3, Task 4, Task 6, Task 7
- chua duyet thi chi ro `1-3 item can lam lai`: Task 4, Task 5, Task 6, Task 8 smoke
- duyet xong mo chang sau ngay + luu audit rieng: Task 2, Task 4

