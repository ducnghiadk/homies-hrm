# Onboarding Evaluation Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Them timeline danh gia theo chang onboarding, gop `self-review + mini test + gate`, hien tren ca man nhan vien va man operations.

**Architecture:** Giu huong mock data + local service hien tai, khong tao bang moi. Mo rong `career-path types/service` de build view model timeline theo chang, sau do noi 1 component timeline dung chung cho mat nhan vien va 1 component timeline cho operations panel. Gate history duoc doc tu records da co, timeline chi la lop tong hop va hien thi.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, localStorage-backed service layer, ESLint, production build, HTTP smoke check.

---

## File Map

- Modify: `src/lib/career-path-types.ts`
  Responsibility: them type cho timeline entry/view va tone/entry type.
- Modify: `src/lib/career-path-service.ts`
  Responsibility: doc gate history theo chang, merge self-review + mini quiz + gate thanh timeline view, expose service helpers.
- Create: `src/components/onboarding-employee/OnboardingEvaluationTimelineCard.tsx`
  Responsibility: hien summary + lich su mo rong tren man nhan vien.
- Modify: `src/app/onboarding/page.tsx`
  Responsibility: nap timeline view theo selected stage va chen block timeline.
- Create: `src/components/onboarding-operations/OnboardingEvaluationTimelineSummary.tsx`
  Responsibility: hien summary + lich su mo rong trong operations panel.
- Modify: `src/lib/services/onboarding-operations-service.ts`
  Responsibility: dua timeline view vao detail model cho operations.
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
  Responsibility: dung block timeline chung va bo lap block mini test/self-review/gate neu timeline da bao phu.
- Modify: `docs/CODEMAP.md`
  Responsibility: cap nhat component/service moi cho Pass D.
- Modify: `docs/KNOWN_ISSUES.md`
  Responsibility: chi cap nhat neu trong qua trinh lam phat hien va fix bug moi.

## Verification Strategy

Pass nay verify theo 4 lop:

1. fail-first bang symbol search cho timeline service/component moi
2. `npx eslint` tren cum file Pass D
3. `npm run build`
4. smoke check:
   - `http://127.0.0.1:3333/onboarding`
   - `http://127.0.0.1:3333/career-path/onboarding`

## Task 1: Them type timeline danh gia theo chang

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Test: `npx eslint src/lib/career-path-types.ts`

- [ ] **Step 1: Write the failing symbol check**

Run:

```bash
rg -n "OnboardingStageEvaluationTimelineEntry|OnboardingStageEvaluationTimelineView" src/lib/career-path-types.ts
```

Expected: exit code `1`

- [ ] **Step 2: Them type timeline entry va stage view**

Chen gan cum onboarding types:

```ts
export type OnboardingEvaluationTimelineEntryType = 'self_review' | 'mini_quiz' | 'stage_gate';
export type OnboardingEvaluationTimelineTone = 'neutral' | 'good' | 'warning';

export interface OnboardingStageEvaluationTimelineEntry {
  id: string;
  stage_code: OnboardingStageCode;
  entry_type: OnboardingEvaluationTimelineEntryType;
  occurred_at: string;
  headline: string;
  summary_lines: string[];
  status_tone: OnboardingEvaluationTimelineTone;
  raw_ref: OnboardingSelfReviewEntry | OnboardingMiniQuizAttempt | OnboardingStageGateRecord;
}

export interface OnboardingStageEvaluationTimelineView {
  stage_code: OnboardingStageCode;
  latest_self_review: OnboardingSelfReviewEntry | null;
  latest_mini_quiz: OnboardingMiniQuizAttempt | null;
  latest_stage_gate: OnboardingStageGateRecord | null;
  entries: OnboardingStageEvaluationTimelineEntry[];
}
```

- [ ] **Step 3: Run lint cho types**

Run:

```bash
npx eslint src/lib/career-path-types.ts
```

Expected: exit code `0`

## Task 2: Mo rong service de tra gate history va merge timeline

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `npx eslint src/lib/career-path-service.ts`

