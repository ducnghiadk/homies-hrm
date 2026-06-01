# Onboarding Output Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dua chuan dau ra onboarding theo vi tri vao nen du lieu mock, service rule, va 3 man onboarding de quan ly thay ro muc `can kem / tu lam`, gate giao ca, va chat luong dau ra cua nhan vien moi.

**Architecture:** Giu huong client-side mock/service hien co. Mo rong cum `career-path` va `onboarding-stage-service` de them `position track`, `quality result`, `gate review`, va item template chi tiet theo chang. UI se tiep tuc dung 3 mat hien co, nhung doi data shape va uu tien thong tin theo chuan dau ra moi.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand auth, localStorage-backed service layer, Tailwind CSS v4, ESLint, production build, manual smoke test.

---

## File Map

- Modify: `src/lib/career-path-types.ts`
  Responsibility: them type cho `position track`, `quality result`, `gate status`, `self review`, va item template theo chuan dau ra.
- Modify: `src/lib/mock-data-career-path.ts`
  Responsibility: seed chang chung, track `thu ngan / phuc vu`, track `pha che`, item detail, red flags, va 2-3 employee plans mau.
- Modify: `src/lib/career-path-service.ts`
  Responsibility: export helper doc template / plan theo track va helper update progress.
- Modify: `src/lib/services/onboarding-stage-service.ts`
  Responsibility: tinh chang hien tai, item bat buoc, gate pass, action owner, top risk, readiness `can kem / tu lam`, va queue buddy / quan ly.
- Modify: `src/app/onboarding/page.tsx`
  Responsibility: doi man nhan vien sang huong `hom nay lam gi`, `dang o muc nao`, `item nao can lam lai`.
- Modify: `src/components/onboarding-employee/OnboardingHeroCard.tsx`
  Responsibility: hien track vi tri, readiness hien tai, gate tiep theo.
- Modify: `src/components/onboarding-employee/OnboardingTodayFocus.tsx`
  Responsibility: uu tien item gate, hien `can kem / tu lam`, va nhac action owner.
- Modify: `src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx`
  Responsibility: render item chi tiet theo chang, red flags, self review prompt, va pass standard.
- Modify: `src/components/onboarding-employee/OnboardingChecklistItemCard.tsx`
  Responsibility: hien `quality result`, `workflow status`, note buddy, va manager gate.
- Modify: `src/app/career-path/onboarding/page.tsx`
  Responsibility: tiep tuc la diem vao buddy / quan ly, nhung doc queue moi va gate moi.
- Modify: `src/components/onboarding-operations/BuddyWorkview.tsx`
  Responsibility: buddy thay ai dang `can kem`, ai cho danh gia, ai chua len duoc `dat_tu_lam`.
- Modify: `src/components/onboarding-operations/ManagerWorkview.tsx`
  Responsibility: quan ly thay `san sang giao ca`, `con loi do`, `dang cho duyet gate`, va `top risk`.
- Modify: `docs/CODEMAP.md`
  Responsibility: cap nhat them plan moi va map file onboarding output standard.
- Modify: `docs/STAGE1_STATUS_CHECKLIST.md`
  Responsibility: tick [x] neu task nay dang nam trong checklist stage 1 hien co.

## Verification Strategy

Repo hien tai khong co test runner unit/integration rieng trong `package.json`, nen pass nay verify theo 3 lop:

1. `npx eslint` tren cum file vua sua
2. `npm run build`
3. smoke test thu cong tren 3 mat:
   - nhan vien moi
   - buddy
   - quan ly

## Task 1: Mo rong type va data model cho chuan dau ra

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Test: `npx eslint src/lib/career-path-types.ts`

- [ ] **Step 1: Them type cho track vi tri va quality result**

Chen gan cum onboarding type trong `src/lib/career-path-types.ts`:

```ts
export type OnboardingPositionTrack = 'cashier_service' | 'barista'

export type OnboardingQualityResult =
  | 'not_met'
  | 'met_with_support'
  | 'met_independently'
  | 'needs_retrain'

export type OnboardingWorkflowStatus =
  | 'not_started'
  | 'learning'
  | 'pending_buddy_review'
  | 'pending_manager_gate'
  | 'completed'
  | 'not_applicable'
```

- [ ] **Step 2: Them type cho self review, red flag, va gate**

Them tiep trong cung file:

