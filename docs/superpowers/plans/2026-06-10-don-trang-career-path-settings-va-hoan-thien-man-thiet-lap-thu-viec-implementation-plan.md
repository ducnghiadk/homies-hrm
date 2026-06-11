# Dọn trang Cài đặt Career Path và hoàn thiện màn Thiết lập thử việc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa `/career-path/settings` về đúng vai trò cài đặt lộ trình nghề nghiệp chung, hoàn thiện lớp công cụ phụ trong `/career-path/onboarding/setup`, và khóa lại nhãn, neo, điều hướng của cụm thử việc bằng test hợp đồng.

**Architecture:** Giữ nguyên ba route thử việc đã chốt, dọn shell `settings` để chỉ còn các tab dùng cho lộ trình nghề nghiệp chung cộng một lối tắt sang màn riêng, rồi tái dùng các section đang có cho `thư viện mẫu`, `biên tập nội dung`, `xem trước trải nghiệm`, `báo cáo mức sẵn sàng`, `lịch sử thay đổi` như lớp công cụ phụ nằm dưới lớp tab chính. Kiểm tra bằng source-contract tests đọc trực tiếp mã nguồn để khóa tab, neo, tiêu đề, và đường dẫn.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Node test runner (`node --test`), source-contract tests, `docs/CODEMAP.md`.

---

## File Structure

- `src/app/career-path/settings/page.tsx`
  - Dọn tab thử việc cũ, bỏ dữ liệu thử việc không còn thuộc màn này, đổi copy sang tiếng Việt, và giữ một lối tắt rõ ràng sang `/career-path/onboarding/setup`.
- `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx`
  - Giữ lớp tab chính như hiện tại, sau đó gắn lớp công cụ phụ thật ở bên dưới bằng các section đã có sẵn.
- `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx`
  - Định nghĩa đúng 5 mục công cụ phụ với nhãn tiếng Việt và neo thật thay vì trỏ tạm về `#trial-workflow-active-tab`.
- `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`
  - Tiếp tục dùng làm section `Thư viện mẫu quy trình`; giữ `id="templates"` làm neo cho lớp công cụ phụ.
- `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
  - Đổi copy từ `Trình sửa template` sang `Biên tập nội dung` để khớp ngôn ngữ màn setup.
- `src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx`
  - Đổi copy từ `Xem trước quy trình` sang `Xem trước trải nghiệm`.
- `src/components/onboarding-settings/OnboardingReportsSection.tsx`
  - Đổi tiêu đề section sang `Báo cáo mức sẵn sàng`.
- `src/components/onboarding-settings/OnboardingAuditLogSection.tsx`
  - Đổi tiêu đề section từ `Audit log` sang `Lịch sử thay đổi`.
- `tests/onboarding-settings-ia.test.ts`
  - Khóa việc `settings` chỉ còn tab chung và lối tắt sang route setup.
- `tests/onboarding-content-library-settings-contract.test.ts`
  - Tái dùng file này để khóa việc `settings` không còn nội dung thử việc cũ và không còn `Checklist thử việc` trong tab `Buddy`.
- `tests/onboarding-settings-full-suite-contract.test.ts`
  - Chuyển trọng tâm từ `settings` sang `setup`, khóa đủ 5 neo của lớp công cụ phụ.
- `tests/onboarding-settings-components-contract.test.ts`
  - Khóa nhãn của lớp công cụ phụ, neo thật, và việc loại bỏ các tiêu đề cũ.
- `docs/CODEMAP.md`
  - Cập nhật mô tả mới cho `settings` và `setup` để phản ánh mô hình hai lớp.

### Task 1: Dọn `/career-path/settings` về phần cài đặt chung

**Files:**
- Modify: `src/app/career-path/settings/page.tsx:5-291`
- Test: `tests/onboarding-settings-ia.test.ts:1-27`
- Test: `tests/onboarding-content-library-settings-contract.test.ts:1-13`

- [ ] **Step 1: Viết test đỏ cho trang settings chỉ còn phần chung**

```ts
// tests/onboarding-settings-ia.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'),
  'utf8',
)

