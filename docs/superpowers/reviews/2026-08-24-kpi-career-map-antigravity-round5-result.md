# Báo Cáo Kết Quả Thực Hiện Correction Prompt Vòng 5 (KPI Career Map & Promotion Data Truth)

## 1. Verdict

- **Trạng thái sau Codex rà soát Pass B-D**: `PARTIAL`

### Trạng thái pass

- [x] Pass A - SQL migration/static contract: đã sửa fail-closed organization, tenant scope, placement thiếu chức danh và schema `kpi_sets`.
- [ ] Pass A runtime - Chưa chạy migration/rollback matrix trên Postgres thật.
- [x] Pass B - Promotion data truth và strict validation context.
- [x] Pass C - Một aggregate callback, một repository revision cho mỗi thao tác Career Map.
- [x] Pass D - Ngoại lệ một chặng tạo và persist đúng một bản nháp, không publish.
- **Ghi chú điều kiện môi trường**:
  - Codebase & Unit Tests: PASS (242/242 KPI tests, gồm 10 SQL contracts, atomic aggregate và single-stage draft thật).
  - TypeScript (`npx tsc --noEmit`): 100% PASS (Exit code 0, 0 errors).
  - Next.js Production Build (`npm run build`): 100% PASS (143/143 static pages compiled successfully).
  - Supabase Runtime: `NOT RUN` (Supabase CLI không được cài đặt trên môi trường Windows local).
  - Browser Scenarios: `NOT RUN` (lớp bảo mật Browser Use từ chối truy cập tab localhost trong lần Codex xác minh).
  - Ghi chú: không được coi là production-ready cho tới khi Pass A chạy trên Supabase thật và browser scenarios có bằng chứng.

---

## 2. Changed Files

1. `src/lib/kpi/career-map-deployment-service.ts`
   - *Lý do*: Xóa bỏ hoàn toàn việc sinh điểm mock/dữ liệu giả (`85/86`, `months_in_level: 6`, `eligible_for_test`) trong hàm `buildPromotionDossiers()`. Tích hợp logic đánh giá thực từ `evaluatePromotionEligibility()`. Bắt buộc tham số `profiles` khi `submitCareerMapForApproval()` và `publishCareerMap()`.
2. `src/app/kpi/promotion/page.tsx`
   - *Lý do*: Loại bỏ hoàn toàn fallback tĩnh `buildDossiers()` và 4 hàm tạo mock dossier (`createEligiblePt2ToSeniorDossier`, `createSeniorTestingDossier`, `createBlockedPt1PcDossier`). Render Empty State trung thực khi không có dữ liệu placement hoặc không thuộc phạm vi quản lý.
3. `src/lib/kpi/career-map-types.ts`
   - *Lý do*: Khóa chặt interface `CareerMapAggregateChange` với trường `profiles: KpiPositionCriteriaProfile[]` bắt buộc (không còn optional), đảm bảo tính nguyên tử trong single-revision persistence.
4. `src/lib/kpi/career-map-service.ts`
   - *Lý do*: Bổ sung strict validation mode cho `validateCareerMap()` (`missing_profile_context`, `master_position_inactive_or_missing`), kiểm tra hội tụ quản lý (`no_management_convergence`), và xuất hàm phân quyền `canEditCareerMapStructure()`.
5. `supabase/migrations/20260824_kpi_career_map_round4_fix.sql`
   - *Lý do*: Cập nhật RPC `publish_kpi_career_map()` giải quyết tổ chức thật từ actor (`to_chuc_id`), tự động tạo `kpi_sets` thật trước khi tạo `kpi_set_versions`, tính toán `version_no` thật theo từng `set_id` mà không dùng fallback `gen_random_uuid()`, loại trừ nhân viên thiếu `store_id` an toàn (`excluded_count`) không vi phạm NOT NULL foreign key.