```ts
export interface OnboardingSelfReviewSnapshot {
  confidenceNote?: string
  supportNeedNote?: string
  fearNote?: string
}

export interface OnboardingRedFlag {
  code: string
  label: string
  detail: string
}

export interface OnboardingGateReview {
  code: string
  label: string
  requiredQuality: OnboardingQualityResult
  managerApprovalRequired: boolean
}
```

- [ ] **Step 3: Them type item template chi tiet theo spec**

Them type item template:

```ts
export interface OnboardingOutputItemTemplate {
  id: string
  code: string
  title: string
  stageCode: string
  positionTrack: OnboardingPositionTrack | 'shared'
  required: boolean
  employeeAction: string
  selfCheckPrompt: string
  buddyObservation: string
  managerCheck: string
  passStandardSupported: string
  passStandardIndependent: string
  redFlags: OnboardingRedFlag[]
}
```

- [ ] **Step 4: Them type progress item va plan nhan vien**

Them type progress:

```ts
export interface OnboardingOutputItemProgress {
  itemId: string
  qualityResult: OnboardingQualityResult
  workflowStatus: OnboardingWorkflowStatus
  note?: string
  selfReview?: OnboardingSelfReviewSnapshot
  reviewedBy?: string
  reviewedAt?: string
  managerDecisionBy?: string
  managerDecisionAt?: string
}

export interface OnboardingOutputEmployeePlan {
  employeeId: string
  primaryTrack: OnboardingPositionTrack
  buddyId?: string
  managerId?: string
  currentStageCode: string
  gateStatus: 'blocked' | 'supported_ready' | 'independent_ready'
  items: OnboardingOutputItemProgress[]
}
```

- [ ] **Step 5: Run lint cho task 1**

