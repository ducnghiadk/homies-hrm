# Thiết lập quy trình thử việc dạng thẻ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor màn `Thiết lập quy trình thử việc` hiện có sang bố cục `dạng thẻ ngang`, mỗi lần chỉ mở một thẻ, vẫn giữ cột thao tác và đường đi tới chỗ còn thiếu.

**Architecture:** Tận dụng route `/career-path/onboarding/setup` và dữ liệu hiện có trong `career-path-service`, nhưng thay toàn bộ bố cục dọc 3 bước bằng một `vùng làm việc chính` có dải thẻ ngang. Tách phần khung thẻ, danh sách thiếu, và nội dung từng thẻ thành các đơn vị nhỏ để dễ kiểm thử và dễ mở rộng về sau. Kế hoạch này thay thế phần `màn thiết lập` trong plan ngày `2026-06-05`; không lặp lại các task tạo route và điều hướng đã có sẵn trong code hiện tại.

**Tech Stack:** Next.js App Router, React client components, TypeScript, dữ liệu onboarding trong `src/lib/career-path-service.ts`, kiểm thử hợp đồng bằng `tsx --test`, kiểm tra mã nguồn bằng ESLint.

---

## Cấu trúc file dự kiến

**Tạo mới:**
- `src/components/onboarding-settings/TrialWorkflowTabBar.tsx` - dải thẻ ngang hiển thị thẻ đang mở và số chỗ còn thiếu.
- `src/components/onboarding-settings/TrialWorkflowWorkspacePanel.tsx` - khung nội dung chính cho thẻ đang mở.
- `src/components/onboarding-settings/TrialWorkflowMissingItemsTable.tsx` - bảng gom các chỗ còn thiếu ở cuối thẻ.
- `src/components/onboarding-settings/buildTrialWorkflowSetupViewModel.ts` - gom logic tính số liệu đầu màn, số lỗi theo thẻ, và danh sách thiếu.
- `src/components/onboarding-settings/TrialWorkflowGeneralInfoTab.tsx` - nội dung thẻ `Thông tin chung`.
- `src/components/onboarding-settings/TrialWorkflowStagesTab.tsx` - nội dung thẻ `Bốn chặng thử việc`.
- `src/components/onboarding-settings/TrialWorkflowTasksTab.tsx` - nội dung thẻ `Việc cần làm`.
- `src/components/onboarding-settings/TrialWorkflowGateConditionsTab.tsx` - nội dung thẻ `Điều kiện qua chặng`.
- `src/components/onboarding-settings/TrialWorkflowAssignmentsTab.tsx` - nội dung thẻ `Áp dụng quy trình`.
- `tests/trial-workflow-tab-layout-contract.test.ts` - hợp đồng cho khung thẻ mới.
- `tests/trial-workflow-general-and-stage-tabs-contract.test.ts` - hợp đồng cho hai thẻ `Thông tin chung` và `Bốn chặng thử việc`.
- `tests/trial-workflow-task-and-gate-tabs-contract.test.ts` - hợp đồng cho hai thẻ `Việc cần làm` và `Điều kiện qua chặng`.
- `tests/trial-workflow-assignment-tab-contract.test.ts` - hợp đồng cho thẻ `Áp dụng quy trình`.

