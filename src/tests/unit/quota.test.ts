import { describe, it, expect, beforeEach } from 'vitest'
import { saveShiftQuotas, getShiftQuotas, createOrUpdateRegistrationWeek } from '@/lib/mock-data-registration-weeks'

describe('ShiftQuota with position_id', () => {
  beforeEach(() => {
    localStorage.clear()
    // Create a registration week first
    createOrUpdateRegistrationWeek({
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: '2026-06-22',
      status: 'open',
      registration_open_date: '2026-06-15',
      registration_deadline: '2026-06-19T23:59',
      created_by: 'emp-002',
    })
  })

  it('should save and retrieve quota with position_id', () => {
    const week = (globalThis as any).__registrationWeeks?.find((w: any) => w.week_start_date === '2026-06-22')
    const weekId = week?.id || 'reg-week-next-week'

    const quotas = [{
      registration_week_id: weekId,
      shift_id: 'shift-001',
      date: '2026-06-22',
      position_id: 'pos-001',  // pha chế
      min_staff: 1,
      max_staff: 2,
      notes: ''
    }]
    saveShiftQuotas(weekId, quotas)
    const retrieved = getShiftQuotas(weekId)
    expect(retrieved[0].position_id).toBe('pos-001')
  })

  it('should save quota WITHOUT position_id (for all positions)', () => {
    const week = (globalThis as any).__registrationWeeks?.find((w: any) => w.week_start_date === '2026-06-22')
    const weekId = week?.id || 'reg-week-next-week'

    const quotas = [{
      registration_week_id: weekId,
      shift_id: 'shift-001',
      date: '2026-06-23',
      position_id: undefined,  // for all positions
      min_staff: 1,
      max_staff: 3,
      notes: ''
    }]
    saveShiftQuotas(weekId, quotas)
    const retrieved = getShiftQuotas(weekId)
    const quota = retrieved.find((q: any) => q.date === '2026-06-23')
    expect(quota).toBeDefined()
    expect(quota.position_id).toBeUndefined()
  })

  it('should save multiple quotas with different positions for same shift/day', () => {
    const week = (globalThis as any).__registrationWeeks?.find((w: any) => w.week_start_date === '2026-06-22')
    const weekId = week?.id || 'reg-week-next-week'

    const quotas = [
      {
        registration_week_id: weekId,
        shift_id: 'shift-001',
        date: '2026-06-22',
        position_id: 'pos-001',  // pha chế: need 2
        min_staff: 1,
        max_staff: 2,
        notes: 'Pha chế ca sáng'
      },
      {
        registration_week_id: weekId,
        shift_id: 'shift-001',
        date: '2026-06-22',
        position_id: 'pos-002',  // thu ngân: need 1
        min_staff: 1,
        max_staff: 1,
        notes: 'Thu ngân ca sáng'
      },
    ]
    saveShiftQuotas(weekId, quotas)
    const retrieved = getShiftQuotas(weekId)
    const dayQuota = retrieved.filter((q: any) => q.date === '2026-06-22' && q.shift_id === 'shift-001')
    expect(dayQuota.length).toBeGreaterThanOrEqual(2)
    const phaChe = dayQuota.find((q: any) => q.position_id === 'pos-001')
    const thuNgan = dayQuota.find((q: any) => q.position_id === 'pos-002')
    expect(phaChe).toBeDefined()
    expect(thuNgan).toBeDefined()
    expect(phaChe.max_staff).toBe(2)
    expect(thuNgan.max_staff).toBe(1)
  })
})
