# Onboarding Settings Usability Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework `Cấu hình onboarding` into a task-first settings screen so HR can spot urgent issues first, edit each onboarding role as one complete unit, and save changes with clear feedback.

**Architecture:** Keep `/career-path/settings` and existing `career-path-service` validation/persistence intact, but split onboarding settings UI into focused components: summary bar, urgent issues panel, role filters, and unified role cards. Move checklist assignment into each role card, keep position mapping collapsed by default, and update source-based tests to lock copy and section contracts.

**Tech Stack:** Next.js App Router, React client components, TypeScript, existing onboarding settings data from `career-path-service`, Node test runner, ESLint.

---

## File Map

### Tests and source contracts

- Modify: `tests/onboarding-settings-ia.test.ts`
  - Lock task-first copy, new section labels, and merged role-card vocabulary.
- Create: `tests/onboarding-settings-components-contract.test.ts`
  - Lock new component source contracts for summary, urgent issues, and unified role card actions.

### Onboarding settings UI

- Modify: `src/app/career-path/settings/page.tsx`
  - Replace current duplicated heading and split role/template sections with composed task-first settings layout.
- Create: `src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx`
  - Render four actionable summary metrics and section jump links.
- Create: `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx`
  - Render `Cần xử lý ngay` items with business copy and fix CTAs.
- Create: `src/components/onboarding-settings/OnboardingRoleFilters.tsx`
  - Render search and status filters for role cards.
- Create: `src/components/onboarding-settings/OnboardingRoleCard.tsx`
  - Render one compact role unit with status, checklist assignment, inline issues, and expandable mapping editor.

### Documentation

- Modify: `docs/CODEMAP.md`
  - Note new onboarding settings component boundaries and task-first IA.

### Verification

- Run: `npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts`
- Run: `npx eslint src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx docs/CODEMAP.md`

---

### Task 1: Lock redesigned onboarding settings contracts in tests

**Files:**
- Modify: `tests/onboarding-settings-ia.test.ts`
- Create: `tests/onboarding-settings-components-contract.test.ts`

- [ ] **Step 1: Update page-level IA test to match task-first copy**

Replace the current expectations in `tests/onboarding-settings-ia.test.ts` with assertions like:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'),
  'utf8',
)

test('settings page uses onboarding task-first header copy', () => {
  assert.match(settingsPageSource, /Cấu hình onboarding cho nhân sự mới/)
  assert.match(
    settingsPageSource,
    /Thiết lập nhóm onboarding, checklist áp dụng và xử lý lỗi cấu hình trước ngày vào làm\./,
  )
  assert.doesNotMatch(settingsPageSource, /Quản lý role onboarding, template checklist, và các ngoại lệ cần xử lý trước ngày vào làm\./)
})

test('settings page exposes task-first sections', () => {
  assert.match(settingsPageSource, /id="summary"/)
  assert.match(settingsPageSource, /id="urgent-issues"/)
  assert.match(settingsPageSource, /id="role-filters"/)
  assert.match(settingsPageSource, /id="roles"/)
  assert.match(settingsPageSource, />Cần xử lý ngay</)
  assert.match(settingsPageSource, />Thiết lập nhóm onboarding</)
})

test('settings page no longer renders duplicate template-only section heading', () => {
  assert.doesNotMatch(settingsPageSource, />Template checklist</)
})
```

- [ ] **Step 2: Add component contract test for new onboarding settings components**

Create `tests/onboarding-settings-components-contract.test.ts` with source assertions:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const summarySource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx'),
  'utf8',
)
const urgentPanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx'),
  'utf8',
)
const roleCardSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingRoleCard.tsx'),
  'utf8',
)

test('summary bar exposes actionable business metrics', () => {
  assert.match(summarySource, /Role đang dùng/)
  assert.match(summarySource, /Role thiếu checklist/)
  assert.match(summarySource, /Chức danh bị gán trùng/)
  assert.match(summarySource, /Nhân viên chưa khớp role/)
})

test('urgent panel uses business-first issue copy', () => {
  assert.match(urgentPanelSource, /Cần xử lý ngay/)
  assert.match(urgentPanelSource, /Nhân viên chưa khớp role/)
  assert.match(urgentPanelSource, /Role đang bật nhưng chưa có checklist/)
  assert.match(urgentPanelSource, /Chức danh bị gán trùng/)
})

test('role card merges checklist and mapping actions into one unit', () => {
  assert.match(roleCardSource, /Đổi checklist/)
  assert.match(roleCardSource, /Mở chi tiết/)
  assert.match(roleCardSource, /Tìm chức danh/)
  assert.match(roleCardSource, /Chưa có checklist/)
})
```