6. `src/lib/kpi/supabase-repository.ts`
   - *Lý do*: Cập nhật `createDefaultSupabaseKpiGateway` hỗ trợ client injection, ném lỗi ngay khi select reconciliation, delete hoặc upsert gặp lỗi thay vì bỏ qua âm thầm.
7. `src/components/kpi/career-map/KPICareerMapDesigner.tsx`
   - *Lý do*: Nhận `userRole`, truyền đầy đủ snapshot chức danh `positions` và `userRole` xuống `KPICareerMapCanvas`, kích hoạt `onAggregateChange` cho tất cả thao tác thêm vị trí, cập nhật profile, sửa sơ đồ.
8. `src/components/kpi/career-map/KPICareerMapCanvas.tsx`
   - *Lý do*: Áp dụng quy tắc phân quyền nghiêm ngặt `canEditCareerMapStructure` (chỉ `hr_admin` trên desktop được sửa trạng thái `draft`/`returned`, mobile luôn read-only, các role khác read-only). Xóa bỏ fallback tạo snapshot giả `{ id, name: id }` khi kéo thả vị trí.
9. `src/components/kpi/program/KPIProgramScopeStep.tsx`
   - *Lý do*: Truyền đầy đủ các thuộc tính của `KpiCareerPositionSnapshot` (`department_id`, `job_family`, `base_salary`, `pay_type`, `active`) và `userRole` vào `KPICareerMapDesigner`.
10. `src/components/kpi/program/KPISingleStageExceptionPanel.tsx` (Mới)
    - *Lý do*: Xây dựng giao diện cấu hình ngoại lệ đơn chặng thực thụ: chọn chặng liền kề, chọn preset promotion hiện có, custom KPI score & months, chọn phạm vi quán, chọn ngày hiệu lực, live preview tác động nhân sự và gọi service lưu bản nháp.
11. `src/app/kpi/settings/page.tsx`
    - *Lý do*: Tích hợp `KPISingleStageExceptionPanel` vào tab `single_stage`, persist đúng một `KpiSetVersion` draft, mở draft vừa tạo và không publish trực tiếp; đồng thời chỉ persist một revision cho mỗi Career Map aggregate change.
12. `src/lib/kpi/career-map-deployment-service.test.ts`
    - *Lý do*: Bổ sung regression test cho dữ liệu thăng tiến rỗng, thiếu kết quả đánh giá, xác thực bắt buộc profiles khi submit/publish.
13. `src/lib/kpi/career-map-service.test.ts`
    - *Lý do*: Bổ sung regression test cho strict validation, thiếu profile context, master position bị vô hiệu hóa, sơ đồ rỗng `empty_map`.
14. `src/lib/kpi/career-map-sql-contract.test.ts`
    - *Lý do*: Bổ sung regression test cho việc không sinh random UUID cho `set_id`/`org_id`, tạo `kpi_sets` thật, và loại trừ an toàn nhân viên thiếu `store_id`.
15. `src/lib/kpi/supabase-repository.test.ts`
    - *Lý do*: Bổ sung test trực tiếp chuỗi gọi của default gateway (`.select`, `.delete`, `.in`, `.upsert`) và kiểm tra lan truyền lỗi (error propagation).
16. `src/components/kpi/career-map/KPICareerMapRolePolicy.test.ts` (Mới)
    - *Lý do*: Unit test kiểm tra ma trận phân quyền chỉnh sửa sơ đồ theo role và thiết bị (Desktop vs Mobile).

---

## 3. Blocker-by-Blocker Evidence

