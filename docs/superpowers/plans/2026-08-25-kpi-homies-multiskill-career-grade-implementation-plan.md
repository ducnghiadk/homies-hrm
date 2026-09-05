# Homies Multiskill Career Grade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Chuyển KPI Career Map từ mô hình nhiều chức danh Pha chế/Thu ngân sang một chức danh Nhân viên cửa hàng với hai điểm vào C1-PC/C1-TN hội tụ tại C2, sau đó C3 Senior → C4 Trưởng ca → C5 Quản lý cửa hàng.

**Architecture:** Giữ KpiLevelCode cũ chỉ để đọc snapshot KPI lịch sử; bổ sung domain CareerGradeCode, chứng nhận kỹ năng và placement có phiên bản. Career Map node, criteria profile và promotion rule dùng grade code ổn định thay vì suy luận từ tên chức danh. Dữ liệu cũ đi qua dry-run migration có checksum và hàng chờ HR xác nhận trước khi ghi.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase Postgres/RLS, localStorage repository, Node test runner.

---

## 1. File structure

### File mới

- src/lib/kpi/career-grade-types.ts: type grade, skill, certification và placement.
- src/lib/kpi/career-grade-catalog.ts: catalog C1-PC/C1-TN/C2/C3/C4/C5 và transition chuẩn.
- src/lib/kpi/career-grade-catalog.test.ts: khóa catalog và hai điểm vào C1.
- src/lib/kpi/career-grade-placement-service.ts: xếp nhân viên từ decision/certification.
- src/lib/kpi/career-grade-placement-service.test.ts: khóa fail-closed placement.
- src/lib/kpi/career-grade-migration-service.ts: dry-run mapping dữ liệu cũ.
- src/lib/kpi/career-grade-migration-service.test.ts: khóa checksum và hàng chờ HR.
- src/components/kpi/career-map/KPIHomiesCareerTemplatePanel.tsx: hành động Dùng lộ trình chuẩn Homies.
- supabase/migrations/20260825_kpi_multiskill_career_grade.sql: schema grade/skill/certification.
- supabase/migrations/20260825_kpi_multiskill_career_grade_rls.sql: RLS fail-closed.

### File sửa trọng tâm

- src/lib/kpi/career-map-types.ts, career-map-service.ts, career-map-service.test.ts.
- src/lib/kpi/seed.ts, career-map-criteria-service.ts, career-map-criteria-service.test.ts.
- src/lib/kpi/repository.ts, local-repository.ts, local-repository.test.ts.
- src/lib/kpi/supabase-repository.ts, supabase-repository.test.ts, career-map-sql-contract.test.ts.
- src/lib/kpi/career-map-deployment-service.ts, development-service.ts, development-service.test.ts.
- src/app/kpi/settings/page.tsx, src/components/kpi/program/KPIProgramScopeStep.tsx.
- src/components/kpi/career-map/KPICareerMapDesigner.tsx, KPICareerMapInspector.tsx, KPICareerMapReadOnly.tsx.
- src/app/kpi/settings/migration/page.tsx, src/app/kpi/promotion/page.tsx.
- src/lib/adapters/master-data-adapter.ts, src/app/settings/master-data/page.tsx.
- docs/CODEMAP.md, docs/KNOWN_ISSUES.md.

## 2. Quy tắc bắt buộc

1. Không xóa KpiLevelCode cũ trong Pass A-D; lịch sử KPI vẫn phải đọc được.
2. Không suy luận grade mới từ tên chứa thử việc, chính, PT1, PT2, Senior, Trưởng ca hoặc Quản lý.
3. Không tự cấp C2 chỉ vì nhân viên có hai vị trí hoặc hai skill.
4. Không tự tăng bậc, đổi lương hoặc publish.
5. Mỗi mutation Career Map vẫn là một CareerMapAggregateChange.
6. Migration phải có preview, checksum, excluded rows và xác nhận trước khi persist.
7. Không chạy migration trên remote/staging/production.
8. Mỗi task chỉ chạm tối đa ba file; không mở rộng scope.

---

## Pass A — Domain chuẩn

### Task 1: Tạo grade catalog C1-C5

**Files:**
- Create: src/lib/kpi/career-grade-types.ts
- Create: src/lib/kpi/career-grade-catalog.ts
- Create: src/lib/kpi/career-grade-catalog.test.ts

- [ ] **Step 1: Viết failing test**

~~~ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HOMIES_CAREER_GRADES, HOMIES_CAREER_TRANSITIONS } from './career-grade-catalog.ts'

describe('Homies career grades', () => {
  it('has two C1 entries that converge to C2', () => {
    assert.deepEqual(HOMIES_CAREER_GRADES.map((item) => item.code), [
      'c1_pc', 'c1_tn', 'c2', 'c3', 'c4', 'c5',
    ])
    assert.deepEqual(
      HOMIES_CAREER_TRANSITIONS
        .filter((item) => item.to_grade_code === 'c2')
        .map((item) => item.from_grade_code)
        .sort(),
      ['c1_pc', 'c1_tn']
    )
  })
})
~~~

- [ ] **Step 2: Chạy test và xác nhận FAIL**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-grade-catalog.test.ts
~~~

Expected: FAIL vì catalog chưa tồn tại.

- [ ] **Step 3: Tạo types**

~~~ts
export type CareerGradeCode = 'c1_pc' | 'c1_tn' | 'c2' | 'c3' | 'c4' | 'c5'
export type OperationalSkillCode = 'barista' | 'cashier'

export interface CareerGradeDefinition {
  code: CareerGradeCode
  rank: 1 | 2 | 3 | 4 | 5
  label: string
  position_key: 'store_employee' | 'shift_leader' | 'store_manager'
  required_skill_codes: OperationalSkillCode[]
  management: boolean
}

