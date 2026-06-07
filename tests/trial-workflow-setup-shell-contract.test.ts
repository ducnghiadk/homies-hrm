import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/onboarding/setup/page.tsx'),
  'utf8',
)

test('màn thiết lập dùng tiêu đề quy trình thử việc dạng thẻ', () => {
  assert.equal(pageSource.includes('Thiết lập quy trình thử việc'), true)
  assert.equal(pageSource.includes('Tạo quy trình thử việc chuẩn để nhân viên mới được giao đúng việc theo từng giai đoạn.'), true)
  assert.equal(pageSource.includes('Bước 1.'), false)
  assert.equal(pageSource.includes('Bước 2.'), false)
  assert.equal(pageSource.includes('Bước 3.'), false)
})
