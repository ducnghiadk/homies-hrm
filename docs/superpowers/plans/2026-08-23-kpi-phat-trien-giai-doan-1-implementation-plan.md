# KPI & Phát triển nhân viên - Giai đoạn 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển `/kpi/settings` từ KPI Builder kỹ thuật thành wizard 5 bước bắt đầu từ mục tiêu kinh doanh, tái sử dụng engine KPI F&B hiện có và cho phép Admin xem trước/công bố chương trình an toàn.

**Architecture:** `KpiSetVersion` tiếp tục là khối versioned/published và được bổ sung metadata chương trình dạng optional để dữ liệu cũ vẫn đọc được. Logic defaults/validation/review nằm trong service thuần TypeScript; các bước wizard là component nhỏ; trang `/kpi/settings` giữ vai trò controller và persistence. Peer review, 360 và readiness thực tế chỉ được cấu hình/preview, chưa tạo dữ liệu vận hành ở Giai đoạn 1.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS v4, local-first KPI repository, Node test runner, ESLint, lucide-react.

---

## 0. Tài liệu và prompt giao Antigravity

### 0.1. Đọc theo đúng thứ tự

1. `AGENTS.md`
2. `DESIGN_RULE_HOMIES_FINAL.md`
3. `docs/CODEMAP.md`
4. `docs/KNOWN_ISSUES.md`
5. `docs/TOKEN_PLAYBOOK.md`
6. `docs/superpowers/specs/2026-08-23-kpi-phat-trien-nhan-vien-master-design.md`
7. File kế hoạch này
8. `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
9. `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`

### 0.2. EXECUTION REQUEST - gửi nguyên khối này cho Antigravity

```text
Hãy triển khai Giai đoạn 1 của module “KPI & Phát triển nhân viên”.

Đọc và tuân thủ tuyệt đối:
- docs/superpowers/specs/2026-08-23-kpi-phat-trien-nhan-vien-master-design.md
- docs/superpowers/plans/2026-08-23-kpi-phat-trien-giai-doan-1-implementation-plan.md
- AGENTS.md và các tài liệu bắt buộc trong Task 0 của plan.

Chỉ thực hiện MỘT task trong plan mỗi lần. Trước khi sửa nhiều file, liệt kê file sẽ sửa và chờ tôi xác nhận. Sau mỗi task phải chạy verification được ghi trong task, cập nhật tick [x] và báo next exact step.

Không được:
- làm peer review thật;
- làm khảo sát 360 thật;
- migration Supabase;
- xóa/đổi route cũ;
- viết lại engine KPI, promotion, test, challenge hoặc salary;
- refactor ngoài phạm vi;
- tự commit/stage nếu tôi chưa yêu cầu.

