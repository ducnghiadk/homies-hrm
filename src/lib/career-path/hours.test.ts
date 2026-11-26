import test from 'node:test'
import assert from 'node:assert/strict'
import { computeCareerHours, type CareerAttendanceLog } from './hours.ts'

const logs: CareerAttendanceLog[] = [
  { employee_id: 'e1', date: '2026-10-01', total_hours: 5, schedule_source: 'official', off_schedule: false },
  { employee_id: 'e1', date: '2026-10-02', total_hours: 4, schedule_source: 'none', off_schedule: true },
  { employee_id: 'e1', date: '2026-10-03', total_hours: 3, schedule_source: 'none', off_schedule: true, off_schedule_approved_by: 'sm1' },
  { employee_id: 'e1', date: '2026-10-04', total_hours: 2, schedule_source: 'availability', off_schedule: true },
  { employee_id: 'e1', date: '2026-09-01', total_hours: 6 }, // dữ liệu cũ iPOS
  { employee_id: 'e1', date: '2026-10-05', total_hours: 0, schedule_source: 'official' }, // chưa tan ca
  { employee_id: 'e2', date: '2026-10-01', total_hours: 8, schedule_source: 'official' },
]

test('mọi chấm công: giữ đúng cách tính cũ', () => {
  const b = computeCareerHours(logs, 'e1', { source: 'all_attendance', legacy: 'count' })
  assert.equal(b.counted, 20)
})

test('chỉ lịch đã chốt: loại ca ngoài lịch, vẫn tính dữ liệu cũ khi chọn "tính hết"', () => {
  const b = computeCareerHours(logs, 'e1', { source: 'confirmed_schedule', legacy: 'count' })
  assert.equal(b.official, 5)
  assert.equal(b.legacy_counted, 6)
  assert.equal(b.off_schedule_excluded, 9)
  assert.equal(b.counted, 11)
})

test('lịch đã chốt + ca ngoài lịch được duyệt (quản lý ghi nhận hoặc có đơn đã duyệt)', () => {
  const b = computeCareerHours(logs, 'e1', { source: 'confirmed_plus_approved', legacy: 'skip', approvedDates: new Set(['2026-10-04']) })
  assert.equal(b.approved_off_schedule, 5)
  assert.equal(b.off_schedule_excluded, 4)
  assert.equal(b.legacy_excluded, 6)
  assert.equal(b.counted, 10)
})

test('chỉ tính từ ngày xếp bậc đầu tiên khi được chọn', () => {
  const b = computeCareerHours(logs, 'e1', { source: 'all_attendance', legacy: 'count', fromDate: '2026-10-01' })
  assert.equal(b.counted, 14)
})
