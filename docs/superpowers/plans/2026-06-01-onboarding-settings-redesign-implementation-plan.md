# Onboarding Settings Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape onboarding entry points so CEO/HR land on an exception-first overview, move cleanly into operations or configuration, and see business-language labels instead of technical codes.

**Architecture:** Keep current onboarding routes and core role/template resolver logic intact, but add a clearer presentation layer around them. The implementation should reuse `OnboardingOperationsService` and existing settings persistence, then layer new overview aggregates, query/hash deep-links, and an exception-first settings layout on top.

**Tech Stack:** Next.js App Router, React client components, TypeScript, existing `AppShell`, `career-path-service`, `onboarding-operations-service`, Node test runner.

---

## Locked Decisions

- Operations deep-link filter keeps existing service contract: `all`, `block_day_one`, `need_follow_up`, `ready`.
- Overview card `Nhân sự sắp vào làm` links to `/career-path/onboarding?filter=all`. Do not add a new `upcoming` filter key.
- Settings section deep-links use URL hash: `#exceptions`, `#roles`, `#templates`.
- Sidebar naming becomes exactly:
  - `Tổng quan onboarding`
  - `Vận hành onboarding`
  - `Cấu hình onboarding`
- Existing routes stay unchanged:
  - `/career-path/onboarding/overview`
  - `/career-path/onboarding`
  - `/career-path/settings`

## File Map

### Tests and contract locks

- Modify: `tests/onboarding-navigation-ia.test.ts`
  - Lock final sidebar labels under `Nhân sự mới`.
- Modify: `tests/onboarding-settings-ia.test.ts`
  - Lock exception-first settings copy and hash section IDs.
- Create: `tests/onboarding-overview-contract.test.ts`
  - Lock overview CTA URLs, status labels, and business-copy headings from source.
- Create: `tests/onboarding-operations-service-overview.test.ts`
  - Lock service-level status classification, urgent ordering, and config summary counts.

### Navigation and overview

- Modify: `src/lib/navigation/sidebar-config.ts`
  - Rename `Checklist vận hành` to `Vận hành onboarding`.
- Modify: `src/lib/services/onboarding-operations-service.ts`
  - Add normalized overview helpers for status, urgent list ordering, and config issue counts.
- Modify: `src/app/career-path/onboarding/overview/page.tsx`
  - Rebuild overview page around hero, system status, 4 task cards, and urgent list with explicit deep-links.

### Operations flow

- Modify: `src/app/career-path/onboarding/page.tsx`
  - Read filter from search params, seed active filter from query, and show empty-state CTA back to overview.
- Modify: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
  - Update copy to `Vận hành onboarding`, keep current filter keys, and surface clearer empty states.

### Settings flow

- Modify: `src/app/career-path/settings/page.tsx`
  - Replace tab-centric onboarding config presentation with section-centric exception-first layout.
- Create: `src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx`
  - Show counts for enabled roles, missing templates, duplicate mappings, unmatched employees.
- Create: `src/components/onboarding-settings/OnboardingSettingsExceptionsPanel.tsx`
  - Group unmatched employees, missing-template roles, duplicate mappings, and jump links.
- Create: `src/components/onboarding-settings/OnboardingRoleCardsSection.tsx`
  - Render role cards with display-first heading, role meta, filters, and mapping controls.
- Create: `src/components/onboarding-settings/OnboardingTemplateChecklistSection.tsx`
  - Render template assignment scan view separate from role mapping cards.

### Documentation

- Modify: `docs/CODEMAP.md`
  - Note new overview, operations deep-link contract, and settings hash sections.

### Verification

- Run: `npx tsx --test tests/onboarding-navigation-ia.test.ts tests/onboarding-settings-ia.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-service-overview.test.ts`
- Run: `npx eslint src/lib/navigation/sidebar-config.ts src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/overview/page.tsx src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsExceptionsPanel.tsx src/components/onboarding-settings/OnboardingRoleCardsSection.tsx src/components/onboarding-settings/OnboardingTemplateChecklistSection.tsx`