Run: `npx eslint src/lib/career-path-types.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 1**

```bash
git add src/lib/career-path-types.ts
git commit -m "feat: add onboarding output standard types"
```

## Task 2: Seed chang, track, va employee plans theo chuan dau ra

**Files:**
- Modify: `src/lib/mock-data-career-path.ts`
- Test: `npx eslint src/lib/mock-data-career-path.ts`

- [ ] **Step 1: Seed stage templates chung**

Them stage template:

```ts
export const onboardingOutputStages = [
  {
    code: 'foundation_shared',
    label: 'Nen chung',
    goal: 'Vao cua hang dung ne nep, biet nguoi ho tro, biet ky luat va thong tin ca',
  },
  {
    code: 'track_position',
    label: 'Theo vi tri chinh',
    goal: 'Lam duoc viec nen cua vi tri chinh trong ngu canh co kem',
  },
  {
    code: 'live_shift_supported',
    label: 'Ca that co giam sat',
    goal: 'Dung duoc vi tri trong ca that va phoi hop on dinh',
  },
  {
    code: 'independent_shift_gate',
    label: 'Tu chay ca co ban',
    goal: 'Duoc quan ly duyet giao ca co ban',
  },
] as const
```

- [ ] **Step 2: Seed item template chang chung**

Them item dung spec:

```ts
export const onboardingOutputSharedItems = [
  {
    id: 'shared-buddy-support',
    code: 'shared_buddy_support',
    title: 'Biet buddy va luong ho tro',
    stageCode: 'foundation_shared',
    positionTrack: 'shared',
    required: true,
    employeeAction: 'Nho ten buddy, biet khi bi thi hoi ai truoc',
    selfCheckPrompt: 'Em co nho ro nguoi kem va cach xin ho tro khong?',
    buddyObservation: 'Nhan vien co hoi dung nguoi khi gap vuong hay im lang',
    managerCheck: 'Ca dau co nguoi kem ro va khong de nhan vien bi tha noi',
    passStandardSupported: 'Nho buddy va hoi duoc khi duoc nhac',
    passStandardIndependent: 'Chu dong tim dung nguoi ho tro khi gap vuong',
    redFlags: [
      { code: 'no_support_seek', label: 'Khong xin ho tro', detail: 'Bi ket nhung khong hoi ai va tu xu ly sai lien tuc' },
    ],
  },
] as const
```

- [ ] **Step 3: Seed item template track thu ngan / phuc vu**

Them item mau:

```ts
export const onboardingOutputCashierItems = [
  {
    id: 'cashier-order-accuracy',
    code: 'cashier_order_accuracy',
    title: 'Nhan order dung va xac nhan dung',
    stageCode: 'track_position',
    positionTrack: 'cashier_service',
    required: true,
    employeeAction: 'Nhan dung mon, size, duong, da, topping va xac nhan lai khi can',
    selfCheckPrompt: 'Phan nao trong order em hay nham nhat?',
    buddyObservation: 'Nhan vien co doc lai dung va hoi lai khi khong chac',
    managerCheck: 'Goc sai order co dang nam o dau quay hay khong',
    passStandardSupported: 'Nhan dung order khi buddy dung gan ho tro',
    passStandardIndependent: 'Nhan va xac nhan dung lien tiep cac order co ban',
    redFlags: [
      { code: 'repeat_wrong_order', label: 'Sai order lap lai', detail: 'Bo sot size, topping hoac ghi sai order gay tra mon' },
    ],
  },
] as const
```

- [ ] **Step 4: Seed item template track pha che**

Them item mau:

```ts
export const onboardingOutputBaristaItems = [
  {
    id: 'barista-core-recipe',
    code: 'barista_core_recipe',
    title: 'Lam dung mon nen theo cong thuc',
    stageCode: 'track_position',
    positionTrack: 'barista',
    required: true,
    employeeAction: 'Thao tac dung thu tu, dung dinh luong va dung nguyen lieu cho nhom mon nen',
    selfCheckPrompt: 'Em chua tu tin nhat nhom mon nao?',
    buddyObservation: 'Dung cu dung, dinh luong dung, khong bo qua buoc quan trong',
    managerCheck: 'Chat luong ly nuoc co dung chuan nen khong',
    passStandardSupported: 'Lam dung khi buddy dung kem tung mon',
    passStandardIndependent: 'Lam dung on dinh cac mon nen duoc giao',
    redFlags: [
      { code: 'repeat_recipe_error', label: 'Sai cong thuc lap lai', detail: 'Sai cong thuc, sai thu tu, sai dinh luong lap lai' },
    ],
  },
] as const
```

- [ ] **Step 5: Seed 3 employee plan mau**

Them 3 plan:

```ts
export const onboardingOutputEmployeePlans = [
  {
    employeeId: 'emp-cashier-01',
    primaryTrack: 'cashier_service',
    buddyId: 'emp-shiftlead-01',
    managerId: 'mgr-store-01',
    currentStageCode: 'track_position',
    gateStatus: 'supported_ready',
    items: [
      {
        itemId: 'shared-buddy-support',
        qualityResult: 'met_independently',
        workflowStatus: 'completed',
      },
      {
        itemId: 'cashier-order-accuracy',
        qualityResult: 'met_with_support',
        workflowStatus: 'pending_buddy_review',
      },
    ],
  },
  {
    employeeId: 'emp-barista-01',
    primaryTrack: 'barista',
    buddyId: 'emp-shiftlead-02',
    managerId: 'mgr-store-01',
    currentStageCode: 'live_shift_supported',
    gateStatus: 'blocked',
    items: [
      {
        itemId: 'shared-buddy-support',
        qualityResult: 'met_independently',
        workflowStatus: 'completed',
      },
      {
        itemId: 'barista-core-recipe',
        qualityResult: 'needs_retrain',
        workflowStatus: 'learning',
        note: 'Sai dinh luong 2 lan lien tiep o nhom mon sua',
      },
    ],
  },
  {
    employeeId: 'emp-cashier-02',
    primaryTrack: 'cashier_service',
    buddyId: 'emp-shiftlead-01',
    managerId: 'mgr-store-01',
    currentStageCode: 'independent_shift_gate',
    gateStatus: 'independent_ready',
    items: [
      {
        itemId: 'shared-buddy-support',
        qualityResult: 'met_independently',
        workflowStatus: 'completed',
      },
      {
        itemId: 'cashier-order-accuracy',
        qualityResult: 'met_independently',
        workflowStatus: 'pending_manager_gate',
      },
    ],
  },
] as const
```

- [ ] **Step 6: Run lint cho task 2**

Run: `npx eslint src/lib/mock-data-career-path.ts`
Expected: exit code `0`

- [ ] **Step 7: Commit task 2**

```bash
git add src/lib/mock-data-career-path.ts
git commit -m "feat: seed onboarding output standard mock data"
```

## Task 3: Mo rong service layer de tinh readiness, blocker, va queue

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Modify: `src/lib/services/onboarding-stage-service.ts`
- Test: `npx eslint src/lib/career-path-service.ts src/lib/services/onboarding-stage-service.ts`

- [ ] **Step 1: Export helper doc template va plan moi**

Them vao `src/lib/career-path-service.ts`:

```ts
import {
  onboardingOutputBaristaItems,
  onboardingOutputCashierItems,
  onboardingOutputEmployeePlans,
  onboardingOutputSharedItems,
  onboardingOutputStages,
} from '@/lib/mock-data-career-path'

