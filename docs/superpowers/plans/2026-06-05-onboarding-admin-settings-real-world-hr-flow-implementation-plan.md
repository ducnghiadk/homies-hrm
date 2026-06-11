# Onboarding Admin Settings Real-World HR Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `Cấu hình onboarding` into a single-route 3-step workspace that helps HR fix blockers first, assign checklist by onboarding group second, and only edit checklist content when needed.

**Architecture:** Keep `/career-path/settings` and current onboarding services intact. Replace current content-library-first shell in `roles` tab with a task-first workspace: friendly header, blocker queue, onboarding-group assignment cards, and a collapsed draft-first checklist editor with secondary tools behind disclosure.

**Tech Stack:** Next.js App Router, React client components, TypeScript, existing onboarding settings components, `career-path-service`, `node:test` via `tsx`, ESLint.

---

## Locked Decisions

- Scope stays inside `src/app/career-path/settings/page.tsx` `roles` tab.
- Do not change route structure or backend data model in this pass.
- Keep published/draft runtime rules exactly as they are now: published templates apply to new employees, current employees keep old snapshots.
- Screen order is fixed:
  - `overview`
  - `step-1-config-errors`
  - `step-2-group-assignment`
  - `step-3-checklist-content`
  - `secondary-tools`
- Step 3 stays closed by default.
- `Content Library` and `Journey Rules` stop being primary labels in visible HR copy.
- Heavy admin rail becomes a small helper box only.

## File Map

### Tests
- Modify: `tests/onboarding-settings-ia.test.ts`
- Modify: `tests/onboarding-settings-components-contract.test.ts`
- Modify: `tests/onboarding-content-library-settings-contract.test.ts`
- Create: `tests/onboarding-admin-settings-shell-contract.test.ts`
- Create: `tests/onboarding-admin-settings-assignment-contract.test.ts`
- Create: `tests/onboarding-admin-settings-editor-contract.test.ts`

### Page
- Modify: `src/app/career-path/settings/page.tsx`

### New components
- Create: `src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx`
- Create: `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx`

### Existing components to refit
- Modify: `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleFilters.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleCard.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
- Modify: `src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx`
- Modify: `src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx`

### Docs
- Modify: `docs/CODEMAP.md`

---

### Task 1: Lock workspace shell contracts before changing layout

**Files:**
- Modify: `tests/onboarding-settings-ia.test.ts`
- Create: `tests/onboarding-admin-settings-shell-contract.test.ts`

- [ ] **Step 1: Rewrite `tests/onboarding-settings-ia.test.ts` for final page copy and section order**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'),
  'utf8',
)

test('settings page uses HR-friendly onboarding workspace copy', () => {
  assert.match(settingsPageSource, /Cấu hình onboarding nhân sự mới/)
  assert.match(settingsPageSource, /Làm theo 3 bước để nhân sự mới nhận đúng checklist trước ngày vào làm\./)
  assert.doesNotMatch(settingsPageSource, /Content Library/i)
  assert.doesNotMatch(settingsPageSource, /Journey Rules/i)
})

test('settings page renders sections in blocker-first order', () => {
  const step1Index = settingsPageSource.indexOf('BƯỚC 1. KIỂM TRA LỖI CẤU HÌNH')
  const step2Index = settingsPageSource.indexOf('BƯỚC 2. GÁN CHECKLIST CHO TỪNG NHÓM ONBOARDING')
  const step3Index = settingsPageSource.indexOf('BƯỚC 3. SỬA NỘI DUNG CHECKLIST')

  assert.ok(step1Index > -1)
  assert.ok(step2Index > step1Index)
  assert.ok(step3Index > step2Index)
})

test('settings page exposes stable anchors for the admin workspace flow', () => {
  assert.match(settingsPageSource, /id="overview"/)
  assert.match(settingsPageSource, /id="step-1-config-errors"/)
  assert.match(settingsPageSource, /id="step-2-group-assignment"/)
  assert.match(settingsPageSource, /id="step-3-checklist-content"/)
  assert.match(settingsPageSource, /id="secondary-tools"/)
})
```

