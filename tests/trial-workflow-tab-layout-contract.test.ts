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
const viewModelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/buildTrialWorkflowSetupViewModel.ts'),
  'utf8',
)

test('màn thiết lập dùng dạng thẻ thay cho 3 khối dọc', () => {
  assert.equal(workspaceSource.includes('Thông tin chung'), true)
  assert.equal(workspaceSource.includes('Bốn chặng thử việc'), true)
  assert.equal(workspaceSource.includes('Việc cần làm'), true)
  assert.equal(workspaceSource.includes('Điều kiện qua chặng'), true)
  assert.equal(workspaceSource.includes('Áp dụng quy trình'), true)
  assert.equal(workspaceSource.includes('Thẻ đang mở'), true)
  assert.equal(workspaceSource.includes('Xem chỗ còn thiếu'), true)
  assert.equal(workspaceSource.includes('Lưu bản nháp'), true)
  assert.equal(workspaceSource.includes('Đưa vào áp dụng'), true)
  assert.equal(workspaceSource.includes('Lưu thay đổi'), false)
  assert.equal(workspaceSource.includes('OnboardingSettingsAdminRail'), false)
  assert.equal(workspaceSource.includes('TrialWorkflowStagePlannerSection'), false)
  assert.equal(workspaceSource.includes('TrialWorkflowTaskAuthoringSection'), false)
  assert.equal(workspaceSource.includes('TrialWorkflowAssignmentPublishSection'), false)
})

test('màn setup không còn trộn dữ liệu vận hành theo từng nhân sự', () => {
  assert.equal(workspaceSource.includes('getUnmatchedOnboardingRoleEmployees'), false)
  assert.equal(workspaceSource.includes('unmatchedEmployees'), false)
  assert.equal(viewModelSource.includes('unmatchedEmployeeCount'), false)
  assert.equal(viewModelSource.includes('nhân sự mới chưa khớp nhóm áp dụng'), false)
})

test('page setup không còn nhấn mạnh copy 3 bước cũ', () => {
  assert.equal(pageSource.includes('Bước 1.'), false)
  assert.equal(pageSource.includes('Bước 2.'), false)
  assert.equal(pageSource.includes('Bước 3.'), false)
  assert.equal(pageSource.includes('Thiết lập quy trình thử việc'), true)
})
