# Theo dõi thử việc bằng bảng danh sách nhân sự Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor màn `/career-path/onboarding` từ luồng `timeline theo ngày + checklist` sang màn `bảng danh sách nhân sự` có `khung chi tiết 4 chặng`, để HR quét nhanh ai cần xử lý và mở đúng hồ sơ để xử lý tiếp.

**Architecture:** Giữ route và dữ liệu onboarding hiện có trong `OnboardingOperationsService`, nhưng đổi view-model từ `block ngày đầu / follow-up / ready` sang `trạng thái chính + thiếu sót chính + mốc kế tiếp + chặng hiện tại`. Tách thanh tóm tắt, bảng nhân sự, trạng thái rỗng, panel chi tiết, tab chặng, và bảng việc trong chặng thành các component nhỏ; giữ `OnboardingStageGatePanel` làm khối chốt cuối kỳ trong chặng `Đánh giá và chốt kết quả`.

**Tech Stack:** Next.js App Router, React client components, TypeScript, dữ liệu onboarding từ `src/lib/services/onboarding-operations-service.ts` và `career-path-service`, kiểm thử hợp đồng bằng `tsx --test`, kiểm tra mã nguồn bằng ESLint.

---

## Cấu trúc file dự kiến

**Tạo mới:**
- `src/components/onboarding-operations/TrialTrackingSummaryBar.tsx` - thanh tóm tắt ngắn đầu màn với số lượng nhân sự mới, số cần xử lý ngay, số đúng tiến độ, và lối tắt sang màn thiết lập.
- `src/components/onboarding-operations/TrialTrackingEmployeeTable.tsx` - bảng trung tâm hiển thị nhân sự, cửa hàng, vị trí, chặng hiện tại, mốc kế tiếp, trạng thái, thiếu sót chính, và thao tác chính.
- `src/components/onboarding-operations/TrialTrackingEmptyState.tsx` - trạng thái rỗng cho `chưa có nhân sự`, `không khớp bộ lọc`, và `chưa thể theo dõi vì thiếu thiết lập`.
- `src/components/onboarding-operations/TrialTrackingDetailPanel.tsx` - khung chi tiết một nhân sự, có đầu khung, tab 4 chặng, bảng việc, ghi chú, và lịch sử.
- `src/components/onboarding-operations/TrialTrackingStageTabs.tsx` - dải tab 4 chặng trong khung chi tiết.
- `src/components/onboarding-operations/TrialTrackingStageTaskTable.tsx` - bảng việc của chặng đang mở.
- `tests/trial-workflow-tracking-table-layout-contract.test.ts` - contract cho shell `bảng nhân sự làm trung tâm`.
- `tests/trial-workflow-tracking-detail-panel-contract.test.ts` - contract cho `khung chi tiết 4 chặng`.
- `tests/trial-workflow-tracking-service-contract.test.ts` - contract cho service sau khi đổi kiểu dữ liệu tracking.

**Sửa:**
- `src/app/career-path/onboarding/page.tsx` - thay shell cũ bằng summary bar, bảng nhân sự, empty state, panel chi tiết, và bộ lọc URL mới.
- `src/app/career-path/onboarding/overview/page.tsx` - cập nhật CTA, copy, và filter deep-link cho trạng thái mới.
- `src/lib/services/onboarding-operations-service.ts` - đổi filter, đổi view-model row/detail, thêm dữ liệu 4 chặng, và giữ nguyên các thao tác cập nhật checklist/gate.
- `src/components/onboarding-operations/OnboardingStageGatePanel.tsx` - cập nhật copy và cách đặt khối này bên trong chặng `Đánh giá và chốt kết quả`.
- `tests/onboarding-overview-contract.test.ts` - cập nhật deep-link và copy overview cho filter mới.
- `tests/onboarding-operations-service-overview.test.ts` - cập nhật contract overview/service cho field mới.
- `docs/CODEMAP.md` - cập nhật entry point cho màn tracking mới.

