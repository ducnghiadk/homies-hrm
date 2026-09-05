# Career Map Antigravity Correction Prompt - Vòng 4 (Final Blocking Fixes)

**Ngày giao:** 2026-08-24  
**Trạng thái:** Correction vòng 3 chưa được nghiệm thu  
**Mục tiêu duy nhất:** Sửa đúng 7 lỗi chặn còn lại bằng hành vi runtime và persistence thật; không mở rộng tính năng

---

## EXECUTION REQUEST

Thực hiện toàn bộ Pass 0 đến Pass 7 trong tài liệu này. Đây là correction tập trung sau ba vòng review, không phải yêu cầu làm lại hoặc polish toàn module KPI.

Bạn được phép làm liên tục đến khi hoàn tất. Không cần dừng xin xác nhận giữa các pass, nhưng phải tuân thủ các gate sau:

1. Mỗi pass viết regression test đúng trước khi sửa.
2. Test mới phải thất bại vì đúng lỗi được mô tả, không được thất bại do syntax/import/setup.
3. Chỉ chuyển pass khi test pass hiện tại đạt.
4. Không được dùng test tên hay nhưng chỉ assert payload, ID hoặc mock không liên quan đến hành vi thật.
5. Không được báo hoàn thành nếu Supabase/browser chưa chạy; phải ghi `NOT RUN` đúng sự thật.
6. Không được thay đổi yêu cầu hoặc chọn kiến trúc khác với quyết định đã khóa trong prompt này.

### Đọc bắt buộc trước khi sửa

- `AGENTS.md`
- `DESIGN_RULE_HOMIES_FINAL.md`
- `docs/CODEMAP.md`
- `docs/KNOWN_ISSUES.md`
- `docs/TOKEN_PLAYBOOK.md`
- `docs/AI_PLAN_AI_CODE_RULES.md`
- `docs/superpowers/specs/2026-08-24-kpi-homies-career-map-drag-drop-design.md`
- `docs/superpowers/plans/2026-08-24-kpi-homies-career-map-drag-drop-implementation-plan.md`
- `docs/superpowers/reviews/2026-08-24-kpi-career-map-antigravity-correction-prompt-v3.md`
- file vòng 4 này.

Nếu sửa Next.js component, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

### Bảo vệ worktree

- Chạy `git status --short` trước khi sửa.
- Không revert, reset, checkout, clean, format hàng loạt hoặc ghi đè thay đổi của người dùng.
- Không commit, stage hoặc push.
- Không sửa attendance, payroll, scheduling, contracts, global font hoặc app shell.
- Không sửa file KPI khác chỉ để làm lint toàn dự án xanh.
- Không cài dependency mới.
- Không thay đổi business rule ngoài 7 lỗi dưới đây.

---

## RPM CANVAS

### RESULT

Career Map phải hoạt động nhất quán từ giao diện đến local repository và Supabase: HR chỉnh một sơ đồ trong bước 2, kéo vị trí tạo node + profile thật trong một lần lưu, CEO publish qua một RPC duy nhất, hệ thống tạo placements/KPI version/log, và Promotion Hub đọc chính dữ liệu đó.

### HARD RESULT

- Không còn mismatch TEXT/UUID.
- Không còn test giả cho delete, placements hoặc approval logs.
- Không còn hai RPC publish hoặc đường bypass HR -> CEO.
- Không còn `DOSSIERS` mock trong runtime production.
- Không còn Career Map tab riêng ngoài bước 2.
- Không thao tác mobile nào làm thay đổi graph.
- Một lỗi ở bất kỳ bước publish nào phải rollback toàn transaction.

### PURPOSE

Đây là luồng khách hàng sẽ dùng để tin rằng hệ thống KPI/thăng tiến vận hành được cho chuỗi F&B thật. Nếu giao diện báo lưu/publish thành công nhưng database thiếu dữ liệu hoặc sai phân quyền, sản phẩm không thể demo hoặc triển khai an toàn.

### FAILURE MODE ANALYSIS

- ID chuỗi ghi vào UUID làm Supabase save thất bại.
- Xóa trên UI nhưng database còn row cũ làm node/edge sống lại.
- Publish chỉ đổi status nhưng không có placement/KPI version khiến Promotion Hub rỗng hoặc sai.
- Mock dossier làm nhân viên thấy dữ liệu không phản ánh hệ thống thật.
- Hai callback save riêng làm node có nhưng profile mất, hoặc ngược lại.
- Mobile vẫn kéo node dù banner nói read-only.
- Hai RPC cùng tên khác signature tạo đường gọi không an toàn.

---

## 5D IMPACT VÀ QUYẾT ĐỊNH ĐÃ KHÓA

