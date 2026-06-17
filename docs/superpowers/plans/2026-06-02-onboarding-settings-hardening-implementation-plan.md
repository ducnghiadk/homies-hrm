# Onboarding Settings Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chặn cấu hình onboarding sai, chặn import dữ liệu lỗi, đồng bộ seed template ID, và chuẩn hóa tiếng Việt có dấu cho màn cấu hình onboarding.

**Architecture:** Tăng guard ở cả ba lớp: UI chọn template, service validation/save/import, và seed dữ liệu mặc định. Dùng TDD cho từng nhóm thay đổi để khóa hành vi trước khi sửa code.

**Tech Stack:** TypeScript, React, Next.js, node:test chạy qua `tsx`

---

## File Structure

- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/career-path-types.ts`
  - Mở rộng mã lỗi validation onboarding role settings.
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/career-path-service.ts`
  - Thêm validation template tồn tại/đúng role, siết import, giữ normalize hiện có.
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/mock-data-career-path.ts`
  - Đồng bộ `sampleEmployeeOnboardingChecklistPlans` sang template ID hiện hành.
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/components/onboarding-settings/OnboardingRoleCard.tsx`
  - Lọc dropdown template theo role và hiện cảnh báo dữ liệu legacy nếu sai.
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/app/career-path/settings/page.tsx`
  - Chuẩn hóa tiếng Việt có dấu cho phần onboarding settings.
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/tests/onboarding-role-settings.test.ts`
  - Bổ sung test validator và import.

### Task 1: Khóa validation service bằng test

**Files:**
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/tests/onboarding-role-settings.test.ts`
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/career-path-types.ts`
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/career-path-service.ts`

- [ ] **Step 1: Viết test đỏ cho template không tồn tại và template sai role**

```ts
import {
  initCareerPathStores,
  validateOnboardingRoleSettings,
} from '../src/lib/career-path-service'

test('validator rejects missing onboarding template', () => {
  initCareerPathStores()
  const issues = validateOnboardingRoleSettings(cloneRoleSettings({
    roles: [{
      role_code: 'counter_staff',
      label: 'Thu ngân',
      enabled: true,
      template_id: 'missing-template',
      position_ids: ['pos-002'],
      sort_order: 1,
    }],
  }))

  assert.equal(issues.some((issue) => issue.code === 'template_not_found'), true)
})

test('validator rejects template assigned to different onboarding role', () => {
  initCareerPathStores()
  const issues = validateOnboardingRoleSettings(cloneRoleSettings({
    roles: [{
      role_code: 'counter_staff',
      label: 'Thu ngân',
      enabled: true,
      template_id: 'onb-template-barista-published-v1',
      position_ids: ['pos-002'],
      sort_order: 1,
    }],
  }))

  assert.equal(issues.some((issue) => issue.code === 'template_role_mismatch'), true)
})
```

- [ ] **Step 2: Chạy test để xác nhận fail đúng chỗ**

Run: `npx --yes tsx --test tests/onboarding-role-settings.test.ts`
Expected: FAIL vì chưa có `template_not_found` và `template_role_mismatch`.

- [ ] **Step 3: Viết implementation tối thiểu cho validator**

```ts
if (role.enabled && role.template_id) {
  const template = getOnboardingChecklistTemplateById(role.template_id)

  if (!template) {
    issues.push({
      code: 'template_not_found',
      role_code: role.role_code,
      message: 'Checklist đã chọn không còn tồn tại hoặc không còn khả dụng.',
    })
    return
  }

  if (template.role_code !== role.role_code) {
    issues.push({
      code: 'template_role_mismatch',
      role_code: role.role_code,
      message: 'Checklist đã chọn không thuộc đúng nhóm role onboarding này.',
    })
  }
}
```

- [ ] **Step 4: Chạy lại test để xác nhận xanh**

Run: `npx --yes tsx --test tests/onboarding-role-settings.test.ts`
Expected: PASS cho hai test mới và không làm hỏng test cũ.

### Task 2: Khóa import sai bằng test

**Files:**
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/tests/onboarding-role-settings.test.ts`
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/career-path-service.ts`

- [ ] **Step 1: Viết test đỏ cho import onboarding settings sai**

```ts
import {
  getOnboardingRoleSettings,
  importSettings,
} from '../src/lib/career-path-service'

test('import rejects onboarding settings when template role mismatches', () => {
  initCareerPathStores()
  const before = getOnboardingRoleSettings()
  const success = importSettings(JSON.stringify({
    settings: {
      onboarding_role_settings: {
        ...before,
        roles: [{
          role_code: 'counter_staff',
          label: 'Thu ngân',
          enabled: true,
          template_id: 'onb-template-barista-published-v1',
          position_ids: ['pos-002'],
          sort_order: 1,
        }],
      },
    },
  }))

  assert.equal(success, false)
  assert.equal(getOnboardingRoleSettings().roles[0].template_id, before.roles[0].template_id)
})
```

- [ ] **Step 2: Chạy test để xác nhận fail đúng chỗ**

Run: `npx --yes tsx --test tests/onboarding-role-settings.test.ts`
Expected: FAIL vì `importSettings()` hiện đang save thẳng.

- [ ] **Step 3: Viết implementation tối thiểu cho import guard**

```ts
if (data.settings) {
  const normalizedSettings = normalizeSettings(data.settings)
  const issues = validateOnboardingRoleSettings(normalizedSettings.onboarding_role_settings)
  if (issues.length > 0) {
    return false
  }
  _settings = normalizedSettings
  save(KEYS.settings, _settings)
}
```

- [ ] **Step 4: Chạy lại test để xác nhận xanh**

Run: `npx --yes tsx --test tests/onboarding-role-settings.test.ts`
Expected: PASS, import sai bị reject.

### Task 3: Lọc UI template và cảnh báo dữ liệu legacy

**Files:**
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/components/onboarding-settings/OnboardingRoleCard.tsx`

