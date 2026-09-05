# Homies Career Map Drag-and-Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay bước thiết lập từng cặp vị trí bằng một sơ đồ lộ trình Homies kéo thả, dùng trực tiếp danh mục chức vụ/cấp bậc, tự gắn tiêu chí theo node, điều kiện tăng bậc theo loại đường nối và triển khai một lần cho toàn chuỗi.

**Architecture:** Tạo một domain `career-map` độc lập nhưng tích hợp vào KPI repository hiện có. Logic đồ thị, tiêu chí, kiểm tra và triển khai nằm trong các service TypeScript thuần để kiểm thử không phụ thuộc UI. Giao diện dùng `@xyflow/react` cho canvas kéo thả/nối nhánh; `/kpi/settings` chỉ điều phối wizard, quyền và persistence. Khi CEO triển khai, hệ thống tạo snapshot có ngày hiệu lực, sinh các KPI set cần thiết và tự xếp nhân viên theo chức vụ hiện tại; dữ liệu KPI lịch sử không bị thay đổi.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS v4, `@xyflow/react`, local-first KPI repository, Supabase PostgreSQL/RLS, Node test runner, ESLint.

---

## 0. Phạm vi khóa và prompt giao Antigravity

### 0.1. Đọc theo thứ tự

1. `AGENTS.md`
2. `DESIGN_RULE_HOMIES_FINAL.md`
3. `docs/CODEMAP.md`
4. `docs/KNOWN_ISSUES.md`
5. `docs/TOKEN_PLAYBOOK.md`
6. `docs/AI_PLAN_AI_CODE_RULES.md`
7. `docs/superpowers/specs/2026-08-24-kpi-homies-career-map-drag-drop-design.md`
8. File kế hoạch này
9. `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
10. Tài liệu CSS/global stylesheet phù hợp trong `node_modules/next/dist/docs/` trước khi import CSS của React Flow.

### 0.2. EXECUTION REQUEST - gửi nguyên khối này cho Antigravity

```text
Hãy triển khai “Sơ đồ Lộ trình Phát triển Homies kéo thả”.

Đọc và tuân thủ tuyệt đối:
- docs/superpowers/specs/2026-08-24-kpi-homies-career-map-drag-drop-design.md
- docs/superpowers/plans/2026-08-24-kpi-homies-career-map-drag-drop-implementation-plan.md
- AGENTS.md và các tài liệu bắt buộc tại Task 0.

Chỉ làm MỘT task trong plan mỗi lần. Trước khi sửa nhiều file, liệt kê chính xác file sẽ sửa và chờ tôi xác nhận. Viết test đỏ trước, chạy để thấy test fail đúng lý do, sau đó mới viết code. Sau mỗi task phải chạy verification ghi trong task, cập nhật tick [x] và báo “next exact step”.

Không được:
- tạo flow setup riêng cho từng vị trí hoặc từng đường nối;
- cho cửa hàng sửa sơ đồ, tiêu chí hoặc trọng số;
- hồi tố thay đổi vào KPI đã công bố;
- tự tạo chuyển ngang giữa các nghề cùng cấp;
- tự triển khai khi chưa có CEO duyệt;
- refactor/rename/di chuyển code ngoài phạm vi;
- tự commit, stage hoặc push khi chưa được yêu cầu.

