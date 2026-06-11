# Onboarding Operations Day Journey Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace current task-first step header with a day-based onboarding journey overview so operators can scan `Ngay 1 -> Ngay N`, open any day quickly, and see a single `Hom nay can lam gi` focus block.

**Architecture:** Keep current route, checklist actions, and local-storage-backed onboarding progress intact. Add a presentation layer that maps existing checklist phases into day summaries, exposes a selected journey day in page state, and renders a left day timeline plus a right day-detail panel while pushing evaluation/history blocks into secondary sections.

**Tech Stack:** Next.js App Router, React 19 client components, TypeScript, inline-style onboarding UI pattern, Node `node:test` contract tests.

---

## File Map

### Existing files to modify
- `src/lib/services/onboarding-operations-service.ts`
  - Extend exported types and overview/detail builders with day-journey presentation data derived from existing checklist/progress state.
- `src/app/career-path/onboarding/page.tsx`
  - Replace 4-step top timeline wiring with selected-day journey wiring and page-level `selectedDayIndex` state.
- `src/components/onboarding-operations/OnboardingOpsTimeline.tsx`
  - Replace current horizontal step timeline with vertical `Ngay 1 -> Ngay N` journey list UI.
- `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
  - Render selected-day header, `Hom nay can lam gi`, day-scoped task list, and secondary blocks below.
- `tests/onboarding-operations-task-first-contract.test.ts`
  - Retire obsolete 4-step assertions and replace with day-journey contract checks.
- `tests/onboarding-overview-contract.test.ts`
  - Extend route-level assertions for new journey wording if route source is covered there.
- `tests/onboarding-operations-service-overview.test.ts`
  - Add service-level assertions for journey summary derivation.

### New files to create
- `src/components/onboarding-operations/OnboardingDayJourneySummary.tsx`
  - Optional focused component for `Hom nay can lam gi` block if detail file starts getting too large.
- `tests/onboarding-operations-day-journey-contract.test.ts`
  - New contract coverage for route/component source and service shape.

### Existing files to leave unchanged in this pass
- `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
  - Keep employee selection queue unless implementation proves page becomes too dense.
- `src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx`
  - Keep helper copy but demote placement under day focus if needed.
- `src/components/onboarding-operations/OnboardingEvaluationTimelineSummary.tsx`
  - Reuse as secondary information block.

## Current-State Notes
- Current route already has `OnboardingOpsTimeline`, but it is a 4-step horizontal header tied to `resolveActiveStep(detail)`.
- Current detail pane already exposes checklist actions and sticky guide; plan must preserve behavior while changing top-level information architecture.
- Service currently exposes `OnboardingOpsWorkspaceOverview` and `OnboardingOpsEmployeeDetail`, but neither contains day-based journey view models.
- Existing contract test `tests/onboarding-operations-task-first-contract.test.ts` is tied to mojibake source strings from prior pass; update tests by matching stable ASCII helper/type names where possible, or by checking explicit new strings from source after edits.

## Data Model Direction

Add presentation-only types to `src/lib/services/onboarding-operations-service.ts`:

```ts
export type OnboardingJourneyDayStatus = 'past' | 'today' | 'upcoming' | 'warning' | 'done' | 'empty'

export interface OnboardingJourneyDayTask {
  key: OnboardingOpsChecklistKey | 'follow_up'
  title: string
  description: string
  statusLabel: string
  isDone: boolean
  isPrimary: boolean
}

export interface OnboardingJourneyDaySummary {
  dayIndex: number
  title: string
  status: OnboardingJourneyDayStatus
  statusLabel: string
  taskCount: number
  primaryActionLabel: string
  phaseLabel: string
  isToday: boolean
}

export interface OnboardingJourneyDayDetail {
  dayIndex: number
  title: string
  phaseLabel: string
  status: OnboardingJourneyDayStatus
  statusLabel: string
  focusTitle: string
  focusActionLabel: string
  nextActionLabel: string
  tasks: OnboardingJourneyDayTask[]
  isEmpty: boolean
}
```

Extend detail and overview types:

```ts
export interface OnboardingOpsWorkspaceOverview {
  ...
  journeyLength: number
  suggestedTodayIndex: number
}

export interface OnboardingOpsEmployeeDetail {
  ...
  journeyDays: OnboardingJourneyDaySummary[]
  suggestedTodayIndex: number
}
```

