# Onboarding Content Library And Day Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn onboarding settings into editable content library with draft/publish flow, built-in Vietnamese milk tea starter template, configurable journey rules, and operations runtime that reads published snapshot without changing active employees mid-journey.

**Architecture:** Reuse current onboarding checklist domain instead of inventing parallel model. Extend existing `OnboardingChecklistTemplate`, stage/item records, role settings, and employee plan snapshot logic so content library authoring, journey rules, and operations runtime all flow through one service boundary. Settings owns draft/template editing; runtime service compiles published template into day-based view for operations.

**Tech Stack:** Next.js App Router, React client components, TypeScript, current `career-path-service` localStorage persistence, existing onboarding operations service, Node `node:test` source/contract tests.

---

## Spec Review Verdict

Spec is ready for implementation planning.

Locked clarifications carried into this plan:

- Reuse existing onboarding checklist stack. Do **not** create new parallel `OnboardingContentTemplate` storage while `OnboardingChecklistTemplate`, `OnboardingChecklistStage`, `OnboardingChecklistItemTemplate`, and employee plan snapshots already exist.
- Rename template lifecycle from current `draft | active | archived` to spec language `draft | published | archived`, then update all selectors and tests consistently.
- Replace current stage code `week_1` with spec bucket `day_4_7`. Keep `pre_start`, `day_1`, `day_2_3`, `week_2`.
- Phase 1 snapshot rule stays explicit: existing `EmployeeOnboardingChecklistPlan` keeps assigned template/version snapshot; publish only affects newly opened onboarding plans.
- Scope stays role-light: keep current role-to-template mapping, no deep role matrix redesign.

## File Map

### Data model and seed

- Modify: `src/lib/career-path-types.ts`
- Modify: `src/lib/mock-data-career-path.ts`
- Modify: `src/lib/career-path-service.ts`

### Settings UI

- Modify: `src/app/career-path/settings/page.tsx`
- Create: `src/components/onboarding-settings/OnboardingContentLibraryOverview.tsx`
- Create: `src/components/onboarding-settings/OnboardingContentLibraryEditor.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateManager.tsx`
- Create: `src/components/onboarding-settings/OnboardingJourneyRulesPanel.tsx`

### Runtime / operations

- Create: `src/lib/services/onboarding-content-runtime-service.ts`
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`

### Tests and docs

- Create: `tests/onboarding-content-library-service.test.ts`
- Create: `tests/onboarding-content-library-settings-contract.test.ts`
- Modify: `tests/onboarding-settings-ia.test.ts`
- Modify: `tests/onboarding-operations-day-journey-contract.test.ts`
- Modify: `tests/onboarding-role-settings.test.ts`
- Modify: `docs/CODEMAP.md`

## Data Shape Direction

Extend existing types instead of introducing parallel stack.

```ts
export type OnboardingTemplateStatus = 'draft' | 'published' | 'archived'
export type OnboardingStageCode = 'pre_start' | 'day_1' | 'day_2_3' | 'day_4_7' | 'week_2'

export interface OnboardingContentTopic {
  id: string
  template_id: string
  code: string
  label: string
  sort_order: number
  active: boolean
}
```

### Task 1: Lock content-library contracts in tests

**Files:**
- Create: `tests/onboarding-content-library-service.test.ts`
- Create: `tests/onboarding-content-library-settings-contract.test.ts`
- Modify: `tests/onboarding-settings-ia.test.ts`
- Modify: `tests/onboarding-operations-day-journey-contract.test.ts`

- [ ] **Step 1: Add failing service contract for template lifecycle**

Create `tests/onboarding-content-library-service.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  initCareerPathStores,
  getPublishedOnboardingChecklistTemplate,
  getDraftOnboardingChecklistTemplate,
  getOnboardingContentTopics,
  getOnboardingChecklistItems,
} from '../src/lib/career-path-service'

test('built-in starter template exposes published content library seed', () => {
  initCareerPathStores()

  const published = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(published)
  assert.equal(published?.status, 'published')
  assert.match(published?.name ?? '', /Vietnam Milk Tea Store Onboarding/i)

  const topics = getOnboardingContentTopics(published!.id)
  assert.ok(topics.length >= 6)
  assert.ok(topics.some((topic) => /Orientation/i.test(topic.label)))

  const items = getOnboardingChecklistItems(published!.id)
  assert.ok(items.some((item) => item.code === 'orientation-store-rules'))
})
```

- [ ] **Step 2: Add failing settings source contract**

Create `tests/onboarding-content-library-settings-contract.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'), 'utf8')