export interface CareerGradeTransitionDefinition {
  id: string
  from_grade_code: CareerGradeCode
  to_grade_code: CareerGradeCode
  preset_key: 'to_multiskill' | 'to_senior' | 'to_shift_leader' | 'to_store_manager'
}

export interface OperationalSkillDefinition {
  code: OperationalSkillCode
  label: string
  active: boolean
}

export interface EmployeeSkillCertification {
  id: string
  employee_id: string
  skill_code: OperationalSkillCode
  status: 'not_started' | 'learning' | 'achieved' | 'expired'
  assessed_at: string | null
  assessed_by: string | null
  score: number | null
  evidence_refs?: string[]
  standard_version: number
}

export interface EmployeeCareerPlacement {
  id: string
  employee_id: string
  career_map_version_id: string
  position_id: string
  grade_code: CareerGradeCode | null
  node_id: string | null
  status: 'placed' | 'unresolved'
  unresolved_reason: string | null
  effective_from: string
  effective_to: string | null
  decision_id: string | null
}
~~~

- [ ] **Step 4: Tạo catalog**

~~~ts
export const HOMIES_CAREER_GRADES: CareerGradeDefinition[] = [
  { code: 'c1_pc', rank: 1, label: 'C1 - Pha chế', position_key: 'store_employee', required_skill_codes: ['barista'], management: false },
  { code: 'c1_tn', rank: 1, label: 'C1 - Thu ngân', position_key: 'store_employee', required_skill_codes: ['cashier'], management: false },
  { code: 'c2', rank: 2, label: 'C2 - Nhân viên đa năng', position_key: 'store_employee', required_skill_codes: ['barista', 'cashier'], management: false },
  { code: 'c3', rank: 3, label: 'C3 - Senior', position_key: 'store_employee', required_skill_codes: ['barista', 'cashier'], management: false },
  { code: 'c4', rank: 4, label: 'C4 - Trưởng ca', position_key: 'shift_leader', required_skill_codes: ['barista', 'cashier'], management: true },
  { code: 'c5', rank: 5, label: 'C5 - Quản lý cửa hàng', position_key: 'store_manager', required_skill_codes: ['barista', 'cashier'], management: true },
]

export const HOMIES_CAREER_TRANSITIONS: CareerGradeTransitionDefinition[] = [
  { id: 'c1_pc_to_c2', from_grade_code: 'c1_pc', to_grade_code: 'c2', preset_key: 'to_multiskill' },
  { id: 'c1_tn_to_c2', from_grade_code: 'c1_tn', to_grade_code: 'c2', preset_key: 'to_multiskill' },
  { id: 'c2_to_c3', from_grade_code: 'c2', to_grade_code: 'c3', preset_key: 'to_senior' },
  { id: 'c3_to_c4', from_grade_code: 'c3', to_grade_code: 'c4', preset_key: 'to_shift_leader' },
  { id: 'c4_to_c5', from_grade_code: 'c4', to_grade_code: 'c5', preset_key: 'to_store_manager' },
]
~~~

- [ ] **Step 5: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-grade-catalog.test.ts
npx tsc --noEmit
git add src/lib/kpi/career-grade-types.ts src/lib/kpi/career-grade-catalog.ts src/lib/kpi/career-grade-catalog.test.ts
git commit -m "feat(kpi): add Homies career grade catalog"
~~~

### Task 2: Làm Career Map grade-aware

**Files:**
- Modify: src/lib/kpi/career-map-types.ts:115-220
- Modify: src/lib/kpi/career-map-service.ts:48-180, 525-560
- Modify: src/lib/kpi/career-map-service.test.ts

- [ ] **Step 1: Viết failing tests**

~~~ts
it('allows C1-PC and C1-TN to share one position', () => {
  const positions = [
    { id: 'pos_store_employee', name: 'Nhân viên cửa hàng', level: 1 },
    { id: 'pos_shift_leader', name: 'Trưởng ca', level: 2 },
    { id: 'pos_store_manager', name: 'Quản lý cửa hàng', level: 3 },
  ]
  const result = applyHomiesCareerTemplate({ positions, actor_id: 'hr-1' })
  const c1Nodes = result.map.nodes.filter((node) => ['c1_pc', 'c1_tn'].includes(node.grade_code))
  assert.equal(c1Nodes.length, 2)
  assert.equal(new Set(c1Nodes.map((node) => node.position_id)).size, 1)
})

it('does not infer grade from probation or position name', () => {
  assert.equal(resolveCareerGradeCode({ explicit_grade_code: null }), null)
})
~~~

- [ ] **Step 2: Chạy test và xác nhận FAIL**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts
~~~

- [ ] **Step 3: Mở rộng contracts**

~~~ts
export interface KpiCareerMapNode {
  id: string
  position_id: string
  grade_code: CareerGradeCode
  position_name_snapshot: string
  grade_name_snapshot: string
  position_level_snapshot: number
  job_family: string
  x: number
  y: number
  criteria_profile_id: string | null
  active: boolean
}

export interface KpiPositionCriteriaProfile {
  id: string
  position_ids: string[]
  grade_codes: CareerGradeCode[]
  job_family: string | null
  version: number
  effective_from: string | null
  criteria: KpiCareerCriterion[]
}
~~~

- [ ] **Step 4: Thêm resolver/profile lookup**

~~~ts
export function resolveCareerGradeCode(input: {
  explicit_grade_code?: CareerGradeCode | null
}): CareerGradeCode | null {
  return input.explicit_grade_code ?? null
}