- [ ] **Step 1: Giới hạn template options theo `role_code`**

```ts
const roleTemplates = templates.filter((template) => template.role_code === role.role_code)
const hasInvalidSelectedTemplate = Boolean(selectedTemplate && selectedTemplate.role_code !== role.role_code)
```

- [ ] **Step 2: Dùng `roleTemplates` cho dropdown**

```tsx
{roleTemplates.map((template) => (
  <option key={template.id} value={template.id}>
    {template.role_label} • v{template.version} • {template.id}
  </option>
))}
```

- [ ] **Step 3: Hiện cảnh báo nếu dữ liệu cũ đang giữ template sai role**

```tsx
{hasInvalidSelectedTemplate ? (
  <div style={{ fontSize: 11, color: '#b42318', lineHeight: 1.5 }}>
    Checklist hiện tại không thuộc đúng nhóm role này. Vui lòng chọn lại checklist phù hợp.
  </div>
) : null}
```

- [ ] **Step 4: Chạy type/lint để xác nhận không vỡ JSX**

Run: `npm run lint`
Expected: PASS hoặc chỉ còn lỗi không liên quan ngoài phạm vi file này.

### Task 4: Chuẩn hóa tiếng Việt có dấu cho onboarding settings

**Files:**
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Đổi toàn bộ chuỗi lỗi mã hóa ở tab onboarding settings**

```ts
setSaveState({ tone: 'error', message: 'Dữ liệu đã thay đổi ở nguồn khác. Tải lại trước khi tiếp tục.' })
setSaveState({ tone: 'error', message: 'Thông tin nhóm onboarding còn lỗi. Kiểm tra lại trước khi lưu.' })
setSaveState({ tone: 'error', message: 'Hệ thống từ chối lưu vì dữ liệu chưa hợp lệ.' })
setSaveState({ tone: 'success', message: 'Đã lưu thay đổi cấu hình onboarding.' })
```

- [ ] **Step 2: Đổi summary, urgent rows, title, subtitle sang tiếng Việt có dấu**

```ts
{ label: 'Role đang dùng', ... }
{ label: 'Role thiếu checklist', ... }
{ label: 'Chức danh bị gán trùng', ... }
{ label: 'Nhân viên chưa khớp role', ... }
```

- [ ] **Step 3: Đổi các đoạn mô tả tiếng Anh/ASCII ở panel chính**

```tsx
<Panel
  title="Thư viện nội dung onboarding"
  subtitle="Thư viện nội dung cho onboarding. Template đang phát hành sẽ được vận hành sử dụng, còn nhân viên đang onboard giữ nguyên snapshot cũ."
>
```

- [ ] **Step 4: Chạy lint để xác nhận file vẫn hợp lệ**

Run: `npm run lint`
Expected: PASS hoặc chỉ còn lỗi không liên quan ngoài phạm vi file này.

### Task 5: Đồng bộ seed onboarding plan và khóa hồi quy

**Files:**
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/mock-data-career-path.ts`
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/tests/onboarding-role-settings.test.ts`

- [ ] **Step 1: Viết test đỏ cho seed template ID hiện hành**

```ts
import { sampleEmployeeOnboardingChecklistPlans } from '../src/lib/mock-data-career-path'

test('seed onboarding plans use current published template ids', () => {
  const templateIds = sampleEmployeeOnboardingChecklistPlans.map((plan) => plan.template_id)
  assert.equal(templateIds.includes('onb-template-counter-v1'), false)
  assert.equal(templateIds.includes('onb-template-barista-v1'), false)
})
```

- [ ] **Step 2: Chạy test để xác nhận fail đúng chỗ**

Run: `npx --yes tsx --test tests/onboarding-role-settings.test.ts`
Expected: FAIL vì seed còn dùng template ID legacy.

- [ ] **Step 3: Đổi seed sang template ID hiện hành**

```ts
template_id: 'onb-template-counter-published-v1'
template_id: 'onb-template-barista-published-v1'
```

- [ ] **Step 4: Chạy test để xác nhận xanh**

Run: `npx --yes tsx --test tests/onboarding-role-settings.test.ts`
Expected: PASS toàn bộ test file.

### Task 6: Xác minh cuối

**Files:**
- Modify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/tests/onboarding-role-settings.test.ts`
- Verify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/app/career-path/settings/page.tsx`
- Verify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/components/onboarding-settings/OnboardingRoleCard.tsx`
- Verify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/career-path-service.ts`
- Verify: `C:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/mock-data-career-path.ts`

- [ ] **Step 1: Chạy test onboarding role settings**

Run: `npx --yes tsx --test tests/onboarding-role-settings.test.ts`
Expected: PASS.

- [ ] **Step 2: Chạy lint toàn repo**

Run: `npm run lint`
Expected: PASS; nếu fail, phân loại lỗi thuộc phạm vi hay lỗi có sẵn.

- [ ] **Step 3: Kiểm tra diff cuối**

Run: `git diff -- tests/onboarding-role-settings.test.ts src/lib/career-path-types.ts src/lib/career-path-service.ts src/lib/mock-data-career-path.ts src/components/onboarding-settings/OnboardingRoleCard.tsx src/app/career-path/settings/page.tsx`
Expected: chỉ chứa thay đổi đúng phạm vi onboarding settings hardening.