- [ ] **Step 1: Write the failing symbol check**

Run:

```bash
rg -n "getOnboardingStageGateHistoryForStage|getOnboardingStageEvaluationTimelineView" src/lib/career-path-service.ts
```

Expected: exit code `1`

- [ ] **Step 2: Them helper gate history theo chang**

Chen sau `getCurrentStageGateRecord` hoac gan cum gate helpers:

```ts
function sortStageGateRecords(records: OnboardingStageGateRecord[]): OnboardingStageGateRecord[] {
  return [...records].sort((a, b) => {
    const left = new Date(b.decided_at ?? b.created_at).getTime();
    const right = new Date(a.decided_at ?? a.created_at).getTime();
    return left - right;
  });
}

export function getOnboardingStageGateHistoryForStage(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingStageGateRecord[] {
  return sortStageGateRecords(
    _onboardingStageGateRecords.filter((record) =>
      record.employee_id === employeeId
      && record.onboarding_plan_id === onboardingPlanId
      && record.stage_code === stageCode),
  );
}
```

- [ ] **Step 3: Them mapper cho timeline entry**

Chen helper nho:

```ts
function mapSelfReviewTimelineEntry(entry: OnboardingSelfReviewEntry): OnboardingStageEvaluationTimelineEntry {
  return {
    id: `timeline-self-review-${entry.id}`,
    stage_code: entry.stage_code,
    entry_type: 'self_review',
    occurred_at: entry.submitted_at,
    headline: 'Tu danh gia moi',
    summary_lines: [
      `Tu tin nhat: ${entry.answers.confidence_tag}`,
      `Can kem sat: ${entry.answers.coaching_tag}`,
      `So nhat: ${entry.answers.fear_tag}`,
    ],
    status_tone: 'neutral',
    raw_ref: entry,
  };
}

function mapMiniQuizTimelineEntry(
  stageCode: OnboardingStageCode,
  template: OnboardingMiniQuizTemplate,
  attempt: OnboardingMiniQuizAttempt,
): OnboardingStageEvaluationTimelineEntry {
  const wrongQuestionCount = getMiniQuizWrongQuestionIds(template, attempt.answers).length;
  return {
    id: `timeline-mini-quiz-${attempt.id}`,
    stage_code: stageCode,
    entry_type: 'mini_quiz',
    occurred_at: attempt.submitted_at,
    headline: `Mini test ${attempt.score}%`,
    summary_lines: [
      `Trang thai: ${getMiniQuizStatusLabel(attempt.score)}`,
      wrongQuestionCount > 0 ? `Can on lai ${wrongQuestionCount} cau` : 'Khong co cau sai',
    ],
    status_tone: attempt.score >= 80 ? 'good' : 'warning',
    raw_ref: attempt,
  };
}

function mapStageGateTimelineEntry(record: OnboardingStageGateRecord): OnboardingStageEvaluationTimelineEntry {
  const retrySummary = record.retry_item_ids.length > 0
    ? `Can lam lai: ${record.retry_item_ids.length} muc`
    : 'Khong co muc lam lai';

  return {
    id: `timeline-stage-gate-${record.id}`,
    stage_code: record.stage_code,
    entry_type: 'stage_gate',
    occurred_at: record.decided_at ?? record.created_at,
    headline:
      record.status === 'da_qua_gate'
        ? 'Gate: Da qua'
        : record.status === 'chua_qua_gate'
          ? 'Gate: Chua qua'
          : 'Gate: Cho duyet',
    summary_lines: [
      record.buddy_note ? `Buddy: ${record.buddy_note}` : 'Buddy: Chua co ghi chu',
      record.manager_note ? `Quan ly: ${record.manager_note}` : 'Quan ly: Chua co ghi chu',
      retrySummary,
    ],
    status_tone: record.status === 'da_qua_gate' ? 'good' : record.status === 'cho_quan_ly_duyet' ? 'neutral' : 'warning',
    raw_ref: record,
  };
}
```

