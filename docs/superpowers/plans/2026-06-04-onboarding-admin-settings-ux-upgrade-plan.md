# Onboarding Admin Settings UX Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Cấu hình onboarding` easy for HR/admin on first open by fixing misleading navigation, clarifying next actions, simplifying role editing, and pushing low-priority tools out of the main setup path.

**Architecture:** Keep current route structure, data model, and validators. Rebuild the `roles` tab as a guided workspace: problem-first header, action queue, clearer role cards, correct deep-links from onboarding overview, and a secondary-tools area for preview/report/audit.

**Tech Stack:** Next.js App Router, React client components, TypeScript, existing onboarding settings components, `career-path-service`, Node test runner via `tsx`, ESLint.

---

## Locked Decisions

- Keep routes unchanged:
  - `/career-path/settings`
  - `/career-path/onboarding/overview`
- Keep onboarding settings inside current `roles` tab.
- Standardize settings section hashes to:
  - `#overview`
  - `#journey-rules`
  - `#templates`
  - `#template-editor`
  - `#secondary-tools`
- Replace overview links to stale `#exceptions` / `#roles` with real hashes above.
- Keep current role/template resolver and validation model; this pass is UX-first.
- Keep `Preview`, `Báo cáo`, `Audit log`, but move them behind a low-priority wrapper.

## File Map

### Tests
- Modify: `tests/onboarding-settings-ia.test.ts`
- Modify: `tests/onboarding-settings-components-contract.test.ts`
- Modify: `tests/onboarding-overview-contract.test.ts`
- Create: `tests/onboarding-admin-settings-ux-contract.test.ts`

### Page and navigation
- Modify: `src/app/career-path/settings/page.tsx`
- Modify: `src/app/career-path/onboarding/overview/page.tsx`

### New components
- Create: `src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx`
- Create: `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx`

### Existing components to simplify
- Modify: `src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx`
- Modify: `src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx`
- Modify: `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleFilters.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleCard.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`

### Docs
- Modify: `docs/CODEMAP.md`

---

### Task 1: Lock final UX and deep-link contracts

**Files:**
- Modify: `tests/onboarding-settings-ia.test.ts`
- Modify: `tests/onboarding-settings-components-contract.test.ts`
- Modify: `tests/onboarding-overview-contract.test.ts`
- Create: `tests/onboarding-admin-settings-ux-contract.test.ts`

- [ ] **Step 1: Update settings IA test for final copy and section hashes**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'),
  'utf8',
)

test('settings page uses guided onboarding workspace copy', () => {
  assert.match(settingsPageSource, /Cấu hình onboarding cho nhân sự mới/)
  assert.match(settingsPageSource, /Sửa lỗi trước khi chỉnh sâu|Cần xử lý ngay/)
  assert.match(settingsPageSource, /Checklist áp dụng/)
  assert.match(settingsPageSource, /Công cụ phụ/)
})

test('settings page exposes stable admin section hashes', () => {
  assert.match(settingsPageSource, /id="overview"/)
  assert.match(settingsPageSource, /id="journey-rules"/)
  assert.match(settingsPageSource, /id="templates"/)
  assert.match(settingsPageSource, /id="template-editor"/)
  assert.match(settingsPageSource, /id="secondary-tools"/)
})
```

- [ ] **Step 2: Extend component contract tests for workspace shell**

```ts
const workspaceHeaderSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx'),
  'utf8',
)
const secondaryToolsSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx'),
  'utf8',
)

test('workspace header explains first action and save state', () => {
  assert.match(workspaceHeaderSource, /Cấu hình onboarding cho nhân sự mới/)
  assert.match(workspaceHeaderSource, /Sửa lỗi trước khi chỉnh sâu/)
  assert.match(workspaceHeaderSource, /Lưu thay đổi/)
})

