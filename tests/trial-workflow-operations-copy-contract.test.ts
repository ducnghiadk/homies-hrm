import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const overviewPageSource = readFileSync(resolve(process.cwd(), 'src/app/career-path/onboarding/overview/page.tsx'), 'utf8')
const operationsPageSource = readFileSync(resolve(process.cwd(), 'src/app/career-path/onboarding/page.tsx'), 'utf8')

test('màn vận hành dùng tên theo dõi thử việc', () => {
  assert.equal(operationsPageSource.includes('Theo dõi thử việc'), true)
  assert.equal(operationsPageSource.includes('Theo dõi từng nhân viên mới đang thử việc, biết họ đang ở giai đoạn nào và còn thiếu việc gì.'), true)
  assert.equal(operationsPageSource.includes('Vận hành onboarding'), false)
})

test('màn tổng quan trỏ đúng hai màn thử việc mới', () => {
  assert.equal(overviewPageSource.includes('Tổng quan thử việc'), true)
  assert.equal(overviewPageSource.includes('Mở theo dõi thử việc'), true)
  assert.equal(overviewPageSource.includes('Mở thiết lập quy trình thử việc'), true)
})