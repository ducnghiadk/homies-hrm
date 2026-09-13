# KPI Đánh Giá Tháng & Đồng Nghiệp Ẩn Danh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây flow đánh giá KPI tháng cho nhân viên tuyến đầu và Shift Leader, có phân công đồng nghiệp bán tự động, phiếu ẩn danh, tổng hợp điểm an toàn, duyệt theo vai trò, công bố kết quả và khiếu nại 48 giờ.

**Architecture:** Logic nghiệp vụ nằm trong các service TypeScript thuần và được kiểm thử trước khi nối UI. Dữ liệu nhận diện reviewer và phiếu peer riêng được tách khỏi `KpiDatabase` chung qua một repository bảo mật; `/kpi/review` chỉ nhận DTO đúng quyền, còn `/kpi/result` chỉ nhận aggregate đã công bố. Local adapter dùng cho demo; production dùng Supabase tables + RLS/RPC và không tải phiếu riêng về client Quản lý.

**Tech Stack:** Next.js 16 App Router, React 19 Client Components, TypeScript 5.9, Tailwind CSS v4, Node test runner, localStorage demo repository, Supabase/PostgreSQL/RLS, Zustand auth store.

---

## Quy tắc thực thi

1. Đọc `AGENTS.md`, `DESIGN_RULE_HOMIES_FINAL.md`, `docs/CODEMAP.md`, `docs/KNOWN_ISSUES.md`, `docs/TOKEN_PLAYBOOK.md` và spec đã duyệt trước mỗi pass.
2. Đọc hướng dẫn Next.js 16 liên quan trước khi sửa UI:
   - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
   - `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`
   - `node_modules/next/dist/docs/01-app/02-guides/forms.md`
3. Mỗi lần chỉ thực hiện một task trong plan.
4. Tuân thủ TDD: test đỏ → xác nhận lỗi đúng → code tối thiểu → test xanh → refactor.
5. Không refactor, đổi route hoặc sửa module ngoài phạm vi task.
6. Không commit, stage hoặc push nếu người dùng chưa yêu cầu.
7. Local demo phải ghi rõ không phải bảo mật production. Không được tuyên bố “ẩn danh thật” nếu Supabase/RLS chưa được áp dụng.
8. Sau mỗi task: chạy verification riêng, cập nhật tick `[x]`, cập nhật `docs/KNOWN_ISSUES.md` nếu có bug mới.
9. Khi tạo file mới hoặc thay đổi trách nhiệm file, cập nhật `docs/CODEMAP.md` trong task tài liệu cuối.

## Bản đồ file dự kiến

### Domain và service thuần

- Modify: `src/lib/kpi/types.ts` — type policy, monthly review, assignment, response, aggregate, integrity, notification.
- Create: `src/lib/kpi/peer-review-policy-service.ts` — defaults và validation setting.
- Create: `src/lib/kpi/peer-review-policy-service.test.ts`
- Create: `src/lib/kpi/peer-assignment-service.ts` — eligibility, ranking, manager selection, auto-selection, replacement.
- Create: `src/lib/kpi/peer-assignment-service.test.ts`
- Create: `src/lib/kpi/peer-response-service.ts` — form validation, evidence rule, submit lock, role-safe DTO.
- Create: `src/lib/kpi/peer-response-service.test.ts`
- Create: `src/lib/kpi/peer-aggregation-service.ts` — anonymity threshold, aggregate, peer weight và fallback.
- Create: `src/lib/kpi/peer-aggregation-service.test.ts`
- Create: `src/lib/kpi/monthly-review-service.ts` — lifecycle, primary reviewer, blockers, approval và publish.
- Create: `src/lib/kpi/monthly-review-service.test.ts`
- Create: `src/lib/kpi/evaluation-integrity-service.ts` — integrity flags và HR resolution.
- Create: `src/lib/kpi/evaluation-integrity-service.test.ts`
- Create: `src/lib/kpi/evaluation-notification-service.ts` — notification milestones idempotent.
- Create: `src/lib/kpi/evaluation-notification-service.test.ts`
- Modify: `src/lib/kpi/evaluation-service.ts` — nhận aggregate peer đã an toàn và lưu summary tháng.
- Modify: `src/lib/kpi/evaluation-service.test.ts`
- Modify: `src/lib/kpi/development-service.ts` — không dùng kỳ đang appeal cho promotion readiness.
- Modify: `src/lib/kpi/development-service.test.ts`
- Modify: `src/lib/kpi/index.ts` — export public APIs mới.

### Repository, adapter và database

- Create: `src/lib/kpi/peer-review-repository.ts` — interface role-safe và DTO.
- Create: `src/lib/kpi/local-peer-review-repository.ts` — demo adapter, tách storage key.
- Create: `src/lib/kpi/local-peer-review-repository.test.ts`
- Create: `src/lib/kpi/supabase-peer-review-repository.ts` — gateway/RPC production.
- Create: `src/lib/kpi/supabase-peer-review-repository.test.ts`
- Create: `src/lib/adapters/peer-review-adapter.ts` — nối employee, schedule, KPI và repository.
- Create: `src/lib/adapters/peer-review-adapter.test.ts`
- Modify: `src/lib/kpi/seed.ts` — seed demo tháng và assignments không chứa dữ liệu nhạy cảm trong KPI store chung.
- Create: `supabase/migrations/20260823_kpi_monthly_peer_review.sql`
- Create: `supabase/migrations/20260823_kpi_monthly_peer_review_rls.sql`
- Create: `supabase/seed_kpi_monthly_peer_review_demo.sql`

### UI

- Create: `src/components/kpi/program/KPIPeerReviewSettingsPanel.tsx`
- Modify: `src/components/kpi/program/KPIProgramSourcesStep.tsx`
- Modify: `src/app/kpi/settings/page.tsx`
- Create: `src/components/kpi/monthly/KPIReviewTaskList.tsx`
- Create: `src/components/kpi/monthly/KPIPeerReviewForm.tsx`
- Create: `src/components/kpi/monthly/KPIReviewerSelectionPanel.tsx`
- Create: `src/components/kpi/monthly/KPIReviewProgressPanel.tsx`
- Create: `src/components/kpi/monthly/KPIManagerApprovalDrawer.tsx`
- Create: `src/components/kpi/monthly/KPIHrIntegrityQueue.tsx`
- Create: `src/components/kpi/monthly/KPIMonthlyRoleWorkspace.tsx`
- Modify: `src/app/kpi/review/page.tsx`
- Modify: `src/app/kpi/result/page.tsx`
- Modify: `src/components/kpi/workspace/KPIScoringWorkspace.tsx`

### Documentation

- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md`
- Modify: file plan này.

---

### Task 0: Khóa context và baseline

**Files:**
- Read: `AGENTS.md`
- Read: `DESIGN_RULE_HOMIES_FINAL.md`
- Read: `docs/CODEMAP.md`
- Read: `docs/KNOWN_ISSUES.md`
- Read: `docs/TOKEN_PLAYBOOK.md`
- Read: `docs/superpowers/specs/2026-08-23-kpi-danh-gia-thang-peer-an-danh-design.md`
- Read: ba file hướng dẫn Next.js trong phần Quy tắc thực thi.

- [ ] **Step 1: Xác nhận branch và workspace bẩn**

Run:

```powershell
git branch --show-current
git status --short
```

Expected: không ở `main`/`master`; ghi nhận thay đổi có sẵn và không revert.

- [ ] **Step 2: Chạy baseline KPI tests**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/*.test.ts
```

Expected: tất cả test hiện tại PASS. Nếu fail, dừng và phân loại lỗi baseline trước khi sửa.

- [ ] **Step 3: Chạy baseline TypeScript và lint route trong phạm vi**

Run:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
npm run lint -- src/app/kpi/review/page.tsx src/app/kpi/result/page.tsx src/app/kpi/settings/page.tsx src/components/kpi/program src/components/kpi/workspace src/lib/kpi
```

Expected: exit code 0 hoặc ghi rõ lỗi baseline ngoài phạm vi trước khi tiếp tục.

---

### Task 1: Domain types và policy mặc định

**Files:**
- Modify: `src/lib/kpi/types.ts`
- Create: `src/lib/kpi/peer-review-policy-service.ts`
- Create: `src/lib/kpi/peer-review-policy-service.test.ts`
- Modify: `src/lib/kpi/program-service.ts`
- Modify: `src/lib/kpi/program-service.test.ts`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho policy mặc định và validation**

Test phải chứa các hành vi sau:

```ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getDefaultPeerReviewPolicy,
  validatePeerReviewPolicy,
} from './peer-review-policy-service.ts'

describe('peer review policy', () => {
  it('uses the approved Homies defaults', () => {
    const policy = getDefaultPeerReviewPolicy()
    assert.equal(policy.enabled, true)
    assert.equal(policy.weight_percent, 10)
    assert.equal(policy.max_weight_percent, 15)
    assert.equal(policy.min_total_shifts, 8)
    assert.equal(policy.min_shared_shifts, 5)
    assert.equal(policy.manager_selection_hours, 24)
    assert.equal(policy.reviewer_deadline_hours, 48)
    assert.equal(policy.required_reviewer_count, 2)
    assert.equal(policy.extreme_comment_min_length, 20)
    assert.equal(policy.missing_sample_fallback, 'primary_reviewer')
  })

  it('rejects unsafe or impossible settings', () => {
    const policy = { ...getDefaultPeerReviewPolicy(), weight_percent: 16, required_reviewer_count: 1 }
    assert.deepEqual(
      validatePeerReviewPolicy(policy).map((issue) => issue.code),
      ['PEER_WEIGHT_CAP', 'REVIEWER_COUNT']
    )
  })
})
```

- [x] **Step 2: Chạy test và xác nhận FAIL vì service chưa tồn tại**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/peer-review-policy-service.test.ts
```

Expected: FAIL do thiếu module/export.

- [x] **Step 3: Thêm type đã chốt**

Thêm vào `types.ts`:

```ts
export interface KpiPeerReviewPolicy {
  enabled: boolean
  weight_percent: number
  max_weight_percent: 15
  min_total_shifts: number
  min_shared_shifts: number
  manager_selection_hours: number
  reviewer_deadline_hours: number
  required_reviewer_count: 2
  standby_enabled: boolean
  exclude_probation: boolean
  exclude_suspended: boolean
  extreme_comment_min_length: number
  missing_sample_fallback: 'primary_reviewer'
}

export type KpiMonthlyReviewStatus =
  | 'assignment_pending'
  | 'collecting'
  | 'primary_review_pending'
  | 'manager_approval_pending'
  | 'published'
  | 'appeal_open'
  | 'locked'

export interface KpiMonthlyReview {
  id: string
  period_id: string
  evaluation_id: string
  employee_id: string
  store_id: string
  position_id: string
  subject_role: 'employee' | 'shift_leader'
  primary_reviewer_id: string
  primary_reviewer_role: 'shift_leader' | 'store_manager'
  status: KpiMonthlyReviewStatus
  assignment_deadline_at?: string
  peer_deadline_at?: string
  published_at?: string
  appeal_deadline_at?: string
  missing_peer_sample: boolean
  blocker_codes: string[]
  created_at: string
  updated_at: string
}

export type KpiPeerAssignmentStatus = 'candidate' | 'assigned' | 'submitted' | 'expired' | 'replaced'

export interface KpiPeerAssignment {
  id: string
  monthly_review_id: string
  reviewer_id: string
  rank: number
  shared_shift_count: number
  total_shift_count: number
  selected_by: 'system' | 'manager'
  selected_by_actor_id?: string
  selection_reason?: string
  status: KpiPeerAssignmentStatus
  assigned_at?: string
  deadline_at?: string
  replacement_for_assignment_id?: string
}

export interface KpiPeerAnswer {
  question_code: 'peak_teamwork' | 'proactive_support' | 'shift_handover' | 'hygiene_process' | 'team_communication'
  score: 1 | 2 | 3 | 4 | 5
  observed_date?: string
  situation_code?: string
  evidence_note?: string
}

export interface KpiPeerResponse {
  id: string
  assignment_id: string
  monthly_review_id: string
  reviewer_id: string
  answers: KpiPeerAnswer[]
  strength_note: string
  improvement_note: string
  direct_observation_confirmed: boolean
  submitted_at: string
}

export interface KpiPeerAggregate {
  monthly_review_id: string
  valid_response_count: number
  enough_anonymous_sample: boolean
  question_scores: Array<{ question_code: KpiPeerAnswer['question_code']; score: number }>
  total_score?: number
  strength_summary?: string
  improvement_summary?: string
  configured_weight_percent: number
  applied_peer_weight_percent: number
  fallback_primary_weight_percent: number
}

export interface KpiEvaluationIntegrityFlag {
  id: string
  monthly_review_id: string
  code:
    | 'RECIPROCAL_PAIR'
    | 'REPEATED_PAIR'
    | 'IDENTICAL_RESPONSES'
    | 'EXTREME_WITH_WEAK_EVIDENCE'
    | 'SOURCE_DIVERGENCE'
    | 'MANAGER_OVERRIDE_PATTERN'
    | 'REVIEWER_BIAS_PATTERN'
  severity: 'info' | 'warning' | 'blocking'
  evidence_refs: string[]
  status: 'open' | 'dismissed' | 'confirmed'
  resolved_by?: string
  resolution_reason?: string
}
```

Thêm `peer_review_policy?: KpiPeerReviewPolicy` vào `KpiSetVersion` để dữ liệu legacy vẫn đọc được.