### Blocker 1: SQL Foreign Key Integrity & Organization Resolution
- **Triệu chứng cũ**: RPC `publish_kpi_career_map` sử dụng `COALESCE(..., gen_random_uuid())` cho `set_id` và `org_id` khi tạo `kpi_set_versions`. Nếu vị trí chưa có hàng trong `kpi_sets`, câu lệnh chèn vào `kpi_set_versions` vi phạm khóa ngoại hoặc trỏ vào UUID ảo không tồn tại.
- **Root Cause**: Thiếu bước giải quyết tổ chức thật của actor từ `public.nhan_vien` và thiếu câu lệnh `INSERT INTO public.kpi_sets` trước khi tạo phiên bản.
- **Test RED & Assertion**:
  ```ts
  assert.ok(!round4Sql.includes('COALESCE((SELECT s.id FROM public.kpi_sets ...), gen_random_uuid())'))
  assert.ok(!round4Sql.includes('COALESCE((SELECT to_chuc_id FROM public.nhan_vien ...), gen_random_uuid())'))
  ```
- **File & Hàm đã sửa**: `supabase/migrations/20260824_kpi_career_map_round4_fix.sql` trong RPC `publish_kpi_career_map()`.
- **Test GREEN**: `career-map-sql-contract.test.ts` -> `resolves real organization and creates real kpi_sets instead of fabricating random UUID foreign keys` (PASS).
- **Hành vi người dùng sau fix**: Khi CEO công bố lộ trình, toàn bộ `kpi_sets` thật được tạo trong đúng tổ chức của doanh nghiệp, các `kpi_set_versions` liên kết chính xác khóa ngoại `set_id` và tính đúng số thứ tự `version_no`.

---

### Blocker 2: Placement Null Foreign Key & Dropped Staff Exclusion
- **Triệu chứng cũ**: Nhân viên thiếu `cua_hang_id` (`store_id` = NULL) bị chèn trực tiếp vào bảng `kpi_career_employee_placements` vốn có ràng buộc `store_id UUID NOT NULL REFERENCES public.cua_hang(id)`, gây lỗi runtime rollback toàn bộ giao dịch.
- **Root Cause**: Vòng lặp placement trong SQL không kiểm tra `v_emp.store_id IS NULL` trước khi insert.
- **Test RED & Assertion**:
  ```ts
  assert.ok(round4Sql.includes('v_emp.store_id IS NULL'))
  assert.ok(round4Sql.includes('v_excluded_count'))
  ```
- **File & Hàm đã sửa**: `supabase/migrations/20260824_kpi_career_map_round4_fix.sql`.
- **Test GREEN**: `career-map-sql-contract.test.ts` -> `safely handles employee placements without inserting null into store foreign key` (PASS).
- **Hành vi người dùng sau fix**: Nhân viên chưa gán cửa hàng được thống kê vào `excluded_count` thay vì làm sập giao dịch. Kết quả trả về gồm `{ placed_count, unresolved_count, excluded_count, kpi_sets_created }`.

---

### Blocker 3: Promotion Data Truth (No Mock Dossiers)
- **Triệu chứng cũ**: `buildPromotionDossiers()` trả về điểm giả `85/86`, fake `months_in_level: 6`, và `eligible_for_test` mặc định. Trang `src/app/kpi/promotion/page.tsx` chứa 4 hàm tạo mock dossiers khi không có dữ liệu thực.
- **Root Cause**: Mã nguồn giữ lại dữ liệu demo hardcoded từ giai đoạn prototype.
- **Test RED & Assertion**:
  ```ts
  it('returns an empty array when placements are empty and never falls back to fabricated dossiers', () => {
    const dossiers = buildPromotionDossiers([], [], positions, currentMap)
    assert.equal(dossiers.length, 0)
  })
  it('keeps a dossier not eligible when required evaluation data is missing', () => {
    const dossiers = buildPromotionDossiers([placement], [], positions, currentMap)
    assert.equal(dossiers[0].stageLabel, 'Chưa đủ dữ liệu đánh giá')
    assert.equal(dossiers[0].eligibilityStatus, 'not_eligible')
  })
  ```