test('secondary tools demote preview, reports, and audit log', () => {
  assert.match(secondaryToolsSource, /Công cụ phụ/)
  assert.match(secondaryToolsSource, /Preview checklist/)
  assert.match(secondaryToolsSource, /Báo cáo/)
  assert.match(secondaryToolsSource, /Audit log/)
})
```

- [ ] **Step 3: Update onboarding overview deep-link contract**

```ts
test('overview page exposes final CTA contracts', () => {
  assert.match(overviewPageSource, /\/career-path\/onboarding\?filter=all/)
  assert.match(overviewPageSource, /\/career-path\/onboarding\?filter=block_day_one/)
  assert.match(overviewPageSource, /\/career-path\/settings#journey-rules/)
  assert.match(overviewPageSource, /\/career-path\/settings#templates/)
})
```

- [ ] **Step 4: Add focused source contract for admin workspace layout**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'), 'utf8')

test('roles tab renders guided onboarding workspace order', () => {
  assert.match(settingsPageSource, /OnboardingSettingsWorkspaceHeader/)
  assert.match(settingsPageSource, /OnboardingSettingsSummaryBar/)
  assert.match(settingsPageSource, /OnboardingSettingsUrgentPanel/)
  assert.match(settingsPageSource, /OnboardingSettingsSecondaryTools/)
})

test('settings page uses responsive rail layout instead of fixed two-column shell', () => {
  assert.doesNotMatch(settingsPageSource, /gridTemplateColumns:\s*'minmax\(0, 1fr\) 320px'/)
  assert.match(settingsPageSource, /xl:grid-cols-\[minmax\(0,1fr\)_320px\]/)
})
```

- [ ] **Step 5: Run tests to verify they fail first**

Run: `npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-admin-settings-ux-contract.test.ts`
Expected: FAIL because current code still uses stale hashes, lacks the new workspace components, and keeps the fixed two-column shell.

- [ ] **Step 6: Commit**

```bash
git add tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-admin-settings-ux-contract.test.ts
git commit -m "test: lock onboarding admin settings ux contracts"
```

### Task 2: Build guided workspace shell and fix deep-links

**Files:**
- Create: `src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx`
- Modify: `src/app/career-path/settings/page.tsx`
- Modify: `src/app/career-path/onboarding/overview/page.tsx`
- Modify: `src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx`

- [ ] **Step 1: Create workspace header component**

```tsx
import React from 'react'

export function OnboardingSettingsWorkspaceHeader({
  saveMessage,
  saveTone,
  onSave,
  onReload,
  saveDisabled,
  showReload,
}: {
  saveMessage: string
  saveTone: 'idle' | 'success' | 'error'
  onSave: () => void
  onReload: () => void
  saveDisabled: boolean
  showReload: boolean
}) {
  return (
    <section id="overview" style={{ display: 'grid', gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
          Nhân sự mới
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#001D3D', margin: '6px 0 0' }}>
          Cấu hình onboarding cho nhân sự mới
        </h2>
        <p style={{ fontSize: 13, color: '#5F6B7A', marginTop: 8, lineHeight: 1.6 }}>
          Sửa lỗi trước khi chỉnh sâu, rồi mới gán checklist và phát hành template cho đợt onboarding tiếp theo.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 14, border: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ fontSize: 12, color: saveTone === 'error' ? '#b42318' : saveTone === 'success' ? '#067647' : '#475467' }}>
          {saveMessage}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {showReload ? <button type="button" onClick={onReload}>Tải lại nguồn</button> : null}
          <button type="button" onClick={onSave} disabled={saveDisabled}>Lưu thay đổi</button>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Replace misleading top copy in `OnboardingRolesTab`**

```tsx
<Panel
  title="Cấu hình onboarding"
  subtitle="Quản lý nhóm onboarding, checklist áp dụng, và lỗi cấu hình có thể làm nhân sự mới nhận sai lộ trình."
>
```

- [ ] **Step 3: Render workspace header above summary and urgent queue**

```tsx
<OnboardingSettingsWorkspaceHeader
  saveMessage={saveStatusMessage}
  saveTone={saveState.tone}
  onSave={handleSave}
  onReload={reloadDraftFromSource}
  saveDisabled={hasSourceConflict}
  showReload={hasSourceConflict}
/>
```

- [ ] **Step 4: Fix overview deep-links to real settings sections**

```tsx
{
  title: 'Nhân viên chưa khớp role',
  href: '/career-path/settings#journey-rules',
  cta: 'Mở nhóm onboarding',
},
{
  title: 'Cấu hình role và template',
  href: '/career-path/settings#templates',
  cta: 'Rà soát checklist áp dụng',
}
```

- [ ] **Step 5: Reframe admin rail as setup navigation, not generic control room**

```tsx
export function OnboardingSettingsAdminRail({ saveMessage, saveTone, stats, links }: Props) {
  return (
    <aside id="admin-rail" style={{ display: 'grid', gap: 12, alignSelf: 'start' }}>
      <div style={railCardStyle}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: '#667085' }}>Đi nhanh</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 6 }}>Thứ tự nên làm</div>
        <div style={{ fontSize: 12, color: saveTone === 'error' ? '#b42318' : saveTone === 'success' ? '#067647' : '#475467', marginTop: 8, lineHeight: 1.5 }}>
          {saveMessage}
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Run tests and lint**

