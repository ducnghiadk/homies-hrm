import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const miniQuizSummarySource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-operations/OnboardingMiniQuizSummary.tsx'),
  'utf8',
)

const employeeDetailSource = readFileSync(
  resolve(process.cwd(), 'src/app/employees/[id]/page.tsx'),
  'utf8',
)

test('mini test summary dùng copy tiếng Việt sạch dấu', () => {
  assert.match(miniQuizSummarySource, /Kết quả mini test/)
  assert.match(miniQuizSummarySource, /Nhân viên chưa làm mini test chặng này\./)
  assert.match(miniQuizSummarySource, /Lần mới nhất không có câu sai\./)
  assert.match(miniQuizSummarySource, /Lịch sử gần nhất/)
  assert.match(miniQuizSummarySource, /Điểm:/)
  assert.doesNotMatch(miniQuizSummarySource, /K\?t qu\? mini test/)
  assert.doesNotMatch(miniQuizSummarySource, /Nh\?n vi\?n ch\?a l\?m mini test ch\?ng n\?y/)
  assert.doesNotMatch(miniQuizSummarySource, /L\?ch s\? g\?n nh\?t/)
  assert.doesNotMatch(miniQuizSummarySource, /\?i\?m:/)
})

test('hồ sơ nhân sự không còn chuỗi sinh nhật lỗi mã hóa', () => {
  assert.match(employeeDetailSource, /Sinh nhật/)
  assert.match(employeeDetailSource, /Countdown sinh nhật/)
  assert.doesNotMatch(employeeDetailSource, /Sinh nháº­t/)
})
