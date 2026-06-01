# Onboarding Mini Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Them mini quiz theo chang va final quiz cho onboarding, cham diem tu dong theo template, hien ket qua cho nhan vien/operations, va khoa `approve gate` cuoi khi final quiz chua pass.

**Architecture:** Giu huong mock data + localStorage service dang co. Them `quiz template` va `employee quiz record` tach rieng khoi self-review va gate record, sau do noi vao 2 mat hien tai: nhan vien lam quiz tren `/onboarding`, operations xem summary va rule khoa gate tren `/career-path/onboarding`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, localStorage-backed service layer, Tailwind CSS v4, ESLint, `tsc --noEmit`, production build, manual browser smoke test.

---

## File Map

- Modify: `src/lib/career-path-types.ts`
  Responsibility: them type cho quiz template, question, answer, quiz record, employee quiz view, operations quiz summary.
- Modify: `src/lib/mock-data-career-path.ts`
  Responsibility: seed mini quiz templates theo stage va final quiz mau cho tung role onboarding.
- Modify: `src/lib/career-path-service.ts`
  Responsibility: load/save quiz templates va records, cham diem, retry, summary theo stage, summary final quiz, va gate-cuoi eligibility.
- Modify: `src/app/onboarding/page.tsx`
  Responsibility: nap data quiz cho stage dang xem va final quiz, submit bai lam, refresh state sau submit.
- Create: `src/components/onboarding-employee/OnboardingStageQuizCard.tsx`
  Responsibility: render mini quiz theo chang, form chon dap an, ket qua lan gan nhat, retry CTA.
- Create: `src/components/onboarding-employee/OnboardingFinalQuizCard.tsx`
  Responsibility: render final quiz card, messaging `required pass`, submit flow, va fail/pass state.
- Modify: `src/lib/services/onboarding-operations-service.ts`
  Responsibility: map quiz summary vao detail model, tinh co khoa `approve gate` cuoi hay khong.
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
  Responsibility: noi panel quiz summary vao detail screen.
- Create: `src/components/onboarding-operations/OnboardingQuizSummaryPanel.tsx`
  Responsibility: render stage quiz summary, final quiz summary, va ly do khoa gate cuoi.
- Modify: `src/components/onboarding-operations/OnboardingStageGatePanel.tsx`
  Responsibility: disable `Duyet gate` khi final quiz chua pass, hien ly do khoa ro rang.
- Modify: `src/app/career-path/onboarding/page.tsx`
  Responsibility: chi refresh state sau quiz-related gate lock change, khong them submit quiz vao man operations.
- Modify: `docs/CODEMAP.md`
  Responsibility: cap nhat file/component moi cho flow mini quiz onboarding.
- Modify: `docs/KNOWN_ISSUES.md`
  Responsibility: chi cap nhat neu trong luc code phat hien va fix bug moi.

## Verification Strategy

Repo hien tai chua co test runner rieng. Pass nay verify theo 5 lop:

1. `npx tsc --noEmit` de bat type break khi noi them type/service/UI
2. `npx eslint` tren cum file onboarding quiz
3. `npm run build`
4. smoke test nhan vien tren `/onboarding`
5. smoke test operations/quan ly tren `/career-path/onboarding`

## Task 1: Mo rong type va mock data cho quiz

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Modify: `src/lib/mock-data-career-path.ts`
- Test: `npx tsc --noEmit`
- Test: `npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts`

- [ ] **Step 1: Them type cho quiz template va record**

Chen vao `src/lib/career-path-types.ts` gan cum onboarding:

```ts
export type OnboardingQuizKind = 'stage' | 'final';

export interface OnboardingQuizOption {
  id: string;
  label: string;
}

export interface OnboardingQuizQuestion {
  id: string;
  prompt: string;
  options: OnboardingQuizOption[];
  correct_option_id: string;
  explanation_after_submit?: string;
}

export interface OnboardingQuizTemplate {
  quiz_code: string;
  stage_code: OnboardingStageCode;
  kind: OnboardingQuizKind;
  role_code: OnboardingRoleCode;
  title: string;
  description: string;
  passing_score: number;
  questions: OnboardingQuizQuestion[];
}

export interface EmployeeOnboardingQuizRecord {
  id: string;
  employee_id: string;
  onboarding_plan_id: string;
  quiz_code: string;
  stage_code: OnboardingStageCode;
  kind: OnboardingQuizKind;
  attempt_no: number;
  answers: Array<{ question_id: string; selected_option_id: string }>;
  score: number;
  passed: boolean;
  status: 'passed' | 'failed';
  submitted_at: string;
  submitted_by: string;
}
```

- [ ] **Step 2: Them type view model cho nhan vien va operations**

Them tiep trong `src/lib/career-path-types.ts`:

```ts
export interface OnboardingEmployeeQuizAttemptView {
  attempt_no: number;
  score: number;
  passed: boolean;
  submitted_at: string;
  incorrect_question_ids: string[];
}

export interface OnboardingEmployeeQuizView {
  quiz_code: string;
  stage_code: OnboardingStageCode;
  kind: OnboardingQuizKind;
  title: string;
  description: string;
  passing_score: number;
  question_count: number;
  questions: Array<{
    id: string;
    prompt: string;
    options: OnboardingQuizOption[];
    explanation_after_submit?: string;
  }>;
  latest_attempt: OnboardingEmployeeQuizAttemptView | null;
  has_passed: boolean;
  attempt_count: number;
  is_locked: boolean;
  locked_reason: string | null;
}

export interface OnboardingOperationsQuizSummary {
  stage_code: OnboardingStageCode;
  quiz_code: string;
  kind: OnboardingQuizKind;
  title: string;
  passing_score: number;
  latest_score: number | null;
  latest_passed: boolean;
  has_passed: boolean;
  attempt_count: number;
}
```

- [ ] **Step 3: Seed quiz template mock data**

Them export moi trong `src/lib/mock-data-career-path.ts`:

```ts
export const defaultOnboardingQuizTemplates: OnboardingQuizTemplate[] = [
  {
    quiz_code: 'counter-day-2-3',
    stage_code: 'day_2_3',
    kind: 'stage',
    role_code: 'counter_staff',
    title: 'Mini test chang day 2-3',
    description: 'Kiem tra quy trinh order, xac nhan mon, va dong phuc.',
    passing_score: 70,
    questions: [
      {
        id: 'q1',
        prompt: 'Khi khach doi topping sau khi da doc order, em can lam gi truoc?',
        options: [
          { id: 'a', label: 'Xac nhan lai order voi khach' },
          { id: 'b', label: 'Tu sua tren giay nhap' },
          { id: 'c', label: 'Bo qua vi khach da chot' },
        ],
        correct_option_id: 'a',
      },
    ],
  },
  {
    quiz_code: 'counter-final',
    stage_code: 'week_2',
    kind: 'final',
    role_code: 'counter_staff',
    title: 'Final quiz onboarding',
    description: 'Can dat de chot onboarding.',
    passing_score: 80,
    questions: [
      {
        id: 'qf1',
        prompt: 'Truoc khi tu chay ca co ban, em can uu tien dieu gi?',
        options: [
          { id: 'a', label: 'Dung quy trinh va xac nhan dung order' },
          { id: 'b', label: 'Lam nhanh hon moi nguoi' },
          { id: 'c', label: 'Tu bo qua buoc doi chieu order' },
        ],
        correct_option_id: 'a',
      },
    ],
  },
];
```

- [ ] **Step 4: Wire import de `tsc` fail truoc khi service load data moi**

Sua import trong `src/lib/career-path-service.ts` de them symbol moi, nhung chua implement storage key:

```ts
import type {
  OnboardingQuizTemplate,
  EmployeeOnboardingQuizRecord,
  OnboardingEmployeeQuizView,
  OnboardingOperationsQuizSummary,
} from './career-path-types';
```

Them import mock moi:

```ts
import { defaultOnboardingQuizTemplates } from './mock-data-career-path';
```

Expected: `npx tsc --noEmit` FAIL vi service chua co storage/view helpers cho symbol moi.

