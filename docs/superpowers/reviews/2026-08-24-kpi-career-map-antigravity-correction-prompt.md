# Career Map Antigravity Correction Prompt

**Ngày review:** 2026-08-24  
**Trạng thái implementation hiện tại:** Không đạt spec, cần sửa trước khi demo  
**Nguồn yêu cầu:**

- `docs/superpowers/specs/2026-08-24-kpi-homies-career-map-drag-drop-design.md`
- `docs/superpowers/plans/2026-08-24-kpi-homies-career-map-drag-drop-implementation-plan.md`

---

## EXECUTION REQUEST — SỬA TOÀN BỘ CAREER MAP SAU AUDIT

Implementation hiện tại chưa được duyệt. Không tiếp tục mở rộng tính năng mới. Hãy sửa toàn bộ lỗi trong tài liệu này để Career Map thực sự đúng với spec đã duyệt.

Được phép thực hiện toàn bộ Pass A đến Pass E liên tục. Mỗi thời điểm chỉ sửa một pass; phải chạy verification của pass hiện tại và đạt rồi mới chuyển pass tiếp theo. Không cần dừng chờ người dùng giữa các pass, trừ khi gặp blocker không thể giải quyết từ code hoặc tài liệu hiện có.

### Quy tắc bắt buộc trước khi sửa

1. Đọc đầy đủ:
   - `AGENTS.md`
   - `DESIGN_RULE_HOMIES_FINAL.md`
   - `docs/CODEMAP.md`
   - `docs/KNOWN_ISSUES.md`
   - `docs/TOKEN_PLAYBOOK.md`
   - spec Career Map
   - implementation plan Career Map
   - file correction này
2. Đọc tài liệu Next.js 16 liên quan trong `node_modules/next/dist/docs/` trước khi sửa component hoặc global CSS.
3. Chạy `git status --short` và bảo vệ toàn bộ thay đổi có sẵn của người dùng.
4. Không revert, format hàng loạt, rename hoặc refactor ngoài module Career Map.
5. Không commit, stage hoặc push.
6. Test đỏ phải được viết trước mỗi lỗi nghiệp vụ.
7. Không dùng `npx tsx` vì `tsx` không nằm trong dependency của dự án. Dùng lệnh test chuẩn đã ghi trong file này.
8. Không được báo “100% hoàn thành” nếu còn verification chưa chạy hoặc bị lỗi môi trường.

## RESULT bắt buộc

Người dùng mở bước 2 của `/kpi/settings`, thấy ngay một sơ đồ lộ trình Homies dùng chức vụ/cấp bậc thật; kéo vị trí vào là tự nhận tiêu chí; nối nhánh là tự nhận preset; HR gửi một lần, CEO duyệt một lần và hệ thống triển khai đúng phiên bản cho toàn chuỗi.

## HARD RESULT

- Không còn flow tạo từng chặng trong luồng chính.
- Không còn ID chức vụ giả khi master data thật đã tải được.
- Không có đường frontend, service hoặc Supabase nào bypass HR → CEO.
- Career Map chạy được ở cả local repository và Supabase repository.
- Employee chỉ xem bản thân; Store Manager chỉ xem nhân viên thuộc cửa hàng được phép.
- Phiên bản mới tạo KPI set mới, không bị bỏ qua vì ID `v1` trùng.

## FAILURE MUST AVOID

- Chỉ đổi giao diện nhưng không nối persistence.
- Tạo file SQL nhưng app không đọc/ghi các bảng đó.
- Hiển thị số nhân viên giả hoặc truyền mảng rỗng.
- Viết validation code nhưng publish không gọi validation đầy đủ.
- Hard-code preset trong component mà Admin không chỉnh được.
- Tick lại plan khi test chưa bao phủ lỗi audit.

---

## Pass A — Thay đúng flow chính và liên kết master data thật

### Lỗi phải sửa

1. `KPIProgramScopeStep` vẫn dùng `buildCareerStageSuggestions`, chọn từng chặng và gọi `onApplyCareerStages`.
2. Career Map hiện là tab ngang hàng với wizard, không phải nội dung chính của bước 2.
3. Seed dùng ID giả `pos_barista_c1`, trong khi `MasterDataAdapter.getPositions()` trả ID thật.
4. `addCareerMapNode()` chỉ tìm trong snapshot cũ; vị trí mới thành tên UUID và level 0.
5. Thêm node chưa tự tạo profile tiêu chí F&B.

