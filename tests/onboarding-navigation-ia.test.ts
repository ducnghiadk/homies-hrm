import test from 'node:test'
import assert from 'node:assert/strict'

import { getDesktopSidebarEntries } from '../src/lib/navigation/sidebar-config'

test('hr admin gets new-hires group with onboarding trio', () => {
  const entries = getDesktopSidebarEntries('hr_admin')
  const newHireGroup = entries.find((entry) => entry.id === 'new-hires')

  assert.ok(newHireGroup)
  assert.deepEqual(
    newHireGroup.items?.map((item) => item.href),
    [
      '/career-path/onboarding/overview',
      '/career-path/onboarding',
      '/career-path/onboarding/setup',
    ],
  )
})

test('onboarding navigation uses two clear trial-workflow layers', () => {
  const entries = getDesktopSidebarEntries('hr_admin')
  const newHireGroup = entries.find((entry) => entry.id === 'new-hires')

  assert.ok(newHireGroup)
  assert.deepEqual(
    newHireGroup.items?.map((item) => item.label),
    ['Tổng quan thử việc', 'Theo dõi thử việc', 'Thiết lập quy trình thử việc'],
  )
})

test('ceo no longer sees onboarding route inside growth group', () => {
  const entries = getDesktopSidebarEntries('ceo')
  const growthGroup = entries.find((entry) => entry.id === 'growth')

  assert.ok(growthGroup)
  assert.ok(!growthGroup.items?.some((item) => item.href === '/onboarding'))
  assert.ok(!growthGroup.items?.some((item) => item.href === '/career-path/onboarding'))
})
