import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrUpdateRegistrationWeek } from '@/lib/mock-data-registration-weeks'
import {
  clearShiftRegistrations,
  getShiftRegistrationsForWeek,
  saveShiftRegistrations,
} from '@/lib/mock-data-shift-registrations'

describe('saveShiftRegistrations', () => {
  beforeEach(() => {
    localStorage.clear()
    clearShiftRegistrations()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-23T10:00:00'))
  })

  it('saves one submitted shift per day for an open week', () => {
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
      [
        { date: '2026-06-29', shift_id: 'shift-001' },
        { date: '2026-06-30', shift_id: 'shift-002' },
      ],
      'submitted'
    )

    expect(getShiftRegistrationsForWeek('store-001', '2026-06-29')).toMatchObject([
      { employee_id: 'emp-005', date: '2026-06-29', shift_id: 'shift-001', status: 'submitted' },
      { employee_id: 'emp-005', date: '2026-06-30', shift_id: 'shift-002', status: 'submitted' },
    ])
  })

  it('rejects duplicate same-day registrations', () => {
    createOrUpdateRegistrationWeek({
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: '2026-06-29',
      status: 'open',
      registration_open_date: '2026-06-23',
      registration_deadline: '2026-06-27T23:59',
      created_by: 'emp-002',
    })

    expect(() =>
      saveShiftRegistrations(
        'emp-005',
        'store-001',
        '2026-06-29',
        [
          { date: '2026-06-29', shift_id: 'shift-001' },
          { date: '2026-06-29', shift_id: 'shift-002' },
        ],
        'submitted'
      )
    ).toThrow('Only one shift registration per employee per day is allowed.')
  })
})
