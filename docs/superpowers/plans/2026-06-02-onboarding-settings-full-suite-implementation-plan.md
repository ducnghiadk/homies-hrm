# Onboarding Full Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện bộ cấu hình onboarding trọn vẹn gồm role mapping, content library editor, publish flow, preview runtime, reports, import/export schema, audit log, và chuẩn hóa tiếng Việt trong vùng onboarding.

**Architecture:** Dùng chiến lược `vertical slices có lõi chung`: chốt `core contract` trước, sau đó tách các nhánh độc lập cho editor, preview, reports, audit, import/export, và cleanup. Mọi preview và report phải đọc từ cùng runtime/service contract để tránh lệch logic.

**Tech Stack:** Next.js/React, TypeScript, localStorage-backed service layer, Node test runner (`tsx --test`), ESLint.

---

## File Structure

### Core contract và service
- Modify: `src/lib/career-path-types.ts`
- Modify: `src/lib/career-path-service.ts`
- Modify: `src/lib/services/onboarding-content-runtime-service.ts`
- Optional create: `src/lib/services/onboarding-template-diff-service.ts`
- Optional create: `src/lib/services/onboarding-audit-service.ts`

### Settings UI và editor
- Modify: `src/app/career-path/settings/page.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateMetadataEditor.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateTopicEditor.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateStageEditor.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateItemEditor.tsx`
- Create: `src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx`
- Create: `src/components/onboarding-settings/OnboardingReportsSection.tsx`
- Create: `src/components/onboarding-settings/OnboardingAuditLogSection.tsx`

### Tests
- Modify: `tests/onboarding-role-settings.test.ts`
- Modify: `tests/onboarding-content-library-service.test.ts`
- Create: `tests/onboarding-template-publish-validation.test.ts`
- Create: `tests/onboarding-template-preview-runtime.test.ts`
- Create: `tests/onboarding-template-diff-report.test.ts`
- Create: `tests/onboarding-import-export-schema.test.ts`
- Create: `tests/onboarding-audit-log.test.ts`
- Modify: `tests/onboarding-settings-ia.test.ts`
- Create: `tests/onboarding-settings-full-suite-contract.test.ts`

## Task 1: Chốt core contract cho template, audit, import/export

**Files:**
- Modify: `src/lib/career-path-types.ts`
- Test: `tests/onboarding-import-export-schema.test.ts`
- Test: `tests/onboarding-audit-log.test.ts`

- [ ] **Step 1: Bổ sung type lõi cho onboarding full suite**

Thêm hoặc mở rộng type cho các khối sau trong `src/lib/career-path-types.ts`:

```ts
export type OnboardingTemplateStatus = 'draft' | 'published' | 'archived'

export interface OnboardingPublishValidationReport {
  template_id: string
  blocking_issues: OnboardingTemplateValidationIssue[]
  warning_issues: OnboardingTemplateValidationIssue[]
  checked_at: string
}

export interface OnboardingTemplateDiffSummary {
  template_id: string
  baseline_template_id: string | null
  topic_added: number
  topic_removed: number
  item_added: number
  item_removed: number
  required_item_changed: number
  stage_changed: number
  journey_length_changed: boolean
}

export interface OnboardingSettingsAuditEntry {
  id: string
  event_type: string
  entity_type: 'role_setting' | 'template' | 'topic' | 'stage' | 'item' | 'import_export'
  entity_id: string
  summary: string
  changed_fields: string[]
  actor: string
  created_at: string
}

export interface OnboardingSettingsExportEnvelope {
  schema_version: '2026-06-02'
  module: 'onboarding_settings'
  exported_at: string
  payload: {
    role_settings: OnboardingRoleSettings
    templates: OnboardingChecklistTemplate[]
    topics: OnboardingContentTopic[]
    stages: OnboardingChecklistStage[]
    items: OnboardingChecklistItemTemplate[]
  }
}
```

- [ ] **Step 2: Viết test fail cho envelope schema và audit shape**

Tạo `tests/onboarding-import-export-schema.test.ts` với test tối thiểu:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { initCareerPathStores, exportOnboardingSettingsBundle } from '../src/lib/career-path-service'

