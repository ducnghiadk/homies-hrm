import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/onboarding/page.tsx'),
  'utf8',
)

test('màn tracking dùng summary bar, bảng nhân sự, và panel chi tiết mới', () => {
  assert.match(pageSource, /TrialTrackingSummaryBar/)
  assert.match(pageSource, /TrialTrackingEmployeeTable/)
  assert.match(pageSource, /TrialTrackingDetailPanel/)
  assert.doesNotMatch(pageSource, /OnboardingOpsTimeline/)
  assert.doesNotMatch(pageSource, /UpcomingOnboardingList/)
  assert.doesNotMatch(pageSource, /OperationsChecklistDetail/)
})

test('màn tracking đọc filter URL theo trạng thái mới', () => {
  assert.match(pageSource, /searchParams\.get\('filter'\)/)
  assert.match(pageSource, /'urgent'/)
  assert.match(pageSource, /'due_soon'/)
  assert.match(pageSource, /'on_track'/)
  assert.match(pageSource, /'blocked_start'/)
  assert.match(pageSource, /'completed'/)
})
