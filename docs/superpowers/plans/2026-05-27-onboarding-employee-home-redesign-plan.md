# Onboarding Employee Home Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thiết kế lại màn `/onboarding` cho nhân viên để mở vào là biết đang ở chặng nào, hôm nay cần làm gì, ai đang hỗ trợ, đồng thời vẫn giữ cảm giác thân thiện và đúng brand Homies.

**Architecture:** Giữ nguyên service và data onboarding hiện có, chỉ tổ chức lại UI theo thứ bậc thông tin mới. Tách màn `/onboarding` thành các khối nhỏ hơn để giảm độ dài file, dễ kiểm soát responsive và dễ polish theo từng pass.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, `lucide-react`, theme token hiện có trong `globals.css`

---

## File Structure

### Giữ nguyên
- `src/lib/career-path-service.ts`
  - Tiếp tục cung cấp bundle checklist theo nhân viên, không đổi logic dữ liệu trong plan này.
- `src/lib/services/onboarding-policy-service.ts`
  - Giữ nguyên rule nội quy và hành vi xác nhận.

### Sửa
- `src/app/onboarding/page.tsx`
  - Chuyển thành page orchestration: lấy data, chia block, truyền props xuống component con.

### Tạo mới
- `src/components/onboarding-employee/OnboardingHeroCard.tsx`
  - Hero gọn: tên, vị trí, cửa hàng, trạng thái lớn, 3 chỉ số nhanh.
- `src/components/onboarding-employee/OnboardingTodayFocus.tsx`
  - Khối ưu tiên hôm nay với 3 ô chính.
- `src/components/onboarding-employee/OnboardingProgressStages.tsx`
  - Progress bar + step pills timeline chặng.
- `src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx`
  - Tiêu đề chặng hiện tại + danh sách item checklist.
- `src/components/onboarding-employee/OnboardingChecklistItemCard.tsx`
  - Card item checklist dạng task-first.
- `src/components/onboarding-employee/OnboardingSupportPanel.tsx`
  - Buddy, quản lý theo dõi, ghi chú quản lý.
- `src/components/onboarding-employee/OnboardingPolicyPanel.tsx`
  - Nội quy nhận việc, chỉ giữ mức ưu tiên đúng spec.

### Verify
- `npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/*.tsx`
- `npx tsc --noEmit --pretty false`

---

### Task 1: Tách khung UI onboarding khỏi page hiện tại

**Files:**
- Create: `src/components/onboarding-employee/OnboardingHeroCard.tsx`
- Create: `src/components/onboarding-employee/OnboardingTodayFocus.tsx`
- Create: `src/components/onboarding-employee/OnboardingProgressStages.tsx`
- Create: `src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx`
- Create: `src/components/onboarding-employee/OnboardingChecklistItemCard.tsx`
- Create: `src/components/onboarding-employee/OnboardingSupportPanel.tsx`
- Create: `src/components/onboarding-employee/OnboardingPolicyPanel.tsx`
- Modify: `src/app/onboarding/page.tsx`

- [x] **Step 1: Chụp lại shape data đang dùng ở page**

Đọc và ghi lại các nhóm data đang có trong `src/app/onboarding/page.tsx`:

```ts
type EmployeeChecklistBundle = NonNullable<ReturnType<typeof getEmployeeOnboardingChecklistBundleForEmployee>>

const checklistBundle: EmployeeChecklistBundle | null = getEmployeeOnboardingChecklistBundleForEmployee(user)
const activeStage = checklistBundle?.stages.find((stage) => stage.code === selectedPhase) ?? checklistBundle?.stages[0]
const phaseTasks = checklistBundle?.items.filter((item) => item.stage_id === activeStage?.id) ?? []
```

Expected:
- Xác định rõ props cần truyền cho từng component con
- Không đổi tên field từ service nếu không cần

- [x] **Step 2: Tạo component Hero**

Tạo `src/components/onboarding-employee/OnboardingHeroCard.tsx`:

```tsx
type OnboardingHeroCardProps = {
  employeeName: string
  positionLabel: string
  storeLabel: string
  headline: string
  startDateLabel: string
  buddyName: string
  currentStageLabel: string
}

export function OnboardingHeroCard({
  employeeName,
  positionLabel,
  storeLabel,
  headline,
  startDateLabel,
  buddyName,
  currentStageLabel,
}: OnboardingHeroCardProps) {
  return <div>{/* render later in Task 2 */}</div>
}
```

- [x] **Step 3: Tạo component Today Focus**

Tạo `src/components/onboarding-employee/OnboardingTodayFocus.tsx`:

```tsx
type OnboardingTodayFocusProps = {
  primaryTask: string
  waitingLabel: string
  supportLabel: string
}

export function OnboardingTodayFocus(props: OnboardingTodayFocusProps) {
  return <div>{/* render later in Task 2 */}</div>
}
```

- [x] **Step 4: Tạo component Progress + Stage**

Tạo `src/components/onboarding-employee/OnboardingProgressStages.tsx`:

```tsx
type StageItem = {
  id: string
  code: string
  label: string
  done_items: number
  total_items: number
  status: 'completed' | 'current' | 'upcoming'
}

type OnboardingProgressStagesProps = {
  progress: number
  doneTasks: number
  totalTasks: number
  stages: StageItem[]
  activeStageCode: string
  onStageSelect: (stageCode: string) => void
}

export function OnboardingProgressStages(props: OnboardingProgressStagesProps) {
  return <div>{/* render later in Task 2 */}</div>
}
```

- [x] **Step 5: Tạo component Checklist Item**

Tạo `src/components/onboarding-employee/OnboardingChecklistItemCard.tsx`:

```tsx
type ChecklistProgress = {
  status: 'not_started' | 'in_progress' | 'passed' | 'need_more_coaching'
  note?: string
}

type OnboardingChecklistItemCardProps = {
  title: string
  instructionText: string
  successCriteria: string
  progress: ChecklistProgress
}

export function OnboardingChecklistItemCard(props: OnboardingChecklistItemCardProps) {
  return <div>{/* render later in Task 3 */}</div>
}
```

- [x] **Step 6: Tạo component Checklist Panel**

Tạo `src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx`:

```tsx
type ChecklistStagePanelProps = {
  stageLabel: string
  stageGoalSummary: string
  items: React.ReactNode
}

export function OnboardingChecklistStagePanel({
  stageLabel,
  stageGoalSummary,
  items,
}: ChecklistStagePanelProps) {
  return <div>{items}</div>
}
```

- [x] **Step 7: Tạo component Support và Policy**

Tạo 2 file:

```tsx
// OnboardingSupportPanel.tsx
type OnboardingSupportPanelProps = {
  buddyName: string
  managerName: string
  overallNote?: string
}

export function OnboardingSupportPanel(props: OnboardingSupportPanelProps) {
  return <div>{/* render later in Task 4 */}</div>
}
```

```tsx
// OnboardingPolicyPanel.tsx
type OnboardingPolicyPanelProps = {
  children: React.ReactNode
}

export function OnboardingPolicyPanel({ children }: OnboardingPolicyPanelProps) {
  return <div>{children}</div>
}
```

- [x] **Step 8: Nối page với component mới nhưng chưa đổi layout sâu**

Sửa `src/app/onboarding/page.tsx` để import component mới và thay block cũ bằng component placeholder:

```tsx
import { OnboardingHeroCard } from '@/components/onboarding-employee/OnboardingHeroCard'
import { OnboardingTodayFocus } from '@/components/onboarding-employee/OnboardingTodayFocus'
import { OnboardingProgressStages } from '@/components/onboarding-employee/OnboardingProgressStages'
import { OnboardingChecklistStagePanel } from '@/components/onboarding-employee/OnboardingChecklistStagePanel'
import { OnboardingChecklistItemCard } from '@/components/onboarding-employee/OnboardingChecklistItemCard'
import { OnboardingSupportPanel } from '@/components/onboarding-employee/OnboardingSupportPanel'
import { OnboardingPolicyPanel } from '@/components/onboarding-employee/OnboardingPolicyPanel'
```