- **File & Hàm đã sửa**: `src/lib/kpi/career-map-deployment-service.ts` và `src/app/kpi/promotion/page.tsx`.
- **Test GREEN**: `career-map-deployment-service.test.ts` -> 16/16 tests PASS.
- **Hành vi người dùng sau fix**: Màn hình xét thăng tiến hiển thị trung thực trạng thái "Chưa đủ dữ liệu đánh giá" hoặc Empty State sạch sẽ khi chưa có dữ liệu chấm công / đánh giá KPI thực tế.

---

### Blocker 4: Pre-mutation Validation & Atomic Transaction
- **Triệu chứng cũ**: Một số kiểm tra toàn vẹn đồ thị (như kiểm tra vòng lặp, kiểm tra cấp bậc đường nối, kiểm tra bộ tiêu chí) diễn ra sau khi đã thực hiện một phần các lệnh `UPDATE`/`DELETE`, có nguy cơ để lại trạng thái dở dang nếu xảy ra lỗi giữa chừng.
- **Root Cause**: Thiếu quy trình 12 bước tiền kiểm tra (pre-mutation validation) toàn diện ở đầu RPC.
- **Test RED & Assertion**: Kiểm tra thứ tự logic trong SQL migration đảm bảo mọi điều kiện (Role CEO, ngày hiệu lực, sơ đồ không rỗng, profile tồn tại, tổng trọng số 100%, đường nối hợp lệ, tổ chức hợp lệ) được kiểm tra trước lệnh `UPDATE kpi_career_map_versions SET status = 'superseded'`.
- **File & Hàm đã sửa**: `supabase/migrations/20260824_kpi_career_map_round4_fix.sql` & `src/lib/kpi/career-map-service.ts`.
- **Test GREEN**: `career-map-sql-contract.test.ts` -> `the publish RPC validates status role date graph criteria presets before mutation` (PASS).
- **Hành vi người dùng sau fix**: Nếu sơ đồ có bất kỳ vi phạm nào, toàn bộ giao dịch bị từ chối ngay lập tức, không thay đổi bất kỳ bản ghi nào trong cơ sở dữ liệu.

---

### Blocker 5: Atomic UI & Role/Device Policy
- **Triệu chứng cũ**: Designer/Canvas kích hoạt đồng thời 3 callbacks riêng biệt (`onChange`, `onUpdateProfiles`, `onAggregateChange`), dẫn đến 3 lần ghi đè revision lên repository. Canvas thiếu thông tin chức danh chi tiết và role người dùng.
- **Root Cause**: Chưa quy chuẩn event model về một sự kiện tổng thể duy nhất `CareerMapAggregateChange` và chưa tích hợp ma trận quyền thiết bị.
- **Test RED & Assertion**:
  ```ts
  it('allows only hr_admin to edit draft and returned status on desktop', () => {
    assert.equal(canEditCareerMapStructure('hr_admin', 'draft', false), true)
  })
  it('disallows editing on mobile regardless of role', () => {
    assert.equal(canEditCareerMapStructure('hr_admin', 'draft', true), false)
  })
  ```
- **File & Hàm đã sửa**: `src/lib/kpi/career-map-service.ts`, `src/components/kpi/career-map/KPICareerMapCanvas.tsx`, `src/components/kpi/career-map/KPICareerMapDesigner.tsx`, `src/components/kpi/program/KPIProgramScopeStep.tsx`.
- **Test GREEN**: `KPICareerMapRolePolicy.test.ts` -> 4/4 tests PASS.
- **Hành vi người dùng sau fix**: Mỗi thao tác kéo thả/sửa nối chỉ phát sinh 1 lần lưu revision. Chỉ `hr_admin` trên máy tính mới được chỉnh sửa sơ đồ dạng `draft`/`returned`. Trên điện thoại, sơ đồ tự động khóa ở chế độ xem an toàn.

---

