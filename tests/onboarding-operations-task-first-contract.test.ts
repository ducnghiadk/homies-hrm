import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(resolve(process.cwd(), 'src/app/career-path/onboarding/page.tsx'), 'utf8')
const listSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-operations/UpcomingOnboardingList.tsx'), 'utf8')
const detailSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-operations/OperationsChecklistDetail.tsx'), 'utf8')
const guideSource = readFileSync(resolve(process.cwd(), 'src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx'), 'utf8')

test('onboarding page exposes 4-step task-first header', () => {
  assert.match(pageSource, /Xem ưu tiên hôm nay/)
  assert.match(pageSource, /Chọn nhân sự/)
  assert.match(pageSource, /Chuẩn bị trước ngày đầu/)
  assert.match(pageSource, /Theo dõi sau ca đầu/)
})

test('left queue explains step and next action', () => {
  assert.match(listSource, /Bước 2: Chọn nhân sự cần xử lý/)
  assert.match(listSource, /Việc kế tiếp/)
  assert.match(listSource, /Đang ở bước/)
})

test('right pane exposes sticky guide and card meaning copy', () => {
  assert.match(guideSource, /Màn này dùng để làm gì/)
  assert.match(guideSource, /Card bên dưới nghĩa là gì/)
  assert.match(detailSource, /getPurposeCopy/)
})