- [ ] **Step 5: Run fail-first type check**

Run: `npx tsc --noEmit`
Expected: FAIL voi loi import/usage lien quan `OnboardingQuizTemplate` hoac `defaultOnboardingQuizTemplates`

- [ ] **Step 6: Commit task 1**

```bash
git add src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts
git commit -m "feat: add onboarding quiz types and mock templates"
```

## Task 2: Them service quiz storage, scoring, retry, va summary

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `npx tsc --noEmit`
- Test: `npx eslint src/lib/career-path-service.ts`

- [ ] **Step 1: Them storage key va in-memory arrays**

Chen vao `KEYS` va store vars trong `src/lib/career-path-service.ts`:

```ts
const KEYS = {
  // ...
  onboardingQuizTemplates: 'cp_onboarding_quiz_templates',
  onboardingQuizRecords: 'cp_onboarding_quiz_records',
} as const;
```

va

```ts
let _onboardingQuizTemplates: OnboardingQuizTemplate[] = [];
let _onboardingQuizRecords: EmployeeOnboardingQuizRecord[] = [];
```

- [ ] **Step 2: Load/persist quiz stores**

Them helpers:

```ts
function persistOnboardingQuizRecords(): void {
  save(KEYS.onboardingQuizRecords, _onboardingQuizRecords);
}

function getQuizRecordsForPlan(planId: string, quizCode: string): EmployeeOnboardingQuizRecord[] {
  return _onboardingQuizRecords
    .filter((record) => record.onboarding_plan_id === planId && record.quiz_code === quizCode)
    .sort((a, b) => a.attempt_no - b.attempt_no);
}
```

va load trong `initCareerPathStores()`:

```ts
_onboardingQuizTemplates = load(KEYS.onboardingQuizTemplates, defaultOnboardingQuizTemplates);
_onboardingQuizRecords = load(KEYS.onboardingQuizRecords, []);
```

- [ ] **Step 3: Them helper chon template theo employee/stage**

Them:

```ts
function getQuizTemplateForRole(
  roleCode: OnboardingRoleCode,
  stageCode: OnboardingStageCode,
  kind: OnboardingQuizKind,
): OnboardingQuizTemplate | null {
  return _onboardingQuizTemplates.find((template) =>
    template.role_code === roleCode
    && template.stage_code === stageCode
    && template.kind === kind) ?? null;
}

function mapIncorrectQuestionIds(
  template: OnboardingQuizTemplate,
  answers: EmployeeOnboardingQuizRecord['answers'],
): string[] {
  return template.questions
    .filter((question) => answers.find((entry) => entry.question_id === question.id)?.selected_option_id !== question.correct_option_id)
    .map((question) => question.id);
}
```

- [ ] **Step 4: Them ham submit va cham diem**

Them export moi:

```ts
export function submitOnboardingQuizAttempt(input: {
  employeeId: string;
  onboardingPlanId: string;
  stageCode: OnboardingStageCode;
  kind: OnboardingQuizKind;
  answers: Array<{ question_id: string; selected_option_id: string }>;
  submittedBy: string;
}): EmployeeOnboardingQuizRecord {
  const employee = mockEmployees.find((entry) => entry.id === input.employeeId);
  if (!employee) {
    throw new Error('Employee not found for onboarding quiz');
  }

  const roleCode = mapEmployeeToOnboardingRole(employee);
  const template = getQuizTemplateForRole(roleCode, input.stageCode, input.kind);
  if (!template) {
    throw new Error('Quiz template not found');
  }

  const correctCount = template.questions.filter((question) =>
    input.answers.find((entry) => entry.question_id === question.id)?.selected_option_id === question.correct_option_id
  ).length;
  const score = Math.round((correctCount / template.questions.length) * 100);
  const passed = score >= template.passing_score;
  const attemptNo = getQuizRecordsForPlan(input.onboardingPlanId, template.quiz_code).length + 1;

  const record: EmployeeOnboardingQuizRecord = {
    id: `onb-quiz-${uid()}`,
    employee_id: input.employeeId,
    onboarding_plan_id: input.onboardingPlanId,
    quiz_code: template.quiz_code,
    stage_code: input.stageCode,
    kind: input.kind,
    attempt_no: attemptNo,
    answers: input.answers,
    score,
    passed,
    status: passed ? 'passed' : 'failed',
    submitted_at: new Date().toISOString(),
    submitted_by: input.submittedBy,
  };

  _onboardingQuizRecords = [..._onboardingQuizRecords, record];
  persistOnboardingQuizRecords();
  return record;
}
```