test('settings page exposes content library IA', () => {
  assert.match(settingsPageSource, /Overview/)
  assert.match(settingsPageSource, /Content Library/)
  assert.match(settingsPageSource, /Templates/)
  assert.match(settingsPageSource, /Journey Rules/)
  assert.match(settingsPageSource, /grouped by topic|nhom theo chu de/i)
})
```

- [ ] **Step 3: Update old onboarding settings test to new copy**

Replace obsolete assertions in `tests/onboarding-settings-ia.test.ts` with:

```ts
assert.match(settingsPageSource, /thu vien noi dung onboarding|content library/i)
assert.match(settingsPageSource, /template dang publish|published template/i)
assert.match(settingsPageSource, /journey rules/i)
assert.doesNotMatch(settingsPageSource, />Thi?t l?p nhóm onboarding</)
```

- [ ] **Step 4: Extend operations contract to expect runtime content payload references**

Add to `tests/onboarding-operations-day-journey-contract.test.ts`:

```ts
assert.match(pageSource, /selectedDayIndex/)
assert.match(detailSource, /focusItems|allItems|runtimeDay/)
```

- [ ] **Step 5: Run tests to confirm they fail first**

Run:

```bash
node --test tests/onboarding-content-library-service.test.ts
node --test tests/onboarding-content-library-settings-contract.test.ts
node --test tests/onboarding-settings-ia.test.ts
node --test tests/onboarding-operations-day-journey-contract.test.ts
```

Expected: `FAIL` because lifecycle getters, topic storage, new settings IA, and runtime day references do not exist yet.

- [ ] **Step 6: Commit red contracts**

```bash
git add tests/onboarding-content-library-service.test.ts tests/onboarding-content-library-settings-contract.test.ts tests/onboarding-settings-ia.test.ts tests/onboarding-operations-day-journey-contract.test.ts
git commit -m "test: lock onboarding content library contracts"
```

### Task 2: Extend types and seed built-in starter template

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Modify: `src/lib/mock-data-career-path.ts`
- Modify: `src/lib/career-path-service.ts`
- Test: `tests/onboarding-content-library-service.test.ts`

- [ ] **Step 1: Update core onboarding types to match spec language**

```ts
export type OnboardingTemplateStatus = 'draft' | 'published' | 'archived'
export type OnboardingStageCode = 'pre_start' | 'day_1' | 'day_2_3' | 'day_4_7' | 'week_2'