test('onboarding export returns versioned schema envelope', () => {
  initCareerPathStores()
  const exported = exportOnboardingSettingsBundle()

  assert.equal(exported.schema_version, '2026-06-02')
  assert.equal(exported.module, 'onboarding_settings')
  assert.ok(exported.payload.role_settings)
  assert.ok(Array.isArray(exported.payload.templates))
})
```

Và `tests/onboarding-audit-log.test.ts` với test tối thiểu:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { createOnboardingAuditEntry } from '../src/lib/career-path-service'

test('audit entry exposes minimum required fields', () => {
  const entry = createOnboardingAuditEntry({
    event_type: 'template_publish',
    entity_type: 'template',
    entity_id: 'tpl-1',
    summary: 'Publish template',
    changed_fields: ['status'],
  })

  assert.equal(entry.entity_type, 'template')
  assert.ok(entry.id)
  assert.ok(entry.actor)
  assert.ok(entry.created_at)
})
```

- [ ] **Step 3: Chạy test để xác nhận đang fail**

Run: `npx --yes tsx --test tests/onboarding-import-export-schema.test.ts tests/onboarding-audit-log.test.ts`
Expected: FAIL vì type/service chưa có đủ API.

- [ ] **Step 4: Cài implementation tối thiểu cho contract mới**

Bổ sung API trong `src/lib/career-path-service.ts`:

```ts
export function createOnboardingAuditEntry(input: {
  event_type: string
  entity_type: OnboardingSettingsAuditEntry['entity_type']
  entity_id: string
  summary: string
  changed_fields: string[]
  actor?: string
}): OnboardingSettingsAuditEntry {
  return {
    id: `onb-audit-${uid()}`,
    event_type: input.event_type,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    summary: input.summary,
    changed_fields: input.changed_fields,
    actor: input.actor ?? 'current_user',
    created_at: nowIso(),
  }
}

export function exportOnboardingSettingsBundle(): OnboardingSettingsExportEnvelope {
  return {
    schema_version: '2026-06-02',
    module: 'onboarding_settings',
    exported_at: nowIso(),
    payload: {
      role_settings: getOnboardingRoleSettings(),
      templates: getOnboardingChecklistTemplates(),
      topics: _onboardingContentTopics,
      stages: _onboardingChecklistStages,
      items: _onboardingChecklistItems,
    },
  }
}
```

- [ ] **Step 5: Chạy test lại**

Run: `npx --yes tsx --test tests/onboarding-import-export-schema.test.ts tests/onboarding-audit-log.test.ts`
Expected: PASS.

## Task 2: Chuẩn hóa publish validation report và publish atomic flow

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `tests/onboarding-template-publish-validation.test.ts`

- [ ] **Step 1: Viết test fail cho validation report có cấu trúc**

Tạo `tests/onboarding-template-publish-validation.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { initCareerPathStores, getDraftOnboardingChecklistTemplate, validateOnboardingTemplateForPublishReport } from '../src/lib/career-path-service'

test('publish validation returns structured report', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)

  const report = validateOnboardingTemplateForPublishReport(draft!.id)
  assert.equal(report.template_id, draft!.id)
  assert.ok(Array.isArray(report.blocking_issues))
  assert.ok(Array.isArray(report.warning_issues))
})
```

- [ ] **Step 2: Chạy test fail**

Run: `npx --yes tsx --test tests/onboarding-template-publish-validation.test.ts`
Expected: FAIL vì API chưa tồn tại.

- [ ] **Step 3: Thêm report API và tái dùng trong publish**

Trong `src/lib/career-path-service.ts`, tạo API:

```ts
export function validateOnboardingTemplateForPublishReport(templateId: string): OnboardingPublishValidationReport {
  const blocking_issues = validateOnboardingTemplateForPublish(templateId)
  return {
    template_id: templateId,
    blocking_issues,
    warning_issues: [],
    checked_at: nowIso(),
  }
}
```

Và sửa `publishOnboardingChecklistTemplate()` để dùng report này thay vì đọc mảng lỗi thô trực tiếp.

