import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildStoreToday, type TodaySchedule } from './store-today.ts'

const timing = (s: TodaySchedule) =>
  s.shift_id === 'morning'
    ? { name: 'Ca sáng', timeRange: '08:30 - 12:00', startMinutes: 510 }
    : { name: 'Ca tối', timeRange: '17:00 - 22:00', startMinutes: 1020 }

const base = {
  isWeekPublished: true,
  isNextWeekPublished: true,
  weekday: 2,
  pendingRequests: [],
  getTiming: timing,
}

test('đánh dấu vắng khi quá giờ vào ca mà chưa chấm công', () => {
  const r = buildStoreToday({
    ...base,
    nowMinutes: 600,
    schedules: [
      { id: 's1', employee_id: 'a', employee_name: 'An', shift_id: 'morning' },
      { id: 's2', employee_id: 'b', employee_name: 'Bình', shift_id: 'evening' },
    ],
    attendance: [],
  })
  assert.equal(r.roster[0].status, 'absent')
  assert.equal(r.roster[1].status, 'not_yet')
  assert.equal(r.counts.absent, 1)
  assert.equal(r.tasks[0].id, 'absent')
})

test('đi trễ và đã vào ca được nhận ra theo chấm công', () => {
  const r = buildStoreToday({
    ...base,
    nowMinutes: 600,
    schedules: [
      { id: 's1', employee_id: 'a', shift_id: 'morning' },
      { id: 's2', employee_id: 'c', shift_id: 'morning' },
    ],
    attendance: [
      { employee_id: 'a', shift_id: 'morning', check_in_time: '08:45', late_minutes: 15 },
      { employee_id: 'c', shift_id: 'morning', check_in_time: '08:20', late_minutes: 0 },
    ],
  })
  assert.deepEqual(r.roster.map((x) => x.status).sort(), ['checked_in', 'late'])
  assert.equal(r.counts.checkedIn, 2)
  assert.equal(r.tasks[0].id, 'all-good')
})

test('nhắc chốt lịch, đơn chờ duyệt và chấm công ngoài lịch', () => {
  const r = buildStoreToday({
    ...base,
    isWeekPublished: false,
    isNextWeekPublished: false,
    weekday: 5,
    nowMinutes: 300,
    pendingRequests: [{ id: 'r1' }, { id: 'r2' }],
    schedules: [],
    attendance: [{ employee_id: 'x', check_in_time: '07:00', off_schedule: true }],
  })
  assert.deepEqual(r.tasks.map((t) => t.id), ['week-unpublished', 'requests', 'off-schedule', 'next-week'])
})

test('đầu tuần không nhắc lịch tuần sau', () => {
  const r = buildStoreToday({ ...base, isNextWeekPublished: false, weekday: 1, nowMinutes: 300, schedules: [], attendance: [] })
  assert.equal(r.tasks.some((t) => t.id === 'next-week'), false)
})
