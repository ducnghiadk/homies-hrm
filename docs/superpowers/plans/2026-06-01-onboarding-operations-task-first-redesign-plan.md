# Onboarding Operations Task-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `V?n hành onboarding` so first-time HR users can understand screen purpose, priority flow, next action, and card meaning without external training.

**Architecture:** Keep existing 2-column layout and service contracts, then add a task-first presentation layer on top. New work stays in UI/page components: a top timeline summary, a left queue with step/next-action labels, and a right sticky guide + step-focused checklist ordering.

**Tech Stack:** Next.js App Router, React 19 client components, TypeScript, inline style pattern already used in onboarding components, Node `node:test` contract tests.

---

## File Map

### Existing files to modify
- `src/app/career-path/onboarding/page.tsx`
  - Own top-level page composition, active employee selection, summary cards, and route-level copy.
- `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
  - Own left queue UI, queue header, filter tabs, and employee card presentation.
- `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
  - Own right pane header, sticky guide, checklist ordering, and per-card explanatory copy.
- `tests/onboarding-overview-contract.test.ts`
  - Extend route-level contract coverage for onboarding page wording if needed.
- `tests/demo-onboarding-accounts.test.ts`
  - Keep seeded onboarding account contract in place.

### New files to create
- `src/components/onboarding-operations/OnboardingOpsTimeline.tsx`
  - Render 4-step horizontal timeline and “Hôm nay c?n gì” summary bar.
- `src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx`
  - Render sticky help panel for new users.
- `tests/onboarding-operations-task-first-contract.test.ts`
  - Contract-test key task-first copy and structure in page/components.

### No service changes in this pass
- `src/lib/services/onboarding-operations-service.ts`
  - Read only for deriving UI labels from existing data. Do not change contracts in this pass.

## Implementation Notes
- Keep technical filter keys and service output unchanged.
- Presentation layer may remap labels:
  - `block_day_one` -> `Làm ngay`
  - `need_follow_up` -> `Theo dõi sau ca`
  - `ready` -> `Ðã s?n sàng`
- Active step logic stays local to page/detail UI:
  - no selected employee -> step 2
  - pending `before_first_shift` item -> step 3
  - otherwise -> step 4
- `Vi?c k? ti?p` comes from first unfinished item in active phase, preferring `block` severity before `attention`.

---

### Task 1: Add Failing Contract Tests For Task-First UI

**Files:**
- Create: `tests/onboarding-operations-task-first-contract.test.ts`
- Modify: none
- Test: `tests/onboarding-operations-task-first-contract.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(resolve(process.cwd(), 'src/app/career-path/onboarding/page.tsx'), 'utf8')
const listSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-operations/UpcomingOnboardingList.tsx'), 'utf8')
const detailSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-operations/OperationsChecklistDetail.tsx'), 'utf8')

test('onboarding page exposes 4-step task-first header', () => {
  assert.match(pageSource, /Xem uu tiên hôm nay/)
  assert.match(pageSource, /Ch?n nhân s?/)
  assert.match(pageSource, /Chu?n b? tru?c ngày d?u/)
  assert.match(pageSource, /Theo dõi sau ca d?u/)
})

test('left queue explains step and next action', () => {
  assert.match(listSource, /Bu?c 2: Ch?n nhân s? c?n x? lý/)
  assert.match(listSource, /Vi?c k? ti?p/)
  assert.match(listSource, /Ðang ? bu?c/)
})

test('right pane exposes sticky guide and card meaning copy', () => {
  assert.match(detailSource, /Màn này dùng d? làm gì/)
  assert.match(detailSource, /Card bên du?i nghia là gì/)
  assert.match(detailSource, /Dùng d?/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/onboarding-operations-task-first-contract.test.ts`

Expected: `FAIL` because current page/component source does not contain new task-first copy yet.

- [ ] **Step 3: Commit test file only after verifying red**

```bash
git add tests/onboarding-operations-task-first-contract.test.ts
git commit -m "test: add onboarding task-first contract coverage"
```

If git is unavailable in this workspace, skip commit and record that limitation in handoff.

---

### Task 2: Build Reusable Top Timeline Component

**Files:**
- Create: `src/components/onboarding-operations/OnboardingOpsTimeline.tsx`
- Test: `tests/onboarding-operations-task-first-contract.test.ts`

- [ ] **Step 1: Write minimal component skeleton**

