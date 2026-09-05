# KPI Lộ Trình Chuẩn Homies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép Admin chọn và tạo nhiều chặng thăng tiến hợp lệ trong một lần thay vì thiết lập từng cặp chức danh.

**Architecture:** `program-service.ts` xây danh sách chặng từ master data bằng quy tắc chỉ nối tới level cao hơn gần nhất. `KPIProgramScopeStep.tsx` hiển thị chế độ lộ trình chuẩn và chế độ một chặng riêng. Trang `/kpi/settings` tạo một `KpiSetVersion` draft độc lập cho mỗi chặng được chọn, không tự publish và không thay đổi engine promotion hiện tại.

**Tech Stack:** TypeScript, React 19 Client Components, Next.js 16 App Router, Node test runner.

---

### Task 1: Domain service tạo các chặng hợp lệ

**Files:**
- Modify: `src/lib/kpi/types.ts`
- Modify: `src/lib/kpi/program-service.ts`
- Test: `src/lib/kpi/program-service.test.ts`

- [x] **Step 1: Viết test đỏ** cho các hành vi: chỉ nối tới level cao hơn gần nhất; tạo nhiều nhánh từ các vị trí vận hành cùng cấp; không tạo chặng nhảy cấp; bỏ qua vị trí thiếu level.
- [x] **Step 2: Chạy test và xác nhận FAIL** vì API career stage chưa tồn tại.
- [x] **Step 3: Thêm `KpiCareerStageSuggestion` và `buildCareerStageSuggestions(positions)`** trả về ID ổn định, from/to position, template gợi ý và promotion preset.
- [x] **Step 4: Chạy test và xác nhận PASS.**

### Task 2: Giao diện chọn gói lộ trình

**Files:**
- Modify: `src/components/kpi/program/KPIProgramScopeStep.tsx`
- Modify: `src/app/kpi/settings/page.tsx`

- [x] **Step 1: Thêm chế độ mặc định `Lộ trình chuẩn Homies`** hiển thị bảng chặng có checkbox, nhãn bộ tiêu chuẩn và điều kiện gợi ý.
- [x] **Step 2: Giữ `Thiết lập một chặng riêng`** trong vùng nâng cao; dropdown đích chỉ hiển thị level cao hơn gần nhất.
- [x] **Step 3: Khi Admin áp dụng gói**, tạo một draft riêng cho mỗi chặng, giữ scope cửa hàng/ngày hiệu lực, nạp đúng F&B template, source policy và promotion rule; không publish.
- [x] **Step 4: Chuyển tới review của draft đầu tiên và hiển thị toast số chặng đã tạo.**

### Task 3: Tài liệu và verification

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md`
- Modify: file plan này

- [x] **Step 1: Cập nhật CODEMAP** với trách nhiệm của career stage suggestion và bulk draft creation.
- [x] **Step 2: Ghi KNOWN_ISSUES** về lỗi cho phép chọn đích quá xa và thao tác từng vị trí.
- [x] **Step 3: Chạy verification:**

```powershell
node --experimental-strip-types --test src/lib/kpi/program-service.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/program/KPIProgramScopeStep.tsx src/lib/kpi/program-service.ts src/lib/kpi/program-service.test.ts src/lib/kpi/types.ts
.\node_modules\.bin\tsc.cmd --noEmit
node --experimental-strip-types --test src/lib/kpi/*.test.ts
git diff --check
```

- [ ] **Step 4: Browser QA** desktop và mobile: chọn gói, bỏ một chặng, tạo drafts, xác nhận không có chặng nhảy cấp và không tự publish. *(Bị chặn do Browser security policy không cho truy cập `localhost:3535` trong phiên này; không dùng cách vòng.)*

Không commit trong task này vì workspace đang có nhiều thay đổi chưa commit của người dùng.