- [x] **Step 4: Viết policy service tối thiểu**

Public API:

```ts
export type KpiPeerPolicyIssueCode =
  | 'PEER_WEIGHT_CAP'
  | 'REVIEWER_COUNT'
  | 'SHIFT_THRESHOLD'
  | 'DEADLINE'
  | 'COMMENT_LENGTH'

export interface KpiPeerPolicyIssue {
  code: KpiPeerPolicyIssueCode
  message: string
}

export function getDefaultPeerReviewPolicy(): KpiPeerReviewPolicy
export function validatePeerReviewPolicy(policy: KpiPeerReviewPolicy): KpiPeerPolicyIssue[]
```

Validation cụ thể:

- weight từ 0 đến 15;
- required reviewer count đúng 2;
- total/shared shifts không âm;
- selection/reviewer deadline lớn hơn 0;
- minimum evidence length tối thiểu 20;
- fallback đúng `primary_reviewer`.

- [x] **Step 5: Nối default vào chương trình nhân viên**

`getDefaultSourcePolicy(..., 'employee')` vẫn giữ `peer`, đồng thời các factory tạo draft chương trình phải thêm:

```ts
peer_review_policy: getDefaultPeerReviewPolicy()
```

Chương trình dành cho `shift_leader` hoặc `store_manager` phải dùng:

```ts
peer_review_policy: {
  ...getDefaultPeerReviewPolicy(),
  enabled: false,
  weight_percent: 0,
}
```

- [x] **Step 6: Chạy test Task 1**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/peer-review-policy-service.test.ts src/lib/kpi/program-service.test.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS, TypeScript exit 0.

---

### Task 2: Eligibility, ranking và phân công reviewer

**Files:**
- Create: `src/lib/kpi/peer-assignment-service.ts`
- Create: `src/lib/kpi/peer-assignment-service.test.ts`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho eligibility và ranking ổn định**

Test data dùng type thuần:

```ts
const facts = [
  { employee_id: 'peer-a', role: 'employee', status: 'active', probation: false, suspended: false, serious_incident_open: false, total_shifts: 18, shared_shifts: 12, reviewed_subject_last_month: false, reciprocal_in_period: false },
  { employee_id: 'peer-b', role: 'employee', status: 'active', probation: false, suspended: false, serious_incident_open: false, total_shifts: 20, shared_shifts: 8, reviewed_subject_last_month: false, reciprocal_in_period: false },
  { employee_id: 'peer-c', role: 'employee', status: 'active', probation: true, suspended: false, serious_incident_open: false, total_shifts: 22, shared_shifts: 15, reviewed_subject_last_month: false, reciprocal_in_period: false },
  { employee_id: 'peer-d', role: 'employee', status: 'active', probation: false, suspended: false, serious_incident_open: false, total_shifts: 16, shared_shifts: 4, reviewed_subject_last_month: false, reciprocal_in_period: false },
]

assert.deepEqual(
  rankPeerCandidates({ subject_id: 'subject-1', facts, policy }).map((item) => item.employee_id),
  ['peer-a', 'peer-b']
)
```

Thêm test:

- subject bị loại;
- primary reviewer bị loại;
- probation/suspended/serious incident bị loại;
- shared shifts dưới 5 bị loại;
- reciprocal pair bị loại;
- reviewer tháng trước bị xếp sau người tương đương;
- tie-break bằng employee ID cho kết quả ổn định.

- [x] **Step 2: Chạy test và xác nhận FAIL**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/peer-assignment-service.test.ts
```

Expected: FAIL do thiếu service.

- [x] **Step 3: Thêm public API assignment**

```ts
export interface KpiPeerCandidateFact {
  employee_id: string
  role: 'employee' | 'shift_leader' | 'store_manager'
  status: 'active' | 'inactive'
  probation: boolean
  suspended: boolean
  serious_incident_open: boolean
  total_shifts: number
  shared_shifts: number
  reviewed_subject_last_month: boolean
  reciprocal_in_period: boolean
}

export interface KpiRankedPeerCandidate {
  employee_id: string
  rank: number
  total_shifts: number
  shared_shifts: number
  reason_label: string
}

export function rankPeerCandidates(input: {
  subject_id: string
  primary_reviewer_id?: string
  facts: KpiPeerCandidateFact[]
  policy: KpiPeerReviewPolicy
}): KpiRankedPeerCandidate[]

export function selectPeerReviewers(input: {
  monthly_review_id: string
  candidates: KpiRankedPeerCandidate[]
  reviewer_ids: string[]
  actor_id: string
  selected_at: string
  policy: KpiPeerReviewPolicy
}): KpiPeerAssignment[]

export function autoSelectPeerReviewers(input: {
  monthly_review_id: string
  candidates: KpiRankedPeerCandidate[]
  selected_at: string
  policy: KpiPeerReviewPolicy
}): KpiPeerAssignment[]

export function activateReplacementReviewer(input: {
  expired_assignment: KpiPeerAssignment
  existing_assignments: KpiPeerAssignment[]
  candidates: KpiRankedPeerCandidate[]
  activated_at: string
  policy: KpiPeerReviewPolicy
}): { expired: KpiPeerAssignment; replacement?: KpiPeerAssignment }
```

`reason_label` phải có dạng `Làm chung 12 ca · Tổng 18 ca`.

- [x] **Step 4: Viết test đỏ cho manager selection, auto-select và replacement**

Test bắt buộc:

```ts
assert.throws(
  () => selectPeerReviewers({
    monthly_review_id: 'review-1',
    candidates,
    reviewer_ids: ['peer-a'],
    actor_id: 'manager-1',
    selected_at: '2026-08-25T08:00:00.000Z',
    policy,
  }),
  /đúng 2 người/
)
```

Và:

- manager chọn đúng hai candidate → two assigned rows;
- reviewer ngoài candidates thiếu `selection_reason` → reject;
- auto-select chọn top 2;
- replacement chọn candidate chưa từng assigned;
- assignment expired không nhận submit mới.

- [x] **Step 5: Implement selection và replacement tối thiểu**

Không mutate input arrays. ID assignment ổn định theo:

```ts
const id = `peer_assignment_${monthlyReviewId}_${reviewerId}`
```

Deadline dùng helper cộng `reviewer_deadline_hours` từ `selected_at`.

- [x] **Step 6: Chạy test Task 2**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/peer-assignment-service.test.ts
npm run lint -- src/lib/kpi/peer-assignment-service.ts src/lib/kpi/peer-assignment-service.test.ts
```

Expected: PASS, lint exit 0.

---

### Task 3: Phiếu peer, evidence và DTO ẩn danh

**Files:**
- Create: `src/lib/kpi/peer-response-service.ts`
- Create: `src/lib/kpi/peer-response-service.test.ts`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho form 5 câu**

Test phải xác nhận:

- đúng 5 question codes, không trùng;
- điểm chỉ từ 1–5;
- điểm 1, 2, 5 cần observed date/situation và note tối thiểu 20 ký tự;
- điểm 3, 4 không bắt buộc evidence note;
- strength/improvement không rỗng;
- direct observation phải được xác nhận;
- assignment `expired` hoặc `replaced` không được submit.

Ví dụ:

```ts
const issues = validatePeerResponseDraft({
  assignment,
  answers: PEER_QUESTION_CODES.map((question_code) => ({ question_code, score: 5 as const })),
  strength_note: 'Hỗ trợ quầy tốt',
  improvement_note: 'Bàn giao tồn kho rõ hơn',
  direct_observation_confirmed: true,
}, policy)

assert.equal(issues.some((issue) => issue.code === 'MISSING_EXTREME_EVIDENCE'), true)
```

- [x] **Step 2: Chạy test và xác nhận FAIL**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/peer-response-service.test.ts
```

Expected: FAIL do thiếu service.

- [x] **Step 3: Thêm service API**

```ts
export const PEER_QUESTION_CODES: KpiPeerAnswer['question_code'][] = [
  'peak_teamwork',
  'proactive_support',
  'shift_handover',
  'hygiene_process',
  'team_communication',
]

export type KpiPeerResponseIssueCode =
  | 'ASSIGNMENT_NOT_ACTIVE'
  | 'QUESTION_SET'
  | 'SCORE_RANGE'
  | 'MISSING_EXTREME_EVIDENCE'
  | 'MISSING_SUMMARY_NOTE'
  | 'OBSERVATION_NOT_CONFIRMED'

export function validatePeerResponseDraft(
  input: PeerResponseDraftInput,
  policy: KpiPeerReviewPolicy,
): KpiPeerResponseIssue[]

export function submitPeerResponse(input: {
  assignment: KpiPeerAssignment
  reviewer_id: string
  draft: PeerResponseDraftInput
  policy: KpiPeerReviewPolicy
  submitted_at: string
}): { assignment: KpiPeerAssignment; response: KpiPeerResponse }
```

- [x] **Step 4: Viết test đỏ cho role-safe DTO**

```ts
const managerDto = toManagerPeerProgressDto({ assignments, responses })
assert.equal('reviewer_id' in managerDto.responses[0], false)
assert.equal('answers' in managerDto.responses[0], false)

const employeeDto = toEmployeePeerAggregateDto(aggregate)
assert.equal('assignment_ids' in employeeDto, false)
```

DTO Manager chỉ chứa counts/status/deadline; DTO employee chỉ chứa aggregate đã publish. Không export helper trả raw response cho UI thường.

- [x] **Step 5: Implement DTO sanitization**

Public DTO:

```ts
export interface KpiManagerPeerProgressDto {
  required_count: 2
  submitted_count: number
  expired_count: number
  replacement_active: boolean
  enough_anonymous_sample: boolean
}

export interface KpiEmployeePeerResultDto {
  total_score?: number
  strength_summary?: string
  improvement_summary?: string
  enough_anonymous_sample: boolean
  unavailable_reason?: 'insufficient_anonymous_sample'
}
```

- [x] **Step 6: Chạy test Task 3**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/peer-response-service.test.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS, TypeScript exit 0.

---

### Task 4: Tổng hợp peer và fallback trọng số

**Files:**
- Create: `src/lib/kpi/peer-aggregation-service.ts`
- Create: `src/lib/kpi/peer-aggregation-service.test.ts`
- Modify: `src/lib/kpi/evaluation-service.ts`
- Modify: `src/lib/kpi/evaluation-service.test.ts`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho anonymity threshold**

```ts
assert.deepEqual(
  aggregatePeerResponses({ monthly_review_id: 'review-1', responses: [responseA], policy }),
  {
    monthly_review_id: 'review-1',
    valid_response_count: 1,
    enough_anonymous_sample: false,
    question_scores: [],
    configured_weight_percent: 10,
    applied_peer_weight_percent: 0,
    fallback_primary_weight_percent: 10,
  }
)
```

Với hai response hợp lệ, test exact average theo câu và total score làm tròn hai chữ số.

- [x] **Step 2: Chạy test và xác nhận FAIL**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/peer-aggregation-service.test.ts
```

- [x] **Step 3: Thêm aggregate service**

```ts
export function aggregatePeerResponses(input: {
  monthly_review_id: string
  responses: KpiPeerResponse[]
  policy: KpiPeerReviewPolicy
}): KpiPeerAggregate

export function buildPeerSummary(input: {
  aggregate: KpiPeerAggregate
  responses: KpiPeerResponse[]
}): Pick<KpiPeerAggregate, 'strength_summary' | 'improvement_summary'>
```

Summary demo phải ghép ý theo ngôn ngữ trung tính, không chèn tên reviewer và không gọi AI/network.

- [x] **Step 4: Viết test đỏ cho scoring integration**

Thêm test vào `evaluation-service.test.ts`:

```ts
const result = applyPeerAggregateToEvaluation(evaluation, aggregate, ['teamwork_handover', 'teamwork_support'])
assert.equal(result.peer_summary?.enough_anonymous_sample, true)
assert.equal(result.peer_summary?.applied_weight_percent, 10)
```

Với aggregate thiếu mẫu:

```ts
assert.equal(result.peer_summary?.applied_weight_percent, 0)
assert.equal(result.peer_summary?.fallback_primary_weight_percent, 10)
```

- [x] **Step 5: Mở rộng `KpiEvaluation` và evaluation service**

Thêm optional fields để legacy data không vỡ:

```ts
peer_summary?: {
  total_score?: number
  enough_anonymous_sample: boolean
  applied_weight_percent: number
  fallback_primary_weight_percent: number
  strength_summary?: string
  improvement_summary?: string
}
monthly_feedback?: {
  strength: string
  improvement: string
  next_action: 'normal_follow_up' | 'training' | 'trial_responsibility' | 'promotion_watchlist'
  support_needed: string
}
```

Không đưa reviewer IDs hoặc raw answers vào `KpiEvaluation`.

- [x] **Step 6: Chạy test Task 4**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/peer-aggregation-service.test.ts src/lib/kpi/evaluation-service.test.ts
```

Expected: PASS.

---

### Task 5: Lifecycle tháng, primary reviewer và approval blockers

**Files:**
- Create: `src/lib/kpi/monthly-review-service.ts`
- Create: `src/lib/kpi/monthly-review-service.test.ts`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho tạo monthly review**

Test frontline:

- subject role employee;
- primary reviewer là Shift Leader nhiều shared shifts nhất;
- status `assignment_pending` khi peer enabled;
- assignment deadline +24h;
- peer deadline chưa set trước khi assignments active.

Test Shift Leader:

- primary reviewer là Store Manager;
- không tạo peer selection;
- status `primary_review_pending`;
- manager submit sạch có thể chuyển `published` theo lịch, không tự duyệt hai lần.

- [x] **Step 2: Chạy test và xác nhận FAIL**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/monthly-review-service.test.ts
```