Bắt đầu bằng Task 1 duy nhất. Không tự chuyển sang Task 2.
```

## 1. Bản đồ file dự kiến

### Domain và service

- Create `src/lib/kpi/career-map-types.ts`
- Create `src/lib/kpi/career-map-service.ts`
- Create `src/lib/kpi/career-map-service.test.ts`
- Create `src/lib/kpi/career-map-criteria-service.ts`
- Create `src/lib/kpi/career-map-criteria-service.test.ts`
- Create `src/lib/kpi/career-map-deployment-service.ts`
- Create `src/lib/kpi/career-map-deployment-service.test.ts`
- Modify `src/lib/kpi/index.ts`

### Persistence

- Modify `src/lib/kpi/repository.ts`
- Modify `src/lib/kpi/local-repository.ts`
- Modify `src/lib/kpi/local-repository.test.ts`
- Modify `src/lib/kpi/seed.ts`
- Create `supabase/migrations/20260824_kpi_career_map.sql`
- Create `supabase/migrations/20260824_kpi_career_map_rls.sql`
- Create `supabase/seed_kpi_career_map_demo.sql`

### UI

- Create `src/components/kpi/career-map/KPICareerMapDesigner.tsx`
- Create `src/components/kpi/career-map/KPICareerPositionTray.tsx`
- Create `src/components/kpi/career-map/KPICareerMapCanvas.tsx`
- Create `src/components/kpi/career-map/KPICareerMapNode.tsx`
- Create `src/components/kpi/career-map/KPICareerMapInspector.tsx`
- Create `src/components/kpi/career-map/KPICareerCriteriaLibraryDrawer.tsx`
- Create `src/components/kpi/career-map/KPICareerMapValidationPanel.tsx`
- Create `src/components/kpi/career-map/KPICareerMapDeploymentPreview.tsx`
- Create `src/components/kpi/career-map/KPICareerMapReadOnly.tsx`

### Tích hợp

- Modify `src/components/kpi/program/KPIProgramScopeStep.tsx`
- Modify `src/components/kpi/program/KPIAdvancedSettingsPanel.tsx`
- Modify `src/app/kpi/settings/page.tsx`
- Modify `src/app/kpi/promotion/page.tsx`
- Modify `package.json`
- Modify `package-lock.json`
- Modify `docs/CODEMAP.md`
- Modify `docs/KNOWN_ISSUES.md` chỉ khi phát hiện/fix bug mới
- Modify file plan này để tick task đã hoàn thành

## 2. Quyết định kỹ thuật đã khóa

1. Một `KpiCareerMapVersion` đại diện cho toàn bộ sơ đồ, không tạo một sơ đồ cho mỗi vị trí hoặc cửa hàng.
2. Node tham chiếu `position_id` của master data khi còn draft và giữ snapshot tên/cấp bậc khi publish.
3. Edge chỉ nối từ cấp `n` lên `n + 1`; nhiều nguồn được phép hội tụ vào cùng một node.
4. Cùng cấp là nhánh song song, không tự tạo đường chuyển ngang.
5. Tiêu chí thuộc node/vị trí; điều kiện tăng bậc thuộc edge nhưng tham chiếu preset dùng chung.
6. Một preset được chỉnh một lần; edge chỉ lưu `preset_key` và `preset_version`, không copy form cấu hình vào từng edge khi còn draft.
7. Mọi chỉnh sửa bản đã publish tạo bản draft kế tiếp; KPI period cũ giữ snapshot cũ.
8. HR Admin chỉnh và gửi duyệt; CEO duyệt/trả lại/triển khai; quản lý và nhân viên chỉ xem.
9. Local repository là môi trường demo chính; Supabase migration tạo hợp đồng backend thật nhưng UI không được bypass service quyền.
10. Canvas chỉnh sửa ưu tiên desktop; mobile/tablet có read-only pan/zoom và danh sách fallback.
11. `Một chặng riêng` chỉ nằm trong Advanced Settings và không xuất hiện trong flow mặc định.
12. Dùng `@xyflow/react`; không tự viết engine kéo thả/SVG mới.

---

## Task 1: Tạo domain đồ thị và luật nối vị trí

**Files:**

- Create: `src/lib/kpi/career-map-types.ts`
- Create: `src/lib/kpi/career-map-service.ts`
- Create: `src/lib/kpi/career-map-service.test.ts`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho draft và validation**

Test phải khóa ít nhất các tình huống:

```ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  addCareerMapEdge,
  createCareerMapDraft,
  findUnplacedPositions,
  validateCareerMap,
} from './career-map-service.ts'

const positions = [
  { id: 'barista_c1', name: 'Pha chế C1', department_id: 'ops', level: 1, base_salary: 0, pay_type: 'hourly' as const },
  { id: 'barista_c2', name: 'Pha chế C2', department_id: 'ops', level: 2, base_salary: 0, pay_type: 'hourly' as const },
  { id: 'cashier_c2', name: 'Thu ngân C2', department_id: 'ops', level: 2, base_salary: 0, pay_type: 'hourly' as const },
  { id: 'shift_leader', name: 'Trưởng ca', department_id: 'ops', level: 3, base_salary: 0, pay_type: 'monthly' as const },
]

describe('career map graph rules', () => {
  it('creates one chain-wide draft from Homies position master data', () => {
    const map = createCareerMapDraft(positions, 'hr_01', '2026-08-24T08:00:00.000Z')
    assert.equal(map.scope, 'chain')
    assert.equal(map.status, 'draft')
    assert.equal(map.nodes.length, 0)
    assert.equal(map.master_position_snapshot.length, 4)
  })

  it('allows branches to converge on the next level', () => {
    // Add barista_c2, cashier_c2 and shift_leader nodes, then connect both level-2 nodes.
    // Expected: two edges and no blocking issue.
  })

  it('blocks same-level, downward, skipped-level and cyclic edges', () => {
    // Assert stable issue codes: same_level, downward, skipped_level, cycle.
  })

  it('lists a newly created master position as unplaced', () => {
    const map = createCareerMapDraft(positions, 'hr_01', '2026-08-24T08:00:00.000Z')
    assert.deepEqual(findUnplacedPositions(map, positions).map((item) => item.id), positions.map((item) => item.id))
  })
})
```

- [x] **Step 2: Chạy test để xác nhận đỏ đúng lý do**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts
```