Run: `npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-admin-settings-ux-contract.test.ts`
Expected: PASS.

Run: `npx eslint src/app/career-path/settings/page.tsx src/app/career-path/onboarding/overview/page.tsx src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/career-path/settings/page.tsx src/app/career-path/onboarding/overview/page.tsx src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx
git commit -m "feat: add guided onboarding settings shell"
```

### Task 3: Simplify role editing and make summaries action-oriented

**Files:**
- Modify: `src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx`
- Modify: `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleFilters.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleCard.tsx`
- Modify: `src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Point summary metrics to the real task sections**

```ts
const summaryMetrics: OnboardingSettingsSummaryMetric[] = [
  { label: 'Role đang dùng', value: draft.roles.filter((role) => role.enabled).length, href: '#journey-rules', tone: 'neutral' },
  { label: 'Role thiếu checklist', value: templateIssues.length, href: '#templates', tone: templateIssues.length > 0 ? 'warning' : 'neutral' },
  { label: 'Chức danh bị gán trùng', value: duplicatePositionIds.length, href: '#journey-rules', tone: duplicatePositionIds.length > 0 ? 'danger' : 'neutral' },
  { label: 'Nhân viên chưa khớp role', value: unmatchedEmployees.length, href: '#journey-rules', tone: unmatchedEmployees.length > 0 ? 'warning' : 'neutral' },
]
```

- [ ] **Step 2: Turn urgent panel into explicit action queue**

```tsx
<div style={{ fontSize: 11, color: '#8a5b13', lineHeight: 1.5, marginBottom: 10 }}>
  Sửa các lỗi này trước khi đổi checklist hoặc phát hành template mới, vì chúng có thể làm nhân sự mới nhận sai lộ trình onboarding.
