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
  { id: 'shift-001', name: 'Ca Sáng', color: '#2F6FA8', start: '08:00', end: '14:00' },
  { id: 'shift-002', name: 'Ca Chiều', color: '#F6C85F', start: '14:00', end: '21:00' },
  { id: 'shift-003', name: 'Ca Tối', color: '#001D3D', start: '18:00', end: '23:00' },
]

const weekDates = ['2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21','2026-02-22']

export const mockShiftGrid: ShiftCell[] = []

export const mockEmployeeSchedules: Record<string, EmployeeScheduleEntry[]> = {}

export const mockShiftSwapRequests: ShiftSwapRequest[] = []

export const mockAutoScheduleOutput: AutoScheduleOutput[] = []

export const mockWorkLocations: WorkLocation[] = [
  { id: 'loc-001', store_id: 'store-001', name: 'Homies Milk Tea - Hồ Bá Phấn', address: '49 Hồ Bá Phấn, Phước Long A, TP. Thủ Đức, TP.HCM', gps_lat: 10.822435, gps_lng: 106.762649, radius_meters: 100, is_active: true },
  { id: 'loc-002', store_id: 'store-002', name: 'Homies Milk Tea - Đường 429', address: '429 Đường 429, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM', gps_lat: 10.7845, gps_lng: 106.6679, radius_meters: 100, is_active: true },
  { id: 'loc-003', store_id: 'store-003', name: 'Homies Milk Tea - Lê Văn Sỹ', address: 'Lê Văn Sỹ, Phường Phước Long A, TP. Thủ Đức, TP. Hồ Chí Minh', gps_lat: 10.7340, gps_lng: 106.7220, radius_meters: 120, is_active: true },
]

// Helpers
export const getShiftGridByStore = () => mockShiftGrid
export const getEmployeeSchedule = (empId: string) => mockEmployeeSchedules[empId] || []
export const getPendingSwapRequests = () => mockShiftSwapRequests.filter(r => r.status === 'pending')
export const getWorkLocationsByStore = (storeId: string) => mockWorkLocations.filter(l => l.store_id === storeId)
export { shifts as mockShiftTypes }
