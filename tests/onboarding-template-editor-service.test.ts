import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createOnboardingChecklistItem,
  createOnboardingContentTopic,
  getDraftOnboardingChecklistTemplate,
  getOnboardingAuditEntries,
  getOnboardingChecklistItems,
  getOnboardingChecklistStages,
  getOnboardingContentTopics,
  initCareerPathStores,
  updateOnboardingChecklistItem,
  updateOnboardingChecklistStage,
  updateOnboardingChecklistTemplate,
  updateOnboardingContentTopic,
} from '../src/lib/career-path-service'

test('template editor service updates draft template metadata', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)

  const updated = updateOnboardingChecklistTemplate(draft!.id, {
    name: 'Bản nháp đã chỉnh',
    description: 'Mô tả mới',
    journey_length_days: 21,
  })

  assert.ok(updated)
  assert.equal(updated?.name, 'Bản nháp đã chỉnh')
  assert.equal(updated?.description, 'Mô tả mới')
  assert.equal(updated?.journey_length_days, 21)
})

test('template editor service creates and updates onboarding topic', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  const beforeCount = getOnboardingContentTopics(draft!.id).length

  const created = createOnboardingContentTopic(draft!.id)
  const updated = updateOnboardingContentTopic(created.id, {
    label: 'Chủ đề mới đã đổi tên',
    active: false,
  })

  const topics = getOnboardingContentTopics(draft!.id)
  assert.equal(topics.length, beforeCount + 1)
  assert.ok(created.code.startsWith('topic_'))
  assert.equal(updated?.label, 'Chủ đề mới đã đổi tên')
  assert.equal(updated?.active, false)
})

test('template editor service updates stage required flag and label', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  const stage = getOnboardingChecklistStages(draft!.id)[0]
  assert.ok(stage)

  const updated = updateOnboardingChecklistStage(stage.id, {
    label: 'Ngày đầu tại quầy',
    required_to_pass: !stage.required_to_pass,
  })

  assert.ok(updated)
  assert.equal(updated?.label, 'Ngày đầu tại quầy')
  assert.equal(updated?.required_to_pass, !stage.required_to_pass)
})

test('template editor service creates and updates checklist item', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  const topics = getOnboardingContentTopics(draft!.id)
  const stages = getOnboardingChecklistStages(draft!.id)
  const beforeCount = getOnboardingChecklistItems(draft!.id).length

  const created = createOnboardingChecklistItem(draft!.id)
  const updated = updateOnboardingChecklistItem(created.id, {
    title: 'Thực hành mở máy POS',
    topic_id: topics[0]!.id,
    stage_id: stages[0]!.id,
    estimated_minutes: 25,
    is_required: false,
    is_focus_block_eligible: true,
    ops_visibility: 'ops_only',
  })

  const items = getOnboardingChecklistItems(draft!.id)
  assert.equal(items.length, beforeCount + 1)
  assert.equal(updated?.title, 'Thực hành mở máy POS')
  assert.equal(updated?.estimated_minutes, 25)
  assert.equal(updated?.is_required, false)
  assert.equal(updated?.is_focus_block_eligible, true)
  assert.equal(updated?.ops_visibility, 'ops_only')
})

test('template editor service appends audit entries for editor actions', () => {
  initCareerPathStores()
  const draft = getDraftOnboardingChecklistTemplate('counter_staff')
  assert.ok(draft)
  const before = getOnboardingAuditEntries().length

  const topic = createOnboardingContentTopic(draft!.id)
  updateOnboardingContentTopic(topic.id, { label: 'Topic audit test' })

  const stage = getOnboardingChecklistStages(draft!.id)[0]
  assert.ok(stage)
  updateOnboardingChecklistStage(stage.id, { label: 'Stage audit test' })

  const item = createOnboardingChecklistItem(draft!.id)
  updateOnboardingChecklistItem(item.id, { title: 'Item audit test' })

  updateOnboardingChecklistTemplate(draft!.id, { name: 'Template audit test' })

  const entries = getOnboardingAuditEntries()
  assert.ok(entries.length >= before + 6)
  assert.equal(entries[0]?.event_type, 'template_update')
  assert.ok(entries.some((entry) => entry.event_type === 'topic_create'))
  assert.ok(entries.some((entry) => entry.event_type === 'topic_update'))
  assert.ok(entries.some((entry) => entry.event_type === 'stage_update'))
  assert.ok(entries.some((entry) => entry.event_type === 'item_create'))
  assert.ok(entries.some((entry) => entry.event_type === 'item_update'))
})
