import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const summarySource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx'),
  'utf8',
)
const headerSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowWorkspaceHeader.tsx'),
  'utf8',
)
const roleFilterSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingRoleFilters.tsx'),
  'utf8',
)
const roleCardSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingRoleCard.tsx'),
  'utf8',
)
const publishPanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx'),
  'utf8',
)
const secondaryToolsSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx'),
  'utf8',
)
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
const codemapSource = readFileSync(
  resolve(process.cwd(), 'docs/CODEMAP.md'),
  'utf8',
)

test('workspace header và component contract dùng ngôn ngữ dạng thẻ', () => {
  assert.match(headerSource, /Thiết lập quy trình thử việc/)
  assert.match(summarySource, /Phần đã xong|Chỗ còn thiếu|Sẵn sàng dùng/)
  assert.match(codemapSource, /Thiết lập quy trình thử việc dạng thẻ/)
  assert.match(codemapSource, /settings chỉ còn phần chung/i)
  assert.match(codemapSource, /5 cụm công cụ hỗ trợ/i)
})

test('khối dọc cũ đã được dọn khỏi màn thiết lập', () => {
  assert.equal(existsSync(resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx')), false)
  assert.equal(existsSync(resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx')), false)
  assert.equal(existsSync(resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowStagePlannerSection.tsx')), false)
  assert.equal(existsSync(resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowTaskAuthoringSection.tsx')), false)
  assert.equal(existsSync(resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowAssignmentPublishSection.tsx')), false)
  assert.equal(codemapSource.includes('OnboardingSettingsUrgentPanel.tsx'), false)
  assert.equal(codemapSource.includes('OnboardingSettingsAdminRail.tsx'), false)
})

test('role filter and role card use trial-workflow business language', () => {
  assert.match(roleFilterSource, /Tìm nhóm áp dụng hoặc chức danh/)
  assert.match(roleCardSource, /Nhóm áp dụng/)
  assert.match(roleCardSource, /Danh sách việc cần làm đang dùng/)
})

test('publish and support tools use go-live terminology', () => {
  assert.match(publishPanelSource, /Kiểm tra trước khi dùng/)
  assert.match(publishPanelSource, /Đưa vào sử dụng/)
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