Bắt đầu bằng Task 1 duy nhất. Không tự chuyển sang Task 2 sau khi hoàn thành.
```

## 1. Bản đồ file Giai đoạn 1

### Domain và logic

- Modify `src/lib/kpi/types.ts`: thêm metadata chương trình dạng optional.
- Create `src/lib/kpi/program-service.ts`: defaults, factory, validation và review summary.
- Create `src/lib/kpi/program-service.test.ts`: test thuần cho luật Giai đoạn 1.
- Modify `src/lib/kpi/index.ts`: export API mới.
- Modify `src/lib/kpi/local-repository.ts`: bảo đảm dữ liệu cũ/mới round-trip.
- Modify `src/lib/kpi/seed.ts`: seed một chương trình demo tương thích.

### UI wizard

- Create `src/components/kpi/program/KPIProgramStepper.tsx`.
- Create `src/components/kpi/program/KPIProgramPurposeStep.tsx`.
- Create `src/components/kpi/program/KPIProgramScopeStep.tsx`.
- Create `src/components/kpi/program/KPIProgramSourcesStep.tsx`.
- Create `src/components/kpi/program/KPIProgramReadinessStep.tsx`.
- Create `src/components/kpi/program/KPIProgramReviewStep.tsx`.
- Create `src/components/kpi/program/KPIAdvancedSettingsPanel.tsx`.
- Create `src/components/kpi/builder/KPIStoreOverridePanel.tsx`.

### Tích hợp

- Modify `src/app/kpi/settings/page.tsx`.
- Modify `src/lib/navigation/sidebar-config.ts`.
- Modify `src/app/kpi/page.tsx`.
- Modify `docs/CODEMAP.md`.
- Modify file plan này để tick task.

## 2. Quyết định kỹ thuật đã khóa

1. Không tạo `KpiProgram` collection riêng trong Giai đoạn 1. Một chương trình tương ứng với một `KpiSetVersion` có metadata mới.
2. Trường mới optional trên dữ liệu cũ. Factory mới luôn điền đủ trường.
3. `setup_step` cũ dành cho advanced builder; wizard mới dùng `program_setup_step`.
4. `position_ids` là scope chức danh. Promotion rule dùng ID master data, không mở rộng hard-code `KpiLevelCode`.
5. Review dùng cả `validateProgramVersion` và `validateKpiSet`; publish cuối cùng vẫn dùng `publishVersion`.
6. “Dùng nhanh bộ chuẩn Homies” tạo draft, không publish ngay.
7. Peer/360 chỉ là source flag và preview ở Giai đoạn 1.
8. Không thêm dependency test UI; logic phải test được trong service thuần.
9. Không commit/stage khi người dùng chưa yêu cầu.

### Task 1: Thêm domain metadata và program service

**Files:**
- Modify: `src/lib/kpi/types.ts`
- Create: `src/lib/kpi/program-service.ts`
- Create: `src/lib/kpi/program-service.test.ts`

- [x] **Step 1: Viết test đỏ**

```ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createVersionFromTemplate } from './fnb-template-catalog.ts'
import {
  applyHomiesStandardProgram,
  getDefaultPromotionRule,
  getDefaultSourcePolicy,
  validateProgramVersion,
} from './program-service.ts'

describe('KPI program defaults', () => {
  it('keeps one primary purpose and selected secondary purposes', () => {
    const version = createVersionFromTemplate('barista', ['position_barista'], 'hr_admin_01', 2, '2026-08-23T08:00:00.000Z')
    const result = applyHomiesStandardProgram(version, {
      primary_purpose: 'promotion',
      secondary_purposes: ['monthly_bonus', 'training'],
      from_position_id: 'position_barista',
      to_position_id: 'position_senior_barista',
    })
    assert.equal(result.primary_purpose, 'promotion')
    assert.deepEqual(result.secondary_purposes, ['monthly_bonus', 'training'])
    assert.equal(result.program_setup_step, 'review')
  })

  it('enables the Homies employee review sources', () => {
    const policy = getDefaultSourcePolicy('promotion', 'employee')
    assert.deepEqual(policy.enabled_sources, ['operations', 'shift_leader', 'peer', 'store_manager'])
    assert.equal(policy.peer_reviewer_count, 2)
    assert.equal(policy.peer_weight_cap, 15)
  })

  it('uses three consecutive good months for employee to leader', () => {
    const rule = getDefaultPromotionRule('position_core', 'position_shift_leader', 'employee_to_leader')
    assert.equal(rule.score_mode, 'consecutive')
    assert.equal(rule.required_months, 3)
    assert.equal(rule.min_score, 4)
    assert.equal(rule.test_min_score, 80)
    assert.equal(rule.trial_shift_count, 4)
  })

  it('reports missing purpose, position scope and promotion path', () => {
    const version = createVersionFromTemplate('barista', [], 'hr_admin_01', 1, '2026-08-23T08:00:00.000Z')
    const codes = validateProgramVersion(version).map((issue) => issue.code)
    assert.ok(codes.includes('MISSING_PRIMARY_PURPOSE'))
    assert.ok(codes.includes('MISSING_POSITION_SCOPE'))
    assert.ok(codes.includes('MISSING_PROMOTION_PATH'))
  })
})
```

- [x] **Step 2: Chạy test xác nhận FAIL**

```powershell
node --experimental-strip-types --test src/lib/kpi/program-service.test.ts
```

Expected: FAIL vì service/type chưa tồn tại.

- [x] **Step 3: Thêm contract vào `types.ts`**

```ts
export type KpiProgramPurpose =
  | 'promotion'
  | 'monthly_bonus'
  | 'probation'
  | 'capability_review'
  | 'training'
  | 'store_operations'

