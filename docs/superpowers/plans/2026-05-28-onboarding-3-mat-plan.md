# Onboarding 3 Mat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dung nen du lieu va 3 man onboarding theo chang linh hoat cho nhan vien moi, buddy, va quan ly, de he thong tu tinh chang hien tai, blocker, va nguoi dang no hanh dong.

**Architecture:** Giu app theo huong client-side mock/service hien co. Dat rule loi va mock state moi trong cum `career-path` va `onboarding` de tai su dung cho 3 man. Lam theo 4 pass: nen du lieu + service rule, man nhan vien, man buddy, man quan ly. Moi pass phai chay duoc doc lap tren data mock hien co, khong doi backend that.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand auth, localStorage-backed service layer, Tailwind CSS v4, ESLint, build production.

---

## File Map

- Modify: `src/lib/career-path-types.ts`
  Responsibility: them type cho chang onboarding, item status, blocker, action owner, va view model 3 vai tro.
- Modify: `src/lib/mock-data-career-path.ts`
  Responsibility: seed mock plan theo chang, mock item, mock buddy, mock manager summary.
- Modify: `src/lib/career-path-service.ts`
  Responsibility: doc/ghi mock plan onboarding moi va helper query theo employee.
- Create: `src/lib/services/onboarding-stage-service.ts`
  Responsibility: tinh chang hien tai, item dang block, next-open condition, action owner, va canh bao.
- Modify: `src/app/onboarding/page.tsx`
  Responsibility: render man nhan vien moi theo spec moi.
- Modify: `src/components/onboarding-employee/*`
  Responsibility: tach hero, card viec hom nay, danh sach blocker, item detail neu can.
- Modify: `src/app/career-path/onboarding/page.tsx`
  Responsibility: lam diem vao chung cho buddy va quan ly, dua theo role va query.
- Modify: `src/components/onboarding-operations/*`
  Responsibility: them queue buddy, manager overview, employee drill-down, item review panel.
- Modify: `docs/CODEMAP.md`
  Responsibility: cap nhat diem vao cho flow onboarding 3 mat va service moi.
- Modify: `docs/KNOWN_ISSUES.md`
  Responsibility: ghi lai bug moi neu phat hien va fix trong qua trinh lam.

## Task 1: Dinh nghia model onboarding theo chang

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Modify: `src/lib/mock-data-career-path.ts`
- Test: `npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts`

- [ ] **Step 1: Them enum va type loi cho chang, item status, blocker, action owner**

Chen gan cum onboarding types trong `src/lib/career-path-types.ts`:

```ts
export type OnboardingStageStatus = 'locked' | 'open' | 'passed'

export type OnboardingItemStatus =
  | 'not_started'
  | 'learning'
  | 'pending_review'
  | 'passed'
  | 'needs_coaching'
  | 'not_applicable'

export type OnboardingActorRole = 'employee' | 'buddy' | 'manager'

export type OnboardingBlockerType = 'item' | 'owner' | 'stage_rule'

export interface OnboardingStageRule {
  requiredItemIds: string[]
  recommendedItemIds: string[]
  managerApprovalRequired?: boolean
}

export interface OnboardingChecklistItemTemplate {
  id: string
  code: string
  title: string
  stageId: string
  required: boolean
  employeeAction: string
  buddyAction: string
  managerCheck: string
  passingStandard: string
}
```

- [ ] **Step 2: Them type plan theo nhan vien va blocker**

Them tiep trong `src/lib/career-path-types.ts`:

```ts
export interface OnboardingEmployeeItemProgress {
  itemId: string
  status: OnboardingItemStatus
  note?: string
  reviewedBy?: string
  reviewedAt?: string
}

export interface OnboardingEmployeeStageProgress {
  stageId: string
  status: OnboardingStageStatus
  managerApprovedAt?: string
}

export interface OnboardingPlanBlocker {
  id: string
  type: OnboardingBlockerType
  stageId: string
  itemId?: string
  ownerRole: OnboardingActorRole
  title: string
  detail: string
  severity: 'attention' | 'slow' | 'risk'
}

export interface OnboardingEmployeePlan {
  employeeId: string
  buddyId?: string
  managerId?: string
  currentStageId: string
  items: OnboardingEmployeeItemProgress[]
  stages: OnboardingEmployeeStageProgress[]
}
```

