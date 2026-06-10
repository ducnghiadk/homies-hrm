import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createOnboardingAuditEntry,
  exportOnboardingSettingsBundle,
  getDraftOnboardingChecklistTemplate,
  getOnboardingAuditEntries,
  importOnboardingSettingsBundle,
  initCareerPathStores,
  publishOnboardingChecklistTemplate,
} from '../src/lib/career-path-service'

test('audit entry exposes minimum required fields', () => {
  const entry = createOnboardingAuditEntry({
    event_type: 'template_publish',
    entity_type: 'template',
    entity_id: 'tpl-1',
    summary: 'Publish template',
    changed_fields: ['status'],
  })

  assert.equal(entry.entity_type, 'template')
  assert.ok(entry.id)
  assert.ok(entry.actor)
  assert.ok(entry.created_at)
  assert.deepEqual(entry.changed_fields, ['status'])
})

test('publish action appends onboarding audit entry', () => {
  initCareerPathStores()
  const before = getOnboardingAuditEntries().length
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)

  publishOnboardingChecklistTemplate(draft!.id)

  const entries = getOnboardingAuditEntries()
  assert.equal(entries.length, before + 1)
  assert.equal(entries[0]?.event_type, 'template_publish')
  assert.equal(entries[0]?.entity_id, draft!.id)
})

test('import action appends onboarding audit entry', () => {
  initCareerPathStores()
  const before = getOnboardingAuditEntries().length
  const exported = exportOnboardingSettingsBundle()

  const success = importOnboardingSettingsBundle(exported)
  assert.equal(success, true)

  const entries = getOnboardingAuditEntries()
  assert.equal(entries.length, before + 1)
  assert.equal(entries[0]?.event_type, 'settings_import')
  assert.equal(entries[0]?.entity_type, 'import_export')
})
