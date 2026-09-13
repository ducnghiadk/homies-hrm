// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Attendance
// ============================================

export type AttStatus = 'on_time' | 'late' | 'early_leave' | 'absent' | 'day_off' | 'leave'
export type AttSymbol = '✓' | '½' | 'X' | 'M' | 'P' | '-'

export interface AttGridCell {
  employee_id: string
  employee_name: string
  days: Record<number, { symbol: AttSymbol; status: AttStatus; hours?: number }>
  total_days: number
  total_hours: number
}

export interface AttByDateRecord {
  id: string
  employee_id: string
  employee_name: string
  avatar?: string
  shift_name: string
  scheduled_in: string
  scheduled_out: string
  actual_in?: string
  actual_out?: string
  status: AttStatus
  late_minutes: number
  total_hours: number
}

export interface AttRequestForm {
  id: string
  employee_id: string
  employee_name: string
  date: string
  type: 'check_in' | 'check_out' | 'both'
  time: string
  reason: string
  photo_url?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewer_comment?: string
  created_at: string
}

export interface DeviceAlert {
  id: string
  device_id: string
  device_name: string
  employees: { id: string; name: string; check_in_time: string }[]
  detected_at: string
  resolution: 'unresolved' | 'valid' | 'fraud'
}

export interface LateRecord {
  employee_id: string
  employee_name: string
  date: string
  shift_name: string
  scheduled_time: string
  actual_time: string
  diff_minutes: number
  type: 'late_in' | 'early_out'
}

export interface RegisteredDevice {
  id: string
  employee_id: string
  employee_name: string
  device_id: string
  device_name: string
  os: string
  registered_at: string
  is_blocked: boolean
}

export interface OTRequest {
  id: string
  employee_id: string
  employee_name: string
  date: string
  start_time: string
  end_time: string
  hours: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
}

export interface CalendarDay {
  date: string
  status: AttStatus
  check_in?: string
  check_out?: string
  hours?: number
  late_minutes?: number
}

export interface ManualEdit {
  id: string
  employee_id: string
  employee_name: string
  date: string
  field: string
  old_value: string
  new_value: string
  reason: string
  edited_by: string
  edited_at: string
}

const jan = Array.from({ length: 31 }, (_, i) => i + 1)
const statusPool: AttStatus[] = ['on_time', 'on_time', 'on_time', 'on_time', 'late', 'day_off', 'on_time']
const symbolMap: Record<AttStatus, AttSymbol> = {
  on_time: '✓', late: '½', early_leave: '½', absent: 'X', day_off: '-', leave: 'P',
}

const makeGrid = (id: string, name: string, seed: number): AttGridCell => {
  const days: AttGridCell['days'] = {}
  let totalDays = 0; let totalHours = 0
  jan.forEach(d => {
    const s = statusPool[(d + seed) % statusPool.length]
    const h = s === 'on_time' ? 8 : s === 'late' ? 7.5 : s === 'day_off' ? 0 : 0
    days[d] = { symbol: symbolMap[s], status: s, hours: h }
    if (h > 0) { totalDays++; totalHours += h }
  })
  return { employee_id: id, employee_name: name, days, total_days: totalDays, total_hours: totalHours }
}

export const mockAttGrid: AttGridCell[] = []

export const mockAttByDate: AttByDateRecord[] = []

export const mockAttRequests: AttRequestForm[] = []

export const mockDeviceAlerts: DeviceAlert[] = []

export const mockLateRecords: LateRecord[] = []

export const mockDevices: RegisteredDevice[] = []

export const mockOTRequests: OTRequest[] = []

export const mockAttCalendar: Record<string, CalendarDay[]> = {}

export const mockManualEdits: ManualEdit[] = []

export const getAttGridByStore = () => mockAttGrid
export const getAttByDate = () => mockAttByDate
export const getPendingAttRequests = () => mockAttRequests.filter(r => r.status === 'pending')
export const getOTRequestsByStatus = (status: string) => mockOTRequests.filter(r => r.status === status)
export const getCalendarByEmployee = (empId: string) => mockAttCalendar[empId] || []