**Sửa:**
- `src/app/career-path/onboarding/setup/page.tsx` - bỏ truyền copy kiểu `3 bước`, giữ lại đầu trang và gắn workspace mới.
- `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx` - refactor toàn bộ shell từ bố cục dọc sang bố cục dạng thẻ.
- `src/components/onboarding-settings/TrialWorkflowWorkspaceHeader.tsx` - cập nhật thông điệp đầu trang cho đúng bố cục mới.
- `src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx` - giữ lại nhưng đổi vai trò thành dải số liệu đầu màn.
- `src/components/onboarding-settings/OnboardingRoleFilters.tsx` - cập nhật copy và điểm neo cho thẻ `Áp dụng quy trình`.
- `src/components/onboarding-settings/OnboardingRoleCard.tsx` - cập nhật copy để dùng trong thẻ `Áp dụng quy trình` thay vì khối dọc cũ.
- `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx` - đổi copy để phù hợp với thẻ `Bốn chặng thử việc` và `Việc cần làm`.
- `src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx` - đổi copy tiếng Việt hoàn toàn, giữ vai trò xem trước trong thẻ `Việc cần làm`.
- `tests/trial-workflow-setup-shell-contract.test.ts` - bỏ kỳ vọng `Bước 1/2/3`, thay bằng kỳ vọng `dải thẻ`.
- `tests/onboarding-settings-components-contract.test.ts` - bỏ kỳ vọng `admin rail` và `3 bước`, thay bằng kỳ vọng `dạng thẻ`.
- `docs/CODEMAP.md` - cập nhật entry point và mô tả mới cho màn thiết lập.

**Xóa sau khi refactor xong:**
- `src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx` - không còn dùng trong bố cục mới.
- `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx` - thay bằng bảng thiếu ở cuối thẻ.
- `src/components/onboarding-settings/TrialWorkflowStagePlannerSection.tsx` - không còn dùng sau khi chuyển sang tab.
- `src/components/onboarding-settings/TrialWorkflowTaskAuthoringSection.tsx` - không còn dùng sau khi chuyển sang tab.
- `src/components/onboarding-settings/TrialWorkflowAssignmentPublishSection.tsx` - không còn dùng sau khi chuyển sang tab.

### Task 1: Khóa hợp đồng cho bố cục dạng thẻ

**Files:**
- Create: `tests/trial-workflow-tab-layout-contract.test.ts`
- Modify: `tests/trial-workflow-setup-shell-contract.test.ts`
- Modify: `tests/onboarding-settings-components-contract.test.ts`

- [ ] **Step 1: Viết kiểm thử thất bại cho khung thẻ mới**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/onboarding/setup/page.tsx'),
  'utf8',
)
const workspaceSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx'),
  'utf8',
)

test('màn thiết lập dùng dải thẻ thay cho 3 khối dọc', () => {
  assert.equal(workspaceSource.includes('Thông tin chung'), true)
  assert.equal(workspaceSource.includes('Bốn chặng thử việc'), true)
  assert.equal(workspaceSource.includes('Việc cần làm'), true)
  assert.equal(workspaceSource.includes('Điều kiện qua chặng'), true)
  assert.equal(workspaceSource.includes('Áp dụng quy trình'), true)
  assert.equal(workspaceSource.includes('Thẻ đang mở'), true)
  assert.equal(workspaceSource.includes('Xem chỗ còn thiếu'), true)
  assert.equal(workspaceSource.includes('OnboardingSettingsAdminRail'), false)
  assert.equal(workspaceSource.includes('TrialWorkflowStagePlannerSection'), false)
  assert.equal(workspaceSource.includes('TrialWorkflowTaskAuthoringSection'), false)
  assert.equal(workspaceSource.includes('TrialWorkflowAssignmentPublishSection'), false)
})