export function findCriteriaProfileForNode(
  node: KpiCareerMapNode,
  profiles: KpiPositionCriteriaProfile[]
): KpiPositionCriteriaProfile | null {
  return profiles.find((profile) => profile.id === node.criteria_profile_id)
    ?? profiles.find((profile) => profile.grade_codes.includes(node.grade_code))
    ?? null
}
~~~

Builder phải có hợp đồng cụ thể:

~~~ts
export interface ApplyHomiesCareerTemplateInput {
  positions: KpiCareerPositionSnapshot[]
  actor_id: string
  now?: string
}

export function applyHomiesCareerTemplate(
  input: ApplyHomiesCareerTemplateInput
): CareerMapAggregateChange {
  const employeePosition = input.positions.find((item) => item.name === 'Nhân viên cửa hàng')
  const leaderPosition = input.positions.find((item) => item.name === 'Trưởng ca')
  const managerPosition = input.positions.find((item) => item.name === 'Quản lý cửa hàng')
  if (!employeePosition || !leaderPosition || !managerPosition) {
    throw new Error('Danh mục chức danh chưa đủ Nhân viên cửa hàng, Trưởng ca và Quản lý cửa hàng.')
  }
  return buildHomiesCareerMapSeed({
    positions: [employeePosition, leaderPosition, managerPosition],
    actor_id: input.actor_id,
    now: input.now,
  })
}
~~~

Validation phải chặn missing_grade_code và lookup profile theo node/profile hoặc grade; không dùng chung profile chỉ vì cùng position_id.

- [ ] **Step 5: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts
npx tsc --noEmit
git add src/lib/kpi/career-map-types.ts src/lib/kpi/career-map-service.ts src/lib/kpi/career-map-service.test.ts
git commit -m "refactor(kpi): make career map grade aware"
~~~

### Task 3: Thay seed nhiều nghề bằng lộ trình Homies

**Files:**
- Modify: src/lib/kpi/seed.ts:408-470
- Modify: src/lib/kpi/career-map-criteria-service.ts
- Modify: src/lib/kpi/career-map-criteria-service.test.ts

- [ ] **Step 1: Viết failing test**

~~~ts
it('builds six grade nodes and five transitions', () => {
  const result = buildHomiesCareerMapSeed()
  assert.deepEqual(result.map.nodes.map((node) => node.grade_code), [
    'c1_pc', 'c1_tn', 'c2', 'c3', 'c4', 'c5',
  ])
  assert.equal(result.map.edges.length, 5)
  for (const node of result.map.nodes) {
    const profile = result.profiles.find((item) => item.id === node.criteria_profile_id)
    assert.ok(profile)
    assert.equal(profile.criteria.reduce((sum, item) => sum + item.weight, 0), 100)
  }
})
~~~

- [ ] **Step 2: Chạy test và xác nhận FAIL**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-map-criteria-service.test.ts
~~~

- [ ] **Step 3: Tạo đúng ba position snapshot**

~~~ts
const masterPositions: KpiCareerPositionSnapshot[] = [
  { id: 'pos_store_employee', name: 'Nhân viên cửa hàng', level: 1, job_family: 'store_operations', active: true },
  { id: 'pos_shift_leader', name: 'Trưởng ca', level: 2, job_family: 'management', active: true },
  { id: 'pos_store_manager', name: 'Quản lý cửa hàng', level: 3, job_family: 'management', active: true },
]
~~~

Đổi builder sang hợp đồng:

~~~ts
export function buildHomiesCareerMapSeed(input?: {
  positions?: KpiCareerPositionSnapshot[]
  actor_id?: string
  now?: string
}): CareerMapAggregateChange
~~~

C1-PC, C1-TN, C2, C3 dùng cùng pos_store_employee nhưng mỗi grade có profile riêng. Hàm createDefaultProfileForGrade phải tạo tiêu chí phù hợp grade và tổng trọng số 100%.

- [ ] **Step 4: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-service.test.ts
git add src/lib/kpi/seed.ts src/lib/kpi/career-map-criteria-service.ts src/lib/kpi/career-map-criteria-service.test.ts
git commit -m "feat(kpi): seed Homies multiskill career map"
~~~

---

## Pass B — Persistence và Postgres

### Task 4: Mở rộng local repository

**Files:**
- Modify: src/lib/kpi/repository.ts:15-60
- Modify: src/lib/kpi/local-repository.ts:70-105
- Modify: src/lib/kpi/local-repository.test.ts

- [ ] **Step 1: Viết failing round-trip test**

~~~ts
it('round-trips grades and certifications', async () => {
  const repository = createLocalKpiRepository({ storage: createMemoryStorage() })
  const database = createEmptyKpiDatabase()
  database.career_grades = HOMIES_CAREER_GRADES
  database.employee_skill_certifications = [{
    id: 'cert-1',
    employee_id: 'emp-1',
    skill_code: 'barista',
    status: 'achieved',
    assessed_at: '2026-08-01',
    assessed_by: 'leader-1',
    score: 90,
    standard_version: 1,
  }]
  await repository.reset(database)
  const loaded = await repository.load()
  assert.equal(loaded.career_grades.length, 6)
  assert.equal(loaded.employee_skill_certifications[0].skill_code, 'barista')
})
~~~

- [ ] **Step 2: Chạy test và xác nhận FAIL**

~~~bash
node --experimental-strip-types --test src/lib/kpi/local-repository.test.ts
~~~

- [ ] **Step 3: Thêm collection**

~~~ts
career_grades: CareerGradeDefinition[]
operational_skills: OperationalSkillDefinition[]
employee_skill_certifications: EmployeeSkillCertification[]
employee_career_placements: EmployeeCareerPlacement[]
~~~

