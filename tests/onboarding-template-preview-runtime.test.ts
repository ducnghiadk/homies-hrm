import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getDraftOnboardingChecklistTemplate,
  getPublishedOnboardingChecklistTemplate,
  initCareerPathStores,
} from '../src/lib/career-path-service'
import {
  buildOnboardingRuntimeDays,
  buildOnboardingRuntimeSummary,
} from '../src/lib/services/onboarding-content-runtime-service'

test('runtime builder supports both draft and published template ids', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  const published = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  assert.ok(published)

  const draftDays = buildOnboardingRuntimeDays(draft!.id)
  const publishedDays = buildOnboardingRuntimeDays(published!.id)

  assert.ok(draftDays.length > 0)
  assert.ok(publishedDays.length > 0)
})

test('runtime summary aggregates day counts and item totals', () => {
  initCareerPathStores()
  const published = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(published)

  const summary = buildOnboardingRuntimeSummary(published!.id)
  assert.ok(summary.total_days > 0)
  assert.ok(summary.total_items > 0)
})