**Xóa sau khi refactor xong:**
- `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- `src/components/onboarding-operations/OnboardingOpsTimeline.tsx`
- `src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx`
- `src/components/onboarding-operations/OnboardingDayJourneySummary.tsx`
- `tests/onboarding-operations-task-first-contract.test.ts`
- `tests/onboarding-operations-day-journey-contract.test.ts`

### Task 1: Khóa contract cho bố cục bảng nhân sự và khung chi tiết 4 chặng

**Files:**
- Create: `tests/trial-workflow-tracking-table-layout-contract.test.ts`
- Create: `tests/trial-workflow-tracking-detail-panel-contract.test.ts`
- Create: `tests/trial-workflow-tracking-service-contract.test.ts`
- Modify: `tests/onboarding-overview-contract.test.ts`
- Modify: `tests/onboarding-operations-service-overview.test.ts`

- [ ] **Step 1: Viết kiểm thử thất bại cho shell `bảng nhân sự làm trung tâm`**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/onboarding/page.tsx'),
  'utf8',
)

test('màn tracking dùng summary bar, bảng nhân sự, và panel chi tiết mới', () => {
  assert.match(pageSource, /TrialTrackingSummaryBar/)
  assert.match(pageSource, /TrialTrackingEmployeeTable/)
  assert.match(pageSource, /TrialTrackingDetailPanel/)
  assert.doesNotMatch(pageSource, /OnboardingOpsTimeline/)
  assert.doesNotMatch(pageSource, /UpcomingOnboardingList/)
  assert.doesNotMatch(pageSource, /OperationsChecklistDetail/)
})

test('màn tracking đọc filter URL theo trạng thái mới', () => {
  assert.match(pageSource, /searchParams\.get\('filter'\)/)
  assert.match(pageSource, /'urgent'/)
  assert.match(pageSource, /'due_soon'/)
  assert.match(pageSource, /'on_track'/)
  assert.match(pageSource, /'blocked_start'/)
  assert.match(pageSource, /'completed'/)
})
```

- [ ] **Step 2: Viết kiểm thử thất bại cho panel 4 chặng và contract service mới**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const detailPath = resolve(process.cwd(), 'src/components/onboarding-operations/TrialTrackingDetailPanel.tsx')
const serviceSource = readFileSync(
  resolve(process.cwd(), 'src/lib/services/onboarding-operations-service.ts'),
  'utf8',
)
const detailSource = existsSync(detailPath) ? readFileSync(detailPath, 'utf8') : ''

test('khung chi tiết bám đúng 4 chặng thử việc', () => {
  assert.match(detailSource, /Chốt nhận việc và chuẩn bị vào làm/)
  assert.match(detailSource, /Ngày đầu nhận việc/)
  assert.match(detailSource, /Làm quen và kèm cặp/)
  assert.match(detailSource, /Đánh giá và chốt kết quả/)
  assert.match(detailSource, /TrialTrackingStageTaskTable/)
})

test('service source định nghĩa filter và field tracking mới', () => {
  assert.match(serviceSource, /type OnboardingOpsPriorityFilter = 'all' \| 'urgent' \| 'due_soon' \| 'on_track' \| 'blocked_start' \| 'completed'/)
  assert.match(serviceSource, /type OnboardingOpsStageKey = 'offer_confirmed' \| 'day_one' \| 'early_ramp' \| 'final_review'/)
  assert.match(serviceSource, /currentStageLabel/)
  assert.match(serviceSource, /nextMilestoneLabel/)
  assert.match(serviceSource, /primaryMissingLabel/)
  assert.match(serviceSource, /statusLabel/)
})
```

- [ ] **Step 3: Cập nhật contract overview hiện có theo deep-link và copy mới**

```ts
test('overview page deep-link sang tracking với filter mới', () => {
  assert.match(overviewPageSource, /\/career-path\/onboarding\?filter=all/)
  assert.match(overviewPageSource, /\/career-path\/onboarding\?filter=urgent/)
  assert.match(overviewPageSource, /Bảng nhân sự thử việc/)
  assert.match(overviewPageSource, /Mở thiết lập quy trình thử việc/)
})

