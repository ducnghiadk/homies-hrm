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
const librarySource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx'),
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
