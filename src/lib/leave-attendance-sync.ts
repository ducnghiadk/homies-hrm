// =============================================
// HRM Trà Sữa 🧋 — Leave ↔ Attendance Sync
// Approve leave → create attendance records
// Cancel leave → remove attendance records
// Check-in → validate no active leave
// =============================================

import { type Attendance, mockAttendances, getEmployeeById } from './mock-data'

let leaveAttIdCounter = 900

// ─── Helper: get business days between two dates ───

function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const day = current.getDay()
    // Include all days (business days check can be added later)
    if (day !== 0) { // Skip Sunday only (milk tea shops work Saturdays)
      dates.push(current.toISOString().split('T')[0])
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// ─── Hàm 1: Tạo attendance records khi approve leave ───

export function createLeaveAttendanceRecords(
  employeeId: string,
  startDate: string,
  endDate: string,
  leaveRequestId: string,
  leaveType: string,
  isHalfDay: boolean = false,
  _halfDayPeriod?: 'morning' | 'afternoon',
): Attendance[] {
  const employee = getEmployeeById(employeeId)
  const storeId = employee?.store_id || 'store-001'

  const dates = getDatesBetween(startDate, endDate)
  const created: Attendance[] = []

  for (const date of dates) {
    // Check if leave attendance already exists for this date+employee
    const existing = mockAttendances.find(
      a => a.employee_id === employeeId && a.date === date && a.status === 'leave'
    )
    if (existing) continue

    const record: Attendance = {
      id: `att-leave-${leaveAttIdCounter++}`,
      org_id: 'org-001',
      employee_id: employeeId,
      store_id: storeId,
      date,
      status: 'leave',
      leave_request_id: leaveRequestId,
      leave_type: leaveType,
      late_minutes: 0,
      total_hours: isHalfDay ? 4 : 8,
      overtime_hours: 0,
    }

    mockAttendances.push(record)
    created.push(record)
  }

  return created
}

// ─── Hàm 2: Xóa attendance records khi cancel/reject leave ───

export function removeLeaveAttendanceRecords(leaveRequestId: string): number {
  let removed = 0
  for (let i = mockAttendances.length - 1; i >= 0; i--) {
    if (
      mockAttendances[i].status === 'leave' &&
      mockAttendances[i].leave_request_id === leaveRequestId
    ) {
      mockAttendances.splice(i, 1)
      removed++
    }
  }
  return removed
}

// ─── Hàm 3: Check xem employee có đang leave không ───

export function isEmployeeOnLeave(
  employeeId: string,
  date: string,
): { onLeave: boolean; leaveType?: string; leaveRequestId?: string } {
  const record = mockAttendances.find(
    a => a.employee_id === employeeId && a.date === date && a.status === 'leave'
  )

  if (record) {
    return {
      onLeave: true,
      leaveType: record.leave_type,
      leaveRequestId: record.leave_request_id,
    }
  }
  return { onLeave: false }
}

// ─── Hàm 4: Attendance summary including leave days ───

export function getAttendanceSummary(
  employeeId: string,
  monthPrefix: string, // e.g. '2026-02'
): {
  workDays: number
  leaveDays: number
  absentDays: number
  lateDays: number
  totalHours: number
} {
  const records = mockAttendances.filter(
    a => a.employee_id === employeeId && a.date.startsWith(monthPrefix)
  )

  return {
    workDays: records.filter(r => r.status === 'on_time' || r.status === 'late' || r.status === 'early').length,
    leaveDays: records.filter(r => r.status === 'leave').length,
    absentDays: records.filter(r => r.status === 'absent').length,
    lateDays: records.filter(r => r.status === 'late').length,
    totalHours: records.reduce((sum, r) => sum + r.total_hours, 0),
  }
}
