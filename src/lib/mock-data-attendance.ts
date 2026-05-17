// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Attendance
// ByStore, ByDate, Request, Alert, Late, Device, OT, Calendar, Manual
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

// ============ By Store Grid (31 days) ============
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

export const mockAttGrid: AttGridCell[] = [
  makeGrid('emp-005', 'Trần Thị Mai', 0),
  makeGrid('emp-006', 'Vũ Hoàng Đức', 1),
  makeGrid('emp-007', 'Đặng Minh Khoa', 2),
  makeGrid('emp-008', 'Ngô Thị Hồng', 3),
  makeGrid('emp-009', 'Bùi Văn Tùng', 4),
  makeGrid('emp-010', 'Lý Thị Thanh', 5),
  makeGrid('emp-011', 'Hoàng Thị Lan', 0),
  makeGrid('emp-012', 'Đinh Văn Phúc', 1),
]

// ============ By Date ============
export const mockAttByDate: AttByDateRecord[] = [
  { id: 'att-d-001', employee_id: 'emp-005', employee_name: 'Trần Thị Mai', shift_name: 'Ca Sáng', scheduled_in: '07:00', scheduled_out: '14:00', actual_in: '06:55', actual_out: '14:05', status: 'on_time', late_minutes: 0, total_hours: 7.17 },
  { id: 'att-d-002', employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa', shift_name: 'Ca Sáng', scheduled_in: '07:00', scheduled_out: '14:00', actual_in: '07:22', actual_out: '14:00', status: 'late', late_minutes: 22, total_hours: 6.63 },
  { id: 'att-d-003', employee_id: 'emp-006', employee_name: 'Vũ Hoàng Đức', shift_name: 'Ca Chiều', scheduled_in: '14:00', scheduled_out: '21:00', actual_in: '13:50', actual_out: '21:10', status: 'on_time', late_minutes: 0, total_hours: 7.33 },
  { id: 'att-d-004', employee_id: 'emp-008', employee_name: 'Ngô Thị Hồng', shift_name: 'Ca Chiều', scheduled_in: '14:00', scheduled_out: '21:00', status: 'absent', late_minutes: 0, total_hours: 0 },
  { id: 'att-d-005', employee_id: 'emp-011', employee_name: 'Hoàng Thị Lan', shift_name: 'Ca Tối', scheduled_in: '17:00', scheduled_out: '23:00', actual_in: '17:05', actual_out: '22:45', status: 'late', late_minutes: 5, total_hours: 5.67 },
]

// ============ Attendance Requests ============
export const mockAttRequests: AttRequestForm[] = [
  { id: 'req-001', employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa', date: '2026-02-10', type: 'check_in', time: '07:05', reason: 'Ứng dụng bị lỗi không check-in được', photo_url: '/evidence/req-001.jpg', status: 'pending', created_at: '2026-02-10T14:00:00' },
  { id: 'req-002', employee_id: 'emp-010', employee_name: 'Lý Thị Thanh', date: '2026-02-12', type: 'check_out', time: '21:00', reason: 'Quên check-out khi ra về', status: 'approved', reviewer_comment: 'Camera xác nhận ra lúc 21:02', created_at: '2026-02-13T08:00:00' },
  { id: 'req-003', employee_id: 'emp-009', employee_name: 'Bùi Văn Tùng', date: '2026-02-14', type: 'both', time: '07:00', reason: 'Điện thoại hết pin cả ngày', status: 'pending', created_at: '2026-02-14T22:00:00' },
]

// ============ Device Alerts ============
export const mockDeviceAlerts: DeviceAlert[] = [
  {
    id: 'alert-001', device_id: 'dev-shared-001', device_name: 'Samsung Galaxy A14',
    employees: [
      { id: 'emp-005', name: 'Trần Thị Mai', check_in_time: '07:02' },
      { id: 'emp-007', name: 'Đặng Minh Khoa', check_in_time: '07:05' },
    ],
    detected_at: '2026-02-15T07:05:00', resolution: 'unresolved',
  },
  {
    id: 'alert-002', device_id: 'dev-shared-002', device_name: 'iPhone 12',
    employees: [
      { id: 'emp-009', name: 'Bùi Văn Tùng', check_in_time: '14:00' },
      { id: 'emp-010', name: 'Lý Thị Thanh', check_in_time: '14:02' },
    ],
    detected_at: '2026-02-14T14:02:00', resolution: 'valid',
  },
]

// ============ Late Report ============
export const mockLateRecords: LateRecord[] = [
  { employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa', date: '2026-02-10', shift_name: 'Ca Sáng', scheduled_time: '07:00', actual_time: '07:22', diff_minutes: 22, type: 'late_in' },
  { employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa', date: '2026-02-12', shift_name: 'Ca Sáng', scheduled_time: '07:00', actual_time: '07:18', diff_minutes: 18, type: 'late_in' },
  { employee_id: 'emp-011', employee_name: 'Hoàng Thị Lan', date: '2026-02-11', shift_name: 'Ca Tối', scheduled_time: '17:00', actual_time: '17:12', diff_minutes: 12, type: 'late_in' },
  { employee_id: 'emp-006', employee_name: 'Vũ Hoàng Đức', date: '2026-02-13', shift_name: 'Ca Chiều', scheduled_time: '21:00', actual_time: '20:40', diff_minutes: 20, type: 'early_out' },
]

// ============ Devices ============
export const mockDevices: RegisteredDevice[] = [
  { id: 'rd-001', employee_id: 'emp-005', employee_name: 'Trần Thị Mai', device_id: 'dev-ip15-001', device_name: 'iPhone 15', os: 'iOS 17.3', registered_at: '2026-01-01', is_blocked: false },
  { id: 'rd-002', employee_id: 'emp-005', employee_name: 'Trần Thị Mai', device_id: 'dev-ipad-001', device_name: 'iPad Air', os: 'iPadOS 17', registered_at: '2026-01-15', is_blocked: false },
  { id: 'rd-003', employee_id: 'emp-006', employee_name: 'Vũ Hoàng Đức', device_id: 'dev-ss-001', device_name: 'Samsung S24', os: 'Android 14', registered_at: '2026-01-05', is_blocked: false },
  { id: 'rd-004', employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa', device_id: 'dev-oppo-001', device_name: 'OPPO A78', os: 'Android 13', registered_at: '2026-02-01', is_blocked: false },
  { id: 'rd-005', employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa', device_id: 'dev-old-001', device_name: 'Xiaomi Redmi 9', os: 'Android 11', registered_at: '2025-06-01', is_blocked: true },
]

// ============ OT Requests ============
export const mockOTRequests: OTRequest[] = [
  { id: 'ot-001', employee_id: 'emp-005', employee_name: 'Trần Thị Mai', date: '2026-02-15', start_time: '14:00', end_time: '17:00', hours: 3, reason: 'Cửa hàng đông cuối tuần', status: 'approved', approved_by: 'emp-002' },
  { id: 'ot-002', employee_id: 'emp-006', employee_name: 'Vũ Hoàng Đức', date: '2026-02-16', start_time: '21:00', end_time: '23:00', hours: 2, reason: 'Kiểm kê hàng tháng', status: 'pending' },
  { id: 'ot-003', employee_id: 'emp-011', employee_name: 'Hoàng Thị Lan', date: '2026-02-14', start_time: '23:00', end_time: '01:00', hours: 2, reason: 'Dọn dẹp sau sự kiện', status: 'rejected' },
]

// ============ Calendar (Employee view) ============
export const mockAttCalendar: Record<string, CalendarDay[]> = {
  'emp-005': Array.from({ length: 28 }, (_, i) => {
    const d = i + 1
    const status: AttStatus = d % 7 === 0 ? 'day_off' : d === 5 ? 'late' : d === 12 ? 'leave' : 'on_time'
    return {
      date: `2026-02-${String(d).padStart(2, '0')}`,
      status,
      check_in: status === 'on_time' ? '06:55' : status === 'late' ? '07:18' : undefined,
      check_out: status === 'on_time' ? '14:05' : status === 'late' ? '14:00' : undefined,
      hours: status === 'on_time' ? 7.17 : status === 'late' ? 6.7 : 0,
      late_minutes: status === 'late' ? 18 : 0,
    }
  }),
}

// ============ Manual Edits ============
export const mockManualEdits: ManualEdit[] = [
  { id: 'me-001', employee_id: 'emp-008', employee_name: 'Ngô Thị Hồng', date: '2026-02-14', field: 'status', old_value: 'absent', new_value: 'on_time', reason: 'NV quên check-in, camera xác nhận có mặt từ 14:00', edited_by: 'emp-002', edited_at: '2026-02-15T09:00:00' },
  { id: 'me-002', employee_id: 'emp-012', employee_name: 'Đinh Văn Phúc', date: '2026-02-13', field: 'check_out_time', old_value: '22:00', new_value: '23:15', reason: 'Hệ thống ghi sai giờ ra', edited_by: 'emp-002', edited_at: '2026-02-14T08:30:00' },
]

// ============ Helpers ============
export const getAttGridByStore = () => mockAttGrid
export const getAttByDate = (date: string) => mockAttByDate
export const getPendingAttRequests = () => mockAttRequests.filter(r => r.status === 'pending')
export const getOTRequestsByStatus = (status: string) => mockOTRequests.filter(r => r.status === status)
export const getCalendarByEmployee = (empId: string) => mockAttCalendar[empId] || []