test('page setup không còn nhấn mạnh copy 3 bước cũ', () => {
  assert.equal(pageSource.includes('Bước 1.'), false)
  assert.equal(pageSource.includes('Bước 2.'), false)
  assert.equal(pageSource.includes('Bước 3.'), false)
  assert.equal(pageSource.includes('Thiết lập quy trình thử việc'), true)
})
```

- [ ] **Step 2: Cập nhật contract hiện có cho đúng bố cục mới**

```ts
test('workspace header và component contract dùng ngôn ngữ dạng thẻ', () => {
  assert.match(headerSource, /Thiết lập quy trình thử việc/)
  assert.match(summarySource, /Phần đã xong|Chỗ còn thiếu|Sẵn sàng dùng/)
  assert.doesNotMatch(adminRailSource, /Hôm nay cần làm gì\?/) 
})
```

- [ ] **Step 3: Chạy kiểm thử để xác nhận đang lỗi**

Run: `npx tsx --test tests/trial-workflow-tab-layout-contract.test.ts tests/trial-workflow-setup-shell-contract.test.ts tests/onboarding-settings-components-contract.test.ts`

Expected: FAIL vì `TrialWorkflowSetupWorkspace.tsx` vẫn còn import `OnboardingSettingsAdminRail` và vẫn render ba section dọc.

- [ ] **Step 4: Commit checkpoint cho contract mới**

```bash
git add tests/trial-workflow-tab-layout-contract.test.ts tests/trial-workflow-setup-shell-contract.test.ts tests/onboarding-settings-components-contract.test.ts
git commit -m "test: lock tabbed trial workflow setup contracts"
```

### Task 2: Dựng khung thẻ chung và refactor shell của workspace

**Files:**
- Create: `src/components/onboarding-settings/TrialWorkflowTabBar.tsx`
- Create: `src/components/onboarding-settings/TrialWorkflowWorkspacePanel.tsx`
- Create: `src/components/onboarding-settings/TrialWorkflowMissingItemsTable.tsx`
- Create: `src/components/onboarding-settings/buildTrialWorkflowSetupViewModel.ts`
- Create: `src/components/onboarding-settings/TrialWorkflowGeneralInfoTab.tsx`
- Create: `src/components/onboarding-settings/TrialWorkflowStagesTab.tsx`
- Create: `src/components/onboarding-settings/TrialWorkflowTasksTab.tsx`
- Create: `src/components/onboarding-settings/TrialWorkflowGateConditionsTab.tsx`
- Create: `src/components/onboarding-settings/TrialWorkflowAssignmentsTab.tsx`
- Modify: `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx`
- Modify: `src/app/career-path/onboarding/setup/page.tsx`
- Modify: `src/components/onboarding-settings/TrialWorkflowWorkspaceHeader.tsx`

- [ ] **Step 1: Viết skeleton cho khung thẻ và view-model**

```tsx
// src/components/onboarding-settings/TrialWorkflowTabBar.tsx
export type TrialWorkflowTabKey = 'general' | 'stages' | 'tasks' | 'gates' | 'assignments'

export type TrialWorkflowTabItem = {
  key: TrialWorkflowTabKey
  label: string
  missingCount: number
}

export function TrialWorkflowTabBar({
  items,
  activeTab,
  onSelect,
}: {
  items: TrialWorkflowTabItem[]
  activeTab: TrialWorkflowTabKey
  onSelect: (tab: TrialWorkflowTabKey) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <button key={item.key} type="button" onClick={() => onSelect(item.key)}>
          {item.label} ({item.missingCount})
        </button>
      ))}
    </div>
  )
}
```

```ts
// src/components/onboarding-settings/buildTrialWorkflowSetupViewModel.ts
import type { OnboardingRoleSettings, OnboardingRoleSettingsValidationIssue } from '@/lib/career-path-types'
import type { TrialWorkflowTabItem, TrialWorkflowTabKey } from './TrialWorkflowTabBar'

export type TrialWorkflowMissingItem = {
  id: string
  label: string
  tab: TrialWorkflowTabKey
  actionLabel: string
}