- [ ] **Step 2: Add a focused shell contract test for the new header and small rail**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'),
  'utf8',
)
test('settings page groups lower-priority tools after the main three steps', () => {
  assert.match(pageSource, /id="secondary-tools"/)
  assert.match(pageSource, /OnboardingTemplatePreviewSection/)
  assert.match(pageSource, /OnboardingReportsSection/)
  assert.match(pageSource, /OnboardingAuditLogSection/)
})
```

- [ ] **Step 3: Run tests to verify they fail first**

Run: `npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-admin-settings-shell-contract.test.ts`
Expected: FAIL because the page still uses content-library-first copy and does not mount the new header.

- [ ] **Step 4: Commit**

```bash
git add tests/onboarding-settings-ia.test.ts tests/onboarding-admin-settings-shell-contract.test.ts
git commit -m "test: lock onboarding admin settings shell contract"
```

### Task 2: Build the new header card and top-level page shell

**Files:**
- Create: `src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx`
- Modify: `src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Create `OnboardingSettingsWorkspaceHeader.tsx`**

```tsx
import React from 'react'

type ReadinessTone = 'ready' | 'warning'

export function OnboardingSettingsWorkspaceHeader({
  readinessLabel,
  readinessDetail,
  readinessTone,
  saveMessage,
  saveDisabled,
  showReload,
  onSave,
  onReload,
}: {
  readinessLabel: string
  readinessDetail: string
  readinessTone: ReadinessTone
  saveMessage: string
  saveDisabled: boolean
  showReload: boolean
  onSave: () => void
  onReload: () => void
}) {
  return (
    <section id="overview" style={{ display: 'grid', gap: 12 }}>
      <div style={{ padding: 16, borderRadius: 16, border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Cấu hình onboarding nhân sự mới</div>
            <div style={{ fontSize: 13, color: '#667085', lineHeight: 1.6 }}>
              Làm theo 3 bước để nhân sự mới nhận đúng checklist trước ngày vào làm.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {showReload ? (
              <button type="button" onClick={onReload} style={secondaryButtonStyle}>
                Tải lại nguồn
              </button>
            ) : null}
            <button type="button" onClick={onSave} disabled={saveDisabled} style={{ ...primaryButtonStyle, opacity: saveDisabled ? 0.6 : 1, cursor: saveDisabled ? 'not-allowed' : 'pointer' }}>
              Lưu thay đổi
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, border: readinessTone === 'ready' ? '1px solid #b7e0c2' : '1px solid #f5d0a6', background: readinessTone === 'ready' ? '#ecfdf3' : '#fff7ed' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: readinessTone === 'ready' ? '#067647' : '#b54708' }}>{readinessLabel}</div>
          <div style={{ fontSize: 12, color: '#475467', marginTop: 4, lineHeight: 1.5 }}>{readinessDetail}</div>
          <div style={{ fontSize: 11, color: '#667085', marginTop: 8 }}>{saveMessage}</div>
        </div>
      </div>
    </section>
  )
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: 'none',
  background: '#667eea',
  color: '#fff',
  fontSize: 11,
  fontWeight: 600,
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#344054',
  fontSize: 11,
  fontWeight: 600,
}
```- [ ] **Step 2: Compute readiness state inside `OnboardingRolesTab`**

```tsx
const blockerCount = unmatchedEmployees.length + duplicatePositionIds.length + templateIssues.length
const readinessLabel = blockerCount === 0
  ? 'Đã sẵn sàng cho đợt onboarding tiếp theo'
  : `Còn ${blockerCount} lỗi cần xử lý trước khi dùng`
const readinessDetail = blockerCount === 0
  ? 'Tất cả nhóm onboarding đã có checklist và không còn lỗi gán chức danh.'
  : 'Xử lý lỗi cấu hình ở bước 1 trước, rồi mới rà gán checklist và chỉnh nội dung checklist nếu cần.'
const readinessTone = blockerCount === 0 ? 'ready' : 'warning'
```

- [ ] **Step 3: Replace the current panel shell with the new 3-step page structure**

