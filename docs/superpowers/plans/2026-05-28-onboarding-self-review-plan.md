# Onboarding Self Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Them self-review theo chang onboarding de nhan vien tu nhap nhieu lan, giu lich su, va cho buddy/quan ly xem tom tat moi nhat ma khong anh huong gate hien co.

**Architecture:** Giu kien truc mock data + localStorage service hien tai. Them 1 cum du lieu self-review tach rieng khoi checklist item progress, dat theo `employee + onboarding plan + stage + timestamp`, sau do noi vao 2 man dang co: man nhan vien `/onboarding` de nhap va man operations onboarding de doc tom tat.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, localStorage-backed service layer, Tailwind CSS v4, ESLint, production build, manual smoke test.

---

## File Map

- Modify: `src/lib/career-path-types.ts`
  Responsibility: them type cho self-review entry, answer tag, va view model.
- Modify: `src/lib/career-path-service.ts`
  Responsibility: luu/doc self-review history, tra ve latest entry theo stage, va helper map cho employee/operations view.
- Create: `src/components/onboarding-employee/OnboardingSelfReviewCard.tsx`
  Responsibility: render form 3 cau hoi, tag quick-pick, note ngan, submit, va lich su.
- Create: `src/components/onboarding-operations/OnboardingSelfReviewSummary.tsx`
  Responsibility: render tom tat latest self-review + lich su rut gon cho buddy/quan ly.
- Modify: `src/app/onboarding/page.tsx`
  Responsibility: nap self-review data cho chang dang chon, noi action submit, va chen card vao dung vi tri.
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
  Responsibility: chen block `Tom tat tu danh gia` vao panel chi tiet.
- Modify: `src/app/career-path/onboarding/page.tsx`
  Responsibility: nap detail moi co self-review summary de panel operations doc du lieu.
- Modify: `docs/CODEMAP.md`
  Responsibility: cap nhat them component/service moi cho flow onboarding self-review.
- Modify: `docs/STAGE1_STATUS_CHECKLIST.md`
  Responsibility: tick [x] neu task self-review dang nam trong checklist nay.
- Modify: `docs/KNOWN_ISSUES.md`
  Responsibility: chi cap nhat neu trong luc code phat hien va fix bug moi.

## Verification Strategy

Pass nay verify theo 4 lop:

1. fail-first bang check type/service nho cho self-review path moi
2. `npx eslint` tren cum file vua sua
3. `npm run build`
4. smoke test role:
   - nhan vien moi vao `/onboarding`
   - buddy/quan ly vao `/career-path/onboarding`

## Task 1: Mo rong type cho self-review

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Test: `npx eslint src/lib/career-path-types.ts`

- [x] **Step 1: Them type cho answer tag**

Chen gan cum onboarding type:

```ts
export type OnboardingSelfReviewConfidenceTag =
  | 'quy_trinh'
  | 'thao_tac'
  | 'giao_tiep_khach'
  | 'toc_do'
  | 've_sinh'
  | 'phoi_hop_ca'

export type OnboardingSelfReviewCoachingTag =
  | 'quy_trinh'
  | 'thao_tac'
  | 'giao_tiep_khach'
  | 'toc_do'
  | 've_sinh'
  | 'phoi_hop_ca'

export type OnboardingSelfReviewFearTag =
  | 'nham_order'
  | 'cham_nhip'
  | 'sai_cong_thuc'
  | 'quen_quy_trinh'
  | 'giao_tiep_khach'
  | 'xu_ly_loi'
```

- [x] **Step 2: Them type cho du lieu 1 lan self-review**

Them tiep:

```ts
export interface OnboardingSelfReviewAnswers {
  confidence_tag: OnboardingSelfReviewConfidenceTag
  confidence_note: string
  coaching_tag: OnboardingSelfReviewCoachingTag
  coaching_note: string
  fear_tag: OnboardingSelfReviewFearTag
  fear_note: string
}

export interface OnboardingSelfReviewEntry {
  id: string
  employee_id: string
  onboarding_plan_id: string
  stage_code: OnboardingStageCode
  answers: OnboardingSelfReviewAnswers
  submitted_at: string
  submitted_by: string
}
```