```tsx
export type OnboardingOpsTimelineStep = {
  key: 'today' | 'select' | 'before_shift' | 'after_shift'
  title: string
  description: string
  status: 'current' | 'upcoming' | 'complete'
}

export type OnboardingOpsTimelineSummary = {
  immediateCount: number
  followUpCount: number
  ctaLabel: string
}

export function OnboardingOpsTimeline({
  steps,
  summary,
}: {
  steps: OnboardingOpsTimelineStep[]
  summary: OnboardingOpsTimelineSummary
}) {
  return <section>placeholder</section>
}
```

- [ ] **Step 2: Implement final timeline UI**

```tsx
export function OnboardingOpsTimeline({ steps, summary }: { steps: OnboardingOpsTimelineStep[]; summary: OnboardingOpsTimelineSummary }) {
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
        Xem uu tiên hôm nay
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginTop: 12 }}>
        {steps.map((step, index) => (
          <div key={step.key} style={{ padding: 12, borderRadius: 18, background: step.status === 'current' ? '#FFF3D6' : '#FFFDF9', border: step.status === 'current' ? '1.5px solid #001D3D' : '1px solid rgba(0, 29, 61, 0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#7A6B53' }}>Bu?c {index + 1}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#001D3D', marginTop: 6 }}>{step.title}</div>
            <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>{step.description}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, borderRadius: 20, background: '#FFF8E8', border: '1px solid rgba(246, 200, 95, 0.35)', padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D' }}>Hôm nay c?n gì</div>
          <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6 }}>{summary.immediateCount} ngu?i c?n x? lý ngay • {summary.followUpCount} ngu?i c?n follow-up sau ca</div>
        </div>
        <div style={{ alignSelf: 'center', fontSize: 12, fontWeight: 700, color: '#2F6FA8' }}>{summary.ctaLabel}</div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Run contract test**

Run: `node --test tests/onboarding-operations-task-first-contract.test.ts`

Expected: page/list/detail assertions still fail, but timeline-related strings now exist in component ready for page integration.

---

### Task 3: Wire Timeline And Step Summary Into Page

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Create: `src/components/onboarding-operations/OnboardingOpsTimeline.tsx`
- Test: `tests/onboarding-operations-task-first-contract.test.ts`

- [ ] **Step 1: Add page-level helpers for active step and next action**

```tsx
function resolveActiveStep(detail: OnboardingOpsEmployeeDetail | null): 2 | 3 | 4 {
  if (!detail) return 2
  const hasPendingBeforeShift = detail.checklist.some((item) => item.phase === 'before_first_shift' && !item.done)
  return hasPendingBeforeShift ? 3 : 4
}

function buildTimelineSteps(detail: OnboardingOpsEmployeeDetail | null) {
  const activeStep = resolveActiveStep(detail)

  return [
    {
      key: 'today' as const,
      title: 'Xem uu tiên hôm nay',
      description: 'Nhìn nhóm vi?c c?n x? lý tru?c d? kh?i ch?n nh?m ngu?i.',
      status: activeStep >= 2 ? 'complete' as const : 'current' as const,
    },
    {
      key: 'select' as const,
      title: 'Ch?n nhân s?',
      description: 'Ch?n 1 ngu?i d? h? th?ng ch? ra bu?c dang ch?.',
      status: activeStep === 2 ? 'current' as const : activeStep > 2 ? 'complete' as const : 'upcoming' as const,
    },
    {
      key: 'before_shift' as const,
      title: 'Chu?n b? tru?c ngày d?u',
      description: 'Ch?t ca d?u, ngu?i kèm, n?i quy, nhóm chat và công c?.',
      status: activeStep === 3 ? 'current' as const : activeStep > 3 ? 'complete' as const : 'upcoming' as const,
    },
    {
      key: 'after_shift' as const,
      title: 'Theo dõi sau ca d?u',
      description: 'Ch?t k?t qu? ca d?u, luu ghi chú và follow-up n?u c?n.',
      status: activeStep === 4 ? 'current' as const : 'upcoming' as const,
    },
  ]
}
```

- [ ] **Step 2: Render timeline above stats/list area**

```tsx
<OnboardingOpsTimeline
  steps={buildTimelineSteps(detail)}
  summary={{
    immediateCount: overview.allRows.filter((row) => row.priorityKey === 'block_day_one').length,
    followUpCount: overview.allRows.filter((row) => row.priorityKey === 'need_follow_up').length,
    ctaLabel: activeEmployeeId ? 'Ðang xem nhân s? du?c ch?n' : 'Ch?n ngu?i d?u tiên',
  }}
