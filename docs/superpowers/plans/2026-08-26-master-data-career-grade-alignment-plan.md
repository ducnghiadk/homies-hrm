# Master Data Career Grade Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa trang Master Data để phản ánh đúng mô hình Homies `C1-PC/C1-TN -> C2 -> C3 -> C4 -> C5`, không còn hiển thị `L1-L10`, đồng thời chuẩn hóa dữ liệu legacy bằng preview và xác nhận an toàn.

**Architecture:** Tách cách trình bày chức danh khỏi cấp năng lực bằng các hàm thuần trong adapter. Trang Master Data chỉ hiển thị nhóm `Vận hành cửa hàng` và `Khối quản lý`; dữ liệu cũ được phát hiện và đưa qua preview migration hiện có, không tự ghi hoặc tự xóa khi người dùng mở trang.

**Tech Stack:** Next.js App Router, React, TypeScript, Zustand/localStorage, Supabase adapter, Node test runner.

**Source spec:** `docs/superpowers/specs/2026-08-26-master-data-career-grade-alignment-design.md`

---

## File Map

- Modify: `src/lib/adapters/master-data-adapter.ts` — thêm kiểu trình bày chức danh, phát hiện legacy và tạo kế hoạch mapping vị trí.
- Test: `src/lib/adapters/master-data-adapter.test.ts` — khóa các quy tắc nhóm chức danh, phát hiện legacy và không xóa nhầm vị trí đang dùng.
- Modify: `src/app/settings/master-data/page.tsx` — đổi tên tab, phân nhóm thẻ, bỏ badge `Lx`, hiển thị lộ trình C và banner preview.
- Test: `src/lib/kpi/career-grade-ui-contract.test.ts` — khóa UI không quay lại các nhãn legacy và có lộ trình C.
- Modify: `src/app/kpi/settings/migration/page.tsx` — hiển thị rõ đây là preview/confirmation flow; tái sử dụng preview service, không gọi là migration đã ghi khi mới chốt checksum.
- Modify: `src/lib/kpi/career-grade-migration-service.ts` — chỉ khi cần mở rộng input mapping để nhận chức danh legacy và tạo kết quả `needs_confirmation`; giữ nguyên quy tắc không tự cấp C2.
- Test: `src/lib/kpi/career-grade-migration-service.test.ts` — bổ sung Pha chế/Thu ngân, chức danh quản lý và hồ sơ thiếu bằng chứng.
- Modify: `docs/CODEMAP.md` — ghi rõ đường đi Master Data/Career Grade sau khi tạo hành vi mới.
- Modify: `docs/KNOWN_ISSUES.md` — ghi lỗi L1-L10/legacy đã được xử lý sau khi verification đạt.

Không sửa schema Supabase hoặc công thức KPI trong plan này. Nếu bước ghi mapping thật cần thay đổi bảng/contract hiện có, dừng trước Task 4 và báo lại để tách migration riêng.

### Task 1: Khóa hành vi dữ liệu bằng test đỏ

**Files:**
- Test: `src/lib/adapters/master-data-adapter.test.ts`
- Test: `src/lib/kpi/career-grade-migration-service.test.ts`

- [ ] **Step 1: Viết test presentation cho chức danh vận hành và quản lý**

Thêm test gọi hàm thuần dự kiến `getPositionPresentation(position)` với các fixture:

```ts
assert.deepEqual(getPositionPresentation({
  id: 'pos_store_employee',
  name: 'Nhân viên cửa hàng',
  department_id: 'dept-001',
  level: 1,
  base_salary: 5500000,
  pay_type: 'hourly',
}), {
  group: 'store_operations',
  badge: 'Lộ trình năng lực',
  career_path: ['c1_pc', 'c1_tn', 'c2', 'c3'],
  legacy: false,
})
```

Kiểm tra thêm `Trưởng ca` trả `career_path: ['c4']`, `Quản lý cửa hàng` trả `career_path: ['c5']`, và `Ban giám đốc` trả `group: 'management'` với `career_path: []`.

- [ ] **Step 2: Viết test phát hiện dữ liệu legacy**

Cho input có `Pha chế`, `Thu ngân`, `L1`, `L4`, `L10`; assert preview trả đúng số dòng legacy, không xóa dòng nào và đánh dấu `Pha chế`/`Thu ngân` cần gộp về `pos_store_employee`.

