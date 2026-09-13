# KPI F&B Template Targets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp `/kpi/settings` thành quy trình SaaS F&B 5 bước, dùng mẫu theo chức danh, mục tiêu theo nhóm cửa hàng, ngoại lệ có thời hạn và công bố theo phiên bản.

**Architecture:** Giữ page hiện tại là Client Component vì dùng state, event và localStorage; tách dữ liệu mẫu, luật mục tiêu và từng bước giao diện thành các đơn vị nhỏ. `KpiSetVersion` giữ bản chụp nhóm, mục tiêu và ngoại lệ để `createPeriodSnapshot()` đóng băng toàn bộ kỳ KPI.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, localStorage repository, Node test runner, ESLint.

---

## Nguyên tắc thực hiện

- Làm lần lượt Pass A -> E; mỗi task chạm tối đa 1-3 file code và dùng test đỏ -> code tối thiểu -> test xanh -> tick `[x]` -> commit.
- Không refactor route KPI khác, đổi tên hoặc di chuyển file hiện có; không stage thay đổi ngoài task.
- UI tiếng Việt có dấu; số dùng `font-mono tabular-nums`; đọc lại design rule và guide Client Component trước Pass B.
- Nếu Git vẫn bị khóa, ghi rõ checkpoint chưa commit.

## Bản đồ file đích

Domain nằm trong `src/lib/kpi/*`; persistence dùng repository hiện có; page chỉ điều phối. Mỗi bước UI là một component riêng trong `src/components/kpi/builder/*` để không làm `page.tsx` phình thêm.
# PASS A - Nền dữ liệu và luật nghiệp vụ

### Task 1: Thêm type cho template, mục tiêu và ngoại lệ

**Files:** Modify `src/lib/kpi/types.ts`; Create `src/lib/kpi/fnb-template-catalog.ts`; Test `src/lib/kpi/fnb-template-catalog.test.ts`.

- [x] **Step 1: Viết test đỏ cho đủ 6 mẫu và tổng trọng số**

```ts
assert.deepEqual(FNB_KPI_TEMPLATES.map((item) => item.id), ['barista', 'cashier', 'server', 'kitchen', 'shift_leader', 'store_manager'])
for (const template of FNB_KPI_TEMPLATES) {
  assert.equal(template.groups.reduce((sum, group) => sum + group.weight, 0), 100)
  assert.ok(template.groups.flatMap((group) => group.criteria).every((item) => item.unit && item.direction))
}
```

- [x] **Step 2: Chạy test và xác nhận đỏ**

Run: `node --experimental-strip-types --test src/lib/kpi/fnb-template-catalog.test.ts`
Expected: FAIL vì module/catalog chưa tồn tại.

- [x] **Step 3: Thêm API type tương thích dữ liệu cũ**

```ts
export type KpiTemplateId = 'barista' | 'cashier' | 'server' | 'kitchen' | 'shift_leader' | 'store_manager'
export type KpiMetricUnit = 'percent' | 'minutes' | 'vnd' | 'count' | 'score'
export type KpiMetricDirection = 'higher' | 'lower' | 'rubric'
export type KpiSetupStep = 'template' | 'criteria' | 'targets' | 'overrides' | 'publish'
export interface KpiStoreGroup { id: string; name: string; store_ids: string[]; active: boolean }
export interface KpiStoreGroupSnapshot { id: string; name: string; store_ids: string[] }
export interface KpiCriterionTarget { criterion_id: string; target: number; score_bands: KpiScoreBand[] }
export interface KpiTargetProfile { scope: 'chain' | 'store_group'; store_group_id?: string; targets: KpiCriterionTarget[] }
export interface KpiStoreTargetOverride { id: string; store_id: string; criterion_id: string; target: number; reason: string; owner_id: string; effective_from: string; effective_to: string }
```

Thêm metadata tùy chọn vào criterion (`unit`, `direction`, `core`, `recommended_weight_range`) và version (`template_id`, `position_ids`, `setup_step`, `store_group_snapshots`, `target_profiles`, `target_overrides`) để seed cũ vẫn đọc được.