| Khu vực | Mức độ | Quyết định bắt buộc |
|---|---|---|
| UX | RED | Chỉ một Career Map nằm trong bước 2; Promotion Hub dùng dữ liệu thật |
| UI | YELLOW | Bỏ tab trùng, thêm Advanced single-stage, khóa mobile thật |
| FE/BE | RED | Atomic aggregate update và repository mapping đầy đủ |
| Data | RED | Career Map aggregate IDs dùng TEXT; HR employee/store IDs giữ UUID |
| Security | RED | Một publish RPC, auth từ session, RLS đúng scope |

Người dùng đã phê duyệt tiếp tục correction. Không hỏi lại hoặc tự đổi quyết định ID strategy.

---

## 7 LỖI CHẶN PHẢI SỬA

### Lỗi 1 - ID runtime không tương thích SQL

Hiện tại domain tạo:

- `career_map_*`
- `node_*`
- `edge_*`
- `profile_*`
- `map_draft_v*`

Trong khi SQL khai báo các ID Career Map là UUID.

### Lỗi 2 - Repository không lưu placements/logs và không xóa row cũ

`SupabaseKpiGatewayRows`, `KpiDatabase`, mapper và default gateway chưa có collections dedicated cho:

- `kpi_career_employee_placements`
- `kpi_career_map_approval_logs`

`replaceAll` chỉ upsert. Hai test vòng 3 đang false positive:

- test delete chỉ assert payload không chứa row cũ;
- test round-trip dùng `kpi_audit_logs`, không dùng bảng approval log hoặc placements.

### Lỗi 3 - Có hai publish RPC và chưa có atomic deployment thật

- `20260824_kpi_career_map.sql` tạo RPC 3 tham số nhận actor từ client.
- `20260824_kpi_career_map_rls.sql` tạo RPC 2 tham số.
- Chưa có full validation, placement creation và KPI version creation trong transaction.
- RPC submit trong RLS vẫn cho CEO submit.

### Lỗi 4 - Promotion Hub vẫn dùng `DOSSIERS` mock

Hàm scope đã an toàn hơn nhưng đầu vào vẫn là static `DOSSIERS`. Đây chưa phải dữ liệu placement/promotion thật.

### Lỗi 5 - Node/profile chưa được lưu atomic và drag-drop path còn hỏng

- Designer gọi `onChange(map)` và `onUpdateProfiles(profiles)` riêng.
- Page gọi hai `persistDatabase` riêng.
- Designer không truyền `positions` và `onUpdateProfiles` xuống Canvas.
- Canvas fallback `{ id, name: id }` có thể biến UUID thành tên hiển thị.

### Lỗi 6 - Main flow còn tab trùng; single-stage exception bị mất

- `/kpi/settings` vẫn có `settingsTab = wizard | career_map`.
- Career Map vừa nằm trong bước 2 vừa có tab riêng.
- `Một chặng riêng` đã bị xóa khỏi bước 2 nhưng chưa nằm trong Advanced Settings.

### Lỗi 7 - Mobile và validation vẫn còn bypass

- Node React Flow dùng `draggable: !readOnly`, không dùng `effectiveReadOnly`.
- Canvas không nhận role, nên policy desktop không chứng minh đúng HR-only.
- `validateCareerMap` vẫn hỗ trợ profiles optional.
- `publishCareerMap` vẫn cho caller bỏ profiles.
- Empty map có thể chỉ tạo warnings và cho Continue.

---

## PASS 0 - THAY TEST GIẢ BẰNG TEST THẬT

### 0.1 Xóa hoặc sửa test false positive

Hai test sau không được giữ nguyên implementation hiện tại:

```ts
it('persists deletion of career map child rows in the Supabase gateway', ...)
it('round trips presets placements and approval logs through the Supabase gateway', ...)
```

Test delete phải kiểm tra default gateway thực sự gọi delete/reconciliation cho row thiếu, không chỉ kiểm tra payload.

Test round-trip phải dùng chính collections/tables:

- `career_employee_placements`;
- `career_map_approval_logs`;
- `transition_presets`.

Không được thay approval log bằng `kpi_audit_logs`.

### 0.2 Regression tests bắt buộc

```ts
it('maps every career aggregate text id into a compatible SQL row', () => {})
it('loads and saves placements through the canonical KPI repository', () => {})
it('loads and saves career approval logs through their dedicated table', () => {})
it('deletes database child rows missing from the saved career aggregate', () => {})
it('does not delete child rows belonging to another career map', () => {})
it('exposes exactly one publish_kpi_career_map SQL signature', () => {})
it('the publish RPC validates status role date graph criteria presets before mutation', () => {})
it('the publish RPC creates placements KPI versions and approval log', () => {})
it('builds promotion dossiers from repository placements instead of static mock dossiers', () => {})
it('saves a dropped position map and profile in one repository revision', () => {})
it('passes the full live position snapshot through the canvas drop path', () => {})
it('renders no standalone Career Map settings tab', () => {})
it('keeps single-stage setup only inside Advanced Settings', () => {})
it('makes React Flow nodes non-draggable on mobile', () => {})
it('rejects validation and publish when profiles are missing', () => {})
it('blocks an empty career map from continuing or submission', () => {})
```