- [x] **Step 3: Them type cho latest/history view**

Them view model de UI dung chung:

```ts
export interface OnboardingSelfReviewStageView {
  stage_code: OnboardingStageCode
  latest: OnboardingSelfReviewEntry | null
  history: OnboardingSelfReviewEntry[]
}
```

- [x] **Step 4: Run lint cho type**

Run: `npx eslint src/lib/career-path-types.ts`
Expected: exit code `0`

- [ ] **Step 5: Commit task 1**

```bash
git add src/lib/career-path-types.ts
git commit -m "feat: add onboarding self review types"
```

## Task 2: Them storage key va helper service fail-first

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `npx eslint src/lib/career-path-service.ts`

- [x] **Step 1: Them storage key cho self-review**

Them vao cum `KEYS`:

```ts
selfReviewEntries: 'cp_onboarding_self_review_entries',
```

- [x] **Step 2: Them store in-memory va load init**

Them bien store:

```ts
let _onboardingSelfReviewEntries: OnboardingSelfReviewEntry[] = [];
```

Trong `initCareerPathStores()` them:

```ts
_onboardingSelfReviewEntries = load(KEYS.selfReviewEntries, []);
```

- [x] **Step 3: Them helper save va sort history**

Them helper nho:

```ts
function persistOnboardingSelfReviewEntries() {
  save(KEYS.selfReviewEntries, _onboardingSelfReviewEntries)
}

function sortSelfReviewEntries(entries: OnboardingSelfReviewEntry[]) {
  return [...entries].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
}
```

- [x] **Step 4: Them function read fail-first stub**

Them stub de dung cho task sau:

```ts
export function getOnboardingSelfReviewStageView(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingSelfReviewStageView {
  const history = sortSelfReviewEntries(
    _onboardingSelfReviewEntries.filter((entry) =>
      entry.employee_id === employeeId
      && entry.onboarding_plan_id === onboardingPlanId
      && entry.stage_code === stageCode,
    ),
  )

  return {
    stage_code: stageCode,
    latest: history[0] ?? null,
    history,
  }
}
```

- [x] **Step 5: Run lint cho service**