createEmptyKpiDatabase trả mảng rỗng. normalizeDatabase phải đọc được payload cũ thiếu các key trên mà không mất career_maps và evaluations.

- [ ] **Step 4: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/kpi/local-repository.test.ts
git add src/lib/kpi/repository.ts src/lib/kpi/local-repository.ts src/lib/kpi/local-repository.test.ts
git commit -m "feat(kpi): persist career grades locally"
~~~

### Task 5: Tạo migration SQL và contract tests

**Files:**
- Create: supabase/migrations/20260825_kpi_multiskill_career_grade.sql
- Create: supabase/migrations/20260825_kpi_multiskill_career_grade_rls.sql
- Modify: src/lib/kpi/career-map-sql-contract.test.ts

- [ ] **Step 1: Viết failing SQL contract**

~~~ts
it('adds grade-aware career tables and constraints', () => {
  const sql = readMigration('20260825_kpi_multiskill_career_grade.sql')
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kpi_career_grades/i)
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kpi_operational_skills/i)
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kpi_employee_skill_certifications/i)
  assert.match(sql, /ADD COLUMN IF NOT EXISTS grade_code/i)
  assert.match(sql, /UNIQUE \(career_map_version_id, position_id, grade_code\)/i)
})
~~~

- [ ] **Step 2: Chạy test và xác nhận FAIL**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-map-sql-contract.test.ts
~~~

- [ ] **Step 3: Viết schema idempotent**

~~~sql
CREATE TABLE IF NOT EXISTS public.kpi_career_grades (
  code VARCHAR(16) PRIMARY KEY,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 5),
  label VARCHAR(128) NOT NULL,
  position_key VARCHAR(32) NOT NULL,
  required_skill_codes TEXT[] NOT NULL DEFAULT '{}',
  management BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpi_operational_skills (
  code VARCHAR(32) PRIMARY KEY,
  label VARCHAR(128) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.kpi_employee_skill_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.nhan_vien(id) ON DELETE RESTRICT,
  skill_code VARCHAR(32) NOT NULL REFERENCES public.kpi_operational_skills(code) ON DELETE RESTRICT,
  status VARCHAR(16) NOT NULL CHECK (status IN ('not_started','learning','achieved','expired')),
  assessed_at DATE,
  assessed_by UUID REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  score NUMERIC,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  standard_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, skill_code, standard_version)
);
~~~

Migration còn phải thêm grade_code/grade_name_snapshot vào nodes, grade_codes vào profiles, grade_code/effective range/decision_id vào placements; thay unique node bằng (map, position, grade). Row mơ hồ giữ unresolved, không tự backfill.

- [ ] **Step 4: Viết RLS fail-closed**

Nhân viên chỉ đọc của mình; quản lý chỉ đọc phạm vi cửa hàng; HR/CEO cùng tổ chức mới ghi; cấm USING(TRUE), WITH CHECK(TRUE), actor thiếu tổ chức và assessed_by chéo tổ chức.

- [ ] **Step 5: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-map-sql-contract.test.ts
git diff --check -- supabase/migrations/20260825_kpi_multiskill_career_grade.sql supabase/migrations/20260825_kpi_multiskill_career_grade_rls.sql src/lib/kpi/career-map-sql-contract.test.ts
git add supabase/migrations/20260825_kpi_multiskill_career_grade.sql supabase/migrations/20260825_kpi_multiskill_career_grade_rls.sql src/lib/kpi/career-map-sql-contract.test.ts
git commit -m "feat(db): add multiskill career grade schema"
~~~

### Task 6: Supabase gateway round-trip

**Files:**
- Modify: src/lib/kpi/supabase-repository.ts
- Modify: src/lib/kpi/supabase-repository.test.ts
- Modify: src/lib/kpi/repository.ts

- [ ] **Step 1: Viết failing gateway test**

~~~ts
it('maps grades and skill certifications', async () => {
  const fake = createFakeGateway({
    ...buildRawRows(),
    career_grades: [{ code: 'c1_pc', rank: 1, label: 'C1 - Pha chế', position_key: 'store_employee', required_skill_codes: ['barista'], management: false, active: true }],
    operational_skills: [{ code: 'barista', label: 'Pha chế', active: true }],
    employee_skill_certifications: [{ id: 'cert-1', employee_id: 'emp-1', skill_code: 'barista', status: 'achieved', assessed_at: '2026-08-01', assessed_by: 'leader-1', score: 90, evidence_refs: [], standard_version: 1 }],
  })
  const repository = createSupabaseKpiRepository({ gateway: fake.gateway })
  const database = await repository.load()
  assert.equal(database.career_grades[0].code, 'c1_pc')
  assert.equal(database.employee_skill_certifications[0].skill_code, 'barista')
})
~~~

- [ ] **Step 2: Chạy test và xác nhận FAIL**

~~~bash
node --experimental-strip-types --test src/lib/kpi/supabase-repository.test.ts
~~~

- [ ] **Step 3: Thêm load/save mapping**

Gateway đọc/ghi kpi_career_grades, kpi_operational_skills, kpi_employee_skill_certifications; node đọc grade_code và grade_name_snapshot; profile đọc grade_codes; placement đọc grade_code và khoảng hiệu lực.

- [ ] **Step 4: Verify Postgres local không dùng Supabase CLI**

~~~powershell
$dbContainer = docker ps --filter "ancestor=supabase/postgres" --format "{{.ID}}" | Select-Object -First 1
if (-not $dbContainer) { throw 'Không tìm thấy local Supabase Postgres container.' }
Get-Content -Raw supabase/migrations/20260825_kpi_multiskill_career_grade.sql |
  docker exec -i $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1