test('service overview vẫn expose summary nhưng dùng tên field mới cho row', () => {
  assert.match(serviceSource, /filters:/)
  assert.match(serviceSource, /stats:/)
  assert.match(serviceSource, /statusLabel/)
  assert.match(serviceSource, /primaryActionLabel/)
})
```

- [ ] **Step 4: Chạy contract để xác nhận đang lỗi**

Run: `npx tsx --test tests/trial-workflow-tracking-table-layout-contract.test.ts tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-service-overview.test.ts`

Expected: FAIL vì `page.tsx` vẫn import `OnboardingOpsTimeline`, `UpcomingOnboardingList`, `OperationsChecklistDetail`; file `TrialTrackingDetailPanel.tsx` chưa tồn tại; service vẫn còn filter `block_day_one | need_follow_up | ready`.

- [ ] **Step 5: Commit checkpoint cho contract mới**

```bash
git add tests/trial-workflow-tracking-table-layout-contract.test.ts tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-service-overview.test.ts
git commit -m 'test: lock employee-table trial tracking contracts'
```

### Task 2: Đổi `OnboardingOperationsService` sang view-model tracking theo 4 chặng

**Files:**
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `tests/trial-workflow-tracking-service-contract.test.ts`
- Modify: `tests/onboarding-operations-service-overview.test.ts`

- [ ] **Step 1: Thêm kiểu dữ liệu và hằng số mới cho row, detail, và chặng**

```ts
export type OnboardingOpsPriorityFilter = 'all' | 'urgent' | 'due_soon' | 'on_track' | 'blocked_start' | 'completed'
export type OnboardingOpsStageKey = 'offer_confirmed' | 'day_one' | 'early_ramp' | 'final_review'

export interface OnboardingOpsStageTaskRow {
  id: string
  title: string
  ownerLabel: string
  dueLabel: string
  expectedResultLabel: string
  statusLabel: string
  actionLabel: string
  isBlocked: boolean
  isDone: boolean
}

export interface OnboardingOpsEmployeeStageDetail {
  key: OnboardingOpsStageKey
  label: string
  statusLabel: 'Đã xong' | 'Đang làm' | 'Đang nghẽn' | 'Chưa bắt đầu'
  taskRows: OnboardingOpsStageTaskRow[]
  blockers: string[]
  latestNote: string | null
}

export interface OnboardingOpsListRow {
  employeeId: string
  employeeName: string
  storeId: string
  storeLabel: string
  roleLabel: string
  hireDate: string
  currentStageKey: OnboardingOpsStageKey | null
  currentStageLabel: string
  nextMilestoneLabel: string
  primaryMissingLabel: string | null
  statusKey: Exclude<OnboardingOpsPriorityFilter, 'all'>
  statusLabel: 'Cần xử lý ngay' | 'Sắp tới hạn' | 'Đang đúng tiến độ' | 'Chưa thể bắt đầu' | 'Đã chốt kết quả'
  primaryActionLabel: string
  tone: 'block' | 'attention' | 'ready'
}
```

- [ ] **Step 2: Viết helper dựng trạng thái, chặng hiện tại, và bảng việc theo 4 chặng**

```ts
const STAGE_ORDER: OnboardingOpsStageKey[] = ['offer_confirmed', 'day_one', 'early_ramp', 'final_review']

const STAGE_LABELS: Record<OnboardingOpsStageKey, string> = {
  offer_confirmed: 'Chốt nhận việc và chuẩn bị vào làm',
  day_one: 'Ngày đầu nhận việc',
  early_ramp: 'Làm quen và kèm cặp',
  final_review: 'Đánh giá và chốt kết quả',
}