- [ ] **Step 3: Viết test migration nhân viên**

Mở rộng test hiện có để khóa:

- Pha chế có bằng chứng -> gợi ý `c1_pc`, position `pos_store_employee`.
- Thu ngân có bằng chứng -> gợi ý `c1_tn`, position `pos_store_employee`.
- Có cả hai kỹ năng nhưng chưa có quyết định -> `needs_confirmation`, không tự cấp `c2`.
- Trưởng ca -> `c4`/`pos_shift_leader` nếu dữ liệu đủ.
- Quản lý cửa hàng -> `c5`/`pos_store_manager` nếu dữ liệu đủ.
- Hồ sơ không có bằng chứng -> `needs_confirmation`.

- [ ] **Step 4: Chạy test để xác nhận RED**

Run:

```powershell
node --experimental-strip-types --test src/lib/adapters/master-data-adapter.test.ts src/lib/kpi/career-grade-migration-service.test.ts
```

Expected: fail vì các hàm presentation/legacy preview chưa tồn tại hoặc chưa trả cấu trúc Homies.

### Task 2: Implement adapter thuần và giữ an toàn dữ liệu

**Files:**
- Modify: `src/lib/adapters/master-data-adapter.ts`
- Test: `src/lib/adapters/master-data-adapter.test.ts`

- [ ] **Step 1: Thêm các kiểu dữ liệu nhỏ, không đổi `PositionItem` hiện có**

Tạo các type:

```ts
export type PositionPresentationGroup = 'store_operations' | 'management'

export interface PositionPresentation {
  group: PositionPresentationGroup
  badge: 'Lộ trình năng lực' | 'Khối quản lý'
  career_path: string[]
  legacy: boolean
  canonical_position_id?: string
}

export interface LegacyPositionMapping {
  source_position_id: string
  source_name: string
  target_position_id: string
  target_name: string
  employee_count: number
  status: 'auto_convertible' | 'needs_confirmation' | 'unused'
}
```

- [ ] **Step 2: Implement `getPositionPresentation(position)`**

Use canonical IDs/names first. For legacy compatibility, normalize accents/case before matching `pha che`, `thu ngan`, `nhan vien cua hang`, `truong ca`, `quan ly cua hang`, and corporate names. Never use `level >= 3` to classify a career grade; `level` remains only legacy responsibility metadata.

- [ ] **Step 3: Implement `buildLegacyPositionMapping(positions, employees)`**

Return mappings and summary only. Count employee references from the loaded `AuthUser[]`; do not mutate localStorage, Supabase, employees, or positions. Mark legacy rows with employee references as `needs_confirmation`; rows without references as `unused`.

- [ ] **Step 4: Run adapter tests GREEN**

Run the Task 1 command. Expected: all adapter and migration tests pass, including the invariant that no function auto-assigns C2 from a title alone.

### Task 3: Sửa giao diện Master Data

**Files:**
- Modify: `src/app/settings/master-data/page.tsx`
- Test: `src/lib/kpi/career-grade-ui-contract.test.ts`

- [ ] **Step 1: Cập nhật contract test trước khi sửa JSX**

Assert source contains:

- `Vị trí công việc & Lộ trình năng lực`.
- `Khối quản lý`.
- `Lộ trình năng lực`.
- `C1-PC`, `C1-TN`, `C2`, `C3`, `C4`, `C5`.

Assert source does not render `L{pos.level}` or use the old visible title `Vị trí Công việc & Cấp bậc Level`.

- [ ] **Step 2: Đổi tên tab và tiêu đề**

Change the tab label to `Vị trí công việc & Lộ trình năng lực` and the heading to `Vị trí công việc & Lộ trình năng lực Homies`. Keep URL `?tab=positions` unchanged.

- [ ] **Step 3: Thêm banner legacy preview**

After loading positions and employees, call `buildLegacyPositionMapping`. If `needs_confirmation > 0` or `unused > 0`, render a warning with counts and CTA `Xem trước chuẩn hóa`. The CTA opens a drawer/modal with source, target, employee count, and status. It must not write data.

- [ ] **Step 4: Render cards by group**

Split positions using `getPositionPresentation`:

- `store_operations`: show `Nhân viên cửa hàng`, `Trưởng ca`, `Quản lý cửa hàng` with career path badges.
- `management`: show corporate positions with `Khối quản lý` and no C/L badge.
- legacy rows: show a warning badge and link to preview, not a false canonical grade.

