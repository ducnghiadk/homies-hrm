import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const pageSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')

describe('schedule review publish flow', () => {
  it('delegates publish to the canonical ScheduleService', () => {
    assert.match(pageSource, /import \{ ScheduleService \} from ['"]@\/lib\/services\/schedule-service['"]/) 
    assert.match(pageSource, /ScheduleService\.publishWeek\(user, activeWeek\.store_id, weekDates/)
    assert.doesNotMatch(pageSource, /updateRegistrationStatus\(activeWeek\.id, ['"]published['"]\)/)
  })
})