Keep all journey fields presentation-only. No storage migration in this pass.

---

### Task 1: Lock Service Contracts With Failing Tests

**Files:**
- Modify: `tests/onboarding-operations-service-overview.test.ts`
- Create: `tests/onboarding-operations-day-journey-contract.test.ts`
- Test: `tests/onboarding-operations-service-overview.test.ts`, `tests/onboarding-operations-day-journey-contract.test.ts`

- [ ] **Step 1: Add failing service assertions for journey metadata**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { OnboardingOperationsService } from '@/lib/services/onboarding-operations-service'
import { createMockUser } from './support/onboarding-test-helpers'

test('workspace overview exposes configurable journey length and suggested today index', () => {
  const user = createMockUser({ role: 'admin' })
  const overview = OnboardingOperationsService.getWorkspaceOverview(user)

  assert.equal(typeof overview.journeyLength, 'number')
  assert.ok(overview.journeyLength >= 7)
  assert.ok(overview.suggestedTodayIndex >= 1)
  assert.ok(overview.suggestedTodayIndex <= overview.journeyLength)
})

test('employee detail exposes journey summaries for every day in range', () => {
  const user = createMockUser({ role: 'admin' })
  const overview = OnboardingOperationsService.getWorkspaceOverview(user)
  const employeeId = overview.allRows[0]?.employeeId
  assert.ok(employeeId)

  const detail = OnboardingOperationsService.getEmployeeDetail(employeeId!, user)
  assert.ok(detail)
  assert.equal(detail!.journeyDays.length, overview.journeyLength)
  assert.match(detail!.journeyDays[0]!.title, /^Ngay 1$/)
})
```

- [ ] **Step 2: Add failing source-contract assertions for journey UI**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(resolve(process.cwd(), 'src/app/career-path/onboarding/page.tsx'), 'utf8')
const timelineSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-operations/OnboardingOpsTimeline.tsx'), 'utf8')
const detailSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-operations/OperationsChecklistDetail.tsx'), 'utf8')

test('route source references day journey selection state', () => {
  assert.match(pageSource, /selectedDayIndex/)
  assert.match(pageSource, /suggestedTodayIndex/)
})

test('timeline source renders day-based journey wording', () => {
  assert.match(timelineSource, /Ngay \{day\.dayIndex\}/)
  assert.match(timelineSource, /Tong .* ngay/)
})

test('detail source renders day focus block', () => {
  assert.match(detailSource, /Hom nay can lam gi|Trong ngay nay can lam gi/)
  assert.match(detailSource, /focusActionLabel/)
  assert.match(detailSource, /nextActionLabel/)
})
```

- [ ] **Step 3: Run tests to confirm they fail**

Run:
- `node --test tests/onboarding-operations-service-overview.test.ts`
- `node --test tests/onboarding-operations-day-journey-contract.test.ts`

Expected: `FAIL` because journey metadata, `selectedDayIndex`, and day-based source strings do not exist yet.

- [ ] **Step 4: Commit red tests**

```bash
git add tests/onboarding-operations-service-overview.test.ts tests/onboarding-operations-day-journey-contract.test.ts
git commit -m "test: lock onboarding day journey contracts"
```

### Task 2: Add Journey View Models To Service

**Files:**
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Test: `tests/onboarding-operations-service-overview.test.ts`

- [ ] **Step 1: Add exported journey types near existing onboarding ops types**

```ts
export type OnboardingJourneyDayStatus = 'past' | 'today' | 'upcoming' | 'warning' | 'done' | 'empty'

export interface OnboardingJourneyDayTask {
  key: OnboardingOpsChecklistKey | 'follow_up'
  title: string
  description: string
  statusLabel: string
  isDone: boolean
  isPrimary: boolean
}

export interface OnboardingJourneyDaySummary {
  dayIndex: number
  title: string
  status: OnboardingJourneyDayStatus
  statusLabel: string
  taskCount: number
  primaryActionLabel: string
  phaseLabel: string
  isToday: boolean
}

export interface OnboardingJourneyDayDetail {
  dayIndex: number
  title: string
  phaseLabel: string
  status: OnboardingJourneyDayStatus
  statusLabel: string
  focusTitle: string
  focusActionLabel: string
  nextActionLabel: string
  tasks: OnboardingJourneyDayTask[]
  isEmpty: boolean
}
```

