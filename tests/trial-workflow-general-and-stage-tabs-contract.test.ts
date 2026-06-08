import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const generalTabSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowGeneralInfoTab.tsx'),
  'utf8',
)
const stagesTabSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-settings/TrialWorkflowStagesTab.tsx'),
  'utf8',
)

test('thẻ thông tin chung có bảng nền tảng và thao tác nhanh', () => {
  assert.equal(generalTabSource.includes('Thời gian thử việc'), true)
  assert.equal(generalTabSource.includes('Mốc bắt đầu tính thử việc'), true)
  assert.equal(generalTabSource.includes('Người theo dõi chính'), true)
  assert.equal(generalTabSource.includes('Người phối hợp'), true)
  assert.equal(generalTabSource.includes('Nguyên tắc chốt cuối kỳ'), true)
  assert.equal(generalTabSource.includes('Nơi lưu ghi nhận cuối kỳ'), true)
  assert.equal(generalTabSource.includes('Sửa nhanh thời gian'), true)
  assert.equal(generalTabSource.includes('Sửa người theo dõi'), true)
  assert.equal(generalTabSource.includes('Thiết lập nguyên tắc chốt'), true)
  assert.equal(generalTabSource.includes('Thao tác'), true)
})

test('thẻ bốn chặng dùng đúng nhãn và cột theo spec', () => {
  assert.equal(stagesTabSource.includes('Bốn chặng thử việc'), true)
  assert.equal(stagesTabSource.includes('Tên chặng'), true)
  assert.equal(stagesTabSource.includes('Mục tiêu chặng'), true)
  assert.equal(stagesTabSource.includes('Người phụ trách chính'), true)
  assert.equal(stagesTabSource.includes('Mốc thời gian'), true)
  assert.equal(stagesTabSource.includes('Trạng thái hoàn tất'), true)
  assert.equal(stagesTabSource.includes('Thao tác'), true)
  assert.equal(stagesTabSource.includes('Thêm chặng'), true)
  assert.equal(stagesTabSource.includes('Đổi thứ tự'), true)
  assert.equal(stagesTabSource.includes('Ẩn chặng'), true)
  assert.equal(stagesTabSource.includes('Xem việc trong chặng'), true)
})
