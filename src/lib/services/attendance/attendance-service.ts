import { mockAttendances, type Attendance } from '@/lib/mock-data'
import { EmployeeService } from '../employees/employee-service'
import { ScheduleService } from '../scheduling/schedule-service'
import { AuthUser } from '@/store/auth-store'
import { attendanceAdapter, type AttendanceDbStatus, type AttendanceRecord } from '@/lib/adapters/attendance-adapter'
import { isRealDbMode } from '@/lib/adapters/repository-config'
import { getActivePayrollPolicy } from '../payroll/payroll-policy-service'

const STORAGE_KEY = 'homies_live_attendance_today'
const TIMESHEET_STORAGE_KEY = 'homies_timesheet_data'

type PersistedTimesheetSlot = {
  id?: unknown
  status?: unknown
  actualIn?: unknown
  actualOut?: unknown
  totalHours?: unknown
  lateMinutes?: unknown
  overtimeHours?: unknown
  isOvertime?: unknown
  isEdited?: unknown
  leaveType?: unknown
  shiftId?: unknown
  storeId?: unknown
}

const REMOTE_HYDRATION_KEYS = new Set<string>()

export type AttendancePersistStatus = 'da_luu_db' | 'chi_luu_may' | 'that_bai'

export type AttendancePersistResult = {
  record: Attendance | null
  trangThai: AttendancePersistStatus
  loi?: string
}

type AttendanceCheckMethod = 'gps' | 'wifi' | 'thu_cong' | 'qr'
type PersistMode = {
  waitForDb: true
  phuongThucCheckIn?: AttendanceCheckMethod
  ghiChuViTri?: string
}

export type PayrollAttendanceRecord = Attendance & {
  trang_thai_db?: AttendanceDbStatus
  soCaChoDuyet?: boolean
  chuaCheckOut?: boolean
}

function mapLocalStatusToDb(status: Attendance['status']): AttendanceDbStatus {
  if (status === 'late') return 'di_muon'
  if (status === 'early') return 've_som'
  if (status === 'absent') return 'vang_mat'
  if (status === 'on_time') return 'dung_gio'
  return 'cho_duyet'
}

function mapDbStatusToLocal(status: string): Attendance['status'] {
  if (status === 'di_muon') return 'late'
  if (status === 've_som') return 'early'
  if (status === 'vang_mat') return 'absent'
  if (status === 'dung_gio') return 'on_time'
  return 'on_time'
}

function mapPayrollDbStatus(status: string): Attendance['status'] | 'cho_duyet' {
  if (status === 'dung_gio') return 'on_time'
  if (status === 'di_muon') return 'late'
  if (status === 've_som') return 'early'
  if (status === 'vang_mat') return 'absent'
  return 'cho_duyet'
}

function buildAttendanceNote(meta: { distanceMeters?: number; wifi?: string; device?: string }): string {
  return JSON.stringify({
    khoang_cach_m: meta.distanceMeters,
    wifi: meta.wifi,
    thiet_bi: meta.device,
  })
}

function getDeviceInfo(): string | undefined {
  if (typeof navigator === 'undefined') return undefined
  return navigator.userAgent
}