### Hành vi phải đạt

- Bước 2 của wizard render Career Map trực tiếp.
- Xóa khỏi flow mặc định:
  - danh sách tick từng chặng;
  - nút `Tạo N Chặng`;
  - dropdown vị trí hiện tại/hướng tới;
  - template riêng cho từng chặng.
- `Một chặng riêng` chỉ nằm trong `KPIAdvancedSettingsPanel` dưới mục ngoại lệ.
- Khi chưa có map draft phù hợp, tạo draft từ chính danh sách `positions` đang tải từ master data.
- Seed Career Map chỉ là fallback demo khi master data không tồn tại; không được ghi đè danh mục thật.
- Khi master data có vị trí mới:
  - xuất hiện trong tray `Chưa xếp`;
  - giữ đủ `id`, `name`, `level`, `department_id` và job family;
  - kéo vào map không tạo level 0.
- Thay chữ ký thêm node để nhận snapshot thật, ví dụ:

```ts
addCareerMapNode(
  map: KpiCareerMapVersion,
  position: KpiCareerPositionSnapshot,
  coords?: { x: number; y: number },
): KpiCareerMapVersion
```

- Khi thêm node, đồng thời:
  - tạo `KpiPositionCriteriaProfile` mặc định từ catalog F&B;
  - gán `criteria_profile_id` vào node;
  - tổng trọng số profile bằng 100%;
  - lưu map và profile trong cùng một repository update.

### Test đỏ bắt buộc

```ts
it('adds a live master position without converting its UUID into the display name', () => {})
it('adds a newly-created master position with its real adjacent level', () => {})
it('creates and links the default F&B criteria profile when a node is added', () => {})
it('uses the career map as the primary scope flow without generating per-stage drafts', () => {})
```

### File dự kiến

- `src/lib/kpi/career-map-service.ts`
- `src/lib/kpi/career-map-service.test.ts`
- `src/lib/kpi/career-map-criteria-service.ts`
- `src/components/kpi/career-map/KPICareerMapDesigner.tsx`
- `src/components/kpi/program/KPIProgramScopeStep.tsx`
- `src/components/kpi/program/KPIAdvancedSettingsPanel.tsx`
- `src/app/kpi/settings/page.tsx`
- `src/lib/kpi/seed.ts`