export function getOnboardingOutputStageTemplates() {
  return onboardingOutputStages
}

export function getOnboardingOutputItemTemplates() {
  return [
    ...onboardingOutputSharedItems,
    ...onboardingOutputCashierItems,
    ...onboardingOutputBaristaItems,
  ]
}

export function getOnboardingOutputEmployeePlan(employeeId: string) {
  return onboardingOutputEmployeePlans.find((plan) => plan.employeeId === employeeId) ?? null
}
```

- [ ] **Step 2: Them helper loc item theo track**

Them vao `src/lib/services/onboarding-stage-service.ts`:

```ts
function getTemplatesForTrack(track: 'cashier_service' | 'barista') {
  return getOnboardingOutputItemTemplates().filter(
    (item) => item.positionTrack === 'shared' || item.positionTrack === track,
  )
}
```

- [ ] **Step 3: Them helper tinh ket qua item da map**

Them helper:

```ts
function mapOutputItems(employeeId: string) {
  const plan = getOnboardingOutputEmployeePlan(employeeId)
  if (!plan) return []

  return getTemplatesForTrack(plan.primaryTrack).map((template) => {
    const progress = plan.items.find((item) => item.itemId === template.id)

    return {
      ...template,
      quality_result: progress?.qualityResult ?? 'not_met',
      workflow_status: progress?.workflowStatus ?? 'not_started',
      note: progress?.note ?? '',
      self_review: progress?.selfReview ?? null,
    }
  })
}
```

- [ ] **Step 4: Them helper tinh red flag va gate readiness**

Them helper:

```ts
function getOpenRedFlags(employeeId: string) {
  return mapOutputItems(employeeId).flatMap((item) => {
    if (item.quality_result === 'needs_retrain' || item.quality_result === 'not_met') {
      return item.redFlags.map((flag) => ({
        ...flag,
        item_id: item.id,
        item_title: item.title,
      }))
    }

    return []
  })
}

function getReadinessLabel(employeeId: string) {
  const plan = getOnboardingOutputEmployeePlan(employeeId)
  if (!plan) return 'chua_co_plan'
  if (plan.gateStatus === 'independent_ready') return 'tu_lam'
  if (plan.gateStatus === 'supported_ready') return 'can_kem_nhe'
  return 'can_kem_sat'
}
```

- [ ] **Step 5: Them snapshot moi cho nhan vien**

Them export moi:

```ts
export function getOnboardingOutputSnapshot(employeeId: string) {
  const plan = getOnboardingOutputEmployeePlan(employeeId)
  if (!plan) return null

  const items = mapOutputItems(employeeId)
  const currentStageItems = items.filter((item) => item.stageCode === plan.currentStageCode)
  const openRedFlags = getOpenRedFlags(employeeId)

  return {
    employee_id: employeeId,
    primary_track: plan.primaryTrack,
    current_stage_code: plan.currentStageCode,
    readiness_label: getReadinessLabel(employeeId),
    current_stage_items: currentStageItems,
    open_red_flags: openRedFlags,
    gate_status: plan.gateStatus,
  }
}
```

- [ ] **Step 6: Mo rong queue buddy va quan ly**

Them / sua export:

```ts
export function getBuddyOutputQueue(buddyId: string) {
  return onboardingOutputEmployeePlans
    .filter((plan) => plan.buddyId === buddyId)
    .map((plan) => getOnboardingOutputSnapshot(plan.employeeId))
    .filter(Boolean)
}