- [ ] **Step 4: Bổ sung test publish archive đúng template cũ**

Mở rộng test:

```ts
test('publish archives previous published template for same role atomically', () => {
  initCareerPathStores()
  // dùng flow publish hiện có và assert published cũ thành archived
})
```

- [ ] **Step 5: Chạy test lại**

Run: `npx --yes tsx --test tests/onboarding-template-publish-validation.test.ts tests/onboarding-content-library-service.test.ts`
Expected: PASS.

## Task 3: Chốt import/export schema và import validation cho onboarding bundle

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Test: `tests/onboarding-import-export-schema.test.ts`

- [ ] **Step 1: Viết test fail cho import reject schema sai**

Mở rộng `tests/onboarding-import-export-schema.test.ts`:

```ts
import { importOnboardingSettingsBundle } from '../src/lib/career-path-service'

test('import rejects unsupported onboarding schema version', () => {
  const success = importOnboardingSettingsBundle({
    schema_version: '2025-01-01',
    module: 'onboarding_settings',
    exported_at: '2026-06-02T00:00:00.000Z',
    payload: { role_settings: {} as never, templates: [], topics: [], stages: [], items: [] },
  } as never)

  assert.equal(success, false)
})
```

- [ ] **Step 2: Thêm test fail cho import payload onboarding mismatch role/template**

```ts
test('import onboarding bundle rejects invalid role-template mapping', () => {
  initCareerPathStores()
  const exported = exportOnboardingSettingsBundle()
  exported.payload.role_settings.roles[0] = {
    ...exported.payload.role_settings.roles[0],
    enabled: true,
    template_id: 'onb-template-barista-published-v1',
  }

  const success = importOnboardingSettingsBundle(exported)
  assert.equal(success, false)
})
```

- [ ] **Step 3: Chạy test fail**

Run: `npx --yes tsx --test tests/onboarding-import-export-schema.test.ts`
Expected: FAIL.

- [ ] **Step 4: Cài import API tối thiểu**

Thêm trong `src/lib/career-path-service.ts`:

```ts
export function importOnboardingSettingsBundle(bundle: OnboardingSettingsExportEnvelope): boolean {
  if (bundle.schema_version !== '2026-06-02') return false

  const issues = validateOnboardingRoleSettings(bundle.payload.role_settings)
  if (issues.length > 0) return false

  _onboardingChecklistTemplates = bundle.payload.templates
  _onboardingContentTopics = bundle.payload.topics
  _onboardingChecklistStages = bundle.payload.stages
  _onboardingChecklistItems = bundle.payload.items
  _settings = {
    ..._settings,
    onboarding_role_settings: bundle.payload.role_settings,
  }

  save(KEYS.onboardingChecklistTemplates, _onboardingChecklistTemplates)
  save(KEYS.onboardingContentTopics, _onboardingContentTopics)
  save(KEYS.onboardingChecklistStages, _onboardingChecklistStages)
  save(KEYS.onboardingChecklistItems, _onboardingChecklistItems)
  save(KEYS.settings, _settings)
  return true
}
```

Ghi audit log import thành công trong cùng flow.

- [ ] **Step 5: Chạy test lại**

Run: `npx --yes tsx --test tests/onboarding-import-export-schema.test.ts`
Expected: PASS.

## Task 4: Tạo service diff summary cho draft vs published

**Files:**
- Create: `src/lib/services/onboarding-template-diff-service.ts`
- Test: `tests/onboarding-template-diff-report.test.ts`

- [ ] **Step 1: Viết test fail cho diff summary**

Tạo `tests/onboarding-template-diff-report.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { initCareerPathStores, getDraftOnboardingChecklistTemplate, getPublishedOnboardingChecklistTemplate } from '../src/lib/career-path-service'
import { buildOnboardingTemplateDiffSummary } from '../src/lib/services/onboarding-template-diff-service'

test('diff summary compares draft against published baseline', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  const published = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  assert.ok(published)

  const diff = buildOnboardingTemplateDiffSummary(draft!.id, published!.id)
  assert.equal(diff.template_id, draft!.id)
  assert.equal(diff.baseline_template_id, published!.id)
})
```