function remoteRecordToAttendance(record: AttendanceRecord, fallbackEmployeeId?: string, fallbackStoreId?: string): Attendance {
  return {
    id: record.id,
    org_id: 'org-001',
    employee_id: fallbackEmployeeId || record.employee_id,
    store_id: fallbackStoreId || record.store_id,
    shift_id: record.shift_id,
    date: record.date,
    check_in_time: record.check_in_time,
    check_out_time: record.check_out_time,
    check_in_lat: record.check_in_lat,
    check_in_lng: record.check_in_lng,
    check_out_lat: record.check_out_lat,
    check_out_lng: record.check_out_lng,
    status: mapDbStatusToLocal(record.status),
    late_minutes: record.late_minutes,
    total_hours: record.total_hours || 0,
    overtime_hours: record.overtime_hours || 0,
  }
}

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

  private static upsertLiveCheckin(record: Attendance) {
    const live = this.loadLiveCheckins()
    const idx = live.findIndex(item =>
      item.employee_id === record.employee_id &&
      item.date === record.date &&
      (!record.shift_id || item.shift_id === record.shift_id)
    )

    if (idx === -1) {
      live.push(record)
    } else {
      live[idx] = { ...live[idx], ...record }
    }

    this.saveLiveCheckins(live)
    this.syncLiveCheckinsToMock()
  }

  private static hydrateTodayFromRemote(employeeId: string, shiftId?: string) {
    const today = this.getTodayStr()
    const hydrationKey = `${employeeId}:${today}:${shiftId || '*'}`
    if (REMOTE_HYDRATION_KEYS.has(hydrationKey)) return
    REMOTE_HYDRATION_KEYS.add(hydrationKey)

    void attendanceAdapter.getCheckinHomNay(employeeId, today)
      .then(record => {
        if (!record) return
        const local = remoteRecordToAttendance(record, employeeId)
        this.upsertLiveCheckin(local)
      })
      .catch(error => {
        console.warn('[AttendanceService] Supabase check-in read fallback to localStorage:', error)
      })
      .finally(() => {
        REMOTE_HYDRATION_KEYS.delete(hydrationKey)
      })
  }

  private static shouldSaveLocalOnly(): boolean {
    return !isRealDbMode() || (typeof navigator !== 'undefined' && navigator.onLine === false)
  }

  private static async persistCheckinToRemote(record: Attendance, distanceMeters: number, mode?: PersistMode): Promise<AttendancePersistResult> {
    if (this.shouldSaveLocalOnly()) {
      return { record, trangThai: 'chi_luu_may' }
    }

    try {
      const phuongThucCheckIn = mode?.phuongThucCheckIn || 'gps'
      const trangThaiCheckIn: AttendanceDbStatus = phuongThucCheckIn === 'gps' ? 'dung_gio' : 'cho_duyet'
      const result = await attendanceAdapter.checkIn({
        nhanVienId: record.employee_id,
        cuaHangId: record.store_id,
        ngay: record.date,
        thoiGianCheckIn: record.check_in_time || new Date().toISOString(),
        viDoCheckIn: record.check_in_lat,
        kinhDoCheckIn: record.check_in_lng,
        phuongThucCheckIn,
        trangThai: trangThaiCheckIn,
        phutDiMuon: record.late_minutes,
        ghiChu: mode?.ghiChuViTri || buildAttendanceNote({
          distanceMeters,
          device: getDeviceInfo(),
        }),
      })

      if (result.ok) {
        if (result.id) {
          this.upsertLiveCheckin({ ...record, id: result.id })
          return { record: { ...record, id: result.id }, trangThai: 'da_luu_db' }
        }
        return { record, trangThai: 'da_luu_db' }
      }

      if (result.loi === 'DA_CHECK_IN') {
        this.hydrateTodayFromRemote(record.employee_id, record.shift_id)
        return { record, trangThai: 'da_luu_db' }
      }

      return { record, trangThai: 'that_bai', loi: result.loi || 'LOI_DB' }
    } catch (error) {
      console.warn('[AttendanceService] Supabase check-in write fallback to localStorage:', error)
      return { record, trangThai: 'that_bai', loi: error instanceof Error ? error.message : 'LOI_MANG' }
    }
  }

  private static async persistCheckoutToRemote(record: Attendance, mode?: PersistMode): Promise<AttendancePersistResult> {
    if (!record.check_out_time) return { record, trangThai: 'that_bai', loi: 'THIEU_GIO_CHECK_OUT' }
    if (this.shouldSaveLocalOnly()) {
      return { record, trangThai: 'chi_luu_may' }
    }

    try {
      const result = await attendanceAdapter.checkOut({
        nhanVienId: record.employee_id,
        ngay: record.date,
        thoiGianCheckOut: record.check_out_time,
        viDoCheckOut: record.check_out_lat,
        kinhDoCheckOut: record.check_out_lng,
        soGioTangCa: record.overtime_hours,
        ghiChu: mode?.ghiChuViTri || buildAttendanceNote({
          distanceMeters: record.check_in_distance_meters,
          device: getDeviceInfo(),
        }),
      })

      if (result.ok) return { record, trangThai: 'da_luu_db' }

      if (!result.ok && result.loi === 'CHUA_CHECK_IN') {
        return { record, trangThai: 'that_bai', loi: result.loi }
      }

      return { record, trangThai: 'that_bai', loi: result.loi || 'LOI_DB' }
    } catch (error) {
      console.warn('[AttendanceService] Supabase check-out write fallback to localStorage:', error)
      return { record, trangThai: 'that_bai', loi: error instanceof Error ? error.message : 'LOI_MANG' }
    }
  }

  private static loadPersistedTimesheetRecords(): Attendance[] {
    if (typeof window === 'undefined') return []

    try {
      const raw = localStorage.getItem(TIMESHEET_STORAGE_KEY)
      if (!raw) return []

      const parsed = JSON.parse(raw) as Record<string, Record<string, PersistedTimesheetSlot[]>>
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []

      const records: Attendance[] = []
      Object.entries(parsed).forEach(([employeeId, days]) => {
        if (!days || typeof days !== 'object' || Array.isArray(days)) return

        Object.entries(days).forEach(([date, slots]) => {
          if (!Array.isArray(slots)) return

          slots.forEach((slot, index) => {
            if (!slot || typeof slot !== 'object') return

            const actualIn = typeof slot.actualIn === 'string' && slot.actualIn.trim() ? slot.actualIn : undefined
            const actualOut = typeof slot.actualOut === 'string' && slot.actualOut.trim() ? slot.actualOut : undefined
            const hasWorkEvidence = Boolean(actualIn || actualOut || slot.isEdited === true)
            if (!hasWorkEvidence) return

            const status = slot.status === 'late'
              ? 'late'
              : slot.status === 'early'
                ? 'early'
                : slot.status === 'leave'
                  ? 'leave'
                  : 'on_time'
            const totalHours = typeof slot.totalHours === 'number' && Number.isFinite(slot.totalHours)
              ? Math.max(0, slot.totalHours)
              : 0
            const overtimeHours = typeof slot.overtimeHours === 'number' && Number.isFinite(slot.overtimeHours)
              ? Math.max(0, slot.overtimeHours)
              : slot.isOvertime === true ? totalHours : 0
            const employee = EmployeeService.getEmployeeById(employeeId)

            records.push({
              id: `att-timesheet-${employeeId}-${date}-${String(slot.id || index)}`,
              org_id: 'org-001',
              employee_id: employeeId,
              store_id: typeof slot.storeId === 'string' ? slot.storeId : employee?.store_id || '',
              shift_id: typeof slot.shiftId === 'string' ? slot.shiftId : undefined,
              date,
              check_in_time: actualIn,
              check_out_time: actualOut,
              status,
              leave_type: typeof slot.leaveType === 'string' ? slot.leaveType : undefined,
              late_minutes: typeof slot.lateMinutes === 'number' && Number.isFinite(slot.lateMinutes) ? Math.max(0, slot.lateMinutes) : 0,
              total_hours: totalHours,
              overtime_hours: overtimeHours,
            })
          })
        })
      })

      return records
    } catch (error) {
      console.warn('Error loading persisted timesheet records', error)
      return []
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
      const idx = mockAttendances.findIndex(a =>
        a.employee_id === liveRecord.employee_id &&
        a.date === today &&
        a.shift_id === liveRecord.shift_id
      )
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
  static getTodayCheckin(employeeId: string, shiftId?: string): Attendance | undefined {
    this.syncLiveCheckinsToMock()
    this.hydrateTodayFromRemote(employeeId, shiftId)
    const live = this.loadLiveCheckins()
    const exactShift = live.find(a => a.employee_id === employeeId && (!shiftId || a.shift_id === shiftId))
    return exactShift || live.find(a => a.employee_id === employeeId && a.date === this.getTodayStr())
  }

  /**
   * Get the live check-in status for an employee.
   */
  static getLiveCheckinStatus(employeeId: string, shiftId?: string): 'not_checked_in' | 'checked_in' | 'checked_out' {
    const record = this.getTodayCheckin(employeeId, shiftId)
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
    lat: number | undefined,
    lng: number | undefined,
    distanceMeters: number,
    shiftId: string | undefined,
    shiftStartTime: string | undefined,
    mode: PersistMode
  ): Promise<AttendancePersistResult>
  static checkinToday(
    employeeId: string,
    storeId: string,
    lat: number | undefined,
    lng: number | undefined,
    distanceMeters: number,
    shiftId?: string,
    shiftStartTime?: string
  ): Attendance
  static checkinToday(
    employeeId: string,
    storeId: string,
    lat: number | undefined,
    lng: number | undefined,
    distanceMeters: number,
    shiftId?: string,
    shiftStartTime?: string,
    mode?: PersistMode
  ): Attendance | Promise<AttendancePersistResult> {
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
    let record = live.find(a =>
      a.employee_id === employeeId &&
      a.date === today &&
      a.shift_id === shiftId
    )

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

    if (mode?.waitForDb) {
      return this.persistCheckinToRemote(record, distanceMeters, mode)
    }

    return record
  }

  /**
   * Check out an employee today.
   */
  static checkoutToday(
    employeeId: string,
    lat: number | undefined,
    lng: number | undefined,
    shiftId: string | undefined,
    mode: PersistMode
  ): Promise<AttendancePersistResult>
  static checkoutToday(
    employeeId: string,
    lat: number | undefined,
    lng: number | undefined,
    shiftId?: string
  ): Attendance | null
  static checkoutToday(
    employeeId: string,
    lat: number | undefined,
    lng: number | undefined,
    shiftId?: string,
    mode?: PersistMode
  ): Attendance | null | Promise<AttendancePersistResult> {
    const live = this.loadLiveCheckins()
    const record = live.find(a =>
      a.employee_id === employeeId &&
      a.date === this.getTodayStr() &&
      (!shiftId || a.shift_id === shiftId) &&
      !a.check_out_time
    ) || live.find(a =>
      a.employee_id === employeeId &&
      a.date === this.getTodayStr() &&
      !a.check_out_time
    )
    if (!record || !record.check_in_time) {
      if (mode?.waitForDb) {
        return Promise.resolve({ record: null, trangThai: 'that_bai', loi: 'CHUA_CHECK_IN_LOCAL' })
      }
      return null
    }

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

    const policy = getActivePayrollPolicy()
    const standardHours = (typeof policy.standardHoursPerDay === 'number' && policy.standardHoursPerDay > 0)
      ? policy.standardHoursPerDay
      : 8

    // Overtime: anything over standard hours
    record.overtime_hours = Math.max(0, Math.round((totalHours - standardHours) * 100) / 100)

    this.saveLiveCheckins(live)
    this.syncLiveCheckinsToMock()

    if (mode?.waitForDb) {
      return this.persistCheckoutToRemote(record, mode)
    }

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
      (e: AuthUser) => e.store_id === storeId && e.status === 'active' && !['ceo', 'hr_admin'].includes(e.role)
    )

    // Get actual attendance records for this store on this date
    const actualRecords = mockAttendances.filter(
      a => a.store_id === storeId && a.date === date
    )

    // Map each store employee to their record or a synthetic 'absent' record
    return storeEmployees.map((emp: AuthUser) => {
      const existing = actualRecords.find(a => a.employee_id === emp.id)
      if (existing) {
        return existing
      }
      
      // Look up schedule for this employee on this date
      const schedules = ScheduleService.getPublishedSchedulesForStore(currentUser, storeId, [date])
        .filter(schedule => schedule.employee_id === emp.id)
      const scheduleOnDate = schedules.find((s: { date: string; shift_id?: string }) => s.date === date)

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

  static getLocalAttendanceRecordsForPeriod(periodStart: string, periodEnd: string, employeeId?: string): Attendance[] {
    this.syncLiveCheckinsToMock()

    const inPeriod = (record: Attendance) =>
      record.date >= periodStart && record.date <= periodEnd && (!employeeId || record.employee_id === employeeId)
    const merged = mockAttendances.filter(inPeriod).map(record => ({ ...record }))

    this.loadPersistedTimesheetRecords().filter(inPeriod).forEach(timesheetRecord => {
      const sameDay = merged.filter(record =>
        record.employee_id === timesheetRecord.employee_id && record.date === timesheetRecord.date
      )
      const matchIndex = merged.findIndex(record =>
        record.employee_id === timesheetRecord.employee_id &&
        record.date === timesheetRecord.date &&
        ((record.shift_id && timesheetRecord.shift_id && record.shift_id === timesheetRecord.shift_id) ||
          (!record.shift_id && !timesheetRecord.shift_id && sameDay.length === 1))
      )

      if (matchIndex === -1) {
        merged.push(timesheetRecord)
      } else {
        merged[matchIndex] = { ...merged[matchIndex], ...timesheetRecord }
      }
    })

    return merged
  }

  /**
   * Read the same attendance sources used by the timesheet before payroll runs.
   * Manager corrections/imports override one matching attendance record instead of duplicating it.
   */
  static async getAttendanceRecordsForPeriod(periodStart: string, periodEnd: string, employeeId?: string): Promise<PayrollAttendanceRecord[]> {
    if (!isRealDbMode()) return this.getLocalAttendanceRecordsForPeriod(periodStart, periodEnd, employeeId)

    const result = await attendanceAdapter.getAttendanceByPeriod(periodStart, periodEnd, employeeId)
    if (result.coLoi) return this.getLocalAttendanceRecordsForPeriod(periodStart, periodEnd, employeeId)

    return result.records.map(record => {
      const dbStatus = record.status as AttendanceDbStatus
      const payrollStatus = mapPayrollDbStatus(record.status)
      const isPending = payrollStatus === 'cho_duyet'
      const isOpenShift = !record.check_out_time && (isPending || payrollStatus === 'on_time' || payrollStatus === 'late' || payrollStatus === 'early')
      const countable = !isPending && !isOpenShift

      return {
        id: record.id,
        org_id: 'org-001',
        employee_id: record.employee_id,
        store_id: record.store_id,
        shift_id: record.shift_id,
        date: record.date,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        check_in_lat: record.check_in_lat,
        check_in_lng: record.check_in_lng,
        check_out_lat: record.check_out_lat,
        check_out_lng: record.check_out_lng,
        status: isPending ? ('pending' as Attendance['status']) : payrollStatus,
        late_minutes: countable ? record.late_minutes : 0,
        total_hours: countable ? record.total_hours || 0 : 0,
        overtime_hours: countable ? record.overtime_hours || 0 : 0,
        trang_thai_db: dbStatus,
        soCaChoDuyet: isPending,
        chuaCheckOut: isOpenShift,
      }
    })
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