function getStatusMeta(input: {
  isUnmatched: boolean
  missingLabels: string[]
  followUpLevel: OnboardingOpsFollowUpLevel | null
  gateView: OnboardingStageGateView | null
}) {
  if (input.isUnmatched) return { statusKey: 'blocked_start' as const, statusLabel: 'Chưa thể bắt đầu', tone: 'block' as const }
  if (input.missingLabels.length > 0 && input.missingLabels[0]?.includes('Chưa')) {
    return { statusKey: 'urgent' as const, statusLabel: 'Cần xử lý ngay', tone: 'block' as const }
  }
  if (input.followUpLevel === 'same_day' || input.followUpLevel === 'next_day') {
    return { statusKey: 'due_soon' as const, statusLabel: 'Sắp tới hạn', tone: 'attention' as const }
  }
  if (input.gateView?.status === 'da_qua_gate') {
    return { statusKey: 'completed' as const, statusLabel: 'Đã chốt kết quả', tone: 'ready' as const }
  }
  return { statusKey: 'on_track' as const, statusLabel: 'Đang đúng tiến độ', tone: 'ready' as const }
}

function matchesFilter(row: OnboardingOpsListRow, activeFilter: OnboardingOpsPriorityFilter) {
  return activeFilter === 'all' ? true : row.statusKey === activeFilter
}
```

- [ ] **Step 3: Dựng lại `getWorkspaceOverview` và `getEmployeeDetail` theo field mới**

```ts
const statusMeta = getStatusMeta({
  isUnmatched: unmatchedState.isUnmatched,
  missingLabels: rowSummary.missingLabels,
  followUpLevel: employeeProgress?.followUpLevel ?? null,
  gateView,
})

return {
  employeeId: employee.id,
  employeeName: employee.full_name,
  storeId: employee.store_id,
  storeLabel: getStoreLabel(employee.store_id),
  roleLabel: getConfiguredRoleLabel(employee, onboardingPlan),
  hireDate: employee.hire_date,
  currentStageKey,
  currentStageLabel: currentStageKey ? STAGE_LABELS[currentStageKey] : 'Chưa thể bắt đầu',
  nextMilestoneLabel,
  primaryMissingLabel: rowSummary.missingLabels[0] ?? unmatchedState.unmatchedReason,
  statusKey: statusMeta.statusKey,
  statusLabel: statusMeta.statusLabel,
  primaryActionLabel,
  tone: statusMeta.tone,
}
```

```ts
return {
  employeeId: employee.id,
  employeeName: employee.full_name,
  storeLabel: getStoreLabel(employee.store_id),
  roleLabel,
  hireDate: employee.hire_date,
  currentStageKey,
  currentStageLabel,
  nextMilestoneLabel,
  primaryMissingLabel,
  statusKey: statusMeta.statusKey,
  statusLabel: statusMeta.statusLabel,
  quickNote,
  stages: buildEmployeeStages({ employee, onboardingPlan, checklist, progress, runtimeDays, gateView, evaluationTimelineView, selfReviewStageView }),
  gateView,
  gateRetryItems,
  history: progress?.history ?? [],
}
```

- [ ] **Step 4: Chạy kiểm thử service để xác nhận contract mới pass**

Run: `npx tsx --test tests/trial-workflow-tracking-service-contract.test.ts tests/onboarding-operations-service-overview.test.ts`

Expected: PASS, và source service có đủ `OnboardingOpsStageKey`, `statusLabel`, `currentStageLabel`, `nextMilestoneLabel`, `primaryMissingLabel`, `primaryActionLabel`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/onboarding-operations-service.ts tests/trial-workflow-tracking-service-contract.test.ts tests/onboarding-operations-service-overview.test.ts
git commit -m 'refactor: rebuild onboarding operations service for trial tracking'
```

### Task 3: Dựng shell màn mới với summary bar, bảng nhân sự, và trạng thái rỗng

**Files:**
- Create: `src/components/onboarding-operations/TrialTrackingSummaryBar.tsx`
- Create: `src/components/onboarding-operations/TrialTrackingEmployeeTable.tsx`
- Create: `src/components/onboarding-operations/TrialTrackingEmptyState.tsx`
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `tests/trial-workflow-tracking-table-layout-contract.test.ts`