### 0.3 RED evidence

Chạy test ngay sau khi viết. Báo cáo cuối phải có:

- tên test;
- lỗi assert chính xác lúc RED;
- file/hàm sửa;
- kết quả GREEN sau sửa.

Không cần chụp toàn bộ log, nhưng phải đủ bằng chứng test thật sự fail vì bug.

---

## PASS 1 - CHỐT ID STRATEGY: CAREER AGGREGATE IDs DÙNG TEXT

### 1.1 Quyết định bắt buộc

Các cột sau dùng `TEXT` trong Supabase:

- `kpi_career_map_versions.id`
- `kpi_career_map_versions.based_on_version_id`
- `kpi_career_map_nodes.id`
- `kpi_career_map_nodes.career_map_version_id`
- `kpi_career_map_nodes.criteria_profile_id`
- `kpi_career_map_edges.id`
- `kpi_career_map_edges.career_map_version_id`
- `kpi_career_map_edges.source_node_id`
- `kpi_career_map_edges.target_node_id`
- `kpi_position_criteria_profiles.id`
- `kpi_position_criteria_items.id`
- `kpi_position_criteria_items.profile_id`
- `kpi_career_employee_placements.id`
- `kpi_career_employee_placements.career_map_version_id`
- `kpi_career_employee_placements.node_id`
- `kpi_career_map_approval_logs.id`
- `kpi_career_map_approval_logs.career_map_version_id`

Các cột sau vẫn là UUID vì liên kết master/auth thật:

- `created_by`
- `approved_by`
- `actor_id`
- `employee_id`
- `store_id`

`position_id` giữ TEXT/VARCHAR để bảo toàn cả UUID master dạng chuỗi và legacy ID.

### 1.2 Migration strategy

Không tiếp tục sửa im lặng migration cũ như thể chưa từng tồn tại. Tạo migration correction mới, ví dụ:

`supabase/migrations/20260824_kpi_career_map_round4_fix.sql`

Migration phải:

1. Drop FK phụ thuộc theo thứ tự an toàn.
2. Alter các cột Career aggregate sang TEXT bằng `USING id::text` hoặc biểu thức tương ứng.
3. Recreate toàn bộ PK/FK/unique/index/trigger.
4. Không đổi UUID của employee/store/actor.
5. Chạy idempotent hoặc ghi rõ precondition nếu không thể idempotent.
6. Không drop table hoặc mất dữ liệu hiện có.
7. Bảo toàn seed/local semantic IDs hiện tại.

### 1.3 SQL contract test

Tạo test đọc migration final và xác nhận:

- tất cả cột aggregate nêu trên cùng kiểu TEXT;
- employee/store/actor vẫn UUID;
- source/target/map/profile FK cùng kiểu;
- không còn function signature nhận `p_actor_id` từ client.

Static contract test không thay thế chạy Supabase local, nhưng bắt buộc để ngăn mismatch quay lại.

### Verification Pass 1

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-sql-contract.test.ts src/lib/kpi/supabase-repository.test.ts
npx tsc --noEmit
```

Nếu chọn tên test khác, báo rõ file. Không bỏ test SQL contract.

---

## PASS 2 - CANONICAL REPOSITORY CHO PLACEMENTS, LOGS VÀ DELETE RECONCILIATION

### 2.1 Mở rộng domain database

Thêm type rõ ràng trong `career-map-types.ts`, tối thiểu:

```ts
interface KpiCareerEmployeePlacement {
  id: string
  career_map_version_id: string
  employee_id: string
  store_id: string
  position_id: string
  node_id: string | null
  status: 'placed' | 'unresolved'
  unresolved_reason: string | null
  created_at: string
}

