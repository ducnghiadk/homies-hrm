import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrUpdateRegistrationWeek } from '@/lib/mock-data-registration-weeks'
import { clearShiftRegistrations, saveShiftRegistrations } from '@/lib/mock-data-shift-registrations'
import {
  bulkApproveRegistrationsToDraft,
  clearScheduleWeekStore,
  getDraftAssignmentsForWeek,
  getReviewSummary,
  getPublishedAssignmentsForEmployee,
  publishScheduleWeek,
  upsertDraftAssignment,
  updatePublishedAssignment,
} from '@/lib/mock-data-schedule-weeks'

describe('bulkApproveRegistrationsToDraft', () => {
  beforeEach(() => {
    localStorage.clear()
    clearShiftRegistrations()
    clearScheduleWeekStore()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-23T10:00:00'))
  })

  it('copies submitted registrations into draft assignments with source_registration_id', () => {
    createOrUpdateRegistrationWeek({
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: '2026-06-29',
      status: 'open',
      registration_open_date: '2026-06-23',
      registration_deadline: '2026-06-27T23:59',
      created_by: 'emp-002',
    })

    saveShiftRegistrations(
      'emp-005',
      'store-001',
      '2026-06-29',
      [{ date: '2026-06-29', shift_id: 'shift-001' }],
      'submitted'
    )

    const result = bulkApproveRegistrationsToDraft('store-001', '2026-06-29', 'emp-002')

    expect(result.created).toBeGreaterThan(0)
    expect(getDraftAssignmentsForWeek('store-001', '2026-06-29')[0]).toMatchObject({
      status: 'draft',
      source_registration_id: expect.any(String),
      employee_id: 'emp-005',
      shift_id: 'shift-001',
    })
  })

  it('publishes draft assignments and marks them employee-visible', () => {
    createOrUpdateRegistrationWeek({
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: '2026-06-29',
      status: 'open',
      registration_open_date: '2026-06-23',
      registration_deadline: '2026-06-27T23:59',
      created_by: 'emp-002',
    })

    saveShiftRegistrations(
      'emp-005',
      'store-001',
      '2026-06-29',
      [{ date: '2026-06-29', shift_id: 'shift-001' }],
      'submitted'
    )
    bulkApproveRegistrationsToDraft('store-001', '2026-06-29', 'emp-002')

    const published = publishScheduleWeek('store-001', '2026-06-29', 'emp-002')

    expect(published.status).toBe('published')
    expect(getPublishedAssignmentsForEmployee('emp-005', '2026-06-29')[0]).toMatchObject({
      status: 'published',
      shift_id: 'shift-001',
    })
  })

  it('requires change reason after publish', () => {
    createOrUpdateRegistrationWeek({
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: '2026-06-29',
      status: 'open',
      registration_open_date: '2026-06-23',
      registration_deadline: '2026-06-27T23:59',
      created_by: 'emp-002',
    })

    saveShiftRegistrations(
      'emp-005',
      'store-001',
      '2026-06-29',
      [{ date: '2026-06-29', shift_id: 'shift-001' }],
      'submitted'
    )
    bulkApproveRegistrationsToDraft('store-001', '2026-06-29', 'emp-002')
    publishScheduleWeek('store-001', '2026-06-29', 'emp-002')

    const assignment = getPublishedAssignmentsForEmployee('emp-005', '2026-06-29')[0]

    expect(() => updatePublishedAssignment({
      assignmentId: assignment.id,
      nextShiftId: 'shift-002',
      actorId: 'emp-002',
      changeReason: '',
    })).toThrow('Change reason is required after publish.')
  })

  it('reports skipped registrations when draft differs from employee requests', () => {
    createOrUpdateRegistrationWeek({
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: '2026-06-29',
      status: 'open',
      registration_open_date: '2026-06-23',
      registration_deadline: '2026-06-27T23:59',
      created_by: 'emp-002',
    })

    saveShiftRegistrations(
      'emp-005',
      'store-001',
      '2026-06-29',
      [{ date: '2026-06-29', shift_id: 'shift-001' }],
      'submitted'
    )
    bulkApproveRegistrationsToDraft('store-001', '2026-06-29', 'emp-002')

    const assignment = getDraftAssignmentsForWeek('store-001', '2026-06-29')[0]
    upsertDraftAssignment({
      schedule_week_id: assignment.schedule_week_id,
      employee_id: assignment.employee_id,
      store_id: assignment.store_id,
      date: assignment.date,
      shift_id: 'shift-002',
      source_registration_id: assignment.source_registration_id,
      actor_id: 'emp-002',
    })

    expect(getReviewSummary('store-001', '2026-06-29')).toMatchObject({
      totalRegistrations: 1,
      skippedRegistrations: 1,
      draftAssignments: 1,
    })
  })
})
