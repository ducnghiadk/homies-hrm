# Onboarding Mini Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Them mini quiz cho `pre_start` va `day_1`, cho nhan vien lam lai nhieu lan va giu lich su, dong thoi cho buddy/quan ly xem diem, cau sai, va muc goi y `On phần nền / Cần ôn lại` ma khong anh huong gate.

**Architecture:** Giu huong mock data + localStorage service hien tai. Them `quiz template` va `quiz attempt` tach rieng khoi checklist progress va gate record, sau do noi vao 2 mat dang co: nhan vien lam quiz ngay trong chang onboarding va operations panel doc ket qua quiz moi nhat + lich su rut gon.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, localStorage-backed service layer, Tailwind CSS v4, ESLint, production build, manual smoke test.

---

## File Map

- Modify: `src/lib/career-path-types.ts`
  Responsibility: them type cho `quiz template`, `quiz question`, `quiz attempt`, `quiz answer`, va view model quiz.
- Modify: `src/lib/mock-data-career-path.ts`
  Responsibility: seed 2 quiz template cho `pre_start` va `day_1`.
- Modify: `src/lib/career-path-service.ts`
  Responsibility: luu/doc quiz templates, quiz attempts, tinh diem, map ket qua latest/history, va label `On phần nền / Cần ôn lại`.
- Create: `src/components/onboarding-employee/OnboardingMiniQuizCard.tsx`
  Responsibility: render 3-5 cau trac nghiem, nop bai, ket qua lan moi nhat, cau sai, va lich su attempts.
- Modify: `src/app/onboarding/page.tsx`
  Responsibility: nap quiz cho chang dang chon, noi action nop quiz, va chen card vao dung vi tri.
- Create: `src/components/onboarding-operations/OnboardingMiniQuizSummary.tsx`
  Responsibility: render ket qua mini quiz moi nhat + cau sai + lich su rut gon cho buddy/quan ly.
- Modify: `src/lib/services/onboarding-operations-service.ts`
  Responsibility: map quiz summary vao detail operations.
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
  Responsibility: chen block `Kết quả mini test`.
- Modify: `src/app/career-path/onboarding/page.tsx`
  Responsibility: dam bao detail operations refresh dung sau khi nhan vien nop lai quiz.
- Modify: `docs/CODEMAP.md`
  Responsibility: cap nhat component/service moi cho flow mini quiz.
- Modify: `docs/KNOWN_ISSUES.md`
  Responsibility: chi cap nhat neu trong luc code phat hien va fix bug moi.

## Verification Strategy

Pass nay verify theo 4 lop:

1. fail-first bang check service quiz path moi
2. `npx eslint` tren cum file vua sua
3. `npm run build`
4. smoke test role:
   - nhan vien moi vao `/onboarding`
   - buddy/quan ly vao `/career-path/onboarding`

## Task 1: Mo rong type cho quiz template va attempts

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Test: `npx eslint src/lib/career-path-types.ts`

- [ ] **Step 1: Them type cho quiz question**

Chen gan cum onboarding type:

```ts
export interface OnboardingMiniQuizOption {
  id: string
  label: string
}

export interface OnboardingMiniQuizQuestion {
  id: string
  prompt: string
  options: OnboardingMiniQuizOption[]
  correct_option_id: string
}
```

- [ ] **Step 2: Them type cho quiz template**

Them:

```ts
export interface OnboardingMiniQuizTemplate {
  id: string
  stage_code: OnboardingStageCode
  title: string
  questions: OnboardingMiniQuizQuestion[]
}
```

- [ ] **Step 3: Them type cho quiz attempt**

Them:

```ts
export interface OnboardingMiniQuizAttempt {
  id: string
  employee_id: string
  onboarding_plan_id: string
  quiz_template_id: string
  answers: Record<string, string>
  score: number
  submitted_at: string
}
```

- [ ] **Step 4: Them type cho quiz view model**

Them:

```ts
export interface OnboardingMiniQuizView {
  template: OnboardingMiniQuizTemplate
  latest: OnboardingMiniQuizAttempt | null
  history: OnboardingMiniQuizAttempt[]
  latest_wrong_question_ids: string[]
  status_label: 'Chưa làm mini test' | 'On phần nền' | 'Cần ôn lại'
}
```

- [ ] **Step 5: Run lint cho type**