export interface OnboardingContentTopic {
  id: string
  template_id: string
  code: string
  label: string
  sort_order: number
  active: boolean
}
```

- [ ] **Step 2: Extend template and item interfaces for content-library metadata**

```ts
export interface OnboardingChecklistTemplate {
  id: string
  role_code: OnboardingRoleCode
  role_label: string
  name: string
  description: string
  version: number
  status: OnboardingTemplateStatus
  source_type: 'built_in' | 'custom' | 'duplicated'
  published_at: string | null
  published_by: string | null
  journey_length_days: number
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  notes: string | null
}
```

Add item fields:

```ts
topic_id: string
confirmer_role: 'employee' | 'buddy' | 'shift_leader' | 'store_manager' | 'hr_admin'
ops_visibility: 'employee_visible' | 'ops_only'
is_focus_block_eligible: boolean
estimated_minutes: number
```

- [ ] **Step 3: Seed built-in Vietnam milk tea starter template**

Create topic seed like:

```ts
export const defaultOnboardingContentTopics: OnboardingContentTopic[] = [
  { id: 'topic-orientation', template_id: 'onb-template-counter-published-v1', code: 'orientation', label: 'Orientation', sort_order: 1, active: true },
  { id: 'topic-service', template_id: 'onb-template-counter-published-v1', code: 'customer_service', label: 'Customer Service', sort_order: 2, active: true },
  { id: 'topic-pos', template_id: 'onb-template-counter-published-v1', code: 'pos_payment', label: 'POS and Payment', sort_order: 3, active: true },
  { id: 'topic-hygiene', template_id: 'onb-template-counter-published-v1', code: 'hygiene_food_safety', label: 'Hygiene and Food Safety', sort_order: 4, active: true },
  { id: 'topic-opening', template_id: 'onb-template-counter-published-v1', code: 'opening_closing', label: 'Opening and Closing', sort_order: 5, active: true },
  { id: 'topic-review', template_id: 'onb-template-counter-published-v1', code: 'first_shift_review', label: 'First Shift Review', sort_order: 6, active: true },
]
```

- [ ] **Step 4: Seed published and draft template pair**

```ts
export const defaultOnboardingChecklistTemplates: OnboardingChecklistTemplate[] = [
  {
    id: 'onb-template-counter-published-v1',
    role_code: 'counter_staff',
    role_label: 'Thu ngan',
    name: 'Vietnam Milk Tea Store Onboarding - Starter',
    description: 'Published starter template for new store staff onboarding.',
    version: 1,
    status: 'published',
    source_type: 'built_in',
    published_at: '2026-06-02T09:00:00.000Z',
    published_by: 'system',
    journey_length_days: 14,
    created_by: 'system',
    updated_by: 'system',
    created_at: '2026-06-02T09:00:00.000Z',
    updated_at: '2026-06-02T09:00:00.000Z',
    notes: 'Starter template for milk tea chains in Vietnam.',
  },
  {
    id: 'onb-template-counter-draft-v2',
    role_code: 'counter_staff',
    role_label: 'Thu ngan',
    name: 'Vietnam Milk Tea Store Onboarding - Starter',
    description: 'Current working draft for HR edits.',
    version: 2,
    status: 'draft',
    source_type: 'duplicated',
    published_at: null,
    published_by: null,
    journey_length_days: 14,
    created_by: 'system',
    updated_by: 'current_user',
    created_at: '2026-06-02T09:10:00.000Z',
    updated_at: '2026-06-02T09:10:00.000Z',
    notes: 'Draft stays separate from published snapshot.',
  },
]
```

- [ ] **Step 5: Add topic storage and selectors to service**

```ts
const KEYS = {
  ...,
  onboardingContentTopics: 'cp_onboarding_content_topics',
} as const

export function getOnboardingContentTopics(templateId: string): OnboardingContentTopic[] {
  return _onboardingContentTopics
    .filter((topic) => topic.template_id === templateId)
    .sort((left, right) => left.sort_order - right.sort_order || left.label.localeCompare(right.label))
}

export function getPublishedOnboardingChecklistTemplate(roleCode: OnboardingRoleCode): OnboardingChecklistTemplate | null {
  return _onboardingChecklistTemplates
    .filter((template) => template.role_code === roleCode && template.status === 'published')
    .sort((left, right) => right.version - left.version)[0] ?? null
}

export function getDraftOnboardingChecklistTemplate(roleCode: OnboardingRoleCode): OnboardingChecklistTemplate | null {
  return _onboardingChecklistTemplates
    .filter((template) => template.role_code === roleCode && template.status === 'draft')
    .sort((left, right) => right.version - left.version)[0] ?? null
}
```

- [ ] **Step 6: Run service test until green**

```bash
node --test tests/onboarding-content-library-service.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit data-model seed work**

```bash
git add src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts tests/onboarding-content-library-service.test.ts
git commit -m "feat: seed onboarding content library starter template"
```

### Task 3: Add draft edit, validation, publish, duplicate, archive service layer

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Modify: `tests/onboarding-content-library-service.test.ts`
- Modify: `tests/onboarding-role-settings.test.ts`

- [ ] **Step 1: Add failing tests for publish validation and snapshot safety**

```ts
test('current employee plans keep existing template snapshot after publish', () => {
  initCareerPathStores()
  const before = getEmployeeOnboardingChecklistPlan('emp-017')
  assert.equal(before?.template_id, 'onb-template-counter-published-v1')

  publishOnboardingChecklistTemplate('onb-template-counter-draft-v2')

  const after = getEmployeeOnboardingChecklistPlan('emp-017')
  assert.equal(after?.template_id, 'onb-template-counter-published-v1')
})
```

- [ ] **Step 2: Add template validation result type**

```ts
export interface OnboardingTemplateValidationIssue {
  code: 'missing_topic' | 'missing_item' | 'missing_orientation' | 'missing_hygiene' | 'missing_service' | 'missing_follow_up' | 'missing_stage' | 'invalid_duration'
  template_id: string
  item_id?: string
  topic_id?: string
  message: string
}
```

- [ ] **Step 3: Implement publish validation**

