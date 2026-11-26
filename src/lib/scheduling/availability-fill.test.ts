import test from 'node:test'
import assert from 'node:assert/strict'
import { pickFromAvailability } from './availability-fill.ts'

const c = (emp: string, date: string, shift: string, hours = 5) => ({
  key: `${emp}-${date}-${shift}`, employee_id: emp, date, shift_id: shift, hours,
})

test('chỉ lấy đủ số người cần mỗi ca, còn lại vào dự bị', () => {
  const r = pickFromAvailability({
    candidates: [c('a', '2026-11-23', 's1'), c('b', '2026-11-23', 's1'), c('c', '2026-11-23', 's1')],
    capacityByShift: { s1: 2 },
    existingCountBySlot: {},
    existingHoursByEmployee: {},
  })
  assert.equal(r.selected.length, 2)
  assert.equal(r.reserve.length, 1)
})

test('ưu tiên người ít giờ trong tuần', () => {
  const r = pickFromAvailability({
    candidates: [c('a', '2026-11-23', 's1'), c('b', '2026-11-23', 's1')],
    capacityByShift: { s1: 1 },
    existingCountBySlot: {},
    existingHoursByEmployee: { a: 20, b: 5 },
  })
  assert.equal(r.selected[0].employee_id, 'b')
  assert.equal(r.reserve[0].employee_id, 'a')
})

test('chia đều giờ qua các ngày', () => {
  const r = pickFromAvailability({
    candidates: [c('a', '2026-11-23', 's1'), c('b', '2026-11-23', 's1'), c('a', '2026-11-24', 's1'), c('b', '2026-11-24', 's1')],
    capacityByShift: { s1: 1 },
    existingCountBySlot: {},
    existingHoursByEmployee: {},
  })
  assert.deepEqual(r.selected.map((x) => x.employee_id).sort(), ['a', 'b'])
})

test('tính cả người đã có sẵn trong ca và không giới hạn khi chưa đặt số người', () => {
  const r = pickFromAvailability({
    candidates: [c('a', '2026-11-23', 's1'), c('b', '2026-11-23', 's2'), c('c', '2026-11-23', 's2')],
    capacityByShift: { s1: 1 },
    existingCountBySlot: { '2026-11-23|s1': 1 },
    existingHoursByEmployee: {},
  })
  assert.deepEqual(r.selected.map((x) => x.employee_id), ['b', 'c'])
  assert.equal(r.reserve[0].employee_id, 'a')
})
