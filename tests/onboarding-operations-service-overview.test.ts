import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const serviceSource = readFileSync(resolve(process.cwd(), 'src/lib/services/onboarding-operations-service.ts'), 'utf8')

test('workspace overview exposes config-first system status', () => {
  assert.match(serviceSource, /systemStatus/)
  assert.match(serviceSource, /urgentItems/)
  assert.match(serviceSource, /configSummary/)
})

test('service overview keeps summary and uses tracking row fields mới', () => {
  assert.match(serviceSource, /filters:/)
  assert.match(serviceSource, /stats:/)
  assert.match(serviceSource, /statusLabel/)
  assert.match(serviceSource, /primaryActionLabel/)
})

test('service source defines journey length and suggested today index contracts', () => {
  assert.match(serviceSource, /journeyLength/)
  assert.match(serviceSource, /suggestedTodayIndex/)
})

test('service source defines journey summaries for every day in range', () => {
  assert.match(serviceSource, /journeyDays/)
  assert.match(serviceSource, /OnboardingJourneyDaySummary/)
  assert.match(serviceSource, /title:\s*`Ngày \$\{dayIndex\}`/)
})