- [ ] **Step 3: Run tests to confirm they fail before implementation**

Run:

```bash
npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts
```

Expected:
- FAIL because new strings/components do not exist yet.

- [ ] **Step 4: Commit test-first contract changes**

```bash
git add tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts
git commit -m "test: lock onboarding settings task-first contracts"
```

If this workspace still lacks git metadata at execution time, skip commit and note it in the execution log.

---

### Task 2: Build reusable summary and urgent-issues components

**Files:**
- Create: `src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx`
- Create: `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx`

- [ ] **Step 1: Create `OnboardingSettingsSummaryBar.tsx` with typed metric rendering**

Add component shell like:

```tsx
import React from 'react'

type SummaryMetric = {
  label: string
  value: number
  href: string
  tone: 'neutral' | 'warning' | 'danger'
}

export function OnboardingSettingsSummaryBar({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <section id="summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
      {metrics.map((metric) => (
        <a
          key={metric.label}
          href={metric.href}
          style={{
            padding: 12,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#fff',
            textDecoration: 'none',
          }}
        >
          <div style={{ fontSize: 11, color: '#667085' }}>{metric.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginTop: 4 }}>{metric.value}</div>
        </a>
      ))}
    </section>
  )
}
```

Keep tone support in prop shape even if first pass only uses border/color differences.

- [ ] **Step 2: Create `OnboardingSettingsUrgentPanel.tsx` with business issue rows**

Add component shell like:

```tsx
import React from 'react'

type UrgentIssueRow = {
  title: string
  description: string
  count: number
  href: string
}

export function OnboardingSettingsUrgentPanel({ rows }: { rows: UrgentIssueRow[] }) {
  return (
    <section id="urgent-issues" style={{ padding: 12, borderRadius: 12, background: '#fffaf0', border: '1px solid #f4d7a1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Cần xử lý ngay</div>
        <div style={{ fontSize: 11, color: '#8a5b13' }}>{rows.reduce((sum, row) => sum + row.count, 0)} mục</div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((row) => (
          <div key={row.title} style={{ padding: 10, borderRadius: 10, background: '#fff', border: '1px solid #f4d7a1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{row.title}</div>
                <div style={{ fontSize: 11, color: '#8a5b13', marginTop: 2 }}>{row.description}</div>
              </div>
              <a href={row.href} style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8', textDecoration: 'none' }}>Xem và sửa</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Run component contract tests**

Run:

```bash
npx tsx --test tests/onboarding-settings-components-contract.test.ts
```

Expected:
- summary and urgent panel assertions PASS
- role-card assertions still FAIL because unified role card is not built yet

- [ ] **Step 4: Lint the new component files**

Run:

```bash
npx eslint src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx
```

Expected:
- PASS

- [ ] **Step 5: Commit reusable onboarding settings shell components**

```bash
git add src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx
git commit -m "feat: add onboarding settings summary and urgent panels"
```

If git is unavailable, skip commit and record that in the execution log.

---

### Task 3: Build unified role filters and role-card editor

**Files:**
- Create: `src/components/onboarding-settings/OnboardingRoleFilters.tsx`
- Create: `src/components/onboarding-settings/OnboardingRoleCard.tsx`
- Modify: `src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Add `OnboardingRoleFilters.tsx` with local search and status chips**

Create a focused filter component like:

```tsx
import React from 'react'

export type OnboardingRoleFilterKey = 'all' | 'enabled' | 'issues' | 'missing_template'

export function OnboardingRoleFilters({
  activeFilter,
  searchValue,
  onFilterChange,
  onSearchChange,
}: {
  activeFilter: OnboardingRoleFilterKey
  searchValue: string
  onFilterChange: (next: OnboardingRoleFilterKey) => void
  onSearchChange: (next: string) => void
}) {
  const filters: Array<{ key: OnboardingRoleFilterKey; label: string }> = [
    { key: 'all', label: 'Tất cả' },
    { key: 'enabled', label: 'Đang bật' },
    { key: 'issues', label: 'Có lỗi' },
    { key: 'missing_template', label: 'Chưa có checklist' },
  ]

  return (
    <section id="role-filters" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map((filter) => (
          <button key={filter.key} type="button" onClick={() => onFilterChange(filter.key)}>
            {filter.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Tìm role hoặc chức danh"
      />
    </section>
  )
}
```