Get-Content -Raw supabase/migrations/20260825_kpi_multiskill_career_grade_rls.sql |
  docker exec -i $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1
~~~

Chạy lại lần hai phải exit code 0. Không chạy nếu container không được xác định là local.

- [ ] **Step 5: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/kpi/supabase-repository.test.ts src/lib/kpi/career-map-sql-contract.test.ts
npx tsc --noEmit
git add src/lib/kpi/supabase-repository.ts src/lib/kpi/supabase-repository.test.ts src/lib/kpi/repository.ts
git commit -m "feat(kpi): persist career grades in Supabase"
~~~

---

## Pass C — Placement, migration và eligibility

### Task 7: Placement fail-closed

**Files:**
- Create: src/lib/kpi/career-grade-placement-service.ts
- Create: src/lib/kpi/career-grade-placement-service.test.ts
- Modify: src/lib/kpi/career-map-deployment-service.ts

- [x] **Step 1: Viết failing tests**

~~~ts
it('uses certificate only for initial C1 placement', () => {
  const result = resolveEmployeeCareerPlacement({
    employee_id: 'emp-1',
    active_grade_decision: null,
    certifications: [{ skill_code: 'barista', status: 'achieved' }],
  })
  assert.equal(result.grade_code, 'c1_pc')
})

it('does not auto-promote to C2 from two certificates', () => {
  const result = resolveEmployeeCareerPlacement({
    employee_id: 'emp-2',
    active_grade_decision: { grade_code: 'c1_pc' },
    certifications: [
      { skill_code: 'barista', status: 'achieved' },
      { skill_code: 'cashier', status: 'achieved' },
    ],
  })
  assert.equal(result.grade_code, 'c1_pc')
  assert.equal(result.readiness_hint, 'eligible_for_c2_review')
})

it('returns unresolved without decision or evidence', () => {
  const result = resolveEmployeeCareerPlacement({
    employee_id: 'emp-3',
    active_grade_decision: null,
    certifications: [],
  })
  assert.equal(result.status, 'unresolved')
})
~~~

- [x] **Step 2: Chạy FAIL, implement và chạy PASS**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-grade-placement-service.test.ts
node --experimental-strip-types --test src/lib/kpi/career-grade-placement-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts
~~~

Deployment preview phải đếm placed, unresolved và eligible_for_review riêng; không đọc tên position để đoán grade.

- [ ] **Step 3: Commit**

~~~bash
git add src/lib/kpi/career-grade-placement-service.ts src/lib/kpi/career-grade-placement-service.test.ts src/lib/kpi/career-map-deployment-service.ts
git commit -m "feat(kpi): place employees by grade evidence"
~~~

### Task 8: Dry-run migration có checksum

**Files:**
- Create: src/lib/kpi/career-grade-migration-service.ts
- Create: src/lib/kpi/career-grade-migration-service.test.ts
- Modify: src/lib/kpi/migration-service.ts

- [x] **Step 1: Viết failing tests**

~~~ts
it('requires HR confirmation for legacy position without evidence', () => {
  const preview = buildCareerGradeMigrationPreview({
    employees: [{ id: 'emp-1', position_name: 'Thu ngân', current_level_code: 'pt1_tn' }],
    certifications: [],
    decisions: [],
  })
  assert.equal(preview.items[0].status, 'needs_confirmation')
  assert.equal(preview.items[0].suggested_grade_code, 'c1_tn')
  assert.equal(preview.summary.ready_to_apply, 0)
})

it('keeps checksum stable for the same input', () => {
  const input = {
    employees: [{ id: 'emp-1', position_name: 'Thu ngân', current_level_code: 'pt1_tn' }],
    certifications: [],
    decisions: [],
  }
  assert.equal(buildCareerGradeMigrationPreview(input).checksum, buildCareerGradeMigrationPreview(input).checksum)
})
~~~

- [x] **Step 2: Implement mapping**

Legacy PT1-PC/PT1-TN chỉ là gợi ý nếu thiếu evidence; PT2 cần hai certificates hoặc decision C2; Senior/C4/C5 chỉ auto khi có position/decision rõ. Mỗi item lưu status, reason, evidence_refs và suggested_grade_code. migration-service.ts tiếp tục chuyển score cũ nhưng không quyết định placement mới.

- [ ] **Step 3: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-grade-migration-service.test.ts src/lib/kpi/migration-service.test.ts
git add src/lib/kpi/career-grade-migration-service.ts src/lib/kpi/career-grade-migration-service.test.ts src/lib/kpi/migration-service.ts
git commit -m "feat(kpi): add grade migration preview"
~~~

### Task 9: Eligibility dùng transition rule của Admin

**Files:**
- Modify: src/lib/kpi/development-service.ts
- Modify: src/lib/kpi/development-service.test.ts
- Modify: src/lib/kpi/types.ts:120-145

- [ ] **Step 1: Viết failing tests**