- [ ] **Step 2: Chạy test fail**

Run: `npx --yes tsx --test tests/onboarding-template-diff-report.test.ts`
Expected: FAIL.

- [ ] **Step 3: Cài diff service tối thiểu**

Tạo `src/lib/services/onboarding-template-diff-service.ts`:

```ts
import type { OnboardingTemplateDiffSummary } from '@/lib/career-path-types'
import { getOnboardingChecklistItems, getOnboardingChecklistTemplateSnapshotById, getOnboardingContentTopics } from '@/lib/career-path-service'

export function buildOnboardingTemplateDiffSummary(templateId: string, baselineTemplateId: string | null): OnboardingTemplateDiffSummary {
  const current = getOnboardingChecklistTemplateSnapshotById(templateId)
  const baseline = baselineTemplateId ? getOnboardingChecklistTemplateSnapshotById(baselineTemplateId) : null
  const currentTopics = getOnboardingContentTopics(templateId)
  const baselineTopics = baseline ? getOnboardingContentTopics(baseline.id) : []
  const currentItems = getOnboardingChecklistItems(templateId)
  const baselineItems = baseline ? getOnboardingChecklistItems(baseline.id) : []

  return {
    template_id: templateId,
    baseline_template_id: baseline?.id ?? null,
    topic_added: Math.max(currentTopics.length - baselineTopics.length, 0),
    topic_removed: Math.max(baselineTopics.length - currentTopics.length, 0),
    item_added: Math.max(currentItems.length - baselineItems.length, 0),
    item_removed: Math.max(baselineItems.length - currentItems.length, 0),
    required_item_changed: 0,
    stage_changed: 0,
    journey_length_changed: Boolean(current && baseline && current.journey_length_days !== baseline.journey_length_days),
  }
}
```

- [ ] **Step 4: Chạy test lại**

Run: `npx --yes tsx --test tests/onboarding-template-diff-report.test.ts`
Expected: PASS.

## Task 5: Mở rộng runtime builder để preview draft/published dùng chung dữ liệu

**Files:**
- Modify: `src/lib/services/onboarding-content-runtime-service.ts`
- Test: `tests/onboarding-template-preview-runtime.test.ts`

- [ ] **Step 1: Viết test fail cho preview runtime từ template bất kỳ**

Tạo `tests/onboarding-template-preview-runtime.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { initCareerPathStores, getDraftOnboardingChecklistTemplate, getPublishedOnboardingChecklistTemplate } from '../src/lib/career-path-service'
import { buildOnboardingRuntimeDays } from '../src/lib/services/onboarding-content-runtime-service'

test('runtime builder supports both draft and published template ids', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  const published = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  assert.ok(published)

  const draftDays = buildOnboardingRuntimeDays(draft!.id)
  const publishedDays = buildOnboardingRuntimeDays(published!.id)

  assert.ok(draftDays.length > 0)
  assert.ok(publishedDays.length > 0)
})
```

- [ ] **Step 2: Chạy test**

Run: `npx --yes tsx --test tests/onboarding-template-preview-runtime.test.ts`
Expected: PASS hoặc FAIL nếu runtime builder chưa ổn với draft. Nếu PASS, giữ test làm khóa regression.

- [ ] **Step 3: Nếu cần, sửa runtime builder để nhận template snapshot an toàn hơn**

Ưu tiên API tách rõ:

```ts
export function buildOnboardingRuntimeDays(templateId: string): OnboardingRuntimeDay[]
export function buildOnboardingRuntimeSummary(templateId: string) {
  const days = buildOnboardingRuntimeDays(templateId)
  return {
    total_days: days.length,
    total_items: days.reduce((sum, day) => sum + day.allItems.length, 0),
    focus_days: days.filter((day) => day.focusItems.length > 0).length,
  }
}
```

- [ ] **Step 4: Chạy test lại**

Run: `npx --yes tsx --test tests/onboarding-template-preview-runtime.test.ts tests/onboarding-content-library-service.test.ts`
Expected: PASS.

## Task 6: Tách settings page thành library section và editor shell