Expected: FAIL vì module/service chưa tồn tại; không chấp nhận lỗi cú pháp test.

- [x] **Step 3: Tạo types đầy đủ và có discriminator rõ ràng**

Các type tối thiểu:

```ts
export type KpiCareerMapStatus = 'draft' | 'pending_approval' | 'published' | 'returned' | 'superseded'
export type KpiCareerMapIssueSeverity = 'blocking' | 'warning'
export type KpiCareerTransitionPresetKey =
  | 'same_profession_level_up'
  | 'to_senior_employee'
  | 'to_shift_leader'
  | 'to_store_manager'

export interface KpiCareerMapNode {
  id: string
  position_id: string
  position_name_snapshot: string
  position_level_snapshot: number
  job_family: string
  x: number
  y: number
  criteria_profile_id: string | null
  active: boolean
}

export interface KpiCareerMapEdge {
  id: string
  source_node_id: string
  target_node_id: string
  preset_key: KpiCareerTransitionPresetKey
  preset_version: number
  active: boolean
}

export interface KpiCareerMapVersion {
  id: string
  version: number
  status: KpiCareerMapStatus
  scope: 'chain'
  effective_from: string | null
  created_by: string
  approved_by: string | null
  returned_reason: string | null
  created_at: string
  updated_at: string
  based_on_version_id: string | null
  master_position_snapshot: KpiCareerPositionSnapshot[]
  nodes: KpiCareerMapNode[]
  edges: KpiCareerMapEdge[]
}
```

- [x] **Step 4: Implement service thuần TypeScript**

Service phải có:

- `createCareerMapDraft`
- `addCareerMapNode`
- `moveCareerMapNode`
- `removeCareerMapNode`
- `addCareerMapEdge`
- `removeCareerMapEdge`
- `classifyCareerTransition`
- `findUnplacedPositions`
- `validateCareerMap`
- DFS hoặc Kahn để phát hiện vòng lặp

Mọi hàm cập nhật trả object mới, không mutate input để giữ snapshot an toàn.

- [x] **Step 5: Chạy test xanh và kiểm tra export**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts
npx tsc --noEmit
```

Expected: tất cả test PASS; TypeScript exit code 0.

---

## Task 2: Tạo thư viện tiêu chí và flow thêm tiêu chí đơn giản

**Files:**

- Create: `src/lib/kpi/career-map-criteria-service.ts`
- Create: `src/lib/kpi/career-map-criteria-service.test.ts`
- Modify: `src/lib/kpi/career-map-types.ts`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho gợi ý, phạm vi và cân trọng số**

```ts
describe('career map criteria', () => {
  it('suggests Homies F&B criteria before custom creation', () => {
    const suggestions = suggestCriteriaForPosition({ id: 'barista_c1', name: 'Pha chế C1', level: 1 })
    assert.equal(suggestions[0].source, 'homies_recommended')
    assert.ok(suggestions.some((item) => item.name === 'Đúng công thức'))
  })

  it('converts four plain-language answers into a measurable criterion', () => {
    const criterion = createCustomCriterion({
      outcome: 'Giảm món làm sai công thức',
      evidence_source: 'shift_log',
      pass_target: 'Không quá 2 món sai mỗi tháng',
      importance: 'high',
    })
    assert.equal(criterion.direction, 'lower_is_better')
    assert.equal(criterion.suggested_weight, 30)
  })

  it('applies one criterion to current position, job family or selected positions', () => {
    // Assert the exact affected position IDs for all three scope modes.
  })

  it('auto rebalances enabled criteria to exactly 100 percent', () => {
    const result = rebalanceCriteriaWeights([
      { id: 'a', weight: 50, locked: false },
      { id: 'b', weight: 40, locked: false },
      { id: 'c', weight: 30, locked: false },
    ])
    assert.equal(result.reduce((sum, item) => sum + item.weight, 0), 100)
  })
})
```

- [x] **Step 2: Chạy test đỏ**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-criteria-service.test.ts
```

Expected: FAIL vì service chưa tồn tại.

- [x] **Step 3: Implement profile và thư viện**

Type tối thiểu:

```ts
export interface KpiPositionCriteriaProfile {
  id: string
  position_ids: string[]
  job_family: string | null
  version: number
  effective_from: string | null
  criteria: KpiCareerCriterion[]
}

export type KpiCriteriaApplyScope =
  | { mode: 'current_position'; position_id: string }
  | { mode: 'job_family'; job_family: string }
  | { mode: 'selected_positions'; position_ids: string[] }
```

Tái sử dụng `guessKpiTemplateForPosition()` và catalog F&B hiện có thay vì tạo một catalog KPI thứ hai. Chỉ thêm lớp chuyển đổi sang gợi ý thân thiện cho career map.