Keep existing edit/delete buttons, salary display, department display, and delete guard behavior. Do not silently delete or rename positions.

- [ ] **Step 5: Run UI contract and lint**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/career-grade-ui-contract.test.ts
.\node_modules\.bin\eslint.cmd src/app/settings/master-data/page.tsx src/lib/adapters/master-data-adapter.ts src/lib/kpi/career-grade-migration-service.ts
```

Expected: UI contract passes and ESLint reports zero errors.

### Task 4: Làm rõ màn hình migration/preview

**Files:**
- Modify: `src/app/kpi/settings/migration/page.tsx`
- Modify: `src/lib/kpi/career-grade-migration-service.ts`
- Test: `src/lib/kpi/career-grade-migration-service.test.ts`

- [ ] **Step 1: Giữ rõ trạng thái dry-run**

Keep the existing `Chốt checksum` behavior as preview-only. Rename supporting copy so it says `Xác nhận bản xem trước`, not `Đã chuyển dữ liệu`. The button must not imply that employee positions or grades have been written.

- [ ] **Step 2: Hiển thị mapping đúng mô hình**

For every item show old title, canonical position, suggested grade, inferred skills, evidence, and status. `needs_confirmation` rows require an explicit HR selection before they can be considered ready.

- [ ] **Step 3: Add a safe apply boundary only if existing adapters support it**

If the current employee adapter and repository expose a transactional update path, add an explicit `Áp dụng sau khi duyệt` action that updates position/placement and records the checksum. If no transactional path exists, keep this task preview-only and show `Cần migration dữ liệu riêng` instead of adding partial writes.

- [ ] **Step 4: Test both outcomes**

Assert preview remains deterministic and that an unresolved employee cannot be applied. If apply is not implemented, assert no write method is called by the preview/ checksum action.

### Task 5: Documentation and regression record

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md`

- [ ] **Step 1: Update CODEMAP**

Add the Master Data/Career Grade entry points, helper functions, migration preview page, and test files without duplicating existing CODEMAP sections.

- [ ] **Step 2: Update KNOWN_ISSUES after the fix**

Record the original symptom (`L1-L10`, legacy Pha chế/Thu ngân), root cause (persisted `chuc_vu`/localStorage wins over new seed), safe preview behavior, and the exact files changed.

### Task 6: Full verification and review

**Files:** all files in the File Map.

- [ ] **Step 1: Run focused career-grade tests**

```powershell
node --experimental-strip-types --test src/lib/adapters/master-data-adapter.test.ts src/lib/kpi/career-grade-migration-service.test.ts src/lib/kpi/career-grade-ui-contract.test.ts
```

Expected: zero failures.

- [ ] **Step 2: Run relevant broader tests**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-grade-*.test.ts src/lib/kpi/career-map-*.test.ts
```

Expected: all career-grade and career-map tests pass.

- [ ] **Step 3: Run static checks**

```powershell
.\node_modules\.bin\eslint.cmd src/app/settings/master-data/page.tsx src/app/kpi/settings/migration/page.tsx src/lib/adapters/master-data-adapter.ts src/lib/kpi/career-grade-migration-service.ts src/lib/adapters/master-data-adapter.test.ts src/lib/kpi/career-grade-migration-service.test.ts src/lib/kpi/career-grade-ui-contract.test.ts
.\node_modules\.bin\tsc.cmd --noEmit
git diff --check
```

- [ ] **Step 4: Run production verification**

```powershell
cmd /c npm run build
cmd /c npm run ai:ready
```

Expected: build succeeds; if `ai:ready` reports pre-existing mojibake files outside this scope, record them separately and do not expand this fix.

- [ ] **Step 5: Manual acceptance**

1. Open `Cài đặt hệ thống -> Danh mục Nhân sự -> Vị trí công việc & Lộ trình năng lực`.
2. Confirm no visible `L1`, `L4`, `L10` badges remain.
3. Confirm operational cards show C1/C2/C3/C4/C5 paths.
4. Confirm corporate cards show `Khối quản lý`.
5. Confirm legacy data shows preview warning instead of being deleted.
6. Refresh the page and confirm the same classification remains.

- [ ] **Step 6: Review diff and report exact residuals**

Check only the File Map, preserve unrelated dirty changes, and report any unresolved data migration requirement before claiming completion.