Run: `npx eslint src/lib/career-path-types.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 1**

```bash
git add src/lib/career-path-types.ts
git commit -m "feat: add onboarding mini quiz types"
```

## Task 2: Seed quiz template cho `pre_start` va `day_1`

**Files:**
- Modify: `src/lib/mock-data-career-path.ts`
- Test: `npx eslint src/lib/mock-data-career-path.ts`

- [ ] **Step 1: Tao quiz `pre_start`**

Them seed:

```ts
export const onboardingMiniQuizTemplates = [
  {
    id: 'onb-quiz-pre-start',
    stage_code: 'pre_start',
    title: 'Mini test trước ngày vào làm',
    questions: [
      {
        id: 'pre-start-q1',
        prompt: 'Khi chưa rõ giờ có mặt, bạn nên hỏi ai trước?',
        options: [
          { id: 'a', label: 'Buddy hoặc quản lý đã được gán' },
          { id: 'b', label: 'Tự đoán theo lịch cũ' },
          { id: 'c', label: 'Đợi đến giờ rồi tính' },
        ],
        correct_option_id: 'a',
      },
    ],
  },
] as const
```

- [ ] **Step 2: Tao quiz `day_1`**

Them them 1 template:

```ts
{
  id: 'onb-quiz-day-1',
  stage_code: 'day_1',
  title: 'Mini test ngày đầu',
  questions: [
    {
      id: 'day-1-q1',
      prompt: 'Khi nhận order chưa rõ topping, bạn nên làm gì?',
      options: [
        { id: 'a', label: 'Xác nhận lại với khách trước khi bấm đơn' },
        { id: 'b', label: 'Bấm theo thói quen cho nhanh' },
        { id: 'c', label: 'Bỏ qua topping để đỡ chậm' },
      ],
      correct_option_id: 'a',
    },
  ],
}
```

- [ ] **Step 3: Run lint cho mock data**

Run: `npx eslint src/lib/mock-data-career-path.ts`
Expected: exit code `0`

- [ ] **Step 4: Commit task 2**

```bash
git add src/lib/mock-data-career-path.ts
git commit -m "feat: seed onboarding mini quiz templates"
```

## Task 3: Them service luu/doc quiz attempts va tinh score

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `npx eslint src/lib/career-path-service.ts`

- [ ] **Step 1: Them storage key va in-memory store**

Them:

```ts
miniQuizTemplates: 'cp_onboarding_mini_quiz_templates',
miniQuizAttempts: 'cp_onboarding_mini_quiz_attempts',
```

va

```ts
let _onboardingMiniQuizTemplates: OnboardingMiniQuizTemplate[] = [];
let _onboardingMiniQuizAttempts: OnboardingMiniQuizAttempt[] = [];
```

- [ ] **Step 2: Load quiz data trong init**

Them vao `initCareerPathStores()`:

```ts
_onboardingMiniQuizTemplates = load(KEYS.miniQuizTemplates, onboardingMiniQuizTemplates);
_onboardingMiniQuizAttempts = load(KEYS.miniQuizAttempts, []);
```

- [ ] **Step 3: Them helper read template theo stage**

Them:

```ts
export function getOnboardingMiniQuizTemplateForStage(stageCode: OnboardingStageCode) {
  return _onboardingMiniQuizTemplates.find((entry) => entry.stage_code === stageCode) ?? null
}
```

- [ ] **Step 4: Them helper tinh score va status label**

Them:

```ts
function calculateMiniQuizScore(template: OnboardingMiniQuizTemplate, answers: Record<string, string>) {
  const correctCount = template.questions.filter((question) => answers[question.id] === question.correct_option_id).length
  return Math.round((correctCount / template.questions.length) * 100)
}