- [x] **Step 3: Thêm lifecycle API**

```ts
export function createMonthlyReview(input: {
  period_id: string
  evaluation_id: string
  employee: KpiEmployeeRef
  subject_role: 'employee' | 'shift_leader'
  primary_reviewer_id: string
  peer_policy: KpiPeerReviewPolicy
  opened_at: string
}): KpiMonthlyReview

export function advanceMonthlyReview(input: {
  review: KpiMonthlyReview
  assignment_count: number
  submitted_peer_count: number
  primary_submitted: boolean
  manager_approved: boolean
  integrity_flags: KpiEvaluationIntegrityFlag[]
  serious_incident_open: boolean
  appeal_open: boolean
  at: string
}): KpiMonthlyReview

export function getPublicationBlockers(input: MonthlyReviewBlockerInput): string[]

export function approveMonthlyReview(input: {
  review: KpiMonthlyReview
  actor: KpiActor
  at: string
}): KpiMonthlyReview

export function publishMonthlyReview(input: {
  review: KpiMonthlyReview
  evaluation: KpiEvaluation
  at: string
}): { review: KpiMonthlyReview; evaluation: KpiEvaluation }
```

- [x] **Step 4: Viết test đỏ cho blockers**

Exact blocker codes:

```ts
type KpiMonthlyReviewBlockerCode =
  | 'PRIMARY_REVIEW_MISSING'
  | 'IMPORTANT_SOURCE_UNCONFIRMED'
  | 'EXTREME_SCORE_EVIDENCE_MISSING'
  | 'SERIOUS_INCIDENT_OPEN'
  | 'APPEAL_OPEN'
  | 'INTEGRITY_REVIEW_REQUIRED'
  | 'RETURNED_CHANGES_PENDING'
```

Thiếu peer sample không được xuất hiện trong blocker codes.

- [x] **Step 5: Implement transition guard**

Chỉ cho các transition:

```text
assignment_pending → collecting
collecting → primary_review_pending
primary_review_pending → manager_approval_pending
manager_approval_pending → published
published → appeal_open
appeal_open → published hoặc locked
published → locked
```

Shift Leader clean flow cho phép `primary_review_pending → published` vì Store Manager là primary owner.

- [x] **Step 6: Chạy test Task 5**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/monthly-review-service.test.ts
npm run lint -- src/lib/kpi/monthly-review-service.ts src/lib/kpi/monthly-review-service.test.ts
```

Expected: PASS.

---

### Task 6: Integrity flags và notifications idempotent

**Files:**
- Create: `src/lib/kpi/evaluation-integrity-service.ts`
- Create: `src/lib/kpi/evaluation-integrity-service.test.ts`
- Create: `src/lib/kpi/evaluation-notification-service.ts`
- Create: `src/lib/kpi/evaluation-notification-service.test.ts`
- Modify: `src/lib/kpi/types.ts`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho integrity flags**

Test mỗi signal bằng input deterministic:

- reciprocal pair;
- repeated pair 3 tháng liên tiếp;
- identical five-answer vectors;
- extreme score với evidence ngắn;
- peer score lệch primary score từ 1.5 điểm trở lên;
- manager bỏ top candidates nhiều kỳ;
- reviewer có mean lệch mạnh so với team baseline.

Kết quả chỉ là flag `open`, không tự loại phiếu.

- [x] **Step 2: Implement integrity API**

```ts
export function detectEvaluationIntegrityFlags(input: {
  monthly_review_id: string
  current_assignments: KpiPeerAssignment[]
  current_responses: KpiPeerResponse[]
  historical_assignments: KpiPeerAssignment[]
  historical_reviewer_scores: Array<{ reviewer_id: string; score: number }>
  peer_total_score?: number
  primary_total_score?: number
}): KpiEvaluationIntegrityFlag[]

export function resolveIntegrityFlag(input: {
  flag: KpiEvaluationIntegrityFlag
  actor: KpiActor
  decision: 'dismissed' | 'confirmed'
  reason: string
}): KpiEvaluationIntegrityFlag
```

Chỉ `hr_admin` và `ceo` được resolve. Reason không được rỗng.

- [x] **Step 3: Viết test đỏ cho notification milestones**

Type:

```ts
export interface KpiEvaluationNotificationEvent {
  id: string
  monthly_review_id: string
  recipient_id: string
  type:
    | 'REVIEW_ASSIGNED'
    | 'REVIEW_DUE_24H'
    | 'REPLACEMENT_ACTIVATED'
    | 'PRIMARY_REVIEW_REQUIRED'
    | 'MANAGER_APPROVAL_REQUIRED'
    | 'REVIEW_RETURNED'
    | 'RESULT_PUBLISHED'
    | 'APPEAL_DUE_24H'
    | 'APPEAL_DECIDED'
  created_at: string
}
```

Gọi builder hai lần với cùng milestone phải trả một event ID, không tạo duplicate.

- [x] **Step 4: Implement notification builder thuần**

```ts
export function buildEvaluationNotificationEvent(input: {
  monthly_review_id: string
  recipient_id: string
  type: KpiEvaluationNotificationEvent['type']
  at: string
  existing_events: KpiEvaluationNotificationEvent[]
}): KpiEvaluationNotificationEvent | undefined
```

- [x] **Step 5: Chạy test Task 6**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/evaluation-integrity-service.test.ts src/lib/kpi/evaluation-notification-service.test.ts
```

Expected: PASS.

---

### Task 7: Repository bảo mật, local demo và Supabase RLS

**Files:**
- Create: `src/lib/kpi/peer-review-repository.ts`
- Create: `src/lib/kpi/local-peer-review-repository.ts`
- Create: `src/lib/kpi/local-peer-review-repository.test.ts`
- Create: `src/lib/kpi/supabase-peer-review-repository.ts`
- Create: `src/lib/kpi/supabase-peer-review-repository.test.ts`
- Create: `supabase/migrations/20260823_kpi_monthly_peer_review.sql`
- Create: `supabase/migrations/20260823_kpi_monthly_peer_review_rls.sql`

- [x] **Step 1: Định nghĩa role-safe repository interface**

