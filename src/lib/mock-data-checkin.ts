// ============================================
// Mutable attendance store for Check-in / Check-out
// Separate from mockAttendances (read-only historical data)
// ============================================

import { type Attendance } from './mock-data'

// In-memory store for today's check-in records
const todayCheckins: Map<string, Attendance> = new Map()

let idCounter = 1000

/**
 * Check in an employee. Creates a new attendance record.
 */
export function checkinToday(
  employeeId: string,
  storeId: string,
  lat: number,
  lng: number,
  distanceMeters: number,
  shiftId?: string,
  shiftStartTime?: string, // e.g. '08:00'
): Attendance {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const checkInTime = now.toISOString()

  // Determine if late
  let status: 'on_time' | 'late' = 'on_time'
  let lateMinutes = 0

  if (shiftStartTime) {
    const [h, m] = shiftStartTime.split(':').map(Number)
    const shiftStart = new Date(now)
    shiftStart.setHours(h, m, 0, 0)
    const diffMs = now.getTime() - shiftStart.getTime()
    if (diffMs > 0) {
      lateMinutes = Math.floor(diffMs / 60000)
      if (lateMinutes > 0) status = 'late'
    }
  }

  const record: Attendance = {
    id: `att-live-${idCounter++}`,
    org_id: 'org-001',
    employee_id: employeeId,
    store_id: storeId,
    shift_id: shiftId,
    date: today,
    check_in_time: checkInTime,
    check_in_lat: lat,
    check_in_lng: lng,
    check_in_distance_meters: distanceMeters,
    status,
    late_minutes: lateMinutes,
    total_hours: 0,
    overtime_hours: 0,
  }

  todayCheckins.set(employeeId, record)
  return record
}

/**
 * Check out an employee. Updates the existing record.
 */
export function checkoutToday(
  employeeId: string,
  lat: number,
  lng: number,
): Attendance | null {
  const record = todayCheckins.get(employeeId)
  if (!record || !record.check_in_time) return null

  const now = new Date()
  record.check_out_time = now.toISOString()

  // Store checkout position (extend Attendance type as needed)
  ;(record as Record<string, unknown>).check_out_lat = lat
  ;(record as Record<string, unknown>).check_out_lng = lng

  // Calculate total hours
  const checkIn = new Date(record.check_in_time)
  const diffMs = now.getTime() - checkIn.getTime()
  const totalHours = diffMs / (1000 * 60 * 60)
  record.total_hours = Math.round(totalHours * 100) / 100

  // Overtime: anything over 8 hours
  record.overtime_hours = Math.max(0, Math.round((totalHours - 8) * 100) / 100)

  return record
}

/**
 * Get today's check-in record for an employee.
 */
export function getTodayCheckin(employeeId: string): Attendance | undefined {
  return todayCheckins.get(employeeId)
}

/**
 * Get check-in status for an employee
 */
export type LiveCheckinStatus = 'not_checked_in' | 'checked_in' | 'checked_out'

export function getLiveCheckinStatus(employeeId: string): LiveCheckinStatus {
  const record = todayCheckins.get(employeeId)
  if (!record) return 'not_checked_in'
  if (record.check_out_time) return 'checked_out'
  return 'checked_in'
}
