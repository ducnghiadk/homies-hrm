# Hoàn Thiện Copy Và Gate Màn Theo Dõi Thử Việc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khóa phase hoàn thiện cho màn `/career-path/onboarding` bằng cách dọn toàn bộ copy lỗi mã hóa, bỏ chữ Anh còn sót trong cụm tracking, và làm rõ khối gate ở chặng cuối để ảnh render và màn thật thống nhất.

**Architecture:** Giữ nguyên khung bảng nhân sự và panel 4 chặng đã refactor; chỉ vá lớp ngôn ngữ và dữ liệu hiển thị đang rò rỉ trên các component tracking. Khối `OnboardingStageGatePanel` được xem như điểm chạm chính của chặng 4 nên cần có contract riêng cho copy hiển thị và trạng thái gate.

**Tech Stack:** Next.js App Router, React client components, TypeScript, dữ liệu mock từ `mock-data.ts` và `mock-data-career-path.ts`, contract test bằng `tsx --test`, lint bằng ESLint.

---

## Cấu trúc file dự kiến

**Sửa:**
- `src/components/onboarding-operations/OnboardingStageGatePanel.tsx` - viết lại copy tiếng Việt sạch cho khối gate chặng cuối.
- `src/lib/services/onboarding-operations-service.ts` - thay các chuỗi tracking còn lỗi mã hóa hoặc lẫn tiếng Anh.
- `src/lib/career-path-service.ts` - chuẩn hóa nhãn rule hiển thị trên bảng việc tracking.
- `src/lib/mock-data-career-path.ts` - chuẩn hóa tên stage/item/copy demo đang lộ ra ở tracking.
- `src/lib/mock-data.ts` - chuẩn hóa tên cửa hàng, vị trí, và tên demo đang hiện trên bảng.
- `src/store/auth-store.ts` - chuẩn hóa tên tài khoản demo hiện ở sidebar và màn đăng nhập nhanh.
- `tests/trial-workflow-tracking-detail-panel-contract.test.ts` - thêm contract cho copy gate chặng 4.
- `tests/trial-workflow-tracking-service-contract.test.ts` - thêm contract cho copy tracking/service sạch tiếng Việt.

### Task 1: Khóa contract cho copy sạch ở panel gate và service tracking

**Files:**
- Modify: `tests/trial-workflow-tracking-detail-panel-contract.test.ts`
- Modify: `tests/trial-workflow-tracking-service-contract.test.ts`

- [ ] **Step 1: Thêm test thất bại cho copy gate chặng 4**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const gatePanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-operations/OnboardingStageGatePanel.tsx'),
  'utf8',
)

test('panel gate chặng 4 dùng copy tiếng Việt sạch', () => {
  assert.match(gatePanelSource, /Tổng kết chặng cuối/)
  assert.match(gatePanelSource, /Tự đánh giá là điều kiện vào bước chốt cuối/)
  assert.match(gatePanelSource, /Trạng thái/)
  assert.match(gatePanelSource, /Đề xuất qua bước chốt/)
  assert.doesNotMatch(gatePanelSource, /tÃ|Ã„|Â/)
})
```

- [ ] **Step 2: Thêm test thất bại cho copy service tracking sạch tiếng Việt**

```ts
const serviceSource = readFileSync(
  resolve(process.cwd(), 'src/lib/services/onboarding-operations-service.ts'),
  'utf8',
)

test('service tracking không còn copy lỗi mã hóa ở các nhãn chính', () => {
  assert.match(serviceSource, /Chưa thể bắt đầu/)
  assert.match(serviceSource, /Đang đúng tiến độ/)
  assert.match(serviceSource, /Đi tới thiết lập/)
  assert.match(serviceSource, /Vào phần thiết lập quy trình thử việc để map chức danh và chọn mẫu áp dụng/)
  assert.doesNotMatch(serviceSource, /VÃ|Ã„|ChÆ°a thá»ƒ|Äang Ä‘Ãºng/)
})
```

- [ ] **Step 3: Chạy contract để xác nhận đang lỗi**

Run: `npx tsx --test tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts`
Expected: FAIL vì source hiện tại còn nhiều chuỗi lỗi mã hóa trong `OnboardingStageGatePanel.tsx` và `onboarding-operations-service.ts`.

### Task 2: Viết lại copy tracking và dữ liệu demo đang lộ trên màn

**Files:**
- Modify: `src/components/onboarding-operations/OnboardingStageGatePanel.tsx`
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/lib/career-path-service.ts`
- Modify: `src/lib/mock-data-career-path.ts`
- Modify: `src/lib/mock-data.ts`
- Modify: `src/store/auth-store.ts`