### Verification Pass A

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/program-service.test.ts
npm run lint -- src/lib/kpi/career-map-service.ts src/lib/kpi/career-map-criteria-service.ts src/components/kpi/career-map src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/program/KPIAdvancedSettingsPanel.tsx src/app/kpi/settings/page.tsx
npx tsc --noEmit
```

---

## Pass B — Validation đầy đủ, preset dùng chung và version đúng

### Lỗi phải sửa

1. `validateCareerMap()` không kiểm tra `missing_criteria`, `missing_rule`, `invalid_weight` và `no_management_convergence`.
2. Preset chỉ là `PRESET_DESCRIPTIONS` hard-code trong Inspector.
3. Admin chưa thể chỉnh một preset và áp dụng cho toàn bộ edge cùng loại.
4. `publishCareerMap()` không bắt buộc trạng thái `pending_approval`.
5. `returnCareerMapDraft()` không bắt buộc trạng thái `pending_approval`.
6. KPI set sinh ra luôn có ID/version `v1`, nên deployment sau bị bỏ qua.

### Hành vi phải đạt

- Tạo domain preset dùng chung, tối thiểu:

```ts
export interface KpiCareerTransitionPreset {
  key: KpiCareerTransitionPresetKey
  version: number
  required_months: number
  min_score: number
  minimum_hours: number | null
  test_min_score: number | null
  trial_shift_count: number | null
  requires_store_360: boolean
  blocks_on_serious_incident: boolean
  proposer_roles: string[]
  approver_roles: string[]
  effective_from: string | null
}
```

- Tái sử dụng/đồng bộ `PROMOTION_PRESETS` hiện có; không tạo hai nguồn sự thật khác nhau.
- Edge chỉ tham chiếu `preset_key` + `preset_version`.
- Inspector đọc preset từ props/repository, không hard-code.
- HR Admin có UI chỉnh preset theo loại chặng một lần; preview hiển thị số edge bị ảnh hưởng.
- `validateCareerMap()` nhận đủ map, profiles, presets và current master positions.
- Lỗi chặn triển khai:
  - node không có profile;
  - profile không có tiêu chí active;
  - tổng trọng số active khác 100;
  - edge không có preset hợp lệ;
  - preset thiếu điều kiện bắt buộc;
  - node/edge tham chiếu không tồn tại;
  - nhánh vận hành không hội tụ lên quản lý theo spec.
- State transition chính xác:

```text
draft/returned --HR--> pending_approval
pending_approval --CEO--> returned
pending_approval --CEO--> published
published --clone--> draft version + 1
```

- CEO không được publish trực tiếp từ `draft`.
- HR không được publish.
- Chặn ngày hiệu lực rỗng hoặc nằm trước ngày hiện tại khi publish mới.
- Khi sinh KPI set:
  - tìm version lớn nhất theo `set_id`;
  - tạo version kế tiếp;
  - ID không trùng;
  - snapshot criteria và preset đúng ngày hiệu lực;
  - không lọc bỏ thay đổi bằng ID `v1` cũ.

### Test đỏ bắt buộc

```ts
it('blocks submission when a node has no criteria profile', () => {})
it('blocks publication when active criteria do not total 100 percent', () => {})
it('blocks CEO from publishing a draft that HR has not submitted', () => {})
it('blocks returning a map that is not pending approval', () => {})
it('updates every matching edge when one shared preset receives a new version', () => {})
it('creates KPI set version 2 instead of dropping a repeated position deployment', () => {})
it('keeps published KPI version 1 unchanged after version 2 is generated', () => {})
```

### File dự kiến

- `src/lib/kpi/career-map-types.ts`
- `src/lib/kpi/career-map-service.ts`
- `src/lib/kpi/career-map-deployment-service.ts`
- `src/lib/kpi/career-map-deployment-service.test.ts`
- `src/lib/kpi/program-service.ts`
- `src/lib/kpi/repository.ts`
- `src/lib/kpi/local-repository.ts`
- `src/lib/kpi/local-repository.test.ts`
- `src/components/kpi/career-map/KPICareerMapInspector.tsx`
- `src/components/kpi/career-map/KPICareerMapDeploymentPreview.tsx`
- `src/app/kpi/settings/page.tsx`

### Verification Pass B

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/local-repository.test.ts src/lib/kpi/program-service.test.ts
npm run lint -- src/lib/kpi src/components/kpi/career-map src/app/kpi/settings/page.tsx
npx tsc --noEmit
```

---

## Pass C — Kết nối Supabase thật và khóa RLS

### Lỗi phải sửa

1. `SupabaseKpiGatewayRows`, `mapRowsToDatabase()` và `mapDatabaseToRows()` chưa có Career Map.
2. App tạo file SQL nhưng runtime Supabase bỏ toàn bộ map/profile/preset khi load/save.
3. Criteria profile/item đang `USING (TRUE)`, làm lộ cả dữ liệu draft.
4. Approval logs bật RLS nhưng không có policy đọc.
5. Placement không có đường ghi hợp lệ khi publish.
6. Edge chưa có constraint đảm bảo source/target thuộc đúng cùng map version với edge.
7. RPC publish chưa revalidate toàn bộ map/profile/preset và chưa tạo placements/KPI snapshot trong cùng transaction.

### Hành vi phải đạt

- Mở rộng Supabase repository hoặc tạo focused Career Map repository nhưng phải được `kpiAdapter` sử dụng thật.
- Load/save đầy đủ:
  - versions;
  - nodes;
  - edges;
  - criteria profiles/items;
  - transition presets;
  - placements;
  - approval logs.
- Viết round-trip tests cho Supabase mapping.
- Không dùng `replaceAll` để xóa dữ liệu ngoài Career Map ngoài ý muốn.
- RLS:
  - HR đọc/chỉnh `draft` và `returned`, gửi duyệt;
  - CEO đọc pending, return/publish;
  - Store Manager chỉ đọc published map và placement thuộc store scope;
  - Employee chỉ đọc published map và placement của bản thân;
  - draft profiles/items không được public;
  - approval logs chỉ HR/CEO đọc;
  - không cho client tự insert/update placements hoặc approval logs.