```ts
export interface KpiPeerReviewerTaskDto {
  assignment_id: string
  monthly_review_id: string
  subject: { id: string; name: string; position_name: string }
  month: string
  shared_shift_count: number
  deadline_at: string
  status: 'assigned' | 'submitted'
}

export interface KpiPeerManagerQueueDto {
  monthly_review_id: string
  subject: { id: string; name: string; position_name: string }
  candidates: KpiRankedPeerCandidate[]
  selected_reviewer_ids: string[]
  progress: KpiManagerPeerProgressDto
  integrity_flag_count: number
}

export interface KpiPeerReviewRepository {
  listReviewerTasks(actor: KpiActor): Promise<KpiPeerReviewerTaskDto[]>
  listManagerQueue(actor: KpiActor): Promise<KpiPeerManagerQueueDto[]>
  submitResponse(actor: KpiActor, assignmentId: string, draft: PeerResponseDraftInput): Promise<void>
  selectReviewers(actor: KpiActor, monthlyReviewId: string, reviewerIds: string[], reason?: string): Promise<void>
  getEmployeeAggregate(actor: KpiActor, monthlyReviewId: string): Promise<KpiEmployeePeerResultDto>
  revealReviewerIdentity(actor: KpiActor, assignmentId: string, reason: string): Promise<{ reviewer_id: string }>
}
```

Không thêm method `listAllResponses()` vào public interface.

- [x] **Step 2: Viết local repository tests**

Test:

- reviewer chỉ thấy task của mình;
- manager thấy candidate/progress nhưng không raw answers;
- employee chỉ thấy published aggregate của chính mình;
- manager không gọi được reveal;
- HR/CEO reveal cần reason và tạo audit event;
- data dùng storage key riêng `homies_kpi_peer_review_demo_v1`.

- [x] **Step 3: Implement local demo repository**

Local storage payload có thể chứa raw demo data để mô phỏng, nhưng repository phải sanitize mọi DTO và export constant:

```ts
export const KPI_PEER_REVIEW_DEMO_STORAGE_KEY = 'homies_kpi_peer_review_demo_v1'
export const KPI_PEER_REVIEW_DEMO_ONLY = true
```

UI Admin phải có badge “Dữ liệu demo — chưa phải ẩn danh production” khi dùng local adapter.

- [x] **Step 4: Viết Supabase gateway tests trước**

Mock gateway phải xác nhận:

- reviewer task query theo `auth.uid()`;
- manager queue gọi RPC trả aggregate/candidates sanitized;
- submit dùng assignment ownership;
- reveal gọi RPC riêng và truyền reason;
- không có gateway method tải toàn bộ peer responses cho client.

- [x] **Step 5: Tạo schema migration**

Tables tối thiểu:

```sql
kpi_monthly_reviews
kpi_peer_assignments
kpi_peer_responses
kpi_peer_answers
kpi_peer_aggregates
kpi_evaluation_integrity_flags
kpi_evaluation_notification_events
```

Yêu cầu:

- UUID PK/FK;
- unique active assignment theo monthly_review + reviewer;
- check score 1–5;
- response unique theo assignment;
- answer unique theo response + question_code;
- indexes cho reviewer/status/deadline, monthly_review/status, employee/period;
- timestamps dùng `TIMESTAMPTZ`.

- [x] **Step 6: Tạo RLS migration**

Policy bắt buộc:

- reviewer chỉ select assignment của mình và insert/update response của assignment active của mình;
- subject không select raw assignments/responses;
- store manager không select peer responses/answers;
- manager dùng sanitized RPC cho progress/aggregate;
- HR/CEO reveal qua security definer RPC kiểm tra role + non-empty reason + insert audit log;
- aggregate chỉ select khi published và đúng subject, hoặc role quản lý đúng scope;
- service/admin actions không dựa vào client-supplied role string.

- [x] **Step 7: Chạy repository tests và SQL checks**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/local-peer-review-repository.test.ts src/lib/kpi/supabase-peer-review-repository.test.ts
rg -n "ENABLE ROW LEVEL SECURITY|CREATE POLICY|SECURITY DEFINER|kpi_audit_logs" supabase/migrations/20260823_kpi_monthly_peer_review_rls.sql
```

Expected: tests PASS; SQL chứa đủ RLS/RPC/audit markers.

---

### Task 8: Adapter dữ liệu ca làm, seed demo và orchestration

**Files:**
- Create: `src/lib/adapters/peer-review-adapter.ts`
- Create: `src/lib/adapters/peer-review-adapter.test.ts`
- Modify: `src/lib/kpi/seed.ts`
- Create: `supabase/seed_kpi_monthly_peer_review_demo.sql`
- Modify: `src/lib/kpi/index.ts`

- [x] **Step 1: Viết test đỏ cho shared-shift facts**

Input adapter phải nhận arrays thay vì domain service tự đọc mock globals:

```ts
const schedules = [
  { employee_id: 'subject', store_id: 'store-1', date: '2026-08-01', shift_id: 'morning' },
  { employee_id: 'peer-a', store_id: 'store-1', date: '2026-08-01', shift_id: 'morning' },
  { employee_id: 'peer-b', store_id: 'store-1', date: '2026-08-01', shift_id: 'evening' },
]

assert.equal(buildPeerCandidateFacts({ subject_id: 'subject', employees, schedules, month: '2026-08' })[0].shared_shifts, 1)
```

Ca làm chung chỉ tính khi cùng store, date và shift ID.

- [x] **Step 2: Implement adapter API**

```ts
export function buildPeerCandidateFacts(input: {
  subject_id: string
  primary_reviewer_id?: string
  employees: Array<{ id: string; role: string; status: string; store_id: string }>
  schedules: Array<{ employee_id: string; store_id: string; date: string; shift_id: string; status?: string }>
  month: string
  open_serious_incident_employee_ids?: string[]
  reciprocal_pairs?: Array<[string, string]>
  previous_reviewer_ids?: string[]
}): KpiPeerCandidateFact[]
```

Chỉ tính schedule `published` hoặc legacy schedule không có status; không tính draft chưa publish.

- [x] **Step 3: Tạo `peerReviewAdapter`**

Adapter chọn repository theo:

```ts
process.env.NEXT_PUBLIC_KPI_REPOSITORY === 'supabase'
```

Public methods chỉ mirror `KpiPeerReviewRepository` và thêm:

```ts
getRuntimeMode(): 'local_demo' | 'supabase_secure'
```

- [x] **Step 4: Seed demo có đủ các kịch bản**

Seed local và SQL phải có:

- một frontline review chờ manager chọn;
- một peer task đang assigned;
- một review đủ hai phiếu chờ primary review;
- một review thiếu sample đã fallback;
- một Shift Leader review chờ Store Manager;
- một integrity flag open;
- không đưa raw identity/answers vào `buildKpiSeed()` của KPI store chung.

- [x] **Step 5: Chạy test Task 8**

Run:

```powershell
node --experimental-strip-types --test src/lib/adapters/peer-review-adapter.test.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

---

### Task 9: UI cấu hình peer trong chương trình KPI

**Files:**
- Create: `src/components/kpi/program/KPIPeerReviewSettingsPanel.tsx`
- Modify: `src/components/kpi/program/KPIProgramSourcesStep.tsx`
- Modify: `src/app/kpi/settings/page.tsx`

- [x] **Step 1: Tạo panel controlled bằng props**

