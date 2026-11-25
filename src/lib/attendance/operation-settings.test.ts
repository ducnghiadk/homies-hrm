import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_OPERATION_SETTINGS,
  normalizeOperationSettings,
  computePaidMinutes,
  computeLateMinutes,
  isLateBeyondGrace,
  getAvailabilityDeadline,
  isAvailabilityDeadlinePassed,
  pickShiftForTime,
} from './operation-settings.ts'

const att = DEFAULT_OPERATION_SETTINGS.attendance

test('mặc định: không tính đến sớm và ở lại muộn', () => {
  // Ca 17:00-22:00, vào 16:30, ra 22:40 -> chỉ tính 5 tiếng
  const m = computePaidMinutes({ checkInMin: 16 * 60 + 30, checkOutMin: 22 * 60 + 40, shiftStartMin: 17 * 60, shiftEndMin: 22 * 60 }, att)
  assert.equal(m, 300)
})

test('bật tính đến sớm + ở lại muộn có giới hạn', () => {
  const s = { ...att, count_early_arrival: true, count_late_stay: true, late_stay_max_minutes: 30 }
  const m = computePaidMinutes({ checkInMin: 16 * 60 + 30, checkOutMin: 23 * 60, shiftStartMin: 17 * 60, shiftEndMin: 22 * 60 }, s)
  assert.equal(m, 30 + 300 + 30)
})

test('đi trễ vẫn chỉ tính từ lúc vào thật, về sớm tính tới lúc ra thật', () => {
  const m = computePaidMinutes({ checkInMin: 17 * 60 + 20, checkOutMin: 21 * 60 + 30, shiftStartMin: 17 * 60, shiftEndMin: 22 * 60 }, att)
  assert.equal(m, 250)
})

test('làm tròn xuống theo bội số phút', () => {
  const s = { ...att, rounding_minutes: 15 }
  const m = computePaidMinutes({ checkInMin: 17 * 60 + 7, checkOutMin: 22 * 60, shiftStartMin: 17 * 60, shiftEndMin: 22 * 60 }, s)
  assert.equal(m, 285)
})

test('không có ca: tính đúng thời gian thực, ca qua đêm', () => {
  assert.equal(computePaidMinutes({ checkInMin: 22 * 60, checkOutMin: 60 }, att), 180)
  assert.equal(computePaidMinutes({ checkInMin: 22 * 60, checkOutMin: 90, shiftStartMin: 22 * 60, shiftEndMin: 90 }, att), 210)
})

test('đi trễ chỉ tính khi vượt ngưỡng cho phép', () => {
  assert.equal(computeLateMinutes(8 * 60 + 45, 8 * 60 + 30), 15)
  assert.equal(isLateBeyondGrace(15, att), false)
  assert.equal(isLateBeyondGrace(16, att), true)
  assert.equal(computeLateMinutes(8 * 60, 8 * 60 + 30), 0)
})

test('hạn chót lịch rảnh: Thứ 6 18:00 trước tuần', () => {
  const s = { enabled: true, days_before_week_start: 3, time: '18:00' }
  const d = getAvailabilityDeadline('2026-11-30', s)
  assert.equal(d.date, '2026-11-27')
  assert.equal(isAvailabilityDeadlinePassed('2026-11-30', s, new Date('2026-11-27T10:59:00Z')), false)
  assert.equal(isAvailabilityDeadlinePassed('2026-11-30', s, new Date('2026-11-27T11:01:00Z')), true)
  assert.equal(isAvailabilityDeadlinePassed('2026-11-30', { ...s, enabled: false }, new Date('2026-12-01T00:00:00Z')), false)
})

test('chuẩn hóa cài đặt sai kiểu về mặc định', () => {
  const s = normalizeOperationSettings({ attendance: { rounding_minutes: 7, late_grace_minutes: 'abc' }, availability_deadline: { time: '25:00' } })
  assert.equal(s.attendance.rounding_minutes, 0)
  assert.equal(s.attendance.late_grace_minutes, 15)
  assert.equal(s.availability_deadline.time, '22:00')
})

test('chọn ca: ưu tiên lịch chốt, bỏ ca đã chấm xong, chọn ca đang diễn ra', () => {
  const c = [
    { shift_id: 'shift-001', startMin: 510, endMin: 720, source: 'official' as const },
    { shift_id: 'shift-003', startMin: 1020, endMin: 1320, source: 'official' as const },
    { shift_id: 'shift-002', startMin: 720, endMin: 1020, source: 'availability' as const },
  ]
  assert.equal(pickShiftForTime(c, 1000)?.shift_id, 'shift-003')
  assert.equal(pickShiftForTime(c, 600)?.shift_id, 'shift-001')
  assert.equal(pickShiftForTime(c, 600, ['shift-001'])?.shift_id, 'shift-003')
  assert.equal(pickShiftForTime([c[2]], 800)?.shift_id, 'shift-002')
  assert.equal(pickShiftForTime([], 800), null)
})