```ts
export function validateOnboardingTemplateForPublish(templateId: string): OnboardingTemplateValidationIssue[] {
  const topics = getOnboardingContentTopics(templateId).filter((topic) => topic.active)
  const items = getOnboardingChecklistItems(templateId).filter((item) => item.active)
  const issues: OnboardingTemplateValidationIssue[] = []

  if (topics.length === 0) {
    issues.push({ code: 'missing_topic', template_id: templateId, message: 'Published template must have at least one active topic.' })
  }

  if (items.length === 0) {
    issues.push({ code: 'missing_item', template_id: templateId, message: 'Published template must have at least one active item.' })
  }

  return issues
}
```

- [ ] **Step 4: Implement duplicate/archive/publish mutations**

```ts
export function duplicateOnboardingChecklistTemplate(templateId: string): OnboardingChecklistTemplate { /* clone as next draft */ }
export function archiveOnboardingChecklistTemplate(templateId: string): void { /* mark archived */ }
export function publishOnboardingChecklistTemplate(templateId: string): OnboardingChecklistTemplate { /* archive old published, publish draft */ }
```

- [ ] **Step 5: Keep role mapping compatible with shallow scope**

In `tests/onboarding-role-settings.test.ts`, swap template IDs to published starter IDs:

```ts
template_id: 'onb-template-counter-published-v1'
```

- [ ] **Step 6: Run tests for lifecycle and mapping**

