import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const serviceSource = readFileSync(
  resolve(process.cwd(), 'src/lib/services/onboarding-operations-service.ts'),
  'utf8',
)

test('service source định nghĩa filter và field tracking mới', () => {
  assert.match(serviceSource, /type OnboardingOpsPriorityFilter = 'all' \| 'urgent' \| 'due_soon' \| 'on_track' \| 'blocked_start' \| 'completed'/)
  assert.match(serviceSource, /type OnboardingOpsStageKey = 'offer_confirmed' \| 'day_one' \| 'early_ramp' \| 'final_review'/)
  assert.match(serviceSource, /currentStageLabel/)
  assert.match(serviceSource, /nextMilestoneLabel/)
  assert.match(serviceSource, /primaryMissingLabel/)
  assert.match(serviceSource, /statusLabel/)
})

test('service tracking không còn copy lỗi mã hóa ở các nhãn chính', () => {
  assert.match(serviceSource, /Chưa thể bắt đầu/)
  assert.match(serviceSource, /Đang đúng tiến độ/)
  assert.match(serviceSource, /Đi tới thiết lập/)
  assert.match(serviceSource, /Vào phần thiết lập quy trình thử việc để ghép chức danh và chọn mẫu áp dụng/)
  assert.doesNotMatch(serviceSource, /VÃ|Ã„|ChÆ°a thá»ƒ|Äang Ä‘Ãºng/)
})