- [x] **Step 4: Implement tự cân trọng số có quy tắc làm tròn**

Quy tắc:

- tổng cuối cùng luôn đúng 100;
- tiêu chí bị khóa không đổi;
- phần dư do làm tròn cộng vào tiêu chí chưa khóa có trọng số lớn nhất;
- nếu tổng tiêu chí khóa lớn hơn 100, trả blocking issue thay vì tự sửa;
- giữ ba lựa chọn UI: `auto_rebalance`, `reduce_another`, `advanced_manual`.

- [x] **Step 5: Chạy verification**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/fnb-template-catalog.test.ts
npx tsc --noEmit
```

Expected: test mới và catalog cũ đều PASS.

---

## Task 3: Tạo preview triển khai, mapping nhân viên và snapshot lịch sử

**Files:**

- Create: `src/lib/kpi/career-map-deployment-service.ts`
- Create: `src/lib/kpi/career-map-deployment-service.test.ts`
- Modify: `src/lib/kpi/career-map-types.ts`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho preview và publish**

```ts
describe('career map deployment', () => {
  it('summarizes branches, nodes, edges, criteria, employees and stores', () => {
    const preview = createCareerMapDeploymentPreview(fixture)
    assert.equal(preview.position_count, 6)
    assert.equal(preview.transition_count, 5)
    assert.equal(preview.store_count, 12)
  })

  it('maps employees by their current position and reports conflicts', () => {
    const result = placeEmployeesOnCareerMap(fixture.map, fixture.employees)
    assert.equal(result.placed.length, 2)
    assert.equal(result.unresolved[0].reason, 'position_not_in_map')
  })

  it('blocks HR from publishing and allows CEO final approval', () => {
    assert.throws(() => publishCareerMap(fixture, { id: 'hr_01', role: 'hr_admin' }))
    assert.equal(publishCareerMap(fixture, { id: 'ceo_01', role: 'ceo' }).map.status, 'published')
  })

  it('keeps an immutable published snapshot when master data changes', () => {
    const published = publishCareerMap(fixture, { id: 'ceo_01', role: 'ceo' }).map
    fixture.positions[0].name = 'Tên mới'
    assert.notEqual(published.nodes[0].position_name_snapshot, 'Tên mới')
  })
})
```

- [x] **Step 2: Chạy test đỏ**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-deployment-service.test.ts
```

- [x] **Step 3: Implement workflow trạng thái và quyền**

Các hàm tối thiểu:

- `createCareerMapDeploymentPreview`
- `placeEmployeesOnCareerMap`
- `submitCareerMapForApproval`
- `returnCareerMapDraft`
- `publishCareerMap`
- `clonePublishedCareerMapAsDraft`
- `buildKpiSetDraftsFromCareerMap`

State transition hợp lệ:

```text
draft --HR gửi--> pending_approval
pending_approval --CEO trả lại--> returned --HR sửa--> draft
pending_approval --CEO duyệt--> published
published --phiên bản mới có hiệu lực--> superseded
```

- [x] **Step 4: Sinh KPI set theo node nhưng không yêu cầu xác nhận từng node**

`buildKpiSetDraftsFromCareerMap` dùng profile tiêu chí của node và promotion preset của outgoing edge. Kết quả được tạo hàng loạt từ một lệnh triển khai. Node có nhiều outgoing edge vẫn chỉ có một bộ tiêu chí vị trí; readiness đọc các edge khác nhau.

- [x] **Step 5: Chạy verification**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/program-service.test.ts
npx tsc --noEmit
```

Expected: mọi test PASS; dữ liệu snapshot không bị mutate.

---

## Task 4: Mở rộng local repository và seed demo

**Files:**

- Modify: `src/lib/kpi/repository.ts`
- Modify: `src/lib/kpi/local-repository.ts`
- Modify: `src/lib/kpi/local-repository.test.ts`
- Modify: `src/lib/kpi/seed.ts`

- [x] **Step 1: Viết test đỏ cho tương thích dữ liệu cũ**

Thêm test:

```ts
it('normalizes legacy databases without career map collections', async () => {
  storage.setItem(KPI_REPOSITORY_STORAGE_KEY, JSON.stringify({ schema_version: 1, revision: 4, sets: [] }))
  const database = await repository.load()
  assert.deepEqual(database.career_maps, [])
  assert.deepEqual(database.position_criteria_profiles, [])
})