```bash
node --test tests/onboarding-content-library-service.test.ts
node --test tests/onboarding-role-settings.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit service lifecycle layer**

```bash
git add src/lib/career-path-service.ts tests/onboarding-content-library-service.test.ts tests/onboarding-role-settings.test.ts
git commit -m "feat: add onboarding template publish lifecycle"
```

### Task 4: Build settings IA for overview, content library, templates, journey rules

**Files:**
- Modify: `src/app/career-path/settings/page.tsx`
- Create: `src/components/onboarding-settings/OnboardingContentLibraryOverview.tsx`
- Create: `src/components/onboarding-settings/OnboardingContentLibraryEditor.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateManager.tsx`
- Create: `src/components/onboarding-settings/OnboardingJourneyRulesPanel.tsx`
- Test: `tests/onboarding-content-library-settings-contract.test.ts`, `tests/onboarding-settings-ia.test.ts`

- [ ] **Step 1: Make settings page source fail on missing IA sections**

```bash
node --test tests/onboarding-content-library-settings-contract.test.ts
node --test tests/onboarding-settings-ia.test.ts
```

Expected: `FAIL` until new IA lands.

- [ ] **Step 2: Create overview component for publish state and counts**

```tsx
export function OnboardingContentLibraryOverview({
  publishedTemplateName,
  lastPublishedAt,
  topicCount,
  itemCount,
  publishBlockerCount,
}: {
  publishedTemplateName: string
  lastPublishedAt: string | null
  topicCount: number
  itemCount: number
  publishBlockerCount: number
}) {
  return (
    <section id="overview" style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 800 }}>Overview</div>
      <div style={{ fontSize: 12, color: '#5F6B7A' }}>Published template: {publishedTemplateName}</div>
    </section>
  )
}
```

- [ ] **Step 3: Create three-column content library editor**

```tsx
export function OnboardingContentLibraryEditor({ topics, selectedTopicId, selectedItemId, onSelectTopic, onSelectItem }: Props) {
  return (
    <section id="content-library" style={{ display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr) minmax(320px, 420px)', gap: 16 }}>
      <div>{/* topic list */}</div>
      <div>{/* item rows */}</div>
      <div>{/* item detail form */}</div>
    </section>
  )
}
```

- [ ] **Step 4: Create template manager and journey rules panels**

```tsx
export function OnboardingTemplateManager({ templates, publishedTemplateId, onDuplicate, onArchive, onPublish }: Props) {
  return <section id="templates">{/* starter template chooser + actions */}</section>
}

export function OnboardingJourneyRulesPanel({ journeyLength, onChangeJourneyLength }: { journeyLength: number; onChangeJourneyLength: (days: number) => void }) {
  return <section id="journey-rules">{/* presets 7/10/14 + custom 5-30 */}</section>
}
```

- [ ] **Step 5: Refactor settings page to compose new onboarding center**

```tsx
<Panel title="Thu vien noi dung onboarding" subtitle="HR va CEO sua noi dung theo chu de, publish an toan cho dot onboarding moi.">
  <OnboardingContentLibraryOverview ... />
  <OnboardingContentLibraryEditor ... />
  <OnboardingTemplateManager ... />
  <OnboardingJourneyRulesPanel ... />
</Panel>
```

Keep current role-settings logic available, but move it into secondary section because deep role mapping is out of scope.

- [ ] **Step 6: Run IA tests until green**

```bash
node --test tests/onboarding-content-library-settings-contract.test.ts
node --test tests/onboarding-settings-ia.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit settings UI IA**

```bash
git add src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingContentLibraryOverview.tsx src/components/onboarding-settings/OnboardingContentLibraryEditor.tsx src/components/onboarding-settings/OnboardingTemplateManager.tsx src/components/onboarding-settings/OnboardingJourneyRulesPanel.tsx tests/onboarding-content-library-settings-contract.test.ts tests/onboarding-settings-ia.test.ts
git commit -m "feat: add onboarding content library settings center"
```

### Task 5: Compile published template into day-based runtime service

**Files:**
- Create: `src/lib/services/onboarding-content-runtime-service.ts`
- Modify: `src/lib/career-path-service.ts`
- Modify: `tests/onboarding-content-library-service.test.ts`

- [ ] **Step 1: Add failing runtime compiler test**

```ts
import { OnboardingContentRuntimeService } from '../src/lib/services/onboarding-content-runtime-service'

test('runtime compiler maps published template to day views', () => {
  initCareerPathStores()
  const runtime = OnboardingContentRuntimeService.getPublishedTemplateRuntime('counter_staff')

  assert.ok(runtime)
  assert.equal(runtime?.journeyLengthDays, 14)
  assert.equal(runtime?.dayViews[0]?.bucketCode, 'pre_start')
  assert.ok(runtime?.dayViews.some((day) => day.bucketCode === 'day_4_7'))
})
```

- [ ] **Step 2: Create runtime compiler service skeleton**

```ts
export const OnboardingContentRuntimeService = {
  getPublishedTemplateRuntime(roleCode: OnboardingRoleCode): OnboardingPublishedRuntime | null {
    return null
  },
}
```

- [ ] **Step 3: Implement fixed bucket-to-day mapping from spec**

```ts
function expandBucketToDays(bucketCode: OnboardingStageCode, journeyLengthDays: number): number[] {
  if (bucketCode === 'pre_start') return [1]
  if (bucketCode === 'day_1') return [1]
  if (bucketCode === 'day_2_3') return [2, 3].filter((day) => day <= journeyLengthDays)
  if (bucketCode === 'day_4_7') return [4, 5, 6, 7].filter((day) => day <= journeyLengthDays)
  return [8, 9, 10, 11, 12, 13, 14].filter((day) => day <= journeyLengthDays)
}
```

- [ ] **Step 4: Build runtime day payload from published template**

```ts
const template = getPublishedOnboardingChecklistTemplate(roleCode)
if (!template) return null
```

Map stages/items into `dayViews`, and put focus-eligible items into `focusItems`.

- [ ] **Step 5: Run runtime compiler test**

```bash
node --test tests/onboarding-content-library-service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit runtime compiler**

```bash
git add src/lib/services/onboarding-content-runtime-service.ts src/lib/career-path-service.ts tests/onboarding-content-library-service.test.ts
git commit -m "feat: compile published onboarding template into runtime days"
```

### Task 6: Connect operations route to published runtime content and employee snapshot

**Files:**
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Modify: `tests/onboarding-operations-day-journey-contract.test.ts`

- [ ] **Step 1: Add failing contract for operations detail reading runtime day payload**

```ts
assert.match(detailSource, /OnboardingContentRuntimeService/)
assert.match(detailSource, /focusItems/)
assert.match(detailSource, /allItems/)
```

- [ ] **Step 2: Add runtime payload into operations detail shape**

```ts
export interface OnboardingOpsEmployeeDetail {
  ...
  runtimeDays: Array<{
    dayIndex: number
    bucketCode: string
    bucketLabel: string
    focusItems: Array<{ itemId: string; title: string; progressStatus: string }>
    allItems: Array<{ itemId: string; title: string; progressStatus: string }>
  }>
}
```

For phase 1 snapshot rule, if employee already has assigned `template_id`, compile from that template/version instead of latest published template.

- [ ] **Step 3: Keep existing employee progress, but map it onto runtime items**

```ts
function mapRuntimeDayProgress(day: OnboardingPublishedRuntime['dayViews'][number], planId: string | null) {
  const progressItems = planId ? getOnboardingChecklistProgressItems(planId) : []
  return {
    ...day,
    focusItems: day.focusItems.map((item) => ({ ...item, progressStatus: progressItems.find((progress) => progress.checklist_item_id === item.itemId)?.status ?? 'not_started' })),
    allItems: day.allItems.map((item) => ({ ...item, progressStatus: progressItems.find((progress) => progress.checklist_item_id === item.itemId)?.status ?? 'not_started' })),
  }
}
```

- [ ] **Step 4: Render runtime items in selected-day detail pane**

```tsx
const runtimeDay = detail?.runtimeDays.find((day) => day.dayIndex === selectedDayIndex) ?? null

{runtimeDay?.focusItems.map((item) => (
  <div key={item.itemId}>
    <div>{item.title}</div>
    <div>{item.progressStatus}</div>
  </div>
))}
```

Keep existing first-shift, buddy, and follow-up controls below this block in phase 1.

- [ ] **Step 5: Run operations contract test**

```bash
node --test tests/onboarding-operations-day-journey-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit operations runtime integration**

```bash
git add src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx tests/onboarding-operations-day-journey-contract.test.ts
git commit -m "feat: connect onboarding operations to published runtime content"
```

### Task 7: Docs, regression sweep, manual verification

**Files:**
- Modify: `docs/CODEMAP.md`
- Test: all onboarding tests

- [ ] **Step 1: Update codemap for new onboarding architecture**

```md
- `src/app/career-path/settings/page.tsx`: onboarding settings center with Overview, Content Library, Templates, Journey Rules.
- `src/lib/career-path-service.ts`: source of truth for onboarding template CRUD, publish lifecycle, role mapping, and snapshot-safe template selection.
- `src/lib/services/onboarding-content-runtime-service.ts`: compiles published/snapshotted onboarding template into day-based runtime payload for operations.
- `src/lib/services/onboarding-operations-service.ts`: merges employee progress and runtime day content for operations screens.
```

- [ ] **Step 2: Run full onboarding regression suite**

```bash
node --test tests/onboarding-content-library-service.test.ts
node --test tests/onboarding-content-library-settings-contract.test.ts
node --test tests/onboarding-settings-ia.test.ts
node --test tests/onboarding-operations-day-journey-contract.test.ts
node --test tests/onboarding-role-settings.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run lint on touched onboarding files**

```bash
npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/lib/services/onboarding-content-runtime-service.ts src/lib/services/onboarding-operations-service.ts src/app/career-path/settings/page.tsx src/app/career-path/onboarding/page.tsx src/components/onboarding-settings/OnboardingContentLibraryOverview.tsx src/components/onboarding-settings/OnboardingContentLibraryEditor.tsx src/components/onboarding-settings/OnboardingTemplateManager.tsx src/components/onboarding-settings/OnboardingJourneyRulesPanel.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx
```

Expected: PASS.

- [ ] **Step 4: Manual smoke for publish snapshot rule**

```text
1. Open /career-path/settings.
2. Confirm Overview shows current published template and blocker counts.
3. Edit draft item title inside Content Library.
4. Publish draft.
5. Open employee already onboarding (example existing seeded employee with plan `onb-plan-017`).
6. Confirm operations still reads assigned template snapshot, not silently switched published version.
7. Open newly created onboarding flow.
8. Confirm new flow reads latest published template.
```

- [ ] **Step 5: Commit docs and verification sweep**

```bash
git add docs/CODEMAP.md
git commit -m "docs: record onboarding content library architecture"
```

## Self-Review

- Spec coverage checked:
  - content library authoring by topic: Task 4
  - built-in Vietnam milk tea starter template: Task 2
  - journey rules and fixed bucket mapping: Task 5
  - draft/publish/archive safety: Task 3
  - operations consuming processed published content: Task 6
  - employee snapshot rule for active onboarding: Task 3 and Task 6
  - shallow role mapping only: preserved through Task 3
- Placeholder scan checked: no `TBD`, `TODO`, or vague “handle later” steps remain.
- Type consistency checked:
  - status uses `draft | published | archived`
  - stage code uses `pre_start | day_1 | day_2_3 | day_4_7 | week_2`
  - runtime service owns day compilation, operations service consumes it

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-02-onboarding-content-library-and-day-journey-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