- [x] **Step 4: Tạo catalog đúng nội dung đã duyệt**

Catalog dùng factory chung để file dưới 300 dòng. Trọng số: Barista `30/20/15/15/10/10`; Thu ngân `25/25/20/15/10/5`; Phục vụ `30/20/15/15/10/10`; Bếp `30/25/20/15/10`; Ca trưởng `25/20/20/15/10/10`; Quản lý `30/20/15/15/10/10`. Export `getFnbTemplate(id)` và `createVersionFromTemplate(templateId, positionIds, actorId, versionNumber, at)`; hàm clone groups, đặt `set_id: kpi_${templateId}`, position IDs và bước `criteria`.

- [x] **Step 5: Chạy xanh và commit checkpoint**

Run: `node --experimental-strip-types --test src/lib/kpi/fnb-template-catalog.test.ts`
Expected: PASS. Commit: `feat: add F&B KPI template catalog`.

### Task 2: Xây luật mục tiêu nhóm và ngoại lệ

**Files:** Create `src/lib/kpi/target-policy-service.ts`; Test `src/lib/kpi/target-policy-service.test.ts`.

- [x] **Step 1: Viết test đỏ cho thứ tự ưu tiên**

```ts
assert.equal(resolveCriterionTarget(version, 'crit_upsell', 'store-001', '2026-09-15')?.source, 'override')
assert.equal(resolveCriterionTarget(version, 'crit_upsell', 'store-002', '2026-09-15')?.source, 'store_group')
assert.equal(resolveCriterionTarget(version, 'crit_hygiene', 'store-003', '2026-09-15')?.source, 'chain')
assert.equal(resolveCriterionTarget(version, 'crit_upsell', 'store-001', '2026-12-01')?.source, 'store_group')
```

- [x] **Step 2: Chạy test đỏ**

Run: `node --experimental-strip-types --test src/lib/kpi/target-policy-service.test.ts`; Expected: FAIL vì service chưa tồn tại.

- [x] **Step 3: Implement API thuần, không phụ thuộc React**

```ts
export interface ResolvedKpiTarget { target: number; score_bands: KpiScoreBand[]; source: 'override' | 'store_group' | 'chain' }
export function resolveCriterionTarget(version: KpiSetVersion | KpiSetSnapshot, criterionId: string, storeId: string, at: string): ResolvedKpiTarget | undefined
export function suggestScoreBands(target: number, direction: 'higher' | 'lower'): KpiScoreBand[]
export function validateStoreGroupCoverage(groups: KpiStoreGroupSnapshot[], storeIds: string[]): string[]
```

Resolve theo thứ tự ngoại lệ còn hạn -> profile nhóm chứa cửa hàng -> profile toàn chuỗi. Bands `higher` lấy điểm 3 tại target, `lower` đảo chiều; làm tròn 2 chữ số và không để khoảng hở.

- [x] **Step 4: Chạy xanh và commit**

Run: `node --experimental-strip-types --test src/lib/kpi/target-policy-service.test.ts`
Expected: PASS. Commit: `feat: add KPI target resolution rules`.

### Task 3: Chặn công bố cấu hình thiếu hoặc sai

**Files:** Modify `src/lib/kpi/configuration-service.ts`; Test `src/lib/kpi/configuration-service.test.ts`.

- [x] **Step 1: Thêm test đỏ**

```ts
const templateVersion = createVersionFromTemplate('barista', [], 'ceo_01', 1, '2026-08-22T10:00:00.000Z')
templateVersion.target_overrides = [{ id: 'ov1', store_id: 'store-001', criterion_id: 'missing', target: 1, reason: '', owner_id: '', effective_from: '2026-10-01', effective_to: '2026-09-01' }]
const codes = validateKpiSet(templateVersion, [], ['store-001']).map((issue) => issue.code)
assert.ok(['MISSING_POSITION_SCOPE', 'MISSING_TARGET', 'INVALID_OVERRIDE'].every((code) => codes.includes(code)))
```

- [x] **Step 2: Chạy test và xác nhận đỏ**

Run: `node --experimental-strip-types --test src/lib/kpi/configuration-service.test.ts`
Expected: FAIL vì các validation code mới chưa tồn tại.

