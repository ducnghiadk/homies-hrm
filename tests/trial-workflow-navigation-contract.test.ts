import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sidebarSource = readFileSync(
  resolve(process.cwd(), 'src/lib/navigation/sidebar-config.ts'),
  'utf8',
)

test('cum nhan su moi dung dung hai man thu viec', () => {
  assert.equal(sidebarSource.includes('Thiết lập quy trình thử việc'), true)
  assert.equal(sidebarSource.includes('Theo dõi thử việc'), true)
  assert.equal(sidebarSource.includes('/career-path/onboarding/setup'), true)
  assert.equal(sidebarSource.includes('/career-path/onboarding'), true)
  assert.equal(sidebarSource.includes('Cấu hình onboarding'), false)
  assert.equal(sidebarSource.includes('Vận hành onboarding'), false)
})