- [ ] **Step 3: Seed mock stages va item templates**

Them vao `src/lib/mock-data-career-path.ts` mot bo mock nho:

```ts
export const onboardingStageTemplates = [
  {
    id: 'foundation',
    title: 'Lam quen va nen tang',
    goal: 'Biet quy dinh nen tang, nguoi huong dan, va viec can lam trong ngay dau',
    rules: {
      requiredItemIds: ['policy-store', 'buddy-intro'],
      recommendedItemIds: ['group-tools'],
    },
  },
  {
    id: 'first-shift',
    title: 'Vao ca dau an toan',
    goal: 'Lam duoc ca dau theo dung chuan va duoc xac nhan ket qua',
    rules: {
      requiredItemIds: ['first-shift-practice', 'first-shift-review'],
      recommendedItemIds: ['station-wrapup'],
      managerApprovalRequired: true,
    },
  },
] as const

export const onboardingChecklistTemplates = [
  {
    id: 'buddy-intro',
    code: 'buddy_intro',
    title: 'Gap buddy va biet cach xin ho tro',
    stageId: 'foundation',
    required: true,
    employeeAction: 'Gap buddy, biet ten, vai tro, va cach lien he khi can',
    buddyAction: 'Gioi thieu cach kem cap va xac nhan nhan vien biet hoi khi gap kho',
    managerCheck: 'Da co nguoi kem ro rang va khong de nhan vien tu boi roi',
    passingStandard: 'Nhan vien biet ai kem minh va cach lien he trong ca',
  },
]
```

- [ ] **Step 4: Seed 1-2 mock employee plans**

Them vao `src/lib/mock-data-career-path.ts`:

```ts
export const onboardingEmployeePlans = [
  {
    employeeId: 'emp-cashier-01',
    buddyId: 'emp-shiftlead-01',
    managerId: 'mgr-store-01',
    currentStageId: 'foundation',
    stages: [
      { stageId: 'foundation', status: 'open' },
      { stageId: 'first-shift', status: 'locked' },
    ],
    items: [
      { itemId: 'buddy-intro', status: 'passed', reviewedBy: 'emp-shiftlead-01', reviewedAt: '2026-05-27T10:00:00.000Z' },
      { itemId: 'policy-store', status: 'learning' },
      { itemId: 'group-tools', status: 'not_started' },
    ],
  },
] as const
```

- [ ] **Step 5: Run lint cho task 1**

Run: `npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 1**

```bash
git add src/lib/career-path-types.ts src/lib/mock-data-career-path.ts
git commit -m "feat: add staged onboarding data model"
```

## Task 2: Tao service rule tinh chang hien tai, blocker, va action owner

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Create: `src/lib/services/onboarding-stage-service.ts`
- Test: `npx eslint src/lib/career-path-service.ts src/lib/services/onboarding-stage-service.ts`

- [ ] **Step 1: Mo helper doc mock plan va template**

Trong `src/lib/career-path-service.ts`, export helper doc mock:

```ts
import {
  onboardingChecklistTemplates,
  onboardingEmployeePlans,
  onboardingStageTemplates,
} from '@/lib/mock-data-career-path'

export function getOnboardingStageTemplates() {
  return onboardingStageTemplates
}

export function getOnboardingChecklistTemplates() {
  return onboardingChecklistTemplates
}