- [ ] **Step 1: Viết lại toàn bộ copy hiển thị trong panel gate chặng cuối**

```tsx
<div style={{ fontSize: 11, fontWeight: 800, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
  Tổng kết chặng cuối
</div>
<div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
  Tự đánh giá là điều kiện vào bước chốt cuối. Người kèm đề xuất, quản lý chốt kết quả thử việc.
</div>
```

```ts
function getStatusLabel(status: OnboardingStageGateStatus) {
  if (status === 'cho_quan_ly_duyet') return 'Chờ quản lý duyệt'
  if (status === 'da_qua_gate') return 'Đã qua bước chốt'
  if (status === 'chua_qua_gate') return 'Chưa qua bước chốt'
  return 'Chưa đề xuất'
}
```

- [ ] **Step 2: Sửa các chuỗi tracking còn lỗi mã hóa trong service**

```ts
const unmatchedQuickNote = 'Vào phần thiết lập quy trình thử việc để map chức danh và chọn mẫu áp dụng.'

return {
  statusKey: 'blocked_start' as const,
  statusLabel: 'Chưa thể bắt đầu' as const,
  tone: 'block' as const,
}
```

```ts
function buildPrimaryActionLabel(statusKey: Exclude<OnboardingOpsPriorityFilter, 'all'>) {
  if (statusKey === 'blocked_start') return 'Đi tới thiết lập'
  if (statusKey === 'urgent') return 'Xử lý ngay'
  if (statusKey === 'due_soon') return 'Theo dõi tiếp'
  if (statusKey === 'completed') return 'Xem kết quả'
  return 'Mở chi tiết'
}
```

- [ ] **Step 3: Chuẩn hóa nhãn rule và dữ liệu demo đang lộ trên màn tracking**

```ts
{ key: 'first_shift', label: 'Ca đầu và giờ có mặt', severity: 'attention', store_override_allowed: true }
{ key: 'buddy', label: 'Người kèm / người hướng dẫn', severity: 'block', store_override_allowed: true }
{ key: 'tools_and_group', label: 'Tài khoản, nhóm chat, công cụ', severity: 'attention', store_override_allowed: true }
```

```ts
name: 'Homies Milk Tea - Nguyễn Huệ'
name: 'Quản lý'
position: 'Phụ trách nhân sự'
name: 'Trần Minh Thủy'
name: 'Lê Phương Nam'
```

- [ ] **Step 4: Chạy contract để xác nhận pass**

Run: `npx tsx --test tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts`
Expected: PASS.

### Task 3: Chạy verify cụm tracking sau phase hoàn thiện

**Files:**
- Verify only

- [ ] **Step 1: Chạy lại cụm contract onboarding tracking**

Run: `npx tsx --test tests/trial-workflow-tracking-table-layout-contract.test.ts tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-service-overview.test.ts tests/onboarding-navigation-ia.test.ts`
Expected: PASS.

- [ ] **Step 2: Chạy ESLint cho các file vừa sửa**

Run: `npx eslint src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/lib/services/onboarding-operations-service.ts src/lib/career-path-service.ts src/lib/mock-data-career-path.ts src/lib/mock-data.ts src/store/auth-store.ts tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding-operations/OnboardingStageGatePanel.tsx src/lib/services/onboarding-operations-service.ts src/lib/career-path-service.ts src/lib/mock-data-career-path.ts src/lib/mock-data.ts src/store/auth-store.ts tests/trial-workflow-tracking-detail-panel-contract.test.ts tests/trial-workflow-tracking-service-contract.test.ts
git commit -m "fix: polish vietnamese copy for onboarding tracking"
```

## Self-review

- **Spec coverage:** Plan này chỉ xử lý lớp hoàn thiện sau render, bám đúng rule `100% tiếng Việt`, không mở rộng thêm tính năng ngoài màn tracking.
- **Placeholder scan:** Mọi task đều có file đích, lệnh chạy, và chuỗi cần thay cụ thể.
- **Type consistency:** Không đổi model hay API; chỉ vá copy hiển thị và dữ liệu demo đi kèm.