# Employee Profile Onboarding Tab Refine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm gọn `Tổng quan`, nâng tab `Nội quy & onboarding` thành màn theo dõi vận hành có bảng ngang, ngày dự kiến theo từng mốc, và toàn bộ UI dùng tiếng Việt có dấu.

**Architecture:** Giữ nguyên route và service hiện có, mở rộng snapshot/service để tính thêm ngày dự kiến và trạng thái vận hành theo mốc. UI trong `src/app/employees/[id]/page.tsx` sẽ đọc dữ liệu mới để render bảng 5 cột và phần tóm tắt gọn hơn.

**Tech Stack:** Next.js App Router, React 19, TypeScript, client-side service layer, Tailwind CSS v4.

---

### Task 1: Mở rộng model tiến độ onboarding trong service

**Files:**
- Modify: `src/lib/services/onboarding-policy-service.ts`
- Test: `npm run lint -- "src/lib/services/onboarding-policy-service.ts"`

- [ ] **Step 1: Thêm shape dữ liệu cho ngày dự kiến và trạng thái vận hành**

Thêm vào `OnboardingDayOneChecklistItem` các field:

```ts
  dueAt?: string
  actualAt?: string
  scheduleLabel?: string
  statusLabel: string
```

Giữ `id`, `label`, `done`, `tone`, `hint` như cũ để tránh vỡ UI đang dùng.

- [ ] **Step 2: Bổ sung helper tính ngày dự kiến theo từng mốc**

Trong `src/lib/services/onboarding-policy-service.ts`, thêm helper cục bộ để tính:

```ts
function getIsoDateOnly(value?: string) {
  if (!value) return undefined
  return value.slice(0, 10)
}
```

và helper tính mốc theo record hiện có:

```ts
function resolvePolicyMilestoneDueDates(record: EmployeeOnboardingPolicyRecord | null) {
  return {
    summary: getIsoDateOnly(record?.created_at || record?.updated_at),
    full: getIsoDateOnly(record?.full_sent_at || record?.latest_contract_sent_at || record?.hire_date),
    responded: getIsoDateOnly(record?.hire_date),
    store_confirmed: getIsoDateOnly(record?.hire_date),
  }
}
```

Nếu model thực tế không có đủ field như ví dụ trên, dùng các field đang có gần nhất trong record. Không tạo dữ liệu giả ngoài record/service hiện có.

- [ ] **Step 3: Gán `dueAt`, `actualAt`, `scheduleLabel`, `statusLabel` cho từng mốc**

Trong `buildDayOneChecklistSnapshot(...)`, sau khi tính trạng thái hiện có, map từng item theo nguyên tắc:

```ts
{
  id: 'summary',
  label: 'Đã gửi nội quy tóm tắt',
  dueAt: dueDates.summary,
  actualAt: getIsoDateOnly(record?.summary_sent_at),
  scheduleLabel: 'Theo mốc cấu hình',
  statusLabel: summarySent ? 'Đã xong' : dueDates.summary ? 'Đang chờ' : 'Chưa tới lịch',
}
```

Mốc `responded` dùng `acknowledged_at` hoặc `clarification_requested_at` làm `actualAt`.

Mốc `store_confirmed` dùng `confirmed_at_store_at` làm `actualAt`.

- [ ] **Step 4: Nâng rule trạng thái vận hành**

Trong cùng hàm, thêm rule:

- nếu đã có `actualAt` -> `Đã xong`
- nếu `clarificationRequested` ở mốc phản hồi -> `Cần giải thích`
- nếu có `dueAt` và ngày hiện tại đã qua mà chưa xong -> `Trễ mốc`
- nếu có `dueAt` và chưa tới ngày -> `Chưa tới lịch`
- còn lại -> `Đang chờ`

Đồng bộ `tone`:

- `done` cho `Đã xong`
- `warning` cho `Trễ mốc` và `Cần giải thích`
- `pending` cho `Đang chờ` và `Chưa tới lịch`

- [ ] **Step 5: Chạy lint file service**

Run: `npm run lint -- "src/lib/services/onboarding-policy-service.ts"`

Expected: không có error mới từ file service.

### Task 2: Nâng tab Nội quy & onboarding sang bảng 5 cột và sửa toàn bộ text UI có dấu

**Files:**
- Modify: `src/app/employees/[id]/page.tsx`
- Test: `npm run lint -- "src/app/employees/[id]/page.tsx"`

- [ ] **Step 1: Chuẩn hóa toàn bộ text UI có dấu trên tab này**

Rà và đổi toàn bộ text đang không dấu hoặc bị lẫn không dấu trong:

- hero `Nội quy nhận việc`
- 3 ô tóm tắt
- bảng tiến độ
- badge trạng thái
- lịch sử gần đây
- nút thao tác

Ví dụ:

```tsx
<p className="text-sm font-semibold text-gray-900">Bảng tiến độ onboarding</p>
<p className="mt-1 text-xs text-gray-500">Dùng bảng ngang để rà từng mốc nhanh hơn.</p>
```

- [ ] **Step 2: Thêm tổng kết ngắn trên đầu tab**

Ngay dưới hero, thêm dòng tóm tắt:

```tsx
<div className="mt-4 flex flex-wrap gap-2 text-xs">
  <span>...</span>
</div>
```

Nội dung lấy từ snapshot items:

- số mốc `Đã xong`
- số mốc `Trễ mốc`
- số mốc `Đang chờ`

- [ ] **Step 3: Đổi bảng onboarding sang 5 cột**

Sửa bảng trong tab `onboarding` thành:

```tsx
<table className="min-w-full text-left text-sm">
  <thead>
    <tr>
      <th>Mốc</th>
      <th>Trạng thái</th>
      <th>Ngày dự kiến</th>
      <th>Ngày đã gửi / phản hồi</th>
      <th>Ghi chú</th>
    </tr>
  </thead>
</table>
```

`Ngày dự kiến` đọc từ `item.dueAt`.

`Ngày đã gửi / phản hồi` đọc từ `item.actualAt`.

Nếu rỗng:

- `Ngày dự kiến`: hiện `Chưa tới lịch` hoặc `Chưa có mốc`
- `Ngày đã gửi / phản hồi`: hiện `Chưa có`

- [ ] **Step 4: Hiển thị badge trạng thái theo `statusLabel`**

Không còn hard-code:

```tsx
{item.tone === 'done' ? 'Đã xong' : item.tone === 'warning' ? 'Đang vướng' : 'Chưa xong'}
```

Thay bằng:

```tsx
{item.statusLabel}
```

Màu badge vẫn bám `tone`.

- [ ] **Step 5: Làm cột ghi chú ngắn, dễ hành động**

Trong cột `Ghi chú`, ưu tiên:

- `item.scheduleLabel` ở dòng phụ nếu có
- `item.hint` ở dòng chính hoặc ngược lại, miễn ngắn và dễ hiểu

Ví dụ:

```tsx
<div className="font-medium text-gray-700">{item.hint}</div>
<div className="mt-1 text-xs text-gray-400">{item.scheduleLabel}</div>
```

- [ ] **Step 6: Chạy lint file page**

Run: `npm run lint -- "src/app/employees/[id]/page.tsx"`

Expected: không có error mới từ file page.

### Task 3: Giữ Tổng quan gọn và đồng bộ tab

**Files:**
- Modify: `src/app/employees/[id]/page.tsx`
- Test: `npm run lint -- "src/app/employees/[id]/page.tsx"`

- [ ] **Step 1: Kiểm tra lại tab `Tổng quan` không bị kéo chi tiết quay lại**

Giữ đúng 4 cụm:

- trạng thái tổng
- 3 thẻ tóm tắt
- việc cần chốt
- lối tắt sang tab khác

Không thêm lại:

- bảng onboarding
- bảng hợp đồng
- lịch sử dài

- [ ] **Step 2: Đồng bộ nút đi nhanh**

Đảm bảo các nút:

- `Mở nội quy`
- `Mở hợp đồng`
- `Mở lịch sử`

đều chuyển đúng tab mới bằng `setActiveTab(...)`.

- [ ] **Step 3: Chạy lint lại file page sau khi chốt layout**

Run: `npm run lint -- "src/app/employees/[id]/page.tsx"`

Expected: pass.

### Task 4: Cập nhật doc lỗi đã biết nếu phát sinh bug mới trong lúc sửa

**Files:**
- Modify if needed: `docs/KNOWN_ISSUES.md`

- [ ] **Step 1: Chỉ cập nhật nếu trong quá trình sửa phát hiện bug thật**

Nếu phát hiện bug mới có root cause rõ trong flow onboarding tab, thêm 1 dòng theo format đang dùng trong `docs/KNOWN_ISSUES.md`.

Nếu không có bug mới, không sửa file này.

### Task 5: Verify cuối pass

**Files:**
- Modify if needed: `src/app/employees/[id]/page.tsx`, `src/lib/services/onboarding-policy-service.ts`, `docs/KNOWN_ISSUES.md`

- [ ] **Step 1: Chạy lint theo đúng file đã sửa**

Run: `npm run lint -- "src/app/employees/[id]/page.tsx" "src/lib/services/onboarding-policy-service.ts"`

Expected: pass.

- [ ] **Step 2: Chạy build toàn app**

Run: `npm run build`

Expected: `EXIT:0`

- [ ] **Step 3: Tự check UI rule**

Rà lại nhanh phần render tab `Nội quy & onboarding` để chắc:

- không còn text tiếng Việt không dấu
- có đủ 5 cột
- có `Ngày dự kiến`
- có `Ngày đã gửi / phản hồi`
- `Tổng quan` vẫn gọn

