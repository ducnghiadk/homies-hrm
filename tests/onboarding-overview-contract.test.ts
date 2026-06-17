import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const overviewPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/onboarding/overview/page.tsx'),
  'utf8',
)

const operationsPageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/onboarding/page.tsx'),
  'utf8',
)

test('overview page exposes final CTA contracts', () => {
  assert.match(overviewPageSource, /\/career-path\/onboarding\?filter=all/)
  assert.match(overviewPageSource, /\/career-path\/onboarding\?filter=urgent/)
  assert.match(overviewPageSource, /\/career-path\/onboarding\/setup/)
  assert.match(overviewPageSource, /Bảng nhân sự thử việc/)
  assert.match(overviewPageSource, /Mở theo dõi thử việc/)
  assert.match(overviewPageSource, /Mở thiết lập quy trình thử việc/)
})

test('operations page reads filter from url and offers overview return path', () => {
  assert.match(operationsPageSource, /searchParams\.get\('filter'\)/)
  assert.match(operationsPageSource, /setActiveFilter\(/)
  assert.match(operationsPageSource, /Quay lại Tổng quan thử việc/)
})
