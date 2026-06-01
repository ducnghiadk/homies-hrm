import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'),
  'utf8',
)

test('settings page uses onboarding task-first header copy', () => {
  assert.match(settingsPageSource, /Cấu hình onboarding cho nhân sự mới/)
  assert.match(
    settingsPageSource,
    /Thiết lập nhóm onboarding, checklist áp dụng và xử lý lỗi cấu hình trước ngày vào làm\./,
  )
  assert.doesNotMatch(
    settingsPageSource,
    /Quản lý role onboarding, template checklist, và các ngoại lệ cần xử lý trước ngày vào làm\./,
  )
})

test('settings page exposes task-first sections', () => {
  assert.match(settingsPageSource, /id="summary"/)
  assert.match(settingsPageSource, /id="urgent-issues"/)
  assert.match(settingsPageSource, /id="role-filters"/)
  assert.match(settingsPageSource, /id="roles"/)
  assert.match(settingsPageSource, /OnboardingSettingsAdminRail/)
  assert.match(settingsPageSource, />Cần xử lý ngay</)
  assert.match(settingsPageSource, />Thiết lập nhóm onboarding</)
})

test('settings page no longer renders duplicate template-only section heading', () => {
  assert.doesNotMatch(settingsPageSource, />Template checklist</)
})
