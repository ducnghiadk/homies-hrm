// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Scheduling
// ByShift, ByEmployee, Approval, Auto, Locations
// ============================================

export interface ShiftCell {
  date: string
  shift_id: string
  shift_name: string
  shift_color: string
  employees: { id: string; name: string; avatar?: string }[]
}

export interface EmployeeScheduleEntry {
  date: string
  shift_id: string
  shift_name: string
  shift_color: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'pending' | 'swap_requested'
}

export interface ShiftSwapRequest {
  id: string
  employee_id: string
  employee_name: string
  type: 'swap' | 'off' | 'change'
  original_date: string
  original_shift: string
  requested_date?: string
  requested_shift?: string
  swap_with_id?: string
  swap_with_name?: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface AutoScheduleInput {
  store_id: string
  date_from: string
  date_to: string
  min_staff_per_shift: number
  constraints: string[]
}

export interface AutoScheduleOutput {
  date: string
  shift_name: string
  assigned: { id: string; name: string }[]
  coverage: number // percent
  warnings: string[]
}

export interface WorkLocation {
  id: string
  store_id: string
  name: string
  address: string
  gps_lat: number
  gps_lng: number
  radius_meters: number
  is_active: boolean
}

// ============ Mock Data ============

const shifts = [
  { id: 'shift-am', name: 'Ca Sáng', color: '#3b82f6', start: '07:00', end: '14:00' },
  { id: 'shift-pm', name: 'Ca Chiều', color: '#f59e0b', start: '14:00', end: '21:00' },
  { id: 'shift-ev', name: 'Ca Tối', color: '#8b5cf6', start: '17:00', end: '23:00' },
]

const weekDates = ['2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21','2026-02-22']

export const mockShiftGrid: ShiftCell[] = [
  // Ca Sáng
  ...weekDates.map((d, i) => ({
    date: d, shift_id: 'shift-am', shift_name: 'Ca Sáng', shift_color: '#3b82f6',
    employees: [
      { id: 'emp-005', name: 'Trần Thị Mai' },
      { id: 'emp-007', name: 'Đặng Minh Khoa' },
      ...(i % 2 === 0 ? [{ id: 'emp-010', name: 'Lý Thị Thanh' }] : []),
    ],
  })),
  // Ca Chiều
  ...weekDates.map((d, i) => ({
    date: d, shift_id: 'shift-pm', shift_name: 'Ca Chiều', shift_color: '#f59e0b',
    employees: [
      { id: 'emp-006', name: 'Vũ Hoàng Đức' },
      { id: 'emp-008', name: 'Ngô Thị Hồng' },
      ...(i % 3 === 0 ? [{ id: 'emp-009', name: 'Bùi Văn Tùng' }] : []),
    ],
  })),
  // Ca Tối
  ...weekDates.map((d) => ({
    date: d, shift_id: 'shift-ev', shift_name: 'Ca Tối', shift_color: '#8b5cf6',
    employees: [
      { id: 'emp-011', name: 'Hoàng Thị Lan' },
      { id: 'emp-012', name: 'Đinh Văn Phúc' },
    ],
  })),
]

export const mockEmployeeSchedules: Record<string, EmployeeScheduleEntry[]> = {
  'emp-005': weekDates.map(d => ({
    date: d, shift_id: 'shift-am', shift_name: 'Ca Sáng', shift_color: '#3b82f6',
    start_time: '07:00', end_time: '14:00', status: 'confirmed' as const,
  })),
  'emp-006': weekDates.map(d => ({
    date: d, shift_id: 'shift-pm', shift_name: 'Ca Chiều', shift_color: '#f59e0b',
    start_time: '14:00', end_time: '21:00', status: 'confirmed' as const,
  })),
  'emp-011': weekDates.map(d => ({
    date: d, shift_id: 'shift-ev', shift_name: 'Ca Tối', shift_color: '#8b5cf6',
    start_time: '17:00', end_time: '23:00', status: 'confirmed' as const,
  })),
}

export const mockShiftSwapRequests: ShiftSwapRequest[] = [
  {
    id: 'swap-001', employee_id: 'emp-005', employee_name: 'Trần Thị Mai',
    type: 'swap', original_date: '2026-02-18', original_shift: 'Ca Sáng',
    requested_date: '2026-02-19', requested_shift: 'Ca Chiều',
    swap_with_id: 'emp-006', swap_with_name: 'Vũ Hoàng Đức',
    reason: 'Có lịch khám bệnh buổi sáng', status: 'pending', created_at: '2026-02-15T10:00:00',
  },
  {
    id: 'swap-002', employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa',
    type: 'off', original_date: '2026-02-20', original_shift: 'Ca Sáng',
    reason: 'Thi cuối kỳ tại trường', status: 'pending', created_at: '2026-02-14T18:00:00',
  },
  {
    id: 'swap-003', employee_id: 'emp-008', employee_name: 'Ngô Thị Hồng',
    type: 'change', original_date: '2026-02-21', original_shift: 'Ca Chiều',
    requested_shift: 'Ca Sáng', reason: 'Tối có sinh nhật gia đình',
    status: 'approved', created_at: '2026-02-13T09:00:00',
  },
]

export const mockAutoScheduleOutput: AutoScheduleOutput[] = [
  { date: '2026-02-23', shift_name: 'Ca Sáng', assigned: [{ id: 'emp-005', name: 'Trần Thị Mai' }, { id: 'emp-010', name: 'Lý Thị Thanh' }], coverage: 100, warnings: [] },
  { date: '2026-02-23', shift_name: 'Ca Chiều', assigned: [{ id: 'emp-006', name: 'Vũ Hoàng Đức' }], coverage: 50, warnings: ['Thiếu 1 NV cho ca này'] },
  { date: '2026-02-23', shift_name: 'Ca Tối', assigned: [{ id: 'emp-011', name: 'Hoàng Thị Lan' }, { id: 'emp-012', name: 'Đinh Văn Phúc' }], coverage: 100, warnings: [] },
  { date: '2026-02-24', shift_name: 'Ca Sáng', assigned: [{ id: 'emp-007', name: 'Đặng Minh Khoa' }, { id: 'emp-009', name: 'Bùi Văn Tùng' }], coverage: 100, warnings: [] },
  { date: '2026-02-24', shift_name: 'Ca Chiều', assigned: [{ id: 'emp-008', name: 'Ngô Thị Hồng' }, { id: 'emp-005', name: 'Trần Thị Mai' }], coverage: 100, warnings: [] },
  { date: '2026-02-24', shift_name: 'Ca Tối', assigned: [{ id: 'emp-006', name: 'Vũ Hoàng Đức' }], coverage: 50, warnings: ['Thiếu 1 NV, emp-011 nghỉ phép'] },
]

export const mockWorkLocations: WorkLocation[] = [
  { id: 'loc-001', store_id: 'store-001', name: 'Boba House Q.1', address: '123 Nguyễn Huệ, Q.1, TP.HCM', gps_lat: 10.7769, gps_lng: 106.7009, radius_meters: 100, is_active: true },
  { id: 'loc-002', store_id: 'store-002', name: 'Boba House Q.3', address: '456 Võ Văn Tần, Q.3, TP.HCM', gps_lat: 10.7725, gps_lng: 106.6879, radius_meters: 80, is_active: true },
  { id: 'loc-003', store_id: 'store-003', name: 'Boba House Thủ Đức', address: '789 Phạm Văn Đồng, Thủ Đức', gps_lat: 10.8492, gps_lng: 106.7679, radius_meters: 120, is_active: true },
  { id: 'loc-004', store_id: 'store-001', name: 'Kho Q.1 (Backup)', address: '100 Lê Lai, Q.1, TP.HCM', gps_lat: 10.7710, gps_lng: 106.6930, radius_meters: 50, is_active: false },
]

// Helpers
export const getShiftGridByStore = (storeId: string) => mockShiftGrid
export const getEmployeeSchedule = (empId: string) => mockEmployeeSchedules[empId] || []
export const getPendingSwapRequests = () => mockShiftSwapRequests.filter(r => r.status === 'pending')
export const getWorkLocationsByStore = (storeId: string) => mockWorkLocations.filter(l => l.store_id === storeId)
export { shifts as mockShiftTypes }
