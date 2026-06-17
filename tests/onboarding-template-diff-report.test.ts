import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getDraftOnboardingChecklistTemplate,
  getPublishedOnboardingChecklistTemplate,
  initCareerPathStores,
} from '../src/lib/career-path-service'
import { buildOnboardingTemplateDiffSummary } from '../src/lib/services/onboarding-template-diff-service'

test('diff summary compares draft against published baseline', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  const published = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  assert.ok(published)

  const diff = buildOnboardingTemplateDiffSummary(draft!.id, published!.id)
  assert.equal(diff.template_id, draft!.id)
  assert.equal(diff.baseline_template_id, published!.id)
})