~~~ts
it('uses supplied rule instead of hard-coded default policy', () => {
  const result = evaluatePromotionEligibility({
    employee: {
      id: 'emp-1',
      store_id: 'store-1',
      level_code: 'pt1_pc',
      position_id: 'pos_store_employee',
      employment_status: 'official',
      career_grade_code: 'c1_pc',
    },
    target_grade_code: 'c2',
    transition_rule: {
      from_position_id: 'pos_store_employee',
      to_position_id: 'pos_store_employee',
      from_grade_code: 'c1_pc',
      to_grade_code: 'c2',
      score_mode: 'consecutive',
      required_months: 2,
      min_score: 3.5,
      min_shifts: 20,
      min_hours: 80,
      required_skill_ids: ['barista', 'cashier'],
      test_min_score: 80,
      requires_store_360: false,
      blocking_incident_codes: ['cash_fraud', 'food_safety_critical'],
      proposer_roles: ['store_manager'],
      approver_roles: ['hr_admin', 'ceo'],
    },
    achieved_skill_ids: ['barista', 'cashier'],
    months_in_level: 2,
    monthly_scores: [
      { month: '2026-07', total: 4, core_average: 4, valid_hours: 100 },
      { month: '2026-08', total: 4.1, core_average: 4, valid_hours: 96 },
    ],
    critical_incident_dates: [],
    active_warning_dates: [],
    now: '2026-08-25T00:00:00.000Z',
  })
  assert.equal(result.status, 'eligible_for_review')
})

it('supports C4 to C5', () => {
  assert.equal(isAdjacentCareerTransition('c4', 'c5'), true)
})
~~~

- [ ] **Step 2: Implement compatibility adapter**

KpiPromotionRule bổ sung khóa grade ổn định:

~~~ts
export interface KpiPromotionRule {
  from_position_id: string
  to_position_id: string
  from_grade_code: CareerGradeCode
  to_grade_code: CareerGradeCode
  score_mode: 'consecutive' | 'rolling'
  required_months: number
  rolling_window_months?: number
  min_score: number
  min_shifts: number
  min_hours: number
  required_skill_ids: string[]
  test_min_score?: number
  trial_shift_count?: number
  trial_week_count?: number
  requires_store_360: boolean
  blocking_incident_codes: string[]
  proposer_roles: KpiActor['role'][]
  approver_roles: KpiActor['role'][]
}
~~~

PromotionEligibilityInput nhận career_grade_code, target_grade_code, transition_rule và achieved_skill_ids. Kết quả đủ điều kiện là eligible_for_review, không phải appointed. Giữ adapter legacy cho nơi còn target_level đến hết Pass E.

- [ ] **Step 3: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/kpi/development-service.test.ts src/lib/kpi/monthly-review-integration.test.ts
npx tsc --noEmit
git add src/lib/kpi/development-service.ts src/lib/kpi/development-service.test.ts src/lib/kpi/types.ts
git commit -m "refactor(kpi): evaluate promotion by grade rule"
~~~

### Task 9B: Chuyển Program Setup sang grade transition

**Files:**
- Modify: src/lib/kpi/program-service.ts:116-180, 430-550
- Modify: src/lib/kpi/program-service.test.ts
- Modify: src/lib/kpi/types.ts:147-156

- [ ] **Step 1: Viết failing test cho C1 → C2 cùng position**

~~~ts
it('allows adjacent grade transition inside one position', () => {
  const rule = createPromotionRuleForGrades({
    from_position_id: 'pos_store_employee',
    to_position_id: 'pos_store_employee',
    from_grade_code: 'c1_pc',
    to_grade_code: 'c2',
    preset_key: 'employee_to_core',
  })
  assert.equal(rule.from_position_id, rule.to_position_id)
  assert.equal(rule.from_grade_code, 'c1_pc')
  assert.equal(rule.to_grade_code, 'c2')
})
~~~

- [ ] **Step 2: Bỏ validation cấm cùng position khi grade khác nhau**

Chỉ chặn khi cả position và grade đều giống nhau. KpiCareerStageSuggestion bổ sung from_grade_code/to_grade_code. Các stage C1-PC → C2, C1-TN → C2, C2 → C3 được tạo hợp lệ dù position giống nhau.

- [ ] **Step 3: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/kpi/program-service.test.ts src/lib/kpi/development-service.test.ts
npx tsc --noEmit
git add src/lib/kpi/program-service.ts src/lib/kpi/program-service.test.ts src/lib/kpi/types.ts
git commit -m "refactor(kpi): configure programs by career grade"
~~~

---

## Pass D — Admin UX

### Task 10: One-click Homies template và CTA sửa lỗi

**Files:**
- Create: src/components/kpi/career-map/KPIHomiesCareerTemplatePanel.tsx
- Modify: src/components/kpi/career-map/KPICareerMapDesigner.tsx
- Modify: src/components/kpi/career-map/KPICareerMapInspector.tsx

- [x] **Step 1: Khóa service integration**

~~~ts
it('completes the Homies map in one aggregate', () => {
  const positions = [
    { id: 'pos_store_employee', name: 'Nhân viên cửa hàng', level: 1 },
    { id: 'pos_shift_leader', name: 'Trưởng ca', level: 2 },
    { id: 'pos_store_manager', name: 'Quản lý cửa hàng', level: 3 },
  ]
  const result = applyHomiesCareerTemplate({ positions, actor_id: 'hr-1' })
  assert.equal(result.map.nodes.length, 6)
  assert.equal(result.profiles.length, 6)
  assert.equal(validateCareerMap({ map: result.map, profiles: result.profiles, strict: true }).valid, true)
})
~~~

- [ ] **Step 2: Tạo panel**

~~~tsx
<h3>Dùng lộ trình chuẩn Homies</h3>
<p>Tạo sẵn C1 Pha chế, C1 Thu ngân, C2 đa năng, Senior, Trưởng ca và Quản lý cửa hàng.</p>
<Button onClick={onApplyTemplate}>Dùng lộ trình chuẩn Homies</Button>
~~~

Click hiển thị preview 6 cấp · 5 chặng · 6 bộ tiêu chí rồi mới save một aggregate.

- [x] **Step 3: Thêm CTA tại missing criteria**