```ts
interface KPIPeerReviewSettingsPanelProps {
  policy: KpiPeerReviewPolicy
  runtimeMode: 'local_demo' | 'supabase_secure'
  onChange(policy: KpiPeerReviewPolicy): void
}
```

Fields:

- bật/tắt peer;
- trọng số 0–15;
- tổng ca tối thiểu;
- ca làm chung tối thiểu;
- thời gian Quản lý chọn;
- thời hạn reviewer;
- người dự phòng;
- fallback cố định “Chuyển sang người chấm chính”.

Không cho sửa required reviewer count khỏi 2; hiển thị dưới dạng thông tin cố định.

- [x] **Step 2: Hiển thị warning demo đúng ngữ cảnh**

Khi `runtimeMode === 'local_demo'`:

```text
Dữ liệu demo: giao diện mô phỏng ẩn danh, chưa dùng để vận hành thật cho tới khi Supabase/RLS được bật.
```

Không hiển thị warning khi secure repository active.

- [x] **Step 3: Nối panel vào Sources step**

Panel chỉ mở khi source `peer` được bật và audience là employee. Audience manager/Shift Leader phải tắt peer và không render settings tương tác.

- [x] **Step 4: Persist policy ở page controller**

`onChange` phải gọi mutation hiện có, giữ optimistic concurrency và draft guard:

```ts
void updateProgramMetadata({ peer_review_policy: policy })
```

Không cho sửa policy trên published version.

- [x] **Step 5: Chạy verification Task 9**

Run:

```powershell
npm run lint -- src/components/kpi/program/KPIPeerReviewSettingsPanel.tsx src/components/kpi/program/KPIProgramSourcesStep.tsx src/app/kpi/settings/page.tsx
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: exit code 0.

---

### Task 10: Workspace `/kpi/review` theo vai trò

**Files:**
- Create: `src/components/kpi/monthly/KPIReviewTaskList.tsx`
- Create: `src/components/kpi/monthly/KPIPeerReviewForm.tsx`
- Create: `src/components/kpi/monthly/KPIReviewerSelectionPanel.tsx`
- Create: `src/components/kpi/monthly/KPIReviewProgressPanel.tsx`
- Create: `src/components/kpi/monthly/KPIManagerApprovalDrawer.tsx`
- Create: `src/components/kpi/monthly/KPIHrIntegrityQueue.tsx`
- Create: `src/components/kpi/monthly/KPIMonthlyRoleWorkspace.tsx`
- Modify: `src/components/kpi/workspace/KPIScoringWorkspace.tsx`
- Modify: `src/app/kpi/review/page.tsx`

- [x] **Step 1: Tạo role workspace boundary**

```ts
interface KPIMonthlyRoleWorkspaceProps {
  actor: KpiActor
  month: string
  reviewerTasks: KpiPeerReviewerTaskDto[]
  managerQueue: KpiPeerManagerQueueDto[]
  integrityFlags: KpiEvaluationIntegrityFlag[]
  onSubmitPeer(assignmentId: string, draft: PeerResponseDraftInput): Promise<void>
  onSelectReviewers(reviewId: string, reviewerIds: string[], reason?: string): Promise<void>
  onApprove(reviewId: string): Promise<void>
  onReturn(reviewId: string, reason: string): Promise<void>
}
```

Role render:

- employee/shift_leader reviewer → task list + peer form;
- shift_leader/store_manager primary evaluator → scoring workspace;
- store_manager → selection/progress/approval;
- hr_admin/ceo → chain progress + integrity queue;
- area_manager chỉ xem scope được cấp, không reveal identity mặc định.

- [x] **Step 2: Tạo peer form mobile-first**

UI requirements:

- 5 cards câu hỏi, mỗi card có 5 lựa chọn bằng câu chữ;
- score 1/2/5 mở fields evidence;
- progress `0/5` đến `5/5`;
- hai textarea cuối;
- checkbox xác nhận quan sát trực tiếp;
- sticky submit footer trên mobile;
- không emoji, chỉ lucide icons;
- min touch target 40px;
- không hiển thị reviewer identity sau submit.

- [x] **Step 3: Tạo manager selection panel**

Mỗi candidate row hiển thị:

```text
Tên · Chức danh
Làm chung 12 ca · Tổng 18 ca
[checkbox]
```

Features:

- chọn đúng 2;
- countdown 24h;
- top candidate badge;
- chọn ngoài danh sách mở reason input;
- thông báo hệ thống sẽ auto-select khi hết hạn.

- [x] **Step 4: Tạo progress và approval UI**

Progress chỉ hiển thị:

- `0/2`, `1/2`, `2/2`;
- sắp quá hạn;
- replacement active;
- thiếu mẫu ẩn danh.

Không render raw answers hoặc tên gắn với trạng thái submitted.

Approval drawer hiển thị score, source gaps, aggregate, integrity flags, summary và actions approve/return/request evidence/escalate.

- [x] **Step 5: Tạo HR integrity queue**

Queue hiển thị flag code bằng tiếng Việt, severity, evidence references và actions giữ/loại/yêu cầu lại/chuyển kỷ luật. Nút mở danh tính phải yêu cầu reason trước khi gọi repository.

- [x] **Step 6: Refactor page thành controller mỏng**

`src/app/kpi/review/page.tsx` chịu trách nhiệm:

- auth redirect;
- load DTO qua `peerReviewAdapter`;
- load existing evaluations/sources qua `kpiAdapter`;
- role scope;
- save queue và toast;
- render `KPIMonthlyRoleWorkspace`.

Không để ranking, response validation hoặc aggregation trong page.

- [x] **Step 7: Chạy verification Task 10**

Run:

```powershell
npm run lint -- src/app/kpi/review/page.tsx src/components/kpi/monthly src/components/kpi/workspace/KPIScoringWorkspace.tsx
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: exit code 0.

---

### Task 11: Kết quả, khiếu nại và promotion readiness

**Files:**
- Modify: `src/app/kpi/result/page.tsx`
- Modify: `src/lib/kpi/appeal-service.ts`
- Modify: `src/lib/kpi/appeal-service.test.ts`
- Modify: `src/lib/kpi/development-service.ts`
- Modify: `src/lib/kpi/development-service.test.ts`

- [x] **Step 1: Viết test đỏ cho appeal effect**

Thêm vào appeal/development tests:

```ts
assert.equal(isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: 'submitted' }), false)
assert.equal(isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: 'rejected' }), true)
assert.equal(isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: undefined }), true)
```

Appeal input vẫn bắt buộc reason và criterion/data reference.

- [x] **Step 2: Implement promotion hold helper**

```ts
export function isEvaluationUsableForPromotion(input: {
  evaluation_status: KpiEvaluation['status']
  appeal_status?: KpiAppeal['status']
}): boolean
```

