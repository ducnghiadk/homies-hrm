import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingsPageSource = readFileSync(resolve(process.cwd(), 'src/app/career-path/settings/page.tsx'), 'utf8')

test('settings page chỉ giữ tab chung và bỏ dữ liệu thử việc cũ', () => {
  assert.match(settingsPageSource, /type TabId = 'levels' \| 'skills' \| 'conditions' \| 'buddy' \| 'general'/)
  assert.match(settingsPageSource, /\/career-path\/onboarding\/setup/)
  assert.doesNotMatch(settingsPageSource, /Checklist thử việc/)
  assert.doesNotMatch(settingsPageSource, /Bước onboarding/)
  assert.doesNotMatch(settingsPageSource, /getOnboardingSteps/)
  assert.doesNotMatch(settingsPageSource, /getTrialChecklist/)
})
