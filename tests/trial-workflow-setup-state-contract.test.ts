import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const workspaceSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowSetupWorkspace.tsx'),
  'utf8',
)
const viewModelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/buildTrialWorkflowSetupViewModel.ts'),
  'utf8',
)

test('màn thiết lập có đủ ba trạng thái để HR không bị ngộp', () => {
  assert.equal(viewModelSource.includes('Lần đầu thiết lập'), true)
  assert.equal(viewModelSource.includes('Đang làm dở'), true)
  assert.equal(viewModelSource.includes('Gần hoàn tất'), true)
  assert.equal(workspaceSource.includes('Trạng thái thiết lập'), true)
  assert.equal(workspaceSource.includes('Bắt đầu từ Thông tin chung'), true)
  assert.equal(workspaceSource.includes('Đi tới Bốn chặng thử việc'), true)
})