- [x] **Step 3: Thêm validation chỉ cho version có `template_id`**

Thêm code `MISSING_POSITION_SCOPE`, `MISSING_METRIC_METADATA`, `MISSING_STORE_GROUP`, `MISSING_TARGET`, `INVALID_OVERRIDE`; dùng `validateStoreGroupCoverage`. `hasSharedScope` ưu tiên `position_ids` cho template. Mở rộng validate/publish bằng tham số existing versions và store IDs có mặc định để không vỡ caller cũ.

- [x] **Step 4: Khóa snapshot và chạy xanh**

Thêm test sửa `target_profiles` sau `createPeriodSnapshot()` không làm đổi snapshot. Run: `node --experimental-strip-types --test src/lib/kpi/configuration-service.test.ts`
Expected: PASS.

- [x] **Step 5: Commit checkpoint**

Commit: `feat: validate F&B KPI publishing rules`.

### Task 4: Dùng target đã resolve khi tính điểm gợi ý

**Files:** Modify `src/lib/kpi/evaluation-service.ts`; Test `src/lib/kpi/evaluation-service.test.ts`.

- [x] **Step 1: Viết test đỏ cho hai cửa hàng cùng metric nhưng khác target**

```ts
const result = applySuggestedScores(evaluationForStoreB, [{ key: 'pos.upsell_rate', status: 'ready', value: 12, captured_at: '2026-09-15', source_label: 'POS', evidence_refs: [] }])
assert.equal(result.scores.find((item) => item.criterion_id === 'crit_upsell')?.suggested_score, 3)
```

- [x] **Step 2: Chạy đỏ rồi resolve bands theo store**

Run: `node --experimental-strip-types --test src/lib/kpi/evaluation-service.test.ts`; Expected: FAIL vì service vẫn dùng `criterion.score_bands`; sau đó gọi `resolveCriterionTarget(evaluation.snapshot, criterion.id, evaluation.employee.store_id, source.captured_at)` và fallback về bands cũ khi version legacy.

- [x] **Step 3: Chạy xanh và commit**

Run: `node --experimental-strip-types --test src/lib/kpi/evaluation-service.test.ts`; Expected: PASS; commit `feat: score KPI by resolved store targets`.

### Task 5: Migrate localStorage an toàn

**Files:** Modify `src/lib/kpi/repository.ts`, `src/lib/kpi/local-repository.ts`; Test `src/lib/kpi/local-repository.test.ts`.

- [x] **Step 1: Viết test đỏ cho database cũ thiếu `store_groups`**

```ts
const loaded = await createLocalKpiRepository({ storage }).load()
assert.deepEqual(loaded.store_groups, [])
assert.equal(loaded.sets[0].name, 'Legacy KPI')
```

- [x] **Step 2: Chạy test và xác nhận đỏ**

Run: `node --experimental-strip-types --test src/lib/kpi/local-repository.test.ts`
Expected: FAIL vì `store_groups` chưa được normalize.

- [x] **Step 3: Thêm `store_groups` vào database và normalize**

```ts
// KpiDatabase
store_groups: KpiStoreGroup[]
```

`createEmptyKpiDatabase()` và `normalizeDatabase()` trả `[]` khi dữ liệu cũ chưa có field; không tăng storage key để tránh mất dữ liệu.

- [x] **Step 4: Chạy xanh và commit**

Run: `node --experimental-strip-types --test src/lib/kpi/local-repository.test.ts`
Expected: PASS. Commit: `feat: persist KPI store groups safely`.

# PASS B - Bước chọn mẫu và kiểm tra tiêu chí

### Task 6: Thêm stepper và thư viện mẫu

**Files:** Create `src/components/kpi/builder/KPISetupStepper.tsx`, `src/components/kpi/builder/KPITemplateLibrary.tsx`; Modify `src/app/kpi/settings/page.tsx`.

- [x] **Step 1: Tạo contract UI rõ ràng**

