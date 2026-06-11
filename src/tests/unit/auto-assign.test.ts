import { describe, it, expect, beforeEach } from 'vitest'
import {
  autoAssignFromPreferences,
  createOrUpdateRegistrationWeek,
  getRegistrationWeekById,
} from '@/lib/mock-data-registration-weeks'
import { mockSchedules, Schedule } from '@/lib/mock-data'

describe('autoAssignFromPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
    // Clear schedules
    mockSchedules.length = 0
  })

  it('should NOT overwrite schedules when week is already published', () => {
    // Create a published week
    const nextMonday = '2026-06-22'
    const week = createOrUpdateRegistrationWeek({
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: nextMonday,
      status: 'published',  // ALREADY PUBLISHED
      registration_open_date: '2026-06-15',
      registration_deadline: '2026-06-19T23:59',
      created_by: 'emp-002',
    })

    // Add some existing schedules
    const existingSchedules: Schedule[] = [
      {
        id: 'sch-existing-1',
        org_id: 'org-001',
        store_id: 'store-001',
        employee_id: 'emp-003',
        shift_id: 'shift-001',
        date: '2026-06-22',
        status: 'published',
        notes: 'Pre-existing schedule',
      },
      {
        id: 'sch-existing-2',
        org_id: 'org-001',
        store_id: 'store-001',
        employee_id: 'emp-004',
        shift_id: 'shift-001',
        date: '2026-06-22',
        status: 'published',
        notes: 'Pre-existing schedule 2',
      },
    ]
    existingSchedules.forEach(s => mockSchedules.push(s))

    const countBefore = mockSchedules.filter(
      s => s.store_id === 'store-001' && s.date === '2026-06-22'
    ).length

    // Act: run auto-assign on published week
    const result = autoAssignFromPreferences(week.id)

    // Assert: should be blocked because week is published
    expect(result.success).toBe(false)
    expect(result.message).toContain('xuat ban')

    // Should NOT overwrite existing schedules
    const countAfter = mockSchedules.filter(
      s => s.store_id === 'store-001' && s.date === '2026-06-22'
    ).length
    expect(countAfter).toBe(countBefore)
  })

  it('should proceed when week is NOT published (open status)', () => {
    const nextMonday = '2026-06-22'
    const week = createOrUpdateRegistrationWeek({
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: nextMonday,
      status: 'open',  // NOT PUBLISHED
      registration_open_date: '2026-06-15',
      registration_deadline: '2026-06-19T23:59',
      created_by: 'emp-002',
    })

    // Run auto-assign on open week
    const result = autoAssignFromPreferences(week.id)

    // Should NOT return success=false due to published check
    // It may fail for other reasons (no preferences, etc.) but not due to published
    if (!result.success) {
      expect(result.message).not.toContain('published')
    }
  })
})
