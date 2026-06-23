import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrUpdateRegistrationWeek } from '@/lib/mock-data-registration-weeks'
import { clearShiftRegistrations, saveShiftRegistrations } from '@/lib/mock-data-shift-registrations'
import {
  bulkApproveRegistrationsToDraft,
  clearScheduleWeekStore,
  getDraftAssignmentsForWeek,
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
})