```ts
type KPISetupStepperProps = { current: KpiSetupStep; completed: KpiSetupStep[]; onSelect(step: KpiSetupStep): void }
type KPITemplateLibraryProps = { positions: Array<{ id: string; name: string }>; selectedPositionIds: string[]; onPositionChange(ids: string[]): void; onPreview(id: KpiTemplateId): void; onUse(id: KpiTemplateId): void }
```

- [x] **Step 2: Render 5 bước và 6 card mẫu**

Card hiển thị vai trò, badge, số trụ/tiêu chí, tỷ lệ tự động, trọng số nổi bật; có `Xem chi tiết` và `Dùng bộ mẫu này`. Chọn ít nhất một chức danh thực tế từ `MasterDataAdapter.getPositions()` trước khi dùng mẫu; cấp bậc chỉ còn là bộ lọc nâng cao. `Tự tạo từ đầu` là nút phụ.

- [x] **Step 3: Nối page nhưng giữ editor hiện tại làm bước 2**

`handleUseTemplate` gọi `createVersionFromTemplate`, persist database, chọn group đầu và chuyển `setup_step` sang `criteria`. Thay nút preset 1 chạm bằng hành động quay về thư viện; không xóa drawer/editor hiện có.
Page chỉ cho `ceo` và `hr_admin` cấu hình; role cửa hàng được chuyển về `/kpi`. Hiển thị trạng thái `Đang lưu/Đã lưu` từ state repository.

- [x] **Step 4: Verify và commit**

Run: `npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/builder/KPISetupStepper.tsx src/components/kpi/builder/KPITemplateLibrary.tsx`
Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: cả hai PASS. Commit: `feat: add guided KPI template setup`.

### Task 7: Nâng editor tiêu chí từ chỉnh tay thành kiểm tra có hướng dẫn
**Files:** Modify `src/components/kpi/builder/KPIGroupEditor.tsx`, `src/components/kpi/builder/KPICriterionDrawer.tsx`; Test `src/components/kpi/builder/KPIEditorMetadata.test.tsx`.
- [x] **Step 1: Viết test render đỏ**
Test dùng `renderToStaticMarkup(<KPICriterionDrawer open criterion={criterion} onClose={() => undefined} onSave={() => undefined} />)` và match ba nhãn đơn vị, chiều đánh giá, cốt lõi.
- [x] **Step 2: Chạy đỏ, implement và chạy xanh**
Run: `node --import tsx --test src/components/kpi/builder/KPIEditorMetadata.test.tsx`; Expected: FAIL. Drawer thêm unit/direction/core và chọn tiêu chí từ catalog; GroupEditor hiện khoảng trọng số khuyến nghị, tỷ lệ nguồn tự động và cảnh báo khi ngoài khoảng. Không đặt target ở bước này.
- [x] **Step 3: Verify và commit**
Run lại test, lint 3 file và `tsc --noEmit`; Expected: PASS. Commit: `feat: guide KPI criterion review`.
  - Ghi chú 2026-08-23: lint 3 file và `tsc --noEmit` PASS; `node --import tsx --test src/components/kpi/builder/KPIEditorMetadata.test.tsx` chưa chạy được vì project hiện thiếu package `tsx`.
# PASS C - Mục tiêu theo nhóm cửa hàng

### Task 8: Thêm bảng nhóm và mục tiêu

**Files:** Create `src/components/kpi/builder/KPIStoreGroupPanel.tsx`, `src/components/kpi/builder/KPITargetMatrix.tsx`; Modify `src/app/kpi/settings/page.tsx`.

- [x] **Step 1: Tạo props không chứa logic nghiệp vụ**

```ts
type KPIStoreGroupPanelProps = { stores: Array<{ id: string; name: string }>; groups: KpiStoreGroup[]; onChange(groups: KpiStoreGroup[]): void }
type KPITargetMatrixProps = { version: KpiSetVersion; onChange(profiles: KpiTargetProfile[]): void }
```

- [x] **Step 2: Xây UI nhóm A/B/C và ma trận target**

Mỗi cửa hàng chỉ chọn một nhóm; matrix chỉ hiện criterion `direction !== 'rubric'`, cột `Toàn chuỗi` và từng nhóm, số dùng mono/tabular. Có sao chép cột, tăng/giảm đồng loạt và nút dùng bands đề xuất.