- [ ] **Step 2: Extend overview/detail interfaces with journey fields**

```ts
export interface OnboardingOpsWorkspaceOverview {
  rows: OnboardingOpsListRow[]
  allRows: OnboardingOpsListRow[]
  filters: OnboardingOpsQuickFilter[]
  stats: OnboardingOpsWorkspaceStat[]
  activeFilter: OnboardingOpsPriorityFilter
  systemStatus: OnboardingOverviewSystemStatus
  configSummary: OnboardingOverviewConfigSummary
  urgentItems: OnboardingOverviewUrgentItem[]
  journeyLength: number
  suggestedTodayIndex: number
}

export interface OnboardingOpsEmployeeDetail {
  ...
  journeyDays: OnboardingJourneyDaySummary[]
  suggestedTodayIndex: number
}
```

- [ ] **Step 3: Add helper for configurable journey length**

```ts
function getJourneyLength() {
  const settings = getSettings().onboarding_operations
  const configured = settings?.lookahead_days

  if (typeof configured === 'number' && configured >= 7 && configured <= 30) {
    return configured
  }

  return 10
}
```

If actual settings keys differ after inspection, use real keys and update every later task consistently.

- [ ] **Step 4: Add helpers to map checklist/follow-up into day summaries**

```ts
function getSuggestedTodayIndex(hireDate: string, journeyLength: number) {
  const delta = getDaysUntil(hireDate)
  if (!Number.isFinite(delta)) return 1
  if (delta > 0) return Math.max(1, journeyLength - delta)
  return Math.min(journeyLength, Math.abs(delta) + 1)
}

function buildJourneyDays(input: {
  journeyLength: number
  suggestedTodayIndex: number
  checklist: OnboardingOpsChecklistItem[]
  followUpLevel: OnboardingOpsFollowUpLevel | null
}): OnboardingJourneyDaySummary[] {
  const beforeShiftPending = input.checklist.filter((item) => item.phase === 'before_first_shift' && !item.done)
  const afterShiftPending = input.checklist.filter((item) => item.phase === 'after_first_shift' && !item.done)

  return Array.from({ length: input.journeyLength }, (_, offset) => {
    const dayIndex = offset + 1
    const isToday = dayIndex === input.suggestedTodayIndex
    const isBeforeShiftWindow = dayIndex <= input.suggestedTodayIndex
    const phaseLabel = isBeforeShiftWindow ? 'Chuan bi truoc ngay dau' : 'Theo doi sau ca dau'
    const taskPool = isBeforeShiftWindow ? beforeShiftPending : afterShiftPending
    const primary = taskPool[0]
    const status: OnboardingJourneyDayStatus = primary
      ? (isToday ? 'today' : dayIndex < input.suggestedTodayIndex ? 'warning' : 'upcoming')
      : isToday
        ? 'empty'
        : dayIndex < input.suggestedTodayIndex
          ? 'done'
          : 'upcoming'

    return {
      dayIndex,
      title: `Ngay ${dayIndex}`,
      status,
      statusLabel: status === 'today' ? 'Hom nay' : status === 'warning' ? 'Can xu ly' : status === 'done' ? 'Da xong' : status === 'empty' ? 'Khong co viec' : 'Sap toi',
      taskCount: taskPool.length,
      primaryActionLabel: primary?.label ?? 'Khong co dau viec uu tien',
      phaseLabel,
      isToday,
    }
  })
}
```

This is intentionally minimal. If exact mapping needs refinement, keep interface stable and refine helper logic in later tasks.

- [ ] **Step 5: Thread journey fields through overview/detail builders**

Update overview return:

```ts
const journeyLength = getJourneyLength()
const suggestedTodayIndex = allRows.length > 0
  ? Math.min(...allRows.map((row) => getSuggestedTodayIndex(row.hireDate, journeyLength)))
  : 1

return {
  ...existingOverview,
  journeyLength,
  suggestedTodayIndex,
}
```

Update detail return:

```ts
const journeyLength = getJourneyLength()
const suggestedTodayIndex = getSuggestedTodayIndex(employee.hire_date, journeyLength)
const journeyDays = buildJourneyDays({
  journeyLength,
  suggestedTodayIndex,
  checklist,
  followUpLevel: progress?.followUpLevel ?? null,
})

return {
  ...existingDetail,
  journeyDays,
  suggestedTodayIndex,
}
```

- [ ] **Step 6: Run service test until green**

Run: `node --test tests/onboarding-operations-service-overview.test.ts`

Expected: PASS for new journey metadata assertions.

- [ ] **Step 7: Commit service contract layer**

```bash
git add src/lib/services/onboarding-operations-service.ts tests/onboarding-operations-service-overview.test.ts
git commit -m "feat: add onboarding journey day view models"
```

### Task 3: Replace Top Header With Day Journey Timeline UI

**Files:**
- Modify: `src/components/onboarding-operations/OnboardingOpsTimeline.tsx`
- Test: `tests/onboarding-operations-day-journey-contract.test.ts`

- [ ] **Step 1: Replace old step-based props with day-journey props**

```tsx
import type { OnboardingJourneyDaySummary } from '@/lib/services/onboarding-operations-service'

export type OnboardingOpsTimelineSummary = {
  totalDays: number
  todayIndex: number
  immediateCount: number
  warningCount: number
}

export function OnboardingOpsTimeline({
  days,
  selectedDayIndex,
  onSelectDay,
  summary,
}: {
  days: OnboardingJourneyDaySummary[]
  selectedDayIndex: number
  onSelectDay: (dayIndex: number) => void
  summary: OnboardingOpsTimelineSummary
}) {
  return <section>placeholder</section>
}
```

- [ ] **Step 2: Implement vertical day list layout**

```tsx
export function OnboardingOpsTimeline({ days, selectedDayIndex, onSelectDay, summary }: { ... }) {
  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 29, 61, 0.08)',
        borderRadius: 28,
        padding: 18,
        boxShadow: '0 10px 30px rgba(0, 29, 61, 0.05)',
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
        Hanh trinh onboarding
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: '#5F6B7A', lineHeight: 1.45 }}>
        Tong {summary.totalDays} ngay • Hom nay: Ngay {summary.todayIndex} • {summary.immediateCount} viec can lam ngay
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        {days.map((day) => {
          const isSelected = day.dayIndex === selectedDayIndex
          return (
            <button
              key={day.dayIndex}
              type="button"
              onClick={() => onSelectDay(day.dayIndex)}
              style={{
                width: '100%',
                textAlign: 'left',
                borderRadius: 18,
                border: isSelected ? '1.5px solid #2F6FA8' : '1px solid rgba(0, 29, 61, 0.08)',
                background: isSelected ? '#F8FBFF' : '#FFFDF9',
                padding: 14,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#001D3D' }}>Ngay {day.dayIndex}</div>
                  <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 4 }}>{day.phaseLabel}</div>
                </div>
                <span style={{ borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(47, 111, 168, 0.10)', color: '#2F6FA8' }}>
                  {day.statusLabel}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 8 }}>{day.taskCount} viec</div>
              <div style={{ fontSize: 12, color: '#001D3D', marginTop: 6, fontWeight: 700 }}>Uu tien: {day.primaryActionLabel}</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Run contract test for timeline source**

Run: `node --test tests/onboarding-operations-day-journey-contract.test.ts`

Expected: timeline wording assertion passes; route/detail assertions still fail.

- [ ] **Step 4: Commit timeline UI**

```bash
git add src/components/onboarding-operations/OnboardingOpsTimeline.tsx tests/onboarding-operations-day-journey-contract.test.ts
git commit -m "feat: replace onboarding step header with day journey timeline"
```

### Task 4: Wire Selected Day State Into Route

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Test: `tests/onboarding-operations-day-journey-contract.test.ts`

- [ ] **Step 1: Replace old `buildTimelineSteps` helper with selected-day state**

```tsx
const [selectedDayIndex, setSelectedDayIndex] = useState(1)