**Files:**
- Modify: `src/app/career-path/settings/page.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`
- Create: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
- Modify: `tests/onboarding-settings-ia.test.ts`
- Create: `tests/onboarding-settings-full-suite-contract.test.ts`

- [ ] **Step 1: Viết contract test fail cho settings IA mới**

Tạo `tests/onboarding-settings-full-suite-contract.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'), 'utf8')

test('settings page exposes template editor, preview, reports, and audit sections', () => {
  assert.match(source, /template-editor|Template Editor|Trình sửa template/i)
  assert.match(source, /preview/i)
  assert.match(source, /report|bao cao/i)
  assert.match(source, /audit/i)
})
```

- [ ] **Step 2: Chạy test fail**

Run: `npx --yes tsx --test tests/onboarding-settings-full-suite-contract.test.ts tests/onboarding-settings-ia.test.ts`
Expected: FAIL.

- [ ] **Step 3: Tạo library section và editor shell**

Tạo `OnboardingTemplateLibrarySection.tsx` hiển thị danh sách template và summary cơ bản.

Tạo `OnboardingTemplateEditorSection.tsx` làm shell nhận props:

```ts
{
  selectedTemplateId: string | null
  onSelectTemplate: (templateId: string) => void
}
```

Nối 2 section này vào `OnboardingRolesTab` trong `src/app/career-path/settings/page.tsx` mà không xóa phần role mapping hiện có.

- [ ] **Step 4: Thêm anchor sections**

Đảm bảo page có các section id sau:

```tsx
<section id="templates" />
<section id="template-editor" />
<section id="preview" />
<section id="reports" />
<section id="audit-log" />
```

- [ ] **Step 5: Chạy test lại**

Run: `npx --yes tsx --test tests/onboarding-settings-full-suite-contract.test.ts tests/onboarding-settings-ia.test.ts`
Expected: PASS.

## Task 7: Dựng topic editor UI độc lập

**Files:**
- Create: `src/components/onboarding-settings/OnboardingTemplateTopicEditor.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
- Targeted lint only

- [ ] **Step 1: Tạo component editor topic**

Component nhận props:

```ts
{
  topics: OnboardingContentTopic[]
  onAddTopic: () => void
  onRenameTopic: (topicId: string, label: string) => void
  onToggleTopic: (topicId: string) => void
}
```

UI tối thiểu:
- danh sách topic
- input sửa label
- badge active/inactive
- nút thêm topic

- [ ] **Step 2: Nối component vào editor shell**

Render `OnboardingTemplateTopicEditor` trong `OnboardingTemplateEditorSection.tsx` với dữ liệu từ template đang chọn.

- [ ] **Step 3: Chạy lint mục tiêu**

Run: `npx eslint src/components/onboarding-settings/OnboardingTemplateTopicEditor.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
Expected: PASS.

## Task 8: Dựng stage editor UI độc lập

**Files:**
- Create: `src/components/onboarding-settings/OnboardingTemplateStageEditor.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`

- [ ] **Step 1: Tạo component editor stage**

Props tối thiểu:

```ts
{
  stages: OnboardingChecklistStage[]
  onRenameStage: (stageId: string, label: string) => void
  onToggleStage: (stageId: string) => void
}
```

Hiển thị danh sách stage chuẩn hóa, thứ tự, và active state.

- [ ] **Step 2: Nối vào editor shell**

Render `OnboardingTemplateStageEditor` bên dưới topic editor hoặc ở cột riêng.

- [ ] **Step 3: Chạy lint mục tiêu**

Run: `npx eslint src/components/onboarding-settings/OnboardingTemplateStageEditor.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
Expected: PASS.

## Task 9: Dựng item editor UI độc lập

**Files:**
- Create: `src/components/onboarding-settings/OnboardingTemplateItemEditor.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`

- [ ] **Step 1: Tạo component item editor**

Props tối thiểu:

```ts
{
  items: OnboardingChecklistItemTemplate[]
  topics: OnboardingContentTopic[]
  stages: OnboardingChecklistStage[]
  onAddItem: () => void
  onUpdateItem: (itemId: string, patch: Partial<OnboardingChecklistItemTemplate>) => void
}
```

Field UI tối thiểu:
- title
- topic select
- stage select
- estimated minutes
- required toggle
- focus block toggle
- visibility select

- [ ] **Step 2: Nối vào editor shell**

Render item editor với template đang chọn.

- [ ] **Step 3: Chạy lint mục tiêu**

Run: `npx eslint src/components/onboarding-settings/OnboardingTemplateItemEditor.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
Expected: PASS.