- [ ] **Step 1: Tạo thanh tóm tắt và trạng thái rỗng cho màn tracking**

```tsx
import Link from 'next/link'
import type { OnboardingOpsWorkspaceOverview } from '@/lib/services/onboarding-operations-service'

export function TrialTrackingSummaryBar({
  overview,
}: {
  overview: OnboardingOpsWorkspaceOverview
}) {
  const urgentCount = overview.allRows.filter((row) => row.statusKey === 'urgent').length
  const onTrackCount = overview.allRows.filter((row) => row.statusKey === 'on_track').length

  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      <SummaryCell label='Nhân sự mới' value={overview.allRows.length} />
      <SummaryCell label='Cần xử lý ngay' value={urgentCount} />
      <SummaryCell label='Đang đúng tiến độ' value={onTrackCount} />
      <Link href='/career-path/onboarding/setup' style={{ textDecoration: 'none' }}>Mở thiết lập quy trình thử việc</Link>
    </div>
  )
}
```

```tsx
import Link from 'next/link'

export function TrialTrackingEmptyState({
  variant,
}: {
  variant: 'no_employees' | 'no_results' | 'missing_setup'
}) {
  if (variant === 'missing_setup') {
    return <Link href='/career-path/onboarding/setup'>Đi tới thiết lập quy trình thử việc</Link>
  }

  return <div>{variant === 'no_employees' ? 'Chưa có nhân sự nào' : 'Không có ai trong bộ lọc này'}</div>
}
```

- [ ] **Step 2: Tạo bảng nhân sự và thay shell cũ trong `page.tsx`**

```tsx
export function TrialTrackingEmployeeTable({
  rows,
  filters,
  activeFilter,
  onChangeFilter,
  selectedEmployeeId,
  onSelect,
}: {
  rows: OnboardingOpsListRow[]
  filters: OnboardingOpsQuickFilter[]
  activeFilter: OnboardingOpsPriorityFilter
  onChangeFilter: (filter: OnboardingOpsPriorityFilter) => void
  selectedEmployeeId: string | null
  onSelect: (employeeId: string) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map((filter) => (
          <button key={filter.key} type='button' onClick={() => onChangeFilter(filter.key)}>{filter.label}</button>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Nhân sự</th>
            <th>Cửa hàng</th>
            <th>Vị trí</th>
            <th>Chặng hiện tại</th>
            <th>Mốc cần làm tiếp</th>
            <th>Tình trạng</th>
            <th>Thiếu gì</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employeeId} data-selected={row.employeeId === selectedEmployeeId}>
              <td>{row.employeeName}</td>
              <td>{row.storeLabel}</td>
              <td>{row.roleLabel}</td>
              <td>{row.currentStageLabel}</td>
              <td>{row.nextMilestoneLabel}</td>
              <td>{row.statusLabel}</td>
              <td>{row.primaryMissingLabel ?? 'Đã đủ nền tảng'}</td>
              <td><button type='button' onClick={() => onSelect(row.employeeId)}>{row.primaryActionLabel}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

```tsx
const allowedFilters: OnboardingOpsPriorityFilter[] = ['all', 'urgent', 'due_soon', 'on_track', 'blocked_start', 'completed']