useEffect(() => {
  if (detail?.suggestedTodayIndex) {
    setSelectedDayIndex((current) => {
      if (current >= 1 && current <= detail.journeyDays.length) return current
      return detail.suggestedTodayIndex
    })
  }
}, [detail?.employeeId, detail?.suggestedTodayIndex, detail?.journeyDays.length])
```

- [ ] **Step 2: Feed journey props into timeline component**

```tsx
<OnboardingOpsTimeline
  days={detail?.journeyDays ?? []}
  selectedDayIndex={detail?.journeyDays.some((day) => day.dayIndex === selectedDayIndex) ? selectedDayIndex : detail?.suggestedTodayIndex ?? overview.suggestedTodayIndex}
  onSelectDay={setSelectedDayIndex}
  summary={{
    totalDays: overview.journeyLength,
    todayIndex: detail?.suggestedTodayIndex ?? overview.suggestedTodayIndex,
    immediateCount: overview.allRows.filter((row) => row.priorityKey === 'block_day_one').length,
    warningCount: overview.allRows.filter((row) => row.priorityKey === 'need_follow_up').length,
  }}
/>
```

- [ ] **Step 3: Pass selected day into detail pane**

```tsx
<OperationsChecklistDetail
  detail={detail}
  selectedDayIndex={detail?.journeyDays.some((day) => day.dayIndex === selectedDayIndex) ? selectedDayIndex : detail?.suggestedTodayIndex ?? 1}
  onMarkFirstShift={handleMarkFirstShift}
  ...
/>
```

- [ ] **Step 4: Update route title copy away from old step language**

```tsx
<div style={{ marginTop: 6, fontSize: 13, color: '#5F6B7A' }}>
  Nhin toan bo hanh trinh onboarding theo ngay, mo nhanh tung ngay de biet can lam gi truoc.
</div>
```

- [ ] **Step 5: Run route contract test**

Run: `node --test tests/onboarding-operations-day-journey-contract.test.ts`

Expected: route source assertions pass; detail assertions still fail.

- [ ] **Step 6: Commit route wiring**

```bash
git add src/app/career-path/onboarding/page.tsx tests/onboarding-operations-day-journey-contract.test.ts
git commit -m "feat: wire selected onboarding journey day into route"
```

### Task 5: Build Selected-Day Detail Model And Focus Block

**Files:**
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Create: `src/components/onboarding-operations/OnboardingDayJourneySummary.tsx`
- Test: `tests/onboarding-operations-day-journey-contract.test.ts`

- [ ] **Step 1: Add selected-day prop and local resolver**

```tsx
function buildSelectedDayDetail(detail: OnboardingOpsEmployeeDetail, selectedDayIndex: number): OnboardingJourneyDayDetail {
  const selectedDay = detail.journeyDays.find((day) => day.dayIndex === selectedDayIndex) ?? detail.journeyDays[0]
  const activePhase = selectedDayIndex <= detail.suggestedTodayIndex ? 'before_first_shift' : 'after_first_shift'
  const phaseItems = detail.checklist.filter((item) => item.phase === activePhase)
  const pending = phaseItems.filter((item) => !item.done)
  const primary = pending[0] ?? phaseItems[0] ?? null

  return {
    dayIndex: selectedDay?.dayIndex ?? selectedDayIndex,
    title: `Ngay ${selectedDay?.dayIndex ?? selectedDayIndex}`,
    phaseLabel: selectedDay?.phaseLabel ?? 'Chuan bi truoc ngay dau',
    status: selectedDay?.status ?? 'upcoming',
    statusLabel: selectedDay?.statusLabel ?? 'Sap toi',
    focusTitle: selectedDay?.isToday ? 'Hom nay can lam gi' : 'Trong ngay nay can lam gi',
    focusActionLabel: primary ? `Lam ngay: ${primary.label}` : 'Lam ngay: Khong co dau viec uu tien',
    nextActionLabel: pending[1] ? `Sau do: ${pending[1].label}` : 'Sau do: Kiem tra lich su va danh gia',
    tasks: phaseItems.map((item, index) => ({
      key: item.key,
      title: item.label,
      description: getPurposeCopy(item.key),
      statusLabel: item.done ? 'Da xong' : item.severity === 'block' ? 'Can xu ly' : 'Can chuan bi',
      isDone: item.done,
      isPrimary: index === 0,
    })),
    isEmpty: phaseItems.length === 0,
  }
}
```

- [ ] **Step 2: Add focused summary component**

```tsx
export function OnboardingDayJourneySummary({
  title,
  focusActionLabel,
  nextActionLabel,
}: {
  title: string
  focusActionLabel: string
  nextActionLabel: string
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 16,
        background: '#FFF8E8',
        border: '1px solid rgba(246, 200, 95, 0.35)',
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D' }}>{title}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#001D3D', marginTop: 8 }}>{focusActionLabel}</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6 }}>{nextActionLabel}</div>
    </div>
  )
}
```

- [ ] **Step 3: Integrate selected-day header and focus block into detail pane**

```tsx
const dayDetail = buildSelectedDayDetail(detail, selectedDayIndex)

