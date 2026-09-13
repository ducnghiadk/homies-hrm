// ============================================
// Mutable attendance store for Check-in / Check-out
// Separate from mockAttendances (read-only historical data)
// Delegated to AttendanceService for persistence and correctness
// ============================================

import { type Attendance } from './mock-data'
import { AttendanceService } from './services/attendance-service'

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
  return AttendanceService.checkinToday(
    employeeId,
    storeId,
    lat,
    lng,
    distanceMeters,
    shiftId,
    shiftStartTime
  )
}

/**
 * Check out an employee. Updates the existing record.
 */
export function checkoutToday(
  employeeId: string,
  lat: number,
  lng: number,
  shiftId?: string,
): Attendance | null {
  return AttendanceService.checkoutToday(employeeId, lat, lng, shiftId)
}

/**
 * Get today's check-in record for an employee.
 */
export function getTodayCheckin(employeeId: string, shiftId?: string): Attendance | undefined {
  return AttendanceService.getTodayCheckin(employeeId, shiftId)
}

/**
 * Get check-in status for an employee
 */
export type LiveCheckinStatus = 'not_checked_in' | 'checked_in' | 'checked_out'

export function getLiveCheckinStatus(employeeId: string, shiftId?: string): LiveCheckinStatus {
  return AttendanceService.getLiveCheckinStatus(employeeId, shiftId)
}