~~~tsx
<Button onClick={() => onApplyRecommended(node.grade_code)}>Dùng bộ Homies</Button>
<Button variant="outline" onClick={onCopyNearest}>Sao chép từ cấp gần nhất</Button>
<Button variant="outline" onClick={onOpenCriteriaDrawer}>Tạo riêng</Button>
~~~

- [ ] **Step 4: Verify và commit**

~~~bash
npm run lint -- src/components/kpi/career-map/KPIHomiesCareerTemplatePanel.tsx src/components/kpi/career-map/KPICareerMapDesigner.tsx src/components/kpi/career-map/KPICareerMapInspector.tsx
npx tsc --noEmit
git add src/components/kpi/career-map/KPIHomiesCareerTemplatePanel.tsx src/components/kpi/career-map/KPICareerMapDesigner.tsx src/components/kpi/career-map/KPICareerMapInspector.tsx
git commit -m "feat(kpi): add one-click Homies career template"
~~~

### Task 11: Settings flow và migration review

**Files:**
- Modify: src/app/kpi/settings/page.tsx:400-520
- Modify: src/components/kpi/program/KPIProgramScopeStep.tsx
- Modify: src/app/kpi/settings/migration/page.tsx

- [ ] **Step 1: Nối aggregate grade-aware**

careerPositions chỉ cung cấp ba chức danh; seedCareer cung cấp sáu grade nodes. handleUpdateCareerAggregate vẫn save đúng một revision cho map và profiles.

- [ ] **Step 2: Rút flow chính**

~~~text
Chưa dùng mẫu → Dùng lộ trình chuẩn Homies
Đã tạo, còn lỗi → lỗi có CTA xử lý ngay
Hợp lệ → Xem trước và Tiếp tục
~~~

Kéo thả thủ công nằm trong Tùy chỉnh nâng cao.

- [x] **Step 3: Thay migration page**

Hiển thị auto-convert, cần HR xác nhận, excluded, checksum, filter trạng thái, dropdown grade cho row mơ hồ và nút Chốt checksum. Task UI này chưa ghi DB thật. Loại bỏ nhãn PT1 Thu ngan, PT1 Pha che, System detect khỏi UI.

- [ ] **Step 4: Verify và commit**

~~~bash
npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/program/KPIProgramScopeStep.tsx src/app/kpi/settings/migration/page.tsx
npx tsc --noEmit
git add src/app/kpi/settings/page.tsx src/components/kpi/program/KPIProgramScopeStep.tsx src/app/kpi/settings/migration/page.tsx
git commit -m "feat(kpi): wire multiskill career setup flow"
~~~

---

## Pass E — Employee/Promotion/Master Data

### Task 12: Promotion Hub và read-only map theo grade

**Files:**
- Modify: src/components/kpi/career-map/KPICareerMapReadOnly.tsx
- Modify: src/app/kpi/promotion/page.tsx

- [ ] **Step 1: Highlight bằng currentGradeCode**

C1-PC và C1-TN cùng position vẫn phải highlight đúng một node. Không dùng currentPositionId làm khóa duy nhất.

- [ ] **Step 2: Dùng nhãn chuẩn**

~~~ts
const GRADE_LABELS: Record<CareerGradeCode, string> = {
  c1_pc: 'C1 - Pha chế',
  c1_tn: 'C1 - Thu ngân',
  c2: 'C2 - Nhân viên đa năng',
  c3: 'C3 - Senior',
  c4: 'C4 - Trưởng ca',
  c5: 'C5 - Quản lý cửa hàng',
}
~~~

Pipeline tiếng Việt: Hệ thống phát hiện → Quản lý đề xuất → Kiểm tra/Test → Thử vai → Trụ sở duyệt → Bổ nhiệm và cập nhật lương.

Dossier lấy placement/certification thật; thiếu dữ liệu hiển thị Chưa có đủ dữ liệu, không tạo giờ/điểm giả.

- [ ] **Step 3: Verify và commit**

~~~bash
npm run lint -- src/components/kpi/career-map/KPICareerMapReadOnly.tsx src/app/kpi/promotion/page.tsx
node --experimental-strip-types --test src/lib/kpi/development-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts
npx tsc --noEmit
git add src/components/kpi/career-map/KPICareerMapReadOnly.tsx src/app/kpi/promotion/page.tsx
git commit -m "feat(kpi): show grades in Promotion Hub"
~~~

### Task 13: Chuẩn hóa Master Data

**Files:**
- Modify: src/lib/adapters/master-data-adapter.ts:65-82
- Modify: src/app/settings/master-data/page.tsx:638-655
- Create: src/lib/adapters/master-data-adapter.test.ts

- [x] **Step 1: Viết failing test**

~~~ts
it('uses three canonical operational positions for a new tenant', async () => {
  const positions = await MasterDataAdapter.getPositions()
  assert.deepEqual(positions.map((item) => item.name), [
    'Nhân viên cửa hàng', 'Trưởng ca', 'Quản lý cửa hàng',
  ])
})
~~~

- [x] **Step 2: Thay seed mới, không ghi đè tenant hiện tại**

~~~ts
const initialPositions: PositionItem[] = [
  { id: 'pos-store-employee', name: 'Nhân viên cửa hàng', department_id: 'dept-store-operations', level: 1, base_salary: 0, pay_type: 'hourly' },
  { id: 'pos-shift-leader', name: 'Trưởng ca', department_id: 'dept-store-management', level: 2, base_salary: 0, pay_type: 'hourly' },
  { id: 'pos-store-manager', name: 'Quản lý cửa hàng', department_id: 'dept-store-management', level: 3, base_salary: 0, pay_type: 'monthly' },
]
~~~

Tenant đã có dữ liệu phải đi qua migration preview.