export function getOnboardingEmployeePlan(employeeId: string) {
  return onboardingEmployeePlans.find((plan) => plan.employeeId === employeeId) ?? null
}
```

- [ ] **Step 2: Tao service tinh item state va stage state**

Tao `src/lib/services/onboarding-stage-service.ts`:

```ts
import {
  getOnboardingChecklistTemplates,
  getOnboardingEmployeePlan,
  getOnboardingStageTemplates,
} from '@/lib/career-path-service'

export function getCurrentStage(employeeId: string) {
  const plan = getOnboardingEmployeePlan(employeeId)
  if (!plan) return null

  const stages = getOnboardingStageTemplates()
  return stages.find((stage) => stage.id === plan.currentStageId) ?? null
}
```

- [ ] **Step 3: Viet helper tinh blocker item bat buoc**

Them vao cung file:

```ts
const blockingStatuses = new Set(['not_started', 'learning', 'pending_review', 'needs_coaching'])

export function getRequiredItemBlockers(employeeId: string) {
  const plan = getOnboardingEmployeePlan(employeeId)
  if (!plan) return []

  const currentStage = getCurrentStage(employeeId)
  if (!currentStage) return []

  const itemMap = new Map(plan.items.map((item) => [item.itemId, item]))

  return currentStage.rules.requiredItemIds.flatMap((itemId) => {
    const progress = itemMap.get(itemId)
    if (!progress || !blockingStatuses.has(progress.status)) return []

    return [
      {
        id: `blocker-${plan.employeeId}-${itemId}`,
        type: 'item' as const,
        stageId: currentStage.id,
        itemId,
        ownerRole: progress.status === 'pending_review' ? 'buddy' : 'employee',
        title: 'Item bat buoc chua dat',
        detail: itemId,
        severity: progress.status === 'needs_coaching' ? 'risk' : 'attention',
      },
    ]
  })
}
```

- [ ] **Step 4: Viet helper tinh action owner va kha nang mo chang**

Them vao `src/lib/services/onboarding-stage-service.ts`:

```ts
export function getActionOwner(status: string): 'employee' | 'buddy' | 'manager' {
  if (status === 'pending_review') return 'buddy'
  if (status === 'passed' || status === 'not_applicable') return 'manager'
  return 'employee'
}

export function canOpenNextStage(employeeId: string) {
  const blockers = getRequiredItemBlockers(employeeId)
  return blockers.length === 0
}
```

- [ ] **Step 5: Run lint cho task 2**

Run: `npx eslint src/lib/career-path-service.ts src/lib/services/onboarding-stage-service.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 2**

```bash
git add src/lib/career-path-service.ts src/lib/services/onboarding-stage-service.ts
git commit -m "feat: add onboarding stage rule service"
```