- Constraint/trigger phải chặn edge nối node khác map version.
- RPC `publish_kpi_career_map` phải trong một transaction:
  1. lock map row;
  2. bắt buộc status pending;
  3. kiểm tra quyền CEO;
  4. validate node, edge, level, profile, weight, preset;
  5. tạo snapshot;
  6. tạo placements hoặc unresolved queue;
  7. tạo KPI version mới;
  8. publish map;
  9. supersede map cũ theo ngày hiệu lực;
  10. ghi approval log.

### Test đỏ bắt buộc

```ts
it('round trips career maps, profiles and presets through the Supabase gateway', () => {})
it('does not drop career maps when saving unrelated KPI data', () => {})
it('keeps draft criteria hidden from employee and store manager roles', () => {})
it('rejects an edge whose nodes belong to another map version', () => {})
```

Thêm SQL test matrix chứng minh HR/CEO/Store Manager/Employee không bypass quyền.

### File dự kiến

- `src/lib/kpi/supabase-repository.ts`
- `src/lib/kpi/supabase-repository.test.ts`
- `src/lib/adapters/kpi-adapter.ts`
- `supabase/migrations/20260824_kpi_career_map.sql`
- `supabase/migrations/20260824_kpi_career_map_rls.sql`
- `supabase/seed_kpi_career_map_demo.sql`
- `docs/KPI_RLS_TEST_MATRIX.md`

### Verification Pass C

```powershell
node --experimental-strip-types --test src/lib/kpi/supabase-repository.test.ts src/lib/kpi/career-map-deployment-service.test.ts
npm run lint -- src/lib/kpi/supabase-repository.ts src/lib/adapters/kpi-adapter.ts
npx tsc --noEmit
```

Nếu local Supabase có sẵn:

```powershell
supabase db reset
```

Nếu không chạy được Supabase local, phải báo `NOT RUN`; không được tự tuyên bố SQL/RLS đạt.

---

## Pass D — Dữ liệu nhân viên thật và scope đúng theo vai trò

### Lỗi phải sửa

1. `/kpi/settings` truyền `employees={[]}` và `employeeCountByPosition={{}}`.
2. Preview luôn hiển thị 0 nhân viên dù hệ thống có nhân sự.
3. `/kpi/promotion` dùng `DOSSIERS` mock và `selectedDossier` cho mọi vai trò.
4. Employee chưa được khóa vào hồ sơ bản thân.
5. Store Manager chưa được khóa theo cửa hàng.

### Hành vi phải đạt

- Lấy nhân viên từ adapter/service hiện có, không tạo mock Career Map mới.
- Chuẩn hóa các trường:
  - employee ID;
  - current position ID;
  - store ID;
  - trạng thái làm việc;
  - nhiều chức vụ chính nếu có.
- Preview settings hiển thị đúng:
  - tổng nhân viên;
  - đã xếp;
  - chưa xếp;
  - lý do chưa xếp;
  - số nhân viên theo node;
  - số cửa hàng ảnh hưởng.
- Khi publish, tạo placement snapshot đúng map version.
- `/kpi/promotion`:
  - Employee: chỉ bản thân;
  - Store Manager: nhân viên trong store scope;
  - Area Manager: store scope được giao;
  - HR/CEO: toàn chuỗi;
  - không fallback sang một hồ sơ mock khác nếu mapping thiếu;
  - hiển thị empty state giải thích và hướng xử lý.
- Không chỉ ẩn nút bằng UI; repository/RLS cũng phải khóa scope.

### Test đỏ bắt buộc

```ts
it('shows real employee counts in the deployment preview', () => {})
it('places an employee on the node matching the live master position ID', () => {})
it('shows only the logged-in employee placement to employee role', () => {})
it('shows only employees from permitted stores to store manager role', () => {})
it('reports conflicting primary positions instead of silently selecting one', () => {})
```

### File dự kiến

- `src/app/kpi/settings/page.tsx`
- `src/app/kpi/promotion/page.tsx`
- `src/components/kpi/career-map/KPICareerMapDeploymentPreview.tsx`
- `src/components/kpi/career-map/KPICareerMapReadOnly.tsx`
- `src/lib/kpi/career-map-deployment-service.ts`
- relevant employee/master/store adapters discovered through `docs/CODEMAP.md`

