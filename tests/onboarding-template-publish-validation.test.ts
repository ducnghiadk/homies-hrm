import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getDraftOnboardingChecklistTemplate,
  getOnboardingChecklistTemplateSnapshotById,
  initCareerPathStores,
  publishOnboardingChecklistTemplate,
  validateOnboardingTemplateForPublishReport,
} from '../src/lib/career-path-service'

test('publish validation returns structured report', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)

  const report = validateOnboardingTemplateForPublishReport(draft!.id)
  assert.equal(report.template_id, draft!.id)
  assert.ok(Array.isArray(report.blocking_issues))
  assert.ok(Array.isArray(report.warning_issues))
  assert.ok(report.checked_at)
})

test('publish archives previous published template for same role atomically', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)

  const published = publishOnboardingChecklistTemplate(draft!.id)
  const archivedSnapshot = getOnboardingChecklistTemplateSnapshotById('onb-template-counter-published-v1')

  assert.equal(published.status, 'published')
  assert.equal(published.id, draft!.id)
  assert.equal(archivedSnapshot?.status, 'archived')
})
