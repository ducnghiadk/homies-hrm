import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const summarySource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx'),
  'utf8',
)
const headerSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowWorkspaceHeader.tsx'),
  'utf8',
)
const urgentPanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx'),
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
const adminRailSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx'),
  'utf8',
)

test('workspace header va component contract dung ngon ngu dang the', () => {
  assert.match(headerSource, /Thiết lập quy trình thử việc/)
  assert.match(summarySource, /Phần đã xong|Chỗ cần thiếu|Sẵn sàng dùng/)
  assert.doesNotMatch(adminRailSource, /Hôm nay cần làm gì\?/) 
})

test('urgent panel uses trial-workflow readiness copy', () => {
  assert.match(urgentPanelSource, /Quy trình chưa sẵn sàng đưa vào sử dụng/)
  assert.match(urgentPanelSource, /Chưa có giai đoạn nào|Có giai đoạn chưa có việc cần làm|Chưa chọn nhóm áp dụng/)
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
  assert.match(secondaryToolsSource, /Xem trước quy trình/)
  assert.match(secondaryToolsSource, /Lịch sử thay đổi/)
})
