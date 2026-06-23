import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrUpdateRegistrationWeek } from '@/lib/mock-data-registration-weeks'
import {
  clearShiftRegistrations,
  getEmployeeShiftRegistrationsForWeek,
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

  it('replaces prior employee registrations for same week when user resubmits', () => {
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
      'draft'
    )
    saveShiftRegistrations(
      'emp-005',
      'store-001',
      '2026-06-29',
      [{ date: '2026-06-29', shift_id: 'shift-003' }],
      'submitted'
    )

    expect(
      getShiftRegistrationsForWeek('store-001', '2026-06-29').filter(
        (row) => row.employee_id === 'emp-005'
      )
    ).toMatchObject([{ date: '2026-06-29', shift_id: 'shift-003', status: 'submitted' }])
  })

  it('returns employee registrations for week sorted by date for screen prefill', () => {
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
        { date: '2026-07-01', shift_id: 'shift-003' },
        { date: '2026-06-29', shift_id: 'shift-001' },
      ],
      'submitted'
    )

    expect(getEmployeeShiftRegistrationsForWeek('emp-005', '2026-06-29')).toMatchObject([
      { date: '2026-06-29', shift_id: 'shift-001' },
      { date: '2026-07-01', shift_id: 'shift-003' },
    ])
  })
})