- [ ] **Step 4: Them service build timeline view**

Chen helper public:

```ts
export function getOnboardingStageEvaluationTimelineView(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingStageEvaluationTimelineView {
  const selfReviewView = getOnboardingSelfReviewStageView(employeeId, onboardingPlanId, stageCode);
  const miniQuizView = getOnboardingMiniQuizView(employeeId, onboardingPlanId, stageCode);
  const gateHistory = getOnboardingStageGateHistoryForStage(employeeId, onboardingPlanId, stageCode);

  const entries = [
    ...selfReviewView.history.map(mapSelfReviewTimelineEntry),
    ...(miniQuizView
      ? miniQuizView.history.map((attempt) => mapMiniQuizTimelineEntry(stageCode, miniQuizView.template, attempt))
      : []),
    ...gateHistory.map(mapStageGateTimelineEntry),
  ].sort((left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime());

  return {
    stage_code: stageCode,
    latest_self_review: selfReviewView.latest,
    latest_mini_quiz: miniQuizView?.latest ?? null,
    latest_stage_gate: gateHistory[0] ?? null,
    entries,
  };
}
```

- [ ] **Step 5: Run lint cho service**

Run:

```bash
npx eslint src/lib/career-path-service.ts
```

Expected: exit code `0`

## Task 3: Tao block timeline cho man nhan vien

**Files:**
- Create: `src/components/onboarding-employee/OnboardingEvaluationTimelineCard.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Test: `npx eslint src/components/onboarding-employee/OnboardingEvaluationTimelineCard.tsx src/app/onboarding/page.tsx`

- [ ] **Step 1: Write the failing symbol check**

Run:

```bash
rg -n "OnboardingEvaluationTimelineCard|getOnboardingStageEvaluationTimelineView" src/components/onboarding-employee src/app/onboarding/page.tsx
```

Expected: `OnboardingEvaluationTimelineCard` chua ton tai truoc khi tao file moi

- [ ] **Step 2: Tao card timeline nhan vien**

Tao file:

```tsx
'use client'

import { useState } from 'react'
import type { OnboardingStageEvaluationTimelineView } from '@/lib/career-path-types'