Expected:
- Build pass
- UI có thể chưa đẹp, nhưng tách được responsibility

- [x] **Step 9: Verify**

Run:

```bash
npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/*.tsx
npx tsc --noEmit --pretty false
```

Expected:
- PASS

- [ ] **Step 10: Commit**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee
git commit -m "refactor: split employee onboarding page into focused sections"
```

---

### Task 2: Làm lại hero + ưu tiên hôm nay + progress timeline

**Files:**
- Modify: `src/components/onboarding-employee/OnboardingHeroCard.tsx`
- Modify: `src/components/onboarding-employee/OnboardingTodayFocus.tsx`
- Modify: `src/components/onboarding-employee/OnboardingProgressStages.tsx`
- Modify: `src/app/onboarding/page.tsx`

- [x] **Step 1: Viết headline logic ngay trong page**

Sửa `src/app/onboarding/page.tsx` để tính headline và today-focus text:

```ts
const heroHeadline = dayOneSnapshot.needsEmployeeAction
  ? 'Hôm nay bạn cần phản hồi nội quy nhận việc'
  : checklistBundle?.summary.current_stage_code === 'day_2_3'
    ? 'Bạn đang ở chặng 3 ngày đầu'
    : checklistBundle?.summary.current_stage_code === 'day_1'
      ? 'Hôm nay là ngày đầu của bạn'
      : `Bạn đang ở chặng ${activeStage?.label || 'onboarding'}`

const primaryTask = phaseTasks.find((item) => item.progress.status !== 'passed')?.title
  || 'Hôm nay chưa có mục mới, bạn chỉ cần hoàn tất việc đang dở'

const waitingLabel = dayOneSnapshot.needsEmployeeAction
  ? 'Đang chờ bạn xác nhận nội quy'
  : dayOneSnapshot.summarySent && !dayOneSnapshot.fullSent
    ? 'Đang chờ HR gửi nội quy đầy đủ'
    : 'Không có chờ xử lý gấp'

const supportLabel = checklistBundle?.plan.assigned_buddy_name
  ? `Buddy: ${checklistBundle.plan.assigned_buddy_name}`
  : 'Chưa có buddy được gán'
