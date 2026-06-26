import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createOrUpdateRegistrationWeek } from '@/lib/mock-data-registration-weeks'
import { clearShiftRegistrations, saveShiftRegistrations } from '@/lib/mock-data-shift-registrations'
import {
  bulkApproveRegistrationsToDraft,
  clearScheduleWeekStore,
  getScheduleApprovalLogsForWeek,
  getDraftAssignmentsForWeek,
  getScheduleEditLogsForWeek,
  getReviewSummary,
  getPublishedAssignmentsForEmployee,
  publishScheduleWeek,
  removeDraftAssignment,
  upsertDraftAssignment,
  updatePublishedAssignment,
} from '@/lib/mock-data-schedule-weeks'

function seedOpenWeek() {
  createOrUpdateRegistrationWeek({
    org_id: 'org-001',
    store_id: 'store-001',
    week_start_date: '2026-06-29',
    status: 'open',
    registration_open_date: '2026-06-23',
    registration_deadline: '2026-06-27T23:59',
    created_by: 'emp-002',
  })
}

function seedSubmittedRegistrations() {
  saveShiftRegistrations(
    'emp-005',
    'store-001',
    '2026-06-29',
    [
      { date: '2026-06-29', shift_id: 'shift-001' },
      { date: '2026-06-30', shift_id: 'shift-002' },
    ],
    'submitted'
  )
}

describe('bulkApproveRegistrationsToDraft', () => {
  beforeEach(() => {
    localStorage.clear()
    clearShiftRegistrations()
    clearScheduleWeekStore()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-23T10:00:00'))
  })

  it('copies submitted registrations into draft assignments with source_registration_id', () => {
    seedOpenWeek()
    saveShiftRegistrations('emp-005', 'store-001', '2026-06-29', [{ date: '2026-06-29', shift_id: 'shift-001' }], 'submitted')

    const result = bulkApproveRegistrationsToDraft('store-001', '2026-06-29', 'emp-002')

    expect(result.created).toBeGreaterThan(0)
    expect(getDraftAssignmentsForWeek('store-001', '2026-06-29')[0]).toMatchObject({
      status: 'draft',
      source_registration_id: expect.any(String),
      employee_id: 'emp-005',
      shift_id: 'shift-001',
    })
  })

  it('records approve_from_registration audit entries for copied registrations', () => {
    seedOpenWeek()
    seedSubmittedRegistrations()

    bulkApproveRegistrationsToDraft('store-001', '2026-06-29', 'emp-002')

    expect(getScheduleEditLogsForWeek('store-001', '2026-06-29')).toMatchObject([
      expect.objectContaining({
        action: 'approve_from_registration',
        changed_by: 'emp-002',
        employee_id: 'emp-005',
      }),
      expect.objectContaining({
        action: 'approve_from_registration',
        changed_by: 'emp-002',
      }),
    ])
  })

  it('records before and after state when manager updates or removes draft assignment', () => {
    seedOpenWeek()
    seedSubmittedRegistrations()

    const { scheduleWeek } = bulkApproveRegistrationsToDraft('store-001', '2026-06-29', 'emp-002')

    upsertDraftAssignment({
      schedule_week_id: scheduleWeek.id,
      employee_id: 'emp-005',
      store_id: 'store-001',
      date: '2026-06-29',
      shift_id: 'shift-003',
      source_registration_id: getDraftAssignmentsForWeek('store-001', '2026-06-29')[0]?.source_registration_id,
      actor_id: 'emp-002',
    })
    removeDraftAssignment('store-001', '2026-06-29', 'emp-005', '2026-06-29', 'emp-002')

    expect(getScheduleEditLogsForWeek('store-001', '2026-06-29').slice(0, 2)).toMatchObject([
      expect.objectContaining({
        action: 'remove',
        before_state: expect.objectContaining({ shift_id: 'shift-003' }),
        after_state: null,
      }),
      expect.objectContaining({
        action: 'update',
        before_state: expect.objectContaining({ shift_id: 'shift-001' }),
        after_state: expect.objectContaining({ shift_id: 'shift-003' }),
      }),
    ])
  })

  it('records one approval summary when publishing draft schedule', () => {
    seedOpenWeek()
    seedSubmittedRegistrations()

    bulkApproveRegistrationsToDraft('store-001', '2026-06-29', 'emp-002')
    publishScheduleWeek('store-001', '2026-06-29', 'emp-002')

    expect(getScheduleApprovalLogsForWeek('store-001', '2026-06-29')).toMatchObject([
      expect.objectContaining({
        approved_by: 'emp-002',
        approved_assignment_count: 2,
        snapshot: expect.objectContaining({ totalRegistrations: 2 }),
      }),
    ])
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

  it('shows audit log trigger and edited-cell badge in manager review source', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/schedule/admin/review/page.tsx'), 'utf8')

    expect(source).toContain('Xem log')
    expect(source).toContain('Da sua')
    expect(source).toContain('Lich su thao tac')
  })
})