return (
  <AppShell navMode='full'>
    <div style={{ display: 'grid', gap: 16 }}>
      <TrialTrackingSummaryBar overview={overview} />
      {overview.allRows.length === 0 ? (
        <TrialTrackingEmptyState variant='no_employees' />
      ) : rows.length === 0 ? (
        <TrialTrackingEmptyState variant='no_results' />
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.5fr) minmax(360px, 0.9fr)' }}>
          <TrialTrackingEmployeeTable
            rows={rows}
            filters={overview.filters}
            activeFilter={overview.activeFilter}
            onChangeFilter={setActiveFilter}
            selectedEmployeeId={activeEmployeeId}
            onSelect={setSelectedEmployeeId}
          />
          <TrialTrackingDetailPanel detail={detail} />
        </div>
      )}
    </div>
  </AppShell>
)
```

- [ ] **Step 3: Chạy contract shell để xác nhận bố cục mới pass**

Run: `npx tsx --test tests/trial-workflow-tracking-table-layout-contract.test.ts tests/onboarding-overview-contract.test.ts`

Expected: PASS, và source `page.tsx` không còn `OnboardingOpsTimeline`, `UpcomingOnboardingList`, `OperationsChecklistDetail`.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding-operations/TrialTrackingSummaryBar.tsx src/components/onboarding-operations/TrialTrackingEmployeeTable.tsx src/components/onboarding-operations/TrialTrackingEmptyState.tsx src/app/career-path/onboarding/page.tsx tests/trial-workflow-tracking-table-layout-contract.test.ts tests/onboarding-overview-contract.test.ts
git commit -m 'refactor: switch onboarding page to employee table shell'
```

### Task 4: Dựng khung chi tiết 4 chặng và nối các hành động xử lý

**Files:**
- Create: `src/components/onboarding-operations/TrialTrackingDetailPanel.tsx`
- Create: `src/components/onboarding-operations/TrialTrackingStageTabs.tsx`
- Create: `src/components/onboarding-operations/TrialTrackingStageTaskTable.tsx`
- Modify: `src/components/onboarding-operations/OnboardingStageGatePanel.tsx`
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `tests/trial-workflow-tracking-detail-panel-contract.test.ts`

- [ ] **Step 1: Tạo tab 4 chặng và bảng việc của chặng đang mở**

```tsx
export function TrialTrackingStageTabs({
  stages,
  activeStageKey,
  onSelect,
}: {
  stages: OnboardingOpsEmployeeStageDetail[]
  activeStageKey: OnboardingOpsStageKey
  onSelect: (stageKey: OnboardingOpsStageKey) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {stages.map((stage) => (
        <button key={stage.key} type='button' onClick={() => onSelect(stage.key)}>
          {stage.label} • {stage.statusLabel}
        </button>
      ))}
    </div>
  )
}
```

```tsx
export function TrialTrackingStageTaskTable({
  rows,
}: {
  rows: OnboardingOpsStageTaskRow[]
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Việc cần làm</th>
          <th>Người phụ trách</th>
          <th>Hạn hoàn tất</th>
          <th>Kết quả cần có</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.title}</td>
            <td>{row.ownerLabel}</td>
            <td>{row.dueLabel}</td>
            <td>{row.expectedResultLabel}</td>
            <td>{row.statusLabel}</td>
            <td>{row.actionLabel}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 2: Dựng `TrialTrackingDetailPanel` và gắn `OnboardingStageGatePanel` vào chặng cuối**

```tsx
const defaultStageKey = detail?.currentStageKey ?? 'offer_confirmed'
const [activeStageKey, setActiveStageKey] = useState<OnboardingOpsStageKey>(defaultStageKey)
const activeStage = detail?.stages.find((stage) => stage.key === activeStageKey) ?? detail?.stages[0] ?? null

return !detail ? (
  <div>Chọn 1 nhân sự để xem hành trình onboarding</div>
) : (
  <div style={{ display: 'grid', gap: 16 }}>
    <div>
      <div>{detail.employeeName}</div>
      <div>{detail.storeLabel} • {detail.roleLabel}</div>
      <div>{detail.currentStageLabel} • {detail.statusLabel}</div>
    </div>

    <TrialTrackingStageTabs
      stages={detail.stages}
      activeStageKey={activeStage.key}
      onSelect={setActiveStageKey}
    />

    <TrialTrackingStageTaskTable rows={activeStage.taskRows} />

    <div>Đang vướng gì: {activeStage.blockers[0] ?? 'Không có vướng mắc chính'}</div>
    <div>Ghi chú gần nhất: {activeStage.latestNote ?? detail.quickNote}</div>
    <div>Lịch sử xử lý: {detail.history.length} mục</div>

    {activeStage.key === 'final_review' ? (
      <OnboardingStageGatePanel
        detail={detail}
        viewerRole={viewerRole}
        onProposeGate={onProposeGate}
        onApproveGate={onApproveGate}
        onRejectGate={onRejectGate}
      />
    ) : null}
  </div>
)
```

- [ ] **Step 3: Nối các hành động xử lý và copy chặng cuối trong `page.tsx` cùng `OnboardingStageGatePanel.tsx`**

```ts
const handleProposeGate = (employeeId: string, buddyNote: string) => {
  OnboardingOperationsService.proposeStageGate(employeeId, buddyNote)
  refresh()
}