```

- [x] **Step 2: Render hero đúng hierarchy mới**

Sửa `OnboardingHeroCard.tsx`:

```tsx
export function OnboardingHeroCard({
  employeeName,
  positionLabel,
  storeLabel,
  headline,
  startDateLabel,
  buddyName,
  currentStageLabel,
}: OnboardingHeroCardProps) {
  return (
    <section className="rounded-[28px] bg-white shadow-[0_10px_30px_rgba(0,29,61,0.08)] border border-white/70 p-5 md:p-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#2F6FA8]">Onboarding nhân viên mới</p>
        <h1 className="text-2xl md:text-3xl font-bold text-[#001D3D]">{employeeName}</h1>
        <p className="text-sm text-[#4B5563]">{positionLabel} • {storeLabel}</p>
        <div className="rounded-2xl bg-[#F4F8FC] px-4 py-3 text-[#001D3D] font-semibold">
          {headline}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[#FFFDF9] p-3">
          <div className="text-xs text-[#6B7280]">Bắt đầu</div>
          <div className="mt-1 font-semibold text-[#001D3D]">{startDateLabel}</div>
        </div>
        <div className="rounded-2xl bg-[#FFFDF9] p-3">
          <div className="text-xs text-[#6B7280]">Buddy</div>
          <div className="mt-1 font-semibold text-[#001D3D]">{buddyName}</div>
        </div>
        <div className="rounded-2xl bg-[#FFFDF9] p-3">
          <div className="text-xs text-[#6B7280]">Chặng hiện tại</div>
          <div className="mt-1 font-semibold text-[#001D3D]">{currentStageLabel}</div>
        </div>
      </div>
    </section>
  )
}
```

- [x] **Step 3: Render Today Focus thành 3 ô rõ việc**

Sửa `OnboardingTodayFocus.tsx`:

```tsx
export function OnboardingTodayFocus({
  primaryTask,
  waitingLabel,
  supportLabel,
}: OnboardingTodayFocusProps) {
  const cards = [
    { label: 'Việc cần làm ngay', value: primaryTask, tone: 'primary' },
    { label: 'Đang chờ ai', value: waitingLabel, tone: 'warning' },
    { label: 'Người hỗ trợ bạn', value: supportLabel, tone: 'neutral' },
  ]

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-[#001D3D]">Ưu tiên hôm nay</h2>
        <p className="text-sm text-[#6B7280]">Mở vào là biết ngay việc đang cần xử lý.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
            <div className="text-xs font-semibold text-[#2F6FA8]">{card.label}</div>
            <div className="mt-2 text-sm font-semibold text-[#001D3D]">{card.value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [x] **Step 4: Render progress + timeline step pills**

Sửa `OnboardingProgressStages.tsx`:

```tsx
export function OnboardingProgressStages({
  progress,
  doneTasks,
  totalTasks,
  stages,
  activeStageCode,
  onStageSelect,
}: OnboardingProgressStagesProps) {
  return (
    <section className="space-y-4 rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(0,29,61,0.08)]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#001D3D]">Tiến độ onboarding</h2>
          <span className="text-lg font-bold text-[#2F6FA8]">{progress}%</span>
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">{doneTasks}/{totalTasks} mục đã đạt</p>
      </div>

      <div className="h-3 rounded-full bg-[#EEF4FB] overflow-hidden">
        <div className="h-full rounded-full bg-[#2F6FA8]" style={{ width: `${progress}%` }} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const isActive = stage.code === activeStageCode
          const toneClass = stage.status === 'completed'
            ? 'bg-[#DDF4EC] text-[#107C41]'
            : isActive
              ? 'bg-[#2F6FA8] text-white'
              : 'bg-[#FFFDF9] text-[#001D3D]'

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onStageSelect(stage.code)}
              className={`rounded-[20px] p-3 text-left transition-all ${toneClass}`}
            >
              <div className="text-xs font-semibold">{stage.label}</div>
              <div className="mt-2 text-xs opacity-80">{stage.done_items}/{stage.total_items} mục</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
```

- [x] **Step 5: Nối 3 khối mới vào page theo thứ tự**

Trong `src/app/onboarding/page.tsx`, thứ tự render chính:

```tsx
<OnboardingHeroCard ... />
<OnboardingTodayFocus ... />
<OnboardingProgressStages ... />
```

Expected:
- Hero ngắn hơn
- Có block “ưu tiên hôm nay”
- Timeline chặng dễ quét

- [x] **Step 6: Verify**

Run:

```bash
npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/*.tsx
npx tsc --noEmit --pretty false
```

- [ ] **Step 7: Commit**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee
git commit -m "feat: redesign onboarding hero and daily focus"
```

---

### Task 3: Làm lại checklist chặng hiện tại theo kiểu task-first

**Files:**
- Modify: `src/components/onboarding-employee/OnboardingChecklistItemCard.tsx`
- Modify: `src/components/onboarding-employee/OnboardingChecklistStagePanel.tsx`
- Modify: `src/app/onboarding/page.tsx`

- [x] **Step 1: Chuẩn hóa label trạng thái checklist**

Trong `OnboardingChecklistItemCard.tsx`:

```ts
function getStatusMeta(status: ChecklistProgress['status']) {
  if (status === 'passed') {
    return { label: 'Đạt rồi', badgeClass: 'bg-[#DDF4EC] text-[#107C41]' }
  }
  if (status === 'in_progress') {
    return { label: 'Đang làm', badgeClass: 'bg-[#FFF4D6] text-[#8A5B00]' }
  }
  if (status === 'need_more_coaching') {
    return { label: 'Cần kèm thêm', badgeClass: 'bg-[#EEF4FB] text-[#2F6FA8]' }
  }
  return { label: 'Chưa làm', badgeClass: 'bg-[#F5F5F5] text-[#6B7280]' }
}
```

- [x] **Step 2: Render card checklist gọn, dễ quét**

```tsx
export function OnboardingChecklistItemCard({
  title,
  instructionText,
  successCriteria,
  progress,
}: OnboardingChecklistItemCardProps) {
  const meta = getStatusMeta(progress.status)

  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(0,29,61,0.06)] border border-[#F3E7C8]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm md:text-base font-semibold text-[#001D3D]">{title}</h3>
          <p className="mt-1 text-sm text-[#4B5563]">{instructionText}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-3 rounded-2xl bg-[#FFFDF9] px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2F6FA8]">Tiêu chuẩn đạt</div>
        <div className="mt-1 text-sm text-[#001D3D]">{successCriteria}</div>
      </div>

      {progress.note ? (
        <div className="mt-3 text-sm text-[#6B7280]">
          Ghi chú: {progress.note}
        </div>
      ) : null}
    </article>
  )
}
```

- [x] **Step 3: Render stage panel có tiêu đề ngắn và gợi ý rõ**

```tsx
export function OnboardingChecklistStagePanel({
  stageLabel,
  stageGoalSummary,
  items,
}: ChecklistStagePanelProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Chặng hiện tại</div>
        <h2 className="mt-1 text-xl font-bold text-[#001D3D]">{stageLabel}</h2>
        <p className="mt-2 text-sm text-[#4B5563]">{stageGoalSummary}</p>
      </div>
      <div className="space-y-3">{items}</div>
    </section>
  )
}
```

- [x] **Step 4: Chỉ render item của chặng hiện tại**

Trong `src/app/onboarding/page.tsx`:

```tsx
<OnboardingChecklistStagePanel
  stageLabel={activeStage?.label || 'Chưa có chặng'}
  stageGoalSummary={activeStage?.goal_summary || 'Đang cập nhật mục tiêu chặng'}
  items={
    <>
      {phaseTasks.map((task) => (
        <OnboardingChecklistItemCard
          key={task.id}
          title={task.title}
          instructionText={task.instruction_text}
          successCriteria={task.success_criteria}
          progress={task.progress}
        />
      ))}
    </>
  }
/>
```

- [x] **Step 5: Rewrite copy fallback khi không có task**

Nếu `phaseTasks.length === 0`, render:

```tsx
<div className="rounded-[24px] bg-white p-4 text-sm text-[#6B7280]">
  Chặng này chưa có mục cần làm thêm. Bạn có thể chuyển sang chặng khác để xem toàn bộ lộ trình.
</div>
```

- [x] **Step 6: Verify**

Run:

```bash
npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/*.tsx
npx tsc --noEmit --pretty false
```

- [ ] **Step 7: Commit**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee
git commit -m "feat: redesign onboarding checklist into task-first cards"
```

---

### Task 4: Hạ nội quy xuống đúng mức, làm lại khối hỗ trợ

**Files:**
- Modify: `src/components/onboarding-employee/OnboardingSupportPanel.tsx`
- Modify: `src/components/onboarding-employee/OnboardingPolicyPanel.tsx`
- Modify: `src/app/onboarding/page.tsx`

- [x] **Step 1: Render support panel rõ buddy và quản lý theo dõi**

Sửa `OnboardingSupportPanel.tsx`:

```tsx
export function OnboardingSupportPanel({
  buddyName,
  managerName,
  overallNote,
}: OnboardingSupportPanelProps) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Người hỗ trợ</div>
      <h2 className="mt-1 text-lg font-bold text-[#001D3D]">{buddyName}</h2>
      <p className="mt-1 text-sm text-[#6B7280]">Quản lý theo dõi: {managerName}</p>
      {overallNote ? (
        <div className="mt-3 rounded-2xl bg-[#FFFDF9] p-3 text-sm text-[#4B5563]">
          Ghi chú quản lý: {overallNote}
        </div>
      ) : null}
    </section>
  )
}
```

- [x] **Step 2: Render policy panel nhẹ hơn, chỉ nổi khi cần hành động**

Sửa `OnboardingPolicyPanel.tsx`:

```tsx
type OnboardingPolicyPanelProps = {
  title: string
  statusLabel: string
  statusToneClass: string
  summary: string
  children: React.ReactNode
}

export function OnboardingPolicyPanel({
  title,
  statusLabel,
  statusToneClass,
  summary,
  children,
}: OnboardingPolicyPanelProps) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#001D3D]">{title}</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{summary}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusToneClass}`}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
```

- [x] **Step 3: Đổi string hệ thống sang string vận hành đơn giản**

Trong `src/app/onboarding/page.tsx`, thay fallback text:

```tsx
<div className="rounded-2xl bg-[#FFFDF9] p-3 text-sm text-[#6B7280]">
  HR chưa gửi nội quy đầy đủ. Bạn chưa cần xác nhận lúc này.
</div>
```

và:

```tsx
<div className="rounded-[24px] bg-white p-4 text-sm text-[#6B7280]">
  Hiện chưa có checklist onboarding cho bạn. Vui lòng báo quản lý hoặc HR.
</div>
```

- [x] **Step 4: Sắp thứ tự cuối màn đúng spec**

Trong `src/app/onboarding/page.tsx`, thứ tự sau progress:

```tsx
<OnboardingChecklistStagePanel ... />
<OnboardingSupportPanel ... />
<OnboardingPolicyPanel ... />
```

Expected:
- Buddy block lên trước policy
- Policy không còn chiếm spotlight nếu không cần action

- [x] **Step 5: Verify**

Run:

```bash
npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/*.tsx
npx tsc --noEmit --pretty false
```

- [ ] **Step 6: Commit**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee
git commit -m "feat: rebalance onboarding support and policy sections"
```

---

### Task 5: Responsive polish và cập nhật docs điều phối

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/components/onboarding-employee/*.tsx`
- Modify: `docs/CODEMAP.md`

- [x] **Step 1: Soát mobile spacing**

Checklist cần soát:

```txt
- Hero không bị quá cao trên mobile
- 3 ô Today Focus xuống 1 cột mượt
- Timeline step không bị vỡ chữ
- Checklist card không bị badge đè text
- Support/policy card còn dễ đọc ở màn hẹp
```

- [x] **Step 2: Soát desktop hierarchy**

Checklist cần soát:

```txt
- Hero không loãng
- Today Focus nhìn ra ngay là block trọng tâm
- Progress + timeline nằm ngay sau Today Focus
- Checklist là khối đọc chính
- Support/policy ở cuối không tranh spotlight
```

- [x] **Step 3: Cập nhật CODEMAP nếu thêm cụm component mới**

Thêm mục tại `docs/CODEMAP.md` phần onboarding:

```md
- `src/components/onboarding-employee/*`: cac block UI man onboarding nhan vien, gom hero, focus hom nay, progress stage, checklist va support/policy
```

- [x] **Step 4: Verify toàn pass**

Run:

```bash
npx eslint src/app/onboarding/page.tsx src/components/onboarding-employee/*.tsx
npx tsc --noEmit --pretty false
```

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding-employee docs/CODEMAP.md
git commit -m "chore: polish onboarding employee redesign and update codemap"
```

---

## Self-Review

### Spec coverage
- Hero ngắn, headline lớn: Task 2
- Khối ưu tiên hôm nay: Task 2
- Progress + timeline mới: Task 2
- Checklist task-first: Task 3
- Buddy/support nổi hơn policy: Task 4
- Copy ngắn, vận hành hơn: Task 4
- Responsive + docs: Task 5

### Placeholder scan
- Không dùng TODO/TBD
- Có file path cụ thể
- Có command verify cụ thể
- Có code snippets cho phần implementation chính

### Type consistency
- Giữ `checklistBundle`, `phaseTasks`, `activeStage` theo page hiện tại
- Dùng thống nhất trạng thái checklist: `not_started | in_progress | passed | need_more_coaching`

---

Plan complete and saved to `docs/superpowers/plans/2026-05-27-onboarding-employee-home-redesign-plan.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