- [ ] **Step 2: Create `OnboardingRoleCard.tsx` with merged checklist + mapping editor**

Build one role unit with compact summary and expandable details:

```tsx
import React, { useMemo, useState } from 'react'
import type { OnboardingChecklistTemplate, OnboardingRoleSetting, OnboardingRoleSettingsValidationIssue } from '@/lib/career-path-types'

export function OnboardingRoleCard({
  role,
  templates,
  positions,
  issues,
  onToggleEnabled,
  onLabelChange,
  onTemplateChange,
  onTogglePosition,
}: {
  role: OnboardingRoleSetting
  templates: OnboardingChecklistTemplate[]
  positions: Array<{ id: string; name: string }>
  issues: OnboardingRoleSettingsValidationIssue[]
  onToggleEnabled: () => void
  onLabelChange: (next: string) => void
  onTemplateChange: (next: string) => void
  onTogglePosition: (positionId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [positionFilter, setPositionFilter] = useState<'all' | 'assigned' | 'unassigned' | 'duplicate'>('all')

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesSearch = `${position.name} ${position.id}`.toLowerCase().includes(searchValue.toLowerCase())
      const assigned = role.position_ids.includes(position.id)
      if (!matchesSearch) return false
      if (positionFilter === 'assigned') return assigned
      if (positionFilter === 'unassigned') return !assigned
      return true
    })
  }, [positionFilter, positions, role.position_ids, searchValue])

  return (
    <article style={{ padding: 12, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{role.label || role.role_code}</div>
          <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>{role.role_code} • Thứ tự {role.sort_order}</div>
          <div style={{ fontSize: 12, color: '#344054', marginTop: 8 }}>
            {role.template_id ? role.template_id : 'Chưa có checklist'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onToggleEnabled}>{role.enabled ? 'Tắt' : 'Bật'}</button>
          <button type="button" onClick={() => setExpanded((current) => !current)}>{expanded ? 'Thu gọn' : 'Mở chi tiết'}</button>
        </div>
      </div>

      {issues.map((issue, index) => (
        <div key={`${issue.code}-${index}`} style={{ marginTop: 8, fontSize: 11, color: '#b42318' }}>{issue.message}</div>
      ))}

      {expanded ? (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <label>
            <div>Tên hiển thị</div>
            <input type="text" value={role.label} onChange={(event) => onLabelChange(event.target.value)} />
          </label>
          <label>
            <div>Checklist áp dụng</div>
            <select value={role.template_id ?? ''} onChange={(event) => onTemplateChange(event.target.value)}>
              <option value="">Chưa có checklist</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.role_label} • v{template.version} • {template.id}</option>
              ))}
            </select>
          </label>
          <div>
            <div>Chức danh áp dụng</div>
            <input type="text" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Tìm chức danh" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <button type="button" onClick={() => setPositionFilter('all')}>Tất cả</button>
              <button type="button" onClick={() => setPositionFilter('assigned')}>Đã gán</button>
              <button type="button" onClick={() => setPositionFilter('unassigned')}>Chưa gán</button>
              <button type="button" onClick={() => setPositionFilter('duplicate')}>Đang trùng</button>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {filteredPositions.map((position) => {
                const checked = role.position_ids.includes(position.id)
                return (
                  <label key={position.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={checked} onChange={() => onTogglePosition(position.id)} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{position.name}</div>
                      <div style={{ fontSize: 10, color: '#667085' }}>{position.id}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}
```

In the final implementation, wire `duplicate` filter to actual duplicate position ids computed in page state rather than leaving it as a no-op.

- [ ] **Step 3: Refactor `src/app/career-path/settings/page.tsx` to compose the new components**

Update `OnboardingRolesTab` so it:
- imports `OnboardingSettingsSummaryBar`, `OnboardingSettingsUrgentPanel`, `OnboardingRoleFilters`, and `OnboardingRoleCard`
- removes duplicate `Cấu hình onboarding` heading lines with garbled characters
- computes `duplicatePositionIds`, `roleFilter`, `roleSearch`, and filtered role list
- replaces standalone `Template checklist` section with unified role card list under heading `Thiết lập nhóm onboarding`

Use composition shape like:

```tsx
<Panel
  title="Cấu hình onboarding cho nhân sự mới"
  subtitle="Thiết lập nhóm onboarding, checklist áp dụng và xử lý lỗi cấu hình trước ngày vào làm."
>
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
    <div style={{ fontSize: 12, color: '#667085' }}>
      {isDirty ? 'Đã chỉnh sửa, chưa lưu' : 'Chưa có thay đổi'}
    </div>
    <button onClick={handleSave} style={primarySmallButtonStyle}>Lưu thay đổi</button>
  </div>

  <OnboardingSettingsSummaryBar metrics={summaryMetrics} />
  <OnboardingSettingsUrgentPanel rows={urgentRows} />
  <OnboardingRoleFilters
    activeFilter={roleFilter}
    searchValue={roleSearch}
    onFilterChange={setRoleFilter}
    onSearchChange={setRoleSearch}
  />

  <section id="roles" style={{ marginTop: 14 }}>
    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Thiết lập nhóm onboarding</div>
    <div style={{ display: 'grid', gap: 10 }}>
      {filteredRoles.map((role) => (
        <OnboardingRoleCard
          key={role.role_code}
          role={role}
          templates={activeTemplates}
          positions={mockPositions}
          issues={issues.filter((issue) => issue.role_code === role.role_code)}
          onToggleEnabled={() => updateRole(role.role_code, (current) => ({ ...current, enabled: !current.enabled }))}
          onLabelChange={(next) => updateRole(role.role_code, (current) => ({ ...current, label: next }))}
          onTemplateChange={(next) => updateRole(role.role_code, (current) => ({ ...current, template_id: next || null }))}
          onTogglePosition={(positionId) => togglePosition(role.role_code, positionId)}
        />
      ))}
    </div>
  </section>
</Panel>
```

- [ ] **Step 4: Run tests for page + component contracts**

Run:

```bash
npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts
```

Expected:
- PASS

- [ ] **Step 5: Lint the page and new role editor components**

Run:

```bash
npx eslint src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx
```

Expected:
- PASS

- [ ] **Step 6: Commit unified onboarding role editing flow**

```bash
git add src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx
git commit -m "feat: redesign onboarding settings role editor"
```

If git is unavailable, skip commit and note it in the execution log.

---

### Task 4: Document new onboarding settings boundaries and run final verification

**Files:**
- Modify: `docs/CODEMAP.md`

- [ ] **Step 1: Update `docs/CODEMAP.md` onboarding settings note**

Add or replace the onboarding settings entry with wording like:

```md
- `src/app/career-path/settings/page.tsx` onboarding area = `Cấu hình onboarding`
- `src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx` = summary metrics with jump links
- `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx` = urgent issue block for HR-first fixing
- `src/components/onboarding-settings/OnboardingRoleFilters.tsx` = search and status filters for onboarding role cards
- `src/components/onboarding-settings/OnboardingRoleCard.tsx` = unified role card with checklist assignment and collapsed position mapping
```

- [ ] **Step 2: Run all planned tests and lint checks together**

Run:

```bash
npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts
npx eslint src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx docs/CODEMAP.md
```

Expected:
- all tests PASS
- eslint PASS

- [ ] **Step 3: Smoke-check key UX expectations manually**

Open `/career-path/settings` and verify:
- header reads `Cấu hình onboarding cho nhân sự mới`
- first major block is `Cần xử lý ngay`
- there is no separate `Template checklist` section below role cards
- each role card shows checklist state in compact view
- mapping editor is hidden until `Mở chi tiết`
- save state text changes when editing a label or template

- [ ] **Step 4: Commit docs and verification-complete state**

```bash
git add docs/CODEMAP.md
git commit -m "docs: document onboarding settings task-first layout"
```

If git is unavailable, skip commit and record that in the execution log.

---

## Self-Review

### Spec coverage

Spec sections covered:
- task-first IA: Task 1 + Task 3
- new header/subtitle: Task 1 + Task 3
- actionable summary bar: Task 2 + Task 3
- urgent issue block: Task 2 + Task 3
- merged role + checklist editing: Task 3
- reduced mapping density with search/filter/collapse: Task 3
- save state clarity: Task 3
- docs update: Task 4

Not intentionally included in this plan:
- sticky footer/top save bar behavior beyond clear visible save state copy
- optional compact checklist audit table

These are safe deferrals because spec marked audit table as optional, and sticky placement can be polished after base redesign lands.

### Placeholder scan

Checked for forbidden placeholders:
- no `TODO`
- no `TBD`
- no `implement later`
- every task includes exact file paths and run commands

### Type and naming consistency

Locked names used across tasks:
- `OnboardingSettingsSummaryBar`
- `OnboardingSettingsUrgentPanel`
- `OnboardingRoleFilters`
- `OnboardingRoleCard`
- section ids `summary`, `urgent-issues`, `role-filters`, `roles`