const handleApproveGate = (employeeId: string, managerNote: string) => {
  OnboardingOperationsService.approveStageGate(employeeId, managerNote)
  refresh()
}

const handleRejectGate = (employeeId: string, managerNote: string, retryItemIds: string[]) => {
  OnboardingOperationsService.rejectStageGate(employeeId, managerNote, retryItemIds)
  refresh()
}
```

```tsx
<div style={{ fontSize: 11, fontWeight: 800 }}>
  Chặng 4: Đánh giá và chốt kết quả
</div>
<div style={{ fontSize: 12 }}>
  Buddy đề xuất, quản lý chốt kết quả thử việc, và chọn việc cần làm lại nếu chưa đạt.
</div>
```

- [ ] **Step 4: Chạy contract detail panel để xác nhận khung 4 chặng pass**

Run: `npx tsx --test tests/trial-workflow-tracking-detail-panel-contract.test.ts`

Expected: PASS, và source mới có đủ `Chốt nhận việc và chuẩn bị vào làm`, `Ngày đầu nhận việc`, `Làm quen và kèm cặp`, `Đánh giá và chốt kết quả`, `TrialTrackingStageTaskTable`.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding-operations/TrialTrackingDetailPanel.tsx src/components/onboarding-operations/TrialTrackingStageTabs.tsx src/components/onboarding-operations/TrialTrackingStageTaskTable.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/app/career-path/onboarding/page.tsx tests/trial-workflow-tracking-detail-panel-contract.test.ts
git commit -m 'feat: add four-stage trial tracking detail panel'
```

### Task 5: Đồng bộ overview, dọn khối cũ, cập nhật tài liệu, và verify toàn bộ

**Files:**
- Modify: `src/app/career-path/onboarding/overview/page.tsx`
- Modify: `docs/CODEMAP.md`
- Delete: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- Delete: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Delete: `src/components/onboarding-operations/OnboardingOpsTimeline.tsx`
- Delete: `src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx`
- Delete: `src/components/onboarding-operations/OnboardingDayJourneySummary.tsx`
- Delete: `tests/onboarding-operations-task-first-contract.test.ts`
- Delete: `tests/onboarding-operations-day-journey-contract.test.ts`

- [ ] **Step 1: Cập nhật overview page để deep-link sang filter mới và copy mới**

```tsx
const taskCards = [
  {
    title: 'Bảng nhân sự thử việc',
    value: upcomingCount,
    detail: 'Quét toàn bộ nhân sự mới và mở đúng hồ sơ cần xử lý tiếp.',
    href: '/career-path/onboarding?filter=all',
    cta: 'Mở theo dõi thử việc',
  },
  {
    title: 'Cần xử lý ngay',
    value: overview.allRows.filter((row) => row.statusKey === 'urgent').length,
    detail: 'Ưu tiên các trường hợp đang thiếu bước nền tảng hoặc chậm mốc quan trọng.',
    href: '/career-path/onboarding?filter=urgent',
    cta: 'Mở danh sách cần xử lý ngay',
  },
]
```

- [ ] **Step 2: Xóa các component cũ và cập nhật `CODEMAP` cho entry point mới**

