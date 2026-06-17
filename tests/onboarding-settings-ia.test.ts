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

test('settings page no longer inlines setup workspace sections', () => {
  assert.doesNotMatch(settingsPageSource, /id="overview"/)
  assert.doesNotMatch(settingsPageSource, /id="content-library"/)
  assert.doesNotMatch(settingsPageSource, /id="templates"/)
  assert.doesNotMatch(settingsPageSource, /id="journey-rules"/)
})

test('settings page no longer carries task-first setup copy', () => {
  assert.doesNotMatch(settingsPageSource, /Thư viện nội dung onboarding/)
  assert.doesNotMatch(settingsPageSource, /Content Library/)
  assert.doesNotMatch(settingsPageSource, /Journey Rules/)
})