interface KpiCareerMapApprovalLog {
  id: string
  career_map_version_id: string
  action: 'submit' | 'return' | 'publish'
  actor_id: string
  notes: string | null
  created_at: string
}
```

Thêm vào `KpiDatabase`:

```ts
career_employee_placements: KpiCareerEmployeePlacement[]
career_map_approval_logs: KpiCareerMapApprovalLog[]
```

Legacy local database thiếu hai field phải normalize về `[]`.

### 2.2 Mở rộng Supabase gateway

`SupabaseKpiGatewayRows`, `mapRowsToDatabase`, `mapDatabaseToRows`, `loadAll` và `replaceAll` phải dùng dedicated fields:

```ts
career_employee_placements?: JsonRow[]
career_map_approval_logs?: JsonRow[]
```

Không map approval action vào `kpi_audit_logs`.

### 2.3 Delete reconciliation thật

Tạo cơ chế reconciliation cho đúng Career scope:

- tải existing child IDs của từng career map/profile đang save;
- tính `idsToDelete = existing - incoming`;
- gọi delete thật trên bảng tương ứng;
- chỉ delete theo đúng `career_map_version_id` hoặc `profile_id`;
- sau delete mới upsert incoming rows;
- nếu delete/upsert lỗi, throw sync error; không nuốt bằng `upsertTableSafe`.

Các bảng cần reconciliation:

- `kpi_career_map_nodes`
- `kpi_career_map_edges`
- `kpi_position_criteria_items`
- `kpi_career_employee_placements`

Nếu profile bị xóa khỏi canonical database, xóa profile theo ID chỉ khi không còn published map tham chiếu. Published snapshot không được mất.

### 2.4 Test đúng default gateway

Mock Supabase chain phải ghi nhận:

- `.select()` existing IDs;
- `.delete()`;
- scope `.eq()`;
- IDs bị delete;
- upsert sau reconciliation.

Test phải chứng minh row thuộc map khác không bị delete.

### Verification Pass 2

```powershell
node --experimental-strip-types --test src/lib/kpi/local-repository.test.ts src/lib/kpi/supabase-repository.test.ts
npm run lint -- src/lib/kpi/repository.ts src/lib/kpi/local-repository.ts src/lib/kpi/supabase-repository.ts src/lib/kpi/supabase-repository.test.ts src/lib/kpi/career-map-types.ts
npx tsc --noEmit
```

---

## PASS 3 - MỘT RPC PUBLISH DUY NHẤT VÀ DEPLOYMENT ATOMIC

### 3.1 Xóa overload không an toàn

Migration round 4 phải drop cả hai signature cũ:

```sql
DROP FUNCTION IF EXISTS public.publish_kpi_career_map(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS public.publish_kpi_career_map(UUID, DATE);
```

Đồng thời xóa các block `CREATE OR REPLACE FUNCTION publish_kpi_career_map` khỏi hai migration cũ `20260824_kpi_career_map.sql` và `20260824_kpi_career_map_rls.sql`. Hai file cũ chỉ giữ table/trigger/policy hoặc RPC submit/return cần thiết. Migration round 4 là nơi duy nhất tạo publish RPC final, đồng thời chứa các lệnh `DROP FUNCTION` để sửa những database dev đã từng áp dụng bản cũ.

Sau khi sửa, tìm kiếm toàn bộ `supabase/migrations` phải chỉ còn đúng một câu `CREATE OR REPLACE FUNCTION public.publish_kpi_career_map`, nằm trong migration round 4.

Chỉ tạo đúng một function final:

```sql
public.publish_kpi_career_map(p_map_id TEXT, p_effective_from DATE)
```

Không nhận `actor_id` từ client. Actor bắt buộc lấy từ session bằng helper auth hiện có.

### 3.2 State machine SQL

```text
draft/returned --HR_ADMIN submit--> pending_approval
pending_approval --CEO return--> returned
pending_approval --CEO publish--> published
```

- Submit RPC chỉ HR Admin; CEO không submit.
- Return RPC chỉ CEO.
- Publish RPC chỉ CEO.
- Revoke execute mặc định nếu cần và grant cho `authenticated`; bên trong function vẫn phải kiểm tra role.

### 3.3 Publish transaction bắt buộc

Function publish phải chạy trong một transaction và theo đúng thứ tự:

1. Lấy actor từ auth/session.
2. Xác nhận actor là CEO.
3. Lock map row `FOR UPDATE`.
4. Status phải là `pending_approval`.
5. `effective_from` không null và không trong quá khứ.
6. Map có ít nhất một active node và một lộ trình hợp lệ.
7. Mọi node tham chiếu position snapshot hợp lệ và level > 0.
8. Mọi edge source/target tồn tại, cùng map và nối đúng cấp.
9. Mỗi node có profile; profile có criteria active; tổng weight active = 100.
10. Mỗi edge tham chiếu preset key/version tồn tại trong snapshot/preset data.
11. Xây placements từ nhân viên active và live position IDs.
12. Ghi unresolved placement khi position không map được; không silently bỏ nhân viên.
13. Tạo KPI set version tiếp theo cho từng position theo schema KPI thật đang có.
14. Không ghi đè hoặc mutate KPI version published cũ.
15. Supersede map cũ theo effective-date policy.
16. Publish map hiện tại.
17. Ghi approval log dedicated.
18. Trả summary JSON gồm counts placements, unresolved, KPI versions và log ID.

Bất kỳ bước nào fail phải rollback toàn bộ; không có status published một phần.

### 3.4 Không phát minh schema KPI

Trước khi viết INSERT KPI version, đọc migration/schema hiện có của:

- `kpi_sets`
- `kpi_set_versions`
- các bảng criteria snapshot liên quan.

Dùng đúng tên cột và constraints hiện có. Nếu schema không đủ để tạo snapshot như spec, dừng và báo blocker cụ thể; không viết SQL giả hoặc comment TODO.

### 3.5 RLS

- HR được sửa draft/returned và submit.
- CEO đọc pending, return/publish nhưng không chỉnh graph/profile draft tùy ý.
- Client không insert/update/delete placements hoặc approval logs.
- Employee chỉ đọc placement của chính mình.
- Store Manager chỉ đọc placement thuộc store scope thật.
- Draft profiles/items/presets không public.
- Approval logs chỉ HR/CEO đọc.

### 3.6 SQL verification

Nếu Supabase local có thể chạy:

```powershell
supabase status
supabase db reset
```

Sau reset phải chạy test matrix:

- HR submit thành công;
- CEO submit bị reject;
- HR publish bị reject;
- CEO publish draft bị reject;
- CEO publish pending thành công;
- ngày quá khứ bị reject;
- invalid weight bị reject;
- cross-map edge bị reject;
- publish tạo placement/KPI version/log;
- forced failure không để lại partial status/rows.

Nếu Docker/Supabase không có, báo `NOT RUN`. Không được ghi “SQL syntax chuẩn” nếu chưa chạy parser/database.

### Verification Pass 3

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-sql-contract.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/supabase-repository.test.ts
npm run lint -- src/lib/kpi/career-map-deployment-service.ts src/lib/kpi/supabase-repository.ts
npx tsc --noEmit
```

---

## PASS 4 - NODE + PROFILE ATOMIC TỪ MỌI UI PATH

### 4.1 Một event contract duy nhất

Thay callback map/profile rời bằng aggregate callback cho Career Map Designer/Canvas:

```ts
interface CareerMapAggregateChange {
  map: KpiCareerMapVersion
  profiles: KpiPositionCriteriaProfile[]
}

onAggregateChange(next: CareerMapAggregateChange): void
```

Không gọi `onChange(map)` rồi `onUpdateProfiles(profiles)` cho cùng một thao tác.

### 4.2 Page persist một revision

Tạo một handler tại `/kpi/settings`:

```ts
handleUpdateCareerAggregate({ map, profiles })
```

Handler chỉ gọi `persistDatabase` một lần và update đồng thời:

- `career_maps`;
- `position_criteria_profiles`.

Test repository/page logic phải chứng minh revision chỉ tăng một lần khi thêm position.

### 4.3 Drag/drop snapshot thật

Designer bắt buộc truyền xuống Canvas:

- `positions={positions}`;
- `profiles={profiles}`;
- aggregate callback.

Canvas drop:

```ts
const position = positions.find(...)
if (!position) {
  toast.error(...)
  return
}
```

Xóa hoàn toàn fallback `{ id: positionId, name: positionId }`.

Không cho `addCareerPosition` nhận string nữa. Signature phải bắt buộc nhận `KpiCareerPositionSnapshot`.

Không fallback level thành `1` khi không xác định. Nếu thiếu level hợp lệ, trả lỗi chặn và không thêm node.

### 4.4 Duplicate protection

- Node đã có: không thêm lần hai.
- Profile đã có: reuse đúng profile.
- Profile mới: active criteria tổng weight 100.
- Mọi field position `id/name/level/department_id/job_family/active` được bảo toàn.

### Verification Pass 4

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/local-repository.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/career-map src/lib/kpi/career-map-service.ts
npx tsc --noEmit
```

---

## PASS 5 - MỘT MAIN FLOW VÀ SINGLE-STAGE TRONG ADVANCED

### 5.1 Xóa Career Map tab riêng

Tại `/kpi/settings`:

- xóa state `settingsTab`;
- xóa tab switcher `Wizard / Career Map`;
- xóa body branch `settingsTab === 'career_map'`;
- xóa `onOpenCareerMap`;
- xóa breadcrumb/status phụ thuộc settingsTab.

Career Map chỉ render trong `KPIProgramScopeStep` khi `currentProgramStep === 'scope'`.

Deployment preview/approval action phải nằm trong phần cuối của bước 2 hoặc bước Review phù hợp, không tạo tab riêng.

### 5.2 Advanced single-stage exception

Mở rộng `KPIAdvancedSettingsPanel` với section mới:

```ts
'single_stage'
```

Nhãn người dùng:

`Ngoại lệ: Thiết lập một chặng riêng`

Panel này mới được phép có:

- chọn vị trí hiện tại;
- chọn đúng một vị trí cấp kế tiếp;
- preset/template cho ngoại lệ;
- phạm vi cửa hàng;
- ngày hiệu lực;
- preview tác động;
- tạo draft, không publish trực tiếp.

Không đưa nút hoặc dropdown single-stage trở lại main Step 2.

Tái sử dụng service promotion rule đã có; không tạo engine thứ ba.

### 5.3 Empty map blocking

`validateCareerMap` phải tạo blocking issue `empty_map` khi không có active node.

Step 2 không Continue nếu:

- map rỗng;
- thiếu profile;
- weight sai;
- edge/preset sai;
- graph không hội tụ;
- store scope rỗng;
- ngày hiệu lực trống hoặc quá khứ.

### Verification Pass 5

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/program-service.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/program/KPIAdvancedSettingsPanel.tsx
npx tsc --noEmit
```

---

## PASS 6 - PROMOTION HUB DÙNG PLACEMENT THẬT

### 6.1 Xóa runtime mock

Tại `src/app/kpi/promotion/page.tsx`:

- không khai báo hoặc dùng `const DOSSIERS = buildDossiers()` trong production runtime;
- không dùng mock làm fallback khi repository rỗng;
- không khởi tạo selected ID từ mock.

Nếu cần giữ fixtures cho tests/demo, chuyển sang file test/demo riêng và chỉ bật bằng explicit flag:

```text
NEXT_PUBLIC_KPI_DEMO_MODE=true
```

Default phải là false/không bật. Authorization không bao giờ dựa trên demo data.

### 6.2 Build dossier từ canonical data

Tạo pure service, ví dụ:

```ts
buildPromotionDossiers({
  placements,
  employees,
  careerMap,
  kpiSets,
  evaluations,
  developmentCases,
})
```

Nguồn tối thiểu:

- published Career Map;
- `career_employee_placements` đúng map version;
- employee adapter/repository thật;
- KPI/evaluation/development data hiện có.

Không có placement thì không có dossier giả.

### 6.3 Role scope

- Employee: chỉ dossier có `employee_id === current user employee ID`.
- Store Manager: chỉ permitted store IDs lấy từ auth/assignment thật; không chỉ một `user.store_id` nếu hệ thống hỗ trợ nhiều store.
- Area Manager: chỉ region/store được phép nếu role hiện có.
- HR/CEO: toàn chuỗi.
- Không match: empty state.

UI scope và RLS placement phải cho cùng kết quả.

### 6.4 Empty states

Phân biệt rõ:

- chưa có Career Map published;
- chưa publish placements;
- user chưa map employee ID;
- position không nằm trong map;
- Store Manager chưa được gán store;
- hiện không có hồ sơ đạt điều kiện.

Không dùng một message chung che mọi lỗi.

### Verification Pass 6

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/supabase-repository.test.ts
npm run lint -- src/app/kpi/promotion/page.tsx src/lib/kpi/career-map-deployment-service.ts
npx tsc --noEmit
```

---

## PASS 7 - MOBILE, REQUIRED VALIDATION VÀ FULL VERIFICATION

### 7.1 Mobile policy đúng ở React Flow props

Canvas phải nhận actor role hoặc explicit `canEditStructure` từ parent.

Khuyến nghị parent tính policy một lần:

```ts
const canEditStructure =
  actor.role === 'hr_admin' &&
  ['draft', 'returned'].includes(map.status) &&
  !isMobile
```

Mọi điểm edit dùng cùng một biến:

- `nodes[].draggable = canEditStructure`;
- `nodesConnectable`;
- `elementsSelectable` nếu cần;
- `onDrop`;
- `onNodeDragStop`;
- `onConnect`;
- Delete key;
- delete buttons trong Inspector;
- position tray add/drag.

CEO pending chỉ review; Employee/Store Manager luôn read-only; HR mobile read-only.

### 7.2 Validation context bắt buộc

Xóa API legacy:

```ts
validateCareerMap(map, profilesArg?, ...)
```

Chỉ giữ object signature có required fields:

```ts
validateCareerMap({
  map,
  profiles,
  presets,
  masterPositions,
  effectiveDate,
})
```

Nếu một context chưa cần tại callsite, truyền collection/date rõ ràng; không để optional khiến validation bị bỏ qua.

`submitCareerMapForApproval` và `publishCareerMap` nhận một context object bắt buộc. Không có profiles/presets/master positions thì throw trước validation.

### 7.3 UI verification scenarios

Nếu browser chạy được, test đúng các scenario:

1. HR desktop thêm position bằng kéo-thả; tên không phải UUID; profile hiện ngay.
2. Refresh vẫn còn cả node và profile.
3. Xóa node, refresh, node không sống lại.
4. Không còn Career Map tab riêng.
5. Single-stage chỉ có trong Advanced Settings.
6. HR mobile không kéo/drop/connect/delete.
7. CEO pending không sửa graph.
8. Employee Promotion Hub chỉ thấy mình.
9. Store Manager chỉ thấy permitted stores.
10. Không có placement hiển thị empty state, không hiện mock.

Nếu browser không chạy, ghi `Browser scenarios: NOT RUN`. Không được mô tả như đã test.

### 7.4 Full verification bắt buộc

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/career-map-sql-contract.test.ts src/lib/kpi/local-repository.test.ts src/lib/kpi/supabase-repository.test.ts src/lib/kpi/program-service.test.ts src/lib/kpi/fnb-template-catalog.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/app/kpi/promotion/page.tsx src/components/kpi/career-map src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/program/KPIAdvancedSettingsPanel.tsx src/lib/kpi
npx tsc --noEmit
npm run build
npm run ai:ready
git diff --check
git status --short
git diff --stat
```

Ghi exit code từng lệnh.

- Build fail Google Fonts/network: ghi `BUILD FAIL - ENVIRONMENT`.
- `ai:ready` fail ngoài scope: ghi đúng file/lỗi, không sửa lan.
- `git diff --check` phải phân biệt lỗi mới trong file task và lỗi cũ ngoài scope.

---

## EXPECTED FILE SCOPE

### File dự kiến sửa

- `src/app/kpi/settings/page.tsx`
- `src/app/kpi/promotion/page.tsx`
- `src/components/kpi/career-map/KPICareerMapCanvas.tsx`
- `src/components/kpi/career-map/KPICareerMapDesigner.tsx`
- `src/components/kpi/career-map/KPICareerMapInspector.tsx`
- `src/components/kpi/career-map/KPICareerPositionTray.tsx`
- `src/components/kpi/program/KPIProgramScopeStep.tsx`
- `src/components/kpi/program/KPIAdvancedSettingsPanel.tsx`
- `src/lib/kpi/career-map-types.ts`
- `src/lib/kpi/career-map-service.ts`
- `src/lib/kpi/career-map-deployment-service.ts`
- `src/lib/kpi/repository.ts`
- `src/lib/kpi/local-repository.ts`
- `src/lib/kpi/supabase-repository.ts`
- các test tương ứng.
- migration correction round 4 mới.
- `supabase/migrations/20260824_kpi_career_map_rls.sql` nếu cần bỏ function cũ/policy cũ.
- `docs/KPI_RLS_TEST_MATRIX.md`
- `docs/CODEMAP.md`
- `docs/KNOWN_ISSUES.md`
- implementation plan Career Map.

### Có thể tạo

- `src/lib/kpi/career-map-sql-contract.test.ts`
- pure promotion dossier builder/test.
- focused repository helper cho reconciliation nếu giúp test rõ hơn.
- migration `20260824_kpi_career_map_round4_fix.sql`.

### Không được sửa

- Global layout/font/config.
- Employee pages ngoài adapter cần đọc.
- Payroll, attendance, scheduling, contracts.
- Dependency/package files.
- UI KPI không liên quan Career Map/Promotion.

Nếu bắt buộc chạm file ngoài scope, dừng và báo lý do trước; không tự mở rộng.

---

## ROLLBACK PLAN

- Migration correction không drop table hoặc xóa dữ liệu.
- Trước khi alter FK/type, ghi rõ thứ tự drop/recreate constraints.
- Nếu conversion fail, transaction migration phải rollback.
- Published map/KPI versions cũ bất biến.
- Không reset localStorage hoặc Supabase production data để làm test xanh.
- Nếu atomic publish chưa thể hoàn thành do schema KPI thiếu, giữ map ở `pending_approval`, không fallback sang local publish, và báo blocker.
- Nếu repository sync lỗi, UI phải báo chưa lưu; không hiện “Đã lưu”.

---

## DONE CRITERIA CỨNG

Không tự tick nếu không có test/bằng chứng tương ứng.

- [ ] Career aggregate IDs và SQL types tương thích hoàn toàn.
- [ ] Employee/store/actor IDs vẫn dùng UUID.
- [ ] Có migration correction mới, không giả định migration cũ chưa chạy.
- [ ] KpiDatabase/repository có placements và dedicated approval logs.
- [ ] Default Supabase gateway load/save hai collections này.
- [ ] Delete reconciliation gọi delete thật và đúng scope.
- [ ] Test delete không còn chỉ assert payload.
- [ ] Test approval log không dùng `kpi_audit_logs` thay thế.
- [ ] Chỉ tồn tại một publish RPC signature.
- [ ] Publish RPC không nhận actor ID từ client.
- [ ] Chỉ HR submit; chỉ CEO return/publish ở service và SQL.
- [ ] Publish RPC validate đầy đủ trước mutation.
- [ ] Publish tạo placements, unresolved rows, KPI versions và approval log trong một transaction.
- [ ] Failure rollback không để partial published data.
- [ ] Map + profiles lưu trong một repository revision.
- [ ] Canvas nhận full positions và aggregate callback.
- [ ] Không còn UUID-as-display-name fallback.
- [ ] Không còn Career Map tab riêng.
- [ ] Single-stage chỉ có trong Advanced Settings.
- [ ] Empty map là blocking issue.
- [ ] Promotion Hub không dùng static DOSSIERS trong production runtime.
- [ ] Promotion dossiers được dựng từ published placements.
- [ ] Employee/Store Manager đúng scope và empty state an toàn.
- [ ] Mobile node thực sự non-draggable.
- [ ] Mọi edit path dùng cùng `canEditStructure`.
- [ ] Validation context không còn optional/legacy overload.
- [ ] Regression tests mới thật sự kiểm tra hành vi.
- [ ] Tests, lint và TypeScript đạt.
- [ ] Supabase/browser/build/AI ready được báo đúng PASS/FAIL/NOT RUN.

---

## BÁO CÁO CUỐI BẮT BUỘC - KHÔNG CHẤP NHẬN MÔ TẢ CHUNG

Antigravity phải trả đúng cấu trúc sau:

### 1. Executive result

- Đạt bao nhiêu Done Criteria trên tổng số.
- Mục nào chưa đạt.
- Kết luận của Antigravity chỉ được là `READY FOR CODEX REVIEW`, không được là `PRODUCTION READY`.

### 2. Audit mapping 1-7

Với từng lỗi:

| Lỗi | File + hàm đã sửa | Test phòng tái phát | Kết quả |
|---|---|---|---|

Không ghi “đã xử lý” nếu thiếu file/hàm hoặc test.

### 3. RED -> GREEN evidence

Với từng test mới:

- tên test;
- lỗi assert lúc RED;
- thay đổi làm GREEN;
- kết quả chạy cuối.

Không cần dán log dài nhưng không được chỉ nói “đã viết test”.

### 4. ID và migration

- Danh sách cột đã đổi TEXT.
- Danh sách cột giữ UUID.
- Tên migration correction.
- Constraint/FK nào drop/recreate.
- Supabase local PASS hay NOT RUN.

### 5. Repository evidence

- Mapper placements ở dòng/file nào.
- Mapper approval logs ở dòng/file nào.
- Delete reconciliation ở dòng/file nào.
- Test nào xác nhận `.delete()` thật được gọi.
- Test nào xác nhận row map khác không bị xóa.

### 6. RPC evidence

- Liệt kê output tìm kiếm tất cả `publish_kpi_career_map`; phải chỉ còn một định nghĩa final sau migration.
- Actor lấy từ đâu.
- Validation nào chạy trước mutation.
- INSERT placements/KPI versions/log ở đâu.
- Transaction rollback được test thế nào.

### 7. UI/runtime evidence

- Search chứng minh không còn `settingsTab` và static `DOSSIERS` trong production page.
- Handler aggregate save và số revision tăng.
- Canvas props truyền positions/profiles/callback.
- Mobile draggable policy.
- Single-stage Advanced Settings.

### 8. Role scenarios

- HR Admin.
- CEO.
- Employee.
- Store Manager.

Nêu scenario nào test bằng unit, SQL hoặc browser. Không gộp “đã test phân quyền”.

### 9. Verification table

| Command | Exit code | PASS/FAIL/NOT RUN | Ghi chú thật |
|---|---:|---|---|

Bao gồm toàn bộ command Pass 7.

### 10. Supabase/browser honesty

- Nếu không có Docker: `Supabase local: NOT RUN`.
- Nếu không chạy UI: `Browser scenarios: NOT RUN`.
- Không được suy luận SQL/RLS/browser đạt từ TypeScript hoặc unit test.

### 11. Files changed và residual risk

- `git status --short`.
- `git diff --stat`.
- file mới/sửa.
- rủi ro còn lại.
- không commit/stage/push.

---

## CÁC CÂU BÁO CÁO BỊ CẤM

Không dùng nếu chưa có bằng chứng tương ứng:

- “Hoàn thành 100%”.
- “Supabase an toàn”.
- “RLS đã kiểm tra chuẩn”.
- “Production ready”.
- “Xóa đã đồng bộ” nếu test không gọi delete thật.
- “Round-trip placements/logs” nếu canonical database không có collections đó.
- “Mobile đã khóa” nếu React Flow node vẫn draggable.
- “Dùng dữ liệu thật” nếu page còn `DOSSIERS` hoặc fallback mock.
- “Atomic” nếu UI gọi hai save hoặc RPC không tạo đủ dữ liệu trong transaction.

---

## NEXT EXACT STEP SAU KHI ANTIGRAVITY GIAO

Codex sẽ review độc lập mã, SQL contract, repository default gateway, role scope và verification. Chỉ đề xuất nghiệm thu khi không còn finding nghiêm trọng/trung bình và các hạng mục không chạy được đã được ghi `NOT RUN` trung thực.