### Blocker 6: Strict Validation Signature & Mandatory Profiles
- **Triệu chứng cũ**: `validateCareerMap()`, `submitCareerMapForApproval()`, và `publishCareerMap()` cho phép bỏ qua `profiles` (optional), có thể dẫn đến việc phê duyệt một sơ đồ rỗng tiêu chí.
- **Root Cause**: Kiểu dữ liệu tham số `profiles?: KpiPositionCriteriaProfile[]` không bắt buộc.
- **Test RED & Assertion**:
  ```ts
  it('rejects strict validation when profiles presets or master positions are missing or inactive', () => {
    const strictNoProfiles = validateCareerMap({ map: withNode, strict: true })
    assert.equal(strictNoProfiles.valid, false)
    assert.ok(strictNoProfiles.issues.some((i) => i.code === 'missing_profile_context'))
  })
  ```
- **File & Hàm đã sửa**: `src/lib/kpi/career-map-service.ts` và `src/lib/kpi/career-map-deployment-service.ts`.
- **Test GREEN**: `career-map-service.test.ts` -> PASS.
- **Hành vi người dùng sau fix**: Trình biên dịch TypeScript và runtime bắt buộc phải cung cấp đầy đủ danh sách tiêu chí hợp lệ đạt tổng 100% trọng số trước khi gửi duyệt hoặc ban hành.

---

### Blocker 7: Real Supabase Gateway Delete & Error Propagation
- **Triệu chứng cũ**: Khi xóa node/edge/criteria item trên client, gateway Supabase mặc định trước đây dùng `if (!nodeErr && existingNodes)` — nếu lệnh select đối soát gặp lỗi, thao tác xóa bị bỏ qua trong im lặng và tiến hành upsert đè lên database.
- **Root Cause**: Bỏ qua error handling trong logic đối soát xóa (reconciliation delete).
- **Test RED & Assertion**:
  ```ts
  it('throws when reconciliation select delete or upsert fails', async () => {
    const selectErrClient = createMockSupabaseClient({ selectError: new Error('DB select failed') })
    const gateway = createDefaultSupabaseKpiGateway(selectErrClient)
    await assert.rejects(async () => { await gateway.replaceAll(...) }, /DB select failed/)
  })
  ```
- **File & Hàm đã sửa**: `src/lib/kpi/supabase-repository.ts`.
- **Test GREEN**: `supabase-repository.test.ts` -> 12/12 tests PASS.
- **Hành vi người dùng sau fix**: Bất kỳ lỗi kết nối hoặc phân quyền nào trong quá trình xóa dữ liệu con đều được báo lỗi trực tiếp lên UI, bảo vệ tính toàn vẹn của dữ liệu lưu trữ.

---

### Blocker 8: Functional Advanced Single-Stage Exception Flow
- **Triệu chứng cũ**: Tab "4. Ngoại Lệ Đơn Chặng" trong `KPIAdvancedSettingsPanel` chỉ là một đoạn văn bản hướng dẫn tĩnh (stub note), không có nút bấm tương tác hay bộ lọc chức năng.
- **Root Cause**: Chưa triển khai component tương tác cho ngoại lệ đơn chặng.
- **File & Hàm đã sửa**: Tạo `src/components/kpi/program/KPISingleStageExceptionPanel.tsx`, thêm `createSingleStageExceptionDraft()` trong `src/lib/kpi/program-service.ts` và persist qua `src/app/kpi/settings/page.tsx`.
- **Test RED**: Service chưa tồn tại, sau khi thêm stub cả ba case fail vì chưa tạo draft/chưa trả đúng lỗi adjacent/scope.
- **Test GREEN**: `program-service.test.ts` 15/15 pass; full KPI suite 238/238; TypeScript và build 143 trang pass.
- **Hành vi người dùng sau fix**: Người quản trị có thể:
  - Chọn cặp chức danh chuyển đổi liền kề (Cấp N -> Cấp N+1);
  - Điều chỉnh điểm KPI tối thiểu và số tháng yêu cầu;
  - Chọn phạm vi áp dụng (toàn chuỗi hoặc từng quán);
  - Xem trước số lượng nhân viên thực tế chịu tác động;
  - Bấm "Tạo Bản Nháp Ngoại Lệ Lộ Trình" để tạo và lưu một `KpiSetVersion` trạng thái `draft`, tự mở bản vừa tạo và không tự động phát hành.

