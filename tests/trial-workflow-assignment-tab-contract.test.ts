import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const assignmentsTabSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowAssignmentsTab.tsx'),
  'utf8',
)

test('thẻ áp dụng quy trình có bảng phạm vi và không còn tools link chết', () => {
  assert.equal(assignmentsTabSource.includes('Nhóm áp dụng'), true)
  assert.equal(assignmentsTabSource.includes('Cửa hàng'), true)
  assert.equal(assignmentsTabSource.includes('Vị trí'), true)
  assert.equal(assignmentsTabSource.includes('Ngày bắt đầu dùng'), true)
  assert.equal(assignmentsTabSource.includes('Trạng thái'), true)
  assert.equal(assignmentsTabSource.includes('Thao tác'), true)
  assert.equal(assignmentsTabSource.includes('Thêm vị trí'), true)
  assert.equal(assignmentsTabSource.includes('Sửa phạm vi áp dụng'), true)
  assert.equal(assignmentsTabSource.includes('Ngừng áp dụng'), true)
  assert.equal(assignmentsTabSource.includes('Các chỗ áp dụng còn thiếu'), true)
  assert.equal(assignmentsTabSource.includes('OnboardingSettingsSecondaryTools'), false)
})