### Verification Pass D

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/supabase-repository.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/app/kpi/promotion/page.tsx src/components/kpi/career-map src/lib/kpi/career-map-deployment-service.ts
npx tsc --noEmit
```

---

## Pass E — Mobile, code quality, docs và full verification

### Lỗi phải sửa

1. Draft Career Map vẫn chỉnh được trên mobile.
2. Workspace cố định `280px + canvas + 340px`, gây tràn màn hình.
3. Một số file Career Map vượt 300 dòng.
4. Plan đã tick hoàn thành dù implementation chưa đạt.

### Hành vi phải đạt

- Desktop: chỉnh node/edge, zoom, pan và inspector đầy đủ.
- Mobile/tablet nhỏ:
  - read-only pan/zoom hoặc danh sách fallback;
  - không kéo node;
  - không tạo/xóa edge;
  - không hiện control chỉnh sửa;
  - thông báo rõ muốn chỉnh phải dùng desktop.
- Tách các file Career Map mới vượt 300 dòng khi có ranh giới nghiệp vụ rõ; không refactor file ngoài feature.
- Có loading, error, retry và fallback table.
- Cập nhật `docs/CODEMAP.md` theo file thực tế.
- Ghi các bug audit đã fix vào `docs/KNOWN_ISSUES.md`.
- Sửa lại checkbox trong implementation plan: chỉ `[x]` khi verification tương ứng đã chạy đạt.

### Test/kiểm tra bắt buộc

- Kiểm tra viewport desktop và mobile.
- Kiểm tra HR draft, CEO pending/publish, Employee read-only, Store Manager scoped view.
- Kiểm tra canvas fallback khi React Flow lỗi.

### Full verification

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/local-repository.test.ts src/lib/kpi/supabase-repository.test.ts src/lib/kpi/program-service.test.ts src/lib/kpi/fnb-template-catalog.test.ts
npm run lint
npx tsc --noEmit
npm run build
npm run ai:ready
git diff --check
git status --short
git diff --stat
```

Nếu `npm run build` lỗi vì mạng/Google Fonts, báo chính xác lỗi môi trường và không ghi “build pass”. Không thay font hoặc cấu hình toàn dự án chỉ để che lỗi audit nếu chưa có yêu cầu.

`npm audit` chỉ báo đạt khi lệnh thực sự chạy được; nếu môi trường chặn network, ghi `NOT RUN`.

---

## Done Criteria bắt buộc

- [ ] Bước 2 mặc định là Career Map, không còn tạo từng chặng trong flow chính.
- [ ] Map dùng ID/tên/cấp bậc thật từ Homies master data.
- [ ] Node mới tự nhận profile tiêu chí F&B đủ 100%.
- [ ] Preset chỉnh một lần và mọi edge cùng loại kế thừa.
- [ ] Validation chặn thiếu criteria, sai trọng số, thiếu preset và cấu trúc không hợp lệ.
- [ ] HR không publish được; CEO không publish draft chưa gửi duyệt.
- [ ] KPI set phiên bản mới không trùng hoặc bị bỏ qua.
- [ ] Local repository và Supabase repository đều round-trip Career Map.
- [ ] Supabase publish tạo snapshot, placement, KPI version và log trong một transaction.
- [ ] Preview dùng dữ liệu nhân viên/cửa hàng thật.
- [ ] Employee và Store Manager chỉ xem đúng scope.
- [ ] Mobile không chỉnh cấu trúc sơ đồ.
- [ ] Tests, lint và TypeScript đạt.
- [ ] Build/AI ready được báo trung thực theo kết quả thực tế.

## Báo cáo cuối bắt buộc

Khi hoàn thành Pass A–E, báo đúng cấu trúc:

1. Mỗi lỗi audit đã được sửa tại file/hàm nào.
2. Test phòng tái phát tương ứng.
3. Kết quả từng lệnh verification và exit code.
4. SQL/Supabase đã chạy thật hay `NOT RUN`.
5. Kiểm tra vai trò nào đã thực hiện thật.
6. File tạo/sửa và `git diff --stat`.
7. Rủi ro còn lại.
8. Dừng, không commit.

Không tự tuyên bố spec đạt 100%. Sau khi hoàn thành, gửi toàn bộ báo cáo và diff cho Codex review độc lập lần cuối.