it('round trips career map drafts and criteria profiles', async () => {
  const saved = await repository.save({
    ...createEmptyKpiDatabase(),
    career_maps: [careerMapFixture],
    position_criteria_profiles: [criteriaProfileFixture],
  }, 0)
  assert.equal(saved.career_maps[0].id, careerMapFixture.id)
})
```

- [x] **Step 2: Chạy test đỏ**

```powershell
node --experimental-strip-types --test src/lib/kpi/local-repository.test.ts
```

Expected: FAIL vì `KpiDatabase` chưa có collection mới.

- [x] **Step 3: Mở rộng database không phá dữ liệu cũ**

```ts
export interface KpiDatabase {
  schema_version: 1
  revision: number
  career_maps: KpiCareerMapVersion[]
  position_criteria_profiles: KpiPositionCriteriaProfile[]
  // các collection cũ giữ nguyên
}
```

Không đổi storage key ở pass này. `normalizeDatabase` phải thêm mảng rỗng khi đọc localStorage cũ.

- [x] **Step 4: Thêm seed Homies có nhiều nhánh hội tụ**

Seed phải có ít nhất bốn nhánh Pha chế/Thu ngân/Phục vụ/Bếp, một Trưởng ca, một Quản lý cửa hàng, profile tiêu chí đủ 100% và một phiên bản `published` để demo read-only.

- [x] **Step 5: Chạy verification**

```powershell
node --experimental-strip-types --test src/lib/kpi/local-repository.test.ts src/lib/kpi/career-map-deployment-service.test.ts
npx tsc --noEmit
```

---

## Task 5: Tạo schema Supabase, RLS, RPC và file seed test

**Files:**

- Create: `supabase/migrations/20260824_kpi_career_map.sql`
- Create: `supabase/migrations/20260824_kpi_career_map_rls.sql`
- Create: `supabase/seed_kpi_career_map_demo.sql`

- [x] **Step 1: Viết migration bảng và constraint**

Các bảng:

- `kpi_career_map_versions`
- `kpi_career_map_nodes`
- `kpi_career_map_edges`
- `kpi_position_criteria_profiles`
- `kpi_position_criteria_items`
- `kpi_career_employee_placements`
- `kpi_career_map_approval_logs`

Constraint bắt buộc:

```sql
check (status in ('draft', 'pending_approval', 'published', 'returned', 'superseded'))
check (scope = 'chain')
check (source_node_id <> target_node_id)
unique (career_map_version_id, position_id)
unique (career_map_version_id, source_node_id, target_node_id)
```

Database trigger hoặc RPC publish phải kiểm tra target level bằng source level + 1 từ snapshot node. Không chỉ dựa vào UI.

- [x] **Step 2: Viết RLS theo đúng bốn vai trò**

- HR Admin: CRUD draft/returned, submit approval; không publish.
- CEO: đọc pending, return hoặc publish.
- Store Manager: chỉ đọc published map và placement thuộc cửa hàng được phép.
- Employee: chỉ đọc published map và placement của bản thân.

Tái sử dụng cách lấy role/employee/store scope của migration KPI hiện có; không phát minh claim mới nếu hệ thống đã có helper.

- [x] **Step 3: Viết RPC giao dịch nguyên tử**

RPC tối thiểu:

- `submit_kpi_career_map_for_approval(p_map_id uuid)`
- `return_kpi_career_map(p_map_id uuid, p_reason text)`
- `publish_kpi_career_map(p_map_id uuid, p_effective_from date)`

`publish` phải khóa row, revalidate graph, snapshot dữ liệu, supersede phiên bản cũ cùng ngày hiệu lực phù hợp và ghi approval log trong một transaction.

- [x] **Step 4: Viết seed demo idempotent**

File seed dùng `on conflict` hoặc guard để chạy lại an toàn, tạo sơ đồ mẫu nhiều nhánh và không phụ thuộc ID ngẫu nhiên không tồn tại. Ghi chú rõ thứ tự chạy ba file.

- [x] **Step 5: Kiểm tra SQL**

Nếu Supabase CLI và local stack có sẵn:

```powershell
supabase db reset
```

Sau đó chạy SQL kiểm tra:

```sql
select status, count(*) from kpi_career_map_versions group by status;
select count(*) from kpi_career_map_edges e
join kpi_career_map_nodes s on s.id = e.source_node_id
join kpi_career_map_nodes t on t.id = e.target_node_id
where t.position_level_snapshot <> s.position_level_snapshot + 1;
```

Expected: có bản demo; query edge sai cấp trả `0`. Nếu không có local Supabase, báo rõ `not run` và giao đúng ba file SQL để người dùng test, không tuyên bố đã chạy thành công.

---

## Task 6: Cài React Flow và dựng canvas kéo thả cơ bản

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/kpi/career-map/KPICareerMapDesigner.tsx`
- Create: `src/components/kpi/career-map/KPICareerPositionTray.tsx`
- Create: `src/components/kpi/career-map/KPICareerMapCanvas.tsx`
- Create: `src/components/kpi/career-map/KPICareerMapNode.tsx`

- [x] **Step 1: Cài dependency đã khóa**

```powershell
npm install @xyflow/react
```

Expected: chỉ `package.json` và `package-lock.json` thay đổi do cài package.