## Task 10: Tạo publish validation panel và action publish UI

**Files:**
- Create: `src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
- Modify: `src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Dựng panel validation**

Props:

```ts
{
  report: OnboardingPublishValidationReport | null
  onRefresh: () => void
  onPublish: () => void
}
```

Hiển thị:
- số lỗi chặn publish
- danh sách lỗi
- trạng thái pass/fail
- nút publish disable khi có blocking issue

- [ ] **Step 2: Nối panel vào editor shell**

Lấy report từ `validateOnboardingTemplateForPublishReport(selectedTemplateId)` và render panel.

- [ ] **Step 3: Nối publish action**

Khi publish thành công:
- reload templates
- refresh role/template summaries
- ghi save state message tiếng Việt có dấu

- [ ] **Step 4: Chạy lint mục tiêu**

Run: `npx eslint src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx src/app/career-path/settings/page.tsx`
Expected: PASS.

## Task 11: Dựng preview section cho nhân viên và operations

**Files:**
- Create: `src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx`
- Modify: `src/app/career-path/settings/page.tsx`
- Modify: `src/lib/services/onboarding-content-runtime-service.ts`

- [ ] **Step 1: Tạo preview section**

Props:

```ts
{
  templateId: string | null
}
```

Hiển thị tối thiểu 3 khối:
- summary runtime
- preview nhân viên theo ngày/chặng
- preview operations focus block

- [ ] **Step 2: Dùng runtime builder chung**

Không tự group item bằng logic riêng trong component. Gọi service runtime builder để lấy ngày, focus items, stage label.

- [ ] **Step 3: Nếu có baseline published, hiển thị diff summary**

Dùng `buildOnboardingTemplateDiffSummary()` để render các số thay đổi aggregate.

- [ ] **Step 4: Chạy test + lint mục tiêu**

Run: `npx --yes tsx --test tests/onboarding-template-preview-runtime.test.ts tests/onboarding-template-diff-report.test.ts`
Run: `npx eslint src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx src/app/career-path/settings/page.tsx`
Expected: PASS.

## Task 12: Dựng reports section