Run: `npx eslint src/lib/career-path-service.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 2**

```bash
git add src/lib/career-path-service.ts
git commit -m "feat: add onboarding self review storage helpers"
```

## Task 3: Them submit/update flow cho service

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `npx eslint src/lib/career-path-service.ts`

- [x] **Step 1: Viet check fail truoc bang ham submit chua du validation**

Them tam helper validation va goi no trong submit. Muc tieu dau tien la de lint/type bat du import/type neu thieu:

```ts
function assertSelfReviewNote(note: string) {
  return note.trim().slice(0, 280)
}
```

- [x] **Step 2: Them ham submit tao ban ghi moi**

Them function:

```ts
export function submitOnboardingSelfReview(input: {
  employeeId: string
  onboardingPlanId: string
  stageCode: OnboardingStageCode
  answers: OnboardingSelfReviewAnswers
  submittedBy: string
}) {
  const entry: OnboardingSelfReviewEntry = {
    id: `onb-self-review-${Date.now()}`,
    employee_id: input.employeeId,
    onboarding_plan_id: input.onboardingPlanId,
    stage_code: input.stageCode,
    answers: {
      confidence_tag: input.answers.confidence_tag,
      confidence_note: assertSelfReviewNote(input.answers.confidence_note),
      coaching_tag: input.answers.coaching_tag,
      coaching_note: assertSelfReviewNote(input.answers.coaching_note),
      fear_tag: input.answers.fear_tag,
      fear_note: assertSelfReviewNote(input.answers.fear_note),
    },
    submitted_at: new Date().toISOString(),
    submitted_by: input.submittedBy,
  }

  _onboardingSelfReviewEntries = [..._onboardingSelfReviewEntries, entry]
  persistOnboardingSelfReviewEntries()
  return entry
}
```

- [x] **Step 3: Them helper doc latest cho operations**

Them function:

```ts
export function getLatestOnboardingSelfReviewForPlan(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
) {
  return getOnboardingSelfReviewStageView(employeeId, onboardingPlanId, stageCode).latest
}
```

- [x] **Step 4: Run lint cho service sau submit flow**

Run: `npx eslint src/lib/career-path-service.ts`
Expected: exit code `0`

- [ ] **Step 5: Commit task 3**

```bash
git add src/lib/career-path-service.ts
git commit -m "feat: add onboarding self review submit flow"
```

## Task 4: Tao card nhan vien cho self-review

**Files:**
- Create: `src/components/onboarding-employee/OnboardingSelfReviewCard.tsx`
- Test: `npx eslint src/components/onboarding-employee/OnboardingSelfReviewCard.tsx`

- [x] **Step 1: Tao constants tag label trong component**

Tao map label de UI doc duoc:

```ts
const CONFIDENCE_OPTIONS = [
  { value: 'quy_trinh', label: 'Quy trình' },
  { value: 'thao_tac', label: 'Thao tác' },
  { value: 'giao_tiep_khach', label: 'Giao tiếp khách' },
  { value: 'toc_do', label: 'Tốc độ' },
  { value: 've_sinh', label: 'Vệ sinh' },
  { value: 'phoi_hop_ca', label: 'Phối hợp ca' },
] as const
```

- [x] **Step 2: Tao props ro rang cho card**

Dung props:

```ts
type OnboardingSelfReviewCardProps = {
  stageLabel: string
  latestSubmittedAt?: string | null
  history: OnboardingSelfReviewEntry[]
  onSubmit: (answers: OnboardingSelfReviewAnswers) => void
}
```

- [x] **Step 3: Render form 3 cau hoi + note**

Render toi thieu:

```tsx
<section className="rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
  <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Tự đánh giá chặng này</div>
  <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{stageLabel}</h3>
  <p className="mt-2 text-sm text-[#4B5563]">Tự nhìn lại để buddy và quản lý kèm đúng điểm. Không dùng để chặn qua chặng.</p>
</section>
```
```

- [x] **Step 4: Render lich su rut gon**

Them list:

```tsx
{history.length === 0 ? (
  <div className="rounded-[18px] bg-[#F8FAFC] p-3 text-sm text-[#64748B]">Bạn chưa tự đánh giá chặng này.</div>
) : (
  <div className="space-y-3">
    {history.map((entry) => (
      <div key={entry.id} className="rounded-[18px] border border-[#E5E7EB] p-3">
        <div className="text-xs font-semibold text-[#2F6FA8]">{new Date(entry.submitted_at).toLocaleString('vi-VN')}</div>
      </div>
    ))}
  </div>
)}
```

- [x] **Step 5: Run lint cho component moi**

Run: `npx eslint src/components/onboarding-employee/OnboardingSelfReviewCard.tsx`
Expected: exit code `0`

- [ ] **Step 6: Commit task 4**

```bash
git add src/components/onboarding-employee/OnboardingSelfReviewCard.tsx
git commit -m "feat: add employee onboarding self review card"
```

## Task 5: Noi self-review vao man nhan vien

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Create: `src/components/onboarding-employee/OnboardingSelfReviewCard.tsx`
- Test: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingSelfReviewCard.tsx`

- [x] **Step 1: Them import service + card**

Them import:

```ts
import { OnboardingSelfReviewCard } from '@/components/onboarding-employee/OnboardingSelfReviewCard'
import {
  getOnboardingSelfReviewStageView,
  submitOnboardingSelfReview,
} from '@/lib/career-path-service'
```

- [x] **Step 2: Them state sync self-review view**

Mo rong `OnboardingPageState`:

```ts
type OnboardingPageState = {
  checklistBundle: EmployeeChecklistBundle | null
  policyRecord: EmployeeOnboardingPolicyRecord | null
  selfReviewStageView: OnboardingSelfReviewStageView | null
}
```

- [x] **Step 3: Nap self-review khi user hoac selected stage doi**

Sau khi co `selectedStage`, sync:

```ts
const selfReviewStageView = checklistBundle && selectedStage
  ? getOnboardingSelfReviewStageView(user.id, checklistBundle.plan.id, selectedStage.code)
  : null