- [x] **Step 2: Đọc Next.js 16 docs rồi chọn vị trí import CSS**

Import `@xyflow/react/dist/style.css` tại vị trí Next.js 16 cho phép. Không import CSS global sai scope rồi sửa bằng workaround.

- [x] **Step 3: Dựng component theo state từ service**

Props chính:

```ts
export interface KPICareerMapDesignerProps {
  map: KpiCareerMapVersion
  positions: PositionItem[]
  employeeCountByPosition: Record<string, number>
  readOnly?: boolean
  onChange(next: KpiCareerMapVersion): void
  onSelectNode(nodeId: string | null): void
  onSelectEdge(edgeId: string | null): void
}
```

UI phải có:

- khay trái nhóm theo nghề và `Chưa xếp vào lộ trình`;
- canvas giữa có zoom, pan, minimap/controls;
- node hiện tên, cấp bậc, số nhân viên và trạng thái tiêu chí;
- drag từ khay tạo node;
- drag node chỉ cập nhật `x/y`;
- connect gọi `addCareerMapEdge`, không tự nối trực tiếp bằng React Flow state;
- toast tiếng Việt khi edge bị chặn;
- fallback danh sách node/edge nếu canvas lỗi.

- [x] **Step 4: Mobile/read-only behavior**

Dưới breakpoint mobile: tắt tạo edge và kéo node, giữ pan/zoom/xem chi tiết. Hiện thông báo `Chỉnh sửa sơ đồ trên máy tính để thao tác chính xác hơn`.

- [x] **Step 5: Verification**

```powershell
npm run lint -- src/components/kpi/career-map/KPICareerMapDesigner.tsx src/components/kpi/career-map/KPICareerPositionTray.tsx src/components/kpi/career-map/KPICareerMapCanvas.tsx src/components/kpi/career-map/KPICareerMapNode.tsx
npx tsc --noEmit
```

Manual check tại desktop và mobile: kéo node, nối hai nhánh vào Trưởng ca, thử nối ngang/xuống/nhảy cấp và xác nhận thông báo dễ hiểu.

---

## Task 7: Tạo inspector, thư viện tiêu chí và validation panel

**Files:**

- Create: `src/components/kpi/career-map/KPICareerMapInspector.tsx`
- Create: `src/components/kpi/career-map/KPICareerCriteriaLibraryDrawer.tsx`
- Create: `src/components/kpi/career-map/KPICareerMapValidationPanel.tsx`
- Modify: `src/components/kpi/career-map/KPICareerMapDesigner.tsx`

- [x] **Step 1: Tạo inspector theo node hoặc edge đang chọn**

Node view hiển thị tiêu chí, nguồn, trọng số, số người/cửa hàng ảnh hưởng và nút `Thêm tiêu chí`. Edge view hiển thị preset, số tháng, điểm tối thiểu, số ca/giờ, test/thử vai/360 và nhãn `Dùng chung cho loại chặng ...`.

- [x] **Step 2: Tạo thư viện tiêu chí trước form riêng**

Thứ tự tab/section:

1. Homies đề xuất
2. F&B phổ biến
3. Vị trí tương tự đang dùng
4. Tạo tiêu chí riêng

Custom form chỉ hỏi bốn câu đã duyệt. Trường kỹ thuật nằm sau `Chỉnh nâng cao`, mặc định đóng.

- [x] **Step 3: Tạo flow phạm vi và cân trọng số**

Trước nút áp dụng, hiển thị:

- vị trí bị ảnh hưởng;
- số nhân viên;
- số cửa hàng;
- tổng trọng số trước/sau.

Nếu vượt 100%, modal đưa đúng ba lựa chọn, mặc định focus `Tự cân lại`.

- [x] **Step 4: Validation panel dùng ngôn ngữ nghiệp vụ**

Ví dụ mapping issue code:

```ts
const ISSUE_MESSAGES = {
  skipped_level: 'Không thể nối {source} lên {target} vì đang bỏ qua một cấp bậc.',
  missing_criteria: '{position} chưa có bộ tiêu chí đánh giá.',
  unplaced_position: '{position} chưa được xếp vào lộ trình.',
  unresolved_employee: '{count} nhân viên chưa xác định được vị trí trên sơ đồ.',
}
```

Click issue phải focus node/edge liên quan trên canvas.

