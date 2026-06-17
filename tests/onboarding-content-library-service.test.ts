import test from 'node:test'
import assert from 'node:assert/strict'
import {
  initCareerPathStores,
  getDraftOnboardingChecklistTemplate,
  getOnboardingChecklistItems,
  getPublishedOnboardingChecklistTemplate,
  getOnboardingContentTopics,
  duplicateOnboardingChecklistTemplate,
  publishOnboardingChecklistTemplate,
  getOnboardingChecklistTemplateSnapshotById,
  assignOnboardingChecklistTemplateToEmployee,
} from '../src/lib/career-path-service'
import { buildOnboardingRuntimeDays } from '../src/lib/services/onboarding-content-runtime-service'

test('built-in starter template exposes published content library seed', () => {
  initCareerPathStores()

  const published = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(published)
  assert.equal(published?.status, 'published')
  assert.match(published?.name ?? '', /Vietnam Milk Tea Store Onboarding/i)

  const topics = getOnboardingContentTopics(published!.id)
  assert.ok(topics.length >= 6)
  assert.ok(topics.some((topic) => /Orientation/i.test(topic.label)))

  const items = getOnboardingChecklistItems(published!.id)
  assert.ok(items.some((item) => item.code === 'orientation-store-rules'))
})

test('draft template stays separate from published template', () => {
  initCareerPathStores()

  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  const published = getPublishedOnboardingChecklistTemplate('counter_staff')

  assert.ok(draft)
  assert.ok(published)
  assert.equal(draft?.status, 'draft')
  assert.equal(published?.status, 'published')
  assert.notEqual(draft?.id, published?.id)
})

test('duplicate remaps topic and stage ids into new draft template', () => {
  initCareerPathStores()

  const source = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(source)

  const duplicated = duplicateOnboardingChecklistTemplate(source!.id)
  const topics = getOnboardingContentTopics(duplicated.id)
  const items = getOnboardingChecklistItems(duplicated.id)

  assert.equal(duplicated.status, 'draft')
  assert.ok(topics.length > 0)
  assert.ok(items.length > 0)
  assert.ok(items.every((item) => item.template_id === duplicated.id))
  assert.ok(items.every((item) => item.stage_id.startsWith(duplicated.id)))
  assert.ok(items.every((item) => topics.some((topic) => topic.id === item.topic_id)))
})

test('publish archives previous published template for same role', () => {
  initCareerPathStores()

  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  const oldPublished = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  assert.ok(oldPublished)

  const nextPublished = publishOnboardingChecklistTemplate(draft!.id)
  const archivedSnapshot = getOnboardingChecklistTemplateSnapshotById(oldPublished!.id)

  assert.equal(nextPublished.status, 'published')
  assert.equal(getPublishedOnboardingChecklistTemplate('counter_staff')?.id, draft!.id)
  assert.equal(archivedSnapshot?.status, 'archived')
})

test('existing employee onboarding keeps old template snapshot after republish', () => {
  initCareerPathStores()

  const oldPublished = getPublishedOnboardingChecklistTemplate('counter_staff')
  assert.ok(oldPublished)

  const plan = assignOnboardingChecklistTemplateToEmployee({
    id: 'emp-snapshot-test',
    full_name: 'Snapshot Employee',
    store_id: 'store-001',
    position_id: 'pos-002',
    hire_date: '2026-06-02',
    status: 'probation',
  })

  assert.ok(plan)
  assert.equal(plan?.template_id, oldPublished!.id)

  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  publishOnboardingChecklistTemplate(draft!.id)

  const oldRuntime = buildOnboardingRuntimeDays(plan!.template_id)
  const newPublished = getPublishedOnboardingChecklistTemplate('counter_staff')
  const newRuntime = buildOnboardingRuntimeDays(newPublished!.id)

  assert.equal(plan?.template_id, oldPublished!.id)
  assert.ok(oldRuntime.length > 0)
  assert.ok(newRuntime.length > 0)
  assert.equal(getOnboardingChecklistTemplateSnapshotById(plan!.template_id)?.status, 'archived')
  assert.ok(oldRuntime.some((day) => day.allItems.some((item) => item.code === 'orientation-store-rules')))
  assert.ok(newRuntime.some((day) => day.allItems.some((item) => item.code === 'orientation-store-rules-draft')))
})