<div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
  Hanh trinh theo ngay
</div>
<div style={{ fontSize: 24, fontWeight: 800, color: '#001D3D', marginTop: 4 }}>{dayDetail.title}</div>
<div style={{ fontSize: 13, color: '#4A5A6A', marginTop: 6 }}>{dayDetail.phaseLabel} • {dayDetail.statusLabel}</div>

<OnboardingDayJourneySummary
  title={dayDetail.focusTitle}
  focusActionLabel={dayDetail.focusActionLabel}
  nextActionLabel={dayDetail.nextActionLabel}
/>
```

- [ ] **Step 4: Run detail contract test**

Run: `node --test tests/onboarding-operations-day-journey-contract.test.ts`

Expected: all source-contract assertions pass.

- [ ] **Step 5: Commit detail focus block**

```bash
git add src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingDayJourneySummary.tsx tests/onboarding-operations-day-journey-contract.test.ts
git commit -m "feat: add selected onboarding day detail focus block"
```

### Task 6: Restrict Task Rendering To Selected Day Context

**Files:**
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Test: `tests/onboarding-operations-day-journey-contract.test.ts`

- [ ] **Step 1: Replace unconditional before/after sections with selected-day sections**

```tsx
const selectedPhase = selectedDayIndex <= detail.suggestedTodayIndex ? 'before_first_shift' : 'after_first_shift'
const selectedItems = detail.checklist.filter((item) => item.phase === selectedPhase)

<ChecklistSection
  title={selectedPhase === 'before_first_shift' ? 'Cong viec cua ngay nay' : 'Theo doi cua ngay nay'}
  items={selectedItems}
  detail={detail}
  activePhase={selectedPhase}
  nextItemKey={selectedItems.find((item) => !item.done)?.key ?? null}
  ...
/>
```

- [ ] **Step 2: Add empty-day branch before task section**

```tsx
{dayDetail.isEmpty ? (
  <div
    style={{
      borderRadius: 18,
      padding: 14,
      background: '#FFFFFF',
      border: '1px solid rgba(0, 29, 61, 0.08)',
      color: '#5F6B7A',
      marginBottom: 16,
    }}
  >
    Ngay nay khong co dau viec van hanh. Chuyen sang ngay tiep theo de xem cong viec sap toi.
  </div>
) : (
  <ChecklistSection ... />
)}
```

- [ ] **Step 3: Keep actions and helper copy unchanged inside task cards**

Do not remove existing handlers:
- `onMarkFirstShift`
- `onAssignBuddy`
- `onConfirmStorePolicy`
- `onToggleTools`
- `onSetFirstShiftResult`
- `onSaveFirstShiftNote`
- `onSetFollowUp`

Only reduce visible list to selected-day context.

- [ ] **Step 4: Run source contract test again**

Run: `node --test tests/onboarding-operations-day-journey-contract.test.ts`

Expected: PASS remains stable after render restructuring.

- [ ] **Step 5: Commit selected-day task rendering**

```bash
git add src/components/onboarding-operations/OperationsChecklistDetail.tsx
git commit -m "feat: scope onboarding tasks to selected journey day"
```

### Task 7: Demote Secondary Blocks And Tidy Helper Copy

**Files:**
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Modify: `src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx`
- Test: `tests/onboarding-overview-contract.test.ts`, `tests/onboarding-operations-day-journey-contract.test.ts`

- [ ] **Step 1: Move sticky guide below focus block and above task list only if still helpful**

```tsx
<OnboardingDayJourneySummary ... />
<OnboardingOpsStickyGuide
  activeStepTitle={dayDetail.phaseLabel}
  nextActionLabel={dayDetail.nextActionLabel}
