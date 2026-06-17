import { describe, expect, it } from 'vitest'

import { getWeekDates, plusDays, resolveSchedulesQuery } from '@/app/schedules/schedules-query'

describe('schedules query helpers', () => {
  it('canonicalizes explicit weekStart and selectedDate into monday-based search params', () => {
    const params = new URLSearchParams('weekStart=2026-06-24&selectedDate=2026-06-25&storeId=store-001')

    expect(resolveSchedulesQuery(params)).toMatchObject({
      weekStart: '2026-06-22',
      selectedDate: '2026-06-25',
      storeId: 'store-001',
      canonicalSearch: 'weekStart=2026-06-22&selectedDate=2026-06-25&storeId=store-001',
    })
  })

  it('falls back from legacy date param and expands seven week dates', () => {
    const params = new URLSearchParams('date=2026-06-28')

    expect(resolveSchedulesQuery(params)).toMatchObject({
      weekStart: '2026-06-22',
      selectedDate: '2026-06-28',
      canonicalSearch: 'weekStart=2026-06-22&selectedDate=2026-06-28',
    })
    expect(getWeekDates('2026-06-22')).toEqual([
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
      '2026-06-25',
      '2026-06-26',
      '2026-06-27',
      '2026-06-28',
    ])
    expect(plusDays('2026-06-22', 7)).toBe('2026-06-29')
  })
})
