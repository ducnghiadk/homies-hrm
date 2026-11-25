import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeLatePenalties, type LatePenaltySettings } from './late-penalty.ts'

const base: LatePenaltySettings = {
  mode: 'tiered',
  graceOccurrences: 0,
  fixedAmount: 25000,
  tier1MaxMinutes: 15,
  tier1Amount: 0,
  tier2MaxMinutes: 30,
  tier2Amount: 25000,
  tier3Amount: 60000,
  tier3HalfShiftDeduction: true,
}
const occ = [
  { date: '2026-11-03', minutes: 10 },
  { date: '2026-11-01', minutes: 20 },
  { date: '2026-11-05', minutes: 45 },
]

describe('computeLatePenalties', () => {
  it('bậc thang dùng đúng đơn giá giờ của nhân viên cho bậc 3', () => {
    const r = computeLatePenalties(occ, base, { hourlyRate: 30000, shiftHours: 5, isPartTime: true })
    assert.deepEqual(r.items.map((i) => i.penalty), [25000, 0, 75000])
    assert.equal(r.total, 100000)
    assert.match(r.items[0].tierLabel, /25\.000đ/)
  })

  it('miễn phạt theo thứ tự ngày', () => {
    const r = computeLatePenalties(occ, { ...base, mode: 'fixed', graceOccurrences: 2 }, { hourlyRate: 0, shiftHours: 5, isPartTime: false })
    assert.deepEqual(r.items.map((i) => i.isExempt), [true, true, false])
    assert.equal(r.total, 25000)
  })

  it('chế độ không phạt', () => {
    const r = computeLatePenalties(occ, { ...base, mode: 'none' }, { hourlyRate: 30000, shiftHours: 5, isPartTime: false })
    assert.equal(r.total, 0)
  })

  it('theo phút: full-time bị trừ, part-time mặc định không bị trừ thêm', () => {
    const s = { ...base, mode: 'per_minute' as const, perMinuteMultiplier: 1, perMinuteMaxPerOccurrence: 20000 }
    const ft = computeLatePenalties([{ date: 'a', minutes: 30 }], s, { hourlyRate: 30000, shiftHours: 8, isPartTime: false })
    assert.equal(ft.total, 15000)
    const capped = computeLatePenalties([{ date: 'a', minutes: 60 }], s, { hourlyRate: 30000, shiftHours: 8, isPartTime: false })
    assert.equal(capped.total, 20000)
    const pt = computeLatePenalties([{ date: 'a', minutes: 30 }], s, { hourlyRate: 30000, shiftHours: 8, isPartTime: true })
    assert.equal(pt.total, 0)
    const ptOn = computeLatePenalties([{ date: 'a', minutes: 30 }], { ...s, perMinuteApplyToPartTime: true }, { hourlyRate: 30000, shiftHours: 8, isPartTime: true })
    assert.equal(ptOn.total, 15000)
  })
})