/>
```

If guide feels too noisy during implementation, move it below task list instead of removing it entirely.

- [ ] **Step 2: Push evaluation timeline and history into explicit secondary section**

```tsx
<div style={{ marginTop: 18 }}>
  <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53', marginBottom: 8 }}>
    Thong tin tham chieu
  </div>
  <OnboardingEvaluationTimelineSummary timelineView={detail.evaluationTimelineView} />
  <HistoryPanel history={detail.history} />
</div>
```

- [ ] **Step 3: Update no-detail empty copy to match new IA**

```tsx
<div style={{ fontSize: 16, fontWeight: 700, color: '#001D3D' }}>Chon 1 nguoi de xem hanh trinh</div>
<div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 8 }}>
  Bat dau tu cot trai de thay toan bo Ngay 1 den Ngay N, sau do mo nhanh chi tiet tung ngay.
</div>
```

- [ ] **Step 4: Run route and contract tests**

Run:
- `node --test tests/onboarding-overview-contract.test.ts`
- `node --test tests/onboarding-operations-day-journey-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit IA polish**

```bash
git add src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx tests/onboarding-overview-contract.test.ts
 git commit -m "feat: demote onboarding secondary detail blocks"
```

### Task 8: Manual Smoke Verification On Real Demo Data

**Files:**
- Modify: none
- Test: manual app verification

- [ ] **Step 1: Start app**

Run: `npm run dev`

Expected: Next dev server starts successfully on configured local port.

- [ ] **Step 2: Verify admin workflow**

Manual script:
1. Log in as `yen@bobahouse.vn`.
2. Open `/career-path/onboarding`.
3. Confirm top section shows `Hanh trinh onboarding` with `Tong X ngay` and `Hom nay: Ngay Y`.
4. Confirm left journey list shows `Ngay 1 -> Ngay N` and each row has status, task count, and `Uu tien:` line.
5. Click `Ngay 1`, `Ngay 2`, and `Ngay 3`.
6. Confirm right pane header changes by selected day and `Hom nay can lam gi` or `Trong ngay nay can lam gi` updates.
7. Trigger one real action such as assigning buddy or toggling tool state.
8. Confirm no crash and selected day remains stable after refresh.

- [ ] **Step 3: Verify second role view**

Manual script:
1. Log in as `tuan@bobahouse.vn`.
2. Open `/career-path/onboarding`.
3. Confirm same journey overview renders and detail blocks stay in secondary position.

- [ ] **Step 4: Record mapping gaps**

If service mapping causes unrealistic `Ngay N` placement, log exact symptom and adjust helper logic before final handoff. Do not change storage schema in this pass.

### Task 9: Final Verification And Handoff

**Files:**
- Modify: any touched files above
- Test: all relevant automated tests

- [ ] **Step 1: Run final test suite for affected onboarding area**

Run:
- `node --test tests/onboarding-operations-service-overview.test.ts`
- `node --test tests/onboarding-operations-day-journey-contract.test.ts`
- `node --test tests/onboarding-overview-contract.test.ts`
- `node --test tests/demo-onboarding-accounts.test.ts`

Expected: PASS.

- [ ] **Step 2: Summarize known limitations in handoff**

Record clearly:
- day mapping is presentation-only and may still approximate real operational chronology,
- no service/storage migration was introduced,
- `UpcomingOnboardingList` remains employee queue and was not merged into journey overview,
- if settings lacked explicit day-count key, implementation used safe fallback default and should be aligned later.

- [ ] **Step 3: Commit final feature batch**

```bash
git add src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/OnboardingOpsTimeline.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingDayJourneySummary.tsx src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx tests/onboarding-operations-service-overview.test.ts tests/onboarding-operations-day-journey-contract.test.ts tests/onboarding-overview-contract.test.ts
git commit -m "feat: add onboarding operations day journey timeline"
```

## Self-Review
- Spec coverage: plan covers journey overview, day-based labels, selected-day detail, `Hom nay can lam gi`, secondary block demotion, and configurable day count fallback. It intentionally leaves route IA and checklist action handlers intact.
- Placeholder scan: one inspection note remains around actual settings key for day count. Resolve it during Task 2 Step 3 by reading real settings object before coding; once verified, propagate exact key names through implementation.
- Type consistency: all later tasks use `journeyLength`, `suggestedTodayIndex`, `journeyDays`, `selectedDayIndex`, and `OnboardingJourneyDay*` names consistently.

