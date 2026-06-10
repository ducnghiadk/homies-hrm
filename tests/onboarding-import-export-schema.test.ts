import test from 'node:test'
import assert from 'node:assert/strict'

import {
  exportOnboardingSettingsBundle,
  importOnboardingSettingsBundle,
  initCareerPathStores,
} from '../src/lib/career-path-service'

test('onboarding export returns versioned schema envelope', () => {
  initCareerPathStores()
  const exported = exportOnboardingSettingsBundle()

  assert.equal(exported.schema_version, '2026-06-02')
  assert.equal(exported.module, 'onboarding_settings')
  assert.ok(exported.payload.role_settings)
  assert.ok(Array.isArray(exported.payload.templates))
  assert.ok(Array.isArray(exported.payload.topics))
  assert.ok(Array.isArray(exported.payload.stages))
  assert.ok(Array.isArray(exported.payload.items))
})

test('import rejects unsupported onboarding schema version', () => {
  const success = importOnboardingSettingsBundle({
    schema_version: '2025-01-01',
    module: 'onboarding_settings',
    exported_at: '2026-06-02T00:00:00.000Z',
    payload: {
      role_settings: {} as never,
      templates: [],
      topics: [],
      stages: [],
      items: [],
    },
  } as never)

  assert.equal(success, false)
})

test('import onboarding bundle rejects invalid role-template mapping', () => {
  initCareerPathStores()
  const exported = exportOnboardingSettingsBundle()
  exported.payload.role_settings.roles[0] = {
    ...exported.payload.role_settings.roles[0],
    enabled: true,
    template_id: 'onb-template-barista-published-v1',
  }

  const success = importOnboardingSettingsBundle(exported)
  assert.equal(success, false)
})