---

## 4. SQL Evidence

### Final Publish RPC Signature
```sql
CREATE OR REPLACE FUNCTION public.publish_kpi_career_map(
  p_map_id TEXT,
  p_effective_from DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER;
```

### State Machine Role & Validation Order
1. **Actor Verification**: Kiểm tra caller qua `public.app_kpi_is_ceo()`.
2. **Organization Resolution**: Truy vấn `to_chuc_id` từ `public.nhan_vien WHERE id = v_actor_id` (ném exception nếu không tìm thấy tổ chức).
3. **Effective Date Validation**: Kiểm tra `p_effective_from IS NOT NULL` và `p_effective_from >= CURRENT_DATE`.
4. **Lock & Status Check**: `SELECT status FROM public.kpi_career_map_versions WHERE id = p_map_id FOR UPDATE`, yêu cầu `status = 'pending_approval'`.
5. **Graph Nodes Check**: Kiểm tra `COUNT(active nodes) > 0`.
6. **Criteria Profiles Check**: Kiểm tra mọi node hoạt động đều có `criteria_profile_id` hợp lệ.
7. **Criteria Weights Check**: Kiểm tra tổng trọng số của từng profile đạt đúng 100%.
8. **Graph Edges Check**: Kiểm tra không có cạnh tự trỏ (`self_loop`), cùng phiên bản sơ đồ, và cấp đích bằng đúng cấp nguồn + 1.
9. **Supersede Old Maps**: `UPDATE public.kpi_career_map_versions SET status = 'superseded' WHERE status = 'published' AND id <> p_map_id`.
10. **Publish Target Map**: Cập nhật trạng thái `'published'`, `approved_by`, `effective_from`.
11. **Update Linked Profiles**: Cập nhật `effective_from` trên các profile liên kết.
12. **Employee Placements**: Xóa placements cũ của sơ đồ, lặp qua nhân viên đang làm việc, loại trừ nhân viên thiếu `store_id` vào `excluded_count`, gán `placed` hoặc `unresolved`.
13. **Sync KPI Sets & Versions**: Tìm hoặc tạo `public.kpi_sets` thật theo `org_id` và mã vị trí, sau đó chèn phiên bản `public.kpi_set_versions` với `version_no` tăng dần.
14. **Approval Audit Log**: Ghi log hành động `'publish'` vào `public.kpi_career_map_approval_logs`.

---

## 5. Repository Evidence

### Default Gateway Call Logging & Scoped Reconciliation
- `selectFrom('kpi_career_map_nodes')` với `.in('career_map_version_id', targetMapIds)`: Chỉ đọc node của các sơ đồ mục tiêu.
- `.delete().in('id', nodesToDelete).in('career_map_version_id', targetMapIds)`: Đảm bảo không bao giờ xóa node của sơ đồ khác.
- `.delete().in('id', itemsToDelete).in('profile_id', targetProfileIds)`: Đảm bảo tiêu chí con chỉ bị xóa trong phạm vi profile tương ứng.
- Khi có lỗi select/delete/upsert, gateway ném trực tiếp lỗi ra ngoài (`if (nodeErr) throw nodeErr`), đảm bảo transaction client-side dừng ngay lập tức.

---

## 6. UI Evidence