```md
### Theo dõi thử việc bằng bảng nhân sự
- Mô tả: màn `/career-path/onboarding` dùng thanh tóm tắt ngắn, bảng nhân sự trung tâm, và khung chi tiết 4 chặng theo từng nhân sự.
- File chính: `src/app/career-path/onboarding/page.tsx`, `src/components/onboarding-operations/TrialTrackingSummaryBar.tsx`, `src/components/onboarding-operations/TrialTrackingEmployeeTable.tsx`, `src/components/onboarding-operations/TrialTrackingDetailPanel.tsx`
```

```bash
git rm src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/components/onboarding-operations/OnboardingOpsTimeline.tsx src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx src/components/onboarding-operations/OnboardingDayJourneySummary.tsx tests/onboarding-operations-task-first-contract.test.ts tests/onboarding-operations-day-journey-contract.test.ts
```

- [ ] **Step 3: Chạy test đầy đủ cho cụm onboarding tracking**

Run: `npx tsx --test tests/trial-workflow-tracking-table-layout-contract.test.ts tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-service-overview.test.ts tests/onboarding-navigation-ia.test.ts`

Expected: PASS.

- [ ] **Step 4: Chạy ESLint cho các file vừa đổi**

Run: `npx eslint src/app/career-path/onboarding/page.tsx src/app/career-path/onboarding/overview/page.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/TrialTrackingSummaryBar.tsx src/components/onboarding-operations/TrialTrackingEmployeeTable.tsx src/components/onboarding-operations/TrialTrackingEmptyState.tsx src/components/onboarding-operations/TrialTrackingDetailPanel.tsx src/components/onboarding-operations/TrialTrackingStageTabs.tsx src/components/onboarding-operations/TrialTrackingStageTaskTable.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx tests/trial-workflow-tracking-table-layout-contract.test.ts tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/career-path/onboarding/overview/page.tsx docs/CODEMAP.md src/app/career-path/onboarding/page.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/TrialTrackingSummaryBar.tsx src/components/onboarding-operations/TrialTrackingEmployeeTable.tsx src/components/onboarding-operations/TrialTrackingEmptyState.tsx src/components/onboarding-operations/TrialTrackingDetailPanel.tsx src/components/onboarding-operations/TrialTrackingStageTabs.tsx src/components/onboarding-operations/TrialTrackingStageTaskTable.tsx src/components/onboarding-operations/OnboardingStageGatePanel.tsx tests/trial-workflow-tracking-table-layout-contract.test.ts tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-service-overview.test.ts tests/onboarding-navigation-ia.test.ts
git commit -m 'refactor: finish employee-table trial tracking workflow'
```

## Self-review

- **Spec coverage:** Plan đã phủ 3 lớp nội dung của màn tracking: thanh tóm tắt ngắn, bảng nhân sự trung tâm, và khung chi tiết chỉ mở khi chọn 1 người. Phần chi tiết bám đúng 4 chặng đã chốt và giữ `1 trạng thái chính`, `1 thiếu sót chính`, `1 hành động chính` ở từng dòng bảng.
- **Placeholder scan:** Không để chỗ trống kiểu ghi chú để làm sau, không có bước kiểu 'làm tương tự'. Mỗi task đều có file cụ thể, đoạn mã mẫu, lệnh chạy, kết quả mong đợi, và commit checkpoint.
- **Type consistency:** Tên kiểu và field được giữ thống nhất xuyên suốt plan: `OnboardingOpsPriorityFilter`, `OnboardingOpsStageKey`, `currentStageLabel`, `nextMilestoneLabel`, `primaryMissingLabel`, `statusLabel`, `primaryActionLabel`.

## Ghi chú thực thi

- Plan này chỉ refactor màn `Theo dõi thử việc` theo spec ngày `2026-06-08`; không đụng vào màn `Thiết lập quy trình thử việc` ngoài việc giữ đường đi sang đó.
- Nếu trong lúc làm phát hiện dữ liệu hiện tại chưa đủ để dựng `taskRows` cho một chặng, dừng ở checkpoint service và viết bổ sung spec dữ liệu trước khi nới model sâu hơn.