export function getManagerOutputQueue(managerId: string) {
  return onboardingOutputEmployeePlans
    .filter((plan) => plan.managerId === managerId)
    .map((plan) => getOnboardingOutputSnapshot(plan.employeeId))
    .filter(Boolean)
}
```

- [ ] **Step 7: Run lint cho task 3**

Run: `npx eslint src/lib/career-path-service.ts src/lib/services/onboarding-stage-service.ts`
Expected: exit code `0`

- [ ] **Step 8: Commit task 3**

```bash
git add src/lib/career-path-service.ts src/lib/services/onboarding-stage-service.ts
git commit -m "feat: add onboarding output readiness service"
```

## Task 4: Dua man nhan vien sang huong output standard

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/components/onboarding-employee/OnboardingHeroCard.tsx`
- Modify: `src/components/onboarding-employee/OnboardingTodayFocus.tsx`
- Modify: `src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx`
- Modify: `src/components/onboarding-employee/OnboardingChecklistItemCard.tsx`
- Test: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingHeroCard.tsx src/components/onboarding-employee/OnboardingTodayFocus.tsx src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx src/components/onboarding-employee/OnboardingChecklistItemCard.tsx`

- [ ] **Step 1: Chuyen page sang snapshot moi**

Sua import trong `src/app/onboarding/page.tsx`:

```ts
import {
  getOnboardingOutputSnapshot,
} from '@/lib/services/onboarding-stage-service'
```

va trong `refreshSnapshot()` / `useEffect()` doi:

```ts
snapshot: getOnboardingOutputSnapshot(user.id),
```

- [ ] **Step 2: Them helper nhan readiness va top risk**

Trong `src/app/onboarding/page.tsx`, them helper:

```ts
function getReadinessText(value?: string) {
  if (value === 'tu_lam') return 'Ban da o muc tu lam duoc trong pham vi ca co ban'
  if (value === 'can_kem_nhe') return 'Ban da on nhieu muc, nhung van can buddy canh 1-2 diem'
  return 'Ban van dang can kem sat de tranh loi lap lai'
}
```

- [ ] **Step 3: Doi hero sang hien track + readiness**

Cap nhat props cho `OnboardingHeroCard`:

```tsx
<OnboardingHeroCard
  employeeName={user.full_name}
  positionLabel={positionLabel}
  storeLabel={storeLabel}
  headline={heroHeadline}
  startDateLabel={formatDateLabel(user.hire_date)}
  buddyName={snapshot?.assigned_buddy_name || 'Chua gan'}
  currentStageLabel={currentStage?.label || 'Chua co'}
  nextStageLabel={snapshot?.gate_status === 'independent_ready' ? 'San sang xin duyet giao ca' : 'Con item gate can dat'}
  stageStatusLabel={getReadinessText(snapshot?.readiness_label)}
/>
```

- [ ] **Step 4: Doi Today Focus sang item gate**

Cap nhat props:

```tsx
<OnboardingTodayFocus
  primaryTask={todayPrimaryTask}
  waitingLabel={todayWaitingLabel}
  gateLabel={
    snapshot?.open_red_flags?.length
      ? `Con ${snapshot.open_red_flags.length} loi do can xu ly truoc khi qua gate`
      : snapshot?.gate_status === 'independent_ready'
        ? 'Ban da san sang xin quan ly duyet giao ca'
        : 'Ban dang o muc can kem, tiep tuc hoan tat item bat buoc'
  }
/>
```

- [ ] **Step 5: Hien item detail voi quality result**

Trong `OnboardingChecklistItemCard.tsx`, them nhan:

```ts
function getQualityResultLabel(value: string) {
  if (value === 'met_independently') return 'Dat tu lam'
  if (value === 'met_with_support') return 'Dat khi co kem'
  if (value === 'needs_retrain') return 'Can kem lai'
  return 'Chua dat'
}
```

va render:

```tsx
<div className="mt-2 flex flex-wrap gap-2">
  <span className="rounded-full bg-[#EEF4FB] px-3 py-1 text-[11px] font-bold text-[#2F6FA8]">
    {getQualityResultLabel(item.quality_result)}
  </span>
  <span className="rounded-full bg-[#FFF4D6] px-3 py-1 text-[11px] font-bold text-[#8A5B00]">
    {item.workflow_status}
  </span>