- [ ] **Step 5: Them ham view cho nhan vien va summary cho operations**

Them export moi:

```ts
export function getOnboardingStageQuizView(
  employee: OnboardingEmployeeSnapshot,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingEmployeeQuizView | null {
  const template = getQuizTemplateForRole(mapEmployeeToOnboardingRole(employee), stageCode, 'stage');
  if (!template) return null;

  const attempts = getQuizRecordsForPlan(onboardingPlanId, template.quiz_code);
  const latest = attempts.at(-1) ?? null;
  const hasPassed = attempts.some((attempt) => attempt.passed);

  return {
    quiz_code: template.quiz_code,
    stage_code: stageCode,
    kind: template.kind,
    title: template.title,
    description: template.description,
    passing_score: template.passing_score,
    question_count: template.questions.length,
    questions: template.questions.map(({ id, prompt, options, explanation_after_submit }) => ({
      id,
      prompt,
      options,
      explanation_after_submit,
    })),
    latest_attempt: latest ? {
      attempt_no: latest.attempt_no,
      score: latest.score,
      passed: latest.passed,
      submitted_at: latest.submitted_at,
      incorrect_question_ids: mapIncorrectQuestionIds(template, latest.answers),
    } : null,
    has_passed: hasPassed,
    attempt_count: attempts.length,
    is_locked: false,
    locked_reason: null,
  };
}

export function getOnboardingFinalQuizView(
  employee: OnboardingEmployeeSnapshot,
  onboardingPlanId: string,
  currentStageCode: OnboardingStageCode,
): OnboardingEmployeeQuizView | null {
  const template = getQuizTemplateForRole(mapEmployeeToOnboardingRole(employee), 'week_2', 'final');
  if (!template) return null;

  const attempts = getQuizRecordsForPlan(onboardingPlanId, template.quiz_code);
  const latest = attempts.at(-1) ?? null;
  const hasPassed = attempts.some((attempt) => attempt.passed);
  const isLocked = currentStageCode !== 'week_2';

  return {
    quiz_code: template.quiz_code,
    stage_code: 'week_2',
    kind: template.kind,
    title: template.title,
    description: template.description,
    passing_score: template.passing_score,
    question_count: template.questions.length,
    questions: template.questions.map(({ id, prompt, options, explanation_after_submit }) => ({
      id,
      prompt,
      options,
      explanation_after_submit,
    })),
    latest_attempt: latest ? {
      attempt_no: latest.attempt_no,
      score: latest.score,
      passed: latest.passed,
      submitted_at: latest.submitted_at,
      incorrect_question_ids: mapIncorrectQuestionIds(template, latest.answers),
    } : null,
    has_passed: hasPassed,
    attempt_count: attempts.length,
    is_locked: isLocked,
    locked_reason: isLocked ? 'Chua den chang final quiz' : null,
  };
}
```

- [ ] **Step 6: Them helper khoa gate cuoi theo final quiz**

Them:

```ts
export function hasPassedOnboardingFinalQuiz(
  employee: OnboardingEmployeeSnapshot,
  onboardingPlanId: string,
): boolean {
  const template = getQuizTemplateForRole(mapEmployeeToOnboardingRole(employee), 'week_2', 'final');
  if (!template) return true;

  return getQuizRecordsForPlan(onboardingPlanId, template.quiz_code).some((record) => record.passed);
}
```

Expected: ham nay se duoc `onboarding-operations-service.ts` goi de khoa gate cuoi.

- [ ] **Step 7: Run verification cho task 2**

