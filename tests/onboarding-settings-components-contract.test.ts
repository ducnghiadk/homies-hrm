import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const summarySource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsSummaryBar.tsx'),
  'utf8',
)
const urgentPanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx'),
  'utf8',
)
const roleCardSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingRoleCard.tsx'),
  'utf8',
)
const adminRailSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx'),
  'utf8',
)

test('summary bar exposes actionable business metrics', () => {
  assert.match(summarySource, /Role đang dùng/)
  assert.match(summarySource, /Role thiếu checklist/)
  assert.match(summarySource, /Chức danh bị gán trùng/)
  assert.match(summarySource, /Nhân viên chưa khớp role/)
})

test('urgent panel uses business-first issue copy', () => {
  assert.match(urgentPanelSource, /Cần xử lý ngay/)
  assert.match(urgentPanelSource, /Nhân viên chưa khớp role/)
  assert.match(urgentPanelSource, /Role đang bật nhưng chưa có checklist/)
  assert.match(urgentPanelSource, /Chức danh bị gán trùng/)
})

test('role card merges checklist and mapping actions into one unit', () => {
  assert.match(roleCardSource, /Đổi checklist/)
  assert.match(roleCardSource, /Mở chi tiết/)
  assert.match(roleCardSource, /Tìm chức danh/)
  assert.match(roleCardSource, /Chưa có checklist/)
})

test('admin rail exposes sticky control-room copy', () => {
  assert.match(adminRailSource, /id="admin-rail"/)
  assert.match(adminRailSource, /Bảng điều khiển/)
  assert.match(adminRailSource, /Trạng thái lưu/)
  assert.match(adminRailSource, /Đi tới nhanh/)
})