## Task 3: Dung man nhan vien moi theo spec 3 mat

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/components/onboarding-employee/*`
- Test: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee`

- [ ] **Step 1: Them view model cho hero va viec hom nay**

Trong `src/app/onboarding/page.tsx`, map data service thanh view model:

```ts
const todayCards = blockers.slice(0, 3).map((blocker) => ({
  id: blocker.id,
  title: blocker.title,
  detail: blocker.detail,
  ownerRole: blocker.ownerRole,
}))
```

- [ ] **Step 2: Render 4 khoi uu tien**

Cap nhat layout man:

```tsx
<section>
  <EmployeeOnboardingHero currentStage={currentStage} buddyName={buddyName} />
  <EmployeeTodayActions cards={todayCards} />
  <EmployeeWaitingState blockers={blockers} />
  <EmployeeStageGateSummary blockers={blockers} />
</section>
```

- [ ] **Step 3: Render danh sach item chang hien tai**

Them panel item:

```tsx
<CurrentStageChecklist
  items={currentStageItems}
  emptyMessage="Chua co item mo cho chang nay."
/>
```

- [ ] **Step 4: Hien luong can kem them / cho danh gia**

Dam bao item status hien du:

```ts
const statusLabelMap = {
  not_started: 'Chua lam',
  learning: 'Dang hoc',
  pending_review: 'Cho danh gia',
  passed: 'Dat',
  needs_coaching: 'Can kem them',
  not_applicable: 'Khong ap dung',
}
```

- [ ] **Step 5: Run lint cho task 3**

Run: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee`
Expected: exit code `0`

- [ ] **Step 6: Commit task 3**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee
git commit -m "feat: redesign employee onboarding around stage actions"
```

## Task 4: Dung man buddy va quan ly

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/components/onboarding-operations/*`
- Test: `npx eslint src/app/career-path/onboarding/page.tsx src/components/onboarding-operations`

- [ ] **Step 1: Tach query buddy queue va manager overview**

Trong service hoac page layer, tao 2 nhom data:

```ts
const buddyQueue = plans.filter((plan) => plan.buddyId === currentUser.id)
const managerVisiblePlans = plans.filter((plan) => plan.managerId === currentUser.id)
```

- [ ] **Step 2: Render man buddy**

Dam bao co 4 tab:

```tsx
<BuddyQueueTabs
  tabs={[
    { key: 'guide', label: 'Can huong dan' },
    { key: 'observe', label: 'Can quan sat' },
    { key: 'review', label: 'Cho danh gia' },
    { key: 'coach', label: 'Can kem lai' },
  ]}
/>
```

- [ ] **Step 3: Render man quan ly**

Dam bao co 4 khoi:

```tsx
<ManagerOverviewCards summary={summary} />
<ManagerBlockedEmployees rows={blockedRows} />
<ManagerBuddyBottlenecks rows={buddyRows} />
<ManagerStageInsights rows={stageRows} />
```

- [ ] **Step 4: Them hanh dong can thiep**

Them nut UI:

```tsx
<button>Nhac buddy</button>
<button>Vao danh gia truc tiep</button>
<button>Doi buddy</button>
<button>Cho qua ngoai le</button>
```

- [ ] **Step 5: Run lint cho task 4**

Run: `npx eslint src/app/career-path/onboarding/page.tsx src/components/onboarding-operations`
Expected: exit code `0`

- [ ] **Step 6: Commit task 4**

```bash
git add src/app/career-path/onboarding/page.tsx src/components/onboarding-operations
git commit -m "feat: add buddy and manager onboarding workviews"
```

## Task 5: Tai lieu va verify cuoi

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md`
- Test: `npm run lint`
- Test: `npm run build`

- [ ] **Step 1: Cap nhat CODEMAP**

Them dong moi vao muc onboarding:

```md
- `src/lib/services/onboarding-stage-service.ts`: tinh chang hien tai, blocker, action owner, va canh bao cho onboarding 3 mat
```

- [ ] **Step 2: Ghi KNOWN_ISSUES neu co bug moi da fix**

Neu trong qua trinh lam phat hien bug va da fix, them 1 dong theo format file hien co:

```md
- [date] Mo ta bug, trieu chung, file lien quan, cach da xu ly
```

Neu khong co bug moi, giu file nguyen.

- [ ] **Step 3: Run lint toan bo**

Run: `npm run lint`
Expected: exit code `0`

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: exit code `0`

- [ ] **Step 5: Commit task 5**

```bash
git add docs/CODEMAP.md docs/KNOWN_ISSUES.md
git commit -m "docs: document onboarding three-view rollout"
```

## Self-Review

- Spec coverage:
  - phan loi nghiep vu chang, item status, blocker, action owner -> Task 1, Task 2
  - man nhan vien moi -> Task 3
  - man buddy -> Task 4
  - man quan ly -> Task 4
  - cap nhat tai lieu va verify -> Task 5
- Placeholder scan:
  - khong de placeholder hay buoc mo ho
- Type consistency:
  - dung chung `OnboardingItemStatus`, `OnboardingActorRole`, `OnboardingPlanBlocker` xuyen suot task

## Recommended Pass Order

1. Pass A = Task 1 + Task 2
2. Pass B = Task 3
3. Pass C = Task 4 phan buddy
4. Pass D = Task 4 phan quan ly + Task 5