Run:

```bash
npx tsc --noEmit
npx eslint src/lib/career-path-service.ts
```

Expected: ca hai lenh exit code `0`

- [ ] **Step 8: Commit task 2**

```bash
git add src/lib/career-path-service.ts
git commit -m "feat: add onboarding quiz service logic"
```

## Task 3: Noi mini quiz va final quiz vao man nhan vien

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Create: `src/components/onboarding-employee/OnboardingStageQuizCard.tsx`
- Create: `src/components/onboarding-employee/OnboardingFinalQuizCard.tsx`
- Test: `npx tsc --noEmit`
- Test: `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingStageQuizCard.tsx src/components/onboarding-employee/OnboardingFinalQuizCard.tsx`

- [ ] **Step 1: Tao component `OnboardingStageQuizCard`**

Them file `src/components/onboarding-employee/OnboardingStageQuizCard.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { OnboardingEmployeeQuizView } from '@/lib/career-path-types'

export function OnboardingStageQuizCard({
  quiz,
  onSubmit,
}: {
  quiz: OnboardingEmployeeQuizView
  onSubmit: (answers: Array<{ question_id: string; selected_option_id: string }>) => void
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})

  const canSubmit = quiz.questions.every((question) => selectedAnswers[question.id])

  return (
    <section className="animate-slide-up rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Mini test chang</div>
      <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{quiz.title}</h3>
      <p className="mt-2 text-sm text-[#4B5563]">{quiz.description}</p>
      <div className="mt-3 text-sm text-[#334155]">
        {quiz.question_count} cau • Nguong dat {quiz.passing_score}%
      </div>
      {quiz.questions.map((question) => (
        <div key={question.id} className="mt-4 rounded-[18px] border border-[#E5E7EB] p-4">
          <div className="text-sm font-semibold text-[#001D3D]">{question.prompt}</div>
          <div className="mt-3 space-y-2">
            {question.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm text-[#334155]">
                <input
                  type="radio"
                  name={question.id}
                  checked={selectedAnswers[question.id] === option.id}
                  onChange={() => setSelectedAnswers((current) => ({ ...current, [question.id]: option.id }))}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() =>
          onSubmit(
            quiz.questions.map((question) => ({
              question_id: question.id,
              selected_option_id: selectedAnswers[question.id],
            }))
          )
        }
        className="mt-5 inline-flex rounded-full bg-[#001D3D] px-4 py-2 text-sm font-semibold text-white disabled:bg-[#CBD5E1]"
      >
        {quiz.latest_attempt ? 'Lam lai mini test' : 'Lam mini test'}
      </button>
    </section>
  )
}
```

- [ ] **Step 2: Tao component `OnboardingFinalQuizCard`**

Them file `src/components/onboarding-employee/OnboardingFinalQuizCard.tsx`:

```tsx
'use client'

import { OnboardingStageQuizCard } from './OnboardingStageQuizCard'
import type { OnboardingEmployeeQuizView } from '@/lib/career-path-types'

export function OnboardingFinalQuizCard({
  quiz,
  onSubmit,
}: {
  quiz: OnboardingEmployeeQuizView
  onSubmit: (answers: Array<{ question_id: string; selected_option_id: string }>) => void
}) {
  if (quiz.is_locked) {
    return (
      <section className="animate-slide-up rounded-[24px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#7A6B53]">Final quiz</div>
        <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{quiz.title}</h3>
        <p className="mt-2 text-sm text-[#475569]">{quiz.locked_reason}</p>
      </section>
    )
  }

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-[#D9381E]">
        Can dat final quiz truoc khi quan ly chot gate cuoi.
      </div>
      <OnboardingStageQuizCard quiz={quiz} onSubmit={onSubmit} />
    </div>
  )
}
```

- [ ] **Step 3: Noi service quiz vao `src/app/onboarding/page.tsx`**

Them import:

```ts
import { OnboardingFinalQuizCard } from '@/components/onboarding-employee/OnboardingFinalQuizCard'
import { OnboardingStageQuizCard } from '@/components/onboarding-employee/OnboardingStageQuizCard'
import {
  getOnboardingFinalQuizView,
  getOnboardingStageQuizView,
  submitOnboardingQuizAttempt,
} from '@/lib/career-path-service'
```

Them state-derived data:

```ts
const selectedStageQuiz = checklistBundle && selectedStage
  ? getOnboardingStageQuizView(user, checklistBundle.plan.id, selectedStage.code)
  : null

const finalQuizView = checklistBundle
  ? getOnboardingFinalQuizView(user, checklistBundle.plan.id, checklistBundle.plan.current_stage_code)
  : null
```

- [ ] **Step 4: Them handler submit quiz**

Chen trong `src/app/onboarding/page.tsx`:

```ts
const syncFromServices = () => {
  dispatch({
    type: 'sync_from_services',
    payload: {
      checklistBundle: getEmployeeOnboardingChecklistBundleForEmployee(user),
      policyRecord: { ...OnboardingPolicyService.ensureRecordFromEmployee(user) },
    },
  })
}

const handleSubmitStageQuiz = (
  stageCode: OnboardingStageCode,
  kind: 'stage' | 'final',
  answers: Array<{ question_id: string; selected_option_id: string }>,
) => {
  if (!checklistBundle) return

  submitOnboardingQuizAttempt({
    employeeId: user.id,
    onboardingPlanId: checklistBundle.plan.id,
    stageCode,
    kind,
    answers,
    submittedBy: user.id,
  })

  syncFromServices()
}
```

- [ ] **Step 5: Render stage quiz va final quiz cards**

Chen vao layout `src/app/onboarding/page.tsx` duoi `OnboardingSelfReviewCard` / `OnboardingStageGateStatusCard`:

```tsx
{selectedStageQuiz ? (
  <OnboardingStageQuizCard
    quiz={selectedStageQuiz}
    onSubmit={(answers) => handleSubmitStageQuiz(selectedStage.code, 'stage', answers)}
  />
) : null}

{finalQuizView ? (
  <OnboardingFinalQuizCard
    quiz={finalQuizView}
    onSubmit={(answers) => handleSubmitStageQuiz(finalQuizView.stage_code, 'final', answers)}
  />
) : null}
```

- [ ] **Step 6: Run verification cho task 3**

Run:

```bash
npx tsc --noEmit
npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingStageQuizCard.tsx src/components/onboarding-employee/OnboardingFinalQuizCard.tsx
```

Expected: ca hai lenh exit code `0`

- [ ] **Step 7: Commit task 3**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingStageQuizCard.tsx src/components/onboarding-employee/OnboardingFinalQuizCard.tsx
git commit -m "feat: add onboarding employee quiz cards"
```

## Task 4: Noi quiz summary va gate lock vao man operations

**Files:**
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Create: `src/components/onboarding-operations/OnboardingQuizSummaryPanel.tsx`
- Modify: `src/components/onboarding-operations/OnboardingStageGatePanel.tsx`
- Modify: `src/app/career-path/onboarding/page.tsx`
- Test: `npx tsc --noEmit`
- Test: `npx eslint src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingQuizSummaryPanel.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/app/career-path/onboarding/page.tsx`

- [ ] **Step 1: Mo rong operations detail model**

Them vao `src/lib/services/onboarding-operations-service.ts`:

```ts
import {
  getOnboardingFinalQuizView,
  getOnboardingStageQuizView,
  hasPassedOnboardingFinalQuiz,
} from '@/lib/career-path-service'
```

Mo rong detail type:

```ts
type OnboardingOpsEmployeeDetail = {
  // ...
  quizSummaries: OnboardingOperationsQuizSummary[]
  finalQuizSummary: OnboardingOperationsQuizSummary | null
  finalQuizBlocksGate: boolean
}
```

- [ ] **Step 2: Map stage quiz summary va final quiz summary**

Chen helper trong `src/lib/services/onboarding-operations-service.ts`:

```ts
function toQuizSummary(view: OnboardingEmployeeQuizView | null): OnboardingOperationsQuizSummary | null {
  if (!view) return null

  return {
    stage_code: view.stage_code,
    quiz_code: view.quiz_code,
    kind: view.kind,
    title: view.title,
    passing_score: view.passing_score,
    latest_score: view.latest_attempt?.score ?? null,
    latest_passed: view.latest_attempt?.passed ?? false,
    has_passed: view.has_passed,
    attempt_count: view.attempt_count,
  }
}
```

va trong `getEmployeeDetail(...)`:

```ts
const quizSummaries = ONBOARDING_STAGE_CODES
  .map((stageCode) => toQuizSummary(getOnboardingStageQuizView(employee, detail.plan.id, stageCode)))
  .filter((entry): entry is OnboardingOperationsQuizSummary => Boolean(entry))