```

- [x] **Step 4: Them handler submit va sync lai view**

Them handler:

```ts
const handleSubmitSelfReview = (answers: OnboardingSelfReviewAnswers) => {
  if (!checklistBundle || !selectedStage) return

  submitOnboardingSelfReview({
    employeeId: user.id,
    onboardingPlanId: checklistBundle.plan.id,
    stageCode: selectedStage.code,
    answers,
    submittedBy: user.id,
  })

  dispatch({
    type: 'sync_from_services',
    payload: {
      checklistBundle: getEmployeeOnboardingChecklistBundleForEmployee(user),
      policyRecord: { ...OnboardingPolicyService.ensureRecordFromEmployee(user) },
      selfReviewStageView: getOnboardingSelfReviewStageView(user.id, checklistBundle.plan.id, selectedStage.code),
    },
  })
}
```

- [x] **Step 5: Chen card vao duoi stage panel**

Chen:

```tsx
<OnboardingSelfReviewCard
  stageLabel={selectedStage?.label || 'Chặng hiện tại'}
  latestSubmittedAt={selfReviewStageView?.latest?.submitted_at ?? null}
  history={selfReviewStageView?.history ?? []}
  onSubmit={handleSubmitSelfReview}
/>
```

- [x] **Step 6: Run lint cho man nhan vien**

Run: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingSelfReviewCard.tsx`
Expected: exit code `0`

- [ ] **Step 7: Commit task 5**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingSelfReviewCard.tsx
git commit -m "feat: wire onboarding self review into employee page"
```

## Task 6: Tao block tom tat cho operations

**Files:**
- Create: `src/components/onboarding-operations/OnboardingSelfReviewSummary.tsx`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Test: `npx eslint src/components/onboarding-operations/OnboardingSelfReviewSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx`

- [x] **Step 1: Tao component tom tat**

Props:

```ts
type OnboardingSelfReviewSummaryProps = {
  latest: OnboardingSelfReviewEntry | null
  history: OnboardingSelfReviewEntry[]
}
```

- [x] **Step 2: Render latest + wording ro khong gate**

Toi thieu:

```tsx
<div style={{ borderRadius: 18, padding: 12, background: '#F8FAFC', border: '1px solid rgba(0, 29, 61, 0.08)' }}>
  <div style={{ fontSize: 11, fontWeight: 800, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
    Tóm tắt tự đánh giá
  </div>
  <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6 }}>
    Dữ liệu để kèm đúng điểm, không tự chặn qua chặng.
  </div>
</div>
```

- [x] **Step 3: Chen component vao `OperationsChecklistDetail`**

Chen duoi `quickNote` va truoc checklist section:

```tsx
<OnboardingSelfReviewSummary
  latest={detail.selfReviewLatest}
  history={detail.selfReviewHistory}
/>
```

- [x] **Step 4: Run lint cho operations component**

Run: `npx eslint src/components/onboarding-operations/OnboardingSelfReviewSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx`
Expected: exit code `0`

- [ ] **Step 5: Commit task 6**

```bash
git add src/components/onboarding-operations/OnboardingSelfReviewSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx
git commit -m "feat: add onboarding self review summary for operations"
```

## Task 7: Noi self-review vao detail operations

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Test: `npx eslint src/app/career-path/onboarding/page.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx`

- [x] **Step 1: Them field vao `OnboardingOpsEmployeeDetail`**

Trong `src/lib/services/onboarding-operations-service.ts` them:

```ts
  selfReviewLatest: OnboardingSelfReviewEntry | null
  selfReviewHistory: OnboardingSelfReviewEntry[]