- [x] **Step 5: Verification**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-service.test.ts
npm run lint -- src/components/kpi/career-map
npx tsc --noEmit
```

---

## Task 8: Tích hợp career map vào wizard và chuyển “Một chặng riêng” sang Nâng cao

**Files:**

- Modify: `src/components/kpi/program/KPIProgramScopeStep.tsx`
- Modify: `src/components/kpi/program/KPIAdvancedSettingsPanel.tsx`
- Create: `src/components/kpi/career-map/KPICareerMapDeploymentPreview.tsx`
- Modify: `src/app/kpi/settings/page.tsx`

- [x] **Step 1: Viết integration test đỏ cho flow map-level**

Tạo hoặc mở rộng test service integration để khóa hành vi:

```ts
it('creates all KPI drafts from one approved career map action', () => {
  const result = buildKpiSetDraftsFromCareerMap(fixture)
  assert.equal(result.sets.length, fixture.map.nodes.length)
  assert.equal(new Set(result.sets.map((item) => item.position_ids[0])).size, fixture.map.nodes.length)
})

it('does not require per-stage confirmation', () => {
  const preview = createCareerMapDeploymentPreview(fixture)
  assert.equal(preview.requires_individual_confirmation, false)
})
```

- [x] **Step 2: Thay nội dung bước Lộ trình & Phạm vi**

`KPIProgramScopeStep` trở thành wrapper mỏng cho `KPICareerMapDesigner`. Xóa khỏi flow chính:

- dropdown vị trí hiện tại;
- dropdown vị trí hướng tới;
- danh sách từng chặng đề xuất;
- nút tạo draft từng chặng.

Không xóa service cũ ngay nếu nơi khác còn dùng; chỉ ngừng gọi từ flow chính.

- [x] **Step 3: Đổi controller trang settings sang map-level**

Thay `handleApplyCareerStages()` bằng các handler:

- `handleSaveCareerMapDraft`
- `handleSubmitCareerMap`
- `handleReturnCareerMap`
- `handlePublishCareerMap`

Trang giữ một `selectedCareerMapId`, không dùng `selectedVersion.promotion_rule` làm nguồn chính của bước 2. Các bước Nguồn đánh giá/Điều kiện đạt đọc preview tổng hợp từ profiles/presets; chỉnh preset một lần theo loại chặng.

- [x] **Step 4: Tạo preview cuối và action theo quyền**

Preview hiển thị đủ số nhánh, vị trí, đường nối, profile, preset, nhân viên đã xếp/chưa xếp, cửa hàng, ngày hiệu lực và diff với bản đang chạy.

- HR thấy `Gửi duyệt`.
- CEO thấy `Duyệt & triển khai` và `Trả lại`.
- Store Manager/Employee chỉ thấy `Xem lộ trình`.
- Có `returned_reason` rõ ràng khi CEO trả lại.

- [x] **Step 5: Chuyển “Một chặng riêng” vào Advanced**

Giữ UI cũ dưới accordion `Ngoại lệ: Tạo một chặng riêng`. Thêm mô tả: chỉ dùng khi lộ trình chuẩn không đáp ứng trường hợp đặc biệt. Không đặt nó ngang hàng với flow chuẩn.

- [x] **Step 6: Verification**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/program-service.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/program/KPIAdvancedSettingsPanel.tsx src/components/kpi/career-map
npx tsc --noEmit
```

Manual acceptance: Admin hoàn thành sơ đồ nhiều nhánh, thêm tiêu chí, xem preview và gửi duyệt mà không mở/xác nhận từng vị trí hoặc từng chặng.

---

## Task 9: Tạo màn hình xem lộ trình cho quản lý và nhân viên

**Files:**

- Create: `src/components/kpi/career-map/KPICareerMapReadOnly.tsx`
- Modify: `src/app/kpi/promotion/page.tsx`

- [x] **Step 1: Tạo read-only component dùng cùng graph data**

Không copy sơ đồ thành data/UI thứ hai. Component nhận published map và highlight:

- node hiện tại;
- các node kế tiếp hợp lệ;
- điều kiện đã đạt/chưa đạt;
- số tháng liên tiếp hiện tại;
- test, thử vai, 360 hoặc lỗi chặn còn thiếu.

- [x] **Step 2: Áp scope theo người xem**

- Nhân viên chỉ xem placement và tiến độ của bản thân.
- Quản lý xem nhân viên thuộc cửa hàng được phép.
- Không render action chỉnh sửa dù người dùng sửa URL/query.

- [x] **Step 3: Empty/error states**

- chưa có sơ đồ publish;
- nhân viên chưa được mapping;
- vị trí hiện tại không có chặng tiếp theo;
- dữ liệu tải lỗi và nút thử lại.

- [x] **Step 4: Verification**

```powershell
npm run lint -- src/app/kpi/promotion/page.tsx src/components/kpi/career-map/KPICareerMapReadOnly.tsx
npx tsc --noEmit
```

Manual check ba vai trò: HR/CEO, Store Manager, Employee.

---

## Task 10: Rà soát bảo mật, lỗi biên và khả năng dùng thật

**Files:**

- Modify các file career map vừa tạo nếu test phát hiện lỗi
- Modify `docs/KNOWN_ISSUES.md` nếu có bug mới đã fix

- [x] **Step 1: Chạy test cạnh tranh version**