- [x] **Step 3: Làm rõ UI**

Đổi Cấp bậc Level thành Cấp trách nhiệm của chức danh và thêm mô tả: Cấp này dùng cho cơ cấu tổ chức. C1-C5 năng lực được quản lý tại KPI & Phát triển.

- [ ] **Step 4: Verify và commit**

~~~bash
node --experimental-strip-types --test src/lib/adapters/master-data-adapter.test.ts
npm run lint -- src/lib/adapters/master-data-adapter.ts src/app/settings/master-data/page.tsx
npx tsc --noEmit
git add src/lib/adapters/master-data-adapter.ts src/app/settings/master-data/page.tsx src/lib/adapters/master-data-adapter.test.ts
git commit -m "refactor(hr): normalize Homies positions"
~~~

### Task 14: Docs và verification cuối

**Files:**
- Modify: docs/CODEMAP.md
- Modify: docs/KNOWN_ISSUES.md
- Modify: docs/superpowers/plans/2026-08-25-kpi-homies-multiskill-career-grade-implementation-plan.md

- [x] **Step 1: Cập nhật docs**

CODEMAP ghi domain, services, migrations, template panel và route migration. KNOWN_ISSUES chỉ thêm Đã fix sau khi toàn bộ verification pass. Tick [x] đúng task đã hoàn thành; không tick Postgres runtime nếu chưa chạy.

- [x] **Step 2: Chạy test KPI liên quan**

~~~bash
node --experimental-strip-types --test src/lib/kpi/career-grade-catalog.test.ts src/lib/kpi/career-grade-placement-service.test.ts src/lib/kpi/career-grade-migration-service.test.ts src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/career-map-sql-contract.test.ts src/lib/kpi/local-repository.test.ts src/lib/kpi/supabase-repository.test.ts src/lib/kpi/development-service.test.ts src/lib/kpi/monthly-review-integration.test.ts
~~~

Expected: tất cả PASS.

- [x] **Step 3: Lint file scope**

~~~bash
npm run lint -- src/app/kpi/settings/page.tsx src/app/kpi/settings/migration/page.tsx src/app/kpi/promotion/page.tsx src/app/settings/master-data/page.tsx src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/career-map/KPIHomiesCareerTemplatePanel.tsx src/components/kpi/career-map/KPICareerMapDesigner.tsx src/components/kpi/career-map/KPICareerMapInspector.tsx src/components/kpi/career-map/KPICareerMapReadOnly.tsx src/lib/kpi/career-grade-types.ts src/lib/kpi/career-grade-catalog.ts src/lib/kpi/career-grade-placement-service.ts src/lib/kpi/career-grade-migration-service.ts src/lib/kpi/career-map-types.ts src/lib/kpi/career-map-service.ts src/lib/kpi/career-map-criteria-service.ts src/lib/kpi/career-map-deployment-service.ts src/lib/kpi/repository.ts src/lib/kpi/local-repository.ts src/lib/kpi/supabase-repository.ts src/lib/kpi/development-service.ts src/lib/kpi/seed.ts src/lib/adapters/master-data-adapter.ts
~~~

Expected: 0 error, 0 warning.

- [ ] **Step 4: Typecheck, build và AI guard**

~~~bash
npx tsc --noEmit
npm run build
npm run ai:ready
~~~

Expected: exit code 0.

- [ ] **Step 5: Demo thủ công**

1. /kpi/settings tạo đủ sơ đồ bằng một click.
2. C1-PC/C1-TN hội tụ C2, sau đó C3-C5.
3. Dùng bộ Homies xóa lỗi thiếu tiêu chí.
4. /kpi/settings/migration không tự apply row mơ hồ.
5. /kpi/promotion cho phép C4 → C5 nhưng không tự bổ nhiệm.
6. Vai trò cửa hàng không sửa tiêu chí/trọng số/điều kiện.
7. Không có route chết hoặc action chỉ hiện toast.

- [ ] **Step 6: Commit docs**

~~~bash
git add docs/CODEMAP.md docs/KNOWN_ISSUES.md docs/superpowers/plans/2026-08-25-kpi-homies-multiskill-career-grade-implementation-plan.md
git commit -m "docs: complete Homies career grade rollout"
~~~

---

## 3. Rollback theo pass

- Pass A: revert catalog/node contracts; chưa ghi DB.
- Pass B: giữ map published cũ; không drop bảng/cột mới; row legacy vẫn unresolved.
- Pass C: hủy preview/placement draft; không xóa history.
- Pass D: ẩn template action mới và giữ kéo thả trong Advanced.
- Pass E: Promotion Hub quay về adapter legacy read-only.

Nếu phiên bản mới đã phát sinh quyết định tăng bậc, rollback phải tạo quyết định điều chỉnh và audit log; cấm sửa hoặc xóa lịch sử.

## 4. Báo cáo bắt buộc sau mỗi pass

AI Code phải báo:

1. Task và file đã sửa.
2. Test đã chạy và PASS/FAIL.
3. Lint/typecheck/build đã chạy ở đâu.
4. Migration chỉ chạy local hay chưa chạy runtime.
5. Điểm còn thiếu hoặc bị chặn.
6. Không ghi hoàn thành nếu chưa chạy verification bắt buộc.

## 5. Điều kiện bàn giao cuối

Chỉ báo hoàn thành khi:

- Task 1-14 và Task 9B đã tick [x].
- Postgres local chạy migration hai lần thành công.
- Test KPI, lint scope, TypeScript, build và ai:ready pass.
- Demo thủ công không có action giả hoặc route chết.
- CODEMAP và KNOWN_ISSUES được cập nhật.
- Không có thay đổi ngoài scope trong commit.