**Files:**
- Create: `src/components/onboarding-settings/OnboardingReportsSection.tsx`
- Modify: `src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Tạo section báo cáo**

Hiển thị các metric tối thiểu:
- số role bật nhưng thiếu template hợp lệ
- số template published/draft/archived
- số nhân viên unmatched role
- số nhân viên đang dùng template archived snapshot

- [ ] **Step 2: Thêm bảng ngắn deep-link được**

Tạo bảng nhỏ cho:
- role lỗi
- unmatched employees
- template list theo trạng thái

- [ ] **Step 3: Nối vào settings page**

Render section tại `id="reports"`.

- [ ] **Step 4: Chạy lint mục tiêu**

Run: `npx eslint src/components/onboarding-settings/OnboardingReportsSection.tsx src/app/career-path/settings/page.tsx`
Expected: PASS.

## Task 13: Dựng audit log section

**Files:**
- Create: `src/components/onboarding-settings/OnboardingAuditLogSection.tsx`
- Modify: `src/app/career-path/settings/page.tsx`
- Test: `tests/onboarding-audit-log.test.ts`

- [ ] **Step 1: Mở rộng test để log hành động publish hoặc import**

```ts
test('publish or import action appends onboarding audit entry', () => {
  initCareerPathStores()
  // gọi action thật rồi assert audit list tăng lên
})
```

- [ ] **Step 2: Cài list/getter API cho audit log nếu chưa có**

Trong service, thêm getter như:

```ts
export function getOnboardingAuditEntries(): OnboardingSettingsAuditEntry[] {
  return [..._onboardingSettingsAuditEntries].sort((a, b) => b.created_at.localeCompare(a.created_at))
}
```

- [ ] **Step 3: Tạo UI section**

Hiển thị:
- thời gian
- hành động
- đối tượng
- mô tả
- changed fields

- [ ] **Step 4: Chạy test + lint**

Run: `npx --yes tsx --test tests/onboarding-audit-log.test.ts`
Run: `npx eslint src/components/onboarding-settings/OnboardingAuditLogSection.tsx src/app/career-path/settings/page.tsx`
Expected: PASS.

## Task 14: Quét tiếng Việt onboarding settings và copy mới

**Files:**
- Modify: `src/app/career-path/settings/page.tsx`
- Modify: `src/components/onboarding-settings/*.tsx`
- Optional modify: onboarding preview/report sections vừa tạo

- [ ] **Step 1: Quét chuỗi lỗi mã hóa trong vùng onboarding settings**

Tìm các marker như:

```text
Ã
á»
Ä
â€¢
```

Scope chỉ trong file onboarding settings và preview/report/audit mới tạo.

- [ ] **Step 2: Sửa copy sang tiếng Việt có dấu 100%**

Các nhóm copy cần chốt:
- title/subtitle
- save state
- warning/error
- badge trạng thái
- help text
- empty state

- [ ] **Step 3: Chạy lint mục tiêu**

Run: `npx eslint src/app/career-path/settings/page.tsx src/components/onboarding-settings/*.tsx`
Expected: PASS.

## Task 15: Hợp nhất cuối và chạy bộ test mục tiêu

**Files:**
- Modify: các file đã thay đổi ở task trước
- Test: toàn bộ test onboarding liên quan

- [ ] **Step 1: Nối toàn bộ section vào settings page theo thứ tự IA**

Thứ tự khuyến nghị:
1. overview
2. content library
3. templates
4. template editor
5. preview
6. reports
7. audit log
8. journey rules

- [ ] **Step 2: Chạy test onboarding trọng yếu**

Run:

```bash
npx --yes tsx --test tests/onboarding-role-settings.test.ts tests/onboarding-content-library-service.test.ts tests/onboarding-template-publish-validation.test.ts tests/onboarding-template-preview-runtime.test.ts tests/onboarding-template-diff-report.test.ts tests/onboarding-import-export-schema.test.ts tests/onboarding-audit-log.test.ts tests/onboarding-settings-ia.test.ts tests/onboarding-settings-full-suite-contract.test.ts
```

Expected: PASS.

- [ ] **Step 3: Chạy lint mục tiêu cho toàn bộ vùng onboarding settings**

Run:

```bash
npx eslint src/app/career-path/settings/page.tsx src/components/onboarding-settings/*.tsx src/lib/services/onboarding-content-runtime-service.ts
```

Expected: PASS.

- [ ] **Step 4: Rà integration risks**

Checklist:
- không có field mới lệch contract
- publish không làm đổi plan cũ
- import reject payload lỗi
- preview dùng chung runtime service
- copy tiếng Việt không còn lỗi mã hóa rõ ràng

- [ ] **Step 5: Commit**

```bash
git add src/app/career-path/settings/page.tsx src/components/onboarding-settings src/lib/career-path-types.ts src/lib/career-path-service.ts src/lib/services/onboarding-content-runtime-service.ts src/lib/services/onboarding-template-diff-service.ts tests/onboarding-*.test.ts docs/superpowers/specs/2026-06-02-onboarding-settings-full-suite-design.md docs/superpowers/plans/2026-06-02-onboarding-settings-full-suite-implementation-plan.md
git commit -m "feat: complete onboarding settings full suite"
```

## Parallelization Guide For Antigravity

Sau khi xong `Task 1-5` hoặc đã chốt contract đủ rõ, có thể giao song song:

- Lane A: `Task 7` topic editor UI
- Lane B: `Task 8` stage editor UI
- Lane C: `Task 9` item editor UI
- Lane D: `Task 12` reports section
- Lane E: `Task 13` audit log section
- Lane F: `Task 14` tiếng Việt/copy cleanup

Không giao `Task 1-5` cho model yếu tự quyết nếu chưa có review tay.