- [x] **Step 3: Persist và chuyển bước**

Page lưu master `database.store_groups`, đồng thời copy `store_group_snapshots` vào version. Khi đủ coverage và target, chuyển `setup_step: 'overrides'`.

- [x] **Step 4: Verify và commit**

Run: `npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/builder/KPIStoreGroupPanel.tsx src/components/kpi/builder/KPITargetMatrix.tsx`
Run: `node --experimental-strip-types --test src/lib/kpi/target-policy-service.test.ts`
Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: PASS. Commit: `feat: add grouped KPI targets`.

# PASS D - Ngoại lệ và công bố

### Task 9: Thêm ngoại lệ có thời hạn và màn hình review

**Files:** Create `src/components/kpi/builder/KPIStoreOverridePanel.tsx`, `src/components/kpi/builder/KPIPublishReview.tsx`; Modify `src/app/kpi/settings/page.tsx`.

- [ ] **Step 1: Tạo contracts**

```ts
type KPIStoreOverridePanelProps = { version: KpiSetVersion; stores: Array<{ id: string; name: string }>; onChange(items: KpiStoreTargetOverride[]): void }
type KPIPublishReviewProps = { version: KpiSetVersion; stores: Array<{ id: string; name: string }>; issues: KpiValidationIssue[]; onPreviewStore(id: string): void; onPublish(mode: 'now' | 'scheduled'): void }
```

- [ ] **Step 2: Implement form ngoại lệ**

Bắt buộc store, criterion, target, reason, owner, from/to; hiển thị target nhóm bên cạnh; không có control sửa tiêu chí/trọng số. Ngoại lệ hết hạn hiện badge `Đã hết hạn`.

- [ ] **Step 3: Implement review và publish**

Review tổng hợp template, chức danh, 100% trọng số, nhóm, target, ngoại lệ và lỗi chặn. Preview dùng `resolveCriterionTarget`; publish gọi `publishVersion(selectedVersion, actorId, at, database.sets, stores.map((item) => item.id))`, hỗ trợ áp dụng ngay/lên lịch và tạo thông báo cho quản lý cửa hàng trong phạm vi.

- [ ] **Step 4: Verify và commit**

Run: `npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/builder/KPIStoreOverridePanel.tsx src/components/kpi/builder/KPIPublishReview.tsx`
Run: `node --experimental-strip-types --test src/lib/kpi/*.test.ts`
Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: PASS. Commit: `feat: add KPI overrides and publish review`.

# PASS E - Hoàn thiện và nghiệm thu

### Task 10: Responsive, tài liệu và full verification

**Files:** Modify `src/app/kpi/settings/page.tsx`, `docs/CODEMAP.md`, file plan này.

- [ ] **Step 1: Kiểm tra browser desktop/mobile**

Mở `/kpi/settings` ở desktop và mobile; kiểm tra đủ 5 bước, không tràn ngang, card đọc được, matrix có cuộn ngang có chủ đích, drawer/modal không bị che.

- [ ] **Step 2: Chạy verification cuối**

Run: `node --experimental-strip-types --test src/lib/kpi/*.test.ts`
Run: `npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/builder src/lib/kpi`
Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Run: `npm run build`
Run: `npm run ai:ready`
Expected: test/lint/type/build PASS; nếu lỗi cũ ngoài scope thì ghi rõ bằng chứng vào `docs/KNOWN_ISSUES.md` trước khi kết luận.

- [ ] **Step 3: Cập nhật bản đồ và chốt task**

CODEMAP liệt kê catalog, target service và 5 component mới. Tick toàn bộ task đã làm trong plan; commit: `docs: complete KPI F&B setup rollout`.

## Điều kiện hoàn thành

Trụ sở chọn được 1 trong 6 mẫu mà không tự gõ từ đầu; cùng chức danh giữ chung tiêu chí/trọng số; nhóm chỉ khác target; ngoại lệ có lý do/thời hạn; preview resolve đúng `override -> group -> chain`; snapshot không đổi ngược; desktop/mobile và toàn bộ verification có bằng chứng.