/>
```

- [ ] **Step 3: Remove or reduce duplicate stat emphasis**

Keep existing `overview.stats` cards only if still useful. If they stay, demote them below timeline so timeline is primary.

```tsx
<div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 16 }}>
  {overview.stats.map((stat) => (
    <div key={stat.key} style={{ background: '#FFFFFF', border: '1px solid rgba(0, 29, 61, 0.08)', borderRadius: 22, padding: 14 }}>
      ...
    </div>
  ))}
</div>
```

- [ ] **Step 4: Run contract test to verify page copy passes**

Run: `node --test tests/onboarding-operations-task-first-contract.test.ts`

Expected: `onboarding page exposes 4-step task-first header` passes; left/detail tests still fail.

---

### Task 4: Redesign Left Queue Copy And Card Hierarchy

**Files:**
- Modify: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- Test: `tests/onboarding-operations-task-first-contract.test.ts`

- [ ] **Step 1: Extend row props with presentation data**

Add to component props:

```tsx
selectedEmployeeId: string | null
onSelect: (employeeId: string) => void
```

Reuse existing props; do not change service shape. Derive presentation labels locally.

```tsx
function getStepLabel(row: OnboardingOpsListRow) {
  return row.priorityKey === 'need_follow_up'
    ? 'Ðang ? bu?c 4: Theo dõi sau ca d?u'
    : 'Ðang ? bu?c 3: Chu?n b? tru?c ngày d?u'
}

function getNextActionLabel(row: OnboardingOpsListRow) {
  if (row.isUnmatched) return 'Vi?c k? ti?p: Rà l?i role onboarding'
  if (row.shortNote) return `Vi?c k? ti?p: ${row.shortNote}`
  return 'Vi?c k? ti?p: Ki?m tra checklist chi ti?t'
}

function getPriorityLabel(row: OnboardingOpsListRow) {
  if (row.priorityKey === 'block_day_one') return 'Làm ngay'
  if (row.priorityKey === 'need_follow_up') return 'Theo dõi sau ca'
  return 'Ðã s?n sàng'
}
```

- [ ] **Step 2: Replace list header copy**

```tsx
<div style={{ marginBottom: 12 }}>
  <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
    Bu?c 2
  </div>
  <div style={{ fontSize: 18, fontWeight: 800, color: '#001D3D', marginTop: 4 }}>Ch?n nhân s? c?n x? lý</div>
  <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
    Ch?n 1 ngu?i. H? th?ng s? ch? ra bu?c dang ch? và vi?c c?n b?m ti?p theo.
  </div>
</div>
```

- [ ] **Step 3: Redesign each employee card**

```tsx
<div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 8 }}>{getStepLabel(row)}</div>
<div style={{ fontSize: 12, color: '#001D3D', marginTop: 6, fontWeight: 700 }}>{getNextActionLabel(row)}</div>
<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
  <span style={{ borderRadius: 999, padding: '5px 9px', fontSize: 10, fontWeight: 800, background: 'rgba(47, 111, 168, 0.10)', color: '#2F6FA8' }}>
    {getPriorityLabel(row)}
  </span>
  {isSelected ? (
    <span style={{ borderRadius: 999, padding: '5px 9px', fontSize: 10, fontWeight: 800, background: 'rgba(0, 29, 61, 0.08)', color: '#001D3D' }}>
      Ðang xem
    </span>
  ) : null}
