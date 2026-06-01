import { mockAttendances, type Attendance } from '@/lib/mock-data'
import { EmployeeService } from './employee-service'
import { ScheduleService } from './schedule-service'
import { AuthUser } from '@/store/auth-store'

const STORAGE_KEY = 'homies_live_attendance_today'

export class AttendanceService {
  private static getTodayStr(): string {
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Load live check-ins from localStorage for today.
   */
  private static loadLiveCheckins(): Attendance[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as Attendance[]
      const today = this.getTodayStr()
      // Filter out any check-ins from previous days to start fresh
      return parsed.filter(a => a.date === today)
    } catch (e) {
      console.error('Error loading live check-ins', e)
      return []
    }
  }

  /**
   * Save live check-ins to localStorage.
   */
  private static saveLiveCheckins(records: Attendance[]) {
    if (typeof window === 'undefined') return
    try {
      const today = this.getTodayStr()
      const filtered = records.filter(a => a.date === today)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (e) {
      console.error('Error saving live check-ins', e)
    }
  }

  /**
   * Synchronize today's live check-ins into the mockAttendances in-memory store.
   * This ensures that any direct query on mockAttendances will see today's live check-ins.
   */
  static syncLiveCheckinsToMock() {
    const live = this.loadLiveCheckins()
    const today = this.getTodayStr()

    live.forEach(liveRecord => {
      // Find if there is an existing record in mockAttendances for this user and today
      const idx = mockAttendances.findIndex(a => a.employee_id === liveRecord.employee_id && a.date === today)
      if (idx !== -1) {
        // Update the existing record in-place
        mockAttendances[idx] = {
          ...mockAttendances[idx],
          ...liveRecord,
        }
      } else {
        // Otherwise insert it
        mockAttendances.push(liveRecord)
      }
    })
  }

  /**
   * Retrieve today's check-in/attendance record for a user.
   */
  static getTodayCheckin(employeeId: string): Attendance | undefined {
    this.syncLiveCheckinsToMock()
    const live = this.loadLiveCheckins()
    return live.find(a => a.employee_id === employeeId)
  }

  /**
   * Get the live check-in status for an employee.
   */
  static getLiveCheckinStatus(employeeId: string): 'not_checked_in' | 'checked_in' | 'checked_out' {
    const record = this.getTodayCheckin(employeeId)
    if (!record) return 'not_checked_in'
    if (record.check_out_time) return 'checked_out'
    return 'checked_in'
  }

  /**
   * Check in an employee today.
   */
  static checkinToday(
    employeeId: string,
    storeId: string,
    lat: number,
    lng: number,
    distanceMeters: number,
    shiftId?: string,
    shiftStartTime?: string
  ): Attendance {
    const now = new Date()
    const today = this.getTodayStr()
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

    const live = this.loadLiveCheckins()
    let record = live.find(a => a.employee_id === employeeId)

    if (record) {
      // Overwrite/update existing check-in details
      record.check_in_time = checkInTime
      record.check_in_lat = lat
      record.check_in_lng = lng
      record.check_in_distance_meters = distanceMeters
      record.status = status
      record.late_minutes = lateMinutes
      record.check_out_time = undefined // Clear checkout time just in case of re-checkin
    } else {
      record = {
        id: `att-live-${Date.now()}`,
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
      live.push(record)
    }

    this.saveLiveCheckins(live)
    this.syncLiveCheckinsToMock()

    return record
  }

  /**
   * Check out an employee today.
   */
  static checkoutToday(
    employeeId: string,
    lat: number,
    lng: number
  ): Attendance | null {
    const live = this.loadLiveCheckins()
    const record = live.find(a => a.employee_id === employeeId)
    if (!record || !record.check_in_time) return null

    const now = new Date()
    record.check_out_time = now.toISOString()

    // Store checkout position
    record.check_out_lat = lat
    record.check_out_lng = lng

    // Calculate total hours
    const checkIn = new Date(record.check_in_time)
    const diffMs = now.getTime() - checkIn.getTime()
    const totalHours = diffMs / (1000 * 60 * 60)
    record.total_hours = Math.round(totalHours * 100) / 100

    // Overtime: anything over 8 hours
    record.overtime_hours = Math.max(0, Math.round((totalHours - 8) * 100) / 100)

    this.saveLiveCheckins(live)
    this.syncLiveCheckinsToMock()

    return record
  }

  /**
   * Get store attendance view by date (merges employees with attendance records).
   * If an employee doesn't have an attendance record for the date, they are shown as 'absent'.
   */
  static getStoreAttendanceViewByDate(
    storeId: string,
    date: string,
    currentUser: AuthUser
  ): Attendance[] {
    this.syncLiveCheckinsToMock()
    
    // Get all employees of the store using EmployeeService
    const allEmployees = EmployeeService.getEmployees(currentUser)
    // Filter to only get active employees in this specific store, excluding CEOs and HR Admins
    const storeEmployees = allEmployees.filter(
      e => e.store_id === storeId && e.status === 'active' && !['ceo', 'hr_admin'].includes(e.role)
    )

    // Get actual attendance records for this store on this date
    const actualRecords = mockAttendances.filter(
      a => a.store_id === storeId && a.date === date
    )

    // Map each store employee to their record or a synthetic 'absent' record
    return storeEmployees.map(emp => {
      const existing = actualRecords.find(a => a.employee_id === emp.id)
      if (existing) {
        return existing
      }
      
      // Look up schedule for this employee on this date
      const schedules = ScheduleService.getSchedulesForUser(currentUser, emp.id)
      const scheduleOnDate = schedules.find(s => s.date === date)

      // Create a synthetic absent record for this employee
      return {
        id: `att-synth-${emp.id}-${date}`,
        org_id: 'org-001',
        employee_id: emp.id,
        store_id: storeId,
        date,
        status: 'absent' as const,
        shift_id: scheduleOnDate?.shift_id,
        late_minutes: 0,
        total_hours: 0,
        overtime_hours: 0,
      }
    })
  }

  /**
   * Get all store attendances today for a specific store.
   */
  static getStoreAttendancesToday(storeId: string, currentUser: AuthUser): Attendance[] {
    this.syncLiveCheckinsToMock()
    const today = this.getTodayStr()
    return this.getStoreAttendanceViewByDate(storeId, today, currentUser)
  }

  /**
   * Get all attendances for a store on a specific date.
   */
  static getStoreAttendancesByDate(storeId: string, date: string, currentUser?: AuthUser): Attendance[] {
    this.syncLiveCheckinsToMock()
    if (currentUser) {
      return this.getStoreAttendanceViewByDate(storeId, date, currentUser)
    }
    return mockAttendances.filter(a => a.store_id === storeId && a.date === date)
  }

  /**
   * Get all attendance records for a specific employee.
   */
  static getEmployeeAttendances(employeeId: string): Attendance[] {
    this.syncLiveCheckinsToMock()
    return mockAttendances.filter(a => a.employee_id === employeeId)
  }

  /**
   * Get a lightweight summary for a list of attendance records.
   */
  static getAttendanceSummary(records: Attendance[]) {
    return {
      total: records.length,
      on_time: records.filter(a => a.status === 'on_time').length,
      late: records.filter(a => a.status === 'late').length,
      absent: records.filter(a => a.status === 'absent').length,
      leave: records.filter(a => a.status === 'leave').length,
      early: records.filter(a => a.status === 'early').length,
    }
  }
}