export function OnboardingEvaluationTimelineCard({
  stageLabel,
  timelineView,
}: {
  stageLabel: string
  timelineView: OnboardingStageEvaluationTimelineView
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="animate-slide-up rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Timeline danh gia chang nay</div>
      <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{stageLabel}</h3>
      {timelineView.entries.length === 0 ? (
        <div className="mt-4 rounded-[18px] border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
          Chua co du lieu danh gia trong chang nay.
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {timelineView.entries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="rounded-[18px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <div className="text-xs font-semibold text-[#2F6FA8]">{new Date(entry.occurred_at).toLocaleString('vi-VN')}</div>
                <div className="mt-1 text-sm font-bold text-[#001D3D]">{entry.headline}</div>
                <div className="mt-2 space-y-1 text-sm text-[#475569]">
                  {entry.summary_lines.map((line) => <div key={line}>{line}</div>)}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-4 inline-flex rounded-full bg-[#001D3D] px-4 py-2 text-sm font-semibold text-white"
          >
            {expanded ? 'Thu lich su chang nay' : 'Xem lich su chang nay'}
          </button>

          {expanded ? (
            <div className="mt-4 space-y-3">
              {timelineView.entries.map((entry) => (
                <div key={entry.id} className="rounded-[18px] border border-[#E5E7EB] bg-white p-4">
                  <div className="text-xs font-semibold text-[#2F6FA8]">{new Date(entry.occurred_at).toLocaleString('vi-VN')}</div>
                  <div className="mt-1 text-sm font-bold text-[#001D3D]">{entry.headline}</div>
                  <div className="mt-2 space-y-1 text-sm text-[#475569]">
                    {entry.summary_lines.map((line) => <div key={line}>{line}</div>)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Noi timeline vao `/onboarding`**

Sua `src/app/onboarding/page.tsx`:

```tsx
import { OnboardingEvaluationTimelineCard } from '@/components/onboarding-employee/OnboardingEvaluationTimelineCard'
import { getOnboardingStageEvaluationTimelineView } from '@/lib/career-path-service'
```

Them tinh timeline:

```tsx
  const evaluationTimelineView = checklistBundle && selectedStage
    ? getOnboardingStageEvaluationTimelineView(user.id, checklistBundle.plan.id, selectedStage.code)
    : null
```

Chen block:

```tsx
            {evaluationTimelineView ? (
              <OnboardingEvaluationTimelineCard
                key={`${selectedStage?.code || 'stage'}-timeline`}
                stageLabel={selectedStage?.label || 'Chang hien tai'}
                timelineView={evaluationTimelineView}
              />
            ) : null}
```

- [ ] **Step 4: Run lint cho employee UI**

Run:

```bash
npx eslint src/components/onboarding-employee/OnboardingEvaluationTimelineCard.tsx src/app/onboarding/page.tsx
```

Expected: exit code `0`

## Task 4: Tao block timeline cho operations va noi service detail

**Files:**
- Create: `src/components/onboarding-operations/OnboardingEvaluationTimelineSummary.tsx`
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Test: `npx eslint src/components/onboarding-operations/OnboardingEvaluationTimelineSummary.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx`

- [ ] **Step 1: Write the failing symbol check**

Run:

```bash
rg -n "OnboardingEvaluationTimelineSummary|evaluationTimelineView" src/components/onboarding-operations src/lib/services/onboarding-operations-service.ts
```

Expected: exit code `1`

- [ ] **Step 2: Tao block timeline operations**

Tao file:

```tsx
import { useState } from 'react'
import type { OnboardingStageEvaluationTimelineView } from '@/lib/career-path-types'

export function OnboardingEvaluationTimelineSummary({
  timelineView,
}: {
  timelineView: OnboardingStageEvaluationTimelineView | null
}) {
  const [expanded, setExpanded] = useState(false)

  if (!timelineView) {
    return (
      <div style={{ borderRadius: 18, padding: 12, background: '#F8FAFC', border: '1px solid rgba(0, 29, 61, 0.08)', marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Timeline danh gia chang hien tai
        </div>
        <div style={{ marginTop: 12, borderRadius: 16, padding: 12, background: '#FFFFFF', fontSize: 13, color: '#64748B' }}>
          Chua co du lieu danh gia trong chang nay.
        </div>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 18, padding: 12, background: '#F8FAFC', border: '1px solid rgba(0, 29, 61, 0.08)', marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Timeline danh gia chang hien tai
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {timelineView.entries.slice(0, 3).map((entry) => (
          <div key={entry.id} style={{ borderRadius: 16, padding: 12, background: '#FFFFFF', border: '1px solid rgba(0, 29, 61, 0.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8' }}>{new Date(entry.occurred_at).toLocaleString('vi-VN')}</div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: '#001D3D' }}>{entry.headline}</div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
              {entry.summary_lines.map((line) => <div key={line}>{line}</div>)}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setExpanded((current) => !current)} style={{ marginTop: 12, borderRadius: 999, padding: '8px 12px', background: '#001D3D', color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>
        {expanded ? 'Thu lich su trong chang' : 'Xem lich su trong chang'}
      </button>
      {expanded ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {timelineView.entries.map((entry) => (
            <div key={entry.id} style={{ borderRadius: 16, padding: 12, background: '#FFFFFF', border: '1px solid rgba(0, 29, 61, 0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8' }}>{new Date(entry.occurred_at).toLocaleString('vi-VN')}</div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: '#001D3D' }}>{entry.headline}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                {entry.summary_lines.map((line) => <div key={line}>{line}</div>)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: Noi timeline vao operations service**

Sua `src/lib/services/onboarding-operations-service.ts`:

```ts
import type { OnboardingStageEvaluationTimelineView } from '@/lib/career-path-types'
import { getOnboardingStageEvaluationTimelineView } from '@/lib/career-path-service'
```

Them vao detail model:

```ts
  evaluationTimelineView: OnboardingStageEvaluationTimelineView | null
```

Trong `getEmployeeDetail(...)` them:

```ts
    const evaluationTimelineView = onboardingPlan
      ? getOnboardingStageEvaluationTimelineView(employee.id, onboardingPlan.id, onboardingPlan.current_stage_code)
      : null
```

Gan vao return:

```ts
      evaluationTimelineView,
```

- [ ] **Step 4: Doi operations panel sang block timeline chung**

Sua `src/components/onboarding-operations/OperationsChecklistDetail.tsx`:

```tsx
import { OnboardingEvaluationTimelineSummary } from '@/components/onboarding-operations/OnboardingEvaluationTimelineSummary'
```

Chen block:

```tsx
      <OnboardingEvaluationTimelineSummary timelineView={detail.evaluationTimelineView} />
```

Trong task nay bo cac block rieng:

```tsx
      <OnboardingMiniQuizSummary ... />
      <OnboardingSelfReviewSummary ... />
      <OnboardingStageGatePanel ... />
```

Chi giu lai timeline block + `HistoryPanel`.

- [ ] **Step 5: Run lint cho operations UI/service**

Run:

```bash
npx eslint src/components/onboarding-operations/OnboardingEvaluationTimelineSummary.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx
```

Expected: exit code `0`

## Task 5: Cap nhat tai lieu va verify full Pass D

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md` (chi neu can)
- Test: `npx eslint ...`, `npm run build`

- [ ] **Step 1: Cap nhat CODEMAP**

Them component/service moi vao muc onboarding:

```md
- File chinh: `src/lib/services/onboarding-policy-service.ts`, `src/lib/services/onboarding-operations-service.ts`, `src/app/career-path/settings/page.tsx`, `src/app/career-path/onboarding/page.tsx`, `src/components/onboarding-operations/*`, `src/components/onboarding-operations/OnboardingEvaluationTimelineSummary.tsx`, `src/components/onboarding-employee/*`, `src/components/onboarding-employee/OnboardingEvaluationTimelineCard.tsx`, `src/app/onboarding/page.tsx`
```

Cap nhat mo ta dung khi:

```md
- Dung khi: ... flow `timeline lich su danh gia theo chang`, `mini test theo chang`, hoac `gate tong ket chang`
```

- [ ] **Step 2: Run lint tren full file set Pass D**

Run:

```bash
npx eslint src/lib/career-path-types.ts src/lib/career-path-service.ts src/components/onboarding-employee/OnboardingEvaluationTimelineCard.tsx src/app/onboarding/page.tsx src/components/onboarding-operations/OnboardingEvaluationTimelineSummary.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/OperationsChecklistDetail.tsx src/app/career-path/onboarding/page.tsx
```

Expected: exit code `0`

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: exit code `0`

- [ ] **Step 4: Run HTTP smoke checks**

Run:

```bash
powershell -Command "try { (Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3333/onboarding -TimeoutSec 5).StatusCode } catch { $_.Exception.Message }"
powershell -Command "try { (Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3333/career-path/onboarding -TimeoutSec 5).StatusCode } catch { $_.Exception.Message }"
```

Expected:

```text
200
200
```

## Self-Review

- Spec coverage:
  - 2 mat hien thi: Task 3 + Task 4
  - hybrid theo chang: Task 3 + Task 4
  - chi gom self-review + mini quiz + gate: Task 2 + Task 4
  - gate history: Task 2
  - khong doi logic quiz/gate: Task 2 chi read/merge, Task 4 chi hien thi
- Placeholder scan:
  - khong con `TBD`, `TODO`, hay "lam sau"
- Type consistency:
  - `OnboardingStageEvaluationTimelineEntry`
  - `OnboardingStageEvaluationTimelineView`
  - `getOnboardingStageEvaluationTimelineView`
  - `evaluationTimelineView`