export type KpiProgramSetupStep = 'purpose' | 'scope' | 'sources' | 'readiness' | 'review'

export type KpiReviewSource =
  | 'operations'
  | 'shift_leader'
  | 'peer'
  | 'self'
  | 'store_manager'
  | 'area_manager'
  | 'store_360'
  | 'skill_test'
  | 'trial_role'

export interface KpiEvaluationSourcePolicy {
  enabled_sources: KpiReviewSource[]
  peer_reviewer_count: number
  peer_weight_cap: number
  store_360_frequency?: 'quarterly'
}

export interface KpiPromotionRule {
  from_position_id: string
  to_position_id: string
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

export interface KpiProgramValidationIssue {
  code:
    | 'MISSING_PRIMARY_PURPOSE'
    | 'DUPLICATE_PURPOSE'
    | 'MISSING_POSITION_SCOPE'
    | 'MISSING_PROMOTION_PATH'
    | 'INVALID_SOURCE_POLICY'
    | 'INVALID_PROMOTION_RULE'
  path: string
  message: string
}
```

Bổ sung optional vào `KpiSetVersion`:

```ts
primary_purpose?: KpiProgramPurpose
secondary_purposes?: KpiProgramPurpose[]
program_setup_step?: KpiProgramSetupStep
source_policy?: KpiEvaluationSourcePolicy
promotion_rule?: KpiPromotionRule
```

- [x] **Step 4: Implement API thuần**

```ts
export function getDefaultSourcePolicy(
  purpose: KpiProgramPurpose,
  audience: 'employee' | 'manager',
): KpiEvaluationSourcePolicy

export function getDefaultPromotionRule(
  fromPositionId: string,
  toPositionId: string,
  preset: 'probation' | 'employee_to_core' | 'employee_to_leader' | 'leader_to_supervisor' | 'supervisor_to_manager' | 'manager_to_area',
): KpiPromotionRule

export function applyHomiesStandardProgram(
  version: KpiSetVersion,
  input: {
    primary_purpose: KpiProgramPurpose
    secondary_purposes: KpiProgramPurpose[]
    from_position_id?: string
    to_position_id?: string
  },
): KpiSetVersion

export function validateProgramVersion(version: KpiSetVersion): KpiProgramValidationIssue[]
```

Validation: primary tồn tại và không lặp trong secondary; có position scope; promotion có path với hai ID khác nhau; peer count bằng 2; peer cap 0-15; số tháng/giờ/ca/điểm không âm; rolling window không nhỏ hơn required months.

Defaults nguồn phải cố định:

```ts
const EMPLOYEE_SOURCES: KpiReviewSource[] = ['operations', 'shift_leader', 'peer', 'store_manager']
const MANAGER_SOURCES: KpiReviewSource[] = ['operations', 'area_manager', 'store_360', 'skill_test', 'trial_role']
```

Defaults lộ trình phải dùng đúng bảng sau:

```ts
const PROMOTION_PRESETS = {
  probation: { score_mode: 'consecutive', required_months: 1, min_score: 3.5, min_shifts: 12, min_hours: 60, requires_store_360: false },
  employee_to_core: { score_mode: 'consecutive', required_months: 3, min_score: 4, min_shifts: 12, min_hours: 60, requires_store_360: false },
  employee_to_leader: { score_mode: 'consecutive', required_months: 3, min_score: 4, min_shifts: 12, min_hours: 60, test_min_score: 80, trial_shift_count: 4, requires_store_360: false },
  leader_to_supervisor: { score_mode: 'rolling', required_months: 5, rolling_window_months: 6, min_score: 4.2, min_shifts: 12, min_hours: 60, trial_week_count: 4, requires_store_360: true },
  supervisor_to_manager: { score_mode: 'rolling', required_months: 6, rolling_window_months: 8, min_score: 4.2, min_shifts: 12, min_hours: 60, trial_week_count: 6, requires_store_360: true },
  manager_to_area: { score_mode: 'rolling', required_months: 9, rolling_window_months: 12, min_score: 4.2, min_shifts: 12, min_hours: 60, trial_week_count: 8, requires_store_360: true },
} as const
```

Mọi preset dùng blocker codes `fraud`, `cash`, `food_safety`, `cover_up`, `customer_abuse`, `retaliation`, `serious_discipline`. `required_skill_ids` lần lượt lấy từ catalog theo lộ trình; tối thiểu dùng `core_role`, `independent_work`, `lead_shift`, `coach_team`, `manage_store`, `multi_store_standard` tương ứng. Proposer/approver: probation `store_manager -> hr_admin`; employee/core/leader `store_manager -> area_manager|hr_admin`; supervisor `area_manager -> hr_admin|ceo`; store manager/area `area_manager|hr_admin -> ceo`.

`applyHomiesStandardProgram` có hành vi xác định: luôn ghi purpose và source defaults; nếu thiếu from/to thì đặt `program_setup_step: 'scope'` và chưa tạo promotion rule; nếu đủ from/to thì tạo rule, loại primary khỏi secondary và đặt `program_setup_step: 'review'`.

- [x] **Step 5: Verification**

```powershell
node --experimental-strip-types --test src/lib/kpi/program-service.test.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [x] **Step 6: Tick Task 1 và dừng xin duyệt**

### Task 2: Export API và bảo đảm repository đọc dữ liệu cũ

**Files:**
- Modify: `src/lib/kpi/index.ts`
- Modify: `src/lib/kpi/local-repository.ts`
- Modify: `src/lib/kpi/local-repository.test.ts`

- [x] **Step 1: Thêm test round-trip legacy và metadata mới**

```ts
it('loads legacy sets and preserves new program metadata', async () => {
  const legacy = { id: 'legacy-set', name: 'Legacy KPI' }
  const modern = {
    id: 'modern-set',
    name: 'Promotion program',
    primary_purpose: 'promotion',
    secondary_purposes: ['training'],
    program_setup_step: 'review',
  }
  const storage = createFakeStorage({
    homies_kpi_saas_v1: JSON.stringify({ schema_version: 1, revision: 2, sets: [legacy, modern] }),
  })
  const loaded = await createLocalKpiRepository({ storage }).load()
  assert.equal(loaded.sets[0].name, 'Legacy KPI')
  assert.equal(loaded.sets[1].primary_purpose, 'promotion')
  assert.equal(loaded.sets[1].program_setup_step, 'review')
})
```

Không tự biến dữ liệu legacy thành promotion trong repository.

- [x] **Step 2: Export API mới từ `index.ts`**

Export service và các type chương trình để page không import sâu.

- [x] **Step 3: Giữ normalize không mất optional fields**

`normalizeDatabase` tiếp tục giữ nguyên object trong `sets`; không tăng `schema_version` ở Giai đoạn 1.

- [x] **Step 4: Verification**

```powershell
node --experimental-strip-types --test src/lib/kpi/program-service.test.ts src/lib/kpi/local-repository.test.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [x] **Step 5: Tick Task 2 và dừng xin duyệt**

### Task 2B: Thêm seed demo chương trình

**Files:**
- Modify: `src/lib/kpi/seed.ts`

- [x] **Step 1: Bổ sung metadata vào draft tháng 09**

```ts
primary_purpose: 'promotion',
secondary_purposes: ['monthly_bonus', 'training'],
program_setup_step: 'review',
source_policy: getDefaultSourcePolicy('promotion', 'employee'),
promotion_rule: getDefaultPromotionRule('senior_barista', 'shift_leader', 'employee_to_leader'),
position_ids: ['senior_barista'],
```

Không sửa published seed tháng 08 để còn kiểm tra legacy.

- [x] **Step 2: Verification**

```powershell
node --experimental-strip-types --test src/lib/kpi/program-service.test.ts src/lib/kpi/fnb-template-catalog.test.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [x] **Step 3: Tick Task 2B và dừng xin duyệt**

### Task 3: Tạo stepper mới và bước chọn mục tiêu

**Files:**
- Create: `src/components/kpi/program/KPIProgramStepper.tsx`
- Create: `src/components/kpi/program/KPIProgramPurposeStep.tsx`
- Modify: `docs/CODEMAP.md`

- [x] **Step 1: Tạo stepper contract**

```ts
export type KPIProgramStepperProps = {
  current: KpiProgramSetupStep
  completed: KpiProgramSetupStep[]
  onSelect(step: KpiProgramSetupStep): void
}
```

```ts
const STEPS = [
  ['purpose', 'Mục tiêu', 'Bạn muốn giải quyết việc gì?'],
  ['scope', 'Lộ trình', 'Áp dụng cho ai?'],
  ['sources', 'Cách đánh giá', 'Dùng dữ liệu nào?'],
  ['readiness', 'Điều kiện đạt', 'Khi nào sẵn sàng?'],
  ['review', 'Xem trước', 'Kiểm tra và áp dụng'],
] as const
```

Chỉ click step hiện tại, step đã hoàn tất hoặc step trước; không nhảy vào step chưa đủ điều kiện.

- [x] **Step 2: Tạo purpose step**

```ts
export type KPIProgramPurposeStepProps = {
  primaryPurpose?: KpiProgramPurpose
  secondaryPurposes: KpiProgramPurpose[]
  onChange(primary: KpiProgramPurpose, secondary: KpiProgramPurpose[]): void
  onQuickStart(): void
  onContinue(): void
}
```

Sáu lựa chọn lấy đúng Master Spec. Primary dùng radio semantics; secondary checkbox. Không cho primary nằm trong secondary. `Tiếp tục` disabled khi chưa có primary. `Dùng nhanh bộ chuẩn Homies` chỉ gọi `onQuickStart`.

- [x] **Step 3: UI/accessibility**

Fieldset/legend đúng semantics; trạng thái chọn có icon/text ngoài màu; focus ring rõ; mobile một cột; nền kem/card trắng; lucide-react; không emoji.

- [x] **Step 4: Update CODEMAP**

Ghi `src/components/kpi/program/*` là wizard mục tiêu kinh doanh Giai đoạn 1.

- [x] **Step 5: Verification**

```powershell
npm run lint -- src/components/kpi/program/KPIProgramStepper.tsx src/components/kpi/program/KPIProgramPurposeStep.tsx
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [x] **Step 6: Tick Task 3 và dừng xin duyệt**

### Task 4: Tạo bước lộ trình và nguồn đánh giá

**Files:**
- Create: `src/components/kpi/program/KPIProgramScopeStep.tsx`
- Create: `src/components/kpi/program/KPIProgramSourcesStep.tsx`

- [x] **Step 1: Tạo scope contract**

```ts
export type KPIProgramScopeStepProps = {
  positions: Array<{ id: string; name: string; level?: number }>
  stores: Array<{ id: string; name: string }>
  positionIds: string[]
  templateId?: KpiTemplateId
  storeIds: string[] | 'all'
  promotionRule?: KpiPromotionRule
  effectiveFrom: string
  onChange(input: {
    position_ids: string[]
    template_id?: KpiTemplateId
    store_ids: string[] | 'all'
    from_position_id?: string
    to_position_id?: string
    effective_from: string
  }): void
  onBack(): void
  onContinue(): void
}
```

Yêu cầu: chọn chức danh bằng card/checkbox, không dùng multi-select Ctrl/Cmd; promotion bắt buộc from/to; ưu tiên gợi ý cấp có `level` lớn hơn; chọn một `Bộ chuẩn theo công việc` trong sáu template F&B hiện có và tự gợi ý theo tên chức danh; nếu không nhận diện được thì bắt người dùng chọn, không đoán; phạm vi có Toàn chuỗi/Cửa hàng cụ thể, nhóm chi tiết nằm advanced; ngày áp dụng bắt buộc.

- [x] **Step 2: Tạo source contract**

```ts
export type KPIProgramSourcesStepProps = {
  policy: KpiEvaluationSourcePolicy
  purpose: KpiProgramPurpose
  audience: 'employee' | 'manager'
  onChange(policy: KpiEvaluationSourcePolicy): void
  onBack(): void
  onContinue(): void
}
```

Hiển thị source trong Master Spec. Employee default bật `operations`, `shift_leader`, `peer`, `store_manager`; manager default dùng `operations`, `area_manager`, `store_360`, `skill_test`, `trial_role`. UI hiển thị `Quản lý cấp trên xác nhận` cho `store_manager/area_manager` theo audience. Peer hiển thị `2 đồng nghiệp ẩn danh · tối đa 15%`. `store_360` có badge `Hoạt động từ Giai đoạn 3` nhưng vẫn lưu flag. Không cho UI phổ thông sửa reviewer count khác 2 hoặc cap lớn hơn 15.

- [x] **Step 3: Verification**

```powershell
npm run lint -- src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/program/KPIProgramSourcesStep.tsx
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [x] **Step 4: Tick Task 4 và dừng xin duyệt**

### Task 5: Tạo điều kiện đạt và review

**Files:**
- Create: `src/components/kpi/program/KPIProgramReadinessStep.tsx`
- Create: `src/components/kpi/program/KPIProgramReviewStep.tsx`

- [x] **Step 1: Readiness contract**

```ts
export type KPIProgramReadinessStepProps = {
  rule: KpiPromotionRule
  positionNames: { from: string; to: string }
  onChange(rule: KpiPromotionRule): void
  onUseRecommended(): void
  onBack(): void
  onContinue(): void
}
```

Hiển thị câu tóm tắt sống:

```text
Nhân viên được đưa vào danh sách sẵn sàng khi đạt từ {min_score}/5 trong {required_months} tháng {liên tiếp hoặc X/Y}, đủ giờ/ca, hoàn thành kỹ năng và không có lỗi nghiêm trọng.
```

Control phổ thông: tháng, consecutive/rolling, điểm, ca/giờ, test, thử vai, yêu cầu 360. Skill IDs và blocker codes chi tiết nằm advanced.

- [x] **Step 2: Review contract**

```ts
export type KPIProgramReviewStepProps = {
  version: KpiSetVersion
  positionNames: string[]
  storeCount: number
  programIssues: KpiProgramValidationIssue[]
  kpiIssues: KpiValidationIssue[]
  onBack(): void
  onSaveDraft(): void
  onPublish(mode: 'now' | 'scheduled'): void
  onOpenAdvanced(): void
}
```

Review gồm: mục đích, phạm vi, nguồn, điều kiện, tóm tắt KPI nâng cao, mô phỏng nhân viên. Mô phỏng có nhãn `Ví dụ minh họa`; trạng thái chỉ là `Chưa đủ điều kiện`, `Sắp đủ điều kiện`, `Sẵn sàng được xét`. Publish disabled khi có bất kỳ issue.

- [x] **Step 3: Verification**

```powershell
npm run lint -- src/components/kpi/program/KPIProgramReadinessStep.tsx src/components/kpi/program/KPIProgramReviewStep.tsx
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [x] **Step 4: Tick Task 5 và dừng xin duyệt**

### Task 6: Hoàn tất advanced settings và ngoại lệ cửa hàng

**Files:**
- Create: `src/components/kpi/program/KPIAdvancedSettingsPanel.tsx`
- Create: `src/components/kpi/builder/KPIStoreOverridePanel.tsx`

- [x] **Step 1: Tạo advanced panel**

```ts
export type KPIAdvancedSettingsPanelProps = {
  open: boolean
  activeSection: 'criteria' | 'targets' | 'overrides'
  onSectionChange(section: 'criteria' | 'targets' | 'overrides'): void
  onClose(): void
  children: React.ReactNode
}
```

Copy: `Phần này dành cho người cần chỉnh sâu. Bộ chuẩn Homies đã điền sẵn.` Panel không nhân bản state; chỉ bọc component hiện có.

- [x] **Step 2: Tạo override panel**

```ts
export type KPIStoreOverridePanelProps = {
  version: KpiSetVersion
  stores: Array<{ id: string; name: string }>
  onChange(items: KpiStoreTargetOverride[]): void
}
```

Mỗi item bắt buộc store, numeric criterion, target, reason, owner, from/to. Hiển thị target nhóm hiện tại bằng `resolveCriterionTarget`. Không sửa criterion/weight. Hết hạn có badge `Đã hết hạn`; from > to báo lỗi inline và không phát item invalid.

- [x] **Step 3: Verification**

```powershell
npm run lint -- src/components/kpi/program/KPIAdvancedSettingsPanel.tsx src/components/kpi/builder/KPIStoreOverridePanel.tsx
node --experimental-strip-types --test src/lib/kpi/target-policy-service.test.ts src/lib/kpi/configuration-service.test.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [x] **Step 4: Tick Task 6 và dừng xin duyệt**

### Task 7: Tích hợp wizard vào `/kpi/settings`

**Files:**
- Modify: `src/app/kpi/settings/page.tsx`

- [x] **Step 1: Giữ nguyên các phần an toàn hiện có**

Không đổi guard `ceo/hr_admin`, `persistDatabase` queue/optimistic rollback, adapter load, clone version, groups/criteria/targets engine.

- [x] **Step 2: Thêm metadata handler**

```ts
async function updateProgramMetadata(patch: Partial<Pick<KpiSetVersion,
  | 'primary_purpose'
  | 'secondary_purposes'
  | 'program_setup_step'
  | 'template_id'
  | 'position_ids'
  | 'store_ids'
  | 'effective_from'
  | 'source_policy'
  | 'promotion_rule'
>>) {
  await updateVersion((latestVersion) => ({ ...latestVersion, ...patch }))
}
```

```ts
const programStep: KpiProgramSetupStep = selectedVersion.program_setup_step ?? 'purpose'
```

Legacy draft mở ở `purpose`; published legacy chỉ xem, không bị tự sửa.

- [x] **Step 3: Quick start điền sẵn phần có thể suy ra**

Quick start điền source policy và readiness defaults. Nếu thiếu template, position scope hoặc promotion path, chuyển sang `scope` và hiển thị `Chỉ cần chọn bộ chuẩn, phạm vi và lộ trình để xem trước.` Sau khi scope hợp lệ, clone groups từ `getFnbTemplate(template_id)`, gọi `applyHomiesStandardProgram`, lưu draft, chuyển `program_setup_step: 'review'`, toast `Đã chuẩn bị bộ chuẩn Homies. Hãy xem lại trước khi áp dụng.` Không publish.

- [x] **Step 4: Bọc builder cũ vào advanced**

- criteria: `KPIGroupEditor` + `KPICriterionDrawer`;
- targets: `KPIStoreGroupPanel` + `KPITargetMatrix`;
- overrides: `KPIStoreOverridePanel`.

Không render wizard và toàn bộ builder dài đồng thời.

- [x] **Step 5: Publish đúng service**

```ts
const programIssues = validateProgramVersion(selectedVersion)
const kpiIssues = validateKpiSet(selectedVersion, database.sets, scopedStoreIds)
```

Có issue thì chặn. Mode `now` gọi `publishVersion` theo signature thực tế. Nếu service chưa hỗ trợ scheduled, nút `Lên lịch` disabled với giải thích; không giả trạng thái published.

- [x] **Step 6: Đổi copy phổ thông**

Breadcrumb `KPI & Phát triển`; H1 `Chương trình đánh giá`; CTA `Tạo chương trình`, `Dùng bộ chuẩn`, `Xem cấu hình nâng cao`. Không dùng `Bộ luật`, `Trụ`, `Override` ngoài advanced.

- [x] **Step 7: Verification**

```powershell
npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/program src/components/kpi/builder/KPIStoreOverridePanel.tsx
node --experimental-strip-types --test src/lib/kpi/program-service.test.ts src/lib/kpi/configuration-service.test.ts src/lib/kpi/target-policy-service.test.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [x] **Step 8: Tick Task 7 và dừng xin duyệt**

### Task 8: Đổi điều hướng và copy dashboard

**Files:**
- Modify: `src/lib/navigation/sidebar-config.ts`
- Modify: `src/app/kpi/page.tsx`

- [x] **Step 1: Đổi labels, giữ route và quyền**

Nhóm `KPI & Thưởng` -> `KPI & Phát triển`.

```ts
{ href: '/kpi', label: 'Tổng quan KPI' }
{ href: '/kpi/review', label: 'Việc cần đánh giá' }
{ href: '/kpi/result', label: 'Kết quả & cải thiện' }
{ href: '/kpi/promotion', label: 'Sẵn sàng tăng bậc' }
{ href: '/kpi/settings', label: 'Chương trình đánh giá' }
```

Chỉ thêm `/kpi/result` cho role đang có quyền phù hợp. Period/reports/incidents/appeals giữ nguyên và nằm sau nhóm tác vụ chính.

- [x] **Step 2: Đổi dashboard copy, không viết lại logic**

H1 `Tổng quan KPI & Phát triển`; quick links đổi thành `Việc cần đánh giá`, `Kết quả & cải thiện`, `Sẵn sàng tăng bậc`, `Chương trình đánh giá`. Không render link ngoài quyền.

- [x] **Step 3: Verification**

```powershell
npm run lint -- src/lib/navigation/sidebar-config.ts src/app/kpi/page.tsx
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [x] **Step 4: Tick Task 8 và dừng xin duyệt**

### Task 9: Browser QA, docs và full verification

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: file plan này

- [x] **Step 1: Desktop flow tại port 3535**

CEO/HR Admin mở `/kpi/settings`; tạo program; chọn promotion + bonus; lộ trình core -> Shift Leader; source mặc định; rule 3 tháng/4.0/test 80/thử 4 ca; review; mở/đóng advanced không mất dữ liệu; lưu draft; sửa issue; publish.

Pass khi không cần mở advanced để đến review và CTA dùng ngôn ngữ vận hành.

- [x] **Step 2: Mobile 390x844**

Pass khi stepper đọc/cuộn có chủ đích; cards một cột; controls bấm được; CTA không che; advanced không tràn; matrix cuộn trong vùng.

- [x] **Step 3: Cập nhật CODEMAP cuối**

Liệt kê `program-service.ts`, `components/kpi/program`, override panel, `/kpi/settings` mới và trách nhiệm từng khối.

- [x] **Step 4: Verification cuối**

```powershell
node --experimental-strip-types --test src/lib/kpi/*.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/app/kpi/page.tsx src/components/kpi/program src/components/kpi/builder/KPIStoreOverridePanel.tsx src/lib/kpi src/lib/navigation/sidebar-config.ts
.\node_modules\.bin\tsc.cmd --noEmit
npm run build
npm run ai:ready
```

Expected: tests/lint/type/build/AI ready PASS. `MODULE_TYPELESS_PACKAGE_JSON` nếu còn là warning môi trường, không gọi là failure.

- [x] **Step 5: Scope check**

```powershell
git diff --check
git status --short
```

Không revert file người dùng; báo riêng thay đổi ngoài scope; không stage/commit.

- [x] **Step 6: Tick Task 9 và chốt Giai đoạn 1**

## 3. Điều kiện hoàn thành Giai đoạn 1

- Admin bắt đầu bằng mục tiêu, không bằng bảng trọng số.
- Chọn một primary và nhiều secondary purposes.
- Lộ trình dùng position master data.
- Nguồn và điều kiện có defaults Homies.
- Quick start tự điền defaults, chỉ hỏi scope/path bắt buộc rồi đến review; không auto-publish.
- Advanced builder cũ vẫn dùng được nhưng không cản flow phổ thông.
- Review kết hợp program validation và KPI validation.
- Publish giữ version/snapshot semantics cũ.
- Menu/copy trở thành `KPI & Phát triển`.
- Diff không có peer assignment, 360 cycle hoặc Supabase migration.
- Task 9 có bằng chứng verification.

## 4. Handoff sau Giai đoạn 1

### Rà soát độc lập sau triển khai

- [x] Bắt buộc lưu `source_policy` trước khi phát hành; nguồn mặc định được persist khi người dùng bấm tiếp tục.
- [x] Quick start không tự đoán chức danh/template; thiếu scope/path thì dừng ở `scope`, đủ dữ liệu mới đến `review`.
- [x] Bản `published` chỉ xem; muốn sửa phải nhân bản thành draft.
- [x] Ngoại lệ cửa hàng sai ngày/phạm vi/lý do chỉ nằm ở trạng thái nhập trên UI, chưa persist.
- [x] Peer review và store 360 được ghi rõ là cấu hình cho giai đoạn sau, không tuyên bố đã thu thập thật.

Sau nghiệm thu, không tự làm Giai đoạn 2. Tạo spec con riêng cho đánh giá tháng, peer assignment/ẩn danh, tháng hợp lệ và phiếu kết quả; chạy lại 5D impact và xin duyệt dữ liệu/phân quyền trước khi code.