export function buildTrialWorkflowSetupViewModel(input: {
  draft: OnboardingRoleSettings
  issues: OnboardingRoleSettingsValidationIssue[]
  readinessIssueCodes: string[]
  unmatchedEmployeeCount: number
  duplicatePositionCount: number
}) {
  const tabs: TrialWorkflowTabItem[] = [
    { key: 'general', label: 'Thông tin chung', missingCount: input.readinessIssueCodes.includes('missing_stage') ? 1 : 0 },
    { key: 'stages', label: 'Bốn chặng thử việc', missingCount: input.readinessIssueCodes.includes('missing_stage') ? 1 : 0 },
    { key: 'tasks', label: 'Việc cần làm', missingCount: input.readinessIssueCodes.includes('missing_task_list') ? 1 : 0 },
    { key: 'gates', label: 'Điều kiện qua chặng', missingCount: input.issues.length > 0 ? 1 : 0 },
    { key: 'assignments', label: 'Áp dụng quy trình', missingCount: input.unmatchedEmployeeCount + input.duplicatePositionCount },
  ]

  return {
    tabs,
    topMetrics: [
      { label: 'Phần đã xong', value: '2/5', tone: 'warning' as const },
      { label: 'Có thể sửa ngay', value: 'Có', tone: 'neutral' as const },
      { label: 'Chỗ còn thiếu', value: String(tabs.reduce((sum, tab) => sum + tab.missingCount, 0)), tone: 'danger' as const },
    ],
  }
}
```

- [ ] **Step 2: Refactor `TrialWorkflowSetupWorkspace` sang shell tab**

```tsx
const [activeTab, setActiveTab] = useState<TrialWorkflowTabKey>('general')
const viewModel = buildTrialWorkflowSetupViewModel({
  draft,
  issues,
  readinessIssueCodes: readinessIssues.map((issue) => issue.code),
  unmatchedEmployeeCount: unmatchedEmployees.length,
  duplicatePositionCount: duplicatePositionIds.length,
})