Thêm test để xác nhận save với revision cũ bị từ chối và draft local không ghi đè bản mới.

- [x] **Step 2: Chạy test dữ liệu biên**

Bao phủ:

- node bị xóa nhưng còn nhân viên;
- position master đổi tên/cấp khi draft đang mở;
- profile thiếu hoặc tổng trọng số sai;
- preset thiếu trường bắt buộc;
- nhiều chức vụ chính xung đột;
- ngày hiệu lực trước ngày hiện tại;
- publish hai phiên bản đồng thời;
- canvas fail nhưng bảng fallback vẫn đọc được.

- [x] **Step 3: Kiểm tra thao tác thực chiến**

Đo bằng flow demo, không yêu cầu người dùng biết thuật ngữ KPI:

1. Người mới mở trang hiểu phải kéo vị trí vào sơ đồ.
2. Tạo bốn nhánh hội tụ trong tối đa một flow liên tục.
3. Thêm tiêu chí không cần nhập form kỹ thuật.
4. Lỗi nói rõ “vị trí nào, vì sao, làm gì tiếp”.
5. Chỉ một lần gửi duyệt và một lần CEO triển khai.

- [x] **Step 4: Ghi bug mới đã fix**

Nếu có bug mới, thêm mục ngắn vào `docs/KNOWN_ISSUES.md`: triệu chứng, nguyên nhân, cách fix, test phòng tái phát. Không thêm nếu không có bug.

- [x] **Step 5: Verification pass**

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/local-repository.test.ts src/lib/kpi/program-service.test.ts src/lib/kpi/fnb-template-catalog.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/app/kpi/promotion/page.tsx src/components/kpi/career-map src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/program/KPIAdvancedSettingsPanel.tsx src/lib/kpi
npx tsc --noEmit
```

Expected: tests PASS, ESLint 0 error, TypeScript exit code 0.

---

## Task 11: Cập nhật tài liệu và production QA

**Files:**

- Modify: `docs/CODEMAP.md`
- Modify: file plan này
- Modify: `docs/KNOWN_ISSUES.md` chỉ nếu Task 10 có bug

- [x] **Step 1: Cập nhật CODEMAP**

Ghi rõ:

- domain/service career map;
- repository collections;
- các component canvas/criteria/preview/read-only;
- route settings và promotion;
- ba file Supabase.

- [x] **Step 2: Tick toàn bộ task đã thực hiện**

Không tick task chỉ mới viết code nhưng chưa chạy verification tương ứng.

- [x] **Step 3: Chạy full quality gate**

```powershell
npm run lint
npx tsc --noEmit
npm run build
npm run ai:ready
git status --short
```

Expected:

- ESLint không lỗi;
- TypeScript exit code 0;
- Next.js production build thành công;
- AI guard/context thành công;
- `git status` chỉ được dùng để báo file thay đổi, không tự stage/commit.

- [x] **Step 4: Nghiệm thu theo 10 tiêu chí của spec**

Ghi kết quả từng tiêu chí tại cuối task hoặc báo rõ tiêu chí nào chưa đạt. Không tuyên bố hoàn tất nếu còn lỗi chặn triển khai, quyền chưa test hoặc build chưa chạy.

## 3. Thứ tự phụ thuộc

```text
Task 1 Domain graph
    ↓
Task 2 Criteria service
    ↓
Task 3 Deployment/versioning
    ↓
Task 4 Local persistence
    ├──────────────→ Task 5 Supabase
    ↓
Task 6 Canvas UI
    ↓
Task 7 Inspector + criteria UX
    ↓
Task 8 Settings integration
    ↓
Task 9 Read-only career view
    ↓
Task 10 Edge/security review
    ↓
Task 11 Docs + production QA
```

## 4. Definition of Done

Chỉ xem là hoàn thành khi:

1. HR Admin dựng được một sơ đồ toàn chuỗi từ master positions bằng kéo thả.
2. Graph chặn vòng lặp, nối ngang, nối xuống và nhảy cấp ở cả service lẫn backend.
3. Nhiều nhánh hội tụ được vào Trưởng ca/Quản lý cửa hàng.
4. Node tự nhận tiêu chí; edge tự nhận preset; không setup lặp từng vị trí/chặng.
5. Admin thêm tiêu chí bằng thư viện hoặc bốn câu hỏi đơn giản và tự cân về 100%.
6. Preview cho biết toàn bộ phạm vi ảnh hưởng và mapping chưa xử lý.
7. HR chỉ gửi duyệt; CEO là người duyệt cuối và triển khai.
8. Published version có snapshot/ngày hiệu lực; KPI lịch sử không đổi.
9. Store Manager và Employee có màn xem phù hợp quyền, không chỉnh được.
10. Unit tests, lint, TypeScript, production build và AI guard đều đạt.
