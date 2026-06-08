import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const detailPath = resolve(process.cwd(), 'src/components/onboarding-operations/TrialTrackingDetailPanel.tsx')
const detailSource = existsSync(detailPath) ? readFileSync(detailPath, 'utf8') : ''
const gatePanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/onboarding-operations/OnboardingStageGatePanel.tsx'),
  'utf8',
)

test('khung chi tiết bám đúng 4 chặng thử việc', () => {
  assert.match(detailSource, /Chốt nhận việc và chuẩn bị vào làm/)
  assert.match(detailSource, /Ngày đầu nhận việc/)
  assert.match(detailSource, /Làm quen và kèm cặp/)
  assert.match(detailSource, /Đánh giá và chốt kết quả/)
  assert.match(detailSource, /TrialTrackingStageTaskTable/)
})

test('panel gate chặng 4 dùng copy tiếng Việt sạch', () => {
  assert.match(gatePanelSource, /Tổng kết chặng cuối/)
  assert.match(gatePanelSource, /Tự đánh giá là điều kiện vào bước chốt cuối/)
  assert.match(gatePanelSource, /Trạng thái/)
  assert.match(gatePanelSource, /Đề xuất qua bước chốt/)
  assert.doesNotMatch(gatePanelSource, /tÃ|Ã„|Â/)
})