`submitted` và `reviewing` trả false; quyết định cuối approved/partially approved phải dùng evaluation đã cập nhật lại trước khi readiness chạy.

- [x] **Step 3: Mở rộng result DTO/UI**

Hiển thị:

- total và grade;
- breakdown nhóm;
- peer aggregate score hoặc “Không đủ mẫu ẩn danh”;
- strength/improvement summary;
- next action/support needed;
- promotion streak actual/required;
- appeal state và countdown 48h.

Không hiển thị assignment IDs, reviewer IDs, submission timestamps hoặc raw peer answers.

- [x] **Step 4: Sửa wording và accessibility trong phạm vi page**

Chuyển các nhãn mojibake/không dấu đang chạm tới sang tiếng Việt chuẩn. Không quét hoặc sửa các trang nhân sự ngoài phạm vi.

- [x] **Step 5: Chạy verification Task 11**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/appeal-service.test.ts src/lib/kpi/development-service.test.ts
npm run lint -- src/app/kpi/result/page.tsx src/lib/kpi/appeal-service.ts src/lib/kpi/development-service.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

---

### Task 12: Full integration, tài liệu và nghiệm thu

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md`
- Modify: file plan này.

- [x] **Step 1: Viết integration test cho các flow chính**

Create nếu chưa có:

- `src/lib/kpi/monthly-review-integration.test.ts`

Scenarios:

1. manager select → two submit → primary submit → manager approve → publish;
2. manager timeout → auto-select;
3. reviewer timeout → replacement;
4. one response only → insufficient sample → fallback → publish;
5. integrity flag blocking → resolve → publish;
6. Shift Leader review by manager → clean direct publish;
7. published → appeal submitted → promotion hold → appeal decided.

- [x] **Step 2: Cập nhật CODEMAP**

Ghi rõ:

- `/kpi/review` là monthly role workspace;
- service assignment/response/aggregate/lifecycle/integrity/notification;
- secure peer repository và local demo repository;
- settings panel;
- result/appeal/readiness integration;
- link spec và plan.

- [x] **Step 3: Cập nhật KNOWN_ISSUES**

Ghi issue đã fix:

- manager phải tự tìm reviewer;
- peer anonymity chỉ nằm ở UI;
- không đủ sample có thể làm kẹt kỳ;
- stale/replaced reviewer vẫn có thể submit;
- appeal chưa chặn promotion readiness.

Ghi residual limitation nếu Supabase/RLS chưa được apply tại môi trường demo.

- [x] **Step 4: Chạy full KPI tests**

Run:

```powershell
node --experimental-strip-types --test src/lib/kpi/*.test.ts src/lib/adapters/peer-review-adapter.test.ts
```

Expected: tất cả PASS, 0 fail.

- [x] **Step 5: Chạy lint và TypeScript**

Run:

```powershell
npm run lint -- src/app/kpi/review/page.tsx src/app/kpi/result/page.tsx src/app/kpi/settings/page.tsx src/components/kpi/monthly src/components/kpi/program src/components/kpi/workspace src/lib/kpi src/lib/adapters/peer-review-adapter.ts
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: exit code 0.

- [x] **Step 6: Kiểm tra migration**

Run project Supabase migration validation nếu CLI đã cấu hình. Nếu chưa có local Supabase, chạy static checks:

```powershell
rg -n "CREATE TABLE|ENABLE ROW LEVEL SECURITY|CREATE POLICY|SECURITY DEFINER|kpi_audit_logs" supabase/migrations/20260823_kpi_monthly_peer_review.sql supabase/migrations/20260823_kpi_monthly_peer_review_rls.sql
```

Expected: đủ tables, RLS, policies, reveal RPC và audit insert.

- [x] **Step 7: Chạy production build và AI guard**

Run:

```powershell
npm run build
npm run ai:ready
```

Expected: build PASS. Nếu `ai:ready` fail do mojibake các trang nhân sự đã biết, báo riêng và không sửa ngoài phạm vi task.

- [x] **Step 8: Browser QA desktop và mobile**

Desktop:

- Manager thấy candidate reasons, chọn đúng 2, không thấy raw response.
- Auto-select/replacement states hiển thị đúng.
- Bulk approve chỉ áp dụng hồ sơ sạch.
- HR reveal bắt buộc reason.

Mobile 390x844:

- Peer form hoàn thành được bằng một luồng cuộn.
- Các lựa chọn score và CTA có touch target tối thiểu 40px.
- Sticky footer không che field cuối.
- Không lộ identity trong DOM hiển thị hoặc payload mà page dùng.

- [x] **Step 9: Đánh dấu plan hoàn thành**

Chỉ tick `[x]` Task 12 khi tests, lint, TypeScript và build đã có bằng chứng mới. Ghi browser limitation nếu policy môi trường chặn localhost.

## Next exact step sau plan

Thực hiện **Task 0: Khóa context và baseline**, sau đó **Task 1: Domain types và policy mặc định**. Không bắt đầu UI trước khi Task 1–8 có tests xanh.

## Audit remediation 2026-08-24

- [x] Pass A: Nạp đúng dữ liệu demo và giới hạn quyền chọn reviewer theo cửa hàng.
- [x] Pass B: Lưu thật thao tác Duyệt/Trả về và chặn công bố khi còn blocker.
- [x] Pass C: Tách trạng thái chờ chấm/chờ duyệt và bỏ bước tự duyệt lần hai cho Shift Leader.
- [x] Pass D: Nối runtime Supabase thật, chuẩn hóa schema Homies, bổ sung secure RPC/RLS/audit cho peer review.
- [x] Pass E: Rà soát kết quả, khiếu nại và số tháng đạt liên tiếp.
- [x] Pass F: Rà soát chống thông đồng, ẩn danh và cửa hàng ít người.
- [x] Pass G: Rà UX, hiệu năng, dependency và chạy cổng chất lượng cuối.

### Bằng chứng chốt audit Giai đoạn 2 - 2026-08-24

- KPI unit/integration/adapters: 170/170 test pass.
- ESLint các file Giai đoạn 2: pass; ESLint toàn repo còn 16 lỗi cũ ngoài phạm vi tại employees/login/payroll/scheduling.
- TypeScript `tsc --noEmit`: pass.
- Next.js production build: pass, 143/143 trang sinh thành công.
- `git diff --check` trên toàn bộ file Giai đoạn 2: pass.
- `npm ls --omit=dev --depth=0`: cây dependency chính hợp lệ; có `@emnapi/runtime` extraneous từ môi trường cài đặt.
- `npm audit` online chưa chạy được do môi trường từ chối quyền mạng; cần chạy lại khi registry khả dụng.
- `ai:ready` bị chặn bởi mojibake đã tồn tại ở module employees, không phát sinh từ Giai đoạn 2.
- Migration/RPC Supabase được kiểm tra bằng static contract tests nhưng chưa apply thử trên database Supabase thật trong phiên này.