return (
  <div style={{ display: 'grid', gap: 16 }}>
    <section style={overviewStyle}>
      <div style={overviewTitleStyle}>Quy trình còn điểm cần thiết lập</div>
      <div style={overviewHelperStyle}>{saveStatusMessage}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" onClick={() => setActiveTab('gates')} style={secondaryButtonStyle}>Xem chỗ còn thiếu</button>
        <button type="button" onClick={handleSave} style={primarySmallButtonStyle}>Lưu bản nháp</button>
      </div>
    </section>

    <OnboardingSettingsSummaryBar metrics={viewModel.topMetrics.map((metric, index) => ({
      label: metric.label,
      value: Number.isNaN(Number(metric.value)) ? 0 : Number(metric.value),
      href: '#trial-workflow-active-tab',
      tone: metric.tone,
    }))} />

    <TrialWorkflowTabBar items={viewModel.tabs} activeTab={activeTab} onSelect={setActiveTab} />

    <TrialWorkflowWorkspacePanel id="trial-workflow-active-tab" title={activeTabLabelMap[activeTab]} helper={activeTabHelperMap[activeTab]}>
      {activeTab === 'general' ? <TrialWorkflowGeneralInfoTab /> : null}
      {activeTab === 'stages' ? <TrialWorkflowStagesTab /> : null}
      {activeTab === 'tasks' ? <TrialWorkflowTasksTab /> : null}
      {activeTab === 'gates' ? <TrialWorkflowGateConditionsTab /> : null}
      {activeTab === 'assignments' ? <TrialWorkflowAssignmentsTab /> : null}
    </TrialWorkflowWorkspacePanel>
  </div>
)
```

- [ ] **Step 3: Bỏ truyền copy kiểu 3 bước từ `page.tsx`**

```tsx
export default function TrialWorkflowSetupPage() {
  return (
    <AppShell navMode="full">
      <div style={{ padding: '20px 24px 96px', maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 20 }}>
        <TrialWorkflowWorkspaceHeader
          title="Thiết lập quy trình thử việc"
          subtitle="Dùng dải thẻ ngang để chốt khung chung, chặng, việc cần làm, điều kiện qua chặng và nơi áp dụng."
        />
        <TrialWorkflowSetupWorkspace />
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 4: Chạy lại contract shell**

Run: `npx tsx --test tests/trial-workflow-tab-layout-contract.test.ts tests/trial-workflow-setup-shell-contract.test.ts tests/onboarding-settings-components-contract.test.ts`

Expected: PASS cho contract shell; các contract nội dung chi tiết vẫn có thể chưa tồn tại hoặc chưa pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/career-path/onboarding/setup/page.tsx src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx src/components/onboarding-settings/TrialWorkflowWorkspaceHeader.tsx src/components/onboarding-settings/TrialWorkflowTabBar.tsx src/components/onboarding-settings/TrialWorkflowWorkspacePanel.tsx src/components/onboarding-settings/TrialWorkflowMissingItemsTable.tsx src/components/onboarding-settings/buildTrialWorkflowSetupViewModel.ts src/components/onboarding-settings/TrialWorkflowGeneralInfoTab.tsx src/components/onboarding-settings/TrialWorkflowStagesTab.tsx src/components/onboarding-settings/TrialWorkflowTasksTab.tsx src/components/onboarding-settings/TrialWorkflowGateConditionsTab.tsx src/components/onboarding-settings/TrialWorkflowAssignmentsTab.tsx
git commit -m "refactor: add tab shell for trial workflow setup"
```

### Task 3: Hoàn thiện thẻ `Thông tin chung` và `Bốn chặng thử việc`

**Files:**
- Create: `tests/trial-workflow-general-and-stage-tabs-contract.test.ts`
- Modify: `src/components/onboarding-settings/TrialWorkflowGeneralInfoTab.tsx`
- Modify: `src/components/onboarding-settings/TrialWorkflowStagesTab.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateStageEditor.tsx`
- Modify: `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx`

- [ ] **Step 1: Viết kiểm thử thất bại cho hai thẻ đầu**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const generalTabSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowGeneralInfoTab.tsx'), 'utf8')
const stagesTabSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowStagesTab.tsx'), 'utf8')

test('thẻ thông tin chung có bảng nền tảng và thao tác nhanh', () => {
  assert.equal(generalTabSource.includes('Mục cần thiết lập'), true)
  assert.equal(generalTabSource.includes('Giá trị hiện tại'), true)
  assert.equal(generalTabSource.includes('Sửa nhanh thời gian'), true)
  assert.equal(generalTabSource.includes('Thiết lập nguyên tắc chốt'), true)
})

test('thẻ bốn chặng dùng thư viện mẫu và trình sửa chặng', () => {
  assert.equal(stagesTabSource.includes('Bốn chặng thử việc'), true)
  assert.equal(stagesTabSource.includes('Thêm chặng'), true)
  assert.equal(stagesTabSource.includes('Đổi thứ tự'), true)
  assert.equal(stagesTabSource.includes('Xem việc trong chặng'), true)
})
```

- [ ] **Step 2: Cài nội dung cho thẻ `Thông tin chung`**

```tsx
export function TrialWorkflowGeneralInfoTab({
  rows,
  onJumpToMissing,
}: {
  rows: Array<{ label: string; value: string; status: 'Đã có' | 'Còn thiếu'; actionLabel: string }>
  onJumpToMissing: () => void
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button">Sửa nhanh thời gian</button>
        <button type="button">Sửa người theo dõi</button>
        <button type="button" onClick={onJumpToMissing}>Thiết lập nguyên tắc chốt</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Mục cần thiết lập</th>
            <th>Giá trị hiện tại</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.value}</td>
              <td>{row.status}</td>
              <td>{row.actionLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Cài nội dung cho thẻ `Bốn chặng thử việc` bằng dữ liệu template hiện có**

```tsx
export function TrialWorkflowStagesTab({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  stages,
  onRenameStage,
  onToggleStage,
}: {
  templates: OnboardingChecklistTemplate[]
  selectedTemplateId: string | null
  onSelectTemplate: (templateId: string | null) => void
  stages: OnboardingChecklistStage[]
  onRenameStage: (stageId: string, label: string) => void
  onToggleStage: (stageId: string) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button">Thêm chặng</button>
        <button type="button">Đổi thứ tự</button>
        <button type="button">Ẩn chặng</button>
        <button type="button">Xem việc trong chặng</button>
      </div>

      <OnboardingTemplateLibrarySection
        templates={templates}
        topicCountByTemplate={{}}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={onSelectTemplate}
      />

      <OnboardingTemplateStageEditor
        stages={stages}
        onRenameStage={onRenameStage}
        onToggleStage={onToggleStage}
      />
    </div>
  )
}
```

- [ ] **Step 4: Chạy kiểm thử cho hai thẻ đầu**

Run: `npx tsx --test tests/trial-workflow-general-and-stage-tabs-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/trial-workflow-general-and-stage-tabs-contract.test.ts src/components/onboarding-settings/TrialWorkflowGeneralInfoTab.tsx src/components/onboarding-settings/TrialWorkflowStagesTab.tsx src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx src/components/onboarding-settings/OnboardingTemplateStageEditor.tsx src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx
git commit -m "feat: add general info and stage tabs"
```

### Task 4: Hoàn thiện thẻ `Việc cần làm` và `Điều kiện qua chặng`

**Files:**
- Create: `tests/trial-workflow-task-and-gate-tabs-contract.test.ts`
- Modify: `src/components/onboarding-settings/TrialWorkflowTasksTab.tsx`
- Modify: `src/components/onboarding-settings/TrialWorkflowGateConditionsTab.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx`
- Modify: `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx`

- [ ] **Step 1: Viết kiểm thử thất bại cho hai thẻ giữa**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const tasksTabSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowTasksTab.tsx'), 'utf8')
const gatesTabSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowGateConditionsTab.tsx'), 'utf8')

test('thẻ việc cần làm có chọn chặng và bảng việc', () => {
  assert.equal(tasksTabSource.includes('Đang chỉnh việc của chặng'), true)
  assert.equal(tasksTabSource.includes('Thêm việc mới'), true)
  assert.equal(tasksTabSource.includes('Nhân bản việc'), true)
  assert.equal(tasksTabSource.includes('Đánh dấu bắt buộc'), true)
})

test('thẻ điều kiện qua chặng có bảng điều kiện và điểm thiếu', () => {
  assert.equal(gatesTabSource.includes('Điều kiện qua chặng'), true)
  assert.equal(gatesTabSource.includes('Sửa điều kiện'), true)
  assert.equal(gatesTabSource.includes('Chọn người duyệt'), true)
  assert.equal(gatesTabSource.includes('Các chỗ thiếu cần xử lý tiếp theo'), true)
})
```

- [ ] **Step 2: Cài nội dung cho thẻ `Việc cần làm`**

```tsx
export function TrialWorkflowTasksTab({
  template,
  stages,
  topics,
  items,
  onAddItem,
  onUpdateItem,
}: {
  template: OnboardingChecklistTemplate | null
  stages: OnboardingChecklistStage[]
  topics: OnboardingContentTopic[]
  items: OnboardingChecklistItemTemplate[]
  onAddItem: () => void
  onUpdateItem: (itemId: string, patch: Partial<OnboardingChecklistItemTemplate>) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button">Thêm việc mới</button>
        <button type="button">Nhân bản việc</button>
        <button type="button">Chuyển sang chặng khác</button>
        <button type="button">Đánh dấu bắt buộc</button>
      </div>

      <div>Đang chỉnh việc của chặng: {stages[0]?.label ?? 'Chưa có chặng'}</div>
      <OnboardingTemplateItemEditor items={items} topics={topics} stages={stages} onAddItem={onAddItem} onUpdateItem={onUpdateItem} />
      <OnboardingTemplatePreviewSection template={template} />
    </div>
  )
}
```

- [ ] **Step 3: Cài nội dung cho thẻ `Điều kiện qua chặng`**

```tsx
export function TrialWorkflowGateConditionsTab({
  report,
  missingRows,
  onRefresh,
  onPublish,
  publishDisabled,
}: {
  report: ReturnType<typeof validateOnboardingTemplateForPublishReport> | null
  missingRows: Array<{ label: string; actionLabel: string }>
  onRefresh: () => void
  onPublish: () => void
  publishDisabled: boolean
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button">Sửa điều kiện</button>
        <button type="button">Chọn người duyệt</button>
        <button type="button">Bỏ điều kiện</button>
      </div>

      <OnboardingPublishValidationPanel
        report={report}
        onRefresh={onRefresh}
        onPublish={onPublish}
        publishDisabled={publishDisabled}
      />

      <TrialWorkflowMissingItemsTable
        title="Các chỗ thiếu cần xử lý tiếp theo"
        rows={missingRows.map((row) => ({ id: row.label, label: row.label, tabLabel: 'Điều kiện qua chặng', actionLabel: row.actionLabel }))}
      />
    </div>
  )
}
```

- [ ] **Step 4: Chạy kiểm thử cho hai thẻ giữa**

Run: `npx tsx --test tests/trial-workflow-task-and-gate-tabs-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/trial-workflow-task-and-gate-tabs-contract.test.ts src/components/onboarding-settings/TrialWorkflowTasksTab.tsx src/components/onboarding-settings/TrialWorkflowGateConditionsTab.tsx src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx
git commit -m "feat: add tasks and gate tabs"
```

### Task 5: Hoàn thiện thẻ `Áp dụng quy trình`, dọn khối cũ, cập nhật tài liệu

**Files:**
- Create: `tests/trial-workflow-assignment-tab-contract.test.ts`
- Modify: `src/components/onboarding-settings/TrialWorkflowAssignmentsTab.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleFilters.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleCard.tsx`
- Modify: `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx`
- Modify: `docs/CODEMAP.md`
- Delete: `src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx`
- Delete: `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx`
- Delete: `src/components/onboarding-settings/TrialWorkflowStagePlannerSection.tsx`
- Delete: `src/components/onboarding-settings/TrialWorkflowTaskAuthoringSection.tsx`
- Delete: `src/components/onboarding-settings/TrialWorkflowAssignmentPublishSection.tsx`

- [ ] **Step 1: Viết kiểm thử thất bại cho thẻ `Áp dụng quy trình`**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const assignmentsTabSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowAssignmentsTab.tsx'), 'utf8')

test('thẻ áp dụng quy trình có bảng phạm vi và danh sách thiếu', () => {
  assert.equal(assignmentsTabSource.includes('Nhóm áp dụng'), true)
  assert.equal(assignmentsTabSource.includes('Cửa hàng'), true)
  assert.equal(assignmentsTabSource.includes('Vị trí'), true)
  assert.equal(assignmentsTabSource.includes('Thêm vị trí'), true)
  assert.equal(assignmentsTabSource.includes('Sửa phạm vi áp dụng'), true)
  assert.equal(assignmentsTabSource.includes('Các chỗ áp dụng còn thiếu'), true)
})
```

- [ ] **Step 2: Cài nội dung cho thẻ `Áp dụng quy trình` và bỏ khối admin rail cũ**

```tsx
export function TrialWorkflowAssignmentsTab({
  roleFilter,
  roleSearch,
  onRoleFilterChange,
  onRoleSearchChange,
  roles,
  reports,
  auditLog,
  missingRows,
}: {
  roleFilter: OnboardingRoleFilterKey
  roleSearch: string
  onRoleFilterChange: (next: OnboardingRoleFilterKey) => void
  onRoleSearchChange: (next: string) => void
  roles: React.ReactNode
  reports: React.ReactNode
  auditLog: React.ReactNode
  missingRows: Array<{ id: string; label: string; actionLabel: string }>
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button">Thêm vị trí</button>
        <button type="button">Sửa phạm vi áp dụng</button>
        <button type="button">Ngừng áp dụng</button>
        <button type="button">Đi tới chỗ thiếu</button>
      </div>

      <OnboardingRoleFilters
        activeFilter={roleFilter}
        searchValue={roleSearch}
        onFilterChange={onRoleFilterChange}
        onSearchChange={onRoleSearchChange}
      />

      <div style={{ display: 'grid', gap: 10 }}>{roles}</div>
      {reports}
      {auditLog}

      <TrialWorkflowMissingItemsTable
        title="Các chỗ áp dụng còn thiếu"
        rows={missingRows.map((row) => ({ id: row.id, label: row.label, tabLabel: 'Áp dụng quy trình', actionLabel: row.actionLabel }))}
      />
    </div>
  )
}
```

- [ ] **Step 3: Xóa các wrapper dọc cũ và cập nhật CODEMAP**

```md
### Thiết lập quy trình thử việc dạng thẻ
- Mô tả: màn `/career-path/onboarding/setup` dùng dải thẻ ngang gồm `Thông tin chung`, `Bốn chặng thử việc`, `Việc cần làm`, `Điều kiện qua chặng`, `Áp dụng quy trình`.
- File chính: `src/app/career-path/onboarding/setup/page.tsx`, `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx`, `src/components/onboarding-settings/TrialWorkflowTabBar.tsx`, `src/components/onboarding-settings/TrialWorkflowGeneralInfoTab.tsx`, `src/components/onboarding-settings/TrialWorkflowStagesTab.tsx`, `src/components/onboarding-settings/TrialWorkflowTasksTab.tsx`, `src/components/onboarding-settings/TrialWorkflowGateConditionsTab.tsx`, `src/components/onboarding-settings/TrialWorkflowAssignmentsTab.tsx`
```

- [ ] **Step 4: Chạy kiểm thử đầy đủ cho cụm trial workflow setup**

Run: `npx tsx --test tests/trial-workflow-tab-layout-contract.test.ts tests/trial-workflow-general-and-stage-tabs-contract.test.ts tests/trial-workflow-task-and-gate-tabs-contract.test.ts tests/trial-workflow-assignment-tab-contract.test.ts tests/trial-workflow-setup-shell-contract.test.ts tests/onboarding-settings-components-contract.test.ts tests/trial-workflow-navigation-contract.test.ts tests/trial-workflow-operations-copy-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Chạy ESLint cho các file vừa đổi**

Run: `npx eslint src/app/career-path/onboarding/setup/page.tsx src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx src/components/onboarding-settings/TrialWorkflowTabBar.tsx src/components/onboarding-settings/TrialWorkflowWorkspacePanel.tsx src/components/onboarding-settings/TrialWorkflowMissingItemsTable.tsx src/components/onboarding-settings/TrialWorkflowGeneralInfoTab.tsx src/components/onboarding-settings/TrialWorkflowStagesTab.tsx src/components/onboarding-settings/TrialWorkflowTasksTab.tsx src/components/onboarding-settings/TrialWorkflowGateConditionsTab.tsx src/components/onboarding-settings/TrialWorkflowAssignmentsTab.tsx tests/trial-workflow-tab-layout-contract.test.ts tests/trial-workflow-general-and-stage-tabs-contract.test.ts tests/trial-workflow-task-and-gate-tabs-contract.test.ts tests/trial-workflow-assignment-tab-contract.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding-settings/TrialWorkflowAssignmentsTab.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx docs/CODEMAP.md tests/trial-workflow-assignment-tab-contract.test.ts
git rm src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/TrialWorkflowStagePlannerSection.tsx src/components/onboarding-settings/TrialWorkflowTaskAuthoringSection.tsx src/components/onboarding-settings/TrialWorkflowAssignmentPublishSection.tsx
git commit -m "refactor: finish tabbed trial workflow setup workspace"
```

## Self-review

- **Spec coverage:** Plan này phủ đủ 5 thẻ của màn thiết lập, bỏ bố cục dọc cũ, giữ bảng làm trung tâm, thêm thao tác nhanh và danh sách thiếu ở cuối thẻ.
- **Placeholder scan:** Không để `TODO`, `TBD`, hay bước kiểu “làm phần còn lại tương tự”. Mỗi task đã có file, kiểm thử, lệnh chạy, và commit riêng.
- **Type consistency:** `TrialWorkflowTabKey` thống nhất qua tab bar, workspace, view-model, và bảng thiếu; không đổi tên giữa các task.

## Ghi chú thực thi

- Plan này chỉ refactor `màn thiết lập` theo spec ngày `2026-06-08`.
- Không mở rộng sang đổi mô hình dữ liệu sâu cho `người duyệt qua chặng`; chỉ hiển thị và gom chỗ thiếu trong phạm vi dữ liệu hiện có.
- Nếu trong lúc làm phát hiện dữ liệu stage hiện tại không đủ để biểu diễn một phần của thẻ, dừng lại và viết spec bổ sung trước khi thêm trường mới vào model.