const finalQuizView = getOnboardingFinalQuizView(employee, detail.plan.id, detail.plan.current_stage_code)
const finalQuizSummary = toQuizSummary(finalQuizView)
const finalQuizBlocksGate =
  detail.gateView?.gate_code === 'ready_for_independent_shift'
  && !hasPassedOnboardingFinalQuiz(employee, detail.plan.id)
```

- [ ] **Step 3: Tao panel summary quiz**

Them file `src/components/onboarding-operations/OnboardingQuizSummaryPanel.tsx`:

```tsx
import type { OnboardingOperationsQuizSummary } from '@/lib/career-path-types'

export function OnboardingQuizSummaryPanel({
  quizSummaries,
  finalQuizSummary,
  finalQuizBlocksGate,
}: {
  quizSummaries: OnboardingOperationsQuizSummary[]
  finalQuizSummary: OnboardingOperationsQuizSummary | null
  finalQuizBlocksGate: boolean
}) {
  return (
    <div style={{ borderRadius: 18, padding: 12, background: '#FFFFFF', border: '1px solid rgba(0, 29, 61, 0.08)', marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Quiz onboarding
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {quizSummaries.map((summary) => (
          <div key={summary.quiz_code} style={{ borderRadius: 14, background: '#F8FAFC', padding: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#001D3D' }}>{summary.title}</div>
            <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 4 }}>
              Diem gan nhat: {summary.latest_score ?? 'Chua lam'} • So lan: {summary.attempt_count} • {summary.has_passed ? 'Da dat' : 'Chua dat'}
            </div>
          </div>
        ))}
      </div>
      {finalQuizSummary ? (
        <div style={{ marginTop: 12, borderRadius: 14, background: finalQuizBlocksGate ? '#FEF2F2' : '#ECFDF3', padding: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#001D3D' }}>Final quiz</div>
          <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 4 }}>
            Diem gan nhat: {finalQuizSummary.latest_score ?? 'Chua lam'} • So lan: {finalQuizSummary.attempt_count} • {finalQuizSummary.has_passed ? 'Da dat' : 'Chua dat'}
          </div>
          {finalQuizBlocksGate ? (
            <div style={{ fontSize: 12, color: '#D9381E', marginTop: 6 }}>
              Chua the duyet gate cuoi vi final quiz chua pass.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 4: Noi summary panel va khoa nut `Duyet gate`**

Chen vao `src/components/onboarding-operations/OperationsChecklistDetail.tsx`:

```tsx
<OnboardingQuizSummaryPanel
  quizSummaries={detail.quizSummaries}
  finalQuizSummary={detail.finalQuizSummary}
  finalQuizBlocksGate={detail.finalQuizBlocksGate}
/>
```

Sua `src/components/onboarding-operations/OnboardingStageGatePanel.tsx`:

```tsx
type OnboardingStageGatePanelProps = {
  detail: OnboardingOpsEmployeeDetail
  viewerRole: string
  onProposeGate: (employeeId: string, note: string) => void
  onApproveGate: (employeeId: string, managerNote: string) => void
  onRejectGate: (employeeId: string, managerNote: string, retryItemIds: string[]) => void
}

const canApprove = isManager
  && detail.gateView.status === 'cho_quan_ly_duyet'
  && !detail.finalQuizBlocksGate
```

va them message:

```tsx
{detail.finalQuizBlocksGate ? (
  <div style={{ marginTop: 10, fontSize: 12, color: '#D9381E' }}>
    Final quiz chua dat. Quan ly chua the duyet gate cuoi.
  </div>
) : null}
```

- [ ] **Step 5: Run verification cho task 4**

Run:

```bash
npx tsc --noEmit
npx eslint src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingQuizSummaryPanel.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/app/career-path/onboarding/page.tsx
```

Expected: ca hai lenh exit code `0`

- [ ] **Step 6: Commit task 4**

```bash
git add src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingQuizSummaryPanel.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/app/career-path/onboarding/page.tsx
git commit -m "feat: add onboarding quiz summary and final gate lock"
```

## Task 5: Docs, full verify, va smoke test

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md` (neu co bug moi duoc fix trong luc lam)
- Test: `npx eslint ...`
- Test: `npx tsc --noEmit`
- Test: `npm run build`

- [ ] **Step 1: Cap nhat `docs/CODEMAP.md`**

Them vao cum onboarding:

```md
- File chinh: `src/lib/career-path-types.ts`, `src/lib/mock-data-career-path.ts`, `src/lib/career-path-service.ts`, `src/components/onboarding-employee/OnboardingStageQuizCard.tsx`, `src/components/onboarding-employee/OnboardingFinalQuizCard.tsx`, `src/components/onboarding-operations/OnboardingQuizSummaryPanel.tsx`
- Dung khi: sua `mini quiz theo chang`, `final quiz`, retry quiz, hoac rule khoa `approve gate` cuoi
```

- [ ] **Step 2: Cap nhat `docs/KNOWN_ISSUES.md` neu co**

Chi them muc neu trong luc code da fix bug moi ngoai scope quiz:

```md
- `2026-05-28`: [mo ta bug moi] — da fix trong luc rollout Pass C.
```

Neu khong co bug moi, bo qua buoc sua file nay.

- [ ] **Step 3: Run full verification**

Run:

```bash
npx tsc --noEmit
npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/app/onboarding/page.tsx src/components/onboarding-employee/OnboardingStageQuizCard.tsx src/components/onboarding-employee/OnboardingFinalQuizCard.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingQuizSummaryPanel.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/app/career-path/onboarding/page.tsx
npm run build
```

Expected:

- `npx tsc --noEmit` exit code `0`
- `npx eslint ...` exit code `0`
- `npm run build` exit code `0`

- [ ] **Step 4: Smoke test role nhan vien**

Manual flow:

1. Dang nhap role nhan vien dang trong onboarding.
2. Vao `/onboarding`.
3. Chon stage co mini quiz.
4. Lam 1 lan fail, xac nhan card hien `Chua dat` va so lan = `1`.
5. Lam lai va pass, xac nhan card hien `Da dat` va so lan tang.
6. Den chang cuoi, mo `final quiz`, lam fail.

Expected:

- mini quiz retry duoc
- final quiz hien warning `Can dat final quiz truoc khi quan ly chot gate cuoi`

- [ ] **Step 5: Smoke test role operations / quan ly**

Manual flow:

1. Dang nhap role buddy/quan ly.
2. Vao `/career-path/onboarding`.
3. Mo detail nhan vien vua lam quiz.
4. Xac nhan panel quiz hien score va attempt count.
5. Neu final quiz chua pass, xac nhan nut `Duyet gate` bi disable o gate cuoi.
6. Cho nhan vien lam final quiz pass, refresh workspace.
7. Xac nhan disable duoc go va quan ly approve gate cuoi duoc.

Expected:

- operations thay summary dung
- gate cuoi bi khoa/mo khoa dung theo final quiz

- [ ] **Step 6: Commit task 5**

```bash
git add docs/CODEMAP.md docs/KNOWN_ISSUES.md
git commit -m "docs: update onboarding quiz codemap"
```

Neu `docs/KNOWN_ISSUES.md` khong doi, dung lenh:

```bash
git add docs/CODEMAP.md
git commit -m "docs: update onboarding quiz codemap"
```