</div>
```

```tsx
<a href={row.href} style={{ color: '#2F6FA8', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
  Mở đúng chỗ
</a>
```

- [ ] **Step 3: Use clearer filter wording for admins**

```tsx
<input
  type="text"
  value={searchValue}
  onChange={(event) => onSearchChange(event.target.value)}
  placeholder="Tìm nhóm onboarding hoặc chức danh"
  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', fontSize: 12 }}
/>
```

- [ ] **Step 4: Split expanded role card into two clear jobs**

```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f2f4f7' }}>
  <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Checklist áp dụng</div>
    {/* display label + checklist select */}
  </div>

  <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Chức danh áp dụng</div>
    {/* search + filters + positions */}
  </div>
</div>
```

- [ ] **Step 5: Replace rule-only warning with business impact**

```tsx
{issues.some((issue) => issue.code === 'missing_template') ? (
  <div style={{ fontSize: 11, color: '#b42318', lineHeight: 1.5 }}>
    Role này đang bật nhưng chưa có checklist, nên nhân sự mới thuộc nhóm này chưa thể nhận đúng danh sách việc cần làm.
  </div>
) : null}
```

- [ ] **Step 6: Run tests and lint**

Run: `npx tsx --test tests/onboarding-settings-components-contract.test.ts tests/onboarding-role-settings.test.ts`
Expected: PASS.

Run: `npx eslint src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx src/app/career-path/settings/page.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx src/app/career-path/settings/page.tsx
git commit -m "feat: simplify onboarding role editing ux"
```

### Task 4: Move low-priority tools out of the main setup path and verify responsive layout

**Files:**
- Create: `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
- Modify: `src/app/career-path/settings/page.tsx`
- Modify: `docs/CODEMAP.md`

- [ ] **Step 1: Create secondary-tools wrapper for preview, report, and audit**

```tsx
import React from 'react'
import type { OnboardingChecklistTemplate } from '@/lib/career-path-types'
import { OnboardingTemplatePreviewSection } from './OnboardingTemplatePreviewSection'
import { OnboardingReportsSection } from './OnboardingReportsSection'
import { OnboardingAuditLogSection } from './OnboardingAuditLogSection'

export function OnboardingSettingsSecondaryTools({ template }: { template: OnboardingChecklistTemplate | null }) {
  return (
    <section id="secondary-tools" style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>Công cụ phụ</div>
      <div style={{ fontSize: 12, color: '#667085' }}>
        Chỉ mở phần này khi cần xem trước checklist, rà số liệu, hoặc đối chiếu lịch sử thay đổi.
      </div>
      <details open>
        <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#111827' }}>Preview checklist</summary>
        <div style={{ marginTop: 10 }}><OnboardingTemplatePreviewSection template={template} /></div>
      </details>
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#111827' }}>Báo cáo</summary>
        <div style={{ marginTop: 10 }}><OnboardingReportsSection /></div>
      </details>
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#111827' }}>Audit log</summary>
        <div style={{ marginTop: 10 }}><OnboardingAuditLogSection /></div>
      </details>
    </section>
  )
}
```

- [ ] **Step 2: Make template library copy easier to scan**

```tsx
<div style={{ fontSize: 13, fontWeight: 700 }}>Checklist áp dụng</div>
<div style={{ fontSize: 12, color: '#667085' }}>
  Chọn đúng checklist cho từng nhóm onboarding. Template đang mở sẽ được dùng tiếp ở phần chỉnh sửa bên dưới.
</div>
```

- [ ] **Step 3: Reduce editor noise around published vs draft**

```tsx
{!isDraft ? (
  <div style={readOnlyStyle}>
    Đây là bản đang phát hành hoặc đã lưu trữ. Tạo bản nháp trước khi đổi nội dung để không làm ảnh hưởng template đang dùng thật.
  </div>
) : null}
```

- [ ] **Step 4: Replace fixed page shell with `xl`-only rail layout and mount secondary tools**

```tsx
<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
  <div style={{ display: 'grid', gap: 14 }}>
    {/* overview, content, templates, editor, journey-rules */}
    <OnboardingSettingsSecondaryTools template={selectedTemplate} />
  </div>
  <div className="xl:sticky xl:top-4 xl:self-start">
    <OnboardingSettingsAdminRail ... />
  </div>
</div>
```

- [ ] **Step 5: Update `docs/CODEMAP.md` for final admin-settings flow**

```md
- `/career-path/settings` onboarding area = admin workspace for `overview -> journey-rules -> templates -> template-editor -> secondary-tools`
- `/career-path/onboarding/overview` links into real settings hashes `#overview`, `#journey-rules`, `#templates`
- `src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx` = friendly admin header with save state and first-action guidance
- `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx` = wraps preview, reports, and audit log behind low-priority disclosure panels
```

- [ ] **Step 6: Run full verification**

Run: `npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-admin-settings-ux-contract.test.ts tests/onboarding-role-settings.test.ts`
Expected: PASS.

Run: `npx eslint src/app/career-path/settings/page.tsx src/app/career-path/onboarding/overview/page.tsx src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx docs/CODEMAP.md`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Manual smoke**

```text
1. Open /career-path/onboarding/overview as hr_admin or ceo.
2. Click “Nhân viên chưa khớp role” and confirm scroll lands in #journey-rules.
3. Click “Cấu hình role và template” and confirm scroll lands in #templates.
4. In /career-path/settings, verify the first screen shows title, save state, summary cards, and urgent queue before any deep editor.
5. Expand one role card and confirm “Checklist áp dụng” and “Chức danh áp dụng” are separate blocks.
6. Confirm preview/report/audit only show inside “Công cụ phụ”.
7. Resize to a narrow viewport and confirm the main column stacks before the rail.
```

- [ ] **Step 8: Commit**

```bash
git add src/app/career-path/settings/page.tsx src/app/career-path/onboarding/overview/page.tsx src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx docs/CODEMAP.md
git commit -m "docs: finalize onboarding admin settings ux rollout"
```

## Self-Review

- Spec coverage checked:
  - Friendly first-open workspace: Task 2
  - Correct overview deep-links: Task 2
  - Lower scan cost for role setup: Task 3
  - Demote low-priority tools: Task 4
  - Responsive shell and docs: Task 4
- Placeholder scan checked: no `TBD`, `TODO`, or vague “implement later” steps remain.
- Type consistency checked:
  - Final hashes stay `overview | journey-rules | templates | template-editor | secondary-tools`
  - Overview links target those same hashes
  - New component names match tests and page usage

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-04-onboarding-admin-settings-ux-upgrade-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