function getMiniQuizStatusLabel(score?: number | null): OnboardingMiniQuizView['status_label'] {
  if (score === null || score === undefined) return 'Chưa làm mini test'
  return score >= 80 ? 'On phần nền' : 'Cần ôn lại'
}
```

- [ ] **Step 5: Them helper submit attempt**

Them:

```ts
export function submitOnboardingMiniQuizAttempt(input: {
  employeeId: string
  onboardingPlanId: string
  quizTemplateId: string
  answers: Record<string, string>
}): OnboardingMiniQuizAttempt | null {
  const template = _onboardingMiniQuizTemplates.find((entry) => entry.id === input.quizTemplateId)
  if (!template) return null

  const attempt: OnboardingMiniQuizAttempt = {
    id: `onb-quiz-attempt-${uid()}`,
    employee_id: input.employeeId,
    onboarding_plan_id: input.onboardingPlanId,
    quiz_template_id: input.quizTemplateId,
    answers: input.answers,
    score: calculateMiniQuizScore(template, input.answers),
    submitted_at: new Date().toISOString(),
  }

  _onboardingMiniQuizAttempts = [..._onboardingMiniQuizAttempts, attempt]
  save(KEYS.miniQuizAttempts, _onboardingMiniQuizAttempts)
  return attempt
}
```

- [ ] **Step 6: Them helper view latest/history/cau sai**

Them:

```ts
export function getOnboardingMiniQuizView(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingMiniQuizView | null {
  const template = getOnboardingMiniQuizTemplateForStage(stageCode)
  if (!template) return null

  const history = [..._onboardingMiniQuizAttempts]
    .filter((entry) => entry.employee_id === employeeId && entry.onboarding_plan_id === onboardingPlanId && entry.quiz_template_id === template.id)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
  const latest = history[0] ?? null
  const latestWrongQuestionIds = latest
    ? template.questions
      .filter((question) => latest.answers[question.id] !== question.correct_option_id)
      .map((question) => question.id)
    : []

  return {
    template,
    latest,
    history,
    latest_wrong_question_ids: latestWrongQuestionIds,
    status_label: getMiniQuizStatusLabel(latest?.score ?? null),
  }
}
```

- [ ] **Step 7: Run lint cho service quiz**

Run: `npx eslint src/lib/career-path-service.ts`
Expected: exit code `0`

- [ ] **Step 8: Commit task 3**

```bash
git add src/lib/career-path-service.ts
git commit -m "feat: add onboarding mini quiz service flow"
```

## Task 4: Tao card nhan vien cho mini quiz

**Files:**
- Create: `src/components/onboarding-employee/OnboardingMiniQuizCard.tsx`
- Test: `npx eslint src/components/onboarding-employee/OnboardingMiniQuizCard.tsx`

- [ ] **Step 1: Tao props card**

Dung:

```ts
type OnboardingMiniQuizCardProps = {
  quizView: OnboardingMiniQuizView
  onSubmit: (answers: Record<string, string>) => void
}
```

- [ ] **Step 2: Render form 3-5 cau chon 1 dap an**

Render toi thieu:

```tsx
<section className="rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
  <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Mini test nhanh</div>
  <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{quizView.template.title}</h3>
</section>
```

- [ ] **Step 3: Render ket qua latest + cau sai + lich su**

Hien:

```tsx
<div>{quizView.status_label}</div>
<div>{quizView.latest?.score}%</div>
```

va list `history`.

- [ ] **Step 4: Run lint cho component moi**

Run: `npx eslint src/components/onboarding-employee/OnboardingMiniQuizCard.tsx`
Expected: exit code `0`

- [ ] **Step 5: Commit task 4**

```bash
git add src/components/onboarding-employee/OnboardingMiniQuizCard.tsx
git commit -m "feat: add employee onboarding mini quiz card"
```

## Task 5: Noi quiz vao man nhan vien

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Create: `src/components/onboarding-employee/OnboardingMiniQuizCard.tsx`
- Test: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingMiniQuizCard.tsx`

- [ ] **Step 1: Them import quiz helper + card**

Them:

```ts
import { OnboardingMiniQuizCard } from '@/components/onboarding-employee/OnboardingMiniQuizCard'
import {
  getOnboardingMiniQuizView,
  submitOnboardingMiniQuizAttempt,
} from '@/lib/career-path-service'
```

- [ ] **Step 2: Nap quiz view theo selected stage**

Them:

```ts
const miniQuizView = checklistBundle && selectedStage
  ? getOnboardingMiniQuizView(user.id, checklistBundle.plan.id, selectedStage.code)
  : null
```

- [ ] **Step 3: Them handler nop quiz**

Them:

```ts
const handleSubmitMiniQuiz = (answers: Record<string, string>) => {
  if (!checklistBundle || !selectedStage || !miniQuizView) return

  submitOnboardingMiniQuizAttempt({
    employeeId: user.id,
    onboardingPlanId: checklistBundle.plan.id,
    quizTemplateId: miniQuizView.template.id,
    answers,
  })

  dispatch({
    type: 'sync_from_services',
    payload: {
      checklistBundle: getEmployeeOnboardingChecklistBundleForEmployee(user),
      policyRecord: { ...OnboardingPolicyService.ensureRecordFromEmployee(user) },
    },
  })
}
```

- [ ] **Step 4: Chen card quiz vao man chang**

Chen:

```tsx
{miniQuizView ? (
  <OnboardingMiniQuizCard quizView={miniQuizView} onSubmit={handleSubmitMiniQuiz} />
) : null}
```

- [ ] **Step 5: Run lint cho man nhan vien quiz**

Run: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingMiniQuizCard.tsx`
Expected: exit code `0`

- [ ] **Step 6: Commit task 5**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingMiniQuizCard.tsx
git commit -m "feat: wire onboarding mini quiz into employee page"
```

## Task 6: Tao summary quiz cho operations

**Files:**
- Create: `src/components/onboarding-operations/OnboardingMiniQuizSummary.tsx`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Test: `npx eslint src/components/onboarding-operations/OnboardingMiniQuizSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx`

- [ ] **Step 1: Tao props summary**

Dung:

```ts
type OnboardingMiniQuizSummaryProps = {
  quizView: OnboardingMiniQuizView | null
}
```

- [ ] **Step 2: Render latest + cau sai + lich su rut gon**

Toi thieu:

```tsx
<div style={{ borderRadius: 18, padding: 12, background: '#F8FAFC', border: '1px solid rgba(0, 29, 61, 0.08)' }}>
  <div>Kết quả mini test</div>
</div>
```

- [ ] **Step 3: Chen summary vao `OperationsChecklistDetail`**

Chen truoc `HistoryPanel`:

```tsx
<OnboardingMiniQuizSummary quizView={detail.miniQuizView} />
```

- [ ] **Step 4: Run lint cho summary operations**

Run: `npx eslint src/components/onboarding-operations/OnboardingMiniQuizSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx`
Expected: exit code `0`

- [ ] **Step 5: Commit task 6**

```bash
git add src/components/onboarding-operations/OnboardingMiniQuizSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx
git commit -m "feat: add onboarding mini quiz summary for operations"
```

## Task 7: Noi quiz vao operations service

**Files:**
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/app/career-path/onboarding/page.tsx`
- Test: `npx eslint src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx`

- [ ] **Step 1: Them field mini quiz vao `OnboardingOpsEmployeeDetail`**

Them:

```ts
  miniQuizView: OnboardingMiniQuizView | null
```

- [ ] **Step 2: Map quiz view theo current stage**

Import helper:

```ts
const miniQuizView = onboardingPlan
  ? getOnboardingMiniQuizView(employee.id, onboardingPlan.id, onboardingPlan.current_stage_code)
  : null
```

- [ ] **Step 3: Dam bao page operations refresh dung**

Khong can handler moi, chi can refresh de doc du lieu quiz moi sau khi nhan vien nop lai.

- [ ] **Step 4: Run lint cho operations quiz wiring**

Run: `npx eslint src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx`
Expected: exit code `0`

- [ ] **Step 5: Commit task 7**

```bash
git add src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx
git commit -m "feat: wire onboarding mini quiz into operations flow"
```

## Task 8: Cap nhat docs va verify full pass C

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md` if needed
- Test: `npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingMiniQuizCard.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OnboardingMiniQuizSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx`

- [ ] **Step 1: Cap nhat `docs/CODEMAP.md`**

Them component/service moi vao cum onboarding mini quiz.

- [ ] **Step 2: Chi them `docs/KNOWN_ISSUES.md` neu co bug moi da fix**

Neu co bug moi da gap va da fix trong luc code thi them theo format hien co. Neu khong co thi bo qua.

- [ ] **Step 3: Run lint full cum file pass C**

Run:

```bash
npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingMiniQuizCard.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OnboardingMiniQuizSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx
```

Expected: exit code `0`

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: build pass

- [ ] **Step 5: Smoke role nhan vien**

Mo `http://localhost:3333/onboarding`
Expected:
- `pre_start` va `day_1` co card `Mini test nhanh`
- nop quiz xong thay `diem tong + cau sai`
- lam lai van giu lich su lan cu

- [ ] **Step 6: Smoke role buddy/quan ly**

Mo `http://localhost:3333/career-path/onboarding`
Expected:
- panel detail co block `Kết quả mini test`
- thay `Chưa làm mini test`, `On phần nền`, hoac `Cần ôn lại`
- thay lich su rut gon attempts
- quiz khong dua vao hang doi gate

- [ ] **Step 7: Commit verify checkpoint**

```bash
git add docs/CODEMAP.md docs/KNOWN_ISSUES.md src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingMiniQuizCard.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OnboardingMiniQuizSummary.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx
git commit -m "test: verify onboarding mini quiz flow"
```

## Spec Coverage Check

- quiz chi la `tin hieu ho tro`: Task 3, Task 6, Task 8 smoke
- chi gan cho `pre_start` + `day_1`: Task 2, Task 3, Task 5
- `3-5 cau trac nghiem 1 dap an`: Task 2, Task 4
- lam lai nhieu lan + giu lich su: Task 3, Task 4, Task 6
- nhan vien + buddy + quan ly xem duoc: Task 5, Task 6, Task 7
- co nguong goi y `80%`, khong chan gate: Task 3, Task 6, Task 8 smoke