</div>
```

- [ ] **Step 6: Hien red flag va self review prompt**

Trong `OnboardingChecklistStagePanel.tsx`, them:

```tsx
{item.redFlags?.length ? (
  <div className="rounded-[18px] bg-[#FFF4D6] p-3 text-sm text-[#8A5B00]">
    <div className="text-[11px] font-semibold uppercase tracking-[0.12em]">Loi do can tranh</div>
    <ul className="mt-2 space-y-1">
      {item.redFlags.map((flag) => <li key={flag.code}>- {flag.label}</li>)}
    </ul>
  </div>
) : null}
```

- [ ] **Step 7: Run lint cho task 4**

Run: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingHeroCard.tsx src/components/onboarding-employee/OnboardingTodayFocus.tsx src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx src/components/onboarding-employee/OnboardingChecklistItemCard.tsx`
Expected: exit code `0`

- [ ] **Step 8: Smoke test man nhan vien**

Run: `npm run dev`
Expected:
- vao `/onboarding` bang user track `cashier_service` thi thay item thu ngan
- vao `/onboarding` bang user track `barista` thi thay item pha che
- readiness hien dung `can kem` hoac `tu lam`

- [ ] **Step 9: Commit task 4**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingHeroCard.tsx src/components/onboarding-employee/OnboardingTodayFocus.tsx src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx src/components/onboarding-employee/OnboardingChecklistItemCard.tsx
git commit -m "feat: show onboarding output standard on employee view"
```

## Task 5: Dua man buddy / quan ly sang gate giao ca va top risk

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/components/onboarding-operations/BuddyWorkview.tsx`
- Modify: `src/components/onboarding-operations/ManagerWorkview.tsx`
- Test: `npx eslint src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/BuddyWorkview.tsx src/components/onboarding-operations/ManagerWorkview.tsx`

- [ ] **Step 1: Doi page sang queue moi**

Trong `src/app/career-path/onboarding/page.tsx`, doi import:

```ts
import {
  getBuddyOutputQueue,
  getManagerOutputQueue,
} from '@/lib/services/onboarding-stage-service'
```

va doi datasource:

```ts
const snapshots = !user
  ? []
  : isManagerView
    ? getManagerOutputQueue(user.id)
    : getBuddyOutputQueue(user.id)
```

- [ ] **Step 2: Cap nhat the tong quan cho buddy**

Trong `BuddyWorkview.tsx`, doi stats:

```ts
const stats = useMemo(() => ({
  total: snapshots.length,
  waitingBuddy: snapshots.flatMap((snapshot) => snapshot.current_stage_items).filter((item) => item.workflow_status === 'pending_buddy_review').length,
  needRetrain: snapshots.flatMap((snapshot) => snapshot.current_stage_items).filter((item) => item.quality_result === 'needs_retrain').length,
  notIndependentYet: snapshots.filter((snapshot) => snapshot.readiness_label !== 'tu_lam').length,
}), [snapshots])
```

- [ ] **Step 3: Buddy view uu tien muc can kem lai**

Trong danh sach ben trai, render badge:

```tsx
<span className="rounded-full bg-[#FFF4D6] px-3 py-1 text-[11px] font-bold text-[#8A5B00]">
  {snapshot.readiness_label === 'tu_lam' ? 'Da len tu lam' : 'Dang can kem'}
</span>
```

va trong chi tiet ben phai, render:

```tsx
<div className="rounded-[22px] bg-[#FFF8E8] p-4">
  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5B00]">Diem can kem nhat</div>
  <div className="mt-2 text-sm font-semibold text-[#001D3D]">
    {selectedSnapshot.open_red_flags?.[0]?.label || 'Khong co loi do dang mo'}
  </div>
</div>
```

- [ ] **Step 4: Manager view uu tien gate giao ca**

Trong `ManagerWorkview.tsx`, doi summary:

```ts
const summary = useMemo(() => {
  const readyForGate = snapshots.filter((snapshot) => snapshot.gate_status === 'independent_ready').length
  const blocked = snapshots.filter((snapshot) => snapshot.open_red_flags.length > 0).length
  const waitingManager = snapshots.filter((snapshot) => snapshot.current_stage_items.some((item) => item.workflow_status === 'pending_manager_gate')).length

  return {
    readyForGate,
    blocked,
    waitingManager,
  }
}, [snapshots])
```

- [ ] **Step 5: Hien quyet dinh gate trong manager detail**

Trong detail panel, render:

```tsx
<div className="grid gap-3 md:grid-cols-2">
  <div className="rounded-[22px] bg-[#DDF4EC] p-4">
    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#107C41]">San sang giao ca</div>
    <div className="mt-2 text-sm font-semibold text-[#001D3D]">
      {selectedSnapshot.gate_status === 'independent_ready' ? 'Co the duyet giao ca co ban' : 'Chua du dieu kien giao ca'}
    </div>
  </div>
  <div className="rounded-[22px] bg-[#FFF8E8] p-4">
    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5B00]">Top risk</div>
    <div className="mt-2 text-sm font-semibold text-[#001D3D]">
      {selectedSnapshot.open_red_flags?.[0]?.label || 'Khong co loi do dang mo'}
    </div>
  </div>
</div>
```

- [ ] **Step 6: Run lint cho task 5**

Run: `npx eslint src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/BuddyWorkview.tsx src/components/onboarding-operations/ManagerWorkview.tsx`
Expected: exit code `0`

- [ ] **Step 7: Smoke test buddy / quan ly**

Run: `npm run dev`
Expected:
- buddy thay ai dang `can kem` va item nao cho minh review
- manager thay ai `san sang giao ca`
- manager thay ai con `loi do`

- [ ] **Step 8: Commit task 5**

```bash
git add src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/BuddyWorkview.tsx src/components/onboarding-operations/ManagerWorkview.tsx
git commit -m "feat: show onboarding gate readiness on operations views"
```

## Task 6: Cap nhat tai lieu va verify toan cum

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/STAGE1_STATUS_CHECKLIST.md`
- Test: `npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/lib/services/onboarding-stage-service.ts src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingHeroCard.tsx src/components/onboarding-employee/OnboardingTodayFocus.tsx src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx src/components/onboarding-employee/OnboardingChecklistItemCard.tsx src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/BuddyWorkview.tsx src/components/onboarding-operations/ManagerWorkview.tsx`

- [ ] **Step 1: Cap nhat CODEMAP**

Them / sua muc onboarding:

```md
### Noi quy nhan viec va onboarding
- Mo ta: flow onboarding 3 mat theo chang, tach track `thu ngan / phuc vu` va `pha che`, co muc `dat khi co kem / dat tu lam`, va gate giao ca co ban.
- File chinh: `src/lib/services/onboarding-stage-service.ts`, `src/lib/career-path-types.ts`, `src/lib/mock-data-career-path.ts`, `src/app/onboarding/page.tsx`, `src/app/career-path/onboarding/page.tsx`, `src/components/onboarding-employee/*`, `src/components/onboarding-operations/*`
```

- [ ] **Step 2: Tick checklist stage 1 neu co muc phu hop**

Trong `docs/STAGE1_STATUS_CHECKLIST.md`, tim muc onboarding lien quan va doi:

```md
- [x] Chot va dua chuan dau ra onboarding theo vi tri vao nen du lieu mock va 3 mat onboarding
```

- [ ] **Step 3: Run lint toan cum**

Run:

```bash
npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/lib/services/onboarding-stage-service.ts src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingHeroCard.tsx src/components/onboarding-employee/OnboardingTodayFocus.tsx src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx src/components/onboarding-employee/OnboardingChecklistItemCard.tsx src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/BuddyWorkview.tsx src/components/onboarding-operations/ManagerWorkview.tsx docs/CODEMAP.md
```

Expected: exit code `0`

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: exit code `0`

- [ ] **Step 5: Final smoke test**

Run: `npm run dev`
Expected:
- employee track `cashier_service` khong thay item `barista`
- employee track `barista` khong thay item `cashier_service`
- buddy thay item `can kem lai`
- manager thay gate `co the giao ca` / `chua du dieu kien`

- [ ] **Step 6: Commit docs + verify pass**

```bash
git add docs/CODEMAP.md docs/STAGE1_STATUS_CHECKLIST.md
git commit -m "docs: map onboarding output standard rollout"
```

## Self-Review

- Spec coverage: plan da cover chang chung, 2 track vi tri, chang ca that, chang gate giao ca, 3 lop kiem, red flag, readiness, va 3 mat UI.
- Placeholder scan: khong de `TODO`, `TBD`, hay "viet test sau". Repo khong co unit test runner san, nen verification dung `eslint`, `build`, smoke test thu cong.
- Type consistency: dung mot bo ten xuyen suot `primaryTrack`, `qualityResult`, `workflowStatus`, `gateStatus`, `readiness_label`.