```tsx
return (
  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
    <div style={{ display: 'grid', gap: 16 }}>
      <OnboardingSettingsWorkspaceHeader
        readinessLabel={readinessLabel}
        readinessDetail={readinessDetail}
        readinessTone={readinessTone}
        saveMessage={saveStatusMessage}
        saveDisabled={hasSourceConflict}
        showReload={hasSourceConflict}
        onSave={handleSave}
        onReload={reloadDraftFromSource}
      />

      <section id="step-1-config-errors" style={{ display: 'grid', gap: 10 }}>
        <div style={stepTitleStyle}>BƯỚC 1. KIỂM TRA LỖI CẤU HÌNH</div>
        <OnboardingSettingsUrgentPanel rows={urgentRows} />
      </section>

      <section id="step-2-group-assignment" style={{ display: 'grid', gap: 12 }}>
        <div style={stepTitleStyle}>BƯỚC 2. GÁN CHECKLIST CHO TỪNG NHÓM ONBOARDING</div>
        <OnboardingRoleFilters
          activeFilter={roleFilter}
          searchValue={roleSearch}
          onFilterChange={setRoleFilter}
          onSearchChange={setRoleSearch}
        />
        <div style={{ display: 'grid', gap: 10 }}>
          {filteredRoles.map((role) => (
            <OnboardingRoleCard
              key={role.role_code}
              role={role}
              templates={activeTemplates}
              positions={mockPositions.map((position) => ({ id: position.id, name: position.name }))}
              issues={issues.filter((issue) => issue.role_code === role.role_code)}
              duplicatePositionIds={duplicatePositionIds}
              onToggleEnabled={() => updateRole(role.role_code, (current) => ({ ...current, enabled: !current.enabled }))}
              onLabelChange={(next) => updateRole(role.role_code, (current) => ({ ...current, label: next }))}
              onTemplateChange={(next) => updateRole(role.role_code, (current) => ({ ...current, template_id: next || null }))}
              onTogglePosition={(positionId) => togglePosition(role.role_code, positionId)}
            />
          ))}
          {filteredRoles.length === 0 ? <div style={{ fontSize: 12, color: '#667085' }}>Không tìm thấy nhóm onboarding phù hợp.</div> : null}
        </div>
      </section>

      <section id="step-3-checklist-content" style={{ display: 'grid', gap: 12 }}>
        <div style={stepTitleStyle}>BƯỚC 3. SỬA NỘI DUNG CHECKLIST</div>
        <OnboardingTemplateLibrarySection
          templates={activeTemplates}
          topicCountByTemplate={topicCountByTemplate}
          selectedTemplateId={selectedTemplate?.id ?? null}
          onSelectTemplate={setSelectedTemplateId}
        />
        <OnboardingTemplateEditorSection
          selectedTemplateId={selectedTemplate?.id ?? null}
          onSelectTemplate={setSelectedTemplateId}
          onTemplateMutated={refreshTemplates}
        />
      </section>

      <section id="secondary-tools" style={{ display: 'grid', gap: 12 }}>
        <section id="preview">
          <OnboardingTemplatePreviewSection template={selectedTemplate} />
        </section>
        <section id="reports">
          <OnboardingReportsSection />
        </section>
        <section id="audit-log">
          <OnboardingAuditLogSection />
        </section>
      </section>
    </div>

    <div className="hidden xl:block xl:sticky xl:top-4 xl:self-start">
      <OnboardingSettingsAdminRail
        saveMessage={saveStatusMessage}
        saveTone={saveState.tone}
        stats={adminRailStats}
        links={adminRailLinks}
      />
    </div>
  </div>
)
```

- [ ] **Step 4: Add the shared step-title style in `page.tsx`**

```tsx
const stepTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#7a6b53',
}
```

- [ ] **Step 5: Run focused verification**

Run: `npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-admin-settings-shell-contract.test.ts`
Expected: PASS.

Run: `npx eslint src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx
git commit -m "feat: add onboarding admin settings workspace shell"
```

### Task 3: Lock blocker-first and assignment-first component contracts

**Files:**
- Modify: `tests/onboarding-settings-components-contract.test.ts`
- Create: `tests/onboarding-admin-settings-assignment-contract.test.ts`

- [ ] **Step 1: Rewrite `tests/onboarding-settings-components-contract.test.ts` around the approved blocker and role copy**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const urgentPanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx'),
  'utf8',
)
const roleCardSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingRoleCard.tsx'),
  'utf8',
)
const roleFilterSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingRoleFilters.tsx'),
  'utf8',
)

test('urgent panel uses approved blocker labels and action copy', () => {
  assert.match(urgentPanelSource, /Nhân viên chưa vào đúng nhóm onboarding/)
  assert.match(urgentPanelSource, /Chức danh đang bị gán 2 nhóm onboarding/)
  assert.match(urgentPanelSource, /Nhóm onboarding chưa có checklist/)
  assert.match(urgentPanelSource, /Sửa ngay/)
})

test('role filters use friendly HR wording', () => {
  assert.match(roleFilterSource, /Tìm nhóm onboarding hoặc chức danh/)
  assert.match(roleFilterSource, /Đang dùng/)
  assert.match(roleFilterSource, /Cần xử lý/)
})

