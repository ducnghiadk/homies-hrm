import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const tasksTabSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowTasksTab.tsx'),
  'utf8',
)
const gatesTabSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowGateConditionsTab.tsx'),
  'utf8',
)

test('thẻ việc cần làm có vùng chọn chặng và bảng việc', () => {
  assert.equal(tasksTabSource.includes('Đang chỉnh việc của chặng'), true)
  assert.equal(tasksTabSource.includes('Việc cần làm'), true)
  assert.equal(tasksTabSource.includes('Người làm chính'), true)
  assert.equal(tasksTabSource.includes('Kết quả cần có'), true)
  assert.equal(tasksTabSource.includes('Bắt buộc'), true)
  assert.equal(tasksTabSource.includes('Hạn hoàn tất'), true)
  assert.equal(tasksTabSource.includes('Trạng thái'), true)
  assert.equal(tasksTabSource.includes('Thao tác'), true)
  assert.equal(tasksTabSource.includes('Thêm việc mới'), true)
  assert.equal(tasksTabSource.includes('Nhân bản việc'), true)
  assert.equal(tasksTabSource.includes('Chuyển sang chặng khác'), true)
  assert.equal(tasksTabSource.includes('Đánh dấu bắt buộc'), true)
})

test('thẻ điều kiện qua chặng có bảng điều kiện và danh sách thiếu', () => {
  assert.equal(gatesTabSource.includes('Điều kiện phải có'), true)
  assert.equal(gatesTabSource.includes('Kết quả hiện tại'), true)
  assert.equal(gatesTabSource.includes('Mức bắt buộc hay hỗ trợ'), true)
  assert.equal(gatesTabSource.includes('Người duyệt qua chặng'), true)
  assert.equal(gatesTabSource.includes('Thao tác'), true)
  assert.equal(gatesTabSource.includes('Sửa điều kiện'), true)
  assert.equal(gatesTabSource.includes('Chọn người duyệt'), true)
  assert.equal(gatesTabSource.includes('Bỏ điều kiện'), true)
  assert.equal(gatesTabSource.includes('Các chỗ thiếu cần xử lý tiếp theo'), true)
})