---

### Task 1: Lock IA and deep-link contracts in tests

**Files:**
- Modify: `tests/onboarding-navigation-ia.test.ts`
- Modify: `tests/onboarding-settings-ia.test.ts`
- Create: `tests/onboarding-overview-contract.test.ts`

- [ ] **Step 1: Update sidebar test to match final labels**

Replace label assertion with final wording:

```ts
assert.deepEqual(
  newHireGroup.items?.map((item) => item.label),
  ['Tổng quan onboarding', 'Vận hành onboarding', 'Cấu hình onboarding'],
)
```

- [ ] **Step 2: Add settings IA source test for exception-first sections**

Extend `tests/onboarding-settings-ia.test.ts` with assertions like:

```ts
assert.match(settingsPageSource, /id="exceptions"/)
assert.match(settingsPageSource, /id="roles"/)
assert.match(settingsPageSource, /id="templates"/)
assert.match(settingsPageSource, />Ngoại lệ cần xử lý</)
assert.match(settingsPageSource, />Role onboarding</)
assert.match(settingsPageSource, />Template checklist</)
```

- [ ] **Step 3: Add overview contract test file**

Create `tests/onboarding-overview-contract.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const overviewPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/onboarding/overview/page.tsx'),
  'utf8',
)

test('overview page exposes final CTA contracts', () => {
  assert.match(overviewPageSource, /href="\/career-path\/onboarding\?filter=all"/)
  assert.match(overviewPageSource, /href="\/career-path\/onboarding\?filter=block_day_one"/)
  assert.match(overviewPageSource, /href="\/career-path\/settings#exceptions"/)
  assert.match(overviewPageSource, /href="\/career-path\/settings#roles"/)
})
```

- [ ] **Step 4: Run tests to verify they fail first**

Run:

```bash
npx tsx --test tests/onboarding-navigation-ia.test.ts tests/onboarding-settings-ia.test.ts tests/onboarding-overview-contract.test.ts
```

Expected: FAIL because current labels still say `Checklist vận hành`, settings page does not expose section hashes, and overview page does not have final deep-link URLs.

- [ ] **Step 5: Commit contract tests**

```bash
git add tests/onboarding-navigation-ia.test.ts tests/onboarding-settings-ia.test.ts tests/onboarding-overview-contract.test.ts
git commit -m "test: lock onboarding ia contracts"
```

### Task 2: Add service-level overview aggregates for exception-first UI

**Files:**
- Create: `tests/onboarding-operations-service-overview.test.ts`
- Modify: `src/lib/services/onboarding-operations-service.ts`

- [ ] **Step 1: Write failing service tests for status and urgent ordering**

Create `tests/onboarding-operations-service-overview.test.ts` with focused expectations:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'

import { initCareerPathStores } from '../src/lib/career-path-service.ts'
import { OnboardingOperationsService } from '../src/lib/services/onboarding-operations-service.ts'