test('role card leads with assignment actions instead of generic details copy', () => {
  assert.match(roleCardSource, /Đổi checklist/)
  assert.match(roleCardSource, /Xem chức danh áp dụng/)
  assert.match(roleCardSource, /Gán checklist ngay/)
  assert.match(roleCardSource, /Checklist đang dùng|Chưa có checklist/)
  assert.doesNotMatch(roleCardSource, /Mở chi tiết/)
})
```

- [ ] **Step 2: Add a targeted contract test for role-card warnings and two-column expanded layout**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const roleCardSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingRoleCard.tsx'),
  'utf8',
)

test('role card explains business impact for missing checklist', () => {
  assert.match(roleCardSource, /nhân sự mới thuộc nhóm này chưa thể nhận đúng danh sách việc cần làm/i)
})

test('expanded role card separates checklist and position assignment', () => {
  assert.match(roleCardSource, /Checklist đang dùng/)
  assert.match(roleCardSource, /Chức danh áp dụng/)
  assert.match(roleCardSource, /repeat\(auto-fit, minmax\(280px, 1fr\)\)/)
})
```

- [ ] **Step 3: Run tests to verify they fail first**

Run: `npx tsx --test tests/onboarding-settings-components-contract.test.ts tests/onboarding-admin-settings-assignment-contract.test.ts`
Expected: FAIL because current urgent panel, filters, and role cards still use the older labels and actions.

- [ ] **Step 4: Commit**

```bash
git add tests/onboarding-settings-components-contract.test.ts tests/onboarding-admin-settings-assignment-contract.test.ts
git commit -m "test: lock onboarding admin assignment contracts"
```### Task 4: Rebuild step 1 and step 2 around blockers and group assignment

**Files:**
- Modify: `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleFilters.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleCard.tsx`
- Modify: `src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Update `OnboardingSettingsUrgentPanel.tsx` to show approved blocker cards and zero-state**

```tsx
export const onboardingUrgentIssueTitles = [
  'Nhân viên chưa vào đúng nhóm onboarding',
  'Chức danh đang bị gán 2 nhóm onboarding',
  'Nhóm onboarding chưa có checklist',
] as const