```

- [x] **Step 2: Lay du lieu self-review theo chang hien tai**

Import service helper va map vao detail:

```ts
const selfReviewStageView = plan
  ? getOnboardingSelfReviewStageView(employee.id, plan.id, plan.current_stage_code)
  : { latest: null, history: [], stage_code: 'pre_start' }
```

- [x] **Step 3: Tra field moi cho detail panel**

Tra vao object detail:

```ts
selfReviewLatest: selfReviewStageView.latest,
selfReviewHistory: selfReviewStageView.history,
```

- [x] **Step 4: Noi page operations de panel nhan field moi**

Dam bao `selectedDetail` va flow hien co khong mat field khi refresh/filter.

- [x] **Step 5: Run lint cho flow operations**

Run: `npx eslint src/app/career-path/onboarding/page.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx`
Expected: exit code `0`

- [ ] **Step 6: Commit task 7**

```bash
git add src/app/career-path/onboarding/page.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx
git commit -m "feat: wire onboarding self review into operations detail"
```

## Task 8: Cap nhat docs map va checklist

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/STAGE1_STATUS_CHECKLIST.md`
- Modify: `docs/KNOWN_ISSUES.md` if needed
- Test: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingSelfReviewCard.tsx src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/OnboardingSelfReviewSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/lib/career-path-types.ts src/lib/career-path-service.ts src/lib/services/onboarding-operations-service.ts`

- [x] **Step 1: Cap nhat `docs/CODEMAP.md`**

Them component/service moi vao muc `Noi quy nhan viec va onboarding` va `Nen du lieu checklist onboarding mau`.

- [ ] **Step 2: Tick checklist sprint neu co item tuong ung**

Mo `docs/STAGE1_STATUS_CHECKLIST.md`, tim dung dong lien quan self-review onboarding, doi thanh `[x]`.

- [x] **Step 3: Chi them `docs/KNOWN_ISSUES.md` neu co bug moi da gap va da fix**

Neu trong luc code co bug moi va da fix, them theo format hien co. Neu khong co bug moi, bo qua buoc nay.

- [x] **Step 4: Run lint full cum file pass A**

Run:

```bash
npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingSelfReviewCard.tsx src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/OnboardingSelfReviewSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/lib/career-path-types.ts src/lib/career-path-service.ts src/lib/services/onboarding-operations-service.ts
```

Expected: exit code `0`

- [ ] **Step 5: Commit task 8**

```bash
git add docs/CODEMAP.md docs/STAGE1_STATUS_CHECKLIST.md docs/KNOWN_ISSUES.md src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingSelfReviewCard.tsx src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/OnboardingSelfReviewSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/lib/career-path-types.ts src/lib/career-path-service.ts src/lib/services/onboarding-operations-service.ts
git commit -m "docs: update onboarding self review maps and checklist"
```

## Task 9: Verify truoc khi bao xong

**Files:**
- Test only

- [x] **Step 1: Chay build**

Run: `npm run build`
Expected: build pass khong co loi type/lint blocking

- [ ] **Step 2: Smoke role nhan vien**

Mo `http://localhost:3333/onboarding`
Expected:
- thay card `Tự đánh giá chặng này`
- gui 1 lan duoc
- gui lan 2 van giu lich su lan 1

- [ ] **Step 3: Smoke role buddy/quan ly**

Mo `http://localhost:3333/career-path/onboarding`
Expected:
- panel chi tiet co block `Tóm tắt tự đánh giá`
- thay latest entry
- thay lich su rut gon
- neu nhan vien chua co self-review thi chi hien nhac nhe, khong block

- [ ] **Step 4: Commit verify checkpoint**

```bash
git add -A
git commit -m "test: verify onboarding self review flow"
```

## Spec Coverage Check

- self-review theo chang: Task 1, Task 3, Task 5, Task 7
- cap nhat nhieu lan + giu lich su: Task 3, Task 4, Task 6, Task 7
- nhan vien nhap `tag + note`: Task 1, Task 4, Task 5
- buddy + quan ly chi xem: Task 6, Task 7
- khong anh huong gate: Task 4, Task 6, Task 9 smoke wording
