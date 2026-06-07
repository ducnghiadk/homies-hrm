import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/onboarding/setup/page.tsx'),
  'utf8',
)
const workspaceSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx'),
  'utf8',
)

test('màn thiết lập dùng dạng thẻ thay cho 3 khối dọc', () => {
  assert.equal(workspaceSource.includes('Thông tin chung'), true)
  assert.equal(workspaceSource.includes('Bằng chứng thử việc'), true)
  assert.equal(workspaceSource.includes('Việc cần làm'), true)
  assert.equal(workspaceSource.includes('Điều kiện qua chặng'), true)
  assert.equal(workspaceSource.includes('Áp dụng quy trình'), true)
  assert.equal(workspaceSource.includes('Thẻ đang mở'), true)
  assert.equal(workspaceSource.includes('Xem chỗ cần thiếu'), true)
  assert.equal(workspaceSource.includes('OnboardingSettingsAdminRail'), false)
  assert.equal(workspaceSource.includes('TrialWorkflowStagePlannerSection'), false)
  assert.equal(workspaceSource.includes('TrialWorkflowTaskAuthoringSection'), false)
  assert.equal(workspaceSource.includes('TrialWorkflowAssignmentPublishSection'), false)
})

test('page setup không còn nhấn mạnh copy 3 bước cũ', () => {
  assert.equal(pageSource.includes('Bước 1.'), false)
  assert.equal(pageSource.includes('Bước 2.'), false)
  assert.equal(pageSource.includes('Bước 3.'), false)
  assert.equal(pageSource.includes('Thiết lập quy trình thử việc'), true)
})