test('settings page dùng lối tắt sang setup thay cho tab thử việc', () => {
  assert.match(settingsPageSource, /Thiết lập quy trình thử việc/)
  assert.match(settingsPageSource, /\/career-path\/onboarding\/setup/)
  assert.doesNotMatch(settingsPageSource, /\{ id: 'onboarding'/)
  assert.doesNotMatch(settingsPageSource, /\{ id: 'roles'/)
  assert.doesNotMatch(settingsPageSource, /activeTab === 'onboarding'/)
  assert.doesNotMatch(settingsPageSource, /activeTab === 'roles'/)
})
```

```ts
// tests/onboarding-content-library-settings-contract.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'),
  'utf8',
)

test('settings page chỉ giữ tab chung và bỏ dữ liệu thử việc cũ', () => {
  assert.match(settingsPageSource, /type TabId = 'levels' \| 'skills' \| 'conditions' \| 'buddy' \| 'general'/)
  assert.match(settingsPageSource, /\/career-path\/onboarding\/setup/)
  assert.doesNotMatch(settingsPageSource, /Checklist thử việc/)
  assert.doesNotMatch(settingsPageSource, /Bước onboarding/)
  assert.doesNotMatch(settingsPageSource, /getOnboardingSteps/)
  assert.doesNotMatch(settingsPageSource, /getTrialChecklist/)
})
```

- [ ] **Step 2: Chạy test để xác nhận đang đỏ**

Run: `node --test tests/onboarding-settings-ia.test.ts tests/onboarding-content-library-settings-contract.test.ts`

Expected: FAIL vì `src/app/career-path/settings/page.tsx` vẫn còn `type TabId = 'levels' | 'skills' | 'conditions' | 'buddy' | 'onboarding' | 'roles' | 'general'`, vẫn render `activeTab === 'onboarding'`, `activeTab === 'roles'`, và vẫn có `Checklist thử việc` trong `BuddyTab`.

- [ ] **Step 3: Viết phần triển khai tối thiểu cho settings page**

```tsx
// src/app/career-path/settings/page.tsx
type TabId = 'levels' | 'skills' | 'conditions' | 'buddy' | 'general'

const tabs: { id: TabId; label: string }[] = [
  { id: 'levels', label: 'Cấp bậc' },
  { id: 'skills', label: 'Kỹ năng' },
  { id: 'conditions', label: 'Điều kiện' },
  { id: 'buddy', label: 'Người đồng hành' },
  { id: 'general', label: 'Chung' },
]

export default function CareerPathSettingsPage() {
  initCareerPathStores()
  const [activeTab, setActiveTab] = useState<TabId>('levels')
  const [levels, setLevels] = useState<CareerLevel[]>(() => getLevels())
  const [skills, setSkills] = useState<Skill[]>(() => getSkills())
  const [conditions, setConditions] = useState<PromotionCondition[]>(() => getPromotionConditions())
  const [rewards, setRewards] = useState<BuddyRewardConfig[]>(() => getBuddyRewards())
  const [logs, setLogs] = useState<SettingsChangeLog[]>(() => getChangeLogs())
  const [showLogs, setShowLogs] = useState(false)

  const reload = () => {
    setLevels(getLevels())
    setSkills(getSkills())
    setConditions(getPromotionConditions())
    setRewards(getBuddyRewards())
    setLogs(getChangeLogs())
  }

  return (
    <div style={{ padding: '20px 24px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/settings" style={{ fontSize: 20, textDecoration: 'none', color: '#344054' }}>
          ←
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Cài đặt lộ trình nghề nghiệp</h1>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowLogs((current) => !current)} style={secondaryButtonStyle}>
          Lịch sử
        </button>
      </div>

      <TrialWorkflowShortcutCard />

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabButtonStyle(activeTab === tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'levels' ? <LevelsTab levels={levels} /> : null}
      {activeTab === 'skills' ? <SkillsTab skills={skills} /> : null}
      {activeTab === 'conditions' ? <ConditionsTab conditions={conditions} /> : null}
      {activeTab === 'buddy' ? <BuddyTab rewards={rewards} /> : null}
      {activeTab === 'general' ? <GeneralTab onExport={handleExport} onImport={handleImport} /> : null}
    </div>
  )
}

function TrialWorkflowShortcutCard() {
  return (
    <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, border: '1px solid rgba(47, 111, 168, 0.18)', background: '#FFF8E8' }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A6B53' }}>
        Thử việc
      </div>
      <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#111827' }}>Thiết lập quy trình thử việc</div>
      <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: '#667085' }}>
        Mọi cấu hình thử việc đã tách sang màn riêng để HR làm việc không bị lẫn với cài đặt lộ trình nghề nghiệp chung.
      </div>
      <Link href="/career-path/onboarding/setup" style={{ display: 'inline-flex', marginTop: 12, padding: '10px 14px', borderRadius: 999, background: '#2F6FA8', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
        Đi tới thiết lập quy trình thử việc
      </Link>
    </div>
  )
}

function BuddyTab({ rewards }: { rewards: BuddyRewardConfig[] }) {
  return (
    <Panel title="Người đồng hành" subtitle="Xem nhanh phần thưởng và trạng thái đang dùng cho người đồng hành.">
      <div style={{ display: 'grid', gap: 8 }}>
        {rewards.map((reward) => (
          <CardRow key={reward.id} title={reward.name} meta={reward.description} badge={reward.is_active ? 'Bật' : 'Tắt'} />
        ))}
      </div>
    </Panel>
  )
}
```

- [ ] **Step 4: Chạy lại test của settings page**

Run: `node --test tests/onboarding-settings-ia.test.ts tests/onboarding-content-library-settings-contract.test.ts`

Expected: PASS, và source không còn `getOnboardingSteps`, `getTrialChecklist`, `activeTab === 'onboarding'`, `activeTab === 'roles'`.

- [ ] **Step 5: Commit**

```bash
git add tests/onboarding-settings-ia.test.ts tests/onboarding-content-library-settings-contract.test.ts src/app/career-path/settings/page.tsx
git commit -m "refactor: don settings career path ve phan chung"
```

### Task 2: Gắn lớp công cụ phụ thật vào `/career-path/onboarding/setup`

**Files:**
- Modify: `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx:3-349`
- Modify: `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx:1-59`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx:1-215`
- Modify: `src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx:1-88`
- Modify: `src/components/onboarding-settings/OnboardingReportsSection.tsx:1-81`
- Modify: `src/components/onboarding-settings/OnboardingAuditLogSection.tsx:1-49`
- Test: `tests/onboarding-settings-full-suite-contract.test.ts:1-12`
- Test: `tests/onboarding-settings-components-contract.test.ts:1-64`

- [ ] **Step 1: Viết test đỏ cho lớp công cụ phụ 5 mục và 5 neo thật**

```ts
// tests/onboarding-settings-full-suite-contract.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const workspaceSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx'),
  'utf8',
)
const secondaryToolsSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx'),
  'utf8',
)

test('setup page có đủ lớp công cụ phụ và neo thật cho từng cụm', () => {
  assert.match(secondaryToolsSource, /Thư viện mẫu quy trình/)
  assert.match(secondaryToolsSource, /Biên tập nội dung/)
  assert.match(secondaryToolsSource, /Xem trước trải nghiệm/)
  assert.match(secondaryToolsSource, /Báo cáo mức sẵn sàng/)
  assert.match(secondaryToolsSource, /Lịch sử thay đổi/)
  assert.match(secondaryToolsSource, /#templates/)
  assert.match(secondaryToolsSource, /#template-editor/)
  assert.match(secondaryToolsSource, /#preview/)
  assert.match(secondaryToolsSource, /#reports/)
  assert.match(secondaryToolsSource, /#audit-log/)
  assert.match(librarySource, /id="templates"/i)
  assert.match(workspaceSource, /id="template-editor"/i)
  assert.match(workspaceSource, /id="preview"/i)
  assert.match(workspaceSource, /id="reports"/i)
  assert.match(workspaceSource, /id="audit-log"/i)
})
```

```ts
// tests/onboarding-settings-components-contract.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const editorSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx'),
  'utf8',
)
const previewSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx'),
  'utf8',
)
const reportsSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingReportsSection.tsx'),
  'utf8',
)
const auditSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingAuditLogSection.tsx'),
  'utf8',
)
const secondaryToolsSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx'),
  'utf8',
)

test('lớp công cụ phụ dùng nhãn tiếng Việt thống nhất', () => {
  assert.match(secondaryToolsSource, /Công cụ hỗ trợ/)
  assert.match(secondaryToolsSource, /Thư viện mẫu quy trình/)
  assert.match(secondaryToolsSource, /Biên tập nội dung/)
  assert.match(secondaryToolsSource, /Xem trước trải nghiệm/)
  assert.match(secondaryToolsSource, /Báo cáo mức sẵn sàng/)
  assert.match(secondaryToolsSource, /Lịch sử thay đổi/)
  assert.doesNotMatch(secondaryToolsSource, /#trial-workflow-active-tab/)
})

test('các section phụ bỏ tiêu đề cũ và dùng tiêu đề mới', () => {
  assert.doesNotMatch(editorSource, /Trình sửa template/)
  assert.match(editorSource, /Biên tập nội dung/)
  assert.doesNotMatch(previewSource, /Xem trước quy trình/)
  assert.match(previewSource, /Xem trước trải nghiệm/)
  assert.match(reportsSource, /Báo cáo mức sẵn sàng/)
  assert.doesNotMatch(auditSource, /Audit log/)
  assert.match(auditSource, /Lịch sử thay đổi/)
})
```

- [ ] **Step 2: Chạy test để xác nhận đang đỏ**

Run: `node --test tests/onboarding-settings-full-suite-contract.test.ts tests/onboarding-settings-components-contract.test.ts`

Expected: FAIL vì `OnboardingSettingsSecondaryTools.tsx` mới có 3 mục, vẫn trỏ về `#trial-workflow-active-tab`, và các section vẫn còn tiêu đề cũ như `Trình sửa template`, `Xem trước quy trình`, `Audit log`.

- [ ] **Step 3: Viết phần triển khai tối thiểu cho lớp công cụ phụ**

```tsx
// src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx
import { OnboardingAuditLogSection } from '@/components/onboarding-settings/OnboardingAuditLogSection'
import { OnboardingReportsSection } from '@/components/onboarding-settings/OnboardingReportsSection'
import { OnboardingSettingsSecondaryTools } from '@/components/onboarding-settings/OnboardingSettingsSecondaryTools'
import { OnboardingTemplateEditorSection } from '@/components/onboarding-settings/OnboardingTemplateEditorSection'
import { OnboardingTemplateLibrarySection } from '@/components/onboarding-settings/OnboardingTemplateLibrarySection'
import { OnboardingTemplatePreviewSection } from '@/components/onboarding-settings/OnboardingTemplatePreviewSection'

const secondaryToolItems = [
  {
    label: 'Thư viện mẫu quy trình',
    description: 'Chọn đúng mẫu HR đang rà soát trước khi sửa sâu hơn.',
    href: '#templates',
  },
  {
    label: 'Biên tập nội dung',
    description: 'Sửa tên mẫu, chặng, chủ đề và việc cần làm của bản đang mở.',
    href: '#template-editor',
  },
  {
    label: 'Xem trước trải nghiệm',
    description: 'Xem nhanh hành trình nhân sự mới trước khi đưa vào dùng.',
    href: '#preview',
  },
  {
    label: 'Báo cáo mức sẵn sàng',
    description: 'Rà các chỗ còn thiếu và chỗ lệch nhóm áp dụng.',
    href: '#reports',
  },
  {
    label: 'Lịch sử thay đổi',
    description: 'Rà các lần cập nhật trước khi chốt bản dùng mới.',
    href: '#audit-log',
  },
] as const

// đặt ngay sau <TrialWorkflowWorkspacePanel ...>
<OnboardingSettingsSecondaryTools items={[...secondaryToolItems]} />

<section id="templates">
  <OnboardingTemplateLibrarySection
    templates={activeTemplates}
    topicCountByTemplate={topicCountByTemplate}
    selectedTemplateId={selectedTemplate?.id ?? null}
    onSelectTemplate={setSelectedTemplateId}
  />
</section>

<section id="template-editor">
  <OnboardingTemplateEditorSection
    selectedTemplateId={selectedTemplate?.id ?? null}
    onSelectTemplate={setSelectedTemplateId}
    onTemplateMutated={refreshTemplates}
  />
</section>

<section id="preview">
  <OnboardingTemplatePreviewSection template={selectedTemplate} />
</section>

<section id="reports">
  <OnboardingReportsSection />
</section>

<section id="audit-log">
  <OnboardingAuditLogSection />
</section>
```

```tsx
// src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx
export const DEFAULT_SECONDARY_TOOL_ITEMS = [
  {
    label: 'Thư viện mẫu quy trình',
    description: 'Mở nhanh mẫu HR đang rà soát trước khi chỉnh sửa.',
    href: '#templates',
  },
  {
    label: 'Biên tập nội dung',
    description: 'Đi tới khu sửa tên mẫu, chặng, chủ đề và việc cần làm.',
    href: '#template-editor',
  },
  {
    label: 'Xem trước trải nghiệm',
    description: 'Kiểm tra nhanh hành trình nhân sự mới trước khi áp dụng.',
    href: '#preview',
  },
  {
    label: 'Báo cáo mức sẵn sàng',
    description: 'Rà các chỗ còn thiếu, lệch nhóm áp dụng, và bản nháp chưa chốt.',
    href: '#reports',
  },
  {
    label: 'Lịch sử thay đổi',
    description: 'Xem các lần cập nhật gần nhất trước khi chốt bản dùng.',
    href: '#audit-log',
  },
] as const
```

```tsx
// src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx
<div style={titleStyle}>Biên tập nội dung</div>

// src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx
<div style={titleStyle}>Xem trước trải nghiệm</div>

// src/components/onboarding-settings/OnboardingReportsSection.tsx
<div style={titleStyle}>Báo cáo mức sẵn sàng</div>

// src/components/onboarding-settings/OnboardingAuditLogSection.tsx
<div style={titleStyle}>Lịch sử thay đổi</div>
```

- [ ] **Step 4: Chạy lại test của màn setup**

Run: `node --test tests/onboarding-settings-full-suite-contract.test.ts tests/onboarding-settings-components-contract.test.ts tests/trial-workflow-tab-layout-contract.test.ts`

Expected: PASS, và source của `TrialWorkflowSetupWorkspace.tsx` có đủ `id="templates"`, `id="template-editor"`, `id="preview"`, `id="reports"`, `id="audit-log"`.

- [ ] **Step 5: Commit**

```bash
git add tests/onboarding-settings-full-suite-contract.test.ts tests/onboarding-settings-components-contract.test.ts src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx src/components/onboarding-settings/OnboardingReportsSection.tsx src/components/onboarding-settings/OnboardingAuditLogSection.tsx
git commit -m "feat: them lop cong cu phu cho setup thu viec"
```

### Task 3: Đồng bộ `CODEMAP` và chạy lượt kiểm tra cuối cho cụm thử việc

**Files:**
- Modify: `docs/CODEMAP.md:98-118`
- Modify: `tests/onboarding-settings-components-contract.test.ts:1-64`
- Test: `tests/onboarding-navigation-ia.test.ts:1-38`
- Test: `tests/onboarding-overview-contract.test.ts:1-19`
- Test: `tests/trial-workflow-navigation-contract.test.ts:1-17`

- [ ] **Step 1: Bổ sung test đỏ cho mô tả mới trong CODEMAP**

```ts
// thêm vào tests/onboarding-settings-components-contract.test.ts
const codemapSource = readFileSync(
  resolve(process.cwd(), 'docs/CODEMAP.md'),
  'utf8',
)

test('codemap mô tả đúng settings chung và lớp công cụ phụ của màn setup', () => {
  assert.match(codemapSource, /settings chỉ còn phần chung/i)
  assert.match(codemapSource, /5 cụm công cụ hỗ trợ/i)
  assert.match(codemapSource, /Thiết lập quy trình thử việc dạng thẻ/i)
})
```

- [ ] **Step 2: Chạy test để xác nhận đang đỏ**

Run: `node --test tests/onboarding-settings-components-contract.test.ts`

Expected: FAIL vì `docs/CODEMAP.md` chưa nói rõ `settings chỉ còn phần chung` và chưa nhắc `5 cụm công cụ hỗ trợ` của màn setup.

- [ ] **Step 3: Cập nhật `docs/CODEMAP.md` theo mô hình mới**

```md
### Noi quy nhan viec va onboarding
- Mo ta: flow gui noi quy 2 nhip, setting toi thieu, xac nhan cua nhan vien, nhac day-1, man thiet lap quy trinh thu viec, va man theo doi thu viec theo tung nhan vien.
- File chinh: `src/lib/services/onboarding-policy-service.ts`, `src/lib/services/onboarding-operations-service.ts`, `src/lib/services/onboarding-content-runtime-service.ts`, `src/app/career-path/settings/page.tsx`, `src/app/career-path/onboarding/overview/page.tsx`, `src/app/career-path/onboarding/setup/page.tsx`, `src/app/career-path/onboarding/page.tsx`, `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx`, `src/components/onboarding-operations/*`
- Cài đặt lộ trình nghề nghiệp chung:
  - Mo ta: `settings` chỉ còn phần chung cho cap bac, ky nang, dieu kien, nguoi dong hanh, va mot loi tat sang man thiet lap thu viec.
  - File chinh: `src/app/career-path/settings/page.tsx`
- Thiết lập quy trình thử việc dạng thẻ:
  - Mo ta: man `/career-path/onboarding/setup` dung 5 tab chinh o tren va 5 cụm công cụ hỗ trợ o duoi gom `Thu vien mau quy trinh`, `Bien tap noi dung`, `Xem truoc trai nghiem`, `Bao cao muc san sang`, `Lich su thay doi`.
  - File chinh: `src/app/career-path/onboarding/setup/page.tsx`, `src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx`, `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx`, `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`, `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`, `src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx`, `src/components/onboarding-settings/OnboardingReportsSection.tsx`, `src/components/onboarding-settings/OnboardingAuditLogSection.tsx`
```

- [ ] **Step 4: Chạy lượt kiểm tra cuối cho cụm thử việc**

Run: `node --test tests/onboarding-settings-ia.test.ts tests/onboarding-content-library-settings-contract.test.ts tests/onboarding-settings-full-suite-contract.test.ts tests/onboarding-settings-components-contract.test.ts tests/trial-workflow-tab-layout-contract.test.ts tests/trial-workflow-navigation-contract.test.ts tests/onboarding-navigation-ia.test.ts tests/onboarding-overview-contract.test.ts`
Expected: PASS toàn bộ.

Run: `npm run lint -- src/app/career-path/settings/page.tsx src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx src/components/onboarding-settings/OnboardingTemplatePreviewSection.tsx src/components/onboarding-settings/OnboardingReportsSection.tsx src/components/onboarding-settings/OnboardingAuditLogSection.tsx tests/onboarding-settings-ia.test.ts tests/onboarding-content-library-settings-contract.test.ts tests/onboarding-settings-full-suite-contract.test.ts tests/onboarding-settings-components-contract.test.ts`
Expected: `0 problems`.

- [ ] **Step 5: Commit**

```bash
git add docs/CODEMAP.md tests/onboarding-settings-components-contract.test.ts
git commit -m "docs: dong bo codemap va hop dong thu viec"
```