</div>
```

- [ ] **Step 4: Run contract test to verify left queue copy passes**

Run: `node --test tests/onboarding-operations-task-first-contract.test.ts`

Expected: page + list tests pass; detail test still fails.

---

### Task 5: Add Sticky Guide Component

**Files:**
- Create: `src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx`
- Test: `tests/onboarding-operations-task-first-contract.test.ts`

- [ ] **Step 1: Create component with explicit copy**

```tsx
export function OnboardingOpsStickyGuide({
  activeStepTitle,
  nextActionLabel,
}: {
  activeStepTitle: string
  nextActionLabel: string
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 12,
        zIndex: 2,
        borderRadius: 20,
        background: '#FFFDF9',
        border: '1px solid rgba(0, 29, 61, 0.08)',
        padding: 14,
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D' }}>Màn này dùng d? làm gì</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
        X? lý t?ng nhân s? m?i theo dúng th? t?, tránh sót bu?c tru?c ngày d?u và sau ca d?u.
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D', marginTop: 12 }}>B?n dang ? bu?c nào</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6 }}>{activeStepTitle}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D', marginTop: 12 }}>Làm nhu th? nào</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.5 }}>1. Nhìn vi?c k? ti?p</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>2. B?m ngay trong card bên du?i</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>3. Xong bu?c nào, h? th?ng t? d?y sang bu?c ti?p</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D', marginTop: 12 }}>Card bên du?i nghia là gì</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.5 }}>M?i card = 1 vi?c v?n hành</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>Nhãn góc ph?i = m?c uu tiên</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>Nút trong card = hành d?ng c?n b?m</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#001D3D', marginTop: 10 }}>{nextActionLabel}</div>
    </div>
  )
}
```

- [ ] **Step 2: Keep component dependency-free**

Do not import service types. Only accept display strings from parent.

- [ ] **Step 3: Run contract test**

Run: `node --test tests/onboarding-operations-task-first-contract.test.ts`

Expected: detail test may still fail until component is integrated into detail pane.

---

### Task 6: Redesign Right Pane Header, Ordering, And Explanatory Copy

**Files:**
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Create: `src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx`
- Test: `tests/onboarding-operations-task-first-contract.test.ts`

- [ ] **Step 1: Add local helpers for active phase and next action**

```tsx
function getActivePhase(detail: OnboardingOpsEmployeeDetail) {
  const hasPendingBeforeShift = detail.checklist.some((item) => item.phase === 'before_first_shift' && !item.done)
  return hasPendingBeforeShift ? 'before_first_shift' : 'after_first_shift'
}

function getActiveStepTitle(detail: OnboardingOpsEmployeeDetail) {
  return getActivePhase(detail) === 'before_first_shift'
    ? 'Bu?c 3: Chu?n b? tru?c ngày d?u'
    : 'Bu?c 4: Theo dõi sau ca d?u'
}

function getNextChecklistItem(detail: OnboardingOpsEmployeeDetail) {
  const activePhase = getActivePhase(detail)
  return detail.checklist.find((item) => item.phase === activePhase && !item.done) ?? null
}
```

- [ ] **Step 2: Integrate sticky guide above checklist body**

```tsx
const nextItem = getNextChecklistItem(detail)
const activeStepTitle = getActiveStepTitle(detail)
const nextActionLabel = nextItem ? `Vi?c k? ti?p: ${nextItem.label}` : 'Vi?c k? ti?p: Ki?m tra k?t qu? sau ca d?u'

<OnboardingOpsStickyGuide
  activeStepTitle={activeStepTitle}
  nextActionLabel={nextActionLabel}
/>
```

- [ ] **Step 3: Replace pane title and summary language**

```tsx
<div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
  {getActivePhase(detail) === 'before_first_shift' ? 'Bu?c 3' : 'Bu?c 4'}
</div>
<div style={{ fontSize: 24, fontWeight: 800, color: '#001D3D', marginTop: 4 }}>{getActiveStepTitle(detail)}</div>
<div style={{ fontSize: 13, color: '#4A5A6A', marginTop: 6, lineHeight: 1.5 }}>
  Hi?n dang ch?: {nextItem?.label ?? 'Ch?t k?t qu? sau ca d?u'}