test('workspace overview exposes config-first system status', () => {
  initCareerPathStores()
  const user = { id: 'ceo-001', role: 'ceo', name: 'CEO' } as const
  const overview = OnboardingOperationsService.getWorkspaceOverview(user, 'all')

  assert.ok(overview.systemStatus)
  assert.ok(['stable', 'review', 'config_error'].includes(overview.systemStatus.key))
  assert.ok(Array.isArray(overview.urgentItems))
  assert.ok(overview.configSummary)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx tsx --test tests/onboarding-operations-service-overview.test.ts
```

Expected: FAIL because `systemStatus`, `urgentItems`, and `configSummary` do not exist on current overview payload.

- [ ] **Step 3: Extend overview types with new aggregates**

In `src/lib/services/onboarding-operations-service.ts`, add focused types near existing overview types:

```ts
export type OnboardingOverviewSystemStatusKey = 'stable' | 'review' | 'config_error'

export interface OnboardingOverviewSystemStatus {
  key: OnboardingOverviewSystemStatusKey
  label: string
  reason: string
}

export interface OnboardingOverviewConfigSummary {
  enabledRoleCount: number
  missingTemplateCount: number
  duplicateMappingCount: number
  unmatchedEmployeeCount: number
}
```

- [ ] **Step 4: Add minimal helpers for config summary and urgent ordering**

Implement helper shape like:

```ts
function buildConfigSummary(): OnboardingOverviewConfigSummary {
  const settings = getOnboardingRoleSettings()
  const issues = validateOnboardingRoleSettings(settings)
  const unmatchedEmployees = getUnmatchedOnboardingRoleEmployees(settings)

  return {
    enabledRoleCount: settings.roles.filter((role) => role.enabled).length,
    missingTemplateCount: issues.filter((issue) => issue.code === 'missing_template').length,
    duplicateMappingCount: issues.filter((issue) => issue.code === 'duplicate_position').length,
    unmatchedEmployeeCount: unmatchedEmployees.length,
  }
}
```

- [ ] **Step 5: Add system status precedence and urgent list mapping**

Use precedence from spec:

```ts
function buildSystemStatus(configSummary: OnboardingOverviewConfigSummary, rows: OnboardingOpsListRow[]): OnboardingOverviewSystemStatus {
  if (configSummary.duplicateMappingCount > 0 || configSummary.missingTemplateCount > 0) {
    return { key: 'config_error', label: 'Có lỗi cấu hình', reason: 'Role onboarding đang thiếu template hoặc trùng mapping.' }
  }

  if (configSummary.unmatchedEmployeeCount > 0 || rows.some((row) => row.priorityKey !== 'ready')) {
    return { key: 'review', label: 'Cần rà soát', reason: 'Còn nhân sự mới hoặc ngoại lệ cần xử lý.' }
  }

  return { key: 'stable', label: 'Ổn định', reason: 'Không có block ngày đầu hay lỗi cấu hình mở.' }
}
```

- [ ] **Step 6: Return new fields from `getWorkspaceOverview` and re-run tests**

Add fields to overview return value:

```ts
return {
  rows,
  allRows,
  filters,
  stats,
  activeFilter,
  systemStatus,
  configSummary,
  urgentItems,
}
```

Run:

```bash
npx tsx --test tests/onboarding-operations-service-overview.test.ts tests/onboarding-role-settings.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit service aggregate work**

```bash
git add tests/onboarding-operations-service-overview.test.ts tests/onboarding-role-settings.test.ts src/lib/services/onboarding-operations-service.ts
git commit -m "feat: add onboarding overview aggregates"
```

### Task 3: Rebuild overview page around task cards and explicit deep-links

**Files:**
- Modify: `src/lib/navigation/sidebar-config.ts`
- Modify: `src/app/career-path/onboarding/overview/page.tsx`

- [ ] **Step 1: Change sidebar label to final wording**

In `src/lib/navigation/sidebar-config.ts`, update onboarding group items:

```ts
items: [
  { href: '/career-path/onboarding/overview', label: 'Tổng quan onboarding', roles: ['hr_admin', 'ceo'] },
  { href: '/career-path/onboarding', label: 'Vận hành onboarding', roles: ONBOARDING_ADMIN_ROLES },
  { href: '/career-path/settings', label: 'Cấu hình onboarding', roles: ['store_manager', 'hr_admin', 'ceo'] },
],
```

- [ ] **Step 2: Run navigation test to verify label change passes**

Run:

```bash
npx tsx --test tests/onboarding-navigation-ia.test.ts
```

Expected: PASS.

- [ ] **Step 3: Rebuild overview hero and status bar using service aggregates**

Inside `src/app/career-path/onboarding/overview/page.tsx`, replace ad-hoc counts with service fields:

```tsx
const overview = OnboardingOperationsService.getWorkspaceOverview(user, 'all')
const { systemStatus, configSummary, urgentItems } = overview
```

Render status bar:

```tsx
<section className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-sm">
  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7A6B53]">Trạng thái hệ thống</div>
  <div className="mt-2 text-2xl font-extrabold text-[#001D3D]">{systemStatus.label}</div>
  <p className="mt-2 text-sm leading-6 text-[#5F6B7A]">{systemStatus.reason}</p>
</section>
```

- [ ] **Step 4: Replace metric-only cards with 4 task cards and final CTA URLs**

Render card contracts like:

```tsx
{
  label: 'Nhân sự sắp vào làm',
  href: '/career-path/onboarding?filter=all',
  cta: 'Mở vận hành onboarding',
}
{
  label: 'Block ngày đầu / cần follow-up',
  href: '/career-path/onboarding?filter=block_day_one',
  cta: 'Xử lý ngay',
}
{
  label: 'Nhân viên chưa khớp role',
  href: '/career-path/settings#exceptions',
  cta: 'Xử lý unmatched',
}
{
  label: 'Cấu hình role và template',
  href: '/career-path/settings#roles',
  cta: 'Rà soát role và template',
}
```

- [ ] **Step 5: Replace generic urgent list links with target-aware CTA links**

For urgent items, route by type:

```tsx
const urgentHref = item.kind === 'config'
  ? '/career-path/settings#exceptions'
  : item.kind === 'unmatched'
    ? '/career-path/settings#exceptions'
    : `/career-path/onboarding?filter=${item.priorityKey}`
```

- [ ] **Step 6: Re-run overview/source tests**

Run:

```bash
npx tsx --test tests/onboarding-overview-contract.test.ts tests/onboarding-navigation-ia.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit overview IA changes**

```bash
git add src/lib/navigation/sidebar-config.ts src/app/career-path/onboarding/overview/page.tsx tests/onboarding-navigation-ia.test.ts tests/onboarding-overview-contract.test.ts
git commit -m "feat: rebuild onboarding overview entrypoint"
```

### Task 4: Wire operations page to accept overview deep-links cleanly

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`

- [ ] **Step 1: Write failing query-param behavior if no coverage exists**

Add source assertions to `tests/onboarding-overview-contract.test.ts` or a new source test:

```ts
assert.match(operationsPageSource, /searchParams\.get\('filter'\)/)
assert.match(operationsPageSource, /setActiveFilter\(/)
assert.match(operationsPageSource, /Quay lại Tổng quan onboarding/)
```

- [ ] **Step 2: Read filter from URL and validate against existing union**

In `src/app/career-path/onboarding/page.tsx`, add helper:

```ts
const allowedFilters: OnboardingOpsPriorityFilter[] = ['all', 'block_day_one', 'need_follow_up', 'ready']

function readFilterFromSearchParams(searchParams: URLSearchParams): OnboardingOpsPriorityFilter {
  const raw = searchParams.get('filter')
  return allowedFilters.includes(raw as OnboardingOpsPriorityFilter)
    ? (raw as OnboardingOpsPriorityFilter)
    : 'all'
}
```

- [ ] **Step 3: Sync client state from search params**

Use `window.location.search` on mount and on popstate:

```ts
useEffect(() => {
  const applyFilterFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    setActiveFilter(readFilterFromSearchParams(params))
  }

  applyFilterFromUrl()
  window.addEventListener('popstate', applyFilterFromUrl)
  return () => window.removeEventListener('popstate', applyFilterFromUrl)
}, [])
```

- [ ] **Step 4: Update list copy and empty-state CTA**

In `UpcomingOnboardingList.tsx`, change heading and empty-state guidance:

```tsx
<div style={{ fontSize: 18, fontWeight: 800, color: '#001D3D', marginTop: 4 }}>Vận hành onboarding</div>
```

For empty filter state, add callback/button contract:

```tsx
{activeFilter !== 'all' ? (
  <button type="button" onClick={() => onChangeFilter('all')}>
    Bỏ bộ lọc
  </button>
) : null}
```

- [ ] **Step 5: Add page-level CTA back to overview**

In `src/app/career-path/onboarding/page.tsx`, render:

```tsx
<a href="/career-path/onboarding/overview" style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8' }}>
  Quay lại Tổng quan onboarding
</a>
```

- [ ] **Step 6: Run operations and overview tests**

Run:

```bash
npx tsx --test tests/onboarding-overview-contract.test.ts
npx eslint src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit operations deep-link work**

```bash
git add src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx tests/onboarding-overview-contract.test.ts
git commit -m "feat: support onboarding operations deep links"
```

### Task 5: Split settings page into exception-first onboarding configuration sections

**Files:**
- Modify: `src/app/career-path/settings/page.tsx`
- Create: `src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx`
- Create: `src/components/onboarding-settings/OnboardingSettingsExceptionsPanel.tsx`
- Create: `src/components/onboarding-settings/OnboardingRoleCardsSection.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateChecklistSection.tsx`

- [ ] **Step 1: Make settings IA test fail on current layout**

Run:

```bash
npx tsx --test tests/onboarding-settings-ia.test.ts
```

Expected: FAIL because current page still uses tab-like onboarding area and does not expose exception-first sections.

- [ ] **Step 2: Extract summary bar component**

Create `src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx`:

```tsx
type SummaryBarProps = {
  enabledRoleCount: number
  missingTemplateCount: number
  duplicateMappingCount: number
  unmatchedEmployeeCount: number
}

export function OnboardingSettingsSummaryBar(props: SummaryBarProps) {
  return (
    <div id="summary" style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
      {/* four summary cards */}
    </div>
  )
}
```

- [ ] **Step 3: Extract exceptions panel with in-page jump links**

Create `src/components/onboarding-settings/OnboardingSettingsExceptionsPanel.tsx` with props for unmatched employees and validation issues:

```tsx
export function OnboardingSettingsExceptionsPanel({
  unmatchedEmployees,
  missingTemplateRoles,
  duplicateMappingIssues,
}: Props) {
  return (
    <section id="exceptions">
      <h2>Ngoại lệ cần xử lý</h2>
      <a href="#roles">Đi tới Role onboarding</a>
      <a href="#templates">Đi tới Template checklist</a>
    </section>
  )
}
```

- [ ] **Step 4: Extract role and template sections so settings page stops mixing responsibilities**

Create:

```tsx
export function OnboardingRoleCardsSection({ roles, issues, ...handlers }: Props) {
  return <section id="roles">{/* role cards with display_name first */}</section>
}

export function OnboardingTemplateChecklistSection({ roles, templates, issues, onTemplateChange }: Props) {
  return <section id="templates">{/* template scan cards */}</section>
}
```

- [ ] **Step 5: Refactor `OnboardingRolesTab` to compose new sections in order**

Inside `src/app/career-path/settings/page.tsx`, keep draft/save logic local, but replace long inline render tree with:

```tsx
<div>
  <OnboardingSettingsSummaryBar ... />
  <OnboardingSettingsExceptionsPanel ... />
  <OnboardingRoleCardsSection ... />
  <OnboardingTemplateChecklistSection ... />
</div>
```

Also update onboarding tab copy to:

```tsx
<h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Cấu hình onboarding</h2>
<p>Quản lý role onboarding, template checklist, và các ngoại lệ cần xử lý trước ngày vào làm.</p>
```

- [ ] **Step 6: Add hash-aware section scroll on mount and hash change**

In `OnboardingRolesTab`, add minimal effect:

```ts
useEffect(() => {
  const scrollToHash = () => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    document.getElementById(hash)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  scrollToHash()
  window.addEventListener('hashchange', scrollToHash)
  return () => window.removeEventListener('hashchange', scrollToHash)
}, [])
```

- [ ] **Step 7: Run settings tests and lint**

Run:

```bash
npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-role-settings.test.ts
npx eslint src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsExceptionsPanel.tsx src/components/onboarding-settings/OnboardingRoleCardsSection.tsx src/components/onboarding-settings/OnboardingTemplateChecklistSection.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit settings restructure**

```bash
git add src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsExceptionsPanel.tsx src/components/onboarding-settings/OnboardingRoleCardsSection.tsx src/components/onboarding-settings/OnboardingTemplateChecklistSection.tsx tests/onboarding-settings-ia.test.ts tests/onboarding-role-settings.test.ts
git commit -m "feat: restructure onboarding settings around exceptions"
```

### Task 6: Final copy cleanup, docs, and verification sweep

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `src/app/career-path/onboarding/overview/page.tsx`
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Normalize final Vietnamese copy in touched onboarding surfaces**

Replace remaining technical-first strings such as:

```ts
'Checklist vận hành' -> 'Vận hành onboarding'
'Chưa map role' -> 'Nhân viên chưa khớp role'
'Position mapping' -> 'Chức danh áp vào role'
```

- [ ] **Step 2: Update `docs/CODEMAP.md` with new contracts**

Add note like:

```md
- `/career-path/onboarding/overview`: điểm vào chính cho CEO/HR, có CTA sang operations và settings
- `/career-path/onboarding?filter=...`: deep-link vận hành onboarding, dùng `all|block_day_one|need_follow_up|ready`
- `/career-path/settings#exceptions|#roles|#templates`: deep-link section trong cấu hình onboarding
```

- [ ] **Step 3: Run full test and lint sweep**

Run:

```bash
npx tsx --test tests/onboarding-navigation-ia.test.ts tests/onboarding-settings-ia.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-service-overview.test.ts tests/onboarding-role-settings.test.ts
npx eslint src/lib/navigation/sidebar-config.ts src/lib/services/onboarding-operations-service.ts src/app/career-path/onboarding/overview/page.tsx src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsExceptionsPanel.tsx src/components/onboarding-settings/OnboardingRoleCardsSection.tsx src/components/onboarding-settings/OnboardingTemplateChecklistSection.tsx docs/CODEMAP.md
```

Expected: PASS.

- [ ] **Step 4: Do manual smoke through final routes**

Check in browser:

```text
1. Open /career-path/onboarding/overview as ceo/hr_admin
2. Click card -> /career-path/onboarding?filter=block_day_one
3. Click unmatched card -> /career-path/settings#exceptions
4. Click role/template card -> /career-path/settings#roles
5. Save one role/template change and confirm summary bar + exceptions panel refresh
```

- [ ] **Step 5: Commit docs and polish**

```bash
git add docs/CODEMAP.md src/app/career-path/onboarding/overview/page.tsx src/app/career-path/onboarding/page.tsx src/app/career-path/settings/page.tsx
git commit -m "docs: finalize onboarding ia rollout notes"
```

## Self-Review

- Spec coverage checked:
  - Sidebar IA: Task 1, Task 3
  - Overview hero/status/4 task cards/urgent list: Task 2, Task 3
  - Operations deep-link and empty states: Task 4
  - Settings exception-first layout, role section, template section, save/validation surfacing: Task 5
  - Copy cleanup and doc notes: Task 6
- Placeholder scan checked: no `TBD`, `TODO`, or vague “handle later” steps left.
- Type consistency checked:
  - Operations filter stays `all | block_day_one | need_follow_up | ready`
  - Settings hash contract stays `#exceptions | #roles | #templates`
  - Overview uses service-owned `systemStatus`, `configSummary`, `urgentItems`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-01-onboarding-settings-redesign-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