export function OnboardingSettingsUrgentPanel({ rows }: { rows: OnboardingSettingsUrgentRow[] }) {
  const hasBlockingRows = rows.some((row) => row.count > 0)

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {!hasBlockingRows ? (
        <div style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #b7e0c2', background: '#ecfdf3', fontSize: 12, color: '#067647' }}>
          Hiện không còn lỗi cấu hình cần xử lý.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {rows.map((row) => (
            <div key={row.title} style={{ padding: '12px 14px', borderRadius: 12, background: '#fffaf0', border: '1px solid #f4d7a1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{row.title}</div>
                  <div style={{ fontSize: 11, color: '#8a5b13', marginTop: 4, lineHeight: 1.5 }}>{row.description}</div>
                </div>
                <a href={row.href} style={{ color: '#2F6FA8', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Sửa ngay
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `OnboardingRoleFilters.tsx` with final HR labels**

```tsx
const filterOptions: Array<{ key: OnboardingRoleFilterKey; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'enabled', label: 'Đang dùng' },
  { key: 'issues', label: 'Cần xử lý' },
  { key: 'missing_template', label: 'Chưa có checklist' },
]

<input
  type="text"
  value={searchValue}
  onChange={(event) => onSearchChange(event.target.value)}
  placeholder="Tìm nhóm onboarding hoặc chức danh"
  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', fontSize: 12 }}
/>
```

- [ ] **Step 3: Refocus `OnboardingRoleCard.tsx` around checklist assignment and applied positions**

```tsx
export const onboardingRoleCardActionLabels = [
  'Đổi checklist',
  'Xem chức danh áp dụng',
  'Gán checklist ngay',
  'Chưa có checklist',
] as const

const primaryChecklistAction = selectedTemplate ? 'Đổi checklist' : 'Gán checklist ngay'

<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignContent: 'flex-start' }}>
  <button type="button" onClick={() => setExpanded(true)} style={actionButtonStyle('#eef2ff', '#3646c5')}>
    {primaryChecklistAction}
  </button>
  <button type="button" onClick={() => setExpanded((current) => !current)} style={actionButtonStyle('#fff', '#344054')}>
    {expanded ? 'Ẩn chức danh áp dụng' : 'Xem chức danh áp dụng'}
  </button>
</div>

{issues.some((issue) => issue.code === 'missing_template') ? (
  <div style={{ fontSize: 11, color: '#b42318', lineHeight: 1.5 }}>
    Nhóm onboarding này chưa có checklist, nên nhân sự mới thuộc nhóm này chưa thể nhận đúng danh sách việc cần làm.
  </div>
) : null}

{expanded ? (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f2f4f7' }}>
    <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
      <div style={fieldLabelStyle}>Checklist đang dùng</div>
      <select value={role.template_id ?? ''} onChange={(event) => onTemplateChange(event.target.value)} style={fieldControlStyle}>
        <option value="">Chưa có checklist</option>
        {roleTemplates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} • v{template.version}
          </option>
        ))}
      </select>
    </div>

    <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
      <div style={fieldLabelStyle}>Chức danh áp dụng</div>
      <input type="text" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Tìm chức danh" style={fieldControlStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {filteredPositions.map((position) => {
          const checked = role.position_ids.includes(position.id)
          const duplicate = duplicatePositionIds.includes(position.id)
          return (
            <label key={`${role.role_code}-${position.id}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 10, border: `1px solid ${duplicate ? '#f3c0bc' : checked ? '#a5b4fc' : '#e5e7eb'}`, background: checked ? '#f8faff' : '#fff', cursor: 'pointer' }}>
              <input type="checkbox" checked={checked} onChange={() => onTogglePosition(position.id)} style={{ marginTop: 2 }} />
              <div style={{ display: 'grid', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{position.name}</span>
                <span style={{ fontSize: 10, color: '#667085' }}>{position.id}</span>
                {duplicate ? <span style={{ fontSize: 10, color: '#b42318' }}>Đang trùng ở nhiều nhóm onboarding</span> : null}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  </div>
) : null}
```

- [ ] **Step 4: Change `urgentRows` and section copy in `page.tsx` to match the approved wireframe**

```tsx
const urgentRows: OnboardingSettingsUrgentRow[] = [
  {
    title: 'Nhân viên chưa vào đúng nhóm onboarding',
    description: `${unmatchedEmployees.length} nhân viên cần kiểm tra để vào đúng nhóm onboarding trước ngày vào làm.`,
    count: unmatchedEmployees.length,
    href: '#step-2-group-assignment',
  },
  {
    title: 'Chức danh đang bị gán 2 nhóm onboarding',
    description: `${duplicatePositionIds.length} chức danh đang bị gán trùng, cần chọn lại một nhóm duy nhất.`,
    count: duplicatePositionIds.length,
    href: '#step-2-group-assignment',
  },
  {
    title: 'Nhóm onboarding chưa có checklist',
    description: `${templateIssues.length} nhóm đang thiếu checklist nên chưa thể giao đúng việc cho nhân sự mới.`,
    count: templateIssues.length,
    href: '#step-2-group-assignment',
  },
]
```

- [ ] **Step 5: Run focused verification**

Run: `npx tsx --test tests/onboarding-settings-components-contract.test.ts tests/onboarding-admin-settings-assignment-contract.test.ts tests/onboarding-role-settings.test.ts`
Expected: PASS.

Run: `npx eslint src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx src/app/career-path/settings/page.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx src/app/career-path/settings/page.tsx
git commit -m "feat: rebuild onboarding admin blockers and group assignment"
```

### Task 5: Lock step-3 editor and secondary-tools contracts before changing template UI

**Files:**
- Modify: `tests/onboarding-content-library-settings-contract.test.ts`
- Create: `tests/onboarding-admin-settings-editor-contract.test.ts`

- [ ] **Step 1: Rewrite `tests/onboarding-content-library-settings-contract.test.ts` for the new step-3 entry point**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'),
  'utf8',
)

test('settings page treats checklist content as step 3, not as the default entry point', () => {
  assert.match(settingsPageSource, /BƯỚC 3. SỬA NỘI DUNG CHECKLIST/)
  assert.match(settingsPageSource, /Mở danh sách checklist/)
  assert.match(settingsPageSource, /Công cụ phụ/)
  assert.doesNotMatch(settingsPageSource, /Content Library/)
})
```

- [ ] **Step 2: Add editor and publish-flow contract tests**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const librarySource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx'),
  'utf8',
)
const editorSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx'),
  'utf8',
)
const publishPanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx'),
  'utf8',
)
const secondaryToolsSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx'),
  'utf8',
)

test('template list uses friendly checklist copy and closed-entry action', () => {
  assert.match(librarySource, /Danh sách checklist mẫu/)
  assert.match(librarySource, /Mở danh sách checklist/)
  assert.match(librarySource, /Bản đang dùng/)
  assert.match(librarySource, /Bản nháp/)
})

test('editor protects published checklist with draft-first warning', () => {
  assert.match(editorSource, /Checklist này đang được dùng thật/)
  assert.match(editorSource, /Tạo bản nháp/)
  assert.match(editorSource, /Tên checklist/)
  assert.match(editorSource, /Số ngày onboarding/)
})

test('publish panel uses final validation actions', () => {
  assert.match(publishPanelSource, /Kiểm tra trước khi phát hành/)
  assert.match(publishPanelSource, /Mở lại phần cần sửa/)
  assert.match(publishPanelSource, /Phát hành bản nháp/)
})

test('secondary tools stay behind a collapsed helper section', () => {
  assert.match(secondaryToolsSource, /Công cụ phụ/)
  assert.match(secondaryToolsSource, /Xem trước checklist/)
  assert.match(secondaryToolsSource, /Báo cáo sử dụng checklist/)
  assert.match(secondaryToolsSource, /Lịch sử thay đổi/)
})
```

- [ ] **Step 3: Run tests to verify they fail first**

Run: `npx tsx --test tests/onboarding-content-library-settings-contract.test.ts tests/onboarding-admin-settings-editor-contract.test.ts`
Expected: FAIL because template UI still uses the older content-library-first wording and publish actions.

- [ ] **Step 4: Commit**

```bash
git add tests/onboarding-content-library-settings-contract.test.ts tests/onboarding-admin-settings-editor-contract.test.ts
git commit -m "test: lock onboarding admin editor and tools contracts"
```### Task 6: Rebuild step 3, demote secondary tools, and finish verification

**Files:**
- Create: `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
- Modify: `src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx`
- Modify: `src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx`
- Modify: `src/app/career-path/settings/page.tsx`
- Modify: `docs/CODEMAP.md`

- [ ] **Step 1: Create `OnboardingSettingsSecondaryTools.tsx` as a collapsed helper area**

```tsx
import React from 'react'
import type { OnboardingChecklistTemplate } from '@/lib/career-path-types'
import { OnboardingAuditLogSection } from './OnboardingAuditLogSection'
import { OnboardingReportsSection } from './OnboardingReportsSection'
import { OnboardingTemplatePreviewSection } from './OnboardingTemplatePreviewSection'

export function OnboardingSettingsSecondaryTools({ template }: { template: OnboardingChecklistTemplate | null }) {
  return (
    <section id="secondary-tools" style={{ display: 'grid', gap: 10 }}>
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#111827' }}>Công cụ phụ</summary>
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#667085', lineHeight: 1.5 }}>
            Chỉ mở phần này khi cần xem trước checklist, rà báo cáo sử dụng, hoặc đối chiếu lịch sử thay đổi.
          </div>
          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Xem trước checklist</div>
            <OnboardingTemplatePreviewSection template={template} />
          </section>
          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Báo cáo sử dụng checklist</div>
            <OnboardingReportsSection />
          </section>
          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Lịch sử thay đổi</div>
            <OnboardingAuditLogSection />
          </section>
        </div>
      </details>
    </section>
  )
}
```

- [ ] **Step 2: Change `OnboardingTemplateLibrarySection.tsx` into the closed step-3 entry point**

```tsx
export function OnboardingTemplateLibrarySection({
  templates,
  topicCountByTemplate,
  selectedTemplateId,
  onSelectTemplate,
}: {
  templates: OnboardingChecklistTemplate[]
  topicCountByTemplate: Record<string, number>
  selectedTemplateId: string | null
  onSelectTemplate: (templateId: string) => void
}) {
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, color: '#667085', lineHeight: 1.5 }}>
        Chỉ mở phần này khi cần đổi checklist đang dùng hoặc tạo bản nháp để sửa nội dung.
      </div>
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#2F6FA8' }}>Mở danh sách checklist</summary>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Danh sách checklist mẫu</div>
          {templates.map((template) => {
            const isSelected = template.id === selectedTemplateId
            const statusLabel = template.status === 'published' ? 'Bản đang dùng' : template.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'
            return (
              <article key={template.id} style={{ border: isSelected ? '1px solid #667eea' : '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: isSelected ? '#eef2ff' : '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{template.name}</div>
                    <div style={{ fontSize: 11, color: '#667085', marginTop: 4 }}>{statusLabel} • v{template.version}</div>
                  </div>
                  <button type="button" onClick={() => onSelectTemplate(template.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', color: '#344054', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {isSelected ? 'Đang mở' : 'Mở chỉnh sửa'}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#475467', marginTop: 8, lineHeight: 1.5 }}>
                  {topicCountByTemplate[template.id] ?? 0} chủ đề • lộ trình {template.journey_length_days} ngày • {template.id}
                </div>
              </article>
            )
          })}
        </div>
      </details>
    </section>
  )
}
```

- [ ] **Step 3: Rewrite `OnboardingTemplateEditorSection.tsx` around checklist language and draft-first editing**

```tsx
const editorTopRef = useRef<HTMLDivElement | null>(null)

if (!template) {
  return (
    <div style={sectionStyle}>
      <div style={titleStyle}>S?a n?i dung checklist</div>
      <div style={subtitleStyle}>M? m?t checklist t? danh s?ch b?n tr?n ?? ch?nh n?i dung ho?c t?o b?n nh?p m?i.</div>
    </div>
  )
}

<div ref={editorTopRef} style={sectionStyle}>
  {!isDraft ? (
    <div style={readOnlyStyle}>
      Checklist n?y ?ang ???c d?ng th?t. T?o b?n nh?p tr??c khi ??i n?i dung ?? kh?ng ?nh h??ng b?n ?ang ph?t h?nh.
    </div>
  ) : null}

  <div style={metaCardStyle}>
    <div style={metaGridStyle}>
      <label style={fieldStyle}>
        <span style={fieldLabelStyle}>T?n checklist</span>
        <input type="text" value={template.name} onChange={(event) => handleTemplateFieldUpdate({ name: event.target.value })} disabled={!isDraft} style={inputStyle} />
      </label>
      <label style={fieldStyle}>
        <span style={fieldLabelStyle}>S? ng?y onboarding</span>
        <input type="number" min={1} value={template.journey_length_days} onChange={(event) => handleTemplateFieldUpdate({ journey_length_days: Math.max(1, Number(event.target.value)) })} disabled={!isDraft} style={inputStyle} />
      </label>
    </div>
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>M? t?</span>
      <textarea value={template.description} onChange={(event) => handleTemplateFieldUpdate({ description: event.target.value })} disabled={!isDraft} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
    </label>
  </div>

  <OnboardingPublishValidationPanel
    report={report}
    onRefresh={() => refresh({ tone: 'idle', text: '?? l?m m?i b?o c?o ki?m tra ph?t h?nh.' })}
    onReopenEditor={() => editorTopRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })}
    onPublish={handlePublish}
    publishDisabled={!isDraft}
  />
</div>
```

- [ ] **Step 4: Update `OnboardingPublishValidationPanel.tsx` to match the final actions**

```tsx
export function OnboardingPublishValidationPanel({
  report,
  onRefresh,
  onReopenEditor,
  onPublish,
  publishDisabled,
}: {
  report: OnboardingPublishValidationReport | null
  onRefresh: () => void
  onReopenEditor: () => void
  onPublish: () => void
  publishDisabled?: boolean
}) {
  const blockingCount = report?.blocking_issues.length ?? 0
  const canPublish = blockingCount === 0 && !publishDisabled

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>Kiểm tra trước khi phát hành</div>
          <div style={subtitleStyle}>{report ? `Đã kiểm tra lúc ${formatDate(report.checked_at)}.` : 'Chưa chạy kiểm tra phát hành.'}</div>
        </div>
        <div style={actionRowStyle}>
          <button type="button" onClick={onRefresh} style={secondaryButtonStyle}>Kiểm tra trước khi phát hành</button>
          <button type="button" onClick={onReopenEditor} style={secondaryButtonStyle}>Mở lại phần cần sửa</button>
          <button type="button" onClick={onPublish} disabled={!canPublish} style={{ ...primaryButtonStyle, opacity: canPublish ? 1 : 0.6, cursor: canPublish ? 'pointer' : 'not-allowed' }}>
            Phát hành bản nháp
          </button>
        </div>
      </div>

      {blockingCount > 0 ? (
        <div style={issueListStyle}>
          {report?.blocking_issues.map((issue) => (
            <div key={`${issue.code}-${issue.template_id}`} style={issueRowStyle}>
              <div style={issueCodeStyle}>{issue.code}</div>
              <div style={issueMessageStyle}>{issue.message}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={passStyle}>Bản nháp đã đủ điều kiện phát hành.</div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Shrink `OnboardingSettingsAdminRail.tsx` to a small next-step helper**

```tsx
export function OnboardingSettingsAdminRail({
  blockerCount,
  links,
}: {
  blockerCount: number
  links: OnboardingSettingsAdminRailLink[]
}) {
  const headline = blockerCount > 0
    ? `Còn ${blockerCount} lỗi cần xử lý trước khi lưu.`
    : 'Không còn lỗi chặn. Rà nhóm onboarding rồi lưu nếu có thay đổi.'

  return (
    <aside id="admin-rail" style={{ display: 'grid', gap: 12, alignSelf: 'start' }}>
      <div style={railCardStyle}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: '#667085' }}>Hôm nay cần làm gì</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginTop: 6 }}>{headline}</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {links.map((link) => (
            <a key={link.label} href={link.href} style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8', textDecoration: 'none' }}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Update `page.tsx` links and mount the final slim rail + secondary tools**

```tsx
const adminRailLinks = [
  { label: 'Kiểm tra lỗi cấu hình', href: '#step-1-config-errors' },
  { label: 'Gán checklist theo nhóm', href: '#step-2-group-assignment' },
  { label: 'Sửa nội dung checklist', href: '#step-3-checklist-content' },
  { label: 'Mở công cụ phụ', href: '#secondary-tools' },
]
```

```tsx
<OnboardingTemplateEditorSection
  selectedTemplateId={selectedTemplate?.id ?? null}
  onSelectTemplate={setSelectedTemplateId}
  onTemplateMutated={refreshTemplates}
/>

<OnboardingSettingsSecondaryTools template={selectedTemplate} />
```

- [ ] **Step 7: Update `docs/CODEMAP.md` for the final admin flow**

```md
- `/career-path/settings` `roles` tab = onboarding admin workspace for `overview -> step-1-config-errors -> step-2-group-assignment -> step-3-checklist-content -> secondary-tools`
- `src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx` = friendly HR header with readiness state and save action
- `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx` = collapsed helper area for preview, reports, and audit log
- `src/components/onboarding-settings/OnboardingRoleCard.tsx` = onboarding-group card with checklist assignment and applied-position controls
```

- [ ] **Step 8: Run full verification**

Run: `npx tsx --test tests/onboarding-settings-ia.test.ts tests/onboarding-admin-settings-shell-contract.test.ts tests/onboarding-settings-components-contract.test.ts tests/onboarding-admin-settings-assignment-contract.test.ts tests/onboarding-content-library-settings-contract.test.ts tests/onboarding-admin-settings-editor-contract.test.ts tests/onboarding-role-settings.test.ts tests/onboarding-template-publish-validation.test.ts`
Expected: PASS.

Run: `npx eslint src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingSettingsWorkspaceHeader.tsx src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx docs/CODEMAP.md`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 9: Manual smoke**

```text
1. Open /career-path/settings and stay on tab “Cấu hình onboarding”.
2. Confirm header card shows title, subtitle, readiness state, and save action first.
3. Confirm step 1 appears before any checklist editor.
4. Confirm each blocker card has “Sửa ngay”.
5. Confirm step 2 cards let you change checklist or inspect applied positions without opening the editor first.
6. Confirm step 3 is closed by default and starts with “Mở danh sách checklist”.
7. Open a published checklist and confirm the warning says “Checklist này đang được dùng thật” and the primary action is “Tạo bản nháp”.
8. Expand “Công cụ phụ” and confirm preview, report, and history live there instead of competing with the main setup flow.
9. Resize to a narrow viewport and confirm the main column stays readable without the rail.
```

- [ ] **Step 10: Commit**

```bash
git add src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx docs/CODEMAP.md
git commit -m "feat: finish onboarding admin settings hr-first flow"
```

## Self-Review

- Spec coverage checked:
  - header, readiness state, save action: Task 2
  - blocker-first step 1: Task 4
  - onboarding-group assignment step 2: Task 4
  - draft-first checklist editing step 3: Task 6
  - secondary tools collapsed: Task 6
  - friendly HR copy replacements: Tasks 1, 3, 5, 6
- Placeholder scan checked: no `TBD`, `TODO`, or “implement later” markers remain.
- Type consistency checked:
  - anchors stay `overview`, `step-1-config-errors`, `step-2-group-assignment`, `step-3-checklist-content`, `secondary-tools`
  - new component names stay `OnboardingSettingsWorkspaceHeader` and `OnboardingSettingsSecondaryTools`
  - publish panel actions stay `onRefresh`, `onReopenEditor`, `onPublish`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-05-onboarding-admin-settings-real-world-hr-flow-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**