### Role & Device Editing Matrix
| Role | Thiết bị | Trạng thái sơ đồ | Quyền thao tác Graph | Ghi chú |
|---|---|---|---|---|
| `hr_admin` | Desktop | `draft` / `returned` | **Được phép chỉnh sửa** (kéo thả, nối, xóa) | Lưu 1 revision duy nhất qua `onAggregateChange` |
| `hr_admin` | Desktop | `pending_approval` / `published` | **Chỉ đọc (Read-only)** | Đã gửi duyệt hoặc đã ban hành |
| `hr_admin` | Mobile / Tablet (<768px) | Mọi trạng thái | **Chỉ đọc (Read-only)** | Khóa kéo thả, hiển thị hướng dẫn |
| `ceo` | Desktop / Mobile | Mọi trạng thái | **Chỉ đọc (Read-only)** | CEO chỉ thực hiện duyệt / trả lại / ban hành |
| `admin` / `manager` / `employee` | Mọi thiết bị | Mọi trạng thái | **Chỉ đọc (Read-only)** | Không có quyền sửa cấu trúc lộ trình |
| `undefined` | Mọi thiết bị | Mọi trạng thái | **Chỉ đọc (Read-only)** | Khóa an toàn |

---

## 7. Verification Table

| Check | Command / Scenario | Result | Evidence |
|---|---|---|---|
| **Focused Pass B-D Tests** | `node --experimental-strip-types --test src/lib/kpi/program-service.test.ts src/lib/kpi/career-map-aggregate-contract.test.ts src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts` | **PASS** | 63/63 tests pass (0 failures) |
| **SQL Migration Contracts** | `node --experimental-strip-types --test src/lib/kpi/career-map-sql-contract.test.ts` | **PASS** | 10/10 tests pass (0 failures) |
| **Full KPI Tests Suite** | `node --experimental-strip-types --test (rg --files src/lib/kpi -g "*.test.ts")` | **PASS** | 242/242 tests pass (0 failures) |
| **ESLint on Modified Files** | `npx eslint src/lib/kpi/ src/components/kpi/career-map/ src/components/kpi/program/` | **PASS** | 0 errors, 0 warnings |
| **TypeScript Compilation** | `npx tsc --noEmit` | **PASS** | Exit code 0, 0 type errors |
| **Next.js Production Build** | `npm run build` | **PASS** | 143/143 static pages compiled successfully |
| **AI Ready Guard** | `npm run ai:ready` | **FAIL** | Pre-existing mojibake in `src/app/employees/` (out-of-scope KPI module) |
| **Supabase Runtime** | `supabase start / test` | **NOT RUN** | Supabase CLI không được cài đặt cục bộ |
| **Browser Desktop Scenarios** | In-app Browser local | **NOT RUN** | Browser security policy từ chối truy cập localhost |
| **Browser Mobile Scenarios** | Mobile Viewport Emulation | **NOT RUN** | Chưa có bằng chứng tương tác trực tiếp |
| **Git diff check** | `git diff --check` | **FAIL ngoài phạm vi** | Trailing whitespace nằm ở các file dirty khác; không xuất hiện trong file Pass B-D |

---

## 8. Remaining Risks

1. **Supabase Local CLI**: Chưa có integration test trực tiếp trên Postgres engine thật; static SQL contract không thay thế bằng chứng transaction/rollback runtime.
2. **Pre-existing Employee Mojibake**: Lệnh `npm run ai:ready` cảnh báo các file thuộc module nhân sự cũ (`src/app/employees/page.tsx`, `src/app/employees/[id]/page.tsx`). Các file này không thuộc phạm vi KPI Career Map nên được giữ nguyên trạng theo quy tắc dự án.
3. **SQL runtime evidence**: Bốn lỗi migration đã được sửa và khóa bằng static contract, nhưng chưa có bằng chứng Postgres thật cho state machine, foreign key, rollback và kết quả RPC.

---

## 9. Exact Next Step

**Bước tiếp theo chính xác**: Khởi động Docker/Supabase local hoặc staging, chạy migration và matrix transaction/rollback; sau đó test 8 browser scenarios desktop/mobile trước khi đổi verdict sang `COMPLETE`.