</div>
```

- [ ] **Step 4: Sort checklist so next action appears first in active phase**

```tsx
const activePhase = getActivePhase(detail)
const orderedItems = [...items].sort((left, right) => {
  if (left.done !== right.done) return left.done ? 1 : -1
  if (left.severity !== right.severity) return left.severity === 'block' ? -1 : 1
  return 0
})
```

Then render `orderedItems` instead of raw `items`.

- [ ] **Step 5: Add “Dùng d?...” explainer to each card**

```tsx
function getPurposeCopy(key: OnboardingOpsChecklistItem['key']) {
  switch (key) {
    case 'first_shift':
      return 'Dùng d? ch?t ca d?u nhân s? s? vào và gi? c?n có m?t.'
    case 'buddy':
      return 'Dùng d? ch? d?nh ai ch?u trách nhi?m kèm nhân s? này trong ngày d?u.'
    case 'uniform_attendance_policy':
      return 'Dùng d? xác nh?n nhân s? dã du?c nh?c l?i n?i quy th?c t? t?i quán.'
    case 'tools_and_group':
      return 'Dùng d? ki?m tra nhân s? dã có d? kênh liên l?c và công c? làm vi?c.'
    case 'first_shift_result':
      return 'Dùng d? ch?t k?t qu? ca d?u và quy?t d?nh có c?n theo sát thêm hay không.'
    default:
      return 'Dùng d? hoàn t?t bu?c v?n hành hi?n t?i.'
  }
}
```

Render under title:

```tsx
<div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>{getPurposeCopy(item.key)}</div>
```

- [ ] **Step 6: Update action wording only in presentation layer**

```tsx
<button ...>
  Ðã nh?c và xác nh?n t?i quán
</button>
```

```tsx
<button ...>
  ?n, không c?n theo sát
</button>
<button ...>
  T?m ?n, c?n theo sát thêm
</button>
<button ...>
  Có v?n d?, c?n x? lý
</button>
```

- [ ] **Step 7: Run contract test to verify all new copy exists**

Run: `node --test tests/onboarding-operations-task-first-contract.test.ts`

Expected: all tests pass.

---

### Task 7: Polish Route-Level Composition And Empty States

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Test: `tests/onboarding-overview-contract.test.ts`, `tests/onboarding-operations-task-first-contract.test.ts`

- [ ] **Step 1: Update empty-state copy to match task-first model**

```tsx
<div style={{ fontSize: 16, fontWeight: 700, color: '#001D3D' }}>Ch?n 1 ngu?i d? b?t d?u</div>
<div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 8 }}>
  B?t d?u t? c?t trái. H? th?ng s? ch? ra bu?c dang ch? và vi?c c?n b?m ti?p theo.
</div>
```

- [ ] **Step 2: Ensure section titles read in task order**

Use:
- top timeline
- `Bu?c 2: Ch?n nhân s? c?n x? lý`
- `Bu?c 3: ...` or `Bu?c 4: ...`

No competing section title like generic `Chi ti?t checklist` should remain primary.

- [ ] **Step 3: Run contract tests**

Run: `node --test tests/onboarding-overview-contract.test.ts tests/onboarding-operations-task-first-contract.test.ts`

Expected: PASS for both files.

---

### Task 8: Manual Smoke Verification

**Files:**
- Modify: none
- Test: manual app verification

- [ ] **Step 1: Start app locally**

Run: `npm run dev`

Expected: Next dev server starts on `http://localhost:3333`.

- [ ] **Step 2: Verify HR flow with demo account**

Manual script:
1. Login as `yen@bobahouse.vn`
2. Open `/career-path/onboarding`
3. Confirm timeline 4 bu?c is visible above queue.
4. Confirm left queue shows `Ðang ? bu?c...` and `Vi?c k? ti?p...`.
5. Select `Tran Minh Thuy`.
6. Confirm right pane shows sticky guide and step-specific title.
7. Click one action in first card and confirm page still updates without crash.

- [ ] **Step 3: Verify CEO visibility**

Manual script:
1. Login as `tuan@bobahouse.vn`
2. Open `/career-path/onboarding`
3. Confirm same task-first structure renders.

- [ ] **Step 4: Record any UI copy issues found during smoke**

If small wording mismatch appears, fix inline before handoff.

---

### Task 9: Final Verification And Handoff

**Files:**
- Modify: any touched files above
- Test: all tests from this plan

- [ ] **Step 1: Run final test commands**

Run:
- `node --test tests/demo-onboarding-accounts.test.ts`
- `node --test tests/onboarding-operations-task-first-contract.test.ts`
- `node --test tests/onboarding-overview-contract.test.ts`

Expected: PASS.

- [ ] **Step 2: Summarize limitations clearly**

Record in handoff:
- no service contract change in this pass
- no seeded real “day 5 progress” state
- if workspace lacks git, commits were skipped

- [ ] **Step 3: Commit final changes**

```bash
git add src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingOpsTimeline.tsx src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx tests/onboarding-operations-task-first-contract.test.ts tests/onboarding-overview-contract.test.ts
git commit -m "feat: redesign onboarding operations for first-time HR users"
```

If git is unavailable, skip commit and state that explicitly.
