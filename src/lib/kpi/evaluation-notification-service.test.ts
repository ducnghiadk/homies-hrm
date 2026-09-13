import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildEvaluationNotificationEvent,
  type KpiEvaluationNotificationEvent,
} from './evaluation-notification-service.ts'

describe('evaluation notification service', () => {
  it('builds milestone notifications idempotently without duplicates', () => {
    const existingEvents: KpiEvaluationNotificationEvent[] = []

    const event1 = buildEvaluationNotificationEvent({
      monthly_review_id: 'mr-01',
      recipient_id: 'peer-a',
      type: 'REVIEW_ASSIGNED',
      at: '2026-08-25T08:00:00.000Z',
      existing_events: existingEvents,
    })

    assert.ok(event1)
    assert.equal(event1.id, 'notif_mr-01_peer-a_REVIEW_ASSIGNED')
    assert.equal(event1.type, 'REVIEW_ASSIGNED')

    // Thêm event1 vào danh sách đã tạo
    existingEvents.push(event1)

    // Gọi lại cùng milestone -> không tạo duplicate (trả về undefined)
    const eventDuplicate = buildEvaluationNotificationEvent({
      monthly_review_id: 'mr-01',
      recipient_id: 'peer-a',
      type: 'REVIEW_ASSIGNED',
      at: '2026-08-25T08:30:00.000Z',
      existing_events: existingEvents,
    })

    assert.equal(eventDuplicate, undefined)
  })

  it('generates distinctive events for different milestones and recipients', () => {
    const existingEvents: KpiEvaluationNotificationEvent[] = []

    const eventReviewer = buildEvaluationNotificationEvent({
      monthly_review_id: 'mr-01',
      recipient_id: 'peer-a',
      type: 'REVIEW_DUE_24H',
      at: '2026-08-26T08:00:00.000Z',
      existing_events: existingEvents,
    })

    const eventManager = buildEvaluationNotificationEvent({
      monthly_review_id: 'mr-01',
      recipient_id: 'manager-01',
      type: 'MANAGER_APPROVAL_REQUIRED',
      at: '2026-08-27T08:00:00.000Z',
      existing_events: existingEvents,
    })

    assert.ok(eventReviewer)
    assert.ok(eventManager)
    assert.notEqual(eventReviewer.id, eventManager.id)
  })
})
